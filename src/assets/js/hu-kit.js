/* ================================================================
   HU KIT v1 — shared interactive chrome controllers
   (HU-UI-GRAMMAR Phase 2 · 2026-07-19)

   ONE detent-sheet implementation, ONE geolocation helper, and the
   shared phone/motion budget, so every tool stops rolling its own.
   No dependencies. Everything hangs off window.HUKit.

   HUKit.phone()        -> true when the SHORTER side is 699px or less (portrait or landscape)
   HUKit.dcap(ms)       -> ms capped to 250 on phones, 0 reduced-motion
   HUKit.sheet(el,opts) -> detent controller for a .shell-sheet /
                           .shell-dock--sheet (or any fixed bottom sheet
                           that speaks dt-peek / dt-half / dt-full)
   HUKit.locate(btn,opts)-> locate-me FAB wiring. Permission is asked
                           ON TAP, never on load. County-grain accuracy.
   HUKit.backGuard(opts) -> phone hardware-back interceptor: transient
                           drawer views consume back one X-step at a
                           time; scope entries stay history-native.
   HUKit.urlState(opts) -> the serializer convention in one place: scope
                           changes push, tweaks replace, restores never
                           write back.
   HUKit.conusView(el)  -> { center, zoom, minZoom } fitting the lower 48 to
                           that container. Replaces the hardcoded desktop
                           camera both U.S. maps shipped with.
   HUKit.peek(opts)     -> explain-on-demand. Anything carrying data-def
                           gets one card: a mouse hovers it, a thumb taps
                           it, a keyboard tabs to it. Lets a game show a
                           short label and keep the paragraph behind it.
   HUKit.pop(opts)      -> selector-popover controller: open/close,
                           anchor + right-edge clamp, outside-click,
                           arrow/Home/End walk, focus return. The kit
                           owns the POPOVER rung of the Esc walk only;
                           the page keeps its own next rung.

   THE GAME MENUS (2026-09-23, docs/HU-GAME-MENUS-2026-09-23.md section 4).
   Five games each built their own overlays; these are the one set.
   HUKit.dialog(opts)   -> the modal card: X, Esc and the phone back gesture
                           all close it, focus in and back out, stackable.
   HUKit.gameMenu(opts) -> Resume, Help, Settings, Restart, Leave, Site menu.
   HUKit.settings(opts) -> toggle rows that apply at once and are remembered.
   HUKit.howTo(opts)    -> the how-to-play card, by itself on a first visit only.
   HUKit.confirm(opts)  -> Promise<boolean>; the button names the act.
================================================================ */
(function () {
  'use strict';

  /* A PHONE IS THE SHORTER SIDE OF THE SCREEN, not the width. This was
     `(max-width: 699px)` alone until 2026-09-21, which meant a phone held
     sideways (about 740px wide) reported FALSE here, and every caller of
     HUKit.phone() then behaved as if it were on a desktop: the back guard, the
     250ms motion cap, sheet behaviour and the atlas prefetch gate. The CSS
     carries the same pair. Change one, change both. */
  var PHONE_MQ = window.matchMedia('(max-width:699px), (max-height:500px)');
  var REDUCED_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  function phone() { return PHONE_MQ.matches; }
  function dcap(ms) { return REDUCED_MQ.matches ? 0 : (PHONE_MQ.matches ? Math.min(ms, 250) : ms); }

  /* ── Peek: explain on demand ──────────────────────────────────
     A game screen should be playable without reading it. So the screen
     carries the short label and the sentence hides behind it, reachable
     three ways: hover, tap, or keyboard focus.

       HUKit.peek({ root, sel }) -> { close, destroy }

     root  where to listen. Element or selector, default document.body.
           Delegated, so markup rendered later still works.
     sel   the trigger selector, default '[data-def]'. The attribute holds
           a small piece of HTML, usually "<b>Name</b>the sentence", which
           is the shape the hospital game's own tooltip already used.

     A trigger that is itself a control keeps working: on a touch screen the
     card opens from the little "i" badge inside it, never from the control,
     so tapping Start still starts. A trigger that is NOT a control is made
     focusable so a keyboard can reach the same sentence. One card exists per
     page and every peek shares it. */
  var peekCard = null, peekOn = null, peekFrom = '', peekWired = false;
  var INTERACTIVE = 'a[href],button,input,select,textarea,summary,[role="button"],[tabindex]';

  function peekEl() {
    if (peekCard) return peekCard;
    peekCard = document.createElement('div');
    peekCard.className = 'hu-peek';
    peekCard.id = 'hu-peek';
    peekCard.setAttribute('role', 'tooltip');
    peekCard.hidden = true;
    document.body.appendChild(peekCard);
    return peekCard;
  }

  function peekHide() {
    if (!peekOn) return;
    peekOn.removeAttribute('aria-describedby');
    peekOn = null; peekFrom = '';
    if (peekCard) peekCard.hidden = true;
  }

  function peekShow(t, how) {
    peekFrom = how || 'hover';
    var def = t.getAttribute('data-def');
    if (!def) return;
    var card = peekEl();
    card.innerHTML = def;
    card.hidden = false;
    peekOn = t;
    t.setAttribute('aria-describedby', 'hu-peek');
    // below the trigger, flipped above when there is no room, clamped to the viewport
    var r = t.getBoundingClientRect(), c = card.getBoundingClientRect();
    var pad = 8, gap = 6;
    var x = Math.min(r.left, window.innerWidth - c.width - pad);
    var y = r.bottom + gap;
    if (y + c.height > window.innerHeight - pad) {
      var above = r.top - gap - c.height;
      y = above >= pad ? above : Math.max(pad, window.innerHeight - c.height - pad);
    }
    card.style.left = Math.max(pad, x) + 'px';
    card.style.top = Math.max(pad, y) + 'px';
  }

  function peek(opts) {
    opts = opts || {};
    var sel = opts.sel || '[data-def]';
    var root = opts.root || document.body;
    if (typeof root === 'string') root = document.querySelector(root);
    if (!root) return { close: function () {}, destroy: function () {} };

    function trigger(e) {
      var t = /** @type {Element} */ (e.target);
      t = t && t.closest ? t.closest(sel) : null;
      return t && root.contains(t) ? t : null;
    }
    // a control keeps its own tap; the badge inside it is what opens the card
    function tapOpens(t, target) {
      if (!t.matches(INTERACTIVE)) return true;
      var el = /** @type {Element} */ (target);
      return !!(el && el.closest && el.closest('.hu-i'));
    }

    var on = {
      over: function (e) {
        if (e.pointerType === 'touch') return;          // a touch "hover" is the tap, handled below
        var t = trigger(e);
        if (t) peekShow(t, 'hover'); else if (peekOn) peekHide();
      },
      out: function (e) { if (trigger(e)) peekHide(); },
      click: function (e) {
        var t = trigger(e);
        if (!t) { peekHide(); return; }
        if (!tapOpens(t, e.target)) return;             // let the control do its job
        // On a touch screen focusin lands BEFORE click, so the card is already open by the time
        // the tap completes; toggling here would shut it on the way in. A tap only closes what a
        // previous TAP opened.
        if (peekOn === t && peekFrom === 'click') peekHide(); else peekShow(t, 'click');
      },
      focus: function (e) { var t = trigger(e); if (t) peekShow(t, 'focus'); },
      blur: function () { peekHide(); },
      key: function (e) { if (e.key === 'Escape' && peekOn) { var t = peekOn; peekHide(); if (t.focus) t.focus(); } },
    };
    root.addEventListener('pointerover', on.over);
    root.addEventListener('pointerout', on.out);
    root.addEventListener('click', on.click);
    root.addEventListener('focusin', on.focus);
    root.addEventListener('focusout', on.blur);

    if (!peekWired) {
      peekWired = true;
      document.addEventListener('keydown', on.key);
      window.addEventListener('scroll', peekHide, { passive: true });
      window.addEventListener('resize', peekHide);
      document.addEventListener('click', function (e) {
        if (!peekOn) return;
        var el = /** @type {Element} */ (e.target);
        var t = el && el.closest ? el.closest('[data-def],.hu-peek') : null;
        if (!t) peekHide();
      }, true);
    }

    // Deliberately no tabindex handed out here. A page can carry dozens of data-def labels and
    // turning each into a tab stop buries the real controls. Where the sentence MATTERS to a
    // keyboard, the page puts a real <button class="hu-i"> on it, which is focusable already and
    // is also what a thumb taps. Everything else is hover and tap, which is strictly more than
    // the hover-only tooltip this replaces.
    return {
      close: peekHide,
      destroy: function () {
        peekHide();
        root.removeEventListener('pointerover', on.over);
        root.removeEventListener('pointerout', on.out);
        root.removeEventListener('click', on.click);
        root.removeEventListener('focusin', on.focus);
        root.removeEventListener('focusout', on.blur);
      },
    };
  }

  /* ── Detent sheet ─────────────────────────────────────────────
     opts:
       onDismiss()  called when the user drags down past the peek line
                    (or calls api.close()). Default: removes .open.
       onDetent(d)  called after every detent change with 'dt-peek' etc.
       startDetent  detent applied by api.open() — default 'dt-half'.
     The grabber is injected if the sheet doesn't already have one.
     Tap the grabber: half <-> full. Drag: live height, snap on release.
  */
  function sheet(el, opts) {
    opts = opts || {};
    var DETS = ['dt-peek', 'dt-half', 'dt-full'];

    var g = el.querySelector('.hu-sheet-grab');
    if (!g) {
      g = document.createElement('button');
      g.type = 'button';
      g.className = 'hu-sheet-grab';
      g.setAttribute('aria-label', 'Resize. Drag down past the bottom to close');
      g.appendChild(document.createElement('span'));
      el.insertBefore(g, el.firstChild);
      el.classList.add('has-grab');
    }

    function setDet(d) {
      DETS.forEach(function (c) { el.classList.remove(c); });
      el.classList.add(d);
      if (opts.onDetent) opts.onDetent(d);
    }
    function dismiss() {
      /* idempotent: a closed sheet dismisses to a no-op. Without the guard, an adopter
         whose onDismiss calls back into close() recursed forever (hospital-map, run-2
         mobile QA: RangeError on every X press). The kit now owns removing 'open';
         onDismiss handles the adopter's state, not the class. */
      if (!el.classList.contains('open')) return;
      el.classList.remove('open');
      if (opts.onDismiss) opts.onDismiss();
      if (opts.escape && opener && document.contains(opener) && opener.focus) { opener.focus(); }
      opener = null;
    }
    /* opts.escape (opt-in, David 2026-08-16): the kit closes the sheet on Escape and
       returns focus to whatever opened it. Existing tools keep their own Esc walkers —
       do NOT set this where a page already handles Escape, or presses double-fire. */
    var opener = null;
    document.addEventListener('keydown', function (e) {
      if (!opts.escape || e.key !== 'Escape') return;
      if (el.classList.contains('open')) dismiss();
    });

    /* drag writes are rAF-batched (one style write per frame, not per event),
       and release honors FLICK VELOCITY — a fast swipe steps one detent in the
       swipe direction, which is what makes native sheets feel native */
    var detentOf = function () { return el.classList.contains('dt-full') ? 2 : el.classList.contains('dt-peek') ? 0 : 1; };
    var sy = null, sh = 0, moved = false, raf = 0, pendH = 0;
    var lastY = 0, lastT = 0, prevY = 0, prevT = 0;
    g.addEventListener('pointerdown', function (e) {
      sy = e.clientY; sh = el.getBoundingClientRect().height; moved = false;
      lastY = prevY = e.clientY; lastT = prevT = performance.now();
      try { g.setPointerCapture(e.pointerId); } catch (err) {}
      el.classList.add('dragging');
    });
    g.addEventListener('pointermove', function (e) {
      if (sy === null) return;
      var dy = sy - e.clientY;                       /* up = grow */
      if (Math.abs(dy) > 6) moved = true;
      prevY = lastY; prevT = lastT; lastY = e.clientY; lastT = performance.now();
      pendH = Math.max(48, Math.min(window.innerHeight * 0.92, sh + dy));
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0; el.style.height = pendH + 'px'; el.style.maxHeight = pendH + 'px';
      });
    });
    function settle(e) {
      if (sy === null) return;
      var dy = sy - e.clientY; sy = null;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      el.classList.remove('dragging');
      var h = el.getBoundingClientRect().height;
      el.style.height = ''; el.style.maxHeight = '';
      if (!moved) { setDet(el.classList.contains('dt-full') ? 'dt-half' : 'dt-full'); return; }
      var dt = performance.now() - prevT;
      var vy = dt > 0 ? (lastY - prevY) / dt : 0;    /* px/ms, positive = finger moving down */
      if (Math.abs(vy) > 0.4) {                      /* flick: one detent step in the swipe direction */
        var idx = detentOf() + (vy < 0 ? 1 : -1);
        if (idx < 0) { dismiss(); return; }
        setDet(idx >= 2 ? 'dt-full' : (idx === 1 ? 'dt-half' : 'dt-peek'));
        return;
      }
      if (h < 84 && dy < 0) { dismiss(); return; }   /* below the peek line -> close */
      var vh = window.innerHeight;
      setDet(h < vh * 0.32 ? 'dt-peek' : (h < vh * 0.68 ? 'dt-half' : 'dt-full'));
    }
    g.addEventListener('pointerup', settle);
    /* Keyboard parity. The grabber is a real <button> with a real label, so it takes
       focus, and until now Enter and Space did nothing: only pointer events were
       bound. detail === 0 identifies a click synthesized from the keyboard, which is
       what lets this run WITHOUT double-toggling after a pointer tap (that path has
       already gone through settle()). Same half <-> full step a tap performs. */
    g.addEventListener('click', function (e) {
      if (e.detail !== 0) return;
      setDet(el.classList.contains('dt-full') ? 'dt-half' : 'dt-full');
    });
    g.addEventListener('pointercancel', function () {
      sy = null; if (raf) { cancelAnimationFrame(raf); raf = 0; }
      el.classList.remove('dragging'); el.style.height = ''; el.style.maxHeight = '';
    });

    return {
      el: el,
      open: function (det) {
        if (!el.classList.contains('open')) opener = document.activeElement;
        el.classList.add('open'); setDet(det || opts.startDetent || 'dt-half');
      },
      close: dismiss,
      setDetent: setDet,
      isOpen: function () { return el.classList.contains('open'); }
    };
  }

  /* ── Locate me ────────────────────────────────────────────────
     Budget rule 8: FAB only, permission ON TAP, high accuracy OFF
     (county grain doesn't need it), 10s timeout, nothing leaves the
     browser. permissions.query only READS state to style the button;
     it never triggers a prompt.
     opts: onFix({lat, lon, accuracy}), onError(err)
     Button state classes: is-locating / is-on / is-denied.
  */
  function locate(btn, opts) {
    opts = opts || {};
    function set(s) {
      btn.classList.remove('is-locating', 'is-on', 'is-denied');
      if (s) btn.classList.add(s);
    }
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(function (p) {
        if (p.state === 'denied') set('is-denied');
        p.onchange = function () { set(p.state === 'denied' ? 'is-denied' : null); };
      }).catch(function () {});
    }
    btn.addEventListener('click', function () {
      if (!navigator.geolocation) { set('is-denied'); if (opts.onError) opts.onError({ code: 0, message: 'unsupported' }); return; }
      set('is-locating');
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          set('is-on');
          if (opts.onFix) opts.onFix({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
        },
        function (err) {
          set(err.code === 1 ? 'is-denied' : null);
          if (opts.onError) opts.onError(err);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
    return { setState: set };
  }

  /* ── Hardware back guard ──────────────────────────────────────
     Phone nav rule: THE BACK BUTTON SPEAKS THE X BUTTON'S LANGUAGE.
     Transient drawer views (pin cards, lists, compare, Display) are
     replaceState-only by design, so a bare back press used to pop the
     whole scope and throw the user out of the tool. While the watched
     sheet is open on a phone, ONE sentinel entry sits on the stack:
       back + transient up  -> step() unwinds one X-walk step, re-arm
       back + plain scope   -> the press passes through to the real
                               state/county entry below (history.back)
       sheet closed by UI   -> the sentinel is eaten silently
     CONTRACT: call this factory BEFORE the tool registers its own
     popstate handler, and that handler's first line must be
       if (guard.consumed()) return;
     or the guard pop would trigger a full scope rebuild.
     opts: watch  = the sheet element ('open' class drives arm/disarm)
           active() -> true when a transient (non-scope) view is up
           step()   -> unwind exactly one step (usually: click the X)
  */
  function backGuard(opts) {
    var armed = false, eating = false, consumedFlag = false;
    function arm() {
      if (!phone() || armed || eating) return;
      try { history.pushState({ huBack: 1 }, '', location.href); armed = true; } catch (e) {}
    }
    function disarmEat() {
      if (!armed || eating) return;
      eating = true;
      history.back();
    }
    window.addEventListener('popstate', function () {
      if (eating) { eating = false; armed = false; consumedFlag = true; return; }
      if (!armed) { consumedFlag = false; return; }
      armed = false; consumedFlag = true;
      if (phone() && opts.active()) {
        opts.step();
        setTimeout(function () { if (opts.watch.classList.contains('open')) arm(); }, 0);
      } else {
        history.back();   // sentinel was stale for this view: pass the press along
      }
    });
    var MO = window.MutationObserver;
    if (opts.watch && MO) {
      var was = opts.watch.classList.contains('open');
      new MO(function () {
        var is = opts.watch.classList.contains('open');
        if (is !== was) { was = is; if (is) arm(); else disarmEat(); }
      }).observe(opts.watch, { attributes: true, attributeFilter: ['class'] });
      if (was) arm();
    }
    return { consumed: function () { return consumedFlag; }, arm: arm };
  }

  /* ── Selector popover ─────────────────────────────────────────
     ONE implementation of the pattern four tools had each pasted a
     copy of (atlas, career-tree, iceberg, vendor). Every difference
     between those copies is an option here, so nothing regressed:

       anchorEl    element the popover hangs under. Default: the
                   trigger itself. Atlas passes its toolbar, because
                   its triggers sit inside a bar that scrolls.
       triggerSel  outside-click allowlist. Default '[aria-haspopup]'
                   (atlas keys on '.selector' instead, since its Views
                   pin is an icon-btn that is a legitimate trigger).
       focusSelected  focus '[aria-selected=true]' first when present,
                   else the first .pop-opt. Default true; atlas passes
                   false to keep landing on the first option.
       onOpen()    ran after the close-others pass, before build().
                   Career-tree drops its detail sheet here: the phone
                   budget is ONE transient surface.

     The page still owns its own Esc chain. Call api.escape() first:
     it returns true when it consumed the press (one step, popover
     rung), false when there was nothing open and the page should walk
     its next rung. Same one-step-back contract, one implementation.
  */
  function pop(opts) {
    opts = opts || {};
    var triggerSel = opts.triggerSel || '[aria-haspopup]';
    var focusSelected = opts.focusSelected !== false;
    var open = null;   // { pop, btn }

    function close(refocus) {
      if (!open) return;
      var p = open; open = null;
      p.pop.hidden = true;
      p.btn.setAttribute('aria-expanded', 'false');
      if (refocus) p.btn.focus();
    }

    function openPopover(btn, popEl, build) {
      if (open && open.pop === popEl) { close(true); return; }   // same trigger = toggle
      close(false);
      if (opts.onOpen) opts.onOpen();
      if (build) build();
      popEl.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      /* desktop anchor: under the anchor element, left-aligned to the trigger.
         The phone sheet CSS (hu-global, <700px) overrides both with !important. */
      var a = opts.anchorEl || btn;
      popEl.style.left = btn.offsetLeft + 'px';
      popEl.style.top = (a.offsetTop + a.offsetHeight + 6) + 'px';
      /* right-edge clamp: a trigger flush right must not overflow its host.
         Run TWICE. The first pass measures a popover whose width may still be its
         CSS min-width, because the display face fonts land after first layout and
         then push the content wider (career-tree's Help and Search pops measured
         220 then settled at 228, landing flush against the viewport with no
         gutter). The rAF pass re-measures once the real width exists. */
      var clamp = function () {
        var host = popEl.offsetParent;
        if (!host || popEl.hidden) return;
        var w = popEl.getBoundingClientRect().width || popEl.offsetWidth;
        var max = host.clientWidth - w - 8;
        if (max > 0 && btn.offsetLeft > max) popEl.style.left = max + 'px';
      };
      clamp();
      requestAnimationFrame(clamp);
      open = { pop: popEl, btn: btn };
      var f = (focusSelected && popEl.querySelector('[aria-selected="true"]')) || popEl.querySelector('.pop-opt');
      if (f) f.focus();
    }

    document.addEventListener('click', function (e) {
      var t = /** @type {Element} */ (e.target);
      if (open && t.closest && !t.closest('.selector-pop') && !t.closest(triggerSel)) close(false);
    });
    /* the option walk, delegated: works for popovers built after wiring */
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      var t = /** @type {Element} */ (e.target);
      var host = t.closest && t.closest('.selector-pop');
      if (!host) return;
      var optsList = [].slice.call(host.querySelectorAll('.pop-opt'));
      if (!optsList.length) return;
      var i = optsList.indexOf(document.activeElement), next = null;
      if (e.key === 'ArrowDown') next = optsList[i + 1] || optsList[0];
      else if (e.key === 'ArrowUp') next = optsList[i - 1] || optsList[optsList.length - 1];
      else if (e.key === 'Home') next = optsList[0];
      else if (e.key === 'End') next = optsList[optsList.length - 1];
      if (next) { e.preventDefault(); next.focus(); }
    });

    return {
      open: openPopover,
      close: close,
      isOpen: function () { return !!open; },
      current: function () { return open; },
      /* the popover rung of the one-step-back walk. true = consumed. */
      escape: function () { if (!open) return false; close(true); return true; }
    };
  }

  /* ── URL state ────────────────────────────────────────────────
     The serializer convention (HU-CONTROL-ARCHITECTURE-V2) in one place:
     SCOPE CHANGES PUSH, tweaks REPLACE, and a restore never writes back.
     Seven tools had each hand-rolled this; the drift was in the guard,
     not the intent.

       url()     -> the relative URL to write ('?a=1', '#zone', or
                    location.pathname). The tool owns its params, so this
                    works for query strings and hashes alike.
       scope()   -> the current scope key. When it CHANGES, the write
                    pushes (back walks out of it). Otherwise it replaces.
       seeded    -> true when the page arrived already scoped (a deep
                    link). The first write then replaces instead of
                    pushing a duplicate entry on top of the arrival.
       debounce  -> ms for queue(); typing must not spam replaceState,
                    which Safari rate-limits.

     suspend(fn) runs fn with writes disabled: the popstate restore path
     wraps itself in this so re-applying the URL cannot write it back.
  */
  function urlState(opts) {
    opts = opts || {};
    var SEED = '§init';
    var applying = false;
    var last = opts.seeded ? SEED : '';
    var timer = null;

    function sync() {
      if (applying) return;
      var u = opts.url();
      var s = String(opts.scope ? opts.scope() : '');
      /* a seeded arrival replaces once, then behaves normally */
      var method = (last !== SEED && s !== last) ? 'pushState' : 'replaceState';
      last = s;
      try { history[method](null, '', u || location.pathname); } catch (e) {}
    }
    return {
      sync: sync,
      queue: function () {
        clearTimeout(timer);
        timer = setTimeout(sync, opts.debounce || 300);
      },
      suspend: function (fn) {
        applying = true;
        try { fn(); } finally { applying = false; }
      },
      /* begin()/end() are suspend() for restore blocks that cannot become a
         closure without changing meaning (an early return inside a long
         try/finally). Always pair them in a finally. */
      begin: function () { applying = true; },
      end: function () { applying = false; },
      isApplying: function () { return applying; },
      /* after a restore, tell the controller what the scope now is so the
         next real change is measured against it (and pushes) */
      mark: function (s) { last = String(s == null ? '' : s); }
    };
  }

  /* ── interior label point ─────────────────────────────────────
     Where a region's label belongs: the area centroid of its largest
     polygon, and when a concave shape throws the centroid outside
     (crescent counties, bent panhandles), the midpoint of the widest
     interior span at the centroid's latitude. Bbox centers land in
     the ocean for Florida and outside half the mountain counties —
     this does not.
  */
  function innerPoint(geom) {
    if (!geom) return null;
    var polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : null;
    if (!polys) return null;
    var best = null, bestA = -1;
    polys.forEach(function (rings) {
      var ring = rings && rings[0];
      if (!ring || ring.length < 4) return;
      var a = 0, cx = 0, cy = 0, i, j;
      for (i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var cr = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
        a += cr; cx += (ring[j][0] + ring[i][0]) * cr; cy += (ring[j][1] + ring[i][1]) * cr;
      }
      var area = Math.abs(a / 2);
      if (area > bestA) {
        bestA = area;
        best = { ring: ring, c: a ? [cx / (3 * a), cy / (3 * a)] : [ring[0][0], ring[0][1]] };
      }
    });
    if (!best) return null;
    var inRing = function (pt, ring) {
      var inside = false, i, j;
      for (i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        if (((ring[i][1] > pt[1]) !== (ring[j][1] > pt[1])) &&
            (pt[0] < (ring[j][0] - ring[i][0]) * (pt[1] - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0])) inside = !inside;
      }
      return inside;
    };
    if (inRing(best.c, best.ring)) return best.c;
    var y = best.c[1], ring = best.ring, xs = [], i, j;
    for (i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      if ((ring[i][1] > y) !== (ring[j][1] > y))
        xs.push(ring[i][0] + (y - ring[i][1]) / (ring[j][1] - ring[i][1]) * (ring[j][0] - ring[i][0]));
    }
    xs.sort(function (a, b) { return a - b; });
    var bw = -1, bx = best.c[0], k;
    for (k = 0; k + 1 < xs.length; k += 2) {
      var w = xs[k + 1] - xs[k];
      if (w > bw) { bw = w; bx = (xs[k] + xs[k + 1]) / 2; }
    }
    return [bx, y];
  }

  /* HUKit.conusView(el) -> { center, zoom, minZoom }
     The home view for a U.S. map, computed from the container instead of
     hardcoded. Both full-map tools shipped with center [-96.5,39.3] zoom 3.6
     minZoom 2.8, tuned on a wide desktop. Measured at 360 CSS px that boot
     view shows 36% of the width of the lower 48, and the 2.8 floor still
     only reaches 63%, so the whole country was unreachable on a phone at
     any zoom. Web Mercator, 512px tiles, same projection MapLibre uses. */
  var CONUS = { w: -124.8, s: 24.4, e: -66.9, n: 49.4 };
  // The shipped home centre, kept exactly. The bug was the zoom and the floor,
  // not the centre, so this does not move and desktop framing is untouched.
  var HOME_CENTER = [-96.5, 39.3];
  var DESKTOP_ZOOM = 3.6;   // the shipped desktop camera, now a ceiling
  function mercY(lat) {
    var s = Math.sin(lat * Math.PI / 180);
    return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  }
  /**
   * @param {HTMLElement|null} el
   * @returns {{ center: [number, number], zoom: number, minZoom: number }}
   */
  function conusView(el) {
    // The container is the truth, but both maps construct the map BEFORE layout has
    // run, so clientWidth/clientHeight are 0 on the first call. Falling back to a
    // fixed stub there produced a far-out boot camera (zoom 1.6) that then snapped
    // once the real reset ran. Fall back to the window instead, which is already
    // correct at that moment. 64px is the site header, the only chrome above the map.
    var vw = (typeof window !== 'undefined' && window.innerWidth) || 0;
    var vh = (typeof window !== 'undefined' && window.innerHeight) || 0;
    var w = Math.max((el && el.clientWidth) || vw || 360, 300);
    var h = Math.max((el && el.clientHeight) || (vh ? vh - 64 : 0) || 640, 240);
    // Chrome sits on the south edge of both maps (metric bar, attribution strip).
    // Pad harder on phones so the fit clears it instead of hiding the Gulf coast.
    var padX = w < 700 ? 10 : 28;
    var padY = w < 700 ? 74 : 40;
    // Span is measured from the FIXED centre outward, so the farther edge is the
    // one that has to fit. Centring on the bbox midpoint instead would clip the
    // east coast, because -96.5 sits west of the true midpoint of the lower 48.
    var halfX = Math.max(HOME_CENTER[0] - CONUS.w, CONUS.e - HOME_CENTER[0]) / 360;
    var halfY = Math.max(mercY(HOME_CENTER[1]) - mercY(CONUS.n), mercY(CONUS.s) - mercY(HOME_CENTER[1]));
    var zoom = Math.min(
      Math.log2(Math.max(w - padX * 2, 80) / (halfX * 2 * 512)),
      Math.log2(Math.max(h - padY * 2, 80) / (halfY * 2 * 512))
    );
    // Never zoom in past the shipped desktop frame: wide screens are unchanged,
    // only viewports too narrow to hold the country get a smaller number.
    zoom = Math.max(1.6, Math.min(zoom, DESKTOP_ZOOM));
    return {
      center: [HOME_CENTER[0], HOME_CENTER[1]],
      zoom: +zoom.toFixed(2),
      // The floor must never sit above the home view. That inversion IS the bug.
      minZoom: +Math.min(2.8, zoom - 0.4).toFixed(2)
    };
  }

  /* ── Dialog: the modal card every game menu sits on ────────────
     Five games each built their own overlay, so the close button, Esc, the
     back gesture, help and settings differed in every one of them
     (docs/HU-GAME-MENUS-2026-09-23.md, section 4). This is the one card.

       HUKit.dialog(opts) -> { el, body, heading, x, open(), close(why), isOpen() }

     title          the h2, which is also the dialog's accessible name
     body           a node or a string, or a builder fn(bodyEl, api) that fills
                    the body (and may return a node to append)
     className      extra class on the <dialog>
     role           'dialog' (default) or 'alertdialog', for a confirm
     backdropClose  opt-in: a tap outside the card closes it
     focus          the element to start on, or a function returning it.
                    Default: the first control in the body, else the X.
     onOpen()       after it opens
     onClose(why)   after it closes. why is 'x', 'esc', 'back', 'backdrop', or
                    whatever the caller passed to close().

     A native <dialog> opened with showModal(), so focus stays inside and Esc
     arrives as the 'cancel' event, both for free. The browser sends 'cancel'
     to the TOP modal only, which is what lets a confirm over a menu close
     alone. Focus goes back to whatever opened it.

     THE BACK GESTURE. One HUKit.backGuard serves the whole stack, not one per
     card: two guards would both hear the same popstate and the menu would shut
     under its own confirm. The guard watches a detached element whose 'open'
     class means "a card is up"; a back press closes the top card and re-arms
     while any are left. A page with its own popstate handler builds its cards
     first and starts that handler with
       if (HUKit.dialog.consumed()) return;
     Close a sheet before opening a card. The sheet's guard and this one would
     share the press, and a phone shows one transient surface at a time anyway
     (the cards underneath a stacked one step out of view there, in CSS).

     Where showModal is missing (an old engine, the test stub) the card opens
     with the open attribute instead, and Esc is caught on the document, still
     top card only. */
  var dlgStack = [], dlgSeq = 0, dlgGuard = null, dlgWatch = null, dlgKeysWired = false;
  var CONTROL = 'button,a[href],input,select,textarea,[tabindex]';
  var ICON_X = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_MENU = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';

  function uid() { return 'hu-dlg-' + (++dlgSeq); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (tag === 'button') n.setAttribute('type', 'button');
    return n;
  }
  function firstControl(root) {
    var list = root.querySelectorAll(CONTROL);
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c.disabled && !c.hidden && c.getAttribute('tabindex') !== '-1') return c;
    }
    return null;
  }
  // Up, Down, Home and End walk a column of rows, the way the popover options already do
  function rowWalk(root, sel) {
    root.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k !== 'ArrowDown' && k !== 'ArrowUp' && k !== 'Home' && k !== 'End') return;
      var rows = [].slice.call(root.querySelectorAll(sel));
      if (!rows.length) return;
      var i = rows.indexOf(document.activeElement), next = null;
      if (k === 'ArrowDown') next = rows[i + 1] || rows[0];
      else if (k === 'ArrowUp') next = rows[i - 1] || rows[rows.length - 1];
      else if (k === 'Home') next = rows[0];
      else next = rows[rows.length - 1];
      if (e.preventDefault) e.preventDefault();
      next.focus();
    });
  }
  function dlgSync() {
    var n = dlgStack.length;
    for (var i = 0; i < n; i++) {
      if (i < n - 1) dlgStack[i].el.classList.add('hu-dlg--under');
      else dlgStack[i].el.classList.remove('hu-dlg--under');
    }
    if (dlgWatch) { if (n) dlgWatch.classList.add('open'); else dlgWatch.classList.remove('open'); }
    var root = document.documentElement;
    if (root) { if (n) root.classList.add('hu-dlg-lock'); else root.classList.remove('hu-dlg-lock'); }
  }
  function dlgWire() {
    if (dlgGuard) return;
    dlgWatch = document.createElement('div');   // never attached: it only carries the class the guard watches
    dlgGuard = backGuard({
      watch: dlgWatch,
      active: function () { return dlgStack.length > 0; },
      step: function () { var top = dlgStack[dlgStack.length - 1]; if (top) top.close('back'); }
    });
    if (dlgKeysWired) return;
    dlgKeysWired = true;
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var top = dlgStack[dlgStack.length - 1];
      if (!top || top.native) return;             // a real modal hears Esc as 'cancel'
      if (e.preventDefault) e.preventDefault();
      top.close('esc');
    });
  }

  function dialog(opts) {
    opts = opts || {};
    dlgWire();
    var id = uid();
    var d = /** @type {HTMLDialogElement} */ (document.createElement('dialog'));
    d.className = 'hu-dlg' + (opts.className ? ' ' + opts.className : '');
    d.setAttribute('aria-labelledby', id + '-t');
    if (opts.role === 'alertdialog') d.setAttribute('role', 'alertdialog');
    var native = typeof d.showModal === 'function';
    if (!native) d.classList.add('hu-dlg--nm');

    var inner = make('div', 'hu-dlg-in');
    var head = make('div', 'hu-dlg-head');
    var h = make('h2', 'hu-dlg-title', opts.title || '');
    h.id = id + '-t';
    h.setAttribute('tabindex', '-1');             // focusable by script only: a card that is all reading starts here
    var x = make('button', 'hu-dlg-x');
    x.setAttribute('aria-label', 'Close');
    x.innerHTML = ICON_X;
    var body = make('div', 'hu-dlg-body');
    head.appendChild(h); head.appendChild(x);
    inner.appendChild(head); inner.appendChild(body);
    d.appendChild(inner);
    document.body.appendChild(d);

    var open = false, opener = null, downOnSelf = false;
    var rec = { el: d, native: native, close: close };

    function show() {
      if (open) return;
      opener = document.activeElement;
      open = true;
      dlgStack.push(rec);
      if (native) { try { d.showModal(); } catch (err) { d.setAttribute('open', ''); } }
      else d.setAttribute('open', '');
      dlgSync();
      var f = typeof opts.focus === 'function' ? opts.focus() : opts.focus;
      f = f || firstControl(body) || x;
      if (f && f.focus) f.focus();
      if (opts.onOpen) opts.onOpen();
    }
    function close(why) {
      if (!open) return;
      open = false;
      var i = dlgStack.indexOf(rec);
      if (i > -1) dlgStack.splice(i, 1);
      d.classList.remove('hu-dlg--under');
      if (native && d.open) d.close(); else d.removeAttribute('open');
      dlgSync();                                  // un-hide the card below BEFORE focusing into it
      if (opener && opener.focus && document.contains(opener)) opener.focus();
      opener = null;
      if (opts.onClose) opts.onClose(why || 'api');
    }

    x.addEventListener('click', function () { close('x'); });
    d.addEventListener('cancel', function (e) {
      if (e.preventDefault) e.preventDefault();   // the kit closes it, so focus return and onClose run
      if (dlgStack[dlgStack.length - 1] === rec) close('esc');
    });
    // shut some other way (the browser's own close watcher, a method=dialog form): catch up.
    // d.open is checked because a card closed and reopened in one task gets a stale 'close'.
    d.addEventListener('close', function () { if (open && !d.open) close('esc'); });
    // a backdrop tap lands on the <dialog> itself; the card inside covers every other point.
    // Both ends of the press must be outside, or a drag out of the card would shut it.
    d.addEventListener('pointerdown', function (e) { downOnSelf = e.target === d; });
    d.addEventListener('click', function (e) {
      if (opts.backdropClose && downOnSelf && e.target === d) close('backdrop');
      downOnSelf = false;
    });

    var api = { el: d, body: body, heading: h, x: x, open: show, close: close, isOpen: function () { return open; } };
    var b = typeof opts.body === 'function' ? opts.body(body, api) : opts.body;
    if (typeof b === 'string') body.appendChild(make('p', 'hu-dlg-text', b));
    else if (b) body.appendChild(b);
    return api;
  }
  dialog.anyOpen = function () { return dlgStack.length > 0; };
  dialog.consumed = function () { return dlgGuard ? dlgGuard.consumed() : false; };

  /* ── Confirm ──────────────────────────────────────────────────
     The iPhone's "Delete Photo": the button says the act, never Yes or OK,
     and the destructive one is red.

       HUKit.confirm({ title, body, verb, danger }) -> Promise<boolean>

     The verb comes first (left in a row, top in a stack), then Cancel, with
     room between them. Only the verb resolves true; Cancel, the X, Esc and
     the back gesture all resolve false. With danger:true the verb is drawn
     red and focus starts on Cancel, so a stray Enter cannot destroy anything
     (the WAI-ARIA alert dialog pattern). One card per question, removed once
     it is answered. A verb that does not name the act throws, loudly, at
     the call. */
  var NOT_A_VERB = /^(yes|ok|okay|sure|confirm)$/i;
  function confirm(opts) {
    opts = opts || {};
    var verb = String(opts.verb || '').trim();
    if (!verb || NOT_A_VERB.test(verb)) {
      throw new TypeError('HUKit.confirm: the button names the act, e.g. "Restart the shift", not "' + verb + '"');
    }
    return new Promise(function (resolve) {
      var said = false, go = null, cancel = null;
      var card = dialog({
        title: opts.title || verb + '?',
        role: 'alertdialog',
        className: 'hu-dlg--confirm',
        body: function (body, api) {
          if (opts.body) {
            var p = typeof opts.body === 'string' ? make('p', 'hu-dlg-text', opts.body) : opts.body;
            if (!p.id) p.id = uid();
            api.el.setAttribute('aria-describedby', p.id);
            body.appendChild(p);
          }
          var acts = make('div', 'hu-dlg-acts');
          go = make('button', 'hu-dlg-btn ' + (opts.danger ? 'hu-dlg-btn--danger' : 'hu-dlg-btn--primary'), verb);
          cancel = make('button', 'hu-dlg-btn', 'Cancel');
          go.addEventListener('click', function () { said = true; api.close('verb'); });
          cancel.addEventListener('click', function () { api.close('cancel'); });
          acts.appendChild(go); acts.appendChild(cancel);
          body.appendChild(acts);
        },
        focus: function () { return opts.danger ? cancel : go; },
        onClose: function () {
          if (card.el.remove) card.el.remove();
          resolve(said);
        }
      });
      card.open();
    });
  }

  /* ── Settings ─────────────────────────────────────────────────
     Wordle's gear: a few toggle rows, each a label, one line under it saying
     what it does, and a switch on the right. A flip applies at once and is
     remembered. There is no Save button.

       HUKit.settings(opts) -> { el, dialog, list, open(), close(), isOpen(),
                                 get(key), values(), set(key, value) }

     id        the game's short id ('af', 'ug', 'da'); values persist in
               localStorage under 'hu-settings-<id>'. No id, nothing persists.
     title     default 'Settings'
     rows      [{ key, label, help, value }], value being the default
     onChange(key, value, values)   the game applies it; the kit remembers it.
               set() from code does not call it back.

     Storage can be absent or throw (a private window, blocked site data), so
     every read and write is fenced and a blocked store still draws the
     defaults. Each row is ONE <button role="switch">, so the whole row is the
     target and .hu-sw is only its picture.

     HUKit.settings.assist carries three ready rows a game can opt into. There
     is deliberately no motion row and no theme row: motion follows the
     device and the theme follows the site, and Apple's guidance is not to
     rebuild a system setting inside an app. */
  function storage() { try { return window.localStorage || null; } catch (e) { return null; } }
  function load(k) { var s = storage(); if (!s) return null; try { return s.getItem(k); } catch (e) { return null; } }
  function save(k, v) { var s = storage(); if (!s) return; try { s.setItem(k, v); } catch (e) {} }

  function settings(opts) {
    opts = opts || {};
    var key = opts.id ? 'hu-settings-' + opts.id : '';
    var rows = opts.rows || [];
    var vals = {}, sws = {};
    rows.forEach(function (r) { vals[r.key] = !!r.value; });
    var saved = null;
    if (key) { try { saved = JSON.parse(load(key) || 'null'); } catch (e) { saved = null; } }
    if (saved && typeof saved === 'object') {
      rows.forEach(function (r) { if (typeof saved[r.key] === 'boolean') vals[r.key] = saved[r.key]; });
    }
    function values() { var o = {}; for (var k in vals) o[k] = vals[k]; return o; }
    function paint(k) {
      var s = sws[k]; if (!s) return;
      s.b.setAttribute('aria-checked', vals[k] ? 'true' : 'false');
      if (vals[k]) s.sw.classList.add('on'); else s.sw.classList.remove('on');
    }
    function put(k, v, tell) {
      if (!Object.prototype.hasOwnProperty.call(vals, k)) return;
      vals[k] = !!v;
      paint(k);
      if (key) save(key, JSON.stringify(vals));
      if (tell && opts.onChange) opts.onChange(k, vals[k], values());
    }

    var list = make('ul', 'hu-gm-set');
    rows.forEach(function (r) {
      var id = uid();
      var li = make('li');
      var b = make('button', 'hu-gm-toggle');
      b.setAttribute('role', 'switch');
      b.setAttribute('aria-labelledby', id + '-l');
      var txt = make('span', 'hu-gm-toggle-txt');
      var name = make('span', 'hu-gm-toggle-name', r.label);
      name.id = id + '-l';
      txt.appendChild(name);
      if (r.help) {
        var help = make('span', 'hu-gm-toggle-help', r.help);
        help.id = id + '-h';
        b.setAttribute('aria-describedby', id + '-h');
        txt.appendChild(help);
      }
      var sw = make('span', 'hu-sw');
      sw.setAttribute('aria-hidden', 'true');
      b.appendChild(txt); b.appendChild(sw);
      b.addEventListener('click', function () { put(r.key, !vals[r.key], true); });
      sws[r.key] = { b: b, sw: sw };
      paint(r.key);
      li.appendChild(b);
      list.appendChild(li);
    });
    rowWalk(list, '.hu-gm-toggle');

    var card = dialog({ title: opts.title || 'Settings', className: 'hu-dlg--settings', body: list, onClose: opts.onClose });
    return {
      el: card.el, dialog: card, list: list,
      open: card.open, close: card.close, isOpen: card.isOpen,
      get: function (k) { return vals[k]; },
      values: values,
      set: function (k, v) { put(k, v, false); }
    };
  }
  // ready rows; a game spreads one into its own to change the default
  settings.assist = Object.freeze({
    moreTime: Object.freeze({ key: 'moreTime', label: 'More time', help: 'Clocks and countdowns run slower.', value: false }),
    soundsAsText: Object.freeze({ key: 'soundsAsText', label: 'Show sounds as text', help: 'Alarms and cues also appear as words on screen.', value: false }),
    hints: Object.freeze({ key: 'hints', label: 'Hints', help: 'A short tip shows next to the thing it explains.', value: true })
  });

  function pressed(btns, on) { btns.forEach(function (b) { b.setAttribute('aria-expanded', on ? 'true' : 'false'); }); }

  /* ── How to play ──────────────────────────────────────────────
     Wordle's "How To Play": it opens BY ITSELF on the first visit only, and
     after that only when asked, from the game's "?" or the menu's Help row.
     Up to three short rules, then an example if the game has one.

       HUKit.howTo(opts) -> { el, dialog, open(), close(), isOpen(), seen(),
                              firstVisit(), button() }

     id       the game's short id; the flag lives in localStorage 'hu-howto-<id>'
     title    default 'How to play'
     rules    up to three strings. A fourth is not drawn: past three it is a
              manual, and the peek is where the rest of the words go.
     example  a node, or a builder fn(el), shown under the rules
     action   optional { label, run } for a primary button at the foot, e.g.
              { label: 'Clock in', run: startShift }. It closes the card, then runs.
     auto     default true: open now if this browser has not seen it. false
              leaves the moment to the game, which calls firstVisit() itself.

     The flag is written when the card CLOSES, so a reload mid-read shows it
     again. Where storage is blocked it cannot be remembered, so the card
     shows on each visit rather than never. A tap outside the card closes it.
     button() makes the "?" (44px, named "How to play"). */
  function howTo(opts) {
    opts = opts || {};
    var key = opts.id ? 'hu-howto-' + opts.id : '';
    var rules = opts.rules || [];
    var btns = [], act = null;
    if (rules.length > 3 && typeof console !== 'undefined') console.warn('HUKit.howTo: three rules at most; the rest were not drawn');
    var card = dialog({
      title: opts.title || 'How to play',
      className: 'hu-dlg--howto',
      backdropClose: true,
      body: function (body, api) {
        var ol = make('ol', 'hu-gm-rules');
        rules.slice(0, 3).forEach(function (t) { ol.appendChild(make('li', null, t)); });
        body.appendChild(ol);
        if (opts.example) {
          var ex = make('div', 'hu-gm-ex');
          ex.appendChild(make('p', 'hu-gm-cap', 'Example'));
          var n = typeof opts.example === 'function' ? opts.example(ex) : opts.example;
          if (n && typeof n === 'object') ex.appendChild(n);
          body.appendChild(ex);
        }
        if (opts.action) {
          var a = opts.action;
          act = make('button', 'hu-dlg-btn hu-dlg-btn--primary hu-gm-go', a.label);
          act.addEventListener('click', function () { api.close('action'); if (a.run) a.run(); });
          body.appendChild(act);
        }
      },
      // A card that is all reading starts on its title (the WAI-ARIA dialog pattern), so a screen
      // reader begins at the top and nothing lights up at first paint. The X is one Tab away.
      focus: function () { return act || card.heading; },
      // Focusing the action scrolls a short card (a sideways phone) down to it, past rules 1 and 2.
      // The reading starts at the top; the action is still focused, so Enter still plays.
      onOpen: function () { pressed(btns, true); var bd = card.el.querySelector('.hu-dlg-body'); if (bd) bd.scrollTop = 0; },
      onClose: function (why) {
        if (key) save(key, '1');
        pressed(btns, false);
        if (opts.onClose) opts.onClose(why);
      }
    });
    function seen() { return !!key && load(key) === '1'; }
    function firstVisit() { if (!key || seen()) return false; card.open(); return true; }
    if (opts.auto !== false) firstVisit();
    return {
      el: card.el, dialog: card,
      open: card.open, close: card.close, isOpen: card.isOpen,
      seen: seen, firstVisit: firstVisit,
      button: function () {
        var b = make('button', 'hu-gm-q', '?');
        b.setAttribute('aria-label', 'How to play');
        b.setAttribute('title', 'How to play');
        b.setAttribute('aria-haspopup', 'dialog');
        b.setAttribute('aria-expanded', card.isOpen() ? 'true' : 'false');
        b.addEventListener('click', function () { b.focus(); card.open(); });   // Safari: see gameMenu's opens()
        btns.push(b);
        return b;
      }
    };
  }

  /* ── Game menu ────────────────────────────────────────────────
     The pause menu of any console game, the same rows in the same order in
     every game on the site:
       Resume     primary, first, and where focus starts. Closes the menu.
       Help       opens the how-to card (a HUKit.howTo, or any function)
       Settings   opens the settings card (a HUKit.settings, or any function)
       Restart    asks first, through HUKit.confirm, with the game's own verb
       Leave      a link the game names, e.g. back to /learn/
       Site menu  last. Closes this and opens the site's own nav.
     Every row but Resume is optional; one that is not given is not drawn.
     Help and Settings open OVER the menu, so closing them lands back on it.

       HUKit.gameMenu(opts) -> { el, dialog, open(), close(), isOpen(), button() }

     title      the card's h2, default 'Menu'
     onResume() after Resume closes it. onClose(why) runs for every way out,
                so pause in onOpen and unpause in onClose.
     help, settings   an api with open(), or a function
     restart    { verb: 'Restart the shift', title, body, run() }
     leave      { href: '/learn/', label: 'Leave' }, or just the href
     siteMenu   default true
     escOpens   opt-in: Esc with nothing open opens the menu. true, or a
                function(e) that returns true when the game has nothing of its
                own open, because the kit cannot see a game's own overlays. It
                listens in the capture phase, so it decides before a page's own
                Esc handler has closed anything.

     button() makes the one menu button a game puts in its toolbar: the icon
     and the visible word Menu, 44px, aria-expanded kept in step. A game that
     adopts it drops its own site-menu button: the Site menu row replaces it. */
  /** @param {string} s @returns {HTMLElement|null} */
  function q(s) { return document.querySelector ? /** @type {HTMLElement|null} */ (document.querySelector(s)) : null; }
  function siteMenu() {
    // The merged band parks the nav behind [data-nav-summon]. A game may keep that control
    // hidden and let this row press it, which is what Alarm Fatigue's phone menu already does.
    var s = q('[data-nav-summon]');
    if (s) { s.click(); return; }
    // an ordinary page: the hamburger where it shows, else the links are on screen already
    var ham = q('#navHam');
    var shown = !!ham && (!window.getComputedStyle || window.getComputedStyle(ham).display !== 'none');
    if (shown) ham.click();
    var first = q(shown ? '#navLinks a' : 'nav[aria-label="Primary"] a');
    if (first && first.focus) first.focus();
  }
  function leaveClick(e, href) {
    // On a phone the back guard holds a spare history entry while a card is up. Following the
    // link on top of it leaves that entry behind, and back would later land on the game twice.
    // Replacing it takes the spare entry's place instead.
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!phone() || !location.replace) return;
    if (e.preventDefault) e.preventDefault();
    location.replace(href);
  }

  function gameMenu(opts) {
    opts = opts || {};
    var btns = [];
    var card = null;
    function row(ul, tag, label, primary) {
      var li = make('li');
      var b = make(tag, 'hu-gm-row' + (primary ? ' hu-gm-row--primary' : ''), label);
      li.appendChild(b);
      ul.appendChild(li);
      return b;
    }
    // A row that opens a card over the menu takes focus first. Safari does not focus a button
    // on click, and without this the card below would hand focus back to Resume, not to the row.
    function opens(b, fn) { b.addEventListener('click', function () { if (b.focus) b.focus(); fn(); }); }
    function open(t) { if (typeof t === 'function') t(); else if (t && t.open) t.open(); }

    var ul = make('ul', 'hu-gm-list');
    row(ul, 'button', 'Resume', true).addEventListener('click', function () {
      card.close('resume');
      if (opts.onResume) opts.onResume();
    });
    if (opts.help) opens(row(ul, 'button', 'Help'), function () { open(opts.help); });
    if (opts.settings) opens(row(ul, 'button', 'Settings'), function () { open(opts.settings); });
    if (opts.restart) {
      var rs = opts.restart;
      opens(row(ul, 'button', 'Restart'), function () {
        confirm({ title: rs.title, body: rs.body, verb: rs.verb || 'Restart', danger: true }).then(function (yes) {
          if (!yes) return;
          card.close('restart');
          if (rs.run) rs.run();
        });
      });
    }
    if (opts.leave) {
      var lv = typeof opts.leave === 'string' ? { href: opts.leave } : opts.leave;
      var a = row(ul, 'a', lv.label || 'Leave');
      a.setAttribute('href', lv.href);
      a.addEventListener('click', function (e) { leaveClick(e, lv.href); });
    }
    if (opts.siteMenu !== false) {
      row(ul, 'button', 'Site menu').addEventListener('click', function () { card.close('site'); siteMenu(); });
    }
    rowWalk(ul, '.hu-gm-row');

    card = dialog({
      title: opts.title || 'Menu',
      className: 'hu-dlg--menu',
      body: ul,
      onOpen: function () { pressed(btns, true); if (opts.onOpen) opts.onOpen(); },
      onClose: function (why) { pressed(btns, false); if (opts.onClose) opts.onClose(why); }
    });

    if (opts.escOpens) {
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return;
        if (dlgStack.length || peekOn) return;
        if (q('dialog[open]') || q('.nav-links.open')) return;
        if (document.body.classList.contains('nav-summoned')) return;
        if (typeof opts.escOpens === 'function' && !opts.escOpens(e)) return;
        // or this same press reaches the new card as 'cancel' and shuts it again
        if (e.preventDefault) e.preventDefault();
        card.open();
      }, true);
    }

    return {
      el: card.el, dialog: card,
      open: card.open, close: card.close, isOpen: card.isOpen,
      button: function () {
        var b = make('button', 'hu-gm-btn');
        b.setAttribute('aria-haspopup', 'dialog');
        b.setAttribute('aria-expanded', card.isOpen() ? 'true' : 'false');
        b.innerHTML = ICON_MENU + '<span>Menu</span>';
        opens(b, function () { card.open(); });
        btns.push(b);
        return b;
      }
    };
  }

  window.HUKit = { phone: phone, dcap: dcap, peek: peek, sheet: sheet, locate: locate, backGuard: backGuard, innerPoint: innerPoint, pop: pop, urlState: urlState, conusView: conusView, CONUS: CONUS, PHONE_MQ: PHONE_MQ,
    dialog: dialog, gameMenu: gameMenu, settings: settings, howTo: howTo, confirm: confirm };
})();
