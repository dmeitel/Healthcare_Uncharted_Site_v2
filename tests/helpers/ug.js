/**
 * Shared harness for Uncharted General tests.
 *
 * The game is one inline script on src/secret-menu/uncharted-general/index.html. loadGame extracts
 * it and runs it in a vm sandbox with a STRICT DOM stub: getElementById answers only for ids that
 * exist in the static HTML, anything else is null, which is how the missing-id class of bug gets
 * caught. evalIn runs code inside the sandbox realm (used to pin Math.random for deterministic
 * event tests). playToLevel2 boots a run into mid-quarter of level 2 through the real code paths.
 */
'use strict';
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = path.join(__dirname, '..', '..', 'src', 'secret-menu', 'uncharted-general', 'index.html');
const SYS_PAGE = path.join(__dirname, '..', '..', 'src', 'secret-menu', 'health-system', 'index.html');

function stubEl(id) {
  return {
    id,
    hidden: false,
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    offsetWidth: 100,
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c, f) { f ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); },
    },
    addEventListener() {},
    scrollIntoView() {},
    select() {},
  };
}

function loadGame() { return loadPageSandbox(PAGE, '__ug', 'ug'); }
/** Same harness, pointed at the health-system game (hook window.__hs). */
function loadSystem() { const s = loadPageSandbox(SYS_PAGE, '__hs', 'hs'); return { hs: s.ug, ids: s.ids, evalIn: s.evalIn }; }

function loadPageSandbox(pageFile, hookName) {
  const html = fs.readFileSync(pageFile, 'utf8');
  const open = html.indexOf('<script>');
  const close = html.lastIndexOf('</script>');
  assert.ok(open > -1 && close > open, 'game page must contain one inline script');
  const src = html.slice(open + '<script>'.length, close);

  const staticHtml = html.slice(0, open);
  const ids = {};
  for (const m of staticHtml.matchAll(/id="([^"]+)"/g)) ids[m[1]] = stubEl(m[1]);

  const ctx = {
    document: { getElementById: id => ids[id] || null, addEventListener() {} },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } },
    console,
    Blob, Response, CompressionStream, DecompressionStream, btoa, atob,
    setTimeout, clearTimeout,
  };
  vm.createContext(ctx);
  new vm.Script(src, { filename: path.basename(pageFile) + '.js' }).runInContext(ctx);
  assert.ok(ctx.window[hookName], 'test hook ' + hookName + ' must be exported');
  return {
    ug: ctx.window[hookName],
    ids,
    /** run code inside the sandbox realm, e.g. evalIn('Math.random = () => 0') */
    evalIn(code) { return new vm.Script(code).runInContext(ctx); },
  };
}

/** Boot a run into mid-quarter of level 2 through the real code paths. */
function playToLevel2(ug) {
  ug.initRun();
  ug.pickCeo(ug.CEOS[1]);                       // R. Sloane, MBA: no onPick, plain modifiers
  const telehealth = ug.UNITS.find(u => u.id === 'telehealth');
  ug.startConstruction(telehealth);             // clears the level-1 build objective
  ug.runQuarter();                              // Q1 clears, endScreen 'continue'
  assert.strictEqual(ug.run.over, false, 'level 1 must clear');
  ug.advance();                                 // into level 2; may open a choice event
  if (ug.run.pendingEvent) {
    const free = ug.run.pendingEvent.options.findIndex(o => !o.cost);
    assert.ok(free > -1, 'every choice event carries a free option');
    ug.resolveEventChoice(free);
  }
  assert.ok(ug.run.goal, 'level 2 must have a goal');
  ug.hire(ug.run.departments[0], 'rn');         // mid-quarter tinkering rides the save too
  return ug;
}

const J = v => JSON.stringify(v);

module.exports = { loadGame, loadSystem, playToLevel2, stubEl, J, PAGE, SYS_PAGE };
