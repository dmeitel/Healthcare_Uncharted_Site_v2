/**
 * The dev blog on the secret menu (2026-10-11, src/_data/devBlog.js and src/secret-menu/blog/). Every post has its page
 * and every page its post; every page stays out of search (noindex, out of every collection, so the sitemap, the feed
 * and the site search never list it); every feedback row says what came of it.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'src', 'secret-menu', 'blog');
const blog = require('../src/_data/devBlog.js');

const front = (f) => (fs.readFileSync(f, 'utf8').match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];

test('every post has its page and every page its post', () => {
  const slugs = blog.posts.map((p) => p.slug);
  assert.strictEqual(new Set(slugs).size, slugs.length, 'no slug twice');
  for (const s of slugs) assert.ok(fs.existsSync(path.join(DIR, s, 'index.njk')), s + ' has no page');
  const dirs = fs.readdirSync(DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  for (const d of dirs) assert.ok(slugs.includes(d), 'src/secret-menu/blog/' + d + '/ is not in src/_data/devBlog.js');
});

test('every blog page stays out of search', () => {
  const pages = [path.join(DIR, 'index.njk'), ...blog.posts.map((p) => path.join(DIR, p.slug, 'index.njk'))];
  for (const f of pages) {
    const fm = front(f);
    assert.match(fm, /^noindex:\s*true$/m, path.relative(ROOT, f) + ' must be noindex');
    assert.match(fm, /^eleventyExcludeFromCollections:\s*true$/m, path.relative(ROOT, f) + ' must stay out of the collections');
  }
});

test('posts are numbered in order, newest first, and every feedback row says what came of it', () => {
  const ns = blog.posts.map((p) => p.n);
  ns.forEach((n, i) => assert.strictEqual(n, ns.length - i, 'post numbers run down from the newest'));
  for (const p of blog.posts) {
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, p.slug + ' date');
    assert.ok(p.title && p.summary, p.slug + ' has a title and a summary');
    for (const f of p.feedback) {
      assert.ok(Object.keys(blog.STATUS).includes(f.status), p.slug + ': "' + f.heard + '" has no known status');
      assert.ok(f.heard && f.from && f.did, p.slug + ': every row says what was heard, from whom, and what came of it');
      if (f.status === 'done') assert.match(String(f.when), /^\d{4}-\d{2}-\d{2}$/, p.slug + ': a done row says when');
    }
  }
  assert.strictEqual(blog.totals.heard, blog.all.length, 'the tally counts every row');
});
