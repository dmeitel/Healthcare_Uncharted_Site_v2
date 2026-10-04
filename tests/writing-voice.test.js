'use strict';
/* The voice ratchet. Every built page's "fix" findings from the writing checker (voice and professional tone, static text)
   are counted against tests/writing-baseline.json: a page may lose findings, never gain them, and a page not in the file
   must have none. The same shape as the reading-shell ratchet (tests/reading-shell.test.js): it holds the line from the
   day it was built (2026-10-03) without asking anyone to rewrite working prose first.
   When it fails: run `npm run writing:check -- /that/page/` and fix what it lists. If a finding is deliberate, raise the
   page's number with `npm run writing:check -- --all --baseline` and say why in the commit. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const W = require('../scripts/lib/writing-rules');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
if (!fs.existsSync(SITE)) require('node:child_process').execSync('npx @11ty/eleventy', { stdio: 'inherit', cwd: ROOT });
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'writing-baseline.json'), 'utf8')).pages;
/** @param {string} dir @returns {string[]} */
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

test('no page gains a voice or tone finding', () => {
  const over = [];
  for (const f of walk(SITE).filter((x) => x.endsWith(path.sep + 'index.html') && !x.includes(path.sep + 'assets' + path.sep))) {
    const html = fs.readFileSync(f, 'utf8');
    if (/http-equiv=["']refresh["']/i.test(html.slice(0, 1500))) continue;
    const rel = path.relative(SITE, path.dirname(f)).split(path.sep).join('/');
    const url = '/' + (rel ? rel + '/' : '');
    const x = W.htmlToBlocks(html);
    const r = W.check(x.blocks, { register: W.registerForPath(url, html), guest: x.guest, links: x.links });
    const allowed = BASE[url] || 0;
    if (r.counts.warn > allowed) {
      const list = r.flags.filter((/** @type {any} */ g) => g.level === 'warn').map((/** @type {any} */ g) => W.RULES[g.rule].name + ': "' + g.text.slice(0, 60) + '"');
      over.push(url + ' has ' + r.counts.warn + ', allowed ' + allowed + '\n    ' + list.join('\n    '));
    }
  }
  assert.deepStrictEqual(over, []);
});
