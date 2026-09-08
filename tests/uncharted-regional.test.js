/**
 * Uncharted Regional: the health-system game. The lesson under test is the design doc's §8
 * sentence made mechanical: the best hospital strategy is sometimes the wrong system strategy.
 * Runs on the shared strict-DOM harness (hook window.__hs).
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadSystem, J } = require('./helpers/ug');

test('the region boots: three facilities, live demand, a sized goal', () => {
  const { hs } = loadSystem();
  assert.strictEqual(hs.sys.facilities.length, 3);
  assert.ok(hs.sys.goal && hs.sys.goal.label, 'a goal is on the board');
  const r = hs.computeSystem(hs.sys, hs.sys.activeEvent);
  assert.ok(r.demand > 2000 && r.served > 0 && r.access > 0 && r.access <= 1, 'the projection computes');
  assert.ok(Number.isFinite(r.net), 'consolidated net is a number');
});

test('distance is the tax: county demand lands at the county hospital', () => {
  const { hs } = loadSystem();
  const r = hs.computeSystem(hs.sys, null);
  const hallEd = r.facRes.halloran.lineServed.ed || 0;
  assert.ok(hallEd > 100, 'rural ED volume mostly stays at Halloran');
  assert.ok(r.zoneAccess.rural > 0.4, 'the county is reachable at all');
});

test('THE LESSON: centralizing cardiology helps margin and costs community', () => {
  const { hs } = loadSystem();
  // hold staffing constant-and-sufficient so the comparison isolates the LINE decision (closing a
  // line also concentrates scarce staff on what remains, a real effect tested implicitly above)
  hs.facOf('crossroads').staff = 24;
  const before = hs.computeSystem(hs.sys, null);
  const trustBefore = hs.sys.zones.sub.trust;
  hs.dispatchAct('closego', { f: 'crossroads', l: 'card' });     // pull cardiology out of the suburbs
  const after = hs.computeSystem(hs.sys, null);
  assert.ok(after.fixed < before.fixed, 'fixed costs drop: the margin case for centralizing');
  assert.ok(hs.sys.zones.sub.trust === trustBefore - hs.CFG.closeTrustHit, 'the suburbs answer with trust');
  assert.ok(after.access < before.access, 'suburban cardiac patients cannot all travel: access pays');
  assert.ok(!hs.sys.facilities.find(f => f.id === 'crossroads').lines.card, 'the line is gone');
});

test('one workforce pool: overhiring anywhere raises wages everywhere', () => {
  const { hs } = loadSystem();
  const wi0 = hs.wageIdx(hs.sys, null);
  hs.sys.facilities[0].staff += (hs.CFG.poolTotal - hs.poolUsed(hs.sys));   // drain the pool
  const wi1 = hs.wageIdx(hs.sys, null);
  assert.ok(wi1 > wi0 && wi1 > 1.1, 'the wage index climbs past the utilization floor');
  const r = hs.computeSystem(hs.sys, null);
  assert.ok(Math.abs(r.facRes.halloran.salary - hs.sys.facilities[2].staff * hs.CFG.staffWage * wi1) < 1,
    'a facility that hired nobody pays the new regional wage anyway');
});

test('shared services change the physics for all three facilities', () => {
  const { hs } = loadSystem();
  const r0 = hs.computeSystem(hs.sys, null);
  hs.dispatchAct('shared', { k: 'gpo' });
  const r1 = hs.computeSystem(hs.sys, null);
  assert.ok(Math.abs(r1.fixed - r0.fixed * hs.CFG.svc.gpo.fixedMult) < 2, 'group purchasing trims fixed costs 8%');
  hs.dispatchAct('shared', { k: 'ehr' });
  const r2 = hs.computeSystem(hs.sys, null);
  assert.ok(r2.served >= r1.served, 'the system EHR never serves fewer');
  assert.strictEqual(r2.sharedCost, hs.CFG.svc.gpo.cost + hs.CFG.svc.ehr.cost, 'HQ pays for both');
});

test('goals are projection-anchored: standing pat clears the board on Easy', () => {
  const { hs, evalIn } = loadSystem();
  hs.settings.difficulty = 'easy';
  evalIn('this.__r = Math.random; Math.random = () => 0');       // deterministic goal pick + event roll
  for (let i = 0; i < 6; i++) {
    hs.sys.level = i + 1;
    hs.sys.activeEvent = null;
    const g = hs.makeSysGoal();
    const r = hs.computeSystem(hs.sys, null);
    if (g.kind !== 'rural') assert.ok(g.test(r), `standing pat clears a ${g.kind} goal on Easy`);
    else assert.ok(g.target <= Math.round(r.zoneAccess.rural * 100) + 2, 'the rural goal is a two-point stretch, never a cliff');
  }
  // and the lean goal specifically: standing pat must clear it on Easy, and it never opens a term
  evalIn('Math.random = () => 0.99');                            // pick the last pool entry: lean
  hs.sys.level = 2; hs.sys.activeEvent = null;
  const lean = hs.makeSysGoal();
  assert.strictEqual(lean.kind, 'lean', 'the 0.99 roll lands on lean');
  assert.ok(lean.test(hs.computeSystem(hs.sys, null)), 'standing pat clears lean on Easy');
  hs.sys.level = 1;
  for (let i = 0; i < 4; i++) assert.notStrictEqual(hs.makeSysGoal().kind, 'lean', 'quarter one never opens on lean');
  evalIn('Math.random = this.__r');
});

test('the payer table pays for market share, and hardball is a printed-odds bet', () => {
  const { hs, evalIn } = loadSystem();
  hs.sys.lastResult = hs.computeSystem(hs.sys, null);
  const rate0 = hs.sys.rateComm;
  const rev0 = hs.sys.lastResult.revenue;
  evalIn('this.__r = Math.random; Math.random = () => 0');       // hardball wins at rolled 0
  hs.openNegotiation();
  assert.ok(hs.sys.pendingNeg && hs.sys.pendingNeg.winP > 0.3, 'leverage prices the odds');
  hs.resolveNeg(2);
  evalIn('Math.random = this.__r');
  assert.ok(Math.abs(hs.sys.rateComm - (rate0 + 0.12)) < 1e-9, 'the win lands +0.12 on the commercial rate');
  assert.ok(hs.computeSystem(hs.sys, null).revenue > rev0, 'and revenue feels it');
});

test('a full quarter runs: trust drifts, strain accrues, the term can end', () => {
  const { hs, evalIn } = loadSystem();
  hs.settings.difficulty = 'easy';
  evalIn('this.__r = Math.random; Math.random = () => 0');
  hs.sys.goal = hs.makeSysGoal();
  hs.runQuarter();
  evalIn('Math.random = this.__r');
  assert.strictEqual(hs.sys.over, false, 'an Easy standing-pat quarter clears');
  assert.strictEqual(hs.sys.stats.q, 1, 'the record advanced');
  const d = hs.reportData();
  assert.ok('ABCDF'.includes(d.overall), 'the System Report grades');
  hs.sys.cash = -9000;                                  // deeper than any quarter can earn back
  hs.sys.goal = { kind: 'net', target: -99999, label: 'x', test: () => true };
  hs.runQuarter();
  assert.strictEqual(hs.sys.over, true, 'insolvency ends the term');
});

test('a term rides an HUS1 save string, quarter honestly re-rolled on restore', async () => {
  const { hs } = loadSystem();
  hs.sys.cash = 1234;
  hs.sys.facilities[0].staff = 30;
  hs.sys.zones.rural.trust = 42;
  const str = await hs.encodeSave(hs.packSave());
  assert.ok(str.startsWith('HUS1.'), 'its own prefix, same codec family');
  hs.dispatchAct('closego', { f: 'crossroads', l: 'mat' });      // wreck something, then restore
  hs.applySave(await hs.decodeSave(str));
  assert.strictEqual(hs.sys.cash, 1234);
  assert.strictEqual(hs.sys.facilities[0].staff, 30);
  assert.strictEqual(hs.sys.zones.rural.trust, 42);
  assert.ok(hs.sys.facilities.find(f => f.id === 'crossroads').lines.mat, 'the closure did not survive the restore');
  assert.ok(hs.sys.goal && hs.sys.goal.label, 'the restored quarter has a freshly sized goal');
});
