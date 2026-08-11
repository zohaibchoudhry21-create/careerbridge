import api from '../../../services/authService';

const unwrap = (response) => response.data;

/**
 * Upload only creates the pending job + queues background extraction/analysis.
 * Long OCR work happens after 202; keep a modest timeout for network/DB only.
 */
const UPLOAD_TIMEOUT_MS = 60_000;/** Mutations that recompute scores / render a PDF server-side. */
const MUTATION_TIMEOUT_MS = 60_000;

export const uploadResumeScanner = ({ file, jobDescription }) => {
  const formData = new FormData();
  formData.append('jobDescription', jobDescription);
  formData.append('mode', 'upload');

  if (file) {
    formData.append('resume', file);
  }

  return api
    .post('/resume-scanner/upload', formData, {
      timeout: UPLOAD_TIMEOUT_MS,
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData) {
            delete headers['Content-Type'];
          }
          return data;
        },
      ],
    })
    .then(unwrap);
};

export const fetchResumeScannerStatus = (analysisId) =>
  api.get(`/resume-scanner/${analysisId}/status`).then(unwrap);

export const fetchResumeScannerAnalysis = (analysisId) =>
  api
    .get(`/resume-scanner/${analysisId}`, { timeout: MUTATION_TIMEOUT_MS })
    .then(unwrap);

export const updateSuggestionStatus = (analysisId, suggestionId, action) =>
  api
    .patch(
      `/resume-scanner/${analysisId}/suggestion/${suggestionId}`,
      { action },
      { timeout: MUTATION_TIMEOUT_MS }
    )
    .then(unwrap);

export const acceptAllSuggestions = (analysisId) =>
  api
    .post(`/resume-scanner/${analysisId}/accept-all`, {}, {
      timeout: MUTATION_TIMEOUT_MS,
    })
    .then(unwrap);

export const updateResumeScannerText = (analysisId, payload) => {
  const body =
    typeof payload === 'string'
      ? { resumeText: payload }
      : payload && typeof payload === 'object'
        ? payload
        : { resumeText: '' };

  return api
    .patch(`/resume-scanner/${analysisId}/text`, body, {
      timeout: MUTATION_TIMEOUT_MS,
    })
    .then(unwrap);
};

export const undoResumeScannerChange = (analysisId) =>
  api
    .post(`/resume-scanner/${analysisId}/undo`, {}, { timeout: MUTATION_TIMEOUT_MS })
    .then(unwrap);

export const redoResumeScannerChange = (analysisId) =>
  api
    .post(`/resume-scanner/${analysisId}/redo`, {}, { timeout: MUTATION_TIMEOUT_MS })
    .then(unwrap);

export const updateRewriteStatus = (analysisId, action) =>
  api
    .patch(
      `/resume-scanner/${analysisId}/rewrite`,
      { action },
      { timeout: MUTATION_TIMEOUT_MS }
    )
    .then(unwrap);

export const finalizeResumeScannerAnalysis = (analysisId) =>
  api
    .post(`/resume-scanner/${analysisId}/finalize`, {}, {
      timeout: MUTATION_TIMEOUT_MS,
    })
    .then(unwrap);

/**
 * Blob responses also carry JSON error bodies as a Blob, which hides the API
 * error code/message from resolveApiError. Re-hydrate it before rethrowing.
 */
const rehydrateBlobError = async (error) => {
  const data = error?.response?.data;
  if (!(data instanceof Blob)) return error;

  try {
    const text = await data.text();
    error.response.data = JSON.parse(text);
  } catch {
    error.response.data = undefined;
  }

  return error;
};

/** Download finalized PDF bytes. Uses blob response — never suggestions/analysis JSON. */
export const downloadResumeScannerPdf = async (analysisId) => {
  let response;

  try {
    response = await api.get(`/resume-scanner/${analysisId}/pdf`, {
      responseType: 'blob',
      timeout: MUTATION_TIMEOUT_MS,
    });
  } catch (error) {
    throw await rehydrateBlobError(error);
  }

  const disposition = response.headers?.['content-disposition'] || '';
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  const filename = match?.[1] || `resume-${analysisId}.pdf`;

  return { blob: response.data, filename };
};
