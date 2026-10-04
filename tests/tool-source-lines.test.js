'use strict';
/* Every public tool says where its numbers come from (the tool review's rule 6, 2026-09-23). System Layers was the last
   without a source line; it got one 2026-10-03. The strip is components/tool-attribution.njk, fed by ta_source. The
   secret menu's internal pages are exempt. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
/** @param {string} dir @returns {string[]} */
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

test('every public tool page with the attribution strip gives it a source line', () => {
  const pages = ['tools', 'atlas'].flatMap((d) => walk(path.join(ROOT, 'src', d))).filter((f) => /\.(njk|html)$/.test(f));
  const withStrip = pages.filter((f) => fs.readFileSync(f, 'utf8').includes('components/tool-attribution.njk'));
  assert.ok(withStrip.length >= 9, withStrip.length + ' tool pages carry the strip');
  const missing = withStrip.filter((f) => !/\{%\s*set ta_source\s*=\s*'[^']{12,}'/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(ROOT, f));
  assert.deepStrictEqual(missing, []);
});

test('no source line carries an em dash', () => {
  for (const f of ['tools', 'atlas'].flatMap((d) => walk(path.join(ROOT, 'src', d))).filter((x) => /\.(njk|html)$/.test(x))) {
    const m = fs.readFileSync(f, 'utf8').match(/\{%\s*set ta_source\s*=\s*'([^']*)'/);
    if (m) assert.ok(!m[1].includes('—'), path.relative(ROOT, f));
  }
});
