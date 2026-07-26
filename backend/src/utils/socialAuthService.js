import User from '../models/User.js';

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
    throw new Error('Social provider did not return a user ID.');
  }

  if (!normalizedEmail) {
    throw new Error('Email permission is required to sign in with this provider.');
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
    // Never auto-link by email alone — prevents account takeover if an OAuth
    // provider returns an email that already belongs to another account.
    if (existingByEmail.provider === 'local') {
      throw new Error(
        'An account with this email already exists. Please log in with your email and password.'
      );
    }

    if (existingByEmail.provider !== provider) {
      throw new Error('This email is already linked to a different sign-in provider.');
    }

    // Same provider but missing providerId match is unexpected; refuse rather than overwrite.
    throw new Error(
      'This email is already registered. Please use the original sign-in method for this account.'
    );
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

  return { user, isNewUser: true };
};

export default findOrCreateSocialUser;
