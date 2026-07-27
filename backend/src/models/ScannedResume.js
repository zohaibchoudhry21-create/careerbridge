import mongoose from 'mongoose';

const sourceFileSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
    extension: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const scannedResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      default: 'Uploaded Resume',
    },
    sourceFile: {
      type: sourceFileSchema,
      default: () => ({}),
    },
    extractedText: {
      type: String,
      default: '',
    },
    structuredSections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lineMap: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    extractionMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

scannedResumeSchema.index({ userId: 1, updatedAt: -1 });

const ScannedResume = mongoose.model('ScannedResume', scannedResumeSchema);

export default ScannedResume;
