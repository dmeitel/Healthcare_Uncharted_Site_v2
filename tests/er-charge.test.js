/**
 * ER Charge Nurse: the real-time shift, driven deterministically. The tick engine takes sim
 * minutes as an argument, so the tests ARE the clock. Random arrivals are disarmed per test;
 * every patient on the board is spawned on purpose.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { loadSystem, J } = require('./helpers/ug');
const fs = require('fs');

// reuse the generic sandbox loader against the ER page (hook window.__er)
const vm = require('vm');
function loadER() {
  const PAGE = path.join(__dirname, '..', 'src', 'secret-menu', 'er-charge', 'index.html');
  const html = fs.readFileSync(PAGE, 'utf8');
  const open = html.indexOf('<script>'), close = html.lastIndexOf('</script>');
  const src = html.slice(open + '<script>'.length, close);
  const ids = {};
  for (const m of html.slice(0, open).matchAll(/id="([^"]+)"/g)) ids[m[1]] = {
    id: m[1], hidden: false, innerHTML: '', textContent: '', style: {}, dataset: {},
    classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(c,f){f?this._s.add(c):this._s.delete(c);}, contains(c){return this._s.has(c);} },
    addEventListener() {},
  };
  const ctx = {
    document: { getElementById: id => ids[id] || null, addEventListener() {} },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k){ return this._s[k]||null; }, setItem(k,v){ this._s[k]=String(v); } },
    Date,
  };
  vm.createContext(ctx);
  new vm.Script(src, { filename: 'er-charge.js' }).runInContext(ctx);
  assert.ok(ctx.window.__er, 'ER hook exported');
  return { er: ctx.window.__er, evalIn(code){ return new vm.Script(code).runInContext(ctx); } };
}
/** a quiet department: no random arrivals, no scripted criticals, we spawn on purpose */
function quiet(er) {
  er.initShift();
  er.G.nextArrival = 99999;
  er.G.scripted = [];
  return er;
}
const run = (er, mins, step) => { for (let t = 0; t < mins; t += (step||0.5)) er.tick(step||0.5); };

test('a simple patient flows bed-to-discharge and frees the bed', () => {
  const { er } = loadER();
  quiet(er);
  const p = er.spawn('flu'); p.admit = false;
  assert.ok(er.placePatient(p.id, 1), 'placed in bed 1');
  assert.strictEqual(er.G.stats.seen, 1);
  run(er, 45);
  assert.strictEqual(er.G.stats.dc, 1, 'flu recipe completed and discharged');
  assert.strictEqual(er.G.beds[0].pt, null, 'the bed is free again');
  assert.ok(er.G.score >= 2, 'discharge scored');
});

test('resources are finite: six patients, four nurses, two wait, and batching fires', () => {
  const { er } = loadER();
  quiet(er);
  for (let i = 1; i <= 6; i++) { const p = er.spawn('flu'); p.admit=false; er.placePatient(p.id, i); }
  er.tick(0.2);
  assert.strictEqual(er.G.res.rn.busy.length, 4, 'every nurse is claimed');
  assert.strictEqual(er.queueFor('rn').length, 2, 'two identical patients wait their turn');
  assert.ok(er.G.stats.batch > 0, 'same work back to back earned the batching bonus');
});

test('acuity outranks arrival order in every queue', () => {
  const { er } = loadER();
  quiet(er);
  for (let i = 1; i <= 4; i++) { const p = er.spawn('flu'); er.placePatient(p.id, i); }
  er.tick(0.2);                                          // nurses all busy
  const late = er.spawn('flu'); er.placePatient(late.id, 5);
  const stroke = er.spawn('stroke'); er.placePatient(stroke.id, 6);
  const q = er.queueFor('rn');
  assert.strictEqual(q[0].type, 'stroke', 'the stroke goes first no matter when it arrived');
});

test('the waiting room bites: walkouts cost, criticals deteriorate instead of leaving', () => {
  const { er } = loadER();
  quiet(er);
  const walker = er.spawn('flu'); walker.patience = 1;
  const stroke = er.spawn('stroke'); stroke.patience = 1;
  er.tick(2);
  assert.strictEqual(er.G.stats.lwbs, 1, 'the flu patient walked');
  assert.ok(er.G.waiting.some(p => p.type === 'stroke'), 'the stroke cannot walk');
  assert.strictEqual(er.G.stats.harm, 1, 'it deteriorated instead');
  assert.strictEqual(er.G.score, -er.CFG.lwbsPenalty - er.CFG.harmPenalty, 'both cost the shift');
});

test('charge cards: STAT labs quadruple, Fast Track refuses the sick, Bed Request needs a boarder', () => {
  const { er } = loadER();
  quiet(er);
  const cp = er.spawn('cp'); cp.admit = false; er.placePatient(cp.id, 1);
  assert.strictEqual(er.playCard('fast', cp.id), false, 'Fast Track refuses an acuity-2 patient');
  assert.strictEqual(er.playCard('statlab', cp.id), true);
  assert.strictEqual(er.G.cards.statlab, 1, 'the card is spent');
  run(er, 50);                                           // reach and claim the lab step
  const labJob = er.G.res.lab.busy.find(j => j.p === cp);
  assert.ok(labJob && labJob.speed === 4, 'the lab runs at four times speed');
  assert.strictEqual(er.playCard('bedreq'), false, 'Bed Request with nobody boarding is refused, not wasted');
  assert.strictEqual(er.G.cards.bedreq, 2, 'and the card is kept');
});

test('admits board in their beds until upstairs takes them; Bed Request jumps the wait', () => {
  const { er } = loadER();
  quiet(er);
  er.G.upNext = 99999;                                   // upstairs is stuck, classically
  const p = er.spawn('flu'); p.admit = true; er.placePatient(p.id, 1);
  run(er, 60);
  assert.strictEqual(p.boarding, true, 'the recipe is done but the patient boards');
  assert.strictEqual(er.G.beds[0].pt, p, 'the bed is still occupied: gridlock');
  assert.strictEqual(er.playCard('bedreq'), true);
  assert.strictEqual(er.G.stats.admit, 1, 'escalation moved them upstairs');
  assert.strictEqual(er.G.beds[0].pt, null, 'and the bed opened');
});

test('07:00 inherits the night: a seeded backlog, some of it already tired of waiting', () => {
  const { er } = loadER();
  quiet(er);
  er.seedBacklog();
  const n = er.CFG.backlog[er.settings.difficulty];
  assert.strictEqual(er.G.waiting.length, n, 'the lobby starts full');
  assert.ok(er.G.waiting.some(p => p.patience < p.maxPatience * 0.9), 'some have already been waiting');
  assert.ok(er.G.waiting.every(p => p.arrivedAt <= 0), 'they arrived before the shift did');
});

test('an active critical slows the beds NEXT to it, and only those', () => {
  const { er } = loadER();
  quiet(er);
  // different recipe types on purpose, so the batching bonus stays out of the measurement
  const near = er.spawn('flu'); near.admit = false; er.placePatient(near.id, 1);   // triage 14 min
  const far = er.spawn('kid'); far.admit = false; er.placePatient(far.id, 5);      // triage 16 min
  const stroke = er.spawn('stroke'); er.placePatient(stroke.id, 2);   // beside bed 1, far from bed 5
  er.tick(0.2);                                          // everyone claims a nurse
  assert.strictEqual(er.crisisNear(near), true, 'bed 1 feels the code in bed 2');
  assert.strictEqual(er.crisisNear(far), false, 'bed 5 does not');
  run(er, 10);
  const jNear = er.G.res.rn.busy.find(j => j.p === near);
  const jFar = er.G.res.rn.busy.find(j => j.p === far);
  assert.ok(jNear && jFar, 'both are still mid-triage');
  const progNear = 1 - jNear.left / 14, progFar = 1 - jFar.left / 16;
  assert.ok(progNear < progFar, 'the neighbor of the crisis is proportionally behind');
  assert.ok(er.G.stats.slowed > 0, 'the postmortem will have the crisis-drag number');
});

test('the shift ends at 19:00 with a postmortem that names the bottleneck', () => {
  const { er } = loadER();
  quiet(er);
  const a = er.spawn('abd'); a.admit=false; er.placePatient(a.id, 1);
  const b = er.spawn('elder'); b.admit=false; er.placePatient(b.id, 2);   // both want the one CT
  run(er, 725, 1);
  assert.strictEqual(er.G.over, true, 'the shift ended');
  const d = er.report();
  assert.ok(d.bottle1 && d.bottle1.r, 'a primary bottleneck is named');
  assert.ok('ABCDF'.includes(d.grade), 'the shift is graded');
  assert.ok(d.util.ct >= 0, 'utilization is reported per resource');
});
