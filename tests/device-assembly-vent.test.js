/**
 * Device Assembly, Stage C (2026-10-04, David: "lets move onto stage c"): the ventilator walls. A vent with its oxygen
 * hose and a red-outlet cord, the heated humidifier in the inspiratory limb, the Y at the endotracheal tube, and the
 * expiratory limb back to the vent. The rules come off the rule sheet (VENT_RULES). Plan:
 * docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md, Stage C.
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
const port = (it, label) => ({ uid: it.uid, pi: da.portsOf(it).find(p => p.label === label).pi });
const item = (S, id) => S.items.find(i => i.def.id === id);
const text = ev => ev.lines.map(l => l.t).join(' ');
const linked = (S, a, b) => da.computeLinks(S).some(l => l.s === 'ok' && ((l.a.uid === a.uid && l.a.pi === a.pi && l.b.uid === b.uid && l.b.pi === b.pi) || (l.b.uid === a.uid && l.b.pi === a.pi && l.a.uid === b.uid && l.a.pi === b.pi)));
/* set a part down so the named port of it seats on the named port of another, trying every spot and turn near it */
function seatOn(S, defId, myLabel, target) {
  const t = S.items.find(i => i.uid === target.uid);
  for (let y = Math.max(1, t.y - 3); y <= t.y + 4; y++) for (let x = Math.max(0, t.x - 3); x <= t.x + 4; x++) for (const r of [0, 1, 2, 3]) for (const f of [false, true]) {
    const res = da.place(S, defId, x, y, r, f); if (!res.ok) continue;
    if (linked(S, port(res.item, myLabel), target)) return res.item;
    da.removeThing(S, res.item.uid);
  }
  return null;
}
const run = r => r && r.ok && !r.short && r.state === 'ok';

test('the ventilator walls are on the wall list, play in the ICU bed space, and never in the levels or the dealt walls', () => {
  const vent = da.LEVELS.filter(l => l.vent).map(l => l.id);
  assert.deepStrictEqual(plain(vent), ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'vf1', 'vf2', 'vf3']);
  for (const id of vent.filter(id => level(id).extras.some(e => e.def === 'pt-ett'))) {
    const S = da.newState(level(id));
    assert.ok(S.items.some(i => i.fixed && i.def.id === 'pt-ett'), id + ': the patient is intubated');
    assert.strictEqual(S.items.filter(i => i.fixed && i.def.id === 'deco-elec-red').length, 2, id + ': two red outlets');
    assert.ok(!S.items.some(i => i.fixed && /sharps|gloves|sanitizer|clock/.test(i.def.id)), id + ': nothing else crowds the bed');
  }
  for (const d of Object.values(da.DB)) if (d.vc) assert.ok(!da.LEVELS.filter(l => !l.vent && l.kind !== 'sandbox').some(l => l.cart.some(c => c[0] === d.id)), d.id + ' stays on the ventilator walls');
});

test('Set up a ventilator: the reference build passes at par, and the walls that arrive built arrive plugged in', () => {
  const L = level('v1'), S = da.newState(L);
  assert.ok(!da.evaluate(S).ok, 'an empty wall is not a ventilator');
  da.ventSetup(S); assert.ok(da.ventPlug(S), 'the cords and the hose reach');
  const ev = da.evaluate(S);
  assert.ok(ev.ok, text(ev)); assert.strictEqual(ev.title, 'System complete');
  const f = da.score(S, ev, 0).facts;
  for (const k of ['comp', 'cells', 'conn', 'len', 'bends']) assert.ok(f[k === 'comp' ? 'comps' : k === 'conn' ? 'conns' : k] <= L.par[k], k + ' within par');
  const vent = item(S, 'vent');
  assert.ok(S.tubes.some(t => t.lead === vent.uid && t.to && S.items.find(i => i.uid === t.to.uid).def.id === 'deco-elec-red'), 'the vent is on a red outlet');
  // the expiratory limb has to come back
  const exp = S.tubes.find(t => t.def.id === 'limb-exp'); da.removeThing(S, exp.uid);
  assert.match(text(da.evaluate(S)), /expiratory limb does not come back/);
});

test('An inline treatment: arrives working but short of the order, and the mesh neb plus an expiratory filter fix it', () => {
  const S = da.newState(level('v2'));
  assert.strictEqual(S.moves, 0); assert.strictEqual(S.history.length, 0);
  const ev0 = da.evaluate(S);
  assert.ok(!ev0.ok); assert.match(text(ev0), /filter on the expiratory limb/); assert.match(text(ev0), /inline treatment/);
  const vent = item(S, 'vent'), y = item(S, 'y-piece'), heat = item(S, 'heated');
  for (const t of S.tubes.filter(t => /^limb-/.test(t.def.id))) da.removeThing(S, t.uid);
  const neb = seatOn(S, 'neb-mesh', '22 mm socket', port(y, 'Inspiratory arm')) || (() => { throw new Error('the neb seats on the Y'); })();
  const nebIn = da.portsOf(neb).find(p => p.label === '22 mm cone');
  const filt = seatOn(S, 'filter-bv', '22 mm socket', port(vent, 'Expiratory port')) || (() => { throw new Error('the filter seats on the vent'); })();
  const filtIn = da.portsOf(filt).find(p => p.label === '22 mm cone');
  assert.ok(run(da.connectPorts(S, port(heat, 'Chamber outlet'), { uid: neb.uid, pi: nebIn.pi }, 'limb-insp')), 'the heated limb to the neb');
  assert.ok(run(da.connectPorts(S, port(y, 'Expiratory arm'), { uid: filt.uid, pi: filtIn.pi }, 'limb-exp')), 'the expiratory limb to the filter');
  const ev = da.evaluate(S);
  assert.ok(ev.ok, text(ev)); assert.strictEqual(ev.warns.length, 0);
});

test('the rules: aerosol with no expiratory filter is a note, a neb on the expiratory side and an HME with a neb are wrong', () => {
  // the same treatment on the first wall, where the order does not ask for the filter: it passes, with a note
  const S = da.newState(level('v1')); S.cart['neb-mesh'] = 1; S.cart['filter-bv'] = 1;
  da.ventSetup(S); da.ventPlug(S);
  const y = item(S, 'y-piece'), heat = item(S, 'heated');
  da.removeThing(S, S.tubes.find(t => t.def.id === 'limb-insp').uid);
  const neb = seatOn(S, 'neb-mesh', '22 mm socket', port(y, 'Inspiratory arm'));
  assert.ok(run(da.connectPorts(S, port(heat, 'Chamber outlet'), { uid: neb.uid, pi: da.portsOf(neb).find(p => p.label === '22 mm cone').pi }, 'limb-insp')));
  const ev = da.evaluate(S);
  assert.ok(ev.ok, text(ev)); assert.strictEqual(ev.title, 'System complete, with a note'); assert.match(ev.warns[0], /no filter on the expiratory limb/);
  // an HME at the tube with the neb in the limb (and the heater on) is wrong twice over
  const S2 = da.newState(level('vf1')); S2.cart['neb-mesh'] = 1;
  const y2 = item(S2, 'y-piece'), heat2 = item(S2, 'heated');
  da.removeThing(S2, S2.tubes.find(t => t.def.id === 'limb-insp').uid);
  const neb2 = seatOn(S2, 'neb-mesh', '22 mm socket', port(y2, 'Inspiratory arm'));
  if (neb2 && run(da.connectPorts(S2, port(heat2, 'Chamber outlet'), { uid: neb2.uid, pi: da.portsOf(neb2).find(p => p.label === '22 mm cone').pi }, 'limb-insp'))) {
    const t = text(da.evaluate(S2)); assert.match(t, /HME is still in place/); assert.match(t, /HME and a heated humidifier/);
  }
  // a neb on the expiratory side
  const S3 = da.newState(level('v1')); S3.cart['neb-mesh'] = 1;
  da.ventSetup(S3, { v: [10, 3], h: [7, 3] }); da.ventPlug(S3);   // the treatment wall's spot, where the expiratory port has room
  const vent3 = item(S3, 'vent'), y3 = item(S3, 'y-piece');
  da.removeThing(S3, S3.tubes.find(t => t.def.id === 'limb-exp').uid);
  const neb3 = seatOn(S3, 'neb-mesh', '22 mm socket', port(vent3, 'Expiratory port'));
  assert.ok(neb3, 'the neb seats on the expiratory port');
  assert.ok(run(da.connectPorts(S3, port(y3, 'Expiratory arm'), { uid: neb3.uid, pi: da.portsOf(neb3).find(p => p.label === '22 mm cone').pi }, 'limb-exp')));
  assert.match(text(da.evaluate(S3)), /nebulizer is on the expiratory limb/);
});

test('Heated, and an HME: the fault is the HME rule, Show me rings the HME, and taking it out fixes the wall', () => {
  const L = level('vf1'), S = da.newState(L);
  assert.strictEqual(L.kind, 'fault');
  const ev0 = da.evaluate(S);
  assert.ok(!ev0.ok); assert.match(text(ev0), /HME and a heated humidifier/);
  const hme = item(S, 'hme'), y = item(S, 'y-piece');
  assert.ok(da.faultMatches(S, hme.uid));
  da.removeThing(S, hme.uid);
  const nose = da.GRID.nose;
  const mv = da.moveItem(S, y.uid, nose[0] + 1, nose[1]);
  assert.ok(mv.ok, mv.why);
  assert.ok(S.tubes.filter(t => /^limb-/.test(t.def.id)).every(t => t.to && !t.short), 'both limbs still reach the Y');
  const ev = da.evaluate(S);
  assert.ok(ev.ok, text(ev));
});

test('a vent wall in progress saves and comes back the same, in its own room', () => {
  const S = da.start('v2'); da.removeThing(S, S.tubes.find(t => t.def.id === 'limb-insp').uid);
  const sv = JSON.parse(JSON.stringify(da.packSave()));
  assert.ok(da.applySave(sv), 'it unpacks');
  assert.strictEqual(da.snapshot(da.S), sv.wall, 'the same wall');
  assert.strictEqual(da.S.room.rail.join(), da.ICU_ROOM().rail.join());
});
