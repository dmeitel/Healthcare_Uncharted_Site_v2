#!/usr/bin/env node
'use strict';
/**
 * phone-batches.js · the whole-site viewport sweep in parallel batches, for `npm run qa`.
 *
 *   node scripts/phone-batches.js /a/ /b/ ...          three batches side by side (PHONE_BATCHES sets how many)
 *
 * WHY (2026-10-12). The sweep reads every page at nine viewports, and since 2026-10-11 in BOTH themes, which doubled it:
 * 19 of 60 pages took 32 minutes, so the gate's 60-minute limit would have killed it two thirds through and reported a
 * failure the sweep never found (the same thing that raised the limit from 30 in September). Each phone-check run opens
 * its own browser and serves _site on its own free port, so batches cannot collide; each writes its pages into
 * tmp/ledger/phone.json when it finishes. The output is the batches' output in page order, so qa.js reads it unchanged.
 */
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pages = process.argv.slice(2).filter((a) => a.startsWith('/'));
const N = Math.max(1, Math.min(pages.length, Number(process.env.PHONE_BATCHES) || 3));

// deal the pages round-robin so the slow ones (the maps, the games) spread across batches
const batches = Array.from({ length: N }, () => []);
pages.forEach((p, i) => batches[i % N].push(p));

const runOne = (list) => new Promise((resolve) => {
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts', 'phone-check.js'), ...list], { cwd: ROOT });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  child.on('close', (code) => resolve({ code, out }));
});

(async () => {
  const t0 = Date.now();
  const results = await Promise.all(batches.map(runOne));
  // the per-page blocks, put back in the order the pages were asked for
  const blocks = new Map();
  for (const r of results) {
    for (const part of r.out.split(/\n(?=== )/)) {
      const m = part.match(/^== (\S+)/m);
      if (m) blocks.set(m[1], part.replace(/\n(CLEAN|FAILED):[\s\S]*$/, '').trimEnd());
    }
  }
  for (const p of pages) console.log(blocks.has(p) ? blocks.get(p) : '== ' + p + '\n  (no result: the batch that held it stopped early)');
  const failed = results.some((r) => r.code !== 0) || pages.some((p) => !blocks.has(p));
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log('\n' + (failed ? 'FAILED: see the pages above.' : 'CLEAN: no console errors, no overflow, no text under the type floor, chrome inside budget.') +
    ' ' + pages.length + ' pages in ' + N + ' batches, ' + mins + ' min. Screenshots in tmp/phone/');
  if (failed) for (const r of results.filter((x) => x.code !== 0)) console.log(r.out.split('\n').slice(-3).join('\n'));
  process.exit(failed ? 1 : 0);
})();
