export const buildProblemSolvingSection = (dimensions) =>
  dimensions?.problemSolving || {
    label: 'Problem Solving',
    score: null,
    feedback: '',
    evidence: [],
  };
