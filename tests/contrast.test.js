/**
 * The token ladder's contrast, measured. DESIGN.md states numbers for the deep steps
 * (--teal-ink 5.9:1 on white, --green-dk 5.74 on the page ground, ...) and the Ink State
 * Rule fixes #062024 as the ink on every teal fill. Nothing checked those claims until a
 * near-white label shipped on a teal button in light theme (2026-09-18). This reads the
 * tokens straight out of hu-global.css, resolves var() one hop at a time, and asserts
 * every documented fill-and-ink pair in BOTH themes. Add a row when a new pair ships.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CSS = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'css', 'hu-global.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

/** every declaration block whose selector list is exactly `sel`, merged in source order */
function tokens(sel) {
  const out = {};
  const re = new RegExp('(^|[}\\s])' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'g');
  for (const m of CSS.matchAll(re)) {
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':'); if (i < 0) continue;
      const k = d.slice(0, i).trim(), v = d.slice(i + 1).trim();
      if (k.startsWith('--')) out[k] = v;
    }
  }
  return out;
}
const DARK = tokens(':root');
const LIGHT = { ...DARK, ...tokens('[data-theme="light"]') };

function resolve(map, v, depth = 0) {
  if (depth > 8) throw new Error('var() cycle at ' + v);
  const m = /^var\((--[\w-]+)\s*(?:,\s*([^)]+))?\)$/.exec(v.trim());
  if (!m) return v.trim();
  if (map[m[1]] == null) { if (m[2]) return resolve(map, m[2], depth + 1); throw new Error('unknown token ' + m[1]); }
  return resolve(map, map[m[1]], depth + 1);
}
function rgb(hex) {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  if (!/^[0-9a-f]{6}$/i.test(s)) throw new Error('not a hex color: ' + hex);
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
}
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = hex => { const [r, g, b] = rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const val = (map, t) => (t.startsWith('--') ? resolve(map, 'var(' + t + ')') : t);

/* [theme, ink, ground, floor, where it is used]. 4.5 = AA small text; 3.0 = large text, icons, UI. */
/** @type {Array<[string, string, string, number, string]>} */
const PAIRS = [
  ['dark',  '--t1',       '--dark',      4.5, 'headings on the page ground'],
  ['dark',  '--t2',       '--dark',      4.5, 'body text on the page ground'],
  ['dark',  '--t2',       '--surface',   4.5, 'body text on cards'],
  ['dark',  '--t3',       '--dark',      4.5, 'muted text, mono meta'],
  ['dark',  '--t3',       '--surface',   4.5, 'muted text on cards'],
  ['dark',  '--teal',     '--dark',      4.5, 'teal as text and links'],
  ['dark',  '#FFFFFF',    '--blue',      4.5, '.btn-primary, .nav-pill'],
  ['dark',  '#FFFFFF',    '--blue-deep', 4.5, 'primary hover'],
  ['dark',  '#062024',    '--teal',      4.5, 'the Ink State Rule: chips, icon-btn, v2 button'],
  ['dark',  '#062024',    '--green',     4.5, 'sql-mystery Run button: the same ink on the green fill (white was 3.48)'],
  ['dark',  '--red',      '--surface',   4.5, 'the kit confirm: a danger verb on the dialog card (4.77)'],
  ['light', '--t1',       '--dark',      4.5, 'headings on the light ground'],
  ['light', '--t2',       '--dark',      4.5, 'body text on the light ground'],
  ['light', '--t2',       '--surface',   4.5, 'body text on white cards'],
  ['light', '--t3',       '--dark',      4.5, 'muted text on the light ground'],
  ['light', '--t3',       '--surface',   4.5, 'muted text on white cards'],
  ['light', '--teal-ink', '--dark',      4.5, 'DESIGN.md: 5.15 on the page ground'],
  ['light', '--teal-ink', '--surface',   4.5, 'DESIGN.md: 5.9 on white'],
  ['light', '--teal-ink', '--raised',    4.5, 'DESIGN.md: 4.70 on the raised surface'],
  ['light', '--green-dk', '--dark',      4.5, 'DESIGN.md: 5.74'],
  ['light', '--red-dk',   '--dark',      4.5, 'DESIGN.md: 5.81'],
  ['light', '--amber-dk', '--surface',   4.5, 'amber as text on white'],
  ['light', '--amber-dk', '--dark',      4.5, 'amber as small text on the light page ground (5.09 since 2026-09-23)'],
  ['light', '--amber-dk', '--raised',    4.5, 'amber as text on the raised surface (4.64)'],
  ['light', '--teal-dk',  '--surface',   3.0, 'icons, borders, large text ONLY (3.46 on white)'],
  ['light', '#FFFFFF',    '--blue',      4.5, '.btn-primary on light'],
  ['light', '#062024',    '--teal',      4.5, 'the teal-fill ink on light'],
  ['light', '#062024',    '--green',     4.5, 'sql-mystery Run button on light'],
  // Rounds figures in light theme (rounds.css color map, 2026-09-23)
  ['light', '#062024',    '--teal-dk',   4.5, 'ink inside the teal bar'],
  ['light', '--dgm-ink',  '--raised',   4.5, 'figure labels on raised boxes'],
  ['light', '--t2',       '--raised',   4.5, 'figure body text on raised boxes'],
  ['light', '--t1',       '--raised',   4.5, 'figure headings on raised boxes'],
  ['light', '--dgm-ink',  '--surface',  4.5, 'figure labels on the figure ground'],
  ['light', '--blue',     '--surface',  4.5, 'blue figure text'],
  ['light', '--red-dk',   '--surface',  4.5, 'red figure text'],
];

/* Measured but not gated: pairs the ladder allows only at large sizes, listed so the number
   is visible in the run. */
/** @type {Array<[string, string, string, string]>} */
const WATCH = [];

test('the token ladder clears its documented contrast floors in both themes', () => {
  assert.ok(Object.keys(DARK).length > 20, 'the :root token block parsed');
  assert.ok(LIGHT['--dark'] !== DARK['--dark'], 'the light theme block parsed');
  const failures = [];
  const rows = [];
  for (const [theme, ink, ground, floor, where] of PAIRS) {
    const map = theme === 'light' ? LIGHT : DARK;
    const c = contrast(val(map, ink), val(map, ground));
    rows.push(`${theme.padEnd(5)} ${ink.padEnd(11)} on ${ground.padEnd(11)} ${c.toFixed(2).padStart(6)}  (floor ${floor})  ${where}`);
    if (c < floor) failures.push(`${theme}: ${ink} on ${ground} = ${c.toFixed(2)}, floor ${floor} (${where})`);
  }
  for (const [theme, ink, ground, where] of WATCH) {
    const map = theme === 'light' ? LIGHT : DARK;
    rows.push(`${theme.padEnd(5)} ${ink.padEnd(11)} on ${ground.padEnd(11)} ${contrast(val(map, ink), val(map, ground)).toFixed(2).padStart(6)}  (watch)      ${where}`);
  }
  console.log('\n' + rows.join('\n') + '\n');
  assert.deepEqual(failures, []);
});
