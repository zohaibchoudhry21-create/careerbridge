#!/usr/bin/env node
/**
 * End-to-end resume scanner extraction test via authenticated upload.
 * Usage: node scripts/resume-scanner-e2e-extract.mjs [path/to/resume.pdf]
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import AtsAnalysis from '../src/models/AtsAnalysis.js';
import ScannedResume from '../src/models/ScannedResume.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL || 'http://localhost:5000';
const DEFAULT_RESUME = path.resolve(
  __dirname,
  '../../python-service/tests/fixtures/complex-resume.pdf'
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(route, { method = 'GET', body, token, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !formData) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API}/api${route}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function main() {
  const resumePath = path.resolve(process.argv[2] || DEFAULT_RESUME);
  if (!fs.existsSync(resumePath)) {
    console.error(`Resume not found: ${resumePath}`);
    process.exit(1);
  }

  const email = `scanner-e2e-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  const login = await api('/auth/login', {
    method: 'POST',
    body: { email: process.env.SCANNER_E2E_EMAIL || 'demo@aicareerbridge.com', password: process.env.SCANNER_E2E_PASSWORD || 'Demo@123456' },
  });

  let token = login.json?.token;
  if (!token) {
    const register = await api('/auth/register', {
      method: 'POST',
      body: { name: 'Scanner E2E', email, password },
    });

    if (register.status !== 201 && register.status !== 200) {
      console.error('Register failed:', register.status, register.json);
      process.exit(1);
    }

    const retryLogin = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    token = retryLogin.json?.token;
  }

  if (!token) {
    console.error('Login failed:', login.status, login.json);
    process.exit(1);
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(resumePath);
  formData.append('resume', new Blob([fileBuffer], { type: 'application/pdf' }), path.basename(resumePath));
  formData.append('jobDescription', `We are hiring a Senior Content Marketing Manager.
Requirements: SEO, Google Analytics 4, content strategy, B2B marketing, project management.`);
  formData.append('mode', 'upload');

  const upload = await api('/resume-scanner/upload', {
    method: 'POST',
    token,
    formData,
  });

  if (upload.status !== 202) {
    console.error('Upload failed:', upload.status, upload.json);
    process.exit(1);
  }

  const analysisId = upload.json?.analysisId;
  console.log('analysisId:', analysisId);

  let status = 'pending';
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const poll = await api(`/resume-scanner/${analysisId}/status`, { token });
    status = poll.json?.status;
    const progress = poll.json?.progress;
    process.stdout.write(`\rstatus: ${status} (${progress ?? 0}%)   `);
    if (status === 'completed' || status === 'failed') break;
    await sleep(2000);
  }

  console.log('\n');

  if (status !== 'completed') {
    console.error('Analysis did not complete:', status);
    process.exit(1);
  }

  const analysisRes = await api(`/resume-scanner/${analysisId}`, { token });
  const analysis = analysisRes.json?.analysis;

  await mongoose.connect(process.env.MONGO_URI);
  const dbAnalysis = await AtsAnalysis.findById(analysisId).lean();
  const scanned = dbAnalysis?.resumeSourceId
    ? await ScannedResume.findById(dbAnalysis.resumeSourceId).lean()
    : null;
  await mongoose.disconnect();

  const lineMap = analysis?.lineMap || dbAnalysis?.lineMap || scanned?.lineMap || [];
  const extractionSource = scanned?.extractionMetadata?.source || 'unknown';

  console.log(
    JSON.stringify(
      {
        analysisId,
        extractionSource,
        lineMapLen: lineMap.length,
        resumeTextFirstLines: (analysis?.resumeText || '').split('\n').slice(0, 15),
        lineMapFirstLines: lineMap.slice(0, 15).map((line) => ({
          n: line.line_number,
          section: line.section_type || null,
          text: line.text,
        })),
        matchedSkills: (analysis?.matchedSkills || []).map((s) => s.name),
        missingSkills: (analysis?.missingSkills || []).slice(0, 5).map((s) => s.name),
        pendingSuggestions: (analysis?.suggestions || []).filter((s) => s.status === 'pending').length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
