/**
 * The GM console and offer cards (design doc section 9, the v3 pieces). A host plays a card; the
 * CEO seat accepts or declines; a contract needs Finance to countersign; an offer nobody answers
 * lapses when the quarter runs; a sealed deal is judged every quarter and pays out or breaks.
 * Two guests in two chairs on the fake bus, so the coordination the table is for is what is tested.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { loadGame, J } = require('./helpers/ug');

function makeBus() {
  const ends = [];
  return function factory(room) {
    const ch = {
      room, cb: null,
      send(m) { const wire = JSON.parse(JSON.stringify(m)); ends.forEach(o => { if (o !== ch && o.room === room && o.cb) o.cb(JSON.parse(JSON.stringify(wire))); }); },
      onmsg(fn) { ch.cb = fn; },
      close() { ch.cb = null; },
    };
    ends.push(ch);
    return ch;
  };
}
const flush = () => new Promise(r => setTimeout(r, 10));
const runOf = ug => J(ug.packSave().run);

/** a host with a CEO and a Finance guest, run started */
async function makeTable() {
  const bus = makeBus();
  const A = loadGame(), B = loadGame(), C = loadGame();
  for (const g of [A, B, C]) g.ug.setChannelFactory(bus);
  A.ug.settings.playerName = 'Dave'; B.ug.settings.playerName = 'Sam'; C.ug.settings.playerName = 'Pat';
  A.ug.hostTable();
  B.ug.joinTable(A.ug.NET.room, 'Sam'); C.ug.joinTable(A.ug.NET.room, 'Pat');
  await flush();
  B.ug.claimSeat('ceo'); C.ug.claimSeat('finance');
  await flush();
  assert.strictEqual(A.ug.NET.seats.ceo, 'Sam'); assert.strictEqual(A.ug.NET.seats.finance, 'Pat');
  A.ug.netAct('start', { ceo: 'mha' });
  await flush();
  assert.ok(B.ug.run && C.ug.run, 'the run reached both guests');
  return { A, B, C };
}

test('only the host can put a card on the table, and every seat sees it', async () => {
  const { A, B, C } = await makeTable();
  B.ug.netAct('gmplay', { id: 'payer5' });
  await flush();
  assert.strictEqual(A.ug.run.offer, null, 'a guest cannot play the GM');
  A.ug.netAct('gmplay', { id: 'payer5' });
  await flush();
  assert.strictEqual(A.ug.run.offer.id, 'payer5');
  assert.strictEqual(B.ug.run.offer.id, 'payer5', 'the CEO sees it');
  assert.strictEqual(C.ug.run.offer.id, 'payer5', 'Finance sees it');
  assert.strictEqual(A.ug.playOffer('state300'), false, 'one card on the table at a time');
});

test('a contract needs the CEO and then Finance; the wrong chair cannot sign', async () => {
  const { A, B, C } = await makeTable();
  A.ug.netAct('gmplay', { id: 'payer5' }); await flush();
  C.ug.netAct('offeracc'); await flush();
  assert.strictEqual(A.ug.run.offer.status, 'open', 'Finance cannot accept for the CEO');
  C.ug.netAct('offersign'); await flush();
  assert.strictEqual(A.ug.run.offer.status, 'open', 'and cannot countersign before the CEO has agreed');
  B.ug.netAct('offeracc'); await flush();
  assert.strictEqual(A.ug.run.offer.status, 'ceo', 'the CEO agreed; the pen is with Finance');
  assert.strictEqual(C.ug.run.offer.status, 'ceo', 'Finance sees that');
  B.ug.netAct('offersign'); await flush();
  assert.strictEqual(A.ug.run.offer.status, 'ceo', 'the CEO cannot countersign for Finance');
  C.ug.netAct('offersign'); await flush();
  assert.strictEqual(A.ug.run.offer, null, 'sealed');
  assert.strictEqual(A.ug.run.deals.length, 1);
  assert.strictEqual(A.ug.run.deals[0].kind, 'payer');
  assert.strictEqual(runOf(B.ug), runOf(A.ug)); assert.strictEqual(runOf(C.ug), runOf(A.ug));
});

test('the CEO can decline alone, and a community promise needs no countersign', async () => {
  const { A, B } = await makeTable();
  A.ug.netAct('gmplay', { id: 'state300' }); await flush();
  B.ug.netAct('offerdec'); await flush();
  assert.strictEqual(A.ug.run.offer, null, 'declined');
  assert.strictEqual(A.ug.run.deals.length, 0);
  const rep = A.ug.run.reputation;
  A.ug.netAct('gmplay', { id: 'community' }); await flush();
  B.ug.netAct('offeracc'); await flush();
  assert.strictEqual(A.ug.run.offer, null, 'sealed by the CEO alone');
  assert.strictEqual(A.ug.run.reputation, Math.min(100, rep + 4), 'the reputation landed');
  assert.strictEqual(A.ug.run.deals[0].kind, 'community');
});

test('an offer nobody answers lapses when the quarter runs', async () => {
  const { A } = await makeTable();
  A.ug.playOffer('payer5');
  A.ug.judgeDeals({ service: 1 });
  assert.strictEqual(A.ug.run.offer, null);
  assert.ok(A.ug.run.dealNotes.some(n => /lapsed/.test(n)), 'and says so');
});

test('the payer deal switches on after two straight quarters at 90%, then rides revenue for four', () => {
  const { ug } = loadGame();
  ug.initRun(); ug.pickCeo(ug.CEOS[1]);
  ug.playOffer('payer5'); ug.acceptOffer(); ug.signOffer();
  const d = ug.run.deals[0];
  assert.strictEqual(ug.dealRevMult(ug.run), 1, 'nothing yet');
  ug.judgeDeals({ service: 0.95 }); assert.strictEqual(d.streak, 1); assert.strictEqual(d.active, false);
  ug.judgeDeals({ service: 0.80 });
  assert.strictEqual(ug.run.deals.length, 0, 'a miss before it switched on lapses the deal');
  ug.playOffer('payer5'); ug.acceptOffer(); ug.signOffer();
  ug.judgeDeals({ service: 0.95 }); ug.judgeDeals({ service: 0.92 });
  const e = ug.run.deals[0];
  assert.strictEqual(e.active, true, 'two straight quarters switched it on');
  assert.strictEqual(ug.dealRevMult(ug.run), 1.05, 'and revenue feels it');
  const base = ug.computeQuarter(ug.run, null).revenue;
  ug.run.deals = [];
  const without = ug.computeQuarter(ug.run, null).revenue;
  assert.ok(Math.abs(base / without - 1.05) < 1e-9, 'computeQuarter applies the rate: ' + (base / without));
});

test('state money with strings: repaid with a headline when the strings break, clean when met', () => {
  const { ug } = loadGame();
  ug.initRun(); ug.pickCeo(ug.CEOS[1]);
  const cash = ug.run.cash, rep = ug.run.reputation;
  ug.playOffer('state300'); ug.acceptOffer(); ug.signOffer();
  assert.strictEqual(ug.run.cash, cash + 300, 'the money arrived');
  ug.judgeDeals({ service: 0.5 });
  assert.strictEqual(ug.run.cash, cash + 300 - 360, 'repaid with a penalty');
  assert.strictEqual(ug.run.reputation, Math.max(0, rep - 3));
  assert.strictEqual(ug.run.deals.length, 0);
  const cash2 = ug.run.cash;
  ug.playOffer('state300'); ug.acceptOffer(); ug.signOffer();
  ug.judgeDeals({ service: 0.9 }); ug.judgeDeals({ service: 0.9 });
  assert.strictEqual(ug.run.deals[0].left, 1, 'two clean quarters, one to go');
  ug.judgeDeals({ service: 0.9 });
  assert.strictEqual(ug.run.deals.length, 0, 'strings met, the state moves on');
  assert.strictEqual(ug.run.cash, cash2 + 300, 'and the money stayed');
});

test('offers and deals ride the save string', async () => {
  const { ug } = loadGame();
  ug.initRun(); ug.pickCeo(ug.CEOS[1]);
  ug.playOffer('community'); ug.acceptOffer();
  ug.playOffer('payer5');
  const packed = ug.packSave();
  assert.strictEqual(packed.run.offer.id, 'payer5'); assert.strictEqual(packed.run.deals[0].kind, 'community');
  const B = loadGame();
  B.ug.applySave(await B.ug.decodeSave(await ug.encodeSave(packed)));
  assert.strictEqual(B.ug.run.offer.id, 'payer5'); assert.strictEqual(B.ug.run.deals[0].kind, 'community');
  const old = ug.packSave(); delete old.run.offer; delete old.run.deals; delete old.run.dealNotes;
  const C = loadGame(); C.ug.applySave(old);
  assert.strictEqual(C.ug.run.offer, null); assert.strictEqual(J(C.ug.run.deals), '[]', 'an older string loads with no deals');
});
