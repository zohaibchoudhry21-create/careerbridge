#!/usr/bin/env node
/**
 * Phase 6 smoke — Upload → Analyze → Optimize/Rewrite → Accept → Edit → Finalize → PDF
 * Usage: node scripts/resume-scanner-phase6-smoke.mjs [path/to/resume.pdf]
 *
 * Auth: creates a verified local user in Mongo (avoids SMTP-gated /auth/register).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import generateToken from '../src/utils/generateToken.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL || 'http://localhost:5000';
const DEFAULT_RESUME = path.resolve(
  __dirname,
  '../../python-service/tests/fixtures/complex-resume.pdf'
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(route, { method = 'GET', body, token, formData, raw = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !formData) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API}/api${route}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

  if (raw) {
    return {
      status: response.status,
      headers: response.headers,
      buffer: Buffer.from(await response.arrayBuffer()),
    };
  }

  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

const assert = (cond, message) => {
  if (!cond) throw new Error(message);
};

async function issueVerifiedUserToken() {
  assert(process.env.MONGO_URI, 'MONGO_URI required');
  assert(process.env.JWT_SECRET, 'JWT_SECRET required');

  await mongoose.connect(process.env.MONGO_URI);
  const email = `scanner-p6-${Date.now()}@example.com`;
  const user = await User.create({
    name: 'Scanner Phase6',
    email,
    password: 'TestPass123!',
    provider: 'local',
    role: 'user',
    status: 'active',
    isVerified: true,
  });
  const token = generateToken(user._id, user.tokenVersion || 0);
  await mongoose.disconnect();
  return token;
}

async function main() {
  const resumePath = path.resolve(process.argv[2] || DEFAULT_RESUME);
  assert(fs.existsSync(resumePath), `Resume not found: ${resumePath}`);

  const token = await issueVerifiedUserToken();
  console.log('[1] Auth OK');

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(resumePath);
  formData.append('resume', new Blob([fileBuffer], { type: 'application/pdf' }), path.basename(resumePath));
  formData.append(
    'jobDescription',
    `We are hiring a Senior Content Marketing Manager.
Requirements: SEO, Google Analytics 4, content strategy, B2B marketing, project management.
Nice to have: HubSpot, A/B testing, stakeholder communication.`
  );
  formData.append('mode', 'upload');

  const upload = await api('/resume-scanner/upload', {
    method: 'POST',
    token,
    formData,
  });
  assert(upload.status === 202, `Upload failed: ${upload.status} ${JSON.stringify(upload.json)}`);
  // sendResponse spreads payload at top level (not nested under data)
  const analysisId = upload.json?.analysisId;
  assert(analysisId, `Missing analysisId: ${JSON.stringify(upload.json)}`);
  console.log('[2] Upload OK', analysisId);

  let status = 'pending';
  let lastProgress = 0;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const poll = await api(`/resume-scanner/${analysisId}/status`, { token });
    status = poll.json?.status;
    lastProgress = poll.json?.progress ?? 0;
    process.stdout.write(`\r[3] Polling: ${status} (${lastProgress}%)   `);
    if (status === 'completed' || status === 'failed') break;
    await sleep(2000);
  }
  console.log('');
  assert(status === 'completed', `Analysis did not complete: ${status} ${JSON.stringify({ lastProgress })}`);
  console.log('[3] Analysis completed');

  let analysisRes = await api(`/resume-scanner/${analysisId}`, { token });
  assert(analysisRes.status === 200, `GET analysis failed: ${analysisRes.status}`);
  let analysis = analysisRes.json?.analysis;
  assert(analysis?.structuredResume || analysis?.resumeText, 'Missing resume payload');
  console.log('[4] Parsing/structure OK', {
    rewriteStatus: analysis.rewriteStatus,
    suggestions: (analysis.suggestions || []).length,
    atsScore: analysis.atsScore,
    jobMatchScore: analysis.jobMatchScore,
  });

  if (analysis.rewriteStatus === 'pending_review') {
    console.log('[5] Rewrite preview present — accepting');
    const accept = await api(`/resume-scanner/${analysisId}/rewrite`, {
      method: 'PATCH',
      token,
      body: { action: 'accept' },
    });
    assert(accept.status === 200, `Accept rewrite failed: ${accept.status} ${JSON.stringify(accept.json)}`);
    analysis = accept.json?.analysis || analysis;
    console.log('[5] Rewrite accepted', { rewriteStatus: analysis.rewriteStatus });
  } else {
    const pending = (analysis.suggestions || []).find((s) => s.status === 'pending');
    if (pending) {
      console.log('[5] Optimize path — accepting one suggestion');
      const acceptOne = await api(
        `/resume-scanner/${analysisId}/suggestion/${pending.id}`,
        {
          method: 'PATCH',
          token,
          body: { action: 'accept' },
        }
      );
      assert(
        acceptOne.status === 200,
        `Accept suggestion failed: ${acceptOne.status} ${JSON.stringify(acceptOne.json)}`
      );
      analysis = acceptOne.json?.analysis || analysis;
      console.log('[5] Suggestion accepted');
    } else {
      console.log('[5] Optimize path — no pending suggestions (OK)');
    }
  }

  const editPayload = analysis.structuredResume
    ? {
        structuredResume: {
          ...analysis.structuredResume,
          summary:
            (analysis.structuredResume.summary || '') +
            (analysis.structuredResume.summary ? ' ' : '') +
            'Phase 6 smoke edit.',
        },
      }
    : {
        resumeText: `${analysis.resumeText || ''}\n\nPhase 6 smoke edit.`,
      };

  const edit = await api(`/resume-scanner/${analysisId}/text`, {
    method: 'PATCH',
    token,
    body: editPayload,
  });
  assert(edit.status === 200, `Edit failed: ${edit.status} ${JSON.stringify(edit.json)}`);
  analysis = edit.json?.analysis || analysis;
  console.log('[6] Edit OK');

  const finalize = await api(`/resume-scanner/${analysisId}/finalize`, {
    method: 'POST',
    token,
  });
  assert(finalize.status === 200, `Finalize failed: ${finalize.status} ${JSON.stringify(finalize.json)}`);
  analysis = finalize.json?.analysis || analysis;
  assert(analysis.canDownloadPdf === true, 'canDownloadPdf should be true after finalize');
  assert(analysis.finalizedAt, 'finalizedAt missing');
  console.log('[7] Finalize OK');

  const pdf = await api(`/resume-scanner/${analysisId}/pdf`, {
    token,
    raw: true,
  });
  assert(pdf.status === 200, `PDF download failed: ${pdf.status}`);
  assert(pdf.buffer.slice(0, 4).toString() === '%PDF', 'PDF magic bytes missing');
  assert(pdf.buffer.length > 500, `PDF too small: ${pdf.buffer.length}`);
  console.log('[8] Download PDF OK', {
    bytes: pdf.buffer.length,
    contentType: pdf.headers.get('content-type'),
  });

  console.log('\nPhase 6 smoke PASSED');
}

main().catch((error) => {
  console.error('\nPhase 6 smoke FAILED:', error.message);
  process.exit(1);
});
