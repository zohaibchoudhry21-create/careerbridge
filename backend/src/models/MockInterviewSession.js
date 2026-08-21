import mongoose from 'mongoose';
import {
  DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES,
  DEFAULT_MOCK_QUESTION_COUNT,
  MAX_MOCK_INTERVIEW_DURATION_MINUTES,
  MAX_MOCK_QUESTIONS,
  MIN_MOCK_INTERVIEW_DURATION_MINUTES,
  MIN_MOCK_QUESTIONS,
  MOCK_INTERVIEW_DIFFICULTIES,
  MOCK_INTERVIEW_MODES,
  MOCK_INTERVIEW_STATUSES,
} from '../constants/interviewPrepConstants.js';

const mockInterviewQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0 },
    /** Interview intelligence tags (optional; live guide). */
    focusTag: { type: String, trim: true, default: undefined },
    depthHint: { type: String, trim: true, default: undefined },
  },
  { _id: false }
);

const liveVideoMetricsSchema = new mongoose.Schema(
  {
    sampleCount: { type: Number, default: 0 },
    eyeContactPercent: { type: Number, min: 0, max: 100 },
    expressionBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    engagementScore: { type: Number, min: 0, max: 100 },
    /** Composed attention score from measurable monitoring components. */
    attentionScore: { type: Number, min: 0, max: 100 },
    timeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
    /** Nested professional monitoring metrics (monitoring-only; not report generation). */
    behavioralMetrics: { type: mongoose.Schema.Types.Mixed, default: undefined },
    /** Structured behavioral timeline events `{ tMs, offsetLabel, type, message, severity? }`. */
    timelineEvents: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  },
  { _id: false }
);

const voiceMetricsSchema = new mongoose.Schema(
  {
    wpm: { type: Number, min: 0 },
    fillerWords: { type: Number, min: 0, default: 0 },
    pauseRatio: { type: Number, min: 0, max: 1 },
    confidenceScore: { type: Number, min: 0, max: 100 },
    toneLabel: { type: String, trim: true, default: '' },
    feedbackText: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const videoMetricsSchema = new mongoose.Schema(
  {
    eyeContactPercent: { type: Number, min: 0, max: 100 },
    expressionBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    engagementScore: { type: Number, min: 0, max: 100 },
    attentionScore: { type: Number, min: 0, max: 100 },
    timeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
    feedbackText: { type: String, trim: true, default: '' },
    behavioralMetrics: { type: mongoose.Schema.Types.Mixed, default: undefined },
    timelineEvents: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  },
  { _id: false }
);

const liveAudioHintsSchema = new mongoose.Schema(
  {
    averageVolume: { type: Number, min: 0, max: 1 },
    silenceRatio: { type: Number, min: 0, max: 1 },
    longPauseCount: { type: Number, min: 0, default: 0 },
    /** Optional acoustic capture metadata (samples usually stripped before persist). */
    sampleIntervalMs: { type: Number, min: 0, default: undefined },
    pauseEvents: { type: [mongoose.Schema.Types.Mixed], default: undefined },
    acousticSamples: { type: [mongoose.Schema.Types.Mixed], default: undefined },
  },
  { _id: false }
);

const mockInterviewAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    transcript: { type: String, default: '' },
    voiceMetrics: { type: voiceMetricsSchema, default: undefined },
    videoMetrics: { type: videoMetricsSchema, default: undefined },
    liveVideoMetrics: { type: liveVideoMetricsSchema, default: undefined },
    liveAudioHints: { type: liveAudioHintsSchema, default: undefined },
    durationMs: { type: Number, min: 0 },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const mockInterviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    roleLabel: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: MOCK_INTERVIEW_DIFFICULTIES,
      required: true,
    },
    mode: {
      type: String,
      enum: MOCK_INTERVIEW_MODES,
      default: 'live',
      index: true,
    },
    voiceCallTranscript: {
      type: [
        {
          role: { type: String, trim: true },
          content: { type: String, trim: true, default: '' },
        },
      ],
      default: undefined,
    },
    callLiveAudioHints: {
      type: liveAudioHintsSchema,
      default: undefined,
    },
    callLiveVideoMetrics: {
      type: liveVideoMetricsSchema,
      default: undefined,
    },
    callVoiceMetrics: {
      type: voiceMetricsSchema,
      default: undefined,
    },
    callVideoMetrics: {
      type: videoMetricsSchema,
      default: undefined,
    },
    /** Professional speech monitoring (separate from legacy callVoiceMetrics / reports). */
    callSpeechMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    speechTimelineEvents: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
    callDurationMs: {
      type: Number,
      min: 0,
      default: undefined,
    },
    status: {
      type: String,
      enum: MOCK_INTERVIEW_STATUSES,
      default: 'setup',
      index: true,
    },
    durationMinutes: {
      type: Number,
      min: MIN_MOCK_INTERVIEW_DURATION_MINUTES,
      max: MAX_MOCK_INTERVIEW_DURATION_MINUTES,
      default: DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES,
    },
    targetQuestionCount: {
      type: Number,
      min: MIN_MOCK_QUESTIONS,
      max: MAX_MOCK_QUESTIONS,
      default: DEFAULT_MOCK_QUESTION_COUNT,
    },
    answerTimeLimitSeconds: {
      type: Number,
      min: 30,
      max: 600,
      default: 180,
    },
    currentQuestionIndex: {
      type: Number,
      min: 0,
      default: 0,
    },
    questions: {
      type: [mockInterviewQuestionSchema],
      default: [],
    },
    answers: {
      type: [mockInterviewAnswerSchema],
      default: [],
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewReport',
      default: null,
    },
    resumeText: {
      type: String,
      trim: true,
      maxlength: 15000,
      default: undefined,
    },
    experience: {
      type: String,
      trim: true,
      maxlength: 120,
      default: undefined,
    },
    resumeSkills: {
      type: [String],
      default: undefined,
    },
    resumeProjects: {
      type: [String],
      default: undefined,
    },
    jobDescriptionText: {
      type: String,
      trim: true,
      maxlength: 15000,
      default: undefined,
    },
    targetCompany: {
      type: String,
      trim: true,
      maxlength: 120,
      default: undefined,
    },
    focusAreas: {
      type: [String],
      default: undefined,
    },
    interviewMode: {
      type: String,
      enum: ['video_voice', 'voice_only', 'text_only'],
      default: 'video_voice',
    },
    interviewerPersona: {
      type: String,
      enum: ['friendly', 'neutral', 'strict', 'panel'],
      default: 'neutral',
    },
    /** Server-created Vapi assistant — browser only receives this id. */
    vapiAssistantId: {
      type: String,
      trim: true,
      default: undefined,
    },
    /** Create-time interview intelligence brief (resume/JD/skills) for prompt + debug. */
    interviewContextBrief: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  { timestamps: true }
);

mockInterviewSessionSchema.index({ userId: 1, updatedAt: -1 });
mockInterviewSessionSchema.index({ userId: 1, status: 1 });
mockInterviewSessionSchema.index({ userId: 1, mode: 1, createdAt: -1 });
mockInterviewSessionSchema.index({ userId: 1, createdAt: -1 });
mockInterviewSessionSchema.index({ reportId: 1 }, { sparse: true });

const MockInterviewSession = mongoose.model('MockInterviewSession', mockInterviewSessionSchema);

export default MockInterviewSession;
