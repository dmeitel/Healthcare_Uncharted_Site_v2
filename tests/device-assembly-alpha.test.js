/**
 * Device Assembly, the alpha pass (2026-09-18): the non-rebreather level, find-the-fault
 * mode (the wall arrives built with one thing wrong and you repair it), and the level ladder
 * around them. Same sandbox loader as the engine tests; rendering is skipped. These play in the
 * original left room by name; tests/device-assembly-room.test.js covers the right room the game opens in.
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
const barbOf = (da, it) => da.portsOf(it).find(p => p.std === 'barb');
const ids = da => da.LEVELS.map(L => L.id);

test('the ladder: the non-rebreather level sits after the timed level, the fault walls before the sandbox, and the numbers follow', () => {
  const da = load();
  const seq = ids(da);
  assert.ok(seq.indexOf('lnrb') === seq.indexOf('l1t') + 1, 'NRB right after the timed level: ' + seq.join(','));
  assert.ok(seq.indexOf('f1') > seq.indexOf('l5') && seq.indexOf('f3') === seq.indexOf('sb') - 1, 'fault walls between capnography and the sandbox');
  const k = id => da.LEVELS.find(L => L.id === id).kicker;
  assert.deepStrictEqual([k('lnrb'), k('l2'), k('l3'), k('l4'), k('l5')], ['Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6']);
  for (const id of ['f1', 'f2', 'f3']) { const L = da.LEVELS.find(x => x.id === id); assert.strictEqual(L.kind, 'fault'); assert.ok(L.build && L.fault && L.fault.parts.length, id + ' carries a build and a fault'); }
});

test('the non-rebreather level: the straight build meets par, and a cannula at 15 L/min fails on both lines', () => {
  const da = load();
  const L = da.LEVELS.find(x => x.id === 'lnrb');
  let S = da.start('lnrb', 'left');
  da.place(S, 'flowmeter', 3, 1, 0); const x = da.place(S, 'xmas', 3, 3, 0).item; const nrb = da.place(S, 'nrb', 3, 9, 0).item;
  const r = da.connectPorts(S, port(nrb.uid, 'lead'), port(x.uid, barbOf(da, x).pi), null);
  assert.ok(r.ok && r.state === 'ok' && r.short === 0, r.why);
  const ev = da.evaluate(S);
  assert.ok(ev.ok, JSON.stringify(ev.lines));
  const sc = da.score(S, ev, 60);
  assert.deepStrictEqual({ comps: sc.facts.comps, cells: sc.facts.cells, conns: sc.facts.conns, len: sc.facts.len, adapters: sc.facts.adapters, bends: sc.facts.bends },
    { comps: L.par.comp, cells: L.par.cells, conns: L.par.conn, len: L.par.len, adapters: L.par.adapters, bends: L.par.bends }, 'par is the straight build');
  assert.ok(sc.assembly >= 90, 'the straight build scores in the nineties: ' + sc.assembly);

  S = da.start('lnrb', 'left');
  da.place(S, 'flowmeter', 3, 1, 0); const x2 = da.place(S, 'xmas', 3, 3, 0).item; const can = da.place(S, 'cannula', 3, 9, 0).item;
  da.connectPorts(S, port(can.uid, 'lead'), port(x2.uid, barbOf(da, x2).pi), null);
  const ev2 = da.evaluate(S);
  assert.strictEqual(ev2.ok, false);
  const text = ev2.lines.map(l => l.t).join(' ');
  assert.match(text, /non-rebreather/, 'the interface line');
  assert.match(text, /tops out at 6 L\/min/, 'the flow line: the cannula cannot take 15');
});

test('find the fault 1: both flowmeters up, the cannula tubing on the air tree; the air side answers, the oxygen side does not', () => {
  const da = load();
  const S = da.start('f1', 'left');
  assert.ok(S.items.filter(i => !i.fixed).length >= 5, 'the wall arrived built');
  assert.strictEqual(Object.values(S.cart).reduce((a, b) => a + b, 0), 0, 'the build consumed the cart');
  assert.strictEqual(S.history.length, 0, 'nothing to undo on arrival');
  const ev = da.evaluate(S);
  assert.strictEqual(ev.ok, false);
  assert.match(ev.lines.map(l => l.t).join(' '), /not oxygen/, 'the engine names the wrong gas');
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'xmas-air').uid), true, 'the air tree');
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'flowmeter-air').uid), true, 'the air flowmeter');
  const lead = S.tubes.find(t => t.lead === itemOf(S, 'cannula').uid);
  assert.strictEqual(da.faultMatches(S, lead.uid), true, 'the run pushed onto the air tree');
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'flowmeter').uid), false, 'the oxygen flowmeter is innocent');
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'cannula').uid), false, 'so is the cannula');
});

test('find the fault 2: the heated humidifier is in the path and unplugged; plugging it in makes the wall work', () => {
  const da = load();
  const S = da.start('f2', 'left');
  const heated = itemOf(S, 'heated');
  assert.ok(heated, 'the humidifier is on the wall');
  let ev = da.evaluate(S);
  assert.strictEqual(ev.kind, 'invalid');
  assert.match(ev.lines.map(l => l.t).join(' '), /not plugged in/);
  assert.strictEqual(da.faultMatches(S, heated.uid), true);
  const cord = S.tubes.find(t => t.lead === heated.uid && t.def.kind === 'cord');
  assert.ok(cord, 'the cord hangs off the base');
  assert.strictEqual(da.faultMatches(S, cord.uid), true, 'the hanging cord answers too');
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'cannula').uid), false);
  const outlet = S.items.find(i => i.def.id === 'deco-elec');
  const plug = da.connectPorts(S, port(heated.uid, 'cord'), port(outlet.uid, da.portsOf(outlet)[0].pi), null);
  assert.ok(plug.ok, plug.why);
  ev = da.evaluate(S);
  assert.ok(ev.ok, 'plugged in, the order is met: ' + JSON.stringify(ev.lines));
});

test('find the fault is a repair: each wall can be fixed with what is on it, and submit then passes', () => {
  const da = load();
  // f1: move the cannula tubing from the air tree to the oxygen tree
  let S = da.start('f1', 'left');
  assert.strictEqual(da.evaluate(S).ok, false);
  const can = itemOf(S, 'cannula'), lead = S.tubes.find(t => t.lead === can.uid);
  lead.to = null; lead.path = []; lead.short = 0;                       // what beginReplug does when you pull the end off
  const o2tree = itemOf(S, 'xmas');
  const r1 = da.connectPorts(S, port(can.uid, 'lead'), port(o2tree.uid, barbOf(da, o2tree).pi), null);
  assert.ok(r1.ok && r1.state === 'ok', r1.why);
  assert.ok(da.evaluate(S).ok, 'oxygen reaches the patient once the tubing is on the right tree');
  // f3: luer the sampling line into the monitor
  S = da.start('f3', 'left');
  assert.strictEqual(da.evaluate(S).ok, false);
  const ec = itemOf(S, 'etco2-cannula'), mon = itemOf(S, 'deco-monitor');
  const luer = da.portsOf(mon).find(p => p.std === 'luer');
  const r3 = da.connectPorts(S, port(ec.uid, 'sample'), port(mon.uid, luer.pi), null);
  assert.ok(r3.ok && r3.state === 'ok', r3.why);
  assert.ok(da.evaluate(S).ok, 'capnography reads once the line is in the port');
  // every fault wall is unlocked by the tester hatch's flag, and none arrives with a cart to lean on
  for (const id of ['f1', 'f2', 'f3']) { const L = da.LEVELS.find(x => x.id === id); assert.ok(L.steps.length === 2 && L.steps[0].done({ ev: { ok: true } }), id + ': the first hint clears when the wall works'); }
});

test('find the fault 3: the sampling line is hanging; the cannula and the monitor answer, the flowmeter does not', () => {
  const da = load();
  const S = da.start('f3', 'left');
  const ev = da.evaluate(S);
  assert.strictEqual(ev.ok, false);
  assert.match(ev.lines.map(l => l.t).join(' '), /sampling line/);
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'etco2-cannula').uid), true);
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'deco-monitor').uid), true);
  const sample = S.tubes.find(t => t.lead === itemOf(S, 'etco2-cannula').uid && t.def.kind === 'co2');
  assert.ok(sample && !sample.to, 'the sampling line hangs free');
  assert.strictEqual(da.faultMatches(S, sample.uid), true);
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'flowmeter').uid), false);
});
