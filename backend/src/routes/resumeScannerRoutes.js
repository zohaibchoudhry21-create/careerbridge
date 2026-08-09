import express from 'express';
import {
  acceptAllSuggestions,
  downloadResumeScannerPdf,
  finalizeResumeScannerAnalysis,
  getResumeScannerAnalysis,
  getResumeScannerStatus,
  redoResumeScannerChange,
  undoResumeScannerChange,
  updateResumeScannerText,
  updateRewriteStatus,
  updateSuggestionStatus,
  uploadAndAnalyzeResume,
} from '../controllers/resumeScannerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleResumeScannerUpload } from '../middleware/resumeScannerUploadMiddleware.js';
import {
  resumeScannerHeavyLimiter,
  resumeScannerTextLimiter,
} from '../middleware/resumeScannerRateLimiters.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  analysisIdValidation,
  rewriteActionValidation,
  suggestionActionValidation,
  updateResumeTextValidation,
  uploadResumeScannerValidation,
} from '../validators/resumeScannerValidators.js';

const router = express.Router();

router.post(
  '/resume-scanner/upload',
  protect,
  resumeScannerHeavyLimiter,
  handleResumeScannerUpload,
  uploadResumeScannerValidation,
  validateRequest,
  uploadAndAnalyzeResume
);

router.get(
  '/resume-scanner/:analysisId/status',
  protect,
  analysisIdValidation,
  validateRequest,
  getResumeScannerStatus
);

router.get(
  '/resume-scanner/:analysisId',
  protect,
  analysisIdValidation,
  validateRequest,
  getResumeScannerAnalysis
);

router.patch(
  '/resume-scanner/:analysisId/suggestion/:suggestionId',
  protect,
  resumeScannerTextLimiter,
  suggestionActionValidation,
  validateRequest,
  updateSuggestionStatus
);

router.post(
  '/resume-scanner/:analysisId/accept-all',
  protect,
  resumeScannerTextLimiter,
  analysisIdValidation,
  validateRequest,
  acceptAllSuggestions
);

router.patch(
  '/resume-scanner/:analysisId/rewrite',
  protect,
  resumeScannerTextLimiter,
  rewriteActionValidation,
  validateRequest,
  updateRewriteStatus
);

router.patch(
  '/resume-scanner/:analysisId/text',
  protect,
  resumeScannerTextLimiter,
  updateResumeTextValidation,
  validateRequest,
  updateResumeScannerText
);

router.post(
  '/resume-scanner/:analysisId/undo',
  protect,
  resumeScannerTextLimiter,
  analysisIdValidation,
  validateRequest,
  undoResumeScannerChange
);

router.post(
  '/resume-scanner/:analysisId/redo',
  protect,
  resumeScannerTextLimiter,
  analysisIdValidation,
  validateRequest,
  redoResumeScannerChange
);

router.post(
  '/resume-scanner/:analysisId/finalize',
  protect,
  resumeScannerTextLimiter,
  analysisIdValidation,
  validateRequest,
  finalizeResumeScannerAnalysis
);

router.get(
  '/resume-scanner/:analysisId/pdf',
  protect,
  resumeScannerHeavyLimiter,
  analysisIdValidation,
  validateRequest,
  downloadResumeScannerPdf
);

export default router;
