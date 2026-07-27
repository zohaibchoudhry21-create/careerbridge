import { isAnthropicConfigured } from '../config/anthropicConfig.js';
import { isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { analyzeResumeWithClaude } from './resumeScannerClaudeService.js';
import { analyzeResumeWithGroq } from './resumeScannerGroqService.js';
import {
  anchorSuggestionsToResume,
  blendAtsScore,
  computeSkillMatches,
} from './resumeScannerScoring.js';
import { sanitizeResumeScannerText } from './resumeScannerTextUtils.js';
import { AppError } from './sendResponse.js';

export const getResumeScannerAiProvider = () => {
  if (isGroqConfigured()) return 'groq';
  if (isAnthropicConfigured()) return 'claude';
  return 'none';
};

export const analyzeResumeAgainstJob = async ({
  resumeText,
  jobDescriptionText,
  structuredSections = {},
}) => {
  const cleanResume = sanitizeResumeScannerText(resumeText);
  const cleanJobDescription = sanitizeResumeScannerText(jobDescriptionText);

  if (!cleanResume) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
  }

  if (!cleanJobDescription) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED, 400);
  }

  let aiResult;
  let provider = 'none';

  if (isGroqConfigured()) {
    try {
      aiResult = await analyzeResumeWithGroq({
        resumeText: cleanResume.slice(0, 14000),
        jobDescriptionText: cleanJobDescription.slice(0, 12000),
      });
      provider = 'groq';
    } catch (error) {
      console.warn('[resume-scanner] Groq analysis failed:', error.message);
      if (!isAnthropicConfigured()) {
        throw error;
      }
    }
  }

  if (!aiResult && isAnthropicConfigured()) {
    aiResult = await analyzeResumeWithClaude({
      resumeText: cleanResume.slice(0, 14000),
      jobDescriptionText: cleanJobDescription.slice(0, 12000),
    });
    provider = 'claude';
  }

  if (!aiResult) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const skillMatch = computeSkillMatches(cleanResume, aiResult.skills);
  const anchoredSuggestions = anchorSuggestionsToResume(cleanResume, aiResult.suggestions);
  const { score, scoreBreakdown } = blendAtsScore({
    aiScore: aiResult.score,
    scoreBreakdown: aiResult.scoreBreakdown,
    skills: skillMatch.skills,
    resumeText: cleanResume,
    structuredSections,
    searchabilityIssues: aiResult.searchabilityIssues,
  });

  return {
    provider,
    jobTitle: aiResult.jobTitle,
    company: aiResult.company,
    skills: skillMatch.skills,
    matchedSkillIds: skillMatch.matchedSkillIds,
    missingSkillIds: skillMatch.missingSkillIds,
    score,
    scoreBreakdown,
    suggestions: anchoredSuggestions,
    searchabilityIssues: aiResult.searchabilityIssues,
    recruiterTips: aiResult.recruiterTips,
  };
};

export const recomputeAnalysisState = ({
  resumeText,
  skills,
  structuredSections = {},
  searchabilityIssues = [],
  suggestions = [],
}) => {
  const cleanResume = sanitizeResumeScannerText(resumeText);
  const skillMatch = computeSkillMatches(cleanResume, skills);

  const pendingSuggestions = suggestions.filter((item) => item.status === 'pending');
  const finalizedSuggestions = suggestions.filter((item) => item.status !== 'pending');

  const anchoredPending = anchorSuggestionsToResume(cleanResume, pendingSuggestions);
  const suggestionsWithStatus = [...finalizedSuggestions, ...anchoredPending];

  const { score, scoreBreakdown } = blendAtsScore({
    aiScore: 0,
    scoreBreakdown: {},
    skills: skillMatch.skills,
    resumeText: cleanResume,
    structuredSections,
    searchabilityIssues,
  });

  return {
    resumeText: cleanResume,
    skills: skillMatch.skills,
    matchedSkillIds: skillMatch.matchedSkillIds,
    missingSkillIds: skillMatch.missingSkillIds,
    score,
    scoreBreakdown,
    suggestions: suggestionsWithStatus,
  };
};
