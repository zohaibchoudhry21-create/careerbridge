/**
 * Creates a per-session Vapi assistant with a server-assembled system prompt.
 * Private key must never be exposed to the browser (no VITE_ prefix).
 */

import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import { getInterviewerPersonaPrompt } from './interviewerPersona.js';

const VAPI_ASSISTANT_URL = 'https://api.vapi.ai/assistant';

const getPrivateKey = () => String(process.env.VAPI_PRIVATE_KEY || '').trim();

export const isVapiPrivateKeyConfigured = () => Boolean(getPrivateKey());

/**
 * Build the full interviewer system prompt from trusted session fields (MongoDB).
 */
export const buildInterviewerSystemPrompt = (session) => {
  const roleLabel = session.roleLabel || session.role || 'this role';
  const difficulty = session.difficulty || 'medium';
  const durationMinutes = session.durationMinutes || 15;
  const focusAreas =
    (Array.isArray(session.focusAreas) ? session.focusAreas : []).join(', ') || 'General';
  const interviewerPersona = getInterviewerPersonaPrompt(session.interviewerPersona);
  const questions = (session.questions || [])
    .map((q) => `- ${q.text}`)
    .join('\n') || '- Ask an appropriate opening question for the role.';

  return `You are a professional job interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, motivation, and fit for the role.

Interview Guidelines:
Role: ${roleLabel}
Difficulty: ${difficulty}
Target duration: about ${durationMinutes} minutes
Emphasize these focus areas throughout your questions: ${focusAreas}

Interviewer persona:
${interviewerPersona}

Follow this structured question flow (use as a guide; ask natural follow-ups for the full duration):
${questions}

Engage naturally & react appropriately:
Listen actively to responses and acknowledge them before moving forward.
Ask brief follow-up questions if a response is vague or requires more detail.
Keep the conversation flowing smoothly while maintaining control.

Be professional, yet warm and welcoming:
Use official yet friendly language.
Keep responses concise and to the point (like in a real voice interview).
Avoid robotic phrasing—sound natural and conversational.

Answer the candidate's questions professionally:
If asked about the role, company, or expectations, provide a clear and relevant answer.
If unsure, redirect the candidate to HR for more details.

Conclude the interview properly:
Thank the candidate for their time.
Inform them that the company will reach out soon with feedback.
End the conversation on a polite and positive note.

- Be sure to be professional and polite.
- Keep all your responses short and simple. Use official language, but be kind and welcoming.
- This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.`;
};

/**
 * Create a Vapi assistant for this session. Returns assistantId only.
 * @param {object} session - Mongoose MockInterviewSession (or plain object)
 */
export const createVapiAssistantForSession = async (session) => {
  const apiKey = getPrivateKey();
  if (!apiKey) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.ASSISTANT_CREATE_FAILED, 503);
  }

  const systemPrompt = buildInterviewerSystemPrompt(session);
  const sessionId = String(session._id || session.id || 'unknown');

  const body = {
    name: `CareerBridge Interview ${sessionId.slice(-8)}`,
    firstMessage:
      "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience.",
    customerJoinTimeoutSeconds: 60,
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
    voice: {
      provider: 'vapi',
      voiceId: 'Elliot',
      version: 2,
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
    },
  };

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
      payload?.message || payload?.error || 'unknown'
    );
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.ASSISTANT_CREATE_FAILED, 502);
  }

  const assistantId = payload?.id;
  if (!assistantId) {
    console.error('[vapi] Assistant create returned no id:', sessionId);
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.ASSISTANT_CREATE_FAILED, 502);
  }

  return String(assistantId);
};
