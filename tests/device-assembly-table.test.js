/**
 * Two walls: Device Assembly on the shared table kit. A host and a guest race the same wall; each
 * wall stays local, the snapshots cross the wire after every change, and a submit is judged by
 * the host with the real engine. Two real page sandboxes on a fake bus that JSON-clones every
 * message, the same discipline as the hospital game's table tests.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const PAGE = path.join(__dirname, '..', 'src', 'secret-menu', 'device-assembly', 'index.html');
  const html = fs.readFileSync(PAGE, 'utf8');
  const open = html.indexOf('<script>'), close = html.lastIndexOf('</script>');
  const src = html.slice(open + '<script>'.length, close);
  const ctx = {
    document: { getElementById: () => null, addEventListener() {}, readyState: 'complete' },
    window: { __UG_TEST: true, addEventListener() {}, innerWidth: 1200, innerHeight: 800 },
    navigator: {}, console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); } },
    Date,
  };
  vm.createContext(ctx);
  new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-table.js'), 'utf8'), { filename: 'hu-table.js' }).runInContext(ctx);
  new vm.Script(src, { filename: 'device-assembly.js' }).runInContext(ctx);
  assert.ok(ctx.window.__da, 'engine hook exported');
  return ctx.window.__da;
}
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
const flush = (ms = 15) => new Promise(r => setTimeout(r, ms));

/** the first tutorial's working build: the cannula at the nose, its lead on the source's barb */
function solveT1(da, S) {
  const nose = da.GRID.nose;
  const can = da.place(S, 'cannula', nose[0], nose[1], 0).item;
  da.autoOrient(S, can.uid);
  const src = S.items.find(i => i.def.id === 'src-t1');
  const barb = da.portsOf(src).find(p => p.std === 'barb');
  const r = da.connectPorts(S, { uid: can.uid, pi: 'lead' }, { uid: src.uid, pi: barb.pi }, null);
  assert.ok(r.ok, r.why);
  return can;
}

async function makeTable() {
  const bus = makeBus();
  const A = load(), B = load();
  A.setChannelFactory(bus); B.setChannelFactory(bus);
  A.setRaceName('Dave'); B.setRaceName('Sam');
  assert.ok(A.T.host(), 'the host opened a table');
  assert.strictEqual(A.NET.room.length, 4, 'a four-letter code');
  assert.ok(B.T.join(A.NET.room, 'Sam'), 'the guest knocked');
  await flush();
  assert.ok(A.NET.roster.includes('Sam'), 'the host heard the knock');
  assert.strictEqual(A.NET.seats.b, 'Sam', 'the guest was seated at Wall B on the way in');
  assert.strictEqual(B.NET.seat, 'b', 'and knows it');
  return { A, B, bus };
}

test('the host picks a wall and the guest opens the same one', async () => {
  const { A, B } = await makeTable();
  A.start('t1');
  assert.ok(A.raceStart('t1'), 'the race is on');
  await flush();
  assert.strictEqual(B.race().level, 't1', 'the guest knows the wall');
  assert.ok(B.S && B.S.level.id === 't1', 'and opened it');
  assert.strictEqual(B.S.items.filter(i => !i.fixed).length, 0, 'clean start');
  A.start('t2'); A.raceStart('t2');
  await flush();
  assert.strictEqual(B.S.level.id, 't2', 'a new pick follows too');
});

test('every change crosses the wire byte for byte, both ways', async () => {
  const { A, B } = await makeTable();
  A.start('t1'); A.raceStart('t1'); await flush();
  solveT1(B, B.S);
  B.netSync(); await flush(30);
  assert.strictEqual(A.otherWall(), B.snapshot(B.S), 'the host holds the guest wall exactly');
  assert.strictEqual(B.otherWall(), A.snapshot(A.S), 'the guest holds the host wall exactly');
  const nose = A.GRID.nose;
  A.place(A.S, 'cannula', nose[0], nose[1], 0);
  A.netSync(); await flush(30);
  assert.strictEqual(B.otherWall(), A.snapshot(A.S), 'the host\'s own change reached the guest');
});

test('the first working build wins, once, and the host judges it with the real engine', async () => {
  const { A, B } = await makeTable();
  A.start('t1'); A.raceStart('t1'); await flush();
  // an empty wall submitted early does not win: the host runs the function test itself
  B.T.act('submit', { snap: B.snapshot(B.S) }); await flush(30);
  assert.strictEqual(A.race().winner, null, 'nothing works yet, nobody wins');
  solveT1(B, B.S);
  const t = B.functionTest(B.S);
  assert.ok(t.ok, 'the guest wall works');
  B.raceSubmit(t); await flush(30);
  assert.strictEqual(A.race().winner, 'Sam', 'the host recorded the guest as first');
  assert.strictEqual(B.race().winner, 'Sam', 'and the guest heard it');
  solveT1(A, A.S);
  A.raceSubmit(A.functionTest(A.S)); await flush(30);
  assert.strictEqual(A.race().winner, 'Sam', 'the host finishing later does not take it back');
  assert.strictEqual(B.race().winner, 'Sam');
});

test('a forged submit from someone not in the chair is refused', async () => {
  const { A, B, bus } = await makeTable();
  A.start('t1'); A.raceStart('t1'); await flush();
  const C = load(); C.setChannelFactory(bus); C.setRaceName('Mallory');
  C.T.join(A.NET.room, 'Mallory'); await flush();
  const S = C.S || C.start('t1');
  solveT1(C, S);
  C.T.act('submit', { snap: C.snapshot(S) }); await flush(30);
  assert.notStrictEqual(A.race().winner, 'Mallory', 'the chair was Sam\'s; Mallory\'s submit died at the host');
});

test('leaving the table forgets the race, and the host tab can resume it', async () => {
  const { A, B, bus } = await makeTable();
  A.start('t1'); A.raceStart('t1'); await flush();
  solveT1(B, B.S); B.netSync(); await flush(30);
  B.raceLeave();
  assert.strictEqual(B.NET.mode, null);
  assert.strictEqual(B.race().level, null, 'the guest forgot the race');
  // the host tab dies and comes back on the same storage
  const memo = A.T.memo.get('da_table_host');
  assert.ok(memo && memo.room === A.NET.room && memo.env.save.race.level === 't1', 'the host tab remembered the race');
  A.NET.chan.close();
  const A2 = load(); A2.setChannelFactory(bus); A2.setRaceName('Dave');
  A2.T.memo.set('da_table_host', JSON.parse(JSON.stringify(memo)));
  assert.ok(A2.T.resume(), 'resumed');
  assert.strictEqual(A2.NET.room, memo.room, 'the same code');
  assert.strictEqual(A2.race().level, 't1', 'the same race');
  assert.strictEqual(A2.snapshot(A2.S), memo.env.save.a, 'the host wall came back');
});
