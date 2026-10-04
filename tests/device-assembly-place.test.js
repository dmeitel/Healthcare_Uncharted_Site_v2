/**
 * Device Assembly, Stage B (2026-10-04, David: "go ahead and start stage B"): places other than a hospital room. A
 * rehab room has a short headwall with oxygen and suction, no medical air and no monitor, and some beds have no piped
 * oxygen at all. A home has no headwall: furniture, wall outlets, the patient in his recliner, and the oxygen a
 * concentrator or a cylinder set down by the player. Every layout is random and every wall is solved before it is
 * dealt. Plan: docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md, B1 to B3.
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
const ids = (place, n) => Array.from({ length: n }, (_, i) => place + ':P' + i.toString(36).toUpperCase());

test('every rehab room and every home deals a wall that solves, and the same code is the same wall anywhere', () => {
  for (const place of ['rehab', 'home']) {
    for (const id of ids(place, 40)) {
      const L = da.levelById(id);
      assert.ok(L, id + ' deals');
      assert.strictEqual(L.gen.place, place);
      const S = da.newState(L); da.restore(S, L.solution);
      const ev = da.evaluate(S);
      assert.ok(ev.ok, id + ' (' + L.gen.twist + '): ' + ev.lines.map(l => l.t).join(' | '));
    }
    const id = ids(place, 1)[0];
    assert.strictEqual(load().levelById(id).solution, da.levelById(id).solution, place + ': the same wall on another page');
  }
});

test('a rehab room: a short headwall with oxygen and suction, no medical air, no monitor; a bed without piped oxygen gets one brought up', () => {
  const seen = {};
  for (const id of ids('rehab', 60)) {
    const L = da.levelById(id), rail = L.room.rail.filter(Boolean);
    seen[L.gen.twist] = true;
    assert.ok(!rail.includes('out-air'), id + ': no medical air');
    assert.ok(!L.room.fixtures.some(f => f.def === 'deco-monitor'), id + ': no bedside monitor');
    assert.ok(rail.length < da.GRID.cols, id + ': gaps in the headwall');
    if (L.gen.twist === 'piped') assert.ok(rail.includes('out-o2') && rail.includes('out-vac'), id + ': oxygen and suction');
    else {
      assert.ok(!rail.includes('out-o2') && !rail.includes('out-vac'), id + ': no piped oxygen or suction');
      assert.ok(L.cart.some(([p]) => p === 'concentrator-home' || p === 'cyl-portable'), id + ': a source on the cart');
    }
  }
  assert.ok(seen.piped && seen.nopiped, 'both kinds of rehab bed are dealt');
});

test('a home: no rail, furniture and a window, the patient in his recliner, and the oxygen set down by you', () => {
  const seen = {};
  for (const id of ids('home', 60)) {
    const L = da.levelById(id); seen[L.gen.twist] = true;
    assert.ok(L.room.noRail && !L.room.rail.length, id + ': no headwall');
    assert.strictEqual(L.room.place, 'home');
    assert.ok(L.room.fixtures.some(f => f.def === 'deco-window'), id + ': a window');
    assert.ok(L.room.fixtures.some(f => f.def === 'deco-lamp' || f.def === 'deco-table'), id + ': furniture');
    const S = da.newState(L);
    assert.strictEqual(da.GRID.rail, -1, id + ': nothing stops a part on the top row');
    da.restore(S, L.solution);
    const src = S.items.find(i => !i.fixed && i.def.isSource);
    assert.ok(src, id + ': the oxygen is a part you set down');
    if (L.gen.twist === 'outage') {
      assert.ok(L.room.fixtures.some(f => f.def === 'concentrator'), id + ': the dead concentrator stands in the room');
      assert.ok(!L.room.fixtures.some(f => f.def === 'deco-elec'), id + ': every outlet is dead');
      assert.strictEqual(src.def.id, 'cyl-portable', id + ': the backup cylinder');
    }
    if (L.gen.twist === 'conc') assert.strictEqual(src.def.id, 'concentrator-home');
    assert.strictEqual(L.req.iface[0], 'cannula'); assert.ok(L.req.flow <= 5, id + ': within the concentrator');
  }
  assert.ok(seen.conc && seen.outage && seen.cyl, 'every home twist is dealt');
});

test('a concentrator you set down does nothing until it is plugged into an outlet with power', () => {
  let L = null;
  for (const id of ids('home', 60)) { const x = da.levelById(id); if (x.gen.twist === 'conc') { L = x; break; } }
  const S = da.newState(L); da.restore(S, L.solution);
  assert.ok(da.evaluate(S).ok, 'the dealt build works');
  const conc = S.items.find(i => i.def.id === 'concentrator-home'), cord = S.tubes.find(t => t.lead === conc.uid && t.def.kind === 'cord');
  const outlet = S.items.find(i => i.uid === cord.to.uid);
  outlet.def = da.DB['deco-elec-off'];
  const dead = da.evaluate(S);
  assert.ok(!dead.ok && dead.lines.some(l => /not plugged in/.test(l.t)), 'a dead outlet powers nothing');
  outlet.def = da.DB['deco-elec'];
  Object.assign(cord, { to: null, path: [], short: 0 });
  assert.ok(!da.evaluate(S).ok, 'unplugged, it makes nothing');
});

test('furniture never sits on the patient, the bedside screen or another piece, and stays on the wall', () => {
  for (const id of ids('home', 30).concat(ids('rehab', 30))) {
    const L = da.levelById(id), S = da.newState(L), seen = new Map();
    for (const it of S.items) for (const [x, y] of da.cellsOf(it)) {
      assert.ok(x >= 0 && x < da.GRID.cols && y >= 0 && y < da.GRID.rows, id + ': ' + it.def.id + ' off the wall');
      const k = x + ',' + y; assert.ok(!seen.has(k), id + ': ' + it.def.id + ' on top of ' + seen.get(k)); seen.set(k, it.def.id);
    }
    const O = L.room.order;
    for (const f of L.room.fixtures) assert.ok(!(f.x >= O.x - 1 && f.y >= O.y - 1), id + ': ' + f.def + ' under the screen');
  }
});

test('the daily wall visits the new places only from wall #4, and a home deal leaves the hospital wall with its rail', () => {
  assert.deepStrictEqual(['2026-10-03', '2026-10-04', '2026-10-05'].map(da.dayPlace), ['hospital', 'hospital', 'hospital'], 'walls #1 to #3 are as they were dealt');
  const days = {}; for (let n = 3; n < 63; n++) { const d = new Date(Date.UTC(2026, 9, 3 + n)).toISOString().slice(0, 10); days[da.dayPlace(d)] = d; }
  assert.ok(days.hospital && days.rehab && days.home, 'all three places come up');
  assert.strictEqual(da.levelById('day:' + days.home).gen.place, 'home', 'a home day deals a home');
  const S = da.start('day:2026-10-04');
  da.levelById('home:FRESH1');
  assert.strictEqual(da.GRID.rail, 0, 'the hospital wall on screen keeps its rail');
  assert.ok(!da.canPlace(S, da.DB.flowmeter, 0, 5, 0).ok, 'and a device still cannot hang on it');
});
