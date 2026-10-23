/**
 * The full check's sweep follows the change (2026-10-21, David: "Yes, make the check sweep only the pages a change
 * touches, with the whole site when a shared file changes"). scripts/lib/sweep-scope.js turns the files changed since the
 * last push into the pages the sweep reads; these hold its rules, above all that a file it cannot place sweeps every page.
 * The changed files and the built pages are handed in, so the test needs no build and no git; the templates are the
 * repo's own.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { sweepScope, SPREAD } = require('../scripts/lib/sweep-scope');

const ROOT = path.join(__dirname, '..');
const LIVE = [...require('../scripts/ledger').liveUrls().keys()].filter((u) => u.endsWith('/'));
// a built page names its own scripts; every page here loads the site's shared ones
const page = (...srcs) => '<html><head>' + srcs.map((s) => `<script src="${s}"></script>`).join('') + '</head></html>';
const HTML = Object.fromEntries(LIVE.map((u) => [u, page('/assets/js/hu-kit.js')]));
HTML['/tools/cost-of-living/'] = page('/assets/js/hu-kit.js', '/assets/js/assignment-compass-engine.js', '/assets/js/tools/assignment-compass.js');
HTML['/fun/daily-huddle/'] = page('/assets/js/hu-kit.js') + "<script>fetch('/assets/data/huddle-questions.json')</script>";
const scope = (files, code = 'M ', html = HTML) => sweepScope({ changed: files.map((file) => ({ code, file })), live: LIVE, html });

test('a change outside the site sweeps nothing: the docs, the tests, the board and the scripts that build no page', () => {
  const s = scope(['docs/HU-QA-TOOLKIT.md', 'tests/huddle-pins.json', 'data-build/board.json', 'scripts/huddle/lib.js', 'SPRINT.md', 'src/robots.txt']);
  assert.strictEqual(s.whole, false);
  assert.deepStrictEqual(s.pages, []);
});

test('what every page loads, the site layout, the build and the gate itself sweep the whole site', () => {
  for (const f of ['src/assets/css/hu-global.css', 'src/assets/js/hu-kit.js', 'src/_includes/base.njk', 'src/_data/site.js',
    '.eleventy.js', 'package-lock.json', 'scripts/phone-check.js', 'scripts/lib/view-walk.js']) {
    const s = scope([f]);
    assert.ok(s.whole, f + ' sweeps the whole site');
    assert.strictEqual(s.pages.length, LIVE.length);
    assert.match(s.why.join('\n'), /the whole site/);
  }
});

test('a page\'s own files sweep that page, and a removed page sweeps nothing', () => {
  assert.deepStrictEqual(scope(['src/fun/daily-huddle/index.html']).pages, ['/fun/daily-huddle/']);
  assert.deepStrictEqual(scope(['src/secret-menu/blog/launch-1-0/index.njk']).pages, ['/secret-menu/blog/launch-1-0/']);
  assert.deepStrictEqual(scope(['src/learn/retired-module/index.njk'], 'D ').pages, []);
});

test('an asset sweeps the pages that load it, directly or through a script that names it', () => {
  // version 4's push: the trivia bank, fetched by the one page
  const v4 = scope(['src/fun/daily-huddle/index.html', 'src/assets/data/huddle-questions.json', 'scripts/build-huddle.js', 'tests/huddle-pins.json']);
  assert.strictEqual(v4.whole, false);
  assert.deepStrictEqual(v4.pages, ['/fun/daily-huddle/']);
  // the compass's data file is read by its engine script, which the page loads
  assert.deepStrictEqual(scope(['src/assets/data/assignment-compass.json']).pages, ['/tools/cost-of-living/']);
});

test('an asset more than SPREAD pages load, or one no page names, sweeps the whole site; a removed one no page names sweeps nothing', () => {
  const many = { ...HTML };
  LIVE.slice(0, SPREAD + 1).forEach((u) => { many[u] = page('/assets/js/hu-kit.js', '/assets/js/hu-views.js'); });
  assert.ok(scope(['src/assets/js/hu-views.js'], 'M ', many).whole, 'loaded by ' + (SPREAD + 1) + ' pages');
  const few = { ...HTML, '/learn/laws-and-paradoxes/': page('/assets/js/hu-views.js') };
  assert.deepStrictEqual(scope(['src/assets/js/hu-views.js'], 'M ', few).pages, ['/learn/laws-and-paradoxes/']);
  assert.ok(scope(['src/assets/images/nowhere/not-used.png']).whole, 'unsure is never a reason to skip a page');
  const gone = scope(['src/assets/images/nowhere/not-used.png'], 'D ');
  assert.strictEqual(gone.whole, false);
  assert.deepStrictEqual(gone.pages, []);
});

test('a layout piece or a data file sweeps the pages whose templates use it, followed through the pieces between', () => {
  const blog = ['/secret-menu/blog/', '/secret-menu/blog/launch-1-0/', '/secret-menu/blog/site-1-0/'].filter((u) => LIVE.includes(u));
  assert.ok(blog.length >= 2, 'the blog has its pages');
  // the dev blog's data is read by the blog pages and by the feedback piece they include
  assert.deepStrictEqual(scope(['src/_data/devBlog.js']).pages, blog);
  assert.deepStrictEqual(scope(['src/_includes/components/blog-feedback.njk']).pages, blog);
  // the game bar sweeps the games, not the site
  const bar = scope(['src/_includes/components/game-bar.njk']);
  assert.strictEqual(bar.whole, false);
  assert.ok(bar.pages.includes('/fun/daily-huddle/') && bar.pages.every((u) => /^\/(?:fun|secret-menu)\//.test(u)), bar.pages.join(' '));
  // a word in a template is not a use: base.njk's section == 'rounds' does not make the reading list every page's
  const src = fs.readFileSync(path.join(ROOT, 'src', '_includes', 'base.njk'), 'utf8');
  assert.match(src, /section == 'rounds'/);
});

test('a file under src the rules cannot place sweeps the whole site', () => {
  const s = scope(['src/somewhere-new/notes.txt']);
  assert.ok(s.whole);
  assert.match(s.why[0], /cannot tell/);
});

test('the full check uses the scope, says which sweep it ran, and --full still sweeps every page', () => {
  const qa = fs.readFileSync(path.join(ROOT, 'scripts', 'qa.js'), 'utf8');
  assert.match(qa, /require\('\.\/lib\/sweep-scope'\)\.sweepScope\(\)/);
  assert.match(qa, /const FULL = argv\.includes\('--full'\)/);
  assert.match(qa, /the sweep read ' \+ sweepNote/, 'the run sheet names the pages a short sweep read');
  assert.match(qa, /checks over the whole site, every page at nine screen sizes/, 'and says so when it read them all');
});
