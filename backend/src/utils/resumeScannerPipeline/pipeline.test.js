import { describe, expect, it } from 'vitest';
import { createDecisionContext, isRewriteDecision } from './decisionContext.js';
import { runDecidePass } from './decidePass.js';
import { runDecisionEngine } from './decisionEngine.js';
import { runFactsPass } from './factsPass.js';
import { runFullRewritePipeline, runRewriteFromDecisionContext } from './index.js';
import { runJdPass } from './jdPass.js';
import { buildDeterministicPlan } from './planPass.js';
import { runSimilarityPass } from './similarityPass.js';
import { runUnderstandPass } from './understandPass.js';
import {
  runValidationPipeline,
  validateDiff,
  validateFacts,
  validateQuality,
  validateRewriteQuality,
  validateStructuralCoverage,
} from './validation/index.js';
import { buildValidationFailureFeedback, shouldRetryValidation } from './validation/retryStrategy.js';

const CHEF_RESUME = `Alex Chef
alex@example.com | 555-0100

PROFESSIONAL SUMMARY
Executive chef with culinary leadership experience.

WORK EXPERIENCE
Executive Chef, Grand Hotel
2018 - Present
• Led kitchen team of 15
• Reduced food waste by 20%

EDUCATION
Culinary Diploma, City College
2014 - 2016

SKILLS
Menu planning, Leadership, Food safety

PUBLICATIONS
Kitchen Efficiency Study, Food Journal 2020
`;

describe('resumeScannerPipeline', () => {
  it('understands resume structure dynamically including custom sections', () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    expect(understanding.nodeCount).toBeGreaterThanOrEqual(5);
    expect(understanding.nodes.some((n) => n.type === 'experience')).toBe(true);
    expect(understanding.nodes.some((n) => n.type === 'publications' || n.type === 'custom')).toBe(
      true
    );
    expect(understanding.editableNodeIds.length).toBe(understanding.nodeCount);
  });

  it('extracts content-aware immutable facts', () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    const facts = runFactsPass(understanding);
    expect(facts.identity.email).toBe('alex@example.com');
    expect(facts.entities.some((e) => /Grand Hotel/i.test(e))).toBe(true);
    expect(facts.immutableTokens.some((t) => t.includes('2018') || t === '2018')).toBe(true);
  });

  it('builds JD understanding and similarity/decision for mismatch', () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    const facts = runFactsPass(understanding);
    const skills = [
      { id: '1', name: 'React', type: 'required' },
      { id: '2', name: 'TypeScript', type: 'hard' },
    ];
    const jd = runJdPass({
      jobDescriptionText:
        'Senior React Developer. Must know React and TypeScript. Build scalable web apps.',
      jobTitle: 'Senior React Developer',
      skills,
    });
    expect(jd.domain).toBe('software');
    expect(jd.requiredSkills).toContain('React');

    const similarity = runSimilarityPass({
      understanding,
      facts,
      jd,
      analyzeResult: {
        jobMatchBreakdown: { keywordCoverage: 0, aiAssessedRelevance: 10 },
        score: 10,
      },
    });
    expect(similarity.rewriteRecommended).toBe(true);

    const decision = runDecidePass({ similarity, skills });
    expect(decision.mode).toBe('rewrite');
    expect(decision.reason).toBeTruthy();
  });

  it('creates a deterministic plan for every discovered node', () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    const facts = runFactsPass(understanding);
    const jd = runJdPass({
      jobDescriptionText: 'Software engineer role requiring React',
      jobTitle: 'Engineer',
      skills: [{ id: '1', name: 'React', type: 'required' }],
    });
    const plan = buildDeterministicPlan({
      understanding,
      facts,
      jd,
      similarity: { domainAligned: false },
    });
    expect(plan.nodePlans).toHaveLength(understanding.nodeCount);
    expect(plan.nodePlans.every((n) => n.action)).toBe(true);
  });

  it('rejects superficial rewrite quality', () => {
    const original = 'Built dashboards and improved rankings with SEO and analytics.';
    const almostSame = 'Built dashboards and improved rankings with SEO and analytics tools.';
    const deepRewrite =
      'Directed cross-functional growth initiatives by translating kitchen operations expertise into measurable process optimization, stakeholder communication, and quality systems aligned to digital product delivery.';

    expect(validateRewriteQuality(original, almostSame).valid).toBe(false);
    expect(validateRewriteQuality(original, deepRewrite).valid).toBe(true);
  });

  it('validates structural coverage of rewritten resumes', () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    const incomplete = {
      summary: 'x',
      workExperience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: [],
      achievements: [],
      languages: [],
      additionalSections: [],
      sectionOrder: [{ type: 'summary', heading: 'SUMMARY' }],
    };
    const result = validateStructuralCoverage(understanding, incomplete);
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('Decision Engine produces a reusable DecisionContext once', () => {
    const ctx = runDecisionEngine({
      resumeText: CHEF_RESUME,
      jobDescriptionText:
        'Senior React Developer. Must know React and TypeScript. Build scalable web apps.',
      jobTitle: 'Senior React Developer',
      analyzeResult: {
        skills: [
          { id: '1', name: 'React', type: 'required' },
          { id: '2', name: 'TypeScript', type: 'hard' },
        ],
        jobMatchBreakdown: { keywordCoverage: 0, aiAssessedRelevance: 10 },
        score: 10,
      },
    });

    expect(ctx.mode).toBe('rewrite');
    expect(isRewriteDecision(ctx)).toBe(true);
    expect(ctx.understanding.nodeCount).toBeGreaterThan(0);
    expect(ctx.decidedAt).toBeTruthy();
    expect(Object.isFrozen(ctx)).toBe(true);
  });

  it('rewrite stages reuse DecisionContext and do not re-decide', async () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    const decisionContext = createDecisionContext({
      understanding,
      facts: { identity: {}, entities: [], immutableTokens: [], metrics: [] },
      jd: { domain: 'software', requiredSkills: ['React'] },
      similarity: { rewriteRecommended: false, domainAligned: true },
      decision: {
        mode: 'optimize',
        reason: null,
        confidence: 0.8,
        signals: {},
      },
    });

    const result = await runRewriteFromDecisionContext({
      decisionContext,
      jobDescriptionText: 'React role',
      enrichPlanWithLlm: false,
    });

    expect(result.mode).toBe('optimize');
    expect(result.rewrittenResume).toBeNull();
    expect(result.decisionContext).toBe(decisionContext);
    expect(result.understanding).toBe(understanding);
  });

  it('runFullRewritePipeline reuses provided DecisionContext without rebuilding', async () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    const decisionContext = createDecisionContext({
      understanding,
      facts: { identity: {}, entities: [], immutableTokens: [], metrics: [] },
      jd: { domain: 'software', requiredSkills: [] },
      similarity: { rewriteRecommended: false, domainAligned: true },
      decision: { mode: 'optimize', reason: null, confidence: 0.7, signals: {} },
    });

    const result = await runFullRewritePipeline({
      resumeText: 'DIFFERENT TEXT THAT WOULD YIELD DIFFERENT NODES',
      jobDescriptionText: 'Any JD',
      decisionContext,
      enrichPlanWithLlm: false,
    });

    // Same understanding reference proves Decision Engine was not re-run
    expect(result.understanding).toBe(understanding);
    expect(result.decisionContext).toBe(decisionContext);
    expect(result.mode).toBe('optimize');
  });
});

describe('centralized validation pipeline', () => {
  it('rejects fact drops via unified fact gate', () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    const facts = runFactsPass(understanding);
    const result = validateFacts({
      facts,
      originalStructured: understanding.structured,
      rewrittenStructured: {
        ...understanding.structured,
        workExperience: [
          {
            title: 'Engineer',
            company: 'Tech Corp',
            duration: '2018 - Present',
            bullets: ['Built apps'],
          },
        ],
      },
      rewrittenText: 'Engineer at Tech Corp built apps',
    });
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.field === 'company' || v.field === 'fact')).toBe(
      true
    );
  });

  it('separates diff (superficial) from quality (too short)', () => {
    const original = 'Built dashboards and improved rankings with SEO and analytics.';
    const almostSame = 'Built dashboards and improved rankings with SEO and analytics tools.';
    expect(validateDiff(original, almostSame).valid).toBe(false);
    expect(validateQuality(original, 'short').valid).toBe(false);
  });

  it('runValidationPipeline aggregates hard failures', () => {
    const understanding = runUnderstandPass({ resumeText: CHEF_RESUME });
    const facts = runFactsPass(understanding);
    const result = runValidationPipeline({
      understanding,
      facts,
      originalStructured: understanding.structured,
      originalParsed: null,
      rewriteRaw: {
        name: 'Alex Chef',
        contact: { email: 'alex@example.com', phone: '', address: '' },
        sections: [
          {
            id: 's1',
            type: 'summary',
            heading: 'SUMMARY',
            text: understanding.structured.summary,
          },
        ],
      },
    });
    // Near-identical / incomplete rewrite should fail at least one gate
    expect(result.valid).toBe(false);
    expect(result.hardFailures.length).toBeGreaterThan(0);
    expect(result.details.facts).toBeTruthy();
    expect(result.details.diff).toBeTruthy();
    expect(result.details.quality).toBeTruthy();
    expect(result.details.ats).toBeTruthy();
    expect(result.details.structure).toBeTruthy();
  });
});

