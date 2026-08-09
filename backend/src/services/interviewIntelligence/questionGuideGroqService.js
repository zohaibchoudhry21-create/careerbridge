/**
 * Groq-generated interview question guide (dynamic — no hardcoded banks).
 * One call produces N questions for the session duration.
 */

import Groq from 'groq-sdk';
import {
  GUIDE_DEPTH_HINTS,
  GUIDE_FOCUS_TAGS,
  QUESTION_GUIDE_GROQ_ENABLED,
  QUESTION_GUIDE_TEMPERATURE,
} from '../../config/interviewIntelligenceConfig.js';
import {
  durationMinutesToQuestionCount,
  resolveFallbackOpeningQuestion,
} from '../../constants/interviewPrepConstants.js';
import { getGroqConfig, isGroqConfigured } from '../../config/groqConfig.js';
import { extractJsonFromText } from '../../utils/resumeAiPrompts.js';
import { withGroqRetry } from '../../utils/withGroqRetry.js';

const normalizeFocusTag = (raw) => {
  const key = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (GUIDE_FOCUS_TAGS.includes(key)) return key;
  if (key.includes('system')) return 'system_design';
  if (key.includes('behav')) return 'behavioral';
  if (key.includes('lead')) return 'leadership';
  if (key.includes('cod')) return 'coding';
  if (key.includes('case')) return 'case_study';
  if (key.includes('open') || key.includes('intro')) return 'opening';
  if (key.includes('comm')) return 'communication';
  return 'general';
};

const normalizeDepthHint = (raw) => {
  const key = String(raw || '')
    .trim()
    .toLowerCase();
  return GUIDE_DEPTH_HINTS.includes(key) ? key : 'standard';
};

/** True when the brief includes resume skills, projects, or a usable excerpt. */
export const briefHasResumeSignals = (brief = {}) => {
  const skills = Array.isArray(brief.skills) ? brief.skills.filter(Boolean) : [];
  const projects = Array.isArray(brief.projects) ? brief.projects.filter(Boolean) : [];
  const excerpt = String(brief.resumeExcerpt || '').trim();
  return skills.length > 0 || projects.length > 0 || excerpt.length >= 40;
};

/**
 * Build the Groq user prompt for the question guide.
 * When resume signals are absent, rules match the historical generic prompt.
 * Exported for unit tests + sample generation review.
 */
export const buildQuestionGuidePrompt = ({
  roleLabel,
  difficulty,
  durationMinutes,
  expectedCount,
  focusAreas,
  brief,
} = {}) => {
  const focusLine =
    (Array.isArray(focusAreas) ? focusAreas : []).filter(Boolean).join(', ') || 'General';
  const briefBlock = brief?.promptText ? `\nCandidate / JD brief:\n${brief.promptText}\n` : '';
  const withResume = briefHasResumeSignals(brief);

  const baseRules = `- First question must be a warm opening / intro style question.
- Cover focus areas across the set; vary topics (do not repeat).
- Ground questions in the brief when present (skills, projects, JD) without inventing facts.
- Questions must be spoken-friendly (one clear ask each).
- No answer keys. No markdown.`;

  const resumeRules = withResume
    ? `
Resume personalization (REQUIRED — resume signals are present in the brief above):
- Hard constraint: produce exactly ${expectedCount} questions total (opening included). Personalization rules must be satisfied INSIDE that count — never add extra questions to meet grounding, and never drop below ${expectedCount}.
- At least 2 questions MUST directly reference a specific project name OR a specific technology/skill that appears in the brief (quote or paraphrase the exact name from the brief). Example shape: "You mentioned working on [Project X] — what was the hardest technical decision you made there?"
- At least 1 question must probe a stated skill more deeply: ask for a concrete example of using that skill (not just name-dropping it).
- If asking multiple questions about the same project, each must probe a genuinely different aspect (e.g. architecture decision vs. debugging story vs. trade-off reasoning) — never ask two questions that could be answered with overlapping content.
- Use ONLY project names, employers, and technologies that appear in the brief. Never invent facts.
- Remaining questions may stay role/focus-area general.`
    : '';

  return `You are designing a live voice interview guide for a ${difficulty} ${roleLabel} role.
Target about ${durationMinutes} minutes. Generate exactly ${expectedCount} distinct interview questions.
Focus areas to emphasize: ${focusLine}.
${briefBlock}
Rules:
${baseRules}${resumeRules}

Return JSON only:
{
  "questions": [
    { "text": "string", "focusTag": "opening|behavioral|leadership|system_design|coding|case_study|communication|general", "depthHint": "warmup|standard|deep" }
  ]
}`;
};

/**
 * Deterministic fallback guide when Groq is unavailable — role-aware opener + focus scaffolds.
 * Not a fixed bank of full interviews; scaffolds instruct the live model to improvise.
 */
export const buildFallbackQuestionGuide = ({
  roleLabel,
  difficulty,
  durationMinutes,
  focusAreas = [],
} = {}) => {
  const count = durationMinutesToQuestionCount(durationMinutes);
  const opener = resolveFallbackOpeningQuestion(roleLabel);
  const focuses = (Array.isArray(focusAreas) ? focusAreas : []).filter(Boolean);
  const items = [
    {
      text: opener,
      focusTag: 'opening',
      depthHint: 'warmup',
    },
  ];

  const scaffolds = [
    {
      focusTag: 'behavioral',
      text: `For a ${difficulty} ${roleLabel} interview, ask a behavioral question about a real challenge relevant to this role (generate your own wording).`,
    },
    {
      focusTag: 'general',
      text: `Ask about ownership and impact on a project relevant to ${roleLabel} (generate a natural spoken question).`,
    },
    {
      focusTag: 'coding',
      text: `If coding is in scope, ask a practical coding/design-of-code question for ${roleLabel} (generate wording live).`,
    },
    {
      focusTag: 'system_design',
      text: `If system design is in scope, ask a scoped design question appropriate for ${roleLabel} (generate wording live).`,
    },
    {
      focusTag: 'leadership',
      text: `Ask a leadership or collaboration question suited to ${roleLabel} (generate wording live).`,
    },
    {
      focusTag: 'communication',
      text: `Ask how they explain technical tradeoffs to non-engineers in a ${roleLabel} context (generate wording live).`,
    },
    {
      focusTag: 'general',
      text: `Ask a closing-depth question about motivation or fit for ${roleLabel} (generate wording live).`,
    },
  ];

  // Prefer focus-area-aligned scaffolds first.
  const preferred = [];
  for (const area of focuses) {
    const tag = normalizeFocusTag(area);
    const match = scaffolds.find((s) => s.focusTag === tag);
    if (match && !preferred.some((p) => p.focusTag === match.focusTag)) {
      preferred.push(match);
    }
  }

  const pool = [...preferred, ...scaffolds.filter((s) => !preferred.includes(s))];
  for (const scaffold of pool) {
    if (items.length >= count) break;
    items.push({
      text: scaffold.text,
      focusTag: scaffold.focusTag,
      depthHint: items.length < 2 ? 'warmup' : 'standard',
    });
  }

  while (items.length < count) {
    items.push({
      text: `Continue with a natural follow-up topic for ${roleLabel} at ${difficulty} difficulty (generate wording live).`,
      focusTag: 'general',
      depthHint: 'standard',
    });
  }

  return items.slice(0, count);
};

export const normalizeQuestionGuide = (rawQuestions, expectedCount, fallbackCtx) => {
  const fallback = buildFallbackQuestionGuide(fallbackCtx);
  const list = Array.isArray(rawQuestions) ? rawQuestions : [];

  const normalized = list
    .map((item, index) => {
      const text = String(item?.text || item?.question || '').trim();
      if (!text) return null;
      return {
        questionId: `q${index + 1}`,
        text,
        order: index,
        focusTag: normalizeFocusTag(item?.focusTag || item?.focus || item?.tag),
        depthHint: normalizeDepthHint(item?.depthHint || item?.depth),
      };
    })
    .filter(Boolean);

  if (!normalized.length) {
    return fallback.map((item, index) => ({
      questionId: `q${index + 1}`,
      text: item.text,
      order: index,
      focusTag: item.focusTag,
      depthHint: item.depthHint,
    }));
  }

  while (normalized.length < expectedCount) {
    const fb = fallback[normalized.length] || fallback[fallback.length - 1];
    normalized.push({
      questionId: `q${normalized.length + 1}`,
      text: fb.text,
      order: normalized.length,
      focusTag: fb.focusTag,
      depthHint: fb.depthHint,
    });
  }

  return normalized.slice(0, expectedCount).map((item, index) => ({
    ...item,
    questionId: `q${index + 1}`,
    order: index,
  }));
};

/**
 * @param {object} params
 * @param {string} params.roleLabel
 * @param {string} params.difficulty
 * @param {number} params.durationMinutes
 * @param {string[]} [params.focusAreas]
 * @param {{ promptText?: string, skills?: string[], projects?: string[], resumeExcerpt?: string }} [params.brief]
 */
export const generateInterviewQuestionGuide = async ({
  roleLabel,
  difficulty,
  durationMinutes,
  focusAreas,
  brief,
} = {}) => {
  const expectedCount = durationMinutesToQuestionCount(durationMinutes);
  const fallbackCtx = { roleLabel, difficulty, durationMinutes, focusAreas };

  if (!QUESTION_GUIDE_GROQ_ENABLED || !isGroqConfigured()) {
    console.warn('[interview-intelligence] Groq guide disabled/unavailable — using fallback guide');
    return normalizeQuestionGuide([], expectedCount, fallbackCtx);
  }

  const { model, apiKey } = getGroqConfig();
  const client = new Groq({ apiKey });
  const prompt = buildQuestionGuidePrompt({
    roleLabel,
    difficulty,
    durationMinutes,
    expectedCount,
    focusAreas,
    brief,
  });

  try {
    const completion = await withGroqRetry(
      () =>
        client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: QUESTION_GUIDE_TEMPERATURE,
          response_format: { type: 'json_object' },
        }),
      { label: 'interview-question-guide' }
    );

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.warn('[interview-intelligence] Empty guide response — fallback');
      return normalizeQuestionGuide([], expectedCount, fallbackCtx);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = extractJsonFromText(content) || {};
    }

    return normalizeQuestionGuide(parsed.questions, expectedCount, fallbackCtx);
  } catch (error) {
    console.warn('[interview-intelligence] Guide Groq failed — fallback:', error.message);
    return normalizeQuestionGuide([], expectedCount, fallbackCtx);
  }
};
