import { isAnthropicConfigured } from '../config/anthropicConfig.js';
import { isGeminiConfigured } from '../config/geminiConfig.js';
import { isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { analyzeResumeWithClaude } from './resumeScannerClaudeService.js';
import { analyzeResumeWithGemini } from './resumeScannerGeminiService.js';
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

  const payload = {
    resumeText: cleanResume.slice(0, 14000),
    jobDescriptionText: cleanJobDescription.slice(0, 12000),
    jobTitle: jobTitle.trim(),
  };

  let aiResult;
  let provider = 'none';
  let lastError;

  if (isGroqConfigured()) {
    try {
      console.info('[resume-scanner] Cascade: starting Groq (primary → fallback keys)...');
      aiResult = await analyzeResumeWithGroq(payload);
      provider = 'groq';
    } catch (error) {
      lastError = error;
      console.warn(
        '[resume-scanner] Cascade: all Groq keys failed:',
        error?.message || error
      );
    }
  }

  if (!aiResult && isGeminiConfigured()) {
    try {
      console.info('[resume-scanner] Cascade: Trying Gemini...');
      aiResult = await analyzeResumeWithGemini(payload);
      provider = 'gemini';
      console.info('[resume-scanner] Cascade: Gemini succeeded');
    } catch (error) {
      lastError = error;
      console.warn('[resume-scanner] Cascade: Gemini failed:', error?.message || error);
    }
  }

  if (!aiResult && isAnthropicConfigured()) {
    try {
      console.info('[resume-scanner] Cascade: Trying Claude...');
      aiResult = await analyzeResumeWithClaude(payload);
      provider = 'claude';
      console.info('[resume-scanner] Cascade: Claude succeeded');
    } catch (error) {
      lastError = error;
      console.warn('[resume-scanner] Cascade: Claude failed:', error?.message || error);
    }
  }

  if (!aiResult) {
    if (lastError) throw lastError;
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
