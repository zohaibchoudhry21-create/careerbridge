/**
 * Orchestrates enterprise + legacy mock interview report persistence.
 */

import InterviewReport from '../../models/InterviewReport.js';
import {
  isCurrentScoreVersion,
  SCORING_LOGIC_VERSION,
} from '../../config/interviewReportConfig.js';
import { buildMockInterviewSnapshot } from './snapshotBuilder.js';
import { generateEnterpriseNarrativeWithGroq } from './groq/enterpriseNarrativeGroq.js';
import { assembleInterviewReport } from './reportAssembler.js';
import { logInterviewStage } from '../../utils/interviewPerfLog.js';

const measuredFactsFromSnapshot = (snapshot) => ({
  summary: snapshot.summary,
  speech: snapshot.callSpeechMetrics
    ? {
        speechSpeed: snapshot.callSpeechMetrics.speechSpeed,
        fluency: snapshot.callSpeechMetrics.fluency,
        communicationScore: snapshot.callSpeechMetrics.communicationScore,
        speakingConfidence: snapshot.callSpeechMetrics.speakingConfidence,
        fillerWords: snapshot.callSpeechMetrics.fillerWords,
        stressScore: snapshot.callSpeechMetrics.stressScore,
      }
    : null,
  behavioral: snapshot.behavioralMetrics
    ? {
        attentionScore: snapshot.behavioralMetrics.attentionScore,
        distractionScore: snapshot.behavioralMetrics.distractionScore,
        cameraFocusScore: snapshot.behavioralMetrics.cameraFocusScore,
        lookingAwayDurationMs: snapshot.behavioralMetrics.lookingAwayDurationMs,
      }
    : null,
});

/** Delete a stale report so a fresh one can be created for the same sourceId. */
const discardStaleReport = async (report, session) => {
  if (!report?._id) return;
  await InterviewReport.deleteOne({ _id: report._id });
  if (session && session.reportId && String(session.reportId) === String(report._id)) {
    session.reportId = undefined;
  }
};

/**
 * @param {object} session - MockInterviewSession document
 * @param {import('mongoose').Types.ObjectId|string} userId
 */
export const persistMockInterviewReport = async (session, userId) => {
  if (session.reportId) {
    const existing = await InterviewReport.findOne({
      _id: session.reportId,
      userId,
    });
    if (existing) {
      if (isCurrentScoreVersion(existing)) {
        return { report: existing, cached: true };
      }
      await discardStaleReport(existing, session);
    }
  }

  const cachedBySource = await InterviewReport.findOne({
    userId,
    sourceType: 'mock_interview',
    sourceId: session._id,
  });

  if (cachedBySource) {
    if (isCurrentScoreVersion(cachedBySource)) {
      session.reportId = cachedBySource._id;
      session.status = 'completed';
      await session.save();
      return { report: cachedBySource, cached: true };
    }
    await discardStaleReport(cachedBySource, session);
  }

  const snapshot = buildMockInterviewSnapshot(session);
  // Trim forensic snapshot stored on the report (keep full snapshot for scoring).
  const {
    callLiveAudioHints: _omitLiveAudioHints,
    interviewContextBrief: _omitBrief,
    ...snapshotForStorage
  } = snapshot;
  const rawMetricsSnapshot = {
    ...snapshotForStorage,
    speechTimelineEvents: (snapshot.speechTimelineEvents || []).slice(0, 40),
    behavioralTimelineEvents: (snapshot.behavioralTimelineEvents || []).slice(0, 40),
    fullTranscript: (snapshot.fullTranscript || []).slice(0, 400),
  };

  let narrative;
  try {
    narrative = await generateEnterpriseNarrativeWithGroq(
      snapshot,
      measuredFactsFromSnapshot(snapshot)
    );
  } catch (error) {
    logInterviewStage('report.narrative', {
      sessionId: String(session._id),
      ok: false,
      error: error?.message,
    });
    throw error;
  }

  const assembled = assembleInterviewReport(snapshot, narrative);

  let report;
  try {
    report = await InterviewReport.create({
      userId,
      sourceType: 'mock_interview',
      sourceId: session._id,
      overallScore: assembled.overallScore,
      scoreVersion: SCORING_LOGIC_VERSION,
      sections: assembled.sections,
      strengths: assembled.strengths,
      improvementAreas: assembled.improvementAreas,
      recommendedNextSteps: assembled.recommendedNextSteps,
      flaggedForReview: assembled.flaggedForReview,
      enterpriseReport: assembled.enterpriseReport,
      rawMetricsSnapshot,
    });
  } catch (error) {
    // Concurrent double-submit race on unique (sourceType, sourceId).
    if (error?.code === 11000) {
      const existing = await InterviewReport.findOne({
        userId,
        sourceType: 'mock_interview',
        sourceId: session._id,
      });
      if (existing) {
        if (isCurrentScoreVersion(existing)) {
          session.reportId = existing._id;
          session.status = 'completed';
          await session.save();
          return { report: existing, cached: true };
        }
        await discardStaleReport(existing, session);
        report = await InterviewReport.create({
          userId,
          sourceType: 'mock_interview',
          sourceId: session._id,
          overallScore: assembled.overallScore,
          scoreVersion: SCORING_LOGIC_VERSION,
          sections: assembled.sections,
          strengths: assembled.strengths,
          improvementAreas: assembled.improvementAreas,
          recommendedNextSteps: assembled.recommendedNextSteps,
          flaggedForReview: assembled.flaggedForReview,
          enterpriseReport: assembled.enterpriseReport,
          rawMetricsSnapshot,
        });
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  session.reportId = report._id;
  session.status = 'completed';
  await session.save();

  return { report, cached: false };
};
