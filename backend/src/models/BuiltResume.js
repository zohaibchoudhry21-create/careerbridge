import mongoose from 'mongoose';

const resumeEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const resumeSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    heading: { type: String, default: '' },
    visible: { type: Boolean, default: true },
    collapsed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    entries: { type: [resumeEntrySchema], default: [] },
  },
  { _id: false }
);

const builtResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'Resume 1',
    },
    templateId: {
      type: String,
      required: true,
      trim: true,
    },
    personalDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sections: {
      type: [resumeSectionSchema],
      default: [],
    },
    customize: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

builtResumeSchema.index({ userId: 1, updatedAt: -1 });

const BuiltResume = mongoose.model('BuiltResume', builtResumeSchema);

export default BuiltResume;
