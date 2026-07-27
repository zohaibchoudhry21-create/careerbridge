const cloneSuggestions = (suggestions = []) => suggestions.map((item) => ({ ...item }));

export const createHistorySnapshot = ({
  resumeText,
  suggestions,
  atsScore,
  jobMatchScore,
  atsScoreBreakdown,
  jobMatchBreakdown,
  matchedSkillIds,
  missingSkillIds,
  action,
}) => ({
  resumeText,
  suggestions: cloneSuggestions(suggestions),
  atsScore,
  jobMatchScore,
  score: jobMatchScore,
  atsScoreBreakdown: { ...(atsScoreBreakdown || {}) },
  jobMatchBreakdown: { ...(jobMatchBreakdown || {}) },
  matchedSkillIds: [...(matchedSkillIds || [])],
  missingSkillIds: [...(missingSkillIds || [])],
  action: action || 'edit',
  timestamp: new Date(),
});

export const pushHistoryEntry = (analysis, action = 'edit') => {
  const snapshot = createHistorySnapshot({
    resumeText: analysis.resumeText,
    suggestions: analysis.suggestions,
    atsScore: analysis.atsScore,
    jobMatchScore: analysis.jobMatchScore,
    atsScoreBreakdown: analysis.atsScoreBreakdown,
    jobMatchBreakdown: analysis.jobMatchBreakdown,
    matchedSkillIds: analysis.matchedSkillIds,
    missingSkillIds: analysis.missingSkillIds,
    action,
  });

  const truncated = analysis.history.slice(0, analysis.historyIndex + 1);
  truncated.push(snapshot);

  analysis.history = truncated;
  analysis.historyIndex = truncated.length - 1;
};

export const canUndo = (analysis) => analysis.historyIndex > 0;
export const canRedo = (analysis) => analysis.historyIndex >= 0 && analysis.historyIndex < analysis.history.length - 1;

export const applyHistoryIndex = (analysis, index) => {
  const snapshot = analysis.history[index];
  if (!snapshot) return analysis;

  analysis.historyIndex = index;
  analysis.resumeText = snapshot.resumeText;
  analysis.suggestions = cloneSuggestions(snapshot.suggestions);
  analysis.atsScore = snapshot.atsScore;
  analysis.jobMatchScore = snapshot.jobMatchScore;
  analysis.score = snapshot.jobMatchScore;
  analysis.atsScoreBreakdown = { ...(snapshot.atsScoreBreakdown || {}) };
  analysis.jobMatchBreakdown = { ...(snapshot.jobMatchBreakdown || {}) };
  analysis.matchedSkillIds = [...snapshot.matchedSkillIds];
  analysis.missingSkillIds = [...snapshot.missingSkillIds];

  return analysis;
};

export const undoAnalysis = (analysis) => {
  if (!canUndo(analysis)) return analysis;
  return applyHistoryIndex(analysis, analysis.historyIndex - 1);
};

export const redoAnalysis = (analysis) => {
  if (!canRedo(analysis)) return analysis;
  return applyHistoryIndex(analysis, analysis.historyIndex + 1);
};

export const initializeHistory = (analysis) => {
  const snapshot = createHistorySnapshot({
    resumeText: analysis.resumeText,
    suggestions: analysis.suggestions,
    atsScore: analysis.atsScore,
    jobMatchScore: analysis.jobMatchScore,
    atsScoreBreakdown: analysis.atsScoreBreakdown,
    jobMatchBreakdown: analysis.jobMatchBreakdown,
    matchedSkillIds: analysis.matchedSkillIds,
    missingSkillIds: analysis.missingSkillIds,
    action: 'initial',
  });

  analysis.history = [snapshot];
  analysis.historyIndex = 0;
  return analysis;
};
