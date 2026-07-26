/**
 * Phase 2 API verification for session/device tracking.
 * Run: node backend/scripts/phase2-sessions-test.mjs
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_ROOT = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const BASE = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT}/api`;

let cookieHeader = '';

function extractCookie(setCookieHeaders) {
  if (!setCookieHeaders?.length) return;
  const tokenPart = setCookieHeaders.find((c) => c.startsWith('cb_token='));
  if (tokenPart) {
    cookieHeader = tokenPart.split(';')[0];
  }
}

async function api(path, { method = 'GET', body, userAgent } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers.Cookie = cookieHeader;
  if (userAgent) headers['User-Agent'] = userAgent;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const setCookie = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [];
  extractCookie(setCookie);

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, json };
}

function assert(condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`  ✓ ${label}`);
}

const email = `settings-phase2-${Date.now()}@example.com`;
const password = 'TestPass123!';

async function bootstrapVerifiedUser() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

  await mongoose.connect(uri);
  await User.create({
    name: 'Session Tester',
    email,
    password,
    provider: 'local',
    isVerified: true,
    status: 'active',
  });
  console.log(`  ✓ bootstrapped verified test user (${email})`);
}

async function main() {
  console.log('\nPhase 2 — Session tracking API tests\n');

  await bootstrapVerifiedUser();

  const loginA = await api('/auth/login', {
    method: 'POST',
    body: { email, password, remember: true },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  });
  assert(loginA.status === 200, 'login succeeds');

  const sessionsA = await api('/users/me/sessions');
  assert(sessionsA.status === 200, 'GET /users/me/sessions succeeds');
  assert(Array.isArray(sessionsA.json?.sessions), 'sessions array returned');
  assert(sessionsA.json.sessions.length >= 1, 'at least one active session');
  assert(sessionsA.json.sessions.some((s) => s.isCurrent), 'current session flagged');
  assert(
    sessionsA.json.sessions[0].deviceLabel.includes('Chrome'),
    'device label parsed from user-agent'
  );

  const secondCookie = cookieHeader;
  cookieHeader = '';

  const loginB = await api('/auth/login', {
    method: 'POST',
    body: { email, password, remember: true },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
  });
  assert(loginB.status === 200, 'second device login succeeds');

  const sessionsB = await api('/users/me/sessions');
  assert(sessionsB.status === 200, 'sessions list after second login');
  assert(sessionsB.json.sessions.length >= 2, 'two active sessions listed');

  const revokeOthers = await api('/users/me/sessions/others', { method: 'DELETE' });
  assert(revokeOthers.status === 200, 'DELETE /users/me/sessions/others succeeds');

  const sessionsAfterOthers = await api('/users/me/sessions');
  assert(sessionsAfterOthers.json.sessions.length === 1, 'only current session remains');
  assert(sessionsAfterOthers.json.sessions[0].isCurrent, 'remaining session is current');

  cookieHeader = secondCookie;
  const staleMe = await api('/auth/me');
  assert(staleMe.status === 401, 'revoked session cannot call /auth/me');

  cookieHeader = '';
  const freshLogin = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  });
  assert(freshLogin.status === 200, 'fresh login after revoke succeeds');

  const sessionsFresh = await api('/users/me/sessions');
  const current = sessionsFresh.json.sessions.find((s) => s.isCurrent);
  assert(current?.id, 'current session has id');

  const revokeCurrent = await api(`/users/me/sessions/${current.id}`, { method: 'DELETE' });
  assert(revokeCurrent.status === 200, 'DELETE current session succeeds');
  assert(revokeCurrent.json?.signedOutCurrent === true, 'signedOutCurrent returned');

  const afterLogout = await api('/auth/me');
  assert(afterLogout.status === 401, 'current session revoked after self sign-out');

  console.log('\nAll Phase 2 session tests passed.\n');
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
