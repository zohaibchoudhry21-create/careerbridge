import multer from 'multer';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from '../utils/sendResponse.js';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp4',
  'video/webm',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
      return;
    }
    cb(new AppError(ERROR_CODES.INTERVIEW_PREP.UNSUPPORTED_AUDIO_FORMAT, 400));
  },
});

export const handleMockInterviewAudioUpload = upload.single('audio');
