import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getGeminiConfig,
  getGeminiModelCandidates,
  isGeminiConfigured,
} from '../config/geminiConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { parseModelJson } from './resumeScannerJson.js';
import { RESUME_SCANNER_LLM_TIMEOUT_MS } from './resumeScannerLlmTimeouts.js';
import { buildResumeScannerPrompt, RESUME_SCANNER_SYSTEM_PROMPT } from './resumeScannerPrompts.js';
import { parseResumeScannerAnalysis } from './resumeScannerSchemas.js';
import { AppError } from './sendResponse.js';

const MAX_PARSE_ATTEMPTS = 3;
const BACKOFF_MS = [400, 900, 1600];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const analysisFailedError = () =>
  new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);

const getGenAI = () => {
  const { apiKey } = getGeminiConfig();
  if (!apiKey) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }
  return new GoogleGenerativeAI(apiKey);
};

const isRetryableGeminiError = (error) => {
  const status = Number(error?.status || error?.statusCode || 0);
  const message = String(error?.message || '');
  if (status === 401 || status === 403) return false;
  if (/API key not valid|PERMISSION_DENIED|invalid.?api.?key/i.test(message)) return false;
  return (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    /rate limit|quota|high demand|unavailable|timeout|RESOURCE_EXHAUSTED/i.test(message)
  );
};

const generateAnalysisJson = async ({ resumeText, jobDescriptionText, jobTitle }) => {
  const genAI = getGenAI();
  const models = getGeminiModelCandidates();
  const userPrompt = buildResumeScannerPrompt({ resumeText, jobDescriptionText, jobTitle });
  let lastError;

  for (const modelName of models) {
    try {
      console.info(`[resume-scanner] Trying Gemini model ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: RESUME_SCANNER_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(
        { contents: [{ role: 'user', parts: [{ text: userPrompt }] }] },
        { timeout: RESUME_SCANNER_LLM_TIMEOUT_MS }
      );

      const content = result?.response?.text?.()?.trim?.() || '';
      if (!content) {
        throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_EMPTY_RESPONSE, 502);
      }
      console.info(`[resume-scanner] Gemini ${modelName} succeeded`);
      return content;
    } catch (error) {
      lastError = error;
      console.warn(
        `[resume-scanner] Gemini ${modelName} failed:`,
        error?.message || error
      );
      if (!isRetryableGeminiError(error) && !(error instanceof AppError)) {
        // Try next model for transient / model-not-found style errors
        continue;
      }
    }
  }

  if (lastError instanceof AppError) throw lastError;
  throw analysisFailedError();
};

export const analyzeResumeWithGemini = async (
  { resumeText, jobDescriptionText, jobTitle = '' },
  parseAttempt = 0
) => {
  if (!isGeminiConfigured()) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const content = await generateAnalysisJson({
    resumeText,
    jobDescriptionText,
    jobTitle,
  });

  try {
    const parsed = parseModelJson(content);
    return parseResumeScannerAnalysis(parsed);
  } catch (error) {
    if (parseAttempt < MAX_PARSE_ATTEMPTS - 1) {
      console.warn(
        `[resume-scanner] Gemini JSON/Zod validation failed (parse attempt ${parseAttempt + 1}/${MAX_PARSE_ATTEMPTS}):`,
        error.message
      );
      await sleep(BACKOFF_MS[parseAttempt] ?? 400);
      return analyzeResumeWithGemini(
        { resumeText, jobDescriptionText, jobTitle },
        parseAttempt + 1
      );
    }
    throw analysisFailedError();
  }
};
