import api from '../../../services/authService';

const unwrap = (response) => response.data;

export const fetchSavedScannerResumes = () =>
  api.get('/resume-scanner/resumes').then(unwrap);

export const uploadResumeScanner = ({
  file,
  jobDescription,
  mode = 'upload',
  resumeSourceType,
  resumeSourceId,
}) => {
  const formData = new FormData();
  formData.append('jobDescription', jobDescription);
  formData.append('mode', mode);

  if (mode === 'saved') {
    formData.append('resumeSourceType', resumeSourceType);
    formData.append('resumeSourceId', resumeSourceId);
  } else if (file) {
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

export const updateResumeScannerText = (analysisId, resumeText) =>
  api.patch(`/resume-scanner/${analysisId}/text`, { resumeText }).then(unwrap);

export const undoResumeScannerChange = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/undo`).then(unwrap);

export const redoResumeScannerChange = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/redo`).then(unwrap);
