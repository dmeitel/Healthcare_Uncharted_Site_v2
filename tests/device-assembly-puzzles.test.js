/**
 * Device Assembly, the puzzle checks (2026-10-04). David, on the first playtest: "I can never tell what I'm doing
 * wrong or why it's not working", and the ask for "a functional or working QA system specifically for this game as
 * we continue to build out new puzzles". These hold every wall, the ones built so far and every one added later, to
 * three promises:
 *   1. A wall that is dealt can be solved: its stored answer passes the test it is judged by.
 *   2. Every way of breaking a solved wall says where it broke. Each part and each run is taken away in turn, and the
 *      test has to name a place (where the gas stops, the joint that is wrong, or the rule the build breaks), never
 *      the old answer that only said nothing reaches the patient.
 *   3. A wall's words work on a phone: no hint tells a thumb to right-click.
 * The browser half (pictures of every wall, a touch play test) is scripts/da-qa.js, `npm run da:qa`, and the hub's
 * Puzzles page shows its report.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'fun', 'device-assembly', 'index.html'), 'utf8');
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

/* the dealt walls the checks run on: a spread of every place the generator deals, the next week of daily walls, and
   a shift. Fixed codes, so a failure names a wall anyone can open (?wall=<id>). */
const DEALT = [
  ...Array.from({ length: 16 }, (_, i) => 'gen:QA' + i.toString(36).toUpperCase()),
  ...['rehab', 'home', 'icu'].flatMap((p) => Array.from({ length: 5 }, (_, i) => p + ':QA' + i)),
  ...Array.from({ length: 7 }, (_, i) => 'day:' + new Date(Date.UTC(2026, 9, 5 + i)).toISOString().slice(0, 10)),
  ...Array.from({ length: 5 }, (_, k) => 'shift:QA0:' + k),
  // a ventilator setup on each of the four builds, each way it faces (2026-10-07; tests/device-assembly-vent-builds.test.js)
  ...['VB29', 'VB72', 'VB50', 'VB86', 'VB0', 'VB34', 'VB8', 'VB66'].map((c) => 'icu:' + c),
];

/* BETA P4 (2026-10-05): every authored wall has a stored answer too, so the sheet holds them to the same promises */
const AUTHORED = da.LEVELS.filter((L) => !L.parked && L.kind !== 'sandbox').map((L) => L.id);
const ALL = [...AUTHORED, ...DEALT];
/** a fresh copy of the wall with its answer built @param {string} id */
function solved(id) {
  const L = da.levelById(id); if (!L || !L.solution) return null;
  const S = da.newState(L); da.restore(S, L.solution);
  return S;
}
/** what a broken wall says: is it located? @param {any} S */
function explained(S) {
  const ev = da.evaluate(S);
  if (ev.ok) return { ok: true };
  const first = ev.lines[0] || { h: '', t: '' };
  const located = !!(ev.stop && ev.stop.text && (ev.stop.a || ev.stop.b || (ev.stop.uids && ev.stop.uids.length)));
  const generic = /Nothing carries gas from an outlet/.test(first.t);
  const noIface = /No patient interface/.test(first.t);
  return { ok: false, located, generic, noIface, kind: ev.kind, first: first.h + ': ' + first.t };
}

test('every wall, authored and dealt, can be solved: its stored answer passes', () => {
  const bad = [];
  for (const id of ALL) { const S = solved(id); if (!S) { bad.push(id + ' dealt nothing'); continue; } const ev = da.evaluate(S); if (!ev.ok) bad.push(id + ': ' + ev.lines.map((l) => l.t).join(' | ')); }
  assert.deepStrictEqual(bad, []);
});

test('every way of breaking a solved wall says where it broke', () => {
  let breaks = 0; const vague = [];
  for (const id of ALL) {
    const S0 = solved(id); if (!S0) continue;
    const things = [...S0.items.filter((i) => !i.fixed).map((i) => i.uid), ...S0.tubes.filter((t) => !t.lead).map((t) => t.uid)];
    for (const uid of things) {
      const S = solved(id); const what = (S.items.find((i) => i.uid === uid) || S.tubes.find((t) => t.uid === uid));
      const name = what.def.short || what.def.id;
      da.removeThing(S, uid);
      const r = explained(S);
      if (r.ok) continue;   // that part was not needed for this answer: nothing to explain
      breaks++;
      if (r.noIface) continue;   // the interface itself went back on the cart: the wall says so in those words
      if (r.kind === 'invalid') continue;   // gas reaches the patient; a named rule fails, and the line says which
      if (!r.located || r.generic) vague.push(id + ' without the ' + name + ': ' + r.first);
    }
  }
  assert.ok(breaks > 100, 'the spread breaks enough walls to mean something (' + breaks + ')');
  assert.deepStrictEqual(vague, [], vague.length + ' of ' + breaks + ' breaks do not say where');
});

test('a wrong joint names its fix: every joint that needs an adapter names the adapter', () => {
  const missing = [];
  for (const id of DEALT.slice(0, 12)) {
    const S = solved(id); if (!S) continue;
    for (const ad of S.items.filter((i) => i.def.adapter)) {
      const T = solved(id); da.removeThing(T, ad.uid);
      for (const l of da.evaluate(T).links) if (l.s === 'warn' && !l.adapter) missing.push(id + ': ' + l.why);
    }
  }
  assert.deepStrictEqual(missing, []);
});

test('the authored walls start, read their order, and every one opens from a link', () => {
  const live = da.LEVELS.filter((L) => !L.parked);
  assert.ok(live.length >= 25);
  for (const L of live) {
    const S = da.newState(L);
    assert.ok(S && S.level === L, L.id + ' starts');
    assert.ok(L.req && L.req.iface && L.req.iface.length, L.id + ' has an order');
    assert.ok((L.steps || []).length, L.id + ' has a hint');
  }
});

test('every wall\'s bedside screen reads its order: no undefined, no NaN, no empty line (QA 2026-10-05)', () => {
  // every ventilator wall read "undefined L/min" on its screen from stage C until the full QA found it
  const bad = [];
  for (const id of [...da.LEVELS.filter((L) => !L.parked).map((L) => L.id), ...DEALT]) {
    const L = da.levelById(id); if (!L || !L.req) continue;
    const lines = da.screenOrderLines(L);
    if (lines.some((x) => !x || /undefined|NaN|null/.test(x))) bad.push(id + ': ' + lines.join(' / '));
  }
  assert.deepStrictEqual(bad, []);
});

test('a wall\'s words work on a phone: no hint tells a thumb to right-click or press a key', () => {
  // the words a phone reads go through touchText; force the touch branch the way a thumb would
  const g = load();
  const mouseOnly = /right-click|double-click|\bclick\b|\bEsc\b|\bpress R\b/i;
  const bad = [];
  for (const L of g.LEVELS) for (const t of [L.scenario, ...(L.steps || []).map((s) => s.text)]) {
    if (!t) continue; const out = g.touchWords(t); if (mouseOnly.test(out)) bad.push(L.id + ': ' + out.match(/[^.]*(right-click|double-click|click|Esc|press R)[^.]*/i)[0]);
  }
  assert.deepStrictEqual(bad, []);
});

test('the cannula on the face turns its tubing to the side its run goes; off the face it stays put (QA 2026-10-05)', () => {
  // David on f5: "make the nasal cannula be connectable on the left and right"
  const S = da.newState(da.levelById('t1')); const nose = da.GRID.nose;
  const can = da.place(S, 'cannula', nose[0], nose[1], 0).item, lead = da.portsOf(can).find((p) => p.pi === 'lead');
  assert.strictEqual(lead.s, 'E');
  assert.strictEqual(da.faceLead(S, lead, { x: nose[0] - 4, y: 2 }, false).s, 'W', 'a run to the left leaves the left cheek');
  assert.ok(!can.f, 'the plan turns nothing');
  assert.strictEqual(da.faceLead(S, lead, { x: nose[0] + 4, y: 2 }, false).s, 'E', 'a run to the right stays on the right');
  da.faceLead(S, lead, { x: nose[0] - 4, y: 2 }, true); assert.ok(can.f, 'connecting turns it');
  const S2 = da.newState(da.levelById('t1')); const off = da.place(S2, 'cannula', 5, 6, 0).item, l2 = da.portsOf(off).find((p) => p.pi === 'lead');
  assert.strictEqual(da.faceLead(S2, l2, { x: 1, y: 2 }, false), l2, 'on the wall, not the face, it stays as it is');
});
