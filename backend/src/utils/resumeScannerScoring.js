import {
  clampScore,
  createSkillId,
  createSuggestionId,
  escapeRegExp,
  normalizeSkillToken,
  resolveStoredSkillId,
} from './resumeScannerTextUtils.js';

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
  if (!needle) return { charStart: -1, charEnd: -1 };

  const directIndex = haystack.indexOf(needle);
  if (directIndex >= 0) {
    return { charStart: directIndex, charEnd: directIndex + needle.length };
  }

  const pattern = new RegExp(escapeRegExp(needle).replace(/\s+/g, '\\s+'), 'i');
  const match = pattern.exec(haystack);
  if (match) {
    return { charStart: match.index, charEnd: match.index + match[0].length };
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

export const computeSkillMatches = (resumeText, skills = []) => {
  const matchedSkillIds = [];
  const missingSkillIds = [];

  const enrichedSkills = skills.map((skill, index) => {
    const withId = {
      ...skill,
      id: resolveStoredSkillId(skill) || skill.id || createSkillId(skill.name, index),
    };
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

/** @deprecated Use computeAnalysisScores instead. */
export const blendAtsScore = (input) => {
  const result = computeAnalysisScores({
    resumeText: input.resumeText,
    structuredSections: input.structuredSections,
    searchabilityIssues: input.searchabilityIssues,
    skills: input.skills,
    aiAssessedRelevance: input.aiScore,
  });

  return {
    score: result.jobMatchScore,
    scoreBreakdown: {
      keywordCoverage: {
        score: result.jobMatchBreakdown.keywordCoverage,
        weight: 85,
        weighted: (result.jobMatchBreakdown.keywordCoverage * 85) / 100,
      },
      sectionCompleteness: {
        score: result.atsScoreBreakdown.sectionCompleteness,
        weight: 35,
        weighted: (result.atsScoreBreakdown.sectionCompleteness * 35) / 100,
      },
      searchability: {
        score: result.atsScoreBreakdown.searchability,
        weight: 35,
        weighted: (result.atsScoreBreakdown.searchability * 35) / 100,
      },
      quantifiedAchievements: {
        score: result.atsScoreBreakdown.quantifiedAchievements,
        weight: 30,
        weighted: (result.atsScoreBreakdown.quantifiedAchievements * 30) / 100,
      },
    },
    atsScore: result.atsScore,
    atsScoreBreakdown: result.atsScoreBreakdown,
    jobMatchScore: result.jobMatchScore,
    jobMatchBreakdown: result.jobMatchBreakdown,
  };
};

export const anchorSuggestionsToResume = (resumeText, suggestions = []) =>
  suggestions
    .map((suggestion, index) => {
      const { charStart, charEnd } = findTextOffset(resumeText, suggestion.original);
      if (charStart < 0 && suggestion.type !== 'missing_keyword') {
        return null;
      }

      return {
        ...suggestion,
        id: suggestion.id || createSuggestionId(index),
        status: 'pending',
        charStart,
        charEnd,
        targetSkillId: suggestion.targetSkillId || null,
      };
    })
    .filter(Boolean);

export const applySuggestionToText = (resumeText, suggestion) => {
  const text = String(resumeText || '');

  if (suggestion.charStart >= 0 && suggestion.charEnd > suggestion.charStart) {
    const before = text.slice(0, suggestion.charStart);
    const after = text.slice(suggestion.charEnd);
    const replacement = suggestion.type === 'remove' ? '' : suggestion.suggested;
    return `${before}${replacement}${after}`;
  }

  if (suggestion.original && text.includes(suggestion.original)) {
    const replacement = suggestion.type === 'remove' ? '' : suggestion.suggested;
    return text.replace(suggestion.original, replacement);
  }

  if (suggestion.type === 'missing_keyword' && suggestion.suggested) {
    return `${text}\n${suggestion.suggested}`.trim();
  }

  return text;
};

export const countSuggestionStats = (suggestions = []) => {
  const pending = suggestions.filter((item) => item.status === 'pending');
  const accepted = suggestions.filter((item) => item.status === 'accepted');
  return {
    total: suggestions.length,
    pending: pending.length,
    accepted: accepted.length,
  };
};
