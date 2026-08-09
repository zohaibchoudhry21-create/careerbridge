import api from '../../../services/authService';

const unwrap = (response) => response.data;

export const uploadResumeScanner = ({ file, jobDescription }) => {
  const formData = new FormData();
  formData.append('jobDescription', jobDescription);
  formData.append('mode', 'upload');

  if (file) {
    formData.append('resume', file);
  }

  return api
    .post('/resume-scanner/upload', formData, {
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
  api.get(`/resume-scanner/${analysisId}`).then(unwrap);

export const updateSuggestionStatus = (analysisId, suggestionId, action) =>
  api
    .patch(`/resume-scanner/${analysisId}/suggestion/${suggestionId}`, { action })
    .then(unwrap);

export const acceptAllSuggestions = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/accept-all`).then(unwrap);

export const updateResumeScannerText = (analysisId, payload) => {
  const body =
    typeof payload === 'string'
      ? { resumeText: payload }
      : payload && typeof payload === 'object'
        ? payload
        : { resumeText: '' };

  return api.patch(`/resume-scanner/${analysisId}/text`, body).then(unwrap);
};

export const undoResumeScannerChange = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/undo`).then(unwrap);

export const redoResumeScannerChange = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/redo`).then(unwrap);

export const updateRewriteStatus = (analysisId, action) =>
  api.patch(`/resume-scanner/${analysisId}/rewrite`, { action }).then(unwrap);

export const finalizeResumeScannerAnalysis = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/finalize`).then(unwrap);

/** Download finalized PDF bytes. Uses blob response — never suggestions/analysis JSON. */
export const downloadResumeScannerPdf = async (analysisId) => {
  const response = await api.get(`/resume-scanner/${analysisId}/pdf`, {
    responseType: 'blob',
  });

  const disposition = response.headers?.['content-disposition'] || '';
  const match = /filename="?([^"]+)"?/i.exec(disposition);
  const filename = match?.[1] || `resume-${analysisId}.pdf`;

  return { blob: response.data, filename };
};
