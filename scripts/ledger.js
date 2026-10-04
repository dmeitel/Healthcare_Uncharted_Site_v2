#!/usr/bin/env node
'use strict';
/**
 * ledger.js · the page ledger: every live page, the checks its kind is held to, and its phase.
 *
 *   npm run ledger                 refresh, print the table, write tmp/ledger/ledger.json
 *   npm run ledger -- --json       the ledger as JSON on stdout
 *   npm run ledger -- --paths      every live page's address, one per line (feeds the phone sweep)
 *
 * WHY. David, 2026-10-03: "a consistency tool that we can use for voice and view and everything
 * else... a single system or toolkit that we can review page by page", and "categorize pages as
 * ones that are maybe in phase one of the website versus phase two" so the older ones get brought
 * up over time. The checks already existed; nothing kept a page's results together or said which
 * standard it was built to. Plan: docs/HU-CONSISTENCY-TOOLKIT-2026-10-03.md.
 *
 * THE PHASE IS COMPUTED, never typed. Phase 2: passes every check for its kind. Phase 1: fails at
 * least one, and the row names which. "?": nothing failed, but something has not been measured
 * yet (the phone sweep, usually). David's "Reviewed" mark is separate and his own, kept in
 * data-build/page-reviews.json. When a new rule lands, a page that fails it drops to Phase 1:
 * a hand-set label would go stale, this cannot.
 *
 * Fast checks run here in seconds. The phone sweep takes minutes per page, so this reads the
 * verdicts scripts/phone-check.js wrote to tmp/ledger/phone.json, with their dates.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const W = require('./lib/writing-rules');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
const SRC = path.join(ROOT, 'src');
const PHONE = path.join(ROOT, 'tmp', 'ledger', 'phone.json');
const REVIEWS = path.join(ROOT, 'data-build', 'page-reviews.json');
const OUT = path.join(ROOT, 'tmp', 'ledger', 'ledger.json');

// Hubs list other pages; they are read like reading pages but are not articles.
const HUBS = new Set(['/', '/tools/', '/learn/', '/rounds/', '/secret-menu/', '/learn/talks/']);
// Internal pages in the secret menu that work like tools but are not public tools.
const INTERNAL_TOOLS = new Set(['/secret-menu/data-observatory/', '/secret-menu/goat-tracker/', '/secret-menu/hospital-price-finder/']);

/** @param {string} dir @returns {string[]} */
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const rel = (/** @type {string} */ f) => path.relative(ROOT, f).split(path.sep).join('/');

/** Every address a source template produces today, mapped to its file. A built page with no
 *  source is a leftover from a rename (the build folder never deletes), and is not counted.
 *  @returns {Map<string,string>} */
function liveUrls() {
  const map = new Map();
  for (const f of walk(SRC)) {
    const r = path.relative(SRC, f).split(path.sep).join('/');
    if (/^(?:_includes|_data|assets|brand)\//.test(r) || !/\.(?:html|njk|md)$/.test(r)) continue;
    const head = fs.readFileSync(f, 'utf8').slice(0, 2500);
    const fm = head.startsWith('---') ? head.slice(3, head.indexOf('\n---', 3)) : '';
    const pl = fm.match(/^permalink:\s*["']?([^"'\n]+?)["']?\s*$/m);
    if (pl && /^false$/i.test(pl[1])) continue;
    let url;
    if (pl) url = pl[1].startsWith('/') ? pl[1] : '/' + pl[1];
    else {
      const noExt = r.replace(/\.(?:html|njk|md)$/, '');
      url = noExt === 'index' ? '/' : noExt.endsWith('/index') ? '/' + noExt.slice(0, -5) : '/' + noExt + '/';
    }
    url = url.replace(/index\.html$/, '');
    map.set(url, rel(f));
  }
  return map;
}

/** @param {string} url @param {string} html */
function kindOf(url, html) {
  if (HUBS.has(url)) return 'hub';
  if (/__UG_TEST|gameMenu\(|HUTable\./.test(html) && !/^\/tools\//.test(url)) return 'game';
  if (/^\/(?:tools|atlas)\//.test(url) || INTERNAL_TOOLS.has(url)) return 'tool';
  return 'reading';
}

/** @typedef {{id:string, label:string, state:'pass'|'fail'|'unknown'|'judge'|'na', detail?:string, rule?:string}} Check */

function shellDrift() {
  try { return JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'shell-drift.js'), '--json'], { cwd: ROOT, encoding: 'utf8' })); }
  catch (e) { return {}; }
}

function compute() {
  const live = liveUrls();
  const phone = fs.existsSync(PHONE) ? JSON.parse(fs.readFileSync(PHONE, 'utf8')) : {};
  const reviews = fs.existsSync(REVIEWS) ? JSON.parse(fs.readFileSync(REVIEWS, 'utf8')) : {};
  const drift = shellDrift();
  const rows = [];
  const stale = [];
  for (const f of walk(SITE).filter((x) => x.endsWith(path.sep + 'index.html') || /[\\/](?:404)\.html$/.test(x))) {
    const r = path.relative(SITE, f).split(path.sep).join('/');
    if (/^(?:assets|brand)\//.test(r)) continue;
    const html = fs.readFileSync(f, 'utf8');
    if (/http-equiv=["']refresh["']/i.test(html.slice(0, 1500))) continue;
    // a "moved" notice that forwards by script (the Jevons guide went into Laws & Paradoxes) is not a page
    if (/<title>\s*Moved to\b/i.test(html.slice(0, 1500))) continue;
    const url = r === 'index.html' ? '/' : r.endsWith('/index.html') ? '/' + r.slice(0, -10) : '/' + r;
    const src = live.get(url);
    if (!src) { stale.push(url); continue; }
    const kind = kindOf(url, html);
    const srcText = fs.readFileSync(path.join(ROOT, src), 'utf8');
    /** @type {Check[]} */
    const checks = [];
    const add = (/** @type {Check} */ c) => checks.push(c);

    // EVERY PAGE
    const ph = phone[url];
    if (!ph) add({ id: 'phone', label: 'Phone and desktop sweep', state: 'unknown', detail: 'Not measured yet.', rule: 'CLAUDE.md, ALWAYS TRUE' });
    else {
      const bad = Object.entries(ph.viewports || {}).filter(([, v]) => !v.ok).map(([k, v]) => k + ': ' + v.why.join(', '));
      if (ph.slow && !ph.slow.ok) bad.push('slow data: ' + ph.slow.why.join(', '));
      const n = Object.keys(ph.viewports || {}).length;
      add({ id: 'phone', label: 'Phone and desktop sweep', state: bad.length ? 'fail' : n >= 9 ? 'pass' : 'unknown', detail: (bad.length ? bad.join('; ') : n + ' sizes clean') + ' (' + String(ph.at).slice(0, 10) + ')', rule: 'CLAUDE.md, ALWAYS TRUE' });
    }
    const x = W.htmlToBlocks(html);
    const wr = W.check(x.blocks, { register: W.registerForPath(url, html), guest: x.guest, links: x.links });
    add({ id: 'phi', label: 'No patient information', state: wr.flags.some((g) => g.layer === 'phi' && g.level === 'block') ? 'fail' : 'pass', rule: 'The writing checker' });
    const fixes = wr.flags.filter((g) => g.level === 'warn' || (g.level === 'block' && g.layer !== 'phi'));
    add({ id: 'writing', label: 'Writing: nothing to fix', state: fixes.length ? 'fail' : 'pass', detail: fixes.length ? fixes.length + ': ' + [...new Set(fixes.map((g) => W.RULES[g.rule].name))].join(', ') : 'Clean.', rule: 'The writing checker' });
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
    const desc = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
    const d = W.decode(desc).trim();
    const metaBad = [!title.trim() && 'no title', !d && 'no description', d && d.length > 165 && 'description ' + d.length + ' characters (over 165)', d && d.length < 70 && 'description ' + d.length + ' characters (under 70)', !/<h1[\s>]/i.test(html) && 'no h1'].filter(Boolean);
    add({ id: 'meta', label: 'Title, description and h1', state: metaBad.length ? 'fail' : 'pass', detail: metaBad.join(', ') || 'Description ' + d.length + ' characters.', rule: 'scripts/meta-screen.js, tests/site-build.test.js' });

    // BY KIND
    if (kind === 'reading' || kind === 'hub') {
      const n = drift[src] || 0;
      add({ id: 'shell', label: 'On the shared reading layout', state: n ? 'fail' : 'pass', detail: n ? n + ' page-level style declarations the shared layout already owns' : 'None of its own.', rule: 'tests/reading-shell.test.js' });
      if (wr.register === 'rounds' && wr.piece.length) {
        const miss = wr.piece.filter((p) => p.state === 'miss').map((p) => p.label);
        add({ id: 'rounds', label: 'The Rounds checklist', state: 'judge', detail: miss.length ? 'Missing: ' + miss.join('; ') : 'Every item found; the judgment ones are yours.', rule: 'CLAUDE.md, Rounds-specific' });
      }
    }
    if (kind === 'tool') {
      if (/^\/(?:tools|atlas)\//.test(url)) {
        const strip = srcText.includes('components/tool-attribution.njk');
        const m = srcText.match(/\{%\s*set ta_source\s*=\s*'([^']{12,})'/);
        // CLAUDE.md: data-driven content carries its check date; a year is the least a source line names
        const dated = !!m && /\b20\d\d\b/.test(m[1]);
        add({ id: 'source', label: 'A source line with its date', state: strip && m && dated ? 'pass' : 'fail', detail: !strip || !m ? 'No source line.' : dated ? 'Present and dated.' : 'Present, but names no date.', rule: 'tests/tool-source-lines.test.js; CLAUDE.md, check dates' });
      }
      add({ id: 'toolstd', label: 'The tool standard (Cost of Living\'s ten rules)', state: 'judge', detail: 'Not written down yet: DECISIONS T1.', rule: 'DECISIONS T1' });
    }
    if (kind === 'game') {
      const merged = /class="nav-merged"/.test(html), shared = /<header class="tool-bar game-bar">/.test(html);
      add({ id: 'gamebar', label: 'The game bar', state: merged && shared ? 'pass' : 'fail', detail: merged && shared ? 'The shared game bar, site menu inside Menu.' : !merged ? 'Shows the whole site menu instead of a game bar.' : 'Draws its own bar instead of the shared one.', rule: 'tests/game-shell.test.js; .claude/skills/hu-game-shell' });
      const menus = /gameMenu\(/.test(html) && /howTo\(/.test(html);
      add({ id: 'menus', label: 'The menus contract', state: menus ? 'pass' : 'fail', detail: menus ? 'Built from the kit.' : 'Not on the menu kit.', rule: '.claude/rules/games.md, Menus' });
      const missing = [!/dispatchAct/.test(html) && 'one dispatcher', !/HURng/.test(html) && 'the seeded generator', !/HUSave|hu-save\.js/.test(html) && 'a save string'].filter(Boolean);
      add({ id: 'engine', label: 'The engine contract', state: missing.length ? 'fail' : 'pass', detail: missing.length ? 'Missing: ' + missing.join(', ') : 'One state, one dispatcher, seeded, saves.', rule: '.claude/rules/games.md, The engine' });
      if (/HUTable\./.test(html)) add({ id: 'party', label: 'Multiplayer as easy to set up as Vital Stats', state: url === '/fun/vital-stats/' ? 'pass' : 'judge', detail: url === '/fun/vital-stats/' ? 'The reference.' : 'Your call: try it next to Vital Stats.', rule: 'DECISIONS N2' });
    }

    const fail = checks.filter((c) => c.state === 'fail');
    const unknown = checks.filter((c) => c.state === 'unknown');
    rows.push({
      url, src, kind, title: W.decode(title).replace(/\s*[|·]\s*Healthcare Uncharted\s*$/, '').trim(),
      phase: fail.length ? 1 : unknown.length ? '?' : 2,
      holds: fail.map((c) => c.label), checks, review: reviews[url] || null,
    });
  }
  rows.sort((a, b) => String(a.phase).localeCompare(String(b.phase)) || a.kind.localeCompare(b.kind) || a.url.localeCompare(b.url));
  return { at: new Date().toISOString(), rows, stale };
}

if (require.main === module) {
  const L = compute();
  if (process.argv.includes('--paths')) { for (const r of L.rows) console.log(r.url); process.exit(0); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1));
  if (process.argv.includes('--json')) { console.log(JSON.stringify(L, null, 2)); process.exit(0); }
  const by = {};
  for (const r of L.rows) { const k = r.kind; by[k] = by[k] || { 1: 0, 2: 0, '?': 0 }; by[k][r.phase]++; }
  console.log('');
  for (const r of L.rows) console.log(('Phase ' + r.phase).padEnd(9) + r.kind.padEnd(9) + r.url.padEnd(44) + (r.holds.length ? 'held by: ' + r.holds.join(', ') : r.phase === '?' ? 'not measured yet' : '') + (r.review ? '  [reviewed ' + r.review.date + ']' : ''));
  console.log('\n' + Object.entries(by).map(([k, v]) => k + ': ' + v[2] + ' at phase 2, ' + v[1] + ' at phase 1' + (v['?'] ? ', ' + v['?'] + ' not measured' : '')).join(' · '));
  if (L.stale.length) console.log('Left out, built pages with no source any more (renamed or removed): ' + L.stale.join(', '));
  console.log('Written: ' + path.relative(ROOT, OUT));
}

module.exports = { compute, liveUrls, kindOf };
