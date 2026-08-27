import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiConfig, getGeminiModelCandidates, isGeminiConfigured } from '../../config/geminiConfig.js';

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    const { apiKey } = getGeminiConfig();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const callGemini = async (modelName, prompt) => {
  const model = getGenAI().getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

export const generateWithGemini = async (prompt, { sleep, isRetryableError, maxRetries, retryDelayMs }) => {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API key is not configured');
  }

  let lastError = null;
  const models = getGeminiModelCandidates();

  for (const modelName of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        console.log(`Gemini: trying ${modelName} (attempt ${attempt}/${maxRetries})`);
        const content = await callGemini(modelName, prompt);
        return { content, modelName: `gemini/${modelName}` };
      } catch (error) {
        lastError = error;
        console.error(`Gemini ${modelName} attempt ${attempt} failed:`, error.message);

        if (isRetryableError(error) && attempt < maxRetries) {
          await sleep(retryDelayMs * attempt);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
};
