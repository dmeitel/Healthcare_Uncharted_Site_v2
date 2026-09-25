/**
 * Device Assembly, merge pass: the function test, undo, the six-line score, and the two
 * tutorials that make placement matter (Place, Optimize). Same sandbox as the engine tests.
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
  // the shared table kit loads first, the way the page's <script src> tag does; it hangs off window
  new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-table.js'), 'utf8'), { filename: 'hu-table.js' }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const port = (uid, pi) => ({ uid, pi });
const itemOf = (S, defId) => S.items.find(i => i.def.id === defId);
const leadOf = (S, it) => S.tubes.find(t => t.lead === it.uid);
const portOf = (da, it, pred) => da.portsOf(it).find(pred);
const barb = p => p.std === 'barb';
const NOSE = [3, 9];
const joinLead = (da, S, it, target, pred) => da.connectPorts(S, port(it.uid, 'lead'), port(target.uid, portOf(da, target, pred).pi), null);
const rowsOf = t => Object.fromEntries(t.rows.map(r => [r.k, r.ok]));

test('the level ladder: five tutorials, the puzzle, the timed run, the non-rebreather, the four bigger walls, the three fault walls, the sandbox', () => {
  const da = load();
  assert.strictEqual(JSON.stringify(da.LEVELS.map(l => l.id)), JSON.stringify(['t1', 't2', 't3', 't4', 't5', 'l1', 'l1t', 'lnrb', 'l2', 'l3', 'l4', 'l5', 'f1', 'f2', 'f3', 'sb']));
  assert.ok(da.DB['deco-shelf'] && da.DB['deco-ivpole'], 'the Place tutorial has its fixtures');
  const S = da.start('t4', 'left');
  assert.ok(S.items.some(i => i.def.id === 'deco-shelf' && i.x === 2 && i.y === 5), 'shelf under the left outlets');
  assert.ok(S.items.some(i => i.def.id === 'deco-ivpole'), 'pole on the right');
  assert.ok(da.LEVELS.every(l => 'bends' in l.par), 'every par says how many bends the shortest run needs');
});

test('function test: eight lines with reasons, and the verdict tracks the build', () => {
  const da = load();
  const S = da.start('l1', 'left');   // the patient lies a row lower on level 1, so its cart carries the 14 ft cannula (Round 17)
  let t = da.functionTest(S);
  assert.strictEqual(t.ok, false);
  assert.strictEqual(t.rows.length, 8);
  assert.deepStrictEqual(rowsOf(t), { 'Oxygen source': false, 'Flow control': false, 'Humidification': false, 'Tubing continuity': true, 'Patient interface': false, 'FiO2': null, 'Capnography': null, 'CPAP': null });
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'xmas', 3, 3, 0);
  const can = da.place(S, 'cannula-14', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  assert.ok(joinLead(da, S, can, itemOf(S, 'xmas'), barb).ok);
  t = da.functionTest(S);
  assert.strictEqual(t.ok, false, 'connected and on the patient, but the order says humidified');
  assert.strictEqual(rowsOf(t)['Oxygen source'], true);
  assert.strictEqual(rowsOf(t)['Flow control'], true);
  assert.strictEqual(rowsOf(t)['Humidification'], false);
  assert.strictEqual(rowsOf(t)['Patient interface'], true);
  da.removeThing(S, itemOf(S, 'xmas').uid);
  da.place(S, 'bubble', 3, 3, 0);
  assert.ok(joinLead(da, S, can, itemOf(S, 'bubble'), barb).ok);
  t = da.functionTest(S);
  assert.strictEqual(t.ok, true);
  assert.ok(t.rows.every(r => r.ok === true || r.ok === null), JSON.stringify(rowsOf(t)));
  // off the patient, the interface line says where it goes
  da.moveItem(S, can.uid, 5, 5);
  t = da.functionTest(S);
  assert.strictEqual(rowsOf(t)['Patient interface'], false);
  assert.match(t.rows.find(r => r.k === 'Patient interface').t, /nose/);
  // a short run breaks continuity, with the reason on the line
  da.moveItem(S, can.uid, 12, 12);   // past even the 14 ft tube this wall carries (Round 17)
  t = da.functionTest(S);
  assert.strictEqual(rowsOf(t)['Tubing continuity'], false);
  assert.match(t.rows.find(r => r.k === 'Tubing continuity').t, /too short/);
  // humidification reads n/a on a dry order
  const D = da.start('t3', 'left');
  assert.strictEqual(rowsOf(da.functionTest(D))['Humidification'], null);
});

test('undo walks the wall back one move at a time, cart counts included', () => {
  const da = load();
  const S = da.start('t2', 'left');
  da.remember(S); da.place(S, 'xmas', 3, 3, 0);
  da.remember(S); const can = da.place(S, 'cannula', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  da.remember(S); assert.ok(joinLead(da, S, can, itemOf(S, 'xmas'), barb).ok);
  assert.strictEqual(S.tubes.length, 1);
  assert.ok(leadOf(S, can).to, 'joined');
  assert.strictEqual(S.history.length, 3);
  assert.ok(da.undo(S));
  assert.strictEqual(leadOf(S, can).to, null, 'the join is undone; the cannula stays');
  assert.ok(da.undo(S));
  assert.strictEqual(itemOf(S, 'cannula'), undefined, 'the cannula is back on the cart');
  assert.strictEqual(S.cart.cannula, 1);
  assert.strictEqual(S.tubes.length, 0, 'and its attached tubing went with it');
  assert.ok(da.undo(S));
  assert.strictEqual(S.cart.xmas, 1);
  assert.strictEqual(da.undo(S), false, 'nothing left to undo');
  const xm = da.place(S, 'xmas', 3, 3, 0);
  assert.ok(xm.ok && xm.item.def === da.DB.xmas, 'restored defs are the live database objects');
});

test('the score is six percentages and one number: par reads 100 Excellent, the long way reads lower with reasons', () => {
  const da = load();
  let S = da.start('t5', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);
  const can = da.place(S, 'cannula', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  assert.ok(joinLead(da, S, can, itemOf(S, 'bubble'), barb).ok);
  let ev = da.evaluate(S);
  assert.ok(ev.ok);
  const par = da.score(S, ev, 30);
  assert.deepStrictEqual(Object.keys(par.s), ['connections', 'components', 'tubing', 'adapters', 'workspace', 'time']);
  assert.ok(Object.values(par.s).every(v => v === 100));
  assert.strictEqual(par.assembly, 100);
  assert.strictEqual(par.word, 'Excellent');
  assert.strictEqual(par.total, par.assembly, 'best-score storage uses the assembly number');

  S = da.start('t5', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);
  da.place(S, 'coupler', 6, 7, 0);
  const cp = itemOf(S, 'coupler'), bub = itemOf(S, 'bubble');
  const t = da.connectPorts(S, port(bub.uid, portOf(da, bub, barb).pi), port(cp.uid, portOf(da, cp, p => p.s === 'W').pi), 'tube-o2-25');
  assert.ok(t.ok && t.state === 'ok');
  const can2 = da.place(S, 'cannula', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  const j = joinLead(da, S, can2, cp, p => p.s === 'E');
  assert.ok(j.ok && j.short === 0, j.why);
  ev = da.evaluate(S);
  assert.ok(ev.ok);
  const long = da.score(S, ev, 30);
  assert.ok(long.assembly < par.assembly, long.assembly + ' vs ' + par.assembly);
  assert.ok(long.s.components < 100 && long.s.tubing < 100 && long.s.adapters < 100 && long.s.workspace < 100);
  assert.ok(long.why.some(w => /adapter/.test(w)) && long.why.some(w => /bend|feet/.test(w)));
  assert.ok(['Good', 'It works', 'Rough'].includes(long.word));
});

test('tutorial 4 (Place): the shelf makes one outlet a straight run and the other a detour', () => {
  const da = load();
  // under the second outlet the humidifier barb points down column 4, which the shelf does not cover
  let S = da.start('t4', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);
  let can = da.place(S, 'cannula', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  let j = joinLead(da, S, can, itemOf(S, 'bubble'), barb);
  assert.ok(j.ok && j.state === 'ok', j.why);
  assert.strictEqual(j.len, 7);
  assert.strictEqual(j.bends, 0, 'straight up past the shelf');
  let ev = da.evaluate(S);
  assert.ok(ev.ok);
  assert.strictEqual(da.score(S, ev, 30).assembly, 100);
  // under the first outlet the barb points into column 3, and the shelf sits at (3,5): the seven-foot lead cannot make the detour
  S = da.start('t4', 'left');
  da.place(S, 'flowmeter', 2, 1, 0);
  da.place(S, 'bubble', 2, 3, 0);
  can = da.place(S, 'cannula', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  j = joinLead(da, S, can, itemOf(S, 'bubble'), barb);
  assert.ok(j.ok, 'the run is laid anyway');
  assert.ok(j.bends >= 1, 'it goes around the shelf');
  assert.ok(j.short > 0, 'and the attached tubing is short by ' + j.short);
  assert.strictEqual(da.evaluate(S).ok, false);
  // moving the flowmeter over re-routes everything hanging off it and clears the flag
  da.moveItem(S, itemOf(S, 'flowmeter').uid, 3, 1);
  da.moveItem(S, itemOf(S, 'bubble').uid, 3, 3);
  assert.strictEqual(leadOf(S, can).short, 0, 'no longer short');
  assert.strictEqual(da.bendsOf(leadOf(S, can).path), 0);
  assert.ok(da.evaluate(S).ok);
});

test('tutorial 5 (Optimize): the heated humidifier route is overkill, and it works', () => {
  const da = load();
  const S = da.start('t5', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'xmas', 3, 3, 0);                              // DISS thread to barb
  da.place(S, 'heated', 4, 6, 0);                            // chamber cones on W and E
  const a1 = da.place(S, 'ad-22f-barb', 3, 6, 1).item;       // socket faces E onto the inlet cone, barb faces W
  const a2 = da.place(S, 'ad-22f-barb', 6, 6, 3).item;       // socket faces W onto the outlet cone, barb faces E
  let links = da.computeLinks(S);
  const heated = itemOf(S, 'heated');
  assert.strictEqual(links.filter(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.uid === heated.uid)).length, 2, 'both sockets seat on the chamber cones');
  const t = da.connectPorts(S, port(itemOf(S, 'xmas').uid, portOf(da, itemOf(S, 'xmas'), barb).pi), port(a1.uid, portOf(da, a1, barb).pi), 'tube-o2-7');
  assert.ok(t.ok && t.state === 'ok', t.why);
  const can = da.place(S, 'cannula', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  const j = joinLead(da, S, can, a2, barb);
  assert.ok(j.ok && j.state === 'ok' && j.short === 0, j.why);
  // gas gets through, but the heater base has no power yet
  let ev = da.evaluate(S);
  assert.strictEqual(ev.kind, 'invalid', 'unplugged, the chamber humidifies nothing');
  assert.ok(ev.lines.some(l => /not plugged in/.test(l.t)), JSON.stringify(ev.lines));
  assert.strictEqual(da.powered(S, ev.links, heated), false);
  let ft = da.functionTest(S);
  assert.match(ft.rows.find(r => r.k === 'Humidification').t, /not plugged in/);
  // the cord goes to a wall outlet; the white one is close enough
  const outlet = S.items.find(i => i.def.id === 'deco-elec');
  const cordPort = da.portsOf(outlet)[0];
  assert.strictEqual(cordPort.t, 'power');
  const plug = da.connectPorts(S, port(heated.uid, 'cord'), port(outlet.uid, cordPort.pi), null);
  assert.ok(plug.ok && plug.state === 'ok', plug.why);
  assert.strictEqual(plug.tube.def.kind, 'cord');
  assert.ok(plug.len <= 10, 'ten feet of cord reaches the rail: ' + plug.len);
  assert.strictEqual(da.powered(S, da.computeLinks(S), heated), true);
  ev = da.evaluate(S);
  assert.ok(ev.ok, 'humidified, heated, metered oxygen reaches the cannula: ' + JSON.stringify(ev.lines));
  const sc = da.score(S, ev, 60);
  assert.ok(sc.assembly < 75, 'and it is scored as the overkill it is: ' + sc.assembly);
  assert.ok(sc.why.some(w => /Par for this wall/.test(w)) && sc.why.some(w => /adapters/.test(w)));
  // the cone-side adapter does not go onto a cone; the socket-side one does, and the sheet says which
  assert.strictEqual(da.compat(da.DB['ad-22m-barb'].ports[0], portOf(da, heated, p => p.label === 'Chamber outlet')).s, 'bad', 'cone on cone: nothing to seat');
  assert.strictEqual(da.compat(da.DB['ad-22f-barb'].ports[0], portOf(da, heated, p => p.label === 'Chamber outlet')).s, 'ok', 'socket on cone seats');
  assert.strictEqual(da.compat({ t: 'gas', std: 'barb', g: 'f', k: 'bi' }, portOf(da, heated, p => p.label === 'Chamber outlet')).adapter.id, 'ad-22f-barb', 'oxygen tubing onto a cone now names the adapter that bridges it');
});

test('level 2 (High flow): the blender needs both gases and the right dial; the whole chain is par', () => {
  const da = load();
  const S = da.start('l2', 'left');
  const port = (uid, pi) => ({ uid, pi });
  // on the wrong pair of outlets the air probe lands in an oxygen outlet: one green, one red, nothing blended
  let bl = da.place(S, 'blender', 2, 1, 0).item;
  let links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.uid === bl.uid)), 'the oxygen probe seats');
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'bad' && [l.a, l.b].some(p => p.uid === bl.uid)), 'the air probe does not');
  assert.strictEqual(da.powered(S, links, bl), false);
  assert.strictEqual(da.facts(S).blended, false);
  // slide it one column over: O2 under O2, AIR under AIR
  assert.ok(da.moveItem(S, bl.uid, 3, 1).ok);
  links = da.computeLinks(S);
  assert.strictEqual(links.filter(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.uid === bl.uid)).length, 2, 'both probes seat');
  assert.strictEqual(da.facts(S).blended, true);
  assert.strictEqual(bl.fio2, 21, 'the dial starts at room air');
  // the wall flowmeter has no business on a DISS outlet; the high-flow one hangs on it
  assert.ok(da.place(S, 'flowmeter', 4, 3, 0).ok);
  assert.ok(da.computeLinks(S).some(l => l.kind === 'adj' && l.s === 'bad' && [l.a, l.b].some(p => p.item.def.id === 'flowmeter')), 'a wall probe under a DISS thread is red');
  da.removeThing(S, itemOf(S, 'flowmeter').uid);
  assert.ok(da.place(S, 'flowmeter-hf', 4, 3, 0).ok);
  assert.ok(da.computeLinks(S).some(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.item.def.id === 'flowmeter-hf')), 'the DISS nut threads on');
  // the heated chain from tutorial 5, then the heated circuit onto the Optiflow (Level 3 rebuilt the real way, 2026-09-23)
  da.place(S, 'xmas', 4, 5, 0); da.place(S, 'heated', 5, 7, 0); da.place(S, 'ad-22f-barb', 4, 7, 1); da.place(S, 'hfnc', da.GRID.nose[0], da.GRID.nose[1], 0);   // the chamber where its 10 ft cord reaches a receptacle in both rooms; the 7 ft circuit reaches the lower patient
  const xm = itemOf(S, 'xmas'), ad = itemOf(S, 'ad-22f-barb'), he = itemOf(S, 'heated'), hf = itemOf(S, 'hfnc');
  assert.ok(da.connectPorts(S, port(xm.uid, portOf(da, xm, barb).pi), port(ad.uid, portOf(da, ad, barb).pi), 'tube-o2-7').ok);
  const t22 = da.connectPorts(S, port(he.uid, portOf(da, he, p => p.label === 'Chamber outlet').pi), port(hf.uid, portOf(da, hf, p => p.label === 'Breathing tube inlet').pi), 'tube-heated');
  assert.ok(t22.ok && t22.state === 'ok' && t22.short === 0, t22.why);
  const outlet = S.items.find(i => i.def.id === 'deco-elec');
  assert.ok(da.connectPorts(S, port(he.uid, 'cord'), port(outlet.uid, 0), null).ok);
  // everything connects, the dial is wrong
  let ev = da.evaluate(S);
  assert.strictEqual(ev.kind, 'invalid');
  assert.ok(ev.lines.some(l => /set to 21%/.test(l.t)), JSON.stringify(ev.lines));
  let ft = da.functionTest(S);
  assert.strictEqual(rowsOf(ft)['FiO2'], false);
  assert.match(ft.rows.find(r => r.k === 'FiO2').t, /21%/);
  // set the dial, and it is par
  assert.deepStrictEqual(JSON.parse(JSON.stringify(da.setFio2(S, bl.uid, 40))), { ok: true, fio2: 40 });
  ev = da.evaluate(S);
  assert.ok(ev.ok, JSON.stringify(ev.lines));
  ft = da.functionTest(S);
  assert.ok(ft.ok && ft.rows.every(r => r.ok === true || r.ok === null), JSON.stringify(rowsOf(ft)));
  const sc = da.score(S, ev, 100);
  assert.strictEqual(sc.assembly, 100, JSON.stringify(sc.facts) + ' ' + JSON.stringify(sc.s));
  assert.strictEqual(sc.facts.comps, 8);
  // the dial clamps and survives undo
  assert.strictEqual(da.setFio2(S, bl.uid, 140).fio2, 100);
  da.remember(S); da.setFio2(S, bl.uid, 60); da.undo(S);
  assert.strictEqual(itemOf(S, 'blender').fio2, 100, 'undo restores the dial');
});

/* Level 3 rebuilt the real way (2026-09-23, David, RRT): heated high flow runs through the heated-wire circuit, and plain
   22 mm tubing onto the Optiflow rains out. The straight build, in zone columns so it is the same wall in both rooms. */
function straightHighFlow(da, room, material, opts) {
  const o = opts || {};
  const S = da.start('l2', room), dx = S.room.dx;
  const bl = da.place(S, 'blender', dx + 3, 1, 0).item; da.setFio2(S, bl.uid, 40);
  da.place(S, 'flowmeter-hf', dx + 4, 3, 0);
  const xm = da.place(S, 'xmas', dx + 4, 5, 0).item;
  const hy = o.chamberRow || 7;
  const he = da.place(S, 'heated', dx + 5, hy, 0).item, ad = da.place(S, 'ad-22f-barb', dx + 4, hy, 1).item;
  const hf = da.place(S, 'hfnc', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  if (o.cart) Object.assign(S.cart, o.cart);
  const o2 = da.connectPorts(S, port(xm.uid, portOf(da, xm, barb).pi), port(ad.uid, portOf(da, ad, barb).pi), 'tube-o2-7');
  const run = da.connectPorts(S, port(he.uid, portOf(da, he, p => p.label === 'Chamber outlet').pi), port(hf.uid, portOf(da, hf, p => p.label === 'Breathing tube inlet').pi), material);
  let plug = null;
  if (!o.unplugged) {
    const rcpt = S.items.filter(i => i.def.id === 'deco-elec');
    for (const r of rcpt) { da.remember(S); plug = da.connectPorts(S, port(he.uid, 'cord'), port(r.uid, 0), null); if (plug.ok && plug.short === 0) break; da.undo(S); plug = null; }
  }
  return { S, he, hf, o2, run, plug };
}
const RAIN = /Unheated tubing at 35 L\/min rains out: the gas leaves the chamber near body temperature and condenses in the cool tube, and the water runs to the cannula\. High flow uses the heated-wire circuit that plugs into the heater base\./;

test('level 3, heated high flow: the heated circuit is on the cart, and the straight build through it meets par in both rooms', () => {
  const da = load();
  const L = da.LEVELS.find(x => x.id === 'l2');
  assert.strictEqual(L.kicker, 'Level 3');
  const C = da.DB['tube-heated'];
  assert.ok(C && C.tube && C.heatedWire && C.kind === 'heat22', 'the heated circuit is tubing with a heater wire');
  assert.deepStrictEqual({ std: C.ends.std, g: C.ends.g }, { std: 'iso22', g: 'f' }, '22 mm socket ends, like the corrugated tubing');
  assert.match(C.source, /RT302/); assert.match(C.source, /modeled/);
  const cart = Object.fromEntries(L.cart);
  assert.strictEqual(cart['tube-heated'], 1, 'the heated circuit is on the cart');
  assert.strictEqual(cart['tube-22-10'], 1, 'and plain 22 mm tubing long enough to make the same run, the wrong choice');
  assert.ok(!('tube-22' in cart), 'the 6 ft piece is gone: it would fail on too short and never teach why plain tubing is wrong');
  assert.ok(da.LEVELS.find(x => x.id === 'sb').cart.some(c => c[0] === 'tube-heated'), 'the sandbox carries it too');
  for (const room of ['right', 'left']) {
    const b = straightHighFlow(da, room, 'tube-heated');
    assert.ok(b.o2.ok && b.o2.state === 'ok' && b.o2.short === 0, room + ': ' + b.o2.why);
    assert.ok(b.run.ok && b.run.state === 'ok' && b.run.short === 0, room + ': the circuit reaches: ' + b.run.why);
    assert.strictEqual(b.run.len, 7, room + ': seven feet from the chamber outlet to the cannula');
    assert.ok(b.plug && b.plug.state === 'ok', room + ': the ten foot cord reaches a receptacle');
    const links = da.computeLinks(b.S);
    assert.strictEqual(da.circuitHeats(b.S, links, b.run.tube), true, room + ': on a powered chamber the wire heats');
    const ev = da.evaluate(b.S);
    assert.ok(ev.ok, room + ': ' + JSON.stringify(ev.lines));
    const ft = da.functionTest(b.S);
    assert.ok(ft.ok && ft.rows.every(r => r.ok === true || r.ok === null), room + ': ' + JSON.stringify(rowsOf(ft)));
    const sc = da.score(b.S, ev, 100);
    assert.deepStrictEqual({ comps: sc.facts.comps, cells: sc.facts.cells, conns: sc.facts.conns, len: sc.facts.len, adapters: sc.facts.adapters, bends: sc.facts.bends },
      { comps: L.par.comp, cells: L.par.cells, conns: L.par.conn, len: L.par.len, adapters: L.par.adapters, bends: L.par.bends }, room + ': par is the straight build');
    assert.strictEqual(sc.assembly, 100, room);
  }
});

test('level 3: plain 22 mm tubing onto the Optiflow rains out, and the cart hands you plain tubing unless you pick the circuit', () => {
  const da = load();
  // the plain tube on the cart, laid on the same run
  let b = straightHighFlow(da, 'right', 'tube-22-10');
  assert.ok(b.run.ok && b.run.state === 'ok' && b.run.short === 0, 'it seats and it reaches: ' + b.run.why);
  let ev = da.evaluate(b.S);
  assert.strictEqual(ev.kind, 'invalid');
  assert.deepStrictEqual(ev.lines.map(l => l.t).filter(t => RAIN.test(t)).length, 1, JSON.stringify(ev.lines));
  assert.strictEqual(ev.lines.length, 1, 'the rain-out is the only thing wrong: ' + JSON.stringify(ev.lines));
  const ft = da.functionTest(b.S);
  assert.strictEqual(ft.ok, false);
  assert.strictEqual(rowsOf(ft)['Humidification'], false, 'humidity that rains out before the nose does not count');
  assert.match(ft.rows.find(r => r.k === 'Humidification').t, /rains out/);
  // the literal 6 ft tube-22 fails the same way where it reaches: the left room with the chamber a row lower (the old build)
  b = straightHighFlow(da, 'left', 'tube-22', { chamberRow: 8, cart: { 'tube-22': 1 } });
  assert.ok(b.run.ok && b.run.state === 'ok' && b.run.short === 0, b.run.why);
  ev = da.evaluate(b.S);
  assert.strictEqual(ev.ok, false);
  assert.ok(ev.lines.some(l => RAIN.test(l.t)), JSON.stringify(ev.lines));
  // left to choose, the cart grabs the plain tubing: the heated circuit is a deliberate pick
  b = straightHighFlow(da, 'right', null);
  assert.strictEqual(b.run.picked, 'tube-22-10');
  assert.ok(da.evaluate(b.S).lines.some(l => RAIN.test(l.t)));
  // swap it for the circuit and the wall works
  da.removeThing(b.S, b.run.tube.uid);
  const he = b.he, hf = b.hf;
  const fix = da.connectPorts(b.S, port(he.uid, portOf(da, he, p => p.label === 'Chamber outlet').pi), port(hf.uid, portOf(da, hf, p => p.label === 'Breathing tube inlet').pi), 'tube-heated');
  assert.ok(fix.ok && fix.state === 'ok' && fix.short === 0, fix.why);
  ev = da.evaluate(b.S);
  assert.ok(ev.ok, JSON.stringify(ev.lines));
});

test('level 3: the heated circuit on an unpowered heater is not heated', () => {
  const da = load();
  const b = straightHighFlow(da, 'right', 'tube-heated', { unplugged: true });
  assert.ok(b.run.ok && b.run.state === 'ok', b.run.why);
  let links = da.computeLinks(b.S);
  assert.strictEqual(da.powered(b.S, links, b.he), false);
  assert.strictEqual(da.circuitHeats(b.S, links, b.run.tube), false, 'the wire takes its power from the base');
  let ev = da.evaluate(b.S);
  assert.strictEqual(ev.ok, false);
  assert.ok(ev.lines.some(l => /not plugged in/.test(l.t)), 'the line to read is the power: ' + JSON.stringify(ev.lines));
  assert.ok(ev.lines.some(l => /needs heated humidification/.test(l.t)), JSON.stringify(ev.lines));
  assert.ok(!ev.lines.some(l => RAIN.test(l.t)), 'with the heater cold, the gas is not warm, so no rain-out claim');
  // plug it in and the same circuit heats
  const rcpt = b.S.items.find(i => i.def.id === 'deco-elec' && i.x === 13);
  const plug = da.connectPorts(b.S, port(b.he.uid, 'cord'), port(rcpt.uid, 0), null);
  assert.ok(plug.ok && plug.short === 0, JSON.stringify(plug.why));
  links = da.computeLinks(b.S);
  assert.strictEqual(da.circuitHeats(b.S, links, b.run.tube), true);
  assert.ok(da.evaluate(b.S).ok);
  // and a circuit whose chamber end is not on a heater outlet is cold, powered base or not
  const S = da.start('sb', 'left');
  da.place(S, 'flowmeter', 3, 1, 0); da.place(S, 'lvn', 3, 3, 0);
  const neb = itemOf(S, 'lvn'); da.place(S, 'aeromask', da.GRID.nose[0], da.GRID.nose[1], 0);
  const r = da.connectPorts(S, port(neb.uid, portOf(da, neb, p => p.std === 'iso22').pi), port(itemOf(S, 'aeromask').uid, portOf(da, itemOf(S, 'aeromask'), p => p.std === 'iso22').pi), 'tube-heated');
  assert.ok(r.ok && r.state === 'ok', r.why);
  assert.strictEqual(da.circuitHeats(S, da.computeLinks(S), r.tube), false, 'on a nebulizer cone it is only tubing');
});

test('fixtures block placement and routing the same way parts do', () => {
  const da = load();
  const S = da.start('t4', 'left');
  assert.strictEqual(da.place(S, 'xmas', 2, 5, 0).ok, false, 'the shelf occupies its squares');
  assert.strictEqual(da.place(S, 'xmas', 6, 7, 0).ok, false, 'so does the pole');
  assert.strictEqual(da.route(S, [3, 4], [3, 6], 25, null).length > 3, true, 'tubing has to go around the shelf');
});
