/**
 * Device Assembly, phone play (2026-10-12, David after playing it on his phone: "I couldn't plug things in or connect things
 * very easily with my fingers"). On touch the game aims for the thumb: a part goes to the nearest place it fits within a
 * fingertip of where it is aimed (landingsFor, aimLanding). The browser half, a thumb that misses at four real phone
 * screens, is `npm run da:thumb`; this holds the aiming itself in every verify. Plan: docs/HU-PHONE-PLAY-PLAN-2026-10-12.md.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const PAGE = path.join(__dirname, '..', 'src', 'fun', 'device-assembly', 'index.html');
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
/* the middle of a landing, in wall units */
const mid = (def, c) => { const d = da.dims(def, c.r); return [(c.x + d.w / 2) * da.U, (c.y + d.h / 2) * da.U]; };

test('a cannula in the hand has the patient\'s face as a landing', () => {
  const S = da.start('t1'), D = da.DB.cannula;
  const face = da.landingsFor(S, D, D.cartRot || 0, false, null).find((c) => c.why === 'face');
  assert.ok(face, 'the face is a landing');
  assert.deepStrictEqual([face.x, face.y], [da.GRID.nose[0], da.GRID.nose[1]]);
});

test('a flowmeter in the hand lands on the outlets it fits, and only those', () => {
  const S = da.start('t3'), D = da.DB.flowmeter;
  const lands = da.landingsFor(S, D, D.cartRot || 0, false, null);
  assert.ok(lands.length > 0, 'it has somewhere to go');
  for (const c of lands) {
    assert.ok(da.canPlace(S, D, c.r, c.x, c.y).ok, 'every landing is a legal place: ' + JSON.stringify(c));
    if (c.why !== 'joint') continue;
    /* set down there, it makes a joint that seats or needs an adapter, the way the rings promised */
    const S2 = da.start('t3'), res = da.place(S2, D.id, c.x, c.y, c.r, c.f);
    assert.ok(res.ok, 'it places: ' + JSON.stringify(c));
    const ls = da.computeLinks(S2).filter((l) => l.kind === 'adj' && (l.a.uid === res.item.uid || l.b.uid === res.item.uid));
    assert.ok(ls.some((l) => l.s === 'ok' || l.s === 'warn'), 'a landing makes a joint: ' + JSON.stringify(c));
  }
  /* the answer's own place is one of them */
  const ans = JSON.parse(S.level.solution).items.find((i) => i.def === 'flowmeter');
  assert.ok(lands.some((c) => c.x === ans.x && c.y === ans.y), 'the stored answer\'s place is a landing');
});

test('the aim takes the nearest landing within a fingertip, and none beyond it', () => {
  const S = da.start('t3'), D = da.DB.flowmeter;
  const lands = da.landingsFor(S, D, D.cartRot || 0, false, null).filter((c) => c.why === 'joint');
  const pick = lands[0], [mx, my] = mid(D, pick), reach = da.REACH / da.scale;
  /* a little off: the same landing, or one at least as near */
  const near = da.aimLanding(lands, D, mx + reach * 0.4, my);
  assert.ok(near, 'a thumb a little off still lands');
  const dist = (c) => Math.hypot(mid(D, c)[0] - (mx + reach * 0.4), mid(D, c)[1] - my);
  assert.ok(dist(near) <= dist(pick) + 1e-6, 'it takes the nearest landing');
  /* far off: nothing fits that close, and the part goes where it is */
  const far = da.aimLanding([pick], D, mx + reach * 3, my + reach * 3);
  assert.strictEqual(far, null, 'nothing within reach, no pull');
});

test('a tubing tile and a circuit bag have no landings: runs aim at ports, a bag lays itself', () => {
  const S = da.start('l2');
  assert.deepStrictEqual(da.landingsFor(S, da.DB['tube-o2-7'], 0, false, null).length, 0);
  const bag = Object.values(da.DB).find((d) => d.kit);
  if (bag) assert.strictEqual(da.landingsFor(S, bag, 0, false, null).length, 0);
});
