import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  INTERVIEW_HISTORY_DEFAULT_LIMIT,
  INTERVIEW_HISTORY_DEFAULT_PAGE,
} from '../constants/interviewPrepConstants';
import {
  fetchInterviewSessionHistory,
  fetchMockInterviewSession,
  fetchSavedInterviewReport,
  generateMockInterviewReport,
  startLiveInterview,
  submitLiveInterview,
} from '../services/mockInterviewService';

const SESSION_HISTORY_KEY = 'interview-session-history';
const REPORT_CHART_HISTORY_KEY = 'interview-report-history';

export const useStartLiveInterview = () =>
  useMutation({
    mutationFn: startLiveInterview,
  });

export const useSubmitLiveInterview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitLiveInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REPORT_CHART_HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SESSION_HISTORY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [REPORT_CHART_HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SESSION_HISTORY_KEY] });
    },
  });
};

export const useInterviewSessionHistory = (
  page = INTERVIEW_HISTORY_DEFAULT_PAGE,
  limit = INTERVIEW_HISTORY_DEFAULT_LIMIT
) =>
  useQuery({
    queryKey: [SESSION_HISTORY_KEY, page, limit],
    queryFn: () => fetchInterviewSessionHistory({ page, limit }),
    staleTime: 30_000,
  });

export const useSavedInterviewReport = (sessionId, enabled = true) =>
  useQuery({
    queryKey: ['interview-saved-report', sessionId],
    queryFn: () => fetchSavedInterviewReport(sessionId),
    select: (data) => data.report,
    enabled: Boolean(sessionId) && enabled,
    staleTime: 60_000,
    retry: false,
  });
