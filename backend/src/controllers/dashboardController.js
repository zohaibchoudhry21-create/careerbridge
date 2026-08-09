import { sendResponse } from '../utils/sendResponse.js';
import { getDashboardOverview, getJobMatches } from '../utils/dashboardDataService.js';

export const getDashboard = async (req, res, next) => {
  try {
    const overview = await getDashboardOverview(req.user);
    const jobMatches = (await getJobMatches(req.user)).slice(0, 3);

    sendResponse(res, 200, true, 'Dashboard data fetched successfully', {
      ...overview,
      jobMatchesPreview: jobMatches,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobMatchesHandler = async (req, res, next) => {
  try {
    sendResponse(res, 200, true, 'Job matches fetched successfully', {
      matches: await getJobMatches(req.user),
    });
  } catch (error) {
    next(error);
  }
};
