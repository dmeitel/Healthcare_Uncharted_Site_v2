/**
 * Device Assembly, the front door and the plain addresses (2026-10-06, DECISIONS B5, B6 and B7: "dock and A, go ahead
 * and build both"). B5: a first visit starts the training, and every visit after leads with today's wall and your path.
 * The games rule: the first screen has one primary button, and it starts or resumes play. B6: every part has a plain
 * address (src/fun/device-assembly/parts.11ty.js), each forwarding a token the game must open, and the address follows
 * the wall on screen. Also the defect found on the way: the daily streak was saved and then dropped on load.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = path.join(__dirname, '..', 'src', 'fun', 'device-assembly', 'index.html');
function load(saved) {
  const html = fs.readFileSync(PAGE, 'utf8');
  const open = html.indexOf('<script>'), close = html.lastIndexOf('</script>');
  const src = html.slice(open + '<script>'.length, close);
  const store = saved ? { 'hu-da': JSON.stringify(saved) } : {};
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: store, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
    Date, Intl,
  };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  return ctx.window.__da;
}
const primaries = html => [...html.matchAll(/class="da-go"[^>]*>([^<]*)</g)].map(m => m[1]);
const TRAINED = { t1: 1, t2: 1, t3: 1, t4: 1, t5: 1 };

test('the daily streak survives a reload', () => {
  const da = load({ done: { t1: 1 }, best: {}, last: 't1', daily: { last: '2026-10-05', streak: 3, best: 4 } });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(da.progress.daily)), { last: '2026-10-05', streak: 3, best: 4 });
});

test('a first visit: the home screen leads with the training, one primary button', () => {
  const da = load();
  assert.strictEqual(da.firstVisit(), true);
  assert.deepStrictEqual(primaries(da.doorA()), ['Start the training']);
});

test('a visit after: today\'s wall leads, your path continues, still one primary button', () => {
  const da = load({ done: Object.assign({ lnrb: 1 }, TRAINED), best: {}, last: 'lnrb' });
  const a = da.doorA();
  assert.deepStrictEqual(primaries(a), ['Play today’s wall']);
  assert.match(a, /Your path<\/div><h3>Oxygen on the floor<\/h3>/, 'the path your last wall was on');
});

test('today\'s wall done: the primary button moves to your path', () => {
  const today = 'day:' + new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
  const da = load({ done: Object.assign({ lnrb: 1, [today]: 1 }, TRAINED), best: {}, last: today });
  assert.strictEqual('day:' + da.dayKey(), today, 'the test and the game agree on today');
  assert.deepStrictEqual(primaries(da.doorA()), ['Continue']);
  assert.match(da.doorA(), /Today’s wall · #\d+ · done/);
});

test('the paths card draws the training and every path as a row of stops', () => {
  const da = load({ done: TRAINED, best: {} });
  const n = (da.menuTracks().match(/class="da-track"/g) || []).length;
  assert.strictEqual(n, 1 + da.PATHS.length);
});

const { PARTS } = require('../src/fun/device-assembly/parts.11ty.js');

test('every plain address forwards a token the game opens', () => {
  const da = load();
  const slugs = new Set();
  for (const p of PARTS) {
    assert.ok(!slugs.has(p.slug), 'one page per address: ' + p.slug); slugs.add(p.slug);
    const t = da.linkTarget('?wall=' + p.wall);
    assert.ok(t.wall || t.opens, p.slug + ' (?wall=' + p.wall + ') opens nothing');
    assert.ok(!/—/.test(p.title + p.description), 'no em dash in ' + p.slug);
  }
  for (const path of da.PATHS) assert.ok(slugs.has('paths/' + path.slug), 'the ' + path.name + ' path has an address');
});

test('a path not open yet opens the map; an open one, its next wall', () => {
  const fresh = load();
  assert.deepStrictEqual(Object.assign({}, fresh.linkTarget('?wall=path:oxygen')), { wall: '', opens: 'paths' });
  assert.deepStrictEqual(Object.assign({}, fresh.linkTarget('?wall=path:ventilators')), { wall: 'v1', opens: '' }, 'the ventilators are open from the start');
  assert.deepStrictEqual(Object.assign({}, fresh.linkTarget('?wall=training')), { wall: 't1', opens: '' });
  const later = load({ done: Object.assign({ lnrb: 1 }, TRAINED), best: {} });
  assert.strictEqual(later.linkTarget('?wall=path:oxygen').wall, 'my:mask.8.0.plain.right.0.OX1');
});

test('the address follows the wall: plain while it opens this wall, ?wall= otherwise', () => {
  const da = load({ done: Object.assign({ t1: 1, t2: 1 }, {}), best: {} });
  assert.strictEqual(da.gameRoot(), 'https://healthcareuncharted.com/fun/device-assembly/', 'with no page, the live address');
  assert.strictEqual(da.addressOf(da.levelById('day:' + da.dayKey())), 'today/');
  assert.strictEqual(da.addressOf(da.levelById('t3')), 'training/', 'the next tutorial');
  assert.strictEqual(da.addressOf(da.levelById('t1')), '?wall=t1', 'a tutorial played again');
  assert.strictEqual(da.addressOf(da.levelById('v1')), 'paths/ventilators/');
  assert.strictEqual(da.addressOf(da.levelById('gen:K3F9QX')), '?wall=gen:K3F9QX');
  assert.strictEqual(da.addressOf({ id: 'shift:T0:2' }), '?wall=shift:T0', 'a shift link continues the shift');
});
