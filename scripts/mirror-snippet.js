/**
 * mirror-snippet.js — the few lines review.js appends to every HTML page it serves.
 *
 * Two browser tabs, one emulating a phone and one a desktop, both pointed at the review
 * server. This joins them on a BroadcastChannel so navigating in either tab moves the other
 * to the same page. Same-origin is what makes it possible at all, and the review server never
 * ships, so the site itself stays clean.
 *
 * It lives in its own file rather than as a string inside review.js because a quoted
 * JavaScript string inside a shell heredoc inside a Python script is three layers of escaping
 * and it got mangled the first time.
 */
module.exports = '\n<script>(function(){try{'
  /* ONLY in a standalone tab. The review screen at /__review loads these same pages into its
     own two frames and drives them itself through its Linked button. Without this guard the
     frames sync through this channel instead, Linked/Unlinked does nothing, and a third browser
     tab can drag the review screen to whatever page it is on. Found by David 2026-09-22:
     "not sure the linked or unlinked is workking correclty to keep them in sytnc". */
  + 'if(window.top!==window.self)return;'
  + 'var ch=new BroadcastChannel("hu-mirror");'
  + 'var me=Math.random().toString(36).slice(2);'
  /* A navigation CAUSED by the other tab must not bounce back, or the two ping-pong forever.
     The suppress flag rides sessionStorage because it has to survive the page load it causes. */
  + 'var sup=sessionStorage.getItem("hu-mirror-sup");'
  + 'sessionStorage.removeItem("hu-mirror-sup");'
  + 'ch.onmessage=function(e){'
  +   'if(!e.data||e.data.from===me)return;'
  +   'if(e.data.path===location.pathname)return;'
  +   'sessionStorage.setItem("hu-mirror-sup",e.data.path);'
  +   'location.replace(e.data.path);'
  + '};'
  + 'if(sup!==location.pathname)ch.postMessage({path:location.pathname,from:me});'
  + '}catch(e){}})();</script>\n';
