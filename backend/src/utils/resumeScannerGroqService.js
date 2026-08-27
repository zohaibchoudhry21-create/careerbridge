import Groq from 'groq-sdk';
import {
  getGroqConfig,
  isGroqConfigured,
  isGroqRateLimitError,
} from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { RESUME_SCANNER_LLM_TIMEOUT_MS } from './resumeScannerLlmTimeouts.js';
import { buildResumeScannerPrompt, RESUME_SCANNER_SYSTEM_PROMPT } from './resumeScannerPrompts.js';
import { parseModelJson } from './resumeScannerJson.js';
import {
  parseResumeScannerAnalysis,
  RESUME_SCANNER_ANALYSIS_JSON_SCHEMA,
} from './resumeScannerSchemas.js';
import { AppError } from './sendResponse.js';

/** Retries when chat.completions.create itself throws (e.g. json_validate_failed). */
const MAX_CREATE_ATTEMPTS = 3;
/** Retries when HTTP succeeds but Zod/JSON parse fails. */
const MAX_PARSE_ATTEMPTS = 3;
const CREATE_BACKOFF_MS = [400, 900, 1600];
/**
 * Keep under common free-tier TPM (often 8k) while leaving room for JSON.
 * gpt-oss also spends tokens on reasoning — reasoning_effort: low helps.
 */
const MAX_COMPLETION_TOKENS = 4096;
const REASONING_EFFORT = 'low';

const COMPACTNESS_REMINDER =
  'IMPORTANT: Your previous JSON was truncated before required trailing fields. ' +
  'Emit at most 10 skills and 8 suggestions, keep notes to one short sentence, ' +
  'complete all four scoreBreakdown components, then always end with ' +
  'suggestions, searchabilityIssues, and recruiterTips arrays (use [] if empty).';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const analysisFailedError = () =>
  new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);

const getErrorCode = (error) => String(error?.error?.code || error?.code || '');

const isJsonValidateFailed = (error) => {
  const code = getErrorCode(error);
  const message = String(error?.message || '');
  return (
    code === 'json_validate_failed' ||
    /Failed to validate JSON|does not match the expected schema|missing properties/i.test(
      message
    )
  );
};

/** Same-key short retries (not key switching). */
const isRetryableOnSameKey = (error) => {
  if (error instanceof AppError) return false;
  const status = Number(error?.status || error?.statusCode || 0);
  const code = getErrorCode(error);
  const message = String(error?.message || '');
  if (status === 401 || status === 403) return false;
  if (/invalid.?api.?key/i.test(message) || code === 'invalid_api_key') return false;
  // Quotas / request-too-large won't clear on short backoff — switch key instead.
  if (isGroqRateLimitError(error) || status === 413) return false;
  if (/tokens per day|TPD|tokens per minute|TPM|Request too large/i.test(message)) {
    return false;
  }
  if (isJsonValidateFailed(error)) return true;
  if (status === 500 || status === 502 || status === 503) return true;
  return status === 0 || status >= 500 || !status;
};

const keyLabelFor = (keyIndex) => (keyIndex === 0 ? 'primary' : 'fallback');

const buildMessages = ({ resumeText, jobDescriptionText, jobTitle }, attempt) => {
  const messages = [
    { role: 'system', content: RESUME_SCANNER_SYSTEM_PROMPT },
    {
      role: 'user',
      content: buildResumeScannerPrompt({ resumeText, jobDescriptionText, jobTitle }),
    },
  ];
  if (attempt > 0) {
    messages.push({ role: 'user', content: COMPACTNESS_REMINDER });
  }
  return messages;
};

/**
 * Try GROQ_API_KEY, then GROQ_API_KEY_FALLBACK on any exhausted failure.
 * Only then throw so the AiService cascade can move to Gemini.
 */
const createAnalysisCompletion = async ({ resumeText, jobDescriptionText, jobTitle }) => {
  const { model, apiKeys } = getGroqConfig();
  if (!apiKeys.length) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  let lastRawError;

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
    const client = new Groq({
      apiKey: apiKeys[keyIndex],
      timeout: RESUME_SCANNER_LLM_TIMEOUT_MS,
    });
    const keyLabel = keyLabelFor(keyIndex);
    const hasNextKey = keyIndex < apiKeys.length - 1;

    console.info(`[resume-scanner] Trying Groq (${keyLabel} key)...`);

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
      try {
        const completion = await client.chat.completions.create({
          model,
          temperature: 0.2,
          max_tokens: MAX_COMPLETION_TOKENS,
          reasoning_effort: REASONING_EFFORT,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'resume_scanner_analysis',
              strict: true,
              schema: RESUME_SCANNER_ANALYSIS_JSON_SCHEMA,
            },
          },
          messages: buildMessages({ resumeText, jobDescriptionText, jobTitle }, attempt),
        });
        console.info(`[resume-scanner] Groq ${keyLabel} succeeded`);
        return completion;
      } catch (error) {
        lastRawError = error;
        const raw = error?.message || String(error);
        console.warn(
          `[resume-scanner] Groq ${keyLabel} failed (attempt ${attempt + 1}/${MAX_CREATE_ATTEMPTS}):`,
          raw
        );

        // Switch key immediately on auth / rate / size limits.
        if (
          hasNextKey &&
          (isGroqRateLimitError(error) ||
            statusSuggestsTryNextKey(error) ||
            Number(error?.status || error?.statusCode || 0) === 413)
        ) {
          console.warn(
            `[resume-scanner] Groq ${keyLabel} not usable for this request; trying next Groq key`
          );
          break;
        }

        const retryable = isRetryableOnSameKey(error);
        if (retryable && attempt < MAX_CREATE_ATTEMPTS - 1) {
          await sleep(CREATE_BACKOFF_MS[attempt] ?? 1600);
          continue;
        }

        // Exhausted this key — always try the next Groq key before giving up.
        if (hasNextKey) {
          console.warn(
            `[resume-scanner] Groq ${keyLabel} exhausted; trying next Groq key before Gemini`
          );
          break;
        }
      }
    }
  }

  console.warn(
    '[resume-scanner] All Groq API keys failed',
    lastRawError?.message || lastRawError || ''
  );
  throw analysisFailedError();
};

const statusSuggestsTryNextKey = (error) => {
  const status = Number(error?.status || error?.statusCode || 0);
  const code = getErrorCode(error);
  const message = String(error?.message || '');
  return (
    status === 401 ||
    status === 403 ||
    code === 'invalid_api_key' ||
    /invalid.?api.?key/i.test(message)
  );
};

export const analyzeResumeWithGroq = async (
  { resumeText, jobDescriptionText, jobTitle = '' },
  parseAttempt = 0
) => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const completion = await createAnalysisCompletion({
    resumeText,
    jobDescriptionText,
    jobTitle,
  });

  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) {
    if (parseAttempt < MAX_PARSE_ATTEMPTS - 1) {
      console.warn(
        `[resume-scanner] Groq empty content (parse attempt ${parseAttempt + 1}/${MAX_PARSE_ATTEMPTS})`
      );
      await sleep(CREATE_BACKOFF_MS[parseAttempt] ?? 400);
      return analyzeResumeWithGroq({ resumeText, jobDescriptionText, jobTitle }, parseAttempt + 1);
    }
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_EMPTY_RESPONSE, 502);
  }

  try {
    const parsed = parseModelJson(content);
    return parseResumeScannerAnalysis(parsed);
  } catch (error) {
    if (parseAttempt < MAX_PARSE_ATTEMPTS - 1) {
      console.warn(
        `[resume-scanner] Groq JSON/Zod validation failed (parse attempt ${parseAttempt + 1}/${MAX_PARSE_ATTEMPTS}):`,
        error.message
      );
      await sleep(CREATE_BACKOFF_MS[parseAttempt] ?? 400);
      return analyzeResumeWithGroq({ resumeText, jobDescriptionText, jobTitle }, parseAttempt + 1);
    }
    throw analysisFailedError();
  }
};
