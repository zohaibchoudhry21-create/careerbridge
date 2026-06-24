const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export const getAnthropicConfig = () => ({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
});

export const isAnthropicConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);
