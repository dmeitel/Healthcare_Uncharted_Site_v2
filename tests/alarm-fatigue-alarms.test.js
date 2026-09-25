/**
 * Alarm Fatigue, real or nuisance (2026-09-24, docs/HU-GAME-EXPANSION-2026-09-23.md section 3.1).
 * Every pulse ox alarm is decided REAL or NUISANCE when it starts, about 7 in 10 nuisance, and
 * the tile shows which by how the number moves and what the signal bar does. SILENCE is one tap;
 * CHECK walks you to the room.
 *
 * The page's alarm engine sits between two markers with no DOM inside, so this loads that block
 * alone into a vm and drives it with the site's seeded generator (hu-rng.js). The page wiring
 * (the buttons, the walk on the big button, the code card's line) is pinned by reading the
 * source, and walked for real in a browser by tmp/af-real/walk.js.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE = fs.readFileSync(path.join(__dirname, '..', 'src', 'fun', 'alarm-fatigue', 'index.html'), 'utf8');
const BEGIN = '/* ALARM ENGINE BEGIN */', END = '/* ALARM ENGINE END */';

function rngKit() {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-rng.js'), 'utf8')).runInContext(ctx);
  return ctx.window.HURng;
}
function engine() {
  const a = PAGE.indexOf(BEGIN), b = PAGE.indexOf(END);
  assert.ok(a > 0 && b > a, 'the engine block is marked');
  const ctx = { Math, console };
  vm.createContext(ctx);
  return new vm.Script(PAGE.slice(a, b) + '\n;({ALARM, drawAlarm, realOdds, newOx, oxStart, oxTick, oxClear, oxCodeDue, oxSilence, oxCheck, oxArrive, walkStart, walkTick})')
    .runInContext(ctx);
}
const E = engine();
const seeded = s => rngKit().make(s);
const WEST = [4, 5, 7, 8], EAST = [21, 22, 23, 25];

test('the engine block is marked once and touches no DOM', () => {
  assert.strictEqual(PAGE.split(BEGIN).length, 2);
  assert.strictEqual(PAGE.split(END).length, 2);
  const block = PAGE.slice(PAGE.indexOf(BEGIN), PAGE.indexOf(END));
  assert.doesNotMatch(block, /document\.|window\.|\.classList|textContent|floatText|snd\./);
});

test('about 7 alarms in 10 are nuisance, over many draws', () => {
  const rng = seeded(20260924);
  let nuis = 0, n = 0;
  for (let i = 0; i < 40000; i++) {
    const room = WEST.concat(EAST)[i % 8];
    if (E.drawAlarm(room, rng) !== 'real') nuis++;
    n++;
  }
  const share = nuis / n;
  assert.ok(share > 0.66 && share < 0.74, 'nuisance share across all eight rooms: ' + share.toFixed(3));
  // the first hallway alone is what an early shift sees
  let w = 0;
  for (let i = 0; i < 20000; i++) if (E.drawAlarm(WEST[i % 4], rng) !== 'real') w++;
  assert.ok(w / 20000 > 0.66 && w / 20000 < 0.76, '4 West alone: ' + (w / 20000).toFixed(3));
});

test('the brain sheet weights the draw: lungs on oxygen run real, the walker runs nuisance', () => {
  assert.ok(E.realOdds(22) > E.ALARM.BASE_REAL, 'Room 22, pneumonia and COPD on 3L');
  assert.ok(E.realOdds(4) > E.ALARM.BASE_REAL, 'Room 4, COPD on 2L');
  assert.ok(E.realOdds(8) < E.ALARM.BASE_REAL, 'Room 8, dementia, wants to walk');
  assert.strictEqual(E.realOdds(7), E.ALARM.BASE_REAL, 'Room 7 keeps the base rate: its secret is on the strip');
  const rng = seeded(7);
  let motion = 0, probe = 0;
  for (let i = 0; i < 5000; i++) { const k = E.drawAlarm(8, rng); if (k === 'motion') motion++; else if (k === 'probe') probe++; }
  assert.ok(motion > probe * 2, 'Room 8 moves more than it loses the probe');
});

test('the clue: a real one slides one point a tick on a full signal', () => {
  const rng = seeded(1), o = E.newOx();
  o.sat = 96; E.oxStart(o, 'real', rng);
  let prev = o.sat;
  while (o.sat > 80) {
    E.oxTick(o, rng);
    assert.strictEqual(o.sat, prev - 1, 'one point, every tick');
    assert.ok(o.sig >= 0.7, 'strong signal');
    prev = o.sat;
  }
  assert.ok(E.oxCodeDue(o), 'at 80 it codes');
});

test('the clue: a probe off falls off a cliff in one tick and the signal goes flat', () => {
  const rng = seeded(2), o = E.newOx();
  o.sat = 97; E.oxStart(o, 'probe', rng);
  E.oxTick(o, rng);
  assert.ok(o.sat >= 60 && o.sat <= 64, 'the low 60s at once: ' + o.sat);
  assert.strictEqual(o.sig, 0);
  E.oxTick(o, rng);
  assert.ok(!E.oxCodeDue(o), 'a probe never codes, however low it reads');
});

test('the clue: motion bounces and the signal flickers', () => {
  const rng = seeded(3), o = E.newOx();
  o.sat = 97; E.oxStart(o, 'motion', rng);
  o.settle = 99;   // hold it long enough to watch
  const sats = [], sigs = [];
  for (let i = 0; i < 8; i++) { E.oxTick(o, rng); sats.push(o.sat); sigs.push(o.sig); }
  for (let i = 1; i < sats.length; i++) {
    const d = sats[i] - sats[i - 1];
    assert.ok(Math.abs(d) >= 2, 'it jumps: ' + sats.join(', '));
    if (i > 1) assert.ok(Math.sign(d) !== Math.sign(sats[i - 1] - sats[i - 2]), 'up, down, up: ' + sats.join(', '));
  }
  assert.ok(sigs.every(s => s < 0.7), 'never a full signal');
  assert.ok(Math.max(...sigs) - Math.min(...sigs) > 0.1, 'and it flickers');
  o.sat = 79;
  assert.ok(!E.oxCodeDue(o), 'motion never codes, even under 80');
});

test('SILENCE resolves a nuisance', () => {
  for (const kind of ['motion', 'probe']) {
    const rng = seeded(4), o = E.newOx();
    E.oxStart(o, kind, rng); E.oxTick(o, rng); E.oxTick(o, rng);
    assert.strictEqual(E.oxSilence(o), kind, 'it says what it was');
    assert.strictEqual(o.kind, null, kind + ' is gone');
    assert.ok(o.sat >= 94, 'the number is back');
    assert.strictEqual(E.oxSilence(o), null, 'nothing left to silence');
  }
});

test('SILENCE on a real one stops the tone and nothing else: it keeps falling and codes', () => {
  const rng = seeded(5), o = E.newOx();
  o.sat = 96; E.oxStart(o, 'real', rng);
  for (let i = 0; i < 5; i++) E.oxTick(o, rng);
  assert.strictEqual(o.sat, 91);
  assert.strictEqual(E.oxSilence(o), 'real');
  assert.strictEqual(o.kind, 'real', 'still real');
  assert.ok(o.silenced);
  assert.strictEqual(o.silencedAt, 91, 'the code card can say where you silenced it');
  assert.strictEqual(E.oxSilence(o), null, 'a second tap does nothing and pays nothing');
  for (let i = 0; i < 11; i++) E.oxTick(o, rng);
  assert.strictEqual(o.sat, 80, 'it kept sliding');
  assert.ok(E.oxCodeDue(o), 'and codes at 80');
});

test('CHECK resolves both kinds, and it costs the walk', () => {
  for (const kind of ['real', 'motion', 'probe']) {
    const rng = seeded(6), o = E.newOx(), W = { room: null, left: 0 };
    o.sat = 96; E.oxStart(o, kind, rng); o.settle = 99;
    for (let i = 0; i < 4; i++) E.oxTick(o, rng);
    const seen = o.sat;
    assert.ok(E.oxCheck(o), 'you set off');
    assert.ok(E.walkStart(W, 22));
    assert.strictEqual(E.walkStart(W, 5), false, 'one room at a time');
    for (let i = 0; i < 20; i++) E.oxTick(o, rng);
    assert.strictEqual(o.sat, seen, 'the number holds while you walk');
    assert.ok(!E.oxCodeDue(o), 'and it cannot code under you');
    assert.strictEqual(E.oxSilence(o), null, 'nor be silenced');
    let spent = 0, arrived = null;
    while (arrived == null) { arrived = E.walkTick(W, 100); spent += 100; }
    assert.strictEqual(arrived, 22);
    assert.strictEqual(spent, E.ALARM.CHECK_MS, 'the walk is the price');
    const f = E.oxArrive(o);
    assert.strictEqual(f.kind, kind, 'you find out what it was');
    assert.strictEqual(f.sat, seen);
    assert.strictEqual(o.kind, null, kind + ' is fixed');
    assert.ok(o.sat >= 93);
    assert.strictEqual(E.oxArrive(o), null, 'once');
  }
  assert.ok(E.ALARM.CHECK_MS >= 2000 && E.ALARM.CHECK_MS <= 5000, 'about three seconds');
  assert.ok(E.ALARM.PAY.checkReal > 2, 'a caught real one pays more than CLEAR did');
  assert.ok(E.ALARM.PAY.silence < E.ALARM.PAY.checkReal);
});

test('a nuisance nobody answers settles on its own; a real one never does', () => {
  const rng = seeded(8);
  const n = E.newOx(); E.oxStart(n, 'motion', rng);
  let settled = false;
  for (let i = 0; i <= E.ALARM.SETTLE[1] && !settled; i++) settled = E.oxTick(n, rng);
  assert.ok(settled && n.kind === null, 'settled within ' + E.ALARM.SETTLE[1] + ' ticks');
  const r = E.newOx(); E.oxStart(r, 'real', rng);
  for (let i = 0; i < 200; i++) assert.strictEqual(E.oxTick(r, rng), false);
  assert.strictEqual(r.kind, 'real');
  assert.strictEqual(r.sat, E.ALARM.FLOOR, 'it bottoms out and waits for the code');
});

// ── the page wiring, read from the source ──
test('the tile carries two verbs: SILENCE on the button, CHECK on the sat box', () => {
  assert.match(PAGE, /class="clr"[^>]*>SILENCE<\/button>/);
  assert.match(PAGE, /<button type="button" class="hit sat-box"/);
  assert.match(PAGE, /<span class="ck" aria-hidden="true">CHECK<\/span>/);
  assert.match(PAGE, /<span class="sig" data-q="ok"><i><\/i><\/span>/, 'the signal bar is the one new element');
  assert.doesNotMatch(PAGE, />CLEAR<\/button>/, 'no tile says CLEAR any more');
});

test('the big button earns nothing on the walk, and says where you are', () => {
  assert.match(PAGE, /if\(S\.walk\.room!=null\) return;\s*\/\* you are in a room/);
  assert.match(PAGE, /setBtnLabel\('In Room '\+room\)/);
});

test('the code card says you silenced it only when you did', () => {
  assert.match(PAGE, /startCode\(\(\)=>resolve\('code'\), room, o\.silenced \? o\.silencedAt : null\)/);
  assert.match(PAGE, /\(silencedAt!=null \? 'You silenced it at '\+silencedAt\+'\. It kept falling\. ' : ''\)/);
});

test('the how-to teaches the decision in three rules, and the hints replaced the old one', () => {
  const m = PAGE.match(/rules:\[([\s\S]*?)\],\s*example:helpEx/);
  assert.ok(m, 'the how-to rules');
  const rules = m[1].match(/'[^']*'/g);
  assert.strictEqual(rules.length, 3);
  assert.ok(rules.some(r => /SILENCE/.test(r) && /CHECK/.test(r)));
  assert.doesNotMatch(PAGE, /S\.tipSat/, 'the old first-desat hint is gone');
  assert.match(PAGE, /S\.tipReal/); assert.match(PAGE, /S\.tipNuis/);
});

test('the report gets one line for the real ones', () => {
  assert.match(PAGE, /'<br>real alarms: '\+c\+' caught, '\+s\+' silenced'/);
});

test('Room 7 keeps its secret', () => {
  assert.match(PAGE, /\/\* Room 7: quiet on purpose\. techs never catch this one\. \*\//);
  assert.match(PAGE, /f\.textContent='RM 7 · HR 128 ↑';/);
});

test('the new words follow the house rules', () => {
  const a = PAGE.indexOf('/* ================= REAL OR NUISANCE');
  const b = PAGE.indexOf('function spawnSat(');
  const copy = PAGE.slice(a, b) + (PAGE.match(/rules:\[[\s\S]*?\]/) || [''])[0] + (PAGE.match(/helpEx\.innerHTML=[\s\S]*?;\n/) || [''])[0];
  assert.doesNotMatch(copy, /—/, 'no em dashes');
  assert.doesNotMatch(copy, /\b(genuinely|straightforward|delve)\b/i);
});

test('the test hook can start a known alarm', () => {
  const hook = PAGE.slice(PAGE.indexOf('if(window.__UG_TEST) window.__af='));
  for (const k of ['forceAlarm(room, kind)', 'oxOf(room)', 'tickRoom(room)', 'get walk()', 'ALARM, drawAlarm']) assert.ok(hook.includes(k), k);
});
