import User from '../models/User.js';
import { sendSocialWelcomeEmail } from './emailService.js';

const buildDashboardUrl = () => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return `${clientUrl}/dashboard`;
};

export const sendWelcomeEmailIfNeeded = async (user, { isNewUser = false } = {}) => {
  if (!user?._id || !user.email) {
    return { skipped: true, reason: 'missing-user' };
  }

  if (!isNewUser && user.welcomeEmailSent) {
    return { skipped: true, reason: 'already-sent' };
  }

  if (!isNewUser) {
    return { skipped: true, reason: 'returning-user' };
  }

  const reserved = await User.findOneAndUpdate(
    { _id: user._id, welcomeEmailSent: { $ne: true } },
    { $set: { welcomeEmailSent: true } },
    { new: true }
  );

  if (!reserved) {
    console.log(`[Email] Welcome email already sent for ${user.email}`);
    return { skipped: true, reason: 'already-sent' };
  }

  try {
    const result = await sendSocialWelcomeEmail({
      to: reserved.email,
      name: reserved.name,
      dashboardUrl: buildDashboardUrl(),
    });

    console.log(
      `[Email] Welcome email ${result.sent ? 'delivered' : 'logged (dev mode)'} for ${reserved.email}`
    );

    return { sent: result.sent, devMode: result.devMode, email: reserved.email };
  } catch (error) {
    await User.findByIdAndUpdate(reserved._id, { $set: { welcomeEmailSent: false } });
    console.error(`[Email] Welcome email failed for ${reserved.email}:`, error.message);
    return { sent: false, error: error.message, email: reserved.email };
  }
};

export default sendWelcomeEmailIfNeeded;
