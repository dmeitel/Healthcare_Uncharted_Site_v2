/**
 * Headwall, the move (2026-10-15, DECISIONS HW1: "Name and address"). Device Assembly became Headwall, and its address
 * moved from /fun/device-assembly/ to /fun/headwall/. Every old address forwards with a 301, in one hop, to the page that
 * now makes it: the old Fun shelf address and the older secret menu one (2026-10-06, B6), each with the door and every
 * plain address in src/fun/headwall/parts.11ty.js. Netlify forwards the query string on its own when a rule's target
 * carries none, so ?wall=, ?build= and ?room= links keep opening what they named. The saves stay where they were: the
 * storage keys are the game's internal ids (hu-da and the rest) and did not change with the name.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GAME = path.join(ROOT, 'src', 'fun', 'headwall');
const { PARTS } = require(path.join(GAME, 'parts.11ty.js'));

/** the [[redirects]] rules in netlify.toml, in file order: { from, to, status } */
function rules() {
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8').replace(/\r\n/g, '\n');
  return toml.split(/\n(?=\[\[)/).filter((b) => /^\[\[redirects\]\]/.test(b)).map((b) => ({
    from: (/^\s*from\s*=\s*"([^"]+)"/m.exec(b) || [])[1],
    to: (/^\s*to\s*=\s*"([^"]+)"/m.exec(b) || [])[1],
    status: +((/^\s*status\s*=\s*(\d+)/m.exec(b) || [])[1] || 301),
  })).filter((r) => r.from && r.to);
}

/** the first rule that catches an address, as Netlify reads them: the address itself, or a splat over its folder */
function hop(url, rs) {
  for (const r of rs) {
    if (r.from.endsWith('/*')) {
      const base = r.from.slice(0, -1);
      if (url === base.slice(0, -1) || url.startsWith(base)) return { to: r.to.replace(':splat', url.slice(base.length)), status: r.status };
    } else if (r.from.replace(/\/$/, '') === url.replace(/\/$/, '')) return { to: r.to, status: r.status };
  }
  return null;
}

const NEW = '/fun/headwall/';
const OLD = ['/fun/device-assembly/', '/secret-menu/device-assembly/'];
const SLUGS = [''].concat(PARTS.map((p) => p.slug + '/'));

test('the game is at its new address, with every plain address under it', () => {
  assert.ok(fs.existsSync(path.join(GAME, 'index.html')), 'src/fun/headwall/index.html makes /fun/headwall/');
  assert.ok(!fs.existsSync(path.join(ROOT, 'src', 'fun', 'device-assembly')), 'nothing makes the old address any more, or the forward would never fire');
  const P = require(path.join(GAME, 'parts.11ty.js'));
  const d = new P().data();
  for (const part of PARTS) assert.strictEqual(d.permalink({ part }), NEW + part.slug + '/', part.slug);
  assert.ok(PARTS.every((p) => /^Headwall: /.test(p.title)), 'each plain address carries the new name');
});

test('every old address forwards with a 301, in one hop, to the page that makes it now', () => {
  const rs = rules();
  for (const old of OLD) {
    for (const s of SLUGS) {
      const h = hop(old + s, rs);
      assert.ok(h, old + s + ' forwards');
      assert.strictEqual(h.status, 301, old + s + ' is a 301');
      assert.strictEqual(h.to, NEW + s, old + s + ' lands on its new address');
      assert.strictEqual(hop(h.to, rs), null, h.to + ' is where it stops: no second hop');
      assert.ok(!h.to.includes('?'), 'the target carries no query, so Netlify forwards the old link\'s own');
    }
    assert.strictEqual((hop(old.replace(/\/$/, ''), rs) || {}).to, NEW, old + ' without its closing slash forwards too');
  }
});

// THE LEDGER (2026-10-15): each plain address is a forwarding page, so the page ledger skips it as it skips every forward.
// Its refresh tag sits in the body, past the site's long head, and a ledger that read only the first 1,500 characters
// listed all twelve as built pages with no source left (scripts/ledger.js, isForwarding).
test('the page ledger reads every plain address as a forward, and the game itself as a page', () => {
  const { isForwarding } = require(path.join(ROOT, 'scripts', 'ledger.js'));
  const head = '<!doctype html><html><head><meta name="x" content="' + 'y'.repeat(4000) + '"></head><body>';
  assert.ok(isForwarding(head + '<meta http-equiv="refresh" content="0; url=/fun/headwall/?wall=today"></body></html>'), 'a refresh deep in the body still forwards');
  assert.ok(!isForwarding(head + '<p>Prose can mention http-equiv="refresh" without forwarding.</p></body></html>'), 'the words alone are not a forward');
  const site = path.join(ROOT, '_site', 'fun', 'headwall');
  if (!fs.existsSync(path.join(site, 'index.html'))) return;   // the rest reads the build
  for (const p of PARTS) {
    const f = path.join(site, ...p.slug.split('/'), 'index.html');
    assert.ok(fs.existsSync(f), p.slug + ' is built');
    assert.ok(isForwarding(fs.readFileSync(f, 'utf8')), p.slug + ' is read as a forward');
  }
  assert.ok(!isForwarding(fs.readFileSync(path.join(site, 'index.html'), 'utf8')), 'the game is a page of its own');
});
