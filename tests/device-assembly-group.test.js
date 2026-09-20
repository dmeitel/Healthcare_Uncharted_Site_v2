'use strict';
/* Device Assembly · group movement. The assembly rule: parts that are physically mated move as one.
   A green joint or a jumper holds; amber and red do not; fixed wall outlets never come along. */
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
const da = load();
const DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
/* arrays born inside the vm belong to another realm, so compare their contents, not their prototypes */
const same = (a, b) => assert.strictEqual([...a].sort().join(','), [...b].sort().join(','));
const jointBetween = (S, a, b) => da.computeLinks(S).find(l => l.kind === 'adj' && [l.a.uid, l.b.uid].includes(a) && [l.a.uid, l.b.uid].includes(b));

/* seat the O2 flowmeter under an O2 quick-connect outlet on the rail */
function seatFlowmeter(S) {
  const src = S.items.find(i => i.fixed && i.def.cat === 'source' && da.portsOf(i).some(p => p.std === 'qc-o2'));
  assert.ok(src, 'an O2 outlet on the rail');
  const r = da.place(S, 'flowmeter', src.x, src.y + 1, 0);
  assert.ok(r.ok, 'flowmeter seats under the outlet: ' + r.why);
  const j = jointBetween(S, r.item.uid, src.uid);
  assert.ok(j && j.s === 'ok', 'the probe mates with the outlet');
  return { src, fm: r.item };
}
/* seat a 1 by 1 part on a host's port: the cell the port faces, turned until the joint is green */
function seatOn(S, host, pred, defId, wantState) {
  const p = da.portsOf(host).find(pred);
  assert.ok(p, 'host has the port');
  const f = [p.x + DELTA[p.s][0], p.y + DELTA[p.s][1]];
  for (let r = 0; r < 4; r++) {
    const res = da.place(S, defId, f[0], f[1], r);
    if (!res.ok) continue;
    const j = jointBetween(S, host.uid, res.item.uid);
    if (j && j.s === (wantState || 'ok')) return res.item;
    da.removeThing(S, res.item.uid);
  }
  assert.fail(defId + ' never seated on ' + host.def.id + ' with a ' + (wantState || 'ok') + ' joint');
}

test('a nipple adapter seated on the flowmeter is in its cluster; the wall outlet is not', () => {
  const S = da.start('sb', 'left');
  const { src, fm } = seatFlowmeter(S);
  const ad = seatOn(S, fm, p => p.std === 'diss-1240' && p.g === 'm', 'xmas');
  same(da.clusterOf(S, fm.uid), [fm.uid, ad.uid]);
  same(da.clusterOf(S, ad.uid), [fm.uid, ad.uid]);
  same(da.clusterOf(S, src.uid), []);
});

test('moveGroup carries the cluster together and the joint stays green', () => {
  const S = da.start('sb', 'left');
  const { fm } = seatFlowmeter(S);
  const ad = seatOn(S, fm, p => p.std === 'diss-1240' && p.g === 'm', 'xmas');
  const before = { fx: fm.x, fy: fm.y, ax: ad.x, ay: ad.y };
  const res = da.moveGroup(S, da.clusterOf(S, fm.uid), 2, 1);
  assert.ok(res.ok, res.why);
  assert.strictEqual(res.moved, 2);
  assert.strictEqual(fm.x, before.fx + 2); assert.strictEqual(fm.y, before.fy + 1);
  assert.strictEqual(ad.x, before.ax + 2); assert.strictEqual(ad.y, before.ay + 1);
  const j = jointBetween(S, fm.uid, ad.uid);
  assert.ok(j && j.s === 'ok', 'still seated after the move');
});

test('a blocked group move is refused whole and nothing shifts', () => {
  const S = da.start('sb', 'left');
  const { fm } = seatFlowmeter(S);
  const ad = seatOn(S, fm, p => p.std === 'diss-1240' && p.g === 'm', 'xmas');
  const before = [fm.x, fm.y, ad.x, ad.y];
  const off = da.moveGroup(S, [fm.uid, ad.uid], da.GRID.cols, 0);
  assert.strictEqual(off.ok, false, 'off the wall is refused');
  const rail = da.moveGroup(S, [fm.uid, ad.uid], 0, -1);
  assert.strictEqual(rail.ok, false, 'onto the rail is refused');
  same([fm.x, fm.y, ad.x, ad.y], before);
  const check = da.moveGroupCheck(S, [fm.uid, ad.uid], 2, 1);
  assert.ok(check.ok, 'the same move sideways is fine: ' + check.why);
});

test('a red joint does not cluster: a 22 mm T-piece against a DISS thread stays behind', () => {
  const S = da.start('sb', 'left');
  const { fm } = seatFlowmeter(S);
  const t = seatOn(S, fm, p => p.std === 'diss-1240' && p.g === 'm', 'tpiece', 'bad');
  same(da.clusterOf(S, fm.uid), [fm.uid]);
  same(da.clusterOf(S, t.uid), [t.uid]);
});

test('tubing between two moved parts slides with them; a run to a part left behind re-routes', () => {
  const S = da.start('sb', 'left');
  const { fm } = seatFlowmeter(S);
  const ad = seatOn(S, fm, p => p.std === 'diss-1240' && p.g === 'm', 'xmas');
  /* a humidifier somewhere below, fed from the adapter's barb by oxygen tubing */
  const hum = da.place(S, 'bubble', 6, 6, 0);
  assert.ok(hum.ok, hum.why);
  const barb = da.portsOf(ad).find(p => p.std === 'barb' && p.g === 'm');
  const inlet = da.portsOf(hum.item).find(p => p.k === 'in' && p.t === 'gas');
  const run = da.connectPorts(S, { uid: ad.uid, pi: barb.pi }, { uid: hum.item.uid, pi: inlet.pi }, null);
  assert.ok(run.ok, run.why);
  const lenBefore = run.tube.path.length;
  const res = da.moveGroup(S, [fm.uid, ad.uid], 1, 0);
  assert.ok(res.ok, res.why);
  const tb = S.tubes.find(t => t.uid === run.tube.uid);
  assert.ok(tb && tb.to, 'the run to the humidifier survived the move');
  assert.ok(tb.path.length >= 1 && Math.abs(tb.path.length - lenBefore) <= 2, 'and re-routed to about the same length');
});
