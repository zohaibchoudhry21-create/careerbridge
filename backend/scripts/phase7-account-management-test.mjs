/**
 * Phase 7 API verification for account deactivate, reactivation, and export.
 * Run: node backend/scripts/phase7-account-management-test.mjs
 * Does NOT test account deletion.
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

let authCookie = '';
let reactivationCookie = '';

function extractCookies(setCookieHeaders) {
  if (!setCookieHeaders?.length) return;
  for (const part of setCookieHeaders) {
    if (part.startsWith('cb_token=')) authCookie = part.split(';')[0];
    if (part.startsWith('cb_reactivation_challenge=')) {
      reactivationCookie = part.split(';')[0];
    }
  }
}

function cookieHeader() {
  return [authCookie, reactivationCookie].filter(Boolean).join('; ');
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const cookies = cookieHeader();
  if (cookies) headers.Cookie = cookies;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const rawSetCookie = res.headers.get('set-cookie');
  const setCookie = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : rawSetCookie
      ? (Array.isArray(rawSetCookie) ? rawSetCookie : [rawSetCookie])
      : [];
  extractCookies(setCookie);

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/zip')) {
    const buffer = await res.arrayBuffer();
    return { status: res.status, zipBytes: buffer.byteLength, headers: res.headers };
  }

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

const email = `settings-phase7-${Date.now()}@example.com`;
const password = 'TestPass123!';

async function bootstrapVerifiedUser() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

  await mongoose.connect(uri);
  await User.create({
    name: 'Account Mgmt Tester',
    email,
    password,
    provider: 'local',
    isVerified: true,
    status: 'active',
  });
  console.log(`  ✓ bootstrapped verified test user (${email})`);
}

async function main() {
  console.log('\nPhase 7 — Account management API tests\n');

  await bootstrapVerifiedUser();

  const login = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  assert(login.status === 200, 'login succeeds');
  assert(authCookie.startsWith('cb_token='), 'auth cookie issued');

  const exportRes = await api('/users/me/export');
  assert(exportRes.status === 200, 'export succeeds');
  assert(exportRes.zipBytes > 100, 'export returns ZIP bytes');

  const deactivate = await api('/users/me/deactivate', { method: 'POST' });
  assert(deactivate.status === 200, 'deactivate succeeds');
  assert(deactivate.json?.user?.status === 'deactivated', 'status set to deactivated');

  const blocked = await api('/auth/me');
  assert(blocked.status === 401, 'deactivated session cannot access /auth/me');

  authCookie = '';
  reactivationCookie = '';
  const loginDeactivated = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  assert(loginDeactivated.status === 200, 'deactivated login credentials accepted');
  assert(
    loginDeactivated.json?.requiresReactivation === true,
    'requiresReactivation returned instead of auto-login'
  );
  assert(reactivationCookie.startsWith('cb_reactivation_challenge='), 'reactivation cookie set');
  assert(!authCookie, 'auth cookie withheld until reactivation confirmed');

  const reactivate = await api('/auth/reactivate', { method: 'POST' });
  assert(reactivate.status === 200, 'reactivation confirm succeeds');
  assert(reactivate.json?.user?.status === 'active', 'status restored to active');
  assert(authCookie.startsWith('cb_token='), 'auth cookie issued after reactivation');

  const me = await api('/auth/me');
  assert(me.status === 200, 'reactivated user can access /auth/me');

  const exportCooldown = await api('/users/me/export');
  assert(exportCooldown.status === 429, 'export rate limit enforced within 24 hours');

  console.log('\nAll Phase 7 account management tests passed.\n');
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
