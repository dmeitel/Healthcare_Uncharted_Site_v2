/**
 * The two maps' menus (DECISIONS M1, 2026-10-08; docs/HU-MAP-MENUS-REVIEW-2026-10-08.md). David: "based on our game
 * building experience i think we need to go look back at the map menuing and see if we can apply skills for it", then
 * "yes do A now and B." These hold what that pass put in, on both maps (the twins rule), so a later edit to one map
 * cannot quietly undo it. The browser run that measured it is tmp/map-menu-after/drive.js.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const R = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');
const LV_JS = R('src', 'assets', 'js', 'tools', 'multi-lens-map.js');
const GV_JS = R('src', 'assets', 'js', 'tools', 'operators-map.js');
const LV_PAGE = R('src', 'tools', 'multi-lens-map', 'index.njk');
const GV_PAGE = R('src', '_includes', 'components', 'facility-map.njk');
const INFO = R('src', '_includes', 'components', 'tool-attribution.njk');

test('a row is a name: no Size, Pin or "only" button on every row of either map', () => {
  for (const bit of ['data-pinpick', 'data-ovpick', "'☆ Pin'", "'◯ Size'"]) assert.ok(!LV_JS.includes(bit), 'Population Health Map still draws ' + bit);
  for (const bit of ['class="gv-only"', '<span class="sub">only = solo']) assert.ok(!GV_JS.includes(bit), 'Hospital Operations Map still draws ' + bit);
});

test('what a tap does is one switch above the list, on both maps', () => {
  assert.match(LV_JS, /data-pickmode/, 'Color, Size, Pin');
  assert.match(LV_JS, /pickMode === 'pin'/);
  assert.match(GV_JS, /data-pickmode/, 'Add, Only');
  assert.match(GV_JS, /gvPick === 'only'/);
});

test('one "?" per map holds how to read it, and it never opens by itself; the first-visit coach is gone', () => {
  for (const [name, js] of [['Population Health Map', LV_JS], ['Hospital Operations Map', GV_JS]]) {
    assert.match(js, /HUKit\.howTo\(\{[^}]*auto: false/, name + ': a how-to card that waits to be asked');
    assert.match(js, /How to read the map/, name + ': the "?" says what it opens');
  }
  assert.ok(!/maybeCoach|lv-coach/.test(LV_JS), 'the coach bubble is gone');
  assert.ok(!/Every lens, every metric lives here/.test(LV_JS), 'the line the search box already said is gone');
  assert.ok(!/The card holds what the map can/.test(LV_JS), 'the aphorism closer is gone');
});

test('a parked card shows its answer: at the peek the tabs and the kicker step out, on both maps', () => {
  assert.match(LV_PAGE, /#lvSheet\.dt-peek \.lv-tabs, #lvSheet\.dt-peek \.lv-kicker \{ display:none; \}/);
  assert.match(GV_PAGE, /#gvSheet\.dt-peek \.gv-tabs, #gvSheet\.dt-peek \.gv-card-kicker \{ display:none; \}/);
});

test('the desk drawer keeps its top padding after the base rule (the strip was cut off on the hospital map)', () => {
  const base = GV_PAGE.indexOf('#gvSheet { padding:0 16px');
  const desk = GV_PAGE.indexOf('@media (min-width:1100px){ #gvSheet { padding-top:12px; } }');
  assert.ok(base > -1 && desk > base, 'the >=1100 padding-top comes after the base padding');
});

test('the same words on both maps: List, Share, the locate label', () => {
  for (const [name, js] of [['Population Health Map', LV_JS], ['Hospital Operations Map', GV_JS]]) {
    assert.ok(!/Copy link to this view/.test(js), name + ' still says Copy link to this view');
    assert.match(js, /textContent = 'Share'/, name + ' says Share');
  }
  assert.match(LV_PAGE, />List <b id="lvRankCount">/);
  assert.match(LV_PAGE, /aria-label="Show my location on the map"/);
  assert.match(GV_PAGE, /aria-label="Show my location on the map"/);
});

test('the info card every tool shares closes on Esc and on the phone back gesture', () => {
  assert.match(INFO, /e\.key !== 'Escape'/);
  assert.match(INFO, /kit\.backGuard\(\{ watch: box, cls: 'ta-open'/);
});

test('the search panel on the hospital map closes on the back gesture too', () => {
  assert.match(GV_JS, /HUKit\.backGuard\(\{ watch: \$\('gvSearch'\)/);
});
