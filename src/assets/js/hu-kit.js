/* ================================================================
   HU KIT v1 — shared interactive chrome controllers
   (HU-UI-GRAMMAR Phase 2 · 2026-07-19)

   ONE detent-sheet implementation, ONE geolocation helper, and the
   shared phone/motion budget, so every tool stops rolling its own.
   No dependencies. Everything hangs off window.HUKit.

   HUKit.phone()        -> true at or under the 699px sheet breakpoint
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
   HUKit.pop(opts)      -> selector-popover controller: open/close,
                           anchor + right-edge clamp, outside-click,
                           arrow/Home/End walk, focus return. The kit
                           owns the POPOVER rung of the Esc walk only;
                           the page keeps its own next rung.
================================================================ */
(function () {
  'use strict';

  var PHONE_MQ = window.matchMedia('(max-width: 699px)');
  var REDUCED_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  function phone() { return PHONE_MQ.matches; }
  function dcap(ms) { return REDUCED_MQ.matches ? 0 : (PHONE_MQ.matches ? Math.min(ms, 250) : ms); }

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
      if (open && !e.target.closest('.selector-pop') && !e.target.closest(triggerSel)) close(false);
    });
    /* the option walk, delegated: works for popovers built after wiring */
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      var host = e.target.closest && e.target.closest('.selector-pop');
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

  window.HUKit = { phone: phone, dcap: dcap, sheet: sheet, locate: locate, backGuard: backGuard, innerPoint: innerPoint, pop: pop, urlState: urlState, PHONE_MQ: PHONE_MQ };
})();
