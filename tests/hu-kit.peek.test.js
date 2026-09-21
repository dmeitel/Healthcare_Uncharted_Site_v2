/**
 * HUKit.peek · explain on demand.
 *
 * David's ruling on the three games, 2026-09-20: "simplify the views to a basic level but then
 * have the information be hoverable to understand more... it needs to feel easy to pick up and
 * play without having to read 5 paragraphs to get into it." So the screen keeps the short label
 * and the paragraph hides behind it. The hospital game had a version of this already, but it
 * listened on mouseover alone, so on a phone every explanation on every screen was unreachable.
 *
 * Two cases below are the ones that actually bit. A touch screen fires focusin BEFORE click, so a
 * naive toggle opened the card on focus and shut it again on the same tap. And a peek attached to
 * a control must not eat the control's tap, or the settings screen stops setting anything.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadKit } = require('./helpers/dom.js');

/** a settings row: a label carrying an "i" badge, and two option buttons that each explain themselves */
function fixture(kit) {
  const root = kit.doc.body;
  const row = root.append(kit.el('div'));
  const label = row.append(kit.el('span'));
  const badge = label.append(kit.el('button', { 'data-def': '<b>Normal</b>The intended climb.' }));
  badge.classList.add('hu-i');
  const easy = row.append(kit.el('button', { 'data-def': '<b>Easy</b>A wider margin.' }));
  const hard = row.append(kit.el('button', { 'data-def': '<b>Hard</b>No margin at all.' }));
  const plain = row.append(kit.el('span'));   // not a control: the whole thing is the trigger
  plain.setAttribute('data-def', '<b>Burnout</b>How tired the floor is.');
  return { root, row, label, badge, easy, hard, plain };
}

const card = kit => kit.doc.body.children.find(c => c.classList.contains('hu-peek')) || null;
const shown = kit => { const c = card(kit); return c && !c.hidden ? c.innerHTML : null; };
// peek listens on the root and reads event.target, so the stub (which does not bubble) fires there
const at = (f, type, el, extra) => f.root._fire(type, Object.assign({ target: el }, extra || {}));
const over = (f, el, pointerType) => at(f, 'pointerover', el, { pointerType: pointerType || 'mouse' });
const out = (f, el) => at(f, 'pointerout', el);
const click = (f, el) => at(f, 'click', el);
const focusin = (f, el) => at(f, 'focusin', el);

test('a mouse hovers an option and gets its sentence, and loses it on the way out', () => {
  const kit = loadKit(); const f = fixture(kit);
  kit.HUKit.peek({ root: f.root });
  assert.equal(shown(kit), null, 'nothing before anyone asks');
  over(f, f.hard);
  assert.equal(shown(kit), '<b>Hard</b>No margin at all.', 'the option explains itself');
  out(f, f.hard);
  assert.equal(shown(kit), null, 'and stops when the mouse leaves');
  over(f, f.easy);
  assert.equal(shown(kit), '<b>Easy</b>A wider margin.', 'the next option replaces it');
});

test('a tap on the badge opens the card, because focus lands before click on a touch screen', () => {
  const kit = loadKit(); const f = fixture(kit);
  kit.HUKit.peek({ root: f.root });
  // exactly the order Chromium fires for a tap
  over(f, f.badge, 'touch');
  out(f, f.badge);
  focusin(f, f.badge);
  click(f, f.badge);
  assert.equal(shown(kit), '<b>Normal</b>The intended climb.', 'the tap leaves it open, it does not toggle shut');
});

test('a second tap on the same badge closes it', () => {
  const kit = loadKit(); const f = fixture(kit);
  kit.HUKit.peek({ root: f.root });
  focusin(f, f.badge); click(f, f.badge);
  assert.ok(shown(kit), 'open after the first tap');
  click(f, f.badge);
  assert.equal(shown(kit), null, 'closed after the second');
});

test('tapping the control itself is the control\'s tap, not an explanation', () => {
  const kit = loadKit(); const f = fixture(kit);
  kit.HUKit.peek({ root: f.root });
  click(f, f.hard);
  assert.equal(shown(kit), null, 'a thumb on Hard picks Hard; the sentence is on the badge');
  over(f, f.hard);
  assert.ok(shown(kit), 'a mouse still gets it by hovering');
});

test('a label that is not a control opens from a tap anywhere on it', () => {
  const kit = loadKit(); const f = fixture(kit);
  kit.HUKit.peek({ root: f.root });
  click(f, f.plain);
  assert.equal(shown(kit), '<b>Burnout</b>How tired the floor is.');
});

test('the card names itself to a screen reader, and Escape closes it', () => {
  const kit = loadKit(); const f = fixture(kit);
  kit.HUKit.peek({ root: f.root });
  over(f, f.hard);
  assert.equal(card(kit).getAttribute('role'), 'tooltip');
  assert.equal(f.hard.getAttribute('aria-describedby'), 'hu-peek', 'the trigger points at the card');
  kit.fire('keydown', { key: 'Escape' });
  assert.equal(shown(kit), null, 'Escape closes it');
  assert.equal(f.hard.getAttribute('aria-describedby'), null, 'and the trigger stops pointing at it');
});

test('one card serves the whole page', () => {
  const kit = loadKit(); const f = fixture(kit);
  kit.HUKit.peek({ root: f.root });
  over(f, f.easy); over(f, f.hard); click(f, f.plain);
  const cards = kit.doc.body.children.filter(c => c.classList.contains('hu-peek'));
  assert.equal(cards.length, 1, 'never a second one');
});

test('a trigger with no sentence is left alone', () => {
  const kit = loadKit(); const f = fixture(kit);
  kit.HUKit.peek({ root: f.root });
  const bare = f.row.append(kit.el('button'));
  click(f, bare);
  assert.equal(shown(kit), null);
});
