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
  // since 2026-10-20 resumeShift asks the dispatcher, and the 'resume' verb in the engine block decides
  assert.match(fnBody('resumeShift'), /dispatchAct\('resume'\)/);
  const verb = PAGE.slice(PAGE.indexOf('  resume(){'), PAGE.indexOf('/* SHIFT ENGINE END */'));
  assert.match(verb, /const afterLunch = S\.lastEndKind==='lunch'/);
  assert.match(fnBody('endShift'), /S\.lastEndKind=kind/);
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

// 2026-10-20: the play check (scripts/play-check.js, the whole floor bought) found the button riding over the monitors
// and the family and Joint Commission cards on the CHECK buttons and the button at 360 to 430. Walked for real by the
// play check at 360, 390, 430 and 1280 and at 740x360; these pin the mechanism so it does not drift back.
test('on a phone nothing floats over the console: the cards that come to you dock above the button', () => {
  assert.match(PAGE, /<div class="af-dock" id="afDock">\s*<div class="reveal-tray" id="revealTray"/, 'the dock holds the waiting cards\' tray');
  assert.match(PAGE, /\n  \.af-dock\{display:contents;\}/, 'off a phone the dock is no box, so the desktop console is as it was');
  assert.match(PAGE, /#bank\.on ~ \.af-dock > \.reveal-tray\{grid-row:2;\}/, 'the laptop grid still finds the tray');
  const dock = fnBody('dockCard');
  assert.match(dock, /matchMedia\(PHONE_Q\)/);
  assert.match(dock, /afDock\.appendChild\(w\)/);
  assert.match(dock, /floor\.appendChild\(w\)/, 'and a card steps back onto the floor past a phone');
  for (const [where, body] of [['the med card', fnBody('spawnMed')], ['the huddle', fnBody('popHuddle')],
    ['the break reminder and the help offer', fnBody('placeAboveButton')], ['the family and the surveyor', fnBody('anchorAboveButton')]])
    assert.match(body, /dockCard\(w\)/, where + ' docks on a phone');
  // the phone's button is never sticky over the monitors, short screens included (the laptop short-window rule sets it)
  const after = PAGE.slice(PAGE.indexOf('.stage:not(.af-scroll) > .clicker{'));
  assert.match(after, /@media \(max-width:699px\), \(max-height:500px\)\{\s*\.stage\{[^}]*overflow:hidden;\}\s*\.clicker\{position:static;/);
  // a helper only clears what shows: every scrolling box between a thing and the floor clips its target
  assert.match(PAGE, /for\(let sc=o\.el\.parentElement; sc && sc!==floor; sc=sc\.parentElement\)/);
});

test('a helper or the pizza on the big button never takes its press, and a helper\'s bubble stays on the screen', () => {
  // measured by real taps at 360x740: a resting helper or the pizza drawn on the button took the press meant for it
  assert.match(PAGE, /e\.target\.closest\('\.sat-box, #bigBtn, \.af-dock button'\)\) return;/);
  assert.match(fnBody('seatBubble'), /W-4-left-b\._w/, 'a bubble by the right wall slides left');
  assert.match(fnBody('seatBubble'), /4-left/, 'and by the left wall slides right');
  assert.match(PAGE, /\.af \.tech \.bub\{[^}]*translateX\(calc\(-50% \+ var\(--bx, 0px\)\)\)/);
  assert.match(fnBody('techFrame'), /seatBubble\(techEl\(t\), t\.x, W\);/);
});
