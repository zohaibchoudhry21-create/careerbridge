/**
 * Downloads humanoid animation GLB clips for the interviewer (Avaturn / Mixamo-compatible rig).
 * Avatar GLB: export from https://avaturn.me and place at public/models/interviewer/interviewer-avatar.glb
 * @see https://docs.avaturn.me/docs/importing/unity/
 * @see https://github.com/readyplayerme/animation-library
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(FRONTEND_ROOT, 'public/models/interviewer');
const ANIM_DIR = path.join(OUT_DIR, 'animations');

const MIXAMO_STYLE_ANIM_BASE =
  'https://raw.githubusercontent.com/readyplayerme/animation-library/master/masculine/glb';

const ANIMATION_SOURCES = {
  idle: `${MIXAMO_STYLE_ANIM_BASE}/idle/M_Standing_Idle_001.glb`,
  thinking: `${MIXAMO_STYLE_ANIM_BASE}/idle/M_Standing_Idle_Variations_003.glb`,
  listening: `${MIXAMO_STYLE_ANIM_BASE}/expression/M_Standing_Expressions_009.glb`,
  speaking: `${MIXAMO_STYLE_ANIM_BASE}/expression/M_Talking_Variations_004.glb`,
};

async function loadEnvValue(key) {
  const envPath = path.join(FRONTEND_ROOT, '.env');
  try {
    const raw = await readFile(envPath, 'utf8');
    const match = raw.match(new RegExp(`^\\s*${key}\\s*=\\s*([^\\s#]+)`, 'm'));
    if (match?.[1]) return match[1].trim();
  } catch {
    // no .env
  }
  return process.env[key]?.trim();
}

const LICENSE_TEXT = `# AI interviewer 3D assets

## Avatar (Avaturn)
- Create and export a **T2 / face-animation** GLB at https://avaturn.me
- Place the file at \`interviewer-avatar.glb\` or set \`VITE_INTERVIEWER_AVATAR_URL\` in frontend/.env
- Lip-sync uses Oculus-style \`viseme_*\` morph targets on the exported model.

## Body animations
- Source: https://github.com/readyplayerme/animation-library (humanoid / Mixamo-retargeted GLB)
- Fetched by \`npm run download:interviewer-avatar\` into \`animations/\`
`;

async function downloadTo(url, dest) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(dest, buffer);
}

async function maybeDownloadAvatarFromUrl() {
  const avatarUrl = await loadEnvValue('VITE_INTERVIEWER_AVATAR_URL');
  if (!avatarUrl || !/^https?:\/\//i.test(avatarUrl)) {
    return;
  }
  console.log(`Fetching avatar from VITE_INTERVIEWER_AVATAR_URL`);
  await downloadTo(avatarUrl, path.join(OUT_DIR, 'interviewer-avatar.glb'));
}

async function main() {
  await mkdir(ANIM_DIR, { recursive: true });

  for (const [name, url] of Object.entries(ANIMATION_SOURCES)) {
    console.log(`Animation: ${name}`);
    await downloadTo(url, path.join(ANIM_DIR, `${name}.glb`));
  }

  await maybeDownloadAvatarFromUrl();

  const avatarPath = path.join(OUT_DIR, 'interviewer-avatar.glb');
  try {
    await readFile(avatarPath);
    console.log('Found interviewer-avatar.glb');
  } catch {
    console.warn(
      '\nNo interviewer-avatar.glb yet. Export a GLB from Avaturn and save it to:\n  public/models/interviewer/interviewer-avatar.glb\n'
    );
  }

  await writeFile(path.join(OUT_DIR, 'LICENSE.md'), LICENSE_TEXT);
  console.log('Saved animation clips to public/models/interviewer/animations/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
