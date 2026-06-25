#!/usr/bin/env node
'use strict';
/**
 * pull/all.js — run every source fetcher in this folder, in turn. One command to
 * refresh the whole data layer. This is what a scheduled job (or you) runs.
 *
 * It auto-discovers every *.js in scripts/pull/ except itself, so adding a new
 * source is still just "drop in one fetcher" — the orchestrator picks it up.
 *
 * Flags pass straight through to each fetcher:
 *   node scripts/pull/all.js            dry run everything (no files touched)
 *   node scripts/pull/all.js --write    apply everything, then remember to: npm run build
 *   node scripts/pull/all.js --refresh  re-pull all sources, ignoring caches
 *
 * Each fetcher is safe-by-default (dry run) and validates before writing, so a
 * scheduled DRY run is a zero-risk "is there new data?" check: if a fetcher
 * reports states changed, a fresh release landed and it is time to --write.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DIR = __dirname;
const flags = process.argv.slice(2);
const fetchers = fs.readdirSync(DIR)
  .filter((f) => f.endsWith('.js') && f !== 'all.js')
  .sort();

console.log(`pull/all — ${fetchers.length} source fetcher(s): ${fetchers.map((f) => f.replace('.js', '')).join(', ')}`);
console.log(`flags: ${flags.length ? flags.join(' ') : '(dry run)'}\n`);

const results = [];
for (const f of fetchers) {
  console.log('────────────────────────────────────────────────────────');
  console.log(`▶ ${f}`);
  console.log('────────────────────────────────────────────────────────');
  const r = spawnSync(process.execPath, [path.join(DIR, f), ...flags], { stdio: 'inherit' });
  results.push({ f, code: r.status == null ? 1 : r.status });
  console.log('');
}

console.log('========================================================');
console.log('pull/all summary:');
let bad = 0;
for (const { f, code } of results) {
  console.log(`  ${code === 0 ? 'OK  ' : 'FAIL'}  ${f}` + (code === 0 ? '' : ` (exit ${code})`));
  if (code !== 0) bad++;
}
if (flags.includes('--write')) console.log('\nApplied. Next: npm run build  (regenerate the graph + site).');
else console.log('\nDry run. Re-run with --write to apply anything that changed.');
if (bad) { console.log(`\n${bad} fetcher(s) failed — investigate before scheduling unattended.`); process.exitCode = 1; }
