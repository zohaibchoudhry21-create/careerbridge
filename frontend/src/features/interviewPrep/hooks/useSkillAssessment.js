import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchSkillQuiz,
  fetchSkillTopics,
  generateSkillQuiz,
  submitSkillQuiz,
} from '../services/skillAssessmentService';

export const useSkillTopics = () =>
  useQuery({
    queryKey: ['skill-topics'],
    queryFn: fetchSkillTopics,
    select: (data) => data.topics || [],
    staleTime: 60 * 60 * 1000,
  });

export const useGenerateSkillQuiz = () =>
  useMutation({
    mutationFn: generateSkillQuiz,
  });

export const useSkillQuiz = (quizId, enabled = true) =>
  useQuery({
    queryKey: ['skill-quiz', quizId],
    queryFn: () => fetchSkillQuiz(quizId),
    select: (data) => data.quiz,
    enabled: Boolean(quizId) && enabled,
  });

export const useSubmitSkillQuiz = () =>
  useMutation({
    mutationFn: submitSkillQuiz,
  });
