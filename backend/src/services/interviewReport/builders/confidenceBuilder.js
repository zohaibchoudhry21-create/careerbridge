export const buildConfidenceSection = (dimensions) =>
  dimensions?.confidence || { label: 'Confidence', score: null, feedback: '', evidence: [] };
