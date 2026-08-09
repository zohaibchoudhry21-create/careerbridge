import api from '../../../services/authService';

const unwrap = (response) => response.data;

export const fetchMockInterviewSession = (sessionId) =>
  api.get(`/interview/session/${sessionId}`).then(unwrap);

export const fetchInterviewReportHistory = (limit = 12) =>
  api.get('/interview/reports/history', { params: { limit } }).then(unwrap);

export const generateMockInterviewReport = (sessionId) =>
  api.post('/interview/report', { sessionId }, { timeout: 120000 }).then(unwrap);

export const startLiveInterview = (payload) =>
  api.post('/interview/live/start', payload, { timeout: 120000 }).then(unwrap);

const formDataTransform = [
  (data, headers) => {
    if (data instanceof FormData) {
      delete headers['Content-Type'];
    }
    return data;
  },
];

export const analyzeInterviewResume = (file) => {
  const formData = new FormData();
  formData.append('document', file);

  return api
    .post('/interview/resume/analyze', formData, {
      timeout: 120000,
      transformRequest: formDataTransform,
    })
    .then(unwrap);
};

export const fetchRoleSuggestions = (query, signal) =>
  api
    .post('/interview/role-suggestions', { query }, { timeout: 8000, signal })
    .then(unwrap);

export const submitLiveInterview = ({ sessionId, transcript, liveAudioHints, liveVideoMetrics, durationMs }) =>
  api
    .post(
      '/interview/live/submit',
      { sessionId, transcript, liveAudioHints, liveVideoMetrics, durationMs },
      { timeout: 120000 }
    )
    .then(unwrap);

export const applyLiveAdaptiveDepth = ({
  sessionId,
  answerText,
  questionText,
  answeredCount,
  priorStrengths,
}) =>
  api
    .post(
      '/interview/live/adaptive-depth',
      { sessionId, answerText, questionText, answeredCount, priorStrengths },
      { timeout: 8000 }
    )
    .then(unwrap);
