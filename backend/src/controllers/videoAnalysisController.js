import { aggregateVideoFrameSamples, buildVideoFeedbackText } from '../utils/videoAnalysisMetrics.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';

export const analyzeVideoFrames = async (req, res, next) => {
  try {
    const frameSamples = req.body?.frameSamples;

    if (!Array.isArray(frameSamples) || frameSamples.length === 0) {
      throw new AppError('frameSamples array is required.', 400);
    }

    const aggregated = aggregateVideoFrameSamples(frameSamples);

    const videoMetrics = {
      eyeContactPercent: aggregated.eyeContactPercent,
      expressionBreakdown: aggregated.expressionBreakdown,
      engagementScore: aggregated.engagementScore,
      timeline: aggregated.timeline,
      feedbackText: buildVideoFeedbackText(aggregated),
    };

    sendResponse(res, 200, true, 'Video analysis complete.', {
      sampleCount: aggregated.sampleCount,
      videoMetrics,
    });
  } catch (error) {
    next(error);
  }
};
