/**
 * Pass 6 — AI Rewrite Planning (internal)
 * Builds a per-node rewrite strategy from discovered structure.
 * Uses deterministic planning first; optional LLM enrichment when available.
 */

import { invokeJsonCompletion, parseModelJson } from './llmClient.js';

const ACTION_BY_ROLE = {
  descriptive: 'regenerate',
  list: 'reorder_and_align',
  hybrid: 'rewrite_preserving_entities',
  custom: 'regenerate_preserving_facts',
};

/**
 * Deterministic plan from understanding + JD + facts (always available).
 */
export const buildDeterministicPlan = ({ understanding, facts, jd, similarity } = {}) => {
  const nodes = understanding?.nodes || [];
  const priorities = [...(jd?.atsKeywords || [])].slice(0, 20);

  const nodePlans = nodes.map((node) => ({
    id: node.id,
    heading: node.heading,
    type: node.type,
    action: node.editable ? ACTION_BY_ROLE[node.role] || 'regenerate' : 'preserve',
    preserve: [
      ...(node.immutableHints || []),
      ...(facts?.entities?.length ? ['entities'] : []),
      ...(facts?.dates?.length ? ['dates'] : []),
    ],
    emphasize: priorities.slice(0, 8),
    notes:
      node.role === 'custom'
        ? 'Unknown/custom section — rewrite content intelligently while preserving factual tokens'
        : `Rewrite ${node.heading} for JD alignment`,
  }));

  return {
    strategy: similarity?.domainAligned ? 'transferable_alignment' : 'cross_domain_transferable',
    preserveIdentity: true,
    prioritizeKeywords: priorities,
    nodePlans,
    globalNotes: [
      'Rewrite every editable discovered node from scratch',
      'Never invent employers, schools, dates, certifications, or metrics',
      'Highlight transferable skills when domains differ',
    ],
  };
};

const PLAN_SYSTEM = `You refine an internal resume rewrite plan as JSON only.
You receive discovered resume nodes (dynamic structure) and a JD understanding.
Return JSON: { "strategy": string, "nodePlans": [{ "id", "action", "notes" }], "globalNotes": string[] }
Do not invent new node ids. Only refine actions/notes for existing ids.
Actions: regenerate | reorder_and_align | rewrite_preserving_entities | regenerate_preserving_facts | preserve`;

/**
 * Optional LLM enrichment of the deterministic plan.
 */
export const enrichPlanWithLlm = async ({ plan, understanding, jd }) => {
  try {
    const { content, provider } = await invokeJsonCompletion({
      systemPrompt: PLAN_SYSTEM,
      userPrompt: JSON.stringify(
        {
          basePlan: plan,
          nodes: (understanding.nodes || []).map((n) => ({
            id: n.id,
            heading: n.heading,
            type: n.type,
            role: n.role,
          })),
          jd: {
            jobTitle: jd.jobTitle,
            domain: jd.domain,
            atsKeywords: jd.atsKeywords,
            seniority: jd.seniority,
          },
        },
        null,
        2
      ).slice(0, 12000),
      temperature: 0.2,
      maxTokens: 2048,
    });

    const parsed = parseModelJson(content);
    if (!parsed || typeof parsed !== 'object') return { plan, provider: null };

    const byId = new Map((parsed.nodePlans || []).map((n) => [n.id, n]));
    const mergedNodePlans = plan.nodePlans.map((node) => {
      const enrich = byId.get(node.id);
      if (!enrich) return node;
      return {
        ...node,
        action: enrich.action || node.action,
        notes: enrich.notes || node.notes,
      };
    });

    return {
      plan: {
        ...plan,
        strategy: parsed.strategy || plan.strategy,
        globalNotes: Array.isArray(parsed.globalNotes) && parsed.globalNotes.length
          ? parsed.globalNotes
          : plan.globalNotes,
        nodePlans: mergedNodePlans,
      },
      provider,
    };
  } catch (error) {
    console.warn('[resume-scanner-pipeline] plan enrichment skipped:', error.message);
    return { plan, provider: null };
  }
};

export const runPlanPass = async ({ understanding, facts, jd, similarity, enrichWithLlm = true } = {}) => {
  const base = buildDeterministicPlan({ understanding, facts, jd, similarity });
  if (!enrichWithLlm) {
    return { plan: base, provider: null };
  }
  return enrichPlanWithLlm({ plan: base, understanding, jd });
};
