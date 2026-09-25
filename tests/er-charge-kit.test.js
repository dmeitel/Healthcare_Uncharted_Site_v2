/**
 * ER Charge Nurse: the shared game menus (2026-09-24, .claude/rules/games.md, Menus) and the small
 * defects fixed with them. The page runs in a vm sandbox against a stand-in HUKit that records what
 * the page asked the kit for and lets a test say whether a kit card is open. The kit itself is
 * pinned in tests/hu-kit.menu.test.js; this file pins how ER uses it.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = path.join(__dirname, '..', 'src', 'secret-menu', 'er-charge', 'index.html');
const HTML = fs.readFileSync(PAGE, 'utf8');

/** a stand-in for the kit: records every call, and `open` is what HUKit.dialog.anyOpen() answers */
function fakeKit({ seen = true } = {}) {
  const k = { open: false, seen, calls: {}, slot: [] };
  const card = kind => ({ kind, open() { k.open = true; }, close() { k.open = false; }, isOpen() { return k.open; }, button() { return { kind }; } });
  const settings = opts => {
    k.calls.settings = opts;
    const vals = {}; opts.rows.forEach(r => { vals[r.key] = r.value; });
    return Object.assign(card('settings'), { get: key => vals[key], set: (key, v) => { vals[key] = v; } });
  };
  settings.assist = { moreTime: { key: 'moreTime', label: 'More time', help: 'Clocks and countdowns run slower.', value: false } };
  k.HUKit = {
    dialog: { anyOpen: () => k.open },
    settings,
    howTo(opts) { k.calls.howTo = opts; return Object.assign(card('howto'), { firstVisit() { if (k.seen) return false; k.open = true; return true; } }); },
    gameMenu(opts) { k.calls.gameMenu = opts; return card('menu'); },
  };
  return k;
}

function loadER(kit) {
  const open = HTML.indexOf('<script>'), close = HTML.lastIndexOf('</script>');
  const src = HTML.slice(open + '<script>'.length, close);
  const el = id => ({
    id, hidden: false, innerHTML: '', textContent: '', style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, querySelector() { return null; },
    append(...n) { if (kit) kit.slot.push(...n); },
  });
  const ids = {};
  for (const m of HTML.slice(0, open).matchAll(/id="([^"]+)"/g)) ids[m[1]] = el(m[1]);
  ids['er-overlay'].hidden = true;                       // as the markup ships it
  const ctx = {
    document: { getElementById: i => ids[i] || null, addEventListener() {}, querySelector() { return null; }, createElement: () => el(''), activeElement: null, body: {} },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800, HUKit: kit ? kit.HUKit : undefined },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 1, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } },
    Date, Math,
  };
  vm.createContext(ctx);
  new vm.Script(src, { filename: 'er-charge.js' }).runInContext(ctx);
  return { er: ctx.window.__er, ids };
}
const near = (a, b) => Math.abs(a - b) < 1e-9;

test('er kit: the page loads the dated kit ahead of its own script', () => {
  const kitAt = HTML.indexOf('<script src="/assets/js/hu-kit.js?v=20260923"></script>');
  assert.ok(kitAt > -1, 'hu-kit.js at the 2026-09-23 stamp');
  assert.ok(kitAt < HTML.indexOf('<script>'), 'and before the inline script that calls it');
});

test('er kit: one menu with Help, Settings, a named Restart and Leave; the "?" then Menu in the bar', () => {
  const kit = fakeKit();
  loadER(kit);
  const m = kit.calls.gameMenu;
  assert.ok(m, 'the game menu is built');
  assert.strictEqual(m.title, 'ER Charge Nurse');
  assert.ok(m.help && m.settings, 'Help and Settings rows');
  assert.strictEqual(m.restart.verb, 'Restart the shift', 'the confirm names the act');
  assert.strictEqual(m.leave.href, '/secret-menu/');
  assert.ok(m.escOpens, 'Esc with nothing open opens the menu');
  assert.deepStrictEqual(Array.from(kit.calls.settings.rows, r => r.key), ['moreTime'], 'a game with a clock offers More time');
  assert.strictEqual(kit.calls.howTo.rules.length, 3, 'three rules');
  assert.ok(kit.calls.howTo.rules.every(r => !r.includes(String.fromCharCode(0x2014))), 'no em dashes');
  assert.deepStrictEqual(kit.slot.map(b => b.kind), ['howto', 'menu'], 'the "?" and then Menu');
});

test('er kit: an open kit card stops the shift clock, and closing it starts the clock again', () => {
  const kit = fakeKit();
  const { er } = loadER(kit);
  er.startShift();
  const t0 = er.G.t;
  kit.open = true;
  er.beat(); er.beat(); er.beat();
  assert.strictEqual(er.G.t, t0, 'three beats under the menu, no time passed');
  kit.open = false;
  er.beat();
  assert.ok(near(er.G.t, t0 + er.CFG.tickMs / 1000 * er.CFG.simPerSec), 'one beat after it closed, one beat of shift');
});

test('er kit: More time runs the shift clock at two thirds, and is read on every beat', () => {
  const kit = fakeKit();
  const { er } = loadER(kit);
  er.startShift();
  const step = er.CFG.tickMs / 1000 * er.CFG.simPerSec;
  er.kit.set.set('moreTime', true);
  let t0 = er.G.t; er.beat();
  assert.ok(near(er.G.t - t0, step * 2 / 3), 'slower with More time on');
  er.kit.set.set('moreTime', false);
  t0 = er.G.t; er.beat();
  assert.ok(near(er.G.t - t0, step), 'full speed with it off');
});

test('er kit: the menu\'s Resume clears the Pause toggle; Restart starts a fresh shift', () => {
  const kit = fakeKit();
  const { er } = loadER(kit);
  er.startShift();
  er.G.paused = true;
  kit.calls.gameMenu.onResume();
  assert.strictEqual(er.G.paused, false, 'Resume means the clock runs');
  er.G.t = 300; er.G.score = 40;
  kit.calls.gameMenu.restart.run();                      // the kit asks first (HUKit.confirm); this is what runs on the verb
  assert.strictEqual(er.G.t, 0, 'back to 07:00');
  assert.strictEqual(er.G.score, 0);
});

test('er kit: a first visit opens the how-to in place of the start card', () => {
  const kit = fakeKit({ seen: false });
  const { er, ids } = loadER(kit);
  assert.strictEqual(kit.open, true, 'the how-to opened by itself');
  assert.strictEqual(ids['er-overlay'].hidden, true, 'and the start card did not open under it');
  kit.calls.howTo.onClose('action');                     // its Clock in: the shift starts, no start card
  assert.strictEqual(ids['er-overlay'].hidden, true);
  kit.calls.howTo.onClose('esc');                        // closed any other way before a shift: the start card follows
  assert.strictEqual(ids['er-overlay'].hidden, false);
  assert.match(ids['er-overlay'].innerHTML, /Clock in/);
  assert.strictEqual(er.G, null, 'no shift started by closing it');
});

test('er kit: a returning visit opens on the start card; the how-to\'s Clock in starts a shift only when none runs', () => {
  const kit = fakeKit({ seen: true });
  const { er, ids } = loadER(kit);
  assert.strictEqual(ids['er-overlay'].hidden, false, 'the start card');
  kit.calls.howTo.action.run();
  assert.ok(er.G && er.G.t === 0, 'Clock in on the how-to starts the shift');
  er.G.t = 100;
  kit.calls.howTo.action.run();
  assert.strictEqual(er.G.t, 100, 'mid-shift it only closes the card');
});

test('er: the start and end cards are dialogs, named by their title', () => {
  const kit = fakeKit();
  const { er, ids } = loadER(kit);
  const dlg = /<div class="er-modal" role="dialog" aria-modal="true" aria-labelledby="er-mo-h"><h2 id="er-mo-h" tabindex="-1">/;
  assert.match(ids['er-overlay'].innerHTML, dlg, 'the start card');
  er.startShift(); er.endShift();
  assert.match(ids['er-overlay'].innerHTML, dlg, 'the end card');
});

test('er: the end card counts one batched step as one', () => {
  const { er, ids } = loadER();
  er.startShift();
  er.G.stats.batch = 1;
  er.endShift();
  assert.match(ids['er-overlay'].innerHTML, /<b>1<\/b> batched step:/);
  assert.doesNotMatch(ids['er-overlay'].innerHTML, /1<\/b> batched steps/);
});

test('er: reduced motion stops every pulse the page runs', () => {
  const pulsing = [...HTML.matchAll(/([^{}]+)\{[^}]*animation:erpulse/g)].map(m => m[1].trim());
  assert.ok(pulsing.length >= 2, 'the critical card and the target bed pulse');
  const rm = HTML.match(/@media \(prefers-reduced-motion:reduce\)\{([^@]*?animation:none[^@]*?)\}\}/);
  assert.ok(rm, 'a reduced-motion block turns animation off');
  for (const sel of pulsing) assert.ok(rm[1].includes(sel), sel + ' holds still under reduced motion');
});
