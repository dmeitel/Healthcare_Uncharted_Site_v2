/**
 * Daily Huddle's save string (2026-10-19, .claude/rules/games.md, Saves and the wire). A board packs to one plain object
 * (packSave) and unpacks from it (applySave), both headless; the string form is the kit's hu-save.js, 'HUDH1.' and the
 * board deflated, or 'HUDH1R.' where a browser cannot deflate. This browser keeps each board as a record: the string, and
 * beside it the four fields the Fun shelf reads in the clear (src/assets/js/fun-today.js). A board kept before the string
 * was the plain state; it still loads, and its next save writes the record.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const kit = (/** @type {string} */ f) => fs.readFileSync(path.join(ROOT, 'src', 'assets', 'js', f), 'utf8');
const PAGE = fs.readFileSync(path.join(ROOT, 'src', 'fun', 'daily-huddle', 'index.html'), 'utf8');
const ENGINE = PAGE.match(/<script id="hd-engine">([\s\S]*?)<\/script>/)[1];
const UI = (() => { const at = PAGE.indexOf('<script>', PAGE.indexOf('<script id="hd-engine">') + 1); return PAGE.slice(at + '<script>'.length, PAGE.indexOf('</script>', at)); })();
const BANKFILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'huddle-questions.json'), 'utf8'));
const plain = (/** @type {any} */ x) => JSON.parse(JSON.stringify(x));   // arrays made in a sandbox fail deepStrictEqual against plain ones

/**
 * The page's scripts in a sandbox, in the page's order: the generator, the save kit, the engine and (page: true) the page
 * script with its test hook. deflate: false is a browser with no CompressionStream. stored is this browser's storage.
 * @param {{ deflate?: boolean, page?: boolean, stored?: Record<string, string> }} [o]
 */
function load({ deflate = true, page = false, stored = {} } = {}) {
  /** @type {Record<string, string>} */
  const mem = { ...stored };
  const localStorage = {
    get length() { return Object.keys(mem).length; },
    key: (/** @type {number} */ i) => Object.keys(mem)[i] ?? null,
    getItem: (/** @type {string} */ k) => (k in mem ? mem[k] : null),
    setItem: (/** @type {string} */ k, /** @type {any} */ v) => { mem[k] = String(v); },
    removeItem: (/** @type {string} */ k) => { delete mem[k]; },
  };
  /** @type {any} */
  const ctx = { window: { __UG_TEST: true }, document: {}, console, Date, Math, JSON, Intl, btoa, atob, localStorage,
    ...(deflate ? { Blob, Response, CompressionStream, DecompressionStream } : {}) };
  vm.createContext(ctx);
  for (const f of ['hu-rng.js', 'hu-save.js']) new vm.Script(kit(f), { filename: f }).runInContext(ctx);
  new vm.Script(ENGINE, { filename: 'hd-engine' }).runInContext(ctx);
  const E = ctx.window.HuddleEngine;
  E.setBank(BANKFILE.questions, BANKFILE.versions);
  if (page) new vm.Script(UI, { filename: 'daily-huddle' }).runInContext(ctx);
  return { E, HUSave: ctx.window.HUSave, hd: ctx.window.__hd, mem };
}

/** board #6 played part way: one tile held, one missed, a third open with a lifeline used on it */
function midBoard(/** @type {any} */ E) {
  const k = '2026-10-19';
  const G = E.newGame({ id: 'day:' + k, seed: E.daySeed(k), mode: 'day', day: E.dayNumber(k), clock: 0, misses: 0, out: E.dayOut(k) });
  const q = (/** @type {number} */ i) => E.question(G.tiles[i].q);
  const wrong = (/** @type {any} */ x) => (x.t === 'choice' ? (x.a + 1) % x.o.length : x.a * 10 + 1000);
  const [a, b, c] = E.TOP;
  E.dispatchAct(G, 'open', { i: a }, 1000);
  E.dispatchAct(G, 'answer', { i: a, v: q(a).a }, 4000);
  E.dispatchAct(G, 'open', { i: b }, 5000);
  E.dispatchAct(G, 'answer', { i: b, v: wrong(q(b)) }, 9000);
  E.dispatchAct(G, 'open', { i: c }, 10000);
  const life = E.LIFELINES.find((/** @type {string} */ L) => E.canLife(G, L));
  E.dispatchAct(G, life, { i: c }, 11000);
  assert.strictEqual(G.phase, 'play');
  assert.deepStrictEqual(plain([G.held, G.closed, G.open]), [[a], [b], c]);
  assert.ok(G.life && G.life[life], 'the board carries a lifeline, so the save does too');
  return G;
}

test('a board mid-play packs to plain data, round-trips through the save string, and plays on as the one it came from', async () => {
  const { E, hd } = load({ page: true });
  assert.strictEqual(hd.packSave, E.packSave, 'the test hook carries packSave');
  assert.strictEqual(hd.applySave, E.applySave, 'the test hook carries applySave');
  const G = midBoard(E);
  const packed = E.packSave(G);
  assert.notStrictEqual(packed, G, 'a pack is a copy, never the live board');
  assert.strictEqual(JSON.stringify(packed), JSON.stringify(G), 'nothing is lost through JSON');
  assert.ok(packed.tiles.every((/** @type {any} */ t) => typeof t.q === 'string' && E.question(t.q)), 'tiles travel as question ids');

  const str = await E.saveString(G);
  assert.match(str, /^HUDH1\.[A-Za-z0-9+/=]+$/, 'the kit\'s form: the prefix, then base64 of the deflated board');
  assert.ok(str.length < JSON.stringify(G).length, 'the string is smaller than the board it carries');
  const back = await E.readSave(str);
  assert.deepStrictEqual(plain(back), plain(G));
  assert.strictEqual(await E.saveString(back), str, 'the same board makes the same string');

  // the restored board and the original take the same answer and stay the same board
  const i = G.open, v = E.question(G.tiles[i].q).a;
  E.dispatchAct(G, 'answer', { i, v }, 15000);
  E.dispatchAct(back, 'answer', { i, v }, 15000);
  assert.deepStrictEqual(plain(back), plain(G));
  assert.strictEqual(await E.saveString(back), await E.saveString(G));
});

test('a browser that cannot deflate writes the HUDH1R. form, and every browser reads it', async () => {
  const raw = load({ deflate: false }), full = load();
  const G = midBoard(raw.E);
  const str = await raw.E.saveString(G);
  assert.ok(str.startsWith('HUDH1R.'), 'the uncompressed fallback prefix');
  assert.deepStrictEqual(plain(await full.E.readSave(str)), plain(G));
  assert.deepStrictEqual(plain(await raw.E.readSave(str)), plain(G));
});

test('a string that is not a Daily Huddle board reads as no board', async () => {
  const { E, HUSave } = load();
  assert.strictEqual(await E.readSave(''), null);
  assert.strictEqual(await E.readSave('hello there'), null);
  assert.strictEqual(await E.readSave(await HUSave.codec('HUG1.').encode(E.packSave(midBoard(E)))), null, 'another game\'s string');
  const gone = { ...E.packSave(midBoard(E)) };
  gone.tiles = gone.tiles.map((/** @type {any} */ t) => ({ ...t, q: 'gone' }));
  assert.strictEqual(await E.readSave(await HUSave.codec('HUDH1.').encode(gone)), null, 'a board whose questions left the bank');
  assert.strictEqual(await E.readRecord(null), null);
  assert.strictEqual(await E.readRecord({ save: 'HUDH1.@@@' }), null);
});

test('a board kept before the save string still loads, and its next save writes the record', async () => {
  const { E } = load();
  const G = midBoard(E);
  // what this browser held before 2026-10-19: store.set wrote JSON.stringify(packSave(G))
  const old = JSON.stringify(E.packSave(G));
  assert.deepStrictEqual(plain(await E.readRecord(JSON.parse(old))), plain(G), 'the engine reads the old form');

  const before = load({ page: true, stored: { 'hd-run:day:2026-10-19': old, 'hd-run:gen:zz': 'null', 'hd-run:gen:yy': '{not json', 'hd-field': '"rt"' } });
  await before.hd.readKept();
  assert.deepStrictEqual(plain(before.hd.kept('day:2026-10-19')), plain(G), 'the page reads the old form at boot');
  assert.strictEqual(before.hd.kept('gen:zz'), null);
  assert.strictEqual(before.hd.kept('gen:yy'), null, 'a record that does not read is no board, not a broken page');

  await before.hd.keep('day:2026-10-19', before.hd.kept('day:2026-10-19'));
  const rec = JSON.parse(before.mem['hd-run:day:2026-10-19']);
  assert.deepStrictEqual(Object.keys(rec), ['save', 'phase', 'end', 't0', 't1'], 'the string, and the four fields the Fun shelf reads');
  assert.ok(rec.save.startsWith('HUDH1.'));
  assert.deepStrictEqual([rec.phase, rec.end, rec.t0, rec.t1], [G.phase, G.end, G.t0, G.t1]);
  assert.deepStrictEqual(plain(await E.readRecord(rec)), plain(G));

  const after = load({ page: true, stored: { 'hd-run:day:2026-10-19': before.mem['hd-run:day:2026-10-19'] } });
  await after.hd.readKept();
  assert.deepStrictEqual(plain(after.hd.kept('day:2026-10-19')), plain(G), 'the new form loads on the next visit');
});

test('a slow string never lands over a newer write, and Start over clears at once', async () => {
  const { E, hd, mem } = load({ page: true });
  const G = midBoard(E), id = 'day:2026-10-19', key = 'hd-run:' + id;
  const first = hd.keep(id, G);
  const cleared = hd.keep(id, null);
  assert.strictEqual(mem[key], 'null', 'Start over clears the board in this browser at once');
  assert.strictEqual(hd.kept(id), null);
  await Promise.all([first, cleared]);
  assert.strictEqual(mem[key], 'null', 'the string made before Start over does not bring the board back');

  const H = E.applySave(E.packSave(G));
  E.dispatchAct(H, 'answer', { i: H.open, v: E.question(H.tiles[H.open].q).a }, 15000);
  await Promise.all([hd.keep(id, G), hd.keep(id, H)]);
  assert.deepStrictEqual(plain(await E.readRecord(JSON.parse(mem[key]))), plain(H), 'the newest board is the one kept');
  assert.deepStrictEqual(plain(hd.kept(id)), plain(H));
});

/** the Fun shelf's script (src/assets/js/fun-today.js) on one Daily Huddle card, on a fixed day, against this storage */
function shelf(/** @type {Record<string, string>} */ stored, /** @type {Date} */ now) {
  const el = () => ({ textContent: '', innerHTML: '' });
  const parts = { num: el(), state: el(), go: el() };
  /** @type {Record<string, string>} */
  const attrs = { 'data-daily': 'huddle', 'data-one': '2026-10-14', 'data-word': 'Board' };
  const card = { getAttribute: (/** @type {string} */ k) => attrs[k], querySelector: (/** @type {string} */ s) => (s === '[data-num]' ? parts.num : s === '[data-state]' ? parts.state : parts.go) };
  const RealDate = Date;
  class FixedDate extends RealDate { constructor(/** @type {any} */ a) { super(a === undefined ? now.getTime() : a); } static now() { return now.getTime(); } }
  vm.runInNewContext(kit('fun-today.js'), {
    Date: FixedDate, Intl, Math, JSON,
    localStorage: { getItem: (/** @type {string} */ k) => (k in stored ? stored[k] : null) },
    document: { querySelectorAll: () => [card], getElementById: () => null },
  });
  return [parts.state.innerHTML, parts.go.textContent];
}

test('the Fun shelf reads a kept record as it read the plain state', async () => {
  const { E } = load();
  const now = new Date('2026-10-19T18:00:00Z');   // noon in Denver, board #6
  const G = midBoard(E);
  const key = 'hd-run:day:2026-10-19';
  assert.deepStrictEqual(shelf({ [key]: JSON.stringify(await E.keepRecord(G)) }, now), ['<b>In progress</b>', 'Continue']);
  assert.deepStrictEqual(shelf({ [key]: JSON.stringify(E.packSave(G)) }, now), ['<b>In progress</b>', 'Continue'], 'the old form, as before');
  const T = E.newGame({ id: 'day:2026-10-19', seed: E.daySeed('2026-10-19'), mode: 'day', day: 6, clock: 120, misses: 0, out: E.dayOut('2026-10-19') });
  E.dispatchAct(T, 'open', { i: E.TOP[0] }, 0);
  E.dispatchAct(T, 'tick', {}, 200000);
  assert.strictEqual(T.end, 'time');
  assert.deepStrictEqual(shelf({ [key]: JSON.stringify(await E.keepRecord(T)) }, now), ['<b>Out of time</b>', 'See your result']);
});
