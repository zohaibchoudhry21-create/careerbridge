export const buildCriticalThinkingSection = (dimensions) =>
  dimensions?.criticalThinking || {
    label: 'Critical Thinking',
    score: null,
    feedback: '',
    evidence: [],
  };
