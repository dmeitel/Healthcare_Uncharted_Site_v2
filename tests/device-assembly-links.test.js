/**
 * Device Assembly, the address reader (2026-10-04). David, on the playtest: "when I select the links on the hub it
 * always takes me to the random wall that is set up not the specific mission or tutorial lesson". Six setups linked
 * to the game with no wall in the address, and the reader only knew the dealt walls, so the game resumed whatever
 * wall was last open. These tests hold the reader to every kind of wall a link can name, and every playtest link on
 * the hub's board to a wall the game actually opens.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = path.join(__dirname, '..', 'src', 'fun', 'device-assembly', 'index.html');
const html = fs.readFileSync(PAGE, 'utf8');
const SRC = html.slice(html.indexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const KIT = ['hu-table.js', 'hu-rng.js'].map((f) => new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }));
const GAME = new vm.Script(SRC, { filename: 'device-assembly.js' });

/** the game as a page with this address would load it @param {string} search @param {object} [done] */
function load(search, done) {
  const store = { 'hu-da': JSON.stringify({ done: done || {}, best: {} }) };
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    location: { search, origin: 'http://localhost', pathname: '/fun/device-assembly/' },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: store, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
    Date, Intl,
  };
  vm.createContext(ctx);
  for (const s of KIT) s.runInContext(ctx);
  GAME.runInContext(ctx);
  return ctx.window.__da;
}
const da = load('');
const read = (/** @type {string} */ q) => da.linkTarget(q);

test('an authored wall opens by its id once it is open: the first tutorial, the ventilators, the sandbox', () => {
  assert.strictEqual(read('?wall=t1').wall, 't1');
  assert.strictEqual(read('?wall=v1').wall, 'v1');
  assert.strictEqual(read('?wall=vf2').wall, 'vf2');
  assert.strictEqual(read('?wall=sb').wall, 'sb');
});

test('a wall still locked opens only with the tester hatch, and a parked or unknown id is no link at all', () => {
  assert.strictEqual(read('?wall=l3').wall, '', 'Level 4 is locked on a first visit');
  assert.strictEqual(read('?wall=f1').wall, '', 'the faults open after Level 1');
  assert.strictEqual(load('?wall=f1&unlock=1').linkTarget('?wall=f1&unlock=1').wall, 'f1');
  assert.strictEqual(load('?wall=f1', { l1: 1 }).linkTarget('?wall=f1').wall, 'f1', 'and on its own once Level 1 is done');
  assert.strictEqual(read('?wall=l4').wall, '', 'a parked wall');
  assert.strictEqual(load('?unlock=1').linkTarget('?wall=l4').wall, '', 'a parked wall stays shut even with the hatch');
  assert.strictEqual(read('?wall=nope').wall, '');
  assert.strictEqual(read('').wall, '');
});

test('today, dated and dealt walls: every place the generator deals, the ICU included', () => {
  assert.match(read('?wall=today').wall, /^day:\d{4}-\d{2}-\d{2}$/);
  assert.strictEqual(read('?wall=day:2026-10-04').wall, 'day:2026-10-04');
  for (const id of ['gen:K3F9QX', 'rehab:P1', 'home:P0', 'icu:Q7', 'shift:T0']) assert.strictEqual(read('?wall=' + id).wall, id, id);
  for (const id of ['gen:new', 'rehab:new', 'home:new', 'icu:new', 'shift:new']) assert.strictEqual(read('?wall=' + id).wall, id, id);
});

test('the race and the maker open over the wall the player was on, not instead of it', () => {
  assert.deepStrictEqual({ ...read('?wall=race:new') }, { wall: '', opens: 'race:new' });
  assert.deepStrictEqual({ ...read('?wall=make:new&dadev=1') }, { wall: '', opens: 'make:new' });
});

test('every playtest link on the hub names a wall the game opens', () => {
  const board = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data-build', 'board.json'), 'utf8'));
  const qa = board.cards.filter((c) => c.id === 'device-assembly' || c.id === 'device-assembly-level-design-and-pathway').flatMap((c) => c.qa || []);
  for (const q of qa) {
    if (!q.link || q.id === 'first-visit' || /^\/__hub\//.test(q.link)) continue;   // a first visit lands wherever a stranger lands; a hub page is not the game
    assert.ok(/^\/(?!\/)/.test(q.link) && !/^\/secret-menu\/device-assembly\//.test(q.link), q.id + ': the hub serves the build being fixed, so the link is local, at the game address since 2026-10-06');
    if (!/^\/fun\/device-assembly\//.test(q.link) || !/[?&]wall=/.test(q.link)) continue;   // the shelf, or no wall named: the front door, which is what it checks
    const search = q.link.slice(q.link.indexOf('?'));
    const t = load(search).linkTarget(search);
    assert.ok(t.wall || t.opens, q.id + ' opens nothing: ' + q.link);
  }
});

test('a link a messenger escaped still opens its wall', () => {
  assert.strictEqual(read('?wall=gen%3AK3F9QX').wall, 'gen:K3F9QX');
  assert.strictEqual(read('?dadev=1&wall=day%3A2026-10-04').wall, 'day:2026-10-04');
});
