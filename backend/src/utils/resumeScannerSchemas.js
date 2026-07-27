import { z } from 'zod';

const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['required', 'hard', 'soft']),
  synonyms: z.array(z.string()).default([]),
  matched: z.boolean().optional(),
  matchEvidence: z.string().optional(),
});

const scoreComponentSchema = z.object({
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(100),
  weighted: z.number().min(0).max(100),
  notes: z.string().optional(),
});

const suggestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['missing_keyword', 'reword', 'remove']),
  original: z.string(),
  suggested: z.string(),
  reason: z.string().min(1),
  impact: z.number().min(0).max(10),
  targetSkillId: z.string().nullable().optional(),
});

export const resumeScannerAnalysisSchema = z.object({
  jobTitle: z.string().default(''),
  company: z.string().default(''),
  skills: z.array(skillSchema).min(1),
  score: z.number().min(0).max(100),
  scoreBreakdown: z.object({
    keywordCoverage: scoreComponentSchema,
    sectionCompleteness: scoreComponentSchema,
    searchability: scoreComponentSchema,
    quantifiedAchievements: scoreComponentSchema,
  }),
  suggestions: z.array(suggestionSchema).default([]),
  searchabilityIssues: z.array(z.string()).default([]),
  recruiterTips: z.array(z.string()).default([]),
});

export const parseResumeScannerAnalysis = (payload) => resumeScannerAnalysisSchema.parse(payload);
