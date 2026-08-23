/**
 * Minimal DOM stub for exercising hu-kit.js under node:test.
 *
 * hu-kit has no dependencies and touches a small, known surface of the DOM, so a
 * real browser is not needed to prove its logic. This stub implements exactly that
 * surface. Anything the kit starts using that is missing here will throw loudly,
 * which is the behaviour we want: a silent stub hides regressions.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KIT = path.join(__dirname, '..', '..', 'src', 'assets', 'js', 'hu-kit.js');

/** @param {string} sel @param {any} el */
function matches(el, sel) {
  if (!el) return false;
  if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('[')) {
    const m = sel.match(/^\[([^\]=]+)(?:="([^"]*)")?\]$/);
    if (!m) return false;
    const v = el.getAttribute(m[1]);
    return m[2] === undefined ? v !== null : v === m[2];
  }
  return el.tagName === sel.toUpperCase();
}

/** Create a stub element. Geometry fields are plain numbers you set in the test. */
function el(tag = 'div', attrs = {}) {
  const node = {
    tagName: tag.toUpperCase(),
    id: '',
    children: [],
    parent: null,
    hidden: false,
    style: {},
    dataset: {},
    _attrs: { ...attrs },
    focused: 0,
    offsetLeft: 0, offsetTop: 0, offsetWidth: 100, offsetHeight: 30, clientWidth: 1000,
    offsetParent: null,
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
    },
    _listeners: Object.create(null),
    /** elements take listeners too: the kit binds pointer and click to its grabber */
    addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); },
    removeEventListener(type, fn) {
      const a = this._listeners[type] || [];
      const i = a.indexOf(fn); if (i > -1) a.splice(i, 1);
    },
    /** dispatch a synthetic event at this element (tests only) */
    _fire(type, ev) { (this._listeners[type] || []).slice().forEach(fn => fn(ev || {})); },
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return this._attrs[k] == null ? null : this._attrs[k]; },
    removeAttribute(k) { delete this._attrs[k]; },
    focus() { this.focused++; node.ownerDoc.activeElement = this; },
    getBoundingClientRect() {
      return { width: this.offsetWidth, height: this.offsetHeight, left: this.offsetLeft, top: this.offsetTop };
    },
    querySelector(sel) { return this._find(sel)[0] || null; },
    querySelectorAll(sel) { return this._find(sel); },
    _find(sel) {
      const out = [];
      (function walk(n) { n.children.forEach(c => { if (matches(c, sel)) out.push(c); walk(c); }); })(this);
      return out;
    },
    closest(sel) { let n = this; while (n) { if (matches(n, sel)) return n; n = n.parent; } return null; },
    append(child) { child.parent = this; child.ownerDoc = this.ownerDoc; this.children.push(child); return child; },
    insertBefore(child) { return this.append(child); },
    appendChild(child) { return this.append(child); },
    get firstChild() { return this.children[0] || null; }
  };
  /* className has to stay in step with classList: the kit creates its grabber with
     `g.className = 'hu-sheet-grab'`, and a stub that ignored that would report the
     element as unclassed and quietly fail to find it. */
  Object.defineProperty(node, 'className', {
    get() { return [...node.classList._s].join(' '); },
    set(v) {
      node.classList._s.clear();
      String(v).split(/\s+/).filter(Boolean).forEach(c => node.classList._s.add(c));
    }
  });
  return node;
}

/**
 * Load hu-kit.js into a fresh sandbox.
 * Each call is fully isolated: its own document, its own listener set. Tools create
 * exactly one controller per page, so isolation matches reality (and stops one
 * test's controller from answering another test's synthetic events).
 */
function loadKit() {
  const listeners = {};
  const doc = {
    activeElement: null,
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    createElement(tag) { const e = el(tag); e.ownerDoc = doc; return e; },
    contains() { return true; }
  };
  const rafQueue = [];
  const ctx = {
    document: doc,
    window: {
      matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
      addEventListener() {},
      innerHeight: 800
    },
    history: { pushState() {}, replaceState() {}, back() {} },
    location: { pathname: '/', search: '', hash: '' },
    navigator: {},
    performance: { now: () => 0 },
    console,
    requestAnimationFrame(fn) { rafQueue.push(fn); return rafQueue.length; },
    cancelAnimationFrame() {},
    setTimeout(fn) { fn(); return 0; },
    clearTimeout() {},
    MutationObserver: null
  };
  ctx.window.document = doc;
  ctx.window.history = ctx.history;
  ctx.window.location = ctx.location;
  vm.createContext(ctx);
  new vm.Script(fs.readFileSync(KIT, 'utf8'), { filename: 'hu-kit.js' }).runInContext(ctx);

  return {
    HUKit: ctx.window.HUKit,
    doc,
    ctx,
    /** make an element that belongs to this sandbox's document */
    el(tag, attrs) { const e = el(tag, attrs); e.ownerDoc = doc; return e; },
    /** dispatch a synthetic document-level event */
    fire(type, ev) { (listeners[type] || []).slice().forEach(fn => fn(ev)); },
    /** run everything queued by requestAnimationFrame */
    flushRaf() { const q = rafQueue.splice(0); q.forEach(fn => fn(0)); }
  };
}

module.exports = { loadKit, el, matches, KIT };
