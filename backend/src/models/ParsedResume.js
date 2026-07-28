import mongoose from 'mongoose';

const parsedResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    },
    extractedText: {
      type: String,
      default: '',
    },
    parsedData: {
      fullName: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      address: { type: String, trim: true },
      skills: [{ type: String, trim: true }],
      linkedinLink: { type: String, trim: true },
      githubLink: { type: String, trim: true },
      experience: [
        {
          company: { type: String, trim: true },
          position: { type: String, trim: true },
          startDate: { type: String, trim: true },
          endDate: { type: String, trim: true },
          description: { type: String, trim: true },
          isCurrent: { type: Boolean, default: false },
        },
      ],
      education: [
        {
          institution: { type: String, trim: true },
          degree: { type: String, trim: true },
          fieldOfStudy: { type: String, trim: true },
          startDate: { type: String, trim: true },
          endDate: { type: String, trim: true },
          gpa: { type: String, trim: true },
          description: { type: String, trim: true },
        },
      ],
      projects: [
        {
          name: { type: String, trim: true },
          description: { type: String, trim: true },
          technologies: [{ type: String, trim: true }],
          startDate: { type: String, trim: true },
          endDate: { type: String, trim: true },
          link: { type: String, trim: true },
        },
      ],
      summary: { type: String, trim: true },
      languages: [{ type: String, trim: true }],
      certifications: [{ type: String, trim: true }],
    },
    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
    },
    processingError: {
      type: String,
      default: null,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    templateId: {
      type: String,
      enum: ['classic', 'modern', 'minimal', 'professional', 'elegant'],
      default: 'classic',
    },
    catalogTemplateId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

parsedResumeSchema.index({ userId: 1, createdAt: -1 });
parsedResumeSchema.index({ 'parsedData.fullName': 'text', 'parsedData.email': 'text' });
parsedResumeSchema.index({ processingStatus: 1 });
parsedResumeSchema.index({ createdAt: -1 });

parsedResumeSchema.methods.getSummary = function getSummary() {
  return {
    id: this._id,
    fileName: this.fileName,
    originalFileName: this.originalFileName,
    fullName: this.parsedData?.fullName,
    email: this.parsedData?.email,
    phone: this.parsedData?.phone,
    skills: this.parsedData?.skills,
    processingStatus: this.processingStatus,
    fileSize: this.fileSize,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

parsedResumeSchema.statics.searchResumes = function searchResumes(query, userId = null) {
  const searchQuery = {
    $or: [
      { 'parsedData.fullName': { $regex: query, $options: 'i' } },
      { 'parsedData.email': { $regex: query, $options: 'i' } },
      { 'parsedData.skills': { $in: [new RegExp(query, 'i')] } },
      { originalFileName: { $regex: query, $options: 'i' } },
    ],
  };

  if (userId) {
    searchQuery.userId = userId;
  }

  return this.find(searchQuery);
};

const ParsedResume = mongoose.model('ParsedResume', parsedResumeSchema);

export default ParsedResume;
