/**
 * The authors on the About page (2026-10-11, AB2 "go with A"; src/_data/authors.js drawn by
 * src/_includes/components/author-card.njk). Every author has the same parts, a photo that exists, and pieces that point at
 * live pages, so adding a guest or staff author is one entry that cannot half-render.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const authors = require('../src/_data/authors.js');

test('every author has the same parts and a photo that exists', () => {
  assert.ok(authors.length >= 1, 'at least one author');
  const ids = authors.map((a) => a.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'no id twice (the id is the card anchor)');
  for (const a of authors) {
    for (const k of ['id', 'name', 'creds', 'role', 'photo']) assert.ok(a[k], a.id + ' has no ' + k);
    assert.ok(Array.isArray(a.bio) && a.bio.length, a.id + ' has a bio');
    for (const k of ['tags', 'more', 'credentials', 'moreAfter', 'works']) assert.ok(Array.isArray(a[k]), a.id + ': ' + k + ' is a list (empty is fine)');
    assert.ok(a.photoW > 0 && a.photoH > 0, a.id + ' photo has its size, so the page does not jump as it loads');
    assert.ok(fs.existsSync(path.join(ROOT, 'src', a.photo)), a.id + ' photo ' + a.photo + ' is missing');
    assert.ok(!/—/.test(JSON.stringify(a)), a.id + ' carries an em dash');
  }
});

test("every author's pieces point at live pages", () => {
  for (const a of authors) {
    for (const w of a.works) {
      assert.ok(w.href && w.title, a.id + ': a piece has a link and a title');
      const dir = path.join(ROOT, 'src', w.href);
      const found = ['index.html', 'index.njk', 'index.md'].some((f) => fs.existsSync(path.join(dir, f)));
      assert.ok(found, a.id + ': ' + w.href + ' has no page under src/');
    }
  }
});
