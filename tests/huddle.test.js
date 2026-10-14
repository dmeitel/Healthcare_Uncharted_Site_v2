/**
 * Daily Huddle, the hex trivia board (2026-10-14). The engine is its own script block on the page (#hd-engine) with no
 * DOM in it, so these tests load that block alone next to the seeded generator, the same way the page does, and feed it
 * the real question bank. What is pinned: the board's shape (19 hexes, six wedges around the compass), dealing by date
 * (the same day deals the same board, every board holds all seven zones and no template twice), the crossing and its
 * score, the clock, the misses, saves, made-board codes, and a share line that gives no answer away.
 * Plan: docs/HU-HEX-TRIVIA-PLAN-2026-10-14.md.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'src', 'secret-menu', 'daily-huddle', 'index.html'), 'utf8');
const ENGINE = PAGE.match(/<script id="hd-engine">([\s\S]*?)<\/script>/)[1];
const BANK = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'huddle-questions.json'), 'utf8')).questions;

function load() {
  const ctx = { window: {}, console, Date, Math, JSON, Intl };
  vm.createContext(ctx);
  new vm.Script(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'js', 'hu-rng.js'), 'utf8'), { filename: 'hu-rng.js' }).runInContext(ctx);
  new vm.Script(ENGINE, { filename: 'hd-engine' }).runInContext(ctx);
  const E = ctx.window.HuddleEngine;
  E.setBank(BANK);
  return E;
}
const E = load();
const plain = (x) => JSON.parse(JSON.stringify(x));   // arrays made in the sandbox fail deepStrictEqual against plain ones
const day = (k) => E.newGame({ id: 'day:' + k, seed: E.daySeed(k), mode: 'day', day: E.dayNumber(k), clock: 180, misses: 3, out: E.dayOut(k) });
const qOf = (G, i) => E.question(G.tiles[i].q);
const rightAnswer = (q) => q.a;
const wrongAnswer = (q) => (q.t === 'choice' ? (q.a + 1) % q.o.length : q.a * 10 + 1000);

test('the board is 19 hexes: six wedges of three around the compass, three tiles in the top row and three in the bottom', () => {
  assert.strictEqual(E.CELLS.length, 19);
  assert.deepStrictEqual(plain(E.CELLS[E.CENTER]), { q: 0, r: 0 });
  const wedgeCells = E.WEDGES.flatMap((w) => [w.inner, w.corner, w.edge]);
  assert.strictEqual(new Set(wedgeCells).size, 18, 'the wedges cover every cell but the compass, once each');
  assert.ok(!wedgeCells.includes(E.CENTER));
  assert.strictEqual(E.TOP.length, 3);
  assert.strictEqual(E.BOTTOM.length, 3);
  E.NB.forEach((list, i) => list.forEach((n) => assert.ok(E.NB[n].includes(i), `cells ${i} and ${n} touch both ways`)));
  assert.strictEqual(E.NB[E.CENTER].length, 6);
});

test('the same day deals the same board, and the next day deals another', () => {
  assert.deepStrictEqual(plain(day('2026-10-20').tiles), plain(day('2026-10-20').tiles));
  assert.notDeepStrictEqual(plain(day('2026-10-20').tiles), plain(day('2026-10-21').tiles));
});

test('a year of daily boards: all seven zones on every board, the compass holds the zone out of the ring, no template twice', () => {
  const zones = E.ZONES.map((z) => z.id);
  for (let n = 0; n < 365; n++) {
    const k = new Date(Date.UTC(2026, 9, 14 + n)).toISOString().slice(0, 10);
    const G = day(k);
    assert.strictEqual(G.tiles.length, 19, k);
    const ks = G.tiles.map((t) => E.question(t.q).k);
    assert.strictEqual(new Set(ks).size, 19, k + ': two tiles share a template');
    assert.ok(G.tiles.every((t) => E.question(t.q)), k + ': every tile is a question in the bank');
    const comp = G.tiles[E.CENTER];
    assert.ok(comp.c, k + ': the compass is marked');
    assert.strictEqual(comp.z, G.out, k + ': the compass holds the zone that sits out');
    const ring = E.WEDGES.map((w) => G.tiles[w.inner].z);
    assert.deepStrictEqual(ring, zones.filter((z) => z !== G.out), k + ': the ring runs in the Atlas order');
    E.WEDGES.forEach((w) => { for (const c of [w.corner, w.edge]) assert.strictEqual(G.tiles[c].z, G.tiles[w.inner].z, k + ': a wedge is one zone'); });
  }
});

test('the zone that sits out turns over every day, so the compass visits each zone in a week', () => {
  const outs = new Set();
  for (let n = 0; n < 7; n++) outs.add(day(new Date(Date.UTC(2026, 9, 14 + n)).toISOString().slice(0, 10)).out);
  assert.strictEqual(outs.size, 7);
});

test('answers: a choice is its index; a number counts inside its share or its fixed amount', () => {
  assert.ok(E.judge({ t: 'choice', a: 2 }, 2));
  assert.ok(!E.judge({ t: 'choice', a: 2 }, 1));
  assert.ok(E.judge({ t: 'number', a: 100, tol: 0.15 }, 115));
  assert.ok(!E.judge({ t: 'number', a: 100, tol: 0.15 }, 116));
  assert.ok(E.judge({ t: 'number', a: 84, abs: 1 }, 85));
  assert.ok(!E.judge({ t: 'number', a: 84, abs: 1 }, 86));
  assert.ok(!E.judge({ t: 'number', a: 84, abs: 1 }, NaN));
});

test('the clock starts on the first tile, a right answer holds the tile, a miss closes it', () => {
  const G = day('2026-10-20');
  assert.strictEqual(G.phase, 'ready');
  assert.strictEqual(E.timeLeft(G, 5000), 180000, 'no tile opened, no time used');
  const top = E.TOP[0];
  E.dispatchAct(G, 'open', { i: top }, 1000);
  assert.strictEqual(G.phase, 'play');
  assert.strictEqual(G.t0, 1000);
  E.dispatchAct(G, 'answer', { i: top, v: rightAnswer(qOf(G, top)) }, 2000);
  assert.deepStrictEqual(plain(G.held), [top]);
  const next = E.TOP[1];
  E.dispatchAct(G, 'open', { i: next }, 3000);
  E.dispatchAct(G, 'answer', { i: next, v: wrongAnswer(qOf(G, next)) }, 4000);
  assert.deepStrictEqual(plain(G.closed), [next]);
  E.dispatchAct(G, 'open', { i: next }, 5000);
  assert.strictEqual(G.open, -1, 'a closed tile does not open again');
  E.dispatchAct(G, 'answer', { i: E.CENTER, v: 0 }, 5000);
  assert.ok(!G.ans[E.CENTER], 'an answer for a tile that is not open is dropped');
});

test('crossing ends the board, and the score is the dots on the best chain (the compass counts double)', () => {
  const G = day('2026-10-21');
  // straight down the middle column: (0,-2) (0,-1) (0,0) (0,1) (0,2)
  const path = [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]].map(([q, r]) => E.CELLS.findIndex((c) => c.q === q && c.r === r));
  path.forEach((i, n) => {
    E.dispatchAct(G, 'open', { i }, 1000 + n * 100);
    E.dispatchAct(G, 'answer', { i, v: rightAnswer(qOf(G, i)) }, 1050 + n * 100);
  });
  assert.strictEqual(G.phase, 'done');
  assert.strictEqual(G.end, 'crossed');
  const want = path.reduce((a, i) => a + G.tiles[i].d * (G.tiles[i].c ? 2 : 1), 0);
  assert.strictEqual(G.score, want);
  assert.ok(G.path.includes(E.CENTER));
  E.dispatchAct(G, 'open', { i: E.TOP[0] }, 9000);
  assert.strictEqual(G.open, -1, 'nothing opens on a finished board');
});

test('misses end the board at the limit, and a board nobody can cross ends as blocked', () => {
  const G = day('2026-10-22');
  for (const i of [0, 1, 2]) { E.dispatchAct(G, 'open', { i }, 10); E.dispatchAct(G, 'answer', { i, v: wrongAnswer(qOf(G, i)) }, 20); }
  assert.strictEqual(G.phase, 'done');
  assert.strictEqual(G.end, 'misses');
  assert.strictEqual(G.score, 0);
  const H = E.newGame({ id: 'gen:x', seed: 7, mode: 'practice', clock: 0, misses: 5 });
  for (const i of E.TOP) { E.dispatchAct(H, 'open', { i }, 10); E.dispatchAct(H, 'answer', { i, v: wrongAnswer(qOf(H, i)) }, 20); }
  assert.strictEqual(H.end, 'blocked', 'with the top row closed there is no way through');
});

test('the clock runs out on a tick, or on the next move after it ran out', () => {
  const G = day('2026-10-23');
  E.dispatchAct(G, 'open', { i: E.TOP[0] }, 1000);
  E.dispatchAct(G, 'tick', {}, 1000 + 179999);
  assert.strictEqual(G.phase, 'play');
  E.dispatchAct(G, 'tick', {}, 1000 + 180000);
  assert.strictEqual(G.end, 'time');
  assert.strictEqual(E.timeLeft(G, 999999), 0);
  const H = day('2026-10-23');
  E.dispatchAct(H, 'open', { i: E.TOP[0] }, 0);
  E.dispatchAct(H, 'answer', { i: E.TOP[0], v: rightAnswer(qOf(H, E.TOP[0])) }, 200000);
  assert.strictEqual(H.end, 'time', 'an answer after the clock ran out does not count');
  assert.strictEqual(H.held.length, 0);
  const M = E.newGame({ id: 'my:a-180-3', seed: 10, mode: 'made', clock: 180, misses: 3, more: true });
  assert.strictEqual(E.limitMs(M), 270000, 'More time is half again as long');
  const U = E.newGame({ id: 'past:2026-10-14', seed: 10, mode: 'past', clock: 0, misses: 3 });
  E.dispatchAct(U, 'open', { i: E.TOP[0] }, 0);
  E.dispatchAct(U, 'tick', {}, 9e9);
  assert.strictEqual(U.phase, 'play', 'a board with no clock never runs out');
});

test('a save is the state as plain data, and a restore checks it', () => {
  const G = day('2026-10-24');
  E.dispatchAct(G, 'open', { i: E.TOP[2] }, 50);
  const s = JSON.parse(JSON.stringify(E.packSave(G)));
  assert.deepStrictEqual(plain(E.applySave(s)), plain(G));
  assert.strictEqual(E.applySave({ v: 2 }), null);
  assert.strictEqual(E.applySave(null), null);
  assert.strictEqual(E.applySave({ ...s, tiles: s.tiles.slice(0, 5) }), null);
  assert.strictEqual(E.applySave({ ...s, tiles: s.tiles.map((t) => ({ ...t, q: 'gone' })) }), null, 'a question that left the bank fails the restore');
});

test('a made board travels as a short code with its clock and misses', () => {
  const code = E.madeCode(123456789, 120, 5);
  assert.match(code, /^my:[0-9a-z]+-120-5$/);
  assert.deepStrictEqual(plain(E.parseMade(code)), { seed: 123456789, clock: 120, misses: 5 });
  assert.strictEqual(E.parseMade('my:abc-90-3'), null, 'a clock the maker does not offer');
  assert.strictEqual(E.parseMade('my:abc-180-4'), null, 'misses the maker does not offer');
  assert.strictEqual(E.parseMade('gen:abc'), null);
});

test('the share line draws the board as rows of squares and gives no answer away', () => {
  const G = day('2026-10-25');
  const i = E.TOP[0];
  E.dispatchAct(G, 'open', { i }, 0);
  E.dispatchAct(G, 'answer', { i, v: rightAnswer(qOf(G, i)) }, 10);
  E.dispatchAct(G, 'stop', {}, 20);
  const text = E.shareText(G, 'https://example.test/', 20);
  const lines = text.split('\n');
  assert.match(lines[0], /^Daily Huddle #12 · stopped$/);
  assert.deepStrictEqual(lines.slice(1, 6).map((l) => [...l.trim()].length), [3, 4, 5, 4, 3]);
  for (const t of G.tiles) {
    const q = E.question(t.q);
    assert.ok(!text.includes(q.q), 'no question text');
    if (q.t === 'choice') assert.ok(!text.includes(q.o[q.a]), 'no answer: ' + q.o[q.a]);
  }
});

test('the day turns over at midnight Mountain, and board #1 is the first day', () => {
  assert.strictEqual(E.dayNumber(E.DAY_ONE), 1);
  assert.strictEqual(E.dayKey(new Date('2026-10-15T05:30:00Z')), '2026-10-14', '11:30 at night in Denver is still the 14th');
  assert.strictEqual(E.dayKey(new Date('2026-10-15T06:30:00Z')), '2026-10-15');
});
