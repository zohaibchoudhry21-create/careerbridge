import MockInterviewSession from '../models/MockInterviewSession.js';
import InterviewReport from '../models/InterviewReport.js';
import {
  DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES,
  INTERVIEWER_PERSONAS,
  MOCK_INTERVIEW_ROLES,
  durationMinutesToQuestionCount,
} from '../constants/interviewPrepConstants.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { analyzeVoiceFromTranscription } from '../utils/voiceAnalysisService.js';
import {
  aggregateVideoFrameSamples,
  buildVideoFeedbackText,
} from '../utils/videoAnalysisMetrics.js';
import {
  buildMockInterviewSnapshot,
  mergeReportWithSummary,
} from '../utils/mockInterviewReportBuilder.js';
import { generateMockInterviewReportWithGroq } from '../utils/mockInterviewReportGroqService.js';
import { serializeInterviewReport } from '../utils/interviewReportSerializer.js';
import { generateOpeningQuestion } from '../utils/mockInterviewGroqService.js';
import { fetchRoleSuggestionsWithGroq } from '../utils/roleSuggestionsGroqService.js';
import { analyzeResumeForInterview } from '../utils/interviewResumeAnalysisGroqService.js';
import { extractResumeTextFromFile } from '../utils/resumeFileExtractor.js';

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
    throw new AppError('Interview session not found.', 404);
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

const persistMockInterviewReport = async (session, userId) => {
  if (session.reportId) {
    const existing = await InterviewReport.findOne({
      _id: session.reportId,
      userId,
    });
    if (existing) {
      return { report: existing, cached: true };
    }
  }

  const cachedBySource = await InterviewReport.findOne({
    userId,
    sourceType: 'mock_interview',
    sourceId: session._id,
  });

  if (cachedBySource) {
    session.reportId = cachedBySource._id;
    session.status = 'completed';
    await session.save();
    return { report: cachedBySource, cached: true };
  }

  const snapshot = buildMockInterviewSnapshot(session);
  const aiReport = await generateMockInterviewReportWithGroq(snapshot);
  const merged = mergeReportWithSummary(aiReport, snapshot.summary);

  const report = await InterviewReport.create({
    userId,
    sourceType: 'mock_interview',
    sourceId: session._id,
    overallScore: merged.overallScore,
    sections: merged.sections,
    strengths: merged.strengths,
    improvementAreas: merged.improvementAreas,
    recommendedNextSteps: merged.recommendedNextSteps,
    rawMetricsSnapshot: snapshot,
  });

  session.reportId = report._id;
  session.status = 'completed';
  await session.save();

  return { report, cached: false };
};

export const generateMockInterviewReport = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = await loadSessionForUser(sessionId, req.user._id);

    const voiceCallReady =
      (session.mode === 'voiceCall' || session.mode === 'live') &&
      Array.isArray(session.voiceCallTranscript) &&
      session.voiceCallTranscript.length > 0;

    const answeredEnough = session.answers.length >= session.targetQuestionCount;

    if (!voiceCallReady && !answeredEnough && session.status !== 'completed') {
      throw new AppError('Complete the interview before generating a report.', 400);
    }

    if (session.reportId) {
      const existing = await InterviewReport.findOne({
        _id: session.reportId,
        userId: req.user._id,
      });

      if (existing) {
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

    if (cachedBySource) {
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
      throw new AppError('Role is required.', 400);
    }

    const difficulty = req.body.difficulty || 'medium';
    const durationMinutes = resolveDurationMinutes(req.body.durationMinutes);
    const targetQuestionCount = durationMinutesToQuestionCount(durationMinutes);
    const customization = parseOptionalCustomization(req.body);

    const openingText = await generateOpeningQuestion({
      roleLabel: resolvedRole.roleLabel,
      difficulty,
      experience: customization.experience,
      resumeSkills: customization.resumeSkills,
      resumeProjects: customization.resumeProjects,
      targetCompany: customization.targetCompany,
      focusAreas: customization.focusAreas,
    });

    const questions = [
      {
        questionId: 'q1',
        text: openingText,
        order: 0,
      },
    ];

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
      questions,
      answers: [],
      ...customization,
    });

    sendResponse(res, 201, true, 'Live interview started.', {
      sessionId: String(session._id),
      questions: [openingText],
      mode: 'live',
      durationMinutes,
      roleLabel: resolvedRole.roleLabel,
      difficulty,
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
      throw new AppError('This session is not a live interview.', 400);
    }

    if (!Array.isArray(transcript) || transcript.length === 0) {
      throw new AppError('Transcript is required.', 400);
    }

    const normalized = normalizeTranscriptTurns(transcript);

    if (!normalized.length) {
      throw new AppError('Transcript has no usable content.', 400);
    }

    const liveAudioHints = parseJsonBodyField(req.body.liveAudioHints);
    let liveVideoMetrics = parseJsonBodyField(req.body.liveVideoMetrics);

    if (Array.isArray(liveVideoMetrics?.frameSamples)) {
      liveVideoMetrics = aggregateVideoFrameSamples(liveVideoMetrics.frameSamples);
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

    let callVoiceMetrics;
    if (userTranscript.trim()) {
      callVoiceMetrics = await analyzeVoiceFromTranscription({
        transcript: userTranscript,
        duration: durationSeconds,
        durationMs: durationMs ? Number(durationMs) : undefined,
      });

      if (liveAudioHints?.silenceRatio != null && !callVoiceMetrics.pauseRatio) {
        callVoiceMetrics.pauseRatio = Number(liveAudioHints.silenceRatio);
      }
    }

    const callVideoMetrics = liveVideoMetrics
      ? {
          eyeContactPercent: liveVideoMetrics.eyeContactPercent,
          expressionBreakdown: liveVideoMetrics.expressionBreakdown,
          engagementScore: liveVideoMetrics.engagementScore,
          timeline: liveVideoMetrics.timeline,
          feedbackText: buildVideoFeedbackText(liveVideoMetrics),
        }
      : undefined;

    session.voiceCallTranscript = normalized;
    session.callLiveAudioHints = liveAudioHints;
    session.callLiveVideoMetrics = liveVideoMetrics;
    session.callVoiceMetrics = callVoiceMetrics;
    session.callVideoMetrics = callVideoMetrics;
    session.callDurationMs = durationMs ? Number(durationMs) : undefined;
    await session.save();

    const { report, cached } = await persistMockInterviewReport(session, req.user._id);

    sendResponse(res, cached ? 200 : 201, true, 'Live interview submitted.', {
      report: serializeInterviewReport(report, session._id),
      sessionId: String(session._id),
      cached,
    });
  } catch (error) {
    next(error);
  }
};

export const getMockInterviewSession = async (req, res, next) => {
  try {
    const session = await loadSessionForUser(req.params.sessionId, req.user._id);

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
        resumeText: session.resumeText,
        jobDescriptionText: session.jobDescriptionText,
        targetCompany: session.targetCompany,
        experience: session.experience,
        resumeSkills: session.resumeSkills,
        resumeProjects: session.resumeProjects,
        focusAreas: session.focusAreas,
        interviewMode: session.interviewMode,
        interviewerPersona: session.interviewerPersona || 'neutral',
        answerTimeLimitSeconds: session.answerTimeLimitSeconds,
        currentQuestionIndex: session.currentQuestionIndex,
        questions: session.questions.map((q) => ({
          questionId: q.questionId,
          text: q.text,
          order: q.order,
        })),
        questionTexts: session.questions.map((q) => q.text),
        answers: session.answers.map((a) => ({
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

export const getInterviewReportHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 24);

    const reports = await InterviewReport.find({
      userId: req.user._id,
      sourceType: 'mock_interview',
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('overallScore sections createdAt sourceId')
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

    const suggestions = await fetchRoleSuggestionsWithGroq(query);

    sendResponse(res, 200, true, 'Role suggestions.', { suggestions });
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
      throw new AppError('Upload a resume file or provide resume text.', 400);
    }

    const analysis = await analyzeResumeForInterview(text);

    sendResponse(res, 200, true, 'Resume analyzed.', {
      text,
      skills: analysis.skills,
      projects: analysis.projects,
      summary: analysis.summary,
    });
  } catch (error) {
    next(error);
  }
};
