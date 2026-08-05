import {
  clampScore,
  detectTranscriptInjectionMarkers,
  sanitizeAiReportPayload,
  sanitizeStringList,
} from './interviewScoreUtils.js';

const average = (values) => {
  const nums = values.filter((v) => Number.isFinite(Number(v)));
  if (!nums.length) return 0;
  return nums.reduce((sum, v) => sum + Number(v), 0) / nums.length;
};

const sum = (values) =>
  values.reduce((acc, v) => acc + (Number.isFinite(Number(v)) ? Number(v) : 0), 0);

const buildTranscriptBasedSnapshot = (session, mode) => {
  const conversationText = (session.voiceCallTranscript || [])
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const callVoiceMetrics = session.callVoiceMetrics || null;
  const callVideoMetrics = session.callVideoMetrics || null;

  const qa = session.questions.map((question) => ({
    questionId: question.questionId,
    question: question.text,
    transcript: conversationText,
    voiceMetrics: callVoiceMetrics,
    videoMetrics: callVideoMetrics,
  }));

  const summary = {
    interviewStyle: mode === 'live' ? 'live_interview' : 'live_voice_call',
    transcriptTurns: session.voiceCallTranscript?.length || 0,
  };

  if (mode === 'live' && callVoiceMetrics) {
    summary.averageWpm = Math.round(callVoiceMetrics.wpm || 0);
    summary.averageConfidenceScore = Math.round(callVoiceMetrics.confidenceScore || 0);
    summary.totalFillerWords = callVoiceMetrics.fillerWords || 0;
    summary.averagePauseRatio = Number((callVoiceMetrics.pauseRatio || 0).toFixed(3));
  }

  if (mode === 'live' && callVideoMetrics) {
    summary.averageEyeContactPercent = Math.round(callVideoMetrics.eyeContactPercent || 0);
    summary.averageEngagementScore = Math.round(callVideoMetrics.engagementScore || 0);
  }

  const fullTranscript = session.voiceCallTranscript || [];
  const flaggedForReview = detectTranscriptInjectionMarkers(fullTranscript);

  return {
    mode,
    role: session.roleLabel || session.role,
    difficulty: session.difficulty,
    durationMinutes: session.durationMinutes,
    targetQuestionCount: session.targetQuestionCount,
    summary,
    qa,
    fullTranscript,
    flaggedForReview,
  };
};

export const buildMockInterviewSnapshot = (session) => {
  if (session.mode === 'voiceCall') {
    return buildTranscriptBasedSnapshot(session, 'voiceCall');
  }

  if (session.mode === 'live') {
    return buildTranscriptBasedSnapshot(session, 'live');
  }

  const qa = session.questions.map((question, index) => {
    const answer = session.answers.find((a) => a.questionId === question.questionId) || session.answers[index];

    return {
      questionId: question.questionId,
      question: question.text,
      transcript: answer?.transcript || '',
      voiceMetrics: answer?.voiceMetrics || null,
      videoMetrics: answer?.videoMetrics || null,
    };
  });

  const voiceRows = qa.map((row) => row.voiceMetrics).filter(Boolean);
  const videoRows = qa.map((row) => row.videoMetrics).filter(Boolean);

  const summary = {
    averageWpm: Math.round(average(voiceRows.map((v) => v.wpm))),
    averageConfidenceScore: Math.round(average(voiceRows.map((v) => v.confidenceScore))),
    totalFillerWords: sum(voiceRows.map((v) => v.fillerWords)),
    averagePauseRatio: Number(average(voiceRows.map((v) => v.pauseRatio)).toFixed(3)),
    averageEyeContactPercent: Math.round(average(videoRows.map((v) => v.eyeContactPercent))),
    averageEngagementScore: Math.round(average(videoRows.map((v) => v.engagementScore))),
  };

  const flaggedForReview = detectTranscriptInjectionMarkers(
    qa.map((row) => ({ content: row.transcript }))
  );

  return {
    role: session.roleLabel || session.role,
    difficulty: session.difficulty,
    durationMinutes: session.durationMinutes,
    targetQuestionCount: session.targetQuestionCount,
    summary,
    qa,
    flaggedForReview,
  };
};

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
