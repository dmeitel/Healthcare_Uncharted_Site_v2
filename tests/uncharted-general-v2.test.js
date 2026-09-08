/**
 * v2 systems: ownership classes, care pathways + synergies, the safety gamble, expectation-anchored
 * goals, community programs, service closure, class-weighted Board Report, and unlocks.
 * Runs on the shared strict-DOM harness in helpers/ug.js.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadGame, playToLevel2, J } = require('./helpers/ug');

test('ownership classes fold into the buffs chain', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  const base = ug.computeQuarter(ug.run, null);
  assert.strictEqual(ug.run.klass.id, 'nonprofit', 'default ownership is nonprofit');

  ug.run.klass = ug.classOf('district');
  const dist = ug.computeQuarter(ug.run, null);
  assert.strictEqual(dist.bonus - base.bonus, 45, 'the district levy lands every quarter');

  ug.run.klass = ug.classOf('academic');
  const acad = ug.computeQuarter(ug.run, null);
  assert.ok(Math.abs(acad.overhead - base.overhead*1.08) < 1, 'teaching overhead costs 8% on everything');
});

test('the PE covenant ends a run on the third red quarter', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  ug.run.klass = ug.classOf('profit');
  ug.run.covStrikes = 2;
  ug.run.cash = 5000;                                   // rich enough that bankruptcy is not what ends this
  ug.run.departments.forEach(d => { d.demand = 0; d.pathIn = 0; });   // no patients, guaranteed red
  ug.runQuarter();
  assert.strictEqual(ug.run.covStrikes, 3);
  assert.strictEqual(ug.run.over, true, 'three strikes and the investors flip the asset');
});

test('care pathways derive demand between units, both directions', () => {
  const { ug } = loadGame();
  playToLevel2(ug);                                     // community start: ED, Med/Surg, OR; telehealth just opened
  const by = id => ug.run.departments.find(d => d.id === id);
  assert.ok(by('telehealth') && !by('telehealth').construction, 'telehealth is open by level 2');
  assert.ok(by('medsurg').pathIn > 0, 'ED admissions feed Med/Surg demand');
  assert.ok(by('ed').pathIn < 0, 'telehealth siphons low-acuity ED demand');
});

test('running both halves of a service-line pair unlocks the synergy premium', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  assert.ok(!ug.activeSynergies(ug.run).some(s => s.name === 'Complex Surgery Program'), 'no ICU yet, no program');
  ug.startConstruction(ug.UNITS.find(u => u.id === 'icu'));
  const icu = ug.run.departments.find(d => d.id === 'icu');
  const before = ug.computeQuarter(ug.run, null);
  icu.construction = null;                              // fast-forward the build
  assert.ok(ug.activeSynergies(ug.run).some(s => s.name === 'Complex Surgery Program'), 'OR + ICU = complex surgery');
  const after = ug.computeQuarter(ug.run, null);
  assert.ok(after.revenue > before.revenue, 'the premium shows up in revenue');
});

test('the safety gamble: printed risk, and incidents that roll exactly those odds', () => {
  const { ug, evalIn } = loadGame();
  playToLevel2(ug);
  const cold = { operational:true, staffCap:100, throughput:80, limit:'staff', partMd:50, partRn:20, partSh:10 };
  assert.strictEqual(ug.unitRisk(cold), 0, 'under the safe load there is no risk');
  const hot = { operational:true, staffCap:100, throughput:100, limit:'staff', partMd:5, partRn:60, partSh:35 };
  assert.ok(ug.unitRisk(hot) > 1, 'full overspeed while physician-short reads over 1.0');
  assert.ok(ug.incidentOdds(hot, ug.run) > 0.08 && ug.incidentOdds(hot, ug.run) <= 0.6, 'odds are real and capped');

  // force the ED hot, pin the dice, and the incident lands as a major
  const ed = ug.run.departments.find(d => d.id === 'ed');
  ed.staff = { rn: 2, shared: 1 };
  ug.run.physicians.em = 1;
  const cash = ug.run.cash;
  evalIn('this.__r = Math.random; Math.random = () => 0');
  ug.applyIncidents(null);
  evalIn('Math.random = this.__r');
  assert.ok(ug.run.stats.incidents >= 1, 'the hot unit had its incident');
  assert.ok(ug.run.cash < cash, 'incidents bill cash');
  assert.ok(ug.run.lastIncidents && ug.run.lastIncidents.length >= 1, 'the incident is on the record');
});

test('expectation anchoring raises the bar on Normal, never on Easy, capped past the ceiling', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  ug.run.trail = { treat: [5000, 5000, 5000], net: [500, 500, 500] };
  ug.settings.difficulty = 'normal';
  const a = ug.anchorTarget('treat', 1000, 1200);
  assert.strictEqual(a.anchored, true, 'a board that watched 5,000 patients a quarter expects more than 1,000');
  assert.strictEqual(a.target, Math.round(1200 * ug.CFG.expCap), 'but the bar caps just past the feasible ceiling');
  ug.settings.difficulty = 'easy';
  const e = ug.anchorTarget('treat', 1000, 1200);
  assert.deepStrictEqual([e.target, e.anchored], [1000, false], 'Easy keeps the original guarantee');
  ug.settings.difficulty = 'normal';
  ug.run.trail = { treat: [900], net: [] };
  assert.strictEqual(ug.anchorTarget('treat', 1000, 1200).anchored, false, 'no anchoring without a delivery record');
});

test('community programs bill now and relieve the front door once matured', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  const ed = ug.run.departments.find(d => d.id === 'ed');
  ug.derivePathDemand();
  const before = ed.pathIn;
  ug.run.programs = { diversion: { on: true, age: 3 } };   // matured
  ug.derivePathDemand();
  assert.ok(before - ed.pathIn >= Math.floor(ed.demand * 0.08) - 1, 'a matured diversion clinic relieves ~8% of ED demand');
  const r = ug.computeQuarter(ug.run, null);
  assert.strictEqual(r.programSpend, 45, 'and it bills every quarter it runs');
  ug.run.programs.diversion.age = 1;
  ug.derivePathDemand();
  assert.ok(Math.abs(ed.pathIn - before) <= 1, 'an immature program costs money but relieves nothing yet');
});

test('closing a service line is permanent, paid for, and leaks patients to the ED', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  const tele = ug.run.departments.find(d => d.id === 'telehealth');
  const edBefore = ug.run.departments.find(d => d.id === 'ed').demand;
  const cash = ug.run.cash, rep = ug.run.reputation;
  ug.closeUnit('telehealth');
  assert.ok(!ug.run.departments.some(d => d.id === 'telehealth'), 'the unit is gone');
  assert.ok(ug.run.cash < cash, 'severance was paid');
  assert.ok(ug.run.reputation < rep, 'the community noticed');
  assert.ok(ug.run.departments.find(d => d.id === 'ed').demand > edBefore, 'a share of its patients land on the ED');
  ug.closeUnit('ed');
  assert.ok(ug.run.departments.some(d => d.id === 'ed'), 'the ED can never be closed');
  assert.ok(tele, 'sanity: telehealth existed before the closure');
});

test('the Board Report grades quality and weights the overall the ownership way', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  ug.run.stats = { net: -1000, tput: 990, demand: 1000, morale: 800, q: 10, quits: 0, peakBurn: 10, incidents: 0, incidentPts: 0 };
  ug.run.debt = 0;
  ug.run.klass = ug.classOf('nonprofit');
  const n = ug.reportData();
  assert.deepStrictEqual([n.margin, n.quality], ['F', 'A'], 'red margin, clean quality');
  const nOverall = n.overall;
  ug.run.klass = ug.classOf('profit');
  const p = ug.reportData();
  assert.ok(p.overall > nOverall || (nOverall === 'B' && p.overall === 'C'), 'margin-weighted ownership grades the same run harsher');
  ug.run.stats.incidentPts = 7;
  assert.notStrictEqual(ug.reportData().quality, 'A', 'incidents cost the quality grade');
});

test('unlocks open by grade and the whole v2 state rides the save string', async () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  ug.run.stats = { net: 2000, tput: 960, demand: 1000, morale: 700, q: 10, quits: 0, peakBurn: 10, incidents: 0, incidentPts: 0 };
  const got = ug.grantUnlocks({ victory: false });
  assert.ok(ug.unlocks.profit, 'a B margin unlocks for-profit ownership');
  assert.ok(ug.unlocks.district, 'a B access unlocks the district');
  assert.ok(!ug.unlocks.academic, 'academic waits for an outright victory');
  assert.ok(got.length >= 2);

  ug.run.klass = ug.classOf('academic');
  ug.run.programs = { chronic: { on: true, age: 2 } };
  ug.run.covStrikes = 1; ug.run.investorDraws = 2; ug.run.lastFundYear = 1;
  ug.run.trail = { treat: [800, 850], net: [100, 120] };
  const before = J(ug.computeQuarter(ug.run, ug.run.activeEvent));
  ug.applySave(await ug.decodeSave(await ug.encodeSave(ug.packSave())));
  assert.strictEqual(ug.run.klass, ug.classOf('academic'), 'ownership restores by identity');
  assert.strictEqual(J(ug.run.programs), J({ chronic: { on: true, age: 2 } }));
  assert.strictEqual(ug.run.covStrikes, 1);
  assert.strictEqual(J(ug.run.trail.treat), J([800, 850]));
  assert.strictEqual(J(ug.computeQuarter(ug.run, ug.run.activeEvent)), before,
    'the restored run computes the identical quarter, class levers and all');

  const old = ug.packSave();
  delete old.run.klass; delete old.run.programs; delete old.run.trail;
  delete old.run.covStrikes; delete old.run.investorDraws; delete old.run.lastFundYear;
  const restored = ug.unpackSave(old);
  assert.strictEqual(restored.klass.id, 'nonprofit', 'pre-v2 strings load as nonprofit');
  assert.strictEqual(J(restored.programs), '{}');
});
