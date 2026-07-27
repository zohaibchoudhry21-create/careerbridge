import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { extractResumeWithPythonService } from './pythonExtractorService.js';
import { extractResumeTextFromFile } from './resumeFileExtractor.js';
import { cleanExtractedText } from './resumeTextCleanup.js';
import { AppError } from './sendResponse.js';

export const extractResumeForScanner = async (file) => {
  if (!file?.buffer) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.FILE_REQUIRED, 400);
  }

  const filename = file.originalname || 'resume.pdf';

  try {
    const pythonResult = await extractResumeWithPythonService(file.buffer, filename);
    const fullText = cleanExtractedText(pythonResult.full_text || '');

    if (!fullText) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.EXTRACTION_FAILED, 400);
    }

    return {
      extractedText: fullText,
      structuredSections: pythonResult.structured_sections || {},
      lineMap: pythonResult.lines || [],
      extractionMetadata: {
        ...(pythonResult.metadata || {}),
        source: pythonResult.source || 'python',
        pages: pythonResult.pages || 0,
        fileType: pythonResult.file_type || '',
      },
      sourceFile: {
        filename,
        mimeType: file.mimetype || '',
        size: file.size || file.buffer.length,
        extension: filename.includes('.') ? filename.split('.').pop().toLowerCase() : '',
      },
    };
  } catch (error) {
    console.warn('[resume-scanner] Python extract-resume failed, using Node fallback:', error.message);
  }

  const fallbackText = await extractResumeTextFromFile(file);

  return {
    extractedText: fallbackText,
    structuredSections: {},
    lineMap: [],
    extractionMetadata: {
      source: 'node-fallback',
      pages: 1,
      fileType: filename.split('.').pop()?.toLowerCase() || '',
    },
    sourceFile: {
      filename,
      mimeType: file.mimetype || '',
      size: file.size || file.buffer.length,
      extension: filename.includes('.') ? filename.split('.').pop().toLowerCase() : '',
    },
  };
};
