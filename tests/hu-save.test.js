/**
 * hu-save.js: the one save-string codec. Two games carried the same code by hand; now both call
 * this. The contract: prefix + base64(deflate-raw(JSON)), a raw fallback prefix, whitespace
 * forgiven on the way in, garbage rejected.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadKit() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'hu-save.js'), 'utf8');
  const ctx = { window: {}, Blob, Response, CompressionStream, DecompressionStream, btoa, atob, console };
  vm.createContext(ctx);
  new vm.Script(src, { filename: 'hu-save.js' }).runInContext(ctx);
  assert.ok(ctx.window.HUSave, 'the kit hangs off window');
  return ctx.window.HUSave;
}
const J = v => JSON.stringify(v);
const sample = { v: 1, run: { cash: 632000, departments: [{ id: 'ed', staff: { rn: 12, tech: 4 } }], note: 'Ünïcode · fine' } };

test('a run round-trips through the compressed form byte for byte', async () => {
  const c = loadKit().codec('HUG1.');
  const str = await c.encode(sample);
  assert.ok(str.startsWith('HUG1.'), 'the compressed prefix');
  assert.ok(!/\s/.test(str), 'no whitespace in the string');
  assert.strictEqual(J(await c.decode(str)), J(sample));
});

test('whitespace and line breaks from a chat app are forgiven', async () => {
  const c = loadKit().codec('HUG1.');
  const str = await c.encode(sample);
  const wrapped = str.slice(0, 40) + '\n  ' + str.slice(40, 90) + ' \r\n' + str.slice(90) + '\n';
  assert.strictEqual(J(await c.decode(wrapped)), J(sample));
});

test('the raw fallback form decodes too, with the R prefix', async () => {
  const c = loadKit().codec('HUS1.');
  assert.strictEqual(c.rawPrefix, 'HUS1R.');
  const raw = 'HUS1R.' + Buffer.from(JSON.stringify(sample), 'utf8').toString('base64');
  assert.strictEqual(J(await c.decode(raw)), J(sample));
});

test('garbage is rejected, and one game cannot read another game\'s string', async () => {
  const kit = loadKit();
  const hospital = kit.codec('HUG1.'), regional = kit.codec('HUS1.');
  await assert.rejects(() => hospital.decode(''));
  await assert.rejects(() => hospital.decode('hello there'));
  await assert.rejects(() => hospital.decode('HUG1.@@@not-base64@@@'));
  const str = await regional.encode(sample);
  await assert.rejects(() => hospital.decode(str), 'a regional string is not a hospital string');
  assert.strictEqual(J(await regional.decode(str)), J(sample));
});

test('a prefix must look like a game tag', () => {
  const kit = loadKit();
  assert.throws(() => kit.codec('hug1.'));
  assert.throws(() => kit.codec('HUG1'));
  assert.throws(() => kit.codec(''));
});
