/* ================================================================
   HU RNG v1 — a seeded random generator for the games (2026-09-20)

   Math.random cannot be replayed, saved, or pinned without monkey-
   patching. A game engine draws from one of these instead: the seed and
   the position ride the save, so a run replays from its string, a test
   pins a seed instead of patching Math.random, and two screens fed the
   same seed and the same verbs roll the same dice.

   mulberry32: 32-bit state, one multiply-xorshift step per draw, good
   enough for game events and far better than nothing. Not for security.

   HURng.make(seed)      -> a generator; seed is any integer or string
     rng()               -> float in [0, 1), like Math.random
     rng.int(a, b)       -> integer in [a, b] inclusive
     rng.pick(list)      -> one element
     rng.chance(p)       -> true with probability p
     rng.state()         -> { seed, n } to save
     rng.restore(state)  -> back to exactly that draw
   HURng.seedFrom(str)   -> a 32-bit integer from any string (FNV-1a)
   HURng.freshSeed()     -> a random 32-bit seed for a new run
================================================================ */
(function (root) {
  'use strict';

  /** @param {string} str */
  function seedFrom(str) {
    let h = 0x811c9dc5;
    const s = String(str);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }

  function freshSeed() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] >>> 0;
    }
    return (Math.random() * 0x100000000) >>> 0;
  }

  /** @param {number|string} seed */
  function make(seed) {
    let seed32 = typeof seed === 'number' ? (seed >>> 0) : seedFrom(seed);
    let a = seed32, n = 0;
    function next() {
      n++;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const rng = /** @type {any} */ (function () { return next(); });
    rng.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    rng.pick = list => list[Math.floor(next() * list.length)];
    rng.chance = p => next() < p;
    rng.state = () => ({ seed: seed32, n });
    rng.restore = st => {
      if (!st || typeof st.seed !== 'number') throw new Error('HURng.restore: bad state');
      seed32 = st.seed >>> 0; rng.seed = seed32;   // the restored generator reports the seed it now runs on
      a = seed32; n = 0;
      const target = Math.max(0, st.n | 0);
      while (n < target) next();
      return rng;
    };
    rng.seed = seed32;
    return rng;
  }

  root.HURng = { make, seedFrom, freshSeed };
})(typeof window !== 'undefined' ? window : globalThis);
