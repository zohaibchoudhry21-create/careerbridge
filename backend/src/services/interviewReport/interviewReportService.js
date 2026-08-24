/**
 * Orchestrates enterprise + legacy mock interview report persistence.
 */

import InterviewReport from '../../models/InterviewReport.js';
import {
  isCurrentScoreVersion,
  SCORING_LOGIC_VERSION,
} from '../../config/interviewReportConfig.js';
import { buildMockInterviewSnapshot } from './snapshotBuilder.js';
import {
  buildDeterministicFallbackNarrative,
  generateEnterpriseNarrativeWithGroq,
} from './groq/enterpriseNarrativeGroq.js';
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

const buildReportDocument = ({
  userId,
  session,
  assembled,
  rawMetricsSnapshot,
  narrativeGenerated,
  flagReasons,
}) => ({
  userId,
  sourceType: 'mock_interview',
  sourceId: session._id,
  overallScore: assembled.overallScore,
  scoreVersion: SCORING_LOGIC_VERSION,
  sections: assembled.sections,
  strengths: assembled.strengths,
  improvementAreas: assembled.improvementAreas,
  recommendedNextSteps: assembled.recommendedNextSteps,
  flaggedForReview: Boolean(assembled.flaggedForReview || flagReasons.length),
  flagReasons: flagReasons.slice(0, 10),
  narrativeGenerated: Boolean(narrativeGenerated),
  enterpriseReport: {
    ...assembled.enterpriseReport,
    narrativeGenerated: Boolean(narrativeGenerated),
  },
  rawMetricsSnapshot,
});

/**
 * @param {object} session - MockInterviewSession document
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {{ metricsFlagReasons?: string[] }} [options]
 */
export const persistMockInterviewReport = async (session, userId, options = {}) => {
  const metricsFlagReasons = Array.isArray(options.metricsFlagReasons)
    ? options.metricsFlagReasons.filter(Boolean)
    : [];
  const forceRegenerate = Boolean(options.forceRegenerate);

  if (!forceRegenerate) {
    if (session.reportId) {
      const existing = await InterviewReport.findOne({
        _id: session.reportId,
        userId,
      });
      if (existing) {
        if (isCurrentScoreVersion(existing)) {
          const nextStatus = existing.narrativeGenerated !== false ? 'ready' : 'failed';
          if (session.reportStatus !== nextStatus) {
            session.reportStatus = nextStatus;
            await session.save();
          }
          return { report: existing, cached: true, narrativeGenerated: existing.narrativeGenerated !== false };
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
        session.reportStatus = cachedBySource.narrativeGenerated !== false ? 'ready' : 'failed';
        await session.save();
        return {
          report: cachedBySource,
          cached: true,
          narrativeGenerated: cachedBySource.narrativeGenerated !== false,
        };
      }
      await discardStaleReport(cachedBySource, session);
    }
  } else {
    const staleReports = await InterviewReport.find({
      userId,
      sourceType: 'mock_interview',
      sourceId: session._id,
    });
    for (const stale of staleReports) {
      await discardStaleReport(stale, session);
    }
  }

  session.reportStatus = 'pending';
  await session.save();

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
    metricsFlagReasons,
  };

  let narrative;
  let narrativeGenerated = false;

  try {
    narrative = await generateEnterpriseNarrativeWithGroq(
      snapshot,
      measuredFactsFromSnapshot(snapshot)
    );
    narrativeGenerated = narrative?.narrativeGenerated !== false;
    logInterviewStage('report.narrative', {
      sessionId: String(session._id),
      ok: narrativeGenerated,
    });
  } catch (error) {
    // Defensive: narrative helper should not throw, but never fail the whole submit.
    console.error(
      `[interview-report] narrative unexpected throw sessionId=${session._id}:`,
      error?.message
    );
    logInterviewStage('report.narrative', {
      sessionId: String(session._id),
      ok: false,
      error: error?.message,
    });
    narrative = buildDeterministicFallbackNarrative();
    narrativeGenerated = false;
  }

  // Strip control fields before assembly (builders ignore unknown keys, but keep payload clean).
  const { narrativeGenerated: _ng, ...narrativeForAssemble } = narrative || {};
  if (!narrativeGenerated) {
    Object.assign(narrativeForAssemble, buildDeterministicFallbackNarrative());
  }

  const assembled = assembleInterviewReport(snapshot, narrativeForAssemble);

  const injectionFlagged = Boolean(assembled.flaggedForReview);
  const flagReasons = [
    ...(injectionFlagged ? ['transcript_injection_markers'] : []),
    ...metricsFlagReasons,
  ];

  const docPayload = buildReportDocument({
    userId,
    session,
    assembled,
    rawMetricsSnapshot,
    narrativeGenerated,
    flagReasons,
  });

  let report;
  try {
    report = await InterviewReport.create(docPayload);
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
          session.reportStatus = existing.narrativeGenerated !== false ? 'ready' : 'failed';
          await session.save();
          return {
            report: existing,
            cached: true,
            narrativeGenerated: existing.narrativeGenerated !== false,
          };
        }
        await discardStaleReport(existing, session);
        report = await InterviewReport.create(docPayload);
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  session.reportId = report._id;
  session.status = 'completed';
  session.reportStatus = narrativeGenerated ? 'ready' : 'failed';
  await session.save();

  return { report, cached: false, narrativeGenerated };
};
