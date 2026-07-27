import mongoose from 'mongoose';

const scoreComponentSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    weighted: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const suggestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['missing_keyword', 'reword', 'remove'],
      required: true,
    },
    original: { type: String, default: '' },
    suggested: { type: String, default: '' },
    reason: { type: String, default: '' },
    impact: { type: Number, default: 1 },
    targetSkillId: { type: String, default: null },
    charStart: { type: Number, default: -1 },
    charEnd: { type: Number, default: -1 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { _id: false }
);

const historyEntrySchema = new mongoose.Schema(
  {
    resumeText: { type: String, default: '' },
    suggestions: { type: [suggestionSchema], default: [] },
    score: { type: Number, default: 0 },
    matchedSkillIds: { type: [String], default: [] },
    missingSkillIds: { type: [String], default: [] },
    action: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const atsAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeSourceType: {
      type: String,
      enum: ['built', 'scanned'],
      required: true,
    },
    resumeSourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'extracting', 'analyzing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    statusMessage: {
      type: String,
      default: '',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    scoreBreakdown: {
      keywordCoverage: { type: scoreComponentSchema, default: () => ({}) },
      sectionCompleteness: { type: scoreComponentSchema, default: () => ({}) },
      searchability: { type: scoreComponentSchema, default: () => ({}) },
      quantifiedAchievements: { type: scoreComponentSchema, default: () => ({}) },
    },
    matchedSkillIds: {
      type: [String],
      default: [],
    },
    missingSkillIds: {
      type: [String],
      default: [],
    },
    resumeText: {
      type: String,
      default: '',
    },
    originalResumeText: {
      type: String,
      default: '',
    },
    structuredSections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    suggestions: {
      type: [suggestionSchema],
      default: [],
    },
    searchabilityIssues: {
      type: [String],
      default: [],
    },
    recruiterTips: {
      type: [String],
      default: [],
    },
    coverLetter: {
      type: String,
      default: '',
    },
    history: {
      type: [historyEntrySchema],
      default: [],
    },
    historyIndex: {
      type: Number,
      default: -1,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

atsAnalysisSchema.index({ userId: 1, createdAt: -1 });

const AtsAnalysis = mongoose.model('AtsAnalysis', atsAnalysisSchema);

export default AtsAnalysis;
