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
  fieldPath: z.string().optional().default(''),
});

export const resumeScannerAnalysisSchema = z.object({
  jobTitle: z.string().default(''),
  company: z.string().default(''),
  skills: z.array(skillSchema).min(1),
  score: z.number().min(0).max(100),
  /** Field/experience fit only — ignore formatting quality (see prompt rubric). */
  jobRelevanceScore: z.number().min(0).max(100),
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

/** Score-component object — inlined (not $ref) for maximum Groq structured-output compatibility. */
const SCORE_COMPONENT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['score', 'weight', 'weighted', 'notes'],
  properties: {
    score: { type: 'number', minimum: 0, maximum: 100 },
    weight: { type: 'number', minimum: 0, maximum: 100 },
    weighted: { type: 'number', minimum: 0, maximum: 100 },
    notes: { type: 'string' },
  },
};

/**
 * Groq Structured Outputs schema (strict: true) mirroring resumeScannerAnalysisSchema.
 * Zod optionals are required here with empty/null/false allowed.
 */
export const RESUME_SCANNER_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'jobTitle',
    'company',
    'skills',
    'score',
    'jobRelevanceScore',
    'scoreBreakdown',
    'suggestions',
    'searchabilityIssues',
    'recruiterTips',
  ],
  properties: {
    jobTitle: { type: 'string' },
    company: { type: 'string' },
    skills: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'type', 'synonyms', 'matched', 'matchEvidence'],
        properties: {
          id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          type: { type: 'string', enum: ['required', 'hard', 'soft'] },
          synonyms: { type: 'array', items: { type: 'string' } },
          matched: { type: 'boolean' },
          matchEvidence: { type: 'string' },
        },
      },
    },
    score: { type: 'number', minimum: 0, maximum: 100 },
    jobRelevanceScore: { type: 'number', minimum: 0, maximum: 100 },
    scoreBreakdown: {
      type: 'object',
      additionalProperties: false,
      required: [
        'keywordCoverage',
        'sectionCompleteness',
        'searchability',
        'quantifiedAchievements',
      ],
      properties: {
        keywordCoverage: SCORE_COMPONENT_JSON_SCHEMA,
        sectionCompleteness: SCORE_COMPONENT_JSON_SCHEMA,
        searchability: SCORE_COMPONENT_JSON_SCHEMA,
        quantifiedAchievements: SCORE_COMPONENT_JSON_SCHEMA,
      },
    },
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'type',
          'original',
          'suggested',
          'reason',
          'impact',
          'targetSkillId',
          'fieldPath',
        ],
        properties: {
          id: { type: 'string', minLength: 1 },
          type: {
            type: 'string',
            enum: ['missing_keyword', 'reword', 'remove'],
          },
          original: { type: 'string' },
          suggested: { type: 'string' },
          reason: { type: 'string', minLength: 1 },
          impact: { type: 'number', minimum: 0, maximum: 10 },
          targetSkillId: { type: ['string', 'null'] },
          fieldPath: { type: 'string' },
        },
      },
    },
    searchabilityIssues: {
      type: 'array',
      items: { type: 'string' },
    },
    recruiterTips: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};
