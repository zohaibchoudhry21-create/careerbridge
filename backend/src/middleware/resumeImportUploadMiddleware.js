import multer from 'multer';
import { AppError } from '../utils/sendResponse.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
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

    cb(new AppError('Unsupported file type. Use .pdf or .docx.', 400));
  },
});

export const handleResumeImportUpload = (req, res, next) => {
  if (req.body?.mode === 'paste') {
    return next();
  }

  return upload.single('resume')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('Resume file must be 10MB or smaller.', 400));
      }
      return next(new AppError(error.message, 400));
    }

    if (error) {
      return next(error);
    }

    return next();
  });
};
