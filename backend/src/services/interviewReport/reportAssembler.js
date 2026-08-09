/**
 * Assemble legacy report fields + enterpriseReport from builders + narrative.
 */

import { ENTERPRISE_REPORT_VERSION, LEGACY_LIST_MAX } from '../../config/interviewReportConfig.js';
import { mergeReportWithSummary } from '../../utils/mockInterviewReportBuilder.js';
import { sanitizeAiReportPayload, sanitizeStringList } from '../../utils/interviewScoreUtils.js';
import { buildEyeContactSection } from './builders/eyeContactBuilder.js';
import { buildVoiceAnalysisSection } from './builders/voiceAnalysisBuilder.js';
import { buildBodyLanguageSection } from './builders/bodyLanguageBuilder.js';
import { buildDimensionScores } from './builders/dimensionScoresBuilder.js';
import { buildOverallScoreWithMeta } from './builders/overallScoreBuilder.js';
import { buildHiringSections } from './builders/hiringBuilder.js';
import { buildStrengthsWeaknesses } from './builders/strengthsWeaknessesBuilder.js';
import { buildQuestionReviews } from './builders/questionReviewBuilder.js';
import { buildRoadmapAndCareer } from './builders/roadmapBuilder.js';
import { buildExecutiveSummary } from './builders/executiveSummaryBuilder.js';
import { buildTimelineAndCharts } from './builders/timelineChartsBuilder.js';
import { serializeEnterpriseReport } from './serializers/enterpriseReportSerializer.js';

const sliceLegacy = (list) => sanitizeStringList(list).slice(0, LEGACY_LIST_MAX);

export const assembleInterviewReport = (snapshot, narrative = {}) => {
  const eyeContact = buildEyeContactSection(snapshot);
  const voiceAnalysis = buildVoiceAnalysisSection(snapshot);
  const bodyLanguage = buildBodyLanguageSection(snapshot);

  const expectedQuestionCount = (snapshot.qa || snapshot.questions || []).length;

  // Gated per-question scores first — dimensions + overall both depend on them.
  const questionReviews = buildQuestionReviews(snapshot, narrative.questionReviews);

  const narrativeDims = narrative.dimensions || {};
  const dimensions = buildDimensionScores(snapshot, narrativeDims, {
    questionReviews,
  });

  let legacyMerged;
  if (narrative.legacyAiReport) {
    legacyMerged = mergeReportWithSummary(
      sanitizeAiReportPayload(narrative.legacyAiReport),
      snapshot.summary,
      { flaggedForReview: Boolean(snapshot.flaggedForReview) }
    );
  } else {
    legacyMerged = mergeReportWithSummary(
      {
        overallScore: 0,
        sections: {
          contentQuality: { score: dimensions.technicalSkills?.score ?? 0, feedback: '' },
          voiceAnalysis: {
            wpm: snapshot.summary?.averageWpm,
            confidenceScore: snapshot.summary?.averageConfidenceScore,
            fillerWords: snapshot.summary?.totalFillerWords,
            feedback: '',
          },
          videoAnalysis: {
            eyeContactPercent: snapshot.summary?.averageEyeContactPercent,
            engagementScore: snapshot.summary?.averageEngagementScore,
            feedback: '',
          },
        },
        strengths: [],
        improvementAreas: [],
        recommendedNextSteps: [],
      },
      snapshot.summary,
      { flaggedForReview: Boolean(snapshot.flaggedForReview) }
    );
  }

  // Enrich legacy voice/video feedback from measured sections when AI left blank.
  if (!legacyMerged.sections.voiceAnalysis?.feedback && voiceAnalysis.evidence?.length) {
    legacyMerged.sections.voiceAnalysis.feedback = voiceAnalysis.evidence.join('. ');
  }
  if (!legacyMerged.sections.videoAnalysis?.feedback && eyeContact.evidence?.length) {
    legacyMerged.sections.videoAnalysis.feedback = eyeContact.evidence.join('. ');
  }

  const overallMeta = buildOverallScoreWithMeta({
    dimensions,
    voiceSection: voiceAnalysis,
    eyeContactSection: eyeContact,
    bodyLanguageSection: bodyLanguage,
    legacyOverall: legacyMerged.overallScore,
    questionReviews,
    expectedQuestionCount,
  });
  const overallScore = overallMeta.overall;
  // Near-zero content: treat as content-gated for strengths/roadmap wording.
  const contentCeilingApplied =
    overallMeta.ceiling != null ||
    Number(overallMeta.contentCore ?? 0) <= 5 ||
    Number(overallScore) <= 5;

  // Keep legacy top-level overall aligned with capped enterprise overall.
  legacyMerged.overallScore = overallScore;
  if (legacyMerged.sections?.contentQuality) {
    legacyMerged.sections.contentQuality.score = dimensions.technicalSkills?.score ?? 0;
  }

  const hiring = buildHiringSections(overallScore, dimensions, narrative.hiring || {});
  const lists = buildStrengthsWeaknesses({
    dimensions,
    voiceSection: voiceAnalysis,
    eyeContactSection: eyeContact,
    bodyLanguageSection: bodyLanguage,
    narrative,
    overallScore,
    contentCeilingApplied,
  });
  const { learningRoadmap, careerSuggestions } = buildRoadmapAndCareer({
    dimensions,
    narrative,
    role: snapshot.role,
  });
  const executiveSummary = buildExecutiveSummary(narrative.executiveSummary, overallScore, hiring);
  const { timeline, charts } = buildTimelineAndCharts({
    dimensions,
    voiceSection: voiceAnalysis,
    eyeContactSection: eyeContact,
    bodyLanguageSection: bodyLanguage,
    speechTimelineEvents: snapshot.speechTimelineEvents,
    behavioralTimelineEvents: snapshot.behavioralTimelineEvents,
    overallScore,
    contentAvg: overallMeta.contentAvg,
    contentCore: overallMeta.contentCore,
  });

  const enterpriseReport = serializeEnterpriseReport({
    version: ENTERPRISE_REPORT_VERSION,
    executiveSummary,
    hiringRecommendation: hiring.hiringRecommendation,
    hiringProbability: hiring.hiringProbability,
    overallScore,
    dimensions,
    eyeContact,
    voiceAnalysis,
    bodyLanguage,
    questionReviews,
    strengths: lists.strengths,
    weaknesses: lists.weaknesses,
    improvementAreas: lists.improvementAreas,
    learningRoadmap,
    careerSuggestions,
    timeline,
    charts,
  });

  const strengths = sliceLegacy(lists.strengths.length ? lists.strengths : legacyMerged.strengths);
  const improvementAreas = sliceLegacy(
    lists.improvementAreas.length ? lists.improvementAreas : legacyMerged.improvementAreas
  );
  const recommendedNextSteps = sliceLegacy(
    (narrative.recommendedNextSteps || []).length
      ? narrative.recommendedNextSteps
      : learningRoadmap.map((r) => r.title).concat(legacyMerged.recommendedNextSteps || [])
  );

  return {
    overallScore,
    sections: legacyMerged.sections,
    strengths,
    improvementAreas,
    recommendedNextSteps,
    flaggedForReview: Boolean(snapshot.flaggedForReview || legacyMerged.flaggedForReview),
    enterpriseReport,
  };
};
