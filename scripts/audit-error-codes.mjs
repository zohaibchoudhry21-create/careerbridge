#!/usr/bin/env node
/**
 * Manual maintenance helper — scan ERROR_CODES usage.
 * Usage: node scripts/audit-error-codes.mjs
 * Not wired into CI (dynamic references can false-positive).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ERROR_CODES, ERROR_MESSAGES } from '../backend/src/constants/apiErrorCodes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scanRoots = [
  path.join(root, 'backend/src'),
  path.join(root, 'frontend/src'),
];

const flattenCodes = (obj, prefix = '') => {
  const out = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      out.push(...flattenCodes(value, prefix ? `${prefix}.${key}` : key));
    } else if (typeof value === 'string') {
      out.push({ path: prefix ? `${prefix}.${key}` : key, code: value });
    }
  }
  return out;
};

const walk = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, files);
    } else if (/\.(js|jsx|ts|tsx|json|mjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

const corpus = scanRoots
  .flatMap((dir) => walk(dir))
  .filter((file) => !file.endsWith(`${path.sep}apiErrorCodes.js`))
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');

const codes = flattenCodes(ERROR_CODES);
const unused = [];
const used = [];

for (const { path: p, code } of codes) {
  const count = corpus.split(code).length - 1;
  if (count === 0) unused.push({ path: p, code });
  else used.push({ path: p, code, count });
}

const messageToCodes = new Map();
for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
  const list = messageToCodes.get(message) || [];
  list.push(code);
  messageToCodes.set(message, list);
}
const duplicateMessages = [...messageToCodes.entries()].filter(([, list]) => list.length > 1);

console.log('=== ERROR_CODES audit ===');
console.log(`Total codes: ${codes.length}`);
console.log(`Referenced (outside apiErrorCodes.js): ${used.length}`);
console.log(`Zero references: ${unused.length}`);
console.log('');

if (unused.length) {
  console.log('--- Candidates for removal (review manually) ---');
  for (const row of unused) {
    console.log(`  ${row.code}  (${row.path})`);
  }
  console.log('');
}

if (duplicateMessages.length) {
  console.log('--- Duplicate ERROR_MESSAGES text ---');
  for (const [message, list] of duplicateMessages) {
    console.log(`  "${message}"`);
    for (const code of list) console.log(`    - ${code}`);
  }
} else {
  console.log('No duplicate ERROR_MESSAGES strings found.');
}

console.log('\nDone. Do not delete codes blindly — reserved/future codes may be intentional.');
