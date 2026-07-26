import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
      required() {
        return this.provider === 'local';
      },
    },
    avatar: {
      type: String,
      default: '',
      alias: 'profileImage',
    },
    /** Settings → Personal Information (optional profile details). */
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone number cannot exceed 30 characters'],
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      trim: true,
      maxlength: [40, 'Gender cannot exceed 40 characters'],
      default: '',
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
      default: '',
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
      default: '',
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      maxlength: [500, 'LinkedIn URL cannot exceed 500 characters'],
      default: '',
    },
    portfolio: {
      type: String,
      trim: true,
      maxlength: [500, 'Portfolio URL cannot exceed 500 characters'],
      default: '',
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [200, 'Headline cannot exceed 200 characters'],
      default: '',
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook', 'linkedin'],
      default: 'local',
      alias: 'authProvider',
    },
    providerId: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
      alias: 'emailVerificationToken',
    },
    verificationTokenExpires: {
      type: Date,
      alias: 'emailVerificationExpire',
    },
    status: {
      type: String,
      enum: ['inactive', 'active'],
      default: 'inactive',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
    },
    welcomeEmailSent: {
      type: Boolean,
      default: false,
    },
    /** Incremented on password change/reset so older JWTs fail in `protect`. */
    tokenVersion: {
      type: Number,
      default: 0,
    },
    /** Email alerts for sign-ins from unfamiliar devices or IP addresses. */
    loginAlertsEnabled: {
      type: Boolean,
      default: true,
    },
    /** Opt-in trusted-device flow for fewer security prompts on known devices. */
    rememberDevicesEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
      default: null,
    },
    twoFactorPendingSecret: {
      type: String,
      select: false,
      default: null,
    },
    twoFactorBackupCodes: {
      type: [
        {
          hash: { type: String, required: true },
          usedAt: { type: Date, default: null },
        },
      ],
      select: false,
      default: [],
    },
    twoFactorConfirmedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index(
  { provider: 1, providerId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerId: { $exists: true, $type: 'string' },
    },
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    firstName: this.firstName || '',
    lastName: this.lastName || '',
    phone: this.phone || '',
    dateOfBirth: this.dateOfBirth
      ? this.dateOfBirth.toISOString().slice(0, 10)
      : '',
    gender: this.gender || '',
    country: this.country || '',
    state: this.state || '',
    city: this.city || '',
    linkedin: this.linkedin || '',
    portfolio: this.portfolio || '',
    headline: this.headline || '',
    provider: this.provider,
    profileImage: this.avatar,
    authProvider: this.provider,
    role: this.role,
    status: this.status,
    isVerified: this.isVerified,
    loginAlertsEnabled: this.loginAlertsEnabled !== false,
    rememberDevicesEnabled: this.rememberDevicesEnabled === true,
    twoFactorEnabled: this.twoFactorEnabled === true,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
