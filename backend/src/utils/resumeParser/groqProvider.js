import { getGroqConfig, getGroqApiKeys, isGroqRateLimitError } from '../../config/groqConfig.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getGroqModels = () => {
  const { model, fastModel } = getGroqConfig();
  return [model, fastModel].filter((name, index, list) => name && list.indexOf(name) === index);
};

const callGroq = async (modelName, prompt, apiKey) => {
  if (!apiKey) {
    throw new Error('Groq API key is not configured');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'system',
          content:
            'You are a resume parser. Extact structured data and respond with valid JSON only. No markdown fences.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    error.response = { status: response.status, data: errorBody };
    throw error;
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
};

export const generateWithGroq = async (prompt, { sleep, isRetryableError, maxRetries, retryDelayMs }) => {
  let lastError = null;
  const models = getGroqModels();
  const apiKeys = getGroqApiKeys();

  if (!apiKeys.length) {
    throw new Error('Groq API key is not configured');
  }

  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
    const apiKey = apiKeys[keyIndex];
    const keyLabel = keyIndex === 0 ? 'primary' : `fallback#${keyIndex}`;

    for (const modelName of models) {
      let switchKey = false;
      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
          console.log(`Groq: trying ${modelName} (${keyLabel}, attempt ${attempt}/${maxRetries})`);
          const content = await callGroq(modelName, prompt, apiKey);
          return { content, modelName: `groq/${modelName}` };
        } catch (error) {
          lastError = error;
          const message = error.response?.data?.error?.message || error.message;
          console.error(`Groq ${modelName} ${keyLabel} attempt ${attempt} failed:`, message);

          if (isGroqRateLimitError(error) && keyIndex < apiKeys.length - 1) {
            console.warn(`[resume-parser] Rate/quota on ${keyLabel}; switching Groq API key`);
            switchKey = true;
            break;
          }

          const retryable =
            isRetryableError(error) ||
            error.response?.status === 429 ||
            error.response?.status === 503;

          if (retryable && attempt < maxRetries && !/tokens per day|TPD/i.test(String(message))) {
            await sleep(retryDelayMs * attempt);
            continue;
          }
          break;
        }
      }
      if (switchKey) break;
    }
  }

  throw lastError || new Error('All Groq models failed');
};
