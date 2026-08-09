/**
 * Structured resume sync & recompute helpers.
 * Keeps structuredResume as source of truth and derives text/sections/parsedData.
 */

import { resolveCanonicalResumeText } from '../../utils/resumeLineMapUtils.js';
import { recomputeAnalysisState } from '../../utils/resumeScannerAiService.js';
import {
  ensureAnalysisParsedData,
  structuredResumeToParsedData,
} from '../../utils/resumeScannerParsedData.js';
import { computeSkillMatches } from '../../utils/resumeScannerScoring.js';
import {
  cloneStructuredResume,
  findOriginalInText,
  generateAtsText,
  getFieldByPath,
  hasStructuredResumeData,
  parseAtsTextToStructured,
  structuredResumeToSections,
} from '../../utils/structuredResume.js';

export const ensureStructuredResume = (analysis) => {
  if (hasStructuredResumeData(analysis.structuredResume)) {
    return cloneStructuredResume(analysis.structuredResume);
  }
  return parseAtsTextToStructured(analysis.resumeText || '');
};

export const syncDerivedFromStructured = (analysis, structuredResume) => {
  const structured = cloneStructuredResume(structuredResume);
  analysis.structuredResume = structured;
  analysis.resumeText = generateAtsText(structured);
  analysis.structuredSections = structuredResumeToSections(structured);
  analysis.parsedData = structuredResumeToParsedData(structured, analysis.parsedData);
  analysis.lineMap = [];
  analysis.markModified('structuredResume');
  analysis.markModified('structuredSections');
  analysis.markModified('parsedData');
  analysis.markModified('lineMap');
};

export const applyRecomputedState = (analysis, recomputed) => {
  analysis.resumeText = recomputed.resumeText;
  analysis.structuredResume = cloneStructuredResume(recomputed.structuredResume);
  analysis.structuredSections = recomputed.structuredSections;
  analysis.lineMap = [];
  analysis.atsScore = recomputed.atsScore;
  analysis.jobMatchScore = recomputed.jobMatchScore;
  analysis.score = recomputed.jobMatchScore;
  analysis.atsScoreBreakdown = recomputed.atsScoreBreakdown;
  analysis.jobMatchBreakdown = recomputed.jobMatchBreakdown;
  analysis.suggestions = recomputed.suggestions;
  analysis.matchedSkillIds = recomputed.matchedSkillIds;
  analysis.missingSkillIds = recomputed.missingSkillIds;
  analysis.markModified('structuredResume');
  analysis.markModified('structuredSections');
  analysis.markModified('lineMap');
};

/** Snapshot job-match fields before accept so we can enforce a non-decreasing floor. */
export const captureJobMatchSnapshot = (analysis) => ({
  jobMatchScore: Number(analysis.jobMatchScore) || 0,
  jobMatchBreakdown: {
    keywordCoverage: Number(analysis.jobMatchBreakdown?.keywordCoverage) || 0,
    aiAssessedRelevance: Number(analysis.jobMatchBreakdown?.aiAssessedRelevance) || 0,
  },
  matchedSkillCount: (analysis.matchedSkillIds || []).length,
  matchedSkillIds: [...(analysis.matchedSkillIds || [])],
  missingSkillIds: [...(analysis.missingSkillIds || [])],
});

/**
 * Accepting a suggestion should never lower Job Match — reword/remove can drop keyword
 * evidence on recompute, and stale editor saves can race; floor the stored score.
 */
export const enforceAcceptJobMatchFloor = (analysis, snapshot) => {
  if (!snapshot) return;

  const prevScore = snapshot.jobMatchScore;
  const prevCoverage = snapshot.jobMatchBreakdown.keywordCoverage;
  const currentScore = Number(analysis.jobMatchScore) || 0;
  const currentCoverage = Number(analysis.jobMatchBreakdown?.keywordCoverage) || 0;
  const currentMatched = (analysis.matchedSkillIds || []).length;

  const coverageFloor = Math.max(prevCoverage, currentCoverage);
  const matchedCountFloor = Math.max(snapshot.matchedSkillCount, currentMatched);

  if (currentCoverage < coverageFloor) {
    analysis.jobMatchBreakdown = {
      ...analysis.jobMatchBreakdown,
      keywordCoverage: coverageFloor,
    };
    analysis.markModified('jobMatchBreakdown');
  }

  if (currentMatched < matchedCountFloor && snapshot.matchedSkillIds) {
    analysis.matchedSkillIds = snapshot.matchedSkillIds;
    analysis.missingSkillIds = snapshot.missingSkillIds;
    analysis.markModified('matchedSkillIds');
    analysis.markModified('missingSkillIds');
  }

  if (currentScore < prevScore) {
    analysis.jobMatchScore = prevScore;
    analysis.score = prevScore;
  }
};

export const refreshSkillState = (analysis, jobDescription) => {
  const resumeText = resolveCanonicalResumeText({
    resumeText: analysis.resumeText,
    lineMap: analysis.lineMap,
  });
  const skillMatch = computeSkillMatches(resumeText, jobDescription.extractedSkills);
  analysis.matchedSkillIds = skillMatch.matchedSkillIds;
  analysis.missingSkillIds = skillMatch.missingSkillIds;
};

/** Expire pending suggestions whose original text no longer exists in the resume. */
export const expireStalePendingSuggestions = (analysis) => {
  const structured = ensureStructuredResume(analysis);
  let changed = false;

  for (const suggestion of analysis.suggestions || []) {
    if (suggestion.status !== 'pending') continue;
    if (suggestion.type === 'missing_keyword') continue;

    const original = String(suggestion.original || '').trim();
    if (!original) {
      suggestion.status = 'unappliable';
      suggestion.applyError = 'original_not_found_in_field';
      changed = true;
      continue;
    }

    const path = String(suggestion.fieldPath || '').trim();
    if (path) {
      const fieldValue = String(getFieldByPath(structured, path) ?? '');
      if (findOriginalInText(fieldValue, original)) continue;
    }

    const flatText = analysis.resumeText || generateAtsText(structured);
    if (findOriginalInText(flatText, original)) continue;

    suggestion.status = 'unappliable';
    suggestion.applyError = 'original_not_found_in_field';
    changed = true;
  }

  if (changed) {
    analysis.markModified('suggestions');
  }
  return changed;
};

export const recomputeAndSave = async (analysis, jobDescription) => {
  const recomputed = recomputeAnalysisState({
    resumeText: analysis.resumeText,
    structuredResume: analysis.structuredResume,
    skills: jobDescription.extractedSkills,
    structuredSections: analysis.structuredSections,
    searchabilityIssues: analysis.searchabilityIssues,
    suggestions: analysis.suggestions,
    aiAssessedRelevance: analysis.jobMatchBreakdown?.aiAssessedRelevance || 0,
  });

  applyRecomputedState(analysis, recomputed);
  refreshSkillState(analysis, jobDescription);
  await analysis.save();
};

const isVersionConflictError = (error) =>
  error?.name === 'VersionError' ||
  error?.name === 'DocumentNotFoundError' ||
  /No matching document found for id/i.test(String(error?.message || ''));

/** Ensure structured + parsed data exist when reading a completed analysis. */
export const ensureAnalysisStructureForRead = async (analysis) => {
  try {
    if (!hasStructuredResumeData(analysis.structuredResume) && analysis.resumeText) {
      syncDerivedFromStructured(analysis, parseAtsTextToStructured(analysis.resumeText));
      await analysis.save();
      return;
    }

    ensureAnalysisParsedData(analysis);
    if (analysis.isModified('parsedData')) {
      await analysis.save();
    }
  } catch (error) {
    // GET enrichment must not fail the request on concurrent finalize/edit writes
    if (!isVersionConflictError(error)) {
      throw error;
    }
  }
};

export const syncAfterHistoryRestore = (analysis) => {
  if (!hasStructuredResumeData(analysis.structuredResume) && analysis.resumeText) {
    syncDerivedFromStructured(analysis, parseAtsTextToStructured(analysis.resumeText));
  } else {
    syncDerivedFromStructured(analysis, ensureStructuredResume(analysis));
  }
};
