/**
 * Headwall, THE BAG (2026-10-15). David: "On any patient with an artificial airway we have to have a bag on the headwall,
 * it can either be missing and have to be placed on the wall like everything else, or it can already be on the wall and
 * fill in space that has to be worked around." Asked whether it has to be hooked to oxygen: "On the wall is enough."
 *   1. A wall with an ET tube or a trach that holds to the rule fails without a resuscitation bag on the wall and says so;
 *      with one it passes, hooked up or not. A wall with no artificial airway never asks for one.
 *   2. Every written airway wall carries the bag: on the cart (Level 4, Ventilators 1 and 8) or already hanging (the
 *      rest). Ventilator 7 at home keeps its own backup rule, which already asks for the bag.
 *   3. Every dealt airway wall carries it too, both ways across the deal, and its stored answer has it on the wall. A daily
 *      wall before #14 has none: the walls already played stay as they were (the pins hold the rest).
 *   4. A shift's bag hangs from its first wall at one spot, clear of every wall's build, and stays.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'fun', 'headwall', 'index.html'), 'utf8');
  const src = html.slice(html.indexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
    Date, Intl,
  };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(src, { filename: 'headwall.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();
const dayOf = (n) => new Date(Date.UTC(2026, 9, 3) + (n - 1) * 86400000).toISOString().slice(0, 10);
const solved = (L) => { const S = da.newState(L); da.restore(S, L.solution); return S; };
const bagOf = (S) => S.items.find((i) => i.def.id === 'bag-bvm');
const says = (ev) => ev.lines.map((l) => l.t).join(' ');

test('an airway wall fails without a bag on the wall and says so; with one it passes; no other wall asks', () => {
  const S = solved(da.levelById('v1'));
  assert.ok(da.evaluate(S).ok, 'Ventilator 1, as answered, passes');
  assert.ok(!bagOf(S).fixed, 'its bag came off the cart');
  da.removeThing(S, bagOf(S).uid);
  const ev = da.evaluate(S);
  assert.ok(!ev.ok); assert.strictEqual(ev.lines[0].t, da.BAG_WHY, 'the only thing wrong is the bag, and the screen says it');
  assert.ok(S.cart['bag-bvm'] > 0, 'it went back on the cart, to go up again');
  for (const id of ['l2', 'v6', 't3']) {
    const L = da.levelById(id); assert.ok(!da.airwayWall(L) && !L.bag, id + ' has no artificial airway and no bag rule');
    assert.ok(da.evaluate(solved(L)).ok, id + ' passes with no bag');
  }
});

test('every written airway wall carries the bag, on the cart or already hanging, and its answer passes with it', () => {
  const want = { l3: 'cart', v1: 'cart', v8: 'cart', v2: 'wall', v3: 'wall', v4: 'wall', v5: 'wall', vf1: 'wall', vf2: 'wall', vf3: 'wall' };
  const airway = JSON.parse(JSON.stringify(da.LEVELS.filter((L) => da.airwayWall(L) && L.id !== 'v7').map((L) => L.id))).sort();   // out of the game's sandbox
  assert.deepStrictEqual(airway, Object.keys(want).sort(), 'the written airway walls are these');
  for (const [id, mode] of Object.entries(want)) {
    const L = da.levelById(id), fresh = da.newState(L);
    assert.strictEqual(L.bag, mode, id + ' carries the bag ' + (mode === 'cart' ? 'on the cart' : 'already hanging'));
    if (mode === 'cart') assert.ok(L.cart.some((c) => c[0] === 'bag-bvm') && !da.hasBag(fresh), id + ': on the cart, not on the wall yet');
    else assert.ok(bagOf(fresh) && bagOf(fresh).fixed, id + ': hanging when the wall opens, fixed, to be worked around');
    const S = solved(L); assert.ok(da.hasBag(S) && da.evaluate(S).ok, id + ': the answer has it on the wall and passes');
  }
  assert.ok(da.LEVELS.find((L) => L.id === 'v7').cart.some((c) => c[0] === 'bag-bvm'), 'Ventilator 7 keeps its bag under the home rule');
});

test('every dealt airway wall carries the bag, both ways across the deal, from daily wall #14 on', () => {
  const ids = [
    ...Array.from({ length: 40 }, (_, i) => 'icu:BG' + i),
    ...Array.from({ length: 60 }, (_, i) => 'gen:BG' + i),
    ...Array.from({ length: 12 }, (_, i) => 'rehab:BG' + i),
    ...Array.from({ length: 90 }, (_, i) => 'day:' + dayOf(da.BAG_DAY + i)),
    'my:trach.12.40.far.left.0.HU3',
  ];
  const modes = { cart: 0, wall: 0 }, missing = [];
  let airway = 0;
  for (const id of ids) {
    const L = da.levelById(id); if (!L || !da.airwayWall(L) || L.kind === 'shift') continue;
    airway++;
    if (!L.bag) { missing.push(id); continue; }
    modes[L.bag]++;
    const S = solved(L), ev = da.evaluate(S);
    assert.ok(da.hasBag(S) && ev.ok, id + ': the stored answer has the bag up and passes (' + says(ev) + ')');
    const fresh = da.newState(L);
    if (L.bag === 'cart') assert.ok(!da.hasBag(fresh) && L.cart.some((c) => c[0] === 'bag-bvm'), id + ': the bag waits on the cart');
    else assert.ok(bagOf(fresh) && bagOf(fresh).fixed, id + ': the bag already hangs, fixed');
  }
  assert.deepStrictEqual(missing, [], 'airway walls dealt with no bag');
  assert.ok(airway >= 40, 'the sample holds enough airway walls to mean something (' + airway + ')');
  assert.ok(modes.cart >= 8 && modes.wall >= 8, 'both ways come up across the deal (' + JSON.stringify(modes) + ')');
  for (let n = 1; n < da.BAG_DAY; n++) assert.ok(!da.levelById('day:' + dayOf(n)).bag, 'daily wall #' + n + ' was played before the bag and stays as it was');
});

test("a shift's bag hangs from its first wall at one spot, clear of every wall's build, and stays", () => {
  let seen = 0;
  for (let i = 0; i < 60 && seen < 3; i++) {
    const code = 'BAG' + i, plan = da.shiftPlanOf(code);
    if (!plan || !plan.walls.some(da.airwayWall)) continue;
    seen++;
    assert.strictEqual(plan.bag, 'wall', code + ': the bag already hangs');
    const spots = new Set();
    for (let k = 0; k < (plan.len || da.SHIFT_LEN); k++) {
      const L = da.shiftLevel(code, k), S = solved(L), b = bagOf(S);
      assert.ok(b && b.fixed, code + ' wall ' + (k + 1) + ': the bag is on the wall');
      spots.add(b.x + ',' + b.y);
      if (k < plan.walls.length) assert.ok(da.evaluate(S).ok, code + ' wall ' + (k + 1) + ': its answer passes with the bag where it hangs');
    }
    assert.strictEqual(spots.size, 1, code + ': one spot for the whole shift');
    assert.ok(bagOf(da.newState(da.shiftLevel(code, 0))), code + ': it hangs when the first wall opens');
  }
  assert.ok(seen >= 1, 'a shift with an airway was dealt to check');
});
