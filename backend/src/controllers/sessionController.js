import mongoose from 'mongoose';
import UserSession from '../models/UserSession.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { clearAuthCookie } from '../utils/authCookie.js';
import {
  listActiveSessionsForUser,
  revokeOtherSessions,
  serializeSession,
} from '../utils/sessionService.js';

export const listSessions = async (req, res, next) => {
  try {
    const sessions = await listActiveSessionsForUser(req.user._id);

    sendResponse(res, 200, true, 'Active sessions fetched successfully', {
      sessions: sessions.map((session) => serializeSession(session, req.authSessionId)),
    });
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new AppError('Session not found.', 404);
    }

    const session = await UserSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session || session.revokedAt) {
      throw new AppError('Session not found.', 404);
    }

    session.revokedAt = new Date();
    await session.save();

    const signedOutCurrent = session.sessionId === req.authSessionId;

    if (signedOutCurrent) {
      clearAuthCookie(res);
    }

    sendResponse(
      res,
      200,
      true,
      signedOutCurrent ? 'You have been signed out.' : 'Session signed out successfully.',
      { signedOutCurrent }
    );
  } catch (error) {
    next(error);
  }
};

export const revokeOtherSessionsHandler = async (req, res, next) => {
  try {
    if (!req.authSessionId) {
      throw new AppError('Current session could not be identified.', 400);
    }

    await revokeOtherSessions(req.user._id, req.authSessionId);

    sendResponse(res, 200, true, 'All other devices have been signed out.');
  } catch (error) {
    next(error);
  }
};
