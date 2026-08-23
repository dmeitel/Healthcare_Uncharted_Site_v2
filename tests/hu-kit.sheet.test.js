/**
 * HUKit.sheet — the detent contract.
 *
 * The grabber is a focusable, labelled <button>, so it must work from the keyboard.
 * Until 2026-08-22 only pointer events were bound, which made it a named control that
 * did nothing on Enter or Space, on every tool that adopts the kit sheet.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadKit } = require('./helpers/dom.js');

/** a sheet element wired the way a tool wires it */
function mount(kit, opts) {
  const el = kit.el('div');
  el.classList.add('shell-sheet');
  // the kit injects its own grabber and keeps a handle to it
  const api = kit.HUKit.sheet(el, opts || {});
  const grab = el.children.find(c => c.classList.contains('hu-sheet-grab'));
  return { el, api, grab };
}

test('the kit injects a labelled grabber button', () => {
  const kit = loadKit();
  const { grab } = mount(kit);
  assert.ok(grab, 'a grabber exists');
  assert.equal(grab.tagName, 'BUTTON', 'it is a real button, so it takes focus');
  assert.ok(grab.getAttribute('aria-label'), 'and it carries a name');
});

test('a keyboard click on the grabber steps the detent', () => {
  const kit = loadKit();
  const { el, api, grab } = mount(kit);
  api.open('dt-half');
  assert.ok(el.classList.contains('dt-half'));

  // Enter/Space arrive as a click with detail === 0
  grab._fire('click', { detail: 0 });
  assert.ok(el.classList.contains('dt-full'), 'half steps up to full');

  grab._fire('click', { detail: 0 });
  assert.ok(el.classList.contains('dt-half'), 'and back down again');
});

test('a pointer-generated click does not double-toggle', () => {
  // a tap already resolves through settle() on pointerup; the click that follows it
  // carries detail >= 1 and must be ignored or the sheet would step twice per tap
  const kit = loadKit();
  const { el, api, grab } = mount(kit);
  api.open('dt-half');
  grab._fire('click', { detail: 1 });
  assert.ok(el.classList.contains('dt-half'), 'mouse click is left to the pointer path');
});

test('open() and close() honour the contract', () => {
  const kit = loadKit();
  let dismissed = 0;
  const { el, api } = mount(kit, { onDismiss: () => dismissed++ });

  api.open();
  assert.ok(api.isOpen());
  api.close();
  assert.equal(dismissed, 1);
  assert.ok(!api.isOpen());

  // idempotent: a closed sheet dismisses to a no-op. An adopter whose onDismiss calls
  // back into close() recursed forever before this guard (hospital-map, run-2 QA).
  api.close();
  assert.equal(dismissed, 1, 'a second close does nothing');
});
