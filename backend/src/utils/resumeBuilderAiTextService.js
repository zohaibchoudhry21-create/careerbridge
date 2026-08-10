import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';

export const RESUME_AI_TEXT_ACTIONS = ['improve', 'grammar', 'shorter', 'suggest', 'tips'];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const stripHtml = (html = '') =>
  String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const isExperienceField = (field = '') =>
  field === 'experience' || field.startsWith('experience.');

const isHeaderField = (field = '') =>
  field === 'header' || field === 'personalDetails';

const contextLine = (context = {}) => {
  const parts = [context.jobTitle, context.employer, context.location].filter(Boolean);
  return parts.length ? `Role context: ${parts.join(' · ')}` : '';
};

const buildPrompt = (action, text, field, context = {}) => {
  const experience = isExperienceField(field);
  const header = isHeaderField(field);
  const ctx = contextLine(context);

  if (action === 'tips') {
    if (header) {
      return `Provide 4–5 short actionable tips for filling resume personal/header details (name, title, contact, LinkedIn). Return plain text only, one tip per line starting with "• ". No intro.`;
    }
    if (experience) {
      return text
        ? `Provide 3–5 short actionable tips to strengthen this resume work-experience description for recruiters and ATS. Return plain text only, one tip per line starting with "• ". No intro.
${ctx}

Draft:
"""
${text}
"""`
        : `Provide 4–5 short actionable tips for writing strong resume work-experience bullet points. Return plain text only, one tip per line starting with "• ". No intro.
${ctx}`;
    }
    return text
      ? `Based on this draft professional summary, provide 3–5 short actionable tips to strengthen it for recruiters and ATS. Return plain text only, one tip per line starting with "• ". No intro sentence.

Draft:
"""
${text}
"""`
      : `Provide 4–5 short actionable tips for writing a strong resume professional summary. Return plain text only, one tip per line starting with "• ". No intro sentence.`;
  }

  if (experience) {
    if (action === 'improve') {
      return `Improve this resume work-experience description into clear, impact-focused bullet points (ATS-friendly action verbs). Keep the same facts — do not invent employers, titles, or metrics. Return only the improved description as plain text bullets (one per line, optional leading "• "). No markdown.
${ctx}

Current description:
"""
${text}
"""`;
    }
    if (action === 'grammar') {
      return `Fix grammar, spelling, and punctuation in this resume work-experience description. Keep meaning and facts identical. Return only the corrected description as plain text (preserve bullet lines). No markdown.
${ctx}

Current description:
"""
${text}
"""`;
    }
    if (action === 'shorter') {
      return `Rewrite this resume work-experience description to be more concise (about 60% length) while keeping key achievements. Do not invent facts. Return only plain text bullets. No markdown.
${ctx}

Current description:
"""
${text}
"""`;
    }
    if (action === 'suggest') {
      return text
        ? `Rewrite / expand this resume work-experience description into 3–5 strong achievement bullets. Use only facts implied by the draft and role context — do not invent employers or fake metrics. Return plain text bullets only (one per line, leading "• "). No intro.
${ctx}

Draft:
"""
${text}
"""`
        : `Suggest 3–5 strong resume work-experience achievement bullets for this role. Prefer transferable, honest phrasing; do not invent fake metrics or employers. Return plain text bullets only (one per line, leading "• "). No intro.
${ctx}`;
    }
  }

  // Default: professional summary
  if (action === 'improve') {
    return `Improve this resume professional summary for clarity, impact, and ATS-friendly language. Keep the same facts — do not invent employers, titles, or metrics. Return only the improved summary text (no quotes, no markdown).

Current summary:
"""
${text}
"""`;
  }
  if (action === 'grammar') {
    return `Fix grammar, spelling, and punctuation in this resume professional summary. Keep meaning and facts identical. Return only the corrected summary text (no quotes, no markdown).

Current summary:
"""
${text}
"""`;
  }
  if (action === 'shorter') {
    return `Rewrite this resume professional summary to be more concise (about 60% of the original length) while keeping key qualifications. Do not invent facts. Return only the shorter summary text (no quotes, no markdown).

Current summary:
"""
${text}
"""`;
  }
  // suggest on summary → content suggestions as paragraph (legacy / tips-like content)
  return text
    ? `Based on this draft professional summary, rewrite it into a stronger polished summary. Keep facts. Return only the summary text (no quotes, no markdown).

Draft:
"""
${text}
"""`
    : `Write a short placeholder professional summary template the candidate can customize. Return only the summary text (no quotes, no markdown).`;
};

const callGroqText = async (prompt) => {
  const { apiKey, model, fastModel } = getGroqConfig();
  const models = [fastModel || model, model].filter(
    (name, index, list) => name && list.indexOf(name) === index
  );

  let lastError = null;

  for (const modelName of models) {
    try {
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
                'You are an expert resume writing assistant. Respond with plain text only — no markdown fences, no JSON.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.error?.message || response.statusText;
        const error = new Error(message);
        error.status = response.status;
        lastError = error;
        if (response.status === 429 || response.status === 503) continue;
        break;
      }

      const data = await response.json();
      return String(data.choices?.[0]?.message?.content || '').trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('AI request failed');
};

/**
 * Run a resume-builder AI text action (summary, experience description, etc.).
 * @returns {{ text: string, action: string, field: string }}
 */
export const runResumeAiTextAction = async ({
  action,
  content = '',
  field = 'summary',
  context = {},
} = {}) => {
  if (!RESUME_AI_TEXT_ACTIONS.includes(action)) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.INVALID_AI_ACTION, 400);
  }

  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.AI_NOT_CONFIGURED, 503);
  }

  const plain = stripHtml(content);

  if (action !== 'suggest' && action !== 'tips' && !plain) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.CONTENT_REQUIRED, 400);
  }

  const prompt = buildPrompt(action, plain, field, context);
  let text;
  try {
    text = await callGroqText(prompt);
  } catch (error) {
    console.error('[resume-builder] AI text action failed:', error.message);
    throw new AppError(ERROR_CODES.RESUME_BUILDER.AI_EMPTY_RESPONSE, 502);
  }

  if (!text) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.AI_EMPTY_RESPONSE, 502);
  }

  text = text.replace(/^```[\w]*\n?|\n?```$/g, '').trim();

  return { text, action, field };
};
