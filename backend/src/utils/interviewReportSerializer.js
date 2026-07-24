export const serializeInterviewReport = (report, sessionId) => ({
  sessionId: String(sessionId || report.sourceId),
  type: report.sourceType,
  overallScore: report.overallScore,
  sections: report.sections,
  strengths: report.strengths || [],
  improvementAreas: report.improvementAreas || [],
  recommendedNextSteps: report.recommendedNextSteps || [],
  createdAt: report.createdAt,
});
