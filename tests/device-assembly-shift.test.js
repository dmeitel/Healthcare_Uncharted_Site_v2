/**
 * Device Assembly, Stage A5 (2026-10-03, David: "go ahead and start the shift"). Five walls, one patient, the order
 * changing between them, a complication announced before each wall, a bonus between walls, and a last wall that is
 * the player's own build handed back with one thing wrong. These tests hold the promise that makes it fair: the plan
 * comes from the code alone, every wall is solvable on its own complications, and whatever the player did, the cart
 * is topped up so clearing the wall and building it fresh always works.
 * Plan: docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md, A5.
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
const CODES = Array.from({ length: 40 }, (_, i) => 'T' + i.toString(36).toUpperCase());
const plain = x => JSON.parse(JSON.stringify(x));

/* a player who clears the wall and builds the wall's order fresh from whatever they carry */
function clearAndBuild(st, k) {
  for (const tb of st.tubes.filter(t => !t.lead)) da.removeThing(st, tb.uid);
  for (const it of st.items.filter(i => !i.fixed)) da.removeThing(st, it.uid);
  const plan = da.shiftPlanOf(st.shift.code), w = plan.walls[Math.min(k, da.SHIFT_LEN - 2)];
  const recipe = da.recipeOf(w.recipe);
  // built the way its place builds: from the outlet over the bed, or a source set down and plugged in
  const { c, build } = da.shiftWallBuild(plan.place, w.room, recipe, { src: 'wall', cannula: plan.place === 'home' ? 'cannula' : 'cannula-14', mirror: plan.place !== 'hospital', order: { req: w.req, brief: w.brief } });
  return build(st, c);
}
/* the fixed pieces on the wall, square by square, against the room the plan says the wall has now */
const fixedOn = S => S.items.filter(i => i.fixed).map(i => i.x + ',' + i.y + ':' + i.def.id).sort();
const fixedPlan = w => da.roomFixed(w.room, w.extras || []).map(f => f.x + ',' + f.y + ':' + f.def).sort();   // an ICU wall has the intubated patient on it
/* start a shift the way the page does, without the page */
function startShift(code) {
  const S = da.start('shift:' + code + ':0');
  S.shift = da.newShift(S.level); S.shift.arrival = da.snapshot(S);
  return S;
}
const inventory = st => { const h = da.needOf(st); for (const [id, n] of Object.entries(st.cart)) h[id] = (h[id] || 0) + n; return h; };

test('a shift is dealt from its code: the same code is the same five walls, and every planned wall solves on its own complications', () => {
  const stories = new Set(), comps = new Set();
  for (const code of CODES) {
    const p = da.shiftPlanOf(code);
    assert.ok(p, code + ' deals a shift');
    assert.strictEqual(p.walls.length, da.SHIFT_LEN - 1, code + ': four orders, and the fifth wall is the fault');
    assert.deepStrictEqual(plain(p), plain(load().shiftPlan(code)), code + ': the same plan on another page');
    stories.add(p.story);
    for (let k = 0; k < da.SHIFT_LEN; k++) {
      const L = da.shiftLevel(code, k);
      assert.strictEqual(L.id, 'shift:' + code + ':' + k);
      const S = da.newState(L); da.restore(S, L.solution);
      const ev = da.evaluate(S);
      assert.ok(ev.ok, code + ' wall ' + (k + 1) + ' (' + L.title + '): ' + ev.lines.map(l => l.t).join(' | '));
      if (k > 0 && k < da.SHIFT_LEN - 1) comps.add(p.walls[k].comp);
    }
    // each complication lands at most once, and the rail only ever loses outlets
    const landed = p.walls.map(w => w.comp).filter(c => c !== 'none');
    assert.strictEqual(new Set(landed).size, landed.length, code + ': no complication twice');
  }
  for (let i = 0; i < 200; i++) stories.add(da.shiftPlanOf('W' + i.toString(36).toUpperCase()).story);   // the rarer stories need a wider sample
  for (const s of da.SHIFT_STORIES) assert.ok(stories.has(s.id), 'story ' + s.id + ' is dealt');
  for (let i = 0; i < 200; i++) { const p = da.shiftPlanOf('W' + i.toString(36).toUpperCase()); p.walls.slice(1).forEach(w => comps.add(w.comp)); }
  for (const c of ['none', 'cap', 'noair', 'power', 'capr', 'outage', 'outlet']) assert.ok(comps.has(c), 'complication ' + c + ' lands somewhere');
});

test('a whole shift, played by someone who clears the wall each time: the cart always holds enough, every wall works, and the last arrives broken', () => {
  // twenty shifts, and enough of them in a rehab room, at home and in the ICU to walk every place
  const codes = CODES.slice(0, 20); const byPlace = { rehab: 0, home: 0, icu: 0 }, want = { rehab: 6, home: 6, icu: 4 };
  for (let i = 0; i < 400 && Object.keys(want).some(k => byPlace[k] < want[k]); i++) { const c = 'H' + i.toString(36).toUpperCase(), p = da.shiftPlanOf(c); if (p.place !== 'hospital' && byPlace[p.place] < want[p.place]) { byPlace[p.place]++; codes.push(c); } }
  assert.deepStrictEqual(plain(byPlace), want, 'rehab, home and ICU shifts in the walk');
  for (const code of codes) {
    const S = startShift(code);
    const plan = da.shiftPlanOf(code);
    for (let k = 0; k < da.SHIFT_LEN; k++) {
      // the wall's fixed pieces are the plan's room, with every complication so far
      const w = plan.walls[Math.min(k, da.SHIFT_LEN - 2)];
      assert.deepStrictEqual(plain(fixedOn(S)), plain(fixedPlan(w)), code + ' wall ' + (k + 1) + ': the room');
      // what the solution needs is on the wall or the cart
      const inv = inventory(S);
      for (const [id, n] of Object.entries(w.need)) assert.ok((inv[id] || 0) >= n, code + ' wall ' + (k + 1) + ': needs ' + n + ' ' + id + ', has ' + (inv[id] || 0));
      if (k === da.SHIFT_LEN - 1) {
        assert.ok(S.shift.fault, code + ': the last wall has a fault');
        assert.ok(!da.evaluate(S).ok, code + ': the handed-back build does not work (' + S.shift.fault.id + ')');
        assert.ok(S.level.fault && S.level.fault.name, code + ': Show me knows what broke');
      }
      assert.ok(clearAndBuild(S, k), code + ' wall ' + (k + 1) + ': built fresh from the cart');
      const ev = da.evaluate(S);
      assert.ok(ev.ok, code + ' wall ' + (k + 1) + ': ' + ev.lines.map(l => l.t).join(' | '));
      S.finished = true;
      S.shift.scores[k] = { score: 90, word: 'Excellent', why: [], tests: [true], shown: false, title: S.level.title, par: 'at par' };
      if (k < da.SHIFT_LEN - 1) {
        const r = da.dispatchAct('shiftNext', { bonus: da.SHIFT_BONUS[k % 3].id });
        assert.ok(r.ok, code + ' wall ' + (k + 1) + ': on to the next wall');
        assert.strictEqual(S.shift.wall, k + 1);
        assert.strictEqual(S.finished, false);
      }
    }
    assert.strictEqual(da.dispatchAct('shiftNext', { bonus: 'time' }).ok, false, code + ': there is no sixth wall');
    assert.strictEqual(da.shiftTotal(S.shift), 90);
  }
});

test('the carried wall: the order changes on the build you left, a complication lands on it, and Reset goes back to how the wall arrived', () => {
  // find a shift whose second wall brings a power cut onto a high-flow build
  let code = null;
  for (let i = 0; !code && i < 400; i++) { const c = 'P' + i.toString(36).toUpperCase(), p = da.shiftPlanOf(c); if (p && p.walls[1].comp === 'power' && p.walls[0].recipe === 'hfnc') code = c; }
  assert.ok(code, 'a shift with a power cut on high flow exists');
  const S = startShift(code);
  da.restore(S, S.level.solution); S.shift.arrival = da.snapshot(S);   // the player builds wall 1 like the plan
  assert.ok(da.evaluate(S).ok);
  S.finished = true; S.shift.scores[0] = { score: 100, word: 'Excellent', why: [], tests: [false, true], shown: false, title: 'x', par: 'at par' };
  const before = S.items.filter(i => !i.fixed).length;
  assert.ok(da.dispatchAct('shiftNext', { bonus: 'time' }).ok);
  assert.strictEqual(S.items.filter(i => !i.fixed).length, before, 'the build stays on the wall');
  assert.strictEqual(S.shift.time, 30, 'thirty more seconds');
  assert.ok(S.items.some(i => i.def.id === 'deco-elec-off'), 'the white outlets are dead');
  const heater = S.items.find(i => i.def.id === 'heated');
  const cord = S.tubes.find(t => t.lead === heater.uid && t.def.kind === 'cord');
  if (cord.to && S.items.find(i => i.uid === cord.to.uid).def.dead) assert.ok(!da.powered(S, da.computeLinks(S), heater), 'a heater in a dead outlet has no power');
  // a change, then Reset goes back to the wall as it arrived
  const arrived = da.snapshot(S);
  da.dispatchAct('remove', { uids: [heater.uid] });
  assert.notStrictEqual(da.snapshot(S), arrived);
  assert.ok(da.dispatchAct('arrive').ok);
  assert.strictEqual(da.snapshot(S), arrived, 'Reset is the wall as it arrived, not an empty wall');
  assert.strictEqual(da.shiftTotal(S.shift), 98, 'the average, less 2 for the failed test');
});

test('each fault breaks a real build, and the one fix its card names makes it work again', () => {
  const cases = [];
  for (let i = 0; cases.length < 5 && i < 600; i++) {
    const code = 'F' + i.toString(36).toUpperCase(), p = da.shiftPlanOf(code); if (!p) continue;
    const S = da.newState(da.shiftLevel(code, 3)); da.restore(S, da.shiftLevel(code, 3).solution);
    for (const id of Object.keys(da.FAULT_DO)) {
      if (cases.some(c => c.id === id)) continue;
      const ev = da.evaluate(S), on = new Set(ev.path), pathItems = S.items.filter(it => on.has(it.uid));
      const keep = da.snapshot(S), tubesBefore = plain(S.tubes.map(t => ({ uid: t.uid, def: t.def.id, from: t.from, to: t.to, lead: t.lead }))), f = da.FAULT_DO[id](S, pathItems, ev);
      if (f && !da.evaluate(S).ok) {
        cases.push({ id, code, parts: f.parts });
        assert.ok(fix(S, id, tubesBefore), code + ' ' + id + ': the one fix goes on');
        const ev2 = da.evaluate(S);
        assert.ok(ev2.ok, code + ' ' + id + ': fixed, it works again: ' + ev2.lines.map(l => l.t).join(' | '));
      }
      da.restore(S, keep);
    }
  }
  assert.deepStrictEqual(cases.map(c => c.id).sort(), ['airmeter', 'fio2', 'sample', 'tubeoff', 'unplugged'], 'every fault was seen breaking a real build');
  for (const c of cases) assert.ok(c.parts.length, c.id + ' names the part Show me rings');
});
/* the one thing a player does to fix each fault, through the engine */
function fix(S, id, tubesBefore) {
  const ok = r => r && r.ok && !r.short && r.state === 'ok';
  if (id === 'fio2') { const it = S.items.find(i => i.def.fio2 && i.fio2 !== S.level.req.fio2 && i.fio2); return !!it && da.setFio2(S, it.uid, S.level.req.fio2).ok; }
  if (id === 'airmeter') { const it = S.items.find(i => i.def.id === 'flowmeter-air'); const at = [it.x, it.y]; da.removeThing(S, it.uid); return da.place(S, 'flowmeter', at[0], at[1], 0).ok; }
  if (id === 'sample') { const c = S.items.find(i => i.def.id === 'etco2-cannula' || i.def.id === 'capno-adapter'), m = S.items.find(i => i.def.id === 'deco-monitor'); return ok(da.connectPorts(S, { uid: c.uid, pi: 'sample' }, { uid: m.uid, pi: da.portsOf(m).find(p => p.std === 'luer').pi })); }
  if (id === 'unplugged') { const h = S.items.find(i => i.def.needsPower && !S.tubes.some(t => t.lead === i.uid && t.def.kind === 'cord' && t.to));
    for (const r of S.items.filter(i => i.fixed && /^deco-elec/.test(i.def.id) && !i.def.dead)) { const res = da.connectPorts(S, { uid: h.uid, pi: 'cord' }, { uid: r.uid, pi: 0 }); if (ok(res)) return true; if (res.ok) Object.assign(res.tube, { to: null, path: [], short: 0 }); }
    return false; }
  if (id === 'tubeoff') { const now = new Set(S.tubes.filter(t => t.to).map(t => t.uid)); const gone = tubesBefore.find(t => t.to && !now.has(t.uid));
    return gone.lead ? ok(da.connectPorts(S, { uid: gone.lead, pi: gone.from.pi }, gone.to)) : ok(da.connectPorts(S, gone.from, gone.to, gone.def)); }
  return false;
}

test('a shift between walls saves, and a fresh page picks it up at the card between walls', () => {
  const code = CODES[3];
  const S = startShift(code);
  da.restore(S, S.level.solution); S.finished = true; S.shift.scores[0] = { score: 88, word: 'Good', why: [], tests: [true], shown: false, title: 'x', par: 'at par' };
  const sv = plain(da.packSave());
  assert.strictEqual(sv.finished, true);
  assert.strictEqual(sv.shift.wall, 0);
  const db = load();
  assert.ok(db.applySave(sv));
  assert.strictEqual(db.S.finished, true, 'still between walls');
  assert.strictEqual(db.S.shift.scores[0].score, 88);
  assert.ok(db.dispatchAct('shiftNext', { bonus: 'adapters' }).ok, 'and it goes on from there');
  assert.ok((db.S.cart.coupler || 0) >= 1, 'the adapter kit is on the cart');
});

test('a link to a shift opens its first wall, and the ?room= hatch leaves a shift in its own room', () => {
  const L = da.levelById('shift:' + CODES[5]);
  assert.strictEqual(L.id, 'shift:' + CODES[5] + ':0');
  assert.strictEqual(da.levelById('shift:' + CODES[5].toLowerCase() + ':2').id, 'shift:' + CODES[5] + ':2', 'codes ignore case');
  assert.strictEqual(da.roomOf(L), L.room);
  assert.strictEqual(da.levelById('shift:' + CODES[5] + ':9'), undefined, 'there is no tenth wall');
});
