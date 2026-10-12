/**
 * The Career Tree reads a LinkedIn PDF the visitor picks with pdf.js 3.11.174, which has CVE-2024-4367 (rated 8.8): a
 * crafted PDF can run script through the font path. The fix for versions before 4.2.67 is one option,
 * isEvalSupported:false, on every getDocument call. This test holds every call to it (2026-10-11, the Ideas card
 * "Close the pdf.js hole in the Career Tree", David's Yes). If pdf.js is ever upgraded past 4.2.67 the option is
 * harmless and can stay.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function files(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files(p, out);
    else if (/\.(js|njk|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

test('every pdf.js getDocument call turns eval off', () => {
  const calls = [];
  for (const f of files(path.join(ROOT, 'src'))) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/getDocument\(([^)]*)\)/g)) calls.push([path.relative(ROOT, f), m[1]]);
  }
  assert.ok(calls.length >= 1, 'the Career Tree still opens a PDF somewhere');
  for (const [file, args] of calls) assert.match(args, /isEvalSupported\s*:\s*false/, file + ' opens a PDF without isEvalSupported:false');
});
