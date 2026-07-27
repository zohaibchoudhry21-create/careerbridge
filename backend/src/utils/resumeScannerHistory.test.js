import { describe, expect, it } from 'vitest';
import {
  canRedo,
  canUndo,
  initializeHistory,
  pushHistoryEntry,
  redoAnalysis,
  undoAnalysis,
} from './resumeScannerHistory.js';

const buildAnalysis = () => ({
  resumeText: 'Original resume text',
  suggestions: [{ id: 's1', status: 'pending', original: 'Original', suggested: 'Improved' }],
  atsScore: 80,
  jobMatchScore: 50,
  score: 50,
  atsScoreBreakdown: { sectionCompleteness: 100, searchability: 75, quantifiedAchievements: 60 },
  jobMatchBreakdown: { keywordCoverage: 50, aiAssessedRelevance: 40 },
  matchedSkillIds: ['skill-1'],
  missingSkillIds: ['skill-2'],
  history: [],
  historyIndex: -1,
});

describe('resumeScannerHistory', () => {
  it('initializes history with a baseline snapshot', () => {
    const analysis = buildAnalysis();
    initializeHistory(analysis);

    expect(analysis.history).toHaveLength(1);
    expect(analysis.historyIndex).toBe(0);
    expect(analysis.history[0].jobMatchScore).toBe(50);
    expect(analysis.history[0].atsScore).toBe(80);
  });

  it('supports undo and redo transitions', () => {
    const analysis = buildAnalysis();
    initializeHistory(analysis);

    analysis.resumeText = 'Edited resume text';
    analysis.jobMatchScore = 62;
    analysis.score = 62;
    pushHistoryEntry(analysis, 'manual-edit');

    expect(canUndo(analysis)).toBe(true);
    expect(canRedo(analysis)).toBe(false);

    undoAnalysis(analysis);
    expect(analysis.resumeText).toBe('Original resume text');
    expect(analysis.jobMatchScore).toBe(50);
    expect(canRedo(analysis)).toBe(true);

    redoAnalysis(analysis);
    expect(analysis.resumeText).toBe('Edited resume text');
    expect(analysis.jobMatchScore).toBe(62);
  });
});
