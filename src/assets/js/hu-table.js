/* ================================================================
   HU TABLE v1 · the multiplayer table kit (2026-09-20)

   Lifted from the hospital game's "The Table" once a second game
   needed it (the design doc's rule: extract with the second consumer,
   not before). The model is a relay, not a server: the HOST's browser
   holds the real game, applies every action, and broadcasts its packed
   state; GUESTS render that state, own one seat's verbs, and send
   intents. Transport is a plug: Supabase Realtime for the internet
   (with a queue until the channel has joined), BroadcastChannel for
   tabs of one browser, a fake bus in tests.

   A game creates one table and gives it hooks:

     const T = HUTable.create({
       channelPrefix: 'ug-table-',     // one channel per room, per game
       memoKey: 'ug_table',            // localStorage keys <memoKey>_host / _guest
       backend: { url, anonKey },      // the Supabase project, or null for local only
       seats: [{ id, label, desc }],   // the chairs a guest can claim
       verbSeat: { hire: 'clinical', start: 'host', ... },
       name: () => 'the player name',
       envelope: () => ({ save, ui }), // the host's packed state, plus what overlay is up
       onState: env => {},             // a guest received the host's envelope
       onResume: env => {},            // a resumed host restores its own last envelope
       onRoster: () => {},             // the host's roster or seats changed
       lobby: note => {},              // show the guest lobby, optionally with a note
       dispatch: (act, data) => {},    // apply a verb to the game (host or solo)
       hint: msg => {},                // a one-line message to the player
       afterIntent: act => {},         // optional: a guest just sent this verb
     });

   T.NET is the live table state, shared with the page. Records for
   resume and rejoin expire after twelve hours.
================================================================ */
(function (root) {
  'use strict';

  const ROOM_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const FRESH_MS = 12 * 60 * 60 * 1000;
  const escape = v => String(v || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function makeMemo(key) {
    const K = { host: key + '_host', guest: key + '_guest' };
    return {
      keys: K,
      get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
      clear(k) { try { if (localStorage.removeItem) localStorage.removeItem(k); else localStorage.setItem(k, ''); } catch (e) {} },
      fresh(r) { return !!(r && r.room && (Date.now() - (r.at || 0)) < FRESH_MS); },
    };
  }

  /** @param {any} opts */
  function create(opts) {
    const o = Object.assign({ channelPrefix: 'table-', memoKey: 'table', backend: null, seats: [], verbSeat: {}, wire: 'ug' }, opts || {});
    const hook = (n, ...a) => (typeof o[n] === 'function' ? o[n](...a) : undefined);
    const NET = { mode: null, room: '', name: '', seat: null, chan: null, seats: {}, roster: [], lastUiSeq: -1, pendingT: null, want: null, _supa: null };
    const memo = makeMemo(o.memoKey);
    const roomCode = () => Array.from({ length: 4 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join('');
    const seatOf = name => { for (const s in NET.seats) if (NET.seats[s] === name) return s; return null; };
    const seatLabel = id => { const s = o.seats.find(x => x.id === id); return s ? s.label.replace(' &middot; ', ' / ') : id; };

    function defaultChannelFactory(room) {
      const b = o.backend;
      if (b && b.url && b.anonKey && typeof window !== 'undefined' && window.supabase) {
        const client = NET._supa || (NET._supa = window.supabase.createClient(b.url, b.anonKey));
        const ch = client.channel(o.channelPrefix + room, { config: { broadcast: { self: false } } });
        // Nothing is sent until the channel has JOINED. Before that, supabase-js pushes a broadcast
        // over a one-way HTTP fallback: the other side hears us while we cannot hear them yet, and
        // a reply sent into that gap is lost (a resumed host missed a guest's move, 2026-09-20).
        // Queue until SUBSCRIBED; on a failed join, flush anyway so nothing is worse than before.
        let joined = false; const queue = [];
        const push = m => { try { ch.send({ type: 'broadcast', event: o.wire, payload: m }); } catch (e) {} };
        return {
          kind: 'internet',
          send: m => { if (joined) push(m); else queue.push(m); },
          onmsg: fn => { ch.on('broadcast', { event: o.wire }, p => fn(p.payload)); ch.subscribe(st => { if (!joined && (st === 'SUBSCRIBED' || st === 'CHANNEL_ERROR' || st === 'TIMED_OUT')) { joined = true; queue.splice(0).forEach(push); } }); },
          close: () => { try { client.removeChannel(ch); } catch (e) {} },
        };
      }
      if (typeof BroadcastChannel === 'undefined') return null;
      const bc = new BroadcastChannel(o.channelPrefix + room);
      return { kind: 'local', send: m => { try { bc.postMessage(m); } catch (e) {} }, onmsg: fn => { bc.onmessage = e => fn(e.data); }, close: () => bc.close() };
    }
    let channelFactory = defaultChannelFactory;

    // ── the envelope: everything a guest needs, debounced to one send per microtask ──
    let txQueued = false;
    function envelope() {
      const e = hook('envelope') || {};
      return { save: e.save === undefined ? null : e.save, ui: e.ui || { kind: 'none', seq: 0 }, seats: Object.assign({}, NET.seats), roster: NET.roster.slice() };
    }
    function broadcast() {
      if (NET.mode !== 'host' || !NET.chan || txQueued) return;
      txQueued = true;
      Promise.resolve().then(() => {
        txQueued = false;
        if (NET.mode !== 'host' || !NET.chan) return;
        const env = envelope();
        NET.chan.send({ t: 'state', env });
        memo.set(memo.keys.host, { room: NET.room, env, at: Date.now() });   // every broadcast is the host's resume point
      });
    }

    // ── seats ──
    function applyClaim(name, seat) {
      if (seat !== 'none' && NET.seats[seat] && NET.seats[seat] !== name) return;   // taken
      for (const s in NET.seats) if (NET.seats[s] === name) delete NET.seats[s];   // one seat per person
      if (seat !== 'none' && o.seats.some(x => x.id === seat)) NET.seats[seat] = name;
      if (name === NET.name) NET.seat = seatOf(name);
      broadcast();
      if (NET.mode === 'host') hook('onRoster');
    }
    function claim(seat) {
      if (NET.mode === 'guest') { NET.want = seat; NET.chan.send({ t: 'claim', name: NET.name, seat }); return; }
      if (NET.mode === 'host') applyClaim(NET.name, seat);
    }

    // ── the wire ──
    function onMessage(m) {
      if (!m || !m.t) return;
      if (NET.mode === 'host') {
        if (m.t === 'hello') { if (NET.roster.indexOf(m.name) < 0) NET.roster.push(m.name); broadcast(); hook('onRoster'); }
        else if (m.t === 'claim') applyClaim(m.name, m.seat);
        else if (m.t === 'bye') { NET.roster = NET.roster.filter(n => n !== m.name); for (const s in NET.seats) if (NET.seats[s] === m.name) delete NET.seats[s]; broadcast(); hook('onRoster'); }
        else if (m.t === 'intent') {
          const need = o.verbSeat[m.act];
          if (!need || need === 'host') return;              // not a seat verb: refused quietly
          if (NET.seats[need] !== m.name) return;            // seat not theirs: refused
          hook('dispatch', m.act, m.data || {}, m.name);     // the sender's name: a game with one wall per player needs it
          broadcast();
        }
        return;
      }
      if (NET.mode === 'guest' && m.t === 'state' && m.env) {
        if (NET.pendingT) { clearTimeout(NET.pendingT); NET.pendingT = null; }
        NET.seats = m.env.seats || {}; NET.roster = m.env.roster || []; NET.seat = seatOf(NET.name);
        // a claim sent into the host's join window is gone; ask again while the chair is still open
        if (NET.want && NET.want !== 'none' && !NET.seat && !NET.seats[NET.want] && NET.roster.indexOf(NET.name) >= 0) NET.chan.send({ t: 'claim', name: NET.name, seat: NET.want });
        hook('onState', m.env);
      }
    }

    // ── hosting, joining, leaving ──
    function host(codeArg) {
      if (NET.mode) leave();
      const code = (codeArg && String(codeArg).trim().toUpperCase()) || roomCode();
      const chan = channelFactory(code);
      if (!chan) { hook('hint', 'This browser cannot open a table.'); return false; }
      NET.mode = 'host'; NET.room = code; NET.chan = chan; NET.name = hook('name') || 'Host'; NET.seat = null; NET.seats = {}; NET.roster = [NET.name]; NET.lastUiSeq = -1;
      NET.chan.onmsg(onMessage);
      hook('onRoster');
      return true;
    }
    function join(code, name) {
      if (NET.mode) leave();
      code = String(code || '').trim().toUpperCase();
      if (code.length < 3) return false;
      const chan = channelFactory(code);
      if (!chan) return false;
      NET.mode = 'guest'; NET.room = code; NET.chan = chan; NET.name = name || hook('name') || 'Guest'; NET.seat = null; NET.seats = {}; NET.roster = []; NET.want = null; NET.lastUiSeq = -1;
      memo.set(memo.keys.guest, { room: code, name: NET.name, at: Date.now() });
      NET.chan.onmsg(onMessage);
      let tries = 0;                                          // knock until the host answers with a state
      const hello = () => {
        if (NET.mode !== 'guest' || NET.roster.indexOf(NET.name) >= 0) return;   // heard: the host's roster names us, not merely any state
        if (tries++ > 20) { if (NET.lastUiSeq < 0) hook('lobby', 'Nobody answered at that code. If the host&rsquo;s screen reloaded, ask them to hit Resume on their start menu, then leave this table and tap Rejoin.'); return; }
        NET.chan.send({ t: 'hello', name: NET.name }); setTimeout(hello, 700);
      };
      hello();
      hook('lobby', 'Knocking on the door&hellip;');
      return true;
    }
    function leave() {
      if (NET.mode === 'host') memo.clear(memo.keys.host);
      else if (NET.mode === 'guest' && NET.lastUiSeq >= 0) memo.clear(memo.keys.guest);   // leaving a LIVE table forgets it; a dead one stays rejoinable
      if (NET.chan) { try { NET.chan.send({ t: 'bye', name: NET.name }); NET.chan.close(); } catch (e) {} }
      if (NET.pendingT) { clearTimeout(NET.pendingT); NET.pendingT = null; }
      NET.mode = null; NET.room = ''; NET.seat = null; NET.chan = null; NET.seats = {}; NET.roster = []; NET.want = null; NET.lastUiSeq = -1;
    }

    // ── resume and rejoin after a reload ──
    function offers() {
      if (NET.mode) return { host: null, guest: null };
      const h = memo.get(memo.keys.host), g = memo.get(memo.keys.guest);
      return {
        host: memo.fresh(h) ? { room: h.room, hasSave: !!(h.env && h.env.save) } : null,
        guest: memo.fresh(g) ? { room: g.room, name: g.name } : null,
      };
    }
    function resume() {
      const m = memo.get(memo.keys.host);
      if (!memo.fresh(m)) { hook('hint', 'No table to resume.'); return false; }
      if (!host(m.room) || NET.mode !== 'host') return false;
      const env = m.env || {};
      NET.seats = Object.assign({}, env.seats || {}); NET.roster = (env.roster || []).slice();
      if (NET.roster.indexOf(NET.name) < 0) NET.roster.unshift(NET.name);
      NET.seat = seatOf(NET.name);
      hook('onResume', env);
      broadcast();
      setTimeout(() => { if (NET.mode === 'host' && NET.room === m.room) broadcast(); }, 1500);   // once the channel has surely joined
      return true;
    }
    function rejoin() {
      const m = memo.get(memo.keys.guest);
      if (!memo.fresh(m)) { hook('hint', 'No table to rejoin.'); return false; }
      return join(m.room, m.name);
    }

    // ── routing a verb: solo plays it, the host plays it and broadcasts, a guest sends an intent ──
    function act(verb, data) {
      if (NET.mode === 'guest') {
        const need = o.verbSeat[verb];
        if (!need) { hook('dispatch', verb, data); return; }
        if (need === 'host') { hook('hint', 'The host runs that. Say it out loud instead.'); return; }
        if (NET.seat !== need) { hook('hint', 'That is the ' + seatLabel(need) + ' seat. Make the case to whoever holds it.'); return; }
        NET.chan.send({ t: 'intent', name: NET.name, act: verb, data: data || {} });
        // every applied intent comes back as a state; if none does, the host did not hear it (a
        // resumed host still joining, a dropped socket), and silence would look like a dead button
        clearTimeout(NET.pendingT);
        NET.pendingT = setTimeout(() => { NET.pendingT = null; if (NET.mode === 'guest') hook('hint', 'The host did not hear that. Try it again.'); }, 2500);
        hook('afterIntent', verb);
        return;
      }
      hook('dispatch', verb, data);
      broadcast();
    }

    return {
      NET, memo, escape, seatOf, roomCode,
      host, join, leave, claim, act, broadcast, onMessage, envelope, offers, resume, rejoin,
      setChannelFactory(fn) { channelFactory = fn || defaultChannelFactory; },
    };
  }

  root.HUTable = { create, escape };
})(typeof window !== 'undefined' ? window : globalThis);
