import { cleanExtractedText, duplicatePenalty } from './resumeTextCleanup.js';
import { prepareResumeTextForImport, scoreResumeTextQuality } from './resumeTextNormalizer.js';

const DEFAULT_PYTHON_SERVICE_URL = 'http://localhost:8000';
const EXTRACT_TIMEOUT_MS = 120_000;

const getPythonServiceUrl = () =>
  (process.env.PYTHON_SERVICE_URL || DEFAULT_PYTHON_SERVICE_URL).replace(/\/$/, '');

const buildFallbackResult = (type, fullText, source = 'fallback', pageTexts = []) => {
  const normalizedPages = (pageTexts || [])
    .map((item) => ({
      page: item.page ?? item.pageNumber ?? 1,
      text: item.text || '',
    }))
    .filter((item) => item.text.trim());

  return {
    success: Boolean(fullText?.trim()),
    type,
    pages: normalizedPages.length || (fullText?.trim() ? 1 : 0),
    page_texts: normalizedPages,
    chunks: fullText?.trim()
      ? [{ text: fullText.trim(), page: normalizedPages[0]?.page || 1, metadata: { chunk_index: 0, source } }]
      : [],
    full_text: fullText || '',
    metadata: {
      title: '',
      author: '',
      pages: normalizedPages.length || (fullText?.trim() ? 1 : 0),
      source,
    },
    source,
  };
};

export const extractPdfWithPythonService = async (buffer, type = 'resume') => {
  if (!buffer?.length) {
    throw new Error('PDF buffer is required.');
  }

  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'application/pdf' }), 'document.pdf');
  formData.append('type', type);

  const headers = {};
  const apiKey = process.env.PYTHON_SERVICE_API_KEY?.trim();
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const response = await fetch(`${getPythonServiceUrl()}/extract`, {
    method: 'POST',
    body: formData,
    headers,
    signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Python extractor returned ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  if (!data?.success) {
    throw new Error('Python extractor reported failure.');
  }

  return {
    ...data,
    source: 'python',
  };
};

export const extractPdfWithPythonOrFallback = async (buffer, type = 'resume', fallbackFn) => {
  let pythonResult = null;
  let fallbackResult = null;

  try {
    pythonResult = await extractPdfWithPythonService(buffer, type);
  } catch (error) {
    console.warn('[pdf-extract] Python service unavailable, using fallback:', error.message);
  }

  if (typeof fallbackFn === 'function') {
    try {
      const fallbackRaw = await fallbackFn(buffer);
      const fallbackText =
        typeof fallbackRaw === 'string' ? fallbackRaw : fallbackRaw?.text || '';
      const fallbackPages =
        typeof fallbackRaw === 'object' && Array.isArray(fallbackRaw?.pages)
          ? fallbackRaw.pages.map((page) => ({
              page: page.pageNumber ?? page.page ?? 1,
              text: page.text || '',
            }))
          : [];

      fallbackResult = buildFallbackResult(type, fallbackText, 'fallback', fallbackPages);
    } catch (error) {
      console.warn('[pdf-extract] Fallback extractor failed:', error.message);
    }
  }

  const scoreCandidate = (text = '') => {
    const prepared = prepareResumeTextForImport(text);
    return scoreResumeTextQuality(prepared) - duplicatePenalty(prepared);
  };

  const pythonText = pythonResult?.full_text || '';
  const fallbackText = fallbackResult?.full_text || '';

  if (pythonText.trim() && fallbackText.trim()) {
    const pythonScore = scoreCandidate(pythonText);
    const fallbackScore = scoreCandidate(fallbackText);

    if (fallbackScore > pythonScore + 10) {
      console.warn(
        `[pdf-extract] Using pdf-parse fallback (score ${fallbackScore} vs python ${pythonScore}).`
      );
      return fallbackResult;
    }

    return {
      ...pythonResult,
      source: 'python',
    };
  }

  if (pythonText.trim()) {
    return pythonResult;
  }

  if (fallbackText.trim()) {
    return fallbackResult;
  }

  return buildFallbackResult(type, '');
};
