/* hu-views.js · THE VIEW SWITCH (DECISIONS L1 and L2, 2026-10-06; David: "dock and A, go ahead and build both").

   WHY. David, on the fracture post in production: the buttons between the story, the paper trail and the whole map
   "are not really easy to see or are easy to lose as things scroll", and pages with layers give no sign there is more
   behind them. The standard he picked:

   - The page keeps its own switch at the top of its views, boxed, the one on screen filled (.hu-seg, hu-global.css).
   - On a desk the page pins that switch under the site bar. On a phone it scrolls away with the page (a phone gets
     one top bar), so once it has, a DOCK slides up at the foot of the screen with the same views, where a thumb
     already is, and a Layers button where the page has layer buttons. With up to three views the dock holds them
     all; with more it steps:
     back, the view's name and "n of N" (a tap lists them all), forward.
   - A view slides in from the side you went (slide). Each view ends with a card that hands you to the next (next).
   - The first time the switch follows you down a page, the next view glows once (remembered per page).

   - A page with contents (reading-contents.js; o.contents) puts them in a stepping dock (2026-10-22, David, of the
     fracture draft on his phone: "the phone navigation is also really bad"; its story ran 17 screens under "Story 1 of
     4"). The name then says the part you are in ("Surgery day", and "Story · 1 of 4" under it), a tap opens the whole
     outline rather than the four views, and the dock stays for the rest of the article once its title has scrolled away,
     with only the name and no arrows outside the views (.solo).
   - A page can make the dock its phone switch (o.bar; 2026-10-22, David on the fracture draft: "selection the arrows
     from the bottem bar shoots you back to the top and not just moves you to the differnt tab, maybe the bottom should
     just keep the tabs there instead of in the body like the web versions"). On a phone every view is a tab in the bar,
     which shows as soon as the views reach the screen; the page's own switch leaves the screen (it stays in the page,
     for a keyboard, a screen reader and the phone gate's view walk, and comes back when a keyboard lands in it); with
     contents, a Contents button leads the bar. A tab lands at the top of its view the first time and where you left it
     after that, the way an app's tab bar keeps each tab's place; the current tab takes you to its top.

   No dependencies, so a reading page loads it without the kit. Every motion is off under reduced motion; the dock
   and its panel close on Esc, a tap outside and the phone's back gesture. The page stays the owner of its views:
   the dock calls the page's own select and asks the page which view is on screen. */
(function () {
  'use strict';
  var PHONE = window.matchMedia('(max-width:699px), (max-height:500px)');
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ICON = {
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    toc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h12"/><path d="M9 12h12"/><path d="M9 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/></svg>'
  };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var navH = function () { return parseFloat(getComputedStyle(document.body).getPropertyValue('--nav-h')) || 0; };   /* body: a merged bar sets it there */
  function button(cls, html, label) {
    var b = document.createElement('button'); b.type = 'button'; if (cls) b.className = cls; b.innerHTML = html;
    if (label) b.setAttribute('aria-label', label);
    return b;
  }
  function glow(el) {
    if (!el || REDUCE.matches) return;
    setTimeout(function () {
      el.classList.add('hu-v-nudge');
      el.addEventListener('animationend', function () { el.classList.remove('hu-v-nudge'); }, { once: true });
    }, 280);
  }

  /* o.row      the element around the page's own switch: the dock waits until it has left the screen
     o.region   the element the views live in, or a function giving the one on screen: the dock shows only while
                it fills the screen
     o.names    a short name per view, the words on the dock
     o.tabs     the page's own switch buttons, for the glow on a desk (optional)
     o.current  () => the index of the view on screen
     o.select   (i) => the page's own way to change view
     o.layers   optional { el, label, on: (i) => boolean }: the page's layer buttons, lent to a panel over the dock
     o.label    what the dock is called to a screen reader
     o.key      a name for this page's switch, for the one glow (default: the page's path)
     o.contents true when the page has contents (window.HUContents): a stepping dock, or a bar, carries them
     o.bar      true: on a phone the dock is the page's switch, every view a tab, and the page's own switch steps aside */
  function dock(o) {
    var bar = !!o.bar, n = o.names.length, many = !bar && (o.many != null ? !!o.many : n > 3), key = 'hu-views-glow:' + (o.key || location.pathname);
    // the contents load deferred, after the page made its dock, so they are asked for each time
    var C = function () { return (many || bar) && o.contents && window.HUContents ? window.HUContents : null; };
    var region = function () { return typeof o.region === 'function' ? o.region() : o.region; };
    var el = document.createElement('nav'); el.className = 'hu-vdock' + (many ? ' many' : '') + (bar ? ' bar' : ''); el.setAttribute('aria-label', o.label || 'Views');
    var segs = [], back, fwd, name, lay, toc;
    // each view's place in a bar: how far down the views you were, kept while you read and given back on its tab
    var mem = {}, switching = 0;
    function pick(i) {
      if (!bar) { o.select(i); return; }
      var c = o.current(), at = function () { return region().getBoundingClientRect().top + scrollY - navH(); };
      switching = Date.now();
      if (i !== c) o.select(i);
      var y = i === c ? 0 : (mem[i] || 0);
      requestAnimationFrame(function () { window.scrollTo({ top: Math.max(0, at() + y), behavior: 'instant' }); switching = Date.now(); });
    }
    if (bar && o.contents) {
      toc = button('toc', ICON.toc, 'Contents'); toc.setAttribute('aria-expanded', 'false'); toc.setAttribute('aria-controls', 'hu-vpanel');
      toc.addEventListener('click', function (e) { e.stopPropagation(); if (C()) toggle('contents'); });
      el.appendChild(toc);
    }
    if (!many) {
      var seg = document.createElement('div'); seg.className = 'seg';
      o.names.forEach(function (nm, i) {
        var b = button('', esc(nm)); b.addEventListener('click', function () { pick(i); });
        seg.appendChild(b); segs.push(b);
      });
      el.appendChild(seg);
      if (bar) {
        // outside the views the bar is the name of where you are, which opens the contents
        name = button('name', ''); name.setAttribute('aria-expanded', 'false'); name.setAttribute('aria-controls', 'hu-vpanel');
        name.addEventListener('click', function (e) { e.stopPropagation(); if (C()) toggle('contents'); });
        el.appendChild(name);
        o.row.classList.add('hu-vrow-bar');   // the page's own switch steps aside on a phone (hu-global.css)
      }
    } else {
      back = button('step', ICON.back, 'Previous'); fwd = button('step', ICON.fwd, 'Next'); name = button('name', '');
      name.setAttribute('aria-expanded', 'false'); name.setAttribute('aria-controls', 'hu-vpanel');
      back.addEventListener('click', function () { var c = o.current(); if (c > 0) o.select(c - 1); });
      fwd.addEventListener('click', function () { var c = o.current(); if (c < n - 1) o.select(c + 1); });
      name.addEventListener('click', function (e) { e.stopPropagation(); toggle(C() ? 'contents' : 'list'); });
      el.appendChild(back); el.appendChild(name); el.appendChild(fwd);
    }
    if (o.layers) {
      lay = button('lay', ICON.layers, 'Layers'); lay.setAttribute('aria-expanded', 'false'); lay.setAttribute('aria-controls', 'hu-vpanel');
      lay.addEventListener('click', function (e) { e.stopPropagation(); toggle('layers'); });
      el.appendChild(lay);
    }
    document.body.appendChild(el);

    /* the panel over the dock: the page's layer buttons (lent, and given back on close), or the list of every view */
    var panel = document.createElement('div'); panel.className = 'hu-vpanel'; panel.id = 'hu-vpanel'; panel.setAttribute('role', 'group');
    document.body.appendChild(panel);
    var lent = null, marker = null, pushed = false, kind = '';
    function openPanel(k) {
      kind = k; panel.innerHTML = '';
      var h = document.createElement('span'); h.className = 'k'; panel.appendChild(h);
      if (k === 'layers') {
        h.textContent = o.layers.label || 'Layers'; panel.setAttribute('aria-label', h.textContent);
        lent = o.layers.el; marker = document.createComment('hu-views'); lent.parentNode.insertBefore(marker, lent); panel.appendChild(lent);
      } else if (k === 'contents') {
        // the article's own outline, indented by depth, the part you are in marked; a tap goes there and closes
        h.textContent = 'Contents'; panel.setAttribute('aria-label', 'Contents');
        var cl = document.createElement('div'); cl.className = 'list toc'; var here = C().current(), mine = null;
        C().outline().forEach(function (e) {
          var b = button('d' + Math.min(e.depth, 2) + (e.id === here ? ' on' : ''), esc(e.label));
          if (e.id === here) { b.setAttribute('aria-current', 'location'); mine = b; }
          // closing steps back out of the panel's history entry, and the browser restores that entry's scroll as it
          // does: so go only once the step back has landed (or shortly after, if it never comes)
          b.addEventListener('click', function () {
            var gone = false, go = function () { if (gone) return; gone = true; var cc = C(); if (cc) cc.go(e.id); };
            if (pushed) { window.addEventListener('popstate', function () { setTimeout(go, 30); }, { once: true }); setTimeout(go, 400); closePanel(); }
            else { closePanel(); go(); }
          });
          cl.appendChild(b);
        });
        panel.appendChild(cl);
        if (mine) requestAnimationFrame(function () { panel.scrollTop = Math.max(0, mine.offsetTop - panel.clientHeight / 3); });
      } else {
        h.textContent = o.label || 'Views'; panel.setAttribute('aria-label', h.textContent);
        var list = document.createElement('div'); list.className = 'list'; var c = o.current();
        o.names.forEach(function (nm, i) {
          var b = button(i === c ? 'on' : '', '<span>' + (i + 1) + '</span>' + esc(nm));
          if (i === c) b.setAttribute('aria-current', 'true');
          b.addEventListener('click', function () { closePanel(); o.select(i); });
          list.appendChild(b);
        });
        panel.appendChild(list);
      }
      panel.classList.add('open');
      if (lay) lay.setAttribute('aria-expanded', k === 'layers' ? 'true' : 'false');
      if (name) name.setAttribute('aria-expanded', k === 'list' || k === 'contents' ? 'true' : 'false');
      if (toc) toc.setAttribute('aria-expanded', k === 'contents' ? 'true' : 'false');
      try { history.pushState({ huViews: 1 }, ''); pushed = true; } catch (e) { /* no history */ }
    }
    function closePanel(fromBack) {
      if (!panel.classList.contains('open')) return;
      if (lent && marker) { marker.parentNode.insertBefore(lent, marker); marker.remove(); }
      lent = null; marker = null; kind = '';
      panel.classList.remove('open');
      if (lay) lay.setAttribute('aria-expanded', 'false');
      if (name) name.setAttribute('aria-expanded', 'false');
      if (toc) toc.setAttribute('aria-expanded', 'false');
      if (pushed && !fromBack) { pushed = false; history.back(); } else pushed = false;
    }
    function toggle(k) { if (panel.classList.contains('open') && kind === k) closePanel(); else { closePanel(); openPanel(k); } }
    window.addEventListener('popstate', function () { if (panel.classList.contains('open')) { pushed = false; closePanel(true); } });
    document.addEventListener('click', function (e) { var t = /** @type {Node} */ (e.target); if (panel.classList.contains('open') && !panel.contains(t) && !el.contains(t)) closePanel(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });

    var glowed = false; try { glowed = !!localStorage.getItem(key); } catch (e) { /* storage off: glow each visit */ }
    function nudge() {
      if (glowed || REDUCE.matches) return;
      glowed = true; try { localStorage.setItem(key, '1'); } catch (e) { /* storage off */ }
      var c = o.current();
      glow(PHONE.matches ? (many ? fwd : segs[(c + 1) % n]) : (o.tabs && o.tabs[(c + 1) % n]));
    }
    // the name: the view and "n of N"; with contents, the part you are in first, or only that outside the views
    function label() {
      if (!name) return;
      var c = o.current(), cc = C(), here = cc && cc.here(), solo = el.classList.contains('solo');
      var where = (c + 1) + ' of ' + n, bold = o.names[c], sub = where;
      if (cc && (solo || bar)) { bold = here ? here.label : 'Contents'; sub = 'Contents'; }
      else if (cc && here && here.depth >= 2) { bold = here.label; sub = o.names[c] + ' · ' + where; }
      name.innerHTML = '<b>' + esc(bold) + '</b><span>' + esc(sub) + '</span>';
      name.setAttribute('aria-label', cc ? bold + (solo ? '' : ', ' + o.names[c] + ', ' + where) + '. Open the contents' : o.names[c] + ', ' + where + '. List them all');
    }
    document.addEventListener('hu-contents', label);
    function sync() {
      var c = o.current();
      segs.forEach(function (b, i) { if (i === c) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (many) { label(); back.disabled = c === 0; fwd.disabled = c === n - 1; }
      else if (name) label();
      if (lay) { lay.hidden = !o.layers.on(c); if (lay.hidden && kind === 'layers') closePanel(); }
      if (kind === 'list' || kind === 'contents') closePanel();
    }
    var ticking = false;
    function place() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var reg = region();
        var top = navH(), r = o.row.getBoundingClientRect(), v = reg.getBoundingClientRect();
        if (PHONE.matches && bar) {
          // the bar: the tabs while the views fill the screen, from the moment they reach it; the name alone before and
          // after them once the title has gone (with contents); and the place in the view kept as you read
          var inViews = v.top < innerHeight * 0.6 && v.bottom > innerHeight * 0.5, alone = false;
          if (!inViews && C()) { var tt = document.querySelector('article h1, .hu-read h1'); alone = (tt ? tt.getBoundingClientRect().bottom : 0) < top; }
          if (inViews && Date.now() - switching > 700) mem[o.current()] = Math.max(0, top - v.top);
          if (alone !== el.classList.contains('solo')) { el.classList.toggle('solo', alone); label(); }
          var on = inViews || alone;
          if (on !== el.classList.contains('show')) { el.classList.toggle('show', on); if (!on) closePanel(); }
          if (inViews) nudge();
        } else if (PHONE.matches) {
          var show = r.bottom < top && v.bottom > innerHeight * 0.5, solo = false;
          // with contents the dock stays for the whole article once its title has gone, the name alone outside the
          // views, and never while the page's own switch is on screen
          if (!show && C()) {
            var t = document.querySelector('article h1, .hu-read h1'), tb = t ? t.getBoundingClientRect().bottom : 0;
            solo = tb < top && !(r.bottom > top && r.top < innerHeight);
          }
          if (solo !== el.classList.contains('solo')) { el.classList.toggle('solo', solo); label(); }
          show = show || solo;
          if (show !== el.classList.contains('show')) { el.classList.toggle('show', show); if (!show) closePanel(); }
          if (show && !solo) nudge();
        } else {
          el.classList.remove('show'); closePanel();
          if (r.top <= top + 1 && v.top < top && v.bottom > innerHeight * 0.5) nudge();   /* the page's switch is pinned */
        }
      });
    }
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    if (PHONE.addEventListener) PHONE.addEventListener('change', place);
    sync(); place();
    return { sync: sync, place: place, close: closePanel, el: el };
  }

  /* a view arriving: from the right when you went forward, from the left when you went back */
  function slide(panel, forward) {
    if (!panel || REDUCE.matches) return;
    panel.classList.remove('hu-v-in-r', 'hu-v-in-l'); void panel.offsetWidth;
    panel.classList.add(forward ? 'hu-v-in-r' : 'hu-v-in-l');
    panel.addEventListener('animationend', function () { panel.classList.remove('hu-v-in-r', 'hu-v-in-l'); }, { once: true });
  }

  /* the card at the end of a view: o = { kicker, title, text, button, go } */
  function next(panel, o) {
    var box = document.createElement('div'); box.className = 'hu-vnext';
    box.innerHTML = '<span class="k">' + esc(o.kicker) + '</span><b>' + esc(o.title) + '</b>' + (o.text ? '<p>' + esc(o.text) + '</p>' : '');
    var b = button('btn-primary-v2', esc(o.button)); b.addEventListener('click', o.go); box.appendChild(b);
    panel.appendChild(box);
    return box;
  }

  window.HUViews = { dock: dock, slide: slide, next: next, PHONE: PHONE };
})();
