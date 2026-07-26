/**
 * Phase 3C API verification for Personal Information settings.
 * Run: node backend/scripts/phase3c-personal-info-test.mjs
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

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers.Cookie = cookieHeader;

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

const email = `settings-phase3c-${Date.now()}@example.com`;
const password = 'TestPass123!';

async function bootstrapVerifiedUser() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

  await mongoose.connect(uri);
  await User.create({
    name: 'Phase Tester',
    email,
    password,
    provider: 'local',
    isVerified: true,
    status: 'active',
  });
  console.log(`  ✓ bootstrapped verified test user (${email})`);
}

const validProfile = {
  firstName: 'Phase',
  lastName: 'ThreeC',
  phone: '+1 (555) 123-4567',
  dateOfBirth: '1995-03-15',
  gender: 'Prefer not to say',
  country: 'United States',
  state: 'California',
  city: 'San Francisco',
  linkedin: 'https://linkedin.com/in/phase3c',
  portfolio: 'https://phase3c.dev',
  headline: 'Settings wiring verification user',
};

async function main() {
  console.log('Phase 3C — Personal Information API verification\n');

  // 1. Bootstrap verified user (avoids SMTP during register in local dev)
  await bootstrapVerifiedUser();

  // 2. Login
  const login = await api('/auth/login', {
    method: 'POST',
    body: { email, password, remember: true },
  });
  assert(login.status === 200, `login → ${login.status}`);
  assert(cookieHeader.startsWith('cb_token='), 'auth cookie set');

  // 3. Initial GET /auth/me — no Alex Johnson, empty profile fields
  const me1 = await api('/auth/me');
  assert(me1.status === 200, `GET /auth/me → ${me1.status}`);
  assert(me1.json?.user?.email === email, 'me returns logged-in email');
  assert(me1.json?.user?.firstName === '', 'firstName initially empty');
  assert(me1.json?.user?.dateOfBirth === '', 'dateOfBirth initially empty');
  assert(me1.json?.user?.phone === '', 'phone initially empty');

  // 4. Save full profile
  const patchOk = await api('/users/me', { method: 'PATCH', body: validProfile });
  assert(patchOk.status === 200, `PATCH valid profile → ${patchOk.status}`);
  const saved = patchOk.json?.user;
  assert(saved?.firstName === 'Phase', 'saved firstName');
  assert(saved?.lastName === 'ThreeC', 'saved lastName');
  assert(saved?.phone === '+1 (555) 123-4567', 'saved phone');
  assert(saved?.dateOfBirth === '1995-03-15', 'saved dateOfBirth');
  assert(saved?.linkedin === 'https://linkedin.com/in/phase3c', 'saved linkedin');
  assert(saved?.name === 'Phase ThreeC', 'legacy name synced from parts');

  // 5. Refresh simulation — GET /auth/me again
  const me2 = await api('/auth/me');
  assert(me2.json?.user?.city === 'San Francisco', 'persisted city after refresh');
  assert(me2.json?.user?.headline === validProfile.headline, 'persisted headline after refresh');

  // 6. Invalid phone
  const badPhone = await api('/users/me', {
    method: 'PATCH',
    body: { phone: 'not-a-phone' },
  });
  assert(badPhone.status === 400, `invalid phone → 400 (got ${badPhone.status})`);
  assert(
    /phone/i.test(badPhone.json?.message || ''),
    `invalid phone error message: "${badPhone.json?.message}"`
  );

  // 7. Invalid LinkedIn URL
  const badUrl = await api('/users/me', {
    method: 'PATCH',
    body: { linkedin: 'not-a-url' },
  });
  assert(badUrl.status === 400, `invalid linkedin → 400 (got ${badUrl.status})`);
  assert(
    /linkedin|url/i.test(badUrl.json?.message || ''),
    `invalid linkedin error message: "${badUrl.json?.message}"`
  );

  // 8. Data unchanged after failed patches
  const me3 = await api('/auth/me');
  assert(me3.json?.user?.phone === '+1 (555) 123-4567', 'phone unchanged after invalid patch');

  console.log('\nAll Phase 3C API checks passed.');
  console.log(`Test user: ${email} (left in DB for manual UI check; delete skipped)`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n' + err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
