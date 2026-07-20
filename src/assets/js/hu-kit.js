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
      if (opts.onDismiss) opts.onDismiss();
      else el.classList.remove('open');
    }

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
      open: function (det) { el.classList.add('open'); setDet(det || opts.startDetent || 'dt-half'); },
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

  window.HUKit = { phone: phone, dcap: dcap, sheet: sheet, locate: locate, PHONE_MQ: PHONE_MQ };
})();
