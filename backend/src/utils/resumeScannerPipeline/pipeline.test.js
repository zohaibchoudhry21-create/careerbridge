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
        jobMatchScore: 5,
        jobRelevanceScore: 12,
        jobMatchBreakdown: {
          keywordCoverage: 0,
          aiAssessedRelevance: 52,
          jobRelevanceScore: 12,
        },
        score: 5,
      },
    });
    expect(similarity.rewriteRecommended).toBe(true);
    expect(similarity.jobRelevanceScore).toBe(12);

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
        jobMatchScore: 5,
        jobRelevanceScore: 12,
        jobMatchBreakdown: {
          keywordCoverage: 0,
          aiAssessedRelevance: 52,
          jobRelevanceScore: 12,
        },
        score: 5,
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

describe('rewrite vs optimize decision scenarios', () => {
  const SOFTWARE_SKILLS = [
    { id: '1', name: 'React', type: 'required' },
    { id: '2', name: 'TypeScript', type: 'hard' },
    { id: '3', name: 'Communication', type: 'hard' },
    { id: '4', name: 'Leadership', type: 'hard' },
  ];

  const runScenario = ({
    resumeText = CHEF_RESUME,
    jobDescriptionText,
    jobTitle,
    skills,
    keywordCoverage,
    jobRelevanceScore,
    aiAssessedRelevance,
    jobMatchScore,
    lexicalHintJd,
  }) => {
    const understanding = runUnderstandPass({ resumeText });
    const facts = runFactsPass(understanding);
    const jd = runJdPass({
      jobDescriptionText: lexicalHintJd || jobDescriptionText,
      jobTitle,
      skills,
    });
    const analyzeResult = {
      skills,
      jobMatchScore,
      jobRelevanceScore,
      score: jobMatchScore,
      jobMatchBreakdown: {
        keywordCoverage,
        aiAssessedRelevance,
        jobRelevanceScore,
      },
    };
    const similarity = runSimilarityPass({
      understanding,
      facts,
      jd,
      analyzeResult,
    });
    const decision = runDecidePass({ similarity, skills });
    return { similarity, decision, jd };
  };

  it('1. true field mismatch (chef vs React) → rewrite', () => {
    const { similarity, decision } = runScenario({
      jobDescriptionText:
        'Senior React Developer. Must know React and TypeScript. Build scalable web apps.',
      jobTitle: 'Senior React Developer',
      skills: [
        { id: '1', name: 'React', type: 'required' },
        { id: '2', name: 'TypeScript', type: 'hard' },
      ],
      keywordCoverage: 0,
      // High composite quality (polished resume) — must not keep optimize mode.
      aiAssessedRelevance: 55,
      jobRelevanceScore: 12,
      jobMatchScore: 5,
    });

    expect(similarity.keywordCoverage).toBe(0);
    expect(similarity.jobRelevanceScore).toBe(12);
    expect(similarity.aiRelevance).toBe(55);
    expect(similarity.rewriteRecommended).toBe(true);
    expect(decision.mode).toBe('rewrite');
  });

  it('2. well-formatted wrong-field resume (high composite, low jobRelevance) → rewrite', () => {
    const { similarity, decision } = runScenario({
      jobDescriptionText:
        'Software engineer role requiring React, TypeScript, and strong communication.',
      jobTitle: 'Software Engineer',
      // Generic hard skills that can match most resumes inflate coverage.
      skills: SOFTWARE_SKILLS,
      keywordCoverage: 40,
      aiAssessedRelevance: 62,
      jobRelevanceScore: 18,
      jobMatchScore: 50,
    });

    expect(similarity.keywordCoverage).toBe(40);
    expect(similarity.jobRelevanceScore).toBe(18);
    expect(similarity.aiRelevance).toBe(62);
    // Previously broken: composite 62 + coverage 40 stayed optimize; now jobRelevance gates rewrite.
    expect(decision.mode).toBe('rewrite');
    expect(decision.reason).toMatch(/job_relevance|overall_similarity|job_match|keyword/);
  });

  it('3. career-switch (~40% coverage, mid jobRelevance, blended ~44) → rewrite', () => {
    const { similarity, decision } = runScenario({
      jobDescriptionText: 'Account executive role requiring CRM, sales, and communication skills.',
      jobTitle: 'Account Executive',
      skills: [
        { id: '1', name: 'CRM', type: 'required' },
        { id: '2', name: 'Sales', type: 'hard' },
        { id: '3', name: 'Communication', type: 'hard' },
        { id: '4', name: 'Leadership', type: 'hard' },
      ],
      keywordCoverage: 40,
      aiAssessedRelevance: 58,
      jobRelevanceScore: 45,
      // UI gauge in the weak band that previously stayed optimize.
      jobMatchScore: 43,
      // Force low lexical/transfer contribution so blended sits near ~44.
      lexicalHintJd: 'CRM quota pipeline forecasting',
    });

    // blended uses jobRelevance (not composite): 40*0.55 + 45*0.25 + lex*0.1 + transfer*0.1
    expect(similarity.keywordCoverage).toBe(40);
    expect(similarity.jobRelevanceScore).toBe(45);
    expect(similarity.jobMatchScore).toBe(43);
    expect(similarity.overallSimilarity).toBeLessThan(50);
    expect(decision.mode).toBe('rewrite');
  });

  it('4. genuinely strong match → optimize', () => {
    const strongResume = `Jordan Dev
jordan@example.com

PROFESSIONAL SUMMARY
Senior React engineer building TypeScript web apps.

WORK EXPERIENCE
Senior Software Engineer, Acme
2020 - Present
• Shipped React and TypeScript features used by 1M users

SKILLS
React, TypeScript, Node.js, Communication
`;
    const skills = [
      { id: '1', name: 'React', type: 'required', matched: true },
      { id: '2', name: 'TypeScript', type: 'hard', matched: true },
      { id: '3', name: 'Node.js', type: 'hard', matched: true },
    ];
    const { similarity, decision } = runScenario({
      resumeText: strongResume,
      jobDescriptionText:
        'Senior React Developer. Must know React, TypeScript, and Node.js. Build scalable software.',
      jobTitle: 'Senior React Developer',
      skills,
      keywordCoverage: 90,
      aiAssessedRelevance: 80,
      jobRelevanceScore: 88,
      jobMatchScore: 88,
    });

    expect(similarity.keywordCoverage).toBe(90);
    expect(similarity.jobRelevanceScore).toBe(88);
    expect(similarity.jobMatchScore).toBe(88);
    expect(similarity.overallSimilarity).toBeGreaterThanOrEqual(50);
    expect(similarity.rewriteRecommended).toBe(false);
    expect(decision.mode).toBe('optimize');
    expect(decision.reason).toBeNull();
  });
});

