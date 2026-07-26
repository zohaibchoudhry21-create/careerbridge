/**
 * Verifies dark-mode contrast on static HTML snippets mirroring fixed patterns.
 * Run: node scripts/verify-dark-contrast-patterns.mjs
 */
const cases = [
  { name: 'app-heading on dark shell', fg: '#eaf1ff', bg: '#0b1220', min: 4.5 },
  { name: 'app-muted on dark shell', fg: '#94a3b8', bg: '#0b1220', min: 3 },
  { name: 'app-surface-card text on dark card', fg: '#eaf1ff', bg: '#1a2332', min: 4.5 },
  { name: 'text-on-surface on dark shell (broken)', fg: '#0b1c30', bg: '#0b1220', min: 4.5, expectFail: true },
  { name: 'SessionMetaChip on dark shell', fg: '#94a3b8', bg: '#0b1220', min: 3 },
];

function lum({ r, g, b }) {
  const s = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

function parse(hex) {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function contrast(fgHex, bgHex) {
  const l1 = lum(parse(fgHex));
  const l2 = lum(parse(bgHex));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

let failed = 0;
for (const c of cases) {
  const ratio = contrast(c.fg, c.bg);
  const ok = c.expectFail ? ratio < c.min : ratio >= c.min;
  const status = ok ? 'PASS' : 'FAIL';
  if (!ok) failed += 1;
  console.log(`${status} ${c.name}: ${ratio.toFixed(2)}:1`);
}

process.exit(failed ? 1 : 0);
