import { cloneStructuredResume } from './structuredResume.js';

const cloneSuggestions = (suggestions = []) => suggestions.map((item) => ({ ...item }));

const cloneParsedData = (parsedData) =>
  parsedData ? JSON.parse(JSON.stringify(parsedData)) : {};

export const createHistorySnapshot = ({
  resumeText,
  structuredResume,
  parsedData,
  templateId,
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
  structuredResume: cloneStructuredResume(structuredResume),
  parsedData: cloneParsedData(parsedData),
  templateId: templateId || 'classic',
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

const HISTORY_MAX_ENTRIES = 50;

export const pushHistoryEntry = (analysis, action = 'edit') => {
  const snapshot = createHistorySnapshot({
    resumeText: analysis.resumeText,
    structuredResume: analysis.structuredResume,
    parsedData: analysis.parsedData,
    templateId: analysis.templateId,
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

  if (truncated.length > HISTORY_MAX_ENTRIES) {
    const overflow = truncated.length - HISTORY_MAX_ENTRIES;
    truncated.splice(0, overflow);
  }

  analysis.history = truncated;
  analysis.historyIndex = truncated.length - 1;
};

export const canUndo = (analysis) => analysis.historyIndex > 0;
export const canRedo = (analysis) =>
  analysis.historyIndex >= 0 && analysis.historyIndex < analysis.history.length - 1;

export const applyHistoryIndex = (analysis, index) => {
  const snapshot = analysis.history[index];
  if (!snapshot) return analysis;

  analysis.historyIndex = index;
  analysis.resumeText = snapshot.resumeText;
  analysis.structuredResume = cloneStructuredResume(snapshot.structuredResume);
  analysis.parsedData = cloneParsedData(snapshot.parsedData);
  analysis.templateId = snapshot.templateId || 'classic';
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
    structuredResume: analysis.structuredResume,
    parsedData: analysis.parsedData,
    templateId: analysis.templateId,
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
