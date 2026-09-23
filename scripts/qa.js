#!/usr/bin/env node
'use strict';
/**
 * qa.js — ONE command for the whole gate.
 *
 *   npm run qa                     everything, the pre-commit pass
 *   npm run qa -- /learn/new/      one page, the pass a new page needs
 *   npm run qa -- --fast           skip the build and the viewport sweep
 *
 * WHY THIS EXISTS. By 2026-09-22 the checks were good and scattered: verify, phone, shell-drift,
 * tool-compare, meta-screen, play-check, qa:phone, backend:check. Eight entry points nobody is
 * going to remember, which in practice means the ones that get run are the ones someone happens
 * to think of. A gate that depends on remembering is not a gate.
 *
 * THE THREE TIERS, by WHO DECIDES. This is the whole design:
 *
 *   TIER 1  MACHINE DECIDES.  Questions with a right answer: does it build, do the types hold,
 *           do the tests pass, does anything overflow, is any text under the floor. FAILS.
 *   TIER 2  MACHINE MEASURES, NUMBER ONLY GOES DOWN.  Consistency. There is no right answer,
 *           only a direction. Each is a ratchet: it may improve, never regress. FAILS on a rise.
 *   TIER 3  DAVID DECIDES.  Whether it looks good, reads well, feels crowded, makes sense to a
 *           stranger. No script gets a vote. `npm run review` puts it in front of him.
 *
 * The tiers exist because the expensive mistake is not a missing check, it is a check that
 * pretends to answer a question it cannot: a gate saying CLEAN about a page that is ugly, or a
 * session asking David an engineering question he should never have been handed.
 */
const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const FAST = argv.includes('--fast');
const paths = argv.filter((a) => a.startsWith('/'));

const t0 = Date.now();
const results = [];
let failed = false;

const bar = (s) => '\n' + '='.repeat(72) + '\n  ' + s + '\n' + '='.repeat(72);

function run(label, cmd, args, opts = {}) {
  process.stdout.write('  ' + label.padEnd(34) + ' ... ');
  const start = Date.now();
  try {
    const out = execFileSync(cmd, args, {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32',
      timeout: opts.timeout || 900000,
    });
    const secs = ((Date.now() - start) / 1000).toFixed(0);
    console.log('ok   (' + secs + 's)');
    results.push({ label, ok: true, out });
    return out;
  } catch (e) {
    const secs = ((Date.now() - start) / 1000).toFixed(0);
    const out = (e.stdout || '') + (e.stderr || '');
    console.log('FAIL (' + secs + 's)');
    results.push({ label, ok: false, out });
    failed = true;
    return out;
  }
}

/** A ratchet reads one number out of a report and compares it to a recorded ceiling. */
function ratchet(label, out, re, ceiling, unit) {
  const m = out.match(re);
  const n = m ? Number(m[1]) : null;
  if (n === null) {
    console.log('  ' + label.padEnd(34) + ' ?    could not read the number');
    return;
  }
  const dir = n < ceiling ? 'down from ' + ceiling : n > ceiling ? 'UP from ' + ceiling : 'held';
  const bad = n > ceiling;
  if (bad) failed = true;
  console.log('  ' + label.padEnd(34) + (bad ? ' RISE' : ' ok  ') + '  ' + n + ' ' + unit + ', ' + dir);
  return n;
}

console.log(bar('TIER 1 · MACHINE DECIDES' + (paths.length ? '  (' + paths.join(' ') + ')' : '')));

if (!FAST) run('build', 'npm', ['run', 'build']);
run('types', 'npm', ['run', 'check']);
run('tests', 'npm', ['test']);

if (!FAST) {
  let sweepPaths = paths;
  if (!sweepPaths.length) {
    const site = path.join(ROOT, '_site');
    const walk = (d, o = []) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p, o);
        else if (e.name === 'index.html') {
          const h = fs.readFileSync(p, 'utf8');
          if (/<html/i.test(h) && !/http-equiv="refresh"|location\.replace\(/i.test(h)) {
            o.push('/' + path.relative(site, p).split(path.sep).slice(0, -1).join('/') + '/');
          }
        }
      }
      return o;
    };
    sweepPaths = walk(site).map((p) => p.replace('//', '/'));
  }
  const out = run('viewport sweep (' + sweepPaths.length + ' pages x 9)', 'node',
    ['scripts/phone-check.js', ...sweepPaths], { timeout: 3600000 });
  // 60 minutes, raised from 30 on 2026-09-23: the whole-page read of 50 pages at nine viewports
  // outgrew 30 and the gate reported FAIL on a sweep that had found nothing, killed mid-page.
  const fails = [...out.matchAll(/^== (\S+)/gm)].map((m) => m[1]);
  const failing = [];
  let cur = null;
  for (const line of out.split('\n')) {
    const h = line.match(/^== (\S+)/);
    if (h) { cur = h[1]; continue; }
    if (/ FAIL /.test(line) && cur) failing.push(cur);
  }
  const uniq = [...new Set(failing)];
  if (uniq.length) console.log('       failing pages: ' + uniq.join(', '));
}

console.log(bar('TIER 2 · MACHINE MEASURES, THE NUMBER ONLY GOES DOWN'));

const shell = run('reading shell drift', 'node', ['scripts/shell-drift.js']);
ratchet('  shell declarations', shell, /(\d+) declarations in total/, 145, 'left');

const meta = run('titles and descriptions', 'node', ['scripts/meta-screen.js']);
const longCount = (meta.match(/^\s+LONG /gm) || []).length;
const dupes = Number((meta.match(/duplicate descriptions: (\d+)/) || [])[1] || 0)
            + Number((meta.match(/duplicate titles: (\d+)/) || [])[1] || 0);
console.log('  ' + '  over-long descriptions'.padEnd(34) + (longCount > 30 ? ' RISE' : ' ok  ') + '  ' + longCount + ' pages, ceiling 30');
if (longCount > 30) failed = true;
console.log('  ' + '  duplicate title or description'.padEnd(34) + (dupes > 0 ? ' RISE' : ' ok  ') + '  ' + dupes + ', ceiling 0');
if (dupes > 0) failed = true;

console.log(bar('TIER 3 · DAVID DECIDES'));
console.log('  Nothing here is automatable and nothing here failed, because none of it is a');
console.log('  question a script gets a vote on:');
console.log('');
console.log('     does the page look good          does a stranger know what to do');
console.log('     does it read well                does it feel crowded');
console.log('');
console.log('     npm run review    ->  http://localhost:8081/__review');
console.log('     the checklist     ->  docs/HU-REVIEW-QA-2026-09-22.md');

console.log(bar((failed ? 'FAILED' : 'PASSED') + '  in ' + ((Date.now() - t0) / 1000).toFixed(0) + 's'));
if (failed) {
  for (const r of results.filter((x) => !x.ok)) {
    console.log('');
    console.log('--- ' + r.label + ' ---');
    console.log(r.out.split('\n').slice(-25).join('\n'));
  }
}
process.exit(failed ? 1 : 0);
