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

    if (!user.isVerified || user.status !== 'active') {
      user.isVerified = true;
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
    if (
      existingByEmail.provider === 'local' &&
      (!existingByEmail.isVerified || existingByEmail.status !== 'active')
    ) {
      throw new Error(
        'An unverified account already exists with this email. Please verify your email or log in with your password.'
      );
    }

    if (existingByEmail.provider !== 'local' && existingByEmail.provider !== provider) {
      throw new Error('This email is already linked to a different sign-in provider.');
    }

    existingByEmail.provider = provider;
    existingByEmail.providerId = providerId;

    if (name) existingByEmail.name = name;
    if (avatar) existingByEmail.avatar = avatar;

    existingByEmail.isVerified = true;
    existingByEmail.status = 'active';

    await existingByEmail.save({ validateBeforeSave: false });
    return { user: existingByEmail, isNewUser: false };
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
