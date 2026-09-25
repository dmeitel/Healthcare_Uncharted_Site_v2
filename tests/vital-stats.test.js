/**
 * Vital Stats, the healthcare numbers game (2026-09-23). The engine is its own script block on the page
 * (#vs-engine) with no DOM in it, so these tests load that block alone next to the seeded dice and the
 * table kit, the same way the page does. What is pinned: the board (odds, closest without going over),
 * the payout arithmetic, the guards on every verb, a whole bot game on a fake clock that replays from its
 * seed, the table kit's any-seat verbs and auto seating, and a three-browser table on a fake bus where
 * every guest's copy matches the host's after every move.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'src', 'secret-menu', 'vital-stats', 'index.html'), 'utf8');
const ENGINE = PAGE.match(/<script id="vs-engine">([\s\S]*?)<\/script>/)[1];

function load() {
  const ctx = { window: { addEventListener() {} }, navigator: {}, console, setTimeout, clearTimeout, Date, Promise, Math, JSON,
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } } };
  ctx.globalThis = ctx.window;
  vm.createContext(ctx);
  for (const f of ['hu-rng.js', 'hu-table.js']) new vm.Script(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  ctx.HURng = ctx.window.HURng;
  new vm.Script(ENGINE, { filename: 'vs-engine' }).runInContext(ctx);
  return { E: ctx.window.VitalStatsEngine, K: ctx.window.HUTable, HURng: ctx.window.HURng };
}
const BANK = {};
[['q1', 'Workforce', 82280, 0], ['q2', 'Coverage', 8.2, 1], ['q3', 'Hospitals', 5366, 0], ['q4', 'Money', 254, 0], ['q5', 'Health', 78.4, 1],
 ['q6', 'Money', 25572, 0], ['q7', 'Workforce', 139400, 0], ['q8', 'Hospitals', 52, 0], ['q9', 'Coverage', 67, 0], ['q10', 'Health', 11.3, 1],
 ['q11', 'Money', 4.9e12, 0], ['q12', 'Workforce', 3300000, 0]].forEach(([id, cat, a, dp]) => { BANK[id] = { id, cat, q: 'A question about ' + id + '?', a, unit: 'units', pre: '', suf: '', dp, src: 'Test source', year: 2024, checked: '2026-09-23', why: 'Because.' }; });

function game(E, seed, bots) {
  const G = E.newGame(seed); G.bank = BANK;
  E.addPlayer(G, 'p1', 'Dana', false);
  G.settings.bots = bots == null ? 3 : bots; E.syncBots(G);
  return G;
}

test('the board: the middle pays 2 to 1 and the odds climb to 5 toward the edges; the low slot pays 6', () => {
  const { E } = load();
  const row = k => Array.from({ length: k }, (_, i) => E.oddsFor(i, k));
  assert.deepStrictEqual(row(1), [2]);
  assert.deepStrictEqual(row(2), [2, 2]);
  assert.deepStrictEqual(row(3), [3, 2, 3]);
  assert.deepStrictEqual(row(4), [3, 2, 2, 3]);
  assert.deepStrictEqual(row(5), [4, 3, 2, 3, 4]);
  assert.deepStrictEqual(row(7), [5, 4, 3, 2, 3, 4, 5]);
  assert.deepStrictEqual(row(8), [5, 4, 3, 2, 2, 3, 4, 5]);
  const G = game(E, 1, 0); E.addPlayer(G, 'p2', 'Sam'); E.addPlayer(G, 'p3', 'Kim');
  G.phase = 'answer'; G.players.p1.answer = 50; G.players.p2.answer = 30; G.players.p3.answer = 50;
  const s = E.slotsFor(G);
  assert.strictEqual(s[0].low, true); assert.strictEqual(s[0].odds, 6);
  assert.deepStrictEqual(Array.from(s.slice(1), x => x.val), [30, 50], 'distinct guesses, low to high; equal guesses share a slot');
  assert.deepStrictEqual(Array.from(s[2].seats).sort(), ['p1', 'p3']);
});

test('closest WITHOUT going over; when every guess is over, the low slot wins', () => {
  const { E } = load();
  const slots = [{ low: true, val: null }, { val: 10 }, { val: 20 }, { val: 30 }];
  assert.strictEqual(E.winningSlot(slots, 25), 2, '20 is under 25; 30 is closer but over');
  assert.strictEqual(E.winningSlot(slots, 30), 3, 'an exact guess wins');
  assert.strictEqual(E.winningSlot(slots, 5), 0, 'everyone went over');
  assert.strictEqual(E.winningSlot(slots, 1e9), 3);
});

test('the payout: +3 to the closest guess, each chip on it pays its odds, all in wins odds times the stake or loses it', () => {
  const { E } = load();
  const G = game(E, 7, 0); E.addPlayer(G, 'p2', 'Sam'); E.addPlayer(G, 'p3', 'Kim');
  G.settings.rounds = 1; G.round = 1; G.q = { a: 100, dp: 0 }; G.phase = 'bet';
  G.players.p1.answer = 90; G.players.p2.answer = 120; G.players.p3.answer = 60;
  G.slots = E.slotsFor(G);                                   // [low, 60 (3:1), 90 (2:1), 120 (3:1)]
  assert.deepStrictEqual(Array.from(G.slots, s => s.odds), [6, 3, 2, 3]);
  G.players.p1.chips = 10; G.players.p2.chips = 10; G.players.p3.chips = 10;
  G.players.p1.bets = [2, 2];                                // both on 90, the winner
  G.players.p2.bets = [3, 1];                                // nothing on the winner
  G.players.p2.allin = { slot: 3, amt: 6 };                  // all in on 120, over the answer
  G.players.p3.bets = [2, null];
  G.players.p3.allin = { slot: 2, amt: 4 };                  // all in on 90 at 2 to 1
  E.settle(G);
  assert.strictEqual(G.last.win, 2);
  assert.strictEqual(G.players.p1.chips, 10 + 3 + 2 + 2, 'closest guess, and two chips at 2 to 1');
  assert.strictEqual(G.players.p2.chips, 10 - 6, 'the lost stake');
  assert.strictEqual(G.players.p3.chips, 10 + 2 + 8, 'one chip at 2 to 1, and 4 all in at 2 to 1');
});

test('every verb has a guard: out of phase, out of range, or not enough players is a no-op', () => {
  const { E } = load();
  const G = E.newGame(3); G.bank = BANK; G.settings.bots = 0; E.addPlayer(G, 'p1', 'Dana');
  assert.strictEqual(E.dispatchAct(G, 'start', { now: 0 }), false, 'one player cannot start a table');
  assert.strictEqual(E.dispatchAct(G, 'answer', { seat: 'p1', val: 5, now: 0 }), false, 'no answers in the lobby');
  E.dispatchAct(G, 'bots', { by: 1 });
  assert.strictEqual(E.active(G).length, 2);
  assert.ok(E.dispatchAct(G, 'start', { now: 1000 }));
  assert.strictEqual(G.phase, 'answer');
  assert.strictEqual(E.dispatchAct(G, 'answer', { seat: 'p1', val: -3, now: 1000 }), false, 'no negative guesses');
  assert.strictEqual(E.dispatchAct(G, 'answer', { seat: 'p1', val: 'lots', now: 1000 }), false);
  assert.strictEqual(E.dispatchAct(G, 'lock', { seat: 'p1', now: 1000 }), false, 'nothing to lock yet');
  assert.ok(E.dispatchAct(G, 'answer', { seat: 'p1', val: 5000, now: 1000 }));
  assert.ok(E.dispatchAct(G, 'lock', { seat: 'p1', now: 1000 }));
  assert.strictEqual(E.dispatchAct(G, 'answer', { seat: 'p1', val: 6000, now: 1000 }), false, 'a locked guess stays locked');
  assert.strictEqual(E.dispatchAct(G, 'bet', { seat: 'p1', i: 0, slot: 0, now: 1000 }), false, 'no bets while guessing');
  assert.strictEqual(E.dispatchAct(G, 'set', { key: 'rounds', val: 10 }), false, 'settings freeze once dealt');
  assert.strictEqual(E.dispatchAct(G, 'answer', { seat: 'p9', val: 5, now: 1000 }), false, 'no such chair');
});

test('a returning host gets the questions its browser has not shown yet before any repeat', () => {
  const { E } = load();
  const seen = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];
  for (const seed of [5, 6, 7, 8]) {
    const G = game(E, seed, 1); G.settings.rounds = 5;
    assert.ok(E.dispatchAct(G, 'start', { now: 0, seen }));
    assert.ok(G.deck.every(id => seen.indexOf(id) === -1), 'seed ' + seed + ' dealt a seen question: ' + G.deck.join(','));
  }
  const G = game(E, 5, 1); G.settings.rounds = 10;
  E.dispatchAct(G, 'start', { now: 0, seen });
  assert.deepStrictEqual(Array.from(G.deck.slice(0, 5)).sort(), ['q10', 'q11', 'q12', 'q8', 'q9'], 'the five unseen come first');
  assert.strictEqual(G.deck.length, 10, 'repeats fill the rest');
});

test('a guess and its lock are one intent, so a relay that reorders messages cannot freeze a player', () => {
  const { E } = load();
  const G = E.newGame(21); G.bank = BANK; G.settings.bots = 0; E.addPlayer(G, 'p1', 'Dana'); E.addPlayer(G, 'p2', 'Sam');
  E.dispatchAct(G, 'start', { now: 0 });
  assert.strictEqual(E.dispatchAct(G, 'lock', { seat: 'p1', now: 0 }), false, 'a bare lock with no guess is refused');
  assert.strictEqual(E.dispatchAct(G, 'lock', { seat: 'p1', val: 'lots', now: 0 }), false, 'a lock carrying a bad guess is refused');
  assert.ok(E.dispatchAct(G, 'lock', { seat: 'p1', val: 5000, now: 0 }));
  assert.strictEqual(G.players.p1.answer, 5000);
  assert.strictEqual(G.players.p1.locked, true);
  assert.ok(E.dispatchAct(G, 'lock', { seat: 'p2', val: 7000, now: 0 }));
  E.tick(G, 1);
  assert.strictEqual(G.phase, 'bet', 'both locked with one intent each, and the board opens');
});

/** the real bank, keyed by id, as the page builds it */
function realBank() {
  const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'vital-stats-questions.json'), 'utf8'));
  /** @type {Record<string, any>} */
  const map = {};
  b.questions.forEach((/** @type {any} */ q) => { map[q.id] = q; });
  return map;
}

test('state games: the whole U.S. deals the everyday mix; state by state deals only the picked states', () => {
  const { E } = load();
  const B = realBank();
  const G = E.newGame(11); G.bank = B; E.addPlayer(G, 'p1', 'Dana'); G.settings.bots = 1; E.syncBots(G);
  assert.strictEqual(G.settings.where, 'us');
  assert.ok(E.poolFor(G).every(id => !B[id].more), 'the whole U.S. never deals a state-game-only question');
  assert.ok(E.dispatchAct(G, 'set', { key: 'where', val: 'states' }));
  assert.strictEqual(E.dispatchAct(G, 'set', { key: 'where', val: 'mars' }), false, 'only two places to ask about');
  assert.ok(E.poolFor(G).every(id => !!B[id].st), 'state by state asks only about states');
  assert.ok(E.dispatchAct(G, 'set', { key: 'states', val: ['UT', 'ZZ', 'ID', 'UT'] }));
  assert.deepStrictEqual(Array.from(G.settings.states), ['ID', 'UT'], 'unknown codes and repeats drop out');
  assert.ok(E.poolFor(G).every(id => B[id].st === 'UT' || B[id].st === 'ID'));
  G.settings.rounds = 10;
  assert.ok(E.dispatchAct(G, 'start', { now: 0 }));
  const d = G.deck.map((/** @type {string} */ id) => B[id]);
  assert.strictEqual(d.length, 10);
  assert.strictEqual(new Set(d.map(q => q.k || q.id)).size, 10, 'no question type twice in one game');
  const ut = d.filter(q => q.st === 'UT').length;
  assert.strictEqual(ut, 5, 'two states share ten rounds evenly, got Utah ' + ut);
});

test('state games: every state spreads the rounds, and a narrow table plays as many rounds as it has', () => {
  const { E } = load();
  const B = realBank();
  const G = E.newGame(12); G.bank = B; E.addPlayer(G, 'p1', 'Dana'); G.settings.bots = 1; E.syncBots(G);
  E.dispatchAct(G, 'set', { key: 'where', val: 'states' });
  E.dispatchAct(G, 'set', { key: 'rounds', val: 10 });
  E.dispatchAct(G, 'start', { now: 0 });
  assert.strictEqual(new Set(G.deck.map((/** @type {string} */ id) => B[id].st)).size, 10, 'ten rounds, ten different states');
  // DC and only Coverage: fewer than ten questions (no counties, so no county question), so a ten-round game runs that short
  const H = E.newGame(13); H.bank = B; E.addPlayer(H, 'p1', 'Dana'); H.settings.bots = 1; E.syncBots(H);
  E.dispatchAct(H, 'set', { key: 'where', val: 'states' });
  E.dispatchAct(H, 'set', { key: 'states', val: ['DC'] });
  for (const c of ['Workforce', 'Hospitals', 'Money', 'Health']) E.dispatchAct(H, 'set', { key: 'cat', val: c });
  const n = E.poolFor(H).length;
  assert.ok(n >= 1 && n < 10, 'DC coverage questions: ' + n);
  E.dispatchAct(H, 'set', { key: 'rounds', val: 10 });
  E.dispatchAct(H, 'start', { now: 0 });
  assert.strictEqual(E.roundsIn(H), n);
  let now = 0, guard = 0;
  while (H.phase !== 'final' && guard++ < 2000) { now += 1000; E.tick(H, now); }
  assert.strictEqual(H.phase, 'final', 'the game ends when the questions do');
});

test('home turf: one round per home state, spaced through the game, and its closest guess pays double', () => {
  const { E } = load();
  const B = realBank();
  const G = E.newGame(31); G.bank = B; G.settings.bots = 1;
  E.addPlayer(G, 'p1', 'Dana'); E.addPlayer(G, 'p2', 'Sam'); E.addPlayer(G, 'p3', 'Kim'); E.syncBots(G);
  assert.ok(E.dispatchAct(G, 'home', { seat: 'p1', val: 'UT' }));
  assert.ok(E.dispatchAct(G, 'home', { seat: 'p2', val: 'TX' }));
  assert.ok(E.dispatchAct(G, 'home', { seat: 'p3', val: 'UT' }), 'two players can share a home');
  assert.strictEqual(E.dispatchAct(G, 'home', { seat: 'b1', val: 'OH' }), false, 'bots have no home');
  assert.strictEqual(E.dispatchAct(G, 'home', { seat: 'p1', val: 'XX' }), false, 'not a state');
  G.settings.rounds = 7;
  E.dispatchAct(G, 'start', { now: 0 });
  const rounds = Object.keys(G.turf).map(Number).sort((a, b) => a - b);
  assert.deepStrictEqual(rounds, [3, 5], 'two home states, two turf rounds spaced through seven');
  assert.strictEqual(B[G.deck[2]].st, G.turf[3].st, 'the turf round asks about that state');
  assert.deepStrictEqual(Array.from(G.turf[3].seats), ['p1', 'p3'], 'Utah belongs to both Utah players');
  assert.strictEqual(new Set(G.deck).size, 7, 'no question twice');
  // play to round 3; Sam's guess is the closest without going over
  let now = 0, guard = 0;
  while (G.round < 3 && guard++ < 5000) { now += 1000; E.tick(G, now); }
  const a = G.q.a;
  E.dispatchAct(G, 'lock', { seat: 'p1', val: a * 3, now });
  E.dispatchAct(G, 'lock', { seat: 'p2', val: a, now });
  E.dispatchAct(G, 'lock', { seat: 'p3', val: a * 4, now });
  const before = G.players.p2.chips;
  guard = 0; while (G.phase !== 'reveal' && guard++ < 500) { now += 1000; E.tick(G, now); }
  assert.ok(G.last.why.p2.indexOf('home turf +3') > -1, 'the turf bonus: ' + G.last.why.p2.join(', '));
  assert.ok(G.players.p2.chips - before >= 6, 'closest guess plus home turf');
  assert.deepStrictEqual(Array.from(G.last.turf.won), ['p2'], 'Sam took the Utah players\' home turf');
});

test('home turf off deals no turf rounds; the reveal strip lines up every state, low to high', () => {
  const { E } = load();
  const B = realBank();
  const G = E.newGame(32); G.bank = B; G.settings.bots = 1;
  E.addPlayer(G, 'p1', 'Dana'); E.syncBots(G);
  E.dispatchAct(G, 'home', { seat: 'p1', val: 'UT' });
  assert.ok(E.dispatchAct(G, 'set', { key: 'turf', val: 'off' }));
  E.dispatchAct(G, 'start', { now: 0 });
  assert.deepStrictEqual(Object.keys(G.turf), [], 'off means off');
  const s = E.spreadFor(G, B['pay-rn-ut']);
  assert.strictEqual(s.length, 51, 'fifty states and DC');
  assert.ok(s.every((p, i) => i === 0 || p[1] >= s[i - 1][1]), 'low to high');
  assert.deepStrictEqual(Array.from(s.find(p => p[0] === 'UT')), ['UT', B['pay-rn-ut'].a]);
  assert.strictEqual(E.spreadFor(G, B['uninsured-county-49035']), null, 'a county per state is not a state strip');
  assert.strictEqual(E.spreadFor(G, B[Object.keys(B).find(id => !B[id].st)]), null, 'a national question has no strip');
});

test('the deal keeps one category from taking the game', () => {
  const { E } = load();
  const B = realBank();
  for (const seed of [41, 42, 43, 44]) {
    const G = E.newGame(seed); G.bank = B; G.settings.bots = 1; E.addPlayer(G, 'p1', 'Dana'); E.syncBots(G);
    E.dispatchAct(G, 'set', { key: 'where', val: 'states' });
    E.dispatchAct(G, 'set', { key: 'states', val: ['UT'] });
    E.dispatchAct(G, 'set', { key: 'rounds', val: 10 });
    E.dispatchAct(G, 'start', { now: 0 });
    /** @type {Record<string, number>} */
    const by = {};
    G.deck.forEach((/** @type {string} */ id) => { by[B[id].cat] = (by[B[id].cat] || 0) + 1; });
    assert.ok(Object.values(by).every(n => n <= 3), 'seed ' + seed + ': ' + JSON.stringify(by));
  }
});

test('state games: a table saved before state games existed still deals', () => {
  const { E } = load();
  const G = E.newGame(14); G.bank = BANK; E.addPlayer(G, 'p1', 'Dana'); G.settings.bots = 1; E.syncBots(G);
  delete G.settings.where; delete G.settings.states;
  assert.ok(E.dispatchAct(G, 'start', { now: 0 }));
  assert.strictEqual(G.settings.where, 'us');
});

function playOut(E, seed) {
  const G = game(E, seed, 4);
  let now = 1000;
  E.dispatchAct(G, 'start', { now });
  let guard = 0;
  while (G.phase !== 'final' && guard++ < 5000) {
    const p = G.players.p1;
    if (G.phase === 'answer' && !p.locked) { E.dispatchAct(G, 'answer', { seat: 'p1', val: Math.round(G.q.a * 0.9), now }); E.dispatchAct(G, 'lock', { seat: 'p1', now }); }
    if (G.phase === 'bet' && !p.locked) { E.dispatchAct(G, 'bet', { seat: 'p1', i: 0, slot: G.slots.length - 1, now }); E.dispatchAct(G, 'lock', { seat: 'p1', now }); }
    now += 250; E.tick(G, now);
  }
  return G;
}

test('a whole game against four bots runs to the final table on the clock, and replays exactly from its seed', () => {
  const { E } = load();
  const A = playOut(E, 42), B = playOut(E, 42), C = playOut(E, 43);
  assert.strictEqual(A.phase, 'final');
  assert.strictEqual(A.round, A.settings.rounds);
  assert.strictEqual(JSON.stringify(E.packState(A)), JSON.stringify(E.packState(B)), 'same seed, same verbs, same game');
  assert.notStrictEqual(JSON.stringify(A.deck), JSON.stringify(C.deck), 'another seed deals another deck');
  assert.ok(E.active(A).every(p => p.chips >= 0), 'chips never go negative');
  assert.ok(E.active(A).some(p => p.bot && p.chips > 0), 'the bots actually play');
  assert.strictEqual(E.packState(A).bank, undefined, 'the bank never rides the wire');
});

test('a phase ends early when everyone is in, and on the clock when someone is not', () => {
  const { E } = load();
  const G = game(E, 5, 1);
  E.dispatchAct(G, 'start', { now: 0 });
  const bot = E.active(G).find(p => p.bot);
  E.dispatchAct(G, 'answer', { seat: 'p1', val: 10, now: 0 }); E.dispatchAct(G, 'lock', { seat: 'p1', now: 0 });
  E.tick(G, bot.plan.at);                                     // the bot locks at its planned moment
  assert.strictEqual(G.phase, 'bet', 'everyone in: straight to the bets');
  E.tick(G, G.deadline + 1);                                  // nobody bet: the clock turns it over
  assert.strictEqual(G.phase, 'reveal');
});

test('the table kit: auto seating hands out chairs in order, and an any-seat verb is stamped with the SENDER\'s chair', async () => {
  const { K } = load();
  const bus = makeBus(); const got = [];
  const mk = (name, extra) => { const T = K.create(Object.assign({ channelPrefix: 'vs-t-', memoKey: 'bp_t_' + name, backend: null, autoSeat: true,
    seats: [{ id: 'p1', label: '1' }, { id: 'p2', label: '2' }, { id: 'p3', label: '3' }], verbSeat: { answer: '*', start: 'host' }, name: () => name,
    envelope: () => ({ save: { n: got.length }, ui: { kind: 't', seq: got.length } }), onState: env => { T.NET.lastUiSeq = env.ui.seq; }, hint: () => {} }, extra || {})); T.setChannelFactory(bus); return T; };
  const H = mk('Host', { dispatch: (act, data, name) => got.push({ act, data, name }) });
  const A = mk('Ann'), B = mk('Bo'), C = mk('Cy'), D = mk('Di');
  assert.ok(H.host());
  assert.strictEqual(H.NET.seat, 'p1', 'the host takes the first chair');
  A.join(H.NET.room, 'Ann'); await flush(); B.join(H.NET.room, 'Bo'); await flush(); C.join(H.NET.room, 'Cy'); await flush(); D.join(H.NET.room, 'Di'); await flush();
  assert.deepStrictEqual(Object.assign({}, H.NET.seats), { p1: 'Host', p2: 'Ann', p3: 'Bo' }, 'chairs in the order they knocked; the rest watch');
  A.act('answer', { val: 7, seat: 'p3' }); await flush();       // Ann tries to answer for Bo's chair
  assert.deepStrictEqual(JSON.parse(JSON.stringify(got.pop())), { act: 'answer', data: { val: 7, seat: 'p2' }, name: 'Ann' }, 'stamped with her own chair');
  C.act('answer', { val: 9 }); await flush();
  assert.strictEqual(got.length, 0, 'a watcher cannot act');
  A.act('start', {}); await flush();
  assert.strictEqual(got.length, 0, 'a host verb from a guest is refused');
});

function makeBus() {
  const ends = [];
  const factory = room => { const ch = { room, cb: null, send(m) { const w = JSON.stringify(m); ends.forEach(o => { if (o !== ch && o.room === room && o.cb) o.cb(JSON.parse(w)); }); }, onmsg(fn) { ch.cb = fn; }, close() { ch.cb = null; } }; ends.push(ch); return ch; };
  return factory;
}
const flush = (ms = 12) => new Promise(r => setTimeout(r, ms));

test('three browsers at one table on a fake bus: every guest\'s copy matches the host\'s after every move', async () => {
  const { E, K } = load();
  const bus = makeBus();
  let HG = null; const copies = {};
  const mk = (name, host) => {
    const T = K.create({ channelPrefix: 'vs-room-', memoKey: 'vs_room_' + name, backend: null, autoSeat: true, seats: E.SEATS, verbSeat: E.VERB_SEAT, wire: 'bp', name: () => name,
      envelope: () => ({ save: HG ? E.packState(HG) : null, ui: { kind: HG ? HG.phase : 'none', seq: HG ? HG.seq : 0 } }),
      onState: env => { T.NET.lastUiSeq = env.ui.seq; copies[name] = E.applyState(copies[name], env.save, BANK); },
      onRoster: () => { if (!host) return; const seats = T.NET.seats; E.SEATS.forEach(s => { if (seats[s.id]) E.addPlayer(HG, s.id, seats[s.id]); }); HG.seq++; T.broadcast(); },
      dispatch: (act, data) => { E.dispatchAct(HG, act, Object.assign({}, data, { now: 5000 })); },
      hint: () => {} });
    T.setChannelFactory(bus); return T;
  };
  HG = E.newGame(99); HG.bank = BANK; HG.settings.bots = 1;
  const H = mk('Host', true); H.host(); E.addPlayer(HG, 'p1', 'Host'); E.syncBots(HG);
  const A = mk('Ann'), B = mk('Bo');
  A.join(H.NET.room, 'Ann'); await flush(); B.join(H.NET.room, 'Bo'); await flush();
  const same = () => { const h = JSON.stringify(E.packState(HG)); for (const n of ['Ann', 'Bo']) assert.strictEqual(JSON.stringify(E.packState(copies[n])), h, n + ' matches the host'); };
  await flush(); same();
  assert.strictEqual(E.active(HG).length, 4, 'host, two guests and a bot');
  H.act('start', {}); await flush(); same();
  assert.strictEqual(HG.phase, 'answer');
  A.act('answer', { val: 80000 }); await flush(); A.act('lock', {}); await flush(); same();
  assert.strictEqual(HG.players.p2.answer, 80000); assert.strictEqual(HG.players.p2.locked, true);
  B.act('answer', { val: 90000 }); await flush(); same();
  H.act('next', {}); await flush(); same();
  assert.strictEqual(HG.phase, 'bet');
  B.act('bet', { i: 0, slot: 1 }); await flush(); same();
  assert.strictEqual(HG.players.p3.bets[0], 1);
  H.act('next', {}); await flush(); same();
  assert.strictEqual(HG.phase, 'reveal');
  assert.ok(copies.Ann.last && copies.Ann.last.win >= 0, 'the guests see the result');
});
