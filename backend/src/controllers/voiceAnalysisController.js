import { transcribeAudioWithGroq } from '../utils/groqWhisperService.js';
import { analyzeVoiceFromTranscription } from '../utils/voiceAnalysisService.js';
import { analyzeSpeechMonitoring } from '../services/speechAnalysis/index.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';

export const analyzeVoice = async (req, res, next) => {
  try {
    let transcript = req.body?.transcript?.trim();
    let duration = req.body?.duration ? Number(req.body.duration) : undefined;
    let segments;

    const durationMs = req.body?.durationMs ? Number(req.body.durationMs) : undefined;
    const durationSeconds = req.body?.duration ? Number(req.body.duration) : undefined;

    if (req.file?.buffer) {
      const transcription = await transcribeAudioWithGroq(
        req.file.buffer,
        req.file.originalname || 'audio.webm',
        req.file.mimetype,
        { durationMs, durationSeconds }
      );

      transcript = transcription.text;
      duration = transcription.duration;
      segments = transcription.segments;
    }

    if (!transcript) {
      throw new AppError(ERROR_CODES.INTERVIEW_PREP.TRANSCRIPT_OR_AUDIO_REQUIRED, 400);
    }

    const voiceMetrics = await analyzeVoiceFromTranscription({
      transcript,
      duration,
      segments,
      durationMs,
    });

    let speechMetrics;
    let timelineEvents;
    try {
      let liveAudioHints;
      if (req.body?.liveAudioHints) {
        liveAudioHints =
          typeof req.body.liveAudioHints === 'string'
            ? JSON.parse(req.body.liveAudioHints)
            : req.body.liveAudioHints;
      }

      const speech = await analyzeSpeechMonitoring({
        transcript,
        duration,
        durationMs,
        segments,
        liveAudioHints,
      });
      speechMetrics = speech.metrics;
      timelineEvents = speech.timelineEvents;
    } catch (speechError) {
      console.error('[speechAnalysis] /analysis/voice monitoring failed:', speechError?.message);
    }

    sendResponse(res, 200, true, 'Voice analysis complete.', {
      transcript,
      voiceMetrics,
      speechMetrics,
      timelineEvents,
    });
  } catch (error) {
    next(error);
  }
};
