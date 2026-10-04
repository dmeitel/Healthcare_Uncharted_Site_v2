/**
 * Alarm Fatigue, the leftover defects from docs/HU-GAME-REVIEW-2026-09-23.md section 3.1
 * (fixed 2026-10-03). Each is pinned by reading the page source, the way the wiring half of
 * alarm-fatigue-alarms.test.js is; the browser walk that proved them is
 * tmp/cleanup/alarm-fatigue/probe.js.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const PAGE = fs.readFileSync(path.join(__dirname, '..', 'src', 'fun', 'alarm-fatigue', 'index.html'), 'utf8');
function fnBody(name) {
  const a = PAGE.indexOf('function ' + name + '(');
  assert.ok(a > 0, name + ' exists');
  const b = PAGE.indexOf('\n}\n', a);
  return PAGE.slice(a, b);
}

test('a card that opens by itself never pulls focus onto one of its answers', () => {
  // the med card is not a dialog: it takes no focus at all
  assert.doesNotMatch(fnBody('spawnMed'), /\.focus\(/, 'spawnMed moves no focus');
  // the code card, the decision support pop-up and the hand-off report focus the card itself
  const code = fnBody('startCode');
  assert.doesNotMatch(code, /opts\[0\]\.focus|nxt\.focus/, 'the code card never focuses a dose');
  assert.match(code, /box\.focus\(\{preventScroll:true\}\)/, 'the code card focuses itself without scrolling');
  assert.doesNotMatch(PAGE, /getElementById\('bpaAcc'\)\.focus\(\)/, 'Acknowledge is not pre-focused');
  assert.doesNotMatch(fnBody('startReport'), /querySelector\('\.opt'\);\s*if\(f\) f\.focus/, 'the report never pre-focuses an answer');
});

test('Esc on the decision support pop-up defers it and does not also open the game menu', () => {
  const m = PAGE.match(/escOpens:\(\)=>([\s\S]*?)\n\}\);/);
  assert.ok(m, 'escOpens is set');
  assert.match(m[1], /bpaLayer/);
});

test('the Task List sheet sits over the reward floats', () => {
  const z = sel => { const m = PAGE.match(new RegExp(sel + '\\{[^}]*?z-index:(\\d+)')); assert.ok(m, sel); return +m[1]; };
  assert.ok(z('#ehrPanel') > z('\\.af \\.float'), '#ehrPanel above .float');
});

test('a sideways phone measures the tab row before it places the console', () => {
  const body = fnBody('placeStage');
  assert.match(body, /querySelector\('\.ehrTabs'\)/);
  assert.match(body, /stage\.style\.maxHeight/, 'the console still ends inside the floor');
});

test('staying for overtime does not rename the lunch; only a lunch does', () => {
  assert.match(fnBody('resumeShift'), /const afterLunch = lastEndKind==='lunch'/);
  assert.match(fnBody('endShift'), /lastEndKind=kind/);
});

test('the tech text lists only what a tech is allowed to clear', () => {
  const m = PAGE.match(/\{id:'tech'[\s\S]*?ds:'([^']*)'/);
  assert.ok(m, 'the tech upgrade exists');
  const list = m[1].split('.')[0];
  assert.doesNotMatch(list, /pumps|meds/, 'pumps and meds are licensed work (lic:true)');
  assert.match(m[1], /Pumps, meds and codes are out of their scope/);
});

test('on a phone the heart rate is never cut to "♥ 1…" beside the rhythm', () => {
  assert.match(PAGE, /\.bank-tile \.hr, #bank\.wide \.bank-tile \.hr\{[^}]*overflow:visible/);
});
