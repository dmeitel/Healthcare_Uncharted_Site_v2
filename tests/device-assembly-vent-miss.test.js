/**
 * Device Assembly, a circuit that will not lay says the fix that works (2026-10-14). David on the daily of 2026-10-14,
 * a ventilator wall: "not physically possible, like i couldn't get it to work". The cart comes off the cart with its
 * ports on its right; parked right of the bed, where the wall's own answer has it, its ports face the wall, and the
 * circuit bag said "Move the ventilator closer" when the fix was Flip.
 *
 * Every spot a ventilator can stand on, as dropped and flipped, is tried here. Where the circuit will not lay, the
 * message has to name a fix that works from that spot: the flip lays it, the square it names lays it, or a spot that
 * way (closer, or back from the patient, flipped or not) lays it. Nothing may answer with a reason and no fix, and a
 * failed lay leaves the wall and the move count as they were.
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
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();

const STEP = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] };
/* what a message tells the player to do: flip in place, a named square, or a direction (closer or back). The fix is the
   first sentence, because a phone's one-line screen shows only the start of it */
function advice(why) {
  const fix = why.split('. ')[0] + '.';
  let m = fix.match(/^Flip the ventilator so its ports face the patient\.$/);
  if (m) return { flip: true, step: [0, 0] };
  m = fix.match(/^(Flip the ventilator, then move it|Move the ventilator) one square (down|up|left|right)\.$/);
  if (m) return { flip: m[1][0] === 'F', step: STEP[m[2]] };
  if (/^Flip the ventilator so its ports face the patient, then move it closer\.$/.test(fix)) return { flip: true, way: 'closer' };
  if (/^Flip the ventilator, then move it back a little\.$/.test(fix)) return { flip: true, way: 'back' };
  if (/^Move the ventilator back a little\.$/.test(fix)) return { flip: false, way: 'back' };
  if (/^Move the ventilator closer( to the patient so both ports are clear)?\.$/.test(fix)) return { flip: false, way: 'closer' };
  return null;
}

/* the wall's ventilator and circuit, every spot it stands on in both facings, and whether the circuit lays from each */
function sweep(id) {
  const L = da.levelById(id), cart = Object.fromEntries(L.cart);
  const kit = Object.keys(cart).find((k) => da.DB[k].kit), vent = Object.keys(cart).find((k) => da.DB[k].vent && !da.DB[k].isSource);
  const S = da.newState(L), keep = da.snapshot(S), d = da.DB[vent];
  const ett = S.items.find((i) => i.def.cat === 'interface' && (i.def.role === 'ett' || i.def.role === 'trachvent'));
  const T = da.outerPort(S, da.portsOf(ett).find((p) => p.t !== 'patient')), C = [T.x + ({ E: 1, W: -1 }[T.s] || 0), T.y + ({ S: 1, N: -1 }[T.s] || 0)];
  const gap = (x, y) => Math.max(x - C[0], 0, C[0] - (x + d.w - 1)) + Math.max(y - C[1], 0, C[1] - (y + d.h - 1));
  const spots = new Map();
  for (const f of [false, true]) for (let y = 0; y < da.GRID.rows; y++) for (let x = 0; x < da.GRID.cols; x++) {
    da.restore(S, keep); S.moves = 0; delete S.lost;
    if (!da.place(S, vent, x, y, 0, f).ok) continue;
    const before = da.snapshot(S), r = da.layCircuit(S, kit);
    if (!r.ok) {
      assert.strictEqual(da.snapshot(S), before, id + ': a failed lay at ' + x + ',' + y + (f ? ' flipped' : '') + ' changed the wall');
      assert.strictEqual(S.moves, 0, id + ': a failed lay counted a move');
      assert.ok(!S.lost, id + ': a failed lay left a lost-run mark');
    }
    spots.set(x + ',' + y + ',' + f, { x, y, f, ok: r.ok, why: r.why });
  }
  return { spots, gap, vent };
}

function holds(id) {
  const { spots, gap, vent } = sweep(id), wrong = [];
  let failing = 0;
  for (const s of spots.values()) {
    if (s.ok) continue;
    failing++;
    const a = advice(s.why), at = s.x + ',' + s.y + (s.f ? ' flipped' : '') + ': ' + s.why;
    if (!a) { wrong.push(at + ' (names no fix)'); continue; }
    const f = a.flip ? !s.f : s.f;
    if (a.step) { const t = spots.get((s.x + a.step[0]) + ',' + (s.y + a.step[1]) + ',' + f); if (!t || !t.ok) wrong.push(at + ' (does not lay there)'); continue; }
    const g = gap(s.x, s.y), there = [...spots.values()].some((t) => t.ok && t.f === f && (a.way === 'closer' ? gap(t.x, t.y) < g : gap(t.x, t.y) > g));
    if (!there) wrong.push(at + ' (no spot that way lays it)');
  }
  assert.ok(failing > 0, id + ': the sweep found no spot where the circuit fails, so it proves nothing');
  assert.deepStrictEqual(wrong, [], id + ' (' + vent + '): every miss names a fix that works');
  return spots;
}

test('the daily of 2026-10-14: every spot that will not lay names a fix that works, and the answer\'s spot says Flip', () => {
  const spots = holds('day:2026-10-14');
  /* the wall's answer stands the cart right of the bed, flipped; dropped there as it comes off the cart, it says Flip */
  const asDropped = spots.get('11,6,false');
  assert.ok(!asDropped.ok && /^Flip the ventilator so its ports face the patient\./.test(asDropped.why), asDropped.why);
  assert.ok(spots.get('11,6,true').ok, 'flipped, it lays');
});

test('the other ventilators: a cart with its ports underneath, one with a port each side, and the plain ventilator', () => {
  for (const id of ['icu:VB50', 'icu:VB0', 'icu:VB22']) holds(id);
});

test('a circuit already on the ventilator is still refused as one, and a port against the tube is not called a circuit', () => {
  const L = da.levelById('day:2026-10-14'), S = da.newState(L);
  da.place(S, 'vent-cart', 11, 6, 0, true); S.cart['circuit-heated'] = 2;
  assert.ok(da.layCircuit(S, 'circuit-heated').ok);
  assert.match(da.layCircuit(S, 'circuit-heated').why, /already has a circuit/);
  /* the cart flipped beside the patient seats a port straight on the tube */
  const T = da.newState(L); da.place(T, 'vent-cart', 8, 8, 0, true);
  const r = da.layCircuit(T, 'circuit-heated');
  assert.ok(!r.ok && !/already has a circuit/.test(r.why) && advice(r.why), r.why);
});
