import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchResumeScannerAnalysis,
  fetchResumeScannerStatus,
  fetchSavedScannerResumes,
  uploadResumeScanner,
} from '../services/resumeScannerService';

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

export const useSavedScannerResumes = (enabled = true) =>
  useQuery({
    queryKey: ['resume-scanner-resumes'],
    queryFn: fetchSavedScannerResumes,
    select: (data) => data.resumes || [],
    enabled,
  });

export const useUploadResumeScanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadResumeScanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-scanner-resumes'] });
    },
  });
};

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
    queryKey: ['resume-scanner-analysis', analysisId],
    queryFn: () => fetchResumeScannerAnalysis(analysisId),
    select: (data) => data.analysis,
    enabled: Boolean(analysisId) && enabled,
  });
