/**
 * The start card, rebuilt 2026-09-24 as Balatro's Play panel (docs/HU-GAME-MENUS-2026-09-23.md,
 * section 3.4). It had been a settings form: 513 words and 48 controls down four screens at 360,
 * with the CEO pick last, under the save-restore box. Now it is four tabs, each with its choices
 * already made: Continue (first when a solo run is saved), New run (the CEO and Start, every other
 * choice folded behind one line that reads them back), Scenarios, and The Table.
 *
 * These read the card as the game writes it (the overlay's innerHTML in the vm sandbox). The
 * clicks, the keyboard and the one-tap Start are proved in a browser walk, not here.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadGame } = require('./helpers/ug');

const card = g => g.ids['ug-overlay'].innerHTML;
/** the markup of one tab panel, from its opening tag to the next panel or the Start bar */
function panelOf(html, k) {
  const a = html.indexOf(`id="ug-tp-${k}"`);
  assert.ok(a > -1, `panel ${k} exists`);
  const rest = html.slice(a + 1);
  const ends = ['id="ug-tp-', 'class="ug-start-foot"'].map(m => rest.indexOf(m)).filter(i => i > -1);
  return html.slice(a, a + 1 + Math.min(...ends));
}
const openTag = (html, id) => { const m = html.match(new RegExp(`<[^>]*id="${id}"[^>]*>`)); return m ? m[0] : ''; };
const selectedTab = html => (html.match(/id="ug-tab-(\w+)"[^>]*aria-selected="true"/) || [])[1];

test('a first visit opens on New run: the CEO and Start first, the rest folded, the defaults untouched', () => {
  const g = loadGame();
  g.ug.openStartMenu();
  const html = card(g);
  assert.match(html, /role="tablist"/, 'a real tab strip');
  assert.deepStrictEqual([...html.matchAll(/role="tab" id="ug-tab-(\w+)"/g)].map(m => m[1]),
    ['continue', 'new', 'scen', 'table'], 'Continue, New run, Scenarios, The Table, in that order');
  assert.strictEqual(selectedTab(html), 'new', 'nothing saved, so New run is the tab');
  assert.strictEqual((html.match(/aria-selected="true"/g) || []).length, 1, 'one tab selected');
  assert.strictEqual((html.match(/role="tab"[^>]*tabindex="0"/g) || []).length, 1, 'one tab is the Tab stop, the rest ride the arrows');
  assert.doesNotMatch(openTag(html, 'ug-tp-new'), /hidden/, 'its panel shows');
  for (const k of ['continue', 'scen', 'table']) assert.match(openTag(html, 'ug-tp-' + k), /hidden/, `${k} waits behind its tab`);

  const nw = panelOf(html, 'new');
  const fold = nw.slice(nw.indexOf('<details class="hu-fold ug-change"'), nw.indexOf('</details>'));
  assert.ok(nw.indexOf('ceo-carousel') > -1 && nw.indexOf('ceo-carousel') < nw.indexOf('ug-change'), 'the CEO comes before the settings');
  for (const act of ['diff', 'klass', 'size', 'years']) assert.ok(fold.includes(`data-act="${act}"`), `${act} lives in the fold`);
  assert.doesNotMatch(openTag(nw, 'ug-tp-new') + nw.match(/<details[^>]*>/)[0], / open/, 'the fold starts closed');
  assert.match(fold, /Change the run<span class="hu-fold-note">Normal &middot; Nonprofit &middot; Community &middot; Endless<\/span>/,
    'closed, it reads the choices back in one line');

  assert.strictEqual((html.match(/data-act="start"/g) || []).length, 1, 'one Start');
  assert.doesNotMatch(html, /class="ug-start-foot" hidden/, 'and it shows on New run');
  assert.ok(g.ug.selectedCeoId, 'Start already has a CEO, so the first tap starts');
  const s = g.ug.settings;
  assert.deepStrictEqual([s.difficulty, s.klass, s.size, s.years, s.scenario], ['normal', 'nonprofit', 'community', 0, ''], 'the defaults are the old defaults');
  assert.doesNotMatch(html, /data-act="(cancel|crback)"/, 'nothing for Escape to press: the card has nothing behind it');
});

test('the CEO card keeps its name, trait and numbers; the paragraph goes behind the peek', () => {
  const g = loadGame();
  g.ug.openStartMenu();
  const nw = panelOf(card(g), 'new');
  const vega = g.ug.CEOS[0];
  assert.ok(!nw.includes('class="en-desc"'), 'no paragraph on the start card');
  assert.ok(nw.includes(vega.trait) && nw.includes(vega.perks[0]), 'the trait and the numbers stay');
  assert.ok(nw.includes(vega.desc.slice(0, 40)), 'the paragraph rides the data-def');
  assert.match(nw, /class="hu-i" aria-hidden="true">i<\/span>/, 'with the "i" a thumb can tap');
  g.ug.openCeoReplace();
  assert.ok(card(g).includes('class="en-desc"'), 'the mid-run replace screen keeps the full card');
});

test('a solo run saved in this browser opens the card on Continue', () => {
  const g = loadGame();
  g.evalIn(`localStorage.setItem('hu-ug-run', 'HUG1.x'); localStorage.setItem('hu-ug-run-meta', JSON.stringify({ level: 6, ceo: 'J. Okafor, MHA', at: 1 }))`);
  g.ug.openStartMenu();
  const html = card(g);
  assert.strictEqual(selectedTab(html), 'continue');
  const cont = panelOf(html, 'continue');
  assert.match(cont, /data-act="continuerun">Continue &#9656;/, 'Continue, in the system word, is the button');
  assert.ok(cont.includes(`Year ${g.ug.yearOf(6)}, Quarter ${g.ug.qInYear(6)} &middot; J. Okafor, MHA`), 'and it says which run');
  assert.match(cont, /class="ug-start-go ug-continue"/, 'it is the primary on this tab');
  assert.match(html, /class="ug-start-foot" hidden/, 'so Start stands down here');
  assert.ok(cont.includes('id="ug-loadstr"'), 'the save-string box sits with resuming');
  assert.match(cont, /<details class="hu-fold ug-restore">/, 'folded, so Continue is the one thing to press');
});

test('with nothing saved, Continue is still a tab and still holds the save-string box', () => {
  const g = loadGame();
  g.ug.openStartMenu('continue');
  const cont = panelOf(card(g), 'continue');
  assert.ok(!cont.includes('continuerun'), 'no run to continue');
  assert.ok(cont.includes('id="ug-loadstr"') && cont.includes('data-act="loadsave"'), 'but a string can bring one back');
  assert.ok(!cont.includes('<details'), 'and the box is not folded when it is the only thing here');
});

test('a table waiting to be rejoined opens the card on The Table', () => {
  const g = loadGame();
  g.ug.tableMemo.set('ug_table_guest', { room: 'ABCD', name: 'Sam', at: Date.now() });
  assert.strictEqual(g.ug.startTabDefault(), 'table');
  g.ug.openStartMenu();
  const html = card(g);
  assert.strictEqual(selectedTab(html), 'table');
  const tbl = panelOf(html, 'table');
  for (const act of ['tablerejoin', 'hosttable', 'jointable', 'joingo']) assert.ok(tbl.includes(`data-act="${act}"`), `${act} is on The Table`);
  assert.ok(tbl.includes('id="ug-netname"'), 'and the name box');
  assert.match(html, /class="ug-start-foot" hidden/, 'a player who is not hosting has no Start here');
});

test('Scenarios holds the list and the Chart Room; a picked scenario names itself on Start', () => {
  const g = loadGame();
  g.ug.openStartMenu('scen');
  let html = card(g);
  assert.strictEqual(selectedTab(html), 'scen');
  const sc = panelOf(html, 'scen');
  assert.strictEqual((sc.match(/data-act="scen"/g) || []).length, g.ug.SCENARIOS.length, 'every scenario');
  assert.ok(sc.includes('data-act="chartroom"'), 'and the Chart Room');
  g.ug.settings.scenario = 'flip';                           // The PE Flip fixes the CEO, so the carousel's name would lie
  g.ug.openStartMenu('scen');
  html = card(g);
  assert.match(html, /data-act="start">Start &middot; The PE Flip &#9656;/);
  assert.match(html, /hu-fold-note">The PE Flip &middot; /, 'and the fold says so too');
  g.ug.settings.scenario = '';
});

test('a locked ownership stays reachable, greyed, and says how to earn it', () => {
  const g = loadGame();
  g.ug.openStartMenu();
  const html = card(g), at = html.indexOf('<button data-act="klass" data-key="profit"');
  const btn = html.slice(at, html.indexOf('</button>', at));   // the data-def carries markup, so no [^>]* here
  assert.match(btn, /class=" lock"/, 'greyed');
  assert.match(btn, /aria-disabled="true"/, 'announced as unavailable');
  assert.doesNotMatch(btn, / disabled[ >=]/, 'but not disabled, which would hide it from hover, focus and tap');
  assert.ok(btn.includes(g.ug.CLASSES.find(c => c.id === 'profit').unlockHint), 'the peek says how to earn it');
});

test('a tab switch is remembered, and an unknown tab is ignored', () => {
  const g = loadGame();
  g.ug.openStartMenu();
  g.ug.showStartTab('table');
  assert.strictEqual(g.ug.startTab, 'table');
  g.ug.showStartTab('nonsense');
  assert.strictEqual(g.ug.startTab, 'table');
  g.ug.openStartMenu('nonsense');
  assert.strictEqual(g.ug.startTab, 'new', 'a bad argument falls back to the default');
});
