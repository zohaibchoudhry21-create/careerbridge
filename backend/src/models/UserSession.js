import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceLabel: {
      type: String,
      default: 'Unknown device',
      trim: true,
      maxlength: 120,
    },
    browser: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },
    browserVersion: {
      type: String,
      default: '',
      trim: true,
      maxlength: 40,
    },
    os: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },
    osVersion: {
      type: String,
      default: '',
      trim: true,
      maxlength: 40,
    },
    userAgent: {
      type: String,
      default: '',
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
      maxlength: 64,
    },
    deviceFingerprint: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
      index: true,
    },
    isTrusted: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

userSessionSchema.index({ userId: 1, revokedAt: 1, lastActiveAt: -1 });
userSessionSchema.index({ userId: 1, deviceFingerprint: 1 });
userSessionSchema.index({ userId: 1, ipAddress: 1 });
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

userSessionSchema.statics.isActive = function isActive(session) {
  return Boolean(session && !session.revokedAt && session.expiresAt > new Date());
};

const UserSession = mongoose.model('UserSession', userSessionSchema);

export default UserSession;
