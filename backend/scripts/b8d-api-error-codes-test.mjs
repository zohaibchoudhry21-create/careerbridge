/**
 * B8D verification: backend returns error codes with transitional English messages.
 * Run with backend on :5000
 *
 * Usage: node backend/scripts/b8d-api-error-codes-test.mjs
 */
import { ERROR_CODES } from '../src/constants/apiErrorCodes.js';

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

const scenarios = [
  {
    name: 'Login wrong password',
    method: 'POST',
    path: '/auth/login',
    body: { email: 'nobody@example.com', password: 'WrongPass1!' },
    expectCode: ERROR_CODES.AUTH.INVALID_CREDENTIALS,
  },
  {
    name: 'Register missing name',
    method: 'POST',
    path: '/auth/register',
    body: { email: 'test@example.com', password: 'ValidPass1!' },
    expectCode: ERROR_CODES.VALIDATION.NAME_REQUIRED,
  },
  {
    name: 'Register weak password',
    method: 'POST',
    path: '/auth/register',
    body: { name: 'Test User', email: 'test@example.com', password: 'short' },
    expectCode: ERROR_CODES.PASSWORD.POLICY_VIOLATION,
  },
  {
    name: 'Verify email missing token',
    method: 'GET',
    path: '/verify-email',
    expectCode: ERROR_CODES.VERIFY.TOKEN_REQUIRED,
  },
  {
    name: 'Reset password invalid token',
    method: 'POST',
    path: '/auth/reset-password',
    body: { token: 'invalid-token-value', password: 'ValidPass1!' },
    expectCode: ERROR_CODES.AUTH.RESET_TOKEN_INVALID,
  },
  {
    name: 'Protected route without auth',
    method: 'GET',
    path: '/auth/me',
    expectCode: ERROR_CODES.AUTH.NOT_AUTHORIZED,
  },
  {
    name: 'Route not found',
    method: 'GET',
    path: '/does-not-exist-route',
    expectCode: ERROR_CODES.COMMON.ROUTE_NOT_FOUND,
  },
];

async function request(scenario) {
  const url = `${API_BASE}${scenario.path}`;
  const options = {
    method: scenario.method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (scenario.body) {
    options.body = JSON.stringify(scenario.body);
  }
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

let passed = 0;
let failed = 0;

for (const scenario of scenarios) {
  try {
    const { status, data } = await request(scenario);
    const ok =
      data.code === scenario.expectCode &&
      typeof data.message === 'string' &&
      data.message.length > 0 &&
      data.message !== scenario.expectCode;

    if (ok) {
      passed += 1;
      console.log(`✓ ${scenario.name} → ${data.code} (${status})`);
    } else {
      failed += 1;
      console.error(`✗ ${scenario.name}`);
      console.error(`  expected: ${scenario.expectCode}`);
      console.error(`  got:      ${data.code || '(none)'} — ${data.message || ''}`);
    }
  } catch (error) {
    failed += 1;
    console.error(`✗ ${scenario.name} — ${error.message}`);
  }
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\nUI check: trigger errors in EN/ES/UR — codes must never appear as visible text.');
