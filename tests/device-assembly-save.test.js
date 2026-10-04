/**
 * Device Assembly, Stage A1 (2026-10-03): the engine contract from .claude/rules/games.md. Every change to the wall
 * goes through one dispatcher, dispatchAct(verb, data), which keeps the undo step and drops it when the engine
 * refuses; and the wall in progress packs to one plain object that a fresh page unpacks to the same wall, which is
 * what lets a reload continue it. Plan: docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md, A1.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = path.join(__dirname, '..', 'src', 'secret-menu', 'device-assembly', 'index.html');
function load() {
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
const itemOf = (S, defId) => S.items.find(i => i.def.id === defId);
const barbOf = (da, it) => da.portsOf(it).find(p => p.std === 'barb');

test('an act goes through the dispatcher: it changes the wall and leaves one undo step; a refused act leaves neither', () => {
  const da = load();
  const S = da.start('day:2026-10-03');
  const before = da.snapshot(S);
  const bad = da.dispatchAct('place', { def: 'flowmeter', x: 0, y: 0, r: 0 });   // the rail
  assert.strictEqual(bad.ok, false, 'a device does not go on the rail');
  assert.strictEqual(S.history.length, 0, 'a refused act leaves no undo step');
  assert.strictEqual(da.snapshot(S), before, 'and no change');
  const fm = da.dispatchAct('place', { def: 'flowmeter', x: S.room.dx + 3, y: 1, r: 0 });
  assert.ok(fm.ok, fm.why);
  assert.strictEqual(S.history.length, 1, 'one act, one undo step');
  assert.ok(da.undo(S) && da.snapshot(S) === before, 'undo puts the wall back exactly');
  assert.strictEqual(da.dispatchAct('nonsense', {}).ok, false, 'an unknown verb does nothing');
});

test('every verb the UI uses is in the table, and nothing in the page changes the live wall except through it', () => {
  const da = load();
  assert.deepStrictEqual(Object.keys(da.VERBS).sort(), ['arrive', 'connect', 'cpap', 'fio2', 'flip', 'group', 'hang', 'move', 'place', 'remove', 'rotate', 'shiftNext', 'unplug']);
  const html = fs.readFileSync(PAGE, 'utf8');
  const verbsAt = html.indexOf('const VERBS = {'), verbsEnd = html.indexOf('function dispatchAct(', verbsAt);
  const outside = html.slice(0, verbsAt) + html.slice(verbsEnd);
  const direct = outside.match(/\b(place|moveItem|moveGroup|hangTube|connectPorts|removeThing|flip|rotate|setFio2|setCpap|unplugRun|autoOrient)\(S\b/g) || [];
  assert.deepStrictEqual(direct, [], 'engine operations on the live wall S run only inside VERBS');
  assert.strictEqual((outside.match(/remember\(S\)/g) || []).length, 1, 'the one remember(S) is the dispatcher\'s own');
});

test('a wall in progress packs to plain JSON and a fresh page unpacks it to the same wall, dealt walls included', () => {
  const da = load();
  for (const id of ['l1', 'day:2026-10-03', 'gen:WI']) {
    const S = da.start(id);
    // build something real: a dealt wall gets half its own solution, an authored wall a flowmeter
    if (S.level.gen) da.restore(S, S.level.gen.solution);
    else assert.ok(da.dispatchAct('place', { def: 'flowmeter', x: S.room.dx + 3, y: 1, r: 0 }).ok);
    S.tests = [false];
    const sv = JSON.parse(JSON.stringify(da.packSave()));
    assert.strictEqual(sv.id, id);
    const db = load();
    assert.ok(db.applySave(sv), id + ' unpacks');
    assert.strictEqual(db.snapshot(db.S), da.snapshot(S), id + ': the same wall');
    assert.deepStrictEqual(db.S.tests, [false], id + ': the tests ride along');
    assert.strictEqual(db.S.level.id, id);
  }
  assert.strictEqual(load().applySave({ v: 1, id: 'no-such-wall', wall: '{}' }), false, 'a save for a wall that does not exist is refused');
  assert.strictEqual(load().applySave({ v: 9, id: 'l1', wall: '{}' }), false, 'a save from another version is refused');
});

test('pulling a run off a port: cart tubing goes back on the cart, a part\'s own line goes back to hanging', () => {
  const da = load();
  const S = da.start('sb', 'left');
  da.place(S, 'flowmeter', 2, 1, 0); da.place(S, 'xmas', 2, 3, 0);
  const cn = da.place(S, 'cannula-14', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  const xm = itemOf(S, 'xmas');
  const r = da.connectPorts(S, { uid: cn.uid, pi: 'lead' }, { uid: xm.uid, pi: barbOf(da, xm).pi });
  assert.ok(r.ok && r.state === 'ok', 'the cannula lead is on the tree');
  const off = da.dispatchAct('unplug', { at: { uid: xm.uid, pi: barbOf(da, xm).pi } });
  assert.ok(off.ok && off.material === null, 'the lead comes off and stays the cannula\'s');
  assert.ok(S.tubes.find(t => t.lead === cn.uid && !t.to), 'the lead hangs');
  assert.strictEqual(da.dispatchAct('unplug', { at: { uid: xm.uid, pi: barbOf(da, xm).pi } }).ok, false, 'nothing left on that port');
});
