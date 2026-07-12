import api from './authService';

const unwrap = (response) => response.data;

export const updateAccount = (payload) => api.patch('/users/me', payload).then(unwrap);

export const changeUserPassword = (payload) => api.patch('/users/me/password', payload).then(unwrap);

export const deleteUserAccount = (payload) => api.delete('/users/me', { data: payload }).then(unwrap);

export default updateAccount;
