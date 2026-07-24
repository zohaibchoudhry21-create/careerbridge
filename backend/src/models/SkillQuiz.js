import mongoose from 'mongoose';
import { SKILL_QUIZ_STATUSES } from '../constants/interviewPrepConstants.js';

const skillQuizQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 6,
        message: 'Each question must have 2–6 options',
      },
      required: true,
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: { type: String, trim: true, default: '' },
    subtopic: { type: String, trim: true, default: 'general' },
  },
  { _id: false }
);

const skillQuizAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    selectedIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const weakAreaSchema = new mongoose.Schema(
  {
    subtopic: { type: String, required: true, trim: true },
    accuracy: { type: Number, min: 0, max: 100 },
    correct: { type: Number, min: 0 },
    total: { type: Number, min: 0 },
  },
  { _id: false }
);

const skillQuizScoredResultSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0 },
    total: { type: Number, min: 0 },
    percentage: { type: Number, min: 0, max: 100 },
    weakAreas: { type: [weakAreaSchema], default: [] },
    reviewList: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const skillQuizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    topicLabel: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    questionCount: {
      type: Number,
      min: 10,
      max: 15,
      default: 12,
    },
    status: {
      type: String,
      enum: SKILL_QUIZ_STATUSES,
      default: 'pending',
      index: true,
    },
    questions: {
      type: [skillQuizQuestionSchema],
      default: [],
    },
    answers: {
      type: [skillQuizAnswerSchema],
      default: [],
    },
    scoredResult: {
      type: skillQuizScoredResultSchema,
      default: undefined,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewReport',
      default: null,
    },
    /** Optional expiry for in-progress quizzes (cleared on submit). */
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

skillQuizSchema.index({ userId: 1, updatedAt: -1 });

const SkillQuiz = mongoose.model('SkillQuiz', skillQuizSchema);

export default SkillQuiz;
