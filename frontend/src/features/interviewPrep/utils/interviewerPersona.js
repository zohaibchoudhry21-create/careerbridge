/** UI labels only — persona prompt text is assembled server-side. */
export const INTERVIEWER_PERSONA_LABELS = {
  friendly: 'Friendly HR',
  neutral: 'Hiring Manager',
  strict: 'Strict Formal',
};

export const INTERVIEWER_PERSONA_DESCRIPTIONS = {
  friendly: 'Warm, encouraging, natural conversation',
  neutral: 'Balanced, professional, efficient',
  strict: 'Formal, rigorous, high-signal probes',
};

export const getInterviewerPersonaLabel = (personaId) =>
  INTERVIEWER_PERSONA_LABELS[personaId] || INTERVIEWER_PERSONA_LABELS.neutral;

export const getInterviewerPersonaDescription = (personaId) =>
  INTERVIEWER_PERSONA_DESCRIPTIONS[personaId] || INTERVIEWER_PERSONA_DESCRIPTIONS.neutral;

/** Coerce legacy stored prefs that used panel persona. */
export const normalizeInterviewerPersona = (personaId) => {
  const key = String(personaId || '').trim().toLowerCase();
  if (key && INTERVIEWER_PERSONA_LABELS[key]) return key;
  return 'neutral';
};
