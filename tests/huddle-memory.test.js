/**
 * Daily Huddle remembers what it dealt (2026-10-20, DECISIONS DH12; plan docs/HU-HUDDLE-MEMORY-PLAN-2026-10-20.md). From
 * board #12 (MEMORY_DAY, Sunday 2026-10-25) a daily keeps off its board every question the dailies dealt in the 60 days
 * before it, takes the question dealt longest ago where a slot has nothing fresh, and carries one normal range at most, none
 * in the three days after one. The memory is the dailies replayed through the same deal, so it needs no player state.
 * What is held here: the eleven boards dealt before the memory, exactly as played; a year of remembering dailies; practice
 * and made boards dealt as they were before the memory; and a later bank version that changes no board before its first day.
 * The year in numbers, before and after: tmp/huddle-year/memory-numbers.md (node tmp/huddle-year/year.js).
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
const RNG = fs.readFileSync(path.join(ROOT, 'src', 'assets', 'js', 'hu-rng.js'), 'utf8');
const BANKFILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'huddle-questions.json'), 'utf8'));
const PINS = JSON.parse(fs.readFileSync(path.join(__dirname, 'huddle-pins.json'), 'utf8'));

// a fresh engine, as a fresh visit loads it: its own bank and an empty memory
function load(list, versions) {
  const ctx = { window: {}, console, Date, Math, JSON, Intl };
  vm.createContext(ctx);
  new vm.Script(RNG, { filename: 'hu-rng.js' }).runInContext(ctx);
  new vm.Script(ENGINE, { filename: 'hd-engine' }).runInContext(ctx);
  const E = ctx.window.HuddleEngine;
  E.setBank(list || BANKFILE.questions, versions || BANKFILE.versions);
  return E;
}
const E = load();
const plain = (x) => JSON.parse(JSON.stringify(x));   // arrays made in the sandbox fail deepStrictEqual against plain ones
const ids = (G) => plain(G.tiles.map((t) => t.q));
// exactly the page's daily (startBoard and doorHtml): today's board, or a past day replayed
const daily = (X, k, mode = 'day') => X.newGame({ id: mode + ':' + k, seed: X.daySeed(k), mode, day: X.dayNumber(k), clock: 0, misses: 0, out: X.dayOut(k) });
const FIRST = E.dayNumber(E.MEMORY_DAY);
const isNorm = (id) => E.question(id).f === 'Normals';
const PINNED = { ...PINS.days, ...PINS.laterDays };

// right answers alone, through the engine's verbs as the page sends them: the top row first, then the rest
function playRight(G) {
  const P = JSON.parse(JSON.stringify(G));
  const order = [...E.TOP, ...[...Array(19).keys()].filter((i) => !E.TOP.includes(i))];
  let t = 1000;
  for (const i of order) {
    if (P.phase === 'done') break;
    E.dispatchAct(P, 'open', { i }, t += 5000);
    const q = E.question(P.tiles[i].q), p = q.t === 'number' ? E.picks(q) : null;
    E.dispatchAct(P, 'answer', { i, v: p ? p.vals[p.right] : q.a }, t += 5000);
  }
  return P.end;
}

test('the memory starts at board #12, Sunday 2026-10-25, and only a daily remembers', () => {
  assert.strictEqual(E.MEMORY_DAY, '2026-10-25');
  assert.strictEqual(FIRST, 12);
  assert.strictEqual(E.MEMORY_DAYS, 60);
  assert.strictEqual(E.memDay('day:2026-10-25', 'day'), '2026-10-25');
  assert.strictEqual(E.memDay('past:2026-11-03', 'past'), '2026-11-03', 'a past day replays with its memory');
  assert.strictEqual(E.memDay('day:2026-10-24', 'day'), '', 'board #11 was dealt without one');
  assert.strictEqual(E.memDay('gen:k3x9q', 'practice'), '');
  assert.strictEqual(E.memDay('my:k3x9q-180-3-b2', 'made'), '');
  assert.strictEqual(E.memDay('day:2026-11-01', 'practice'), '', 'the mode decides as well as the address');
});

test('boards #1 to #11, dealt before the memory, replay exactly as they were played, today and as past boards', () => {
  const days = Object.keys(PINNED).sort();
  assert.deepStrictEqual(days.map((k) => E.dayNumber(k)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'every board before the memory is pinned');
  for (const k of days) {
    assert.deepStrictEqual(ids(daily(E, k)), PINNED[k], k + ': today\'s board as it was dealt');
    assert.deepStrictEqual(ids(daily(E, k, 'past')), PINNED[k], k + ': replayed as a past board');
  }
  // board #12 remembers them as they were dealt: its memory is the eleven pinned boards, each question at its last board
  const m = E.memoryFor(E.MEMORY_DAY), want = new Map();
  days.forEach((k) => PINNED[k].forEach((id) => want.set(id, E.dayNumber(k))));
  assert.deepStrictEqual(plain([...m.last.entries()]).sort(), [...want.entries()].sort());
});

test('the remembering dailies dealt from bank version 3 replay exactly as the push of 2357035 dealt them', () => {
  const days = Object.keys(PINS.memoryDays).sort();
  assert.strictEqual(E.dayNumber(days[0]), FIRST, 'the pins start at board #12');
  let held = 0;
  for (const k of days) {
    if (E.dayBank(k) > 3) continue;   // a later version's days deal its new questions, and the test below holds the days before it
    assert.deepStrictEqual(ids(daily(E, k)), PINS.memoryDays[k], k + ': board #' + E.dayNumber(k) + ' as version 3 dealt it');
    assert.deepStrictEqual(ids(daily(E, k, 'past')), PINS.memoryDays[k], k + ': replayed as a past board');
    held++;
  }
  assert.ok(held >= 4, 'every board from #12 to the day before version 4 is held: ' + held);
});

test('a year of remembering dailies from board #12: 19 tiles that cross on right answers, nothing back inside 60 days but by the oldest-first fallback, one normal range at most', () => {
  const last = new Map();   // question id -> the last board it was on, from board #1
  let lastNorm = 0, fell = 0, tiles = 0;
  for (let d = 1; d < FIRST; d++) PINNED[E.dayAt(d)].forEach((id) => { last.set(id, d); if (isNorm(id)) lastNorm = d; });
  for (let d = FIRST; d < FIRST + 365; d++) {
    const k = E.dayAt(d), G = daily(E, k), b = ids(G);
    assert.strictEqual(E.dayNumber(k), d);
    assert.strictEqual(b.length, 19, k + ': 19 tiles');
    assert.ok(b.every((id) => E.question(id)), k + ': every tile is a question in the bank');
    assert.strictEqual(new Set(b.map((id) => E.question(id).k)).size, 19, k + ': no template twice');
    assert.ok(b.every((id) => (E.question(id).b || 1) <= E.dayBank(k)), k + ': every question is in the day\'s bank');
    assert.strictEqual(playRight(G), 'crossed', k + ': right answers cross the board');
    // the same deal handed the engine's memory names the cells that fell back; worked out here from the boards alone, a
    // question back inside 60 days sits on exactly those cells
    const r = E.deal(E.daySeed(k), E.dayOut(k), '', E.dayBank(k), E.memoryFor(k));
    assert.deepStrictEqual(plain(r.tiles.map((t) => t.q)), b, k + ': the memory deals the page\'s board');
    const back = b.map((id, i) => (last.has(id) && d - last.get(id) <= E.MEMORY_DAYS ? i : -1)).filter((i) => i >= 0);
    assert.deepStrictEqual(back.sort((x, y) => x - y), plain(r.fell).sort((x, y) => x - y), k + ': only a fallback brings a question back inside 60 days');
    fell += r.fell.length; tiles += 19;
    const norms = b.filter(isNorm).length;
    assert.ok(norms <= 1, k + ': ' + norms + ' normal ranges');
    const apart = E.normalsApart(E.dayBank(k));   // four boards apart from #12, two from bank version 4 (DH13)
    if (norms) { assert.ok(d - lastNorm >= apart, k + ': a normal range ' + (d - lastNorm) + ' days after the last, ' + apart + ' at the least'); lastNorm = d; }
    b.forEach((id) => last.set(id, d));
  }
  console.log(`# memory fallbacks: ${fell} of ${tiles} tiles over 365 boards from #${FIRST}`);
  assert.ok(fell <= tiles * 0.01, 'the oldest-first fallback is rare: ' + fell + ' of ' + tiles + ' tiles');
});

test('the memory is the same whatever order a visit deals in, and a past day replays with it', () => {
  const late = E.dayAt(FIRST + 300), mid = E.dayAt(FIRST + 70), early = E.dayAt(FIRST + 5);
  const X = load();   // a fresh visit that opens a board far out first, then earlier ones
  assert.deepStrictEqual(ids(daily(X, late)), ids(daily(E, late)));
  assert.deepStrictEqual(ids(daily(X, early)), ids(daily(E, early)));
  assert.deepStrictEqual(ids(daily(X, mid, 'past')), ids(daily(E, mid)), 'a past board is that day\'s board');
  const Y = load();
  for (const k of [early, mid, late]) assert.deepStrictEqual(ids(daily(Y, k, 'past')), ids(daily(E, k)), k + ': replayed on a fresh visit');
  assert.deepStrictEqual(plain(daily(E, mid)), plain(daily(X, mid)), 'the board saves exactly the same: the memory adds nothing to it');
  assert.ok(!('mem' in daily(E, mid)) && !('fell' in daily(E, mid)));
});

test('Swap on a remembering daily takes a question not dealt lately where one is left, the oldest where none is, and never a second normal range', () => {
  let swaps = 0, stale = 0;
  for (let d = FIRST; d < FIRST + 120; d++) {
    const k = E.dayAt(d), G = daily(E, k), m = E.memoryFor(k), v = E.dayBank(k);
    const onBoard = new Set(G.tiles.map((x) => E.question(x.q).k));
    G.tiles.forEach((t, i) => {
      const to = E.swapFor(G, i);
      if (!to) return;
      swaps++;
      const q = E.question(to);
      assert.ok(q.z === t.z && q.d === t.d && !onBoard.has(q.k), k + ': a swap stays in its zone, its dots and off the board\'s templates');
      if (isNorm(to)) assert.ok(!G.tiles.some((x, c) => c !== i && isNorm(x.q)), k + ': a swap makes a second normal range');
      if (!m.last.has(to)) return;
      // a swap to a question dealt lately: only where every question it could have taken was dealt lately too, and the oldest
      stale++;
      const no = m.norm > d - E.normalsApart(v) || G.tiles.some((x, c) => c !== i && isNorm(x.q));   // where the deal could not have put a normal range
      let could = BANKFILE.questions.filter((x) => x.z === t.z && x.d === t.d && !onBoard.has(x.k) && (x.b || 1) <= v && !(x.gone && v > x.gone));
      if (no && could.some((x) => !isNorm(x.id))) could = could.filter((x) => !isNorm(x.id));
      assert.ok(could.every((x) => m.last.has(x.id)), k + ': swapped to ' + to + ' with a fresh question left');
      assert.strictEqual(m.last.get(to), Math.min(...could.map((x) => m.last.get(x.id))), k + ': the stale swap is the one dealt longest ago');
    });
  }
  console.log(`# swaps to a question dealt in the last 60 days: ${stale} of ${swaps}, each with nothing fresher left`);
  assert.ok(stale <= swaps * 0.05, 'stale swaps are rare: ' + stale + ' of ' + swaps);
});

test('practice and made boards never remember: they deal exactly as they did before the memory', () => {
  for (const b of PINS.noMemory.boards) {
    assert.strictEqual(E.memDay(b.id, b.mode), '');
    const G = E.newGame({ id: b.id, seed: b.seed, mode: b.mode, field: b.field, bank: b.bank, clock: b.clock || 0, misses: b.misses == null ? 3 : b.misses });
    assert.deepStrictEqual(ids(G), b.ids, b.id + ': dealt as before the memory');
  }
  for (const [code, want] of Object.entries(PINS.made)) {
    const m = E.parseMade(code);
    assert.deepStrictEqual(ids(E.newGame({ id: code, seed: m.seed, mode: 'made', clock: m.clock, misses: m.misses, field: m.field, bank: m.bank || 1 })), want, code);
  }
  // 2,400 more, as a fingerprint taken from the engine before the memory (tests/huddle-pins.json, noMemory)
  let h = 0x811c9dc5, n = 0;
  const mix = (s) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } h >>>= 0; };
  for (let s = 1; s <= 120; s++) for (const f of ['', 'rt', 'rn', 'md', 'rx']) for (const bank of [1, 2]) for (const mode of ['practice', 'made']) {
    mix(ids(E.newGame({ id: mode === 'made' ? 'my:x' : 'gen:x', seed: (s * 2654435761) >>> 0, mode, field: f, bank, clock: 0, misses: 3 })).join(',') + ';'); n++;
  }
  assert.deepStrictEqual({ boards: n, fnv: h.toString(16) }, PINS.noMemory.fingerprint);
  // and whatever the memory holds: the same practice board before and after a visit has dealt a year of dailies
  const X = load(), o = { id: 'gen:k3x9q', seed: parseInt('k3x9q', 36), mode: 'practice', clock: 0, misses: 0 };
  const before = ids(X.newGame(o));
  daily(X, E.dayAt(FIRST + 364));
  assert.deepStrictEqual(ids(X.newGame(o)), before);
  assert.deepStrictEqual(ids(X.newGame({ ...o, mode: 'made', id: 'my:k3x9q-0-0' })), ids(E.newGame({ ...o, mode: 'made', id: 'my:k3x9q-0-0' })));
});

test('a later bank version changes no board dealt before its first day, and joins the memory from that day', () => {
  const V = E.bankVersion() + 1, from = E.dayAt(FIRST + 40);
  // a fake version: twelve questions more in every zone, normal ranges among them, at the end of the bank as the builder adds them
  const extra = [];
  for (const z of E.ZONES) {
    const some = BANKFILE.questions.filter((q) => q.z === z.id && !q.gone);
    const pick = some.filter((q) => q.f === 'Normals').slice(0, 2).concat(some.filter((q) => q.f !== 'Normals').slice(0, 10));
    pick.forEach((q) => extra.push({ ...q, id: 'fake-' + q.id, k: 'fake-' + q.k, b: V }));
  }
  const F = load(BANKFILE.questions.concat(extra), { ...BANKFILE.versions, [V]: from });
  assert.strictEqual(F.bankVersion(), V);
  assert.strictEqual(F.dayBank(from), V);
  let changed = 0, fakes = 0;
  for (let d = 1; d <= F.dayNumber(from) + 30; d++) {
    const k = F.dayAt(d), a = ids(daily(E, k)), b = ids(daily(F, k));
    const fake = b.filter((id) => id.startsWith('fake-')).length;
    if (k < from) {
      assert.deepStrictEqual(b, a, k + ': a board before the new version deals as it did');
      assert.strictEqual(fake, 0);
    } else { fakes += fake; if (JSON.stringify(a) !== JSON.stringify(b)) changed++; }
  }
  assert.ok(fakes > 0, 'the new questions are dealt from their first day: ' + fakes);
  assert.ok(changed > 0, 'and the boards from that day change: ' + changed);
  // a fresh visit that opens the new version's days first still deals the days before it as they were
  const G = load(BANKFILE.questions.concat(extra), { ...BANKFILE.versions, [V]: from });
  daily(G, F.dayAt(F.dayNumber(from) + 30));
  const k = F.dayAt(F.dayNumber(from) - 1);
  assert.deepStrictEqual(ids(daily(G, k, 'past')), ids(daily(E, k)), k + ': the day before the version, replayed after it');
});
