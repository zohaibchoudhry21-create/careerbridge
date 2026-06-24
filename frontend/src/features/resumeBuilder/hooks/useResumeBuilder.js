import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBuiltResume,
  fetchBuiltResume,
  fetchBuiltResumes,
  importBuiltResume,
  suggestResumeSkills,
  updateBuiltResume,
} from '../services/resumeBuilderService';

export const useBuiltResumes = () =>
  useQuery({
    queryKey: ['built-resumes'],
    queryFn: fetchBuiltResumes,
    select: (data) => data.resumes || [],
  });

export const useBuiltResume = (resumeId, enabled = true) =>
  useQuery({
    queryKey: ['built-resume', resumeId],
    queryFn: () => fetchBuiltResume(resumeId),
    select: (data) => data.resume,
    enabled: Boolean(resumeId) && enabled,
  });

export const useCreateBuiltResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBuiltResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['built-resumes'] });
    },
  });
};

export const useUpdateBuiltResume = (resumeId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateBuiltResume(resumeId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['built-resume', resumeId], data);
      queryClient.invalidateQueries({ queryKey: ['built-resumes'] });
    },
  });
};

export const useImportBuiltResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importBuiltResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['built-resumes'] });
    },
  });
};

export const useSuggestResumeSkills = () =>
  useMutation({
    mutationFn: (currentSkills) => suggestResumeSkills(currentSkills),
  });
