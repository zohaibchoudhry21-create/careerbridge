export const buildBehaviorSection = (dimensions) =>
  dimensions?.behavior || { label: 'Behavior', score: null, feedback: '', evidence: [] };
