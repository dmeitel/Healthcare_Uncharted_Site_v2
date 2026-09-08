/**
 * The Table: multiplayer on the same engine. Two REAL game sandboxes (host + guest) wired
 * through a fake bus that JSON-clones every message, the same serialization discipline as
 * BroadcastChannel/Supabase, so any function leaking into the protocol fails loudly.
 * The invariant that matters: after any intent, the guest's packed run is byte-identical
 * to the host's.
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
      send(m) {
        const wire = JSON.parse(JSON.stringify(m));
        ends.forEach(o => { if (o !== ch && o.room === room && o.cb) o.cb(JSON.parse(JSON.stringify(wire))); });
      },
      onmsg(fn) { ch.cb = fn; },
      close() { ch.cb = null; },
    };
    ends.push(ch);
    return ch;
  };
}

const flush = () => new Promise(r => setTimeout(r, 10));

/** Stand up a host and a guest on one bus, guest seated as Clinical. */
async function makeTable() {
  const bus = makeBus();
  const A = loadGame(), B = loadGame();
  A.ug.setChannelFactory(bus); B.ug.setChannelFactory(bus);
  A.ug.settings.playerName = 'Dave';
  B.ug.settings.playerName = 'Sam';
  A.ug.hostTable();
  assert.strictEqual(A.ug.NET.mode, 'host');
  assert.strictEqual(A.ug.NET.room.length, 4, 'a four-letter table code');
  B.ug.joinTable(A.ug.NET.room, 'Sam');
  await flush();
  assert.ok(A.ug.NET.roster.includes('Sam'), 'the host heard the knock');
  B.ug.claimSeat('clinical');
  await flush();
  assert.strictEqual(A.ug.NET.seats.clinical, 'Sam', 'the host seated the guest');
  assert.strictEqual(B.ug.NET.seat, 'clinical', 'the guest knows their chair');
  return { A, B };
}

const runOf = ug => J(ug.packSave().run);

test('handshake, seats, and a started run reaching every screen', async () => {
  const { A, B } = await makeTable();
  A.ug.netAct('start', { ceo: 'mha' });
  await flush();
  assert.ok(B.ug.run, 'the run appeared on the guest screen');
  assert.strictEqual(runOf(B.ug), runOf(A.ug), 'guest and host hold the identical hospital');
  assert.strictEqual(B.ug.run.ceo, B.ug.CEOS.find(c => c.id === 'mha'), 'catalog identity survives the wire');
});

test('a seated intent lands on the host and echoes back byte-identical', async () => {
  const { A, B } = await makeTable();
  A.ug.netAct('start', { ceo: 'mba' });
  await flush();
  const rnBefore = A.ug.run.departments[0].staff.rn;
  B.ug.netAct('hire', { i: '0', type: 'rn' });          // Clinical's verb, Clinical's seat
  await flush();
  assert.strictEqual(A.ug.run.departments[0].staff.rn, rnBefore + 1, 'the host applied the hire');
  assert.strictEqual(runOf(B.ug), runOf(A.ug), 'the echo kept both screens identical');
  B.ug.netAct('pay', { type: 'rn', value: '1.1' });      // sliders travel as intents too
  await flush();
  assert.strictEqual(A.ug.run.pay.rn, 1.1);
  assert.strictEqual(runOf(B.ug), runOf(A.ug));
});

test('verbs outside your seat do not leave your screen, and forgeries die at the host', async () => {
  const { A, B } = await makeTable();
  A.ug.netAct('start', { ceo: 'mba' });
  await flush();
  B.ug.netAct('borrow', {});                             // Finance's verb: hint, no send
  B.ug.netAct('runq', {});                               // the host's verb: hint, no send
  await flush();
  assert.strictEqual(A.ug.run.debt, 0, 'no borrow reached the host');
  assert.strictEqual(A.ug.run.level, 1, 'no quarter ran');
  B.ug.NET.chan.send({ t: 'intent', name: 'Sam', act: 'borrow', data: {} });   // forged past the client gate
  await flush();
  assert.strictEqual(A.ug.run.debt, 0, 'the host refuses a verb the seat does not own');
});

test('a full quarter: host builds and runs, end screens and drafts sync, host continues', async () => {
  const { A, B } = await makeTable();
  A.ug.netAct('start', { ceo: 'mha' });
  await flush();
  A.ug.netAct('build', { id: 'telehealth' });
  A.ug.netAct('runq');
  await flush();
  assert.strictEqual(A.ug.run.level, 1, 'Q1 cleared, awaiting continue');
  assert.strictEqual(runOf(B.ug), runOf(A.ug), 'the cleared quarter reached the guest');
  assert.strictEqual(B.ug.netEnvelope().ui.kind, 'end', 'the guest sees the outcome screen');
  B.ug.netAct('continue', {});                           // the CEO seat is unclaimed: held by the host
  await flush();
  assert.strictEqual(A.ug.run.level, 1, 'a non-CEO guest cannot advance the table');
  A.ug.netAct('continue', {});
  await flush();
  assert.strictEqual(A.ug.run.level, 2);
  if (A.ug.run.pendingEvent) {
    assert.strictEqual(B.ug.netEnvelope().ui.kind, 'choice', 'a decision quarter reaches the guest overlay');
    const free = A.ug.run.pendingEvent.options.findIndex(o => !o.cost);
    A.ug.netAct('evchoice', { i: String(free) });        // CEO seat is the host's here
    await flush();
  }
  assert.strictEqual(runOf(B.ug), runOf(A.ug), 'level 2 identical on both screens');
});

test('an upgrade draft is rolled once, by the host, and shipped by id', async () => {
  const { A, B } = await makeTable();
  A.ug.netAct('start', { ceo: 'mha' });
  await flush();
  A.ug.netAct('build', { id: 'telehealth' });
  A.ug.netAct('runq');                                   // gives the run a lastResult to report
  await flush();
  A.ug.endScreen({ passed: true, reward: 'small', title: 'QUARTER CLEARED', sub: 'test draft' });
  await flush();
  const aIds = A.ug.netEnvelope().ui.draftIds;
  const bIds = B.ug.netEnvelope().ui.draftIds;
  assert.ok(aIds && aIds.length === 3, 'the host rolled three cards');
  assert.strictEqual(J(bIds), J(aIds), 'the guest sees the SAME cards, never a reroll');
});
