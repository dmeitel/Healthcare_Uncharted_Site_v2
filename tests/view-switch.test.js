/**
 * The view switch (DECISIONS L1 and L2, 2026-10-06; David, on the fracture post: the buttons between the views "are
 * not really easy to see or are easy to lose as things scroll"; then "dock and A, go ahead and build both").
 *
 * A page with views keeps its switch at the top of them, boxed, the one on screen filled (.hu-seg). Where the views
 * run long, a phone gets the dock at the foot of the screen once that switch has scrolled away (hu-views.js), and the
 * switch itself never pins on a phone (one top bar). Where a switch sits over about a screen of content, the boxed
 * look is enough. Every page with a tab switch is on one of the three lists below, so a new one has to say which it
 * is: a page added to none of them fails here.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* views that run for many phone screens: the dock */
const DOCKED = {
  'src/secret-menu/a-routine-fracture/index.html': { row: '.vw-row', why: 'four views, the story alone about 19 phone screens' },
  'src/learn/laws-and-paradoxes/index.html': { row: '.lp-tabs', why: 'ten laws, about 13 phone screens' },
  'src/learn/request-routing/index.html': { row: '.rr-topnav', why: 'four sections, about 14 phone screens' },
};
/* a switch over about a screen: the boxed look only */
const SHORT = {
  'src/learn/process-engineering/index.html': 'the four toolkits run about a screen; the diagnosis buttons are its own small control',
  'src/index.html': 'the tool groups hold about a screen of cards',
};
/* a tool or a game with controls of its own, not a page of views */
const OWN = {
  'src/_includes/components/facility-map.njk': 'a map tool',
  'src/tools/multi-lens-map/index.njk': 'a map tool',
  'src/secret-menu/uncharted-general/index.html': 'a game',
};

function walk(dir, out) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|njk)$/.test(e.name)) out.push(p);
  }
  return out;
}

test('every page with a tab switch has said which kind of switch it is', () => {
  const lists = Object.assign({}, DOCKED, SHORT, OWN);
  const found = walk('src', []).filter((f) => /role="tablist"/.test(read(f)));
  const unsorted = found.filter((f) => !lists[f]);
  assert.deepStrictEqual(unsorted, [], 'add each to DOCKED, SHORT or OWN in this test, with the reason');
  for (const f of Object.keys(lists)) assert.ok(fs.existsSync(path.join(ROOT, f)), f + ' is listed here and gone from src');
});

// The phone gate shows each view hidden at load and reads it (scripts/lib/view-walk.js, 2026-10-19): it finds a switch by
// role="tablist", or by data-views where the switch is plain buttons. A page of views it cannot find is measured on one view
// only, which is how nine Laws and Paradoxes charts passed with 7 px labels.
test('every page of views carries a switch the phone gate can walk', () => {
  for (const f of [...Object.keys(DOCKED), ...Object.keys(SHORT)]) {
    assert.match(read(f), /role="tablist"|\bdata-views\b/, f + ': mark its switch role="tablist" (with role="tab" buttons) or data-views');
  }
});

test('a page with long views loads the switch, docks it on a phone, and hands each view to the next', () => {
  for (const [f, { row }] of Object.entries(DOCKED)) {
    const s = read(f);
    const at = s.indexOf('/assets/js/hu-views.js');
    assert.ok(at > -1, f + ' loads hu-views.js');
    const call = s.indexOf('HUViews.dock(');
    assert.ok(call > at, f + ' loads hu-views.js before it calls HUViews.dock');
    assert.ok(s.includes('HUViews.next('), f + ' hands each view to the next');
    const cls = row.slice(1).replace(/-/g, '\\-');
    assert.match(s, new RegExp('\\.' + cls + '\\s*\\{\\s*position:\\s*static'), f + ': on a phone ' + row + ' stays with the page, the dock carries it');
  }
});

test('the boxed look is on every listed switch', () => {
  for (const f of Object.keys(SHORT)) assert.match(read(f), /class="[^"]*\bhu-seg\b/, f + ' carries .hu-seg');
  for (const f of ['src/secret-menu/a-routine-fracture/index.html', 'src/learn/request-routing/index.html']) assert.match(read(f), /class="[^"]*\bhu-seg\b/, f + ' carries .hu-seg');
});

test('the dock is a phone thing and every motion stops under reduced motion', () => {
  const css = read('src/assets/css/hu-global.css');
  const at = css.indexOf('THE VIEW SWITCH');
  assert.ok(at > -1, 'hu-global.css has the view switch');
  const block = css.slice(at, css.indexOf('/* ──', at + 20) > -1 ? css.indexOf('/* ──', at + 20) : undefined);
  assert.match(block, /\.hu-vdock, \.hu-vpanel \{ display:none; \}/, 'no dock on a desk');
  assert.match(block, /@media \(max-width:699px\), \(max-height:500px\) \{\s*[\s\S]*\.hu-vdock \{ display:flex;/, 'the dock shows on a phone, measured on the shorter side');
  assert.match(block, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*\.hu-v-nudge, \.hu-v-in-r, \.hu-v-in-l \{ animation:none; \}/, 'reduced motion stops the glow and the slide');
  const js = read('src/assets/js/hu-views.js');
  assert.match(js, /REDUCE\.matches/, 'the script checks reduced motion before it moves anything');
  assert.match(js, /popstate/, 'the dock\'s panel closes on the phone\'s back gesture');
  assert.ok(!/—/.test(js), 'no em dash in hu-views.js');
});
