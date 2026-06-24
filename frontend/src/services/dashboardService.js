import api from './authService';

const unwrap = (response) => response.data;

export const fetchDashboard = () => api.get('/dashboard').then(unwrap);
export const fetchJobMatches = () => api.get('/jobs/matches').then(unwrap);
