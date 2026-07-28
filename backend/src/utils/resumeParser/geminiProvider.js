import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const getGeminiModels = () => {
  const primary = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return [primary, 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'].filter(
    (model, index, list) => list.indexOf(model) === index
  );
};

const callGemini = async (modelName, prompt) => {
  const model = getGenAI().getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

export const generateWithGemini = async (prompt, { sleep, isRetryableError, maxRetries, retryDelayMs }) => {
  let lastError = null;
  const models = getGeminiModels();

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
