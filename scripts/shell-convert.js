#!/usr/bin/env node
'use strict';
/**
 * shell-convert.js — move one reading page's typographic shell onto .hu-read.
 *
 *   node scripts/shell-convert.js src/learn/foo/index.html            dry run, prints the plan
 *   node scripts/shell-convert.js src/learn/foo/index.html --write    applies it
 *
 * DELIBERATELY CONSERVATIVE. It only removes a rule when EVERY property in it is typographic
 * (font, letter-spacing, line-height, color, margin, text-transform, max-width and friends).
 * A `.xx-hero` carrying a gradient, or a `.xx-card` carrying a hover border, is that page's own
 * design and must survive; those get reported as SKIPPED and handled by hand, not deleted by a
 * regex. Losing a page's look to a migration script would be a worse outcome than the drift the
 * migration exists to fix.
 */
const fs = require('fs');
const path = require('path');

/* page concept -> shell class */
/* The prefix must be ONE short segment: `.jp-p` yes, `.jp-tldr-p` no. A compound name like
   .ds-legend-p or .jp-tldr-p is a COMPONENT'S paragraph, not the page's prose, and it is very
   often a deliberately different size. An earlier, greedier version of this list matched those
   and would have quietly resized a map legend to article prose. */
const MAP = [
  [/^[a-z0-9]{2,6}-eyebrow$/,        'hu-read-eyebrow'],
  [/^[a-z0-9]{2,6}-(kick|kicker)$/,  'hu-read-kicker'],
  [/^[a-z0-9]{2,6}-(h1|hero-h1)$/,   'hu-read-h1'],
  [/^[a-z0-9]{2,6}-h2$/,             'hu-read-h2'],
  [/^[a-z0-9]{2,6}-h3$/,             'hu-read-h3'],
  [/^[a-z0-9]{2,6}-(hero-sub|standfirst)$/, 'hu-read-standfirst'],
  [/^[a-z0-9]{2,6}-p$/,              'hu-read-p'],
];

/* properties that are purely "how text looks", i.e. things the shell already decides */
const TYPO = /^(font|font-[a-z-]+|letter-spacing|line-height|color|margin|margin-[a-z]+|text-transform|text-wrap|max-width|text-align|font-feature-settings|font-variant[a-z-]*|-webkit-font-smoothing|text-rendering|opacity|padding-bottom)$/;

function rules(css) {
  const out = [];
  const re = /(^|\n)([ \t]*)((?:\.[a-zA-Z0-9_-]+|\[[^\]]+\])[^{}\n]*?)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    out.push({ index: m.index + m[1].length, length: m[0].length - m[1].length, selector: m[3].trim(), body: m[4] });
  }
  return out;
}

function classOf(selector) {
  // a single, simple class selector only. `.a .b`, `.a.b`, `[data-theme] .a` are left alone.
  const m = /^\.([a-zA-Z0-9_-]+)$/.exec(selector);
  return m ? m[1] : null;
}

function typographicOnly(body) {
  const decls = body.split(';').map((d) => d.trim()).filter(Boolean);
  if (!decls.length) return false;
  return decls.every((d) => {
    const prop = d.split(':')[0].trim().toLowerCase();
    return TYPO.test(prop);
  });
}

const file = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!file) { console.error('usage: shell-convert.js <page> [--write]'); process.exit(2); }

let src = fs.readFileSync(file, 'utf8');
const sm = /<style>[\s\S]*?<\/style>/.exec(src);
if (!sm) { console.log('no inline <style>, nothing to do'); process.exit(0); }

let css = sm[0];
const plan = [];
const skipped = [];

for (const r of rules(css)) {
  const cls = classOf(r.selector);
  if (!cls) continue;
  const hit = MAP.find(function (e) { return e[0].test(cls); });
  if (!hit) continue;
  if (!typographicOnly(r.body)) { skipped.push({ cls, why: 'carries page-specific properties', body: r.body.replace(/\s+/g, ' ').trim().slice(0, 90) }); continue; }
  plan.push({ cls, to: hit[1], selector: r.selector });
}

console.log(path.relative(process.cwd(), file));
for (const p of plan) console.log('  REMOVE  .' + p.cls.padEnd(22) + ' -> markup uses .' + p.to);
for (const s of skipped) console.log('  SKIP    .' + s.cls.padEnd(22) + ' ' + s.why + '  { ' + s.body + ' }');
if (!plan.length) { console.log('  nothing convertible'); process.exit(0); }

if (!WRITE) { console.log('  (dry run; pass --write to apply)'); process.exit(0); }

/* remove the rules, last first so earlier offsets stay valid */
for (const r of rules(css).slice().reverse()) {
  const cls = classOf(r.selector);
  if (!cls || !plan.some((p) => p.cls === cls)) continue;
  let end = r.index + r.length;
  while (end < css.length && /[ \t\r\n]/.test(css[end])) end++;
  css = css.slice(0, r.index) + css.slice(end);
}
src = src.slice(0, sm.index) + css + src.slice(sm.index + sm[0].length);

/* rewrite the markup: swap each converted class for its shell class, in place */
for (const p of plan) {
  const re = new RegExp('(class="[^"]*?\\b)' + p.cls.replace(/[-]/g, '\\-') + '(\\b[^"]*?")', 'g');
  src = src.replace(re, '$1' + p.to + '$2');
}

/* the page wrapper gains .hu-read so the shell applies */
if (!/class="[^"]*\bhu-read\b/.test(src)) {
  src = src.replace(/(<\/style>\s*\n\s*<div class=")([a-zA-Z0-9_-]+)(")/, '$1$2 hu-read$3');
}

fs.writeFileSync(file, src);
console.log('  written. ' + plan.length + ' rules removed.');
