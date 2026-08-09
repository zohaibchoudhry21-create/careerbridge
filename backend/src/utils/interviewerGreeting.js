/**
 * Dynamic interview greeting and closing copy for the live AI interviewer.
 * Templates vary by persona and role — never a single hardcoded chatbot line.
 */

import { getInterviewerPersonaProfile } from './interviewerPersona.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const GREETING_TEMPLATES = Object.freeze({
  friendly: [
    "Hi there — thanks so much for joining me today. I'm looking forward to learning more about you and your experience with the {role} role. Whenever you're ready, please introduce yourself.",
    "Hello! I really appreciate you taking the time to speak with me. We'll keep this conversational while we explore the {role} opportunity. To start, could you briefly introduce yourself?",
    "Welcome — thanks for being here. I'm excited to hear about your background for the {role} role. When you're ready, go ahead and introduce yourself.",
  ],
  neutral: [
    "Hello, and thank you for joining me today. We'll be discussing the {role} role. To begin, please introduce yourself and share a bit about your relevant experience.",
    "Good to meet you. Thanks for making time for this interview for the {role} position. Let's start with a brief introduction — please walk me through your background.",
    "Hello. Thank you for speaking with me today about the {role} role. When you're ready, please introduce yourself.",
  ],
  strict: [
    "Good day. Thank you for your time. This interview focuses on the {role} role and will move at a measured pace. Please begin with a concise introduction of your background.",
    "Hello. Appreciate you joining. We will assess fit for the {role} position. Start with a brief, focused introduction of your most relevant experience.",
    "Thank you for joining. We are here to evaluate your qualifications for the {role} role. Please introduce yourself concisely.",
  ],
  panel: [
    "Hello — thanks for joining our panel today. We'll rotate perspectives as we discuss the {role} role. To start, please introduce yourself to the group.",
    "Welcome. You're speaking with a small interview panel for the {role} position. Please begin with a brief introduction of your background.",
    "Hello, and thank you for meeting with us. This will be a panel-style interview for the {role} role. When you're ready, please introduce yourself.",
  ],
});

const CLOSING_GUIDANCE = Object.freeze({
  friendly: `Close warmly: thank them sincerely, note that you enjoyed the conversation, briefly mention next steps ("our team will follow up with feedback"), and wish them well. Keep it to 2–3 short sentences.`,
  neutral: `Close professionally: thank them for their time, confirm the company will follow up with next steps, and end on a polite positive note. Keep it to 2 short sentences.`,
  strict: `Close formally and briefly: thank them for their time, state that the team will be in touch regarding next steps, and end cleanly without excessive warmth.`,
  panel: `Close as the panel: one panelist thanks them on behalf of the group, notes that the team will follow up, and ends courteously. Keep it short.`,
});

/**
 * Build a spoken first message personalized by persona + role.
 * @param {{ interviewerPersona?: string, roleLabel?: string, role?: string, difficulty?: string }} session
 */
export const buildDynamicGreeting = (session = {}) => {
  const persona = getInterviewerPersonaProfile(session.interviewerPersona);
  const roleLabel = String(session.roleLabel || session.role || 'this role').trim() || 'this role';
  const templates = GREETING_TEMPLATES[persona.id] || GREETING_TEMPLATES.neutral;
  const template = pick(templates);
  return template.replace(/\{role\}/g, roleLabel);
};

/**
 * Closing-behavior instructions embedded in the system prompt (spoken at end of call).
 */
export const buildClosingGuidance = (personaId) => {
  const persona = getInterviewerPersonaProfile(personaId);
  return CLOSING_GUIDANCE[persona.id] || CLOSING_GUIDANCE.neutral;
};

/** Exported for unit tests — deterministic template list without randomness. */
export const listGreetingTemplatesForPersona = (personaId) => {
  const persona = getInterviewerPersonaProfile(personaId);
  return GREETING_TEMPLATES[persona.id] || GREETING_TEMPLATES.neutral;
};
