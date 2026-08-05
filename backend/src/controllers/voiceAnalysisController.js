import { transcribeAudioWithGroq } from '../utils/groqWhisperService.js';
import { analyzeVoiceFromTranscription } from '../utils/voiceAnalysisService.js';
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

    sendResponse(res, 200, true, 'Voice analysis complete.', {
      transcript,
      voiceMetrics,
    });
  } catch (error) {
    next(error);
  }
};
