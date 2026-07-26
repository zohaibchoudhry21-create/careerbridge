/**
 * Phase 5 API verification for TOTP two-factor authentication.
 * Run: node backend/scripts/phase5-two-factor-test.mjs
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { generateSync } from 'otplib';
import User from '../src/models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_ROOT = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const BASE = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT}/api`;

let authCookie = '';
let challengeCookie = '';

function extractCookies(setCookieHeaders) {
  if (!setCookieHeaders?.length) return;
  for (const part of setCookieHeaders) {
    if (part.startsWith('cb_token=')) authCookie = part.split(';')[0];
    if (part.startsWith('cb_2fa_challenge=')) challengeCookie = part.split(';')[0];
  }
}

function cookieHeader() {
  return [authCookie, challengeCookie].filter(Boolean).join('; ');
}

async function api(path, { method = 'GET', body, userAgent } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const cookies = cookieHeader();
  if (cookies) headers.Cookie = cookies;
  if (userAgent) headers['User-Agent'] = userAgent;

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

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, json, headers: res.headers };
}

function assert(condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`  ✓ ${label}`);
}

const email = `settings-phase5-${Date.now()}@example.com`;
const password = 'TestPass123!';
const chromeUa =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function bootstrapVerifiedUser() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

  await mongoose.connect(uri);
  await User.create({
    name: 'Two Factor Tester',
    email,
    password,
    provider: 'local',
    isVerified: true,
    status: 'active',
  });
  console.log(`  ✓ bootstrapped verified test user (${email})`);
}

async function main() {
  console.log('\nPhase 5 — Two-factor authentication API tests\n');

  await bootstrapVerifiedUser();

  const login = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
    userAgent: chromeUa,
  });
  assert(login.status === 200, 'initial login succeeds');
  assert(authCookie.startsWith('cb_token='), 'auth cookie set after login');
  assert(login.json?.user?.twoFactorEnabled === false, 'twoFactorEnabled false by default');

  const setup = await api('/auth/2fa/setup', { method: 'POST' });
  if (setup.status !== 200) {
    console.error('Setup failed:', setup.status, setup.json);
  }
  assert(setup.status === 200, '2FA setup starts');
  assert(setup.json?.otpauthUrl, 'otpauth URL returned');
  assert(setup.json?.manualEntryKey, 'manual entry key returned');
  assert(setup.json?.recoveryMessage, 'recovery message returned');

  const secret = setup.json.manualEntryKey;
  const pendingUser = await User.findOne({ email }).select('+twoFactorPendingSecret');
  assert(pendingUser?.twoFactorPendingSecret?.startsWith('v1:'), 'pending secret encrypted at rest');
  assert(pendingUser.twoFactorPendingSecret !== secret, 'pending secret not stored as plaintext');

  const token = generateSync({ secret, digits: 6, period: 30 });

  const confirm = await api('/auth/2fa/confirm', {
    method: 'POST',
    body: { code: token },
  });
  assert(confirm.status === 200, '2FA confirm succeeds');
  assert(Array.isArray(confirm.json?.backupCodes), 'backup codes returned once');
  assert(confirm.json.backupCodes.length === 10, '10 backup codes generated');

  const me = await api('/auth/me');
  assert(me.json?.user?.twoFactorEnabled === true, 'twoFactorEnabled true after confirm');

  const storedUser = await User.findOne({ email }).select('+twoFactorSecret +twoFactorPendingSecret');
  assert(storedUser?.twoFactorSecret?.startsWith('v1:'), 'TOTP secret encrypted at rest');
  assert(storedUser.twoFactorSecret !== secret, 'TOTP secret not stored as plaintext');
  assert(!storedUser.twoFactorPendingSecret, 'pending secret cleared after confirm');

  authCookie = '';
  challengeCookie = '';
  const login2fa = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
    userAgent: chromeUa,
  });
  assert(login2fa.status === 200, 'password step succeeds with 2FA enabled');
  assert(login2fa.json?.requires2FA === true, 'requires2FA returned before session cookie');
  assert(challengeCookie.startsWith('cb_2fa_challenge='), '2FA challenge cookie set');
  assert(!authCookie, 'auth cookie withheld until 2FA verified');

  const badVerify = await api('/auth/2fa/verify', {
    method: 'POST',
    body: { code: '000000' },
  });
  assert(badVerify.status === 401, 'invalid 2FA code rejected');

  const goodToken = generateSync({ secret, digits: 6, period: 30 });
  const verifyLogin = await api('/auth/2fa/verify', {
    method: 'POST',
    body: { code: goodToken },
  });
  assert(verifyLogin.status === 200, 'valid 2FA code completes login');
  assert(verifyLogin.json?.user?.email === email, 'authenticated user returned after 2FA');

  const status = await api('/auth/2fa/status');
  assert(status.status === 200, '2FA status endpoint works');
  assert(status.json?.enabled === true, 'status reports enabled');
  assert(status.json?.backupCodesRemaining === 10, 'backup codes remaining reported');
  assert(status.json?.recoveryMessage, 'status includes recovery message');

  const disable = await api('/auth/2fa/disable', {
    method: 'POST',
    body: {
      password,
      code: generateSync({ secret, digits: 6, period: 30 }),
    },
  });
  assert(disable.status === 200, 'disable 2FA succeeds');
  assert(disable.json?.user?.twoFactorEnabled === false, 'twoFactorEnabled false after disable');

  console.log('\nAll Phase 5 two-factor tests passed.\n');
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
