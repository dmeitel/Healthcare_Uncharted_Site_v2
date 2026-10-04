/**
 * Device Assembly, Stage A6 (2026-10-04): your own walls. A wall link carries the order, the twist, the room, the
 * decoys and the clock; a combination with no working build is never offered; and a sandbox build travels as a code
 * that opens the same build on someone else's wall. Plan: docs/HU-DEVICE-ASSEMBLY-EXPANSION-2026-10-03.md, A6.
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
    // the save codec deflates with the platform's streams, the way a browser does
    Blob, Response, CompressionStream, DecompressionStream, btoa, atob, TextEncoder, TextDecoder, escape, unescape,
  };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js', 'hu-save.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();
const plain = x => JSON.parse(JSON.stringify(x));
/* what the maker offers for an order: the same filter its twist buttons use */
// (the maker greys out whatever makeWall refuses)
const offered = (recipe, flow) => da.TWISTS.filter(t => { const r = da.RECIPES.find(x => x.id === recipe), src = t.src || 'wall'; return r.src.includes(src) && !(t.noAir && r.needsAir) && !(t.longLead && r.shortLead) && !(src === 'conc' && flow > 5); }).map(t => t.id);

test('a wall link is its settings: written and read back the same', () => {
  const o = { recipe: 'venturi', flow: 8, fio2: 35, twist: 'chem', room: 'mirror', clock: true, seed: 'K3F9' };
  const id = da.myId(o);
  assert.strictEqual(id, 'my:venturi.8.35.chem.mirror.1.K3F9');
  assert.deepStrictEqual(plain(da.myParse(id)), o);
  assert.strictEqual(da.myParse('my:venturi.8.35.chem.attic.1.K3F9'), null, 'no such room');
  assert.strictEqual(da.levelById('my:nonsense'), undefined);
});

test('every wall the maker offers solves: each order deals on the usual wall and the old one, and mirrored where its build can turn', () => {
  let made = 0;
  for (const r of da.RECIPES) {
    const rg = da.MY_RANGE[r.id], flow = rg.flow[Math.floor(rg.flow.length / 2)], fio2 = rg.fio2 ? rg.fio2[0] : 0;
    const rooms = {};
    for (const t of da.TWISTS) for (const room of ['right', 'mirror', 'left']) {
      const id = da.myId({ recipe: r.id, flow, fio2, twist: t.id, room, clock: false, seed: 'T1' });
      const L = da.levelById(id);
      if (!L) continue;
      const S = da.newState(L); da.restore(S, L.solution);
      const ev = da.evaluate(S);
      assert.ok(ev.ok, id + ': ' + ev.lines.map(l => l.t).join(' | '));
      assert.strictEqual(L.req.flow, flow, id + ': the flow asked for');
      if (rg.fio2) assert.strictEqual(L.req.fio2, fio2, id + ': the FiO2 asked for');
      rooms[room] = true; made++;
    }
    assert.ok(rooms.right && rooms.left, r.id + ' deals on the usual wall and the old one');
    if (!['hfnc', 'capno'].includes(r.id)) assert.ok(rooms.mirror, r.id + ' deals for a patient facing the other way');
  }
  assert.ok(made > 150, made + ' made walls');
});

test('the same link deals the same wall on another device, and the clock setting turns the sat clock on', () => {
  const id = 'my:humid.4.0.noair.left.1.AB12';
  const a = da.levelById(id), b = load().levelById(id);
  assert.ok(a && b);
  assert.strictEqual(a.solution, b.solution, 'the same build');
  assert.deepStrictEqual(plain(a.cart), plain(b.cart), 'the same cart, decoys included');
  assert.ok(a.timer > 0, 'the clock is on');
  assert.strictEqual(da.levelById('my:humid.4.0.noair.left.0.AB12').timer, null, 'and off when the link says so');
  assert.strictEqual(da.levelById('my:hfnc.40.40.noair.right.0.AB12'), undefined, 'high flow on a wall with no air is never offered');
  assert.strictEqual(da.levelById('my:cannula.6.0.pump.right.0.AB12'), undefined, 'six liters from a five-liter pump is never offered');
});

test('a sandbox build travels as a code and opens as the same build', async () => {
  const S = da.start('sb');
  const nose = da.GRID.nose;
  da.place(S, 'flowmeter', S.room.dx + 3, 1, 0); da.place(S, 'bubble', S.room.dx + 3, 3, 0);
  const can = da.place(S, 'cannula-14', nose[0], nose[1], 0).item; da.autoOrient(S, can.uid);
  const code = await da.buildCode(S);
  assert.ok(/^HUDA1\./.test(code), 'the game\'s own save prefix');
  assert.ok(code.length < 2000, 'short enough for a link (' + code.length + ' characters)');
  const o = await load().readBuildCode(code);
  assert.strictEqual(o.wall, da.snapshot(S), 'the same build, byte for byte');
  await assert.rejects(load().readBuildCode('HUDA1.notabuild'), 'a broken code is refused');
});

test('the maker\'s places: a rehab room and a home are made the same way, each wall solves, and the twist carries the place in the link', () => {
  let made = 0;
  for (const place of ['rehab', 'home']) {
    const twists = da.PLACE_TWISTS[place].map(t => t.id);
    for (const recipe of da.PLACE_ORDERS[place]) {
      const rg = da.MY_RANGE[recipe], flows = place === 'home' ? rg.flow.filter(f => f <= 5) : rg.flow;
      for (const flow of [flows[0], flows[flows.length - 1]]) for (const twist of twists) for (const room of ['right', 'mirror', 'left']) {
        const id = da.myId({ recipe, flow, fio2: rg.fio2 ? rg.fio2[0] : 0, twist, room, clock: false, seed: 'PL1' });
        const L = da.levelById(id);
        if (!L) continue;
        assert.strictEqual(da.placeOfTwist(twist), place);
        assert.strictEqual(L.gen.place, place, id + ': the place');
        assert.strictEqual(L.req.flow, flow, id + ': the flow asked for');
        assert.ok(L.gen.made, id + ': a made wall shares like one');
        const S = da.newState(L); da.restore(S, L.solution);
        const ev = da.evaluate(S);
        assert.ok(ev.ok, id + ': ' + ev.lines.map(l => l.t).join(' | '));
        made++;
      }
    }
    assert.ok(made > 0);
  }
  assert.ok(made > 60, made + ' place walls made');
  assert.strictEqual(da.levelById('my:hfnc.40.40.piped.right.0.PL1'), undefined, 'no high flow in a rehab room');
  assert.strictEqual(da.levelById('my:mask.6.0.conc.right.0.PL1'), undefined, 'only a cannula at home');
  assert.strictEqual(da.levelById('my:cannula.6.0.conc.right.0.PL1'), undefined, 'and never past 5 L/min');
  const big = da.levelById('my:nrb.15.0.nopiped.right.0.PL1');
  assert.ok(big && plain(big.cart).some(([p]) => p === 'cyl-portable'), 'a rehab bed with no piped oxygen at 15 L/min gets a cylinder, not a concentrator');
  assert.ok(da.levelById('my:cannula.2.0.conc.left.1.PL1').timer > 0, 'the clock rides a place wall too');
});
