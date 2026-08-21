/**
 * Creates a per-session Vapi assistant with a server-assembled system prompt.
 * Private key must never be exposed to the browser (no VITE_ prefix).
 */

import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import {
  getVapiInterviewerConfig,
  resolveMaxDurationSeconds,
  resolvePersonaVoiceId,
  resolveSpeakingSpeed,
  VAPI_VOICE_V2_IDS,
} from '../config/vapiInterviewerConfig.js';
import { AppError } from './sendResponse.js';
import { buildDynamicGreeting } from './interviewerGreeting.js';
import { buildInterviewerSystemPrompt } from './interviewerPromptBuilder.js';

const VAPI_ASSISTANT_URL = 'https://api.vapi.ai/assistant';

/** Private key only — never the public web token (VITE_VAPI_WEB_TOKEN). */
const getPrivateKey = () =>
  String(process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY || '').trim();

export const isVapiPrivateKeyConfigured = () => Boolean(getPrivateKey());

/** Re-export for existing imports/tests. */
export { buildInterviewerSystemPrompt };

/**
 * Build the Vapi assistant create payload for a mock interview session.
 * Kept pure for unit testing (no network).
 */
export const buildVapiAssistantPayload = (session, config = getVapiInterviewerConfig()) => {
  const sessionId = String(session._id || session.id || 'unknown');
  const systemPrompt = buildInterviewerSystemPrompt(session);
  const firstMessage = buildDynamicGreeting(session);
  const voiceId = resolvePersonaVoiceId(session.interviewerPersona, config);
  const speed = resolveSpeakingSpeed(session.difficulty, config);

  const voice = {
    provider: config.voice.provider,
    voiceId,
  };

  // Only attach version:2 for Vapi voices that support it (e.g. Rohan does not).
  if (config.voice.provider === 'vapi' && VAPI_VOICE_V2_IDS.has(voiceId)) {
    voice.version = config.voice.version;
  }

  if (speed != null) {
    voice.speed = speed;
  }

  const modelMessages = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  const model = {
    provider: config.model.provider,
    model: config.model.model,
    messages: modelMessages,
  };

  if (Number.isFinite(config.model.temperature)) {
    model.temperature = config.model.temperature;
  }

  if (Number.isFinite(config.model.maxTokens)) {
    model.maxTokens = config.model.maxTokens;
  }

  return {
    name: `CareerBridge Interview ${sessionId.slice(-8)}`,
    firstMessage,
    firstMessageMode: config.firstMessageMode,
    firstMessageInterruptionsEnabled: false,
    customerJoinTimeoutSeconds: config.customerJoinTimeoutSeconds,
    backgroundSound: config.backgroundSound,
    maxDurationSeconds: resolveMaxDurationSeconds(session.durationMinutes, config),
    transcriber: { ...config.transcriber },
    voice,
    model,
    startSpeakingPlan: {
      waitSeconds: config.startSpeakingPlan.waitSeconds,
      smartEndpointingPlan: { ...config.startSpeakingPlan.smartEndpointingPlan },
      customEndpointingRules: [...config.startSpeakingPlan.customEndpointingRules],
    },
    stopSpeakingPlan: {
      numWords: config.stopSpeakingPlan.numWords,
      voiceSeconds: config.stopSpeakingPlan.voiceSeconds,
      backoffSeconds: config.stopSpeakingPlan.backoffSeconds,
      acknowledgementPhrases: [...config.stopSpeakingPlan.acknowledgementPhrases],
    },
  };
};

/**
 * Create a Vapi assistant for this session. Returns assistantId only.
 * @param {object} session - Mongoose MockInterviewSession (or plain object)
 */
export const createVapiAssistantForSession = async (session) => {
  const apiKey = getPrivateKey();
  if (!apiKey) {
    console.error(
      '[vapi] VAPI_PRIVATE_KEY is missing. Add your Private key from https://dashboard.vapi.ai (API Keys) to backend/.env — do not reuse VITE_VAPI_WEB_TOKEN.'
    );
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.VAPI_NOT_CONFIGURED, 503);
  }

  const sessionId = String(session._id || session.id || 'unknown');
  const body = buildVapiAssistantPayload(session);

  let response;
  try {
    response = await fetch(VAPI_ASSISTANT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[vapi] Assistant create network error:', sessionId, error.message);
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.ASSISTANT_CREATE_FAILED, 502);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      '[vapi] Assistant create failed:',
      sessionId,
      response.status,
      payload?.message || payload?.error || JSON.stringify(payload) || 'unknown'
    );
    // Public web tokens return 401/403 against the Private REST API.
    if (response.status === 401 || response.status === 403) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.VAPI_NOT_CONFIGURED, 503);
    }
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.ASSISTANT_CREATE_FAILED, 502);
  }

  const assistantId = payload?.id;
  if (!assistantId) {
    console.error('[vapi] Assistant create returned no id:', sessionId);
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.ASSISTANT_CREATE_FAILED, 502);
  }

  return String(assistantId);
};

/**
 * True when the assistant exists under the current private key (same Vapi org).
 * Stale IDs from a previous key/account return false.
 */
export const vapiAssistantExists = async (assistantId) => {
  const apiKey = getPrivateKey();
  const id = String(assistantId || '').trim();
  if (!apiKey || !id) return false;

  try {
    const response = await fetch(`${VAPI_ASSISTANT_URL}/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('[vapi] Assistant lookup network error:', id, error.message);
    return false;
  }
};

/**
 * Return a usable assistant id for this session, recreating when the stored id
 * is missing or belongs to another Vapi account (e.g. after key rotation).
 * Persists the new id on the session document when possible.
 */
export const ensureVapiAssistantForSession = async (session) => {
  const existingId = session?.vapiAssistantId ? String(session.vapiAssistantId) : '';

  if (existingId && (await vapiAssistantExists(existingId))) {
    return existingId;
  }

  if (existingId) {
    console.warn(
      '[vapi] Stale assistant id — recreating under current private key:',
      String(session._id || session.id || 'unknown'),
      existingId
    );
  }

  const assistantId = await createVapiAssistantForSession(session);
  session.vapiAssistantId = assistantId;

  if (typeof session.save === 'function') {
    await session.save();
  }

  return assistantId;
};
