/**
 * Phase 6 — Full Settings API verification (integrated flow).
 * Exercises Personal Info, Login & Security, Sessions, Alerts, Trusted Devices, and 2FA together.
 * Run: node backend/scripts/phase6-full-settings-test.mjs
 *
 * Skips account deletion (destructive). Account Management UI actions remain placeholders.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { generateSync } from 'otplib';
import User from '../src/models/User.js';
import UserSession from '../src/models/UserSession.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_ROOT = (process.env.API_URL || 'http://localhost:5000').replace(/\/$/, '');
const BASE = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT}/api`;

const chromeUa =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const firefoxUa =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';

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

function clearCookies({ auth = false, challenge = false } = {}) {
  if (auth) authCookie = '';
  if (challenge) challengeCookie = '';
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

  return { status: res.status, json };
}

function assert(condition, label) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`  ✓ ${label}`);
}

function section(title) {
  console.log(`\n— ${title}`);
}

const email = `settings-phase6-${Date.now()}@example.com`;
let password = 'TestPass123!';

async function bootstrapVerifiedUser() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

  await mongoose.connect(uri);
  await User.create({
    name: 'Phase Six Tester',
    email,
    password,
    provider: 'local',
    isVerified: true,
    status: 'active',
  });
  console.log(`  ✓ bootstrapped verified test user (${email})`);
}

async function loginWithPassword({ userAgent = chromeUa, trustDevice = false } = {}) {
  return api('/auth/login', {
    method: 'POST',
    body: { email, password, remember: true, trustDevice },
    userAgent,
  });
}

async function verifyTwoFactor(secret) {
  const code = generateSync({ secret, digits: 6, period: 30 });
  return api('/auth/2fa/verify', {
    method: 'POST',
    body: { code },
  });
}

async function main() {
  console.log('\nPhase 6 — Full Settings integration tests\n');

  await bootstrapVerifiedUser();

  section('Login & initial session');
  const login = await loginWithPassword();
  assert(login.status === 200, 'login succeeds');
  assert(authCookie.startsWith('cb_token='), 'auth cookie issued');

  const me0 = await api('/auth/me');
  assert(me0.json?.user?.loginAlertsEnabled !== false, 'login alerts enabled by default');
  assert(me0.json?.user?.rememberDevicesEnabled === false, 'remember devices off by default');
  assert(me0.json?.user?.twoFactorEnabled === false, '2FA off by default');

  section('Personal Information');
  const profile = {
    firstName: 'Phase',
    lastName: 'Six',
    phone: '+1 (555) 987-6543',
    dateOfBirth: '1992-07-04',
    country: 'United States',
    city: 'Austin',
    headline: 'Integrated settings verification',
  };
  const patchProfile = await api('/users/me', { method: 'PATCH', body: profile });
  assert(patchProfile.status === 200, 'profile PATCH succeeds');
  assert(patchProfile.json?.user?.firstName === 'Phase', 'firstName saved');
  assert(patchProfile.json?.user?.name === 'Phase Six', 'display name synced');

  const me1 = await api('/auth/me');
  assert(me1.json?.user?.city === 'Austin', 'profile persists on GET /auth/me');

  section('Security preferences (alerts & remember devices)');
  const disableAlerts = await api('/users/me', {
    method: 'PATCH',
    body: { loginAlertsEnabled: false },
  });
  assert(disableAlerts.status === 200, 'disable login alerts');
  assert(disableAlerts.json?.user?.loginAlertsEnabled === false, 'loginAlertsEnabled false');

  const enableRemember = await api('/users/me', {
    method: 'PATCH',
    body: { rememberDevicesEnabled: true },
  });
  assert(enableRemember.status === 200, 'enable remember devices');
  assert(enableRemember.json?.user?.rememberDevicesEnabled === true, 'rememberDevicesEnabled true');

  section('Active sessions');
  let sessions = await api('/users/me/sessions');
  assert(sessions.status === 200, 'list sessions');
  assert(sessions.json?.sessions?.length >= 1, 'at least one session');
  const currentSession = sessions.json.sessions.find((s) => s.isCurrent);
  assert(currentSession?.id, 'current session has id');

  clearCookies({ auth: true });
  const secondLogin = await loginWithPassword({ userAgent: firefoxUa, trustDevice: true });
  assert(secondLogin.status === 200, 'second device login succeeds');

  sessions = await api('/users/me/sessions');
  assert(sessions.json?.sessions?.length >= 2, 'two sessions after second login');
  const firefoxSession = sessions.json.sessions.find((s) => s.isCurrent);
  assert(firefoxSession?.isTrusted === true, 'trustDevice honored when remember devices enabled');

  const revokeOthers = await api('/users/me/sessions/others', { method: 'DELETE' });
  assert(revokeOthers.status === 200, 'revoke other sessions');

  sessions = await api('/users/me/sessions');
  assert(sessions.json?.sessions?.length === 1, 'only current session remains');

  section('Two-factor authentication');
  const setup = await api('/auth/2fa/setup', { method: 'POST' });
  assert(setup.status === 200, '2FA setup starts');
  assert(setup.json?.recoveryMessage, 'recovery message on setup');

  const totpSecret = setup.json.manualEntryKey;
  const confirm = await api('/auth/2fa/confirm', {
    method: 'POST',
    body: { code: generateSync({ secret: totpSecret, digits: 6, period: 30 }) },
  });
  assert(confirm.status === 200, '2FA confirm succeeds');
  assert(confirm.json?.backupCodes?.length === 10, 'backup codes issued');

  const stored = await User.findOne({ email }).select('+twoFactorSecret');
  assert(stored?.twoFactorSecret?.startsWith('v1:'), 'TOTP secret encrypted at rest');

  clearCookies({ auth: true, challenge: true });
  const login2fa = await loginWithPassword({ userAgent: chromeUa, trustDevice: false });
  assert(login2fa.json?.requires2FA === true, 'untrusted 2FA login requires second step');
  assert(challengeCookie.startsWith('cb_2fa_challenge='), 'challenge cookie set');

  const verify = await verifyTwoFactor(totpSecret);
  assert(verify.status === 200, '2FA verify completes login');
  assert(verify.json?.user?.twoFactorEnabled === true, 'user still has 2FA after verify login');

  sessions = await api('/users/me/sessions');
  const post2faSession = sessions.json.sessions.find((s) => s.isCurrent);
  assert(post2faSession?.id, 'post-2FA session has id');
  const trust = await api(`/users/me/sessions/${post2faSession.id}/trust`, {
    method: 'PATCH',
    body: { trusted: true },
  });
  assert(trust.json?.session?.isTrusted === true, 'current session marked trusted');

  clearCookies({ auth: true, challenge: true });
  const trustedLogin = await loginWithPassword({ userAgent: chromeUa, trustDevice: true });
  assert(trustedLogin.status === 200, 'trusted device login succeeds');
  assert(!trustedLogin.json?.requires2FA, 'trusted device skips 2FA challenge');
  assert(authCookie.startsWith('cb_token='), 'trusted login issues auth cookie directly');

  section('Password change (2FA remains enabled)');
  const changePassword = await api('/users/me/password', {
    method: 'PATCH',
    body: {
      currentPassword: password,
      newPassword: 'NewPass456!',
      confirmPassword: 'NewPass456!',
    },
  });
  assert(changePassword.status === 200, 'password change succeeds');
  password = 'NewPass456!';

  const meAfterPw = await api('/auth/me');
  assert(meAfterPw.json?.user?.twoFactorEnabled === true, '2FA still enabled after password change');

  const trustedAfterPw = await UserSession.countDocuments({
    userId: stored._id,
    isTrusted: true,
    revokedAt: null,
  });
  assert(trustedAfterPw === 0, 'password change clears device trust');

  clearCookies({ auth: true, challenge: true });
  const loginAfterPw = await loginWithPassword({ userAgent: chromeUa });
  assert(loginAfterPw.json?.requires2FA === true, '2FA still required after password change');
  const verifyAfterPw = await verifyTwoFactor(totpSecret);
  assert(verifyAfterPw.status === 200, 'login with new password + 2FA succeeds');

  section('Re-enable login alerts & 2FA status');
  const enableAlerts = await api('/users/me', {
    method: 'PATCH',
    body: { loginAlertsEnabled: true },
  });
  assert(enableAlerts.json?.user?.loginAlertsEnabled === true, 'login alerts re-enabled');

  const status2fa = await api('/auth/2fa/status');
  assert(status2fa.json?.enabled === true, '2FA status reports enabled');
  assert(status2fa.json?.backupCodesRemaining === 10, 'backup codes remaining');

  section('Account Management (non-destructive checks)');
  console.log('  · Account Management UI: deactivate/export/delete/logout are frontend placeholders (not API-tested).');
  console.log('  · Backend DELETE /users/me exists but is intentionally skipped in this suite.');

  const logout = await api('/auth/logout', { method: 'POST' });
  assert(logout.status === 200, 'logout succeeds');

  const afterLogout = await api('/auth/me');
  assert(afterLogout.status === 401, 'session invalid after logout');

  console.log('\nAll Phase 6 full Settings integration tests passed.\n');
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
