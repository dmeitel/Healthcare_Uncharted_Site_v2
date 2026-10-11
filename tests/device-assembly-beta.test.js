/**
 * Device Assembly, beta session one (2026-10-05). David, on the plan (docs/HU-DEVICE-ASSEMBLY-BETA-1-PLAN-2026-10-05.md):
 * "yes to all three, go ahead and build the beta plan". These hold what the beta changed in the engine:
 *   V5  a part dropped on a run goes in at the run's nearer joint, and gives the joint back when it leaves
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'fun', 'device-assembly', 'index.html'), 'utf8');
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
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();
const item = (S, id) => S.items.find((i) => i.def.id === id);
const ends = (tb) => [tb.from, tb.to].map((r) => r.uid + ':' + r.pi);

test('V5: a filter dropped on the expiratory limb goes in at the nearer joint, and the limb moves onto it', () => {
  const S = da.start('v2'), vent = S.items.find((i) => i.def.vent), exp = S.tubes.find((t) => t.def.id === 'limb-exp' && t.to);
  // the squares at each end of the limb (the limb is three squares long on the build with a port each side, 2026-10-07)
  const fromVent = exp.from.uid === vent.uid, nearVent = fromVent ? exp.path[0] : exp.path[exp.path.length - 1], nearY = fromVent ? exp.path[exp.path.length - 1] : exp.path[0];
  const atY = da.inlinePlan(S, da.DB['filter-bv'], nearY[0], nearY[1], null);
  assert.ok(atY && atY.on === 'Y-piece', 'near the Y it goes in at the Y');
  const before = S.cart['filter-bv'];
  const r = da.insertInline(S, { def: 'filter-bv', x: nearVent[0], y: nearVent[1] });
  assert.ok(r.ok, r.why); assert.match(r.on, /^Vent cart/);   // any of the four builds (2026-10-07)
  assert.strictEqual(S.cart['filter-bv'], before - 1, 'it came off the cart');
  assert.ok(ends(exp).includes(r.item.uid + ':' + exp.to.pi) || ends(exp).some((e) => e.startsWith(r.item.uid + ':')), 'the limb ends on the filter now');
  assert.ok(da.computeLinks(S).some((l) => l.kind === 'adj' && l.s === 'ok' && [l.a.uid, l.b.uid].includes(vent.uid) && [l.a.uid, l.b.uid].includes(r.item.uid)), 'the filter seats on the vent');
  assert.strictEqual(exp.short, 0, 'and the limb still reaches');
});

test('V5: put back on the cart, a part in line gives the joint back; a nipple adapter leaves the tubing hanging', () => {
  const S = da.start('v2'), vent = S.items.find((i) => i.def.vent), exp = S.tubes.find((t) => t.def.id === 'limb-exp' && t.to);
  const was = ends(exp).sort(), c = exp.path[exp.path.length - 2];
  const r = da.insertInline(S, { def: 'filter-bv', x: c[0], y: c[1] });
  da.removeThing(S, r.item.uid);
  assert.deepStrictEqual(ends(exp).sort(), was, 'the limb is back on the expiratory port');
  assert.ok(S.tubes.includes(exp), 'and still on the wall, not back on the cart');
  assert.ok(vent);
  // a cannula's own tubing on a nipple adapter: the adapter out, the tubing does not seat on the DISS outlet, so it hangs
  const T = da.start('l1'), nose = da.GRID.nose;
  const outlet = T.items.find((i) => i.fixed && da.portsOf(i).some((p) => p.std === 'qc-o2'));
  const fm = da.place(T, 'flowmeter', outlet.x, outlet.y + 1, 0).item; da.autoOrient(T, fm.uid);
  const xm = da.place(T, 'xmas', outlet.x, outlet.y + 3, 0).item; da.autoOrient(T, xm.uid);
  const can = da.place(T, 'cannula-14', nose[0], nose[1], 0).item;
  const barb = da.portsOf(xm).find((p) => p.std === 'barb');
  const cr = da.connectPorts(T, { uid: can.uid, pi: 'lead' }, { uid: xm.uid, pi: barb.pi }, null);
  assert.ok(cr.ok, 'the cannula tubing reaches the nipple adapter: ' + cr.why);
  da.removeThing(T, xm.uid);
  const lead = T.tubes.find((t) => t.lead === can.uid);
  assert.strictEqual(lead.to, null, 'the cannula tubing hangs, it does not jump onto the DISS outlet');
});

test('V5: only a part with a port on each of two opposite sides goes in line, and only onto a run', () => {
  const S = da.start('v2'), exp = S.tubes.find((t) => t.def.id === 'limb-exp' && t.to), c = exp.path[exp.path.length - 2];
  assert.strictEqual(da.inlinePlan(S, da.DB.flowmeter, c[0], c[1], null), null, 'a flowmeter is not an in-line part');
  assert.strictEqual(da.inlinePlan(S, da.DB['filter-bv'], 0, 13, null), null, 'nothing to go into off a run');
  for (const id of ['filter-bv', 'hme', 'neb-mesh', 'mdi-spacer', 'mdi-elbow']) assert.ok(da.hasThrough(da.DB[id]), id + ' goes in line');
  for (const id of ['y-piece', 'vent', 'heated', 'cannula']) assert.ok(!da.hasThrough(da.DB[id]), id + ' does not');
});

/** the sandbox scene the crossing tests share: an oxygen tree in column 2 running down to a humidifier, and two filters
 *  on row 6 either side of it @param {any} S */
function scene(S) {
  da.place(S, 'flowmeter', 2, 1, 0); const tr = da.place(S, 'xmas', 2, 3, 0).item, bub = da.place(S, 'bubble', 2, 11, 0).item;
  const run1 = da.connectPorts(S, { uid: tr.uid, pi: da.portsOf(tr).find((q) => q.std === 'barb').pi }, { uid: bub.uid, pi: da.portsOf(bub).find((q) => q.std === 'barb' || q.k === 'in').pi }, 'tube-o2-25');
  return { tr, bub, run1 };
}

test('M2: a run crosses another at a right angle where that one goes straight, never where it bends or ends', () => {
  const S = da.start('sb'), sc = scene(S); assert.ok(sc.run1.ok, sc.run1.why);
  const L = da.place(S, 'filter-bv', 0, 6, 0).item, R = da.place(S, 'filter-bv', 5, 6, 0).item;
  const r = da.connectPorts(S, { uid: L.uid, pi: da.portsOf(L).find((q) => q.s === 'E').pi }, { uid: R.uid, pi: da.portsOf(R).find((q) => q.s === 'W').pi }, 'tube-22');
  assert.ok(r.ok, r.why);
  const t2 = S.tubes[S.tubes.length - 1];
  assert.deepStrictEqual(Array.from(t2.path, (c) => c.join(',')), ['1,6', '2,6', '3,6', '4,6'], 'straight across the oxygen line');
  const vert = S.tubes.find((t) => t.def.id === 'tube-o2-25');
  assert.ok(vert.path.some((c) => c[0] === 2 && c[1] === 6), 'the oxygen line still runs through the same square');
  assert.strictEqual(da.route(S, [1, 4], [3, 4], 3, null), null, 'no crossing at the square where the oxygen line starts');
  assert.ok(da.route(S, [1, 8], [3, 8], 3, null), 'but straight across its middle, yes');
});

test('M1: a power cord lies over things: it takes no squares, a part goes down on it, and it is laid over parts', () => {
  const S = da.start('sb'), heat = da.place(S, 'heated', 8, 9, 0).item;
  const recp = S.items.filter((i) => i.def.id === 'deco-elec' || i.def.id === 'deco-elec-red')[0];
  const r = da.connectPorts(S, { uid: heat.uid, pi: 'cord' }, { uid: recp.uid, pi: da.portsOf(recp)[0].pi }, null);
  assert.ok(r.ok, r.why);
  const cord = S.tubes.find((t) => t.lead === heat.uid && t.def.t === 'power');
  assert.ok(cord.path.length > 0);
  const c = cord.path[Math.floor(cord.path.length / 2)];
  const where = da.canPlace(S, da.DB.xmas, 0, c[0], c[1]);
  assert.ok(where.ok || where.why !== 'Something is already there.', 'a part can go down on a cord: ' + where.why);
});

test('M3: Swap trades a run or a part for its twin on the cart in place, and its joints stay', () => {
  const S = da.start('sb'); scene(S);
  const L = da.place(S, 'filter-bv', 0, 6, 0).item, R = da.place(S, 'filter-bv', 5, 6, 0).item;
  da.connectPorts(S, { uid: L.uid, pi: da.portsOf(L).find((q) => q.s === 'E').pi }, { uid: R.uid, pi: da.portsOf(R).find((q) => q.s === 'W').pi }, 'tube-22');
  const run = S.tubes[S.tubes.length - 1], ends = JSON.stringify([run.from, run.to]), path = JSON.stringify(run.path);
  const tw = da.twinsOf(S, run.def); assert.ok(tw.includes('tube-heated'), 'a heated circuit is a twin of plain 22 mm tubing');
  const plain = S.cart['tube-22'], r = da.swapPart(S, run.uid);
  assert.ok(r.ok, r.why);
  assert.strictEqual(JSON.stringify([run.from, run.to]), ends, 'the same two joints');
  assert.strictEqual(JSON.stringify(run.path), path, 'the same run');
  assert.strictEqual(S.cart['tube-22'], plain + 1, 'the plain tubing went back on the cart');
  // a cannula for the one with 14 ft of tubing: the part stays on the face and its own line takes the new length
  const T = da.start('sb'), nose = da.GRID.nose, can = da.place(T, 'cannula', nose[0], nose[1], 0).item;
  assert.ok(da.twinsOf(T, can.def).includes('cannula-14'));
  da.swapPart(T, can.uid);
  assert.strictEqual(can.def.id, 'cannula-14'); assert.strictEqual(T.tubes.find((t) => t.lead === can.uid).def.reach, 14);
  assert.strictEqual(da.swapPart(T, T.items.find((i) => i.fixed).uid).ok, false, 'a fixture is not swapped');
});

test('V1: an ICU ventilator needs both hoses in their own outlets, and the test says which is missing', () => {
  const S = da.newState(da.levelById('v1')); da.ventSetup(S); assert.ok(da.ventPlug(S));
  assert.ok(da.evaluate(S).ok, 'both hoses in: it works');
  const vent = S.items.find((i) => i.def.vent), hose = (pi) => S.tubes.find((t) => t.lead === vent.uid && t.from.pi === pi);
  Object.assign(hose('airhose'), { to: null, path: [], short: 0, direct: false });
  assert.match(da.evaluate(S).lines.map((l) => l.t).join(' '), /air hose is not in an air outlet/);
  assert.ok(da.DB['vent-home'].twoGas !== true, 'the portable vent keeps its turbine');
});

test('V4: a circuit in its bag lays itself, the Y on the tube and both limbs back; a plain one off the cart\'s heater rains out', () => {
  const L = da.levelById('v1'), S = da.newState(L); S.cart['circuit-heated'] = 1; S.cart['circuit-plain'] = 1;
  const vent = da.place(S, 'vent-cart', 10, 6, 0, true).item;   // below the monitor: a cord goes round it since 2026-10-07
  const r = da.layCircuit(S, 'circuit-heated'); assert.ok(r.ok, r.why);
  assert.ok(S.items.some((i) => i.def.yPiece), 'the Y is on the tube');
  assert.strictEqual(S.tubes.filter((t) => /^limb-/.test(t.def.id) && t.to).length, 2, 'both limbs laid');
  assert.strictEqual(S.cart['circuit-heated'], 0, 'the bag came off the cart');
  da.ventPlug(S); da.setFio2(S, vent.uid, 40); assert.ok(da.evaluate(S).ok, 'it works');
  const again = da.layCircuit(S, 'circuit-plain'); assert.ok(!again.ok && /already has a circuit/.test(again.why), 'a second circuit is refused with the reason');
  // the plain bag on the cart's heated chamber rains out
  const T = da.newState(L); T.cart['circuit-plain'] = 1; const v2 = da.place(T, 'vent-cart', 10, 6, 0, true).item;
  assert.ok(da.layCircuit(T, 'circuit-plain').ok); da.ventPlug(T); da.setFio2(T, v2.uid, 40);
  assert.match(da.evaluate(T).lines.map((l) => l.t).join(' '), /rains out/);
});

test('V5b and V6: a part dropped on the Y goes in at the tube and the Y slides out; out again, the Y slides back; two flex tubes are dead space', () => {
  const S = da.newState(da.levelById('v1')); S.cart['flex-tube'] = 2; da.ventSetup(S, { v: [11, 7] }); da.ventPlug(S);   // a spot with room for the Y to slide twice
  const y = () => S.items.find((i) => i.def.yPiece), y0 = y().x + ',' + y().y;
  const a = da.insertInline(S, { def: 'flex-tube', x: y().x, y: y().y }); assert.ok(a.ok, a.why); assert.strictEqual(a.slid, 'Y-piece');
  assert.notStrictEqual(y().x + ',' + y().y, y0, 'the Y moved out a square');
  assert.ok(da.evaluate(S).ok, 'one flex tube is room, and passes');
  const b = da.insertInline(S, { def: 'flex-tube', x: y().x, y: y().y }); assert.ok(b.ok, b.why);
  assert.match(da.evaluate(S).lines.map((l) => l.t).join(' '), /dead space/);
  for (const f of S.items.filter((i) => i.def.id === 'flex-tube')) da.removeThing(S, f.uid);
  assert.strictEqual(y().x + ',' + y().y, y0, 'both out, the Y is back on the tube');
  assert.ok(da.evaluate(S).ok);
});

test('P1/P2: five paths of four to seven walls, every wall deals and its answer passes, and Next walks the path', () => {
  assert.deepStrictEqual(Array.from(da.PATHS, (p) => p.name), ['Oxygen on the floor', 'Humidity and aerosol', 'High flow', 'Find the fault', 'Ventilators']);
  for (const p of da.PATHS) {
    assert.ok(p.walls.length >= 4 && p.walls.length <= 7, p.name + ' has ' + p.walls.length + ' walls');   // seven since Ventilator 8 (2026-10-07)
    for (const id of p.walls) {
      const L = da.levelById(id); assert.ok(L, id + ' deals');
      const S = da.newState(L); da.restore(S, L.solution); assert.ok(da.evaluate(S).ok, id + ': its answer passes');
    }
    for (let k = 0; k < p.walls.length - 1; k++) assert.strictEqual(da.pathNext(p.walls[k]), p.walls[k + 1]);
  }
  assert.strictEqual(da.pathNext('l2'), 'my:hfnc.45.45.plain.left.0.HF1');
  assert.strictEqual(da.kickerOf(da.levelById('l2')), 'High flow 1 of 4');
  // the walls card: tutorials, the five paths, more walls, the sandbox
  const names = Array.from(da.wallGroups(), (g) => g.name);
  for (const n of ['Tutorial', 'Oxygen on the floor', 'Humidity and aerosol', 'High flow', 'Find the fault', 'Ventilators', 'More walls', 'Sandbox']) assert.ok(names.includes(n), 'the walls card has ' + n);
});

test('P3: the extension cord works and is wrong, and the test says why (Find the fault 2 arrives on one since 2026-10-07)', () => {
  const S = da.newState(da.levelById('f2'));
  assert.ok(S.items.some((i) => i.def.id === 'ext-cord'), 'the extension cord is on the wall');
  assert.match(da.evaluate(S).lines.map((l) => l.t).join(' '), /plugged into an extension cord/);
  // taken off and the heater straight into the wall, it passes
  const heat = S.items.find((i) => i.def.id === 'heated'), cord = S.tubes.find((t) => t.lead === heat.uid && t.def.kind === 'cord');
  Object.assign(cord, { to: null, path: [], short: 0, direct: false });
  const rec = S.items.find((i) => i.fixed && /^deco-elec/.test(i.def.id) && !i.def.dead);
  assert.ok(da.connectPorts(S, { uid: heat.uid, pi: 'cord' }, { uid: rec.uid, pi: 0 }, null).ok);
  assert.ok(da.evaluate(S).ok);
});
