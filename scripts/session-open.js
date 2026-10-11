#!/usr/bin/env node
'use strict';
/**
 * session-open.js · the start of a development window, on one card.
 *
 *   npm run open                 the card, and a window started on the hub's run sheet
 *   npm run open -- --baseline   also runs the tests first, so the window is known to start green
 *   npm run open -- --live       also asks the live site and the game relay whether they answer
 *   npm run open -- --brief      the short card, read-only; the SessionStart hook prints this into
 *                                every new Claude session (.claude/settings.json)
 *
 * WHY. David, 2026-10-04: "a startup and closing process for any of our development windows...
 * get notes of review of everything we did last time as well as things that we need to start on
 * this time". Until then a session opened by reading DECISIONS.md and SPRINT.md, which had grown
 * to 140 KB and 120 KB, and two of the worst misses (fixes left in side worktrees, a relay check
 * that passed while the relay slept) were things nobody looked for at the start. This looks.
 *
 * Each thing it checks is also a line on the run sheet (scripts/hub/run.js), so the hub shows
 * that the open ran and what it found. The other end is scripts/session-close.js. The process
 * the two sit inside is docs/HU-ADMIN-HUB-PLAN-2026-10-04.md.
 */
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawnSync } = require('child_process');
const devlog = require('./hub/devlog');
const run = require('./hub/run');
const board = require('./hub/board');
const { ROOT, git, readJson, daysAgo, ago, sideTrees } = require('./lib/session');

const args = process.argv.slice(2);
const BRIEF = args.includes('--brief');
const LIVE = args.includes('--live');
const BASELINE = args.includes('--baseline');

/** @type {import('./hub/run').Check[]} */
const steps = [];
/** @param {string} id @param {string} label @param {boolean|null} ok @param {string} summary */
const step = (id, label, ok, summary) => { steps.push({ id, label, ok, summary }); };

/** @param {number} port */
function listening(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: '127.0.0.1' });
    const done = (/** @type {boolean} */ v) => { s.destroy(); resolve(v); };
    s.setTimeout(400, () => done(false));
    s.on('connect', () => done(true));
    s.on('error', () => done(false));
  });
}

/** @param {string} url */
async function answers(url) {
  try {
    const r = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
    return String(r.status);
  } catch (e) {
    return 'no answer (' + (/** @type {any} */ (e).cause?.code || /** @type {any} */ (e).name || 'error') + ')';
  }
}

/** @param {string} title */
function head(title) { console.log('\n' + title.toUpperCase()); }
const plain = (/** @type {string} */ s) => s.replace(/\*\*/g, '');

async function main() {
  const notes = devlog.sessions();
  const last = notes[0];

  console.log(BRIEF ? 'OPEN · the start of this window (npm run open -- --brief)' : 'OPEN · the start of a development window');

  // ── where we left off ──
  head('Where we left off');
  if (last) {
    console.log(`  Last close note: ${last.date}, "${last.title}" (${last.file})`);
    if (last.left.length) { console.log('  Left half done:'); last.left.forEach((x) => console.log('    - ' + x)); }
    if (last.next.length) { console.log('  Next:'); last.next.forEach((x) => console.log('    - ' + x)); }
    if (last.waiting.length) { console.log('  Waiting on David:'); last.waiting.forEach((x) => console.log('    - ' + x)); }
    step('note', 'Read the last close note', true, `${last.id}: ${last.title}`);
  } else {
    console.log('  No close note yet in docs/sessions/. Fall back on SPRINT.md and DECISIONS.md.');
    step('note', 'Read the last close note', null, 'None written yet.');
  }

  // ── the board ──
  head('The board (SPRINT.md)');
  let boardOk = true;
  try {
    const b = board.load();
    const bad = board.problems(b);
    if (!board.inStep(b)) bad.push('SPRINT.md is out of step with the board: npm run board');
    boardOk = !bad.length;
    const focus = b.cards.filter((c) => c.lane === 'focus');
    for (const c of focus) {
      const nextStep = (c.steps || []).find((s) => s.status === 'doing') || (c.steps || []).find((s) => s.status === 'next');
      console.log(`  Focus: ${c.title} · stage ${c.stage}.${nextStep ? ` Step ${nextStep.n} (${nextStep.who}): ${plain(nextStep.text).slice(0, 110)}` : ''}`);
    }
    if (!focus.length) console.log('  Nothing is in focus.');
    const upNext = b.cards.filter((c) => c.lane === 'next').map((c) => c.title + (c.role ? ' (' + c.role + ')' : ''));
    if (upNext.length) console.log('  Up next: ' + upNext.join(', ') + '.');
    const wait = board.waiting(b);
    console.log(`  Waiting on David: ${wait.length ? wait.map((w) => w.n).join(', ') + ' (step numbers)' : 'nothing'}. Inbox: ${b.cards.filter((c) => c.lane === 'inbox').length}.`);
    bad.forEach((p) => console.log('  PROBLEM: ' + p));
    step('board', 'Read the board', boardOk, focus.length ? focus.map((c) => `${c.title} is at ${c.stage}`).join('; ') + `. ${wait.length} waiting on David.` : 'Nothing is in focus.');
  } catch (e) {
    boardOk = false;
    console.log('  The board could not be read: ' + String(e && /** @type {Error} */ (e).message || e));
    step('board', 'Read the board', false, 'data-build/board.json could not be read.');
  }

  // ── git ──
  head('The repo');
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const sb = git(['status', '-sb']).split('\n')[0] || '';
  const ahead = (sb.match(/ahead (\d+)/) || [])[1];
  const behind = (sb.match(/behind (\d+)/) || [])[1];
  const lastCommit = git(['log', '-1', '--date=short', '--format=%ad %h %s']);
  const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean);
  console.log(`  ${branch}, last commit ${lastCommit}${ahead ? `, ${ahead} commit(s) saved and not pushed` : ''}${behind ? `, ${behind} behind origin` : ''}`);
  console.log(`  ${dirty.length ? dirty.length + ' file(s) changed and not committed' : 'Nothing uncommitted.'}`);
  if (dirty.length && !BRIEF) dirty.slice(0, 10).forEach((l) => console.log('    ' + l));
  if (dirty.length > 10 && !BRIEF) console.log(`    ... and ${dirty.length - 10} more`);
  step('repo', 'Check the repo', branch === 'main', `${branch}. ${dirty.length} file(s) not committed${ahead ? ', ' + ahead + ' commit(s) not pushed' : ''}.`);
  const trees = sideTrees();
  for (const t of trees) {
    console.log(`  Side worktree ${t.name}: ${t.dirty} uncommitted file(s), ${t.ahead} commit(s) not on ${branch}.${t.dirty || t.ahead ? ' THAT WORK IS NOT ON MAIN until it is brought back.' : ' Empty; safe to remove.'}`);
  }
  const holding = trees.filter((t) => t.dirty || t.ahead);
  step('stranded', 'Look for work stranded off main', !holding.length, holding.length ? holding.map((t) => t.name).join(', ') + ' hold work that is not on main.' : trees.length ? trees.length + ' side worktree(s), all empty.' : 'No side worktrees.');

  // ── design phases ──
  head('Design phases (CLAUDE.md)');
  for (const p of devlog.phases()) console.log(`  ${p.state === 'open' ? 'OPEN  ' : 'parked'} ${p.name}${p.since ? ', since ' + p.since : ''}`);

  if (BRIEF) {
    console.log('\nThe full card starts the window on the run sheet: npm run open. The hub: npm run hub, then /__hub.');
    return;
  }

  // ── the site ──
  head('The site');
  const ledger = readJson('tmp/ledger/ledger.json');
  let ledgerLine = 'No page ledger on this computer yet: npm run ledger (after a build).';
  if (ledger && ledger.rows) {
    const rows = ledger.rows;
    const n2 = rows.filter((/** @type {any} */ r) => r.phase === 2).length;
    ledgerLine = `Page ledger ${ago(daysAgo(ledger.at))}: ${rows.length} pages, ${n2} at Phase 2, ${rows.length - n2} held back.`;
  }
  console.log('  ' + ledgerLine);
  const locks = Object.keys(readJson('data-build/page-locks.json') || {}).filter((k) => /^\/(?!\/)/.test(k));   // '//' is the file's comment
  console.log(`  Locked pages: ${locks.length}${locks.length ? ' (defect and small standard fixes only, DECISIONS O1): ' + locks.join(' ') : ''}.`);
  const phone = readJson('tmp/ledger/phone.json') || {};
  const sweeps = Object.values(phone).map((/** @type {any} */ v) => v && v.at).filter(Boolean).sort();
  console.log(`  Phone sweep: ${Object.keys(phone).length} pages on record, most recent ${ago(sweeps.length ? daysAgo(sweeps[sweeps.length - 1]) : null)}, oldest ${ago(sweeps.length ? daysAgo(sweeps[0]) : null)}.`);
  const linkDir = path.join(ROOT, 'tmp', 'link-check');
  const linkRuns = fs.existsSync(linkDir) ? fs.readdirSync(linkDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort() : [];
  const linkAge = linkRuns.length ? daysAgo(linkRuns[linkRuns.length - 1].slice(0, 10)) : null;
  const linksDue = linkAge == null || linkAge > 30;
  console.log(`  Link check: ${ago(linkAge)}${linksDue ? '. DUE (it runs monthly: npm run links)' : ''}.`);
  step('site', 'Check the site records', true, `${ledgerLine} ${locks.length} locked.${linksDue ? ' The monthly link check is due.' : ''}`);

  // ── baseline ──
  if (BASELINE) {
    head('Baseline');
    const r = spawnSync('npm run verify', { cwd: ROOT, shell: true, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    const out = (r.stdout || '') + (r.stderr || '');
    const pass = (out.match(/^(?:#|ℹ) pass (\d+)/m) || [])[1];
    const fail = (out.match(/^(?:#|ℹ) fail (\d+)/m) || [])[1];
    const ok = r.status === 0;
    console.log(`  npm run verify: ${ok ? (pass || '') + ' tests green' : 'FAILED' + (fail ? ', ' + fail + ' test(s) failing' : '')}. ${ok ? 'The window starts green.' : 'Something was already broken before this window touched anything.'}`);
    step('baseline', 'Run the tests before touching anything', ok, ok ? `${pass || 'All'} tests green: the window starts clean.` : `Already failing${fail ? ': ' + fail + ' test(s)' : ''}.`);
  }

  // ── live ──
  if (LIVE) {
    head('Live');
    const site = await answers('https://healthcareuncharted.com/');
    console.log(`  healthcareuncharted.com: ${site}`);
    const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
    const relayHost = (toml.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];
    let relay = '';
    if (relayHost) {
      relay = await answers(`https://${relayHost}.supabase.co/rest/v1/`);
      console.log(`  Game relay (${relayHost}.supabase.co): ${relay}  (401 means it is up and wants a key; no answer means paused)`);
    }
    step('live', 'Ask the live site and the game relay', site === '200' && !/no answer/.test(relay), `The site answered ${site}${relay ? '; the relay answered ' + relay : ''}.`);
  } else {
    console.log('\n  (add --live to ask the live site and the game relay, --baseline to run the tests first)');
  }

  // ── screens ──
  head('Screens');
  const hubInfo = readJson('tmp/hub/server.json');
  const hubUp = hubInfo && hubInfo.port ? await listening(hubInfo.port) : false;
  const devUp = await listening(8080);
  const writingUp = await listening(8084);
  console.log(`  The hub          ${hubUp ? 'running  http://localhost:' + hubInfo.port + '/__hub' : 'stopped  npm run hub'}`);
  console.log(`  Dev server       ${devUp ? 'running  http://localhost:8080/' : 'stopped  npm start'}`);
  console.log(`  Writing screen   ${writingUp ? 'running  http://localhost:8084/__writing' : 'stopped  npm run writing'}`);
  step('screens', 'Bring the screens up', hubUp ? true : null, hubUp ? `The hub is up on port ${hubInfo.port}.${devUp ? ' The dev server is up.' : ''}` : 'The hub was not running when the window opened.');

  const w = run.openWindow(steps);
  console.log(`\nWindow ${w.id} is on the run sheet${hubUp ? ': http://localhost:' + hubInfo.port + '/__hub/run' : ' (start the hub to see it)'}. Its close note will be docs/sessions/${w.id}.md.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
