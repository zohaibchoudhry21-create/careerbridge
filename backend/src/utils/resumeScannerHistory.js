const cloneSuggestions = (suggestions = []) => suggestions.map((item) => ({ ...item }));

export const createHistorySnapshot = ({
  resumeText,
  suggestions,
  score,
  matchedSkillIds,
  missingSkillIds,
  action,
}) => ({
  resumeText,
  suggestions: cloneSuggestions(suggestions),
  score,
  matchedSkillIds: [...(matchedSkillIds || [])],
  missingSkillIds: [...(missingSkillIds || [])],
  action: action || 'edit',
  timestamp: new Date(),
});

export const pushHistoryEntry = (analysis, action = 'edit') => {
  const snapshot = createHistorySnapshot({
    resumeText: analysis.resumeText,
    suggestions: analysis.suggestions,
    score: analysis.score,
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
  analysis.score = snapshot.score;
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
    score: analysis.score,
    matchedSkillIds: analysis.matchedSkillIds,
    missingSkillIds: analysis.missingSkillIds,
    action: 'initial',
  });

  analysis.history = [snapshot];
  analysis.historyIndex = 0;
  return analysis;
};
