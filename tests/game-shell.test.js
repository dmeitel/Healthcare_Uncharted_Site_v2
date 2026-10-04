'use strict';
/* THE GAME SHELL (2026-10-03). David: "a consistent menuing system... for anything from the vital stats games to the
   nurse clicking games... the starting off menus or the top bar... make sure that we kind of stick to it." Every game wears
   the one game bar (src/_includes/components/game-bar.njk, rules in hu-global.css under THE GAME BAR), sits in the
   merged band so the site menu lives inside Menu, mounts the kit's "?" and Menu, and never restyles the bar, the name or
   the kit buttons. A game may change only the bar's background and the colour of its name's accent word.
   Plan: docs/HU-CONSISTENCY-TOOLKIT-2026-10-03.md 2.6. Skill: .claude/skills/hu-game-shell. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, '_site');
if (!fs.existsSync(SITE)) require('node:child_process').execSync('npx @11ty/eleventy', { stdio: 'inherit', cwd: ROOT });
/** @param {string} dir @returns {string[]} */
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

// A game is a page under src/fun or src/secret-menu built on the menu kit.
const GAMES = ['fun', 'secret-menu'].flatMap((d) => walk(path.join(ROOT, 'src', d)))
  .filter((f) => /index\.html$/.test(f) && /gameMenu\(/.test(fs.readFileSync(f, 'utf8')));
const rel = (/** @type {string} */ f) => path.relative(ROOT, f).split(path.sep).join('/');
const built = (/** @type {string} */ f) => path.join(SITE, path.relative(path.join(ROOT, 'src'), f));

test('there are games to hold, and every one is found', () => {
  assert.ok(GAMES.length >= 6, GAMES.length + ' games: ' + GAMES.map(rel).join(', '));
});

test('every game wears the one game bar, in the merged band', () => {
  const bad = [];
  for (const f of GAMES) {
    const src = fs.readFileSync(f, 'utf8');
    const html = fs.existsSync(built(f)) ? fs.readFileSync(built(f), 'utf8') : '';
    const why = [];
    if (!/\{%\s*from\s+"components\/game-bar\.njk"\s+import\s+gameBar\s*%\}/.test(src)) why.push('does not import gameBar');
    if (!/\{%-?\s*call\s+gameBar\(/.test(src)) why.push('does not call gameBar');
    if (!/^nav_merged:\s*true\s*$/m.test(src.slice(0, 1500))) why.push('front matter lacks nav_merged: true');
    if ((src.match(/<header class="tool-bar/g) || []).length) why.push('still draws its own <header class="tool-bar">');
    if (html && !/<header class="tool-bar game-bar">/.test(html)) why.push('built page has no game bar');
    if (html && !/<body class="nav-merged"/.test(html)) why.push('built page is not in the merged band');
    if (why.length) bad.push(rel(f) + ': ' + why.join('; '));
  }
  assert.deepStrictEqual(bad, []);
});

test('no game restyles the bar, the name or the kit buttons', () => {
  const bad = [];
  for (const f of GAMES) {
    const css = (fs.readFileSync(f, 'utf8').match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join('\n');
    // every rule whose selector names the bar, the title or the kit, and what it sets
    for (const m of css.matchAll(/([^{}]*\.(?:tool-bar|game-bar|tool-bar-title|game-kit|hu-gm-btn|hu-gm-q|tb-brand)\b[^{}]*)\{([^}]*)\}/g)) {
      const sel = m[1].trim().replace(/\s+/g, ' ');
      const decl = m[2];
      // allowed: the bar's surface, and the accent word's colour
      const props = [...decl.matchAll(/([a-z-]+)\s*:/g)].map((x) => x[1]);
      const forbidden = props.filter((p) => !/^(?:background|background-color|backdrop-filter|-webkit-backdrop-filter|border-bottom|border-bottom-color|box-shadow|color)$/.test(p));
      const colourOnName = /\.tool-bar-title\b(?!\s+span)/.test(sel) && props.includes('color');
      if (forbidden.length || colourOnName) bad.push(rel(f) + ': ' + sel + ' sets ' + (forbidden.length ? forbidden.join(', ') : 'the name\'s colour'));
    }
  }
  assert.deepStrictEqual(bad, []);
});
