/**
 * Save-string round trips for Uncharted General.
 *
 * The game is one inline script on src/secret-menu/uncharted-general/index.html. This harness
 * extracts it, runs it in a vm sandbox with a STRICT DOM stub (getElementById answers only for
 * ids that exist in the static HTML, anything else is null, which is how the missing-id class
 * of bug gets caught), plays a short deterministic run through the real code paths, and proves
 * that packSave -> encodeSave -> decodeSave -> applySave reproduces the exact same quarter.
 *
 * The invariant that matters: computeQuarter(run, activeEvent) is byte-identical before and
 * after a round trip. If that holds, the restored run IS the saved run.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadGame, playToLevel2, J } = require('./helpers/ug');

test('a save string round-trips to the exact same quarter', async () => {
  const { ug } = loadGame();
  playToLevel2(ug);

  const before = {
    result: ug.computeQuarter(ug.run, ug.run.activeEvent),
    level: ug.run.level, cash: ug.run.cash, morale: ug.run.morale,
    goalKind: ug.run.goal.kind, goalTarget: ug.run.goal.target, goalLabel: ug.run.goal.label,
    event: J(ug.run.activeEvent || null),
    deptCount: ug.run.departments.length,
  };

  const save = ug.packSave();
  const str = await ug.encodeSave(save);
  assert.ok(str.startsWith('HUG1.'), 'string carries the versioned prefix');
  assert.ok(!/\s/.test(str), 'string has no whitespace');

  const data = await ug.decodeSave(str);
  assert.strictEqual(J(data), J(save), 'decode reproduces the packed save exactly');

  ug.applySave(data);
  assert.strictEqual(ug.run.level, before.level);
  assert.strictEqual(ug.run.cash, before.cash);
  assert.strictEqual(ug.run.morale, before.morale);
  assert.strictEqual(ug.run.departments.length, before.deptCount);
  assert.strictEqual(ug.run.ceo, ug.CEOS[1], 'restored CEO is the live catalog object');
  assert.strictEqual(typeof ug.run.goal.test, 'function', 'goal functions are rebuilt');
  assert.strictEqual(ug.run.goal.kind, before.goalKind);
  assert.strictEqual(ug.run.goal.target, before.goalTarget);
  assert.strictEqual(ug.run.goal.label, before.goalLabel);
  assert.strictEqual(J(ug.run.activeEvent || null), before.event);
  assert.strictEqual(
    J(ug.computeQuarter(ug.run, ug.run.activeEvent)), J(before.result),
    'the restored run computes the identical quarter');
});

test('enhancements re-link to the catalog; choice-event grants travel whole', async () => {
  const { ug } = loadGame();
  playToLevel2(ug);

  // start from a clean enhancement list so a choice-event grant from playToLevel2 can't shift indices
  ug.run.enhancements = [];
  const well = ug.ENHANCEMENTS.find(e => e.id === 'well');
  const grant = { id: 'ehr_opt', icon: 'x', name: 'Optimized EHR', desc: 'test grant', mods: { throughput: 1.08 } };
  ug.run.enhancements.push(well, grant);

  const before = J(ug.computeQuarter(ug.run, ug.run.activeEvent));
  ug.applySave(await ug.decodeSave(await ug.encodeSave(ug.packSave())));

  const rWell = ug.run.enhancements.find(e => e.id === 'well');
  const rGrant = ug.run.enhancements.find(e => e.id === 'ehr_opt');
  assert.strictEqual(rWell, well, 'catalog enhancement restored by identity');
  assert.notStrictEqual(rGrant, grant, 'grant is a value copy, not a reference');
  assert.strictEqual(J(rGrant), J(grant), 'grant survives by value');
  assert.strictEqual(J(ug.computeQuarter(ug.run, ug.run.activeEvent)), before,
    'modifiers still land after the round trip');
});

test('a vacant corner office and a forced optional objective survive the trip', async () => {
  const { ug } = loadGame();
  playToLevel2(ug);

  ug.run.ceo = null; ug.run.ceoVacant = true; ug.run.ceoDeadline = 9;
  ug.run.optional = ug.OPT_BUILDERS.rep(80);

  ug.applySave(await ug.decodeSave(await ug.encodeSave(ug.packSave())));

  assert.strictEqual(ug.run.ceo, null);
  assert.strictEqual(ug.run.ceoVacant, true);
  assert.strictEqual(ug.run.ceoDeadline, 9);
  assert.strictEqual(ug.run.optional.kind, 'rep');
  assert.strictEqual(ug.run.optional.target, 80);
  assert.strictEqual(ug.run.optional.rewardText, '+$110k cash');
  assert.strictEqual(typeof ug.run.optional.test, 'function');
});

test('the No-CEO seat restores as the live sentinel object', async () => {
  const { ug } = loadGame();
  ug.initRun();
  ug.pickCeo(ug.NO_CEO);
  ug.startConstruction(ug.UNITS.find(u => u.id === 'telehealth'));
  ug.applySave(await ug.decodeSave(await ug.encodeSave(ug.packSave())));
  assert.strictEqual(ug.run.ceo, ug.NO_CEO);
});

test('wrapped, raw-fallback, and garbage strings behave', async () => {
  const { ug } = loadGame();
  playToLevel2(ug);
  const save = ug.packSave();
  const str = await ug.encodeSave(save);

  // a chat app hard-wraps the string: decode must not care
  const wrapped = str.replace(/(.{64})/g, '$1\n');
  assert.strictEqual(J(await ug.decodeSave(wrapped)), J(save));

  // the uncompressed fallback prefix reads too
  const raw = 'HUG1R.' + Buffer.from(JSON.stringify(save), 'utf8').toString('base64');
  assert.strictEqual(J(await ug.decodeSave(raw)), J(save));

  await assert.rejects(() => ug.decodeSave(''), 'empty string is rejected');
  await assert.rejects(() => ug.decodeSave('hello there'), 'non-save text is rejected');
  await assert.rejects(() => ug.decodeSave('HUG1.@@@not-base64@@@'), 'mangled payload is rejected');
  assert.throws(() => ug.unpackSave({}), 'empty object is rejected');
  assert.throws(() => ug.unpackSave({ v: 1, run: { level: 2, departments: [] } }), 'empty hospital is rejected');
});
