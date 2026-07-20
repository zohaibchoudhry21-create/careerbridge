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
    provider: this.provider,
    profileImage: this.avatar,
    authProvider: this.provider,
    role: this.role,
    status: this.status,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
