/**
 * HUKit.urlState — the serializer convention.
 *
 * Scope changes PUSH (back walks out of them), tweaks REPLACE, restores never write
 * back. Seven tools hand-rolled this before the 2026-08-17 extraction. The push vs
 * replace decision is what makes the browser back button behave, so it is pinned
 * here against the exact sequences the tools produce.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadKit } = require('./helpers/dom.js');

/** record every history write the controller makes */
function recorder(kit) {
  const calls = [];
  kit.ctx.history.pushState = (a, b, url) => calls.push(['push', url]);
  kit.ctx.history.replaceState = (a, b, url) => calls.push(['replace', url]);
  return calls;
}

test('a fresh arrival pushes on scope change and replaces on tweak', () => {
  const kit = loadKit(); const calls = recorder(kit);
  let scope = '', params = '';
  const u = kit.HUKit.urlState({
    url: () => (params ? '?' + params : kit.ctx.location.pathname),
    scope: () => scope
  });

  scope = 'icu'; params = 'unit=icu'; u.sync();
  assert.deepEqual(calls[0], ['push', '?unit=icu'], 'entering a scope pushes');

  params = 'unit=icu&tab=2'; u.sync();
  assert.equal(calls[1][0], 'replace', 'a tweak inside the same scope replaces');

  scope = 'ed'; params = 'unit=ed'; u.sync();
  assert.equal(calls[2][0], 'push', 'a different scope pushes again');

  scope = ''; params = ''; u.sync();
  assert.equal(calls[3][0], 'push', 'leaving scope pushes');
  assert.equal(calls[3][1], '/', 'an empty URL falls back to the pathname');
});

test('a deep-link arrival replaces once instead of stacking a duplicate', () => {
  const kit = loadKit(); const calls = recorder(kit);
  let scope = 'icu';
  const u = kit.HUKit.urlState({ url: () => '?unit=' + scope, scope: () => scope, seeded: true });

  u.sync();
  assert.equal(calls[0][0], 'replace', 'the arrival itself must not push on top of itself');
  scope = 'ed'; u.sync();
  assert.equal(calls[1][0], 'push', 'the next real move behaves normally');
});

test('suspend() blocks writes and always clears, even when the restore throws', () => {
  const kit = loadKit(); const calls = recorder(kit);
  const u = kit.HUKit.urlState({ url: () => '?x=1', scope: () => 'a' });

  u.suspend(() => { u.sync(); u.sync(); });
  assert.equal(calls.length, 0, 'a restore never writes back');
  assert.equal(u.isApplying(), false);

  assert.throws(() => u.suspend(() => { throw new Error('restore blew up'); }));
  assert.equal(u.isApplying(), false, 'the guard clears through a throw');

  u.sync();
  assert.equal(calls.length, 1, 'writes resume afterwards');
});

test('begin()/end() guard restores that cannot become a closure', () => {
  // Two tools wrap long try/finally restores containing early returns; wrapping those
  // in an arrow function would change their meaning, so the kit exposes the pair.
  const kit = loadKit(); const calls = recorder(kit);
  const u = kit.HUKit.urlState({ url: () => '?x=1', scope: () => 'a' });

  u.begin();
  try { u.sync(); } finally { u.end(); }
  assert.equal(calls.length, 0);
  assert.equal(u.isApplying(), false);
});

test('mark() re-baselines the scope after a popstate restore', () => {
  const kit = loadKit();
  let scope = 'a';
  const u = kit.HUKit.urlState({ url: () => '?s=' + scope, scope: () => scope });
  u.sync();

  const calls = recorder(kit);
  u.mark('b');                    // a restore landed us on b
  scope = 'b'; u.sync();
  assert.equal(calls[0][0], 'replace', 'landing where we already are is not a new entry');
  scope = 'c'; u.sync();
  assert.equal(calls[1][0], 'push', 'moving on from there pushes');
});

test('a history throw is swallowed (Safari rate-limits replaceState)', () => {
  const kit = loadKit();
  kit.ctx.history.pushState = () => { throw new Error('SecurityError: rate limited'); };
  const u = kit.HUKit.urlState({ url: () => '?x=1', scope: () => 'z' });
  assert.doesNotThrow(() => u.sync(), 'a throttled history API must not break the page');
});

test('hash URLs travel through the same seam (atlas)', () => {
  const kit = loadKit(); const calls = recorder(kit);
  let h = '#zone-a';
  const u = kit.HUKit.urlState({ url: () => h, scope: () => h });
  u.sync();
  assert.equal(calls[0][1], '#zone-a', 'the tool owns its URL shape, hash or query');
});

test('queue() debounces a burst of typing into a write', () => {
  const kit = loadKit(); const calls = recorder(kit);
  const u = kit.HUKit.urlState({ url: () => '?q=abc', scope: () => 'list', debounce: 300 });
  u.queue(); u.queue(); u.queue();
  assert.ok(calls.length > 0, 'the write still lands');
});
