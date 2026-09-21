/**
 * The Table survives a reload. Audited 2026-09-20 against the live relay: a guest who reloaded
 * could get back in by retyping the code, but a host who reloaded killed the table for everyone.
 * Now the host's tab remembers the code and the last broadcast state, the guest's tab remembers
 * the code and the name, and the start menu offers to resume or rejoin.
 *
 * A "reload" here is a fresh sandbox handed the old sandbox's localStorage, with the old
 * sandbox's channel closed so it can no longer answer (which is what a closed socket does).
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
const runOf = ug => J(ug.packSave().run);
const storeOf = g => JSON.parse(J(g.evalIn('localStorage._s')));
/** a fresh page that opens with the old page's storage, the way a reload does */
function reloadOf(old, bus, name) {
  const fresh = loadGame();
  fresh.evalIn('localStorage._s = ' + J(storeOf(old)));
  fresh.ug.setChannelFactory(bus);
  fresh.ug.settings.playerName = name;
  return fresh;
}

async function makeTable() {
  const bus = makeBus();
  const A = loadGame(), B = loadGame();
  A.ug.setChannelFactory(bus); B.ug.setChannelFactory(bus);
  A.ug.settings.playerName = 'Dave';
  B.ug.settings.playerName = 'Sam';
  A.ug.hostTable();
  B.ug.joinTable(A.ug.NET.room, 'Sam');
  await flush();
  B.ug.claimSeat('clinical');
  await flush();
  A.ug.netAct('start', { ceo: 'mha' });
  await flush();
  B.ug.netAct('hire', { i: '0', type: 'rn' });
  await flush();
  assert.strictEqual(runOf(B.ug), runOf(A.ug), 'the table is up and in sync before any reload');
  return { A, B, bus };
}

test('the host tab remembers the table after every broadcast, and forgets it on close', async () => {
  const { A } = await makeTable();
  const memo = A.ug.tableMemo.get('ug_table_host');
  assert.ok(memo && memo.room === A.ug.NET.room, 'the code is remembered');
  assert.ok(memo.env && memo.env.save, 'the last broadcast state is remembered');
  assert.strictEqual(memo.env.seats.clinical, 'Sam', 'the seats are remembered');
  A.ug.leaveTable();
  assert.strictEqual(A.ug.tableMemo.get('ug_table_host'), null, 'closing the table forgets it');
});

test('a host who reloads resumes the same table, and the guest picks the state straight back up', async () => {
  const { A, B, bus } = await makeTable();
  const room = A.ug.NET.room, before = runOf(A.ug);
  A.ug.NET.chan.close();                                    // the old tab is gone
  const C = reloadOf(A, bus, 'Dave');
  assert.strictEqual(C.ug.NET.mode, null, 'a fresh page is at no table');
  assert.ok(C.ug.resumeTable(), 'resume is offered and taken');
  await flush();
  assert.strictEqual(C.ug.NET.mode, 'host');
  assert.strictEqual(C.ug.NET.room, room, 'the SAME code, so guests on it need do nothing');
  assert.strictEqual(C.ug.NET.seats.clinical, 'Sam', 'the seats came back');
  assert.ok(C.ug.NET.roster.includes('Dave') && C.ug.NET.roster.includes('Sam'), 'the roster came back');
  assert.strictEqual(runOf(C.ug), before, 'the run came back byte for byte');
  assert.strictEqual(runOf(B.ug), runOf(C.ug), 'the guest received the resumed state');
  const rn = C.ug.run.departments[0].staff.rn;
  B.ug.netAct('hire', { i: '0', type: 'rn' });              // the guest plays on
  await flush();
  assert.strictEqual(C.ug.run.departments[0].staff.rn, rn + 1, 'the resumed host applies the guest\'s next move');
  assert.strictEqual(runOf(B.ug), runOf(C.ug), 'and both screens stay identical');
});

test('a guest who reloads rejoins with one tap and gets their seat back', async () => {
  const { A, B, bus } = await makeTable();
  B.ug.NET.chan.close();
  const D = reloadOf(B, bus, 'Sam');
  const memo = D.ug.tableMemo.get('ug_table_guest');
  assert.ok(memo && memo.room === A.ug.NET.room && memo.name === 'Sam', 'the code and the name are remembered');
  assert.ok(D.ug.rejoinTable(), 'rejoin is offered and taken');
  await flush();
  assert.ok(D.ug.run, 'the run arrived');
  assert.strictEqual(D.ug.NET.seat, 'clinical', 'the seat came back without re-claiming');
  assert.strictEqual(runOf(D.ug), runOf(A.ug));
  D.ug.leaveTable();
  assert.strictEqual(D.ug.tableMemo.get('ug_table_guest'), null, 'leaving a live table forgets it');
});

test('the start menu offers resume and rejoin only while a record is fresh', async () => {
  const { A, B } = await makeTable();
  const C = reloadOf(A, makeBus(), 'Dave');
  C.ug.openStartMenu();
  const html = C.ids['ug-overlay'].innerHTML;
  assert.ok(html.includes('data-act="tableresume"'), 'the host tab offers to resume');
  assert.ok(html.includes('Resume table ' + A.ug.NET.room), 'and names the table');
  const D = reloadOf(B, makeBus(), 'Sam');
  D.ug.openStartMenu();
  assert.ok(D.ids['ug-overlay'].innerHTML.includes('data-act="tablerejoin"'), 'the guest tab offers to rejoin');
  const stale = reloadOf(A, makeBus(), 'Dave');
  const old = stale.ug.tableMemo.get('ug_table_host'); old.at = Date.now() - 13 * 3600 * 1000;
  stale.ug.tableMemo.set('ug_table_host', old);
  stale.ug.openStartMenu();
  assert.ok(!stale.ids['ug-overlay'].innerHTML.includes('tableresume'), 'a thirteen-hour-old table is not offered');
  assert.strictEqual(stale.ug.resumeTable(), false, 'and cannot be resumed');
});

test('a guest name with markup in it cannot break the menu', async () => {
  const { B } = await makeTable();
  B.ug.leaveTable();                                        // leaving a live table forgets it, so plant the record after
  B.ug.tableMemo.set('ug_table_guest', { room: 'ABCD', name: '<img src=x onerror=1>', at: Date.now() });
  B.ug.openStartMenu();
  const html = B.ids['ug-overlay'].innerHTML;
  assert.ok(!html.includes('<img'), 'the name is escaped');
  assert.ok(html.includes('&lt;img'), 'and still shown');
});
