/**
 * Daily Huddle, the move (2026-10-15). David: "Move the daily huddle game to fun it should not sit on the secret Menu."
 * The game left /secret-menu/daily-huddle/ for /fun/daily-huddle/, and the old address forwards with a 301 in one hop.
 * Netlify forwards the query string on its own when a rule's target carries none, so a made board's link, a past board
 * and ?reset=1 keep opening what they named. The saves stay where they were: the storage keys are the game's own (hd-*)
 * and never named the address. On the Fun shelf it is a game like the others: listed from tools.js, with its picture
 * and its share card, indexed, and its Leave goes to Fun.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NEW = '/fun/daily-huddle/';
const OLD = '/secret-menu/daily-huddle/';
const PAGE = path.join(ROOT, 'src', 'fun', 'daily-huddle', 'index.html');

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

test('the game is at its new address, and nothing makes the old one', () => {
  assert.ok(fs.existsSync(PAGE), 'src/fun/daily-huddle/index.html makes ' + NEW);
  assert.ok(!fs.existsSync(path.join(ROOT, 'src', 'secret-menu', 'daily-huddle')), 'nothing makes the old address any more, or the forward would never fire');
  const html = fs.readFileSync(PAGE, 'utf8');
  assert.ok(html.includes("const ROOT = '" + NEW + "';"), 'the page writes its own address under /fun/');
  assert.ok(html.includes("leave:{ href:'/fun/' }"), 'Leave goes to the Fun shelf');
});

test('the old address forwards with a 301, in one hop, door and all', () => {
  const rs = rules();
  for (const [from, to] of [[OLD, NEW], [OLD.slice(0, -1), NEW]]) {
    const h = hop(from, rs);
    assert.ok(h, from + ' forwards');
    assert.strictEqual(h.status, 301, from + ' is a 301');
    assert.strictEqual(h.to, to, from + ' lands on ' + to);
    assert.strictEqual(hop(h.to, rs), null, h.to + ' is the end of the line');
  }
});

test('on the Fun shelf it is a game like the others', () => {
  const head = fs.readFileSync(PAGE, 'utf8').slice(0, 800);
  assert.match(head, /^section:\s*fun\s*$/m, 'section: fun, so the Fun count and the collections hold it');
  assert.match(head, /^navPage:\s*fun\s*$/m, 'the nav lights Fun');
  assert.doesNotMatch(head, /^noindex:/m, 'a Fun game is indexed');
  assert.doesNotMatch(head, /^eleventyExcludeFromCollections:/m, 'a Fun game is in the collections');
  const og = (/^og_image:\s*(\S+)/m.exec(head) || [])[1];
  assert.ok(og && fs.existsSync(path.join(ROOT, 'src', og)), 'its share card exists: ' + og);

  const tools = require(path.join(ROOT, 'src', '_data', 'tools.js'));
  const t = tools.find((x) => x.url === NEW);
  assert.ok(t, 'tools.js lists it, so the Fun shelf and site search find it');
  assert.strictEqual(t.cluster, 'fun');
  assert.strictEqual(t.status, 'live');
  for (const f of [t.id + '.png', t.id + '-light.png']) {
    assert.ok(fs.existsSync(path.join(ROOT, 'src', 'assets', 'images', 'tool-thumbs', f)), 'its shelf picture exists: ' + f);
  }

  const menu = fs.readFileSync(path.join(ROOT, 'src', 'secret-menu', 'index.html'), 'utf8');
  assert.ok(!menu.includes('daily-huddle'), 'the secret menu no longer lists it');
});
