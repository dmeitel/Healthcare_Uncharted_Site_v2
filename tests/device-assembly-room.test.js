/**
 * Device Assembly, the room (Round 6, 2026-09-19): a wall is a rail, fixtures, a patient and an
 * order card, and a level names the room it plays in. The engine tests play in the original left
 * room by name; the game opens in the right room, so this file proves the right room is the same
 * puzzle moved over: same seats, same pars, same faults, same repairs.
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
const barbOf = (da, it) => da.portsOf(it).find(p => p.std === 'barb');

test('every room is a whole wall: a rail the width of the wall with five gas outlets, every fixed piece on the wall, nothing overlapping, the nose and the neck free', () => {
  const da = load();
  assert.deepStrictEqual(Object.keys(da.ROOMS).sort(), ['left', 'mirror', 'right']);
  for (const name of Object.keys(da.ROOMS)) {
    const room = da.ROOMS[name];
    assert.strictEqual(room.rail.length, da.GRID.cols, name + ': the rail spans the wall');
    assert.deepStrictEqual([...room.rail.filter(d => d.startsWith('out-'))].sort(), ['out-air', 'out-air', 'out-o2', 'out-o2', 'out-o2', 'out-vac', 'out-vac'], name + ': three oxygen, two air, two vacuum');
    const S = da.start('t3', name);
    const seen = new Map();
    for (const it of S.items) {
      assert.ok(it.fixed, name + ': nothing but the wall arrives on t3');
      for (const [x, y] of da.cellsOf(it)) {
        assert.ok(x >= 0 && x < da.GRID.cols && y >= 0 && y < da.GRID.rows, name + ': ' + it.def.id + ' hangs off the wall at ' + x + ',' + y);
        const k = x + ',' + y;
        assert.ok(!seen.has(k), name + ': ' + it.def.id + ' overlaps ' + seen.get(k) + ' at ' + k);
        seen.set(k, it.def.id);
      }
    }
    assert.ok(!seen.has(room.nose.join(',')) && !seen.has(room.neck.join(',')), name + ': the nose and the neck are free squares');
    assert.deepStrictEqual([...da.GRID.nose], [...room.nose], name + ': the grid follows the patient, who starts where the room puts him');
    assert.strictEqual(da.GRID.order, room.order, name + ': so does the order card');
    const cheek = itemOf(S, 'pt-cheek');
    assert.deepStrictEqual([room.face.flip ? cheek.x - 1 : cheek.x + 1, cheek.y], [...room.nose], name + ': the cheek looks into the nose square');
  }
});

test('the game opens in the right room: the zone and the patient four columns over, the plates on the left, the monitor still east of the ear and the decoy outlet still blocked', () => {
  const da = load();
  assert.strictEqual(da.DEFAULT_ROOM, 'right');
  const S = da.start('t3');
  assert.strictEqual(S.room, da.ROOMS.right);
  assert.strictEqual(S.room.dx, 4);
  assert.deepStrictEqual([...da.GRID.nose], [7, 9]);
  const mon = itemOf(S, 'deco-monitor');
  assert.ok(mon.x > da.GRID.nose[0] + 1, 'the monitor stays east of the ear column, where the sampling line can reach it');
  assert.deepStrictEqual([...S.items.filter(i => i.def.id === 'out-o2').map(i => i.x)].sort((a, b) => a - b), [6, 7, 12], 'the oxygen pair over the zone, the decoy over the monitor');
  assert.deepStrictEqual([...S.items.filter(i => i.def.id === 'deco-elec').map(i => i.x)].sort((a, b) => a - b), [3, 13], 'a plain receptacle on each side of the zone');
  assert.strictEqual(da.canPlace(S, da.DB.flowmeter, 0, 12, 1).ok, false, 'no room for a flowmeter under the decoy outlet');
  assert.strictEqual(da.canPlace(S, da.DB.flowmeter, 0, 7, 1).ok, true, 'the second oxygen outlet takes one');
  assert.deepStrictEqual([...S.cursor], [8, 5], 'the keyboard cursor starts in the zone');
  const left = da.start('t3', 'left');
  assert.deepStrictEqual([...da.GRID.nose], [3, 9], 'a level can still be played in the left room by name');
  assert.strictEqual(itemOf(left, 'deco-monitor').x, 12);
});

test('a level can carry its own room inline, and its extras follow the zone', () => {
  const da = load();
  const t4 = da.LEVELS.find(x => x.id === 't4');
  assert.ok(t4.extras && t4.extras.length === 2, 'the shelf and the pole are extras in zone columns');
  let S = da.start('t4');
  assert.deepStrictEqual([itemOf(S, 'deco-shelf').x, itemOf(S, 'deco-ivpole').x], [6, 10], 'shifted into the right room');
  S = da.start('t4', 'left');
  assert.deepStrictEqual([itemOf(S, 'deco-shelf').x, itemOf(S, 'deco-ivpole').x], [2, 6], 'where they always were on the left');
  const custom = Object.assign({}, da.ROOMS.left, { dx: 3, face: { x: 5, y: 8, w: 3, h: 3 }, nose: [6, 9], neck: [6, 10], fixtures: [] });
  S = da.start('t1', custom);
  assert.deepStrictEqual([...da.GRID.nose], [6, 9]);
  assert.strictEqual(itemOf(S, 'src-t1').x, 6, 'the tutorial source moved with the zone');
  assert.strictEqual(S.items.some(i => i.def.id === 'deco-monitor'), false, 'a room with no fixtures has none');
});

test('the straight build is the same puzzle in both rooms: it seats, it works, and it meets par', () => {
  const da = load();
  const L = da.LEVELS.find(x => x.id === 'lnrb');
  for (const name of ['left', 'right']) {
    const S = da.start('lnrb', name), dx = S.room.dx;
    da.place(S, 'flowmeter', dx + 3, 1, 0);
    const x = da.place(S, 'xmas', dx + 3, 3, 0).item;
    const nrb = da.place(S, 'nrb', da.GRID.nose[0], da.GRID.nose[1], 0).item;
    const r = da.connectPorts(S, port(nrb.uid, 'lead'), port(x.uid, barbOf(da, x).pi), null);
    assert.ok(r.ok && r.state === 'ok' && r.short === 0, name + ': ' + r.why);
    const ev = da.evaluate(S);
    assert.ok(ev.ok, name + ': ' + JSON.stringify(ev.lines));
    const sc = da.score(S, ev, 60);
    assert.deepStrictEqual({ comps: sc.facts.comps, cells: sc.facts.cells, conns: sc.facts.conns, len: sc.facts.len, adapters: sc.facts.adapters, bends: sc.facts.bends },
      { comps: L.par.comp, cells: L.par.cells, conns: L.par.conn, len: L.par.len, adapters: L.par.adapters, bends: L.par.bends }, name + ': par is the straight build');
  }
});

test('the fault walls arrive built in the right room, broken the same way, and the repairs still reach', () => {
  const da = load();
  let S = da.start('f1');
  assert.strictEqual(S.room.dx, 4);
  assert.strictEqual(Object.values(S.cart).reduce((a, b) => a + b, 0), 0, 'the build consumed the cart');
  assert.match(da.evaluate(S).lines.map(l => l.t).join(' '), /not oxygen/);
  const can = itemOf(S, 'cannula-14'), lead = S.tubes.find(t => t.lead === can.uid);
  assert.strictEqual(lead.short, 0, 'the lead reaches the air tree, so nothing looks loose');
  assert.strictEqual(da.faultMatches(S, itemOf(S, 'xmas-air').uid), true);
  lead.to = null; lead.path = []; lead.short = 0;
  const tree = itemOf(S, 'xmas');
  const r1 = da.connectPorts(S, port(can.uid, 'lead'), port(tree.uid, barbOf(da, tree).pi), null);
  assert.ok(r1.ok && r1.state === 'ok' && r1.short === 0, r1.why);
  assert.ok(da.evaluate(S).ok, 'f1 repaired');

  S = da.start('f2');
  assert.strictEqual(da.evaluate(S).kind, 'invalid');
  const heated = itemOf(S, 'heated');
  const outlet = S.items.filter(i => i.def.id === 'deco-elec').sort((a, b) => b.x - a.x)[0];   // the plain receptacle east of the zone; the west ones sit behind the flowmeter column
  assert.ok(outlet.x > heated.x, 'a plain receptacle stays east of the zone');
  const plug = da.connectPorts(S, port(heated.uid, 'cord'), port(outlet.uid, da.portsOf(outlet)[0].pi), null);
  assert.ok(plug.ok && plug.short === 0, 'the ten foot cord reaches it: ' + JSON.stringify(plug.ends && plug.ends[0] && plug.ends[0].why));
  assert.ok(da.evaluate(S).ok, 'f2 repaired');

  S = da.start('f3');
  assert.strictEqual(da.evaluate(S).ok, false);
  const ec = itemOf(S, 'etco2-cannula'), mon = itemOf(S, 'deco-monitor');
  const luer = da.portsOf(mon).find(p => p.std === 'luer');
  const r3 = da.connectPorts(S, port(ec.uid, 'sample'), port(mon.uid, luer.pi), null);
  assert.ok(r3.ok && r3.state === 'ok' && r3.short === 0, 'the sampling line reaches the monitor across the wall: ' + r3.why);
  assert.ok(da.evaluate(S).ok, 'f3 repaired');
});
