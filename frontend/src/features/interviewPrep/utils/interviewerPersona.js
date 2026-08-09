/** UI labels only — persona prompt text is assembled server-side. */
export const INTERVIEWER_PERSONA_LABELS = {
  friendly: 'Friendly HR',
  neutral: 'Hiring Manager',
  strict: 'Strict Formal',
  panel: 'Panel of 3',
};

export const INTERVIEWER_PERSONA_DESCRIPTIONS = {
  friendly: 'Warm, encouraging, natural conversation',
  neutral: 'Balanced, professional, efficient',
  strict: 'Formal, rigorous, high-signal probes',
  panel: 'Technical + HM + HR perspectives',
};

export const getInterviewerPersonaLabel = (personaId) =>
  INTERVIEWER_PERSONA_LABELS[personaId] || INTERVIEWER_PERSONA_LABELS.neutral;

export const getInterviewerPersonaDescription = (personaId) =>
  INTERVIEWER_PERSONA_DESCRIPTIONS[personaId] || INTERVIEWER_PERSONA_DESCRIPTIONS.neutral;
