import {
  countSuggestionStats,
  hasExtractableJobSkills,
  isFieldMismatchCoverage,
} from './resumeScannerScoring.js';
import { resolveStoredSkillId } from './resumeScannerTextUtils.js';
import { emptyParsedData, normalizeParsedData } from './resumeScannerParsedData.js';
import {
  cloneStructuredResume,
  generateAtsText,
  hasStructuredResumeData,
} from './structuredResume.js';

const isLowExtractionQuality = (extractionMetadata = null) => {
  if (!extractionMetadata || typeof extractionMetadata !== 'object') return false;
  const source = String(extractionMetadata.source || '').toLowerCase();
  const mode = String(extractionMetadata.extraction_mode || '').toLowerCase();
  if (source === 'node-fallback' || source === 'ocr') return true;
  if (mode === 'scanned' || mode === 'mixed') return true;
  return false;
};

const toPlainSkill = (skill = {}) => {
  const plain = typeof skill?.toObject === 'function' ? skill.toObject({ virtuals: false }) : skill;
  return {
    id: resolveStoredSkillId(skill) || plain.id || '',
    name: plain.name || plain.skillName || plain.label || plain.skill || '',
    type: plain.type || 'hard',
    synonyms: Array.isArray(plain.synonyms) ? plain.synonyms : [],
  };
};

const serializeSkill = (skill, jobDescription) => {
  const normalized = toPlainSkill(skill);
  const fromJob = jobDescription?.extractedSkills?.find(
    (item) => resolveStoredSkillId(item) === normalized.id
  );
  const jobPlain = fromJob ? toPlainSkill(fromJob) : null;

  return {
    id: normalized.id,
    name: normalized.name || jobPlain?.name || '',
    type: normalized.type || jobPlain?.type || 'hard',
    synonyms: normalized.synonyms.length ? normalized.synonyms : jobPlain?.synonyms || [],
    matched: Boolean(skill.matched),
    matchEvidence: skill.matchEvidence || '',
  };
};

export const serializeAtsAnalysis = (analysis, jobDescription = null, options = {}) => {
  const skills = (jobDescription?.extractedSkills || []).map((skill) => {
    const plain = toPlainSkill(skill);
    const matched = analysis.matchedSkillIds?.includes(plain.id);
    return {
      ...plain,
      matched,
    };
  });

  const suggestionStats = countSuggestionStats(analysis.suggestions || []);
  const atsScore = analysis.atsScore ?? 0;
  const jobMatchScore = analysis.jobMatchScore ?? analysis.score ?? 0;
  const jobMatchBreakdown = analysis.jobMatchBreakdown || {
    keywordCoverage: 0,
    aiAssessedRelevance: 0,
    jobRelevanceScore: 0,
  };
  const jdSkillsUnavailable = !hasExtractableJobSkills(jobDescription?.extractedSkills || []);
  const fieldMismatch = isFieldMismatchCoverage(jobMatchBreakdown.keywordCoverage, skills);
  const extractionMetadata = options.extractionMetadata || null;
  const lowExtractionQuality = isLowExtractionQuality(extractionMetadata);

  return {
    analysisId: analysis._id,
    status: analysis.status,
    statusMessage: analysis.statusMessage,
    progress: analysis.progress,
    resumeSourceType: analysis.resumeSourceType,
    resumeSourceId: analysis.resumeSourceId,
    jobDescriptionId: analysis.jobDescriptionId,
    atsScore,
    atsScoreBreakdown: analysis.atsScoreBreakdown || {
      sectionCompleteness: 0,
      searchability: 0,
      quantifiedAchievements: 0,
    },
    jobMatchScore: jdSkillsUnavailable ? null : jobMatchScore,
    jobMatchBreakdown,
    jobMatchUnavailable: jdSkillsUnavailable,
    warnings: {
      fieldMismatch,
      jdRequirementsUnclear: jdSkillsUnavailable,
      lowExtractionQuality,
    },
    extractionMetadata: extractionMetadata
      ? {
          source: extractionMetadata.source || '',
          extractionMode: extractionMetadata.extraction_mode || '',
          atsNormalized: Boolean(extractionMetadata.atsNormalized ?? extractionMetadata.ats_normalized),
          lowQuality: lowExtractionQuality,
        }
      : null,
    score: jdSkillsUnavailable ? null : jobMatchScore,
    matchedSkills: skills.filter((skill) => skill.matched),
    missingSkills: skills.filter((skill) => !skill.matched),
    skills: skills.map((skill) => serializeSkill(skill, jobDescription)),
    matchedSkillIds: analysis.matchedSkillIds,
    missingSkillIds: analysis.missingSkillIds,
    resumeText: analysis.resumeText,
    originalResumeText: analysis.originalResumeText,
    lineMap: analysis.lineMap || [],
    structuredResume: analysis.structuredResume || cloneStructuredResume({}),
    parsedData: normalizeParsedData(analysis.parsedData || emptyParsedData()),
    templateId: analysis.templateId || 'classic',
    structuredSections: analysis.structuredSections,
    suggestions: analysis.suggestions,
    searchabilityIssues: analysis.searchabilityIssues,
    recruiterTips: analysis.recruiterTips,
    jobDescription: jobDescription
      ? {
          id: jobDescription._id,
          title: jobDescription.title,
          company: jobDescription.company,
          rawText: jobDescription.rawText,
        }
      : null,
    suggestionStats,
    analysisMode: analysis.analysisMode || 'optimize',
    rewriteStatus: analysis.rewriteStatus || 'none',
    rewriteTriggerReason: analysis.rewriteTriggerReason || '',
    decisionContext: analysis.decisionContext || null,
    rewrittenResume: analysis.rewrittenResume || cloneStructuredResume({}),
    rewrittenParsedData: analysis.rewrittenParsedData || {},
    rewriteNotes: analysis.rewriteNotes || [],
    rewrittenText: analysis.rewrittenResume ? generateAtsText(analysis.rewrittenResume) : '',
    finalizedAt: analysis.finalizedAt || null,
    canDownloadPdf: Boolean(
      analysis.status === 'completed' &&
        analysis.rewriteStatus !== 'pending_review' &&
        analysis.finalizedAt &&
        hasStructuredResumeData(analysis.finalizedStructuredResume)
    ),
    history: {
      canUndo: analysis.historyIndex > 0,
      canRedo:
        analysis.historyIndex >= 0 && analysis.historyIndex < (analysis.history?.length || 0) - 1,
    },
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
};
