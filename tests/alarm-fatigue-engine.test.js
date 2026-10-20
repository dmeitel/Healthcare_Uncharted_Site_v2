/**
 * Alarm Fatigue, the engine contract (.claude/rules/games.md, "The engine is data plus verbs"; 2026-10-20).
 * A shift is S, one plain object; every change to it is a verb through dispatchAct; every draw that changes the game
 * comes off one seeded generator (hu-rng.js) whose seed rides the save; packSave and applySave carry a shift as data,
 * and the string form is the kit's (hu-save.js).
 *
 * The page keeps that engine between two markers with no DOM, the way it keeps the alarm engine, so this loads both
 * blocks into a vm (with the kits, a fake clock, and a Math.random that throws) and plays shifts headless. The page's
 * own wiring (each control asks the dispatcher) is pinned by reading the source.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PAGE = fs.readFileSync(path.join(ROOT, 'src', 'fun', 'alarm-fatigue', 'index.html'), 'utf8');
const KIT = f => fs.readFileSync(path.join(ROOT, 'src', 'assets', 'js', f), 'utf8');
const block = (b, e) => { const a = PAGE.indexOf(b), z = PAGE.indexOf(e); assert.ok(a > 0 && z > a, b + ' is marked'); return PAGE.slice(a, z); };
const ALARM_BLOCK = block('/* ALARM ENGINE BEGIN */', '/* ALARM ENGINE END */');
const SHIFT_BLOCK = block('/* SHIFT ENGINE BEGIN */', '/* SHIFT ENGINE END */');

/** One sandbox, one shift. The page declares S right after the block; so does this. */
function engine(seed) {
  const M = Object.create(Math);
  M.random = () => { throw new Error('Math.random inside the engine'); };
  const ctx = { window: {}, console, Math: M, Blob, Response, CompressionStream, DecompressionStream, btoa, atob, __now: 1760000000000 };
  ctx.Date = { now: () => ctx.__now };
  vm.createContext(ctx);
  for (const k of ['hu-rng.js', 'hu-save.js']) new vm.Script(KIT(k), { filename: k }).runInContext(ctx);
  ctx.HURng = ctx.window.HURng; ctx.HUSave = ctx.window.HUSave;
  const src = 'function away(){ return false; }\n' + ALARM_BLOCK + '\n' + SHIFT_BLOCK +
    '\nconst S=newShift(' + JSON.stringify(seed) + '); dealNames();' +
    '\n;({S, dispatchAct, VERBS, packSave, applySave, encodeSave, decodeSave, memToString, memFromString, AF_CODEC,' +
    ' accrue, clockTick, rollAlarm, lightTick, arriveAt, queueIM, ibPush, newShift, costOf, UPG, oxTick, walkTick, rnd})';
  const E = new vm.Script(src, { filename: 'alarm-fatigue-engine.js' }).runInContext(ctx);
  E.ctx = ctx;
  return E;
}

/* A bot that plays by the state it sees, so two shifts on the same seed press the same things in the same order.
   One step is a tenth of a second of live floor: the accrual, the walk, and every so often the clock, the monitors,
   the call board, a chat. */
function playSteps(E, from, to) {
  const { S } = E;
  const ims = [{ from: 'Charge RN', msg: 'Can you take one more?', opts: ['No', 'Fine'] }];
  for (let i = from; i < to; i++) {
    E.ctx.__now += 100;
    E.dispatchAct('press', { gold: false });
    if (i === 130) E.dispatchAct('takeHelp');
    E.accrue();
    const arrived = E.walkTick(S.walk, 100); if (arrived != null) E.arriveAt(arrived);
    if (i % 30 === 0) E.clockTick();
    if (i % 12 === 0) for (const room of Object.keys(S.ox)) {
      E.oxTick(S.ox[room], E.rnd);
      const o = S.ox[room];
      if (o.kind === 'real' && !o.checking && S.walk.room == null) E.dispatchAct('check', { room: +room });
      else if (o.kind && o.kind !== 'real') E.dispatchAct('silence', { room: +room });
    }
    if (i % 140 === 0) for (const room of Object.keys(S.ox)) E.rollAlarm(+room);
    if (S.owned.call && i % 50 === 0) { E.lightTick(); if (S.lit.length && i % 100 === 0) E.dispatchAct('light', { room: S.lit[0] }); }
    if (i % 220 === 0) E.queueIM(ims[0]);
    if (i % 90 === 0 && S.ims.length) E.dispatchAct('chat');
    if (i === 400) E.dispatchAct('mute');
    if (i === 401) E.dispatchAct('clockTap');
    if (i % 25 === 0) for (const id of ['spo2', 'call', 'huddle', 'pump', 'prodtrack', 'themes', 'achv', 'vocera', 'inbasket', 'bulkdel', 'workflow']) {
      if (E.dispatchAct('buy', { id }).ok) break;   /* a buy that cannot happen changes nothing */
    }
    if (S.owned.inbasket && i % 60 === 0) { E.ibPush({ t: 'Result: CBC', o: ['Noted', 'Saw it', 'k'] }); if (i % 120 === 0) E.dispatchAct('ibReply', { id: S.ib.list[0].id, txt: 'Noted' }); }
    if (S.owned.bulkdel && i % 500 === 0) E.dispatchAct('ibAll');
  }
}
const J = v => JSON.stringify(v);

test('the shift engine is marked once and touches no DOM and no Math.random', () => {
  assert.strictEqual(PAGE.split('/* SHIFT ENGINE BEGIN */').length, 2);
  assert.strictEqual(PAGE.split('/* SHIFT ENGINE END */').length, 2);
  assert.doesNotMatch(SHIFT_BLOCK, /document\.|window\.|\.classList|textContent|innerHTML|floatText|snd\.|getBoundingClientRect/);
  assert.doesNotMatch(SHIFT_BLOCK, /Math\.random/);
  assert.ok(PAGE.indexOf('/* SHIFT ENGINE END */') < PAGE.indexOf('const S=newShift('), 'S is declared after the block, as the test does');
});

test('a new shift is one plain object that survives JSON with nothing lost', () => {
  const E = engine(42);
  playSteps(E, 0, 1500);
  const once = J(E.packSave());
  assert.strictEqual(J(JSON.parse(once)), once);
  const S = JSON.parse(once).shift;
  assert.strictEqual(S.seed, 42);
  assert.deepStrictEqual(Object.keys(S.rng), ['seed', 'n']);
  assert.ok(S.rng.n > 0, 'the dice were rolled');
  for (const k of ['clock', 'wear', 'cost', 'ox', 'bed', 'lit', 'ims', 'ib', 'techs', 'pumps', 'names', 'walk', 'streak'])
    assert.ok(k in S, k + ' rides the save');
  assert.ok(S.owned.spo2 >= 1 && Object.keys(S.ox).length >= 1, 'the bot bought a monitor: ' + J(S.owned));
  assert.ok(S.stats.alarms > 0 && S.stats.clicks > 0, 'and played it');
});

test('two shifts from the same seed and the same verbs end byte-identical', () => {
  const a = engine(20261020), b = engine(20261020);
  playSteps(a, 0, 3000); playSteps(b, 0, 3000);
  const A = J(a.packSave()), B = J(b.packSave());
  assert.strictEqual(A, B);
  assert.ok(a.S.stats.realCaught + a.S.stats.realSilenced + a.S.stats.alarms > 0, 'something happened on the floor');
  const c = engine(7); playSteps(c, 0, 3000);
  assert.notStrictEqual(J(c.packSave()), A, 'another seed is another shift');
});

test('a save round-trips through the string, and play goes on exactly where it stopped', async () => {
  const whole = engine(99); playSteps(whole, 0, 2400);
  const half = engine(99); playSteps(half, 0, 1200);
  const str = await half.encodeSave();
  assert.match(str, /^HUAF1R?\./, 'the kit\'s save string, with the game\'s prefix');
  const back = engine(1);   /* a different shift entirely, until the save goes in */
  back.ctx.__now = half.ctx.__now;
  back.applySave(await back.decodeSave(str));
  assert.strictEqual(J(back.packSave()), J(half.packSave()), 'the string carries the whole shift');
  playSteps(back, 1200, 2400);
  assert.strictEqual(J(back.packSave()), J(whole.packSave()), 'the dice came back where they were');
});

test('an old save still loads', async () => {
  // a bare S from before the seed and the prices moved in: no seed, no rng, no cost map, the old stats
  const old = { tasks: 512, tps: 3, mult: 1.1, earned: 900, owned: { spo2: 2, call: 1 }, muted: false, over: false, started: true,
    stats: { clicks: 140, alarms: 12, saves: 0, missed: 1, codes: 0, flubs: 0, maxStreak: 3, meds: 0, deleted: 0 }, src: { clicks: 140 },
    walk: { room: null, left: 0 } };
  const E = engine(5), F = engine(6);
  E.applySave(JSON.parse(J(old))); F.applySave(JSON.parse(J(old)));
  assert.strictEqual(E.S.tasks, 512);
  assert.strictEqual(E.S.stats.realCaught, 0, 'a stat it never had starts at zero, not undefined');
  assert.strictEqual(E.S.seed, F.S.seed, 'the seed is made from the save itself, so it is the same every time');
  assert.strictEqual(E.S.rng.n, 0);
  assert.strictEqual(E.S.cost.spo2, 86, 'two pulse oxes bought: 15, then 36, now 86');
  assert.strictEqual(E.costOf(E.UPG.find(u => u.id === 'call')), 60, 'a single buy keeps its catalog price');
  playSteps(E, 0, 600); playSteps(F, 0, 600);
  assert.strictEqual(J(E.packSave()), J(F.packSave()), 'and it plays on the same from there');
  assert.throws(() => E.applySave({ nonsense: true }), /not a shift/);

  // what survives between shifts: the plain JSON kept until 2026-10-20 still reads, and the new string is the kit's
  const mem = { bestOut: 700, ach: { clockin: 1, rosc: 1 }, chart: 'cobalt', ehr: 'prophet', shifts: 3, vol: { spo2: 0.4 }, scrub: 'teal' };
  assert.deepStrictEqual(J(E.memFromString(J(mem))), J(mem), 'the old form');
  const s = E.memToString(mem);
  assert.ok(s.startsWith('HUAF1R.'), 'the kit\'s plain form: ' + s.slice(0, 12));
  assert.deepStrictEqual(J(E.memFromString(s)), J(mem), 'the new form reads back before the first paint');
  assert.deepStrictEqual(J(await E.AF_CODEC.decode(s)), J(mem), 'and the kit itself reads it');
  assert.strictEqual(E.memFromString(''), null);
});

test('a double tap on "Pick the shift back up" is one lunch, not two', () => {
  // the lunch card takes 450 ms to fade, and a second tap inside it used to resume a shift already resumed
  const E = engine(1018);
  playSteps(E, 0, 300);
  const { S } = E, lunch = E.UPG.find(u => u.id === 'lunch');
  S.over = true; S.lastEndKind = 'lunch';   // what endShift('lunch') leaves behind (page code, outside the block)
  const first = E.dispatchAct('resume'), second = E.dispatchAct('resume');
  assert.strictEqual(first.ok, true);
  assert.strictEqual(first.afterLunch, true);
  assert.strictEqual(second.ok, false, 'the second tap finds the floor already open and counts nothing');
  assert.strictEqual(S.lunchN, 1, 'one lunch taken');
  assert.strictEqual(S.cost.lunch, lunch.cost * 2, 'the next lunch costs double, not the free clock-out a second count made it');
  assert.strictEqual(S.over, false);
  // the page side: the button is spent the moment it is pressed, and the paint skips a refused resume
  const a = PAGE.indexOf('function endShift('), end = PAGE.slice(a, PAGE.indexOf('\n}\n', a));
  assert.match(end, /stay\.addEventListener\('click', \(\)=>\{ stay\.disabled=true; resumeShift\(\); \}\)/);
  assert.match(PAGE, /AFTER\.resume=function\(r\)\{\n  if\(!r\.ok\) return;/);
});

// ── the page wiring, read from the source ──
test('every control the engine owns asks the dispatcher', () => {
  for (const [what, re] of /** @type {[string, RegExp][]} */ ([
    ['the big button', /dispatchAct\('press', \{gold:MEM\.bling==='gold'\}\)/],
    ['the shop', /d\.addEventListener\('click', \(\)=>\{ if\(!d\.classList\.contains\('locked'\)\) dispatchAct\('buy', \{id:u\.id\}\); \}\)/],
    ['the pick-up card', /if\(dispatchAct\('buy', \{id:u\.id\}\)\.ok\)/],
    ['SILENCE', /row\.clr\.addEventListener\('click', \(\)=>dispatchAct\('silence', \{room\}\)\)/],
    ['CHECK', /box\.addEventListener\('click', \(\)=>dispatchAct\('check', \{room\}\)\)/],
    ['a call light', /r\.addEventListener\('click', \(\)=>dispatchAct\('light', \{room:n\}\)\)/],
    ['the pump', /btn\.addEventListener\('click', \(\)=>dispatchAct\('pump', \{ch\}\)\)/],
    ['the chat', /btn\.addEventListener\('click', \(\)=>dispatchAct\('chat'\)\)/],
    ['Silence at the top', /muteBtn\.addEventListener\('click', \(\)=>dispatchAct\('mute'\)\)/],
    ['the code card', /dispatchAct\('dose', \{i\}\)/],
    ['the med card', /dispatchAct\('scan', \{step:b\.dataset\.step\}\)/],
    ['the hand-off report', /dispatchAct\('report', \{done:true\}\)/],
    ['the things on the floor', /el\.addEventListener\('click', \(\)=>dispatchAct\(verb, \{id:el\.dataset\.held\}\)\)/],
  ])) assert.match(PAGE, re, what);
  assert.doesNotMatch(PAGE, /\bu\.buy\(|curCost|\bnamePool\b|\bconst IMQ\b|let clockMin/, 'the old state homes are gone');
});

test('the hook carries the contract', () => {
  const hook = PAGE.slice(PAGE.indexOf('if(window.__UG_TEST) window.__af='));
  for (const k of ['dispatchAct', 'VERBS', 'packSave', 'applySave', 'encodeSave', 'decodeSave', 'get seed()']) assert.ok(hook.includes(k), k);
  assert.match(PAGE, /<script src="\/assets\/js\/hu-rng\.js\?v=\d+"><\/script>/);
  assert.match(PAGE, /<script src="\/assets\/js\/hu-save\.js\?v=\d+"><\/script>/);
});
