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

/* the dealt walls the checks run on: a spread of every place the generator deals, the next week of daily walls, and
   a shift. Fixed codes, so a failure names a wall anyone can open (?wall=<id>). */
const DEALT = [
  ...Array.from({ length: 16 }, (_, i) => 'gen:QA' + i.toString(36).toUpperCase()),
  ...['rehab', 'home', 'icu'].flatMap((p) => Array.from({ length: 5 }, (_, i) => p + ':QA' + i)),
  ...Array.from({ length: 7 }, (_, i) => 'day:' + new Date(Date.UTC(2026, 9, 5 + i)).toISOString().slice(0, 10)),
  ...Array.from({ length: 5 }, (_, k) => 'shift:QA0:' + k),
  // the daily year's first month, wall #23 (Sunday 2026-10-25) to #51, and the goal mode's teach wall (2026-10-11, DY2)
  ...Array.from({ length: 29 }, (_, i) => 'day:' + new Date(Date.UTC(2026, 9, 25 + i)).toISOString().slice(0, 10)),
  'teach:goal',
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

/* THE CART HOLDS THE ANSWER (2026-10-14, David: "we should have a QA to confirm that all the required pieces are in the
   cart"). Every part the stored or searched answer puts on the wall, and every run of tubing it lays, has to be on the
   wall's cart in the numbers the answer uses. Lead hoses and cords come with their part. A circuit bag stands in for its
   Y and both limbs, so a bag on the cart counts as those three, the bag whose limbs the answer lays first (a heated bag
   beside a plain one is a decoy on an HME wall). A part a built wall starts with and the answer takes off goes back on the
   cart, the way removing it does in the game. The set: every wall above, every daily wall from #1 (2026-10-03) to three
   months past today, today's whatever the date, and forty more deals of each place and four more shifts. */
const day = (t) => new Date(t).toISOString().slice(0, 10);
const CARTS = [...new Set([...ALL, da.todayId(),
  ...Array.from({ length: Math.round((Date.now() - Date.UTC(2026, 9, 3)) / 864e5) + 92 }, (_, i) => 'day:' + day(Date.UTC(2026, 9, 3) + i * 864e5)),
  ...Array.from({ length: 40 }, (_, i) => 'gen:CART' + i.toString(36).toUpperCase()),
  ...['rehab', 'home', 'icu'].flatMap((p) => Array.from({ length: 40 }, (_, i) => p + ':CART' + i)),
  ...Array.from({ length: 4 }, (_, s) => Array.from({ length: 5 }, (_, k) => 'shift:CART' + s + ':' + k)).flat()])];
/** what a wall's answer takes from its cart that the cart does not hold, as a list of lines @param {string} id */
function cartShort(id) {
  const L = da.levelById(id); if (!L) return [id + ' dealt nothing'];
  if (!L.solution) return [id + ' has no stored answer'];
  const S0 = da.newState(L), sol = JSON.parse(L.solution), have = Object.assign({}, S0.cart), need = {};
  const add = (o, k, n) => { o[k] = (o[k] || 0) + (n || 1); };
  const startItems = new Map(S0.items.map((i) => [i.uid, i])), startTubes = new Map(S0.tubes.map((t) => [t.uid, t]));
  const solItems = new Set(sol.items.map((i) => i.uid)), solTubes = new Set(sol.tubes.map((t) => t.uid));
  for (const i of sol.items) if (!startItems.has(i.uid)) add(need, i.def);
  for (const t of sol.tubes) if (!t.lead && !startTubes.has(t.uid)) add(need, (t.def && t.def.id) || t.def);
  for (const [u, i] of startItems) if (!i.fixed && !solItems.has(u)) add(have, i.def.id);
  for (const [u, t] of startTubes) if (!t.lead && !solTubes.has(u)) add(have, t.def.id);
  const short = (k) => (need[k] || 0) > (have[k] || 0);
  const bags = Object.keys(have).filter((k) => have[k] > 0 && da.DB[k] && da.DB[k].kit)
    .sort((a, b) => { const fit = (k) => { const x = da.DB[k].kit; return [x.y, x.insp, x.exp].filter((p) => need[p]).length; }; return fit(b) - fit(a); });
  for (const k of bags) for (let n = have[k]; n > 0; n--) { const x = da.DB[k].kit; if (!short(x.y) && !short(x.insp) && !short(x.exp)) break; for (const p of [x.y, x.insp, x.exp]) add(have, p); }
  return Object.keys(need).filter(short).map((k) => id + ': the answer uses ' + need[k] + ' ' + k + ', the cart holds ' + (have[k] || 0));
}

test('every wall\'s cart holds every part and run its answer uses, in the numbers it uses', () => {
  assert.ok(CARTS.length > 300, 'the set is wide enough to mean something (' + CARTS.length + ')');
  assert.deepStrictEqual(CARTS.flatMap(cartShort), []);
});

test('the cart check catches a cart that is short', () => {
  /* the check itself: take one part off a wall's cart and it must say so */
  const L = da.levelById('t3'), saved = L.cart;
  try {
    const used = JSON.parse(L.solution).items.find((i) => !i.fixed && L.cart.some((c) => c[0] === i.def));
    L.cart = L.cart.map((c) => c[0] === used.def ? [c[0], c[1] - 1] : c);
    assert.ok(cartShort('t3').some((l) => l.includes(used.def)), 'a cart one ' + used.def + ' short is caught');
  } finally { L.cart = saved; }
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
