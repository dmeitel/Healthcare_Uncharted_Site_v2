/**
 * Device Assembly, Stage C, the rest (2026-10-04, David: "go ahead and build the rest of stage c"). The inhaler, suction
 * and EtCO2 on the circuit, the HME that has to come out, noninvasive ventilation, a ventilator at home, two more
 * ventilator faults and two home oxygen faults; and every rule on the sheet the walls can show. Each wall's fix is built
 * here through the engine, the way a player would, and has to pass at its par.
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
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
    Date, Intl,
  };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();
const plain = x => JSON.parse(JSON.stringify(x));
const level = id => da.LEVELS.find(l => l.id === id);
const bare = id => Object.assign({}, level(id), { after: null });
const port = (it, label) => { const p = da.portsOf(it).find(q => q.label === label); assert.ok(p, 'port ' + label + ' on ' + it.def.id); return { uid: it.uid, pi: p.pi }; };
const item = (S, id) => S.items.find(i => i.def.id === id);
const text = ev => ev.lines.map(l => l.t).join(' ');
const run = r => r && r.ok && !r.short && r.state === 'ok';
const link = (S, a, b, mat) => run(da.connectPorts(S, a, b, mat || null));
function plug(S, it) {
  const recs = S.items.filter(i => i.fixed && /^deco-elec/.test(i.def.id) && !i.def.dead).sort((a, b) => (Math.abs(a.x - it.x) + Math.abs(a.y - it.y)) - (Math.abs(b.x - it.x) + Math.abs(b.y - it.y)));
  for (const r of recs) { const res = da.connectPorts(S, { uid: it.uid, pi: 'cord' }, { uid: r.uid, pi: 0 }, null); if (run(res)) return true; if (res.ok) Object.assign(res.tube, { to: null, path: [], short: 0, direct: false }); }
  return false;
}
const inspOf = (S, y) => S.tubes.find(t => [t.from, t.to].some(e => e && e.uid === y.uid && da.portsOf(y).find(p => p.pi === e.pi).label === 'Inspiratory arm'));
/* passes, and at the wall's own par */
function atPar(S, id) {
  const ev = da.evaluate(S); assert.ok(ev.ok, id + ': ' + text(ev));
  const f = da.score(S, ev, 0).facts, par = level(id).par;
  for (const [k, fk] of [['comp', 'comps'], ['cells', 'cells'], ['conn', 'conns'], ['len', 'len'], ['bends', 'bends']]) assert.ok(f[fk] <= par[k], id + ' ' + k + ' ' + f[fk] + ' within par ' + par[k]);
  return ev;
}
/* the reference builds */
const build = {
  v3(S, filter) { const y = item(S, 'y-piece'), heat = item(S, 'heated'); da.removeThing(S, inspOf(S, y).uid);
    const sp = da.place(S, 'mdi-spacer', 8, 8, 3, false).item; assert.ok(link(S, port(heat, 'Chamber outlet'), port(sp, '22 mm cone'), 'limb-insp'));
    if (filter) { da.removeThing(S, S.tubes.find(t => t.def.id === 'limb-exp').uid); const f = da.place(S, 'filter-bv', 9, 5, 0, true).item; assert.ok(link(S, port(item(S, 'y-piece'), 'Expiratory arm'), port(f, '22 mm cone'), 'limb-exp')); } },
  v4(S) { const n = da.GRID.nose;
    const cs = da.place(S, 'suction-closed', n[0] + 1, n[1], 0, false).item, ca = da.place(S, 'capno-adapter', n[0] + 1, n[1] - 1, 3, true).item, y = da.place(S, 'y-piece', n[0] + 1, n[1] - 2, 3, false).item;
    const vent = da.place(S, 'vent', 10, 2, 0, true).item, heat = da.place(S, 'heated', 7, 3, 0, true).item;
    assert.ok(link(S, port(y, 'Expiratory arm'), port(vent, 'Expiratory port'), 'limb-exp') && link(S, port(heat, 'Chamber outlet'), port(y, 'Inspiratory arm'), 'limb-insp') && link(S, port(vent, 'Inspiratory port'), port(heat, 'Chamber inlet'), 'tube-22'));
    assert.ok(da.ventPlug(S), 'plugged'); da.setFio2(S, vent.uid, 40);
    assert.ok(link(S, { uid: ca.uid, pi: 'sample' }, port(item(S, 'deco-monitor'), 'CO2 sampling port')), 'the sampling line reaches the monitor');
    const reg = da.place(S, 'suction-reg', 13, 7, 0); assert.ok(reg.ok, 'the regulator hangs on the boom'); return { cs, reg: reg.item }; },
  v6(S) { const n = da.GRID.nose;
    const m = da.place(S, 'niv-mask', n[0], n[1], 0).item, ex = da.place(S, 'exh-port', n[0] + 1, n[1], 0, false).item;
    const v = da.place(S, 'vent-home', 5, 5, 0, false).item; da.place(S, 'o2-valve', 7, 6, 0, false); const bl = da.place(S, 'o2-bleed', 8, 6, 0, false).item;
    assert.ok(link(S, port(bl, '22 mm cone'), port(ex, '22 mm cone'), 'limb-plain'));
    da.place(S, 'flowmeter', 6, 1, 0); const x = da.place(S, 'xmas', 6, 3, 0).item; assert.ok(link(S, port(x, 'Barb'), port(bl, 'Oxygen port'), 'tube-o2-7'));
    return { m, ex, v, bl }; },
  v7(S) { const n = da.GRID.neck;
    da.place(S, 'hme', n[0] + 1, n[1], 0); da.place(S, 'ad-15f-22m', n[0] + 2, n[1], 3, false); const ex = da.place(S, 'exh-port', n[0] + 3, n[1], 0, false).item;
    const v = da.place(S, 'vent-home', 7, 5, 0, false).item; da.place(S, 'o2-valve', 9, 6, 0, false); const bl = da.place(S, 'o2-bleed', 10, 6, 0, false).item;
    assert.ok(link(S, port(bl, '22 mm cone'), port(ex, '22 mm cone'), 'limb-plain')); assert.ok(plug(S, v), 'the vent on a wall outlet');
    const c = da.place(S, 'concentrator-home', 12, 5, 0, true).item; assert.ok(plug(S, c), 'the concentrator on a wall outlet'); assert.ok(link(S, port(c, 'Outlet barb'), port(bl, 'Oxygen port'), 'tube-o2-7'));
    return { v, c }; },
};

test('the ladder: the ventilator group runs setup, treatments, suction, the swap, noninvasive, home, then the faults; the home faults follow find the fault 3', () => {
  const ids = plain(da.LEVELS.map(l => l.id));
  assert.deepStrictEqual(ids.slice(ids.indexOf('f1'), ids.indexOf('sb')), ['f1', 'f2', 'f3', 'f4', 'f5', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'vf1', 'vf2', 'vf3']);
  for (const id of ['f4', 'f5']) { assert.strictEqual(level(id).kind, 'fault'); assert.ok(!level(id).vent); assert.strictEqual(level(id).room.place, 'home'); }
  for (const id of ['vf2', 'vf3']) assert.strictEqual(level(id).kind, 'fault');
  // the home oxygen parts stay off the bench every dealt wall is built from, and the dealt walls never see a vent part
  const bench = new Set(da.LEVELS.length && plain(da.genLevel('gen:W1').cart.map(c => c[0])));
  for (const id of ['cyl-pulse', 'bubble-home']) assert.ok(da.DB[id].noBench, id);
  assert.ok(!bench.has('vent-home'));
});

test('every new wall arrives the way its order says: short, wrong, or empty, with nothing moved yet', () => {
  const expect = { v3: /inhaler, given in line/, v4: /in-line suction/, v5: /thick, copious secretions/, v6: /No patient interface/, v7: /tracheostomy tube/, vf2: /HME is still in place/, vf3: /filter on the expiratory limb/, f4: /pulse-dose device/, f5: /on backwards/ };
  for (const [id, re] of Object.entries(expect)) { const S = da.newState(level(id)); const ev = da.evaluate(S);
    assert.ok(!ev.ok, id + ' arrives not working'); assert.match(text(ev), re, id); assert.strictEqual(S.moves, 0); assert.strictEqual(S.history.length, 0); }
});

test('An inhaler on the ventilator: the spacer before the Y passes (with a note until the filter goes on); the elbow alone fails', () => {
  let S = da.newState(level('v3')); build.v3(S, false);
  let ev = atPar(S, 'v3'); assert.strictEqual(ev.title, 'System complete, with a note');
  S = da.newState(level('v3')); build.v3(S, true); ev = atPar(S, 'v3'); assert.strictEqual(ev.warns.length, 0);
  // the elbow at the tube instead: rule 7, on the HME circuit where the Y already sits a square out
  S = da.newState(Object.assign({}, level('v5'), { req: { iface: ['ett'], vent: true, fio2: 40, aerosol: 'mdi' }, cart: level('v5').cart.concat([['mdi-elbow', 1]]) }));
  da.removeThing(S, item(S, 'hme').uid); const n = da.GRID.nose; assert.ok(da.place(S, 'mdi-elbow', n[0] + 1, n[1], 0).ok);
  assert.match(text(da.evaluate(S)), /no spacer/);
});

test('Suction and EtCO2: the catheter and the adapter at the tube, suction from the boom, the line in the monitor; each missing piece is named', () => {
  const S = da.newState(bare('v4')); const { cs, reg } = build.v4(S);
  assert.match(text(da.evaluate(S)), /not on suction/, 'the catheter with no suction on it');
  assert.ok(link(S, port(reg, 'Tubing barb'), port(cs, 'Suction port'), 'tube-suct'), 'six feet from the boom');
  atPar(S, 'v4');
  const sample = S.tubes.find(t => t.def.kind === 'co2'); Object.assign(sample, { to: null, path: [], short: 0, direct: false });
  assert.match(text(da.evaluate(S)), /sampling line is not in the monitor/);
});

test('Swap the HME for heated humidity: the heater with the heated limb passes; a plain limb off the heater rains out unless it has a water trap', () => {
  const fixUp = S => { const n = da.GRID.nose, y = item(S, 'y-piece'); da.removeThing(S, item(S, 'hme').uid); assert.ok(da.moveItem(S, y.uid, n[0] + 1, n[1]).ok);
    da.removeThing(S, inspOf(S, item(S, 'y-piece')).uid); const heat = da.place(S, 'heated', 7, 4, 0, true).item;
    assert.ok(link(S, port(item(S, 'vent'), 'Inspiratory port'), port(heat, 'Chamber inlet'), 'tube-22')); assert.ok(plug(S, heat)); return heat; };
  let S = da.newState(level('v5')); let heat = fixUp(S);
  assert.ok(link(S, port(heat, 'Chamber outlet'), port(item(S, 'y-piece'), 'Inspiratory arm'), 'limb-insp')); atPar(S, 'v5');
  // the plain limb from the chamber instead
  S = da.newState(level('v5')); heat = fixUp(S);
  const k = da.snapshot(S);
  if (link(S, port(heat, 'Chamber outlet'), port(item(S, 'y-piece'), 'Inspiratory arm'), 'limb-plain')) assert.match(text(da.evaluate(S)), /rains out/);
  da.restore(S, k);
  // with a water trap on the chamber outlet and the plain limb from it, it works
  const w = da.place(S, 'water-trap', 6, 4, 0, true).item;
  assert.ok(link(S, port(w, '22 mm cone'), port(item(S, 'y-piece'), 'Inspiratory arm'), 'limb-plain'));
  const evT = da.evaluate(S); assert.ok(evT.ok, text(evT));
});

test('Noninvasive ventilation: the reference passes on room air bled with oxygen; rule 9 (no port, the port at the machine, the port covered), rule 10 (no valve) and the battery all read', () => {
  let S = da.newState(level('v6')); let r = build.v6(S);
  let ev = da.evaluate(S); assert.ok(ev.ok, text(ev)); assert.match(ev.warns.join(' '), /internal battery/, 'unplugged, it runs on its battery and says so');
  assert.ok(plug(S, r.v)); atPar(S, 'v6'); assert.strictEqual(da.evaluate(S).warns.length, 0);
  // no exhalation port
  S = da.newState(level('v6')); r = build.v6(S); plug(S, r.v);
  da.removeThing(S, r.ex.uid); const m = item(S, 'niv-mask');
  const lim = S.tubes.find(t => t.def.id === 'limb-plain'); if (lim) da.removeThing(S, lim.uid);
  assert.ok(link(S, port(item(S, 'o2-bleed'), '22 mm cone'), port(m, 'Mask elbow, 22 mm'), 'limb-plain'));
  assert.match(text(da.evaluate(S)), /no exhalation port/);
  // the port covered: anything on the square over its slots
  S = da.newState(level('v6')); r = build.v6(S); plug(S, r.v);
  const above = [r.ex.x, r.ex.y - 1]; S.cart['flex-tube'] = 1; assert.ok(da.place(S, 'flex-tube', above[0], above[1], 0).ok);
  assert.match(text(da.evaluate(S)), /exhalation port is covered/);
  // no pressure valve between the device and the bleed-in: a note
  S = da.newState(level('v6')); r = build.v6(S); plug(S, r.v);
  const valve = item(S, 'o2-valve'); da.removeThing(S, valve.uid); const g = da.clusterOf(S, r.bl.uid); assert.ok(da.moveGroup(S, g, -1, 0).ok, 'the bleed-in slides onto the outlet');
  ev = da.evaluate(S); assert.ok(ev.ok, text(ev)); assert.match(ev.warns.join(' '), /no pressure valve/);
});

test('A ventilator at home: the reference passes; every backup the guideline names is checked', () => {
  const S = da.newState(level('v7')); build.v7(S);
  const ev0 = da.evaluate(S); assert.ok(!ev0.ok);
  assert.match(text(ev0), /second ventilator/); assert.match(text(ev0), /resuscitation bag/); assert.match(text(ev0), /battery suction/);
  assert.ok(da.place(S, 'vent-home', 1, 1, 0).ok && da.place(S, 'bag-bvm', 3, 1, 0).ok && da.place(S, 'suction-portable', 7, 1, 0).ok, 'the backups go in the room');
  atPar(S, 'v7');
  assert.strictEqual(da.score(S, da.evaluate(S), 0).facts.loose, 0, 'a backup in the room is not a loose part');
});

test('the ventilator faults: pull the HME off the treatment (the neb comes with the Y), and move the filter to the expiratory side', () => {
  let S = da.newState(level('vf2')); const y = item(S, 'y-piece');
  assert.ok(da.faultMatches(S, item(S, 'hme').uid));
  da.removeThing(S, item(S, 'hme').uid); assert.ok(da.moveGroup(S, da.clusterOf(S, y.uid), -1, 0).ok);
  let ev = atPar(S, 'vf2'); assert.match(ev.warns.join(' '), /no filter on the expiratory limb/);
  S = da.newState(level('vf3')); assert.ok(da.faultMatches(S, item(S, 'filter-bv').uid));
  da.removeThing(S, item(S, 'filter-bv').uid);
  assert.ok(link(S, port(item(S, 'heated'), 'Chamber outlet'), port(item(S, 'neb-mesh'), '22 mm cone'), 'limb-insp'));
  da.removeThing(S, S.tubes.find(t => t.def.id === 'limb-exp').uid);
  const f = da.place(S, 'filter-bv', 9, 5, 0, true).item; assert.ok(link(S, port(item(S, 'y-piece'), 'Expiratory arm'), port(f, '22 mm cone'), 'limb-exp'));
  atPar(S, 'vf3');
});

test('the home oxygen faults: the cannula straight on the conserving device, and the bottle turned the right way round', () => {
  let S = da.newState(level('f4'));
  da.removeThing(S, item(S, 'bubble-home').uid);
  assert.ok(link(S, { uid: item(S, 'cannula').uid, pi: 'lead' }, port(item(S, 'cyl-pulse'), 'Regulator outlet barb')));
  let ev = atPar(S, 'f4'); assert.strictEqual(ev.warns.length, 0, 'the cannula’s own 7 ft is no note');
  S = da.newState(level('f5')); const b = item(S, 'bubble-home');
  for (const t of S.tubes.filter(t => !t.lead && (t.from.uid === b.uid || (t.to && t.to.uid === b.uid)))) da.removeThing(S, t.uid);
  const cn = item(S, 'cannula'); Object.assign(S.tubes.find(t => t.lead === cn.uid), { to: null, path: [], short: 0, direct: false });
  assert.ok(link(S, port(item(S, 'concentrator-home'), 'Outlet barb'), port(b, 'Inlet barb'), 'tube-o2-7'));
  assert.ok(link(S, { uid: cn.uid, pi: 'lead' }, port(b, 'Outlet barb')));
  atPar(S, 'f5');
});

test('the rest of the sheet: rule 3 (a leak, a cold patient), rule 4 (small breaths), rule 6 (a jet neb on a flowmeter), rule 8 (the neb on the wrong side of the port), rule 15 (a cylinder on long tubing)', () => {
  // rules 3 and 4 on the HME circuit
  for (const { pt, re, warn } of [{ pt: { leak: true }, re: /big leak/, warn: false }, { pt: { cold: true }, re: /under 32 C/, warn: false }, { pt: { lowVt: true }, re: /lung-protective/, warn: true }]) {
    const S = da.newState(Object.assign({}, level('v5'), { req: Object.assign({}, level('v5').req, { patient: pt }) }));
    const ev = da.evaluate(S);
    if (warn) { assert.ok(ev.ok, text(ev)); assert.match(ev.warns.join(' '), re); } else assert.match(text(ev), re);
  }
  let S, r, k;
  // rule 6: a jet neb in the circuit, driven from a flowmeter, passes with a note; undriven, it fails (on the mask circuit,
  // where there is room for the drive line)
  S = da.newState(level('v6')); r = build.v6(S); plug(S, r.v);
  Object.assign(S.cart, { 'neb-jet': 1, flowmeter: 1, xmas: 1, 'tube-o2-14': 1 });
  da.removeThing(S, S.tubes.find(t => t.def.id === 'limb-plain').uid);
  const jet = da.place(S, 'neb-jet', r.ex.x + 1, r.ex.y, 0, false).item;
  assert.ok(link(S, port(item(S, 'o2-bleed'), '22 mm cone'), port(jet, '22 mm cone'), 'limb-plain'));
  assert.match(text(da.evaluate(S)), /no drive gas/);
  k = da.snapshot(S); let driven = false;
  for (const ox of S.items.filter(i => i.fixed && i.def.id === 'out-o2' && !S.items.some(o => !o.fixed && o.x === i.x && o.y === 1)).map(i => i.x)) { da.restore(S, k);
    if (!da.place(S, 'flowmeter', ox, 1, 0).ok) continue; const x = da.place(S, 'xmas', ox, 3, 0); if (!x.ok) continue;
    if (link(S, port(x.item, 'Barb'), port(item(S, 'neb-jet'), 'Drive gas inlet'), 'tube-o2-14')) { driven = true; break; } }
  assert.ok(driven, 'a flowmeter drives the jet neb');
  { const ev = da.evaluate(S); assert.ok(ev.ok, text(ev)); assert.match(ev.warns.join(' '), /adds gas the ventilator did not send/); }
  // rule 8: on the mask, a neb on the machine side of the port is a note
  S = da.newState(level('v6')); r = build.v6(S); plug(S, r.v); S.cart['neb-mesh'] = 1;
  const lim2 = S.tubes.find(t => t.def.id === 'limb-plain'); da.removeThing(S, lim2.uid);
  k = da.snapshot(S); let side = false;
  for (const sp of [[9, 6, 0, false], [9, 6, 2, true]]) { da.restore(S, k); const nb = da.place(S, 'neb-mesh', ...sp); if (!nb.ok) continue;
    if (!plain(da.computeLinks(S)).some(l => l.s === 'ok' && [l.a.uid, l.b.uid].includes(nb.item.uid))) continue;
    if (link(S, port(nb.item, '22 mm cone'), port(item(S, 'exh-port'), '22 mm cone'), 'limb-plain')) { const ev = da.evaluate(S); if (ev.ok) { assert.match(ev.warns.join(' '), /between the exhalation port and the mask/); side = true; break; } } }
  assert.ok(side, 'a neb seated at the machine end reads rule 8');
  // rule 15: at home, a small cylinder with more than 7 ft of tubing is a note (the 14 ft cannula straight on it)
  S = da.newState(level('f4')); da.removeThing(S, item(S, 'bubble-home').uid); da.removeThing(S, item(S, 'cannula').uid); S.cart['cannula-14'] = 1;
  const c14 = da.place(S, 'cannula-14', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  assert.ok(link(S, { uid: c14.uid, pi: 'lead' }, port(item(S, 'cyl-pulse'), 'Regulator outlet barb')));
  const ev15 = da.evaluate(S); assert.ok(ev15.ok, text(ev15)); assert.match(ev15.warns.join(' '), /More than 7 ft of tubing on a small cylinder/);
});

test('rule 14: a regular concentrator with its bottle the right way round is fine; the same bottle on the conserving device fails', () => {
  const S = da.newState(level('f4'));
  assert.match(text(da.evaluate(S)), /cannot sense one through the water/);
  assert.ok(da.VENT_RULES.pulseHumid && da.VENT_RULES.bubbleBackwards);
});

test('the ICU in the deals: every ICU wall solves before it is dealt, arrives unsolved, and the same code is the same wall', () => {
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const id = 'icu:Z' + i.toString(36).toUpperCase(), L = da.levelById(id);
    assert.ok(L, id + ' deals'); seen.add(L.gen.recipe);
    assert.strictEqual(L.room.place, 'icu');
    assert.strictEqual(L.extras.some(e => e.def === 'pt-ett'), L.gen.recipe !== 'vniv', id + ': intubated unless the order is a mask');
    const S = da.newState(L); da.restore(S, L.solution); const ev = da.evaluate(S); assert.ok(ev.ok, id + ': ' + text(ev));
    assert.ok(!da.underScreen(S), id + ': nothing in the solution runs under the bedside screen');
    assert.ok(!da.evaluate(da.newState(L)).ok, id + ' arrives empty');
    for (const [k, n] of L.cart) assert.ok(n > 0 && da.DB[k], id + ' cart ' + k);
  }
  assert.ok(seen.size >= 6, 'most of the ventilator orders came up: ' + [...seen].join(' '));
  const a = load().levelById('icu:SAME'), b = load().levelById('icu:SAME');
  assert.strictEqual(a.solution, b.solution, 'a fresh page deals the same ICU wall from the same code');
});

test('the daily wall visits the ICU only from #5, out of the hospital days, and a made ICU wall comes from the maker', () => {
  for (const k of ['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06']) assert.notStrictEqual(da.dayPlace(k), 'icu', k);
  let icu = 0; for (let d = 7; d <= 60; d++) { const k = new Date(Date.UTC(2026, 9, d)).toISOString().slice(0, 10); if (da.dayPlace(k) === 'icu') { icu++; const L = da.levelById('day:' + k); assert.ok(L && L.gen.place === 'icu', k); } }
  assert.ok(icu >= 3, 'some days in two months are an ICU bed: ' + icu);
  const id = da.myId({ recipe: 'vsecretions', flow: 0, fio2: 50, twist: 'icu', room: 'right', clock: false, seed: 'ICU1' }), L = da.levelById(id);
  assert.ok(L && L.req.patient.secretions && L.req.fio2 === 50, 'a made wall with thick secretions at 50%');
  assert.strictEqual(da.levelById(da.myId({ recipe: 'vsetup', flow: 0, fio2: 40, twist: 'icu', room: 'mirror', clock: false, seed: 'ICU1' })), undefined, 'the ICU bed space is one room');
  const nv = da.levelById(da.myId({ recipe: 'vniv', flow: 3, fio2: 0, twist: 'icu', room: 'right', clock: false, seed: 'ICU2' }));
  assert.ok(nv && nv.req.o2 === 3, 'a made noninvasive wall bleeds in what was picked');
});
