import { body, param } from 'express-validator';
import {
  MOCK_INTERVIEW_DIFFICULTIES,
  MIN_SKILL_QUIZ_QUESTIONS,
  MAX_SKILL_QUIZ_QUESTIONS,
} from '../constants/interviewPrepConstants.js';
import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';

const questionCountRule = body('questionCount')
  .optional()
  .isInt({ min: MIN_SKILL_QUIZ_QUESTIONS, max: MAX_SKILL_QUIZ_QUESTIONS })
  .withMessage(
    formatValidationCode(ERROR_CODES.INTERVIEW_PREP.QUESTION_COUNT_INVALID, {
      min: MIN_SKILL_QUIZ_QUESTIONS,
      max: MAX_SKILL_QUIZ_QUESTIONS,
    })
  );

export const generateQuizValidation = [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage(ERROR_CODES.INTERVIEW_PREP.TOPIC_REQUIRED)
    .isLength({ min: 2, max: 120 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.INVALID_TOPIC),
  body('difficulty')
    .optional()
    .isIn(MOCK_INTERVIEW_DIFFICULTIES)
    .withMessage(ERROR_CODES.INTERVIEW_PREP.DIFFICULTY_INVALID),
  body('length')
    .optional()
    .isInt({ min: MIN_SKILL_QUIZ_QUESTIONS, max: MAX_SKILL_QUIZ_QUESTIONS })
    .withMessage(
      formatValidationCode(ERROR_CODES.INTERVIEW_PREP.QUESTION_COUNT_INVALID, {
        min: MIN_SKILL_QUIZ_QUESTIONS,
        max: MAX_SKILL_QUIZ_QUESTIONS,
      })
    ),
  questionCountRule,
];

export const submitQuizValidation = [
  body('quizId').isMongoId().withMessage(ERROR_CODES.INTERVIEW_PREP.QUIZ_ID_INVALID),
  body('answers').isArray({ min: 1 }).withMessage(ERROR_CODES.INTERVIEW_PREP.ANSWERS_REQUIRED),
  body('answers.*.questionId')
    .trim()
    .notEmpty()
    .withMessage(ERROR_CODES.INTERVIEW_PREP.QUESTION_ID_REQUIRED),
  body('answers.*.selectedIndex')
    .isInt({ min: 0, max: 5 })
    .withMessage(ERROR_CODES.INTERVIEW_PREP.SELECTED_INDEX_INVALID),
];

export const quizIdParamValidation = [
  param('quizId').isMongoId().withMessage(ERROR_CODES.INTERVIEW_PREP.QUIZ_ID_INVALID),
];
