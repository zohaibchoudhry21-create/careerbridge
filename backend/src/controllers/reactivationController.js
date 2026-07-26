import { sendResponse } from '../utils/sendResponse.js';
import { sendWelcomeEmailIfNeeded } from '../utils/welcomeEmailService.js';
import {
  cancelReactivationChallenge,
  confirmReactivation,
} from '../utils/reactivationService.js';

export const reactivateAccount = async (req, res, next) => {
  try {
    const result = await confirmReactivation(res, req);

    sendResponse(res, 200, true, 'Account reactivated successfully', {
      user: result.user.toPublicJSON(),
      requires2FA: result.requires2FA === true,
    });

    if (!result.requires2FA && result.source === 'social' && result.isNewUser) {
      void sendWelcomeEmailIfNeeded(result.user, { isNewUser: result.isNewUser });
    }
  } catch (error) {
    next(error);
  }
};

export const clearReactivationChallenge = async (req, res, next) => {
  try {
    cancelReactivationChallenge(res, req);
    sendResponse(res, 200, true, 'Reactivation cancelled');
  } catch (error) {
    next(error);
  }
};

export default reactivateAccount;
