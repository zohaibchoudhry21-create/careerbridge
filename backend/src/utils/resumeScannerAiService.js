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
import { clampScore, sanitizeResumeScannerText } from './resumeScannerTextUtils.js';
import {
  cloneStructuredResume,
  generateAtsText,
  hasStructuredResumeData,
  parseAtsTextToStructured,
  structuredResumeToSections,
} from './structuredResume.js';
import { AppError } from './sendResponse.js';

export const analyzeResumeAgainstJob = async ({
  resumeText,
  jobDescriptionText,
  jobTitle = '',
  structuredSections = {},
  structuredResume = null,
}) => {
  const cleanResume = sanitizeResumeScannerText(resumeText);
  const cleanJobDescription = sanitizeResumeScannerText(jobDescriptionText);

  if (!cleanResume) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
  }

  if (!cleanJobDescription) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED, 400);
  }

  const structured =
    structuredResume && hasStructuredResumeData(structuredResume)
      ? cloneStructuredResume(structuredResume)
      : parseAtsTextToStructured(cleanResume);

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

  const sections = structuredSections && Object.keys(structuredSections).length
    ? structuredSections
    : structuredResumeToSections(structured);

  const skillMatch = computeSkillMatches(cleanResume, aiResult.skills);
  // aiResult.score is a composite quality score (keywords + structure + searchability +
  // achievements) — NOT job-field relevance. Used only for Job Match gauge blending.
  // jobRelevanceScore is the dedicated experience/field-fit signal for rewrite decisions.
  const scores = computeAnalysisScores({
    resumeText: cleanResume,
    structuredSections: sections,
    searchabilityIssues: aiResult.searchabilityIssues,
    skills: skillMatch.skills,
    aiAssessedRelevance: aiResult.score,
  });
  const jobRelevanceScore = clampScore(aiResult.jobRelevanceScore);
  const anchoredSuggestions = anchorSuggestionsToResume(
    cleanResume,
    aiResult.suggestions,
    structured
  );

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
    jobRelevanceScore,
    jobMatchBreakdown: {
      ...scores.jobMatchBreakdown,
      jobRelevanceScore,
    },
    score: scores.jobMatchScore,
    suggestions: anchoredSuggestions,
    searchabilityIssues: aiResult.searchabilityIssues,
    recruiterTips: aiResult.recruiterTips,
    structuredResume: structured,
  };
};

export const recomputeAnalysisState = ({
  resumeText,
  skills,
  structuredSections = {},
  structuredResume = null,
  searchabilityIssues = [],
  suggestions = [],
  aiAssessedRelevance = 0,
}) => {
  const structured =
    structuredResume && hasStructuredResumeData(structuredResume)
      ? cloneStructuredResume(structuredResume)
      : parseAtsTextToStructured(resumeText);

  const cleanResume = sanitizeResumeScannerText(
    resumeText || generateAtsText(structured)
  );
  const derivedText = generateAtsText(structured);
  const nextSections = structuredResumeToSections(structured);

  const pendingSuggestions = suggestions.filter((item) => item.status === 'pending');
  const finalizedSuggestions = suggestions.filter((item) => item.status !== 'pending');
  const anchoredPending = anchorSuggestionsToResume(derivedText, pendingSuggestions, structured);
  const suggestionsWithStatus = [...finalizedSuggestions, ...anchoredPending];

  const scores = computeAnalysisScores({
    resumeText: derivedText || cleanResume,
    structuredSections: nextSections,
    searchabilityIssues,
    skills,
    aiAssessedRelevance,
  });

  return {
    resumeText: derivedText || cleanResume,
    structuredResume: structured,
    structuredSections: nextSections,
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
