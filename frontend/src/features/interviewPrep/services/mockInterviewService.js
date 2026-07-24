import api from '../../../services/authService';

const unwrap = (response) => response.data;

export const fetchMockInterviewSession = (sessionId) =>
  api.get(`/interview/session/${sessionId}`).then(unwrap);

export const generateMockInterviewReport = (sessionId) =>
  api.post('/interview/report', { sessionId }, { timeout: 120000 }).then(unwrap);

export const startLiveInterview = (payload) =>
  api.post('/interview/live/start', payload, { timeout: 120000 }).then(unwrap);

export const submitLiveInterview = ({ sessionId, transcript, liveAudioHints, liveVideoMetrics, durationMs }) =>
  api
    .post(
      '/interview/live/submit',
      { sessionId, transcript, liveAudioHints, liveVideoMetrics, durationMs },
      { timeout: 120000 }
    )
    .then(unwrap);
