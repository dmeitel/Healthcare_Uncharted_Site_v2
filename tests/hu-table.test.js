/**
 * The table kit on its own: a host and a guest on a fake bus, no game page. What the games' table
 * tests take for granted, the kit has to guarantee; and one thing they cannot stage, the host's
 * join window, is staged here with a host end that is deaf until told otherwise.
 *
 * The window (found by scripts/phone-qa.js, 2026-09-20): a guest's first knock and its one-shot seat
 * claim went out before the host's relay channel had joined, so nobody heard them; the host's next
 * queued state broadcast then reached the guest and stopped its knocking. The guest sat at a table
 * that did not list it, unseated, and every move came back "That is the Wall B seat."
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadKit() {
  const ctx = {
    window: { addEventListener() {} }, navigator: {}, console, setTimeout, clearTimeout,
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
    Date, Promise,
  };
  vm.createContext(ctx);
  new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-table.js'), 'utf8'), { filename: 'hu-table.js' }).runInContext(ctx);
  assert.ok(ctx.window.HUTable && typeof ctx.window.HUTable.create === 'function', 'the kit exported create');
  return ctx.window.HUTable;
}

/** a bus that JSON-clones every message and can make any end deaf for a while */
function makeBus() {
  const ends = [], deaf = new Set();
  const factory = room => {
    const ch = {
      room, cb: null,
      send(m) { const wire = JSON.parse(JSON.stringify(m)); ends.forEach(o => { if (o !== ch && o.room === room && o.cb && !deaf.has(o)) o.cb(JSON.parse(JSON.stringify(wire))); }); },
      onmsg(fn) { ch.cb = fn; },
      close() { ch.cb = null; },
    };
    ends.push(ch);
    return ch;
  };
  factory.ends = ends; factory.deaf = deaf;
  return factory;
}
const flush = (ms = 15) => new Promise(r => setTimeout(r, ms));

function makePlayer(HUTable, bus, name, opts) {
  const state = { seq: 0, got: [] };
  const T = HUTable.create(Object.assign({
    channelPrefix: 'kit-test-', memoKey: 'kit_test_' + name, backend: null,
    seats: [{ id: 'b', label: 'Wall B', desc: '' }], verbSeat: { wall: 'b' },
    name: () => name,
    envelope: () => ({ save: { by: name }, ui: { kind: 'test', seq: ++state.seq } }),
    onState: env => { T.NET.lastUiSeq = env.ui.seq; state.got.push(env); },
    lobby: () => { if (T.NET.mode === 'guest' && !T.NET.seat) T.claim('b'); },   // the assembly game's one guest, one chair
    hint: () => {},
  }, opts || {}));
  T.setChannelFactory(bus);
  return { T, state };
}

test('a knock the host hears seats the guest on the way in', async () => {
  const K = loadKit(), bus = makeBus();
  const A = makePlayer(K, bus, 'Dave'), B = makePlayer(K, bus, 'Sam');
  assert.ok(A.T.host(), 'hosted');
  assert.ok(B.T.join(A.T.NET.room, 'Sam'), 'knocked');
  await flush();
  assert.deepStrictEqual(Array.from(A.T.NET.roster), ['Dave', 'Sam']);
  assert.strictEqual(A.T.NET.seats.b, 'Sam');
  assert.strictEqual(B.T.NET.seat, 'b');
  assert.ok(B.state.got.length >= 1, 'the guest holds the host state');
});

test('a knock into the host\'s join window is repeated until the roster names the guest, and the seat claim with it', async () => {
  const K = loadKit(), bus = makeBus();
  const A = makePlayer(K, bus, 'Dave'), B = makePlayer(K, bus, 'Sam');
  assert.ok(A.T.host(), 'hosted');
  const hostEnd = bus.ends[0];
  bus.deaf.add(hostEnd);                                   // the host's channel has not joined yet
  assert.ok(B.T.join(A.T.NET.room, 'Sam'), 'knocked into silence');
  await flush();
  assert.deepStrictEqual(Array.from(A.T.NET.roster), ['Dave'], 'the host heard nothing');
  A.T.broadcast();                                         // the host's own queued state goes out as its channel joins
  await flush();
  assert.ok(B.T.NET.lastUiSeq >= 0, 'the guest received a state');
  assert.ok(!B.T.NET.roster.includes('Sam'), 'a state that does not list the guest');
  assert.strictEqual(B.T.NET.seat, null, 'and no seat');
  bus.deaf.delete(hostEnd);                                // now the host can hear
  await flush(800);                                        // one knock interval
  assert.deepStrictEqual(Array.from(A.T.NET.roster), ['Dave', 'Sam'], 'the repeated knock was heard');
  assert.strictEqual(A.T.NET.seats.b, 'Sam', 'the claim was sent again and honored');
  assert.strictEqual(B.T.NET.seat, 'b', 'the guest knows its chair');
});

test('a guest who chose Observer is not re-seated by the retry', async () => {
  const K = loadKit(), bus = makeBus();
  const A = makePlayer(K, bus, 'Dave'), B = makePlayer(K, bus, 'Sam', { lobby: () => {} });
  A.T.host(); B.T.join(A.T.NET.room, 'Sam');
  await flush();
  B.T.claim('b'); await flush();
  assert.strictEqual(A.T.NET.seats.b, 'Sam');
  B.T.claim('none'); await flush();
  assert.strictEqual(A.T.NET.seats.b, undefined, 'the chair is open again');
  A.T.broadcast(); await flush();
  assert.strictEqual(A.T.NET.seats.b, undefined, 'and stays open after the next state');
  assert.strictEqual(B.T.NET.seat, null);
});
