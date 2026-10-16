/**
 * The ventilator builds (2026-10-07, David on the vent walls: "different ventilator types or different ventilator options
 * with the ports on different sides", "an I side and E side or top and bottom or side to side", and "tests that will
 * require one on the right side or left side or ... consider every configuration").
 *
 * Four builds of the vent cart: both ports on one side, both underneath, one on each side, one on top and one underneath.
 * Each flips, so eight ways a cart can face, and every one is held here to setting up and passing on the ICU wall. The
 * dealer picks a build for every ICU wall; Ventilator 8 is the same bed space laid out the other way, where the cart
 * has to stand on the patient's left. Cords, hoses and sampling lines go round parts now, never over them (David on
 * Level 2: "we don't want them overlapping with other devices but they can overlap with other cables").
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = path.join(__dirname, '..', 'src', 'fun', 'headwall', 'index.html');
function load() {
  const html = fs.readFileSync(PAGE, 'utf8');
  const src = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const ctx = { document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' }, window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } }, Date, Intl };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();
const key = (c) => c[0] + ',' + c[1];
const SHEET = ['VB29', 'VB72', 'VB50', 'VB86', 'VB0', 'VB34', 'VB8', 'VB66'];
const sidesOf = (it) => Object.fromEntries(da.portsOf(it).filter((p) => /^(Inspiratory|Expiratory) port$/.test(p.label)).map((p) => [p.label.split(' ')[0], p.s]));

test('four builds: one side, underneath, a port each side, top and bottom; each has a cord and both hoses', () => {
  assert.deepStrictEqual(Array.from(da.VENT_BUILDS), ['vent-cart', 'vent-cart-low', 'vent-cart-split', 'vent-cart-stack']);
  const S = da.newState(da.levelById('v1'));
  const sides = {};
  for (const id of da.VENT_BUILDS) {
    S.cart[id] = 1; const it = da.place(S, id, 10, 6, 0, false).item; assert.ok(it, id + ' stands on the wall');
    sides[id] = sidesOf(it);
    assert.ok(S.tubes.some((t) => t.lead && t.from.uid === it.uid && /power cord/.test(t.name)), id + ' has its cord');
    assert.strictEqual(S.tubes.filter((t) => t.lead && t.from.uid === it.uid && /hose/.test(t.name)).length, 2, id + ' has an oxygen and an air hose');
    da.removeThing(S, it.uid);
  }
  assert.deepStrictEqual(sides['vent-cart'], { Inspiratory: 'E', Expiratory: 'E' });
  assert.deepStrictEqual(sides['vent-cart-low'], { Inspiratory: 'S', Expiratory: 'S' });
  assert.deepStrictEqual(sides['vent-cart-split'], { Inspiratory: 'E', Expiratory: 'W' });
  assert.deepStrictEqual(sides['vent-cart-stack'], { Inspiratory: 'S', Expiratory: 'N' });
});

test('every configuration, four builds each way they face, sets up and passes somewhere on the ICU wall', () => {
  const missing = [];
  for (let b = 0; b < 4; b++) for (const f of [0, 1]) {
    const spots = da.ICU_CART_SPOTS.cart.filter((s) => s[3] === b && s[2] === f);
    const works = spots.some((sp) => {
      const L = da.levelById('icu:VB29'), S = da.newState(L);
      for (const t of S.tubes.filter((t) => !t.lead)) da.removeThing(S, t.uid);
      for (const it of S.items.filter((i) => !i.fixed)) da.removeThing(S, it.uid);
      for (const id of Object.keys(da.DB)) S.cart[id] = 2;
      return da.icuCart(S, sp, { order: { req: L.req } }) && (da.hasBag(S) || !!da.hangBag(S, 'cart')) && da.evaluate(S).ok;   // the wall's own order (its FiO2), and its bag (2026-10-15)
    });
    if (!works) missing.push(da.VENT_BUILDS[b] + (f ? ' flipped' : ''));
  }
  assert.deepStrictEqual(missing, []);
  // and for every kind of ICU order, every build has a spot one way round or the other
  for (const kind of ['cart', 'neb', 'mdi', 'capno']) for (let b = 0; b < 4; b++)
    assert.ok(da.ICU_CART_SPOTS[kind].some((s) => s[3] === b), kind + ' has a spot for ' + da.VENT_BUILDS[b]);
});

test('the dealer spreads ICU walls across every build, both ways, and each one passes', () => {
  const seen = new Set();
  for (let i = 0; i < 120; i++) {
    const L = da.levelById('icu:T' + i); assert.ok(L, 'icu:T' + i + ' deals');
    const S = da.newState(L); da.restore(S, L.solution); assert.ok(da.evaluate(S).ok, 'icu:T' + i + ' passes');
    const v = S.items.find((x) => x.def.vent); if (v && /^vent-cart/.test(v.def.id)) seen.add(v.def.id + (v.f ? ' flipped' : ''));
  }
  assert.strictEqual(seen.size, 8, 'all eight configurations dealt: ' + [...seen].join(', '));
  // the puzzle sheet's eight setup walls, one per configuration
  const sheet = SHEET.map((c) => { const L = da.levelById('icu:' + c), S = da.newState(L); da.restore(S, L.solution); const v = S.items.find((x) => x.def.vent); return v.def.id + (v.f ? ' flipped' : ''); });
  assert.strictEqual(new Set(sheet).size, 8, 'the sheet has one setup wall per configuration: ' + sheet.join(', '));
});

test('Ventilator 8: the bed space laid out the other way, and the cart stands on his left', () => {
  const L = da.levelById('v8'), S = da.newState(L);
  const reds = S.items.filter((i) => i.fixed && i.def.id === 'deco-elec-red').map((i) => i.x);
  assert.deepStrictEqual(Array.from(reds).sort((a, b) => a - b), [0, 1], 'the red outlets are at the left end of the headwall');
  da.restore(S, L.solution);
  const v = S.items.find((x) => x.def.vent), tube = S.items.find((x) => x.def.id === 'pt-ett');
  assert.ok(v.x + 1 < tube.x, 'the cart is left of the bed');
  assert.ok(da.evaluate(S).ok);
  assert.deepStrictEqual(Array.from(da.PATHS.find((p) => p.id === 'vent').walls).slice(0, 2), ['v1', 'v8'], 'it follows the first setup on the ventilator path');
});

test('a cord, a hose or a sampling line goes round the parts on the wall, never over one', () => {
  const over = [];
  for (const L of da.LEVELS.filter((l) => !l.parked && l.kind !== 'sandbox')) {
    const S = da.newState(L); da.restore(S, L.solution);
    const cells = new Set(); for (const it of S.items) for (const c of da.cellsOf(it)) cells.add(key(c));
    for (const t of S.tubes) if (t.to && t.path && (t.def.t === 'power' || /hose|co2/.test(t.def.kind || '')) && t.path.some((c) => cells.has(key(c)))) over.push(L.id + ': ' + t.name);
  }
  assert.deepStrictEqual(over, []);
  // and a part set down on a cord's run sends the cord round it
  const S = da.newState(da.levelById('v1')); da.ventSetup(S); da.ventPlug(S);
  const cord = S.tubes.find((t) => t.lead && /power cord/.test(t.name) && t.to);
  const mid = cord.path[Math.floor(cord.path.length / 2)];
  S.cart.flowmeter = 1; const fm = da.place(S, 'flowmeter', mid[0], mid[1], 0);
  assert.ok(fm.ok, 'a part can go down on a cord');
  assert.ok(!cord.to || !cord.path.some((c) => key(c) === key(mid)), 'and the cord no longer runs under it');
});
