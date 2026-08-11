import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');
const exts = ['.js', '.jsx', '.ts', '.tsx'];
const skipDirs = new Set(['node_modules', 'dist', '.git']);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (exts.some((e) => ent.name.endsWith(e))) files.push(full);
  }
  return files;
}

function resolveImport(fromFile, imp) {
  let resolvedImp = imp;
  if (imp.startsWith('@/')) {
    resolvedImp = path.join(srcDir, imp.slice(2));
  } else if (!imp.startsWith('.')) {
    return null;
  } else {
    resolvedImp = path.join(path.dirname(fromFile), imp);
  }

  const candidates = [
    resolvedImp,
    `${resolvedImp}.js`,
    `${resolvedImp}.jsx`,
    `${resolvedImp}.ts`,
    `${resolvedImp}.tsx`,
    path.join(resolvedImp, 'index.js'),
    path.join(resolvedImp, 'index.jsx'),
    path.join(resolvedImp, 'index.ts'),
    path.join(resolvedImp, 'index.tsx'),
  ];
  for (const c of candidates) {
    const resolved = path.normalize(c);
    if (fs.existsSync(resolved)) return resolved;
  }
  return path.normalize(resolvedImp);
}

const allFiles = walk(srcDir);
const allContent = new Map();
for (const f of allFiles) allContent.set(f, fs.readFileSync(f, 'utf8'));

const entryPoints = new Set([
  path.join(srcDir, 'main.jsx'),
  path.join(srcDir, 'App.jsx'),
]);

for (const f of allFiles) {
  if (f.includes('.test.') || f.includes('.spec.')) entryPoints.add(f);
}

function isImported(targetFile) {
  if (entryPoints.has(targetFile)) return true;

  const targetNorm = path.normalize(targetFile);
  const base = path.basename(targetFile, path.extname(targetFile));
  const relNoExt = path
    .relative(srcDir, targetFile)
    .replace(/\\/g, '/')
    .replace(/\.(jsx?|tsx?)$/, '');

  for (const [file, content] of allContent) {
    if (file === targetFile) continue;

    const patterns = [
      /(?:import|export)\s+[\s\S]*?from\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (const re of patterns) {
      let m;
      while ((m = re.exec(content)) !== null) {
        const imp = m[1];
        const impNoExt = imp.replace(/\.(jsx?|tsx?)$/, '');
        if (
          imp === relNoExt ||
          impNoExt === relNoExt ||
          imp.endsWith(`/${relNoExt}`) ||
          impNoExt.endsWith(`/${relNoExt}`) ||
          imp.endsWith(`/${base}`) ||
          impNoExt.endsWith(`/${base}`)
        ) {
          return true;
        }
        if (imp.startsWith('.') || imp.startsWith('@/')) {
          const resolved = resolveImport(file, imp);
          if (resolved === targetNorm) return true;
        }
      }
    }
  }
  return false;
}

const unused = [];
for (const f of allFiles) {
  const rel = path.relative(srcDir, f).replace(/\\/g, '/');
  if (rel === 'main.jsx' || rel === 'App.jsx') continue;
  if (rel.includes('.test.') || rel.includes('.spec.')) continue;
  if (!isImported(f)) unused.push(rel);
}
unused.sort();

console.log('=== UNUSED FILES ===');
console.log('COUNT:', unused.length);
unused.forEach((u) => console.log(u));

// Dependency usage
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const allSrc = [...allContent.values()].join('\n');
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const depChecks = {
  '@radix-ui/react-avatar': ['@radix-ui/react-avatar'],
  '@react-three/drei': ['@react-three/drei'],
  '@react-three/fiber': ['@react-three/fiber'],
  '@tanstack/react-query': ['@tanstack/react-query'],
  '@vapi-ai/web': ['@vapi-ai/web'],
  'ai-careerbridge': ['ai-careerbridge'],
  axios: ['axios', "from 'axios'", 'from "axios"'],
  'chart.js': ['chart.js', 'chartjs'],
  clsx: ['clsx'],
  dompurify: ['dompurify', 'DOMPurify'],
  'face-api.js': ['face-api.js', 'faceapi'],
  gsap: ['gsap'],
  html2canvas: ['html2canvas'],
  i18next: ['i18next'],
  jspdf: ['jspdf', 'jsPDF'],
  'lottie-react': ['lottie-react'],
  'lucide-react': ['lucide-react'],
  motion: ["from 'motion'", 'from "motion"', "from 'motion/react'", 'motion/react'],
  'particles.js': ['particles.js', 'particlesJS'],
  'qrcode.react': ['qrcode.react', 'QRCodeSVG'],
  react: ["from 'react'", 'from "react"'],
  'react-chartjs-2': ['react-chartjs-2'],
  'react-dom': ["from 'react-dom'", 'react-dom/client'],
  'react-hook-form': ['react-hook-form'],
  'react-i18next': ['react-i18next'],
  'react-router-dom': ['react-router-dom'],
  'react-toastify': ['react-toastify'],
  'tailwind-merge': ['tailwind-merge'],
  three: ["from 'three'", 'from "three"'],
};

console.log('\n=== DEPENDENCY USAGE ===');
for (const [dep, patterns] of Object.entries(depChecks)) {
  const used = patterns.some((p) => allSrc.includes(p));
  console.log(`${used ? 'USED' : 'UNUSED'}: ${dep}`);
}

// Large comment blocks
console.log('\n=== LARGE COMMENT BLOCKS ===');
for (const [file, content] of allContent) {
  const lines = content.split('\n');
  let blockStart = -1;
  let blockLen = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const isComment =
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed === '*/' ||
      (trimmed.startsWith('{/*') && trimmed.endsWith('*/}'));
    if (isComment) {
      if (blockStart < 0) blockStart = i + 1;
      blockLen++;
    } else if (blockLen >= 15) {
      console.log(`${path.relative(srcDir, file).replace(/\\/g, '/')}: lines ~${blockStart}-${blockStart + blockLen - 1} (${blockLen} lines)`);
      blockStart = -1;
      blockLen = 0;
    } else {
      blockStart = -1;
      blockLen = 0;
    }
  }
  if (blockLen >= 15) {
    console.log(`${path.relative(srcDir, file).replace(/\\/g, '/')}: lines ~${blockStart}-${blockStart + blockLen - 1} (${blockLen} lines)`);
  }
}
