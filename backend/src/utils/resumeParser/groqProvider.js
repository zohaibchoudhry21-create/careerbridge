const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getGroqModels = () => {
  const primary = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  return [primary, 'llama-3.1-8b-instant'].filter(
    (model, index, list) => list.indexOf(model) === index
  );
};

const callGroq = async (modelName, prompt) => {
  const apiKey = process.env.GROQ_API_KEY;
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

  for (const modelName of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        console.log(`Groq: trying ${modelName} (attempt ${attempt}/${maxRetries})`);
        const content = await callGroq(modelName, prompt);
        return { content, modelName: `groq/${modelName}` };
      } catch (error) {
        lastError = error;
        const message = error.response?.data?.error?.message || error.message;
        console.error(`Groq ${modelName} attempt ${attempt} failed:`, message);

        const retryable =
          isRetryableError(error) ||
          error.response?.status === 429 ||
          error.response?.status === 503;

        if (retryable && attempt < maxRetries) {
          await sleep(retryDelayMs * attempt);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('All Groq models failed');
};
