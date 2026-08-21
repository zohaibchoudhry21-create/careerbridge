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
import { computeJobMatchScore, computeSkillMatches } from '../../utils/resumeScannerScoring.js';
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
  analysis.jobMatchBreakdown = {
    ...recomputed.jobMatchBreakdown,
    jobRelevanceScore:
      Number(recomputed.jobMatchBreakdown?.jobRelevanceScore) ||
      Number(analysis.jobMatchBreakdown?.jobRelevanceScore) ||
      0,
  };
  analysis.suggestions = recomputed.suggestions;
  analysis.matchedSkillIds = recomputed.matchedSkillIds;
  analysis.missingSkillIds = recomputed.missingSkillIds;
  analysis.markModified('structuredResume');
  analysis.markModified('structuredSections');
  analysis.markModified('lineMap');
};

/** Snapshot score fields before accept so we can enforce a non-decreasing floor. */
export const captureJobMatchSnapshot = (analysis) => ({
  atsScore: Number(analysis.atsScore) || 0,
  atsScoreBreakdown: {
    sectionCompleteness: Number(analysis.atsScoreBreakdown?.sectionCompleteness) || 0,
    searchability: Number(analysis.atsScoreBreakdown?.searchability) || 0,
    quantifiedAchievements: Number(analysis.atsScoreBreakdown?.quantifiedAchievements) || 0,
  },
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
 * Accepting a suggestion should never lower Job Match or ATS — reword/remove can drop
 * keyword evidence on recompute (especially when scoring from generateAtsText), and
 * stale editor saves can race; floor the stored scores before the single save.
 */
export const enforceAcceptJobMatchFloor = (analysis, snapshot) => {
  if (!snapshot) return;

  const prevAts = Number(snapshot.atsScore) || 0;
  const currentAts = Number(analysis.atsScore) || 0;
  if (currentAts < prevAts) {
    analysis.atsScore = prevAts;
    if (snapshot.atsScoreBreakdown) {
      analysis.atsScoreBreakdown = {
        ...analysis.atsScoreBreakdown,
        ...snapshot.atsScoreBreakdown,
      };
      analysis.markModified('atsScoreBreakdown');
    }
  }

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
  // Prefer structured → ATS text so skill matching matches what the editor shows.
  // Stale/empty resumeText after apply was marking SEO unmatched while UI still showed SEO.
  let resumeText = '';
  if (hasStructuredResumeData(analysis.structuredResume)) {
    resumeText = generateAtsText(analysis.structuredResume);
    if (resumeText) {
      analysis.resumeText = resumeText;
    }
  }
  if (!resumeText) {
    resumeText = resolveCanonicalResumeText({
      resumeText: analysis.resumeText,
      lineMap: analysis.lineMap,
    });
  }
  const skillMatch = computeSkillMatches(resumeText, jobDescription.extractedSkills);
  analysis.matchedSkillIds = skillMatch.matchedSkillIds;
  analysis.missingSkillIds = skillMatch.missingSkillIds;
  return skillMatch;
};

/**
 * Repair Job Match after the mongoose-subdoc skill-name bug collapsed coverage to ~0
 * (UI showed SEO unmatched / score ~5 while resume text still had the keywords).
 * Returns true when persisted fields were updated.
 */
export const healJobMatchFromLiveSkills = (analysis, jobDescription, skillMatch = null) => {
  const live =
    skillMatch ||
    computeSkillMatches(
      resolveCanonicalResumeText({
        resumeText: analysis.resumeText,
        lineMap: analysis.lineMap,
      }) ||
        (hasStructuredResumeData(analysis.structuredResume)
          ? generateAtsText(analysis.structuredResume)
          : ''),
      jobDescription.extractedSkills
    );

  const aiAssessedRelevance =
    Number(analysis.jobMatchBreakdown?.aiAssessedRelevance) || 0;
  const liveScores = computeJobMatchScore({
    skills: live.skills,
    aiAssessedRelevance,
  });

  const storedScore = Number(analysis.jobMatchScore) || 0;
  const storedCoverage = Number(analysis.jobMatchBreakdown?.keywordCoverage) || 0;
  const liveCoverage = Number(liveScores.jobMatchBreakdown.keywordCoverage) || 0;

  if (liveCoverage <= storedCoverage && liveScores.jobMatchScore <= storedScore) {
    return false;
  }

  analysis.matchedSkillIds = live.matchedSkillIds;
  analysis.missingSkillIds = live.missingSkillIds;
  analysis.jobMatchScore = Math.max(storedScore, liveScores.jobMatchScore);
  analysis.score = analysis.jobMatchScore;
  analysis.jobMatchBreakdown = {
    ...analysis.jobMatchBreakdown,
    keywordCoverage: Math.max(storedCoverage, liveCoverage),
    aiAssessedRelevance,
  };
  analysis.markModified('matchedSkillIds');
  analysis.markModified('missingSkillIds');
  analysis.markModified('jobMatchBreakdown');
  return true;
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

/** Recompute scores in memory — caller owns save (and any accept floor). */
export const recomputeInMemory = (analysis, jobDescription) => {
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
};

export const recomputeAndSave = async (analysis, jobDescription) => {
  recomputeInMemory(analysis, jobDescription);
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
