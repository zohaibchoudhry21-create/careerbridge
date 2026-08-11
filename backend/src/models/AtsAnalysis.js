import mongoose from 'mongoose';

const atsScoreBreakdownSchema = new mongoose.Schema(
  {
    sectionCompleteness: { type: Number, default: 0 },
    searchability: { type: Number, default: 0 },
    quantifiedAchievements: { type: Number, default: 0 },
  },
  { _id: false }
);

const jobMatchBreakdownSchema = new mongoose.Schema(
  {
    keywordCoverage: { type: Number, default: 0 },
    // Composite LLM quality score (structure/searchability/etc.) — not job-field relevance.
    aiAssessedRelevance: { type: Number, default: 0 },
    // Dedicated experience/field-fit signal used by rewrite-vs-optimize decision.
    jobRelevanceScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const workExperienceEntrySchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    duration: { type: String, default: '' },
    bullets: { type: [String], default: [] },
  },
  { _id: false }
);

const educationEntrySchema = new mongoose.Schema(
  {
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    duration: { type: String, default: '' },
  },
  { _id: false }
);

const projectEntrySchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    technologies: { type: [String], default: [] },
    duration: { type: String, default: '' },
  },
  { _id: false }
);

const additionalSectionSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'custom' },
    heading: { type: String, default: 'ADDITIONAL' },
    paragraphs: { type: [String], default: [] },
  },
  { _id: false }
);

const sectionOrderEntrySchema = new mongoose.Schema(
  {
    type: { type: String, default: 'custom' },
    heading: { type: String, default: '' },
  },
  { _id: false }
);

const structuredResumeSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    contact: {
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    summary: { type: String, default: '' },
    workExperience: { type: [workExperienceEntrySchema], default: [] },
    education: { type: [educationEntrySchema], default: [] },
    skills: { type: [String], default: [] },
    projects: { type: [projectEntrySchema], default: [] },
    certifications: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    additionalSections: { type: [additionalSectionSchema], default: [] },
    sectionOrder: { type: [sectionOrderEntrySchema], default: [] },
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
    fieldPath: { type: String, default: '' },
    charStart: { type: Number, default: -1 },
    charEnd: { type: Number, default: -1 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'unappliable'],
      default: 'pending',
    },
    applyError: { type: String, default: '' },
  },
  { _id: false }
);

/** Same shape as ParsedResume.parsedData (Resume Builder extract JSON). */
const builderParsedDataSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    linkedinLink: { type: String, default: '' },
    githubLink: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experience: [
      {
        company: { type: String, default: '' },
        position: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        description: { type: String, default: '' },
        isCurrent: { type: Boolean, default: false },
      },
    ],
    education: [
      {
        institution: { type: String, default: '' },
        degree: { type: String, default: '' },
        fieldOfStudy: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        gpa: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    projects: [
      {
        name: { type: String, default: '' },
        description: { type: String, default: '' },
        technologies: { type: [String], default: [] },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        link: { type: String, default: '' },
      },
    ],
    languages: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
  },
  { _id: false }
);

const historyEntrySchema = new mongoose.Schema(
  {
    resumeText: { type: String, default: '' },
    structuredResume: { type: structuredResumeSchema, default: () => ({}) },
    parsedData: { type: builderParsedDataSchema, default: () => ({}) },
    templateId: { type: String, default: 'classic' },
    suggestions: { type: [suggestionSchema], default: [] },
    atsScore: { type: Number, default: 0, min: 0, max: 100 },
    jobMatchScore: { type: Number, default: 0, min: 0, max: 100 },
    atsScoreBreakdown: { type: atsScoreBreakdownSchema, default: () => ({}) },
    jobMatchBreakdown: { type: jobMatchBreakdownSchema, default: () => ({}) },
    score: { type: Number, default: 0, min: 0, max: 100 },
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
    score: { type: Number, default: 0, min: 0, max: 100 },
    atsScore: { type: Number, default: 0, min: 0, max: 100 },
    jobMatchScore: { type: Number, default: 0, min: 0, max: 100 },
    atsScoreBreakdown: { type: atsScoreBreakdownSchema, default: () => ({}) },
    jobMatchBreakdown: { type: jobMatchBreakdownSchema, default: () => ({}) },
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
    structuredResume: {
      type: structuredResumeSchema,
      default: () => ({}),
    },
    /** Resume Builder extract JSON — same shape as ParsedResume.parsedData */
    parsedData: {
      type: builderParsedDataSchema,
      default: () => ({}),
    },
    templateId: {
      type: String,
      enum: ['classic', 'modern', 'minimal', 'professional', 'elegant'],
      default: 'classic',
    },
    structuredSections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lineMap: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
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
    analysisMode: {
      type: String,
      enum: ['optimize', 'rewrite'],
      default: 'optimize',
    },
    rewriteStatus: {
      type: String,
      enum: ['none', 'pending_review', 'accepted', 'rejected'],
      default: 'none',
    },
    rewriteTriggerReason: {
      type: String,
      default: '',
    },
    /** Compact Decision Engine snapshot (mode/reason/signals). Full context is in-memory only. */
    decisionContext: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    /** Snapshot used exclusively for PDF download — never suggestions/analysis blobs. */
    finalizedStructuredResume: {
      type: structuredResumeSchema,
      default: () => ({}),
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
    rewrittenResume: {
      type: structuredResumeSchema,
      default: () => ({}),
    },
    rewrittenParsedData: {
      type: builderParsedDataSchema,
      default: () => ({}),
    },
    rewriteNotes: {
      type: [String],
      default: [],
    },
    pendingOptimizationSuggestions: {
      type: [suggestionSchema],
      default: [],
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
  { timestamps: true, optimisticConcurrency: true }
);

atsAnalysisSchema.index({ userId: 1, createdAt: -1 });

const AtsAnalysis = mongoose.model('AtsAnalysis', atsAnalysisSchema);

export default AtsAnalysis;
