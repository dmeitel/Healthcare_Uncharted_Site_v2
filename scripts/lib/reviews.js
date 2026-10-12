'use strict';
/**
 * reviews.js · David's page review marks, one reader and one writer for every screen that shows them.
 *
 * WHY (2026-10-11). The site-wide refresh ends in his page-by-page review, and he reviews "each page in day and night
 * themes", so a page carries two marks now, NIGHT and DAY, each with its date, a time and his note. A mark goes stale
 * when the page's own source changes after it, so a page edited after he looked shows as changed instead of done.
 * The file is data-build/page-reviews.json (where git keeps it). A mark from before 2026-10-11 has neither theme; it
 * reads as LEGACY ("before the refresh") and counts for neither.
 *
 *   entry = { night?: {date, at, note}, day?: {date, at, note}, date?, note? }   (date/note alone = legacy)
 *
 * FINISHED (2026-10-11, his first full review: "this really doesn't need to be reviewed every time"): a page on
 * data-build/review-finished.json has left the review. Its marks never go stale and it counts as done in both themes.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const FILE = path.join(ROOT, 'data-build', 'page-reviews.json');
const THEMES = ['night', 'day'];
const FINISHED = path.join(ROOT, 'data-build', 'review-finished.json');

/** The pages that have left the review, url -> {since, note}. */
function finished(file = FINISHED) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')).pages || {}; } catch (e) { return {}; }
}

function read(file = FILE) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; }
}

/** A page's source last changed, as ms, or 0 when unknown. @param {string} [src] */
function changedAt(src) {
  if (!src) return 0;
  try { return fs.statSync(path.join(ROOT, src)).mtimeMs; } catch (e) { return 0; }
}

/**
 * The marks for one page, with whether each went stale since. @param {any} entry @param {string} [src] @param {string} [url]
 * @returns {{night:any, day:any, legacy:any, nightChanged:boolean, dayChanged:boolean, finished:any}}
 */
function marks(entry, src, url) {
  const e = entry || {};
  const done = url ? finished()[url] || null : null;
  const t = done ? 0 : changedAt(src);
  const stale = (/** @type {any} */ m) => !!(m && t && m.at && t > Date.parse(m.at) + 1000);
  const legacy = e.legacy || (!e.night && !e.day && e.date ? { date: e.date, note: e.note || '' } : null);
  return { night: e.night || null, day: e.day || null, legacy, nightChanged: stale(e.night), dayChanged: stale(e.day), finished: done };
}

/** Set or clear one theme's mark. @param {string} page @param {'night'|'day'} theme @param {string} note @param {boolean} reviewed */
function set(page, theme, note, reviewed, file = FILE) {
  if (typeof page !== 'string' || !page.startsWith('/')) throw new Error('no page');
  if (!THEMES.includes(theme)) throw new Error('a theme is night or day');
  const all = read(file);
  const e = Object.assign({}, all[page] || {});
  if (!e.night && !e.day && e.date) { e.legacy = { date: e.date, note: e.note || '' }; }
  delete e.date; delete e.note;
  if (reviewed === false) delete e[theme];
  else {
    const d = new Date();
    const date = d.toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
    const next = { date, at: d.toISOString(), note: String(note || '').slice(0, 2000) };
    // a new note never erases an old one: the one it replaces goes on the mark's earlier list (2026-10-11, the
    // one-button review, where a page changed since his first pass starts with an empty box)
    const old = e[theme];
    const earlier = (old && old.earlier) || [];
    if (old && old.note && old.note !== next.note) earlier.push({ date: old.date, note: old.note });
    if (earlier.length) next.earlier = earlier.slice(-10);
    e[theme] = next;
  }
  if (!e.night && !e.day && !e.legacy) delete all[page];
  else all[page] = e;
  const sorted = Object.fromEntries(Object.keys(all).sort().map((k) => [k, all[k]]));
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
  return all[page] || null;
}

module.exports = { FILE, FINISHED, THEMES, read, marks, set, changedAt, finished };
