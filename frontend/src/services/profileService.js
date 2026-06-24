import api from './authService';

const unwrap = (response) => response.data;

export const fetchUserProfile = () => api.get('/users/me/profile').then(unwrap);

export default fetchUserProfile;
