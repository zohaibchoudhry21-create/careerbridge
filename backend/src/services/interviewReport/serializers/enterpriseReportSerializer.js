import { ENTERPRISE_REPORT_VERSION } from '../../../config/interviewReportConfig.js';

/**
 * Serialize enterprise report.
 * Phase 3: delivery sections nested under `delivery` (and mirrored at top-level
 * for existing frontend clients). Content under `content`.
 */
export const serializeEnterpriseReport = (enterprise) => {
  if (!enterprise || typeof enterprise !== 'object') return undefined;

  const voiceAnalysis = enterprise.voiceAnalysis
    ? { ...enterprise.voiceAnalysis, deliveryOnly: true }
    : null;
  const bodyLanguage = enterprise.bodyLanguage
    ? { ...enterprise.bodyLanguage, deliveryOnly: true }
    : null;
  const eyeContact = enterprise.eyeContact
    ? { ...enterprise.eyeContact, deliveryOnly: true }
    : null;
  const dimensions = enterprise.dimensions || {};
  const questionReviews = enterprise.questionReviews || [];

  return {
    version: enterprise.version || ENTERPRISE_REPORT_VERSION,
    executiveSummary: enterprise.executiveSummary || null,
    hiringRecommendation: enterprise.hiringRecommendation || null,
    hiringProbability: enterprise.hiringProbability || null,
    overallScore: enterprise.overallScore,
    // Phase 3 nested shape
    content: {
      dimensions,
      questionReviews,
    },
    delivery: {
      voiceAnalysis,
      bodyLanguage,
      eyeContact,
    },
    // Backward-compatible top-level aliases (same object references)
    dimensions,
    eyeContact,
    voiceAnalysis,
    bodyLanguage,
    questionReviews,
    strengths: enterprise.strengths || [],
    weaknesses: enterprise.weaknesses || [],
    improvementAreas: enterprise.improvementAreas || [],
    learningRoadmap: enterprise.learningRoadmap || [],
    careerSuggestions: enterprise.careerSuggestions || [],
    timeline: enterprise.timeline || [],
    charts: enterprise.charts || {},
  };
};
