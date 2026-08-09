import { serializeEnterpriseReport } from '../services/interviewReport/serializers/enterpriseReportSerializer.js';

export const serializeInterviewReport = (report, sessionId) => ({
  sessionId: String(sessionId || report.sourceId),
  type: report.sourceType,
  overallScore: report.overallScore,
  scoreVersion: report.scoreVersion,
  sections: report.sections,
  strengths: report.strengths || [],
  improvementAreas: report.improvementAreas || [],
  recommendedNextSteps: report.recommendedNextSteps || [],
  flaggedForReview: Boolean(report.flaggedForReview),
  createdAt: report.createdAt,
  enterpriseReport: serializeEnterpriseReport(report.enterpriseReport),
});
