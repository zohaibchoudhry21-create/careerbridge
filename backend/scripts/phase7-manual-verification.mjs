/**
 * Extended Phase 7 manual verification (ZIP contents, secrets, rate-limit message).
 * Run: node backend/scripts/phase7-manual-verification.mjs
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import BuiltResume from '../src/models/BuiltResume.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE = 'http://localhost:5000/api';
const email = `phase7-manual-check-${Date.now()}@example.com`;
const password = 'TestPass123!';

let authCookie = '';
let reactivationCookie = '';

function extractCookies(setCookieHeaders) {
  for (const part of setCookieHeaders || []) {
    if (part.startsWith('cb_token=')) authCookie = part.split(';')[0];
    if (part.startsWith('cb_reactivation_challenge=')) {
      reactivationCookie = part.split(';')[0];
    }
  }
}

async function api(route, { method = 'GET', body } = {}) {
  const cookies = [authCookie, reactivationCookie].filter(Boolean).join('; ');
  const res = await fetch(`${BASE}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const setCookie = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [];
  extractCookies(setCookie);

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/zip')) {
    return { status: res.status, buffer: Buffer.from(await res.arrayBuffer()) };
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, json };
}

function check(label, condition) {
  const status = condition ? 'PASS' : 'FAIL';
  console.log(`  [${status}] ${label}`);
  if (!condition) process.exitCode = 1;
}

async function main() {
  console.log('\nPhase 7 — Extended manual verification\n');

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  await User.create({
    name: 'Manual Check',
    email,
    password,
    provider: 'local',
    isVerified: true,
    status: 'active',
  });

  const createdUser = await User.findOne({ email });
  await BuiltResume.create({
    userId: createdUser._id,
    name: 'Verification Resume',
    templateId: 'classic-clear',
    personalDetails: { fullName: 'Manual Check' },
    sections: [],
  });

  const login = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  check('login succeeds', login.status === 200);

  await api('/users/me/deactivate', { method: 'POST' });
  authCookie = '';
  reactivationCookie = '';

  const loginDeactivated = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  check('deactivated login returns requiresReactivation', loginDeactivated.json?.requiresReactivation === true);
  check('auth cookie withheld before confirm', !authCookie);
  check('reactivation challenge cookie set', reactivationCookie.startsWith('cb_reactivation_challenge='));

  const cancel = await api('/auth/reactivate/clear-challenge', { method: 'POST' });
  check('cancel reactivation challenge succeeds', cancel.status === 200);

  reactivationCookie = '';
  await api('/auth/login', { method: 'POST', body: { email, password } });
  const reactivate = await api('/auth/reactivate', { method: 'POST' });
  check('explicit reactivation succeeds', reactivate.status === 200);
  check('status restored to active', reactivate.json?.user?.status === 'active');

  const me = await api('/auth/me');
  check('reactivated session reaches /auth/me (dashboard path)', me.status === 200);

  const exportRes = await api('/users/me/export');
  check('export returns 200', exportRes.status === 200);
  check('export ZIP has bytes', exportRes.buffer?.length > 100);

  const rateLimited = await api('/users/me/export');
  check('second export within 24h returns 429', rateLimited.status === 429);
  check(
    'rate-limit message is clear',
    /export/i.test(rateLimited.json?.message || '') &&
      /hour/i.test(rateLimited.json?.message || '')
  );
  console.log(`  rate-limit message: "${rateLimited.json?.message}"`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-export-'));
  const zipPath = path.join(tmpDir, 'export.zip');
  const outDir = path.join(tmpDir, 'out');
  fs.writeFileSync(zipPath, exportRes.buffer);
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${outDir}' -Force"`,
    { stdio: 'pipe' }
  );

  const entryNames = fs.readdirSync(outDir);
  const resumeDir = path.join(outDir, 'resumes');
  const resumeFiles = fs.existsSync(resumeDir) ? fs.readdirSync(resumeDir) : [];
  check('ZIP contains profile.json', entryNames.includes('profile.json'));
  check('ZIP contains sessions.json', entryNames.includes('sessions.json'));
  check('ZIP contains README.txt', entryNames.includes('README.txt'));
  check('ZIP contains resumes directory', fs.existsSync(resumeDir));
  check('ZIP includes at least one resume file', resumeFiles.length >= 1);

  const profileText = fs.readFileSync(path.join(outDir, 'profile.json'), 'utf8');
  const secretPattern = /password|twoFactorSecret|twoFactorPendingSecret|backupCodes/i;
  check('profile.json excludes secrets', !secretPattern.test(profileText));

  const readmeText = fs.readFileSync(path.join(outDir, 'README.txt'), 'utf8');
  check('README mentions excluded secrets', /passwords|secrets/i.test(readmeText));
  console.log(`  resume files in export: ${resumeFiles.length}`);

  console.log('\nExtended verification finished.\n');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
