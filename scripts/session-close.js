#!/usr/bin/env node
'use strict';
/**
 * session-close.js · the end of a development window: the final checks on what changed, and
 * what is still missing before David saves it.
 *
 *   npm run close                  verify, the phone sweep and the writing checker on every page
 *                                  the diff touched, the ledger, then the list of what is left
 *   npm run close -- --dry         the plan only: touched pages and what would run; runs nothing
 *   npm run close -- --no-sweep    skip the phone sweep (and say so in the close note)
 *
 * WHY. David, 2026-10-04: "when things close down what are the final QA's what are the final
 * reviews... and then what follow up questions are going to come next time". The checks all
 * existed; what kept going wrong was choosing which to run from memory. This works the touched
 * pages out from git, so nothing that changed goes unchecked and nothing that did not change
 * costs an hour. A change to a file every page loads (SHARED in scripts/lib/session.js) means
 * the whole site is due a sweep, and it says so instead of pretending a few pages cover it.
 *
 * It never commits. It ends with the "Checks" lines for the commit message
 * (docs/HU-COMMIT-MESSAGES.md), a missing close note is listed as unfinished, and every finding
 * is also a line on the hub's run sheet (scripts/hub/run.js). A close is a save point; the push
 * waits for the milestone's Ship (docs/HU-ADMIN-HUB-PLAN-2026-10-04.md, DECISIONS HUB2).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const run = require('./hub/run');
const board = require('./hub/board');
const oldPages = require('./lib/old-pages');
const { ROOT, git, readJson, sideTrees, touchedPages, today } = require('./lib/session');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const NO_SWEEP = args.includes('--no-sweep');
const day = today();

/** What a changed file could leak into the public repo. Reported for a person, never fatal:
 *  the GoatCounter read token and the relay's publishable key are public on purpose. */
const LEAKS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/\b(?:sk_live|rk_live)_[A-Za-z0-9]{10,}/, 'a live payment key'],
  [/\bghp_[A-Za-z0-9]{30,}/, 'a GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS key'],
  [/\bservice_role\b.{0,40}eyJ[A-Za-z0-9_-]{20,}/, 'a Supabase service key'],
];

/** @type {import('./hub/run').Check[]} */
const steps = [];
/** @param {string} id @param {string} label @param {boolean|null} ok @param {string} summary */
const step = (id, label, ok, summary) => { steps.push({ id, label, ok, summary }); };

/** @param {string} title */
function head(title) { console.log('\n' + title.toUpperCase()); }

/** Run an npm script with the output streamed, and keep the tail for the summary.
 *  @param {string[]} a @returns {{ok:boolean, out:string}} */
function npm(a) {
  console.log(`\n$ npm run ${a.join(' ')}`);
  const r = spawnSync('npm run ' + a.join(' '), { cwd: ROOT, shell: true, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.trimEnd().split('\n');
  console.log(lines.slice(-14).map((l) => '  | ' + l).join('\n'));
  return { ok: r.status === 0, out };
}

function main() {
  // ── which pages did this window touch ──
  const { changed, pages: touched, shared } = touchedPages();

  console.log(`CLOSE · ${day}`);
  head('What changed');
  console.log(`  ${changed.length} file(s) changed since the last commit.`);
  console.log(`  Pages touched (${touched.length}): ${touched.join('  ') || 'none'}`);
  // David's locks (DECISIONS O1): a locked page may take defect fixes and the ledger's small
  // standard fixes, nothing new. Not a failure: the note has to say which kind of change it was.
  const locks = readJson('data-build/page-locks.json') || {};
  const lockedHit = touched.filter((u) => locks[u]);
  if (lockedHit.length) {
    console.log(`  LOCKED pages changed (${lockedHit.length}): ${lockedHit.map((u) => u + ' since ' + locks[u].since).join(', ')}.`);
    console.log('  A lock allows defect fixes and small standard fixes only (DECISIONS O1). Say which, in the close note.');
  }
  if (shared.length) console.log(`  Files every page loads (${shared.length}): ${shared.join(', ')}.\n  THE FULL SWEEP IS DUE before the next push (npm run qa); this close sweeps the touched pages plus the home page, /tools/ and /learn/.`);
  const sweep = [...new Set([...touched, ...(shared.length ? ['/', '/tools/', '/learn/'] : [])])];
  step('changed', 'Work out what changed, from git', true, `${changed.length} file(s); ${touched.length} page(s) touched${shared.length ? '; a file every page loads changed, so the full sweep is due before the push' : ''}${lockedHit.length ? '; ' + lockedHit.length + ' LOCKED page(s) changed' : ''}.`);

  // ── the checks ──
  /** @type {string[]} */
  const checks = [];
  let failed = false;
  if (DRY) {
    head('Would run');
    console.log('  npm run verify');
    if (sweep.length && !NO_SWEEP) console.log('  npm run phone -- ' + sweep.join(' '));
    if (touched.length) console.log('  npm run writing:check -- ' + touched.join(' '));
    console.log('  npm run ledger');
  } else {
    const v = npm(['verify']);
    // node --test prints "# pass N" with the tap reporter and "ℹ pass N" with spec
    const pass = (v.out.match(/^(?:#|ℹ) pass (\d+)/m) || [])[1];
    const fail = (v.out.match(/^(?:#|ℹ) fail (\d+)/m) || [])[1];
    checks.push(`npm run verify: ${v.ok ? (pass ? pass + ' tests green' : 'green') : 'FAILED' + (fail ? ', ' + fail + ' test(s) failing' : '')}`);
    step('verify', 'Build, types and every test', v.ok, v.ok ? `${pass || 'All'} tests green.` : `Failed${fail ? ': ' + fail + ' test(s)' : ''}.`);
    failed = failed || !v.ok;

    if (v.ok) {
      if (sweep.length && !NO_SWEEP) {
        const p = npm(['phone', '--', ...sweep]);
        checks.push(`npm run phone: ${p.ok ? 'clean at nine viewports' : 'FAILED'} on ${sweep.length} page(s): ${sweep.join(', ')}`);
        step('phone', 'The phone and desktop sweep', p.ok, `${p.ok ? 'Clean at nine screen sizes' : 'FAILED'} on ${sweep.length} page(s).`);
        failed = failed || !p.ok;
      } else if (NO_SWEEP) {
        checks.push('npm run phone: SKIPPED this window (--no-sweep)');
        step('phone', 'The phone and desktop sweep', null, 'Skipped this window.');
      } else {
        step('phone', 'The phone and desktop sweep', null, 'No page changed, so there was nothing to sweep.');
      }
      if (touched.length) {
        const w = npm(['writing:check', '--', ...touched]);
        checks.push(`writing checker: ${w.ok ? 'no must-fix' : 'MUST-FIX FOUND'} on ${touched.length} page(s)`);
        step('writing', 'The writing checker', w.ok, `${w.ok ? 'No must-fix' : 'A MUST-FIX'} on ${touched.length} page(s).`);
        failed = failed || !w.ok;
      }
      // last, so the phases it computes read this window's sweep, not the one before it
      npm(['ledger']);
    }
  }

  // ── the board ──
  head('The board');
  let boardOk = true;
  try {
    const b = board.load();
    const bad = board.problems(b);
    if (!board.inStep(b)) bad.push('SPRINT.md is out of step with the board: npm run board');
    boardOk = !bad.length;
    bad.forEach((p) => console.log('  PROBLEM: ' + p));
    if (boardOk) console.log('  The board is sound and SPRINT.md matches it.');
    step('board', 'The board and SPRINT.md agree', boardOk, boardOk ? 'One list, in step.' : bad.join('; '));
  } catch (e) {
    boardOk = false;
    console.log('  The board could not be read.');
    step('board', 'The board and SPRINT.md agree', false, 'data-build/board.json could not be read.');
  }
  failed = failed || !boardOk;

  // ── nothing stranded, nothing leaking ──
  head('Nothing stranded');
  const trees = sideTrees();
  if (!trees.length) console.log('  No side worktrees.');
  for (const t of trees) console.log(`  Side worktree ${t.name}: ${t.dirty} uncommitted, ${t.ahead} commit(s) not on main.${t.dirty || t.ahead ? ' BRING IT BACK before calling this done.' : ' Empty.'}`);
  const stash = git(['stash', 'list']).split('\n').filter(Boolean);
  if (stash.length) console.log(`  ${stash.length} stash entr${stash.length === 1 ? 'y' : 'ies'}: work set aside and not in any commit.`);
  const holding = trees.filter((t) => t.dirty || t.ahead);
  step('stranded', 'Nothing stranded off main', !holding.length && !stash.length, holding.length ? holding.map((t) => t.name).join(', ') + ' hold work that is not on main.' : stash.length ? stash.length + ' stash entr' + (stash.length === 1 ? 'y' : 'ies') + ' set aside.' : 'No work sits outside main.');

  // ── old addresses: a page the last push carried and this build drops forwards, or is let go on purpose ──
  head('Old addresses');
  const gone = oldPages.leftPages();
  const lost = gone.left.filter((p) => !p.how);
  if (gone.error) console.log('  Not checked: ' + gone.error + '.');
  else if (!gone.left.length) console.log('  Every page the live site has, this build still makes.');
  for (const p of gone.left) console.log(`  ${p.url.padEnd(44)} ${p.how === 'forward' ? 'forwards (netlify.toml)' : p.how === 'gone' ? 'let go on purpose (data-build/gone-pages.json)' : 'NO FORWARD: after the push this address 404s. Add a redirect in netlify.toml, or list it in data-build/gone-pages.json with why.'}`);
  step('old-addresses', 'Every page that leaves the live site forwards or is let go on purpose', !lost.length, gone.error ? 'Not checked: ' + gone.error + '.' : lost.length ? lost.map((p) => p.url).join(', ') + ' would 404 after the push.' : gone.left.length ? gone.left.length + ' page(s) leave the live site; each forwards or is let go on purpose.' : 'No page leaves the live site.');
  failed = failed || lost.length > 0;

  head('Going into the public repo');
  let flagged = 0;
  for (const { code, file } of changed) {
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
    const size = fs.statSync(abs).size;
    if (size > 5 * 1024 * 1024) { console.log(`  ${file}: ${(size / 1048576).toFixed(1)} MB. Is a file this big meant to be committed?`); flagged++; }
    if (/(?:^|\/)\.env(?:\.|$)|\.pem$|\.key$/.test(file)) { console.log(`  ${file}: looks like a secrets file.`); flagged++; continue; }
    if (size > 2 * 1024 * 1024 || !/\.(?:js|json|md|html|njk|css|toml|txt|yml|yaml|cmd)$/.test(file)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    for (const [re, what] of LEAKS) if (/** @type {RegExp} */ (re).test(text)) { console.log(`  ${file}: contains what looks like ${what}.`); flagged++; }
    if (code === '??' && /^private\//.test(file)) { console.log(`  ${file}: under private/, which should stay out.`); flagged++; }
  }
  if (!flagged) console.log(`  Nothing flagged in ${changed.length} file(s): no keys, no secrets files, nothing over 5 MB.`);
  step('public', 'Nothing in the save that should stay out', !flagged, flagged ? flagged + ' file(s) flagged for a look.' : `${changed.length} file(s) read: no keys, no secrets files, nothing over 5 MB.`);

  // ── the record ──
  head('Write it down');
  const win = run.read().window;
  const dir = path.join(ROOT, 'docs', 'sessions');
  const wanted = win && !win.closed ? win.id : '';
  const have = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith(day)) : [];
  const noteOk = wanted ? fs.existsSync(path.join(dir, wanted + '.md')) : have.length > 0;
  console.log(`  Close note: ${noteOk ? 'docs/sessions/' + (wanted || have[have.length - 1].replace(/\.md$/, '')) + '.md' : 'MISSING. Write docs/sessions/' + (wanted || day) + '.md (shape: docs/sessions/README.md).'}`);
  const recs = ['DECISIONS.md', 'SPRINT.md', 'docs/HU-DESIGN-PHASE-LOG.md', 'CLAUDE.md'];
  for (const r of recs) console.log(`  ${r.padEnd(30)} ${changed.some((c) => c.file === r) ? 'updated since the last commit' : 'not touched (fine if nothing in it changed)'}`);
  step('note', 'The close note is written', noteOk, noteOk ? 'docs/sessions/' + (wanted || day) + '.md' : 'Missing.');

  head('Checks, for the commit message');
  if (checks.length) checks.forEach((c) => console.log('  - ' + c));
  else console.log('  (a dry run checks nothing)');

  if (!DRY) run.closeWindow(steps, { done: !failed && noteOk });
  console.log(failed ? '\nNOT READY: a check failed above.' : DRY ? '\nDry run. Run npm run close to do it.' : noteOk ? '\nREADY for David to save (commit, no push; the push is the milestone\'s Ship).' : '\nREADY for David to save, once the close note is written.');
  process.exit(failed ? 1 : 0);
}

main();
