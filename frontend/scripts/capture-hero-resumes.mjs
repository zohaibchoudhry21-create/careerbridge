import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(FRONTEND_ROOT, 'public', 'images');
const BASE_URL = process.env.VITE_DEV_URL || 'http://localhost:5173';
const CAPTURE_URL = `${BASE_URL}/dev/hero-resume-capture`;

const CAPTURES = [
  { selector: '#atlantic-blue-capture', filename: 'resume-atlantic-blue.png' },
  { selector: '#classic-clear-capture', filename: 'resume-classic-clear.png' },
];

async function isServerUp() {
  try {
    const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

function startDevServer() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'dev'], {
      cwd: FRONTEND_ROOT,
      shell: true,
      stdio: 'pipe',
    });

    let settled = false;

    const onReady = async () => {
      for (let attempt = 0; attempt < 60; attempt += 1) {
        if (await isServerUp()) {
          settled = true;
          resolve(child);
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (!settled) {
        child.kill();
        reject(new Error('Dev server did not start in time'));
      }
    };

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.includes('Local:') || text.includes('ready')) {
        onReady();
      }
    });

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.includes('Local:') || text.includes('ready')) {
        onReady();
      }
    });

    setTimeout(() => {
      if (!settled) onReady();
    }, 2000);
  });
}

async function captureResumes() {
  await mkdir(OUT_DIR, { recursive: true });

  let devProcess = null;
  const serverAlreadyRunning = await isServerUp();

  if (!serverAlreadyRunning) {
    console.log('Starting Vite dev server...');
    devProcess = await startDevServer();
  } else {
    console.log(`Using existing dev server at ${BASE_URL}`);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 900, height: 2400 },
    deviceScaleFactor: 2,
  });

  try {
    await page.goto(CAPTURE_URL, { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#atlantic-blue-capture', { timeout: 60000 });
    await page.waitForSelector('#classic-clear-capture', { timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);

  for (const { selector, filename } of CAPTURES) {
      const outputPath = path.join(OUT_DIR, filename);
      await page.locator(selector).screenshot({
        path: outputPath,
        type: 'png',
      });
      console.log(`Saved ${outputPath}`);
    }
  } finally {
    await browser.close();
    if (devProcess) {
      devProcess.kill();
    }
  }
}

captureResumes().catch((error) => {
  console.error(error);
  process.exit(1);
});
