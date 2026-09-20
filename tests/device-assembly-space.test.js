/**
 * Device Assembly, the room-to-build pass: a twelve-wide wall, jumpers between parts that
 * touch but do not seat, the bigger catalog (air tree, Venturi, nebulizer, suction chain),
 * and the sandbox level. Same sandbox loader as the engine tests.
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
    Date,
  };
  vm.createContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const port = (uid, pi) => ({ uid, pi });
const itemOf = (S, defId) => S.items.find(i => i.def.id === defId);
const portOf = (da, it, pred) => da.portsOf(it).find(pred);
const ref = p => port(p.uid, p.pi);
const NOSE = [3, 9];
const rowsOf = t => Object.fromEntries(t.rows.map(r => [r.k, r.ok]));
/* the rotation that puts a given port on a given side, for parts that can turn */
function placeFacing(da, S, defId, x, y, pred, side) {
  for (let r = 0; r < 4; r++) {
    const probe = { uid: 'probe', def: da.DB[defId], x, y, r };
    const p = da.portsOf(probe).find(pred);
    if (p && p.s === side) return da.place(S, defId, x, y, r);
  }
  throw new Error('no rotation puts that port on side ' + side);
}

test('the wall is fourteen wide with a fuller rail: two oxygen, two air, two vacuum, three power', () => {
  const da = load();
  const S = da.start('t1', 'left');
  assert.strictEqual(da.GRID.cols, 14); assert.strictEqual(da.GRID.rows, 14);
  const rail = S.items.filter(i => i.y === 0).map(i => i.def.id);
  assert.strictEqual(rail.filter(id => id === 'out-air').length, 2, 'two air outlets, so a blender and an air flowmeter can both live on the rail');
  assert.strictEqual(rail.filter(id => id === 'deco-elec-red').length, 2, 'two emergency outlets');
  assert.ok(da.GRID.order.x + da.GRID.order.w <= da.GRID.cols, 'the order card stays on the wall');
  assert.strictEqual(da.canPlace(S, da.DB['ad-22f-barb'], 0, 11, 4).ok, true, 'the new column is usable');
  assert.strictEqual(da.canPlace(S, da.DB['ad-22f-barb'], 0, 14, 4).ok, false, 'and it ends where the wall ends');
  assert.strictEqual(da.canPlace(S, da.DB['ad-22f-barb'], 0, 3, 11).ok, true, 'the neck square under the chin is open');
});

test('two barbs that touch do not seat, and a jumper joins them in place', () => {
  const da = load();
  const S = da.start('sb', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);           // probe into the second oxygen outlet
  da.place(S, 'xmas', 3, 3, 0);                // nut onto the DISS outlet: seats
  const tree = itemOf(S, 'xmas');
  const treeBarb = portOf(da, tree, p => p.std === 'barb');
  placeFacing(da, S, 'ad-22f-barb', 3, 4, p => p.std === 'barb', 'N');
  const ad = itemOf(S, 'ad-22f-barb');
  const adBarb = portOf(da, ad, p => p.std === 'barb');
  // before: a bad joint (same gender), both anchors read as taken by the part facing them
  let links = da.computeLinks(S);
  const joint = links.find(l => l.kind === 'adj' && [l.a, l.b].some(p => p.uid === tree.uid && p.pi === treeBarb.pi));
  assert.ok(joint && joint.s === 'bad', 'barb against barb is a red joint');
  assert.strictEqual(da.facingPort(S, treeBarb).uid, ad.uid, 'the renderer can find the port on the far side of the edge');
  assert.strictEqual(da.jumpable(S, treeBarb, adBarb), true, 'and offers to join them');
  const nut = portOf(da, tree, p => p.std === 'diss-1240');
  assert.strictEqual(da.jumpable(S, nut, da.facingPort(S, nut)), false, 'a nut seated on its thread is not a jumper case');
  assert.match(da.connectPorts(S, ref(nut), ref(da.facingPort(S, nut)), null).why, /seat on each other/, 'and asking for tubing there is refused with the reason');
  // the jumper
  const res = da.connectPorts(S, ref(treeBarb), ref(adBarb), null);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.tube.direct, true, 'a zero-length run');
  assert.strictEqual(res.len, 0);
  assert.strictEqual(res.picked, 'tube-o2-7', 'the shortest barb tubing on the cart was cut for it');
  assert.strictEqual(res.state, 'ok', 'tubing ends push onto both barbs');
  links = da.computeLinks(S);
  assert.ok(!links.some(l => l.kind === 'adj' && [l.a, l.b].some(p => p.uid === tree.uid && p.pi === treeBarb.pi)), 'the red joint is gone: the tubing is the joint now');
  assert.strictEqual(links.filter(l => l.kind === 'tube' && l.a.uid === res.tube.uid && l.s === 'ok').length, 2, 'two green tube ends');
  assert.strictEqual(da.portTaken(S, treeBarb), true, 'both barbs are taken by the jumper');
  assert.strictEqual(da.jumpable(S, treeBarb, adBarb), false);
  assert.ok(da.evaluate(S).visited.has(ad.uid), 'gas reaches the adapter through the jumper');
  // undo carries the flag
  da.remember(S);
  da.removeThing(S, res.tube.uid);
  assert.ok(da.computeLinks(S).some(l => l.kind === 'adj' && l.s === 'bad'), 'pull it off and the red joint is back');
  da.undo(S);
  const back = S.tubes.find(t => t.direct);
  assert.ok(back, 'undo restores the jumper as a jumper');
  assert.ok(!da.computeLinks(S).some(l => l.kind === 'adj' && l.s === 'bad'));
});

test('a cannula parked against a barb pushes straight on, and re-routes when it moves to the nose', () => {
  const da = load();
  const S = da.start('sb', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);              // nut onto the DISS outlet; barb points E at (3,3), facing (4,3)
  const bub = itemOf(S, 'bubble');
  const barb = portOf(da, bub, p => p.std === 'barb');
  da.place(S, 'cannula', 4, 3, 2);             // turned so its tubing anchor faces W, against the barb
  const can = itemOf(S, 'cannula');
  const lead = portOf(da, can, p => p.internal);
  assert.strictEqual(da.facingPort(S, barb).uid, can.uid, 'the lead is the port on the far side');
  assert.strictEqual(da.jumpable(S, barb, lead), true, 'a lead against a barb is a push-on');
  const res = da.connectPorts(S, ref(lead), ref(barb), null);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.tube.direct, true);
  assert.strictEqual(res.tube.lead, can.uid, 'no cart tubing was used: it is the cannula\'s own 7 ft');
  assert.ok(da.evaluate(S).path.includes(can.uid), 'the cannula is on the circuit');
  const mv = da.moveItem(S, can.uid, NOSE[0], NOSE[1], 0);
  assert.strictEqual(mv.ok, true);
  assert.strictEqual(mv.detached, 0, 'the tubing followed');
  const tb = S.tubes.find(t => t.lead === can.uid);
  assert.strictEqual(tb.direct, false, 'and it is a real run now');
  assert.ok(tb.path.length > 0 && tb.path.length <= 7, 'inside its 7 ft');
  const t = rowsOf(da.functionTest(S));
  assert.strictEqual(t['Tubing continuity'], true);
  assert.strictEqual(t['Humidification'], true, 'the bubble humidifier is in the path');
  assert.strictEqual(t['Patient interface'], true, 'the cannula is on the nose');
});

test('the sandbox carries the whole catalog and unlocks on its own', () => {
  const da = load();
  const sb = da.LEVELS.find(l => l.id === 'sb');
  assert.ok(sb && sb.kind === 'sandbox');
  const ids = sb.cart.map(c => c[0]);
  for (const d of Object.values(da.DB)) {
    if (!['device', 'tubing', 'adapter', 'interface'].includes(d.cat) || d.id === 'src-t1') continue;
    assert.ok(ids.includes(d.id), d.id + ' is on the sandbox cart');
  }
  for (const id of ['xmas-air', 'tube-o2-14', 'venturi', 'lvn', 'aeromask', 'trach-collar', 'tpiece', 'suction-canister', 'tube-suct', 'yankauer']) assert.ok(da.DB[id], id + ' exists');
  for (const d of Object.values(da.DB)) for (const p of d.ports) assert.ok(da.STD[p.std], d.id + ' port standard ' + p.std + ' is defined');
});

test('the air tree threads only onto the air flowmeter; the 14 ft tubing sits between 7 and 25', () => {
  const da = load();
  const S = da.start('sb', 'left');
  da.place(S, 'flowmeter-air', 4, 1, 0);       // probe into the first air outlet
  da.place(S, 'xmas-air', 4, 3, 0);
  let links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.item.def.id === 'xmas-air')), 'DISS 1160 nut on a DISS 1160 outlet');
  da.removeThing(S, itemOf(S, 'xmas-air').uid);
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'xmas-air', 3, 3, 0);
  links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'bad' && [l.a, l.b].some(p => p.item.def.id === 'xmas-air')), 'and not onto an oxygen outlet');
  assert.ok(da.DB['tube-o2-7'].reach < da.DB['tube-o2-14'].reach && da.DB['tube-o2-14'].reach < da.DB['tube-o2-25'].reach);
});

test('a Venturi mask sets FiO2 by jet, snapping to the jets it actually has', () => {
  const da = load();
  const S = da.start('sb', 'left');
  da.place(S, 'venturi', NOSE[0], NOSE[1], 0);
  const v = itemOf(S, 'venturi');
  assert.strictEqual(v.fio2, 24, 'starts on the lowest jet');
  assert.strictEqual(da.setFio2(S, v.uid, 30).fio2, 31, 'asks for 30, gets the 31 jet');
  assert.strictEqual(da.setFio2(S, v.uid, 45).fio2, 40);
  assert.strictEqual(da.setFio2(S, v.uid, 99).fio2, 50, 'and never above the top jet');
  // on a 40% order it satisfies the FiO2 row without a blender
  S.level = Object.assign({}, S.level, { req: { iface: ['mask'], flow: 8, fio2: 40 } });
  da.setFio2(S, v.uid, 40);
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'xmas', 3, 3, 0);
  const tree = itemOf(S, 'xmas');
  const res = da.connectPorts(S, port(v.uid, 'lead'), ref(portOf(da, tree, p => p.std === 'barb')), null);
  assert.strictEqual(res.ok, true);
  const t = rowsOf(da.functionTest(S));
  assert.strictEqual(t['FiO2'], true, 'the jet sets the percentage');
  assert.strictEqual(t['Patient interface'], true);
});

test('cool aerosol: nebulizer, corrugated tubing, aerosol mask; the collar sets the percentage and the water humidifies', () => {
  const da = load();
  const S = da.start('sb', 'left');
  S.level = Object.assign({}, S.level, { req: { iface: ['aerosol'], flow: 10, humid: true, fio2: 35 } });
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'lvn', 3, 3, 0);                 // nut onto the DISS outlet; cone points E at (3,4)
  const neb = itemOf(S, 'lvn');
  da.setFio2(S, neb.uid, 35);
  da.place(S, 'aeromask', NOSE[0], NOSE[1], 0);
  const mask = itemOf(S, 'aeromask');
  const res = da.connectPorts(S, ref(portOf(da, neb, p => p.std === 'iso22')), ref(portOf(da, mask, p => p.std === 'iso22')), null);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.picked, 'tube-22', '22 mm corrugated tubing is the only thing that fits two cones');
  assert.strictEqual(res.short, 0, 'six feet reaches the nose');
  const t = rowsOf(da.functionTest(S));
  assert.deepStrictEqual([t['Oxygen source'], t['Flow control'], t['Humidification'], t['Tubing continuity'], t['Patient interface'], t['FiO2']], [true, true, true, true, true, true]);
  // a trach collar takes the same tubing and the same need, but it goes on the neck, not the face
  da.removeThing(S, mask.uid);
  S.level = Object.assign({}, S.level, { req: { iface: ['trach'], flow: 10, humid: true, fio2: 35 } });
  da.place(S, 'trach-collar', NOSE[0], NOSE[1], 0);
  let tc = itemOf(S, 'trach-collar');
  assert.ok(!da.onPatientLinks(da.computeLinks(S), tc), 'its patient side meets the face port, and neck on face is not a fit');
  const atNose = da.connectPorts(S, ref(portOf(da, neb, p => p.std === 'iso22')), ref(portOf(da, tc, p => p.std === 'iso22')), null);
  assert.strictEqual(atNose.ok, true);
  assert.strictEqual(atNose.picked, 'tube-22', 'six feet reaches the nose square');
  const rowAtNose = da.functionTest(S).rows.find(r => r.k === 'Patient interface');
  assert.strictEqual(rowAtNose.ok, false);
  assert.match(rowAtNose.t, /below the nose square/, rowAtNose.t);
  da.removeThing(S, atNose.tube.uid);
  da.moveItem(S, tc.uid, da.GRID.neck[0], da.GRID.neck[1], 0);
  tc = itemOf(S, 'trach-collar');
  assert.ok(da.onPatientLinks(da.computeLinks(S), tc), 'on the neck it seats over the stoma');
  const tcRun = da.connectPorts(S, ref(portOf(da, neb, p => p.std === 'iso22')), ref(portOf(da, tc, p => p.std === 'iso22')), null);
  assert.strictEqual(tcRun.ok, true);
  assert.strictEqual(tcRun.picked, 'tube-22-10', 'seven cells straight down: the 10 ft cut is what reaches');
  assert.strictEqual(tcRun.short, 0);
  assert.strictEqual(rowsOf(da.functionTest(S))['Patient interface'], true);
  // and the cannula does not go on the neck
  da.removeThing(S, tc.uid);
  da.place(S, 'cannula', da.GRID.neck[0], da.GRID.neck[1], 0);
  const can = itemOf(S, 'cannula');
  assert.ok(!da.onPatientLinks(da.computeLinks(S), can), 'a cannula on the neck square is not on the patient');
});

test('the suction chain: regulator, canister, tubing, tip; a jumper of suction tubing joins the two barbs that touch', () => {
  const da = load();
  const S = da.start('sb', 'left');
  da.place(S, 'suction-reg', 6, 1, 0);         // probe into the first vacuum outlet
  const reg = itemOf(S, 'suction-reg');
  assert.ok(da.computeLinks(S).some(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.uid === reg.uid)), 'the regulator seats in vacuum');
  da.place(S, 'suction-canister', 6, 3, 0);    // vacuum port N against the regulator barb: barb on barb
  const can = itemOf(S, 'suction-canister');
  const regBarb = portOf(da, reg, p => p.std === 'suct-barb');
  const vacPort = portOf(da, can, p => p.label === 'Vacuum port');
  assert.strictEqual(da.jumpable(S, regBarb, vacPort), true);
  const j = da.connectPorts(S, ref(regBarb), ref(vacPort), null);
  assert.strictEqual(j.ok, true);
  assert.strictEqual(j.picked, 'tube-suct', 'suction tubing, not oxygen tubing, is cut for the jumper');
  assert.strictEqual(j.state, 'ok');
  da.place(S, 'yankauer', 8, 4, 0);            // handle faces W
  const tip = itemOf(S, 'yankauer');
  const run = da.connectPorts(S, ref(portOf(da, can, p => p.label === 'Patient port')), ref(portOf(da, tip, p => p.std === 'suct-barb')), null);
  assert.strictEqual(run.ok, true);
  assert.strictEqual(run.picked, 'tube-suct');
  assert.strictEqual(run.state, 'ok');
  const ev = da.evaluate(S);
  assert.ok(ev.visited.has(tip.uid), 'vacuum reaches the tip');
  // oxygen tubing does not push onto a suction barb
  const wrong = da.connectPorts(S, ref(portOf(da, can, p => p.label === 'Patient port')), ref(portOf(da, tip, p => p.std === 'suct-barb')), 'tube-o2-7');
  assert.strictEqual(wrong.ok, false, 'that port is taken now');
  da.removeThing(S, run.tube.uid);
  const wrong2 = da.connectPorts(S, ref(portOf(da, can, p => p.label === 'Patient port')), ref(portOf(da, tip, p => p.std === 'suct-barb')), 'tube-o2-7');
  assert.strictEqual(wrong2.ok, true, 'laid, because the bench is free-form');
  assert.strictEqual(wrong2.state, 'bad', 'but red at both ends');
});

test('level 3, trach collar: nebulizer on the flowmeter, collar on the neck, the 10 ft cut around the chin is par', () => {
  const da = load();
  const S = da.start('l3', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'lvn', 3, 3, 0);
  const neb = itemOf(S, 'lvn');
  da.setFio2(S, neb.uid, 35);
  da.place(S, 'trach-collar', da.GRID.neck[0], da.GRID.neck[1], 0);
  const tc = itemOf(S, 'trach-collar');
  const run = da.connectPorts(S, ref(portOf(da, neb, p => p.std === 'iso22')), ref(portOf(da, tc, p => p.std === 'iso22')), null);
  assert.strictEqual(run.ok, true);
  assert.strictEqual(run.picked, 'tube-22-10');
  assert.strictEqual(run.len, 7);
  const ev = da.evaluate(S);
  assert.ok(ev.ok, JSON.stringify(ev.lines));
  const ft = da.functionTest(S);
  assert.ok(ft.ok && ft.rows.every(r => r.ok === true || r.ok === null), JSON.stringify(rowsOf(ft)));
  const sc = da.score(S, ev, 60);
  assert.strictEqual(sc.assembly, 100, JSON.stringify(sc.facts) + ' ' + JSON.stringify(sc.s));
  // the aerosol mask on the face satisfies the humidity but not the order
  da.removeThing(S, tc.uid);
  da.place(S, 'aeromask', NOSE[0], NOSE[1], 0);
  const am = itemOf(S, 'aeromask');
  assert.strictEqual(da.connectPorts(S, ref(portOf(da, neb, p => p.std === 'iso22')), ref(portOf(da, am, p => p.std === 'iso22')), null).ok, true);
  const ev2 = da.evaluate(S);
  assert.strictEqual(ev2.ok, false);
  assert.ok(ev2.lines.some(l => /trach collar/.test(l.t)), JSON.stringify(ev2.lines));
});

test('level 4, bubble CPAP: the two-limb circuit, and an open expiratory limb is no CPAP at all', () => {
  const da = load();
  const S = da.start('l4', 'left');
  da.place(S, 'blender', 3, 1, 0); da.setFio2(S, itemOf(S, 'blender').uid, 40);
  da.place(S, 'flowmeter-hf', 4, 3, 0);
  da.place(S, 'xmas', 4, 5, 0);
  da.place(S, 'ad-22f-barb', 5, 6, 1);
  da.place(S, 'heated', 6, 6, 0);
  da.place(S, 'cpap-iface', 3, 9, 0);
  da.place(S, 'cpap-gen', 5, 10, 0);
  const tree = itemOf(S, 'xmas'), ad = itemOf(S, 'ad-22f-barb'), ht = itemOf(S, 'heated'), ifc = itemOf(S, 'cpap-iface'), gen = itemOf(S, 'cpap-gen');
  assert.strictEqual(gen.cpap, 5, 'the generator ships with the probe at 5');
  assert.strictEqual(da.rotate(S, ifc.uid).ok, false, 'the prongs do not turn');
  const o2 = da.connectPorts(S, ref(portOf(da, tree, p => p.std === 'barb')), ref(portOf(da, ad, p => p.std === 'barb')), null);
  assert.strictEqual(o2.ok, true); assert.strictEqual(o2.len, 1);
  assert.ok(da.computeLinks(S).some(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.uid === ad.uid && p.std === 'iso22')), 'the chamber inlet cone seats in the adapter socket');
  const insp = da.connectPorts(S, ref(portOf(da, ht, p => p.label === 'Chamber outlet')), ref(portOf(da, ifc, p => p.label === 'Inspiratory limb')), null);
  assert.strictEqual(insp.ok, true); assert.strictEqual(insp.picked, 'tube-22-10'); assert.strictEqual(insp.short, 0);
  const plug = da.connectPorts(S, port(ht.uid, 'cord'), ref(portOf(da, S.items.find(i => i.def.id === 'deco-elec'), p => p.t === 'power')), null);
  assert.strictEqual(plug.ok, true); assert.strictEqual(plug.short, 0);
  // everything but the expiratory limb: warm blended gas at the nose, and no pressure
  let ev = da.evaluate(S);
  assert.strictEqual(ev.ok, false);
  assert.ok(ev.lines.some(l => /water column/.test(l.t)), JSON.stringify(ev.lines));
  let ft = da.functionTest(S);
  assert.strictEqual(rowsOf(ft)['CPAP'], false);
  assert.match(ft.rows.find(r => r.k === 'CPAP').t, /No water column/);
  // close the circuit
  const exp = da.connectPorts(S, ref(portOf(da, ifc, p => p.label === 'Expiratory limb')), ref(portOf(da, gen, p => p.std === 'iso22')), null);
  assert.strictEqual(exp.ok, true); assert.strictEqual(exp.picked, 'tube-22'); assert.strictEqual(exp.len, 1);
  ev = da.evaluate(S);
  assert.ok(ev.ok, JSON.stringify(ev.lines));
  assert.ok(ev.visited.has(gen.uid), 'the generator is downstream of the interface');
  ft = da.functionTest(S);
  assert.ok(ft.ok && ft.rows.every(r => r.ok === true || r.k === 'Capnography'), JSON.stringify(rowsOf(ft)));
  const sc = da.score(S, ev, 100);
  assert.strictEqual(sc.assembly, 100, JSON.stringify(sc.facts) + ' ' + JSON.stringify(sc.s));
  // the probe depth is the pressure
  assert.deepStrictEqual(JSON.parse(JSON.stringify(da.setCpap(S, gen.uid, 7))), { ok: true, cpap: 7 });
  assert.strictEqual(rowsOf(da.functionTest(S))['CPAP'], false);
  assert.strictEqual(da.setCpap(S, gen.uid, 5.4).cpap, 5, 'snaps to the marks on the probe');
  assert.strictEqual(rowsOf(da.functionTest(S))['CPAP'], true);
  // undo carries the depth
  da.remember(S); da.setCpap(S, gen.uid, 8); da.undo(S);
  assert.strictEqual(itemOf(S, 'cpap-gen').cpap, 5);
});

test('level 5, capnography: the sampling cannula runs oxygen in and exhaled gas out to the CO2 port on the monitor', () => {
  const da = load();
  assert.ok(da.STD.luer, 'the luer lock is a connector standard');
  const S = da.start('l5', 'left');
  const mon = itemOf(S, 'deco-monitor');
  const co2 = portOf(da, mon, p => p.std === 'luer');
  assert.ok(co2 && co2.s === 'S' && co2.g === 'f', 'the monitor has a CO2 sampling port on its underside');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'xmas', 3, 3, 0);
  const tree = itemOf(S, 'xmas');
  const barb = portOf(da, tree, p => p.std === 'barb');
  // the plain cannula satisfies the oxygen but not the order
  da.place(S, 'cannula', NOSE[0], NOSE[1], 0);
  const plain = itemOf(S, 'cannula');
  assert.strictEqual(da.connectPorts(S, port(plain.uid, 'lead'), ref(barb), null).ok, true);
  let ev = da.evaluate(S);
  assert.strictEqual(ev.ok, false);
  assert.ok(ev.lines.some(l => /sampling cannula/.test(l.t)), JSON.stringify(ev.lines));
  assert.match(da.functionTest(S).rows.find(r => r.k === 'Capnography').t, /No sampling cannula/);
  da.removeThing(S, plain.uid);
  // the sampling cannula: two leads, two directions
  da.place(S, 'etco2-cannula', NOSE[0], NOSE[1], 0);
  const can = itemOf(S, 'etco2-cannula');
  assert.strictEqual(can.def.leads.length, 2);
  assert.strictEqual(da.rotate(S, can.uid).ok, false, 'it does not turn');
  assert.strictEqual(S.tubes.filter(t => t.lead === can.uid).length, 2, 'both lines come with it');
  const o2 = da.connectPorts(S, port(can.uid, 'lead'), ref(barb), null);
  assert.strictEqual(o2.ok, true); assert.strictEqual(o2.len, 6); assert.strictEqual(o2.state, 'ok');
  ev = da.evaluate(S);
  assert.strictEqual(ev.ok, false, 'oxygen alone is not the order');
  assert.ok(ev.lines.some(l => /not in the monitor/.test(l.t)), JSON.stringify(ev.lines));
  assert.strictEqual(da.capnoOn(S), false);
  // the sample line into a gas outlet is a mismatch, not a fit
  const wrong = da.connectPorts(S, port(can.uid, 'sample'), ref(portOf(da, itemOf(S, 'out-air'), p => true)), null);
  assert.strictEqual(wrong.ok, true, 'laid, because the bench is free-form');
  assert.strictEqual(wrong.state, 'bad');
  assert.strictEqual(da.capnoOn(S), false);
  da.removeThing(S, wrong.tube.uid);
  assert.strictEqual(S.tubes.filter(t => t.lead === can.uid).length, 2, 'pulling a lead off leaves it attached to the cannula');
  const sample = da.connectPorts(S, port(can.uid, 'sample'), ref(co2), null);
  assert.strictEqual(sample.ok, true);
  assert.strictEqual(sample.len, 12, 'twelve cells to the far side of the wall (the port sits one row lower on the taller monitor since Round 12)');
  assert.strictEqual(sample.short, 0, 'and the long line reaches exactly');
  assert.strictEqual(sample.state, 'ok', 'luer lock into the luer port');
  assert.strictEqual(da.capnoOn(S), true);
  ev = da.evaluate(S);
  assert.ok(ev.ok, JSON.stringify(ev.lines));
  const ft = da.functionTest(S);
  assert.strictEqual(rowsOf(ft)['Capnography'], true);
  assert.ok(ft.ok && ft.rows.every(r => r.ok === true || r.ok === null), JSON.stringify(rowsOf(ft)));
  const sc = da.score(S, ev, 60);
  assert.strictEqual(sc.assembly, 100, JSON.stringify(sc.facts) + ' ' + JSON.stringify(sc.s));
  // off the patient, the capnogram goes with it
  da.moveItem(S, can.uid, 6, 6, 0);
  assert.strictEqual(da.capnoOn(S), false, 'a line in the port with the cannula on the bench is not capnography');
});

test('tubing hangs off one dot with a free end, then runs from that end; a failed run leaves it hanging', () => {
  const da = load();
  const S = da.start('sb', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'lvn', 3, 3, 0);
  const neb = itemOf(S, 'lvn');
  const cone = portOf(da, neb, p => p.std === 'iso22');
  const before = S.cart['tube-22'];
  const hung = da.hangTube(S, 'tube-22', ref(cone));
  assert.strictEqual(hung.ok, true);
  assert.strictEqual(hung.state, 'ok', 'a 22 mm socket end pushes onto the cone');
  assert.strictEqual(S.cart['tube-22'], before - 1, 'it came off the cart');
  assert.strictEqual(hung.tube.to, null);
  assert.strictEqual(hung.tube.stub, true);
  assert.strictEqual(da.portTaken(S, cone), true, 'the cone is taken by the hanging piece');
  assert.strictEqual(da.hangTube(S, 'tube-22', ref(cone)).ok, false, 'and takes nothing else');
  const free = da.findPort(S, port(hung.tube.uid, 'to'));
  assert.ok(free && free.stub && free.std === 'iso22' && free.g === 'f', 'the free end is a port you can pick up');
  assert.strictEqual(rowsOf(da.functionTest(S))['Tubing continuity'], false, 'hanging tubing is not continuity');
  // the hanging piece follows its part
  assert.strictEqual(da.moveItem(S, neb.uid, 4, 3, 0).detached, 0);
  assert.strictEqual(S.tubes.filter(t => t.stub).length, 1);
  da.moveItem(S, neb.uid, 3, 3, 0);
  // a run that cannot be laid leaves it hanging: the mask is on the bench with nothing in front of its cone
  da.place(S, 'aeromask', 5, 3, 0);
  const mask = itemOf(S, 'aeromask');
  const maskCone = portOf(da, mask, p => p.std === 'iso22');
  da.place(S, 'suction-canister', 6, 3, 0);            // sits right in front of the mask's cone
  const blocked = da.connectPorts(S, port(hung.tube.uid, 'to'), ref(maskCone), null);
  assert.strictEqual(blocked.ok, false, JSON.stringify(blocked));
  assert.strictEqual(S.tubes.filter(t => t.stub).length, 1, 'still hanging');
  assert.strictEqual(S.cart['tube-22'], before - 1, 'still off the cart');
  da.removeThing(S, itemOf(S, 'suction-canister').uid);
  // now the run lays from the free end, using the hanging piece as the material
  const run = da.connectPorts(S, port(hung.tube.uid, 'to'), ref(maskCone), null);
  assert.strictEqual(run.ok, true, JSON.stringify(run));
  assert.strictEqual(run.tube.def.id, 'tube-22');
  assert.strictEqual(run.picked, null, 'the piece already in hand is the material');
  assert.strictEqual(S.tubes.filter(t => t.stub).length, 0);
  assert.strictEqual(S.cart['tube-22'], before - 1, 'one piece used, not two');
  assert.strictEqual(rowsOf(da.functionTest(S))['Tubing continuity'], true);
  // undo walks the whole thing back to the hanging piece
  da.remember(S); da.removeThing(S, run.tube.uid); da.undo(S);
  assert.ok(S.tubes.some(t => t.to && t.def.id === 'tube-22'));
  // every port on a part carries a gauge word
  for (const d of Object.values(da.DB)) for (const p of d.ports) if (p.t === 'gas' || p.t === 'power') assert.ok(da.GAUGE[p.std], d.id + ' port ' + p.std + ' has a gauge tag');
  /* every gas and power port draws as a glyph on the wall: a male and a female symbol per standard, and a gas color for anything that carries one */
  for (const d of Object.values(da.DB)) for (const p of d.ports) if (p.t === 'gas' || p.t === 'power') {
    assert.ok(da.glyphOf(p.std, 'm') && da.glyphOf(p.std, 'f'), d.id + ' port ' + p.std + ' has male and female glyphs');
    if (/^(qc-|diss-|barb|suct-barb|nema|luer)/.test(p.std)) assert.ok(da.GAS_OF[p.std], d.id + ' port ' + p.std + ' has a gas color');
  }
  for (const d of Object.values(da.DB)) if (d.tube) assert.ok(da.glyphOf(d.ends.std, d.ends.g), d.id + ' tubing end has a glyph');
});
