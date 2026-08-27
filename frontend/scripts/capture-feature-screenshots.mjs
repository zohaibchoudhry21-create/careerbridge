/**
 * Capture live UI screenshots for README (feature pages).
 * Usage: node scripts/capture-feature-screenshots.mjs
 * Requires: app running on :5173, Playwright installed in frontend.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'screenshots');
const BASE_URL = process.env.CAPTURE_BASE_URL || 'http://localhost:5173';
const EMAIL = process.env.CAPTURE_EMAIL || 'demo@aicareerbridge.com';
const PASSWORD = process.env.CAPTURE_PASSWORD || 'Demo@123456';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForApp(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await sleep(1500);
  }
  throw new Error(`App not reachable at ${BASE_URL}`);
}

async function shot(page, name, options = {}) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({
    path: file,
    fullPage: Boolean(options.fullPage),
    ...options,
  });
  console.log('saved', name);
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(800);

  const email = page.locator('input[type="email"], input[name="email"], input[autocomplete="email"]').first();
  const password = page.locator('input[type="password"]').first();
  await email.fill(EMAIL);
  await password.fill(PASSWORD);

  const submit = page
    .locator('button[type="submit"], button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in")')
    .first();
  await submit.click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45000 }).catch(() => {});
  await sleep(1500);

  if (page.url().includes('/login')) {
    throw new Error('Login failed — still on /login. Seed demo user with: npm run setup');
  }
}

async function safeGoto(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
  await sleep(1200);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await waitForApp();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Public
  await safeGoto(page, '/');
  await shot(page, '01-landing-page.png');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
  await sleep(600);
  await shot(page, '02-landing-features.png');

  await safeGoto(page, '/login');
  await shot(page, '03-login.png');

  // Authenticated feature surfaces
  await login(page);

  await safeGoto(page, '/dashboard');
  await shot(page, '04-dashboard.png');

  await safeGoto(page, '/resume/upload');
  await shot(page, '05-resume-builder.png');

  await safeGoto(page, '/resume-scanner');
  await shot(page, '06-resume-scanner.png');

  await safeGoto(page, '/interview-prep');
  await shot(page, '07-interview-prep.png');

  // Optional deeper pages — capture if they load without hard failure
  for (const [route, name] of [
    ['/interview-prep/mock', '08-mock-interview.png'],
    ['/interview-prep/panel', '09-panel-interview.png'],
    ['/interview-prep/skills', '10-skill-assessment.png'],
  ]) {
    try {
      await safeGoto(page, route);
      if (!page.url().includes('/login')) {
        await shot(page, name);
      }
    } catch (err) {
      console.warn('skip', name, err.message);
    }
  }

  await writeFile(
    path.join(OUT_DIR, 'CAPTURE_INFO.txt'),
    `Captured ${new Date().toISOString()} from ${BASE_URL}\n`,
    'utf8'
  );

  await browser.close();
  console.log('Done. Screenshots in docs/screenshots/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
