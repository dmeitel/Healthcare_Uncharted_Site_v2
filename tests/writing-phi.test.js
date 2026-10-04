'use strict';
/* No patient identifier ships. The writing checker's must-fix patient-information rules (scripts/lib/writing-rules.js) run
   over every built page, over the Rounds story files whose text a page draws after load, and over every image's hidden
   data. Built 2026-10-03 after the broken arm piece was scrubbed by hand: a clinician's name, a login link and camera
   data were all caught by a person reading carefully, and this makes the read repeatable. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const W = require('../scripts/lib/writing-rules');
const { readImageMeta, describe } = require('../scripts/lib/image-meta');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
if (!fs.existsSync(SITE)) require('node:child_process').execSync('npx @11ty/eleventy', { stdio: 'inherit', cwd: ROOT });
/** @param {string} dir @returns {string[]} */
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
/** @param {any} r */
const mustFix = (r) => r.flags.filter((/** @type {any} */ f) => f.layer === 'phi' && f.level === 'block');

test('no built page carries a patient identifier', () => {
  const hits = [];
  for (const f of walk(SITE).filter((x) => x.endsWith('.html') && !x.includes(path.sep + 'assets' + path.sep))) {
    const html = fs.readFileSync(f, 'utf8');
    const url = '/' + path.relative(SITE, path.dirname(f)).split(path.sep).join('/') + '/';
    const x = W.htmlToBlocks(html);
    const r = W.check(x.blocks, { register: W.registerForPath(url, html), guest: x.guest });
    for (const h of mustFix(r)) hits.push(url + ' ' + W.RULES[h.rule].name + ': ' + h.text);
  }
  assert.deepStrictEqual(hits, []);
});

test('no Rounds story file carries a patient identifier', () => {
  const dir = path.join(ROOT, 'src', 'assets', 'js', 'rounds');
  const files = fs.existsSync(dir) ? walk(dir).filter((f) => f.endsWith('.js')) : [];
  const hits = [];
  for (const f of files) {
    const blocks = fs.readFileSync(f, 'utf8').split('\n').map((text) => ({ kind: 'p', text }));
    for (const h of mustFix(W.check(blocks, { register: 'rounds' }))) hits.push(path.relative(ROOT, f) + ':' + (h.b + 1) + ' ' + W.RULES[h.rule].name + ': ' + h.text);
  }
  assert.deepStrictEqual(hits, []);
});

test('no image carries a location, and no Rounds photo carries any camera data', () => {
  const imgs = walk(path.join(ROOT, 'src')).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  assert.ok(imgs.length > 50, imgs.length + ' images read');
  const located = [], camera = [];
  for (const f of imgs) {
    const m = readImageMeta(fs.readFileSync(f));
    if (m.gps) located.push(path.relative(ROOT, f));
    if (/[\\/]rounds[\\/]/.test(f) && (m.exif || m.xmp || m.iptc || m.text.length)) camera.push(path.relative(ROOT, f) + ': ' + describe(m));
  }
  assert.deepStrictEqual(located, [], 'GPS positions');
  assert.deepStrictEqual(camera, [], 'Rounds photos are personal; strip every metadata block');
});
