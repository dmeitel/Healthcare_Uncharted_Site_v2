/**
 * Device Assembly, the daily year (DY2, 2026-10-11, David: "yes to the daily walls, start oct 25"). Plan:
 * docs/HU-DEVICE-ASSEMBLY-DAILY-PLAN-2026-10-11.md.
 *
 * THE PINS. Every wall dealt before the year began must deal exactly what it dealt before: daily walls #1 to #22
 * (2026-10-03 to 2026-10-24), a spread of random wall codes, made walls and the first walls of some shifts. Each is
 * kept as a fingerprint of its order, cart, par, room and stored solution in tests/device-assembly-pins.json, taken
 * from the game as it stood before the year was built. To re-take them on purpose (never to make a failure go away),
 * DA_PIN_WRITE=1 node --test tests/device-assembly-daily.test.js, and say in the close note why.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function load() {
  const PAGE = path.join(__dirname, '..', 'src', 'fun', 'device-assembly', 'index.html');
  const html = fs.readFileSync(PAGE, 'utf8');
  const open = html.indexOf('<script>'), close = html.lastIndexOf('</script>');
  const src = html.slice(open + '<script>'.length, close);
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } },
    Date, Intl,
  };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const da = load();
const PINS = path.join(__dirname, 'device-assembly-pins.json');

// a date key n days after 2026-10-03, wall #1
const dayOf = (n) => new Date(Date.UTC(2026, 9, 3) + (n - 1) * 86400000).toISOString().slice(0, 10);
const plain = (x) => JSON.parse(JSON.stringify(x === undefined ? null : x));
/** what a player would see and what the stored answer is: if any of it moves, the wall changed */
function signature(L) {
  if (!L) return 'none';
  const room = L.room && typeof L.room === 'object' ? { rail: L.room.rail, face: L.room.face } : L.room || null;
  const sol = L.solution || (L.gen && L.gen.solution) || null;
  const body = JSON.stringify(plain({ title: L.title, req: L.req, cart: L.cart, par: L.par, room, face: L.face || null, extras: L.extras || null, sol }));
  return crypto.createHash('sha1').update(body).digest('hex').slice(0, 16);
}
function pinIds() {
  const ids = [];
  for (let n = 1; n <= 22; n++) ids.push('day:' + dayOf(n));
  for (let i = 0; i < 30; i++) ids.push('gen:PIN' + i);
  for (const p of ['rehab', 'home', 'icu']) for (let i = 0; i < 6; i++) ids.push(p + ':PIN' + i);
  for (const c of ['PINA', 'PINB', 'PINC', 'PIND']) ids.push('shift:' + c + ':0');
  ids.push('my:cannula.2.0.plain.right.0.PIN1', 'my:venturi.8.35.crowded.mirror.0.PIN2', 'my:nrb.15.0.noo2.left.0.PIN3');
  return ids;
}

if (process.env.DA_PIN_WRITE) {
  const out = {};
  for (const id of pinIds()) out[id] = signature(da.levelById(id));
  fs.writeFileSync(PINS, JSON.stringify({ taken: '2026-10-11', why: 'the game before the daily year was built', walls: out }, null, 2) + '\n');
  console.log('pins written:', Object.keys(out).length);
}

test('every wall dealt before the year deals exactly what it dealt before (walls #1 to #22, random, made, rooms, shifts)', () => {
  const pins = JSON.parse(fs.readFileSync(PINS, 'utf8')).walls;
  const moved = [];
  for (const [id, sig] of Object.entries(pins)) {
    const now = signature(da.levelById(id));
    if (now !== sig) moved.push(id + ' (' + sig + ' -> ' + now + ')');
  }
  assert.deepStrictEqual(moved, [], 'these walls changed: ' + moved.join(', '));
});

/* THE MONTH SHEET. Every day of the first month (wall #23, Sunday 2026-10-25, to #51) is dealt by the year, solves from
   its own cart, sits in its weekday's band, uses the twist the plan names once that twist is built, and differs from
   every other day. BUILT lists the plan's twists that exist; it grows as the build does and ends holding all of them. */
const BUILT = ['crowded', 'hard-hfnc', 'middle', 'far-bed', 'split-rail', 'dead-outlets', 'just-enough', 'dumped', 'labels', 'expired', 'shorthand', 'read-chart', 'written-verbal', 'sink', 'sterile', 'curtain', 'fault', 'fault2', 'handoff', 'halloween', 'stack3', 'bottle-hard', 'story-rcweek', 'story-postop', 'story-home', 'story-wean', 'story-rehab', 'goal'];
const MONTH = Array.from({ length: 29 }, (_, i) => 23 + i);
const solves = (L) => { const S = da.newState(L); da.restore(S, L.solution || L.gen.solution); return da.evaluate(S); };

test('the month: every day from #23 to #51 is the year\'s, solves, sits in its band and is unlike every other day', () => {
  const seen = new Map(), problems = [];
  for (const n of MONTH) {
    const k = dayOf(n), L = da.levelById('day:' + k), p = da.yearPlan(k);
    if (!L || !L.year) { problems.push('#' + n + ' ' + k + ': not dealt by the year'); continue; }
    assert.strictEqual((L.gen && L.gen.daily) || L.daily, k, '#' + n + ' carries its day, so the streak and the share line count it');
    assert.ok(L.kicker.startsWith(p.day + ' · Daily wall #' + n), '#' + n + ' names its weekday: ' + L.kicker);
    const ev = solves(L);
    if (!ev.ok) problems.push('#' + n + ' ' + k + ': the stored answer fails: ' + ev.lines.map((l) => l.t).join(' | '));
    if (L.par.comp < p.band[0] || L.par.comp > p.band[1]) problems.push('#' + n + ' ' + p.day + ' (' + p.kind + '): ' + L.par.comp + ' parts, the band is ' + p.band.join(' to '));
    if (BUILT.includes(p.t) && L.year.twist !== p.t) problems.push('#' + n + ': the plan says ' + p.t + ', it dealt ' + L.year.twist);
    const sig = signature(L);
    if (seen.has(sig)) problems.push('#' + n + ' is the same wall as #' + seen.get(sig));
    seen.set(sig, n);
  }
  assert.deepStrictEqual(problems, []);
});

test('every twist the plan names that is listed as built exists, and the month uses each one', () => {
  const named = new Set(MONTH.map((n) => da.YEAR_PLAN[n].t));
  for (const t of BUILT) {
    assert.ok(da.YEAR_TWISTS[t], t + ' is in YEAR_TWISTS');
    assert.ok(named.has(t), t + ' is on a day of the month');
  }
});

test('the weeks climb: Monday to Saturday, the bands go up', () => {
  const B = da.YEAR_BAND, order = ['room', 'cart', 'order', 'barrier', 'fault', 'hard'];
  for (let i = 1; i < order.length; i++) assert.ok(B[order[i]][0] >= B[order[i - 1]][0], order[i] + ' starts no lower than ' + order[i - 1]);
  assert.ok(B.hard[0] > B.room[1], 'a Saturday starts above a Monday\'s top');
});

test('days after the month keep dealing from the year: their weekday\'s kind, near their band, never empty', () => {
  for (let n = 52; n <= 80; n++) {
    const k = dayOf(n), L = da.levelById('day:' + k);
    assert.ok(L && L.year, '#' + n + ' ' + k + ' is dealt by the year');
    assert.strictEqual(L.year.kind, da.YEAR_KIND[da.weekdayOf(k)]);
    assert.ok(solves(L).ok, '#' + n + ' solves');
  }
});

test('a day the year cannot deal falls back to the old dealer, so there is never a missing wall', () => {
  const fresh = load();
  fresh.YEAR_TWISTS['test-fails'] = { kind: 'room', name: 'Nothing deals', deal: () => null };
  fresh.YEAR_PLAN[24] = { t: 'test-fails' };
  const L = fresh.levelById('day:' + dayOf(24));
  assert.ok(L, 'a wall still deals');
  assert.ok(!L.year, 'and it is the old dealer\'s');
});

test('the year keeps all four places: a hospital room, a rehab room, someone\'s home and an ICU bed all come up', () => {
  const seen = new Set();
  for (let n = 23; n <= 120 && seen.size < 4; n++) { const L = da.levelById('day:' + dayOf(n)); seen.add((L.gen && L.gen.place) || (L.room && L.room.place) || 'hospital'); }
  assert.deepStrictEqual([...seen].sort(), ['home', 'hospital', 'icu', 'rehab']);
});

test('the year\'s own walls are whole walls: the rail spans the wall, every fixed piece is on it, nothing overlaps, the nose and the neck are free', () => {
  const walls = Object.assign({}, da.YEAR_ROOMS);
  walls.dead = da.deadRoom({ int: (a) => a });
  for (const [name, room] of Object.entries(walls)) {
    assert.strictEqual(room.rail.length, da.GRID.cols, name + ': the rail spans the wall');
    assert.ok(room.rail.includes('out-o2'), name + ': there is oxygen on it');
    const cells = new Map(), fixed = room.rail.map((def, x) => ({ def, x, y: 0 })).filter((f) => f.def).concat(room.fixtures);
    for (const f of fixed) {
      const d = da.DB[f.def];
      for (let y = f.y; y < f.y + d.h; y++) for (let x = f.x; x < f.x + d.w; x++) {
        assert.ok(x >= 0 && x < da.GRID.cols && y >= 0 && y < da.GRID.rows, name + ': ' + f.def + ' hangs off the wall');
        assert.ok(!cells.has(x + ',' + y), name + ': ' + f.def + ' overlaps ' + cells.get(x + ',' + y) + ' at ' + x + ',' + y);
        cells.set(x + ',' + y, f.def);
      }
    }
    assert.ok(!cells.has(room.nose.join(',')) && !cells.has(room.neck.join(',')), name + ': the nose and the neck are free');
  }
  assert.deepStrictEqual(Object.keys(da.ROOMS).sort(), ['left', 'mirror', 'right'], 'the three walls the written walls use are untouched');
});

const dayL = (n) => da.levelById('day:' + dayOf(n));
const cartCount = (L) => L.cart.reduce((a, c) => a + c[1], 0);
const needCount = (L) => { const S = da.newState(L); da.restore(S, L.solution || L.gen.solution); return S.items.filter((i) => !i.fixed).length + S.tubes.filter((t) => !t.lead).length; };

test('Mondays: the bed in the middle, the far bed, the split rail and dead outlets each build the wall they name', () => {
  const mid = dayL(24); assert.strictEqual(mid.room.name, 'middle'); assert.deepStrictEqual([...mid.room.nose], [7, 7], 'the bed sits mid-wall');
  const far = dayL(31); assert.deepStrictEqual({ ...far.face }, { x: 0, y: 9 }, 'pulled out and over to the side'); assert.ok(far.cart.some((c) => c[0] === 'cannula-14'), 'the long cannula is on the cart');
  const split = dayL(38); assert.strictEqual(split.room.name, 'split'); assert.ok(split.room.fixtures.some((f) => f.def === 'deco-window'), 'a window between the clusters');
  const dead = dayL(45); assert.strictEqual(dead.room.rail.filter((d) => d === 'out-capped').length, 3, 'three outlets capped');
});

test('Tuesdays: just enough has no spares, a dumped cart is mostly wrong, the labels are off, and an expired twin fails when used', () => {
  const je = dayL(25); assert.strictEqual(cartCount(je), needCount(je), 'just enough: the cart is exactly the build');
  const du = dayL(32); assert.ok(cartCount(du) >= needCount(du) + 8, 'supply dumped everything: eight or more wrong parts');
  assert.strictEqual(dayL(39).noLabels, true, 'the labels fell off');
  const ex = dayL(46), twin = ex.cart.find((c) => /^exp-/.test(c[0]));
  assert.ok(twin, 'an expired twin is on the cart');
  const base = twin[0].slice(4);
  assert.ok(ex.cart.some((c) => c[0] === base), 'beside an in-date one');
  assert.ok(solves(ex).ok, 'the stored build uses the in-date part');
  const S = da.newState(ex); da.restore(S, ex.solution || ex.gen.solution);
  const it = S.items.find((i) => i.def.id === base) || null;
  if (it) { it.def = da.DB[twin[0]]; const ev = da.evaluate(S); assert.ok(!ev.ok && ev.lines.some((l) => /past its date/.test(l.t)), 'built with the twin, it fails and says why'); }
});

test('Wednesdays: the order in shorthand, read from the chart, and written beats verbal; the check is the same order', () => {
  const sh = dayL(26);
  assert.ok(sh.orderLines && /^\d+L|^(NRB|VM|TC|AM|HFNC) /.test(sh.orderLines[0]), 'the screen reads the shorthand: ' + sh.orderLines[0]);
  assert.ok(sh.orderLong && /^Order: /.test(sh.orderLong), 'the long form is kept for the i');
  assert.ok(!sh.scenario.includes(sh.orderLong), 'and the NOTE page does not spell it out');
  const rc = dayL(33);
  assert.strictEqual(rc.orderLines[0], 'See the chart notes');
  assert.ok(/Provider: /.test(rc.scenario), 'the order is one of the notes');
  const wv = dayL(40);
  assert.strictEqual(wv.gen.place, 'icu', 'on an ICU bed');
  const said = Number((/turn him to (\d+)%/.exec(wv.scenario) || [])[1]);
  assert.ok(said && said !== wv.req.fio2, 'the nurse heard a different number (' + said + '%) than the written order (' + wv.req.fio2 + '%)');
});

test('Thursdays: the sink and the sterile field stand by the build, and the curtain crosses it once', () => {
  const has = (L, def) => (L.extras || []).filter((e) => e.def === def);
  assert.strictEqual(has(dayL(34), 'deco-sink').length, 1, 'a sink');
  assert.strictEqual(has(dayL(41), 'deco-sterile').length, 1, 'a sterile field');
  const cu = dayL(48), panels = has(cu, 'deco-curtain');
  assert.ok(panels.length >= 6, 'a curtain of six panels or more');
  assert.strictEqual(new Set(panels.map((e) => e.x)).size, 1, 'in one column');
  for (const n of [34, 41, 48]) assert.ok(solves(dayL(n)).ok, '#' + n + ' solves around it');
});

test('Fridays: a fault wall arrives built and broken, two faults are two separate breaks, and the hand-off\'s parts are taped down', () => {
  const f1 = dayL(28), S1 = da.newState(f1);
  assert.strictEqual(f1.kind, 'fault'); assert.ok(f1.fault && f1.fault.name && f1.fault.why, 'it names its fault for the card');
  assert.ok(!da.evaluate(S1).ok, 'it arrives broken'); assert.ok(solves(f1).ok, 'and its fixed build passes');
  const f2 = dayL(49);
  assert.strictEqual(f2.faultIds.length, 2, 'two faults');
  for (const id of f2.faultIds) { const S = da.newState(Object.assign({}, f2, { build: null })); da.restore(S, f2.solution); da.applyFaults(S, [id]); assert.ok(!da.evaluate(S).ok, id + ' alone breaks it, so fixing the other is not enough'); }
  const h = dayL(35), SH = da.newState(h), taped = SH.items.filter((i) => i.taped);
  assert.ok(taped.length >= 1, 'something is taped down'); assert.ok(!da.evaluate(SH).ok, 'and something is left to do');
  const t = taped[0];
  assert.ok(!da.moveItem(SH, t.uid, t.x + 1, t.y, t.r).ok, 'a taped part does not move');
  assert.ok(!da.rotate(SH, t.uid).ok, 'or turn');
  assert.ok(!da.removeThing(SH, t.uid).ok, 'or come off');
  const back = da.newState(Object.assign({}, h, { build: null })); da.restore(back, da.snapshot(SH));
  assert.ok(back.items.some((i) => i.taped), 'the tape survives a save and an undo');
  assert.ok(solves(h).ok, 'the finished build passes');
});

test('a new mode is taught once: the first fault day opens Find the fault 1 first, and only the first time', () => {
  const fresh = load(), L = fresh.levelById('day:' + dayOf(28));
  assert.strictEqual(L.year.mode, 'fault');
  assert.strictEqual(fresh.teachFirst(L), 'f1', 'the teach wall first');
  assert.strictEqual(fresh.teachFirst(L), null, 'not again');
  const done = load(); done.progress.done.f1 = true;
  assert.strictEqual(done.teachFirst(done.levelById('day:' + dayOf(28))), null, 'not for a player who already did it');
});

test('Saturdays: Halloween dresses a hard build, the stacked days carry their twists, and the bottle across the room needs a real run', () => {
  const hw = dayL(29), decor = (hw.extras || []).map((e) => e.def);
  for (const d of ['deco-skeleton', 'deco-pumpkin', 'deco-cobweb']) assert.ok(decor.includes(d), 'Halloween has a ' + d.slice(5));
  assert.ok(hw.par.comp >= 5, 'and a hard build under it');
  const st = dayL(36); assert.ok(st.room.face.flip && st.room.rail.includes('out-chem-o2') && (st.extras || []).some((e) => e.def === 'deco-ivpole'), 'turned around, Chemetron, crowded');
  const bh = dayL(43); assert.ok(bh.room.rail.every((d) => d !== 'out-o2'), 'no oxygen on the wall');
  assert.ok(bh.par.comp >= 3 && bh.cart.some((c) => c[0] === 'coupler'), 'the bottle is too far for the cannula alone: a connector and tubing');
  for (const n of [29, 36, 43, 50]) assert.ok(solves(dayL(n)).ok, '#' + n + ' solves');
});

test('Sundays: three walls of one story, opened as the day, and the story stops after its third wall', () => {
  for (const n of [23, 30, 37, 44, 51]) {
    const L = dayL(n), plan = da.shiftPlanOf(L.shift.code);
    assert.ok(L.shift && L.story, '#' + n + ' is a story');
    assert.strictEqual(plan.len, 3); assert.ok(plan.noFault, 'no fault wall on a story'); assert.strictEqual(plan.daily, dayOf(n));
    for (let k = 0; k < 3; k++) { const W = da.shiftLevel(L.shift.code, k); assert.ok(W && !W.fault, '#' + n + ' wall ' + (k + 1)); assert.ok(solves(W).ok, '#' + n + ' wall ' + (k + 1) + ' solves'); }
    assert.strictEqual(da.shiftLevel(L.shift.code, 3), undefined, 'and there is no fourth');
  }
  assert.strictEqual(dayL(37).room.place, 'home', 'Going home is at home');
  assert.strictEqual(dayL(51).room.place, 'rehab', 'the cough is in rehab');
  const L = dayL(23), S = da.newState(L); S.shift = da.newShift(L);
  da.restore(S, L.solution); S.finished = true;
  let r = da.shiftAdvance(S); assert.ok(r.ok && r.wall === 1, 'on to wall 2');
  S.finished = true; r = da.shiftAdvance(S); assert.ok(r.ok && r.wall === 2 && !r.fault, 'on to wall 3, no fault');
  S.finished = true; r = da.shiftAdvance(S); assert.ok(!r.ok, 'and that is the end of the story');
});

test('the goal, not the device: a cannula at 2 L/min or a Venturi at 24 or 28% meets it; anything else works and still misses it, with the reason', () => {
  const L = dayL(47);
  assert.ok(L.req.goal, 'the order is a goal'); assert.strictEqual(L.orderLines[0], 'Keep his SpO2 88 to 92%');
  assert.ok(!/cannula|venturi|mask/i.test(L.title.split(' \u00b7 ')[0]), 'the title does not give the device away: ' + L.title);
  assert.ok(solves(L).ok, 'the dealt answer meets it');
  assert.strictEqual(da.goalFor(L, { def: da.DB.cannula }).why, null, 'a cannula meets it');
  assert.strictEqual(da.goalFor(L, { def: da.DB.venturi, fio2: 28 }).why, null, 'a Venturi at 28% meets it');
  assert.ok(/24 or 28/.test(da.goalFor(L, { def: da.DB.venturi, fio2: 40 }).why), 'a Venturi at 40% misses it');
  assert.ok(/too high/.test(da.goalFor(L, { def: da.DB.nrb }).why), 'a non-rebreather misses it');
  const S = da.newState(L); da.restore(S, L.solution);
  const it = S.items.find((i) => i.def.cat === 'interface');
  if (it.def.id === 'cannula' && L.cart.some((c) => c[0] === 'nrb')) {
    S.cart.nrb = (S.cart.nrb || 0) + 1;
    const r = da.swapPart(S, it.uid, 'nrb');
    if (r.ok) { const ev = da.evaluate(S); assert.ok(!ev.ok && ev.lines.some((l) => /too high/.test(l.t)), 'built with a non-rebreather, it fails and says why'); }
  }
  const T = da.levelById('teach:goal');
  assert.ok(T && T.kind === 'teach' && !T.gen && T.req.goal, 'the teach wall is its own wall');
  assert.ok(solves(T).ok, 'and it can be done');
  const fresh = load();
  assert.strictEqual(fresh.teachFirst(fresh.levelById('day:' + dayOf(47))), 'teach:goal', 'it plays first the first time');
});

/* the game with its clock set to a day of the month, for what a player sees on that day */
function loadOn(iso) {
  const FIXED = Date.parse(iso + 'T18:00:00Z');
  class Fixed extends Date { constructor(/** @type {any[]} */ ...a) { if (a.length) super(.../** @type {[any]} */ (a)); else super(FIXED); } static now() { return FIXED; } }
  const PAGE = path.join(__dirname, '..', 'src', 'fun', 'device-assembly', 'index.html');
  const html = fs.readFileSync(PAGE, 'utf8');
  const src = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const ctx = { document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' }, window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {}, localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } }, Date: Fixed, Intl };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8')).runInContext(ctx);
  new vm.Script(src).runInContext(ctx);
  return ctx.window.__da;
}

test('the door names the day and the wall, and the walls list keeps a teach wall once its mode has come up', () => {
  const mon = loadOn('2026-10-26');
  const card = mon.doorA();
  assert.ok(card.includes('Monday · #24'), 'the card says the day and the number');
  assert.ok(card.includes('The bed in the middle'), 'and the wall\'s name');
  const names = (d) => d.wallGroups().map((g) => g.name);
  assert.ok(!names(mon).includes('New on the daily'), 'before the goal mode, no teach row');
  const later = loadOn('2026-11-20');
  const row = later.wallGroups().find((g) => g.name === 'New on the daily');
  assert.ok(row && row.walls.some((w) => w.L.id === 'teach:goal'), 'after it, the goal\'s teach wall is kept in the list');
  const before = loadOn('2026-10-11');
  assert.ok(!/Monday|Sunday|Saturday/.test(before.doorA().split('Today’s wall')[1].slice(0, 30)), 'a day before the year keeps the old card');
});
