/**
 * Phase 3 API verification for login alerts.
 * Run: node backend/scripts/phase3-login-alerts-test.mjs
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

const email = `settings-phase3-${Date.now()}@example.com`;
const password = 'TestPass123!';

async function bootstrapVerifiedUser() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

  await mongoose.connect(uri);
  await User.create({
    name: 'Login Alert Tester',
    email,
    password,
    provider: 'local',
    isVerified: true,
    status: 'active',
    loginAlertsEnabled: true,
  });
  console.log(`  ✓ bootstrapped verified test user (${email})`);
}

async function main() {
  console.log('\nPhase 3 — Login alerts API tests\n');

  await bootstrapVerifiedUser();

  const firstLogin = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  });
  assert(firstLogin.status === 200, 'first login succeeds');
  assert(firstLogin.json?.user?.loginAlertsEnabled === true, 'loginAlertsEnabled defaults true');

  const me = await api('/auth/me');
  assert(me.status === 200, 'GET /auth/me succeeds');
  assert(me.json?.user?.loginAlertsEnabled === true, 'loginAlertsEnabled returned from /auth/me');

  const disableAlerts = await api('/users/me', {
    method: 'PATCH',
    body: { loginAlertsEnabled: false },
  });
  assert(disableAlerts.status === 200, 'PATCH loginAlertsEnabled false succeeds');
  assert(disableAlerts.json?.user?.loginAlertsEnabled === false, 'toggle saved as false');

  cookieHeader = '';
  const secondLogin = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1.15',
  });
  assert(secondLogin.status === 200, 'second login with new device succeeds');

  const enableAlerts = await api('/users/me', {
    method: 'PATCH',
    body: { loginAlertsEnabled: true },
  });
  assert(enableAlerts.status === 200, 'PATCH loginAlertsEnabled true succeeds');
  assert(enableAlerts.json?.user?.loginAlertsEnabled === true, 'toggle saved as true');

  console.log('\nAll Phase 3 login alert tests passed.');
  console.log('Check backend logs for login alert email in dev mode on first/new-device login.\n');

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
