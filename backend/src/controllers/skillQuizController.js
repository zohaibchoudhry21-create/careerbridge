import SkillQuiz from '../models/SkillQuiz.js';
import {
  DEFAULT_SKILL_QUIZ_QUESTION_COUNT,
  SKILL_ASSESSMENT_TOPICS,
} from '../constants/interviewPrepConstants.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { generateSkillQuizWithGroq } from '../utils/skillQuizGroqService.js';
import { serializeSkillQuizForClient } from '../utils/skillQuizSerializer.js';
import {
  buildReviewList,
  computeWeakAreas,
  scoreSkillQuiz,
} from '../utils/skillQuizScoring.js';

const findTopicMeta = (topicId) => SKILL_ASSESSMENT_TOPICS.find((t) => t.id === topicId);

const loadQuizForUser = async (quizId, userId) => {
  const quiz = await SkillQuiz.findOne({ _id: quizId, userId });

  if (!quiz) {
    throw new AppError('Quiz not found.', 404);
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
    const topic = req.body.topic;
    const meta = findTopicMeta(topic);

    if (!meta) {
      throw new AppError('Invalid topic.', 400);
    }

    const difficulty = req.body.difficulty || 'medium';
    const questionCount = Number(req.body.questionCount) || DEFAULT_SKILL_QUIZ_QUESTION_COUNT;

    const questions = await generateSkillQuizWithGroq({
      topicLabel: meta.label,
      difficulty,
      questionCount,
    });

    const quiz = await SkillQuiz.create({
      userId: req.user._id,
      topic,
      topicLabel: meta.label,
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
      throw new AppError('This quiz has already been submitted.', 400);
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
      throw new AppError('This quiz has already been submitted.', 400);
    }

    const questionIds = new Set(quiz.questions.map((q) => q.questionId));

    for (const answer of answers) {
      if (!questionIds.has(answer.questionId)) {
        throw new AppError('Invalid answer for unknown question.', 400);
      }
    }

    if (answers.length !== quiz.questions.length) {
      throw new AppError('Please answer every question before submitting.', 400);
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
