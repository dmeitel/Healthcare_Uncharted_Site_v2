/**
 * A full build leaves nothing behind it did not make (scripts/lib/prune-site.js; David, 2026-10-07: "make sure we
 * delete old pages ... so they don't get found"). Eleventy writes into _site and never deletes, so a page that moved
 * stayed there on this computer, where the hub and the checks read it. Run on a made-up build folder in tmp.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pruneSite, pageOf } = require('../scripts/lib/prune-site.js');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hu-prune-'));
  const put = (f, t = 'x') => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), t); };
  put('src/assets/js/kept.js'); put('src/robots.txt');
  put('_site/assets/js/kept.js'); put('_site/assets/js/gone.js');               // a copy whose source was deleted
  put('_site/assets/data/made.json');                                            // written by a template into assets
  put('_site/robots.txt');
  put('_site/fun/game/index.html'); put('_site/secret-menu/game/index.html');    // the page moved: the old copy is stale
  put('_site/index.html');
  return { root, out: path.join(root, '_site'), written: ['_site/index.html', '_site/fun/game/index.html', '_site/assets/data/made.json'].map((f) => path.join(root, f)),
    passthrough: /** @type {Array<[string, string]>} */ ([['src/assets', 'assets'], ['src/robots.txt', 'robots.txt']]) };
}

test('a page the build no longer makes goes, with the folder it leaves empty; what the build made and copied stays', () => {
  const f = fixture();
  const r = pruneSite(f);
  assert.strictEqual(r.refused, '');
  assert.deepStrictEqual(r.removed.sort(), ['assets/js/gone.js', 'secret-menu/game/index.html']);
  assert.ok(!fs.existsSync(path.join(f.out, 'secret-menu')), 'the empty folders go too');
  for (const kept of ['index.html', 'fun/game/index.html', 'assets/js/kept.js', 'assets/data/made.json', 'robots.txt']) assert.ok(fs.existsSync(path.join(f.out, kept)), kept + ' stays');
  assert.deepStrictEqual(pruneSite(f).removed, [], 'a second run finds nothing');
});

test('it stops without removing anything when the list is suspiciously long, or the build wrote nothing', () => {
  const f = fixture();
  assert.match(pruneSite(Object.assign({}, f, { limit: 1 })).refused, /more than the 1/);
  assert.ok(fs.existsSync(path.join(f.out, 'secret-menu/game/index.html')), 'nothing removed');
  assert.match(pruneSite(Object.assign({}, f, { written: [] })).refused, /wrote nothing/);
});

test('the build log names a removed page by its address', () => {
  assert.strictEqual(pageOf('secret-menu/device-assembly/index.html'), '/secret-menu/device-assembly/');
  assert.strictEqual(pageOf('index.html'), '/');
});

test('the build runs the prune after a full build only, never on the live-reload server\'s partial rebuilds', () => {
  const cfg = fs.readFileSync(path.join(__dirname, '..', '.eleventy.js'), 'utf8');
  assert.match(cfg, /pruneSite\(/);
  assert.match(cfg, /if \(runMode !== "build" \|\| incremental/);
  assert.match(cfg, /for \(const \[src, out\] of PASSTHROUGH\)/, 'one passthrough list feeds the copy and the prune');
});
