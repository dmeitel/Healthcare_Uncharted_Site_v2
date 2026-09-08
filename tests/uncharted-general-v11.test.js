/**
 * v1.1 systems: the Board Report, the respiratory season, brewing (telegraphed) crises,
 * and traveler contracts. Runs on the shared strict-DOM harness in helpers/ug.js.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadGame, playToLevel2, J } = require('./helpers/ug');

test('respiratory season stacks on Q3 and only Q3', () => {
  const { ug } = loadGame();
  // level 3 is Y1 Q3; level 7 is Y2 Q3; levels 2 and 8 are not season quarters
  const calm = ug.applySeason(null, 3);
  assert.strictEqual(calm.season, true);
  assert.strictEqual(calm.demandMod.ed, ug.SEASON.demandMod.ed);
  const storm = ug.applySeason({ tag: 'Surge', name: 'Flu Surge', desc: 'x', demandMod: { ed: 1.5 } }, 7);
  assert.ok(Math.abs(storm.demandMod.ed - 1.5 * ug.SEASON.demandMod.ed) < 1e-9, 'season multiplies into an existing event');
  assert.strictEqual(storm.demandMod.medsurg, ug.SEASON.demandMod.medsurg, 'season adds mods the event lacked');
  assert.strictEqual(ug.applySeason(null, 2), null, 'Q2 gets no season');
  const q4 = ug.applySeason({ tag: 'x', name: 'x', desc: 'x' }, 8);
  assert.ok(!q4.season, 'boss quarters get no season');
});

test('a Q3 quarter in play carries the season in its active event', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  ug.run.level = 3;
  ug.finalizeLevel(null);
  assert.strictEqual(ug.run.activeEvent.season, true);
  assert.ok(ug.run.activeEvent.demandMod.ed >= ug.SEASON.demandMod.ed);
  assert.ok(ug.run.goal, 'the goal is sized with the season priced in');
});

test('a brewing threat lands at its printed odds, flagged as foretold', () => {
  const { ug, evalIn } = loadGame();
  playToLevel2(ug);
  evalIn('this.__origRandom = Math.random');

  ug.run.level = 5;                                  // Y2 Q1: no season, not a boss
  ug.run.brewing = { id: 'strike' };
  evalIn('Math.random = () => 0');                   // roll under p: the threat lands
  ug.startLevel(false);
  assert.strictEqual(ug.run.activeEvent.name, 'Nurses Strike');
  assert.strictEqual(ug.run.activeEvent.foretold, true);
  assert.strictEqual(ug.run.brewing && ug.run.brewing.id, 'strike', 'random pinned to 0 brews the first threat for NEXT quarter too');

  ug.run.level = 5;
  ug.run.brewing = { id: 'strike' };
  evalIn('Math.random = () => 0.99');                // roll over p: the threat passes, and no cold event fires either
  ug.startLevel(false);
  assert.strictEqual(ug.run.activeEvent, null);
  assert.strictEqual(ug.run.brewing, null, 'a passed threat does not linger');

  evalIn('Math.random = this.__origRandom');
});

test('brew entries reference real pool events, and pool picks are mutation-safe', () => {
  const { ug } = loadGame();
  for (const b of ug.BREWS) {
    assert.ok(ug.EVENT_POOL.some(e => e.name === b.eventName), `brew ${b.id} names a real event`);
    assert.ok(b.p > 0 && b.p < 1, `brew ${b.id} odds are honest`);
  }
  // scaleEvent mutates in place; pickFromPool must isolate the shared pool entries from that
  const src = ug.EVENT_POOL.find(e => e.name === 'Flu Surge');
  const before = src.demandMod.ed;
  const copy = ug.pickFromPool(src);
  copy.demandMod.ed = 999;
  assert.strictEqual(src.demandMod.ed, before, 'mutating a pick never touches the pool');
});

test('traveler contracts lift floor capacity and bill through payroll', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  const r0 = ug.computeQuarter(ug.run, ug.run.activeEvent);
  ug.setTravelers(1); ug.setTravelers(1);
  assert.strictEqual(ug.run.travelers, 2);
  const r2 = ug.computeQuarter(ug.run, ug.run.activeEvent);
  assert.ok(Math.abs((r2.salaries - r0.salaries) - 2 * ug.CFG.travCost) < 1e-6, 'two packs bill exactly two fees');
  assert.ok(r2.throughput >= r0.throughput, 'capacity never drops with travelers on');
  ug.setTravelers(9);
  assert.strictEqual(ug.run.travelers, ug.CFG.travMax, 'packs cap at the max');
  ug.run.level += 1;
  ug.startLevel(false);
  assert.strictEqual(ug.run.travelers, 0, 'contracts expire when a new quarter opens');
});

test('the Board Report grades off run-lifetime stats, with notch adjustments', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  assert.strictEqual(ug.run.stats.q, 1, 'quarter one is on the record');
  assert.ok(Math.abs(ug.run.stats.net - ug.run.lastResult.net) < 1e-6);

  ug.run.stats = { net: 2000, tput: 900, demand: 1000, morale: 700, q: 10, quits: 0, peakBurn: 20 };
  ug.run.debt = 0;
  let d = ug.reportData();
  assert.deepStrictEqual([d.margin, d.access, d.workforce, d.overall], ['B', 'B', 'B', 'B']);

  ug.run.stats.quits = 3;                            // turnover costs a workforce notch
  d = ug.reportData();
  assert.strictEqual(d.workforce, 'C');

  ug.run.debt = 5000;                                // leveraged past cash costs a margin notch
  d = ug.reportData();
  assert.strictEqual(d.margin, 'C');

  ug.run.stats = { net: -100, tput: 500, demand: 1000, morale: 300, q: 10, quits: 9, peakBurn: 90 };
  d = ug.reportData();
  assert.deepStrictEqual([d.margin, d.access, d.workforce], ['F', 'F', 'F'], 'a wrecked run grades like one');
});

test('v1.1 state rides the save string, and old strings still load', async () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  ug.setTravelers(1);
  ug.run.brewing = { id: 'cyber' };
  const statsBefore = J(ug.run.stats);

  const data = await ug.decodeSave(await ug.encodeSave(ug.packSave()));
  ug.applySave(data);
  assert.strictEqual(ug.run.travelers, 1);
  assert.strictEqual(ug.run.brewing.id, 'cyber');
  assert.strictEqual(J(ug.run.stats), statsBefore);

  // a pre-v1.1 string has none of these fields: defaults must carry it
  const old = ug.packSave();
  delete old.run.travelers; delete old.run.brewing; delete old.run.stats;
  const restored = ug.unpackSave(old);
  assert.strictEqual(restored.travelers, 0);
  assert.strictEqual(restored.brewing, null);
  assert.strictEqual(restored.stats.q, 0);
});
