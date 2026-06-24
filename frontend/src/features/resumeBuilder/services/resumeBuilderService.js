import api from '../../../services/authService';

const unwrap = (response) => response.data;

export const fetchBuiltResumes = () => api.get('/resumes').then(unwrap);

export const fetchBuiltResume = (resumeId) => api.get(`/resumes/${resumeId}`).then(unwrap);

export const createBuiltResume = (payload) => api.post('/resumes', payload).then(unwrap);

export const updateBuiltResume = (resumeId, payload) =>
  api.put(`/resumes/${resumeId}`, payload).then(unwrap);

export const importBuiltResume = ({ file, pastedText, templateId, mode, onUploadProgress }) => {
  const formData = new FormData();
  formData.append('templateId', templateId);
  formData.append('mode', mode);

  if (mode === 'paste' && pastedText) {
    formData.append('pastedText', pastedText);
  } else if (file) {
    formData.append('resume', file);
    formData.append('mode', 'file');
  }

  return api
    .post('/resumes/import', formData, {
      onUploadProgress,
      transformRequest: [(data, headers) => {
        if (data instanceof FormData) {
          delete headers['Content-Type'];
        }
        return data;
      }],
    })
    .then(unwrap);
};

export const suggestResumeSkills = (currentSkills = []) =>
  api.post('/resumes/suggest-skills', { currentSkills }).then(unwrap);

export const runResumeAiAction = ({ action, content, context }) =>
  api.post('/resumes/ai', { action, content, context }).then(unwrap);
