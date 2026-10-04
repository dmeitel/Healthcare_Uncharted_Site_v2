/**
 * The race: Device Assembly on the shared table kit (Stage A6, 2026-10-04; it grew out of the two-wall race of
 * 2026-09-20). A host opens a room, people join with the code, the host starts the race, and everyone builds the same
 * wall on their own device. What crosses the wire is each builder's count and wall; a finished build is judged by the
 * host with the real engine, and places go in the order builds pass. Bots race at a pace drawn from the wall's par.
 * Real page sandboxes on a fake bus that JSON-clones every message, the same discipline as the other table tests.
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
    localStorage: { _s: {}, getItem(k) { return this._s[k] || null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } },
    Date, Intl,
  };
  vm.createContext(ctx);
  for (const f of ['hu-table.js', 'hu-rng.js']) new vm.Script(fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', f), 'utf8'), { filename: f }).runInContext(ctx);
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
const flush = (ms = 20) => new Promise(r => setTimeout(r, ms));
const plain = x => JSON.parse(JSON.stringify(x));   // values from the page's sandbox compare only as plain data

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

/** a host and two guests in one room, on the first tutorial, with the given number of bots */
async function makeRoom(bots = 0) {
  const bus = makeBus();
  const A = load(), B = load(), C = load();
  [A, B, C].forEach(x => x.setChannelFactory(bus));
  A.setRaceName('Dave'); B.setRaceName('Sam'); C.setRaceName('Ana');
  assert.ok(A.raceHostRoom(), 'the host opened a room');
  assert.strictEqual(A.NET.room.length, 4, 'a four-letter code');
  assert.strictEqual(A.NET.seat, 'p1', 'the host takes the first chair');
  A.race().prefs = { wall: 't1', bots };
  assert.ok(B.T.join(A.NET.room, 'Sam')); await flush();
  assert.ok(C.T.join(A.NET.room, 'Ana')); await flush(40);
  assert.deepStrictEqual([A.NET.seats.p1, A.NET.seats.p2, A.NET.seats.p3], ['Dave', 'Sam', 'Ana'], 'each new name takes the next chair');
  assert.strictEqual(B.NET.seat, 'p2'); assert.strictEqual(C.NET.seat, 'p3');
  return { A, B, C, bus };
}
const deal = async (A) => { A.raceStart('t1'); await flush(40); };

test('the room: people join with the code, and the lobby lists everyone before the race starts', async () => {
  const { A, B, C } = await makeRoom(2);
  assert.strictEqual(A.race().started, 0, 'still the lobby');
  assert.deepStrictEqual(plain(Object.values(A.race().runners).map(u => u.name)), ['Dave', 'Sam', 'Ana'], 'the host lists the three people');
  assert.deepStrictEqual(plain(Object.values(C.race().runners).map(u => u.name)), ['Dave', 'Sam', 'Ana'], 'and so does a guest');
  assert.strictEqual(B.race().prefs.bots, 2, 'the guests see the settings');
});

test('the host starts it: everyone opens the same wall from a clean start, with the bots in the race', async () => {
  const { A, B, C } = await makeRoom(2);
  await deal(A);
  for (const x of [A, B, C]) {
    assert.strictEqual(x.race().level, 't1', 'the same wall');
    assert.ok(x.race().started > 0, 'the clock is running');
    assert.ok(x.S && x.S.level.id === 't1' && x.S.items.filter(i => !i.fixed).length === 0, 'a clean wall');
  }
  assert.deepStrictEqual(plain(Object.keys(A.race().runners).sort()), ['bot1', 'bot2', 'p1', 'p2', 'p3'], 'three people and two bots');
});

test('a builder\'s count and wall reach the host and everyone else', async () => {
  const { A, B, C } = await makeRoom();
  await deal(A);
  solveT1(B, B.S); B.S.tests = [false];
  B.netSync(); await flush(40);
  const u = A.race().runners.p2;
  assert.strictEqual(u.parts, 1, 'one part on Sam\'s wall');
  assert.strictEqual(u.fails, 1, 'and one failed test');
  assert.strictEqual(A.race().walls.p2, B.snapshot(B.S), 'the host holds Sam\'s wall exactly, for a ghost');
  assert.strictEqual(C.race().runners.p2.parts, 1, 'Ana sees Sam\'s count');
  A.raceGhost = 'p2';
  assert.strictEqual(A.raceGhostSnap(), B.snapshot(B.S), 'and the host can watch it as a ghost');
});

test('the host judges every finished build with the real engine, and places go in the order builds pass', async () => {
  const { A, B, C } = await makeRoom();
  await deal(A);
  // an empty wall sent as finished does not place
  B.T.act('submit', { snap: B.snapshot(B.S) }); await flush(40);
  assert.deepStrictEqual(plain(A.race().places), [], 'nothing works yet, nobody places');
  solveT1(C, C.S);
  const t = C.functionTest(C.S); assert.ok(t.ok);
  C.raceSubmit(t); await flush(40);
  assert.deepStrictEqual(plain(A.race().places), ['p3'], 'Ana first');
  solveT1(B, B.S); B.raceSubmit(B.functionTest(B.S)); await flush(40);
  solveT1(A, A.S); A.raceSubmit(A.functionTest(A.S)); await flush(40);
  assert.deepStrictEqual(plain(A.race().places), ['p3', 'p2', 'p1'], 'then Sam, then the host');
  assert.deepStrictEqual(plain(B.race().places), ['p3', 'p2', 'p1'], 'everyone has the same standings');
  C.raceSubmit(t); await flush(40);
  assert.deepStrictEqual(plain(A.race().places), ['p3', 'p2', 'p1'], 'finishing again changes nothing');
  assert.deepStrictEqual(plain(A.raceStandings(A.race()).map(x => x.name)), ['Ana', 'Sam', 'Dave']);
});

test('a builder can only finish for their own chair: the kit stamps every message with the sender\'s seat', async () => {
  const { A, B } = await makeRoom();
  await deal(A);
  solveT1(B, B.S);
  B.T.act('submit', { snap: B.snapshot(B.S), seat: 'p3' }); await flush(40);
  assert.deepStrictEqual(plain(A.race().places), ['p2'], 'Sam\'s build placed Sam, not Ana');
  assert.strictEqual(A.race().runners.p3.done, null);
});

test('bots race at a pace drawn from par: same seed, same race; they finish in order of pace and place among the people', () => {
  const da = load();
  const r1 = da.raceNew('t1', [{ seat: 'me', name: 'Dave' }], 5, 42), r2 = da.raceNew('t1', [{ seat: 'me', name: 'Dave' }], 5, 42);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r1)), JSON.parse(JSON.stringify(r2)), 'the seed is the race');
  da.raceGo(r1, 1000);
  const t1 = da.LEVELS.find(l => l.id === 't1');
  for (let t = 1000; t < 1000 + t1.par.time * 3000; t += 500) da.raceTick(r1, t);
  assert.strictEqual(r1.places.length, 5, 'every bot finished');
  const durs = r1.places.map(s => r1.runners[s].done);
  assert.deepStrictEqual(durs, durs.slice().sort((a, b) => a - b), 'in the order of their times');
  for (const s of r1.places) assert.strictEqual(r1.runners[s].parts, t1.par.comp, s + ' built par');
  // a person who passes before the slowest bot places ahead of it
  const T0 = 5000, r3 = da.raceGo(da.raceNew('t1', [{ seat: 'me', name: 'Dave' }], 2, 7), T0);
  const slow = Math.max(r3.runners.bot1.dur, r3.runners.bot2.dur);
  const S = da.newState(t1); solveT1(da, S);
  assert.ok(da.raceJudge(r3, 'me', da.snapshot(S), T0 + slow - 1).ok);
  for (let t = T0; t <= T0 + slow; t += 250) da.raceTick(r3, t);
  assert.ok(r3.places.indexOf('me') < r3.places.length - 1, 'ahead of the slowest bot');
});

test('a solo race against bots: the wall opens, the bots move, and your passing build takes its place', () => {
  const da = load();
  const r = da.raceBotsStart({ wall: 't1', bots: 3 });
  assert.strictEqual(da.raceSolo, true);
  assert.strictEqual(da.S.level.id, 't1');
  assert.deepStrictEqual(plain(Object.keys(r.runners).sort()), ['bot1', 'bot2', 'bot3', 'me']);
  solveT1(da, da.S);
  da.raceSubmit(da.functionTest(da.S));
  assert.deepStrictEqual(plain(r.places), ['me'], 'you passed first');
  da.raceLeave();
  assert.strictEqual(da.race(), null); assert.strictEqual(da.raceSolo, false);
});

test('a big room sends counts, not walls: past four builders the walls stay home', () => {
  const da = load();
  const people = ['Dave', 'Sam', 'Ana', 'Lee', 'Kai'].map((n, i) => ({ seat: 'p' + (i + 1), name: n }));
  const r = da.raceGo(da.raceNew('t1', people, 0, 1), 0);
  r.walls.p2 = '{"items":[]}';
  assert.deepStrictEqual(plain(da.racePack(r).walls), {}, 'five builders: no walls on the wire');
  const small = da.raceGo(da.raceNew('t1', people.slice(0, 3), 2, 1), 0); small.walls.p2 = 'x';
  assert.strictEqual(da.racePack(small).walls.p2, 'x', 'three builders and bots: walls travel');
});

test('leaving forgets the race, and the host tab can resume it', async () => {
  const { A, B, bus } = await makeRoom();
  await deal(A);
  solveT1(A, A.S); A.netSync(); await flush(40);
  B.raceLeave();
  assert.strictEqual(B.NET.mode, null);
  assert.strictEqual(B.race(), null, 'the guest forgot the race');
  const memo = A.T.memo.get('da_table_host');
  assert.ok(memo && memo.room === A.NET.room && memo.env.save.race.level === 't1', 'the host tab remembered the race');
  A.NET.chan.close();
  const A2 = load(); A2.setChannelFactory(bus); A2.setRaceName('Dave');
  A2.T.memo.set('da_table_host', JSON.parse(JSON.stringify(memo)));
  assert.ok(A2.T.resume(), 'resumed');
  assert.strictEqual(A2.NET.room, memo.room, 'the same code');
  assert.strictEqual(A2.race().level, 't1', 'the same race');
  assert.strictEqual(A2.snapshot(A2.S), memo.env.save.race.walls.p1, 'the host wall came back');
});
