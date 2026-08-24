/* The "Continue reading" card on the Learn and Rounds indexes. Reads the
   reading memory reading.js keeps (localStorage, on-device only) and surfaces
   the most recent unfinished article for this section; invisible without a
   history. The card resumes at your spot via #continue. Built with DOM nodes,
   not innerHTML: the stored title travels through textContent. */
(function () {
  var slot = document.getElementById('continue-slot'); if (!slot) return;
  var sect = slot.getAttribute('data-section') || '/learn/';
  var store;
  try { store = JSON.parse(localStorage.getItem('hu-reading')) || {}; } catch (e) { return; }
  var best = null;
  for (var url in store) {
    var e = store[url];
    if (url.indexOf(sect) !== 0 || !e || !(e.p > 0.03) || e.p >= 0.95) continue;
    if (!best || e.t > best.e.t) best = { url: url, e: e };
  }
  if (!best) return;
  var pct = Math.round(best.e.p * 100);
  var a = document.createElement('a');
  a.className = 'rn-card rn-continue';
  a.href = best.url + '#continue';
  var k = document.createElement('span'); k.className = 'rn-k';
  k.textContent = 'Continue reading · ' + pct + '% in';
  var t = document.createElement('span'); t.className = 'rn-t';
  t.textContent = best.e.title || best.url;
  var track = document.createElement('span'); track.className = 'rn-bar'; track.setAttribute('aria-hidden', 'true');
  var fill = document.createElement('span'); fill.style.width = pct + '%';
  track.appendChild(fill);
  a.appendChild(k); a.appendChild(t); a.appendChild(track);
  slot.appendChild(a);
  slot.hidden = false;
})();
