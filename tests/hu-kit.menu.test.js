/**
 * The game menus · HUKit.dialog, .gameMenu, .settings, .howTo and .confirm.
 *
 * David, 2026-09-23: "For all of our games the menuing should not be hard to figure out and
 * should follow what the best and highest rated and consumed apps do." Five games had each built
 * their own overlays, so the X, Esc, the phone back gesture, help and settings behaved five ways
 * (docs/HU-GAME-MENUS-2026-09-23.md, section 4). These pin the one set the kit now carries.
 *
 * The strict stub in tests/helpers/dom.js has no <dialog>, no history and no MutationObserver,
 * and other kit tests depend on it staying that way, so nothing here changes it. Two local
 * harnesses add what a case needs instead: nativeKit() gives <dialog> elements showModal and
 * close, and phoneKit() adds a counting history, popstate and an observer on a phone. A plain
 * loadKit() is the engine without showModal, which is the kit's fallback path.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadKit } = require('./helpers/dom.js');

/** an event object whose preventDefault is observable, as a browser's is */
function ev(extra) {
  return Object.assign({ defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }, extra || {});
}
const click = (el, extra) => el._fire('click', ev(extra));
const tick = () => new Promise(r => setImmediate(r));
/** objects made inside the kit's sandbox carry its own Object.prototype; compare them as data */
const plain = o => JSON.parse(JSON.stringify(o));

/** a kit whose <dialog> elements behave like the browser's: showModal, close and the open flag */
function nativeKit(kit) {
  kit = kit || loadKit();
  const make = kit.doc.createElement;
  kit.doc.createElement = function (tag) {
    const e = make(tag);
    if (tag === 'dialog') {
      e.open = false;
      e.showModal = function () { if (this.open) throw new Error('InvalidStateError'); this.open = true; this.setAttribute('open', ''); };
      e.close = function () { if (!this.open) return; this.open = false; this.removeAttribute('open'); this._fire('close', {}); };
    }
    return e;
  };
  return kit;
}

/**
 * A phone, with the parts HUKit.backGuard listens to: window popstate, a history that counts its
 * entries, and a MutationObserver that delivers when settle() runs, the way a real one delivers
 * after the task. Must be built BEFORE the first card, because the guard wires on the first card.
 */
function phoneKit() {
  const kit = nativeKit();
  kit.HUKit.PHONE_MQ.matches = true;
  const win = kit.ctx.window;
  const pop = [];
  win.addEventListener = (type, fn) => { if (type === 'popstate') pop.push(fn); };
  const hist = { depth: 0, pushes: 0, backs: 0, pending: 0 };
  kit.ctx.history.pushState = () => { hist.depth++; hist.pushes++; };
  kit.ctx.history.back = () => { hist.backs++; hist.pending++; };   // the popstate arrives later
  const watched = [];
  win.MutationObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(target) { watched.push({ mo: this, target, was: target.classList.contains('open') }); }
  };
  /** deliver observer records, then any history.back() the kit asked for */
  function settle() {
    for (let i = 0; i < 8; i++) {
      watched.forEach(w => { const is = w.target.classList.contains('open'); if (is !== w.was) { w.was = is; w.mo.cb([]); } });
      if (!hist.pending) return;
      hist.pending--; hist.depth--; pop.forEach(fn => fn({}));
    }
  }
  /** the reader presses back: the browser pops one entry and fires popstate */
  function back() { hist.depth--; pop.forEach(fn => fn({})); settle(); }
  return { kit, hist, settle, back };
}

/** a key-value store shaped like localStorage */
function memStore(seed) {
  const m = new Map(Object.entries(seed || {}));
  return {
    m,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); }
  };
}

const find = (root, cls) => root.querySelectorAll('.' + cls);
const one = (root, cls) => root.querySelector('.' + cls);
const cards = kit => kit.doc.body.children.filter(c => c.tagName === 'DIALOG');
const lastConfirm = kit => cards(kit).filter(c => c.classList.contains('hu-dlg--confirm')).pop();
const labels = menu => find(menu.el, 'hu-gm-row').map(r => r.textContent);
/** an opener button on the page, focused, the way a toolbar control would be */
function opener(kit) { const b = kit.doc.body.append(kit.el('button')); b.focus(); return b; }

/* ── dialog ─────────────────────────────────────────────────────────────── */

test('a card is a <dialog> named by its h2, with an X called Close', () => {
  const kit = nativeKit();
  const d = kit.HUKit.dialog({ title: 'Menu' });
  assert.equal(d.el.tagName, 'DIALOG');
  const h = d.el.querySelector('h2');
  assert.equal(h.textContent, 'Menu');
  assert.equal(d.el.getAttribute('aria-labelledby'), h.id, 'the dialog takes its name from the title');
  assert.equal(d.x.getAttribute('aria-label'), 'Close');
  assert.equal(d.x.getAttribute('type'), 'button', 'the X never submits anything');
  assert.equal(d.isOpen(), false, 'built closed');
});

test('open puts focus on the first control, and the X closes it and hands focus back', () => {
  const kit = nativeKit();
  const from = opener(kit);
  const closed = [];
  let inside = null;
  const d = kit.HUKit.dialog({
    title: 'Menu',
    body: body => { inside = body.appendChild(kit.el('button')); },
    onClose: why => closed.push(why)
  });
  d.open();
  assert.equal(d.isOpen(), true);
  assert.equal(d.el.open, true, 'opened as a modal');
  assert.equal(kit.doc.activeElement, inside, 'focus starts on the first control, not the X');
  click(d.x);
  assert.equal(d.isOpen(), false);
  assert.equal(d.el.open, false);
  assert.deepEqual(closed, ['x']);
  assert.equal(kit.doc.activeElement, from, 'focus goes back to what opened it');
});

test('Escape arrives as the cancel event, and the kit closes the card itself', () => {
  const kit = nativeKit();
  const closed = [];
  const d = kit.HUKit.dialog({ title: 'Settings', onClose: why => closed.push(why) });
  d.open();
  const e = ev();
  d.el._fire('cancel', e);
  assert.equal(e.defaultPrevented, true, 'the browser is stopped so focus return and onClose run');
  assert.equal(d.isOpen(), false);
  assert.deepEqual(closed, ['esc']);
});

test('stacked cards: Escape closes only the top one, and focus lands back in the one below', () => {
  const kit = nativeKit();
  let row = null;
  const menu = kit.HUKit.dialog({ title: 'Menu', body: b => { row = b.appendChild(kit.el('button')); } });
  const confirm = kit.HUKit.dialog({ title: 'Restart the shift?' });
  menu.open();
  assert.equal(kit.doc.activeElement, row);
  confirm.open();
  assert.equal(kit.HUKit.dialog.anyOpen(), true);
  assert.ok(menu.el.classList.contains('hu-dlg--under'), 'the card below steps out of view on a phone');
  menu.el._fire('cancel', ev());
  assert.equal(menu.isOpen(), true, 'a stray cancel at the lower card is ignored');
  confirm.el._fire('cancel', ev());
  assert.equal(confirm.isOpen(), false, 'the top card closed');
  assert.equal(menu.isOpen(), true, 'the menu under it did not');
  assert.ok(!menu.el.classList.contains('hu-dlg--under'), 'and it is back in view');
  assert.equal(kit.doc.activeElement, row, 'focus is back on the row that opened the confirm');
  menu.el._fire('cancel', ev());
  assert.equal(kit.HUKit.dialog.anyOpen(), false);
});

test('without showModal the card still opens, and Escape on the page closes the top one only', () => {
  const kit = loadKit();   // the stub has no showModal: the kit's fallback path
  const a = kit.HUKit.dialog({ title: 'Menu' });
  const b = kit.HUKit.dialog({ title: 'Help' });
  a.open(); b.open();
  assert.equal(a.el.getAttribute('open'), '', 'opened with the attribute');
  assert.ok(a.el.classList.contains('hu-dlg--nm'), 'and marked so the CSS pins it');
  const e = ev({ key: 'Escape' });
  kit.fire('keydown', e);
  assert.equal(b.isOpen(), false);
  assert.equal(a.isOpen(), true);
  assert.equal(e.defaultPrevented, true);
  kit.fire('keydown', ev({ key: 'Escape' }));
  assert.equal(a.isOpen(), false);
  assert.equal(a.el.getAttribute('open'), null);
});

test('the phone back gesture closes the top card, one card per press', () => {
  const p = phoneKit();
  const menu = p.kit.HUKit.dialog({ title: 'Menu' });
  const help = p.kit.HUKit.dialog({ title: 'How to play' });
  menu.open(); p.settle();
  assert.equal(p.hist.depth, 1, 'one spare entry while a card is up');
  help.open(); p.settle();
  assert.equal(p.hist.depth, 1, 'still one: the stack shares a single guard');
  p.back();
  assert.equal(help.isOpen(), false, 'back closed the top card');
  assert.equal(menu.isOpen(), true, 'and only that one');
  assert.equal(p.hist.depth, 1, 're-armed for the card still up');
  p.back();
  assert.equal(menu.isOpen(), false);
  assert.equal(p.hist.depth, 0, 'the history is where it started');
  assert.equal(p.hist.backs, 0, 'and the kit never had to walk it back itself');
  assert.equal(p.kit.HUKit.dialog.consumed(), true, 'a page popstate handler can tell it was ours');
});

test('a card closed by its X eats the spare history entry, so back still leaves the page', () => {
  const p = phoneKit();
  const d = p.kit.HUKit.dialog({ title: 'Menu' });
  d.open(); p.settle();
  assert.equal(p.hist.depth, 1);
  click(d.x); p.settle();
  assert.equal(p.hist.backs, 1, 'the kit stepped back over its own entry');
  assert.equal(p.hist.depth, 0);
  assert.equal(d.isOpen(), false);
});

test('a backdrop tap closes only a card that asks for it, and only a tap that started outside', () => {
  const kit = nativeKit();
  const plain = kit.HUKit.dialog({ title: 'Menu' });
  plain.open();
  plain.el._fire('pointerdown', { target: plain.el });
  plain.el._fire('click', { target: plain.el });
  assert.equal(plain.isOpen(), true, 'off by default');
  plain.close();

  const closed = [];
  const d = kit.HUKit.dialog({ title: 'How to play', backdropClose: true, onClose: w => closed.push(w) });
  d.open();
  d.el._fire('pointerdown', { target: d.body });   // a drag that began inside the card
  d.el._fire('click', { target: d.el });
  assert.equal(d.isOpen(), true, 'a drag out of the card does not shut it');
  d.el._fire('pointerdown', { target: d.el });
  d.el._fire('click', { target: d.el });
  assert.equal(d.isOpen(), false);
  assert.deepEqual(closed, ['backdrop']);
});

/* ── confirm ────────────────────────────────────────────────────────────── */

test('confirm names the act, puts it first, and resolves true only from it', async () => {
  const kit = nativeKit();
  const answer = kit.HUKit.confirm({ verb: 'Restart the shift', body: 'Your score so far is lost.' });
  const c = lastConfirm(kit);
  const btns = find(c, 'hu-dlg-btn');
  assert.deepEqual(btns.map(b => b.textContent), ['Restart the shift', 'Cancel'], 'the verb first, then Cancel');
  assert.ok(btns[0].classList.contains('hu-dlg-btn--primary'));
  assert.equal(c.querySelector('h2').textContent, 'Restart the shift?', 'the title defaults to the question');
  assert.equal(c.getAttribute('role'), 'alertdialog');
  assert.equal(c.getAttribute('aria-describedby'), one(c, 'hu-dlg-text').id, 'the body is read with the question');
  assert.equal(kit.doc.activeElement, btns[0], 'a safe confirm starts on the verb');
  click(btns[0]);
  assert.equal(await answer, true);
});

test('Cancel, the X, Escape and the back gesture all resolve false', async () => {
  const kit = nativeKit();
  let a = kit.HUKit.confirm({ verb: 'Restart the shift' });
  click(find(lastConfirm(kit), 'hu-dlg-btn')[1]);
  assert.equal(await a, false, 'Cancel');
  a = kit.HUKit.confirm({ verb: 'Restart the shift' });
  click(one(lastConfirm(kit), 'hu-dlg-x'));
  assert.equal(await a, false, 'the X');
  a = kit.HUKit.confirm({ verb: 'Restart the shift' });
  lastConfirm(kit)._fire('cancel', ev());
  assert.equal(await a, false, 'Escape');

  const p = phoneKit();
  a = p.kit.HUKit.confirm({ verb: 'Restart the shift' });
  p.settle();
  p.back();
  assert.equal(await a, false, 'back');
  assert.equal(p.hist.depth, 0);
});

test('a dangerous confirm is drawn red and starts on Cancel, so a stray Enter destroys nothing', () => {
  const kit = nativeKit();
  kit.HUKit.confirm({ verb: 'Fire the CEO', danger: true });
  const btns = find(lastConfirm(kit), 'hu-dlg-btn');
  assert.ok(btns[0].classList.contains('hu-dlg-btn--danger'));
  assert.ok(!btns[0].classList.contains('hu-dlg-btn--primary'));
  assert.equal(kit.doc.activeElement, btns[1]);
});

test('confirm refuses a button that does not name the act', () => {
  const kit = nativeKit();
  for (const verb of ['Yes', 'OK', 'okay', '', undefined]) {
    assert.throws(() => kit.HUKit.confirm({ verb }), /names the act/, JSON.stringify(verb));
  }
});

/* ── settings ───────────────────────────────────────────────────────────── */

const ROWS = kit => [kit.HUKit.settings.assist.moreTime, { key: 'sound', label: 'Sound', help: 'Alarms play out loud.', value: true }];

test('settings draw one switch row per setting and apply a flip at once', () => {
  const kit = nativeKit();
  kit.ctx.window.localStorage = memStore();
  const changes = [];
  const s = kit.HUKit.settings({ id: 'af', rows: ROWS(kit), onChange: (k, v, all) => changes.push([k, v, all]) });
  const rows = find(s.list, 'hu-gm-toggle');
  assert.equal(rows.length, 2);
  const [more, sound] = rows;
  assert.equal(more.getAttribute('role'), 'switch');
  assert.equal(more.getAttribute('type'), 'button');
  assert.equal(more.getAttribute('aria-checked'), 'false', 'the preset default');
  assert.equal(sound.getAttribute('aria-checked'), 'true', 'the game default');
  const name = kit.doc.body.querySelector('#' + more.getAttribute('aria-labelledby'));
  const help = kit.doc.body.querySelector('#' + more.getAttribute('aria-describedby'));
  assert.equal(name.textContent, 'More time');
  assert.equal(help.textContent, 'Clocks and countdowns run slower.', 'one line under the label');
  click(more);
  assert.equal(more.getAttribute('aria-checked'), 'true', 'applied on the flip, no Save');
  assert.ok(one(more, 'hu-sw').classList.contains('on'), 'the picture follows');
  assert.deepEqual(plain(changes), [['moreTime', true, { moreTime: true, sound: true }]]);
  assert.equal(s.get('moreTime'), true);
  s.set('sound', false);
  assert.equal(sound.getAttribute('aria-checked'), 'false');
  assert.equal(changes.length, 1, 'set() from code does not call the game back');
  assert.equal(find(s.el, 'hu-dlg-btn').length, 0, 'and there is no Save button');
});

test('settings are remembered between visits, per game', () => {
  const store = memStore();
  const first = nativeKit(); first.ctx.window.localStorage = store;
  const s1 = first.HUKit.settings({ id: 'af', rows: ROWS(first) });
  click(find(s1.list, 'hu-gm-toggle')[0]);
  assert.deepEqual(JSON.parse(store.getItem('hu-settings-af')), { moreTime: true, sound: true });

  const again = nativeKit(); again.ctx.window.localStorage = store;
  const s2 = again.HUKit.settings({ id: 'af', rows: ROWS(again) });
  assert.equal(s2.get('moreTime'), true, 'the flip survived the reload');
  assert.equal(find(s2.list, 'hu-gm-toggle')[0].getAttribute('aria-checked'), 'true');
  const other = again.HUKit.settings({ id: 'ug', rows: ROWS(again) });
  assert.equal(other.get('moreTime'), false, 'another game keeps its own');
});

test('with no storage at all, settings draw their defaults and still flip', () => {
  const kit = nativeKit();   // the stub window has no localStorage
  const s = kit.HUKit.settings({ id: 'af', rows: ROWS(kit) });
  assert.deepEqual(plain(s.values()), { moreTime: false, sound: true });
  click(find(s.list, 'hu-gm-toggle')[0]);
  assert.equal(s.get('moreTime'), true);
});

test('a store that throws on every touch does not break the card', () => {
  const blocked = nativeKit();
  Object.defineProperty(blocked.ctx.window, 'localStorage', { get() { throw new Error('SecurityError'); } });
  const a = blocked.HUKit.settings({ id: 'af', rows: ROWS(blocked) });
  assert.deepEqual(plain(a.values()), { moreTime: false, sound: true }, 'reading it threw; the defaults drew');
  click(find(a.list, 'hu-gm-toggle')[0]);
  assert.equal(a.get('moreTime'), true, 'writing it threw; the flip still applied');

  const full = nativeKit();
  full.ctx.window.localStorage = { getItem() { throw new Error('nope'); }, setItem() { throw new Error('QuotaExceededError'); } };
  const b = full.HUKit.settings({ id: 'af', rows: ROWS(full) });
  click(find(b.list, 'hu-gm-toggle')[1]);
  assert.equal(b.get('sound'), false);

  const junk = nativeKit();
  junk.ctx.window.localStorage = memStore({ 'hu-settings-af': '{not json' });
  assert.deepEqual(plain(junk.HUKit.settings({ id: 'af', rows: ROWS(junk) }).values()), { moreTime: false, sound: true }, 'a corrupt save reads as none');
});

test('the assist presets are three rows a game opts into, and none repeats a device setting', () => {
  const kit = nativeKit();
  const a = kit.HUKit.settings.assist;
  assert.deepEqual(Object.keys(a), ['moreTime', 'soundsAsText', 'hints']);
  assert.deepEqual(Object.values(a).map(r => r.label), ['More time', 'Show sounds as text', 'Hints']);
  for (const r of Object.values(a)) {
    assert.ok(r.help && !r.help.includes(String.fromCharCode(0x2014)), r.key + ' has one line of help, and no dash');
    assert.ok(!/motion|theme|dark|light/i.test(r.key + r.label), r.key + ' is not a device setting');
  }
  assert.ok(Object.isFrozen(a) && Object.isFrozen(a.hints), 'one game cannot change another game\'s preset');
});

/* ── how to play ────────────────────────────────────────────────────────── */

test('the how-to card opens by itself on the first visit only, and on request after that', () => {
  const store = memStore();
  const first = nativeKit(); first.ctx.window.localStorage = store;
  const h1 = first.HUKit.howTo({ id: 'af', rules: ['Tap a patient to answer an alarm.', 'A red alarm cannot wait.', 'The shift ends at 7.'] });
  assert.equal(h1.isOpen(), true, 'a first visit opens it');
  assert.equal(store.getItem('hu-howto-af'), null, 'not yet remembered: a reload mid-read shows it again');
  click(h1.dialog.x);
  assert.equal(store.getItem('hu-howto-af'), '1');

  const again = nativeKit(); again.ctx.window.localStorage = store;
  const h2 = again.HUKit.howTo({ id: 'af', rules: ['One.'] });
  assert.equal(h2.isOpen(), false, 'a return visit does not');
  assert.equal(h2.seen(), true);
  assert.equal(h2.firstVisit(), false);
  h2.open();
  assert.equal(h2.isOpen(), true, 'it still opens when asked');

  const other = again.HUKit.howTo({ id: 'ug', rules: ['One.'], auto: false });
  assert.equal(other.isOpen(), false, 'auto:false leaves the moment to the game');
  assert.equal(other.firstVisit(), true);
});

test('the how-to card draws at most three rules and starts on its title, not on a control', () => {
  const kit = nativeKit();
  const warn = console.warn; console.warn = () => {};
  let h;
  try { h = kit.HUKit.howTo({ id: 'x', rules: ['a', 'b', 'c', 'd'], example: kit.el('div') }); }
  finally { console.warn = warn; }
  assert.equal(find(h.el, 'hu-gm-rules')[0].children.length, 3);
  assert.equal(one(h.el, 'hu-gm-cap').textContent, 'Example');
  assert.equal(kit.doc.activeElement, h.dialog.heading, 'the title: a screen reader starts at the top, and no ring lights up at first paint');
  assert.equal(h.dialog.heading.getAttribute('tabindex'), '-1', 'reachable by script, never a Tab stop');

  const k2 = nativeKit();
  let ran = 0;
  const g = k2.HUKit.howTo({ id: 'y', rules: ['a'], action: { label: 'Clock in', run: () => ran++ } });
  const go = one(g.el, 'hu-gm-go');
  assert.equal(k2.doc.activeElement, go, 'a game-named go button takes focus');
  click(go);
  assert.equal(g.isOpen(), false);
  assert.equal(ran, 1);
});

test('the "?" is named How to play, opens the card and says so', () => {
  const kit = nativeKit();
  const h = kit.HUKit.howTo({ id: 'af', rules: ['One.'], auto: false });
  const q = h.button();
  assert.equal(q.tagName, 'BUTTON');
  assert.equal(q.getAttribute('aria-label'), 'How to play');
  assert.equal(q.getAttribute('aria-expanded'), 'false');
  q.focus();
  click(q);
  assert.equal(h.isOpen(), true);
  assert.equal(q.getAttribute('aria-expanded'), 'true');
  h.close();
  assert.equal(q.getAttribute('aria-expanded'), 'false');
  assert.equal(kit.doc.activeElement, q, 'focus comes home to the "?"');
});

/* ── game menu ──────────────────────────────────────────────────────────── */

function fullMenu(kit, extra) {
  const help = kit.HUKit.howTo({ id: 'af', rules: ['One.'], auto: false });
  const settings = kit.HUKit.settings({ id: 'af', rows: [kit.HUKit.settings.assist.hints] });
  const ran = { restart: 0, resume: 0 };
  const menu = kit.HUKit.gameMenu(Object.assign({
    title: 'Alarm Fatigue',
    help, settings,
    restart: { verb: 'Restart the shift', body: 'Your score so far is lost.', run: () => ran.restart++ },
    leave: { href: '/learn/' },
    onResume: () => ran.resume++
  }, extra || {}));
  return { menu, help, settings, ran };
}

test('the menu rows come in one fixed order, and a row the game does not give is not drawn', () => {
  const kit = nativeKit();
  const { menu } = fullMenu(kit);
  assert.deepEqual(labels(menu), ['Resume', 'Help', 'Settings', 'Restart', 'Leave', 'Site menu']);
  const leave = find(menu.el, 'hu-gm-row')[4];
  assert.equal(leave.tagName, 'A', 'Leave is a real link');
  assert.equal(leave.getAttribute('href'), '/learn/');
  assert.deepEqual(labels(kit.HUKit.gameMenu({})), ['Resume', 'Site menu']);
  assert.deepEqual(labels(kit.HUKit.gameMenu({ siteMenu: false, leave: { href: '/', label: 'Back to Learn' } })), ['Resume', 'Back to Learn']);
});

test('Resume is the one primary, first, where focus starts, and it closes the menu', () => {
  const kit = nativeKit();
  const { menu, ran } = fullMenu(kit);
  const closed = [];
  const m2 = kit.HUKit.gameMenu({ onClose: w => closed.push(w) });
  const rows = find(menu.el, 'hu-gm-row');
  assert.deepEqual(rows.map(r => r.classList.contains('hu-gm-row--primary')), [true, false, false, false, false, false]);
  menu.open();
  assert.equal(kit.doc.activeElement, rows[0]);
  click(rows[0]);
  assert.equal(menu.isOpen(), false);
  assert.equal(ran.resume, 1);
  m2.open(); click(find(m2.el, 'hu-gm-row')[0]);
  assert.deepEqual(closed, ['resume'], 'onClose hears every way out');
});

test('Restart goes through a confirm that names the game\'s verb', async () => {
  const kit = nativeKit();
  const { menu, ran } = fullMenu(kit);
  menu.open();
  const restart = find(menu.el, 'hu-gm-row')[3];
  click(restart);
  let c = lastConfirm(kit);
  assert.ok(c, 'a confirm opened');
  assert.equal(ran.restart, 0, 'nothing restarted on one tap');
  const [verb, cancel] = find(c, 'hu-dlg-btn');
  assert.equal(verb.textContent, 'Restart the shift');
  assert.ok(verb.classList.contains('hu-dlg-btn--danger'));
  click(cancel); await tick();
  assert.equal(ran.restart, 0);
  assert.equal(menu.isOpen(), true, 'Cancel lands back on the menu');
  assert.equal(kit.doc.activeElement, restart);

  click(restart);
  c = lastConfirm(kit);
  click(find(c, 'hu-dlg-btn')[0]); await tick();
  assert.equal(ran.restart, 1, 'the verb restarts');
  assert.equal(menu.isOpen(), false, 'and the menu gets out of the way');
});

test('Help and Settings open over the menu, and closing them lands back on it', () => {
  const kit = nativeKit();
  const { menu, help, settings } = fullMenu(kit);
  menu.open();
  const rows = find(menu.el, 'hu-gm-row');
  click(rows[1]);
  assert.equal(help.isOpen(), true);
  assert.equal(menu.isOpen(), true, 'the menu waits underneath');
  help.dialog.el._fire('cancel', ev());
  assert.equal(kit.doc.activeElement, rows[1]);
  click(rows[2]);
  assert.equal(settings.isOpen(), true);
  click(settings.dialog.x);
  assert.equal(menu.isOpen(), true);
  assert.equal(kit.doc.activeElement, rows[2]);
});

test('the menu button carries the word Menu and follows the menu open and shut', () => {
  const kit = nativeKit();
  const { menu } = fullMenu(kit);
  const b = menu.button();
  assert.equal(b.getAttribute('type'), 'button');
  assert.match(b.innerHTML, /<span>Menu<\/span>/, 'a visible word, not an icon alone');
  assert.equal(b.getAttribute('aria-haspopup'), 'dialog');
  b.focus();
  click(b);
  assert.equal(menu.isOpen(), true);
  assert.equal(b.getAttribute('aria-expanded'), 'true');
  menu.el._fire('cancel', ev());
  assert.equal(b.getAttribute('aria-expanded'), 'false');
  assert.equal(kit.doc.activeElement, b);
});

test('escOpens: Escape with nothing open opens the menu, and never while a card is up', () => {
  const kit = nativeKit();
  const { menu, help } = fullMenu(kit, { escOpens: true });
  const e = ev({ key: 'Escape' });
  kit.fire('keydown', e);
  assert.equal(menu.isOpen(), true);
  assert.equal(e.defaultPrevented, true, 'the press is spent, so it cannot reach the new card as cancel');
  kit.fire('keydown', ev({ key: 'Escape' }));
  assert.equal(menu.isOpen(), true, 'Esc does not reopen what is open; the browser cancel closes it');
  menu.close();
  help.open();
  kit.fire('keydown', ev({ key: 'Escape' }));
  assert.equal(menu.isOpen(), false, 'a card is up, so Esc belongs to it');
  help.close();

  const k2 = nativeKit();
  let busy = true;
  const m2 = k2.HUKit.gameMenu({ escOpens: () => !busy });
  k2.fire('keydown', ev({ key: 'Escape' }));
  assert.equal(m2.isOpen(), false, 'the game said it had something of its own open');
  busy = false;
  k2.fire('keydown', ev({ key: 'Escape' }));
  assert.equal(m2.isOpen(), true);

  const k3 = loadKit();   // the fallback path: Esc closes the menu, and the same press must not reopen it
  const m3 = k3.HUKit.gameMenu({ escOpens: true });
  k3.fire('keydown', ev({ key: 'Escape' }));
  assert.equal(m3.isOpen(), true);
  k3.fire('keydown', ev({ key: 'Escape' }));
  assert.equal(m3.isOpen(), false);
});

test('the Site menu row closes the game menu and presses the site nav', () => {
  const kit = nativeKit();
  const summon = kit.doc.body.append(kit.el('button', { 'data-nav-summon': '' }));
  let pressed = 0;
  summon.click = () => { pressed++; };
  kit.doc.querySelector = sel => kit.doc.body.querySelector(sel);
  const { menu } = fullMenu(kit);
  menu.open();
  click(find(menu.el, 'hu-gm-row')[5]);
  assert.equal(menu.isOpen(), false);
  assert.equal(pressed, 1);
});

test('on a phone, Leave replaces the spare history entry instead of stacking on it', () => {
  const p = phoneKit();
  let to = null;
  p.kit.ctx.location.replace = href => { to = href; };
  const { menu } = fullMenu(p.kit);
  menu.open(); p.settle();
  const e = ev();
  click(find(menu.el, 'hu-gm-row')[4], e);
  assert.equal(to, '/learn/');
  const mod = ev({ metaKey: true });
  to = null;
  find(menu.el, 'hu-gm-row')[4]._fire('click', mod);
  assert.equal(to, null, 'a modified click (new tab) is the browser\'s business');
  assert.equal(mod.defaultPrevented, false);
});
