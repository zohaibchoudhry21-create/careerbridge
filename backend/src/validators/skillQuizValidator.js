import { body, param } from 'express-validator';
import {
  MOCK_INTERVIEW_DIFFICULTIES,
  MIN_SKILL_QUIZ_QUESTIONS,
  MAX_SKILL_QUIZ_QUESTIONS,
  SKILL_ASSESSMENT_TOPICS,
} from '../constants/interviewPrepConstants.js';

const topicIds = SKILL_ASSESSMENT_TOPICS.map((t) => t.id);

export const generateQuizValidation = [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Topic is required')
    .isIn(topicIds)
    .withMessage('Invalid topic'),
  body('difficulty')
    .optional()
    .isIn(MOCK_INTERVIEW_DIFFICULTIES)
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('questionCount')
    .optional()
    .isInt({ min: MIN_SKILL_QUIZ_QUESTIONS, max: MAX_SKILL_QUIZ_QUESTIONS })
    .withMessage(`Question count must be between ${MIN_SKILL_QUIZ_QUESTIONS} and ${MAX_SKILL_QUIZ_QUESTIONS}`),
];

export const submitQuizValidation = [
  body('quizId').isMongoId().withMessage('Valid quiz id is required'),
  body('answers').isArray({ min: 1 }).withMessage('Answers are required'),
  body('answers.*.questionId').trim().notEmpty().withMessage('Each answer needs a questionId'),
  body('answers.*.selectedIndex')
    .isInt({ min: 0, max: 5 })
    .withMessage('selectedIndex must be a valid option index'),
];

export const quizIdParamValidation = [
  param('quizId').isMongoId().withMessage('Invalid quiz id'),
];
