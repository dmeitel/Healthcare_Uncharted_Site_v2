/**
 * hu-qr.js: the QR code Vital Stats puts on a big screen so phones can join a room.
 * The contract: the fixed patterns sit where a scanner looks for them, the format bits name
 * level M and the chosen mask with a valid check code, the smallest version that fits is used,
 * and text past version 10 gives null instead of a broken code.
 *
 * The fingerprints below were taken on 2026-10-01 after the encoder's output decoded with
 * jsQR (an independent decoder, run in a scratch folder, not a dependency of this site) for 338
 * strings covering versions 1 to 10 and all eight masks. A changed fingerprint means the code a
 * phone scans changed: decode it again before updating the number.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadKit() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-qr.js'), 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  new vm.Script(src, { filename: 'hu-qr.js' }).runInContext(ctx);
  assert.ok(ctx.window.HUQR, 'the kit hangs off window');
  return ctx.window.HUQR;
}
/* the game's address since it moved to the Fun shelf (2026-10-01), and the one before it, a size larger */
const ROOM = 'https://healthcareuncharted.com/fun/vital-stats/?room=ABCD';
const OLD_ROOM = 'https://healthcareuncharted.com/secret-menu/vital-stats/?room=ABCD';
function bits(q) { let s = ''; for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) s += q.dark(x, y) ? '1' : '0'; return s; }
function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }

test('a room link is a version 4 code, 33 modules a side, the same every time', () => {
  const Q = loadKit();
  const q = Q.make(ROOM);
  assert.strictEqual(q.version, 4);
  assert.strictEqual(q.size, 33);
  assert.strictEqual(fnv(bits(q)), 'c7c99b5d');
  const old = Q.make(OLD_ROOM);
  assert.deepStrictEqual([old.version, old.size, fnv(bits(old))], [5, 37, '15b76e7f']);
  assert.strictEqual(fnv(bits(Q.make('HELLO'))), '1d366d69');
  assert.strictEqual(bits(Q.make(ROOM)), bits(q), 'the same text makes the same code');
});

test('the three finder squares and the timing lines are where a scanner looks', () => {
  const q = loadKit().make(ROOM), n = q.size;
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    assert.ok(q.dark(cx, cy), 'finder center is dark');
    assert.ok(q.dark(cx - 3, cy) && q.dark(cx + 3, cy), 'finder ring is dark');
    assert.ok(!q.dark(cx - 2, cy) && !q.dark(cx + 2, cy), 'finder gap is light');
  }
  for (let i = 8; i < n - 8; i++) {
    assert.strictEqual(q.dark(i, 6), i % 2 === 0, 'row timing at ' + i);
    assert.strictEqual(q.dark(6, i), i % 2 === 0, 'column timing at ' + i);
  }
  assert.ok(q.dark(8, n - 8), 'the always-dark module');
});

test('both copies of the format bits name level M and the mask, with a valid check code', () => {
  const Q = loadKit();
  for (const t of [ROOM, 'HELLO', 'x'.repeat(150)]) {
    const q = Q.make(t), n = q.size;
    let a = 0, b = 0;
    const A = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
    A.forEach(([x, y], i) => { if (q.dark(x, y)) a |= 1 << i; });
    for (let i = 0; i < 8; i++) if (q.dark(n - 1 - i, 8)) b |= 1 << i;
    for (let i = 8; i < 15; i++) if (q.dark(8, n - 15 + i)) b |= 1 << i;
    assert.strictEqual(a, b, 'the two copies agree');
    const raw = a ^ 0x5412, data = raw >>> 10;
    let r = data; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    assert.strictEqual(raw & 0x3ff, r & 0x3ff, 'the BCH check code matches');
    assert.strictEqual(data >>> 3, 0, 'level M');
    assert.strictEqual(data & 7, q.mask, 'the mask it reports');
  }
});

test('the smallest version that fits, and null past 213 bytes', () => {
  const Q = loadKit();
  assert.strictEqual(Q.make('x'.repeat(14)).version, 1);
  assert.strictEqual(Q.make('x'.repeat(15)).version, 2);
  assert.strictEqual(Q.make('x'.repeat(213)).version, 10);
  assert.strictEqual(Q.make('x'.repeat(214)), null);
  assert.strictEqual(Q.svg('x'.repeat(214)), '');
  assert.strictEqual(Q.make('café').version, 1, 'text goes in as UTF-8 bytes');
});

test('the drawing: a quiet zone of four, dark on light, a name for screen readers', () => {
  const Q = loadKit();
  const s = Q.svg(ROOM, { label: 'Scan to join room "ABCD" & play' });
  assert.match(s, /^<svg [^>]*viewBox="0 0 41 41"/);
  assert.match(s, /role="img" aria-label="Scan to join room &quot;ABCD&quot; &amp; play"/);
  assert.match(s, /<rect width="41" height="41" fill="#ffffff"\/>/);
  assert.match(s, /<path fill="#0d1117" d="M4 4h7v1h-7z/, 'the top-left finder starts inside the quiet zone');
});
