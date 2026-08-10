/**
 * Resume Scanner background job lifecycle.
 * Owns in-process job guard + analysis pipeline execution.
 *
 * Flow:
 *   Upload creates pending AtsAnalysis + stub ScannedResume (no extract wait)
 *   Background: extract file → analyzing (LLM) → Decision → Optimize | Rewrite
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

const buildSourceFileMeta = (file) => {
  const filename = file?.originalname || 'resume.pdf';
  return {
    filename,
    mimeType: file?.mimetype || '',
    size: file?.size || file?.buffer?.length || 0,
    extension: filename.includes('.') ? filename.split('.').pop().toLowerCase() : '',
  };
};

/**
 * Snapshot multer file so background work keeps a stable buffer after the
 * upload request returns (memoryStorage buffer is still valid in-process).
 */
const snapshotUploadFile = (file) => {
  if (!file?.buffer) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.FILE_REQUIRED, 400);
  }

  return {
    buffer: Buffer.from(file.buffer),
    originalname: file.originalname || 'resume.pdf',
    mimetype: file.mimetype || '',
    size: file.size || file.buffer.length,
  };
};

/**
 * Create JD + stub ScannedResume + pending AtsAnalysis.
 * Does NOT run extraction — Orchestrator enqueues that in the background.
 */
export const createAnalysisJob = async ({ userId, file, jobDescriptionText }) => {
  const cleanJd = sanitizeResumeScannerText(jobDescriptionText);
  if (!cleanJd) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED, 400);
  }

  if (!file?.buffer) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.FILE_REQUIRED, 400);
  }

  const sourceFile = buildSourceFileMeta(file);

  const scannedResume = await ScannedResume.create({
    userId,
    label: sourceFile.filename || 'Uploaded Resume',
    sourceFile,
    extractedText: '',
    structuredSections: {},
    lineMap: [],
    extractionMetadata: {},
  });

  const jobDescription = await JobDescription.create({
    userId,
    rawText: cleanJd,
  });

  const analysis = await AtsAnalysis.create({
    userId,
    resumeSourceType: 'scanned',
    resumeSourceId: scannedResume._id,
    jobDescriptionId: jobDescription._id,
    status: 'pending',
    progress: 5,
    statusMessage: 'Queued for analysis...',
    resumeText: '',
    originalResumeText: '',
    structuredResume: {},
    structuredSections: {},
    lineMap: [],
  });

  return analysis;
};

export const enqueueAnalysisPipeline = (analysisId, userId, { file } = {}) => {
  const fileSnapshot = file ? snapshotUploadFile(file) : null;

  setImmediate(() => {
    runAnalysisPipeline(analysisId, userId, { file: fileSnapshot }).catch((error) => {
      console.error('[resume-scanner] Background job error:', error);
    });
  });
};

/**
 * Apply extraction results onto ScannedResume + AtsAnalysis before AI starts.
 */
const applyExtractionToAnalysis = async (analysis, extraction) => {
  const scannedResume = await ScannedResume.findById(analysis.resumeSourceId);
  if (!scannedResume) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_NOT_FOUND, 404);
  }

  scannedResume.label = extraction.sourceFile?.filename || scannedResume.label;
  scannedResume.sourceFile = extraction.sourceFile || scannedResume.sourceFile;
  scannedResume.extractedText = extraction.extractedText || '';
  scannedResume.structuredSections = extraction.structuredSections || {};
  scannedResume.lineMap = extraction.lineMap || [];
  scannedResume.extractionMetadata = extraction.extractionMetadata || {};
  scannedResume.markModified('sourceFile');
  scannedResume.markModified('structuredSections');
  scannedResume.markModified('lineMap');
  scannedResume.markModified('extractionMetadata');
  await scannedResume.save();

  const canonicalResumeText = resolveCanonicalResumeText({
    resumeText: extraction.extractedText,
    lineMap: extraction.lineMap,
  });
  const structuredResume = parseAtsTextToStructured(canonicalResumeText);
  const derivedText = generateAtsText(structuredResume) || canonicalResumeText;

  if (!sanitizeResumeScannerText(derivedText || canonicalResumeText)) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
  }

  analysis.resumeText = derivedText;
  analysis.originalResumeText = derivedText;
  analysis.structuredResume = structuredResume;
  analysis.structuredSections = structuredResumeToSections(structuredResume);
  analysis.lineMap = extraction.lineMap || [];
  analysis.markModified('structuredResume');
  analysis.markModified('structuredSections');
  analysis.markModified('lineMap');
  await analysis.save();

  return { structuredResume, derivedText, resumeText: derivedText || canonicalResumeText };
};

export const runAnalysisPipeline = async (analysisId, userId, { file } = {}) => {
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

    // --- Step 1: real file extraction (Python → Node fallback) ---
    await updateAnalysisProgress(analysisId, {
      status: 'extracting',
      progress: 15,
      statusMessage: 'Extracting text from your resume...',
    });

    if (!file?.buffer) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.FILE_REQUIRED, 400);
    }

    const extraction = await extractResumeForScanner(file);
    const { structuredResume, derivedText, resumeText } = await applyExtractionToAnalysis(
      analysis,
      extraction
    );

    await updateAnalysisProgress(analysisId, {
      progress: 30,
      statusMessage: 'Resume text ready. Starting analysis...',
    });

    // Reload so later saves use fresh version after applyExtractionToAnalysis.
    const analysisFresh = await loadAnalysisForUser(analysisId, userId);

    const ensuredStructured = ensureStructuredResume({
      ...analysisFresh.toObject(),
      resumeText,
      structuredResume,
    });
    const ensuredDerivedText = generateAtsText(ensuredStructured) || derivedText || resumeText;

    await updateAnalysisProgress(analysisId, {
      status: 'analyzing',
      progress: 45,
      statusMessage: 'Extracting skills from job description...',
    });

    const initialAiResult = await analyzeResumeAgainstJob({
      resumeText: ensuredDerivedText || resumeText,
      jobDescriptionText: jobDescription.rawText,
      jobTitle: jobDescription.title || '',
      structuredSections: structuredResumeToSections(ensuredStructured),
      structuredResume: ensuredStructured,
    });

    const parsedData = structuredResumeToParsedData(
      ensuredStructured,
      analysisFresh.parsedData
    );

    await updateAnalysisProgress(analysisId, {
      progress: 55,
      statusMessage: 'Running similarity & rewrite decision engine...',
    });

    // Decision Engine — once per job. Downstream rewrite reuses this context.
    const decisionContext = runDecisionEngine({
      resumeText: ensuredDerivedText || resumeText,
      structuredResume: ensuredStructured,
      parsedData,
      jobDescriptionText: jobDescription.rawText,
      jobTitle: jobDescription.title || initialAiResult.jobTitle || '',
      analyzeResult: initialAiResult,
    });

    analysisFresh.decisionContext = serializeDecisionContext(decisionContext);
    analysisFresh.markModified('decisionContext');

    const useRewriteMode = decisionContext.mode === 'rewrite';
    let aiResult = initialAiResult;

    if (useRewriteMode) {
      const rewriteResult = await rewriteResumeFromJD({
        resumeText: ensuredDerivedText || resumeText,
        structuredResume: ensuredStructured,
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

      analysisFresh.analysisMode = 'rewrite';
      analysisFresh.rewriteStatus = 'pending_review';
      analysisFresh.rewriteTriggerReason = decisionContext.reason || 'low_match';
      analysisFresh.rewrittenResume = rewriteResult.rewrittenResume;
      analysisFresh.rewrittenParsedData = rewriteResult.rewrittenParsedData;
      analysisFresh.rewriteNotes = rewriteResult.rewriteNotes || [];
      analysisFresh.pendingOptimizationSuggestions = initialAiResult.suggestions;
      analysisFresh.suggestions = [];
      analysisFresh.markModified('rewrittenResume');
      analysisFresh.markModified('rewrittenParsedData');
      analysisFresh.markModified('rewriteNotes');
      analysisFresh.markModified('pendingOptimizationSuggestions');

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
        jobMatchBreakdown: {
          ...preview.jobMatchBreakdown,
          // Preserve Analyze-time field-fit signal (not recomputed on rewrite preview).
          jobRelevanceScore:
            Number(initialAiResult.jobMatchBreakdown?.jobRelevanceScore) ||
            Number(initialAiResult.jobRelevanceScore) ||
            0,
        },
        jobRelevanceScore:
          Number(initialAiResult.jobMatchBreakdown?.jobRelevanceScore) ||
          Number(initialAiResult.jobRelevanceScore) ||
          0,
        matchedSkillIds: preview.matchedSkillIds,
        missingSkillIds: preview.missingSkillIds,
      };
    } else {
      analysisFresh.analysisMode = 'optimize';
      analysisFresh.rewriteStatus = 'none';
      analysisFresh.rewriteTriggerReason = '';
      analysisFresh.rewrittenResume = {};
      analysisFresh.rewrittenParsedData = {};
      analysisFresh.rewriteNotes = [];
      analysisFresh.pendingOptimizationSuggestions = [];
      analysisFresh.suggestions = initialAiResult.suggestions;
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

    analysisFresh.status = 'completed';
    analysisFresh.progress = 100;
    analysisFresh.statusMessage = 'Analysis complete';
    analysisFresh.errorMessage = '';
    analysisFresh.score = aiResult.jobMatchScore;
    analysisFresh.atsScore = aiResult.atsScore;
    analysisFresh.jobMatchScore = aiResult.jobMatchScore;
    analysisFresh.atsScoreBreakdown = aiResult.atsScoreBreakdown;
    analysisFresh.jobMatchBreakdown = aiResult.jobMatchBreakdown;
    analysisFresh.matchedSkillIds = aiResult.matchedSkillIds;
    analysisFresh.missingSkillIds = aiResult.missingSkillIds;
    analysisFresh.suggestions = aiResult.suggestions;
    analysisFresh.searchabilityIssues = aiResult.searchabilityIssues;
    analysisFresh.recruiterTips = aiResult.recruiterTips;
    syncDerivedFromStructured(analysisFresh, ensuredStructured);
    analysisFresh.originalResumeText = analysisFresh.resumeText;
    if (!analysisFresh.templateId) {
      analysisFresh.templateId = 'classic';
    }
    initializeHistory(analysisFresh);
    await analysisFresh.save();
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
