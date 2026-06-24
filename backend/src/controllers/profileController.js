import User from '../models/User.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { buildProfileResponse } from '../utils/profileSerializer.js';

const loadProfileUser = (userId) => User.findById(userId);

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await loadProfileUser(req.user._id);

    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    sendResponse(res, 200, true, 'Profile fetched successfully', {
      profile: buildProfileResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export default getUserProfile;
