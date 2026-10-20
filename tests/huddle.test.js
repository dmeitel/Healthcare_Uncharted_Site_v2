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
const PAGE = fs.readFileSync(path.join(ROOT, 'src', 'fun', 'daily-huddle', 'index.html'), 'utf8');
const ENGINE = PAGE.match(/<script id="hd-engine">([\s\S]*?)<\/script>/)[1];
const BANKFILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'huddle-questions.json'), 'utf8'));
const BANK = BANKFILE.questions;

function load() {
  const ctx = { window: {}, console, Date, Math, JSON, Intl };
  vm.createContext(ctx);
  new vm.Script(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'js', 'hu-rng.js'), 'utf8'), { filename: 'hu-rng.js' }).runInContext(ctx);
  new vm.Script(ENGINE, { filename: 'hd-engine' }).runInContext(ctx);
  const E = ctx.window.HuddleEngine;
  E.setBank(BANK, BANKFILE.versions);
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

// DH10 (2026-10-15, David: "at this point not sure we need the dots just tiles will do", then "Time and misses")
test('crossing ends the board, and the result is the time it took and the misses: every tile is worth the same', () => {
  const G = day('2026-10-21');
  // straight down the middle column: (0,-2) (0,-1) (0,0) (0,1) (0,2)
  const path = [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]].map(([q, r]) => E.CELLS.findIndex((c) => c.q === q && c.r === r));
  path.forEach((i, n) => {
    E.dispatchAct(G, 'open', { i }, 1000 + n * 20000);
    E.dispatchAct(G, 'answer', { i, v: rightAnswer(qOf(G, i)) }, 1000 + n * 20000 + 500);
  });
  assert.strictEqual(G.phase, 'done');
  assert.strictEqual(G.end, 'crossed');
  assert.strictEqual(E.elapsed(G, 999999), 80500, 'the time used, from the first tile to the crossing');
  assert.strictEqual(E.stopwatch(E.elapsed(G, 0)), '1:20');
  assert.deepStrictEqual(plain(G.path), path, 'the chain that crossed');
  assert.ok(!('score' in G), 'no score: the tiles carry no points');
  E.dispatchAct(G, 'open', { i: E.TOP[0] }, 90000);
  assert.strictEqual(G.open, -1, 'nothing opens on a finished board');
});

test('the share line gives the time to cross and the misses, on a timed board and an untimed one alike', () => {
  const play = (G) => {
    const path = [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]].map(([q, r]) => E.CELLS.findIndex((c) => c.q === q && c.r === r));
    const miss = E.CELLS.findIndex((c) => c.q === -1 && c.r === 0);
    E.dispatchAct(G, 'open', { i: miss }, 0);
    E.dispatchAct(G, 'answer', { i: miss, v: wrongAnswer(qOf(G, miss)) }, 9000);
    // the last right answer lands 102 seconds after the first tile opened
    path.forEach((i, n) => { E.dispatchAct(G, 'open', { i }, 10000 + n * 20000); E.dispatchAct(G, 'answer', { i, v: rightAnswer(qOf(G, i)) }, 10000 + n * 20000 + 12000); });
    return G;
  };
  const G = play(day('2026-10-15'));
  assert.strictEqual(G.end, 'crossed');
  assert.strictEqual(E.shareText(G, '', 0).split('\n')[0], 'Daily Huddle #2 · crossed in 1:42 · 1 miss');
  const P = play(E.newGame({ id: 'past:2026-10-15', seed: E.daySeed('2026-10-15'), mode: 'past', day: 2, clock: 0, misses: 0, out: E.dayOut('2026-10-15') }));
  assert.strictEqual(E.shareText(P, '', 0).split('\n')[0], 'Daily Huddle #2, replayed · crossed in 1:42 · 1 miss', 'no clock, the same reading');
  const T = day('2026-10-15');
  E.dispatchAct(T, 'open', { i: E.TOP[0] }, 0);
  E.dispatchAct(T, 'tick', {}, 180000);
  assert.strictEqual(E.shareText(T, '', 0).split('\n')[0], 'Daily Huddle #2 · out of time · 0 misses', 'a board that does not cross gives no time');
});

test('misses end the board at the limit, and a board nobody can cross ends as blocked', () => {
  const G = day('2026-10-22');
  for (const i of [0, 1, 2]) { E.dispatchAct(G, 'open', { i }, 10); E.dispatchAct(G, 'answer', { i, v: wrongAnswer(qOf(G, i)) }, 20); }
  assert.strictEqual(G.phase, 'done');
  assert.strictEqual(G.end, 'misses');
  assert.deepStrictEqual(plain(G.path), [], 'no chain crossed');
  const H = E.newGame({ id: 'gen:x', seed: 7, mode: 'practice', clock: 0, misses: 5 });
  for (const i of E.TOP) { E.dispatchAct(H, 'open', { i }, 10); E.dispatchAct(H, 'answer', { i, v: wrongAnswer(qOf(H, i)) }, 20); }
  assert.strictEqual(H.end, 'blocked', 'with the top row closed there is no way through');
});

// DH6 (2026-10-14, David: "people are garrented to miss some"): today's, past and practice boards have no miss limit
test('with no miss limit a miss still closes its tile, and the board runs on until it is crossed, timed out or blocked', () => {
  const G = E.newGame({ id: 'gen:x', seed: 11, mode: 'practice', clock: 0, misses: 0 });
  const misses = [E.TOP[0], E.TOP[1], E.BOTTOM[0], E.BOTTOM[1]];   // a way down is left: the last top tile to the last bottom tile
  for (const i of misses) { E.dispatchAct(G, 'open', { i }, 10); E.dispatchAct(G, 'answer', { i, v: wrongAnswer(qOf(G, i)) }, 20); }
  assert.strictEqual(G.closed.length, 4);
  assert.notStrictEqual(G.phase, 'done', 'four misses and still playing');
  E.dispatchAct(G, 'open', { i: E.TOP[2] }, 30); E.dispatchAct(G, 'answer', { i: E.TOP[2], v: wrongAnswer(qOf(G, E.TOP[2])) }, 40);
  assert.strictEqual(G.end, 'blocked', 'the last top tile closed: no way through');
  assert.strictEqual(E.parseMade(E.madeCode(5, 180, 0)).misses, 0, 'a made board can say no limit too');
});

// DH7 (2026-10-14, David: "this is all very hard, I have to google most of these"): a number tile is four answers to pick from
test('every number question offers four distinct answers, exactly one counts as right, none negative, no percent past 100', () => {
  const nums = BANK.filter((q) => q.t === 'number');
  assert.ok(nums.length > 300);
  for (const q of nums) {
    const p = E.picks(q);
    assert.ok(p, q.id + ': four answers');
    assert.strictEqual(new Set(p.shown).size, 4, q.id + ': four different answers on the keys');
    const right = p.vals.map((v) => E.judge(q, v));
    assert.deepStrictEqual(plain(right.map((r, k) => r === (k === p.right))), [true, true, true, true], q.id + ': only the right key counts');
    assert.strictEqual(p.vals[p.right], q.a, q.id + ': the right key carries the exact answer');
    assert.ok(p.vals.every((v) => v >= 0), q.id + ': nothing negative');
    if ((q.suf === '%' || q.unit === 'percent') && q.a <= 100) assert.ok(p.shown.every((v) => v <= 100), q.id + ': a percent stays inside 100');
    assert.deepStrictEqual(plain(E.picks(q)), plain(p), q.id + ': the same four every time');
  }
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

// YOUR FIELD (DECISIONS DH4 and DH5, 2026-10-14): practice and made boards lean toward a profession; today's board never does
test('a made board can carry a field, and a link made before fields opens the same board as before', () => {
  const code = E.madeCode(123456789, 180, 3, 'rt');
  assert.match(code, /^my:[0-9a-z]+-180-3-rt$/);
  assert.deepStrictEqual(plain(E.parseMade(code)), { seed: 123456789, clock: 180, misses: 3, field: 'rt' });
  assert.strictEqual(E.madeCode(123456789, 180, 3, ''), E.madeCode(123456789, 180, 3), 'no field, no suffix');
  assert.strictEqual(E.parseMade('my:abc-180-3-zz'), null, 'a field the game does not offer');
});

test('a field leans a practice board to about a third of its tiles, never repeats a template, and leaves today\'s board alone', () => {
  const least = { rt: 5, rn: 5, md: 5, rx: 3 };   // pharmacy has no licensure compact in the bank, so it leans in two zones, not three
  for (const F of E.FIELDS) {
    for (let s = 1; s <= 60; s++) {
      const G = E.newGame({ id: 'gen:x', seed: s * 7919, mode: 'practice', clock: 180, misses: 3, field: F.id });
      const ks = G.tiles.map((t) => qOf(G, G.tiles.indexOf(t)).k);
      const mine = ks.filter((k) => F.re.test(k)).length;
      assert.ok(mine >= least[F.id] && mine <= 8, `${F.name}, seed ${s}: ${mine} of 19 from the field`);
      assert.strictEqual(new Set(ks).size, 19, `${F.name}, seed ${s}: no template twice`);
      assert.strictEqual(G.field, F.id);
    }
  }
  for (const k of ['2026-10-14', '2026-10-20', '2027-03-01']) {
    const asked = E.newGame({ id: 'day:' + k, seed: E.daySeed(k), mode: 'day', day: E.dayNumber(k), clock: 180, misses: 3, out: E.dayOut(k), field: 'rt' });
    assert.deepStrictEqual(plain(asked), plain(day(k)), `${k}: today's board is everyone's board`);
  }
  const none = E.newGame({ id: 'gen:x', seed: 7919, mode: 'practice', clock: 180, misses: 3 });
  assert.ok(!('field' in none), 'a board with no field carries none, so its save is the same as before fields');
});

test('the share line draws the board as rows of squares and gives no answer away', () => {
  const G = day('2026-10-25');
  const i = E.TOP[0];
  E.dispatchAct(G, 'open', { i }, 0);
  E.dispatchAct(G, 'answer', { i, v: rightAnswer(qOf(G, i)) }, 10);
  E.dispatchAct(G, 'stop', {}, 20);
  const text = E.shareText(G, 'https://example.test/', 20);
  const lines = text.split('\n');
  assert.match(lines[0], /^Daily Huddle #12 · stopped · 0 misses$/);
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

// THE LIFELINES (2026-10-15, DECISIONS DH8 and DH9; David: "Free, once each"): 50:50, a hint and a swap, once each a board
const keysOf = (q) => (q.t === 'choice' ? q.o.length : E.picks(q) ? 4 : 0);
const rightKey = (q) => (q.t === 'choice' ? q.a : E.picks(q).right);
const keyValue = (q, k) => (q.t === 'choice' ? k : E.picks(q).vals[k]);
const tileWhere = (G, ok) => G.tiles.findIndex((t, i) => ok(E.question(t.q), i));

test('each lifeline works once a board, on the open tile only, and only while the board is in play', () => {
  const G = day('2026-10-26');
  const four = G.tiles.map((t, i) => i).filter((i) => keysOf(qOf(G, i)) === 4);
  assert.ok(four.length >= 2, 'two tiles with four answers');
  const [a, b] = four;
  assert.ok(!E.canLife(G, 'narrow'), 'nothing is open yet');
  E.dispatchAct(G, 'narrow', { i: a }, 10);
  assert.ok(!('life' in G), 'a lifeline on a tile that is not open is dropped');
  E.dispatchAct(G, 'open', { i: a }, 10);
  E.dispatchAct(G, 'narrow', { i: b }, 20);
  assert.ok(!('life' in G), 'a lifeline names the open tile or it is dropped');
  E.dispatchAct(G, 'narrow', { i: a }, 20);
  assert.deepStrictEqual(plain(G.life), { narrow: { i: a, q: G.tiles[a].q } });
  E.dispatchAct(G, 'close', {}, 30);
  E.dispatchAct(G, 'open', { i: b }, 40);
  assert.ok(!E.canLife(G, 'narrow'), 'used once, gone for the board');
  E.dispatchAct(G, 'narrow', { i: b }, 50);
  assert.strictEqual(G.life.narrow.i, a, 'a second 50:50 is refused');
  assert.ok(!E.lifeOn(G, 'narrow', b));
  E.dispatchAct(G, 'stop', {}, 60);
  assert.ok(!E.canLife(G, 'swap') && !E.canLife(G, 'hint'), 'nothing after the board ends');
  const T = day('2026-10-26');
  E.dispatchAct(T, 'open', { i: a }, 0);
  E.dispatchAct(T, 'swap', { i: a }, 180001);
  assert.strictEqual(T.end, 'time', 'a lifeline after the clock ran out ends the board instead');
  assert.ok(!('life' in T));
});

test('50:50 leaves the right answer and one wrong on every four-answer question, the same two every time, and never on two', () => {
  let n = 0;
  for (const q of BANK) {
    const keep = E.narrowKeep(q);
    if (keysOf(q) !== 4) { assert.strictEqual(keep, null, q.id + ': two answers, nothing to take away'); continue; }
    n++;
    assert.strictEqual(keep.length, 2, q.id);
    assert.ok(keep.includes(rightKey(q)), q.id + ': the right answer stays');
    assert.strictEqual(new Set(keep).size, 2, q.id + ': and one wrong one');
    assert.ok(keep.every((k) => k >= 0 && k < 4), q.id);
    assert.deepStrictEqual(plain(E.narrowKeep(q)), plain(keep), q.id + ': the same two for everyone');
  }
  assert.ok(n > 600, n + ' four-answer questions');
  // the two that went cannot be answered; the two that stayed can
  const G = day('2026-10-27');
  const i = tileWhere(G, (q) => keysOf(q) === 4);
  E.dispatchAct(G, 'open', { i }, 0);
  E.dispatchAct(G, 'narrow', { i }, 5);
  const q = qOf(G, i), keep = E.narrowKeep(q), gone = [0, 1, 2, 3].find((k) => !keep.includes(k));
  E.dispatchAct(G, 'answer', { i, v: keyValue(q, gone) }, 10);
  assert.strictEqual(G.open, i, 'an answer 50:50 took away is refused');
  E.dispatchAct(G, 'answer', { i, v: keyValue(q, rightKey(q)) }, 20);
  assert.ok(G.held.includes(i));
  let two = null;
  for (let n2 = 0; n2 < 60 && !two; n2++) { const H = day(new Date(Date.UTC(2026, 9, 14 + n2)).toISOString().slice(0, 10)); const j = tileWhere(H, (x) => keysOf(x) === 2); if (j >= 0) two = { H, j }; }
  assert.ok(two, 'a board with a two-answer tile');
  E.dispatchAct(two.H, 'open', { i: two.j }, 0);
  assert.ok(!E.canLife(two.H, 'narrow'), 'not on a two-answer tile');
});

test('Swap keeps the zone and the dots, never puts a template on the board twice, and gives everyone the same question', () => {
  let swaps = 0;
  for (let n = 0; n < 120; n++) {
    const k = new Date(Date.UTC(2026, 9, 14 + n)).toISOString().slice(0, 10);
    const G = day(k), again = day(k);
    for (let i = 0; i < G.tiles.length; i++) {
      const to = E.swapFor(G, i);
      assert.strictEqual(to, E.swapFor(again, i), `${k} tile ${i}: the same swap for everyone`);
      if (!to) continue;
      const q = E.question(to), t = G.tiles[i];
      assert.strictEqual(q.z, t.z, `${k} tile ${i}: same zone`);
      assert.strictEqual(q.d, t.d, `${k} tile ${i}: same dots`);
      assert.ok(!G.tiles.some((x) => E.question(x.q).k === q.k), `${k} tile ${i}: a template already on the board`);
      swaps++;
    }
    const i = n % 19;
    if (!E.swapFor(G, i)) continue;
    const was = G.tiles[i].q;
    E.dispatchAct(G, 'open', { i }, 0);
    E.dispatchAct(G, 'swap', { i }, 5);
    assert.deepStrictEqual(plain(G.life.swap), { i, q: was, to: G.tiles[i].q }, k + ': the swap is on the record');
    assert.strictEqual(new Set(G.tiles.map((t) => E.question(t.q).k)).size, 19, k + ': no template twice after the swap');
    assert.strictEqual(G.tiles[i].d, again.tiles[i].d, k + ': the tile is as hard as it was');
  }
  assert.ok(swaps > 120 * 15, swaps + ' swaps offered');
});

test('a lifeline belongs to the question it was used on: swap a narrowed question away and the narrowing goes with it', () => {
  const G = day('2026-10-28');
  const i = tileWhere(G, (q, j) => keysOf(q) === 4 && !!E.swapFor(G, j));
  E.dispatchAct(G, 'open', { i }, 0);
  E.dispatchAct(G, 'narrow', { i }, 5);
  assert.ok(E.lifeOn(G, 'narrow', i));
  E.dispatchAct(G, 'swap', { i }, 10);
  assert.ok(!E.lifeOn(G, 'narrow', i), 'the new question shows all its answers');
  assert.ok(E.lifeOn(G, 'swap', i));
  assert.strictEqual(E.lifeCount(G), 2, 'both count as used');
});

test('a hint is offered only on a tile whose question has one, and it never changes the answer', () => {
  const G = day('2026-10-29');
  const yes = tileWhere(G, (q) => !!q.h), no = tileWhere(G, (q) => !q.h);
  assert.ok(yes >= 0 && no >= 0, 'this board has both kinds');
  E.dispatchAct(G, 'open', { i: no }, 0);
  assert.ok(!E.canLife(G, 'hint'));
  E.dispatchAct(G, 'hint', { i: no }, 5);
  assert.ok(!('life' in G), 'no hint, nothing used');
  E.dispatchAct(G, 'close', {}, 6);
  E.dispatchAct(G, 'open', { i: yes }, 10);
  assert.ok(E.canLife(G, 'hint'));
  E.dispatchAct(G, 'hint', { i: yes }, 15);
  assert.ok(E.lifeOn(G, 'hint', yes));
  assert.strictEqual(E.hintOf(qOf(G, yes)), qOf(G, yes).h);
  E.dispatchAct(G, 'answer', { i: yes, v: rightAnswer(qOf(G, yes)) }, 20);
  assert.ok(G.held.includes(yes), 'the answer counts as it always did');
});

test('the share line counts the lifelines used, and a board that used none shares and saves exactly as before', () => {
  const tail = (G) => E.shareText(G, '', 100).split('\n')[0].split(' · ').slice(2).join(' · ');   // after the board's name and how it ended
  const G = day('2026-10-30');
  assert.ok(!('life' in G), 'a new board carries no lifeline record');
  const FIELDS = ['ans', 'clock', 'closed', 'day', 'end', 'held', 'id', 'last', 'misses', 'mode', 'more', 'open', 'out', 'path', 'phase', 'seed', 't0', 't1', 'tiles', 'v'];
  assert.deepStrictEqual(Object.keys(day('2026-10-19')).sort(), FIELDS, 'the same fields a board had before lifelines, less the score (DH10)');
  // a board dealt from the grown bank (2026-10-18) says which bank, and nothing else is new
  assert.deepStrictEqual(Object.keys(G).sort(), E.dayBank('2026-10-30') > 1 ? [...FIELDS, 'bank'].sort() : FIELDS);
  E.dispatchAct(G, 'open', { i: E.TOP[0] }, 0);
  E.dispatchAct(G, 'answer', { i: E.TOP[0], v: wrongAnswer(qOf(G, E.TOP[0])) }, 10);
  E.dispatchAct(G, 'stop', {}, 20);
  assert.strictEqual(tail(G), '1 miss', 'a clean board says nothing about lifelines');
  assert.ok(!/lifeline/.test(E.shareText(G, '', 100)));
  const i = tileWhere(day('2026-10-30'), (q, j) => keysOf(q) === 4 && !!E.swapFor(day('2026-10-30'), j));
  const H = day('2026-10-30');
  E.dispatchAct(H, 'open', { i }, 0);
  E.dispatchAct(H, 'narrow', { i }, 5);
  E.dispatchAct(H, 'stop', {}, 6);
  assert.strictEqual(tail(H), '0 misses · 1 lifeline');
  const K = day('2026-10-30');
  E.dispatchAct(K, 'open', { i }, 0);
  E.dispatchAct(K, 'narrow', { i }, 5);
  E.dispatchAct(K, 'swap', { i }, 6);
  E.dispatchAct(K, 'stop', {}, 7);
  assert.strictEqual(tail(K), '0 misses · 2 lifelines');
  const s = JSON.parse(JSON.stringify(E.packSave(K)));
  assert.deepStrictEqual(plain(E.applySave(s)), plain(K), 'a board with lifelines saves and restores');
  assert.strictEqual(E.applySave({ ...s, life: 'all' }), null, 'a lifeline record that is not a record fails the restore');
});

// 2026-10-16 (David: "why is the daily huddle board timed?"; asked, "No limit, time is the score"): today's board and
// practice start with no clock, so the clock counts up and the time to cross is the result. A team board keeps its pick.
test('today and practice have no time limit; a team board still can', () => {
  const starts = PAGE.match(/mode:'(day|practice)'[^}]*clock:(\d+)/g) || [];
  assert.ok(starts.length >= 3, 'the starts of today and practice are found (' + starts.length + ')');
  for (const s of starts) assert.match(s, /clock:0$/, 'starts with no clock: ' + s.slice(0, 60));
  assert.doesNotMatch(PAGE, /Board #\$\{n\} · 3 minutes/, 'the door card no longer promises three minutes');
  assert.ok(E.CLOCKS.includes(0) && E.CLOCKS.includes(300), 'a team board can still pick no clock or five minutes');
});

// THE BANK GROWS IN VERSIONS (2026-10-18, David: "I kept getting ones I have seen"). The boards already dealt on the live site
// replay as they were played: a day before version 2's first day deals from the first bank, and so does a made link from before.
const PINS = JSON.parse(fs.readFileSync(path.join(__dirname, 'huddle-pins.json'), 'utf8'));
test('the boards already dealt replay as they were: days before the bank grew, and made links from before it', () => {
  for (const [k, ids] of Object.entries(PINS.days)) {
    assert.ok(k < E.BANK_DAYS[2], k + ' is before version 2');
    assert.deepStrictEqual(plain(day(k).tiles.map((t) => t.q)), ids, k + ': today\'s board as it was dealt');
    const past = E.newGame({ id: 'past:' + k, seed: E.daySeed(k), mode: 'past', day: E.dayNumber(k), clock: 0, misses: 0, out: E.dayOut(k) });
    assert.deepStrictEqual(plain(past.tiles.map((t) => t.q)), ids, k + ': replayed as a past board');
    assert.ok(!('bank' in day(k)), k + ': a first-bank board saves exactly as before');
  }
  for (const [code, ids] of Object.entries(PINS.made)) {
    const m = E.parseMade(code);
    assert.ok(!('bank' in m), code + ': an old code names no bank');
    const G = E.newGame({ id: code, seed: m.seed, mode: 'made', clock: m.clock, misses: m.misses, field: m.field, bank: m.bank || 1 });
    assert.deepStrictEqual(plain(G.tiles.map((t) => t.q)), ids, code + ': a made link from before opens the same board');
  }
});

test('a day from version 2 on deals from the whole bank, and a made code carries the bank it was made on', () => {
  const v = E.bankVersion();
  assert.strictEqual(E.dayBank('2026-10-19'), 1);
  assert.strictEqual(E.dayBank(E.BANK_DAYS[2]), Math.min(2, v));
  const code = E.madeCode(123456789, 180, 3, 'rt', 2);
  assert.match(code, /^my:[0-9a-z]+-180-3-rt-b2$/);
  assert.deepStrictEqual(plain(E.parseMade(code)), { seed: 123456789, clock: 180, misses: 3, field: 'rt', bank: 2 });
  assert.deepStrictEqual(plain(E.parseMade(E.madeCode(123456789, 180, 3, '', 2))), { seed: 123456789, clock: 180, misses: 3, bank: 2 });
  assert.strictEqual(E.parseMade('my:abc-180-3-b1'), null, 'the first bank is the code with no version');
  // a board dealt from a bank never holds a question from a later one, Swap included
  for (let s = 1; s <= 40; s++) {
    const G = E.newGame({ id: 'my:x', seed: s * 104729, mode: 'made', clock: 0, misses: 0, bank: 1 });
    assert.ok(G.tiles.every((t) => !(E.question(t.q).b > 1)), 'seed ' + s + ': a first-bank board holds first-bank questions');
    const i = E.TOP[1];
    E.dispatchAct(G, 'open', { i }, 0);
    E.dispatchAct(G, 'swap', { i }, 1);
    assert.ok(!(E.question(G.tiles[i].q).b > 1), 'seed ' + s + ': Swap stays in the board\'s bank');
  }
});

// PLAYING ON (2026-10-18, David: "a continuation button on daily huddle after they make a line incase they want to play the
// whole board"): a finished board with tiles left plays on, and the result never moves
test('Keep playing: the rest of the board after the crossing, with the result, the clock and the misses left as they were', () => {
  const G = day('2026-10-22');
  const path = [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]].map(([q, r]) => E.CELLS.findIndex((c) => c.q === q && c.r === r));
  const miss = E.CELLS.findIndex((c) => c.q === -1 && c.r === 0);
  E.dispatchAct(G, 'open', { i: miss }, 0);
  E.dispatchAct(G, 'answer', { i: miss, v: wrongAnswer(qOf(G, miss)) }, 1000);
  path.forEach((i, n) => { E.dispatchAct(G, 'open', { i }, 2000 + n * 1000); E.dispatchAct(G, 'answer', { i, v: rightAnswer(qOf(G, i)) }, 2500 + n * 1000); });
  assert.strictEqual(G.end, 'crossed');
  const head = E.shareText(G, '', 0).split('\n')[0], t = E.elapsed(G, 0);
  assert.strictEqual(E.tilesLeft(G), 13);
  E.dispatchAct(G, 'more', {}, 60000);
  assert.strictEqual(G.phase, 'extra');
  assert.ok(E.ended(G));
  assert.ok(!E.canLife(G, 'narrow') && !E.canLife(G, 'hint'), 'no lifelines while playing on');
  const rest = E.CELLS.map((c, i) => i).filter((i) => !G.held.includes(i) && !G.closed.includes(i));
  rest.forEach((i, n) => {
    E.dispatchAct(G, 'open', { i }, 70000 + n * 1000);
    assert.strictEqual(G.open, i, 'a tile left opens');
    E.dispatchAct(G, 'answer', { i, v: n % 3 ? rightAnswer(qOf(G, i)) : wrongAnswer(qOf(G, i)) }, 70500 + n * 1000);
  });
  assert.strictEqual(G.phase, 'done', 'the last tile ends playing on');
  assert.strictEqual(E.tilesLeft(G), 0);
  assert.strictEqual(G.end, 'crossed');
  assert.strictEqual(E.elapsed(G, 999999), t, 'the time to cross does not move');
  assert.strictEqual(E.missCount(G), 1, 'the misses are the ones before the crossing');
  const right = G.held.length;
  assert.strictEqual(E.shareText(G, '', 0).split('\n')[0], head + ` · ${right} of 19 right`, 'the share line adds the whole board after the result');
  E.dispatchAct(G, 'more', {}, 99000);
  assert.strictEqual(G.phase, 'done', 'nothing is left to play on');
  assert.deepStrictEqual(plain(E.applySave(JSON.parse(JSON.stringify(G)))), plain(G), 'a board played on saves and restores');
});

test('playing on stops when asked, and a board can be played on again from its result', () => {
  const G = day('2026-10-23');
  const path = [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]].map(([q, r]) => E.CELLS.findIndex((c) => c.q === q && c.r === r));
  path.forEach((i, n) => { E.dispatchAct(G, 'open', { i }, n * 1000); E.dispatchAct(G, 'answer', { i, v: rightAnswer(qOf(G, i)) }, n * 1000 + 500); });
  const fresh = E.dispatchAct(day('2026-10-23'), 'more', {}, 0);
  assert.strictEqual(fresh.phase, 'ready', 'a board in play cannot be played on');
  E.dispatchAct(G, 'more', {}, 10000);
  const i = E.TOP[1];   // TOP[0] is the crossing's first tile
  E.dispatchAct(G, 'open', { i }, 11000);
  E.dispatchAct(G, 'answer', { i, v: wrongAnswer(qOf(G, i)) }, 12000);
  assert.strictEqual(E.missCount(G), 0, 'a miss while playing on is not a miss in the result');
  assert.strictEqual(G.closed.length, 1, 'but its tile closes');
  E.dispatchAct(G, 'stop', {}, 13000);
  assert.strictEqual(G.phase, 'done');
  E.dispatchAct(G, 'more', {}, 14000);
  assert.strictEqual(G.phase, 'extra', 'back to the board from the result');
  assert.deepStrictEqual(plain(G.x), { held: 5, closed: 0 }, 'the counts at the crossing are kept from the first time');
  E.dispatchAct(G, 'tick', {}, 9e9);
  assert.strictEqual(G.phase, 'extra', 'no clock runs while playing on');
});

// 2026-10-18: a practice board on the grown bank showed "Home base" three times. From version 2 a board prefers families it
// does not hold yet, the way a wedge always has; version 1 deals exactly as it did (the pins above)
test('from version 2 a board spreads its families: no family three times, and repeats are the exception', () => {
  if (E.bankVersion() < 2) return;
  let extra = 0;
  for (let s = 1; s <= 200; s++) {
    const G = E.newGame({ id: 'gen:x', seed: s * 7919, mode: 'practice', clock: 0, misses: 0 });
    const c = {};
    for (const t of G.tiles) { const f = E.question(t.q).f; c[f] = (c[f] || 0) + 1; }
    assert.ok(Math.max(...Object.values(c)) <= 2, 'seed ' + s + ': a family three times: ' + JSON.stringify(c));
    extra += Object.values(c).reduce((a, n) => a + n - 1, 0);
  }
  assert.ok(extra / 200 < 1.2, 'repeats per board: ' + (extra / 200).toFixed(2));
});
