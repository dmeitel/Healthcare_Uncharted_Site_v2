/**
 * Uncharted Regional, the 2026-09-23 round (docs/HU-GAME-REVIEW-2026-09-23.md 3.5): the goal line
 * beside Run, a cause line per goal, Continue after a reload, and a restore that brings the
 * quarter back as dealt instead of re-rolling it. Same strict-DOM harness as
 * tests/uncharted-regional.test.js (hook window.__hs). The kit (HUKit) is not in the sandbox,
 * so the menu, the confirm and the peek are proven by the Playwright walk, not here.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadSystem, J } = require('./helpers/ug');

const dealtOf = hs => J({ kind: hs.sys.goal.kind, target: hs.sys.goal.target, label: hs.sys.goal.label, ev: hs.sys.activeEvent });
const withRemove = evalIn => evalIn('localStorage.removeItem = function(k){ delete this._s[k]; }');   // the harness stub has no removeItem
const storageOf = evalIn => evalIn('JSON.stringify(localStorage._s)');
/** A second page load in the same browser: a fresh sandbox handed the first one's storage. */
function reload(json) {
  const s = loadSystem();
  s.evalIn('localStorage._s = ' + json);
  withRemove(s.evalIn);
  return s;
}

test('a restore reproduces the dealt quarter: same goal, same event, and no dice are rolled', async () => {
  for (const roll of [0.05, 0.3, 0.45, 0.7, 0.95]) {
    const { hs, evalIn } = loadSystem();
    hs.settings.difficulty = 'normal';
    evalIn(`Math.random = () => ${roll}`);
    hs.sys.level = 7;                                   // year two, quarter three: events and every goal kind in play
    hs.startQuarter();
    const dealt = dealtOf(hs);
    const verdict = hs.sys.goal.test(hs.computeSystem(hs.sys, hs.sys.activeEvent));
    const str = await hs.encodeSave(hs.packSave());
    evalIn('Math.random = () => { throw new Error("a restore rolled the dice"); }');
    const seen = new Set();
    for (let i = 0; i < 30; i++) {                      // the review's 30 restores of one position
      hs.dispatchAct('closego', { f: 'crossroads', l: 'mat' });   // wreck something between restores
      hs.applySave(await hs.decodeSave(str));
      seen.add(dealtOf(hs));
      assert.strictEqual(hs.sys.goal.test(hs.computeSystem(hs.sys, hs.sys.activeEvent)), verdict,
        'the rebuilt goal judges the projection the way the dealt one did');
    }
    assert.strictEqual(seen.size, 1, `roll ${roll}: 30 restores, one quarter`);
    assert.strictEqual([...seen][0], dealt, `roll ${roll}: and it is the quarter that was dealt`);
  }
});

test('goalOf rebuilds every goal kind the deal makes, label and test included', () => {
  const { hs, evalIn } = loadSystem();
  hs.settings.difficulty = 'normal';
  hs.sys.level = 7; hs.sys.activeEvent = null;
  const kinds = new Set();
  for (const roll of [0, 0.3, 0.6, 0.99]) {
    evalIn(`Math.random = () => ${roll}`);
    const g = hs.makeSysGoal(), again = hs.goalOf(g.kind, g.target);
    kinds.add(g.kind);
    assert.strictEqual(again.label, g.label, g.kind + ': same words');
    const r = hs.computeSystem(hs.sys, null);
    assert.strictEqual(again.test(r), g.test(r), g.kind + ': same verdict');
  }
  assert.ok(kinds.size >= 3, 'the rolls reached at least three kinds: ' + [...kinds].join(', '));
  assert.strictEqual(hs.goalOf('mystery', 5), null, 'an unknown kind is not a goal');
  assert.strictEqual(hs.goalOf('net', NaN), null, 'nor is a target that is not a number');
});

test('the goal line is the goal\'s own test on the projection, so it calls the quarter exactly', () => {
  /** @type {[string, (hs: any, p: any) => any, RegExp][]} */
  const cases = [
    ['net met',     (hs, p) => hs.goalOf('net', Math.round(p.net) - 10), /^On track: \$\d+k net$/],
    ['net short',    (hs, p) => hs.goalOf('net', Math.round(p.net) + 40), /^Short by \$4\dk$/],
    ['access short', (hs, p) => hs.goalOf('access', Math.round(p.access * 100) + 2), /^Short by 2 points$/],
    ['county short', (hs, p) => hs.goalOf('rural', Math.round(p.zoneAccess.rural * 100) + 1), /^County short by 1 point$/],
    ['lean over',    (hs, p) => hs.goalOf('lean', Math.round((p.salary + p.fixed + p.sharedCost) * 0.985)), /^Over the cap by \$\d+k$/],
    ['broke',        (hs, p) => { hs.sys.cash = -Math.round(p.net) - 10; return hs.goalOf('access', Math.round(p.access * 100)); }, /^Cash ends at -\$\d+k$/],
    ['lean in red',  (hs, p) => { hs.facOf('general').staff += 40; const q = hs.computeSystem(hs.sys, null);
      return hs.goalOf('lean', Math.round(q.salary + q.fixed + q.sharedCost) + 1000); }, /^In the red by \$/],
  ];
  for (const [name, goal, words] of cases) {
    const { hs } = loadSystem();
    hs.sys.level = 2; hs.sys.activeEvent = null;
    hs.sys.goal = goal(hs, hs.computeSystem(hs.sys, null));
    const t = hs.trackOf();
    assert.match(t.txt, words, name + ': ' + t.txt);
    hs.dispatchAct('runq');
    assert.strictEqual(hs.sys.over, !t.ok || t.broke, name + ': the line called the quarter (' + t.txt + ')');
  }
});

test('each goal kind loses with its own cause, and a spend cap is never told to hire', () => {
  const { hs } = loadSystem();
  const r = hs.computeSystem(hs.sys, null);
  const lean = hs.causeOf(hs.goalOf('lean', 1), r);                 // spend over a $1k cap
  const leanRed = hs.causeOf(hs.goalOf('lean', 1e9), Object.assign({}, r, { net: -50 }));
  const lines = [hs.causeOf(hs.goalOf('net', 1), r), hs.causeOf(hs.goalOf('access', 1), r), hs.causeOf(hs.goalOf('rural', 1), r), lean, leanRed];
  assert.strictEqual(new Set(lines).size, lines.length, 'five situations, five lines');
  assert.match(lean, /raise spend/, 'the cap line says what raises spend');
  assert.match(lean, /Group Purchasing/, 'and names the service that lowers it');
  assert.doesNotMatch(lean, /Hiring where|adding a line where|line added where/i, 'it no longer tells a spend-cap loser to hire or add lines');
  assert.match(leanRed, /-\$50k/, 'under the cap but in the red says so, with the number');
  for (const l of lines) assert.ok(!l.includes(String.fromCharCode(0x2014)), 'no em dashes');

  // and the end card carries the lean line when a lean quarter is lost
  const s = loadSystem();
  s.hs.sys.level = 2; s.hs.sys.activeEvent = null;
  const p = s.hs.computeSystem(s.hs.sys, null);
  s.hs.sys.goal = s.hs.goalOf('lean', Math.round((p.salary + p.fixed + p.sharedCost) * 0.985));
  s.hs.dispatchAct('runq');
  assert.ok(s.hs.sys.over, 'the missed cap ends the term');
  assert.match(s.ids['hs-overlay'].innerHTML, /Group Purchasing/, 'the end card explains the cap');
});

test('Region served is colored against an access goal, not a fixed band', () => {
  const { hs, ids } = loadSystem();
  const tile = () => (ids['hs-kpis'].innerHTML.match(/class="hs-kpi (\w*)" data-def="[^"]*"><div class="k-lbl">Region served/) || [])[1];
  const r = hs.computeSystem(hs.sys, hs.sys.activeEvent);
  hs.sys.goal = hs.goalOf('access', Math.round(r.access * 100));
  hs.renderAll();
  assert.strictEqual(tile(), 'good', 'on the bar reads green, even under the old 82% amber line');
  hs.sys.goal = hs.goalOf('access', Math.round(r.access * 100) + 1);
  hs.renderAll();
  assert.strictEqual(tile(), 'warn', 'one point short reads amber, the goal line\'s "short"');
});

test('nothing autosaves until a term is taken: the board behind the start card is not a term', async () => {
  const { hs, evalIn } = loadSystem();
  withRemove(evalIn);
  hs.dispatchAct('staff', { f: 'general', d: '1' });
  await hs.autosave();
  assert.strictEqual(hs.termLive, false);
  assert.strictEqual(hs.autoMeta(), null, 'no Continue from a board nobody took');
});

test('Continue: a live term survives a reload with its quarter as dealt, and a loss forgets it', async () => {
  const { hs, evalIn } = loadSystem();
  withRemove(evalIn);
  hs.settings.difficulty = 'normal';
  hs.dispatchAct('start');
  hs.sys.level = 3; hs.startQuarter();                 // a later quarter, freshly dealt
  hs.dispatchAct('shared', { k: 'gpo' });              // a change after the deal
  await hs.autosave();
  const dealt = dealtOf(hs), cash = hs.sys.cash;
  assert.deepStrictEqual(hs.autoMeta() && hs.autoMeta().level, 3, 'the meta names the quarter');

  const b = reload(storageOf(evalIn));
  b.hs.openStartMenu();
  assert.match(b.ids['hs-overlay'].innerHTML, /data-act="continuerun"[^>]*>Continue your term &middot; Year 1, Quarter&nbsp;3/, 'the start card offers Continue first');
  assert.ok(b.ids['hs-overlay'].innerHTML.indexOf('continuerun') < b.ids['hs-overlay'].innerHTML.indexOf('data-act="start"'), 'Continue comes before a new term');
  b.evalIn('Math.random = () => { throw new Error("Continue rolled the dice"); }');
  await b.hs.continueRun();
  assert.strictEqual(dealtOf(b.hs), dealt, 'the same goal and event came back');
  assert.strictEqual(b.hs.sys.cash, cash);
  assert.strictEqual(b.hs.sys.shared.gpo, true, 'and the change made after the deal');
  assert.strictEqual(b.hs.termLive, true);

  // lose it: insolvency ends the term and the string is gone at once
  b.evalIn('Math.random = () => 0.5');
  b.hs.sys.cash = -99999;
  b.hs.dispatchAct('runq');
  assert.ok(b.hs.sys.over, 'the term ended');
  assert.strictEqual(b.hs.autoMeta(), null, 'forgotten, or a reload would undo the loss');
  await b.hs.autosave();
  assert.strictEqual(b.hs.autoMeta(), null, 'and nothing writes it back');
});

test('a booked quarter continues into the next one, never a replay of the same one', async () => {
  const { hs, evalIn } = loadSystem();
  withRemove(evalIn);
  hs.settings.difficulty = 'easy';
  evalIn('Math.random = () => 0');                     // quarter one on Easy: a net goal standing pat clears
  hs.dispatchAct('start');
  hs.dispatchAct('runq');
  assert.strictEqual(hs.sys.over, false, 'cleared');
  assert.strictEqual(hs.sys.cleared, true, 'and booked');
  await hs.autosave();
  assert.strictEqual(hs.autoMeta().level, 2, 'Continue will name the next quarter');
  const cash = hs.sys.cash;

  const b = reload(storageOf(evalIn));
  await b.hs.continueRun();
  assert.strictEqual(b.hs.sys.level, 2, 'the next quarter');
  assert.strictEqual(b.hs.sys.cleared, false);
  assert.strictEqual(b.hs.sys.stats.q, 1, 'quarter one was not run a second time');
  assert.strictEqual(b.hs.sys.cash, cash, 'nor paid twice');
  assert.ok(b.hs.sys.goal && b.hs.sys.goal.label, 'a goal is dealt for it');
});

test('the payer table survives a reload with the same odds, and the choice is not a do-over', async () => {
  const { hs, evalIn } = loadSystem();
  withRemove(evalIn);
  hs.settings.difficulty = 'easy'; hs.settings.years = 3;
  hs.dispatchAct('start');
  hs.sys.level = 4; hs.sys.activeEvent = null;        // the board review
  hs.sys.goal = hs.goalOf('net', -99999);
  hs.dispatchAct('runq');
  const winP = hs.sys.pendingNeg && hs.sys.pendingNeg.winP;
  assert.ok(winP > 0.3, 'the payer is at the table');
  await hs.autosave();
  assert.strictEqual(hs.autoMeta().level, 4);

  const b = reload(storageOf(evalIn));
  await b.hs.continueRun();
  assert.strictEqual(b.hs.sys.pendingNeg.winP, winP, 'the same odds');
  assert.match(b.ids['hs-overlay'].innerHTML, /Payer Renewal/, 'the table is set again');
  assert.strictEqual(b.hs.sys.stats.q, 1, 'the board review was not run again');

  // choose, then reload: the result is booked, so the next load is next year, not another try
  b.evalIn('Math.random = () => 0.99');                // hardball loses
  const rate = b.hs.sys.rateComm;
  b.hs.dispatchAct('neg', { i: '2' });
  assert.ok(b.hs.sys.rateComm < rate, 'hardball lost');
  await b.hs.autosave();
  const c = reload(storageOf(b.evalIn));
  await c.hs.continueRun();
  assert.strictEqual(c.hs.sys.level, 5, 'year two, quarter one');
  assert.strictEqual(c.hs.sys.rateComm, b.hs.sys.rateComm, 'the lost rate stuck');
  assert.strictEqual(c.hs.sys.pendingNeg, null);
});

test('forgetRun clears the string, which is what the menu\'s Restart calls', async () => {
  const { hs, evalIn } = loadSystem();
  withRemove(evalIn);
  hs.dispatchAct('start');
  await hs.autosave();
  assert.ok(hs.autoMeta(), 'saved');
  hs.forgetRun();
  assert.strictEqual(hs.autoMeta(), null, 'forgotten');
});
