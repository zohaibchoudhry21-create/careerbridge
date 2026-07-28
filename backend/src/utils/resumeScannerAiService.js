import { isAnthropicConfigured } from '../config/anthropicConfig.js';
import { isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { analyzeResumeWithClaude } from './resumeScannerClaudeService.js';
import { analyzeResumeWithGroq } from './resumeScannerGroqService.js';
import {
  anchorSuggestionsToResume,
  computeAnalysisScores,
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
  jobTitle = '',
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
        jobTitle: jobTitle.trim(),
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
      jobTitle: jobTitle.trim(),
    });
    provider = 'claude';
  }

  if (!aiResult) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const skillMatch = computeSkillMatches(cleanResume, aiResult.skills);
  const scores = computeAnalysisScores({
    resumeText: cleanResume,
    structuredSections,
    searchabilityIssues: aiResult.searchabilityIssues,
    skills: skillMatch.skills,
    aiAssessedRelevance: aiResult.score,
  });
  const anchoredSuggestions = anchorSuggestionsToResume(cleanResume, aiResult.suggestions);

  return {
    provider,
    jobTitle: aiResult.jobTitle,
    company: aiResult.company,
    skills: scores.skills,
    matchedSkillIds: scores.matchedSkillIds,
    missingSkillIds: scores.missingSkillIds,
    atsScore: scores.atsScore,
    atsScoreBreakdown: scores.atsScoreBreakdown,
    jobMatchScore: scores.jobMatchScore,
    jobMatchBreakdown: scores.jobMatchBreakdown,
    score: scores.jobMatchScore,
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
  aiAssessedRelevance = 0,
}) => {
  const cleanResume = sanitizeResumeScannerText(resumeText);
  const pendingSuggestions = suggestions.filter((item) => item.status === 'pending');
  const finalizedSuggestions = suggestions.filter((item) => item.status !== 'pending');
  const anchoredPending = anchorSuggestionsToResume(cleanResume, pendingSuggestions);
  const suggestionsWithStatus = [...finalizedSuggestions, ...anchoredPending];

  const scores = computeAnalysisScores({
    resumeText: cleanResume,
    structuredSections,
    searchabilityIssues,
    skills,
    aiAssessedRelevance,
  });

  return {
    resumeText: cleanResume,
    skills: scores.skills,
    matchedSkillIds: scores.matchedSkillIds,
    missingSkillIds: scores.missingSkillIds,
    atsScore: scores.atsScore,
    atsScoreBreakdown: scores.atsScoreBreakdown,
    jobMatchScore: scores.jobMatchScore,
    jobMatchBreakdown: scores.jobMatchBreakdown,
    score: scores.jobMatchScore,
    suggestions: suggestionsWithStatus,
  };
};
