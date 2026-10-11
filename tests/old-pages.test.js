/**
 * A page that leaves the live site leaves a forward behind, or is let go on purpose (scripts/lib/old-pages.js; David,
 * 2026-10-07: "make sure we delete old pages or archive them so they don't get found"). The live site is built clean, so
 * a removed page stops existing at the next push and its old address 404s for anyone holding it. Every page the last
 * push carried that this build no longer makes must forward (netlify.toml) or be listed in data-build/gone-pages.json.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const o = require('../scripts/lib/old-pages.js');

test('a template\'s address: its folder, its permalink, none when it makes no page or many', () => {
  assert.strictEqual(o.urlOf('src/index.html', '<p>'), '/');
  assert.strictEqual(o.urlOf('src/learn/laws/index.html', '---\ntitle: x\n---\n'), '/learn/laws/');
  assert.strictEqual(o.urlOf('src/SM.html', ''), '/SM/');
  assert.strictEqual(o.urlOf('src/feed.njk', '---\npermalink: /feed.xml\n---\n'), '/feed.xml');
  assert.strictEqual(o.urlOf('src/404.html', '---\npermalink: 404.html\n---\n'), '/404.html');
  assert.strictEqual(o.urlOf('src/x/index.html', '---\npermalink: false\n---\n'), null);
  assert.strictEqual(o.urlOf('src/x/list.njk', '---\npagination:\n  data: rows\npermalink: "/x/{{ row.slug }}/"\n---\n'), null);
});

test('a forward catches the address, with or without the closing slash, or under a splat', () => {
  const froms = ['/secret-menu/device-assembly/*', '/tools/old-tool/', '/atlas/craft/*'];
  assert.ok(o.forwarded('/secret-menu/device-assembly/', froms));
  assert.ok(o.forwarded('/secret-menu/device-assembly', froms));
  assert.ok(o.forwarded('/tools/old-tool', froms));
  assert.ok(o.forwarded('/atlas/craft/deep/', froms));
  assert.ok(!o.forwarded('/secret-menu/device-assembly-two/', froms), 'a splat is a folder, not a prefix of any word');
  assert.ok(!o.forwarded('/tools/', froms));
});

test('the let-go list is real JSON, each entry with a date and a reason', () => {
  const g = JSON.parse(fs.readFileSync(o.GONE, 'utf8'));
  for (const [url, v] of Object.entries(g)) {
    if (url === '//') continue;
    assert.match(url, /^\/.*\/$|^\/[^/]+\.\w+$/, url + ' is an address');
    assert.ok(v && /^\d{4}-\d{2}-\d{2}$/.test(v.since) && v.why, url + ' has since and why');
  }
});

test('every page the last push carried that this build drops forwards or is let go on purpose', (t) => {
  if (spawnSync('git', ['rev-parse', '--verify', '--quiet', 'origin/main']).status !== 0) { t.skip('no pushed commit on this computer'); return; }
  const r = o.leftPages('origin/main');
  assert.strictEqual(r.error, '');
  const lost = r.left.filter((p) => !p.how).map((p) => p.url + ' (was ' + p.file + ')');
  assert.deepStrictEqual(lost, [], 'these would 404 after the push: add a redirect in netlify.toml, or list them in data-build/gone-pages.json');
});
