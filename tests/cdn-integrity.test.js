/**
 * A pinned library from a CDN carries an integrity hash (2026-10-11, the Ideas card "Security header quick wins",
 * David's Yes). With the hash, the browser refuses the file if the CDN ever serves different bytes, so a compromised
 * CDN cannot run its code on this site. Every <script src> and stylesheet <link> pointing off the site must have
 * one, except the two that cannot: Google Fonts' stylesheet (Google changes it per browser) and GoatCounter's
 * count.js (unversioned; hosting it on the site waits for David's OK).
 * To add a library: take its hash from the CDN (jsDelivr: data.jsdelivr.com/v1/packages/npm/NAME@VERSION?structure=flat;
 * cdnjs: api.cdnjs.com/libraries/NAME/VERSION?fields=sri) and add integrity="..." crossorigin="anonymous".
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXEMPT = [/^https:\/\/fonts\.googleapis\.com\//, /^https:\/\/gc\.zgo\.at\/count\.js$/];

function files(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'brand') files(p, out); }
    else if (/\.(html|njk)$/.test(e.name)) out.push(p);
  }
  return out;
}

test('every off-site script and stylesheet carries an integrity hash', () => {
  const missing = [];
  for (const f of files(path.join(ROOT, 'src'))) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/<script\b[^>]*\bsrc="(https?:\/\/[^"]+)"[^>]*>/g)) {
      if (EXEMPT.some((r) => r.test(m[1]))) continue;
      if (!/\bintegrity="sha(256|384|512)-/.test(m[0]) || !/crossorigin=/.test(m[0])) missing.push(path.relative(ROOT, f) + ': ' + m[1]);
    }
    for (const m of src.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)) {
      const href = (m[0].match(/href="(https?:\/\/[^"]+)"/) || [])[1];
      if (!href || EXEMPT.some((r) => r.test(href))) continue;
      if (!/\bintegrity="sha(256|384|512)-/.test(m[0]) || !/crossorigin=/.test(m[0])) missing.push(path.relative(ROOT, f) + ': ' + href);
    }
  }
  assert.deepStrictEqual(missing, [], 'off-site files without an integrity hash:\n  ' + missing.join('\n  '));
});
