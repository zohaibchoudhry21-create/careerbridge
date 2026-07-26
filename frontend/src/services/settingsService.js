import api from './authService';

const unwrap = (response) => response.data;

export const getUserSessions = () => api.get('/users/me/sessions').then(unwrap);

export const revokeUserSession = (sessionId) =>
  api.delete(`/users/me/sessions/${sessionId}`).then(unwrap);

export const revokeOtherUserSessions = () =>
  api.delete('/users/me/sessions/others').then(unwrap);

export const updateSessionTrust = (sessionId, trusted) =>
  api.patch(`/users/me/sessions/${sessionId}/trust`, { trusted }).then(unwrap);

export const updateAccount = (payload) => api.patch('/users/me', payload).then(unwrap);

export const changeUserPassword = (payload) => api.patch('/users/me/password', payload).then(unwrap);

export const deleteUserAccount = (payload) => api.delete('/users/me', { data: payload }).then(unwrap);

export const deactivateUserAccount = () => api.post('/users/me/deactivate').then(unwrap);

export const exportUserData = async () => {
  const response = await api.get('/users/me/export', { responseType: 'blob' });
  const disposition = response.headers['content-disposition'];
  const filenameMatch = disposition?.match(/filename="([^"]+)"/);
  const filename =
    filenameMatch?.[1] || `careerbridge-export-${new Date().toISOString().slice(0, 10)}.zip`;

  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);

  return { filename };
};

export default updateAccount;
