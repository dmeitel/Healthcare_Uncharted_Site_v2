/**
 * ER Charge Nurse: the engine contract (.claude/rules/games.md, The engine; Saves and the wire), 2026-10-19.
 * One plain state object (G) that survives JSON whole; every change a verb through dispatchAct; every roll off
 * the seeded generator (hu-rng.js) with the seed riding the state; packSave/applySave headless, the string form
 * the kit's hu-save.js with the HUER1 prefix. ER Charge never kept a run between visits, so there is no old save
 * form to read; a pack without its dice still loads, on a seed made from its own contents.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = path.join(__dirname, '..', 'src', 'secret-menu', 'er-charge', 'index.html');
const KIT = path.join(__dirname, '..', 'src', 'assets', 'js');
const HTML = fs.readFileSync(PAGE, 'utf8');
const OPEN = HTML.indexOf('<script>'), CLOSE = HTML.lastIndexOf('</script>');
const SRC = HTML.slice(OPEN + '<script>'.length, CLOSE);

function load() {
  const ids = {};
  for (const m of HTML.slice(0, OPEN).matchAll(/id="([^"]+)"/g)) ids[m[1]] = {
    id: m[1], hidden: false, innerHTML: '', textContent: '', style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, querySelector() { return null; },
  };
  const ctx = {
    document: { getElementById: id => ids[id] || null, addEventListener() {}, querySelector() { return null; }, activeElement: null, body: {} },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } },
    Date, Blob, Response, CompressionStream, DecompressionStream, btoa, atob,
  };
  vm.createContext(ctx);
  // the kits load first, the way the page's <script src> tags do
  for (const f of ['hu-rng.js', 'hu-save.js']) new vm.Script(fs.readFileSync(path.join(KIT, f), 'utf8'), { filename: f }).runInContext(ctx);
  new vm.Script(SRC, { filename: 'er-charge.js' }).runInContext(ctx);
  assert.ok(ctx.window.__er, 'ER hook exported');
  return { er: ctx.window.__er, ctx };
}

/** A fixed way to play, the same in every sandbox: every 25 beats (five shift minutes) bed the sickest waiting
 *  patient in the first open bed; at beat 1500 a Fast Track and a Pull a Nurse; at beat 2000 a pause the clock
 *  cannot run through, then Resume. Beats are the driver's 0.2 shift minutes. */
function drive(er, from, to) {
  for (let beat = from; beat < to; beat++) {
    if (beat % 25 === 0) {
      const open = er.G.beds.find(b => !b.pt);
      const p = [...er.G.waiting].sort((a, b) => a.acuity - b.acuity || a.id - b.id)[0];
      if (open && p) er.dispatchAct('place', { pid: p.id, bed: open.num });
    }
    if (beat === 1500) {
      const b = er.G.beds.find(x => x.pt && !x.pt.boarding && x.pt.acuity >= 4);
      if (b) er.dispatchAct('card', { card: 'fast', pid: b.pt.id });
      er.dispatchAct('card', { card: 'pull' });
    }
    if (beat === 2000) { er.dispatchAct('pause'); er.dispatchAct('tick', { dt: 5 }); er.dispatchAct('resume'); }
    er.dispatchAct('tick', { dt: 0.2 });
  }
}
const SHIFT = 3700;                                      // 740 shift minutes of beats: past 19:00
const packed = er => JSON.stringify(er.packSave());

test('er engine: the same seed and the same verbs end byte-identical; another seed does not', () => {
  const runs = [1, 2, 3].map((_, i) => {
    const { er } = load();
    er.dispatchAct('start', { seed: i < 2 ? 20261019 : 20261020, difficulty: 'normal' });
    drive(er, 0, SHIFT);
    return er;
  });
  assert.strictEqual(runs[0].G.over, true, 'the shift ran to 19:00');
  assert.ok(runs[0].G.stats.arrived > 30 && runs[0].G.stats.seen > 10, 'a real shift: ' + runs[0].G.stats.arrived + ' arrived');
  assert.ok(runs[0].G.rng.n > 100, 'and it rolled the dice ' + runs[0].G.rng.n + ' times');
  assert.strictEqual(runs[0].seed, 20261019, 'the seed is on the hook');
  assert.strictEqual(packed(runs[0]), packed(runs[1]), 'same seed, same verbs, same shift to the byte');
  assert.notStrictEqual(packed(runs[0]), packed(runs[2]), 'another seed deals another shift');
});

test('er engine: the state is one plain object, no shared references, nothing a JSON trip loses', () => {
  const { er } = load();
  er.dispatchAct('start', { seed: 5, difficulty: 'normal' });
  drive(er, 0, 1600);                                    // mid-shift: jobs running, boarders, a card in play
  const seen = new Set();
  (function walk(o, at) {
    assert.ok(['string', 'boolean', 'number', 'object'].includes(typeof o), at + ' is a ' + typeof o);
    if (typeof o === 'number') assert.ok(Number.isFinite(o), at + ' is ' + o + ', which JSON cannot carry');
    if (!o || typeof o !== 'object') return;
    assert.ok(!seen.has(o), at + ' is shared with another place in the state');
    seen.add(o);
    for (const [k, v] of Object.entries(o)) walk(v, at + '.' + k);
  })(er.G, 'G');
  assert.ok(Object.values(er.G.res).some(r => r.busy.length), 'some work is underway to check');
  const once = JSON.stringify(er.G);
  assert.strictEqual(JSON.stringify(JSON.parse(once)), once, 'a JSON trip gives the same state back');
});

test('er save: a shift round-trips through the HUER1 string and plays on exactly as if it never stopped', async () => {
  const whole = load().er;
  whole.dispatchAct('start', { seed: 777, difficulty: 'hard' });
  drive(whole, 0, SHIFT);

  const a = load().er;
  a.dispatchAct('start', { seed: 777, difficulty: 'hard' });
  drive(a, 0, 1800);
  const str = await a.encodeSave();
  assert.match(str, /^HUER1\./, 'the kit codec, its own prefix');
  const b = load().er;
  b.applySave(await b.decodeSave(str));
  assert.strictEqual(packed(b), packed(a), 'the string brings the same shift back');
  assert.strictEqual(b.seed, 777);
  drive(b, 1800, SHIFT);
  assert.strictEqual(packed(b), packed(whole), 'the restored shift ends where the uninterrupted one did');

  const raw = 'HUER1R.' + Buffer.from(JSON.stringify(a.packSave()), 'utf8').toString('base64');   // the codec's fallback form
  const c = load().er;
  c.applySave(await c.decodeSave(raw));
  assert.strictEqual(packed(c), packed(a), 'the uncompressed form reads too');
});

test('er save: a pack without its dice loads on a seed made from its own contents, the same every time', () => {
  const { er } = load();
  er.dispatchAct('start', { seed: 9, difficulty: 'easy' });
  drive(er, 0, 600);
  const old = er.packSave(); delete old.G.rng;
  const x = load().er, y = load().er;
  x.applySave(JSON.parse(JSON.stringify(old))); y.applySave(JSON.parse(JSON.stringify(old)));
  assert.strictEqual(typeof x.seed, 'number');
  assert.strictEqual(x.seed, y.seed, 'the same pack, the same seed');
  drive(x, 600, 1200); drive(y, 600, 1200);
  assert.strictEqual(packed(x), packed(y), 'and the same future');
  assert.throws(() => x.applySave({ v: 1, G: { t: 'soon' } }), /bad save/, 'a broken pack is refused');
  assert.strictEqual(x.G.t > 0, true, 'and the shift in play is kept');
});

test('er engine: the tick and the verbs never touch the page', () => {
  const { er, ctx } = load();
  er.dispatchAct('start', { seed: 31, difficulty: 'hard' });
  const no = () => { throw new Error('the engine touched the DOM'); };
  Object.assign(ctx.document, { getElementById: no, querySelector: no, querySelectorAll: no, createElement: no });
  drive(er, 0, SHIFT);
  assert.strictEqual(er.G.over, true, 'a whole shift, 19:00 included');
  assert.ok(er.G.sayN > 0, 'its messages went into the state instead (' + er.G.sayN + ')');
  assert.ok(er.G.feed.length > 0, 'and so did its toasts');
});

test('er engine: the dispatcher refuses what the board refuses, and handlers only reach the engine through it', () => {
  const { er } = load();
  assert.strictEqual(er.dispatchAct('place', { pid: 1, bed: 1 }), false, 'nothing before a shift');
  er.dispatchAct('start', { seed: 3, difficulty: 'normal' });
  assert.strictEqual(er.dispatchAct('nope'), false, 'an unknown verb');
  assert.strictEqual(er.dispatchAct('constructor'), false, 'or one off the prototype');
  const p = er.G.waiting[0];
  er.dispatchAct('pause');
  const before = packed(er);
  assert.strictEqual(er.dispatchAct('place', { pid: p.id, bed: 1 }), false, 'a stopped board takes no placement');
  assert.strictEqual(er.dispatchAct('card', { card: 'pull' }), false, 'or card');
  assert.strictEqual(er.dispatchAct('tick', { dt: 10 }), false, 'and its clock does not run');
  assert.strictEqual(packed(er), before, 'nothing changed');
  er.dispatchAct('resume');
  assert.strictEqual(er.dispatchAct('place', { pid: p.id, bed: 1 }), true);
  assert.strictEqual(er.G.beds[0].pt.id, p.id);

  assert.doesNotMatch(SRC, /Math\.random/, 'every roll comes off the seeded generator');
  for (const fn of ['initShift', 'seedBacklog', 'placePatient', 'playCard']) {
    const calls = (SRC.match(new RegExp('\\b' + fn + '\\(', 'g')) || []).length;
    assert.strictEqual(calls, 2, fn + ' is called only from the verb table (its definition and one call)');
  }
  assert.strictEqual((SRC.match(/G\.paused\s*=/g) || []).length, 2, 'only the pause and resume verbs set the pause');
});
