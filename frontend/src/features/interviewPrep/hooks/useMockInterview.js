import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  INTERVIEW_HISTORY_DEFAULT_LIMIT,
  INTERVIEW_HISTORY_DEFAULT_PAGE,
} from '../constants/interviewPrepConstants';
import {
  clearInterviewSessionHistory,
  deleteInterviewSession,
  fetchInterviewSessionHistory,
  fetchMockInterviewSession,
  fetchSavedInterviewReport,
  generateMockInterviewReport,
  previewPanelSeats,
  startLiveInterview,
  submitLiveInterview,
} from '../services/mockInterviewService';

const SESSION_HISTORY_KEY = 'interview-session-history';
const REPORT_CHART_HISTORY_KEY = 'interview-report-history';

export const useStartLiveInterview = () =>
  useMutation({
    mutationFn: startLiveInterview,
  });

export const usePreviewPanelSeats = (roleLabel, enabled = true) =>
  useQuery({
    queryKey: ['panel-preview-seats', roleLabel],
    queryFn: ({ signal }) => previewPanelSeats(roleLabel, signal),
    select: (data) => (Array.isArray(data.seats) ? data.seats.slice(0, 3) : []),
    enabled: Boolean(enabled) && Boolean(String(roleLabel || '').trim()),
    staleTime: 60_000,
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
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: [REPORT_CHART_HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [SESSION_HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['mock-interview-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['interview-saved-report', sessionId] });
    },
  });
};

export const useInterviewSessionHistory = (
  page = INTERVIEW_HISTORY_DEFAULT_PAGE,
  limit = INTERVIEW_HISTORY_DEFAULT_LIMIT,
  interviewFormat
) =>
  useQuery({
    queryKey: [SESSION_HISTORY_KEY, page, limit, interviewFormat || 'all'],
    queryFn: () => fetchInterviewSessionHistory({ page, limit, interviewFormat }),
    staleTime: 30_000,
  });

export const useDeleteInterviewSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInterviewSession,
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: [SESSION_HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORT_CHART_HISTORY_KEY] });
      queryClient.removeQueries({ queryKey: ['mock-interview-session', sessionId] });
      queryClient.removeQueries({ queryKey: ['interview-saved-report', sessionId] });
    },
  });
};

export const useClearInterviewSessionHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interviewFormat) => clearInterviewSessionHistory(interviewFormat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SESSION_HISTORY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORT_CHART_HISTORY_KEY] });
    },
  });
};

export const useSavedInterviewReport = (sessionId, enabled = true) =>
  useQuery({
    queryKey: ['interview-saved-report', sessionId],
    queryFn: () => fetchSavedInterviewReport(sessionId),
    select: (data) => data.report,
    enabled: Boolean(sessionId) && enabled,
    staleTime: 60_000,
    retry: false,
  });
