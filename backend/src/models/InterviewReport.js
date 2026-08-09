import mongoose from 'mongoose';
import { INTERVIEW_REPORT_SOURCE_TYPES } from '../constants/interviewPrepConstants.js';

const reportSectionSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100 },
    feedback: { type: String, trim: true, default: '' },
    wpm: { type: Number, min: 0 },
    confidenceScore: { type: Number, min: 0, max: 100 },
    fillerWords: { type: Number, min: 0 },
    toneLabel: { type: String, trim: true },
    eyeContactPercent: { type: Number, min: 0, max: 100 },
    engagementScore: { type: Number, min: 0, max: 100 },
    percentage: { type: Number, min: 0, max: 100 },
    weakAreas: { type: [String], default: [] },
  },
  { _id: false, strict: false }
);

const listField = (label) => ({
  type: [String],
  default: [],
  validate: {
    validator: (arr) => Array.isArray(arr) && arr.length <= 10,
    message: `${label} supports at most 10 items`,
  },
});

const interviewReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sourceType: {
      type: String,
      enum: INTERVIEW_REPORT_SOURCE_TYPES,
      required: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    /** Scoring/gate/ceiling logic version; mismatch forces report regeneration. */
    scoreVersion: {
      type: Number,
      min: 1,
      default: 1,
      index: true,
    },
    sections: {
      contentQuality: { type: reportSectionSchema, default: undefined },
      voiceAnalysis: { type: reportSectionSchema, default: undefined },
      videoAnalysis: { type: reportSectionSchema, default: undefined },
      skillAssessment: { type: reportSectionSchema, default: undefined },
    },
    strengths: listField('strengths'),
    improvementAreas: listField('improvementAreas'),
    recommendedNextSteps: listField('recommendedNextSteps'),
    /** Heuristic: transcript contained prompt-injection-like phrases. */
    flaggedForReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    /** Human-readable reasons when flaggedForReview is true (injection, metrics anomalies, etc.). */
    flagReasons: {
      type: [String],
      default: [],
    },
    /**
     * false when Groq narrative failed and the report used deterministic scores + fallback prose.
     * true when enterprise/legacy narrative was generated successfully.
     */
    narrativeGenerated: {
      type: Boolean,
      default: true,
      index: true,
    },
    rawMetricsSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
      select: false,
    },
    /** Enterprise report payload (additive; legacy sections remain for older clients). */
    enterpriseReport: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true }
);

interviewReportSchema.index({ userId: 1, createdAt: -1 });
interviewReportSchema.index({ userId: 1, sourceType: 1, createdAt: -1 });
interviewReportSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReport;
