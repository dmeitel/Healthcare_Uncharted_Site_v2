/* fun-today.js · today's puzzles (2026-10-18), on the Fun page's shelf and on /fun/today/.
   Each [data-daily] card (src/_includes/components/fun-today.njk, one per entry in src/_data/dailies.js) gets today's
   number and where you stand, read from what its game already saves in this browser; nothing is sent anywhere. The day
   turns at midnight Mountain time, as it does in both games. #fnDate, where a page has one, gets the date, and #fnNext
   when the next set deals. tests/fun-today.test.js runs this file against stored games. */
(function () {
  'use strict';
  var TZ = 'America/Denver';
  function dayKey(d) {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d || new Date()); }
    catch (e) { return (d || new Date()).toISOString().slice(0, 10); }
  }
  var utc = function (k) { return Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)); };
  var number = function (k, one) { return Math.round((utc(k) - utc(one)) / 86400000) + 1; };
  /* what each game saved in this browser, fenced: a private window or blocked site data shows every card as not played */
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
  function watch(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  var today = dayKey(), id = 'day:' + today;
  /* each game's own record of today: [what the card says, the button's word] */
  var STATE = {
    headwall: function () {
      var p = read('hu-da') || {}, d = p.daily || {};
      if (p.done && p.done[id]) return ['<b>Solved</b>' + (d.last === today && d.streak > 1 ? ', a ' + d.streak + '-day streak' : ''), 'Play it again'];
      var w = read('hu-da-wall');
      if (w && w.id === id) return ['<b>In progress</b>', 'Continue'];
      return ['Not played yet', 'Play'];
    },
    huddle: function () {
      var G = read('hd-run:' + id);
      if (!G || G.phase === 'ready') return ['Not played yet', 'Play'];
      if (G.phase === 'play') return ['<b>In progress</b>', 'Continue'];
      var end = G.end === 'crossed' ? 'Crossed in ' + watch(G.t1 - G.t0) : ({ time: 'Out of time', misses: 'Out of misses', blocked: 'No way through' })[G.end] || 'Played';
      return ['<b>' + end + '</b>', 'See your result'];
    }
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-daily]'), function (card) {
    var reader = STATE[card.getAttribute('data-daily')];
    if (!reader) return;
    var n = number(today, card.getAttribute('data-one'));
    if (n >= 1) card.querySelector('[data-num]').textContent = card.getAttribute('data-word') + ' #' + n;
    var st = reader();
    card.querySelector('[data-state]').innerHTML = st[0];
    card.querySelector('[data-go]').textContent = st[1];
  });

  /* the date, and when the next set deals */
  var date = document.getElementById('fnDate'), next = document.getElementById('fnNext');
  try { if (date) date.textContent = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()); } catch (e) {}
  try {
    if (next) {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { var x = parts.filter(function (q) { return q.type === t; })[0]; return x ? +x.value : 0; };
      var left = 24 * 60 - (get('hour') * 60 + get('minute'));
      next.textContent = 'New puzzles in ' + (left >= 60 ? Math.floor(left / 60) + ' h ' : '') + (left % 60) + ' min.';
    }
  } catch (e) {}
})();
