/**
 * Phase 0 — run report assemble fixtures through CURRENT scoring logic
 * (assembleInterviewReport) and write baseline-scores.json.
 *
 * Usage (from backend/):
 *   node scripts/interview-report-baseline.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { assembleInterviewReport } from '../src/services/interviewReport/reportAssembler.js';
import {
  FIXTURE_IDS,
  REPORT_SCORE_FIXTURES,
} from '../src/services/interviewReport/fixtures/reportScoreFixtures.js';
import { SCORING_LOGIC_VERSION } from '../src/config/interviewReportConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(
  __dirname,
  '../src/services/interviewReport/fixtures/baseline-scores.json'
);

const dimKeys = [
  'communication',
  'technicalSkills',
  'behavior',
  'confidence',
  'leadership',
  'problemSolving',
  'criticalThinking',
];

const summarize = (fixtureId, assembled) => {
  const er = assembled.enterpriseReport || {};
  const dims = er.dimensions || {};
  return {
    fixtureId,
    description: REPORT_SCORE_FIXTURES[fixtureId].description,
    questionReviews: (er.questionReviews || []).map((r) => ({
      questionId: r.questionId,
      score: r.score,
      feedback: r.feedback,
      relevanceGate: r.relevanceGate || null,
    })),
    dimensions: Object.fromEntries(
      dimKeys.map((k) => [
        k,
        {
          score: dims[k]?.score ?? null,
          feedback: dims[k]?.feedback || '',
        },
      ])
    ),
    overallScore: assembled.overallScore,
    hiringDecision: er.hiringRecommendation?.decision ?? null,
    hiringProbability: er.hiringProbability?.percent ?? null,
    strengths: er.strengths || assembled.strengths || [],
  };
};

const results = {};
for (const id of FIXTURE_IDS) {
  const fixture = REPORT_SCORE_FIXTURES[id];
  // Deep-clone narrative so fixtures don't share mutated state.
  const narrative = structuredClone(fixture.narrative);
  const assembled = assembleInterviewReport(fixture.snapshot, narrative);
  results[id] = summarize(id, assembled);

  console.log(`\n=== ${id} ===`);
  console.log('questions:', results[id].questionReviews.map((q) => `${q.questionId}:${q.score}`).join(', '));
  console.log(
    'dimensions:',
    dimKeys.map((k) => `${k}=${results[id].dimensions[k].score}`).join(', ')
  );
  console.log(
    'overall:',
    results[id].overallScore,
    '| hiring:',
    results[id].hiringDecision,
    `(${results[id].hiringProbability}%)`
  );
}

const payload = {
  generatedAt: new Date().toISOString(),
  scoringLogicVersion: SCORING_LOGIC_VERSION,
  note: 'Baseline from assembleInterviewReport with optimistic Groq narrative + high delivery metrics. No live Groq calls.',
  fixtures: results,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`\nWrote baseline → ${outPath}`);
