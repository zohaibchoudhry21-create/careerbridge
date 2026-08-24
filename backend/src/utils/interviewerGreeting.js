/**
 * Dynamic interview greeting and closing copy for the live AI interviewer.
 * Templates vary by persona and role — never a single hardcoded chatbot line.
 */

import {
  formatPanelSeatIntroList,
  getInterviewerPersonaProfile,
  resolvePanelSeats,
} from './interviewerPersona.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const GREETING_TEMPLATES = Object.freeze({
  friendly: [
    "Hey — thanks for jumping on. I'm looking forward to chatting about the {role} role. Whenever you're ready, just introduce yourself.",
    "Hi there! Appreciate you making time. We'll keep this pretty conversational while we talk through {role}. Go ahead and introduce yourself when you're ready.",
    "Welcome — glad you could join. I'd love to hear a bit about your background for {role}. Take a breath, and introduce yourself whenever you're ready.",
  ],
  neutral: [
    "Hi — thanks for joining me today. We'll be talking about the {role} role. To kick off, please introduce yourself and a bit of your relevant experience.",
    "Good to meet you. Thanks for making time for this {role} interview. Let's start with a short intro — walk me through your background.",
    "Hello. Thanks for speaking with me about the {role} role. Whenever you're ready, go ahead and introduce yourself.",
  ],
  strict: [
    "Good day. Thank you for your time. This interview is for the {role} role and we'll keep a focused pace. Please begin with a concise introduction of your background.",
    "Hello. Appreciate you joining. We'll assess fit for {role}. Start with a brief, focused intro of your most relevant experience.",
    "Thank you for joining. We're here to evaluate your qualifications for {role}. Please introduce yourself concisely.",
  ],
  /** `{panel}` replaced with named seat intro list. Structured intro: greet → names → role → group intro ask. */
  panel: [
    "Hi — thanks for joining us today. You're meeting {panel} for the {role} role. We'll take turns asking questions — when you're ready, please introduce yourself to the group.",
    "Welcome to your panel interview for {role}. Today you're with {panel}. Go ahead and introduce yourself to everyone when you're ready.",
    "Hello, and thanks for coming in. This is a panel session for {role} with {panel}. Please start with a brief introduction to the group.",
  ],
});

const CLOSING_GUIDANCE = Object.freeze({
  friendly: `Close warmly and naturally: thank them sincerely, say you enjoyed the conversation, mention next steps lightly ("our team will follow up"), and wish them well. 2–3 short spoken sentences — no scripted corporate goodbye.`,
  neutral: `Close professionally but human: thank them for their time, note the company will follow up with next steps, end on a polite positive note. About 2 short sentences.`,
  strict: `Close formally and briefly: thank them for their time, say the team will be in touch on next steps, end cleanly without excess warmth.`,
  panel: `Close as one voice for the panel: thank them on behalf of the group (mention "the panel" or first names lightly), note the team will follow up, end courteously. Keep it short and natural — 2 short sentences.`,
});

/**
 * Build a spoken first message personalized by persona + role.
 * @param {{ interviewerPersona?: string, roleLabel?: string, role?: string, difficulty?: string, panelSeats?: Array }} session
 */
export const buildDynamicGreeting = (session = {}) => {
  const persona = getInterviewerPersonaProfile(session.interviewerPersona, {
    roleLabel: session.roleLabel || session.role,
  });
  const roleLabel = String(session.roleLabel || session.role || 'this role').trim() || 'this role';
  const templates = GREETING_TEMPLATES[persona.id] || GREETING_TEMPLATES.neutral;
  const template = pick(templates);

  let message = template.replace(/\{role\}/g, roleLabel);

  if (persona.id === 'panel') {
    const seats =
      Array.isArray(session.panelSeats) && session.panelSeats.length > 0
        ? session.panelSeats
        : resolvePanelSeats(roleLabel);
    message = message.replace(/\{panel\}/g, formatPanelSeatIntroList(seats));
  }

  return message;
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
