/**
 * HUKit.conusView — the home camera for the two U.S. maps.
 *
 * Both maps shipped with center [-96.5,39.3] zoom 3.6 minZoom 2.8, a camera tuned
 * on a wide desktop. At 360 CSS px that boot view showed 36% of the width of the
 * lower 48, and the 2.8 floor still only reached 63%, so a phone user could not
 * see the United States on a U.S. map at ANY zoom. Nothing caught it: there was no
 * console error, no horizontal overflow and no undersized target, so the phone gate
 * passed it CLEAN. These tests are the gate that would have failed.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadKit } = require('./helpers/dom.js');

const kit = loadKit();
const view = (w, h) => kit.HUKit.conusView({ clientWidth: w, clientHeight: h });

/** Web Mercator normalised Y, the projection MapLibre uses. */
function mercY(lat) {
  const s = Math.sin(lat * Math.PI / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
}

/** Does the lower 48 land inside w x h, centred on the returned centre? */
function fits(v, w, h) {
  const world = 512 * Math.pow(2, v.zoom);
  const C = kit.HUKit.CONUS;
  const westPx  = (v.center[0] - C.w) / 360 * world;
  const eastPx  = (C.e - v.center[0]) / 360 * world;
  const northPx = (mercY(v.center[1]) - mercY(C.n)) * world;
  const southPx = (mercY(C.s) - mercY(v.center[1])) * world;
  return westPx  <= w / 2 + 0.5 && eastPx  <= w / 2 + 0.5
      && northPx <= h / 2 + 0.5 && southPx <= h / 2 + 0.5;
}

const PHONES = [[360, 736], [390, 780], [412, 800], [430, 850]];
const WIDER  = [[600, 800], [699, 860], [768, 900], [1024, 760]];

test('THE BUG: the whole lower 48 fits on every phone width, 360 included', () => {
  for (const [w, h] of PHONES) {
    const v = view(w, h);
    assert.ok(fits(v, w, h), `lower 48 does not fit at ${w}x${h} (zoom ${v.zoom})`);
  }
});

test('the zoom floor never sits above the home view, which is what made it unreachable', () => {
  for (const [w, h] of [...PHONES, ...WIDER, [1280, 900], [1680, 1000]]) {
    const v = view(w, h);
    assert.ok(v.minZoom < v.zoom,
      `minZoom ${v.minZoom} >= home zoom ${v.zoom} at ${w}x${h}: the user cannot zoom out to the country`);
  }
});

test('tablets and small laptops fit it too, not just phones', () => {
  for (const [w, h] of WIDER) {
    const v = view(w, h);
    assert.ok(fits(v, w, h), `lower 48 does not fit at ${w}x${h} (zoom ${v.zoom})`);
  }
});

test('desktop keeps the shipped frame exactly: centre, zoom 3.6, floor 2.8', () => {
  for (const [w, h] of [[1280, 900], [1440, 900], [1680, 1000]]) {
    const v = view(w, h);
    assert.equal(v.center[0], -96.5, `centre lng moved at ${w}x${h}`);
    assert.equal(v.center[1], 39.3, `centre lat moved at ${w}x${h}`);
    assert.equal(v.zoom, 3.6, `desktop zoom changed at ${w}x${h}`);
    assert.equal(v.minZoom, 2.8, `desktop floor changed at ${w}x${h}`);
  }
});

test('the centre never moves: the bug was the zoom and the floor, not the centre', () => {
  for (const [w, h] of [...PHONES, ...WIDER]) {
    const c = view(w, h).center;
    assert.equal(c[0], -96.5);
    assert.equal(c[1], 39.3);
  }
});

test('narrower viewports get a smaller zoom, monotonically', () => {
  const zooms = [[360, 800], [430, 800], [600, 800], [768, 800], [1024, 800], [1280, 800]]
    .map(([w, h]) => view(w, h).zoom);
  for (let i = 1; i < zooms.length; i++) {
    assert.ok(zooms[i] >= zooms[i - 1],
      `zoom went down as the viewport got wider: ${zooms[i - 1]} then ${zooms[i]}`);
  }
});

test('a degenerate container does not produce a broken camera', () => {
  for (const v of [view(0, 0), kit.HUKit.conusView(null)]) {
    assert.ok(Number.isFinite(v.zoom) && v.zoom > 0, 'zoom is not a usable number');
    assert.ok(v.minZoom < v.zoom, 'floor inverted on a degenerate container');
  }
});

/**
 * THE RACE. Both maps construct the map before layout has run, so the very first
 * conusView() call sees clientWidth/clientHeight of 0. An earlier version fell back
 * to a fixed 300px stub, which returned zoom 1.6 — far enough out that the country
 * sat tiny in an ocean of Canada until a later reset snapped it into place. The
 * fallback must be the window, which is already correct at that moment.
 */
test('an unlaid-out container falls back to the window, not to a stub', () => {
  kit.ctx.window.innerWidth = 360;
  kit.ctx.window.innerHeight = 800;
  const beforeLayout = kit.HUKit.conusView({ clientWidth: 0, clientHeight: 0 });
  const afterLayout  = view(360, 736);   // 800 minus the 64px site header
  assert.equal(beforeLayout.zoom, afterLayout.zoom,
    'boot camera differs from the laid-out camera: the map will visibly snap on load');
  assert.equal(beforeLayout.minZoom, afterLayout.minZoom);
  assert.ok(beforeLayout.zoom > 1.9,
    `boot zoom ${beforeLayout.zoom} is the far-out stub value, not a real fit`);
});
