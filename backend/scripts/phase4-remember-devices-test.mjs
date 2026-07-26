/**
 * Phase 4 API verification for Remember Devices / trusted sessions.
 * Run: node backend/scripts/phase4-remember-devices-test.mjs
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import UserSession from '../src/models/UserSession.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_ROOT = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const BASE = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT}/api`;

let cookieHeader = '';

function extractCookie(setCookieHeaders) {
  if (!setCookieHeaders?.length) return;
  const tokenPart = setCookieHeaders.find((c) => c.startsWith('cb_token='));
  if (tokenPart) cookieHeader = tokenPart.split(';')[0];
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

const email = `settings-phase4-${Date.now()}@example.com`;
const password = 'TestPass123!';
const chromeUa =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const firefoxUa =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';

async function bootstrapVerifiedUser() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

  await mongoose.connect(uri);
  await User.create({
    name: 'Remember Devices Tester',
    email,
    password,
    provider: 'local',
    isVerified: true,
    status: 'active',
    rememberDevicesEnabled: false,
  });
  console.log(`  ✓ bootstrapped verified test user (${email})`);
}

async function main() {
  console.log('\nPhase 4 — Remember Devices API tests\n');

  await bootstrapVerifiedUser();

  const loginUntrusted = await api('/auth/login', {
    method: 'POST',
    body: { email, password, trustDevice: true },
    userAgent: chromeUa,
  });
  assert(loginUntrusted.status === 200, 'login succeeds when remember devices is off');
  assert(loginUntrusted.json?.user?.rememberDevicesEnabled === false, 'rememberDevicesEnabled false by default');

  let sessions = await api('/users/me/sessions');
  const firstSession = sessions.json?.sessions?.[0];
  assert(firstSession && !firstSession.isTrusted, 'trustDevice ignored when feature disabled');

  const enableRemember = await api('/users/me', {
    method: 'PATCH',
    body: { rememberDevicesEnabled: true },
  });
  assert(enableRemember.status === 200, 'enable remember devices');
  assert(enableRemember.json?.user?.rememberDevicesEnabled === true, 'rememberDevicesEnabled saved');

  const trustDenied = await api(`/users/me/sessions/${firstSession.id}/trust`, {
    method: 'PATCH',
    body: { trusted: true },
  });
  assert(trustDenied.status === 200, 'trust current session succeeds');
  assert(trustDenied.json?.session?.isTrusted === true, 'session marked trusted');

  cookieHeader = '';
  const loginTrusted = await api('/auth/login', {
    method: 'POST',
    body: { email, password, trustDevice: true },
    userAgent: firefoxUa,
  });
  assert(loginTrusted.status === 200, 'second device login succeeds');

  sessions = await api('/users/me/sessions');
  const firefoxSession = sessions.json?.sessions?.find((s) => s.isCurrent);
  assert(firefoxSession?.isTrusted === true, 'trustDevice honored on login when enabled');

  cookieHeader = '';
  const loginAutoTrust = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
    userAgent: chromeUa,
  });
  assert(loginAutoTrust.status === 200, 'chrome login succeeds for auto-trust check');

  sessions = await api('/users/me/sessions');
  const chromeSession = sessions.json?.sessions?.find(
    (s) => s.isCurrent && s.deviceLabel.includes('Chrome')
  );
  assert(chromeSession?.isTrusted === true, 'returning fingerprint auto-trusted');

  const removeTrust = await api(`/users/me/sessions/${chromeSession.id}/trust`, {
    method: 'PATCH',
    body: { trusted: false },
  });
  assert(removeTrust.status === 200, 'remove trust succeeds');
  assert(removeTrust.json?.session?.isTrusted === false, 'session trust removed');

  const userDoc = await User.findOne({ email });
  await api('/auth/login', {
    method: 'POST',
    body: { email, password },
    userAgent: chromeUa,
  });

  const changePassword = await api('/users/me/password', {
    method: 'PATCH',
    body: {
      currentPassword: password,
      newPassword: 'NewPass456!',
      confirmPassword: 'NewPass456!',
    },
  });
  assert(changePassword.status === 200, 'password change succeeds');

  const trustedCount = await UserSession.countDocuments({
    userId: userDoc._id,
    isTrusted: true,
    revokedAt: null,
  });
  assert(trustedCount === 0, 'password change clears trust on all sessions');

  console.log('\nAll Phase 4 remember-devices tests passed.\n');
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
