#!/usr/bin/env node
'use strict';
/**
 * qa.js · a milestone's QA list: what David looks at, what he said, and what came back fixed.
 *
 *   node scripts/hub/qa.js                              print the list for the card in focus
 *   node scripts/hub/qa.js fixed "check:board" "What changed"     a tweak is fixed; the item goes back to him
 *   (add --card <id> for a card other than the first in focus)
 *
 * WHY. David, 2026-10-04: "I really don't want to do QA on anything until we have made major
 * milestones at which point we'll do QA and tweaks which we should build into that process...
 * a real QA, physical QA, not just on the step by step but on the whole work and then the
 * reiterations".
 *
 * THE LIST IS BUILT, NOT REMEMBERED. Two kinds of item: the checks written on the card when its
 * plan was agreed (`qa` in data-build/board.json), and every page the work touched since the last
 * push, read from git. So nothing that changed is left off because nobody thought of it.
 *
 * AN ITEM IS IN ONE OF FOUR STATES. To look at. Good. Needs a tweak (his note is Claude's work
 * list). Back for another look (the tweak is fixed, and only that item returns to him). His marks
 * are kept in data-build/qa/<card>.json, in git, because they are his record of the milestone.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, stamp, touchedPages, git } = require('../lib/session');
const board = require('./board');

const DIR = path.join(ROOT, 'data-build', 'qa');
/* THE PUZZLE SHEET'S MARKS (Headwall's walls on the Puzzles tab) live in a file of their own, not on a board card. They were
   kept under the card that started the sheet, so when that card shipped and left the board every mark failed with "No card
   device-assembly" (David, 2026-10-18). The file keeps that name so his 48 marks carry over; no card is looked up for it. */
const SHEET = 'device-assembly';
const SHOTS = path.join(ROOT, 'tmp', 'hub', 'shots');
const SITE = path.join(ROOT, '_site');

/** A page address or a hub link, as a file name. The query stays in it: a game's setups differ only
 *  there (?wall=day:..., ?wall=shift:...), and each needs its own picture. @param {string} link */
function slug(link) {
  // the origin goes too: a picture of the local copy and a link to the live site are one setup
  return String(link).replace(/^https?:\/\/[^/]+/i, '').replace(/#.*$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'home';
}

/** The sizes a picture is taken at, and how the QA list names them. */
const SIZES = /** @type {const} */ (['phone', 'landscape', 'tablet', 'desktop']);
const SIZE_NAME = { phone: 'phone', landscape: 'sideways', tablet: 'tablet', desktop: 'desktop' };

/** @param {string} cardId @param {string} [dir] */
function readMarks(cardId, dir = DIR) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dir, cardId + '.json'), 'utf8'));
    m.items = m.items || {};
    return m;
  } catch { return { card: cardId, started: '', items: {} }; }
}

/** @param {string} cardId @param {any} marks @param {string} [dir] */
function writeMarks(cardId, marks, dir = DIR) {
  fs.mkdirSync(dir, { recursive: true });
  const items = Object.fromEntries(Object.keys(marks.items).sort().map((k) => [k, marks.items[k]]));
  fs.writeFileSync(path.join(dir, cardId + '.json'), JSON.stringify({ ...marks, items }, null, 2) + '\n');
}

/** The pictures on file for a link: the newest "after", and the "before" (the live site at the
 *  last push), as addresses the hub serves. @param {string} cardId @param {string} link */
function pictures(cardId, link) {
  const name = slug(link);
  const base = path.join(SHOTS, cardId);
  /** @type {{before:Record<string, string>, after:Record<string, string>}} */
  const out = { before: {}, after: {} };
  if (!fs.existsSync(base)) return out;
  const web = (/** @type {string} */ dir, /** @type {string} */ f) => '/__hub/shots/' + [cardId, dir, f].map(encodeURIComponent).join('/');
  const steps = fs.readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  for (const dir of steps) {
    for (const size of SIZES) {
      const f = `${name}-${size}.png`;
      if (!fs.existsSync(path.join(base, dir, f))) continue;
      if (dir === 'before') out.before[size] = web(dir, f);
      else { out.after[size] = web(dir, f); out.after.step = dir; }
    }
  }
  return out;
}

/** @param {string} url */
function pageTitle(url) {
  try {
    const html = fs.readFileSync(path.join(SITE, url, 'index.html'), 'utf8').slice(0, 4000);
    const t = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || url;
    // the title is the built page's raw HTML, so the separator is an entity there ("&middot;")
    const plain = t.replace(/&middot;|&#183;|&#xb7;/gi, '·').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
    return plain.replace(/\s*[·|]\s*Healthcare Uncharted\s*$/, '').trim() || url;
  } catch { return url; }
}

/** Every page mark made since the last push, on any card's list, the newest per page. A page is one
 *  page whichever milestone touched it, so a look on one list counts on every list the push carries
 *  (2026-10-10: the maps, the view switch and the hub each listed the same 14 pages).
 *  @param {string} [dir] @param {string} [since] a stamp; older marks belong to an earlier push */
function pageMarks(dir = DIR, since = '') {
  /** @type {Record<string, any>} */
  const out = {};
  let files = /** @type {string[]} */ ([]);
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { /* none yet */ }
  for (const f of files) {
    for (const [id, m] of Object.entries(readMarks(f.slice(0, -5), dir).items)) {
      if (!id.startsWith('page:') || !m || !m.at || m.at < since) continue;
      if (!out[id] || m.at > out[id].at) out[id] = m;
    }
  }
  return out;
}

/** The list for a card: its written checks, then the pages touched since the last push.
 *  @param {import('./board').Card} card
 *  @param {{dir?:string, pages?:string[], when?:Record<string, number>, pushed?:string}} [opt] */
function items(card, opt = {}) {
  const marks = readMarks(card.id, opt.dir);
  const since = git(['rev-parse', '--verify', '--quiet', 'origin/main']) ? 'origin/main' : undefined;
  // a playtest (qaPages: false) is its written setups only, not the pages a diff touched
  const touched = opt.pages || card.qaPages === false ? null : touchedPages(since);
  const pages = opt.pages || (touched ? touched.pages : []);
  const when = opt.when || (touched ? touched.when : {});
  const pushed = opt.pushed != null ? opt.pushed : since ? stamp(new Date(git(['log', '-1', '--format=%cI', since]))) : '';
  const shared = pages.length ? pageMarks(opt.dir, pushed) : {};
  const list = [];
  for (const c of card.qa || []) list.push({ id: 'check:' + c.id, kind: 'check', text: c.text, link: c.link || '', group: c.group || '', how: c.try || '', look: c.look || '' });
  for (const url of pages) list.push({ id: 'page:' + url, kind: 'page', text: pageTitle(url), link: url, group: '', how: '', look: '' });
  return list.map((it) => {
    let m = marks.items[it.id] || {};
    if (it.kind === 'page' && shared[it.id] && !(m.at >= shared[it.id].at)) m = shared[it.id];
    let state = m.mark === 'good' ? 'good' : m.mark === 'tweak' ? 'tweak' : m.mark === 'recheck' ? 'recheck' : 'todo';
    // a page that changed after its Good has not been looked at as it ships
    const changed = it.kind === 'page' && when[it.link] ? stamp(new Date(when[it.link])) : '';
    const stale = state === 'good' && !!changed && m.at < changed;
    if (stale) state = 'todo';
    return { ...it, state, stale, note: m.note || '', fix: m.fix || '', at: m.at || '', rounds: (m.history || []).filter((/** @type {any} */ h) => h.mark === 'tweak').length + (m.mark === 'tweak' ? 1 : 0), pictures: it.link ? pictures(card.id, it.link) : { before: {}, after: {} } };
  });
}

/** @param {{state:string}[]} list */
function counts(list) {
  const n = (/** @type {string} */ s) => list.filter((i) => i.state === s).length;
  return { total: list.length, todo: n('todo'), good: n('good'), tweak: n('tweak'), recheck: n('recheck'), clear: list.length > 0 && n('good') === list.length };
}

/** David's mark on an item. A tweak needs its note: the note is the work. A Good can carry one too, as a remark that asks
 *  for nothing (2026-10-18: "it looks fine, its not complex but thats ok" had nowhere to go but Needs a tweak).
 *  @param {string} cardId @param {string} itemId @param {string} mark @param {string} [note] @param {string} [dir] */
function mark(cardId, itemId, mark, note = '', dir = DIR) {
  if (mark !== 'good' && mark !== 'tweak') throw new Error('A mark is good or tweak.');
  if (typeof itemId !== 'string' || !/^(?:check|page|wall):/.test(itemId) || itemId.length > 300) throw new Error('No such item.');   /* wall: a puzzle on the Puzzles sheet */
  note = String(note || '').replace(/\r\n/g, '\n').trim().slice(0, 2000);
  if (mark === 'tweak' && !note) throw new Error('Say what to change, so there is something to fix.');
  const marks = readMarks(cardId, dir);
  if (!marks.started) marks.started = stamp();
  const prev = marks.items[itemId];
  const history = prev ? [...(prev.history || []), { mark: prev.mark, note: prev.note || '', fix: prev.fix || '', at: prev.at || '' }] : [];
  marks.items[itemId] = { mark, note, at: stamp(), history };
  writeMarks(cardId, marks, dir);
  return marks.items[itemId];
}

/** Claude's side: a tweak is fixed, and the item goes back to David with what changed.
 *  @param {string} cardId @param {string} itemId @param {string} what @param {string} [dir] */
function fixed(cardId, itemId, what, dir = DIR) {
  const marks = readMarks(cardId, dir);
  const prev = marks.items[itemId];
  if (!prev || prev.mark !== 'tweak') throw new Error(itemId + ' has no open tweak.');
  what = String(what || '').trim().slice(0, 2000);
  if (!what) throw new Error('Say what changed, so he knows what to look at.');
  marks.items[itemId] = { mark: 'recheck', note: prev.note, fix: what, at: stamp(), history: [...(prev.history || []), { mark: 'tweak', note: prev.note, fix: '', at: prev.at }] };
  writeMarks(cardId, marks, dir);
  return marks.items[itemId];
}

/** With two cards in focus, the one whose list needs David now: anything to look at, with Claude
 *  or back for another look, before a list that is clear. @param {import('./board').Board} b */
function defaultCard(b) {
  const focus = b.cards.filter((x) => x.lane === 'focus');
  const open = focus.find((x) => {
    if (!(x.qa && x.qa.length) && x.qaPages === false) return false;
    const c = counts(items(x));
    return c.todo + c.tweak + c.recheck > 0;
  });
  return open || focus[0] || null;
}

/** The card a QA list belongs to: the one named, or the one in focus that needs David now. @param {string} [id] */
function cardFor(id) {
  const b = board.load();
  const c = id ? b.cards.find((x) => x.id === id) : defaultCard(b);
  if (!c) throw new Error(id ? 'No card ' + id : 'Nothing is in focus.');
  return c;
}

function cli() {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--card');
  const rest = args.filter((a, i) => i !== ci && i !== ci + 1);
  // a wall on the Puzzles sheet is the sheet's own file, never a card (2026-10-18, the same fix as the hub's)
  if ((ci > -1 && args[ci + 1] === SHEET) || /^wall:/.test(rest[1] || '')) {
    if (rest[0] === 'fixed') { fixed(SHEET, rest[1], rest[2]); console.log('Back to David: ' + rest[1]); return; }
    const open = Object.entries(readMarks(SHEET).items).filter(([, m]) => m.mark === 'tweak' || m.mark === 'recheck');
    console.log(`\nPuzzles sheet · ${open.length} wall(s) with a note\n`);
    for (const [id, m] of open) console.log(`  ${m.mark === 'tweak' ? 'TWEAK' : 'back '}  ${id.padEnd(30)} ${String(m.note || '').replace(/\n/g, ' ').slice(0, 90)}`);
    return;
  }
  const card = cardFor(ci > -1 ? args[ci + 1] : undefined);
  if (rest[0] === 'fixed') {
    fixed(card.id, rest[1], rest[2]);
    console.log('Back to David: ' + rest[1]);
  }
  const list = items(card);
  const c = counts(list);
  console.log(`\nQA list · ${card.title} · ${c.total} item(s): ${c.todo} to look at, ${c.good} good, ${c.tweak} with Claude, ${c.recheck} back for another look\n`);
  const tag = { todo: '     ', good: 'good ', tweak: 'TWEAK', recheck: 'back ' };
  for (const it of list) {
    console.log(`  ${tag[/** @type {'todo'} */ (it.state)]}  ${it.id.padEnd(46)} ${it.text.slice(0, 70)}`);
    if (it.state === 'tweak') console.log('         his note: ' + it.note.replace(/\n/g, ' '));
  }
  console.log(c.clear ? '\nThe list is clear.' : '');
}

if (require.main === module) {
  try { cli(); } catch (e) { console.error(String(e && /** @type {Error} */ (e).message || e)); process.exit(1); }
}

module.exports = { DIR, SHEET, SHOTS, SIZES, SIZE_NAME, slug, readMarks, pageMarks, items, counts, mark, fixed, pictures, cardFor, defaultCard };
