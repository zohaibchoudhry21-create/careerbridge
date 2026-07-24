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
    sections: {
      contentQuality: { type: reportSectionSchema, default: undefined },
      voiceAnalysis: { type: reportSectionSchema, default: undefined },
      videoAnalysis: { type: reportSectionSchema, default: undefined },
      skillAssessment: { type: reportSectionSchema, default: undefined },
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvementAreas: {
      type: [String],
      default: [],
    },
    recommendedNextSteps: {
      type: [String],
      default: [],
    },
    rawMetricsSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
      select: false,
    },
  },
  { timestamps: true }
);

interviewReportSchema.index({ userId: 1, createdAt: -1 });
interviewReportSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);

export default InterviewReport;
