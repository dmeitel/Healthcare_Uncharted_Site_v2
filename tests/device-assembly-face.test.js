/**
 * Headwall, the ventilator cart faces the patient (P3, 2026-10-16, David: "Yes, face the patient"). A ventilator whose
 * circuit ports are all on one side lands with them toward the patient, the way an RT parks it; Flip still turns it round.
 * It is how a part is set down (autoOrient, on a place or a move), so no dealt wall and no stored answer changes.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'fun', 'headwall', 'index.html'), 'utf8');
  const src = html.slice(html.indexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
    Date, Intl,
  };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(src, { filename: 'headwall.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();
const side = (it) => da.portsOf(it).find((p) => p.label === 'Inspiratory port').s;

test('a ventilator cart set down on either side of the bed lands with its circuit ports toward him; Flip still turns it', () => {
  const nose = da.GRID.nose, d = da.DB['vent-cart'];
  let checked = 0;
  for (const want of ['W', 'E']) {   // right of the bed its ports face west, left of it east
    const S = da.start('v1'); S.cart['vent-cart'] = 1;
    const xs = want === 'W' ? [12, 11, 10, 9] : [0, 1, 2, 3, 4];
    let spot = null;
    for (const x of xs) for (let y = 1; y < 12 && !spot; y++) if (da.canPlace(S, d, 0, x, y).ok && ((x + 1) > nose[0] + 0.5) === (want === 'W')) spot = [x, y];
    assert.ok(spot, 'a free spot ' + (want === 'W' ? 'right' : 'left') + ' of the bed');
    const r = da.dispatchAct('place', { def: 'vent-cart', x: spot[0], y: spot[1], r: 0, f: false, orient: true });
    assert.ok(r.ok, r.why);
    assert.strictEqual(side(r.item), want, 'set down ' + (want === 'W' ? 'right' : 'left') + ' of the bed, its ports face him');
    assert.ok(da.dispatchAct('flip', { uid: r.item.uid }).ok);
    assert.notStrictEqual(side(r.item), want, 'Flip still turns it away');
    checked++;
  }
  assert.strictEqual(checked, 2);
});

test('a ventilator with ports on more than one side, and every other part, lands as it did', () => {
  const S = da.start('v1');
  for (const id of ['vent-cart-split', 'vent-cart-stack', 'vent-cart-low']) {
    S.cart[id] = 1; const d = da.DB[id];
    let spot = null; for (let x = 12; x >= 8 && !spot; x--) for (let y = 1; y < 12 && !spot; y++) if (da.canPlace(S, d, 0, x, y).ok) spot = [x, y];
    if (!spot) continue;
    const r = da.dispatchAct('place', { def: id, x: spot[0], y: spot[1], r: 0, f: false, orient: true });
    assert.ok(r.ok, id + ': ' + r.why); assert.ok(!r.item.f, id + ' is not turned: its ports are on two sides, or underneath');
    da.dispatchAct('remove', { uids: [r.item.uid] });
  }
});
