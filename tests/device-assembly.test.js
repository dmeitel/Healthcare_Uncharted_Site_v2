/**
 * Device Assembly: the engine under the headwall. The page exports its model through
 * window.__da when the sandbox flag is set, so these tests drive placement, rotation,
 * tubing and scoring without a DOM. Rendering is skipped entirely in that mode.
 *
 * The board is the wall behind the bed, face on: station outlets on the rail across
 * row 0, the patient's face at the bottom left with one free square at the nose, the
 * order clipped beside them, the wall between as the workbench. The bench is free-form:
 * anything goes anywhere except the rail, tubing is laid between any two anchors (a run
 * the tubing cannot cover is laid and flagged short), and only submit judges the build.
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
  assert.ok(ctx.window.__da, 'engine hook exported');
  return ctx.window.__da;
}
const J = v => JSON.stringify(v);   // arrays cross the vm realm boundary, so compare by value
const port = (uid, pi) => ({ uid, pi });
const itemOf = (S, defId) => S.items.find(i => i.def.id === defId);
const itemAt = (S, x, y) => S.items.find(i => i.x === x && i.y === y);
const leadOf = (S, it) => S.tubes.find(t => t.lead === it.uid);
const portOf = (da, it, pred) => da.portsOf(it).find(pred);
const barb = p => p.std === 'barb';
const NOSE = [3, 9];
/** lay a part's attached tubing to a port on another part: click the anchor beside the part, click the port */
const joinLead = (da, S, it, target, pred) => da.connectPorts(S, port(it.uid, 'lead'), port(target.uid, portOf(da, target, pred).pi), null);
/** lay cart tubing between two ports */
const lay = (da, S, a, pa, b, pb, material) => da.connectPorts(S, port(a.uid, portOf(da, a, pa).pi), port(b.uid, portOf(da, b, pb).pi), material || null);

test('the database is real categories with typed ports, and every level references parts that exist', () => {
  const da = load();
  assert.ok(Object.keys(da.DB).length >= 15, 'ten to fifteen parts at least');
  for (const d of Object.values(da.DB)) {
    assert.ok(d.source && d.tier, d.id + ' carries a source and a tier');
    for (const p of d.ports) assert.ok(da.STD[p.std], d.id + ' port uses a known standard');
  }
  for (const L of da.LEVELS) {
    for (const [id] of L.cart) assert.ok(da.DB[id], L.id + ' cart part ' + id + ' exists');
    for (const f of da.roomFixed(da.roomOf(L), L.extras)) assert.ok(da.DB[f.def], L.id + ' fixed part ' + f.def + ' exists');
  }
});

test('the headwall: seven gas outlets on the rail, fixtures taking up wall space, a patient with one free square at the nose', () => {
  const da = load();
  const S = da.start('l1', 'left');
  const outlets = S.items.filter(i => i.def.cat === 'source');
  assert.strictEqual(outlets.length, 7);
  assert.ok(outlets.every(o => o.y === 0), 'outlets live on the rail');
  assert.strictEqual(J(outlets.map(o => o.def.gas)), J(['o2', 'o2', 'air', 'air', 'vac', 'vac', 'o2']));
  assert.ok(outlets.every(o => da.portsOf(o)[0].s === 'S'), 'and point down into the wall');
  assert.ok(S.items.some(i => i.def.id === 'deco-monitor'), 'the monitor is on the wall');
  assert.strictEqual(da.place(S, 'xmas', 12, 2, 0).ok, false, 'and it takes up space');
  assert.strictEqual(da.place(S, 'xmas', 9, 1, 0).ok, true, 'but not the square under the red outlet: a cord has to be able to reach it');
  da.removeThing(S, itemOf(S, 'xmas').uid);
  assert.strictEqual(J(da.GRID.nose), J(NOSE));
  const chin = itemOf(S, 'pt-cheek');
  const face = da.portsOf(chin)[0];
  assert.strictEqual(face.t, 'patient');
  assert.strictEqual(J([face.x, face.y, face.s]), J([2, 9, 'E']), 'the face port looks sideways into the nose square');
  assert.strictEqual(da.place(S, 'coupler', NOSE[0], NOSE[1], 0).ok, true, 'the nose square is free, even for the wrong part');
  assert.ok(da.computeLinks(S).some(l => l.kind === 'adj' && l.s === 'bad' && /patient interface/.test(l.why)), 'and the pairing says only an interface goes there');
});

test('rotation turns footprints and port sides together', () => {
  const da = load();
  assert.strictEqual(J(da.rotCell([0, 0], 1, 2, 1)), J([1, 0]));
  assert.strictEqual(J(da.rotCell([0, 1], 1, 2, 1)), J([0, 0]));
  assert.strictEqual(J(da.rotCell([0, 0], 1, 2, 2)), J([0, 1]));
  assert.strictEqual(da.rotSide('W', 1), 'N');
  assert.strictEqual(da.rotSide('S', 3), 'E');
  const S = da.start('t5', 'left');
  const r = da.place(S, 'ad-22f-barb', 5, 5, 1);
  assert.ok(r.ok);
  assert.strictEqual(portOf(da, r.item, p => p.label === '22 mm socket').s, 'E', 'an adapter turned once points its socket sideways');
  const m = da.moveItem(S, r.item.uid, 6, 5, 0);
  assert.ok(m.ok && r.item.r === 0, 'a move can carry a rotation, which is what a mid-drag turn does');
  // Thorpe tubes only hang upright: the rotation is ignored on placement and refused afterward
  const fm = da.place(S, 'flowmeter', 3, 1, 1);
  assert.ok(fm.ok && fm.item.r === 0, 'the flowmeter seats upright whatever you asked for');
  const rot = da.rotate(S, fm.item.uid);
  assert.strictEqual(rot.ok, false);
  assert.match(rot.why, /gravity/);
});

test('a part dropped next to something it fits turns to fit it', () => {
  const da = load();
  const S = da.start('t3', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  const xm = da.place(S, 'xmas', 3, 3, 2).item;         // nut pointing down, barb pointing up: wrong way round
  assert.strictEqual(da.facts(S).barbOut, false, 'upside down, nothing seats');
  const ao = da.autoOrient(S, xm.uid);
  assert.ok(ao.turned && xm.r === 0, 'it turned its nut up to the outlet');
  assert.strictEqual(da.facts(S).barbOut, true);
  assert.strictEqual(da.autoOrient(S, xm.uid).turned, false, 'and stays put once it fits');
  const bub = da.place(S, 'bubble', 5, 5, 1).item;      // out on the wall, nothing to fit
  assert.strictEqual(da.autoOrient(S, bub.uid).turned, false, 'nothing to fit, nothing turns');
});

test('three states of compatibility come from metadata, not color; outlets and threads are gas-specific', () => {
  const da = load();
  const S = da.start('l1', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  const fm = itemOf(S, 'flowmeter');
  const outlet = portOf(da, fm, p => p.label === 'Outlet');
  const o2 = da.portsOf(itemAt(S, 3, 0))[0], air = da.portsOf(itemAt(S, 4, 0))[0];
  assert.strictEqual(da.compat(o2, da.portsOf(fm)[0]).s, 'ok', 'Ohmeda O2 probe seats in an Ohmeda O2 outlet');
  const c0 = da.compat(air, da.portsOf(fm)[0]);
  assert.strictEqual(c0.s, 'bad', 'the same probe does not seat in the air outlet');
  assert.match(c0.why, /gas-specific/);
  const tubeEnd = { t: 'gas', std: 'barb', g: 'f', k: 'bi' };
  const c = da.compat(outlet, tubeEnd);
  assert.strictEqual(c.s, 'warn', 'DISS thread vs tubing end needs an adapter');
  assert.strictEqual(c.adapter.id, 'xmas', 'and the adapter is the Christmas tree');
  assert.strictEqual(da.compat(tubeEnd, tubeEnd).s, 'warn', 'two tubing ends want a connector');
  assert.strictEqual(da.compat(outlet, { t: 'gas', std: 'iso22', g: 'f', k: 'bi' }).s, 'bad', 'a 22 mm socket never takes a DISS thread');
  assert.strictEqual(da.compat({ t: 'gas', std: 'diss-1160', g: 'm', k: 'out' }, da.DB.xmas.ports[0]).s, 'bad', 'an oxygen nut does not thread onto an air flowmeter');
  assert.strictEqual(da.compat({ t: 'gas', std: 'barb', g: 'm', k: 'in' }, { t: 'gas', std: 'barb', g: 'f', k: 'in' }).s, 'bad', 'two inlets');
});

test('the wall is a workbench: only the rail and overlaps refuse a part; the patient is a submit-time rule', () => {
  const da = load();
  const S = da.start('l1', 'left');
  assert.strictEqual(da.place(S, 'xmas', 2, 0, 0).ok, false, 'nothing goes on the rail');
  assert.strictEqual(da.place(S, 'xmas', 0, 1, 0).ok, true, 'the edge of the wall is fine');
  assert.strictEqual(da.place(S, 'coupler', 7, 11, 0).ok, true, 'a connector can lie on the floor while you think');
  assert.strictEqual(da.place(S, 'cannula', 4, 5, 0).ok, true, 'the cannula can be assembled on the wall');
  assert.strictEqual(da.place(S, 'bubble', 4, 5, 0).ok, false, 'but not on top of something');
  assert.strictEqual(da.place(S, 'tube-o2-7', 5, 5, 0).ok, false, 'tubing is not placed; it is laid between ports');
  assert.strictEqual(da.place(S, 'heated', 2, 10, 0).ok, false, 'the patient takes up space too');
  assert.strictEqual(S.cart.cannula, 0, 'the cart is finite');
  assert.strictEqual(da.place(S, 'cannula', NOSE[0], NOSE[1], 0).ok, false, 'none left');
  assert.strictEqual(S.tubes.length, 1, 'the cannula brought its own tubing');
  da.removeThing(S, itemOf(S, 'cannula').uid);
  assert.strictEqual(S.cart.cannula, 1, 'back on the cart');
  assert.strictEqual(S.tubes.length, 0, 'and its tubing left with it');
});

test('tutorial 1: click the anchor, click the barb; put the cannula on the nose and the tubing runs straight up beside the ear', () => {
  const da = load();
  const S = da.start('t1', 'left');
  const src = itemOf(S, 'src-t1');
  assert.strictEqual(portOf(da, src, barb).s, 'E', 'the source barb points out the side');
  const can = da.place(S, 'cannula', 5, 6, 0).item;         // on the wall first
  let c = joinLead(da, S, can, src, barb);
  assert.ok(c.ok && c.state === 'ok', c.why);
  assert.strictEqual(c.short, 0);
  let ev = da.evaluate(S);
  assert.strictEqual(ev.ok, false);
  assert.ok(ev.lines.some(l => l.h === 'Not on the patient'), 'it works, but the patient is down there');
  let m = da.moveItem(S, can.uid, NOSE[0], NOSE[1]);
  assert.ok(m.ok);
  assert.strictEqual(m.detached, 0, 'the tubing followed');
  assert.strictEqual(leadOf(S, can).path.length, 7, 'seven feet straight up is exactly what the cannula has');
  assert.strictEqual(leadOf(S, can).short, 0);
  assert.strictEqual(da.bendsOf(leadOf(S, can).path), 0, 'and it runs straight');
  ev = da.evaluate(S);
  assert.ok(ev.ok, 'gas reaches the patient');
  assert.ok(da.onPatientLinks(ev.links, can), 'the patient side seats on the face');
  m = da.moveItem(S, can.uid, 7, 11);
  assert.strictEqual(m.detached, 0, 'down on the floor, the tubing is still laid');
  assert.ok(leadOf(S, can).short > 0, 'but it is flagged short: ' + leadOf(S, can).short);
  ev = da.evaluate(S);
  assert.strictEqual(ev.kind, 'incomplete');
  assert.ok(ev.lines.some(l => l.h === 'Too short'), 'and submit says so');
  const again = joinLead(da, S, can, src, barb);
  assert.strictEqual(again.ok, false);
  assert.match(again.why, /already connected/);
});

test('tutorial 2: a mismatch can be made and looked at; only the nipple adapter turns it green', () => {
  const da = load();
  const S = da.start('t2', 'left');
  const fm = itemOf(S, 'flowmeter');
  const can = da.place(S, 'cannula', NOSE[0], NOSE[1], 0).item;
  const c = joinLead(da, S, can, fm, p => p.label === 'Outlet');
  assert.ok(c.ok, 'the tubing can be laid onto the thread: ' + c.why);
  assert.strictEqual(c.state, 'bad', 'it shows red: a foot short, and the wrong connector');
  assert.strictEqual(c.short, 1);
  assert.match(c.ends[0].why, /adapter/i, 'the reason still names the adapter that would bridge it');
  let ev = da.evaluate(S);
  assert.strictEqual(ev.kind, 'incomplete');
  assert.ok(ev.lines.some(l => l.h === 'Too short' && /Nipple adapter/.test(l.t)), 'the failure names both problems');
  da.removeThing(S, leadOf(S, can).uid);                    // pull it back off
  assert.strictEqual(leadOf(S, can).to, null);
  assert.strictEqual(da.place(S, 'ad-22f-15m', 3, 3, 0).ok, true);
  let links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'bad' && [l.a, l.b].some(p => p.item.def.id === 'ad-22f-15m')), 'the ISO adapter under the flowmeter is red, and it stays there until you move it');
  da.removeThing(S, itemOf(S, 'ad-22f-15m').uid);
  da.place(S, 'xmas', 3, 3, 0);
  links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.item.def.id === 'xmas')), 'the Christmas tree is green');
  const xm = itemOf(S, 'xmas');
  const c2 = joinLead(da, S, can, xm, barb);
  assert.ok(c2.ok && c2.state === 'ok', c2.why);
  assert.strictEqual(c2.len, 7, 'seven feet: up the column and one step over');
  assert.strictEqual(c2.bends, 1);
  ev = da.evaluate(S);
  assert.ok(ev.ok);
  da.moveItem(S, can.uid, 6, 6);                            // off the patient, onto the wall: the tubing follows
  assert.ok(leadOf(S, can).to, 'still joined');
  assert.strictEqual(da.evaluate(S).ok, false, 'but the patient has nothing on');
  da.moveItem(S, can.uid, NOSE[0], NOSE[1]);
  assert.ok(da.evaluate(S).ok);
});

test('tutorial 3: the flowmeter seats itself upright, and the mask fails a 2 L/min order on its own spec', () => {
  const da = load();
  const S = da.start('t3', 'left');
  const fm = da.place(S, 'flowmeter', 3, 1, 3).item;   // dropped under the outlet, any way up
  assert.strictEqual(fm.r, 0, 'a Thorpe tube hangs upright');
  assert.strictEqual(da.facts(S).fmLinked, true, 'and its probe seats in the outlet');
  da.place(S, 'xmas', 3, 3, 0);
  const xm = itemOf(S, 'xmas');
  const mask = da.place(S, 'mask', NOSE[0], NOSE[1], 0).item;
  assert.ok(joinLead(da, S, mask, xm, barb).ok);
  let ev = da.evaluate(S);
  assert.strictEqual(ev.kind, 'invalid');
  assert.match(ev.lines[0].t, /at least 5 L\/min/);
  da.removeThing(S, mask.uid);
  const can = da.place(S, 'cannula', NOSE[0], NOSE[1], 0).item;
  assert.ok(joinLead(da, S, can, xm, barb).ok);
  ev = da.evaluate(S);
  assert.ok(ev.ok);
  const sc = da.score(S, ev, 40);
  assert.strictEqual(sc.s.components, 100, 'three parts is par');
  assert.strictEqual(sc.s.adapters, 100, 'the nipple adapter is part of par on this wall');
  assert.strictEqual(sc.s.tubing, 100, 'and so is the one bend at the top');
  assert.strictEqual(sc.s.workspace, 100);
  assert.strictEqual(sc.s.time, 100, 'under the par time');
  assert.strictEqual(sc.assembly, 100);
  assert.ok(sc.stars >= 4);
});

test('cart tubing is laid between two anchors: the shortest that fits is picked, or the one you chose, and too short is flagged', () => {
  const da = load();
  const S = da.start('l1', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);
  da.place(S, 'coupler', 7, 8, 0);
  const bub = itemOf(S, 'bubble'), cp = itemOf(S, 'coupler');
  let t = lay(da, S, bub, barb, cp, p => p.s === 'W');    // (4,3) down and across to (6,8): eight feet
  assert.ok(t.ok, t.why);
  assert.strictEqual(t.picked, 'tube-o2-25', 'nothing said which tubing, so the shortest that covers the run was picked');
  assert.strictEqual(t.short, 0);
  assert.strictEqual(S.cart['tube-o2-25'], 0);
  assert.ok(t.tube.path.length >= 8);
  da.removeThing(S, t.tube.uid);
  assert.strictEqual(S.cart['tube-o2-25'], 1, 'pulled off, back on the cart');
  t = lay(da, S, bub, barb, cp, p => p.s === 'W', 'tube-o2-7');
  assert.ok(t.ok, 'the seven-foot tubing is laid anyway');
  assert.strictEqual(t.picked, null);
  assert.ok(t.short >= 1, 'and flagged short by ' + t.short);
  assert.strictEqual(t.state, 'bad');
  const ev = da.evaluate(S);
  assert.ok(ev.lines.some(l => l.h === 'Too short'), 'submit explains it');
  assert.strictEqual(lay(da, S, bub, barb, cp, p => p.s === 'W').ok, false, 'both ports are taken now');
  da.place(S, 'ad-22f-15m', 5, 5, 0);
  const blockedTube = da.tubeOn(S, portOf(da, cp, p => p.s === 'W'));
  assert.ok(blockedTube && blockedTube.uid === t.tube.uid, 'the tubing on a port can be found from the port');
});

test('level 1: two working builds, two different scores, and the simpler one wins', () => {
  const da = load();
  // the par build: flowmeter on the second oxygen outlet, humidifier straight on it, cannula on the nose under a straight run
  let S = da.start('l1', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);
  const bub = itemOf(S, 'bubble');
  const can = da.place(S, 'cannula', NOSE[0], NOSE[1], 0).item;
  const j = joinLead(da, S, can, bub, barb);
  assert.ok(j.ok && j.bends === 0, 'straight up the wall beside the ear');
  let ev = da.evaluate(S);
  assert.ok(ev.ok, 'humidified, metered, cannula: the order is satisfied');
  const parScore = da.score(S, ev, 60);
  assert.strictEqual(parScore.assembly, 100, 'par build scores the top: ' + parScore.assembly);
  assert.strictEqual(parScore.word, 'Excellent');
  assert.strictEqual(parScore.cx, 1);

  // the long way round: same humidifier, then 25 ft of tubing to a connector and back to the cannula
  S = da.start('l1', 'left');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);
  const bub2 = itemOf(S, 'bubble');
  da.place(S, 'coupler', 6, 7, 0);
  const cp = itemOf(S, 'coupler');
  const t = lay(da, S, bub2, barb, cp, p => p.s === 'W', 'tube-o2-25');
  assert.ok(t.ok && t.state === 'ok', 'tubing end onto a barb, both ends');
  assert.ok(t.bends >= 1, 'it had to bend to get there');
  const can2 = da.place(S, 'cannula', NOSE[0], NOSE[1], 0).item;
  const j2 = joinLead(da, S, can2, cp, p => p.s === 'E');
  assert.ok(j2.ok && j2.short === 0, j2.why);
  ev = da.evaluate(S);
  assert.ok(ev.ok, 'it works');
  const longScore = da.score(S, ev, 60);
  assert.ok(longScore.total < parScore.total, 'and it scores lower: ' + longScore.total + ' vs ' + parScore.total);
  assert.ok(longScore.s.components < 100 && longScore.s.connections < 100 && longScore.s.tubing < 100 && longScore.s.adapters < 100);
  assert.ok(longScore.why.length >= 2, 'the result explains why');
});

test('level 1 distractors teach: keyed probes, keyed threads, and a suction regulator that is hooked up but not in the way', () => {
  const da = load();
  const S = da.start('l1', 'left');
  da.place(S, 'flowmeter-chem', 3, 1, 0);
  let links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'bad'), 'Chemetron probe in an Ohmeda outlet');
  da.removeThing(S, itemOf(S, 'flowmeter-chem').uid);
  da.place(S, 'flowmeter-air', 2, 1, 0);
  links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'bad'), 'an air probe in an oxygen outlet');
  da.moveItem(S, itemOf(S, 'flowmeter-air').uid, 4, 1);
  links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'ok'), 'the same flowmeter seats in the air outlet');
  da.place(S, 'xmas', 4, 3, 0);
  links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'bad' && [l.a, l.b].some(p => p.item.def.id === 'xmas')), 'an oxygen nut does not thread onto DISS 1160');
  da.removeThing(S, itemOf(S, 'xmas').uid);
  da.place(S, 'suction-reg', 6, 1, 0);
  links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.item.def.id === 'suction-reg')), 'the suction regulator plugs straight into vacuum');
  // now the real build next to it
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);
  const can = da.place(S, 'cannula', NOSE[0], NOSE[1], 0).item;
  assert.ok(joinLead(da, S, can, itemOf(S, 'bubble'), barb).ok);
  let ev = da.evaluate(S);
  assert.ok(ev.ok);
  const sc = da.score(S, ev, 60);
  assert.strictEqual(sc.facts.loose, 0, 'a regulator seated in the vacuum outlet and an air flowmeter in the air outlet are hooked up, not loose');
  // and the HFNC cannula: reachable through a socket adapter beside the face, still invalid for what it needs
  da.removeThing(S, can.uid);
  da.place(S, 'ad-22f-barb', 4, 9, 3);                // socket faces the Optiflow's inlet cone, barb faces away
  const ad = itemOf(S, 'ad-22f-barb');
  assert.strictEqual(portOf(da, ad, barb).s, 'E');
  const r = lay(da, S, itemOf(S, 'bubble'), barb, ad, barb, 'tube-o2-25');
  assert.ok(r.ok && r.state === 'ok', r.why);
  da.place(S, 'hfnc', NOSE[0], NOSE[1], 0);
  links = da.computeLinks(S);
  assert.ok(links.some(l => l.kind === 'adj' && l.s === 'ok' && [l.a, l.b].some(p => p.item.def.id === 'hfnc') && l.a.t === 'gas'), 'socket onto the Optiflow inlet cone');
  ev = da.evaluate(S);
  assert.strictEqual(ev.kind, 'invalid');
  assert.ok(ev.lines.some(l => /high-flow source/.test(l.t)), 'the failure names the missing source');
  assert.ok(ev.lines.some(l => /specifies nasal cannula/.test(l.t)), 'and the order');
});

test('an air flowmeter feeding the patient is caught at submit, not at placement', () => {
  const da = load();
  const S = da.start('l1', 'left');
  da.place(S, 'flowmeter-air', 4, 1, 0);
  da.place(S, 'xmas', 4, 3, 0);                         // red: wrong DISS size
  assert.strictEqual(da.computeLinks(S).filter(l => l.s === 'ok').length, 1, 'only the probe seats');
  da.removeThing(S, itemOf(S, 'xmas').uid);
  da.place(S, 'ad-22f-15m', 4, 3, 0);                   // also red, and allowed to sit there
  const can = da.place(S, 'cannula', NOSE[0], NOSE[1], 0).item;
  const ev = da.evaluate(S);
  assert.strictEqual(ev.kind, 'incomplete');
  assert.ok(can, 'nothing stopped any of it being built');
});

test('routing goes around fixtures, parts and the patient, counts bends, and honors the reach', () => {
  const da = load();
  const S = da.start('l1', 'left');
  da.place(S, 'heated', 4, 4, 0);                     // a 2x2 block in the middle of the wall
  const direct = da.route(S, [3, 5], [7, 5], 25, null);
  assert.ok(direct, 'a path exists');
  assert.ok(direct.length > 5, 'longer than the straight line it cannot take');
  assert.ok(da.bendsOf(direct) >= 2, 'it bends around the humidifier');
  assert.strictEqual(da.route(S, [3, 5], [7, 5], 5, null), null, 'five feet is not enough for that detour');
  assert.strictEqual(da.route(S, [2, 0], [7, 0], 25, null), null, 'the rail is not a lane');
  assert.strictEqual(da.route(S, [1, 3], [1, 5], 25, null).length, 3, 'past the sharps container the wall is open');
  assert.strictEqual(da.route(S, [3, 8], [3, 11], 25, null), null, 'the patient is not a lane either');
});

test('the timed score is the patient: how low the sat got before the system worked', () => {
  const da = load();
  const S = da.start('l1t', 'left');
  assert.strictEqual(S.sat, 96, 'a timed run starts at 96%');
  da.place(S, 'flowmeter', 3, 1, 0);
  da.place(S, 'bubble', 3, 3, 0);
  const can = da.place(S, 'cannula', NOSE[0], NOSE[1], 0).item;
  assert.ok(joinLead(da, S, can, itemOf(S, 'bubble'), barb).ok);
  const ev = da.evaluate(S);
  assert.ok(ev.ok);
  S.satAtFunctional = 94; const fast = da.score(S, ev, 30);
  S.satAtFunctional = 84; const slow = da.score(S, ev, 80);
  assert.ok(fast.s.time > slow.s.time);
  assert.strictEqual(fast.s.time, 93, 'two points of sat lost costs a little');
  assert.strictEqual(slow.s.time, 55, 'twelve points lost costs a lot');
  S.satAtFunctional = 80; assert.strictEqual(da.score(S, ev, 90).s.time, 40, 'the floor');
});
