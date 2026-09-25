/**
 * Guards found by a seeded fuzz of the hospital game, 2026-09-23. A player who spends the level-1
 * cash before building was told to build with nothing affordable; a seat's unit intent named its
 * unit by position, so a close landing first sent it to the wrong unit or crashed the host; a
 * stale draft pick threw.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadGame } = require('./helpers/ug');

function trauma() {
  const g = loadGame();
  g.ug.settings.size = 'trauma';
  g.ug.dispatchAct('start', { ceo: 'mba' });
  return g;
}

test('broke before building: the hint names the gap and the two ways back', () => {
  const { ug, ids } = loadGame();
  ug.dispatchAct('start', { ceo: 'mba' });
  ug.run.cash = 50;                                   // below the cheapest unit
  ug.dispatchAct('runq');
  assert.strictEqual(ug.run.level, 1, 'the quarter does not run without a build');
  assert.match(ids['ug-runhint'].textContent, /cheapest unit costs .* you have .*Undo.*Borrow/);
  ug.run.cash = 5000;
  ug.dispatchAct('runq');
  assert.match(ids['ug-runhint'].textContent, /Build on the map/, 'with the cash in hand the plain hint stands');
});

test('a unit intent resolves by id after a close shifts the positions', () => {
  const { ug } = trauma();
  const pos = id => ug.run.departments.findIndex(d => d.id === id);
  const oldImaging = String(pos('imaging')), oldSurgery = String(pos('surgery'));
  const rn0 = ug.run.departments[pos('imaging')].staff.rn;
  ug.dispatchAct('closego', { id: 'surgery' });
  assert.strictEqual(pos('surgery'), -1);
  assert.notStrictEqual(String(pos('imaging')), oldImaging, 'the close moved imaging');
  // a seat's hire, rendered before the close, lands after it
  ug.dispatchAct('hire', { i: oldImaging, u: 'imaging', type: 'rn' });
  assert.strictEqual(ug.run.departments[pos('imaging')].staff.rn, rn0 + 1, 'the hire reached imaging, not its old neighbour');
  const cash = ug.run.cash;
  ug.dispatchAct('expand', { i: oldSurgery, u: 'surgery' });
  assert.strictEqual(ug.run.cash, cash, 'an intent for a closed unit is dropped');
  assert.doesNotThrow(() => ug.dispatchAct('hire', { i: '99', type: 'rn' }), 'an index past the end is dropped, not thrown');
});

test('a draft pick with no card behind it is dropped', () => {
  const { ug } = trauma();
  const lvl = ug.run.level;
  assert.doesNotThrow(() => ug.dispatchAct('enh', { i: '7' }));
  assert.strictEqual(ug.run.level, lvl);
});
