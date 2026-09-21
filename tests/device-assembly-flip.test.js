/**
 * Device Assembly, the mirror (Round 14, 2026-09-19): a part can face the other way (it.f swaps its
 * columns and its east and west sides after the rotation), and a room's patient can face the other
 * way too (face.flip puts the cheek on the right of the nose, so the tubing leaves over the left ear).
 * Same sandbox loader as the engine tests; rendering is skipped.
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
const sideOf = (da, it, pick) => da.portsOf(it).find(pick).s;
const mirrored = da => Object.assign({}, da.ROOMS.right, { face: Object.assign({}, da.ROOMS.right.face, { flip: true }) });

test('a mirrored part swaps east and west: the cannula faces the patient on the right and its tubing leaves on the left', () => {
  const da = load();
  const S = da.start('t3', 'left');
  const plain = da.place(S, 'cannula', 5, 5, 0).item;
  assert.strictEqual(sideOf(da, plain, p => p.t === 'patient'), 'W');
  assert.strictEqual(sideOf(da, plain, p => p.internal), 'E');
  da.removeThing(S, plain.uid);   // one cannula on this cart
  const flipped = da.place(S, 'cannula', 7, 5, 0, true).item;
  assert.strictEqual(flipped.f, true);
  assert.strictEqual(sideOf(da, flipped, p => p.t === 'patient'), 'E');
  assert.strictEqual(sideOf(da, flipped, p => p.internal), 'W');
  assert.strictEqual(da.flipSide('N'), 'N', 'north and south do not move');
  const jar = da.place(S, 'bubble', 9, 5, 0).item;
  assert.strictEqual(sideOf(da, jar, p => p.std === 'barb'), 'E', 'the humidifier barb points east');
  assert.ok(da.flip(S, jar.uid).ok);
  assert.strictEqual(sideOf(da, jar, p => p.std === 'barb'), 'W', 'flipped, it points west');
  assert.strictEqual(sideOf(da, jar, p => p.std === 'diss-1240'), 'N', 'its nut still faces the flowmeter');
});

test('the mirror survives undo, and a part is still one footprint either way', () => {
  const da = load();
  const S = da.start('t3', 'left');
  const can = da.place(S, 'cannula', 5, 5, 0, true).item;
  da.remember(S);
  da.flip(S, can.uid);
  assert.strictEqual(can.f, false);
  assert.ok(da.undo(S));
  assert.strictEqual(itemOf(S, 'cannula').f, true, 'undo brings the mirror back');
  assert.deepStrictEqual([...da.cellsOf(itemOf(S, 'cannula')).map(c => c.join(','))], ['5,5']);
});

test('a room whose patient faces the other way: the cheek sits right of the nose, a mirrored cannula seats, a plain one does not', () => {
  const da = load();
  const S = da.start('t3', mirrored(da));
  const F = S.room.face, cheek = itemOf(S, 'pt-cheek'), top = itemOf(S, 'pt-top');
  assert.deepStrictEqual([cheek.x, cheek.y], [F.x + 2, F.y + 1], 'the cheek is on the right of the nose');
  assert.strictEqual(sideOf(da, cheek, p => p.t === 'patient'), 'W', 'and it looks left, into the nose square');
  assert.strictEqual(top.x, F.x + 1, 'the hair sits over the nose and the cheek; the left ear column is open');
  assert.strictEqual(S.items.some(i => i.def.cat === 'patient' && i.x === F.x && i.y === F.y + 1), false, 'the square beside the left ear is free for the tubing');
  const nose = da.GRID.nose;
  const plain = da.place(S, 'cannula', nose[0], nose[1], 0).item;
  assert.strictEqual(da.onPatientLinks(da.computeLinks(S), plain), false, 'a cannula facing the wrong way is not on the patient');
  da.removeThing(S, plain.uid);
  const can = da.place(S, 'cannula', nose[0], nose[1], 0, true).item;
  assert.strictEqual(da.onPatientLinks(da.computeLinks(S), can), true, 'a mirrored cannula seats on the cheek');
});

test('dropped on a patient who faces the other way, a cannula turns to face them (the mirror is part of auto-orient)', () => {
  const da = load();
  const S = da.start('t3', mirrored(da));
  const nose = da.GRID.nose;
  const can = da.place(S, 'cannula', nose[0], nose[1], 0).item;
  const ao = da.autoOrient(S, can.uid);
  assert.strictEqual(ao.turned, true);
  assert.strictEqual(can.f, true, 'it mirrored itself');
  assert.strictEqual(da.onPatientLinks(da.computeLinks(S), can), true);
});

test('in a mirrored room the straight build runs up the left ear column: seven feet and the same one bend as the right-facing wall', () => {
  const da = load();
  const S = da.start('t3', mirrored(da)), dx = S.room.dx, nose = da.GRID.nose;
  da.place(S, 'flowmeter', dx + 3, 1, 0);
  const tree = da.place(S, 'xmas', dx + 3, 3, 0).item;
  assert.strictEqual(sideOf(da, tree, p => p.std === 'barb'), 'S', 'the tree barb points down either way');
  const can = da.place(S, 'cannula', nose[0], nose[1], 0, true).item;
  const barb = da.portsOf(tree).find(p => p.std === 'barb');
  const r = da.connectPorts(S, port(can.uid, 'lead'), port(tree.uid, barb.pi), null);
  assert.ok(r.ok && r.state === 'ok' && r.short === 0, r.why);
  assert.strictEqual(r.len, 7, 'seven cells up the left ear column');
  assert.strictEqual(r.bends, 1, 'one bend under the barb, the mirror of the usual run');
  assert.ok(r.tube.path.every(c => c[0] <= nose[0]), 'the whole run is on the left of the nose');
  assert.ok(da.evaluate(S).ok, 'the order is met facing the other way');
});

test('nothing is mirrored by default: the shipped rooms face the way they always did', () => {
  const da = load();
  for (const name of ['left', 'right']) { const S = da.start('t1', name); assert.strictEqual(!!S.room.face.flip, false, name); assert.strictEqual(itemOf(S, 'pt-cheek').x, S.room.face.x, name + ': the cheek is left of the nose'); assert.strictEqual(itemOf(S, 'src-t1').f, undefined, 'fixed pieces carry no mirror'); }
});
