/* The reading layer, loaded only on Learn + Rounds articles (base.njk gates on
   `section`). Jobs: the 2px progress hairline; chrome that yields while you
   read; the reading memory behind "Continue reading" on the section indexes;
   and the share affordance in the end-of-article block. Everything stays in
   this browser: localStorage, no accounts, nothing sent anywhere (the same
   doctrine as the Learn read ticks and the career tree build).
   Keyboard: focus into the retracted nav brings it back (CSS :focus-within),
   so nothing is reachable-but-invisible. */
(function () {
  var bar = document.getElementById('read-progress');
  var nav = document.querySelector('nav[aria-label="Primary"]');
  var phone = window.matchMedia('(max-width: 699px)');
  var lastY = window.scrollY, ticking = false, hidden = false;

  function pctNow() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  function frame() {
    ticking = false;
    if (bar) bar.style.transform = 'scaleX(' + pctNow() + ')';
    if (nav && phone.matches) {
      var y = window.scrollY;
      var ham = document.getElementById('navHam');
      var menuOpen = ham && ham.getAttribute('aria-expanded') === 'true';
      if (!menuOpen) {
        if (y > lastY + 4 && y > 160 && !hidden) { hidden = true; nav.classList.add('nav-yield'); }
        else if ((y < lastY - 4 || y <= 160) && hidden) { hidden = false; nav.classList.remove('nav-yield'); }
      }
      lastY = y;
    } else if (nav && hidden) {
      hidden = false; nav.classList.remove('nav-yield');   /* rotation to desktop mid-read */
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  frame();

  /* ── Reading memory ─────────────────────────────────────────────────────── */
  var MEM_KEY = 'hu-reading', ROUTE_KEY = 'hu-learn-route';
  var path = location.pathname;
  var title = document.title.replace(/\s*·\s*Healthcare Uncharted\s*$/, '');
  function readMem() { try { return JSON.parse(localStorage.getItem(MEM_KEY)) || {}; } catch (e) { return {}; } }
  function writeMem(m) { try { localStorage.setItem(MEM_KEY, JSON.stringify(m)); } catch (e) {} }

  function saveProgress() {
    var p = pctNow();
    var m = readMem();
    if (p >= 0.95) {
      /* finished: resume state retires, and a Learn module earns its index
         tick even on a deep-link arrival. The index's read-ticks script marks
         on CLICK only, an honest limit its own comment names; actually
         reading the article to the end closes it. */
      delete m[path];
      var slug = (path.match(/^\/learn\/([a-z0-9-]+)\/$/) || [])[1];
      if (slug) {
        try {
          var list = JSON.parse(localStorage.getItem(ROUTE_KEY) || '[]');
          if (list.indexOf(slug) < 0) { list.push(slug); localStorage.setItem(ROUTE_KEY, JSON.stringify(list)); }
        } catch (e) {}
      }
    } else if (p > 0.03) {
      m[path] = { p: Math.round(p * 100) / 100, t: Date.now(), title: title };
    } else {
      return;   /* arrived and bounced: not reading yet, nothing to remember */
    }
    writeMem(m);
  }
  var saveT = 0;
  window.addEventListener('scroll', function () {
    window.clearTimeout(saveT); saveT = window.setTimeout(saveProgress, 900);
  }, { passive: true });
  window.addEventListener('pagehide', saveProgress);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') saveProgress();
  });

  /* ── Resume: the Continue reading card links here with #continue ────────── */
  if (location.hash === '#continue') {
    var entry = readMem()[path];
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    if (entry && entry.p) {
      var userMoved = false;
      ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
        window.addEventListener(ev, function () { userMoved = true; }, { passive: true, once: true });
      });
      var jump = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (max > 0) window.scrollTo(0, entry.p * max);
      };
      requestAnimationFrame(function () { requestAnimationFrame(jump); });
      /* one late retry: images landing after first paint move the target, but
         never yank a reader who has already started moving on their own */
      setTimeout(function () { if (!userMoved) jump(); }, 350);
    }
  }

  /* ── Share (end-of-article block) ───────────────────────────────────────── */
  var shareBtn = document.getElementById('rn-share');
  var sharedOk = document.getElementById('rn-shared');
  if (shareBtn) {
    var canShare = !!navigator.share;
    var canCopy = !!(navigator.clipboard && navigator.clipboard.writeText);
    if (canShare || canCopy) {
      shareBtn.hidden = false;
      shareBtn.addEventListener('click', function () {
        if (canShare) { navigator.share({ title: title, url: location.href }).catch(function () {}); return; }
        navigator.clipboard.writeText(location.href).then(function () {
          if (!sharedOk) return;
          sharedOk.hidden = false;
          setTimeout(function () { sharedOk.hidden = true; }, 2000);
        }).catch(function () {});
      });
    }
  }
})();
