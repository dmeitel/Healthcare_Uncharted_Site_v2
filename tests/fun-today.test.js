/**
 * Today's puzzles, /fun/today/ (2026-10-18, David: "a page on fun that has a link of all the daily puzzles of today, like the NYT
 * app"). The page counts each daily's number and reads where you stand from what the game itself saves, so it is held here to
 * each game: the same first day, the same storage keys, a link that opens today's puzzle and not the front door, and the
 * right words on a card for a board not started, half played and finished.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string} */ f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PAGE = read('src/fun/today/index.html');
const FUN = read('src/fun/index.html');
const CARD = read('src/_includes/components/fun-today.njk');
const SCRIPT = read('src/assets/js/fun-today.js');
const HEADWALL = read('src/fun/headwall/index.html');
const HUDDLE = read('src/fun/daily-huddle/index.html');
/** @type {{id:string, href:string, one:string, word:string, name:string}[]} */
const DAILIES = require('../src/_data/dailies.js');

/** @returns {Record<string, {href:string, one:string}>} */
function cards() {
  return Object.fromEntries(DAILIES.map((d) => [d.id, { href: d.href, one: d.one }]));
}

test('both pages draw every daily: the full cards on /fun/today/, a shelf of compact ones on the Fun page', () => {
  assert.match(CARD, /data-daily="\{\{ d\.id \}\}" data-one="\{\{ d\.one \}\}" data-word="\{\{ d\.word \}\}"/, 'a card carries what the script reads');
  assert.match(PAGE, /\{%- for d in dailies %\}\{\{ dailyCard\(d, false\) \}\}/, '/fun/today/ draws the full cards');
  assert.match(FUN, /\{%- for d in dailies %\}\{\{ dailyCard\(d, true\) \}\}/, 'the Fun page has its own shelf of them');
  assert.ok(FUN.indexOf('dailyCard(d, true)') < FUN.indexOf("tool.cluster == 'fun'"), 'and it comes before the games');
  for (const page of [PAGE, FUN]) assert.match(page, /<script src="\/assets\/js\/fun-today\.js/, 'each page loads the script that fills the cards');
  assert.match(FUN, /href="\/fun\/today\/"/, 'the shelf links to the page of its own');
});

test('every daily is on the page, counted from the same first day as its game', () => {
  const c = cards();
  assert.deepStrictEqual(Object.keys(c).sort(), ['headwall', 'huddle']);
  const hw = /const DAY_ONE = \[(\d{4}), (\d{1,2}), (\d{1,2})\]/.exec(HEADWALL);
  assert.ok(hw, 'Headwall names its first day');
  const hwOne = `${hw[1]}-${String(+hw[2] + 1).padStart(2, '0')}-${String(+hw[3]).padStart(2, '0')}`;   // Headwall's month is zero-based
  assert.strictEqual(c.headwall.one, hwOne, 'Headwall\'s wall #1');
  const hd = /const DAY_ONE = '(\d{4}-\d{2}-\d{2})'/.exec(HUDDLE);
  assert.ok(hd, 'Daily Huddle names its first day');
  assert.strictEqual(c.huddle.one, hd[1], 'Daily Huddle\'s board #1');
});

test('each card opens today\'s puzzle itself, and reads the keys its game saves under', () => {
  const c = cards();
  assert.strictEqual(c.headwall.href, '/fun/headwall/today/');
  assert.match(read('src/fun/headwall/parts.11ty.js'), /slug: 'today', wall: 'today'/, 'Headwall has a plain address for today\'s wall');
  assert.strictEqual(c.huddle.href, '/fun/daily-huddle/?board=today');
  assert.match(HUDDLE, /startBoard\(id\)[\s\S]*id === 'today'/, 'Daily Huddle opens ?board=today on today\'s board');
  assert.match(HEADWALL, /const PKEY='hu-da'/);
  assert.match(HEADWALL, /const WALL_KEY='hu-da-wall'/);
  assert.match(HUDDLE, /const saveKey = \(id\) => 'hd-run:' \+ id/);
});

/** run the page's script against a stored state, and return what each card says */
function run(/** @type {Record<string, any>} */ stored, /** @type {Date} */ now) {
  const js = SCRIPT;
  const el = () => ({ textContent: '', innerHTML: '' });
  const made = Object.entries(cards()).map(([daily, c]) => {
    const parts = { num: el(), state: el(), go: el() };
    const attrs = { 'data-daily': daily, 'data-one': c.one, 'data-word': DAILIES.find((d) => d.id === daily).word };
    return { daily, parts, node: { getAttribute: (/** @type {string} */ k) => /** @type {any} */ (attrs)[k], querySelector: (/** @type {string} */ s) => (s === '[data-num]' ? parts.num : s === '[data-state]' ? parts.state : parts.go) } };
  });
  const byId = { fnDate: el(), fnNext: el() };
  const RealDate = Date;
  // the page only ever makes "now" (no argument) or a date from one value
  class FixedDate extends RealDate { constructor(/** @type {any} */ a) { super(a === undefined ? now.getTime() : a); } static now() { return now.getTime(); } }
  const ctx = {
    Date: FixedDate, Intl, Math, JSON,
    localStorage: { getItem: (/** @type {string} */ k) => (k in stored ? JSON.stringify(stored[k]) : null) },
    document: { querySelectorAll: () => made.map((m) => m.node), getElementById: (/** @type {string} */ id) => /** @type {any} */ (byId)[id] },
  };
  vm.runInNewContext(js, ctx);
  return { cards: Object.fromEntries(made.map((m) => [m.daily, { num: m.parts.num.textContent, state: m.parts.state.innerHTML, go: m.parts.go.textContent }])), date: byId.fnDate.textContent, next: byId.fnNext.textContent };
}

test('a card says where you stand: not played, in progress, or done with its result', () => {
  const now = new Date('2026-10-18T18:00:00Z');   // noon in Denver, Sunday 18 October
  let r = run({}, now);
  assert.strictEqual(r.cards.headwall.num, 'Wall #16');
  assert.strictEqual(r.cards.huddle.num, 'Board #5');
  assert.deepStrictEqual([r.cards.headwall.state, r.cards.headwall.go], ['Not played yet', 'Play']);
  assert.deepStrictEqual([r.cards.huddle.state, r.cards.huddle.go], ['Not played yet', 'Play']);
  assert.strictEqual(r.date, 'Sunday, October 18');
  assert.strictEqual(r.next, 'New puzzles in 12 h 0 min.');

  r = run({ 'hu-da-wall': { v: 1, id: 'day:2026-10-18' }, 'hd-run:day:2026-10-18': { phase: 'play' } }, now);
  assert.deepStrictEqual([r.cards.headwall.state, r.cards.headwall.go], ['<b>In progress</b>', 'Continue']);
  assert.deepStrictEqual([r.cards.huddle.state, r.cards.huddle.go], ['<b>In progress</b>', 'Continue']);

  r = run({ 'hu-da': { done: { 'day:2026-10-18': 1 }, daily: { last: '2026-10-18', streak: 3 } }, 'hd-run:day:2026-10-18': { phase: 'extra', end: 'crossed', t0: 1000, t1: 102900 } }, now);
  assert.deepStrictEqual([r.cards.headwall.state, r.cards.headwall.go], ['<b>Solved</b>, a 3-day streak', 'Play it again']);
  assert.deepStrictEqual([r.cards.huddle.state, r.cards.huddle.go], ['<b>Crossed in 1:41</b>', 'See your result'], 'a board played on after the crossing still shows its result');

  r = run({ 'hu-da-wall': { v: 1, id: 'day:2026-10-17' }, 'hd-run:day:2026-10-17': { phase: 'done', end: 'crossed', t0: 0, t1: 5000 } }, now);
  assert.strictEqual(r.cards.headwall.state, 'Not played yet', 'yesterday\'s wall is not today\'s');
  assert.strictEqual(r.cards.huddle.state, 'Not played yet', 'yesterday\'s board is not today\'s');

  r = run({}, new Date('2026-10-19T05:30:00Z'));   // 11:30 at night in Denver is still the 18th
  assert.strictEqual(r.cards.huddle.num, 'Board #5');
  assert.strictEqual(r.next, 'New puzzles in 30 min.');
});
