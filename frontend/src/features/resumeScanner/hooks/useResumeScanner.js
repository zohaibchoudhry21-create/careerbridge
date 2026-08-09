import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptAllSuggestions,
  downloadResumeScannerPdf,
  fetchResumeScannerAnalysis,
  fetchResumeScannerStatus,
  finalizeResumeScannerAnalysis,
  redoResumeScannerChange,
  undoResumeScannerChange,
  updateResumeScannerText,
  updateRewriteStatus,
  updateSuggestionStatus,
  uploadResumeScanner,
} from '../services/resumeScannerService';

const analysisQueryKey = (analysisId) => ['resume-scanner-analysis', analysisId];

const setAnalysisCache = (queryClient, analysisId, payload) => {
  queryClient.setQueryData(analysisQueryKey(analysisId), payload);
};

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

export const useUploadResumeScanner = () =>
  useMutation({
    mutationFn: uploadResumeScanner,
  });

export const useResumeScannerStatus = (analysisId, enabled = false) =>
  useQuery({
    queryKey: ['resume-scanner-status', analysisId],
    queryFn: () => fetchResumeScannerStatus(analysisId),
    enabled: Boolean(analysisId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || TERMINAL_STATUSES.has(status)) {
        return false;
      }
      return 1200;
    },
  });

export const useResumeScannerAnalysis = (analysisId, enabled = false) =>
  useQuery({
    queryKey: analysisQueryKey(analysisId),
    queryFn: () => fetchResumeScannerAnalysis(analysisId),
    select: (data) => data.analysis,
    enabled: Boolean(analysisId) && enabled,
  });

export const useUpdateSuggestionStatus = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ suggestionId, action }) =>
      updateSuggestionStatus(analysisId, suggestionId, action),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useAcceptAllSuggestions = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => acceptAllSuggestions(analysisId),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useUpdateResumeScannerText = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateResumeScannerText(analysisId, payload),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useUndoResumeScannerChange = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => undoResumeScannerChange(analysisId),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useRedoResumeScannerChange = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => redoResumeScannerChange(analysisId),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useUpdateRewriteStatus = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action) => updateRewriteStatus(analysisId, action),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useFinalizeResumeScanner = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => finalizeResumeScannerAnalysis(analysisId),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useDownloadResumeScannerPdf = (analysisId) =>
  useMutation({
    mutationFn: () => downloadResumeScannerPdf(analysisId),
  });
