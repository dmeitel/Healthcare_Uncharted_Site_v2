/**
 * Headwall, each fixed piece once (2026-10-15). A wall that arrives as a whole stored answer (the daily year's Friday fault,
 * its hand-off) restored the answer, fixed pieces and all, and then the room set every fixed piece down again: 44 pieces on
 * a 22-piece wall, every outlet, the patient and the screen's neighbours twice over. Found while hanging the bag into stored
 * answers (tests/device-assembly-bag.test.js), where the pieces' ids have to line up.
 *   1. Every wall, written or dealt, opens with each fixed piece once.
 *   2. A wall that arrives built still arrives as it should: a fault broken, a hand-off taped and unfinished, and its answer
 *      passes from there. Its ids line up with its answer's, so the answer names the pieces the wall holds.
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
const dayOf = (n) => new Date(Date.UTC(2026, 9, 3) + (n - 1) * 86400000).toISOString().slice(0, 10);
const twice = (S) => { const seen = new Set(), out = [];
  for (const i of S.items) if (i.fixed) { const k = i.def.id + '@' + i.x + ',' + i.y; if (seen.has(k)) out.push(k); seen.add(k); }
  return out; };

test('every wall, written or dealt, opens with each fixed piece once', () => {
  const ids = [
    ...da.LEVELS.filter((L) => !L.parked).map((L) => L.id),
    ...Array.from({ length: 112 }, (_, i) => 'day:' + dayOf(23 + i)),   // sixteen weeks of the daily year, every weekday's kind
    ...Array.from({ length: 12 }, (_, i) => 'gen:ONCE' + i), ...Array.from({ length: 8 }, (_, i) => 'icu:ONCE' + i),
    ...Array.from({ length: 6 }, (_, i) => 'rehab:ONCE' + i), ...Array.from({ length: 6 }, (_, i) => 'home:ONCE' + i),
    'shift:ONCE1:0', 'shift:ONCE1:3', 'teach:goal',
  ];
  const bad = [];
  for (const id of ids) { const L = da.levelById(id); if (!L) continue; const d = twice(da.newState(L)); if (d.length) bad.push(id + ': ' + d.length + ' twice, ' + d[0] + ' first'); }
  assert.deepStrictEqual(bad, []);
});

test('a wall that arrives built still arrives as it should, and its answer names the pieces it holds', () => {
  const kinds = { fault: 0, handoff: 0 };
  for (let i = 0; i < 112; i++) {
    const L = da.levelById('day:' + dayOf(23 + i)); if (!L || !L.build) continue;
    const S = da.newState(L), sol = JSON.parse(L.solution), fixed = S.items.filter((x) => x.fixed);
    if (L.kind === 'fault') { kinds.fault++; assert.ok(!da.evaluate(S).ok, L.id + ': the fault arrives broken'); }
    else if (L.handoff) { kinds.handoff++; assert.ok(S.items.some((x) => x.taped) && !da.evaluate(S).ok, L.id + ': the hand-off arrives taped and unfinished'); }
    const ans = new Map(sol.items.filter((x) => x.fixed).map((x) => [x.uid, x.def + '@' + x.x + ',' + x.y]));
    for (const it of fixed) assert.strictEqual(ans.get(it.uid), it.def.id + '@' + it.x + ',' + it.y, L.id + ': ' + it.uid + ' is the same piece in the wall and its answer');
    const T = da.newState(L); da.restore(T, L.solution); assert.ok(da.evaluate(T).ok, L.id + ': its answer passes');
  }
  assert.ok(kinds.fault >= 4 && kinds.handoff >= 2, 'faults and hand-offs both dealt in the weeks checked (' + JSON.stringify(kinds) + ')');
});
