import BuiltResume from '../models/BuiltResume.js';
import User from '../models/User.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';
import { buildBlankResumePayload } from '../utils/resumeBuilderDefaults.js';
import { mapClaudeResumeToPayload } from '../utils/resumeAiMapper.js';
import { parseResumeWithAi, runResumeAiActionWithProvider } from '../utils/resumeAiService.js';
import { extractResumeTextFromFile } from '../utils/resumeFileExtractor.js';
import {
  parsePastedResumeText,
} from '../utils/resumeImportParser.js';
import { prepareResumeTextForImport } from '../utils/resumeTextNormalizer.js';
import { enrichResumePayloadFromText } from '../utils/resumeSectionEnricher.js';
import { finalizeImportPayload } from '../utils/resumeImportFinalize.js';
import { serializeBuiltResume } from '../utils/resumeBuilderSerializer.js';

const loadUser = (userId) => User.findById(userId);

const loadResumeForUser = async (resumeId, userId) => {
  const resume = await BuiltResume.findOne({ _id: resumeId, userId });

  if (!resume) {
    throw new AppError('Resume not found.', 404);
  }

  return resume;
};

export const listBuiltResumes = async (req, res, next) => {
  try {
    const resumes = await BuiltResume.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('name templateId updatedAt createdAt');

    sendResponse(res, 200, true, 'Resumes fetched successfully.', {
      resumes: resumes.map((resume) => ({
        id: resume._id,
        name: resume.name,
        templateId: resume.templateId,
        updatedAt: resume.updatedAt,
        createdAt: resume.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getBuiltResume = async (req, res, next) => {
  try {
    const resume = await loadResumeForUser(req.params.resumeId, req.user._id);

    sendResponse(res, 200, true, 'Resume fetched successfully.', {
      resume: serializeBuiltResume(resume),
    });
  } catch (error) {
    next(error);
  }
};

export const createBuiltResume = async (req, res, next) => {
  try {
    const user = await loadUser(req.user._id);

    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    const { templateId, name, personalDetails, sections, customize } = req.body;

    if (!templateId) {
      throw new AppError('Template is required.', 400);
    }

    const existingCount = await BuiltResume.countDocuments({ userId: user._id });
    const resumeName = name?.trim() || `Resume ${existingCount + 1}`;

    const payload =
      personalDetails || sections
        ? { name: resumeName, templateId, personalDetails, sections, customize }
        : buildBlankResumePayload(user, templateId, resumeName);

    const resume = await BuiltResume.create({
      userId: user._id,
      ...payload,
    });

    sendResponse(res, 201, true, 'Resume created successfully.', {
      resume: serializeBuiltResume(resume),
    });
  } catch (error) {
    next(error);
  }
};

export const updateBuiltResume = async (req, res, next) => {
  try {
    const resume = await loadResumeForUser(req.params.resumeId, req.user._id);
    const { name, templateId, personalDetails, sections, customize } = req.body;

    if (name !== undefined) resume.name = name.trim() || resume.name;
    if (templateId !== undefined) resume.templateId = templateId;
    if (personalDetails !== undefined) resume.personalDetails = personalDetails;
    if (sections !== undefined) resume.sections = sections;
    if (customize !== undefined) resume.customize = customize;

    await resume.save();

    sendResponse(res, 200, true, 'Resume updated successfully.', {
      resume: serializeBuiltResume(resume),
    });
  } catch (error) {
    next(error);
  }
};

const getEntryTextContent = (entry) => {
  const data = entry?.data || entry?.fields || {};
  return data.content || data.description || '';
};

const shouldFallbackToHeuristicParse = (parsed) => {
  const sections = parsed?.sections || [];
  const aboutSection = sections.find((section) => {
    const type = (section.type || '').replace(/\s+/g, '').toLowerCase();
    return type === 'about' || type === 'aboutme';
  });
  const aboutContent = getEntryTextContent(aboutSection?.entries?.[0] || {});
  const experienceCount = sections.filter((section) => {
    const type = (section.type || '').replace(/\s+/g, '').toLowerCase();
    return type === 'experience';
  }).flatMap((section) => section.entries || []).length;

  if (aboutContent.length > 700 && /\d{4}\s*[-–—]/.test(aboutContent)) {
    return true;
  }

  if (experienceCount === 0 && aboutContent.length > 350) {
    return true;
  }

  return false;
};

const buildImportPayload = async (text, user, templateId, { alreadyCleaned = false } = {}) => {
  const normalizedText = prepareResumeTextForImport(text, { alreadyCleaned });
  const { parsed, provider, aiFailed } = await parseResumeWithAi(normalizedText);

  let payload;
  let parseWarning;
  let usedHeuristic = false;
  let usedAi = false;

  if (parsed && !shouldFallbackToHeuristicParse(parsed)) {
    payload = mapClaudeResumeToPayload(parsed, user, templateId, { isImport: true });
    usedAi = true;
  } else {
    usedHeuristic = true;
    if (aiFailed) {
      console.warn('[resume-import] AI parse failed, using fallback parser.');
      parseWarning = 'ai_failed';
    } else if (provider !== 'heuristic') {
      console.warn('[resume-import] AI parse quality check failed, using fallback parser.');
    }
    payload = parsePastedResumeText(normalizedText, user, templateId);
  }

  const enriched = enrichResumePayloadFromText(normalizedText, payload, {
    fillGapsOnly: usedAi && !usedHeuristic,
  });

  const finalized = finalizeImportPayload(enriched);

  if (parseWarning) {
    finalized.parseWarning = parseWarning;
  }

  return finalized;
};

export const resumeAiAction = async (req, res, next) => {
  try {
    const { action, content, context } = req.body;
    const allowedActions = ['improve', 'grammar', 'shorter', 'suggest'];

    if (!action || !allowedActions.includes(action)) {
      throw new AppError('Invalid AI action.', 400);
    }

    const { result, provider } = await runResumeAiActionWithProvider(action, content, context);

    sendResponse(res, 200, true, 'AI action completed.', { result, provider });
  } catch (error) {
    next(error);
  }
};

export const importBuiltResume = async (req, res, next) => {
  try {
    const user = await loadUser(req.user._id);

    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    const { templateId, mode, pastedText } = req.body;
    const file = req.file;

    if (!templateId) {
      throw new AppError('Template is required.', 400);
    }

    let payload;

    if (mode === 'paste' && pastedText?.trim()) {
      payload = await buildImportPayload(pastedText.trim(), user, templateId);
    } else if (file) {
      const text = await extractResumeTextFromFile(file);
      payload = await buildImportPayload(text, user, templateId, { alreadyCleaned: true });
    } else {
      throw new AppError('Provide a resume file or pasted text.', 400);
    }

    const existingCount = await BuiltResume.countDocuments({ userId: user._id });

    const { parseWarning, ...resumeData } = payload;

    const resume = await BuiltResume.create({
      userId: user._id,
      name: `Resume ${existingCount + 1}`,
      ...resumeData,
    });

    sendResponse(res, 201, true, 'Resume imported successfully.', {
      resume: serializeBuiltResume(resume),
      ...(parseWarning && { parseWarning }),
    });
  } catch (error) {
    next(error);
  }
};

export const suggestResumeSkills = async (req, res, next) => {
  try {
    const user = await loadUser(req.user._id);

    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    const title = 'Professional';
    const existing = new Set((req.body?.currentSkills || []).map((skill) => skill.toLowerCase()));

    const suggestionsByTitle = {
      seo: [
        'On-Page SEO Optimization',
        'Keyword Research',
        'Technical SEO (Indexing & Crawling)',
        'Schema Markup',
        'Outreach & Link Building',
        'Internal Linking Strategy',
        'Competitor Analysis',
        'AI SEO & Content Strategy',
        'SEO Audit',
        'Guest Posting',
      ],
      developer: [
        'JavaScript',
        'React',
        'Node.js',
        'REST APIs',
        'Git',
        'SQL',
        'Problem Solving',
        'Agile Collaboration',
      ],
      default: [
        'Communication',
        'Team Collaboration',
        'Time Management',
        'Critical Thinking',
        'Adaptability',
        'Project Management',
        'Microsoft Office',
        'Customer Service',
      ],
    };

    const normalizedTitle = title.toLowerCase();
    let pool = suggestionsByTitle.default;

    if (normalizedTitle.includes('seo')) pool = suggestionsByTitle.seo;
    else if (
      normalizedTitle.includes('developer') ||
      normalizedTitle.includes('engineer') ||
      normalizedTitle.includes('software')
    ) {
      pool = suggestionsByTitle.developer;
    }

    const suggestions = pool.filter((skill) => !existing.has(skill.toLowerCase())).slice(0, 8);

    sendResponse(res, 200, true, 'Skill suggestions generated.', { suggestions });
  } catch (error) {
    next(error);
  }
};
