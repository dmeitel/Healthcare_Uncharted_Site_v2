/**
 * Device Assembly's funnel events. The launch post goes to a subreddit and the only way to learn
 * anything from it is the counts: did a stranger open a wall, finish the first tutorial, miss a
 * submit, ever try a table, and how long did they stay.
 *
 * Two things have to hold or the numbers lie. Every event goes out as an event on the game's own
 * path, and a QA load sends nothing: the check scripts and the unit tests all set a hook, so
 * without the guard `npm run qa:phone` against the live site would file scripted hosts and joins
 * as real ones. The page is loaded here the way every other Device Assembly test loads it, under
 * the test hook, which is itself one of the four quiet conditions; the first test flips the flag
 * to stand in for a stranger's visit.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = path.join(__dirname, '..', 'src', 'secret-menu', 'device-assembly', 'index.html');

function load(search) {
  const html = fs.readFileSync(PAGE, 'utf8');
  const open = html.indexOf('<script>'), close = html.lastIndexOf('</script>');
  const hits = [];
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800, goatcounter: { count: o => hits.push(o) } },
    location: { search: search || '' },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } },
    Date, addEventListener() {},
  };
  vm.createContext(ctx);
  new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-table.js'), 'utf8'), { filename: 'hu-table.js' }).runInContext(ctx);
  new vm.Script(html.slice(open + '<script>'.length, close), { filename: 'device-assembly.js' }).runInContext(ctx);
  assert.ok(ctx.window.__da, 'engine hook exported');
  // the page is one IIFE, so the tracking comes out through the hook like the rest of the engine
  return { hits, ctx, da: ctx.window.__da, visit(as) { ctx.window.__UG_TEST = !!(as && as.ugTest); ctx.window.__DA_HOOK = !!(as && as.daHook); }, run: code => vm.runInContext(code, ctx) };
}

test('an event goes out on the game\'s own path, counted as an event', () => {
  const { hits, da, visit } = load('');
  visit({});                                    // a stranger's visit: no hatch, no hook
  da.track('first-wall');
  da.track('table-host');
  assert.deepStrictEqual(hits.map(h => h.path), [
    '/secret-menu/device-assembly/first-wall',
    '/secret-menu/device-assembly/table-host',
  ]);
  assert.ok(hits.every(h => h.event === true), 'events, not pageviews');
  assert.ok(hits.every(h => /^Device Assembly/.test(h.title)), 'named for the game');
  assert.ok(hits.every(h => !('user' in h) && !('id' in h)), 'nothing identifying');
});

test('a QA load counts nothing: both tester hatches and both script hooks', () => {
  /** @type {{search:string, ugTest?:boolean, daHook?:boolean, why:string}[]} */
  const cases = [
    { search: '?dadev=1', why: 'the analytics hatch' },
    { search: '?unlock=1', why: 'the level hatch' },
    { search: '?room=mirror&unlock=1', why: 'the hatches together' },
    { search: '', ugTest: true, why: 'the unit-test hook' },
    { search: '', daHook: true, why: 'the live-check and phone-QA hook' },
  ];
  for (const { search, ugTest, daHook, why } of cases) {
    const { hits, da, visit } = load(search);
    visit({ ugTest, daHook });
    assert.strictEqual(da.daIsQuiet(), true, why + ' should be quiet');
    da.track('table-host');
    assert.strictEqual(hits.length, 0, why + ' should send nothing');
  }
});

test('a plain visit is not quiet, and a lookalike query string does not silence it', () => {
  for (const search of ['', '?', '?ref=reddit', '?unlocked=no', '?dadevil=1']) {
    const { hits, da, visit } = load(search);
    visit({});
    assert.strictEqual(da.daIsQuiet(), false, JSON.stringify(search) + ' is a real visit');
    da.track('first-wall');
    assert.strictEqual(hits.length, 1, JSON.stringify(search) + ' should count');
  }
});

test('the buckets read as a distribution and never fall off either end', () => {
  const { da } = load('');
  assert.strictEqual(da.daMinBucket(), '0-2', 'a visit that just started');
  /** @type {[number, string][]} */
  const minutes = [[3, '2-5'], [9, '5-15'], [20, '15-30'], [40, '30plus']];
  for (const [mins, want] of minutes) {
    assert.strictEqual(da.daMinBucket(Date.now() + mins * 60000), want, mins + ' minutes in');
  }
  /** @type {[string[], string][]} */
  const walls = [[[], '0'], [['t1'], '1'], [['t1', 't2'], '2-3'], [['a', 'b', 'c', 'd'], '4-6'], [['a', 'b', 'c', 'd', 'e', 'f', 'g'], '7plus']];
  for (const [done, want] of walls) {
    assert.strictEqual(da.daWallBucket(Object.fromEntries(done.map(k => [k, true]))), want, done.length + ' walls finished');
  }
});
