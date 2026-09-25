/**
 * Device Assembly, the patient who moves (Round 17, 2026-09-23). David: "can we make it so his body can
 * move around the wall like anything else? that functionality will matter when we start making complex
 * semi mazes for everything to be piped through." His call on who moves him: the level places him, and
 * the sandbox lets you drag him. The patient is wherever his three pieces are; everything that asks
 * where the face is (GRID) follows the pieces through a build, a move, an undo and a wall off the wire.
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
  new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-table.js'), 'utf8'), { filename: 'hu-table.js' }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const port = (uid, pi) => ({ uid, pi });
const itemOf = (S, defId) => S.items.find(i => i.def.id === defId);
const barbOf = (da, it) => da.portsOf(it).find(p => p.std === 'barb');
const occupied = (da, S) => { const m = new Set(); for (const it of S.items) for (const [x, y] of da.cellsOf(it)) m.add(x + ',' + y); return m; };

/** the sandbox with oxygen up and a cannula seated on the nose, its lead on the tree */
function cannulaOn(da) {
  const S = da.start('sb', 'right'), dx = S.room.dx;
  da.place(S, 'flowmeter', dx + 3, 1, 0);
  const x = da.place(S, 'xmas', dx + 3, 3, 0).item;
  const can = da.place(S, 'cannula', da.GRID.nose[0], da.GRID.nose[1], 0).item;
  const r = da.connectPorts(S, port(can.uid, 'lead'), port(x.uid, barbOf(da, x).pi), null);
  assert.ok(r.ok, r.why);
  assert.ok(da.onPatientLinks(da.computeLinks(S), can), 'the cannula seats before anything moves');
  return { S, can };
}

test('a level can name where the patient lies, and the nose and the neck follow him there', () => {
  const da = load();
  const base = da.LEVELS.find(l => l.id === 'l1');
  da.LEVELS.push(Object.assign({}, base, { id: 'lowface', face: { x: 2, y: 10 } }));
  const S = da.start('lowface', 'right'), dx = S.room.dx;
  const cheek = itemOf(S, 'pt-cheek');
  assert.deepStrictEqual([cheek.x, cheek.y], [dx + 2, 11], 'the cheek is one row under the face block top, in zone columns');
  assert.deepStrictEqual([...da.GRID.nose], [dx + 3, 11]);
  assert.deepStrictEqual([...da.GRID.neck], [dx + 3, 12]);
  const occ = occupied(da, S);
  assert.ok(!occ.has(da.GRID.nose.join(',')) && !occ.has(da.GRID.neck.join(',')), 'the nose and the neck are still free squares');
  // and a level that names no spot (Level 2, the non-rebreather wall) keeps him where the room always had him
  const S2 = da.start('lnrb', 'right');
  assert.deepStrictEqual([...da.GRID.nose], [...da.ROOMS.right.nose]);
  assert.strictEqual(S2.items.filter(i => i.def.cat === 'patient').length, 3);
});

test('only the sandbox hands the player the patient', () => {
  const da = load();
  assert.deepStrictEqual([...da.LEVELS.filter(l => l.movePatient).map(l => l.id)], ['sb']);
});

test('in the sandbox he moves as one, and the cannula on his face comes with him', () => {
  const da = load();
  const { S, can } = cannulaOn(da);
  const nose0 = [...da.GRID.nose];
  const group = da.patientGroup(S);
  assert.strictEqual(group.length, 4, 'three pieces of him and the cannula');
  assert.ok(group.includes(can.uid));
  const res = da.moveGroup(S, group, 0, 2);
  assert.ok(res.ok, res.why);
  assert.deepStrictEqual([...da.GRID.nose], [nose0[0], nose0[1] + 2], 'the nose went with him');
  assert.deepStrictEqual([can.x, can.y], [...da.GRID.nose], 'and the cannula is still on it');
  assert.ok(da.onPatientLinks(da.computeLinks(S), can), 'still seated');
  assert.ok(S.tubes.some(t => t.lead === can.uid && t.to), 'its lead is still on the tree, re-routed');
});

test('he stays on the wall and under the rail; a refused move leaves him where he was', () => {
  const da = load();
  const { S } = cannulaOn(da);
  const nose0 = [...da.GRID.nose], group = da.patientGroup(S);
  assert.ok(!da.moveGroup(S, group, 0, 20).ok, 'off the bottom of the wall');
  assert.ok(!da.moveGroup(S, group, 0, -8).ok, 'onto the rail');
  assert.deepStrictEqual([...da.GRID.nose], nose0);
});

test('undo puts him back, and a wall off the wire puts him where that wall had him', () => {
  const da = load();
  const { S } = cannulaOn(da);
  const nose0 = [...da.GRID.nose];
  da.remember(S);
  assert.ok(da.moveGroup(S, da.patientGroup(S), -1, 2).ok);
  const moved = [...da.GRID.nose], snap = da.snapshot(S);
  assert.ok(da.undo(S));
  assert.deepStrictEqual([...da.GRID.nose], nose0, 'undo');
  const other = da.start('sb', 'right');
  da.restore(other, snap);
  assert.deepStrictEqual([...da.GRID.nose], moved, 'restore');
});
