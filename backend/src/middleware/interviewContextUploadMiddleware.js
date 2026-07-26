import multer from 'multer';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from '../utils/sendResponse.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new AppError(ERROR_CODES.INTERVIEW_PREP.UNSUPPORTED_FILE_TYPE, 400));
  },
});

export const handleInterviewContextUpload = upload.single('document');
