/**
 * hu-rng.js: the seeded generator the game engines draw from. The contract: same seed, same
 * sequence; the state saves and restores to the exact draw; a string seeds deterministically.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadKit() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-rng.js'), 'utf8');
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  new vm.Script(src, { filename: 'hu-rng.js' }).runInContext(ctx);
  assert.ok(ctx.window.HURng, 'the kit hangs off window');
  return ctx.window.HURng;
}

test('the same seed gives the same sequence, a different seed does not', () => {
  const kit = loadKit();
  const a = kit.make(12345), b = kit.make(12345), c = kit.make(12346);
  const A = Array.from({ length: 20 }, () => a()), B = Array.from({ length: 20 }, () => b()), C = Array.from({ length: 20 }, () => c());
  assert.deepStrictEqual(A, B);
  assert.notDeepStrictEqual(A, C);
  for (const x of A) assert.ok(x >= 0 && x < 1, 'in [0, 1)');
});

test('state saves and restores to the exact draw', () => {
  const kit = loadKit();
  const rng = kit.make('table QMDA');
  for (let i = 0; i < 37; i++) rng();
  const st = rng.state();
  assert.strictEqual(st.n, 37);
  const nextFive = Array.from({ length: 5 }, () => rng());
  const again = kit.make(0).restore(JSON.parse(JSON.stringify(st)));
  assert.deepStrictEqual(again.state(), st, 'a restored generator reports the seed and position it was given, not the throwaway seed');
  assert.deepStrictEqual(Array.from({ length: 5 }, () => again()), nextFive, 'restored generator continues the same sequence');
  assert.throws(() => kit.make(1).restore(null));
});

test('int, pick and chance stay inside their bounds and follow the seed', () => {
  const kit = loadKit();
  const rng = kit.make(7);
  const ints = Array.from({ length: 500 }, () => rng.int(3, 5));
  assert.ok(ints.every(v => v >= 3 && v <= 5 && Number.isInteger(v)));
  assert.ok(ints.includes(3) && ints.includes(5), 'both ends are reachable');
  const list = ['ed', 'icu', 'or'];
  assert.ok(Array.from({ length: 50 }, () => rng.pick(list)).every(v => list.includes(v)));
  assert.strictEqual(kit.make(7).chance(1), true);
  assert.strictEqual(kit.make(7).chance(0), false);
});

test('a string seeds deterministically and a fresh seed is a 32-bit integer', () => {
  const kit = loadKit();
  assert.strictEqual(kit.seedFrom('hello'), kit.seedFrom('hello'));
  assert.notStrictEqual(kit.seedFrom('hello'), kit.seedFrom('hellp'));
  assert.strictEqual(kit.make('hello')(), kit.make(kit.seedFrom('hello'))());
  const s = kit.freshSeed();
  assert.ok(Number.isInteger(s) && s >= 0 && s < 2 ** 32);
});
