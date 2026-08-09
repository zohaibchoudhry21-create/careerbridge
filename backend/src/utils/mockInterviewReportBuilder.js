/**
 * Legacy report merge helpers + snapshot re-export.
 * Snapshot construction lives in services/interviewReport (single source of truth).
 */

import {
  clampScore,
  sanitizeAiReportPayload,
  sanitizeStringList,
} from './interviewScoreUtils.js';

export { buildMockInterviewSnapshot } from '../services/interviewReport/snapshotBuilder.js';

export const mergeReportWithSummary = (aiReport, summary, { flaggedForReview = false } = {}) => {
  const sanitized = sanitizeAiReportPayload(aiReport);
  const sections = { ...sanitized.sections };

  sections.voiceAnalysis = {
    ...sections.voiceAnalysis,
    wpm: Number.isFinite(Number(sections.voiceAnalysis?.wpm))
      ? Math.max(0, Number(sections.voiceAnalysis.wpm))
      : summary.averageWpm,
    confidenceScore: clampScore(
      sections.voiceAnalysis?.confidenceScore ?? summary.averageConfidenceScore,
      0
    ),
    fillerWords: Number.isFinite(Number(sections.voiceAnalysis?.fillerWords))
      ? Math.max(0, Math.round(Number(sections.voiceAnalysis.fillerWords)))
      : summary.totalFillerWords,
  };

  sections.videoAnalysis = {
    ...sections.videoAnalysis,
    eyeContactPercent: clampScore(
      sections.videoAnalysis?.eyeContactPercent ?? summary.averageEyeContactPercent,
      0
    ),
    engagementScore: clampScore(
      sections.videoAnalysis?.engagementScore ?? summary.averageEngagementScore,
      0
    ),
  };

  if (sections.contentQuality) {
    sections.contentQuality.score = clampScore(sections.contentQuality.score, 0);
  }

  return {
    overallScore: clampScore(sanitized.overallScore, 0),
    sections,
    strengths: sanitizeStringList(sanitized.strengths),
    improvementAreas: sanitizeStringList(sanitized.improvementAreas),
    recommendedNextSteps: sanitizeStringList(sanitized.recommendedNextSteps),
    flaggedForReview: Boolean(flaggedForReview),
  };
};
