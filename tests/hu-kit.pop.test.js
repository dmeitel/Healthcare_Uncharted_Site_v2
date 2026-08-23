/**
 * HUKit.pop — the selector-popover contract.
 *
 * Four tools (atlas, career-tree, iceberg, vendor) each had their own copy of this
 * before the 2026-08-17 kit extraction. Every difference between those copies is an
 * option here, so each case below pins a behaviour a real tool depends on.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadKit } = require('./helpers/dom.js');

/** a bar with two triggers and two popovers, one flush against the right edge */
function fixture(kit) {
  const bar = kit.el('div'); bar.clientWidth = 400;
  const mkBtn = left => {
    const b = bar.append(kit.el('button', { 'aria-haspopup': 'true' }));
    b.offsetLeft = left; b.offsetTop = 5; b.offsetHeight = 30;
    return b;
  };
  const mkPop = () => {
    const p = bar.append(kit.el('div'));
    p.classList.add('selector-pop'); p.hidden = true; p.offsetWidth = 120; p.offsetParent = bar;
    return p;
  };
  const btnA = mkBtn(10), btnB = mkBtn(380);
  const popA = mkPop(), popB = mkPop();
  const opt = (p, selected) => {
    const o = p.append(kit.el('button', selected ? { 'aria-selected': 'true' } : {}));
    o.classList.add('pop-opt');
    return o;
  };
  const a1 = opt(popA), a2 = opt(popA, true), a3 = opt(popA);
  opt(popB);
  return { bar, btnA, btnB, popA, popB, a1, a2, a3 };
}

test('opens, toggles on the same trigger, and switches between triggers', () => {
  const kit = loadKit(); const api = kit.HUKit.pop({}); const f = fixture(kit);

  api.open(f.btnA, f.popA);
  assert.equal(f.popA.hidden, false, 'popover is revealed');
  assert.equal(f.btnA.getAttribute('aria-expanded'), 'true');
  assert.ok(api.isOpen());

  api.open(f.btnA, f.popA);
  assert.equal(f.popA.hidden, true, 'same trigger closes it');
  assert.ok(f.btnA.focused > 0, 'focus returns to the trigger');

  api.open(f.btnA, f.popA);
  api.open(f.btnB, f.popB);
  assert.equal(f.popA.hidden, true, 'opening another closes the first');
  assert.equal(f.popB.hidden, false);
  assert.equal(f.btnA.getAttribute('aria-expanded'), 'false');
});

test('anchors under the trigger and clamps inside its host', () => {
  const kit = loadKit(); const api = kit.HUKit.pop({}); const f = fixture(kit);
  api.open(f.btnA, f.popA);
  assert.equal(f.popA.style.top, '41px', '5 top + 30 height + 6 gap');
  assert.equal(f.popA.style.left, '10px', 'left-aligned to the trigger');

  api.close(false);
  api.open(f.btnB, f.popB);
  assert.equal(f.popB.style.left, '272px', '400 host - 120 pop - 8 gutter');
});

test('anchorEl overrides the vertical anchor (the atlas toolbar case)', () => {
  const kit = loadKit(); const f = fixture(kit);
  const toolbar = kit.el('div'); toolbar.offsetTop = 0; toolbar.offsetHeight = 64;
  const api = kit.HUKit.pop({ anchorEl: toolbar });
  api.open(f.btnA, f.popA);
  assert.equal(f.popA.style.top, '70px', 'hangs off the toolbar, not the trigger');
});

test('a popover that settles wider after first layout keeps its gutter', () => {
  // Regression, run-4 QA: career-tree's Help and Search pops measured their CSS
  // min-width (220), then the display font landed and content pushed them to 228,
  // leaving them flush against the viewport with no gutter.
  const kit = loadKit(); const api = kit.HUKit.pop({});
  const host = kit.el('div'); host.clientWidth = 1280;
  const btn = host.append(kit.el('button', { 'aria-haspopup': 'true' }));
  btn.offsetLeft = 1052; btn.offsetTop = 8; btn.offsetHeight = 36;
  const pop = host.append(kit.el('div'));
  pop.classList.add('selector-pop'); pop.hidden = true; pop.offsetWidth = 220; pop.offsetParent = host;

  api.open(btn, pop);
  pop.offsetWidth = 228;          // fonts land, content settles wider
  kit.flushRaf();                 // the kit re-measures on the next frame

  const gutter = 1280 - (parseInt(pop.style.left, 10) + 228);
  assert.ok(gutter >= 8, `expected >=8px gutter, got ${gutter}px`);
});

test('initial focus honours focusSelected', () => {
  const withSelected = loadKit();
  const a = withSelected.HUKit.pop({}); const fa = fixture(withSelected);
  a.open(fa.btnA, fa.popA);
  assert.equal(withSelected.doc.activeElement, fa.a2, 'lands on the selected option by default');

  const firstOnly = loadKit();
  const b = firstOnly.HUKit.pop({ focusSelected: false }); const fb = fixture(firstOnly);
  b.open(fb.btnA, fb.popA);
  assert.equal(firstOnly.doc.activeElement, fb.a1, 'atlas lands on the first option');
});

test('onOpen fires on every open, including a switch (career-tree phone budget)', () => {
  const kit = loadKit(); let opened = 0;
  const api = kit.HUKit.pop({ onOpen: () => opened++ }); const f = fixture(kit);
  api.open(f.btnA, f.popA);
  assert.equal(opened, 1);
  api.open(f.btnB, f.popB);
  assert.equal(opened, 2, 'a switch counts too: the detail sheet must yield again');
});

test('escape consumes exactly the popover rung', () => {
  const kit = loadKit(); const api = kit.HUKit.pop({}); const f = fixture(kit);

  assert.equal(api.escape(), false, 'nothing open: the page keeps its own next rung');
  api.open(f.btnA, f.popA);
  const before = f.btnA.focused;
  assert.equal(api.escape(), true, 'consumed');
  assert.equal(f.popA.hidden, true);
  assert.equal(f.btnA.focused, before + 1, 'focus returned to the trigger');
  assert.equal(api.escape(), false, 'a second press passes through');
});

test('outside click closes, inside click and other triggers do not', () => {
  const kit = loadKit(); const api = kit.HUKit.pop({}); const f = fixture(kit);

  api.open(f.btnA, f.popA);
  kit.fire('click', { target: kit.el('div') });
  assert.equal(f.popA.hidden, true, 'a click elsewhere closes it');

  api.open(f.btnA, f.popA);
  kit.fire('click', { target: f.a1 });
  assert.equal(f.popA.hidden, false, 'a click on an option keeps it open');

  kit.fire('click', { target: f.btnB });
  assert.equal(f.popA.hidden, false, 'another trigger is left to its own handler');
});

test('arrow, Home and End walk the options without scrolling the page', () => {
  const kit = loadKit(); const api = kit.HUKit.pop({}); const f = fixture(kit);
  api.open(f.btnA, f.popA);
  let prevented = 0;
  const press = key => { f.a1.focus(); kit.fire('keydown', { key, target: f.a1, preventDefault: () => prevented++ }); };

  press('ArrowDown'); assert.equal(kit.doc.activeElement, f.a2);
  press('ArrowUp');   assert.equal(kit.doc.activeElement, f.a3, 'wraps to the last');
  press('End');       assert.equal(kit.doc.activeElement, f.a3);
  press('Home');      assert.equal(kit.doc.activeElement, f.a1);
  assert.equal(prevented, 4, 'every walk suppresses the default scroll');

  api.close(false);
  kit.doc.activeElement = null;
  kit.fire('keydown', { key: 'ArrowDown', target: f.a1, preventDefault: () => {} });
  assert.equal(kit.doc.activeElement, null, 'no walk when nothing is open');
});
