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

export default updateAccount;
