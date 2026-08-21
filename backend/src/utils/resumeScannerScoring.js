import {
  clampScore,
  createSkillId,
  createSuggestionId,
  escapeRegExp,
  normalizeSkillToken,
  resolveStoredSkillId,
} from './resumeScannerTextUtils.js';
import { findPathForOriginal, getFieldByPath, findOriginalInText } from './structuredResume.js';

const ACRONYM_ALIASES = {
  ga4: ['google analytics 4', 'google analytics'],
  seo: ['search engine optimization'],
  b2b: ['business to business'],
  b2c: ['business to consumer'],
  api: ['application programming interface'],
  sql: ['structured query language'],
};

const ATS_WEIGHTS = {
  sectionCompleteness: 0.35,
  searchability: 0.35,
  quantifiedAchievements: 0.3,
};

const JOB_MATCH_KEYWORD_WEIGHT = 0.85;
const JOB_MATCH_AI_WEIGHT_DEFAULT = 0.15;
const JOB_MATCH_AI_WEIGHT_LOW_RELEVANCE = 0.1;
const RELEVANCE_GATE_THRESHOLD = 25;

const buildSkillPatterns = (skill) => {
  const names = [skill.name, ...(skill.synonyms || [])].filter(Boolean);
  const patterns = [];

  for (const name of names) {
    const normalized = normalizeSkillToken(name);
    if (!normalized) continue;
    patterns.push(new RegExp(`\\b${escapeRegExp(normalized).replace(/\s+/g, '\\s+')}\\b`, 'i'));

    const compact = normalized.replace(/\s+/g, '');
    if (compact.length >= 2) {
      patterns.push(new RegExp(`\\b${escapeRegExp(compact)}\\b`, 'i'));
    }

    const aliasList = ACRONYM_ALIASES[normalized] || [];
    for (const alias of aliasList) {
      patterns.push(new RegExp(`\\b${escapeRegExp(alias).replace(/\s+/g, '\\s+')}\\b`, 'i'));
    }

    // Compound skills like "On-Page SEO" may appear as "On-Page, Off-Page, Technical SEO".
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const [head, ...tail] = tokens;
      const tailPhrase = tail.join('\\s+');
      patterns.push(
        new RegExp(
          `\\b${escapeRegExp(head).replace(/\s+/g, '\\s+')}[\\s,/&-]+(?:\\w+[\\s,/&-]+){0,4}${tailPhrase}\\b`,
          'i'
        )
      );
    }
  }

  return patterns;
};

export const findTextOffset = (haystack, needle) => {
  const match = findOriginalInText(haystack, needle);
  if (match) {
    return { charStart: match.start, charEnd: match.end };
  }
  return { charStart: -1, charEnd: -1 };
};

export const skillMatchesResume = (resumeText, skill) => {
  const text = String(resumeText || '');
  const patterns = buildSkillPatterns(skill);
  const matchedPattern = patterns.find((pattern) => pattern.test(text));

  if (!matchedPattern) {
    return { matched: false, evidence: '' };
  }

  const match = text.match(matchedPattern);
  return {
    matched: true,
    evidence: match?.[0] || skill.name,
  };
};

/** Plain skill shape — never spread Mongoose subdocs (loses name/type/synonyms). */
const toPlainSkillForMatch = (skill = {}, index = 0) => {
  const plain =
    skill && typeof skill.toObject === 'function'
      ? skill.toObject({ virtuals: false })
      : skill && typeof skill === 'object'
        ? skill
        : {};

  const name = String(plain.name || plain.skillName || plain.label || skill?.name || '').trim();
  const id =
    resolveStoredSkillId(skill) ||
    resolveStoredSkillId(plain) ||
    plain.id ||
    createSkillId(name, index);

  return {
    id: String(id || createSkillId(name || 'item', index)),
    name,
    type: plain.type || skill?.type || 'hard',
    synonyms: Array.isArray(plain.synonyms)
      ? plain.synonyms.map((item) => String(item || '')).filter(Boolean)
      : Array.isArray(skill?.synonyms)
        ? skill.synonyms.map((item) => String(item || '')).filter(Boolean)
        : [],
  };
};

export const computeSkillMatches = (resumeText, skills = []) => {
  const matchedSkillIds = [];
  const missingSkillIds = [];

  const enrichedSkills = (Array.isArray(skills) ? skills : []).map((skill, index) => {
    const withId = toPlainSkillForMatch(skill, index);
    const { matched, evidence } = skillMatchesResume(resumeText, withId);

    if (matched) {
      matchedSkillIds.push(withId.id);
    } else {
      missingSkillIds.push(withId.id);
    }

    return {
      ...withId,
      matched,
      matchEvidence: evidence,
    };
  });

  return {
    skills: enrichedSkills,
    matchedSkillIds,
    missingSkillIds,
  };
};

export const computeKeywordCoverageScore = (skills = []) => {
  const relevant = skills.filter((skill) => skill.type === 'required' || skill.type === 'hard');
  if (!relevant.length) return 0;
  const matched = relevant.filter((skill) => skill.matched).length;
  return clampScore((matched / relevant.length) * 100);
};

/** Near-zero coverage used for unrelated CV/JD UI banner (not empty-JD-skills). */
export const FIELD_MISMATCH_COVERAGE_THRESHOLD = 5;

export const hasExtractableJobSkills = (skills = []) => {
  const list = Array.isArray(skills) ? skills : [];
  return list.some((skill) => {
    const type = skill?.type || 'hard';
    return type === 'required' || type === 'hard' || type === 'soft';
  });
};

export const isFieldMismatchCoverage = (keywordCoverage, skills = []) => {
  if (!hasExtractableJobSkills(skills)) return false;
  return clampScore(keywordCoverage) < FIELD_MISMATCH_COVERAGE_THRESHOLD;
};

export const computeQuantifiedAchievementsScore = (resumeText = '') => {
  const lines = String(resumeText).split('\n');
  const metricPattern = /(\d+%|\$\d+|\d+\+?|\d+\s*(?:k|m|b)\b)/i;
  const metricLines = lines.filter((line) => metricPattern.test(line)).length;
  if (!metricLines) return 20;
  if (metricLines >= 5) return 95;
  if (metricLines >= 3) return 80;
  if (metricLines >= 1) return 60;
  return 30;
};

export const computeSectionCompletenessScore = (structuredSections = {}, resumeText = '') => {
  const text = resumeText.toLowerCase();
  let points = 0;

  if (structuredSections?.summary?.text || /summary|profile|objective/.test(text)) points += 25;
  if (structuredSections?.experience?.text || /experience|employment/.test(text)) points += 35;
  if (structuredSections?.education?.text || /education|university|bachelor|master/.test(text)) points += 20;
  if (structuredSections?.skills?.text || /skills|expertise|competencies/.test(text)) points += 20;

  return clampScore(points);
};

export const computeSearchabilityScore = (resumeText = '', searchabilityIssues = []) => {
  let score = 85;
  const text = resumeText.toLowerCase();

  if (!/@/.test(text)) score -= 15;
  if (!/(linkedin|github|phone|\d{3})/.test(text)) score -= 10;
  score -= Math.min(30, searchabilityIssues.length * 5);

  return clampScore(score);
};

export const computeAtsScore = ({
  resumeText = '',
  structuredSections = {},
  searchabilityIssues = [],
}) => {
  const sectionCompleteness = computeSectionCompletenessScore(structuredSections, resumeText);
  const searchability = computeSearchabilityScore(resumeText, searchabilityIssues);
  const quantifiedAchievements = computeQuantifiedAchievementsScore(resumeText);

  const atsScore = clampScore(
    sectionCompleteness * ATS_WEIGHTS.sectionCompleteness +
      searchability * ATS_WEIGHTS.searchability +
      quantifiedAchievements * ATS_WEIGHTS.quantifiedAchievements
  );

  return {
    atsScore,
    atsScoreBreakdown: {
      sectionCompleteness,
      searchability,
      quantifiedAchievements,
    },
  };
};

export const computeJobMatchScore = ({ skills = [], aiAssessedRelevance = 0 }) => {
  const keywordCoverage = computeKeywordCoverageScore(skills);
  // aiAssessedRelevance here is the Analyze LLM composite quality score (keywords +
  // structure + searchability + achievements), NOT jobRelevanceScore / field fit.
  const aiRelevance = clampScore(aiAssessedRelevance);
  const aiWeight =
    keywordCoverage < RELEVANCE_GATE_THRESHOLD
      ? JOB_MATCH_AI_WEIGHT_LOW_RELEVANCE
      : JOB_MATCH_AI_WEIGHT_DEFAULT;

  const blended = clampScore(
    keywordCoverage * JOB_MATCH_KEYWORD_WEIGHT + aiRelevance * aiWeight
  );

  let jobMatchScore = blended;
  if (keywordCoverage < RELEVANCE_GATE_THRESHOLD) {
    const gateCap = clampScore(keywordCoverage * 0.6 + 5);
    jobMatchScore = Math.min(blended, gateCap);
  }

  return {
    jobMatchScore,
    jobMatchBreakdown: {
      keywordCoverage,
      aiAssessedRelevance: aiRelevance,
    },
  };
};

export const computeAnalysisScores = ({
  resumeText = '',
  structuredSections = {},
  searchabilityIssues = [],
  skills = [],
  aiAssessedRelevance = 0,
}) => {
  const skillMatch = computeSkillMatches(resumeText, skills);
  const ats = computeAtsScore({ resumeText, structuredSections, searchabilityIssues });
  const jobMatch = computeJobMatchScore({
    skills: skillMatch.skills,
    aiAssessedRelevance,
  });

  return {
    ...ats,
    ...jobMatch,
    skills: skillMatch.skills,
    matchedSkillIds: skillMatch.matchedSkillIds,
    missingSkillIds: skillMatch.missingSkillIds,
  };
};

export const anchorSuggestionsToResume = (resumeText, suggestions = [], structuredResume = null) =>
  suggestions
    .map((suggestion, index) => {
      let fieldPath = String(suggestion.fieldPath || '').trim();
      if (!fieldPath && structuredResume) {
        fieldPath = findPathForOriginal(structuredResume, suggestion.original);
      }

      let charStart = -1;
      let charEnd = -1;

      if (fieldPath && structuredResume) {
        const fieldValue = String(getFieldByPath(structuredResume, fieldPath) ?? '');
        const offsets = findTextOffset(fieldValue, suggestion.original);
        charStart = offsets.charStart;
        charEnd = offsets.charEnd;
      } else {
        const offsets = findTextOffset(resumeText, suggestion.original);
        charStart = offsets.charStart;
        charEnd = offsets.charEnd;
      }

      if (charStart < 0 && suggestion.type !== 'missing_keyword' && !fieldPath) {
        return null;
      }

      return {
        ...suggestion,
        id: suggestion.id || createSuggestionId(index),
        status: 'pending',
        fieldPath,
        charStart,
        charEnd,
        targetSkillId: suggestion.targetSkillId || null,
      };
    })
    .filter(Boolean);

export const countSuggestionStats = (suggestions = []) => {
  const pending = suggestions.filter((item) => item.status === 'pending');
  const accepted = suggestions.filter((item) => item.status === 'accepted');
  return {
    total: suggestions.length,
    pending: pending.length,
    accepted: accepted.length,
  };
};
