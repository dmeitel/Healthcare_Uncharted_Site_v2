'use strict';
/* System Layers' "By the numbers" tiles (2026-10-03, DECISIONS T2, David: cut the unsourced ones, keep the ones that
   cite a source). 301 tiles had 113 with no source, some invented ("8m 42s" average registration time, "#1 Market
   Share"), and 12 more whose brackets said what, not who ("(Avg.)", "(US)", "(individual)"). Every tile left names a
   source in its trailing brackets, which the card prints under the label. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'js', 'tools', 'iceberg-map.js'), 'utf8');
// brackets that describe the number rather than name who published it
const NOT_SOURCE = /^(avg\.?|average|est\.?|estimate|median|us|u\.s\.|individual|family|met|stemi|avg\. facility|\d{4}(, individual)?)$/i;

/** every [value, label] in every m:[...] list */
function tiles() {
  const out = [];
  let at = 0;
  while ((at = SRC.indexOf('m:[[', at)) >= 0) {
    let depth = 0, j = at + 2;
    for (; j < SRC.length; j++) { if (SRC[j] === '[') depth++; else if (SRC[j] === ']') { depth--; if (!depth) break; } }
    for (const [v, l] of Function('return ' + SRC.slice(at + 2, j + 1))()) out.push({ v: String(v), l: String(l) });
    at = j;
  }
  return out;
}

test('every number on a System Layers card names who published it', () => {
  const all = tiles();
  assert.ok(all.length >= 150, all.length + ' tiles');
  const bad = all.filter(({ l }) => { const p = (l.match(/\(([^()]*)\)\s*$/) || [])[1]; return !p || NOT_SOURCE.test(p.trim()) || !/[a-z]/i.test(p); })
    .map(({ v, l }) => v + ' | ' + l.replace(/\n/g, ' '));
  assert.deepStrictEqual(bad, []);
});

test('the invented numbers the review found are gone, and no card is left with an empty numbers list', () => {
  for (const t of ['8m 42s', 'Eligibility Accuracy', 'Uptime SLA', 'Market Share']) assert.ok(!SRC.includes(t), t + ' is back');
  assert.ok(!/m:\[\s*\]/.test(SRC), 'an empty m:[] would print a heading with nothing under it');
});
