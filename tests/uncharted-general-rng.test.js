/**
 * The hospital game rolls its dice from a seeded generator that rides the save. Two runs with the
 * same seed and the same verbs are the same run; a restored save continues the same sequence; an
 * old save string with no dice still loads.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadGame, J } = require('./helpers/ug');

/** boot a run on a fixed seed through the real code paths, then play the same opening */
function seededOpening(seed) {
  const g = loadGame();
  const { ug } = g;
  ug.initRun();
  ug.run.rng = g.evalIn('window.HURng.make(' + seed + ')');
  ug.pickCeo(ug.CEOS[1]);
  ug.startConstruction(ug.UNITS.find(u => u.id === 'telehealth'));
  ug.runQuarter();
  ug.advance();
  if (ug.run.pendingEvent) ug.resolveEventChoice(ug.run.pendingEvent.options.findIndex(o => !o.cost));
  return g;
}
const runOf = ug => J(ug.packSave().run);

test('a run carries its dice, and the save carries their position', () => {
  const { ug } = seededOpening(42);
  assert.strictEqual(typeof ug.run.rng, 'function', 'the run has a generator');
  const packed = ug.packSave();
  assert.strictEqual(packed.run.rng.seed, 42, 'the seed is in the save');
  assert.ok(packed.run.rng.n > 0, 'and so is how far the dice have gone');
});

test('same seed, same verbs, same hospital; a different seed diverges somewhere', () => {
  const A = seededOpening(42), B = seededOpening(42);
  assert.strictEqual(runOf(A.ug), runOf(B.ug), 'two runs on one seed are one run');
  // play on for a few quarters; events, incidents and drafts all come off the same dice
  for (const g of [A, B]) { for (let i = 0; i < 3; i++) { g.ug.runQuarter(); if (g.ug.run.over) break; g.ug.advance(); if (g.ug.run.pendingEvent) g.ug.resolveEventChoice(g.ug.run.pendingEvent.options.findIndex(o => !o.cost)); } }
  assert.strictEqual(runOf(A.ug), runOf(B.ug), 'still one run after three more quarters');
  const seeds = [1, 2, 3, 4, 5].map(s => runOf(seededOpening(s).ug));
  assert.ok(new Set(seeds).size > 1, 'different seeds do not all produce the same opening');
});

test('a restored save continues the same dice, so a saved run replays', async () => {
  const A = seededOpening(7);
  const str = await A.ug.encodeSave(A.ug.packSave());
  const B = loadGame();
  B.ug.applySave(await B.ug.decodeSave(str));
  assert.strictEqual(runOf(B.ug), runOf(A.ug), 'restored byte for byte, dice included');
  for (const g of [A, B]) { g.ug.runQuarter(); if (!g.ug.run.over) { g.ug.advance(); if (g.ug.run.pendingEvent) g.ug.resolveEventChoice(g.ug.run.pendingEvent.options.findIndex(o => !o.cost)); } }
  assert.strictEqual(runOf(B.ug), runOf(A.ug), 'the next quarter rolled the same on both');
});

test('an old save string with no dice still loads and gets fresh ones', async () => {
  const A = seededOpening(9);
  const packed = A.ug.packSave();
  delete packed.run.rng;
  const B = loadGame();
  B.ug.applySave(await B.ug.decodeSave(await B.ug.encodeSave(packed)));
  assert.strictEqual(typeof B.ug.run.rng, 'function', 'fresh dice');
  assert.strictEqual(B.ug.run.cash, A.ug.run.cash, 'everything else came through');
});

test('pinDice overrides the run dice for a test and hands them back', () => {
  const { ug } = seededOpening(3);
  ug.pinDice(() => 0.5);
  assert.strictEqual(ug.run.rng.state().n, ug.run.rng.state().n, 'pinned rolls do not advance the run dice');
  ug.pinDice(null);
  const n0 = ug.run.rng.state().n;
  ug.runQuarter();
  assert.ok(ug.run.rng.state().n >= n0, 'unpinned, the run dice are in use again');
});
