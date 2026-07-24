import MockInterviewSession from '../models/MockInterviewSession.js';
import InterviewReport from '../models/InterviewReport.js';
import {
  DEFAULT_MOCK_QUESTION_COUNT,
  MOCK_INTERVIEW_ROLES,
} from '../constants/interviewPrepConstants.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { transcribeAudioWithGroq } from '../utils/groqWhisperService.js';
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
import {
  generateFollowUpQuestion,
  generateOpeningQuestion,
  generateVoiceCallQuestionSet,
} from '../utils/mockInterviewGroqService.js';

const findRoleMeta = (roleId) => MOCK_INTERVIEW_ROLES.find((r) => r.id === roleId);

const loadSessionForUser = async (sessionId, userId) => {
  const session = await MockInterviewSession.findOne({ _id: sessionId, userId });

  if (!session) {
    throw new AppError('Interview session not found.', 404);
  }

  return session;
};

const getCurrentQuestion = (session) => {
  const index = session.currentQuestionIndex;
  return session.questions[index] || null;
};

const buildPriorQa = (session) =>
  session.questions.map((q, index) => ({
    question: q.text,
    answer: session.answers[index]?.transcript || '',
  }));

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

const serializeQuestion = (session, question) => ({
  sessionId: String(session._id),
  questionId: question.questionId,
  text: question.text,
  questionIndex: question.order,
  totalQuestions: session.targetQuestionCount,
  answerTimeLimitSeconds: session.answerTimeLimitSeconds,
  status: session.status,
  mode: session.mode || 'standard',
});

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

export const startMockInterview = async (req, res, next) => {
  try {
    const role = req.body.role;
    const meta = findRoleMeta(role);

    if (!meta) {
      throw new AppError('Invalid role.', 400);
    }

    const difficulty = req.body.difficulty || 'medium';
    const targetQuestionCount =
      Number(req.body.targetQuestionCount) || DEFAULT_MOCK_QUESTION_COUNT;
    const answerTimeLimitSeconds = Number(req.body.answerTimeLimitSeconds) || 180;

    const openingText = await generateOpeningQuestion({
      roleLabel: meta.label,
      difficulty,
    });

    const firstQuestion = {
      questionId: 'q1',
      text: openingText,
      order: 0,
    };

    const session = await MockInterviewSession.create({
      userId: req.user._id,
      role,
      roleLabel: meta.label,
      difficulty,
      targetQuestionCount,
      answerTimeLimitSeconds,
      status: 'active',
      currentQuestionIndex: 0,
      questions: [firstQuestion],
      answers: [],
    });

    sendResponse(res, 201, true, 'Interview started.', {
      session: serializeQuestion(session, firstQuestion),
    });
  } catch (error) {
    next(error);
  }
};

export const submitMockInterviewAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionId, durationMs } = req.body;
    const session = await loadSessionForUser(sessionId, req.user._id);

    if (session.status === 'completed') {
      throw new AppError('This interview is already completed.', 400);
    }

    if (session.status !== 'active') {
      throw new AppError('Interview is not active.', 400);
    }

    const current = getCurrentQuestion(session);

    if (!current || current.questionId !== questionId) {
      throw new AppError('Submitted question does not match the current question.', 400);
    }

    if (session.answers.some((a) => a.questionId === questionId)) {
      throw new AppError('This question was already answered.', 400);
    }

    if (!req.file?.buffer) {
      throw new AppError('Audio recording is required.', 400);
    }

    const transcription = await transcribeAudioWithGroq(
      req.file.buffer,
      req.file.originalname || 'answer.webm',
      req.file.mimetype
    );

    const { text: transcript, duration, segments } = transcription;

    let liveAudioHints;
    let liveVideoMetrics;

    if (req.body.liveAudioHints) {
      try {
        liveAudioHints =
          typeof req.body.liveAudioHints === 'string'
            ? JSON.parse(req.body.liveAudioHints)
            : req.body.liveAudioHints;
      } catch {
        liveAudioHints = undefined;
      }
    }

    if (req.body.liveVideoMetrics) {
      try {
        const parsed =
          typeof req.body.liveVideoMetrics === 'string'
            ? JSON.parse(req.body.liveVideoMetrics)
            : req.body.liveVideoMetrics;

        if (Array.isArray(parsed?.frameSamples)) {
          liveVideoMetrics = aggregateVideoFrameSamples(parsed.frameSamples);
        } else {
          liveVideoMetrics = parsed;
        }
      } catch {
        liveVideoMetrics = undefined;
      }
    }

    const voiceMetrics = await analyzeVoiceFromTranscription({
      transcript,
      duration,
      segments,
      durationMs: durationMs ? Number(durationMs) : undefined,
    });

    const videoMetrics = liveVideoMetrics
      ? {
          eyeContactPercent: liveVideoMetrics.eyeContactPercent,
          expressionBreakdown: liveVideoMetrics.expressionBreakdown,
          engagementScore: liveVideoMetrics.engagementScore,
          timeline: liveVideoMetrics.timeline,
          feedbackText: buildVideoFeedbackText(liveVideoMetrics),
        }
      : undefined;

    session.answers.push({
      questionId,
      transcript,
      voiceMetrics,
      videoMetrics,
      liveVideoMetrics,
      liveAudioHints,
      durationMs: durationMs ? Number(durationMs) : undefined,
      submittedAt: new Date(),
    });

    const answeredCount = session.answers.length;
    const isLast = answeredCount >= session.targetQuestionCount;

    if (isLast) {
      session.status = 'completed';
    }

    await session.save();

    sendResponse(res, 200, true, 'Answer submitted.', {
      sessionId: session._id,
      questionId,
      transcript,
      voiceMetrics,
      videoMetrics,
      answeredCount,
      totalQuestions: session.targetQuestionCount,
      completed: isLast,
    });
  } catch (error) {
    next(error);
  }
};

export const nextMockInterviewQuestion = async (req, res, next) => {
  try {
    const { sessionId, previousAnswerTranscript } = req.body;
    const session = await loadSessionForUser(sessionId, req.user._id);

    if (session.status === 'completed') {
      sendResponse(res, 200, true, 'Interview completed.', {
        sessionId: session._id,
        completed: true,
        status: session.status,
      });
      return;
    }

    const answeredCount = session.answers.length;

    if (answeredCount >= session.targetQuestionCount) {
      session.status = 'completed';
      await session.save();

      sendResponse(res, 200, true, 'Interview completed.', {
        sessionId: session._id,
        completed: true,
        status: session.status,
      });
      return;
    }

    if (answeredCount !== session.questions.length) {
      throw new AppError('Submit an answer for the current question first.', 400);
    }

    const lastAnswer = session.answers[session.answers.length - 1];

    if (previousAnswerTranscript?.trim() && lastAnswer) {
      lastAnswer.transcript = previousAnswerTranscript.trim();
      await session.save();
    }

    const nextOrder = session.questions.length;
    const nextId = `q${nextOrder + 1}`;

    const priorQa = buildPriorQa(session);

    const followUpText = await generateFollowUpQuestion({
      roleLabel: session.roleLabel || session.role,
      difficulty: session.difficulty,
      questionNumber: nextOrder + 1,
      totalQuestions: session.targetQuestionCount,
      priorQa,
    });

    const nextQuestion = {
      questionId: nextId,
      text: followUpText,
      order: nextOrder,
    };

    session.questions.push(nextQuestion);
    session.currentQuestionIndex = nextOrder;
    await session.save();

    sendResponse(res, 200, true, 'Next question ready.', {
      session: serializeQuestion(session, nextQuestion),
      completed: false,
    });
  } catch (error) {
    next(error);
  }
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
    const role = req.body.role;
    const meta = findRoleMeta(role);

    if (!meta) {
      throw new AppError('Invalid role.', 400);
    }

    const difficulty = req.body.difficulty || 'medium';
    const targetQuestionCount =
      Number(req.body.targetQuestionCount) || DEFAULT_MOCK_QUESTION_COUNT;

    const questionTexts = await generateVoiceCallQuestionSet({
      roleLabel: meta.label,
      difficulty,
      targetQuestionCount,
    });

    const questions = questionTexts.map((text, order) => ({
      questionId: `q${order + 1}`,
      text,
      order,
    }));

    const session = await MockInterviewSession.create({
      userId: req.user._id,
      role,
      roleLabel: meta.label,
      difficulty,
      mode: 'live',
      targetQuestionCount: questions.length,
      answerTimeLimitSeconds: Number(req.body.answerTimeLimitSeconds) || 180,
      status: 'active',
      currentQuestionIndex: 0,
      questions,
      answers: [],
    });

    sendResponse(res, 201, true, 'Live interview started.', {
      sessionId: String(session._id),
      questions: questionTexts,
      mode: 'live',
    });
  } catch (error) {
    next(error);
  }
};

export const startVoiceCallInterview = async (req, res, next) => {
  try {
    const role = req.body.role;
    const meta = findRoleMeta(role);

    if (!meta) {
      throw new AppError('Invalid role.', 400);
    }

    const difficulty = req.body.difficulty || 'medium';
    const targetQuestionCount =
      Number(req.body.targetQuestionCount) || DEFAULT_MOCK_QUESTION_COUNT;

    const questionTexts = await generateVoiceCallQuestionSet({
      roleLabel: meta.label,
      difficulty,
      targetQuestionCount,
    });

    const questions = questionTexts.map((text, order) => ({
      questionId: `q${order + 1}`,
      text,
      order,
    }));

    const session = await MockInterviewSession.create({
      userId: req.user._id,
      role,
      roleLabel: meta.label,
      difficulty,
      mode: 'voiceCall',
      targetQuestionCount: questions.length,
      answerTimeLimitSeconds: Number(req.body.answerTimeLimitSeconds) || 180,
      status: 'active',
      currentQuestionIndex: 0,
      questions,
      answers: [],
    });

    sendResponse(res, 201, true, 'Voice call interview started.', {
      sessionId: String(session._id),
      questions: questionTexts,
      mode: 'voiceCall',
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

export const submitVoiceCallTranscript = async (req, res, next) => {
  try {
    const { sessionId, transcript } = req.body;
    const session = await loadSessionForUser(sessionId, req.user._id);

    if (session.mode !== 'voiceCall') {
      throw new AppError('This session is not a voice call interview.', 400);
    }

    if (!Array.isArray(transcript) || transcript.length === 0) {
      throw new AppError('Transcript is required.', 400);
    }

    const normalized = normalizeTranscriptTurns(transcript);

    if (!normalized.length) {
      throw new AppError('Transcript has no usable content.', 400);
    }

    session.voiceCallTranscript = normalized;
    await session.save();

    const { report, cached } = await persistMockInterviewReport(session, req.user._id);

    sendResponse(res, cached ? 200 : 201, true, 'Voice call interview submitted.', {
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
        targetQuestionCount: session.targetQuestionCount,
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
