import mongoose from 'mongoose';

const extractedSkillSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['required', 'hard', 'soft'],
      default: 'hard',
    },
    synonyms: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const jobDescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rawText: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    extractedSkills: {
      type: [extractedSkillSchema],
      default: [],
    },
  },
  { timestamps: true }
);

jobDescriptionSchema.index({ userId: 1, createdAt: -1 });

const JobDescription = mongoose.model('JobDescription', jobDescriptionSchema);

export default JobDescription;
