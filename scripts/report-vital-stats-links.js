#!/usr/bin/env node
'use strict';
// report-vital-stats-links.js · where each Vital Stats number lives on the site, and where it does not yet.
//
//   node scripts/report-vital-stats-links.js     rewrites docs/HU-VITAL-STATS-LINKS.md (one living file; the date is inside)
//
// Both question builders run in memory (nothing they write is touched) and hand back how each question's link
// was judged: EXACT when the view shows the question's own number, NEAR when it shows what the question is about
// but not that number, NONE when no page has it. The NEAR and NONE groups are the work list for step 2 of the
// plan David approved 2026-10-02: put the game's numbers on the tools, biggest group first.

const fs = require('fs');
const path = require('path');
const main = require('./build-vital-stats');
const systems = require('./build-vital-stats-systems');

const ROOT = path.join(__dirname, '..');
const day = new Date().toISOString().slice(0, 10);
const OUT = path.join(ROOT, 'docs', 'HU-VITAL-STATS-LINKS.md');
const n = (/** @type {number} */ v) => v.toLocaleString('en-US');

const bank = JSON.parse(main.build()).questions;
systems.build();
/** @type {Record<string, any>} */
const byId = Object.fromEntries(bank.map((/** @type {any} */ q) => [q.id, q]));
const L = main.LINKS, S = systems.SYS_LINKS;

const mainRows = Object.entries(L);
const mExact = mainRows.filter(([, v]) => v.exact).length;
const mNone = mainRows.filter(([id]) => !byId[id].see).length;
const mNear = mainRows.length - mExact - mNone;
const sRows = Object.values(S);
const sTotal = sRows.reduce((a, r) => a + r.n, 0);
const sExact = sRows.filter((r) => r.exact).reduce((a, r) => a + r.n, 0);

/** @type {Map<string, string[]>} gap -> ids */
const gaps = new Map();
for (const [id, v] of mainRows) if (!v.exact) { const g = gaps.get(v.gap) || []; g.push(id); gaps.set(v.gap, g); }
const tool = (/** @type {string} */ see) => ({ plm: 'U.S. Population Health Map', ops: 'U.S. Hospital Operations Map', ct: 'Healthcare Career Tree' })[see.split('|')[0]] || '';

const lines = [
  '# Vital Stats: where each number lives on the site',
  '',
  `Written ${day} by \`node scripts/report-vital-stats-links.js\`. Re-run it after any change to the question builders or the tools.`,
  '',
  'Every answer screen in the game now links to the view of a site tool that shows the number, or the thing the question',
  'is about. EXACT means the view shows the question\'s own number. NEAR means it opens on the right state, job, system or',
  'hospital but the number itself is not on the page yet. NONE means nothing on the site has it. The NEAR and NONE groups',
  'below are the work list for step 2, biggest first.',
  '',
  '| Questions | Exact | Near | None |',
  '|---|---|---|---|',
  `| Everyday and state games (${n(mainRows.length)}) | ${n(mExact)} | ${n(mNear)} | ${n(mNone)} |`,
  `| Health system games (${n(sTotal)}) | ${n(sExact)} | ${n(sTotal - sExact)} | 0 |`,
  '',
  '## Everyday and state games: what is not exact yet',
  ''
];
for (const [gap, ids] of [...gaps.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const ex = ids.slice(0, 3).map((id) => byId[id]);
  lines.push(`### ${n(ids.length)} question${ids.length === 1 ? '' : 's'}: ${gap}`, '');
  for (const q of ex) lines.push(`- ${q.q}` + (q.see ? ` (opens ${q.see.split('|')[2]} on the ${tool(q.see)})` : ''));
  if (ids.length > 3) lines.push(`- and ${n(ids.length - 3)} more`);
  lines.push('');
}
lines.push('## Health system games: by question type', '', '| Type | Questions | On the map? | What is missing |', '|---|---|---|---|');
for (const [k, r] of Object.entries(S).sort((a, b) => b[1].n - a[1].n)) lines.push(`| ${k.replace(/^sy-/, '')} | ${n(r.n)} | ${r.exact ? 'exact' : 'near'} | ${r.gap || ''} |`);
lines.push('');
fs.writeFileSync(OUT, lines.join('\n'));
console.log(`vital-stats links: ${n(mExact)} exact, ${n(mNear)} near, ${n(mNone)} none of ${n(mainRows.length)}; systems ${n(sExact)} exact of ${n(sTotal)} -> ${path.relative(ROOT, OUT)}`);
