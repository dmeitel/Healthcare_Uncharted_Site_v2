'use strict';
/**
 * run.js · what the run sheet remembers: the window that is open, what each of its steps found,
 * the pictures filed, and the last full machine gate.
 *
 * WHY. David, 2026-10-04: "getting that entire process from start to review to finish to end all
 * automated or at least sequenced properly and visually located in the admin hub... rather than
 * just moving forward on step by step by step by step assuming things are right". The open and
 * close routines already worked everything out and then printed it to a terminal that scrolled
 * away. They write it here too, and the hub's run sheet reads it.
 *
 * The file is tmp/hub/run.json. tmp/ is not in git, on purpose: this describes one computer on
 * one evening. The lasting record of a window is its close note in docs/sessions/.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, stamp, today } = require('../lib/session');
const { nextNoteId } = require('./devlog');

const DIR = path.join(ROOT, 'tmp', 'hub');
const FILE = path.join(DIR, 'run.json');

/** @typedef {{id:string, label:string, ok:boolean|null, summary:string, at?:string}} Check */
/** @typedef {{label:string, at:string, ok:boolean|null, summary:string, shots?:Record<string, string>[]}} Work */
/** @typedef {{id:string, opened:string, closed:string, open:Check[], work:Work[], close:Check[]}} Win */
/** @typedef {{at:string, ok:boolean, minutes:number, summary:string}} Gate */
/** @typedef {{window:Win|null, gate:Gate|null, history:{id:string, opened:string, closed:string}[]}} State */

/** @param {string} [file] @returns {State} */
function read(file = FILE) {
  try {
    const s = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { window: s.window || null, gate: s.gate || null, history: s.history || [] };
  } catch { return { window: null, gate: null, history: [] }; }
}

/** @param {State} s @param {string} [file] */
function write(s, file = FILE) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(s, null, 1) + '\n');
}

/** Start a window, or refresh the open steps of the one already running today. A window that was
 *  closed, or left open on an earlier day, goes to the history first.
 *  @param {Check[]} steps @param {string} [file] */
function openWindow(steps, file = FILE) {
  const s = read(file);
  const at = stamp();
  const stamped = steps.map((c) => ({ ...c, at }));
  if (s.window && !s.window.closed && s.window.opened.slice(0, 10) === today()) {
    s.window.open = stamped;
  } else {
    if (s.window) s.history = [{ id: s.window.id, opened: s.window.opened, closed: s.window.closed }, ...s.history].slice(0, 12);
    s.window = { id: nextNoteId(today()), opened: at, closed: '', open: stamped, work: [], close: [] };
  }
  write(s, file);
  return s.window;
}

/** A step of the work, as it happens: what was done, and the pictures filed with it.
 *  @param {{label:string, ok?:boolean|null, summary?:string, shots?:Record<string, string>[]}} entry @param {string} [file] */
function work(entry, file = FILE) {
  const s = read(file);
  if (!s.window || s.window.closed) s.window = { id: nextNoteId(today()), opened: stamp(), closed: '', open: [], work: [], close: [] };
  s.window.work.push({ label: entry.label, at: stamp(), ok: entry.ok === undefined ? true : entry.ok, summary: entry.summary || '', shots: entry.shots || [] });
  write(s, file);
  return s.window;
}

/** The close routine's findings. The window is closed only when nothing failed and its note exists.
 *  @param {Check[]} steps @param {{done:boolean}} how @param {string} [file] */
function closeWindow(steps, how, file = FILE) {
  const s = read(file);
  if (!s.window) s.window = { id: nextNoteId(today()), opened: stamp(), closed: '', open: [], work: [], close: [] };
  const at = stamp();
  s.window.close = steps.map((c) => ({ ...c, at }));
  s.window.closed = how.done ? at : '';
  write(s, file);
  return s.window;
}

/** The last full machine gate (`npm run qa` over the whole site). @param {{ok:boolean, minutes:number, summary:string}} g @param {string} [file] */
function gate(g, file = FILE) {
  const s = read(file);
  s.gate = { at: stamp(), ok: g.ok, minutes: g.minutes, summary: g.summary };
  write(s, file);
  return s.gate;
}

module.exports = { DIR, FILE, read, write, openWindow, work, closeWindow, gate };
