/**
 * Build report snapshot from MockInterviewSession (includes monitoring metrics).
 */

import { detectTranscriptInjectionMarkers } from '../../utils/interviewScoreUtils.js';

const average = (values) => {
  const nums = values.filter((v) => Number.isFinite(Number(v)));
  if (!nums.length) return 0;
  return nums.reduce((sum, v) => sum + Number(v), 0) / nums.length;
};

const sum = (values) =>
  values.reduce((acc, v) => acc + (Number.isFinite(Number(v)) ? Number(v) : 0), 0);

/**
 * Timeline + metrics for the report come from the same session fields written
 * at submit (speech analysis + callVideoMetrics). Prefer callVideoMetrics exclusively
 * when present so we never mix in stale callLiveVideoMetrics leftovers.
 */
const resolveBehavioralTimelineEvents = (session) => {
  if (session.callVideoMetrics) {
    return Array.isArray(session.callVideoMetrics.timelineEvents)
      ? session.callVideoMetrics.timelineEvents
      : [];
  }
  // Legacy sessions that only stored callLiveVideoMetrics.
  return Array.isArray(session.callLiveVideoMetrics?.timelineEvents)
    ? session.callLiveVideoMetrics.timelineEvents
    : [];
};

const attachMonitoring = (session, base) => ({
  ...base,
  callSpeechMetrics: session.callSpeechMetrics || null,
  speechTimelineEvents: Array.isArray(session.speechTimelineEvents)
    ? session.speechTimelineEvents
    : [],
  callLiveAudioHints: session.callLiveAudioHints || null,
  behavioralMetrics: session.callVideoMetrics?.behavioralMetrics || null,
  behavioralTimelineEvents: resolveBehavioralTimelineEvents(session),
  interviewContextBrief: session.interviewContextBrief || null,
  focusAreas: session.focusAreas || [],
  callDurationMs: session.callDurationMs,
});

const buildTranscriptBasedSnapshot = (session, mode) => {
  const callVoiceMetrics = session.callVoiceMetrics || null;
  const callVideoMetrics = session.callVideoMetrics || null;

  // Live path: keep full transcript once on `fullTranscript` — do not duplicate
  // the entire conversation onto every QA row (Groq token / payload win).
  const qa = (session.questions || []).map((question) => ({
    questionId: question.questionId,
    question: question.text,
    focusTag: question.focusTag,
    depthHint: question.depthHint,
    transcript: '',
    voiceMetrics: callVoiceMetrics,
    videoMetrics: callVideoMetrics,
  }));

  const summary = {
    interviewStyle: mode === 'live' ? 'live_interview' : 'live_voice_call',
    transcriptTurns: session.voiceCallTranscript?.length || 0,
  };

  if (callVoiceMetrics) {
    summary.averageWpm = Math.round(callVoiceMetrics.wpm || 0);
    summary.averageConfidenceScore = Math.round(callVoiceMetrics.confidenceScore || 0);
    summary.totalFillerWords = callVoiceMetrics.fillerWords || 0;
    summary.averagePauseRatio = Number((callVoiceMetrics.pauseRatio || 0).toFixed(3));
  }

  if (callVideoMetrics) {
    summary.averageEyeContactPercent = Math.round(callVideoMetrics.eyeContactPercent || 0);
    summary.averageEngagementScore = Math.round(callVideoMetrics.engagementScore || 0);
    if (callVideoMetrics.attentionScore != null) {
      summary.averageAttentionScore = Math.round(callVideoMetrics.attentionScore || 0);
    }
  }

  const speech = session.callSpeechMetrics || {};
  if (speech.communicationScore != null) summary.speechCommunicationScore = speech.communicationScore;
  if (speech.fluency != null) summary.speechFluency = speech.fluency;
  if (speech.speakingConfidence != null) summary.speechSpeakingConfidence = speech.speakingConfidence;

  const fullTranscript = session.voiceCallTranscript || [];
  const flaggedForReview = detectTranscriptInjectionMarkers(fullTranscript);

  return attachMonitoring(session, {
    mode,
    role: session.roleLabel || session.role,
    difficulty: session.difficulty,
    durationMinutes: session.durationMinutes,
    targetQuestionCount: session.targetQuestionCount,
    summary,
    qa,
    fullTranscript,
    flaggedForReview,
  });
};

export const buildMockInterviewSnapshot = (session) => {
  if (session.mode === 'voiceCall') {
    return buildTranscriptBasedSnapshot(session, 'voiceCall');
  }

  if (session.mode === 'live') {
    return buildTranscriptBasedSnapshot(session, 'live');
  }

  const qa = (session.questions || []).map((question, index) => {
    const answer =
      session.answers.find((a) => a.questionId === question.questionId) || session.answers[index];

    return {
      questionId: question.questionId,
      question: question.text,
      focusTag: question.focusTag,
      depthHint: question.depthHint,
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

  return attachMonitoring(session, {
    role: session.roleLabel || session.role,
    difficulty: session.difficulty,
    durationMinutes: session.durationMinutes,
    targetQuestionCount: session.targetQuestionCount,
    summary,
    qa,
    flaggedForReview,
  });
};
