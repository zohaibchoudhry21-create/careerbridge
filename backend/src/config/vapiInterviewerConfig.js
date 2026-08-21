/**
 * Vapi live-interviewer configuration.
 * Env overrides keep defaults production-safe and avoid hardcoded magic values in services.
 */

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Extra seconds beyond planned interview length before Vapi hard-ends the call. */
const DURATION_BUFFER_SECONDS = toNumber(process.env.VAPI_DURATION_BUFFER_SECONDS, 120);

/** Minimum / maximum call caps (Vapi: min 10, max 43200). */
const MIN_CALL_SECONDS = 60;
const MAX_CALL_SECONDS = 3600;

/**
 * Voice IDs for Vapi's built-in voices (no extra provider keys).
 * Only use currently supported voices (Lily/etc. were retired).
 * Neutral keeps Elliot for backward-compatible default tone.
 */
export const PERSONA_VOICE_IDS = Object.freeze({
  friendly: process.env.VAPI_VOICE_FRIENDLY || 'Savannah',
  neutral: process.env.VAPI_VOICE_NEUTRAL || 'Elliot',
  strict: process.env.VAPI_VOICE_STRICT || 'Rohan',
  panel: process.env.VAPI_VOICE_PANEL || 'Elliot',
});

/** Vapi voices that support the upgraded version 2 model. */
export const VAPI_VOICE_V2_IDS = new Set(['Elliot', 'Savannah']);

/**
 * Adaptive TTS speed multipliers by difficulty (used only when the voice provider supports `speed`).
 * 1 = normal; slightly slower on hard interviews so candidates can follow probes.
 */
export const SPEAKING_SPEED_BY_DIFFICULTY = Object.freeze({
  easy: toNumber(process.env.VAPI_SPEED_EASY, 1.05),
  medium: toNumber(process.env.VAPI_SPEED_MEDIUM, 1),
  hard: toNumber(process.env.VAPI_SPEED_HARD, 0.92),
});

/** Providers that accept a numeric `speed` field on the voice object. */
const SPEED_CAPABLE_PROVIDERS = new Set(['11labs', 'elevenlabs', 'playht', 'cartesia', 'rime-ai', 'openai']);

export const getVapiInterviewerConfig = () => {
  const voiceProvider = String(process.env.VAPI_INTERVIEWER_VOICE_PROVIDER || 'vapi').trim();
  const defaultVoiceId = String(process.env.VAPI_INTERVIEWER_VOICE_ID || 'Elliot').trim();

  return {
    customerJoinTimeoutSeconds: toNumber(process.env.VAPI_CUSTOMER_JOIN_TIMEOUT_SECONDS, 60),
    backgroundSound: process.env.VAPI_BACKGROUND_SOUND || 'off',
    firstMessageMode: 'assistant-speaks-first',
    durationBufferSeconds: DURATION_BUFFER_SECONDS,
    minCallSeconds: MIN_CALL_SECONDS,
    maxCallSeconds: MAX_CALL_SECONDS,
    transcriber: {
      provider: process.env.VAPI_TRANSCRIBER_PROVIDER || 'deepgram',
      model: process.env.VAPI_TRANSCRIBER_MODEL || 'nova-2',
      language: process.env.VAPI_TRANSCRIBER_LANGUAGE || 'en',
    },
    voice: {
      provider: voiceProvider,
      /** Fallback when persona has no mapping (or provider is non-vapi). */
      voiceId: defaultVoiceId,
      version: toNumber(process.env.VAPI_INTERVIEWER_VOICE_VERSION, 2),
      supportsSpeed: SPEED_CAPABLE_PROVIDERS.has(voiceProvider.toLowerCase()),
    },
    model: {
      provider: process.env.VAPI_INTERVIEWER_MODEL_PROVIDER || 'openai',
      model: process.env.VAPI_INTERVIEWER_MODEL || 'gpt-4o-mini',
      temperature: toNumber(process.env.VAPI_INTERVIEWER_TEMPERATURE, 0.72),
      /** Keep spoken turns short like a real interviewer. */
      maxTokens: toNumber(process.env.VAPI_INTERVIEWER_MAX_TOKENS, 180),
    },
    /**
     * Wait until the candidate finishes; add a brief "thinking" beat before the AI speaks.
     * LiveKit endpointing is recommended for English interview answers with mid-thought pauses.
     */
    startSpeakingPlan: {
      waitSeconds: toNumber(process.env.VAPI_WAIT_SECONDS, 1.0),
      smartEndpointingPlan: {
        provider: process.env.VAPI_SMART_ENDPOINTING_PROVIDER || 'livekit',
        // Patient curve: higher x (still talking) → longer wait before taking the turn.
        waitFunction:
          process.env.VAPI_SMART_ENDPOINTING_WAIT_FUNCTION ||
          '(20 + 500 * sqrt(x) + 2500 * x^3 + 700 + 4000 * max(0, x-0.5)) / 2',
      },
      customEndpointingRules: [
        {
          type: 'assistant',
          regex:
            '(tell me|walk me through|describe|explain|can you share|give me an example|talk about)',
          timeoutSeconds: toNumber(process.env.VAPI_ENDPOINTING_OPEN_QUESTION_SECONDS, 3.5),
        },
        {
          type: 'assistant',
          regex: '(yes or no|briefly|in one sentence|quickly)',
          timeoutSeconds: toNumber(process.env.VAPI_ENDPOINTING_SHORT_QUESTION_SECONDS, 1.2),
        },
      ],
    },
    /**
     * Reduce false barge-ins while the interviewer is speaking (coughs, "uh-huh").
     * Candidate turn-taking is owned by startSpeakingPlan above.
     */
    stopSpeakingPlan: {
      numWords: toNumber(process.env.VAPI_STOP_SPEAKING_NUM_WORDS, 3),
      voiceSeconds: toNumber(process.env.VAPI_STOP_SPEAKING_VOICE_SECONDS, 0.35),
      backoffSeconds: toNumber(process.env.VAPI_STOP_SPEAKING_BACKOFF_SECONDS, 1.5),
      acknowledgementPhrases: [
        'i understand',
        'i see',
        'i got it',
        'right',
        'okay',
        'ok',
        'sure',
        'alright',
        'got it',
        'understood',
        'yeah',
        'yes',
        'uh-huh',
        'mm-hmm',
        'gotcha',
        'mhmm',
        'ah',
        'hmm',
        'mhm',
      ],
    },
  };
};

export const resolveMaxDurationSeconds = (durationMinutes, config = getVapiInterviewerConfig()) => {
  const planned = Math.round(Number(durationMinutes) || 15) * 60 + config.durationBufferSeconds;
  return Math.min(config.maxCallSeconds, Math.max(config.minCallSeconds, planned));
};

export const resolveSpeakingSpeed = (difficulty, config = getVapiInterviewerConfig()) => {
  if (!config.voice.supportsSpeed) return undefined;
  const key = String(difficulty || 'medium').toLowerCase();
  return SPEAKING_SPEED_BY_DIFFICULTY[key] ?? SPEAKING_SPEED_BY_DIFFICULTY.medium;
};

export const resolvePersonaVoiceId = (personaId, config = getVapiInterviewerConfig()) => {
  if (config.voice.provider !== 'vapi') {
    return config.voice.voiceId;
  }
  const key = String(personaId || 'neutral').toLowerCase();
  return PERSONA_VOICE_IDS[key] || PERSONA_VOICE_IDS.neutral;
};
