import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteResume,
  exportResume,
  getResume,
  getResumeHistory,
  reprocessResume,
  runResumeAiText,
  updateResume,
  uploadResume,
  createBlankResume,
} from '../services/resumeBuilderService';

export const resumeHistoryQueryKey = (params) => ['parsedResumeHistory', params];

export const resumeDetailQueryKey = (id) => ['parsedResume', id];

export const useResumeHistory = (params) =>
  useQuery({
    queryKey: resumeHistoryQueryKey(params),
    queryFn: () => getResumeHistory(params),
    staleTime: 2 * 60 * 1000,
  });

export const useParsedResume = (id) =>
  useQuery({
    queryKey: resumeDetailQueryKey(id),
    queryFn: () => getResume(id),
    enabled: Boolean(id),
  });

export const useResumeBuilderActions = () => {
  const queryClient = useQueryClient();

  return {
    uploadResume,
    createBlankResume: async (templateId) => {
      const result = await createBlankResume(templateId);
      queryClient.invalidateQueries({ queryKey: ['parsedResumeHistory'] });
      return result;
    },
    updateResume: async (id, parsedData, templateId) => {
      const result = await updateResume(id, parsedData, templateId);
      queryClient.invalidateQueries({ queryKey: resumeDetailQueryKey(id) });
      return result;
    },
    deleteResume: async (id) => {
      const result = await deleteResume(id);
      queryClient.invalidateQueries({ queryKey: ['parsedResumeHistory'] });
      return result;
    },
    reprocessResume: async (id) => {
      const result = await reprocessResume(id);
      queryClient.invalidateQueries({ queryKey: resumeDetailQueryKey(id) });
      return result;
    },
    runResumeAiText: (id, payload) => runResumeAiText(id, payload),
    exportResume,
  };
};
