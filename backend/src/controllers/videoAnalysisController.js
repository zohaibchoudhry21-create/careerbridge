import { aggregateVideoFrameSamples, buildVideoFeedbackText } from '../utils/videoAnalysisMetrics.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';

export const analyzeVideoFrames = async (req, res, next) => {
  try {
    const frameSamples = req.body?.frameSamples;

    if (!Array.isArray(frameSamples) || frameSamples.length === 0) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.FRAME_SAMPLES_REQUIRED, 400);
    }

    const aggregated = aggregateVideoFrameSamples(frameSamples);

    const videoMetrics = {
      eyeContactPercent: aggregated.eyeContactPercent,
      expressionBreakdown: aggregated.expressionBreakdown,
      engagementScore: aggregated.engagementScore,
      attentionScore: aggregated.attentionScore,
      timeline: aggregated.timeline,
      feedbackText: buildVideoFeedbackText(aggregated),
      behavioralMetrics: aggregated.behavioralMetrics,
      timelineEvents: aggregated.timelineEvents,
    };

    sendResponse(res, 200, true, 'Video analysis complete.', {
      sampleCount: aggregated.sampleCount,
      videoMetrics,
      behavioralMetrics: aggregated.behavioralMetrics,
      timelineEvents: aggregated.timelineEvents,
    });
  } catch (error) {
    next(error);
  }
};
