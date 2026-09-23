#!/usr/bin/env node
'use strict';
/**
 * meta-screen.js — read every built page's <title> and meta description and report the ones a
 * search result would mishandle, plus any two pages claiming to be the same thing.
 *
 *   node scripts/meta-screen.js
 *
 * This is the same shape of question as the shell ratchet: not "is this page broken" but "do
 * these pages agree with each other, and does each one say what it is". A description that runs
 * long gets cut off mid-sentence in a search result; two pages sharing a description means one
 * of them is describing the wrong page.
 *
 * Redirect stubs are excluded the way tests/site-build.test.js excludes them: a page that
 * immediately becomes another page has nothing of its own to describe.
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', '_site');
const LONG = 165;   // Google truncates around here on desktop
const SHORT = 70;   // shorter than this and the result looks thin

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

const pages = walk(SITE).filter((f) => {
  const h = fs.readFileSync(f, 'utf8');
  return /<html/i.test(h) && !/http-equiv="refresh"|location\.replace\(/i.test(h);
});

const urlOf = (p) => '/' + path.relative(SITE, p).split(path.sep).slice(0, -1).join('/') + '/';
const textLen = (s) => s.replace(/&[a-z]+;/gi, 'x').length;

const flagged = [];
const byDesc = new Map();
const byTitle = new Map();

for (const p of pages) {
  const h = fs.readFileSync(p, 'utf8');
  const url = urlOf(p).replace('//', '/');
  const dm = h.match(/<meta name="description" content="([^"]*)"/i);
  const tm = h.match(/<title>([^<]*)<\/title>/i);
  const title = tm ? tm[1].replace(/\s*&middot;\s*Healthcare Uncharted\s*$/, '').trim() : null;

  if (!dm) { flagged.push(['MISSING', 0, url]); }
  else {
    const n = textLen(dm[1]);
    if (n > LONG) flagged.push(['LONG', n, url]);
    else if (n < SHORT) flagged.push(['SHORT', n, url]);
    const k = dm[1].trim();
    byDesc.set(k, (byDesc.get(k) || []).concat(url));
  }
  if (!title) flagged.push(['NO TITLE', 0, url]);
  else byTitle.set(title, (byTitle.get(title) || []).concat(url));
}

console.log('pages checked: ' + pages.length + '  (redirect stubs excluded)');
console.log('');
if (!flagged.length) console.log('  every description sits between ' + SHORT + ' and ' + LONG + ' characters');
for (const [kind, n, url] of flagged.sort((a, b) => b[1] - a[1])) {
  console.log('  ' + kind.padEnd(9) + String(n).padStart(4) + '  ' + url);
}

const dupeDesc = [...byDesc.entries()].filter(([, v]) => v.length > 1);
const dupeTitle = [...byTitle.entries()].filter(([, v]) => v.length > 1);
console.log('');
console.log('duplicate descriptions: ' + dupeDesc.length);
for (const [d, v] of dupeDesc) console.log('  ' + v.join('  +  ') + '\n      "' + d.slice(0, 80) + '"');
console.log('');
console.log('duplicate titles: ' + dupeTitle.length);
for (const [t, v] of dupeTitle) console.log('  ' + v.join('  +  ') + '\n      "' + t + '"');
