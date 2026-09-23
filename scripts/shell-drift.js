#!/usr/bin/env node
'use strict';
/**
 * shell-drift.js — count, per reading page, how many times it redeclares something the
 * shared .hu-read shell already owns.
 *
 * WHY. Every reading page on this site declared its own hero, eyebrow, headings, paragraph,
 * cards and callout, because docs/HU-PAGE-RECIPES.md used to say "copy this block, rename the
 * prefix". Forks drift. Measured 2026-09-22: five different h1 sizes across 14 pages, eight
 * different hero paddings across 13, eight eyebrow letter-spacings, four paragraph
 * line-heights. Nothing broken, so no existing gate could see any of it.
 *
 * This is the missing measurement. Every other check in this repo asks a question about ONE
 * page ("does it overflow, is the text readable"). None of them ask whether page A looks like
 * page B, which is the only question that catches drift.
 *
 *   node scripts/shell-drift.js            print the table
 *   node scripts/shell-drift.js --json     emit the baseline for tests/reading-shell.test.js
 *
 * The test that consumes this is a RATCHET: a page may never gain shell declarations, only
 * lose them. That turns "make the site consistent" from a taste argument into a number going
 * to zero.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

/* Concepts the shell owns. A page declaring one of these has its own private copy of
   something that should be identical everywhere. Bespoke prefixes are NOT listed here on
   purpose: a diagram, a board or a figure staying page-scoped is correct, not drift. */
const OWNED = [
  ['hero',       /\.[a-z]{2,6}-hero(-inner|-wrap)?\s*\{/g],
  ['eyebrow',    /\.[a-z]{2,6}-(eyebrow|kick|kicker)\s*\{/g],
  ['h1',         /\.[a-z]{2,6}-(h1|hero-h1)\s*\{/g],
  ['h2',         /\.[a-z]{2,6}-h2\s*\{/g],
  ['h3',         /\.[a-z]{2,6}-(h3|card-h)\s*\{/g],
  ['standfirst', /\.[a-z]{2,6}-(hero-sub|standfirst|lede)\s*\{/g],
  ['paragraph',  /\.[a-z]{2,6}-p\s*\{/g],
  ['note',       /\.[a-z]{2,6}-(note|callout)\s*\{/g],
  ['card',       /\.[a-z]{2,6}-card\s*\{/g],
  ['grid',       /\.[a-z]{2,6}-grid\s*\{/g],
  ['link',       /\.[a-z]{2,6}-links?\s*\{/g],
];

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|njk)$/.test(e.name)) out.push(p);
  }
  return out;
}

/** A reading page is one that is not wearing the tool shell and is not a full-screen game. */
function isReadingPage(src) {
  return !/tool-bar|hu-shell|no_footer:\s*true/.test(src);
}

function inlineCss(src) {
  const blocks = src.match(/<style>[\s\S]*?<\/style>/g) || [];
  return blocks.join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
}

function scan() {
  const rows = [];
  for (const file of walk(SRC, []).sort()) {
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes('<style>') || !isReadingPage(src)) continue;
    const css = inlineCss(src);
    const hits = {};
    let total = 0;
    for (const [name, re] of OWNED) {
      const n = (css.match(re) || []).length;
      if (n) { hits[name] = n; total += n; }
    }
    rows.push({ page: path.relative(ROOT, file).split(path.sep).join('/'), total, hits });
  }
  return rows.sort((a, b) => b.total - a.total || a.page.localeCompare(b.page));
}

const rows = scan();

if (process.argv.includes('--json')) {
  const baseline = {};
  for (const r of rows) if (r.total) baseline[r.page] = r.total;
  process.stdout.write(JSON.stringify(baseline, null, 2) + '\n');
} else {
  const drifted = rows.filter((r) => r.total > 0);
  const clean = rows.filter((r) => r.total === 0);
  console.log('READING PAGES REDECLARING THE SHARED SHELL');
  console.log('');
  for (const r of drifted) {
    console.log('  ' + String(r.total).padStart(3) + '  ' + r.page);
    console.log('       ' + Object.entries(r.hits).map(([k, v]) => k + (v > 1 ? '(' + v + ')' : '')).join(', '));
  }
  console.log('');
  console.log('  ' + drifted.length + ' of ' + rows.length + ' reading pages carry their own shell, '
    + rows.reduce((s, r) => s + r.total, 0) + ' declarations in total');
  console.log('  ' + clean.length + ' already clean: ' + (clean.map((r) => r.page).join(', ') || 'none'));
}
