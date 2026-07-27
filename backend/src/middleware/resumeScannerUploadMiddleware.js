import multer from 'multer';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from '../utils/sendResponse.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new AppError(ERROR_CODES.RESUME_SCANNER.UNSUPPORTED_FILE_TYPE, 400));
  },
});

export const handleResumeScannerUpload = (req, res, next) => {
  if (req.body?.mode === 'saved') {
    return next();
  }

  return upload.single('resume')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(ERROR_CODES.RESUME_SCANNER.FILE_TOO_LARGE, 400));
      }
      return next(new AppError(error.message, 400));
    }

    if (error) {
      return next(error);
    }

    return next();
  });
};
