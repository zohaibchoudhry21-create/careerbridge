import api from '../../../services/authService';

const unwrap = (response) => response.data;

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const uploadResume = (formData, onUploadProgress) =>
  api
    .post('/resume/upload', formData, {
      timeout: 120000,
      onUploadProgress,
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

export const createBlankResume = (templateId = 'classic') =>
  api.post('/resume/blank', { templateId }).then(unwrap);

export const getResumeHistory = (params = {}) =>
  api.get('/resume/history', { params }).then(unwrap);

export const getResume = (id) => api.get(`/resume/${id}`).then(unwrap);

export const updateResume = (id, parsedData, templateId) =>
  api.put(`/resume/${id}`, { parsedData, templateId }).then(unwrap);

export const runResumeAiText = (id, { action, content, field = 'summary', context } = {}) =>
  api
    .post(`/resume/${id}/ai-text`, { action, content, field, context }, { timeout: 60000 })
    .then(unwrap);

export const deleteResume = (id) => api.delete(`/resume/${id}`).then(unwrap);

export const reprocessResume = (id) => api.post(`/resume/${id}/reprocess`).then(unwrap);

export const exportResume = (id, includeText = false) =>
  api.get(`/resume/export/${id}`, {
    params: { includeText: includeText ? 'true' : 'false' },
    responseType: 'json',
  });

export const searchResumes = (query, params = {}) =>
  api.get(`/resume/search/${encodeURIComponent(query)}`, { params }).then(unwrap);
