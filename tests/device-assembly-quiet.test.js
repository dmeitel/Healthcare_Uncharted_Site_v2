/**
 * Headwall, a puzzle keeps quiet (2026-10-15). David: "it should not jump to the hint section or say what the last move is
 * during the play. the whole point is that its a puzzle game it also feels like we do not need test and note tabs if we are
 * not going to put anything specificly usefull there."
 *   1. A move that worked says nothing outside the five training walls: its message goes through moveToast, which speaks
 *      only where hintLeads() (a tutorial, where the messages are the lesson). A refused move still says why.
 *   2. The bedside screen is two pages, Order and Hint, on the glass and on a phone's readout and sheet.
 *   3. Complete does not turn the screen; after a message the screen rests on the order (the hint, on a training wall).
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'fun', 'headwall', 'index.html'), 'utf8');
const fn = (name) => { const i = SRC.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); return SRC.slice(i, SRC.indexOf('\n}', i)); };

/* the messages that say what a move did; each has to wait for a training wall */
const MOVES = ['Connected', 'Too short', 'Interface mismatch', 'Incompatible connection', 'Swapped', 'Circuit on', 'In line',
  'Turned to fit', 'Tubing on', 'From the cart', 'Jumper laid', 'Back on the cart', 'Tubing came off', 'Moved together',
  'Pulled off', 'Undone', 'Wall reset'];

test('a move that worked says nothing outside the training walls', () => {
  assert.match(fn('moveToast'), /if\(hintLeads\(\)\) toast\(/, 'moveToast speaks only on a training wall');
  assert.match(SRC, /const hintLeads = \(\) => !!\(S && S\.level && S\.level\.kind==='tutorial'\);/, 'and a training wall is a tutorial');
  const loud = [];
  for (const head of MOVES) {
    const plain = new RegExp("(?<!move)[Tt]oast\\((?:'[a-z]+'|[^,]+),\\s*(?:[^,]*\\?)?'" + head.replace(/ /g, ' ') + "'", 'g');
    if (plain.test(SRC)) loud.push(head);
  }
  assert.deepStrictEqual(loud, [], 'these move messages still speak on every wall');
  assert.ok((SRC.match(/toast\('bad','No'/g) || []).length >= 10, 'a refused move still says why');
});

test('the bedside screen is two pages, Order and Hint', () => {
  assert.match(fn('screenSVG'), /const TABS=\[\['order','ORDER',10,48\],\['hint','HINT',66,38\]\];/, 'the glass has two tabs');
  assert.match(fn('fillRead'), /tabs\.innerHTML=\[\['order','Order'\],\['hint', one \? step : 'Hint'\]\]/, 'the readout and the sheet have two tabs');
  for (const f of ['screenSVG', 'fillRead', 'screenLine']) assert.doesNotMatch(fn(f), /page==='(test|note)'/, f + ' draws no Test or Note page');
});

test('Complete leaves the screen where it was, and a message hands it back to the order', () => {
  assert.doesNotMatch(fn('runTest'), /screen\.page\s*=/, 'Complete does not turn the screen');
  assert.match(fn('screenShow'), /S\.screen\.page=hintLeads\(\) \? 'hint' : 'order';/, 'after a message the screen rests on the order');
  assert.match(fn('screenLine'), /if\(page==='hint' && hintLeads\(\)\)/, "a phone's line shows the hint only on a training wall");
});
