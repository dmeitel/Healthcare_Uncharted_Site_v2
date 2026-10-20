/**
 * Uncharted Regional rolls its dice from a seeded generator that rides the save (.claude/rules/games.md,
 * The engine). Two terms on one seed with the same verbs are one term, byte for byte; a restored save
 * rolls what the saved term would have rolled; a save from before the dice still loads. Same strict-DOM
 * harness as tests/uncharted-regional.test.js (hook window.__hs).
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const { loadSystem, J, SYS_PAGE } = require('./helpers/ug');

const noMathRandom = (evalIn, why) => evalIn(`Math.random = () => { throw new Error(${JSON.stringify(why)}); }`);
const packOf = hs => J(hs.packSave());

/** One quarter of the same verbs: a hire and a release, a service on and off, Run, then the
 *  payer table (hardball, which rolls) at a board review, then Continue. Returns what was dealt. */
function playQuarter(hs) {
  const dealt = J({ goal: hs.sys.goal && { kind: hs.sys.goal.kind, target: hs.sys.goal.target }, ev: hs.sys.activeEvent });
  hs.dispatchAct('staff', { f: 'general', d: '1' });
  hs.dispatchAct('staff', { f: 'general', d: '-1' });
  hs.dispatchAct('shared', { k: 'ehr' });
  hs.dispatchAct('shared', { k: 'ehr' });
  hs.dispatchAct('runq');
  if (!hs.sys.over && hs.sys.pendingNeg) hs.dispatchAct('neg', { i: '2' });
  if (!hs.sys.over) hs.dispatchAct('continue');
  return dealt;
}
/** A term on a pinned seed, played the same way for n quarters, with Math.random off limits throughout. */
function seededTerm(seed, quarters) {
  const s = loadSystem();
  noMathRandom(s.evalIn, 'the engine reached for Math.random');
  s.hs.settings.difficulty = 'easy'; s.hs.settings.years = 0;
  s.hs.dispatchAct('start', { seed });
  const packs = [packOf(s.hs)], dealt = [];
  for (let q = 0; q < quarters && !s.hs.sys.over; q++) { dealt.push(playQuarter(s.hs)); packs.push(packOf(s.hs)); }
  return Object.assign(s, { packs, dealt });
}

test('the engine script has no bare Math.random left', () => {
  const html = fs.readFileSync(SYS_PAGE, 'utf8');
  const src = html.slice(html.indexOf('<script>'), html.lastIndexOf('</script>')).replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(src, /Math\.random\s*\(/, 'every roll goes through the term\'s dice');
  assert.match(html, /<script src="\/assets\/js\/hu-rng\.js[^"]*"><\/script>\s*<script>/, 'the generator loads ahead of the game');
});

test('a new term carries a seed, and the save carries it and how far it has rolled', () => {
  const { hs } = loadSystem();
  hs.dispatchAct('start');
  const p = hs.packSave();
  assert.strictEqual(typeof p.sys.rng.seed, 'number', 'the seed is in the state');
  assert.strictEqual(p.sys.rng.seed, hs.seed, 'and on the test hook');
  assert.ok(p.sys.rng.n >= 1, 'the opening goal came off the dice');
  assert.strictEqual(typeof hs.rng, 'function', 'the generator is on the hook');
  const before = hs.seed;
  hs.dispatchAct('start');
  assert.notStrictEqual(hs.seed, before, 'a new term deals new dice');
});

test('same seed, same verbs: two terms end byte-identical; another seed deals a different term', () => {
  const A = seededTerm(42, 10), B = seededTerm(42, 10);
  assert.ok(A.packs.length > 8, 'the term lasted long enough to roll events and a payer table');
  assert.ok(A.dealt.some(d => JSON.parse(d).ev), 'an event was dealt');
  assert.deepStrictEqual(B.packs, A.packs, 'after every quarter, the packed term is the same string');
  assert.strictEqual(packOf(B.hs), packOf(A.hs), 'and it ends byte for byte the same');
  const deals = [1, 2, 3, 4, 5].map(s => J(seededTerm(s, 6).dealt));
  assert.ok(new Set(deals).size > 1, 'different seeds deal different goals and events');
});

test('a restored save rolls what the saved term would have rolled', async () => {
  const A = seededTerm(7, 3);
  const str = await A.hs.encodeSave(A.hs.packSave());
  const B = loadSystem();
  noMathRandom(B.evalIn, 'a restore reached for Math.random');
  B.hs.applySave(await B.hs.decodeSave(str));
  assert.strictEqual(packOf(B.hs), packOf(A.hs), 'restored byte for byte, dice included');
  for (let q = 0; q < 6; q++) {
    for (const g of [A, B]) if (!g.hs.sys.over) playQuarter(g.hs);
    assert.strictEqual(packOf(B.hs), packOf(A.hs), `quarter ${q + 1} after the restore rolled the same on both`);
  }
});

test('the payer table is not a do-over: the same save and the same choice land the same rate', async () => {
  const results = [];
  const A = loadSystem();
  A.hs.settings.difficulty = 'easy'; A.hs.settings.years = 3;
  A.hs.dispatchAct('start', { seed: 11 });
  A.hs.sys.level = 4; A.hs.sys.activeEvent = null;
  A.hs.sys.goal = A.hs.goalOf('net', -99999);
  A.hs.dispatchAct('runq');
  assert.ok(A.hs.sys.pendingNeg, 'the payer is at the table');
  const str = await A.hs.encodeSave(A.hs.packSave());
  for (let i = 0; i < 5; i++) {
    const B = loadSystem();
    B.hs.applySave(await B.hs.decodeSave(str));
    B.hs.dispatchAct('neg', { i: '2' });
    results.push(B.hs.sys.rateComm);
  }
  assert.strictEqual(new Set(results).size, 1, 'five restores, one hardball result: ' + results.join(', '));
});

test('a save from before the dice still loads, gets a seed, and gets the same one every time', async () => {
  const A = seededTerm(9, 2);
  const packed = A.hs.packSave();
  delete packed.sys.rng;                                    // the shape every save had until 2026-10-19
  const old = await A.hs.encodeSave(packed);
  const seeds = [];
  for (let i = 0; i < 3; i++) {
    const B = loadSystem();
    noMathRandom(B.evalIn, 'an old save reached for Math.random');
    B.hs.applySave(await B.hs.decodeSave(old));
    assert.strictEqual(B.hs.sys.cash, A.hs.sys.cash, 'everything else came through');
    assert.strictEqual(B.hs.sys.level, A.hs.sys.level);
    assert.strictEqual(typeof B.hs.seed, 'number', 'it was given a seed');
    assert.strictEqual(B.hs.sys.rng.n, 0);
    seeds.push(B.hs.seed);
    playQuarter(B.hs);                                       // and it plays on, rolling from the new dice
    assert.ok(B.hs.sys.rng.n > 0 || B.hs.sys.over, 'the dice are in use');
  }
  assert.strictEqual(new Set(seeds).size, 1, 'the same old string gets the same seed, so a restore is never a re-roll');

  // and the old string left in a player's browser by Continue loads the same way
  const C = loadSystem();
  C.evalIn('localStorage.removeItem = function(k){ delete this._s[k]; }');
  C.evalIn(`localStorage.setItem(${JSON.stringify(C.hs.AUTO_KEY)}, ${JSON.stringify(old)});`
    + `localStorage.setItem('hu-hs-run-meta', ${JSON.stringify(JSON.stringify({ level: A.hs.sys.level, at: 1 }))});`);
  assert.ok(C.hs.autoMeta(), 'the start card offers Continue');
  await C.hs.continueRun();
  assert.strictEqual(C.hs.termLive, true, 'Continue picked the term up');
  assert.strictEqual(C.hs.sys.level, A.hs.sys.level);
  assert.strictEqual(C.hs.seed, seeds[0], 'with the same seed a pasted copy gets');
});
