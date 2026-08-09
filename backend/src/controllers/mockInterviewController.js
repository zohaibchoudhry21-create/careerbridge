import MockInterviewSession from '../models/MockInterviewSession.js';
import InterviewReport from '../models/InterviewReport.js';
import {
  DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES,
  INTERVIEWER_PERSONAS,
  MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
  MOCK_INTERVIEW_ROLES,
  durationMinutesToQuestionCount,
} from '../constants/interviewPrepConstants.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { analyzeVoiceFromTranscription } from '../utils/voiceAnalysisService.js';
import { analyzeSpeechMonitoring } from '../services/speechAnalysis/index.js';
import {
  aggregateVideoFrameSamples,
  buildVideoFeedbackText,
} from '../utils/videoAnalysisMetrics.js';
import { persistMockInterviewReport } from '../services/interviewReport/index.js';
import { evaluateClientMetricsAnomalies } from '../services/interviewReport/clientMetricsValidation.js';
import { isCurrentScoreVersion } from '../config/interviewReportConfig.js';
import { serializeInterviewReport } from '../utils/interviewReportSerializer.js';
import { fetchRoleSuggestionsWithGroq } from '../utils/roleSuggestionsGroqService.js';
import { analyzeResumeForInterview } from '../utils/interviewResumeAnalysisGroqService.js';
import { extractResumeTextFromFile } from '../utils/resumeFileExtractor.js';
import { createVapiAssistantForSession } from '../utils/vapiAssistantService.js';
import { prepareInterviewIntelligence } from '../services/interviewIntelligence/index.js';
import {
  applyAdaptiveDepthToQuestions,
  buildAdaptiveDepthSystemNudge,
  evaluateAnswerForAdaptiveDepth,
  maybeAbandonStaleSession,
  abandonStaleActiveSessionsForUser,
} from '../services/interviewIntelligence/index.js';
import { ADAPTIVE_DEPTH_ENABLED } from '../config/interviewIntelligenceConfig.js';
import {
  PERSIST_PAUSE_EVENTS_MAX,
  PERSIST_TIMELINE_EVENTS_MAX,
  RESUME_ANALYSIS_CACHE_TTL_MS,
  ROLE_SUGGESTIONS_CACHE_TTL_MS,
  SUBMIT_ACOUSTIC_SAMPLES_MAX,
  SUBMIT_PAUSE_EVENTS_MAX,
} from '../config/interviewPerfConfig.js';
import { logInterviewStage, withInterviewStageTiming } from '../utils/interviewPerfLog.js';
import { createInterviewTtlCache } from '../utils/interviewTtlCache.js';
import { createHash } from 'crypto';

const roleSuggestionsCache = createInterviewTtlCache({
  maxEntries: 64,
  ttlMs: ROLE_SUGGESTIONS_CACHE_TTL_MS,
});

const resumeAnalysisCache = createInterviewTtlCache({
  maxEntries: 32,
  ttlMs: RESUME_ANALYSIS_CACHE_TTL_MS,
});

const findRoleMeta = (roleId) => MOCK_INTERVIEW_ROLES.find((r) => r.id === roleId);

const resolveRoleInput = (roleInput) => {
  const trimmed = String(roleInput || '').trim();
  if (!trimmed) return null;

  const byId = findRoleMeta(trimmed);
  if (byId) {
    return { role: byId.id, roleLabel: byId.label };
  }

  const byLabel = MOCK_INTERVIEW_ROLES.find(
    (entry) => entry.label.toLowerCase() === trimmed.toLowerCase()
  );
  if (byLabel) {
    return { role: byLabel.id, roleLabel: byLabel.label };
  }

  return { role: trimmed.slice(0, 120), roleLabel: trimmed.slice(0, 120) };
};

const resolveDurationMinutes = (value) => {
  const minutes = Number(value);
  return [10, 15, 20].includes(minutes)
    ? minutes
    : DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES;
};

const parseOptionalCustomization = (body) => {
  const customization = {};

  const resumeText = String(body.resumeText || '').trim();
  const jobDescriptionText = String(body.jobDescriptionText || '').trim();
  const targetCompany = String(body.targetCompany || '').trim();
  const experience = String(body.experience || '').trim();

  if (resumeText) customization.resumeText = resumeText.slice(0, 15000);
  if (jobDescriptionText) customization.jobDescriptionText = jobDescriptionText.slice(0, 15000);
  if (targetCompany) customization.targetCompany = targetCompany.slice(0, 120);
  if (experience) customization.experience = experience.slice(0, 120);

  if (Array.isArray(body.resumeSkills) && body.resumeSkills.length) {
    customization.resumeSkills = body.resumeSkills
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  if (Array.isArray(body.resumeProjects) && body.resumeProjects.length) {
    customization.resumeProjects = body.resumeProjects
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  if (Array.isArray(body.focusAreas) && body.focusAreas.length) {
    customization.focusAreas = body.focusAreas
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (body.interviewMode) {
    customization.interviewMode = body.interviewMode;
  }

  const persona = String(body.interviewerPersona || '').trim();
  if (persona && INTERVIEWER_PERSONAS.includes(persona)) {
    customization.interviewerPersona = persona;
  }

  return customization;
};

const loadSessionForUser = async (sessionId, userId) => {
  const session = await MockInterviewSession.findOne({ _id: sessionId, userId });

  if (!session) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.SESSION_NOT_FOUND, 404);
  }

  return session;
};

const normalizeTranscriptTurns = (transcript) =>
  transcript
    .map((turn) => {
      const roleRaw = String(turn.role || '').toLowerCase();
      const role =
        roleRaw === 'user'
          ? 'user'
          : roleRaw === 'assistant' || roleRaw === 'bot'
            ? 'assistant'
            : 'assistant';
      return {
        role,
        content: String(turn.content || '').trim(),
      };
    })
    .filter((turn) => turn.content);

const parseJsonBodyField = (value) => {
  if (value == null) return undefined;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const estimateDurationSeconds = (transcript, durationMs, liveAudioHints) => {
  if (Number(durationMs) > 0) {
    return Number(durationMs) / 1000;
  }

  const userWords = transcript
    .filter((turn) => turn.role === 'user')
    .map((turn) => turn.content)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!userWords) return 0;

  const silenceRatio = Number(liveAudioHints?.silenceRatio);
  const speechFactor = Number.isFinite(silenceRatio) ? Math.max(0.35, 1 - silenceRatio) : 0.75;
  return Math.max(30, (userWords / 2.5) / speechFactor);
};

export const generateMockInterviewReport = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = await loadSessionForUser(sessionId, req.user._id);

    await maybeAbandonStaleSession(session);
    if (session.status === 'abandoned') {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.SESSION_ABANDONED, 400);
    }

    const voiceCallReady =
      (session.mode === 'voiceCall' || session.mode === 'live') &&
      Array.isArray(session.voiceCallTranscript) &&
      session.voiceCallTranscript.length > 0;

    const answeredEnough = session.answers.length >= session.targetQuestionCount;

    if (!voiceCallReady && !answeredEnough && session.status !== 'completed') {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.REPORT_INCOMPLETE, 400);
    }

    if (session.reportId) {
      const existing = await InterviewReport.findOne({
        _id: session.reportId,
        userId: req.user._id,
      });

      // Only serve cache when scoring logic version matches; else regenerate.
      if (existing && isCurrentScoreVersion(existing)) {
        sendResponse(res, 200, true, 'Interview report fetched.', {
          report: serializeInterviewReport(existing, session._id),
          cached: true,
        });
        return;
      }
    }

    const cachedBySource = await InterviewReport.findOne({
      userId: req.user._id,
      sourceType: 'mock_interview',
      sourceId: session._id,
    });

    if (cachedBySource && isCurrentScoreVersion(cachedBySource)) {
      session.reportId = cachedBySource._id;
      if (session.status !== 'completed') {
        session.status = 'completed';
      }
      await session.save();

      sendResponse(res, 200, true, 'Interview report fetched.', {
        report: serializeInterviewReport(cachedBySource, session._id),
        cached: true,
      });
      return;
    }

    const { report, cached } = await persistMockInterviewReport(session, req.user._id);

    sendResponse(res, cached ? 200 : 201, true, 'Interview report generated.', {
      report: serializeInterviewReport(report, session._id),
      cached,
    });
  } catch (error) {
    next(error);
  }
};

export const startLiveInterview = async (req, res, next) => {
  try {
    const resolvedRole = resolveRoleInput(req.body.role);

    if (!resolvedRole) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.ROLE_REQUIRED, 400);
    }

    // Lazily clear stale active sessions so setup revisit doesn't leave orphans.
    await abandonStaleActiveSessionsForUser(req.user._id).catch(() => 0);

    const difficulty = req.body.difficulty || 'medium';
    const durationMinutes = resolveDurationMinutes(req.body.durationMinutes);
    const targetQuestionCount = durationMinutesToQuestionCount(durationMinutes);
    const customization = parseOptionalCustomization(req.body);

    const intelligence = await prepareInterviewIntelligence({
      role: resolvedRole.role,
      roleLabel: resolvedRole.roleLabel,
      difficulty,
      durationMinutes,
      ...customization,
    });

    const questions = intelligence.questions;
    const interviewContextBrief = intelligence.interviewContextBrief;

    const session = await MockInterviewSession.create({
      userId: req.user._id,
      role: resolvedRole.role,
      roleLabel: resolvedRole.roleLabel,
      difficulty,
      mode: 'live',
      durationMinutes,
      targetQuestionCount,
      answerTimeLimitSeconds: Number(req.body.answerTimeLimitSeconds) || 180,
      status: 'active',
      currentQuestionIndex: 0,
      answers: [],
      ...customization,
      questions,
      interviewContextBrief,
    });

    const vapiAssistantId = await createVapiAssistantForSession(session);
    session.vapiAssistantId = vapiAssistantId;
    await session.save();

    sendResponse(res, 201, true, 'Live interview started.', {
      sessionId: String(session._id),
      assistantId: vapiAssistantId,
      mode: 'live',
      durationMinutes,
      roleLabel: resolvedRole.roleLabel,
      difficulty,
      interviewMode: session.interviewMode || 'video_voice',
      interviewerPersona: session.interviewerPersona || 'neutral',
      focusAreas: session.focusAreas || [],
      adaptiveDepthEnabled: ADAPTIVE_DEPTH_ENABLED,
    });
  } catch (error) {
    next(error);
  }
};

export const submitLiveInterview = async (req, res, next) => {
  try {
    const { sessionId, transcript, durationMs } = req.body;
    const session = await loadSessionForUser(sessionId, req.user._id);

    if (session.mode !== 'live') {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.NOT_LIVE_SESSION, 400);
    }

    await maybeAbandonStaleSession(session);

    if (session.status === 'abandoned') {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.SESSION_ABANDONED, 400);
    }

    // Idempotent submit: return cached report only when scoring version is current.
    if (session.status === 'completed' && session.reportId) {
      const existing = await InterviewReport.findOne({
        _id: session.reportId,
        userId: req.user._id,
      });
      if (existing && isCurrentScoreVersion(existing)) {
        logInterviewStage('submit.cached', { sessionId: String(session._id) });
        sendResponse(res, 200, true, 'Live interview submitted.', {
          report: serializeInterviewReport(existing, session._id),
          sessionId: String(session._id),
          cached: true,
        });
        return;
      }
      // Stale scoreVersion → fall through and regenerate.
    }

    if (!Array.isArray(transcript) || transcript.length === 0) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPT_REQUIRED, 400);
    }

    const normalized = normalizeTranscriptTurns(transcript);

    if (!normalized.length) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPT_EMPTY, 400);
    }

    const transcriptChars = normalized.reduce(
      (sum, turn) => sum + String(turn.content || '').length,
      0
    );
    if (transcriptChars > MAX_INTERVIEW_CONTEXT_TEXT_LENGTH) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPT_TOO_LONG, 400, {
        max: MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
      });
    }

    const submitStarted = Date.now();
    const sessionIdStr = String(session._id);

    let liveAudioHints = parseJsonBodyField(req.body.liveAudioHints);
    let liveVideoMetrics = parseJsonBodyField(req.body.liveVideoMetrics);

    // Cap oversized monitoring arrays (DoS / payload protection).
    if (liveAudioHints && typeof liveAudioHints === 'object') {
      if (Array.isArray(liveAudioHints.acousticSamples)) {
        liveAudioHints = {
          ...liveAudioHints,
          acousticSamples: liveAudioHints.acousticSamples.slice(-SUBMIT_ACOUSTIC_SAMPLES_MAX),
        };
      }
      if (Array.isArray(liveAudioHints.pauseEvents)) {
        liveAudioHints = {
          ...liveAudioHints,
          pauseEvents: liveAudioHints.pauseEvents.slice(-SUBMIT_PAUSE_EVENTS_MAX),
        };
      }
    }

    if (Array.isArray(liveVideoMetrics?.frameSamples)) {
      liveVideoMetrics = aggregateVideoFrameSamples(liveVideoMetrics.frameSamples, {
        sampleIntervalMs: liveVideoMetrics.sampleIntervalMs,
      });
    }

    const userTranscript = normalized
      .filter((turn) => turn.role === 'user')
      .map((turn) => turn.content)
      .join(' ');

    const durationSeconds = estimateDurationSeconds(
      normalized,
      durationMs,
      liveAudioHints
    );

    // Parallelize independent Groq analyses (voice fatal; speech non-fatal).
    let callVoiceMetrics;
    let callSpeechMetrics;
    let speechTimelineEvents;

    const voicePromise = userTranscript.trim()
      ? withInterviewStageTiming(
          'submit.voice',
          () =>
            analyzeVoiceFromTranscription({
              transcript: userTranscript,
              duration: durationSeconds,
              durationMs: durationMs ? Number(durationMs) : undefined,
            }),
          { sessionId: sessionIdStr }
        )
      : Promise.resolve(null);

    const speechPromise = (async () => {
      try {
        return await withInterviewStageTiming(
          'submit.speech',
          () =>
            analyzeSpeechMonitoring({
              transcript: userTranscript,
              turns: normalized,
              durationMs: durationMs ? Number(durationMs) : undefined,
              duration: durationSeconds,
              liveAudioHints,
            }),
          { sessionId: sessionIdStr }
        );
      } catch {
        // Non-fatal: voice + report can still complete.
        return null;
      }
    })();

    const [voiceResult, speechResult] = await Promise.all([voicePromise, speechPromise]);

    callVoiceMetrics = voiceResult;
    if (callVoiceMetrics && liveAudioHints?.silenceRatio != null && !callVoiceMetrics.pauseRatio) {
      callVoiceMetrics.pauseRatio = Number(liveAudioHints.silenceRatio);
    }
    if (speechResult) {
      callSpeechMetrics = speechResult.metrics;
      speechTimelineEvents = speechResult.timelineEvents;
    }

    const timelineEvents = Array.isArray(liveVideoMetrics?.timelineEvents)
      ? liveVideoMetrics.timelineEvents.slice(0, PERSIST_TIMELINE_EVENTS_MAX)
      : undefined;

    const callVideoMetrics = liveVideoMetrics
      ? {
          eyeContactPercent: liveVideoMetrics.eyeContactPercent,
          expressionBreakdown: liveVideoMetrics.expressionBreakdown,
          engagementScore: liveVideoMetrics.engagementScore,
          attentionScore: liveVideoMetrics.attentionScore,
          timeline: liveVideoMetrics.timeline,
          feedbackText: buildVideoFeedbackText(liveVideoMetrics),
          behavioralMetrics: liveVideoMetrics.behavioralMetrics,
          timelineEvents,
        }
      : undefined;

    // Persist compact audio hints — drop raw acousticSamples after analysis.
    const callLiveAudioHints = liveAudioHints
      ? {
          averageVolume: liveAudioHints.averageVolume,
          silenceRatio: liveAudioHints.silenceRatio,
          longPauseCount: liveAudioHints.longPauseCount,
          sampleIntervalMs: liveAudioHints.sampleIntervalMs,
          pauseEvents: Array.isArray(liveAudioHints.pauseEvents)
            ? liveAudioHints.pauseEvents.slice(0, PERSIST_PAUSE_EVENTS_MAX)
            : undefined,
        }
      : undefined;

    session.voiceCallTranscript = normalized;
    session.callLiveAudioHints = callLiveAudioHints;
    // Omit callLiveVideoMetrics — callVideoMetrics already holds report-ready aggregates.
    session.callVoiceMetrics = callVoiceMetrics;
    session.callVideoMetrics = callVideoMetrics;
    session.callSpeechMetrics = callSpeechMetrics;
    session.speechTimelineEvents = Array.isArray(speechTimelineEvents)
      ? speechTimelineEvents.slice(0, PERSIST_TIMELINE_EVENTS_MAX)
      : speechTimelineEvents;
    session.callDurationMs = durationMs ? Number(durationMs) : undefined;

    const metricsFlagReasons = evaluateClientMetricsAnomalies({
      durationMs: session.callDurationMs,
      questionCount: (session.questions || []).length || session.targetQuestionCount || 0,
      liveAudioHints,
      liveVideoMetrics,
      callVideoMetrics,
    });

    if (metricsFlagReasons.length) {
      console.warn(
        `[interview-submit] metrics anomalies sessionId=${sessionIdStr}:`,
        metricsFlagReasons.join('; ')
      );
    }

    // Persist metrics before report so a report failure still keeps monitoring data.
    await withInterviewStageTiming('submit.saveMetrics', () => session.save(), {
      sessionId: sessionIdStr,
    });

    const { report, cached } = await withInterviewStageTiming(
      'submit.report',
      () =>
        persistMockInterviewReport(session, req.user._id, {
          metricsFlagReasons,
        }),
      { sessionId: sessionIdStr }
    );

    logInterviewStage('submit.complete', {
      sessionId: sessionIdStr,
      cached,
      durationMs: Date.now() - submitStarted,
      acousticSamples: Array.isArray(liveAudioHints?.acousticSamples)
        ? liveAudioHints.acousticSamples.length
        : 0,
    });

    sendResponse(res, cached ? 200 : 201, true, 'Live interview submitted.', {
      report: serializeInterviewReport(report, session._id),
      sessionId: sessionIdStr,
      cached,
    });
  } catch (error) {
    next(error);
  }
};

export const getMockInterviewSession = async (req, res, next) => {
  try {
    let session = await loadSessionForUser(req.params.sessionId, req.user._id);
    session = await maybeAbandonStaleSession(session);

    // Live sessions bake the prompt into a server-side Vapi assistant — do not
    // expose question texts that would let the client reconstruct the system prompt.
    const hideQuestions = session.mode === 'live';
    // Live clients only need call metadata; omit large PII blobs from the wire.
    const includeCustomizationText = !hideQuestions;

    sendResponse(res, 200, true, 'Session fetched.', {
      session: {
        sessionId: String(session._id),
        role: session.role,
        roleLabel: session.roleLabel,
        difficulty: session.difficulty,
        mode: session.mode || 'standard',
        status: session.status,
        durationMinutes: session.durationMinutes,
        targetQuestionCount: session.targetQuestionCount,
        assistantId: session.vapiAssistantId || null,
        adaptiveDepthEnabled: ADAPTIVE_DEPTH_ENABLED,
        resumeText: includeCustomizationText ? session.resumeText : undefined,
        jobDescriptionText: includeCustomizationText
          ? session.jobDescriptionText
          : undefined,
        targetCompany: session.targetCompany,
        experience: session.experience,
        resumeSkills: session.resumeSkills,
        resumeProjects: includeCustomizationText ? session.resumeProjects : undefined,
        focusAreas: session.focusAreas,
        interviewMode: session.interviewMode,
        interviewerPersona: session.interviewerPersona || 'neutral',
        answerTimeLimitSeconds: session.answerTimeLimitSeconds,
        currentQuestionIndex: session.currentQuestionIndex,
        questions: hideQuestions
          ? []
          : session.questions.map((q) => ({
              questionId: q.questionId,
              text: q.text,
              order: q.order,
            })),
        questionTexts: hideQuestions ? [] : session.questions.map((q) => q.text),
        answers: hideQuestions
          ? []
          : session.answers.map((a) => ({
              questionId: a.questionId,
              transcript: a.transcript,
              voiceMetrics: a.voiceMetrics,
              videoMetrics: a.videoMetrics,
              durationMs: a.durationMs,
              submittedAt: a.submittedAt,
            })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mid-call adaptive depthHint nudge. Updates next guide item when enabled;
 * returns a system-message string the client can send to Vapi.
 * Never regenerates the question guide. Safe no-op when flag is off.
 */
export const applyLiveAdaptiveDepth = async (req, res, next) => {
  try {
    const session = await loadSessionForUser(req.body.sessionId, req.user._id);

    if (session.mode !== 'live') {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.NOT_LIVE_SESSION, 400);
    }

    if (session.status === 'abandoned') {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.SESSION_ABANDONED, 400);
    }

    if (!ADAPTIVE_DEPTH_ENABLED) {
      sendResponse(res, 200, true, 'Adaptive depth disabled.', {
        adjusted: false,
        adaptiveDepthEnabled: false,
      });
      return;
    }

    const answerText = String(req.body.answerText || '').trim();
    const questionText = String(req.body.questionText || '').trim();
    const answeredCount = Math.max(0, Number(req.body.answeredCount) || 0);
    const priorStrengths = Array.isArray(req.body.priorStrengths)
      ? req.body.priorStrengths.map(String).slice(-2)
      : [];

    const { classification, strength } = evaluateAnswerForAdaptiveDepth(
      answerText,
      questionText
    );
    const lastStrengths = [...priorStrengths, strength].slice(-2);

    const { questions, adjustment } = applyAdaptiveDepthToQuestions(session.questions, {
      answeredCount,
      lastStrengths,
      enabled: true,
    });

    if (adjustment) {
      session.questions = questions;
      session.currentQuestionIndex = Math.min(
        answeredCount,
        Math.max(0, (session.questions || []).length - 1)
      );
      await session.save();
    }

    const systemNudge = buildAdaptiveDepthSystemNudge(adjustment);

    sendResponse(res, 200, true, 'Adaptive depth evaluated.', {
      adjusted: Boolean(adjustment),
      adaptiveDepthEnabled: true,
      classification,
      strength,
      adjustment,
      systemNudge,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewReportHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 24);

    const reports = await InterviewReport.find({
      userId: req.user._id,
      sourceType: 'mock_interview',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        'overallScore createdAt sourceId sections.videoAnalysis.eyeContactPercent sections.voiceAnalysis.wpm sections.voiceAnalysis.fillerWords'
      )
      .lean();

    const history = reports
      .map((report) => ({
        sessionId: String(report.sourceId),
        overallScore: report.overallScore,
        eyeContactPercent: report.sections?.videoAnalysis?.eyeContactPercent ?? null,
        wpm: report.sections?.voiceAnalysis?.wpm ?? null,
        fillerWords: report.sections?.voiceAnalysis?.fillerWords ?? null,
        createdAt: report.createdAt,
      }))
      .reverse();

    sendResponse(res, 200, true, 'Interview report history.', { history });
  } catch (error) {
    next(error);
  }
};

export const getRoleSuggestions = async (req, res, next) => {
  try {
    const query = String(req.body.query || '').trim();

    if (!query) {
      sendResponse(res, 200, true, 'Role suggestions.', { suggestions: [] });
      return;
    }

    const cacheKey = query.toLowerCase();
    const cached = roleSuggestionsCache.get(cacheKey);
    if (cached) {
      sendResponse(res, 200, true, 'Role suggestions.', {
        suggestions: cached,
        cached: true,
      });
      return;
    }

    const suggestions = await fetchRoleSuggestionsWithGroq(query);
    roleSuggestionsCache.set(cacheKey, suggestions);

    sendResponse(res, 200, true, 'Role suggestions.', {
      suggestions,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeInterviewResume = async (req, res, next) => {
  try {
    let text = String(req.body?.text || '').trim();

    if (!text && req.file) {
      text = await extractResumeTextFromFile(req.file);
    }

    text = String(text || '').slice(0, 15000).trim();

    if (!text) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.RESUME_INPUT_REQUIRED, 400);
    }

    const cacheKey = createHash('sha256').update(text).digest('hex');
    const cached = resumeAnalysisCache.get(cacheKey);
    if (cached) {
      sendResponse(res, 200, true, 'Resume analyzed.', {
        text,
        skills: cached.skills,
        projects: cached.projects,
        summary: cached.summary,
        cached: true,
      });
      return;
    }

    const analysis = await analyzeResumeForInterview(text);
    resumeAnalysisCache.set(cacheKey, {
      skills: analysis.skills,
      projects: analysis.projects,
      summary: analysis.summary,
    });

    sendResponse(res, 200, true, 'Resume analyzed.', {
      text,
      skills: analysis.skills,
      projects: analysis.projects,
      summary: analysis.summary,
      cached: false,
    });
  } catch (error) {
    next(error);
  }
};
