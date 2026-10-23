/* THE CONTENTS AND THE SECTION FOLDS (2026-10-21), loaded on a page whose front matter says `contents: true`
   (base.njk): a Learn module, or a Rounds article. David, with Wikipedia beside him: "if the page is loaded on a computer
   or larger screen i want it to have a scrolling contents bar similar to how WIKIs work. when you scroll down it shows
   what section you are on. I also want some sort of colasapble section or at least make it smaller for phone readers."

   It reads the page's own sections and builds:
   - ONE LIST, a <nav aria-label="Contents">: on a wide screen a rail beside the text that stays in view and marks the
     section you are in; on a tablet a closed fold at the top of the text; on a phone nothing, because there
   - THE SECTIONS FOLD: every section after the first becomes a <details> (the site's fold, hu-global.css THE FOLD) whose
     summary is the section's kicker and heading, so the article reads as a short list of headings to open. A link to a
     section opens its fold, the browser's find opens a fold on its own, and turning the phone sideways into a tablet
     shape puts the sections back as they were.

   Two shapes of page:
   - A LEARN MODULE: each `section[id]` directly in .hu-read-body with an h2; `data-toc` on a section names it in the
     list when its heading alone would not. The body moves over for the rail from 1100 wide.
   - A ROUNDS ARTICLE (article.rounds-post, 2026-10-22, first on A Routine Fracture; David: "can we update the routine
     fracture to have the wiki like function"): the article is flat, so a kicker (.section-eyebrow), its h2 and what
     follows, up to the next kicker or h2, is one section, wrapped here in a <section class="hu-flat-sec">. A block with
     its own `data-toc` (the four views) stands on its own and never folds: its tabs are listed under it, and the h2s
     inside each view under that view; a link to a view behind the switch selects it. The references fold is listed
     last. `data-fold="no"` on an h2 keeps that section open on a phone. The article keeps its width and centre, so its
     rail hangs in the margin from 1300 wide. A block marked `data-wide` (the whole map), which runs past the column,
     starts to the right of the rail there (hu-global.css), so the rail never has to leave; David, 2026-10-22, when it
     used to step aside: "the contents bar diseapears when i go through the different tabs".
   ON A PHONE the list itself stays hidden; a page whose views have a dock (hu-views.js, `contents: true` in its options)
   carries the contents there instead: the dock names the part you are in and opens this outline on a tap (David,
   2026-10-22, of the fracture draft on his phone: "the phone navigation is also really bad"; its story ran 17 screens under
   a bar that said "Story 1 of 4" the whole way). So window.HUContents also gives the outline, goes to an entry, and
   says so with a 'hu-contents' event on the document whenever the part you are in changes.
   Nothing is stored here. reading.js asks window.HUContents which section you are in, so "Continue reading" can open
   that fold and land on it. With no script the page is the plain article it always was. */
(function () {
  'use strict';
  var root = document.querySelector('.hu-read');
  var body = root && root.querySelector('.hu-read-body');
  var flat = body ? null : document.querySelector('article.rounds-post');
  var host = body || flat;
  if (!host) return;

  var phone = window.matchMedia('(max-width:699px), (max-height:500px)');
  // a Learn body moves over for the rail; a Rounds article keeps its centre, so its rail needs a margin 220 wide
  var wide = window.matchMedia(flat ? '(min-width:1300px) and (min-height:501px)' : '(min-width:1100px) and (min-height:501px)');
  var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var text = function (el) { return el.textContent.replace(/\s+/g, ' ').trim(); };
  var isKicker = function (el) { return !!el && (el.classList.contains('hu-read-kicker') || el.classList.contains('section-eyebrow')); };
  var idFor = function (el, label) {
    if (!el.id) {
      var base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section', id = base, n = 2;
      while (document.getElementById(id)) id = base + '-' + n++;
      el.id = id;
    }
    return el.id;
  };

  /* ── the sections: `secs` are the ones a phone may fold; `tree` is what the list shows, each entry
        { id: the address a link goes to, label, el: what says you have reached it, kids } ── */
  var secs = [], tree = [];
  if (body) {
    secs = Array.prototype.filter.call(body.children, function (s) { return s.tagName === 'SECTION' && s.id && s.querySelector('h2'); });
    tree = secs.map(function (s) { return { id: s.id, label: s.getAttribute('data-toc') || text(s.querySelector('h2')), el: s, kids: [] }; });
  } else {
    var items = [], cur = null, kids = Array.prototype.slice.call(flat.children);
    kids.forEach(function (el, i) {
      var nx = kids[i + 1];
      if (el.hasAttribute('data-toc') || (el.tagName === 'DETAILS' && el.classList.contains('refs'))) { cur = null; items.push({ own: el }); return; }
      var opens = (isKicker(el) && nx && nx.tagName === 'H2') || (el.tagName === 'H2' && !(cur && cur.kicker && !cur.h2));
      if (opens) { cur = { els: [], h2: null, kicker: el.tagName !== 'H2' }; items.push(cur); }
      if (!cur) return;   // the lead: the title, the summary and the opening paragraphs
      cur.els.push(el);
      if (el.tagName === 'H2' && !cur.h2) cur.h2 = el;
    });
    items.forEach(function (it) {
      if (it.own) {
        var el = it.own;
        if (el.tagName === 'DETAILS') {
          var sum = el.querySelector('summary');
          tree.push({ id: idFor(el, 'references'), label: sum ? text(sum) : 'References', el: el, kids: [] });
          return;
        }
        // a block of views: its tabs under it, each view's own h2s under the view
        var label = el.getAttribute('data-toc');
        var views = Array.prototype.map.call(el.querySelectorAll('[role="tab"][aria-controls]'), function (tab) {
          var panel = document.getElementById(tab.getAttribute('aria-controls'));
          if (!panel) return null;
          var name = tab.getAttribute('data-toc') || text(tab.querySelector('.lg') || tab);
          return { id: panel.id, label: name, el: panel, kids: Array.prototype.map.call(panel.querySelectorAll('h2'), function (h) {
            return { id: idFor(h, text(h)), label: h.getAttribute('data-toc') || text(h), el: h, kids: [] };
          }) };
        }).filter(Boolean);
        tree.push({ id: idFor(el, label), label: label, el: el, kids: views });
        return;
      }
      if (!it.h2) return;
      var s = document.createElement('section');
      s.className = 'hu-flat-sec';
      if (it.h2.getAttribute('data-fold') === 'no') s.setAttribute('data-fold', 'no');
      flat.insertBefore(s, it.els[0]);
      it.els.forEach(function (e) { s.appendChild(e); });
      secs.push(s);
      tree.push({ id: idFor(it.h2, text(it.h2)), label: it.h2.getAttribute('data-toc') || text(it.h2), el: s, kids: [] });
    });
  }
  if (tree.length < 3) return;
  var all = [];
  (function walk(list, depth) { list.forEach(function (e) { e.depth = depth; all.push(e); walk(e.kids, depth + 1); }); })(tree, 0);

  /* ── the list ── */
  var h1 = (root || flat).querySelector('h1');
  if (h1 && !h1.id) h1.id = 'hu-top';
  var item = function (e) {
    return '<li><a class="hu-toc-a" href="#' + esc(e.id) + '">' + esc(e.label) + '</a>' +
      (e.kids.length ? '<ol class="hu-toc-list">' + e.kids.map(item).join('') + '</ol>' : '') + '</li>';
  };
  var nav = document.createElement('nav');
  nav.className = 'hu-toc';
  nav.setAttribute('aria-label', 'Contents');
  nav.innerHTML = '<details class="hu-fold hu-toc-fold"><summary>Contents</summary><ol class="hu-toc-list">' +
    (h1 ? '<li><a class="hu-toc-a" href="#' + h1.id + '">(Top)</a></li>' : '') + tree.map(item).join('') + '</ol></details>';
  if (body) body.insertBefore(nav, body.firstChild);
  else {
    // under the title block, where a tablet reader meets it; on a wide desk CSS hangs it in the margin
    var meta = flat.querySelector(':scope > .rounds-meta');
    flat.insertBefore(nav, meta ? meta.nextSibling : secs[0] || tree[0].el);
  }
  host.classList.add('has-toc');
  var list = /** @type {HTMLDetailsElement} */ (nav.querySelector('details'));
  var scroller = flat ? list : nav;   // what scrolls when the rail is taller than the screen
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  var off = h1 ? 1 : 0;   // links[0] is (Top) when there is a title to go back to
  // a wide screen opens the rail (its "Contents" header closes it, Wikipedia's hide); a tablet starts it closed
  var fitList = function () { list.open = wide.matches; };
  fitList();

  /* ── the folds, on a phone ── */
  var folds = [];
  function fold() {
    secs.forEach(function (s, i) {
      if (i === 0 || s.getAttribute('data-fold') === 'no' || s.querySelector(':scope > details.hu-sec-fold')) return;
      var h2 = s.querySelector('h2');
      var head = document.createElement('span');
      head.className = 'hu-sec-fold-head';
      var kick = h2.previousElementSibling;
      if (isKicker(kick) && kick.parentNode === s) head.appendChild(kick);
      if (h2.parentNode === s) head.appendChild(h2); else head.appendChild(h2.cloneNode(true));
      var d = document.createElement('details');
      d.className = 'hu-sec-fold';
      var sum = document.createElement('summary');
      sum.appendChild(head);
      var inner = document.createElement('div');
      inner.className = 'hu-sec-fold-body';
      while (s.firstChild) inner.appendChild(s.firstChild);
      d.appendChild(sum);
      d.appendChild(inner);
      s.appendChild(d);
      folds.push(d);
    });
  }
  function unfold() {
    folds.forEach(function (d) {
      var s = d.parentNode, head = d.querySelector('summary > .hu-sec-fold-head'), inner = d.querySelector(':scope > .hu-sec-fold-body');
      while (head.firstChild) s.insertBefore(head.firstChild, d);
      while (inner.firstChild) s.insertBefore(inner.firstChild, d);
      s.removeChild(d);
    });
    folds = [];
  }
  if (phone.matches) fold();

  /* open whatever hides an address (a phone's fold, the references, a view behind its switch), then land on it */
  function reveal(id) {
    var t = id && document.getElementById(id);
    if (!t) return null;
    var d = /** @type {HTMLDetailsElement | null} */ (t.closest('details.hu-sec-fold') || (t.matches('section') && t.querySelector(':scope > details.hu-sec-fold')) || null);
    if (d && !d.open) d.open = true;
    if (t.tagName === 'DETAILS') /** @type {HTMLDetailsElement} */ (t).open = true;
    var panel = /** @type {HTMLElement | null} */ (t.closest('[role="tabpanel"]'));
    if (panel && panel.hidden && panel.id) {
      var tab = /** @type {HTMLElement | null} */ (document.querySelector('[role="tab"][aria-controls="' + panel.id + '"]'));
      if (tab) tab.click();
    }
    return t;
  }
  // a view lands on its switch, so the reader sees which one is open
  var landing = function (t) { return t.getAttribute('role') === 'tabpanel' ? (t.closest('[data-toc]') || t) : t; };
  document.addEventListener('click', function (e) {
    var el = /** @type {Element | null} */ (e.target);
    var a = el && el.closest && el.closest('a[href^="#"]');
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    var t = reveal(id);
    if (!t) return;
    if (links.indexOf(a) >= 0 && !wide.matches && list.open) list.open = false;   // a tablet's list closes behind its jump
    var land = landing(t);
    if (land === t && t !== document.getElementById(location.hash.slice(1))) return;   // the browser scrolls to a new address itself
    e.preventDefault();
    land.scrollIntoView();
    if (land !== t) { try { history.replaceState(null, '', '#' + id); } catch (x) { /* a sandboxed frame */ } }
  });
  window.addEventListener('hashchange', function () { reveal(decodeURIComponent(location.hash.slice(1))); });
  if (location.hash && location.hash !== '#continue') {
    var first = reveal(decodeURIComponent(location.hash.slice(1)));
    if (first) requestAnimationFrame(function () { landing(first).scrollIntoView(); });
  }

  /* ── where you are: the last entry on screen whose top has passed the line under the bars ── */
  var shown = function (el) { return !el.closest('[hidden]') && el.getClientRects().length > 0; };
  var current = -2, ticking = false;
  function where() {
    var line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64) + (flat ? 130 : 96);
    var c = -1, last = -1;
    for (var i = 0; i < all.length; i++) {
      if (!shown(all[i].el)) continue;
      last = i;
      if (all[i].el.getBoundingClientRect().top <= line) c = i;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) c = last;
    return c;
  }
  function mark() {
    ticking = false;
    var c = where();
    if (c === current) return;
    current = c;
    document.dispatchEvent(new CustomEvent('hu-contents', { detail: { id: c >= 0 && all[c] ? all[c].id : '' } }));
    links.forEach(function (a, i) {
      if (i === c + off || (c < 0 && i === 0 && off)) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    // a rail taller than the screen keeps the marked line in its own view
    var on = links[Math.max(0, c + off)];
    if (wide.matches && list.open && on && scroller.scrollHeight > scroller.clientHeight) {
      scroller.scrollTop = Math.max(0, on.offsetTop - scroller.clientHeight / 3);
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(mark); }
  }, { passive: true });
  // a view switched without a scroll changes what is on screen
  host.addEventListener('click', function (e) {
    var el = /** @type {Element | null} */ (e.target);
    if (el && el.closest && el.closest('[role="tab"]')) requestAnimationFrame(function () { current = -2; mark(); });
  });
  mark();

  /* turning the screen: a phone folds, anything bigger reads the sections whole */
  var resize = function () {
    if (phone.matches && !folds.length) fold();
    else if (!phone.matches && folds.length) unfold();
    fitList();
    current = -2;
    mark();
  };
  if (phone.addEventListener) { phone.addEventListener('change', resize); wide.addEventListener('change', resize); }

  window.HUContents = {
    /** the id of the section you are in, or '' at the top */
    current: function () { return current >= 0 && all[current] ? all[current].id : ''; },
    /** open whatever hides an address and return it */
    reveal: reveal,
    /** every entry in the list, in order: { id, label, depth } (0 a section, 1 a view, 2 a part of a view) */
    outline: function () { return all.map(function (e) { return { id: e.id, label: e.label, depth: e.depth }; }); },
    /** the entry you are in, or null at the top */
    here: function () { var e = current >= 0 && all[current]; return e ? { id: e.id, label: e.label, depth: e.depth } : null; },
    /** go to an entry: open what hides it, land on it, and keep its address */
    go: function (id) {
      var t = reveal(id);
      if (!t) return;
      landing(t).scrollIntoView();
      try { history.replaceState(null, '', '#' + id); } catch (x) { /* a sandboxed frame */ }
    }
  };
})();
