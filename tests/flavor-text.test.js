/**
 * Flavor text stays on the desk (DESIGN.md, The Two Surfaces, rule 8). David, 2026-10-08, on the Tools page's
 * shelf lines ("for the move you are weighing", "practice on real data models"): "overall its fine in web page
 * but should not appear on phones". A tagline beside a shelf heading carries .hu-flavor, and hu-global.css drops
 * .hu-flavor at the phone query. A new shelf with a tagline that forgets the class fails here.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
function pages(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) pages(p, out);
    else if (/\.(html|njk)$/.test(e.name)) out.push(p);
  }
  return out;
}

test('every tagline beside a shelf heading is marked as flavor', () => {
  const missing = [];
  let seen = 0;
  for (const f of pages(SRC)) {
    const s = fs.readFileSync(f, 'utf8');
    // a shelf heading: <div class="xx-shelf-h ...">...<span class="n ...">tagline</span></div>
    for (const m of s.matchAll(/<div class="[a-z]+-shelf-h[^"]*"[^>]*>[\s\S]{0,400}?<\/div>/g)) {
      for (const t of m[0].matchAll(/<span class="(n(?:\s[^"]*)?)">([^<]+)<\/span>/g)) {
        seen++;
        if (!/\bhu-flavor\b/.test(t[1])) missing.push(path.relative(SRC, f) + ': "' + t[2].trim() + '"');
      }
    }
  }
  // 10 since 2026-10-11: the Tools page's Fun shelf became the Fun section's own page (DECISIONS BR3)
  assert.ok(seen >= 10, 'the shelf headings are still found (' + seen + ')');
  assert.deepStrictEqual(missing, []);
});

test('the kit drops flavor text at the phone query, and only there', () => {
  const css = fs.readFileSync(path.join(SRC, 'assets', 'css', 'hu-global.css'), 'utf8');
  const m = /@media \(max-width:699px\), \(max-height:500px\) \{\s*\.hu-flavor \{ display:none; \}\s*\}/.exec(css);
  assert.ok(m, 'hu-global.css hides .hu-flavor under the phone query (the shorter side, both halves)');
  const outside = css.replace(m[0], '');
  assert.ok(!/\.hu-flavor\s*\{[^}]*display\s*:\s*none/.test(outside), 'nothing hides flavor text on a desk');
});
