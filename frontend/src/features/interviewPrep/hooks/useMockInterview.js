import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useSubmitLiveInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitLiveInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-report-history'] });
    },
  });
};

export const useMockInterviewSession = (sessionId, enabled = true) =>
  useQuery({
    queryKey: ['mock-interview-session', sessionId],
    queryFn: () => fetchMockInterviewSession(sessionId),
    select: (data) => data.session,
    enabled: Boolean(sessionId) && enabled,
    staleTime: 30_000,
  });

export const useGenerateMockInterviewReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => generateMockInterviewReport(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-report-history'] });
    },
  });
};
