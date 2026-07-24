import multer from 'multer';
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
    cb(new AppError('Unsupported audio format. Record again using your browser microphone.', 400));
  },
});

export const handleMockInterviewAudioUpload = upload.single('audio');
