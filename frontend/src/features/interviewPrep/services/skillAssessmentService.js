import api from '../../../services/authService';

const unwrap = (response) => response.data;

export const fetchSkillTopics = () => api.get('/skills/topics').then(unwrap);

export const generateSkillQuiz = (payload) =>
  api.post('/skills/generate-quiz', payload, { timeout: 120000 }).then(unwrap);

export const fetchSkillQuiz = (quizId) => api.get(`/skills/quiz/${quizId}`).then(unwrap);

export const submitSkillQuiz = (payload) => api.post('/skills/submit-quiz', payload).then(unwrap);
