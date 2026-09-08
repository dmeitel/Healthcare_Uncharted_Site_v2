/**
 * The last quartet from the design doc: the capital renewal clock, authored scenarios with
 * scripted quarters, the Chart Room codex, and scenario state riding the save string.
 * Runs on the shared strict-DOM harness in helpers/ug.js.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadGame, playToLevel2, J } = require('./helpers/ug');

test('the equipment clock ages the capital-heavy lines and renewal resets it', () => {
  const { ug } = loadGame();
  playToLevel2(ug);                                     // one quarter has run
  const or = ug.run.departments.find(d => d.id === 'surgery');
  assert.strictEqual(or.equipAge, 1, 'the OR aged one quarter');
  assert.strictEqual(ug.run.departments.find(d => d.id === 'ed').equipAge, undefined, 'the ED carries no clock');

  const capFresh = ug.deptProject(or, ug.run, null).capacity;
  or.equipAge = ug.CFG.equipWarn;
  const capAging = ug.deptProject(or, ug.run, null).capacity;
  or.equipAge = ug.CFG.equipCrit;
  const capObsolete = ug.deptProject(or, ug.run, null).capacity;
  assert.ok(Math.abs(capAging - capFresh * ug.CFG.equipWarnCap) < 1, 'aging dips capacity');
  assert.ok(capObsolete < capAging, 'obsolete dips it further');

  const cost = ug.renewCost(or);
  assert.strictEqual(cost, Math.round(280 * ug.CFG.equipRenewFrac), 'renewal prices off original capex');
  const cash = ug.run.cash;
  ug.renewEquip('surgery');
  assert.strictEqual(or.equipAge, 0, 'renewal resets the clock');
  assert.strictEqual(ug.run.cash, cash - cost, 'and bills the capital');
  ug.renewEquip('ed');
  assert.strictEqual(ug.run.cash, cash - cost, 'non-equipment lines cannot renew');
});

test('a scenario fixes the table, mutates the opening, forces the CEO, and scripts quarters', () => {
  const { ug } = loadGame();
  const sc = ug.scenarioOf('breach');
  ug.settings.scenario = 'breach';
  ug.settings.difficulty = sc.difficulty; ug.settings.size = sc.size;
  ug.settings.klass = sc.klass; ug.settings.years = sc.years;
  ug.dispatchAct('start', { ceo: 'mha' });
  assert.strictEqual(ug.run.scenario.id, 'breach');
  assert.strictEqual(ug.run.cash, 420, 'the setup mutation applied');
  assert.ok(ug.run.departments.some(d => d.id === 'icu'), 'trauma footprint came with the scenario');

  ug.run.level = 2;
  ug.startLevel(false);
  assert.strictEqual(ug.run.activeEvent.name, 'Billing Cyberattack', 'the scripted quarter fires on schedule');
  assert.strictEqual(ug.run.activeEvent.scripted, true);
  assert.strictEqual(ug.run.activeEvent.foretold, true);

  const { ug: u2 } = loadGame();
  const flip = u2.scenarioOf('flip');
  u2.settings.scenario = 'flip';
  u2.settings.difficulty = flip.difficulty; u2.settings.size = flip.size;
  u2.settings.klass = flip.klass; u2.settings.years = flip.years;
  u2.dispatchAct('start', { ceo: 'mha' });              // player asked for MHA; the scenario says otherwise
  assert.strictEqual(u2.run.ceo.id, 'pe', 'The PE Flip seats Crestline no matter what');
  assert.strictEqual(u2.run.klass.id, 'profit', 'scenario ownership bypasses the class lock');
});

test('the OB Desert charter forbids closing maternity', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  ug.startConstruction(ug.UNITS.find(u => u.id === 'maternity'));
  ug.run.departments.find(d => d.id === 'maternity').construction = null;
  ug.run.scenario = { id: 'ob' };
  ug.closeUnit('maternity');
  assert.ok(ug.run.departments.some(d => d.id === 'maternity'), 'the charter held');
  ug.run.scenario = null;
  ug.closeUnit('maternity');
  assert.ok(!ug.run.departments.some(d => d.id === 'maternity'), 'outside the scenario it closes like anything else');
});

test('the Chart Room records what a device has met', () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  const flu0 = ug.codex.ev['Flu Surge'] || 0;          // the play-through itself may have rolled one
  ug.codexSeen({ name: 'Flu Surge' });
  ug.codexSeen({ name: 'Boss: Flu Surge' });
  ug.codexSeen({ name: 'Unit Closure: Oncology' });
  assert.strictEqual(ug.codex.ev['Flu Surge'], flu0 + 2, 'boss variants count as the base crisis');
  assert.strictEqual(ug.codex.ev['Unit Closure Order'], 1, 'closure orders normalize');

  ug.run.stats = { net: 3500, tput: 970, demand: 1000, morale: 780, q: 10, quits: 0, peakBurn: 10, incidents: 0, incidentPts: 0 };
  ug.run.scenario = { id: 'breach' };
  ug.codexFinish({ victory: true });
  assert.ok(ug.codex.wins.nonprofit, 'a victory files a best grade for the ownership');
  assert.strictEqual(ug.codex.scen.breach, 1, 'the scenario is marked finished');
  ug.codexFinish({ victory: false });
  assert.strictEqual(Object.keys(ug.codex.wins).length, 1, 'losses file nothing');
});

test('scenario identity and equipment age ride the save string', async () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  ug.run.scenario = { id: 'cliff' };
  ug.run.departments.find(d => d.id === 'surgery').equipAge = 12;
  const data = await ug.decodeSave(await ug.encodeSave(ug.packSave()));
  ug.applySave(data);
  assert.strictEqual(ug.run.scenario.id, 'cliff');
  assert.strictEqual(ug.run.departments.find(d => d.id === 'surgery').equipAge, 12);
  const old = ug.packSave();
  delete old.run.scenario;
  assert.strictEqual(ug.unpackSave(old).scenario, null, 'older strings default to free play');
});
