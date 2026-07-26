import User from '../models/User.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

export const findOrCreateSocialUser = async ({
  provider,
  providerId,
  email,
  name,
  avatar = '',
}) => {
  const normalizedEmail = normalizeEmail(email);

  if (!providerId) {
    throw new AppError(ERROR_CODES.SOCIAL.PROVIDER_NO_USER_ID, 400);
  }

  if (!normalizedEmail) {
    throw new AppError(ERROR_CODES.SOCIAL.EMAIL_PERMISSION_REQUIRED, 400);
  }

  let user = await User.findOne({ provider, providerId });

  if (user) {
    let shouldSave = false;

    if (name && user.name !== name) {
      user.name = name;
      shouldSave = true;
    }

    if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      shouldSave = true;
    }

    if (!user.isVerified) {
      user.isVerified = true;
      shouldSave = true;
    }

    if (user.status === 'inactive') {
      user.status = 'active';
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save({ validateBeforeSave: false });
    }

    return { user, isNewUser: false };
  }

  const existingByEmail = await User.findOne({ email: normalizedEmail });

  if (existingByEmail) {
    if (existingByEmail.provider === 'local') {
      throw new AppError(ERROR_CODES.SOCIAL.EMAIL_EXISTS_LOCAL, 400);
    }

    if (existingByEmail.provider !== provider) {
      throw new AppError(ERROR_CODES.SOCIAL.EMAIL_PROVIDER_MISMATCH, 400);
    }

    throw new AppError(ERROR_CODES.SOCIAL.EMAIL_ALREADY_REGISTERED, 400);
  }

  user = await User.create({
    name: name || normalizedEmail.split('@')[0],
    email: normalizedEmail,
    provider,
    providerId,
    avatar,
    isVerified: true,
    status: 'active',
  });

  user._isNewSocialUser = true;
  return { user, isNewUser: true };
};

export default findOrCreateSocialUser;
