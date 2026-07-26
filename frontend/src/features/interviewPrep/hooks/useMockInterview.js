import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchMockInterviewSession,
  generateMockInterviewReport,
  startLiveInterview,
  submitLiveInterview,
} from '../services/mockInterviewService';

export const useStartLiveInterview = () =>
  useMutation({
    mutationFn: startLiveInterview,
  });

export const useSubmitLiveInterview = () =>
  useMutation({
    mutationFn: submitLiveInterview,
  });

export const useMockInterviewSession = (sessionId, enabled = true) =>
  useQuery({
    queryKey: ['mock-interview-session', sessionId],
    queryFn: () => fetchMockInterviewSession(sessionId),
    select: (data) => data.session,
    enabled: Boolean(sessionId) && enabled,
  });

export const useGenerateMockInterviewReport = () =>
  useMutation({
    mutationFn: (sessionId) => generateMockInterviewReport(sessionId),
  });
