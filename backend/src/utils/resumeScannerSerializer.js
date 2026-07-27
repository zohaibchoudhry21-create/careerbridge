import { countSuggestionStats } from './resumeScannerScoring.js';

const serializeSkill = (skill, jobDescription) => {
  const fromJob = jobDescription?.extractedSkills?.find((item) => item.id === skill.id);
  return {
    id: skill.id,
    name: skill.name || fromJob?.name || '',
    type: skill.type || fromJob?.type || 'hard',
    synonyms: skill.synonyms || fromJob?.synonyms || [],
    matched: Boolean(skill.matched),
    matchEvidence: skill.matchEvidence || '',
  };
};

export const serializeAtsAnalysis = (analysis, jobDescription = null) => {
  const skills = (jobDescription?.extractedSkills || []).map((skill) => {
    const matched = analysis.matchedSkillIds?.includes(skill.id);
    return {
      ...skill,
      matched,
    };
  });

  const suggestionStats = countSuggestionStats(analysis.suggestions || []);
  const atsScore = analysis.atsScore ?? 0;
  const jobMatchScore = analysis.jobMatchScore ?? analysis.score ?? 0;

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
    jobMatchScore,
    jobMatchBreakdown: analysis.jobMatchBreakdown || {
      keywordCoverage: 0,
      aiAssessedRelevance: 0,
    },
    score: jobMatchScore,
    matchedSkills: skills.filter((skill) => skill.matched),
    missingSkills: skills.filter((skill) => !skill.matched),
    skills: skills.map((skill) => serializeSkill(skill, jobDescription)),
    matchedSkillIds: analysis.matchedSkillIds,
    missingSkillIds: analysis.missingSkillIds,
    resumeText: analysis.resumeText,
    originalResumeText: analysis.originalResumeText,
    structuredSections: analysis.structuredSections,
    suggestions: analysis.suggestions,
    searchabilityIssues: analysis.searchabilityIssues,
    recruiterTips: analysis.recruiterTips,
    coverLetter: analysis.coverLetter,
    jobDescription: jobDescription
      ? {
          id: jobDescription._id,
          title: jobDescription.title,
          company: jobDescription.company,
          rawText: jobDescription.rawText,
        }
      : null,
    suggestionStats,
    history: {
      canUndo: analysis.historyIndex > 0,
      canRedo:
        analysis.historyIndex >= 0 && analysis.historyIndex < (analysis.history?.length || 0) - 1,
    },
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
};

export const serializeSavedResumeOption = (resume, sourceType) => {
  if (sourceType === 'built') {
    return {
      id: resume._id,
      sourceType: 'built',
      label: resume.name,
      updatedAt: resume.updatedAt,
    };
  }

  return {
    id: resume._id,
    sourceType: 'scanned',
    label: resume.label || resume.sourceFile?.filename || 'Uploaded Resume',
    updatedAt: resume.updatedAt,
  };
};
