import SkillQuiz from '../models/SkillQuiz.js';
import {
  DEFAULT_SKILL_QUIZ_QUESTION_COUNT,
  MAX_SKILL_QUIZ_QUESTIONS,
  MIN_SKILL_QUIZ_QUESTIONS,
  SKILL_ASSESSMENT_TOPICS,
} from '../constants/interviewPrepConstants.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { generateSkillQuizWithGroq } from '../utils/skillQuizGroqService.js';
import { serializeSkillQuizForClient } from '../utils/skillQuizSerializer.js';
import {
  buildReviewList,
  computeWeakAreas,
  scoreSkillQuiz,
} from '../utils/skillQuizScoring.js';

const findTopicMeta = (topicId) => SKILL_ASSESSMENT_TOPICS.find((t) => t.id === topicId);

const resolveTopicFields = (rawTopic) => {
  const trimmed = String(rawTopic || '').trim();
  const meta = findTopicMeta(trimmed);

  if (meta) {
    return { topic: meta.id, topicLabel: meta.label };
  }

  return { topic: trimmed, topicLabel: trimmed };
};

const resolveQuestionCount = (body) => {
  const rawCount = body.length ?? body.questionCount;
  const questionCount = Number(rawCount);

  if (
    Number.isInteger(questionCount) &&
    questionCount >= MIN_SKILL_QUIZ_QUESTIONS &&
    questionCount <= MAX_SKILL_QUIZ_QUESTIONS
  ) {
    return questionCount;
  }

  return DEFAULT_SKILL_QUIZ_QUESTION_COUNT;
};

const loadQuizForUser = async (quizId, userId) => {
  const quiz = await SkillQuiz.findOne({ _id: quizId, userId });

  if (!quiz) {
    throw new AppError(ERROR_CODES.INTERVIEW_PREP.QUIZ_NOT_FOUND, 404);
  }

  return quiz;
};

export const listSkillTopics = async (_req, res, next) => {
  try {
    sendResponse(res, 200, true, 'Skill topics fetched successfully.', {
      topics: SKILL_ASSESSMENT_TOPICS,
    });
  } catch (error) {
    next(error);
  }
};

export const generateSkillQuiz = async (req, res, next) => {
  try {
    const { topic: storedTopic, topicLabel } = resolveTopicFields(req.body.topic);
    const difficulty = req.body.difficulty || 'medium';
    const questionCount = resolveQuestionCount(req.body);

    const questions = await generateSkillQuizWithGroq({
      topicLabel,
      difficulty,
      questionCount,
    });

    const quiz = await SkillQuiz.create({
      userId: req.user._id,
      topic: storedTopic,
      topicLabel,
      difficulty,
      questionCount: questions.length,
      status: 'in_progress',
      questions,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    sendResponse(res, 201, true, 'Quiz generated successfully.', {
      quiz: serializeSkillQuizForClient(quiz),
    });
  } catch (error) {
    next(error);
  }
};

export const getSkillQuiz = async (req, res, next) => {
  try {
    const quiz = await loadQuizForUser(req.params.quizId, req.user._id);

    if (quiz.status === 'submitted') {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.QUIZ_ALREADY_SUBMITTED, 400);
    }

    sendResponse(res, 200, true, 'Quiz fetched successfully.', {
      quiz: serializeSkillQuizForClient(quiz),
    });
  } catch (error) {
    next(error);
  }
};

export const submitSkillQuiz = async (req, res, next) => {
  try {
    const { quizId, answers } = req.body;
    const quiz = await loadQuizForUser(quizId, req.user._id);

    if (quiz.status === 'submitted') {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.QUIZ_ALREADY_SUBMITTED, 400);
    }

    const questionIds = new Set(quiz.questions.map((q) => q.questionId));

    for (const answer of answers) {
      if (!questionIds.has(answer.questionId)) {
        throw new AppError(ERROR_CODES.INTERVIEW_PREP.INVALID_ANSWER, 400);
      }
    }

    if (answers.length !== quiz.questions.length) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.INCOMPLETE_ANSWERS, 400);
    }

    const { score, total, percentage, perQuestion } = scoreSkillQuiz(quiz.questions, answers);
    const weakAreas = computeWeakAreas(perQuestion);
    const reviewList = buildReviewList(perQuestion);

    const scoredResult = {
      score,
      total,
      percentage,
      weakAreas,
      reviewList,
    };

    quiz.answers = answers.map((a) => ({
      questionId: a.questionId,
      selectedIndex: Number(a.selectedIndex),
    }));
    quiz.scoredResult = scoredResult;
    quiz.status = 'submitted';
    quiz.expiresAt = undefined;

    await quiz.save();

    sendResponse(res, 200, true, 'Quiz submitted successfully.', {
      quizId: quiz._id,
      score,
      total,
      percentage,
      weakAreas,
      reviewList,
    });
  } catch (error) {
    next(error);
  }
};
