/**
 * Device Assembly, Stage A (2026-10-03): the dealt walls. David: walls that "vary from realistic to completely
 * insane", with jokes like no oxygen, no air, only suction, and a bottle or a pump brought in (DECISIONS N3).
 * The generator builds its own solution through the engine before anyone sees a wall, so these tests hold the
 * promises that make a dealt wall fair: the same seed is the same wall everywhere, every wall it deals is solvable
 * from its own cart at its own par, and the twists do what their names say.
 * Plan: docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md, A2 and A3.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const PAGE = path.join(__dirname, '..', 'src', 'secret-menu', 'device-assembly', 'index.html');
  const html = fs.readFileSync(PAGE, 'utf8');
  const open = html.indexOf('<script>'), close = html.lastIndexOf('</script>');
  const src = html.slice(open + '<script>'.length, close);
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } },
    Date, Intl,
  };
  vm.createContext(ctx);
  // the shared kit loads first, the way the page's <script src> tags do; both hang off window
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();
const deal = (seed) => da.genWall(seed, { id: 'gen:' + seed, kicker: 'Test wall' });
const SEEDS = Array.from({ length: 160 }, (_, i) => 'test|' + i);

test('the same seed deals the same wall: order, room, cart, par and the solution, byte for byte', () => {
  for (const seed of SEEDS.slice(0, 25)) {
    const a = deal(seed), b = load().genWall(seed, { id: 'gen:' + seed, kicker: 'Test wall' });
    assert.ok(a && b, seed + ' deals');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(a.req)), JSON.parse(JSON.stringify(b.req)), seed + ': the order');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(a.cart)), JSON.parse(JSON.stringify(b.cart)), seed + ': the cart');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(a.par)), JSON.parse(JSON.stringify(b.par)), seed + ': the par');
    assert.strictEqual(a.gen.solution, b.gen.solution, seed + ': the solution');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(a.room.rail)), JSON.parse(JSON.stringify(b.room.rail)), seed + ': the rail');
  }
});

test('every dealt wall can be solved from its own cart, at its own par, and the engine calls it complete', () => {
  let n = 0;
  for (const seed of SEEDS) {
    const L = deal(seed);
    assert.ok(L, seed + ' deals a wall');
    // replay the stored solution onto a fresh wall, then check it used only what the cart holds
    const S = da.newState(L);
    da.restore(S, L.gen.solution);
    const ev = da.evaluate(S);
    assert.ok(ev.ok, seed + ' (' + L.gen.recipe + ' / ' + L.gen.twist + '): ' + ev.lines.map(l => l.t).join(' | '));
    const used = {};
    for (const it of S.items) if (!it.fixed) used[it.def.id] = (used[it.def.id] || 0) + 1;
    for (const tb of S.tubes) if (!tb.lead) used[tb.def.id] = (used[tb.def.id] || 0) + 1;
    const cart = Object.fromEntries(L.cart.map(([id, k]) => [id, k]));
    for (const [id, k] of Object.entries(used)) assert.ok((cart[id] || 0) >= k, seed + ': the solution uses ' + k + ' ' + id + ', the cart has ' + (cart[id] || 0));
    const sc = da.score(S, ev, 0);
    assert.strictEqual(sc.facts.comps, L.par.comp, seed + ': par parts is the solution\'s');
    assert.strictEqual(sc.facts.len, L.par.len, seed + ': par tubing is the solution\'s');
    assert.strictEqual(sc.assembly, 100, seed + ': the dealt build scores 100 against its own par');
    // the cart carries at least one decoy, a part the solution does not use
    assert.ok(L.cart.some(([id, k]) => (used[id] || 0) < k), seed + ': the cart has a decoy');
    n++;
  }
  assert.strictEqual(n, SEEDS.length);
});

test('the walls run from realistic to absurd: every twist and every kind of order turns up', () => {
  const twists = new Set(), recipes = new Set();
  for (let i = 0; i < 400; i++) { const L = deal('mix|' + i); twists.add(L.gen.twist); recipes.add(L.gen.recipe); }
  for (const t of da.TWISTS) assert.ok(twists.has(t.id), 'twist ' + t.id + ' is dealt');
  for (const r of da.RECIPES) assert.ok(recipes.has(r.id), 'order ' + r.id + ' is dealt');
});

test('the twists do what they say: capped outlets, a bottle or a pump by the bed, and the right order for each', () => {
  const by = {};
  for (let i = 0; Object.keys(by).length < da.TWISTS.length && i < 2000; i++) { const L = deal('tw|' + i); if (!by[L.gen.twist]) by[L.gen.twist] = L; }
  const rail = L => L.room.rail;
  const extras = L => (L.extras || []).map(e => e.def);
  // no air: both air outlets capped, nothing on the wall can blend, so no heated high flow
  assert.ok(!rail(by.noair).includes('out-air') && rail(by.noair).filter(d => d === 'out-capped').length === 2, 'no air caps both air outlets');
  assert.notStrictEqual(by.noair.gen.recipe, 'hfnc');
  // no oxygen, only air, only suction: the oxygen comes from a bottle by the bed
  for (const t of ['noo2', 'onlyair', 'onlysuct']) {
    assert.ok(!rail(by[t]).includes('out-o2'), t + ': no oxygen outlet works');
    assert.ok(extras(by[t]).includes('cyl-o2'), t + ': a bottle is in the room');
  }
  assert.ok(rail(by.onlyair).includes('out-air') && rail(by.onlysuct).includes('out-vac') && !rail(by.onlysuct).includes('out-air'), 'only air keeps air; only suction keeps only suction');
  // the pump: no gas on the wall, a concentrator and an outlet to plug it into, and nothing over 5 L/min
  assert.ok(!rail(by.pump).some(d => /^out-(o2|air|vac)$/.test(d)), 'the pump wall has no gas');
  assert.ok(extras(by.pump).includes('concentrator') && extras(by.pump).includes('deco-elec'), 'a concentrator and an outlet');
  assert.ok(by.pump.req.flow <= 5, 'a pump order fits the pump');
  // a Chemetron wing deals Chemetron outlets, and the Ohmeda flowmeter rides the cart as the trap
  assert.ok(rail(by.chem).includes('out-chem-o2') && !rail(by.chem).includes('out-o2'), 'Chemetron outlets');
  // the patient slid down: the order is something a 14 ft cannula reaches, never a 7 ft mask
  assert.ok(!['mask', 'nrb', 'venturi'].includes(by.far.gen.recipe), 'no mask on the far patient');
  // a crowded wall: an IV pole and a shelf, and the solution runs around them
  assert.ok(extras(by.crowded).includes('deco-ivpole') && extras(by.crowded).includes('deco-shelf'), 'the clutter is on the wall');
});

test('the pump has to be plugged in, and it tops out at 5 L/min', () => {
  let L = null;
  for (let i = 0; !L && i < 2000; i++) { const x = deal('pump|' + i); if (x.gen.twist === 'pump') L = x; }
  assert.ok(L, 'a pump wall is dealt');
  const S = da.newState(L); da.restore(S, L.gen.solution);
  assert.ok(da.evaluate(S).ok, 'the dealt build works');
  // pull the cord: the concentrator makes nothing
  const cord = S.tubes.find(t => t.lead && t.def.kind === 'cord' && S.items.find(i => i.uid === t.lead).def.id === 'concentrator');
  assert.ok(cord && cord.to, 'the concentrator\'s cord is in an outlet');
  cord.to = null; cord.path = []; cord.short = 0;
  assert.ok(!da.evaluate(S).ok, 'unplugged, it is not a working system');
  // and an order past its ceiling fails on the ceiling
  const S2 = da.newState(Object.assign({}, L, { req: Object.assign({}, L.req, { flow: 6, iface: ['cannula'] }) })); da.restore(S2, L.gen.solution);
  const ev2 = da.evaluate(S2);
  assert.ok(!ev2.ok && ev2.lines.some(l => /tops out at 5 L\/min/.test(l.t)), 'six liters from a five-liter pump fails, and says why');
});

test('Today\'s wall: dated in Mountain time, numbered from 2026-10-03, the same id deals the same wall', () => {
  assert.strictEqual(da.dayNumber('2026-10-03'), 1);
  assert.strictEqual(da.dayNumber('2026-10-04'), 2);
  assert.strictEqual(da.dayNumber('2027-10-03'), 366);
  // 03:00 UTC on Oct 4 is still Oct 3 in Utah
  assert.strictEqual(da.dayKey(new Date(Date.UTC(2026, 9, 4, 3, 0))), '2026-10-03');
  assert.strictEqual(da.dayKey(new Date(Date.UTC(2026, 9, 4, 7, 0))), '2026-10-04');
  const a = da.genLevel('day:2026-10-03'), b = load().genLevel('day:2026-10-03');
  assert.strictEqual(a.kicker, 'Daily wall #1');
  assert.strictEqual(a.gen.solution, b.gen.solution, 'everyone gets the same wall');
  assert.notStrictEqual(da.genLevel('day:2026-10-04').gen.solution, a.gen.solution, 'tomorrow is a different wall');
  assert.strictEqual(da.levelById('day:2026-10-03'), a, 'a level id finds it');
  assert.strictEqual(da.levelById('gen:K3F9QX').gen.code, 'K3F9QX', 'a random wall code is a wall');
  assert.strictEqual(da.levelById('gen:k3f9qx').gen.solution, da.levelById('gen:K3F9QX').gen.solution, 'codes ignore case');
  assert.strictEqual(da.levelById('day:nonsense'), undefined, 'a bad id is no wall');
  const m = da.untilNextDay(new Date(Date.UTC(2026, 9, 4, 5, 30)));   // 23:30 in Utah
  assert.strictEqual(m, 30, 'half an hour to the next wall');
});

test('a generated wall keeps its own room: the ?room= tester hatch and the race carry the twist with it', () => {
  const L = da.genLevel('day:2026-10-03');
  assert.strictEqual(da.roomOf(L), L.room, 'the dealt room, not the default');
  const S = da.start('day:2026-10-03');
  assert.deepStrictEqual(S.items.filter(i => i.y === 0).sort((p, q) => p.x - q.x).map(i => i.def.id), L.room.rail.slice(), 'the rail on the wall is the dealt rail');
});
