import BuiltResume from '../models/BuiltResume.js';
import AtsAnalysis from '../models/AtsAnalysis.js';
import JobDescription from '../models/JobDescription.js';
import ScannedResume from '../models/ScannedResume.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { serializeBuiltResumeToText } from '../utils/builtResumeTextSerializer.js';
import { analyzeResumeAgainstJob, recomputeAnalysisState } from '../utils/resumeScannerAiService.js';
import { extractResumeForScanner } from '../utils/resumeScannerExtractionService.js';
import {
  canRedo,
  canUndo,
  initializeHistory,
  pushHistoryEntry,
  redoAnalysis,
  undoAnalysis,
} from '../utils/resumeScannerHistory.js';
import {
  applySuggestionToText,
  computeSkillMatches,
} from '../utils/resumeScannerScoring.js';
import {
  serializeAtsAnalysis,
  serializeSavedResumeOption,
} from '../utils/resumeScannerSerializer.js';
import { sanitizeResumeScannerText } from '../utils/resumeScannerTextUtils.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';

const runningJobs = new Set();

const loadAnalysisForUser = async (analysisId, userId) => {
  const analysis = await AtsAnalysis.findOne({ _id: analysisId, userId });

  if (!analysis) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_FOUND, 404);
  }

  return analysis;
};

const loadJobDescription = async (jobDescriptionId, userId) => {
  const jobDescription = await JobDescription.findOne({ _id: jobDescriptionId, userId });
  if (!jobDescription) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_FOUND, 404);
  }
  return jobDescription;
};

const updateAnalysisProgress = async (analysisId, { status, progress, statusMessage, errorMessage }) => {
  await AtsAnalysis.findByIdAndUpdate(analysisId, {
    ...(status ? { status } : {}),
    ...(typeof progress === 'number' ? { progress } : {}),
    ...(statusMessage !== undefined ? { statusMessage } : {}),
    ...(errorMessage !== undefined ? { errorMessage } : {}),
  });
};

const resolveResumeSource = async ({ userId, mode, file, resumeSourceType, resumeSourceId }) => {
  if (mode === 'saved') {
    if (resumeSourceType === 'built') {
      const builtResume = await BuiltResume.findOne({ _id: resumeSourceId, userId });
      if (!builtResume) {
        throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_NOT_FOUND, 404);
      }

      const extractedText = serializeBuiltResumeToText(builtResume);
      if (!extractedText) {
        throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
      }

      return {
        resumeSourceType: 'built',
        resumeSourceId: builtResume._id,
        extractedText,
        structuredSections: {},
        lineMap: [],
        sourceFile: null,
      };
    }

    if (resumeSourceType === 'scanned') {
      const scannedResume = await ScannedResume.findOne({ _id: resumeSourceId, userId });
      if (!scannedResume) {
        throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_NOT_FOUND, 404);
      }

      return {
        resumeSourceType: 'scanned',
        resumeSourceId: scannedResume._id,
        extractedText: scannedResume.extractedText,
        structuredSections: scannedResume.structuredSections || {},
        lineMap: scannedResume.lineMap || [],
        sourceFile: scannedResume.sourceFile || null,
      };
    }

    throw new AppError(ERROR_CODES.RESUME_SCANNER.INVALID_RESUME_SOURCE, 400);
  }

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

const runAnalysisPipeline = async (analysisId, userId) => {
  if (runningJobs.has(String(analysisId))) {
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

    const resumeText = sanitizeResumeScannerText(analysis.resumeText);
    if (!resumeText) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
    }

    await updateAnalysisProgress(analysisId, {
      status: 'analyzing',
      progress: 45,
      statusMessage: 'Extracting skills from job description...',
    });

    const aiResult = await analyzeResumeAgainstJob({
      resumeText,
      jobDescriptionText: jobDescription.rawText,
      structuredSections: analysis.structuredSections,
    });

    await updateAnalysisProgress(analysisId, {
      progress: 80,
      statusMessage: 'Generating ATS suggestions...',
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
    analysis.score = aiResult.score;
    analysis.scoreBreakdown = aiResult.scoreBreakdown;
    analysis.matchedSkillIds = aiResult.matchedSkillIds;
    analysis.missingSkillIds = aiResult.missingSkillIds;
    analysis.suggestions = aiResult.suggestions;
    analysis.searchabilityIssues = aiResult.searchabilityIssues;
    analysis.recruiterTips = aiResult.recruiterTips;
    analysis.resumeText = resumeText;
    analysis.originalResumeText = resumeText;
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

const refreshSkillState = (analysis, jobDescription) => {
  const skillMatch = computeSkillMatches(analysis.resumeText, jobDescription.extractedSkills);
  analysis.matchedSkillIds = skillMatch.matchedSkillIds;
  analysis.missingSkillIds = skillMatch.missingSkillIds;
};

export const listSavedResumesForScanner = async (req, res, next) => {
  try {
    const [builtResumes, scannedResumes] = await Promise.all([
      BuiltResume.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .select('name updatedAt createdAt'),
      ScannedResume.find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .select('label sourceFile updatedAt createdAt'),
    ]);

    sendResponse(res, 200, true, 'Saved resumes fetched successfully.', {
      resumes: [
        ...builtResumes.map((resume) => serializeSavedResumeOption(resume, 'built')),
        ...scannedResumes.map((resume) => serializeSavedResumeOption(resume, 'scanned')),
      ],
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAndAnalyzeResume = async (req, res, next) => {
  try {
    const mode = req.body.mode === 'saved' ? 'saved' : 'upload';
    const jobDescriptionText = sanitizeResumeScannerText(req.body.jobDescription);

    if (!jobDescriptionText) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED, 400);
    }

    const resumeSource = await resolveResumeSource({
      userId: req.user._id,
      mode,
      file: req.file,
      resumeSourceType: req.body.resumeSourceType,
      resumeSourceId: req.body.resumeSourceId,
    });

    const jobDescription = await JobDescription.create({
      userId: req.user._id,
      rawText: jobDescriptionText,
    });

    const analysis = await AtsAnalysis.create({
      userId: req.user._id,
      resumeSourceType: resumeSource.resumeSourceType,
      resumeSourceId: resumeSource.resumeSourceId,
      jobDescriptionId: jobDescription._id,
      status: 'pending',
      progress: 5,
      statusMessage: 'Queued for analysis...',
      resumeText: resumeSource.extractedText,
      originalResumeText: resumeSource.extractedText,
      structuredSections: resumeSource.structuredSections,
    });

    setImmediate(() => {
      runAnalysisPipeline(analysis._id, req.user._id).catch((error) => {
        console.error('[resume-scanner] Background job error:', error);
      });
    });

    sendResponse(res, 202, true, 'Resume scanner analysis started.', {
      analysisId: analysis._id,
      status: analysis.status,
      progress: analysis.progress,
    });
  } catch (error) {
    next(error);
  }
};

export const getResumeScannerStatus = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    sendResponse(res, 200, true, 'Analysis status fetched successfully.', {
      analysisId: analysis._id,
      status: analysis.status,
      progress: analysis.progress,
      statusMessage: analysis.statusMessage,
      errorMessage: analysis.errorMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const getResumeScannerAnalysis = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);

    sendResponse(res, 200, true, 'Analysis fetched successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const updateSuggestionStatus = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);
    const suggestion = analysis.suggestions.find((item) => item.id === req.params.suggestionId);

    if (!suggestion) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.SUGGESTION_NOT_FOUND, 404);
    }

    if (suggestion.status !== 'pending') {
      sendResponse(res, 200, true, 'Suggestion already processed.', {
        analysis: serializeAtsAnalysis(analysis, jobDescription),
      });
      return;
    }

    pushHistoryEntry(analysis, `suggestion:${req.body.action}`);

    if (req.body.action === 'accept') {
      analysis.resumeText = applySuggestionToText(analysis.resumeText, suggestion);
      suggestion.status = 'accepted';
    } else {
      suggestion.status = 'rejected';
    }

    const recomputed = recomputeAnalysisState({
      resumeText: analysis.resumeText,
      skills: jobDescription.extractedSkills,
      structuredSections: analysis.structuredSections,
      searchabilityIssues: analysis.searchabilityIssues,
      suggestions: analysis.suggestions,
    });

    analysis.resumeText = recomputed.resumeText;
    analysis.score = recomputed.score;
    analysis.scoreBreakdown = recomputed.scoreBreakdown;
    analysis.suggestions = recomputed.suggestions;
    refreshSkillState(analysis, jobDescription);

    await analysis.save();

    sendResponse(res, 200, true, 'Suggestion updated successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const acceptAllSuggestions = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);
    const pendingSuggestions = analysis.suggestions.filter((item) => item.status === 'pending');

    if (!pendingSuggestions.length) {
      sendResponse(res, 200, true, 'No pending suggestions to accept.', {
        analysis: serializeAtsAnalysis(analysis, jobDescription),
      });
      return;
    }

    pushHistoryEntry(analysis, 'accept-all');

    for (const suggestion of pendingSuggestions) {
      analysis.resumeText = applySuggestionToText(analysis.resumeText, suggestion);
      suggestion.status = 'accepted';
    }

    const recomputed = recomputeAnalysisState({
      resumeText: analysis.resumeText,
      skills: jobDescription.extractedSkills,
      structuredSections: analysis.structuredSections,
      searchabilityIssues: analysis.searchabilityIssues,
      suggestions: analysis.suggestions,
    });

    analysis.resumeText = recomputed.resumeText;
    analysis.score = recomputed.score;
    analysis.scoreBreakdown = recomputed.scoreBreakdown;
    analysis.suggestions = recomputed.suggestions;
    refreshSkillState(analysis, jobDescription);

    await analysis.save();

    sendResponse(res, 200, true, 'All suggestions accepted successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const updateResumeScannerText = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);

    pushHistoryEntry(analysis, 'manual-edit');
    analysis.resumeText = sanitizeResumeScannerText(req.body.resumeText);

    const recomputed = recomputeAnalysisState({
      resumeText: analysis.resumeText,
      skills: jobDescription.extractedSkills,
      structuredSections: analysis.structuredSections,
      searchabilityIssues: analysis.searchabilityIssues,
      suggestions: analysis.suggestions,
    });

    analysis.resumeText = recomputed.resumeText;
    analysis.score = recomputed.score;
    analysis.scoreBreakdown = recomputed.scoreBreakdown;
    analysis.suggestions = recomputed.suggestions;
    refreshSkillState(analysis, jobDescription);

    await analysis.save();

    sendResponse(res, 200, true, 'Resume text updated successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const undoResumeScannerChange = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (!canUndo(analysis)) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.NOTHING_TO_UNDO, 400);
    }

    undoAnalysis(analysis);
    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);
    refreshSkillState(analysis, jobDescription);
    await analysis.save();

    sendResponse(res, 200, true, 'Undo applied successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const redoResumeScannerChange = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (!canRedo(analysis)) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.NOTHING_TO_REDO, 400);
    }

    redoAnalysis(analysis);
    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);
    refreshSkillState(analysis, jobDescription);
    await analysis.save();

    sendResponse(res, 200, true, 'Redo applied successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};
