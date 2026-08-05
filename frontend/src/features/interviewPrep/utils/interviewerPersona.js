/**
 * UI labels for interviewer persona options.
 * Prompt text is assembled server-side only (see backend/src/utils/interviewerPersona.js).
 */

export const INTERVIEWER_PERSONA_LABELS = {
  friendly: 'Friendly',
  neutral: 'Neutral',
  strict: 'Strict',
  panel: 'Panel of 3',
};

export const getInterviewerPersonaLabel = (personaId) =>
  INTERVIEWER_PERSONA_LABELS[personaId] || INTERVIEWER_PERSONA_LABELS.neutral;
