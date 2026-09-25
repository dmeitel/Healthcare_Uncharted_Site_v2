/**
 * The multiplayer backend is named in two places that drifted silently once: the SUPA
 * constant inside the hospital game, and the CSP connect-src in netlify.toml. If they ever
 * disagree, the game loads and the browser refuses the socket, with no error a player can
 * read. This test fails the build instead.
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// every game on the table kit names the backend in a SUPA constant; add a page here when it joins
const PAGES = {
  'the hospital game': path.join(ROOT, 'src', 'secret-menu', 'uncharted-general', 'index.html'),
  'device assembly': path.join(ROOT, 'src', 'secret-menu', 'device-assembly', 'index.html'),
  'vital-stats': path.join(ROOT, 'src', 'secret-menu', 'vital-stats', 'index.html'),
};
const TOML = path.join(ROOT, 'netlify.toml');

function gameBackend(PAGE) {
  const html = fs.readFileSync(PAGE, 'utf8');
  const m = html.match(/const SUPA\s*=\s*\{\s*url\s*:\s*'([^']*)'\s*,\s*anonKey\s*:\s*'([^']*)'/);
  assert.ok(m, 'the SUPA constant is where the game keeps its backend address');
  return { url: m[1], key: m[2], html };
}

function cspConnectSrc() {
  const toml = fs.readFileSync(TOML, 'utf8');
  // Anchored to the start of a line: the comments above the policy also say "connect-src".
  const m = toml.match(/^connect-src ([^;]*);/m);
  assert.ok(m, 'netlify.toml carries a connect-src directive');
  return m[1].split(/\s+/).filter(Boolean);
}

for (const [game, PAGE] of Object.entries(PAGES)) {
  test(game + ': the page and the CSP name the same Supabase host, over https and wss', () => {
    const { url } = gameBackend(PAGE);
    assert.match(url, /^https:\/\/[a-z]{20}\.supabase\.co$/, 'a Supabase project URL');
    const host = url.replace(/^https:\/\//, '');
    const sources = cspConnectSrc();
    assert.ok(sources.includes('https://' + host), 'connect-src allows https to the game backend: ' + host);
    assert.ok(sources.includes('wss://' + host), 'connect-src allows the websocket to the game backend: ' + host);
    const supabaseSources = sources.filter(s => /supabase\.co$/.test(s));
    assert.strictEqual(supabaseSources.length, 2, 'exactly one Supabase project in the CSP, https and wss: ' + supabaseSources.join(' '));
  });

  test(game + ': the key shipped in the page is a publishable key, never a secret one', () => {
    const { key } = gameBackend(PAGE);
    assert.ok(key.length > 20, 'a key is present');
    assert.doesNotMatch(key, /^sb_secret_/, 'a secret key must never ship in a page');
    assert.ok(/^sb_publishable_/.test(key) || /^eyJ/.test(key), 'publishable (sb_publishable_) or legacy anon JWT');
  });

  test(game + ': the page loads the vendored supabase client and the table kit, client first', () => {
    const { html } = gameBackend(PAGE);
    const m = html.match(/<script src="(\/assets\/js\/vendor\/supabase-[^"]+\.js)"><\/script>/);
    assert.ok(m, 'the page references a vendored supabase-js file (without it the kit falls back to same-browser tables)');
    assert.ok(fs.existsSync(path.join(ROOT, 'src', m[1])), 'the vendored file exists: ' + m[1]);
    const kit = html.indexOf('/assets/js/hu-table.js');
    assert.ok(kit > -1, 'the page loads hu-table.js');
    assert.ok(html.indexOf(m[1]) < kit, 'the client loads before the kit');
  });
}

test('every game on the kit names the same backend', () => {
  const urls = new Set(Object.values(PAGES).map(p => gameBackend(p).url));
  assert.strictEqual(urls.size, 1, 'one Supabase project serves the whole table catalog: ' + [...urls].join(' '));
});
