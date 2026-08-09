/**
 * Resume Scanner background job lifecycle.
 * Owns in-process job guard + analysis pipeline execution.
 *
 * AI flow (Phase 2):
 *   Analysis (1 LLM) → Decision Engine once → Optimize | Rewrite(plan/rewrite/validate)
 * Preview scores after rewrite use deterministic recompute (0 LLM).
 */

import AtsAnalysis from '../../models/AtsAnalysis.js';
import JobDescription from '../../models/JobDescription.js';
import ScannedResume from '../../models/ScannedResume.js';
import { ERROR_CODES } from '../../constants/apiErrorCodes.js';
import { resolveCanonicalResumeText } from '../../utils/resumeLineMapUtils.js';
import {
  analyzeResumeAgainstJob,
  recomputeAnalysisState,
} from '../../utils/resumeScannerAiService.js';
import { extractResumeForScanner } from '../../utils/resumeScannerExtractionService.js';
import { initializeHistory } from '../../utils/resumeScannerHistory.js';
import {
  runDecisionEngine,
  serializeDecisionContext,
} from '../../utils/resumeScannerPipeline/index.js';
import { structuredResumeToParsedData } from '../../utils/resumeScannerParsedData.js';
import { rewriteResumeFromJD } from '../../utils/resumeScannerRewriteService.js';
import { sanitizeResumeScannerText } from '../../utils/resumeScannerTextUtils.js';
import {
  generateAtsText,
  parseAtsTextToStructured,
  structuredResumeToSections,
} from '../../utils/structuredResume.js';
import { AppError } from '../../utils/sendResponse.js';
import {
  loadAnalysisForUser,
  loadJobDescription,
  updateAnalysisProgress,
} from './analysisPersistence.js';
import {
  ensureStructuredResume,
  syncDerivedFromStructured,
} from './structureService.js';

const runningJobs = new Set();

export const resolveResumeSource = async ({ userId, file }) => {
  if (!file) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.FILE_REQUIRED, 400);
  }

  const extraction = await extractResumeForScanner(file);
  const scannedResume = await ScannedResume.create({
    userId,
    label: extraction.sourceFile?.filename || 'Uploaded Resume',
    sourceFile: extraction.sourceFile,
    extractedText: extraction.extractedText,
    structuredSections: extraction.structuredSections,
    lineMap: extraction.lineMap,
    extractionMetadata: extraction.extractionMetadata,
  });

  return {
    resumeSourceType: 'scanned',
    resumeSourceId: scannedResume._id,
    extractedText: extraction.extractedText,
    structuredSections: extraction.structuredSections,
    lineMap: extraction.lineMap,
    sourceFile: extraction.sourceFile,
  };
};

/**
 * Create JD + AtsAnalysis records and return the analysis document.
 * Does not start the background job — Orchestrator enqueues separately.
 */
export const createAnalysisJob = async ({ userId, file, jobDescriptionText }) => {
  const cleanJd = sanitizeResumeScannerText(jobDescriptionText);
  if (!cleanJd) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED, 400);
  }

  const resumeSource = await resolveResumeSource({ userId, file });

  const jobDescription = await JobDescription.create({
    userId,
    rawText: cleanJd,
  });

  const canonicalResumeText = resolveCanonicalResumeText({
    resumeText: resumeSource.extractedText,
    lineMap: resumeSource.lineMap,
  });
  const structuredResume = parseAtsTextToStructured(canonicalResumeText);
  const derivedText = generateAtsText(structuredResume) || canonicalResumeText;

  const analysis = await AtsAnalysis.create({
    userId,
    resumeSourceType: resumeSource.resumeSourceType,
    resumeSourceId: resumeSource.resumeSourceId,
    jobDescriptionId: jobDescription._id,
    status: 'pending',
    progress: 5,
    statusMessage: 'Queued for analysis...',
    resumeText: derivedText,
    originalResumeText: derivedText,
    structuredResume,
    structuredSections: structuredResumeToSections(structuredResume),
    lineMap: resumeSource.lineMap || [],
  });

  return analysis;
};

export const enqueueAnalysisPipeline = (analysisId, userId) => {
  setImmediate(() => {
    runAnalysisPipeline(analysisId, userId).catch((error) => {
      console.error('[resume-scanner] Background job error:', error);
    });
  });
};

export const runAnalysisPipeline = async (analysisId, userId) => {
  if (runningJobs.has(String(analysisId))) {
    console.warn(
      '[resume-scanner] Skipping duplicate pipeline run (already in progress):',
      String(analysisId)
    );
    return;
  }

  runningJobs.add(String(analysisId));

  try {
    const analysis = await loadAnalysisForUser(analysisId, userId);
    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);

    await updateAnalysisProgress(analysisId, {
      status: 'extracting',
      progress: 20,
      statusMessage: 'Preparing resume text...',
    });

    const resumeText = sanitizeResumeScannerText(
      resolveCanonicalResumeText({
        resumeText: analysis.resumeText,
        lineMap: analysis.lineMap,
      })
    );
    if (!resumeText) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
    }

    const structuredResume = ensureStructuredResume({
      ...analysis.toObject(),
      resumeText,
    });
    const derivedText = generateAtsText(structuredResume);

    await updateAnalysisProgress(analysisId, {
      status: 'analyzing',
      progress: 45,
      statusMessage: 'Extracting skills from job description...',
    });

    const initialAiResult = await analyzeResumeAgainstJob({
      resumeText: derivedText || resumeText,
      jobDescriptionText: jobDescription.rawText,
      jobTitle: jobDescription.title || '',
      structuredSections: structuredResumeToSections(structuredResume),
      structuredResume,
    });

    const parsedData = structuredResumeToParsedData(structuredResume, analysis.parsedData);

    await updateAnalysisProgress(analysisId, {
      progress: 55,
      statusMessage: 'Running similarity & rewrite decision engine...',
    });

    // Decision Engine — once per job. Downstream rewrite reuses this context.
    const decisionContext = runDecisionEngine({
      resumeText: derivedText || resumeText,
      structuredResume,
      parsedData,
      jobDescriptionText: jobDescription.rawText,
      jobTitle: jobDescription.title || initialAiResult.jobTitle || '',
      analyzeResult: initialAiResult,
    });

    analysis.decisionContext = serializeDecisionContext(decisionContext);
    analysis.markModified('decisionContext');

    const useRewriteMode = decisionContext.mode === 'rewrite';
    let aiResult = initialAiResult;

    if (useRewriteMode) {
      const rewriteResult = await rewriteResumeFromJD({
        resumeText: derivedText || resumeText,
        structuredResume,
        parsedData,
        jobDescriptionText: jobDescription.rawText,
        jobTitle: jobDescription.title || initialAiResult.jobTitle || '',
        targetSkills: initialAiResult.skills,
        analyzeResult: initialAiResult,
        decisionContext,
        onProgress: async ({ progress, statusMessage }) => {
          await updateAnalysisProgress(analysisId, { progress, statusMessage });
        },
      });

      analysis.analysisMode = 'rewrite';
      analysis.rewriteStatus = 'pending_review';
      analysis.rewriteTriggerReason = decisionContext.reason || 'low_match';
      analysis.rewrittenResume = rewriteResult.rewrittenResume;
      analysis.rewrittenParsedData = rewriteResult.rewrittenParsedData;
      analysis.rewriteNotes = rewriteResult.rewriteNotes || [];
      analysis.pendingOptimizationSuggestions = initialAiResult.suggestions;
      analysis.suggestions = [];
      analysis.markModified('rewrittenResume');
      analysis.markModified('rewrittenParsedData');
      analysis.markModified('rewriteNotes');
      analysis.markModified('pendingOptimizationSuggestions');

      // Deterministic preview scores — no second Analyze LLM call
      const preview = recomputeAnalysisState({
        resumeText: rewriteResult.rewrittenText,
        structuredResume: rewriteResult.rewrittenResume,
        skills: initialAiResult.skills,
        searchabilityIssues: initialAiResult.searchabilityIssues || [],
        suggestions: [],
        aiAssessedRelevance:
          Number(initialAiResult.jobMatchBreakdown?.aiAssessedRelevance) ||
          Number(initialAiResult.score) ||
          0,
      });

      aiResult = {
        jobTitle: initialAiResult.jobTitle,
        company: initialAiResult.company,
        skills: initialAiResult.skills,
        suggestions: [],
        searchabilityIssues: initialAiResult.searchabilityIssues,
        recruiterTips: initialAiResult.recruiterTips,
        atsScore: preview.atsScore,
        jobMatchScore: preview.jobMatchScore,
        score: preview.jobMatchScore,
        atsScoreBreakdown: preview.atsScoreBreakdown,
        jobMatchBreakdown: preview.jobMatchBreakdown,
        matchedSkillIds: preview.matchedSkillIds,
        missingSkillIds: preview.missingSkillIds,
      };
    } else {
      analysis.analysisMode = 'optimize';
      analysis.rewriteStatus = 'none';
      analysis.rewriteTriggerReason = '';
      analysis.rewrittenResume = {};
      analysis.rewrittenParsedData = {};
      analysis.rewriteNotes = [];
      analysis.pendingOptimizationSuggestions = [];
      analysis.suggestions = initialAiResult.suggestions;
    }

    await updateAnalysisProgress(analysisId, {
      progress: 92,
      statusMessage: useRewriteMode
        ? 'Rewrite ready for review...'
        : 'Generating ATS suggestions...',
    });

    jobDescription.title = aiResult.jobTitle || jobDescription.title;
    jobDescription.company = aiResult.company || jobDescription.company;
    jobDescription.extractedSkills = aiResult.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      type: skill.type,
      synonyms: skill.synonyms || [],
    }));
    await jobDescription.save();

    analysis.status = 'completed';
    analysis.progress = 100;
    analysis.statusMessage = 'Analysis complete';
    analysis.score = aiResult.jobMatchScore;
    analysis.atsScore = aiResult.atsScore;
    analysis.jobMatchScore = aiResult.jobMatchScore;
    analysis.atsScoreBreakdown = aiResult.atsScoreBreakdown;
    analysis.jobMatchBreakdown = aiResult.jobMatchBreakdown;
    analysis.matchedSkillIds = aiResult.matchedSkillIds;
    analysis.missingSkillIds = aiResult.missingSkillIds;
    analysis.suggestions = aiResult.suggestions;
    analysis.searchabilityIssues = aiResult.searchabilityIssues;
    analysis.recruiterTips = aiResult.recruiterTips;
    syncDerivedFromStructured(analysis, structuredResume);
    analysis.originalResumeText = analysis.resumeText;
    if (!analysis.templateId) {
      analysis.templateId = 'classic';
    }
    initializeHistory(analysis);
    await analysis.save();
  } catch (error) {
    console.error('[resume-scanner] Analysis pipeline failed:', error);
    await updateAnalysisProgress(analysisId, {
      status: 'failed',
      progress: 100,
      statusMessage: 'Analysis failed',
      errorMessage: error.message || 'Analysis failed',
    });
  } finally {
    runningJobs.delete(String(analysisId));
  }
};
