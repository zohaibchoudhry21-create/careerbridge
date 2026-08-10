import ParsedResume from '../models/ParsedResume.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { cleanupFile } from '../middleware/resumeUploadMiddleware.js';
import { extractResumeData } from '../utils/resumeParser/aiParser.js';
import {
  extractTextFromResume,
  validateExtractedText,
} from '../utils/resumeParser/fileProcessor.js';
import {
  RESUME_AI_TEXT_ACTIONS,
  runResumeAiTextAction,
} from '../utils/resumeBuilderAiTextService.js';
import { AppError, buildErrorPayload } from '../utils/sendResponse.js';

const VALID_TEMPLATES = ['classic', 'modern', 'minimal', 'professional', 'elegant'];

const BLANK_RESUME_FILE_PATH = 'blank://no-file';

const EMPTY_PARSED_DATA = {
  fullName: '',
  professionalTitle: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  nationality: '',
  dateOfBirth: '',
  visa: '',
  passportOrId: '',
  availability: '',
  photo: '',
  linkedinLink: '',
  githubLink: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  languages: [],
  certifications: [],
};

const serializeResume = (resume) => ({
  id: resume._id,
  fileName: resume.fileName,
  originalFileName: resume.originalFileName,
  fileSize: resume.fileSize,
  fileType: resume.fileType,
  processingStatus: resume.processingStatus,
  processingError: resume.processingError,
  parsedData: resume.parsedData,
  templateId: resume.templateId || 'classic',
  catalogTemplateId: resume.catalogTemplateId,
  aiConfidence: resume.aiConfidence,
  extractedText: resume.extractedText,
  createdAt: resume.createdAt,
  updatedAt: resume.updatedAt,
});

const assertResumeAccess = (resume, user) => {
  if (!resume) {
    return { status: 404, body: { message: 'Resume not found' } };
  }

  const isOwner = resume.userId.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return { status: 403, body: { message: 'Access denied' } };
  }

  return null;
};

export const uploadParsedResume = async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    filePath = req.file.path;
    const { originalname, mimetype, size } = req.file;

    let templateId = req.body.templateId || 'classic';
    if (!VALID_TEMPLATES.includes(templateId)) {
      templateId = 'classic';
    }

    const resume = new ParsedResume({
      userId: req.user._id,
      fileName: req.file.filename,
      originalFileName: originalname,
      filePath,
      fileSize: size,
      fileType: mimetype,
      extractedText: '',
      parsedData: {},
      processingStatus: 'uploaded',
      templateId,
    });

    await resume.save();

    try {
      resume.processingStatus = 'processing';
      await resume.save();

      const extractedText = await extractTextFromResume(filePath, mimetype);
      const textValidation = validateExtractedText(extractedText);

      if (!textValidation.isValid) {
        resume.processingStatus = 'failed';
        resume.processingError = textValidation.errors.join('; ');
        await resume.save();

        return res.status(400).json({
          message: 'Failed to extract text from file',
          errors: textValidation.errors,
          warnings: textValidation.warnings,
        });
      }

      resume.extractedText = extractedText;
      await resume.save();

      try {
        const aiResult = await extractResumeData(extractedText);

        if (aiResult.success) {
          resume.parsedData = aiResult.data;
          resume.processingStatus = 'completed';
          resume.processingError = null;
        } else {
          resume.processingStatus = 'failed';
          resume.processingError = 'Failed to parse resume data with AI';
        }

        await resume.save();

        return res.status(201).json({
          message: 'Resume uploaded and processed successfully',
          resume: {
            id: resume._id,
            fileName: resume.fileName,
            originalFileName: resume.originalFileName,
            processingStatus: resume.processingStatus,
            parsedData: resume.parsedData,
            templateId: resume.templateId,
            aiConfidence: resume.aiConfidence,
            warnings: textValidation.warnings,
            createdAt: resume.createdAt,
          },
        });
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        resume.processingStatus = 'failed';
        resume.processingError = aiError.message;
        await resume.save();

        return res.status(503).json({
          message: aiError.message || 'Failed to process resume with AI',
          error: aiError.message,
          retryable: true,
          resume: {
            id: resume._id,
            fileName: resume.fileName,
            processingStatus: resume.processingStatus,
            processingError: resume.processingError,
          },
        });
      }
    } catch (textExtractionError) {
      console.error('Text extraction error:', textExtractionError);
      resume.processingStatus = 'failed';
      resume.processingError = textExtractionError.message;
      await resume.save();

      return res.status(500).json({
        message: 'Failed to extract text from file',
        error: textExtractionError.message,
      });
    }
  } catch (error) {
    console.error('Upload error:', error);

    if (filePath) {
      cleanupFile(filePath);
    }

    return res.status(500).json({
      message: 'Server error during file upload',
    });
  }
};

export const createBlankParsedResume = async (req, res) => {
  try {
    let templateId = req.body?.templateId || 'classic';
    if (!VALID_TEMPLATES.includes(templateId)) {
      templateId = 'classic';
    }

    const stamp = Date.now();
    const resume = new ParsedResume({
      userId: req.user._id,
      fileName: `blank-resume-${stamp}.pdf`,
      originalFileName: 'Untitled Resume',
      filePath: BLANK_RESUME_FILE_PATH,
      fileSize: 0,
      fileType: 'application/pdf',
      sourceType: 'blank',
      extractedText: '',
      parsedData: { ...EMPTY_PARSED_DATA },
      processingStatus: 'completed',
      processingError: null,
      templateId,
    });

    await resume.save();

    return res.status(201).json({
      message: 'Blank resume created successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        originalFileName: resume.originalFileName,
        processingStatus: resume.processingStatus,
        parsedData: resume.parsedData,
        templateId: resume.templateId,
        sourceType: resume.sourceType,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error('Create blank resume error:', error);
    return res.status(500).json({
      message: 'Server error while creating blank resume',
    });
  }
};

export const getParsedResumeHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = { userId: req.user._id };

    if (status && ['uploaded', 'processing', 'completed', 'failed'].includes(status)) {
      query.processingStatus = status;
    }

    if (search) {
      query.$or = [
        { originalFileName: { $regex: search, $options: 'i' } },
        { 'parsedData.fullName': { $regex: search, $options: 'i' } },
        { 'parsedData.email': { $regex: search, $options: 'i' } },
        { 'parsedData.skills': { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const resumes = await ParsedResume.find(query)
      .select(
        'fileName originalFileName fileSize processingStatus parsedData.fullName parsedData.email aiConfidence createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await ParsedResume.countDocuments(query);

    return res.json({
      resumes: resumes.map((resume) => resume.getSummary()),
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        totalResumes: total,
        hasNext: skip + resumes.length < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({
      message: 'Server error while fetching resume history',
    });
  }
};

export const reprocessParsedResume = async (req, res) => {
  let resume = null;

  try {
    resume = await ParsedResume.findById(req.params.id);
    const accessError = assertResumeAccess(resume, req.user);
    if (accessError) {
      return res.status(accessError.status).json(accessError.body);
    }

    if (!resume.extractedText) {
      return res.status(400).json({
        message: 'No extracted text available. Please re-upload the file.',
      });
    }

    resume.processingStatus = 'processing';
    resume.processingError = null;
    await resume.save();

    const aiResult = await extractResumeData(resume.extractedText);

    resume.parsedData = aiResult.data;
    resume.processingStatus = 'completed';
    resume.processingError = null;
    await resume.save();

    return res.json({
      message: 'Resume processed successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        originalFileName: resume.originalFileName,
        processingStatus: resume.processingStatus,
        parsedData: resume.parsedData,
        templateId: resume.templateId,
      },
    });
  } catch (error) {
    console.error('Reprocess error:', error);

    if (resume) {
      resume.processingStatus = 'failed';
      resume.processingError = error.message;
      await resume.save();
    }

    return res.status(503).json({
      message: error.message || 'Failed to process resume with AI',
      retryable: true,
    });
  }
};

export const updateParsedResume = async (req, res) => {
  try {
    const resume = await ParsedResume.findById(req.params.id);
    const accessError = assertResumeAccess(resume, req.user);
    if (accessError) {
      return res.status(accessError.status).json(accessError.body);
    }

    if (!req.body.parsedData || typeof req.body.parsedData !== 'object') {
      return res.status(400).json({ message: 'parsedData is required' });
    }

    resume.parsedData = req.body.parsedData;

    if (req.body.templateId && VALID_TEMPLATES.includes(req.body.templateId)) {
      resume.templateId = req.body.templateId;
    }

    if (resume.processingStatus === 'failed') {
      resume.processingStatus = 'completed';
      resume.processingError = null;
    }

    await resume.save();

    return res.json({
      message: 'Resume updated successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        originalFileName: resume.originalFileName,
        processingStatus: resume.processingStatus,
        parsedData: resume.parsedData,
        templateId: resume.templateId,
        updatedAt: resume.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update resume error:', error);
    return res.status(500).json({ message: 'Server error while updating resume' });
  }
};

export const runParsedResumeAiText = async (req, res) => {
  try {
    const resume = await ParsedResume.findById(req.params.id);
    const accessError = assertResumeAccess(resume, req.user);
    if (accessError) {
      return res.status(accessError.status).json({
        success: false,
        message: accessError.body.message,
      });
    }

    const action = String(req.body?.action || '').trim();
    const content = req.body?.content ?? '';
    const field = String(req.body?.field || 'summary').trim() || 'summary';
    const context =
      req.body?.context && typeof req.body.context === 'object' ? req.body.context : {};

    if (!RESUME_AI_TEXT_ACTIONS.includes(action)) {
      throw new AppError(ERROR_CODES.RESUME_BUILDER.INVALID_AI_ACTION, 400);
    }

    const result = await runResumeAiTextAction({ action, content, field, context });

    return res.json({
      success: true,
      text: result.text,
      action: result.action,
      field: result.field,
    });
  } catch (error) {
    if (error instanceof AppError || error?.isOperational) {
      const { statusCode, body } = buildErrorPayload(error);
      return res.status(statusCode).json(body);
    }
    console.error('[resume-builder] AI text error:', error);
    const { statusCode, body } = buildErrorPayload(
      new AppError(ERROR_CODES.RESUME_BUILDER.AI_EMPTY_RESPONSE, 502)
    );
    return res.status(statusCode).json(body);
  }
};

export const getParsedResume = async (req, res) => {
  try {
    const resume = await ParsedResume.findById(req.params.id);
    const accessError = assertResumeAccess(resume, req.user);
    if (accessError) {
      return res.status(accessError.status).json(accessError.body);
    }

    return res.json({
      resume: serializeResume(resume),
    });
  } catch (error) {
    console.error('Get resume error:', error);
    return res.status(500).json({ message: 'Server error while fetching resume' });
  }
};

export const deleteParsedResume = async (req, res) => {
  try {
    const resume = await ParsedResume.findById(req.params.id);
    const accessError = assertResumeAccess(resume, req.user);
    if (accessError) {
      return res.status(accessError.status).json(accessError.body);
    }

    if (resume.sourceType !== 'blank') {
      cleanupFile(resume.filePath);
    }
    await ParsedResume.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    return res.status(500).json({ message: 'Server error while deleting resume' });
  }
};

export const searchParsedResumes = async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const resumes = await ParsedResume.searchResumes(query, req.user._id)
      .select(
        'fileName originalFileName fileSize processingStatus parsedData.fullName parsedData.email aiConfidence createdAt'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await ParsedResume.countDocuments({
      userId: req.user._id,
      $or: [
        { originalFileName: { $regex: query, $options: 'i' } },
        { 'parsedData.fullName': { $regex: query, $options: 'i' } },
        { 'parsedData.email': { $regex: query, $options: 'i' } },
        { 'parsedData.skills': { $in: [new RegExp(query, 'i')] } },
      ],
    });

    return res.json({
      resumes: resumes.map((resume) => resume.getSummary()),
      query,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNext: skip + resumes.length < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Server error while searching resumes' });
  }
};

export const exportParsedResume = async (req, res) => {
  try {
    const resume = await ParsedResume.findById(req.params.id);
    const accessError = assertResumeAccess(resume, req.user);
    if (accessError) {
      return res.status(accessError.status).json(accessError.body);
    }

    const exportData = {
      metadata: {
        fileName: resume.originalFileName,
        uploadedAt: resume.createdAt,
        processedAt: resume.updatedAt,
        processingStatus: resume.processingStatus,
        aiConfidence: resume.aiConfidence,
      },
      parsedData: resume.parsedData,
      rawText: req.query.includeText === 'true' ? resume.extractedText : undefined,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${resume.originalFileName}.json"`
    );
    return res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ message: 'Server error while exporting resume data' });
  }
};
