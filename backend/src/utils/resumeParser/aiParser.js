import { isGeminiConfigured } from '../../config/geminiConfig.js';
import { isGroqConfigured } from '../../config/groqConfig.js';
import { generateWithGemini } from './geminiProvider.js';
import { generateWithGroq } from './groqProvider.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const MAX_RESUME_CHARS = 12000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  const message = error?.message || '';
  const status = error?.status || error?.response?.status;
  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('high demand') ||
    message.includes('quota') ||
    message.includes('Too Many Requests') ||
    message.includes('Service Unavailable') ||
    message.includes('rate limit')
  );
};

export const getActiveProvider = () => {
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  if (provider === 'groq') return 'groq';
  if (provider === 'gemini') return 'gemini';
  throw new Error(`Unknown AI_PROVIDER: ${provider}. Use "gemini" or "groq".`);
};

const truncateResumeText = (text) => {
  if (!text || text.length <= MAX_RESUME_CHARS) return text;
  return `${text.slice(0, MAX_RESUME_CHARS)}\n\n[Text truncated for processing]`;
};

const buildPrompt = (resumeText) => `Extract resume information from the text below and return ONLY a valid JSON object (no markdown, no explanation).

{
  "fullName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "address": "string or null",
  "skills": ["skill1"],
  "linkedinLink": "string or null",
  "githubLink": "string or null",
  "experience": [{"company":"","position":"","startDate":"","endDate":"","description":"","isCurrent":false}],
  "education": [{"institution":"","degree":"","fieldOfStudy":"","startDate":"","endDate":"","gpa":"","description":""}],
  "projects": [{"name":"","description":"","technologies":[],"startDate":"","endDate":"","link":""}],
  "summary": "string or null",
  "languages": ["language1"],
  "certifications": ["cert1"]
}

Resume text:
${resumeText}`;

const retryOptions = () => ({
  sleep,
  isRetryableError,
  maxRetries: MAX_RETRIES,
  retryDelayMs: RETRY_DELAY_MS,
});

const providerOrder = () => {
  const primary = getActiveProvider();
  const order = [primary];
  if (primary === 'groq' && isGeminiConfigured()) order.push('gemini');
  if (primary === 'gemini' && isGroqConfigured()) order.push('groq');
  return order;
};

const generateWithProvider = async (provider, prompt) => {
  if (provider === 'groq') {
    return generateWithGroq(prompt, retryOptions());
  }
  return generateWithGemini(prompt, retryOptions());
};

const generateWithAI = async (prompt) => {
  const order = providerOrder();
  let lastError;

  for (const provider of order) {
    try {
      const result = await generateWithProvider(provider, prompt);
      return { ...result, provider };
    } catch (error) {
      lastError = error;
      console.warn(`[resume-parser] ${provider} failed:`, error.message);
    }
  }

  throw lastError || new Error('No AI provider available for resume parsing');
};

export const extractResumeData = async (resumeText) => {
  const preferred = getActiveProvider();

  try {
    const trimmedText = truncateResumeText(resumeText);
    const prompt = buildPrompt(trimmedText);
    const { content, modelName, provider } = await generateWithAI(prompt);

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw AI content:', cleaned.slice(0, 500));
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
    }

    return {
      success: true,
      data: parsedData,
      rawResponse: cleaned,
      modelUsed: modelName,
      provider: provider || preferred,
    };
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message;
    console.error(`Resume parser AI Error:`, message);

    if (isRetryableError(error)) {
      throw new Error(
        'AI service is temporarily busy. Please wait 30 seconds and try uploading again.'
      );
    }

    throw new Error(`Failed to extract resume data: ${message}`);
  }
};

export const testConnection = async () => {
  try {
    const { content } = await generateWithAI('Reply with exactly: "API connection successful"');
    return content.toLowerCase().includes('successful');
  } catch (err) {
    console.error('AI API test failed:', err.message);
    return false;
  }
};
