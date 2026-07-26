import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import { extractPdfWithPythonOrFallback } from './pythonExtractorService.js';
import { cleanExtractedText } from './resumeTextCleanup.js';
import { scoreResumeTextQuality } from './resumeTextNormalizer.js';

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);

const isImageMime = (mimetype) => IMAGE_MIME_TYPES.has(mimetype);

const PDF_STRATEGIES = [
  { lineEnforce: true, lineThreshold: 4.6, cellSeparator: '\t', cellThreshold: 10 },
  { lineEnforce: true, lineThreshold: 7.5, cellSeparator: '\n', cellThreshold: 10 },
  { lineEnforce: true, lineThreshold: 3.2, cellSeparator: ' | ', cellThreshold: 10 },
  { lineEnforce: false },
];

const mapPagesFromExtraction = (extraction = {}) => {
  if (Array.isArray(extraction.page_texts) && extraction.page_texts.length) {
    return extraction.page_texts.map((item) => ({
      pageNumber: item.page ?? item.pageNumber ?? 1,
      text: item.text || '',
    }));
  }

  const byPage = new Map();

  for (const chunk of extraction.chunks || []) {
    const pageNumber = chunk.page || 1;
    const chunkText = chunk.text?.trim() || '';
    if (!chunkText) continue;

    const existing = byPage.get(pageNumber) || '';
    byPage.set(pageNumber, existing ? `${existing}\n${chunkText}` : chunkText);
  }

  return [...byPage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pageNumber, text]) => ({ pageNumber, text }));
};

const toPagesText = (pages = []) =>
  pages.map((page) => ({
    page: page.pageNumber,
    text: page.text,
  }));

let lastResumeFileExtraction = null;

export const getLastResumeFileExtraction = () => lastResumeFileExtraction;

export const extractPdfTextFallback = async (buffer) => {
  const parser = new PDFParse({ data: buffer });

  try {
    const candidates = [];

    for (const strategy of PDF_STRATEGIES) {
      try {
        const result = await parser.getText(strategy);
        const text = result.text?.trim();
        if (!text) continue;

        const pages = (result.pages || [])
          .map((page) => ({
            pageNumber: page.num ?? page.pageNumber ?? 1,
            text: page.text?.trim() || '',
          }))
          .filter((page) => page.text);

        candidates.push({
          text,
          pages,
          score: scoreResumeTextQuality(cleanExtractedText(text)),
        });
      } catch {
        // Strategy failed — try next
      }
    }

    if (candidates.length === 0) {
      return { text: '', pages: [] };
    }

    const best = candidates.sort((a, b) => b.score - a.score)[0];

    return {
      text: best.text,
      pages: best.pages,
    };
  } catch (error) {
    console.warn('[resume-import] pdf-parse fallback failed:', error.message);
    return { text: '', pages: [] };
  } finally {
    await parser.destroy();
  }
};

export const extractResumeTextFromFile = async (file) => {
  if (!file?.buffer) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.FILE_REQUIRED, 400);
  }

  if (isImageMime(file.mimetype)) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.IMAGE_NOT_SUPPORTED, 400);
  }

  if (file.mimetype === 'application/pdf') {
    const extraction = await extractPdfWithPythonOrFallback(
      file.buffer,
      'resume',
      extractPdfTextFallback
    );
    const text = cleanExtractedText(extraction.full_text || '');
    const pages = mapPagesFromExtraction(extraction);

    if (!text) {
      throw new AppError(ERROR_CODES.RESUME_BUILDER.PDF_EXTRACT_FAILED, 400);
    }

    // Both conditions must be true: low quality score AND very short text.
    // Minimal CVs without dates/email can score low but still have enough content.
    if (scoreResumeTextQuality(text) < 2 && text.length < 80) {
      throw new AppError(ERROR_CODES.RESUME_BUILDER.PDF_SCANNED, 400);
    }

    lastResumeFileExtraction = {
      text,
      pages,
      pages_text: toPagesText(pages),
      pages_count: extraction.pages || pages.length || 0,
      source: extraction.source || 'unknown',
    };

    return text;
  }

  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    const text = cleanExtractedText(result.value?.trim() || '');

    if (!text) {
      throw new AppError(ERROR_CODES.RESUME_BUILDER.DOCX_EXTRACT_FAILED, 400);
    }

    lastResumeFileExtraction = {
      text,
      pages: [{ pageNumber: 1, text }],
      pages_text: [{ page: 1, text }],
      pages_count: 1,
      source: 'docx',
    };

    return text;
  }

  throw new AppError(ERROR_CODES.RESUME_BUILDER.UNSUPPORTED_FILE_TYPE, 400);
};
