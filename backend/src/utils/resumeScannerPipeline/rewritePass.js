/**
 * Pass 7 — Dynamic Resume Rewrite
 * Iterates discovered nodes (not hardcoded section names).
 */

import { invokeJsonCompletion, parseModelJson } from './llmClient.js';
import { parseResumeRewriteOutput } from '../resumeScannerRewriteSchemas.js';

const REWRITE_SYSTEM = `You are an enterprise ATS resume rewriting engine.

You receive:
1) Discovered resume nodes (dynamic structure — any headings/types)
2) Immutable candidate facts
3) Job description understanding
4) An internal rewrite plan

Rules:
- Rewrite EVERY editable node from scratch according to the plan.
- Preserve all immutable facts exactly (entities, dates, metrics, identity).
- Never invent employers, schools, certifications, projects, dates, or metrics.
- Unknown/custom nodes must still be rewritten intelligently.
- Output JSON only with identity + sections covering every planned node in order.

Output shape:
{
  "name": "string",
  "contact": { "address": "", "phone": "", "email": "" },
  "sections": [
    {
      "id": "same as input node id",
      "type": "string",
      "heading": "string",
      "text": "for summary/freeform",
      "items": ["for list nodes"],
      "paragraphs": ["for custom freeform"],
      "entries": [{ "title","company","duration","bullets","name","description","technologies","degree","institution" }]
    }
  ],
  "rewriteNotes": ["short note per major node"]
}`;

export const buildRewriteUserPrompt = ({
  understanding,
  facts,
  jd,
  plan,
  jobDescriptionText,
  validationFeedback = null,
}) => {
  const nodes = (understanding.nodes || []).map((node) => ({
    id: node.id,
    type: node.type,
    heading: node.heading,
    role: node.role,
    editable: node.editable,
    payload: node.payload,
    plan: (plan.nodePlans || []).find((p) => p.id === node.id) || null,
  }));

  const retryBlock = validationFeedback?.attemptHint
    ? `\n\nVALIDATION RETRY FEEDBACK (must fix):\n${validationFeedback.attemptHint}\n`
    : '';

  return `Job description:
"""
${String(jobDescriptionText || '').slice(0, 10000)}
"""

JD understanding:
${JSON.stringify(
  {
    jobTitle: jd.jobTitle,
    domain: jd.domain,
    seniority: jd.seniority,
    atsKeywords: jd.atsKeywords,
    requiredSkills: jd.requiredSkills,
    hardSkills: jd.hardSkills,
  },
  null,
  2
)}

Immutable candidate facts (MUST preserve):
${JSON.stringify(facts, null, 2).slice(0, 6000)}
${retryBlock}
Internal rewrite plan:
${JSON.stringify(plan, null, 2).slice(0, 6000)}

Discovered resume nodes to rewrite (dynamic — rewrite all editable nodes):
${JSON.stringify(nodes, null, 2).slice(0, 12000)}

Identity:
${JSON.stringify(understanding.identity || {}, null, 2)}

Return the fully rewritten resume JSON now.`;
};

export const runRewritePass = async ({
  understanding,
  facts,
  jd,
  plan,
  jobDescriptionText,
  validationFeedback = null,
} = {}) => {
  const { content, provider } = await invokeJsonCompletion({
    systemPrompt: REWRITE_SYSTEM,
    userPrompt: buildRewriteUserPrompt({
      understanding,
      facts,
      jd,
      plan,
      jobDescriptionText,
      validationFeedback,
    }),
    temperature: validationFeedback ? 0.35 : 0.3,
    maxTokens: 8192,
  });

  if (!content) {
    throw new Error('Empty rewrite model response');
  }

  const parsed = parseResumeRewriteOutput(parseModelJson(content));
  return { raw: parsed, provider };
};
