/**
 * The 2026-09-23 bug pass on the secret-menu games (David: "play them and find the bugs"). Each test
 * pins one fix a playtest found: Uncharted Regional's add-a-line menu that charged twice, its access
 * goals judged at a precision the screen does not show, and settings that broke the start menu; ER
 * Charge's cards that were spent on nothing, and its settings the same way.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadSystem } = require('./helpers/ug');

// ── Uncharted Regional ──
test('regional: adding a line from the menu closes the menu, so a second tap cannot buy a second level', () => {
  const { hs, ids } = loadSystem();
  hs.dispatchAct('start', {});
  const f = hs.sys.facilities[0];
  const line = hs.LINES.find(l => !f.lines[l.id]);
  ids['hs-overlay'].hidden = false; ids['hs-overlay'].innerHTML = '<div class="hs-modal">add a line</div>';
  const cash0 = hs.sys.cash;
  hs.dispatchAct('upg', { f: f.id, l: line.id });
  assert.strictEqual(f.lines[line.id], 1);
  assert.ok(hs.sys.cash < cash0);
  assert.strictEqual(ids['hs-overlay'].hidden, true, 'the menu is gone after the purchase');
});

test('regional: an access goal passes at the number it asked for, judged as the screen rounds it', () => {
  const { hs } = loadSystem();
  for (let k = 0; k < 60; k++){
    hs.startQuarter();
    const g = hs.sys.goal;
    if (!g || (g.kind !== 'access' && g.kind !== 'rural')) continue;
    const r = hs.computeSystem(hs.sys, hs.sys.activeEvent);
    const at = t => g.kind === 'access' ? Object.assign({}, r, { access: t }) : Object.assign({}, r, { zoneAccess: Object.assign({}, r.zoneAccess, { rural: t }) });
    assert.strictEqual(g.test(at((g.target - 0.4) / 100)), true, 'a share that shows as ' + g.target + '% meets a ' + g.target + '% goal');
    assert.strictEqual(g.test(at((g.target - 0.6) / 100)), false, 'a share that shows as ' + (g.target - 1) + '% does not');
    return;
  }
  assert.fail('no access goal came up in 60 quarters');
});

test('regional: an unknown difficulty or year count in storage falls back instead of breaking the menu', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'secret-menu', 'health-system', 'index.html'), 'utf8');
  assert.match(html, /cleanSettings\(\); initSys\(\); startQuarter\(\); openStartMenu\(\);/, 'the stored settings are cleaned before the first menu');
  const { hs } = loadSystem();
  hs.settings.difficulty = 'constructor'; hs.settings.years = -1;
  assert.doesNotThrow(() => hs.applySave ? hs.applySave({ v: 1, settings: { difficulty: 'bogus', years: null }, sys: JSON.parse(JSON.stringify(hs.sys)) }) : null);
  if (hs.applySave){ assert.strictEqual(hs.settings.difficulty, 'normal'); assert.strictEqual(hs.settings.years, 3); }
});

// ── ER Charge Nurse ──
function loadER(stored){
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'secret-menu', 'er-charge', 'index.html'), 'utf8');
  const src = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
  const el = id => ({ id, hidden: false, innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, addEventListener() {}, querySelector() { return null; }, getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0 }; } });
  const ids = {}; for (const m of html.slice(0, html.indexOf('<script>')).matchAll(/id="([^"]+)"/g)) ids[m[1]] = el(m[1]);
  const store = { _s: stored ? { er_settings: JSON.stringify(stored) } : {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } };
  const ctx = { document: { getElementById: i => ids[i] || null, addEventListener() {}, querySelector() { return null; }, activeElement: null, body: {} },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 }, navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {}, localStorage: store, Date, Math };
  vm.createContext(ctx); new vm.Script(src).runInContext(ctx);
  return ctx.window.__er;
}

test('er: a lab or CT card with nothing to act on is refused and kept', () => {
  const er = loadER();
  er.initShift();
  const G = er.G;
  const put = type => { const p = er.spawn(type); er.placePatient(p.id, G.beds.find(b => !b.pt).num); return p; };
  const flu = put('flu'), cp = put('cp');
  const n = G.cards.statlab;
  assert.strictEqual(er.playCard('statlab', flu.id), false, 'a flu visit has no lab step');
  assert.strictEqual(G.cards.statlab, n, 'and the card is still in hand');
  assert.strictEqual(er.playCard('prict', flu.id), false, 'nor a CT step');
  assert.strictEqual(er.playCard('statlab', cp.id), true, 'chest pain has a lab ahead');
  assert.strictEqual(G.cards.statlab, n - 1);
});

test('er: an unknown difficulty in storage falls back to normal', () => {
  const er = loadER({ difficulty: 'constructor' });
  assert.strictEqual(er.settings.difficulty, 'normal');
});
