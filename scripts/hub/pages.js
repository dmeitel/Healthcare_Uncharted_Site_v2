'use strict';
/**
 * pages.js · the hub's five screens, drawn on the server from what is true right now.
 *
 *   /__hub           the board: focus, up next, waiting on David, inbox
 *   /__hub/run       the run sheet: the milestone's stage, this window's steps and pictures, the history
 *   /__hub/qa        the QA list for the card in focus
 *   /__hub/site      every live page as a block
 *   /__hub/library   every tool as a block, and what each stage of the process means
 *
 * Nothing here is part of the site. The pages borrow the site's tokens and tool bar (hu-global.css,
 * served from src/assets by scripts/review.js) so the hub looks like home, and add scripts/hub/hub.css.
 * Every word that came from a file or from David's typing goes through esc() on its way out.
 */
const lucide = require('lucide');
const kit = require('./kit');
const boardLib = require('./board');
const qaLib = require('./qa');
const runLib = require('./run');
const devlog = require('./devlog');
const { git, daysAgo, ago } = require('../lib/session');

require('../../src/assets/js/hu-qr.js');   // an IIFE that hangs HUQR on the global object
const HUQR = /** @type {any} */ (globalThis).HUQR;

/** @param {any} s */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (/** @type {Record<string,string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
/** A step's words: escaped, then **bold** and `code` allowed back in. @param {any} s */
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
/** @type {(n:number, one:string, many?:string) => string} */
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many || one + 's');

/** A Lucide icon, straight from the package the site's own subset is cut from. @param {string} name */
function icon(name) {
  const key = name.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
  const data = /** @type {any} */ (lucide)[key];
  if (!data) return '';
  const kids = data[2].map((/** @type {[string, Record<string,string>]} */ [tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')}/>`).join('');
  return `<svg class="hub-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${kids}</svg>`;
}

const TABS = [
  { id: 'board', label: 'Board', href: '/__hub' },
  { id: 'run', label: 'Run sheet', href: '/__hub/run' },
  { id: 'qa', label: 'QA', href: '/__hub/qa' },
  { id: 'puzzles', label: 'Puzzles', href: '/__hub/puzzles' },
  { id: 'ideas', label: 'Ideas', href: '/__hub/ideas' },
  { id: 'site', label: 'Site', href: '/__hub/site' },
  { id: 'library', label: 'Library', href: '/__hub/library' },
];
const LINKS = [
  { label: 'Review', href: '/__review' },
  { label: 'Data map', href: '/secret-menu/data-observatory/' },
  { label: 'Traffic', href: '/secret-menu/data-observatory/traffic/' },
  { label: 'The site', href: '/' },
];

/** The shell every hub screen shares. @param {{title:string, tab:string, body:string, kitJs?:boolean}} p */
function layout(p) {
  const tabs = TABS.map((t) => `<a class="toggle-chip${t.id === p.tab ? ' on' : ''}" href="${t.href}"${t.id === p.tab ? ' aria-current="page"' : ''}>${t.label}</a>`).join('');
  const links = LINKS.map((l) => `<a class="toggle-chip hub-out" href="${l.href}">${l.label}</a>`).join('');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(p.title)} · HU hub</title>
<link rel="icon" href="/brand/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/hu-global.css">
<link rel="stylesheet" href="/brand/web/brand.css">
<link rel="stylesheet" href="/__hub/hub.css">
<script>
(function(){var s=null;try{s=localStorage.getItem('hu-theme')}catch(e){}
var mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: light)'):null;
document.documentElement.setAttribute('data-theme',s==='light'||s==='dark'?s:(mq&&mq.matches?'light':'dark'));})();
</script>
</head>
<body class="hub">
<header class="tool-bar hub-bar">
  <a class="tb-brand" href="/__hub" aria-label="The hub, home">
    <img src="/brand/hu-mark-dark.svg" alt="" class="hu-logo-ondark">
    <img src="/brand/hu-mark.svg" alt="" class="hu-logo-onlight">
  </a>
  <a class="tool-bar-title obs-home" href="/__hub">HU <span>hub</span></a>
  <nav class="obs-tabs hub-tabs" aria-label="The hub">${tabs}<span class="hub-sep" aria-hidden="true"></span>${links}</nav>
  <span class="tool-bar-spacer"></span>
  <button class="icon-btn" id="hubTheme" type="button" aria-label="Switch between light and dark">${icon('sun-moon')}</button>
</header>
<main class="obs-hub" id="main">
${p.body}
</main>
${p.kitJs ? '<script src="/assets/js/hu-kit.js"></script>' : ''}
<script src="/__hub/client.js"></script>
</body>
</html>
`;
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

/** @param {import('./board').Step} s */
function stepRow(s) {
  const label = { done: 'Done', doing: 'Doing', next: 'Next', waiting: 'Waiting' }[/** @type {'done'} */ (s.status)] || s.status;
  const tail = s.status === 'waiting' ? ' on ' + esc(s.on || 'David') : s.status === 'done' && s.at ? ' ' + esc(s.at) : '';
  return `<li class="is-${esc(s.status)}">
    <span class="n">${s.n}</span>
    <span class="x">${md(s.text)}<span class="w">${esc(s.who)}${s.done ? ' · done when: ' + esc(s.done) : ''}</span></span>
    <span class="hub-st is-${esc(s.status)}">${label}${tail}</span>
  </li>`;
}

/** @param {string} [stage] */
function track(stage) {
  const at = boardLib.STAGES.indexOf(stage || '');
  return `<ol class="hub-track" aria-label="Stage">${boardLib.STAGES.map((s, i) => `<li class="${i < at ? 'is-done' : i === at ? 'is-now' : ''}"${i === at ? ' aria-current="step"' : ''}>${i < at ? icon('check') : ''}${s}${i < at ? '<span class="obs-sr">, done</span>' : ''}</li>`).join('')}</ol>`;
}

/** @param {{total:number,todo:number,good:number,tweak:number,recheck:number}} c */
function qaLine(c) {
  return `${plural(c.todo, 'to look at', 'to look at')}, ${c.good} good, ${c.tweak} with Claude, ${c.recheck} back for another look`;
}

/* ── the board ──────────────────────────────────────────────────────────── */

/** @param {{port:number, lan:string[], screens:{name:string, up:boolean, where:string, how:string}[]}} ctx */
function board(ctx) {
  const b = boardLib.load();
  const bad = boardLib.problems(b);
  const lane = (/** @type {string} */ l) => b.cards.filter((c) => c.lane === l);
  const focus = lane('focus'), next = lane('next'), inbox = lane('inbox'), done = lane('done');
  const wait = boardLib.waiting(b);
  const decisions = boardLib.decisions();
  const questions = decisions.filter((d) => d.id !== 'to do');
  const todos = decisions.filter((d) => d.id === 'to do');

  const focusHtml = focus.map((c) => {
    const list = qaLib.items(c);
    const q = qaLib.counts(list);
    const inQa = c.stage === 'QA' || c.stage === 'Tweaks';
    const playtest = c.stage === 'Plan' && (c.qa || []).length > 0;
    return `<section class="hub-focus" aria-labelledby="f-${esc(c.id)}">
  <div class="hub-focus-head">
    <div>
      <p class="obs-lab">Focus${c.role ? ' · ' + esc(c.role) : ''}</p>
      <h2 id="f-${esc(c.id)}">${esc(c.title)}</h2>
      ${c.goal ? `<p class="goal">${esc(c.goal)}</p>` : ''}
    </div>
    ${track(c.stage)}
  </div>
  ${c.done ? `<p class="hub-done"><b>Done looks like:</b> ${esc(c.done)}</p>` : ''}
  ${c.plan ? `<p class="hub-done"><a href="/__hub/plan?card=${esc(c.id)}">Read the plan</a> <span class="w">${esc(c.plan)}</span></p>` : ''}
  ${inQa || playtest ? `<p class="hub-done"><a href="/__hub/qa?card=${esc(c.id)}">${playtest ? 'The playtest list' : 'The QA list'}</a>: ${qaLine(q)}.</p>` : ''}
  <ol class="hub-steps">${(c.steps || []).map(stepRow).join('')}</ol>
</section>`;
  }).join('\n');

  const nextHtml = next.map((c) => {
    const open = (c.steps || []).filter((s) => s.status !== 'done').length;
    return `<article class="hub-card">
  ${c.role ? `<span class="hub-badge is-${esc(c.role)}">${esc(c.role)}</span>` : ''}
  <h3>${esc(c.title)}</h3>
  ${c.says ? `<p>${esc(c.says)}</p>` : ''}${c.goal ? `<p>${esc(c.goal)}</p>` : ''}
  ${c.steps && c.steps.length ? `<details><summary>${plural(open, 'open step')}</summary><ol class="hub-steps">${c.steps.map(stepRow).join('')}</ol></details>` : ''}
</article>`;
  }).join('\n');

  const waitHtml = wait.length ? `<ul class="hub-wait">${wait.map((w) => `<li><span class="n">${w.n}</span><span class="x">${md(w.text)}${w.card ? `<span class="w">${esc(w.card)}</span>` : ''}</span></li>`).join('')}</ul>` : '<p class="hub-empty">Nothing. The next move is Claude\'s.</p>';
  const decHtml = questions.length ? `<p class="obs-lab hub-gap">Decisions · the top three</p>
<ul class="hub-wait">${questions.slice(0, 3).map((d) => `<li><span class="n">${esc(d.id)}</span><span class="x">${esc(d.text)}</span></li>`).join('')}</ul>
${questions.length > 3 ? `<p class="hub-more">${questions.length - 3} more wait their turn, in DECISIONS.md.</p>` : ''}` : '';
  const todoHtml = todos.length ? `<p class="obs-lab hub-gap">Yours to do, no decision needed</p>
<ul class="hub-wait">${todos.map((d) => `<li><span class="n">${icon('circle')}</span><span class="x">${esc(d.text)}</span></li>`).join('')}</ul>` : '';

  const inboxHtml = `<ul class="hub-inbox">${inbox.map((c) => `<li class="hub-inbox-item">
  <b>${esc(c.title)}</b>
  ${c.line ? `<p>${esc(c.line)}</p>` : ''}
  <div class="hub-row"><span class="w">${c.added ? 'added ' + esc(c.added) : ''}</span><button class="hub-btn" type="button" data-promote="${esc(c.id)}">Promote to Up next</button></div>
</li>`).join('')}</ul>
<form class="hub-form" id="hubInbox">
  <label class="obs-lab" for="hubIdea">A new idea</label>
  <input class="hub-input" id="hubIdea" name="title" maxlength="80" placeholder="Leaderboard for the daily wall" autocomplete="off">
  <label class="obs-sr" for="hubIdeaLine">One line about it</label>
  <input class="hub-input" id="hubIdeaLine" name="line" maxlength="240" placeholder="One line about it" autocomplete="off">
  <div class="hub-row"><span class="hub-err" role="alert"></span><button class="hub-btn hub-btn--go" type="submit">Add to Inbox</button></div>
</form>`;

  const addr = ctx.lan[0] ? `http://${ctx.lan[0]}:${ctx.port}/__hub` : '';
  const screens = `<h2 class="obs-h2" id="screens">Screens</h2>
<div class="obs-cards">
  <section class="obs-card" aria-labelledby="sc-list">
    <p class="obs-lab" id="sc-list">What is running</p>
    <ul class="hub-screens">${ctx.screens.map((s) => `<li>${icon(s.up ? 'circle-check' : 'circle')}<span><b>${esc(s.name)}</b> ${s.up ? esc(s.where) : 'not running. ' + esc(s.how)}</span></li>`).join('')}</ul>
  </section>
  <section class="obs-card" aria-labelledby="sc-phone">
    <p class="obs-lab" id="sc-phone">On your phone, on home wifi</p>
    ${addr ? `<div class="hub-phone"><div class="hub-qr">${HUQR.svg(addr, { label: 'QR code for the hub on your phone' })}</div><p><code>${esc(addr)}</code></p></div>
    <p>Point the camera at the code. If the page does not load, Windows Firewall is the usual reason.</p>` : '<p>No home network address found on this computer.</p>'}
  </section>
</div>`;

  const body = `<div class="obs-head">
  <h1>The board</h1>
  <p>What is in focus, what is next, and what is waiting on you. Anything new goes to the Inbox and stays there until you promote it.</p>
</div>
${bad.length ? `<p class="hub-alert" role="alert">The board breaks a rule: ${esc(bad.join('; '))}</p>` : ''}
<div class="hub-top">${focusHtml || '<p class="hub-empty">Nothing is in focus. Promote a card and agree its plan.</p>'}</div>
<div class="hub-lanes">
  <section class="hub-lane" aria-labelledby="l-next"><h2 class="obs-lab" id="l-next">Up next · ${next.length}</h2>${nextHtml || '<p class="hub-empty">Nothing queued.</p>'}</section>
  <section class="hub-lane" aria-labelledby="l-wait"><h2 class="obs-lab" id="l-wait">Waiting on you · ${wait.length}</h2><div class="hub-card">${waitHtml}${decHtml}${todoHtml}</div></section>
  <section class="hub-lane" aria-labelledby="inbox"><h2 class="obs-lab" id="inbox">Inbox · ${inbox.length}</h2>${inboxHtml}</section>
</div>
${done.length ? `<h2 class="obs-h2">Done since the last push <small>${done.length}</small></h2><ul class="hub-wait">${done.map((c) => `<li><span class="n">${icon('check')}</span><span class="x"><strong>${esc(c.title)}</strong>${c.finished ? ' ' + esc(c.finished) : ''}</span></li>`).join('')}</ul>` : ''}
${screens}`;
  return layout({ title: 'The board', tab: 'board', body });
}

/* ── the run sheet ──────────────────────────────────────────────────────── */

/** @param {import('./run').Check[]} list @param {string} empty */
function checks(list, empty) {
  if (!list || !list.length) return `<p class="hub-empty">${empty}</p>`;
  return `<ul class="hub-checks">${list.map((c) => `<li class="${c.ok === true ? 'is-ok' : c.ok === false ? 'is-bad' : ''}">
  <span class="hub-mark">${icon(c.ok === true ? 'circle-check' : c.ok === false ? 'circle-x' : 'circle')}<span class="obs-sr">${c.ok === true ? 'passed' : c.ok === false ? 'failed' : 'noted'}</span></span>
  <span><b>${esc(c.label)}</b><span class="s">${esc(c.summary)}</span></span>
</li>`).join('')}</ul>`;
}

/** @param {Record<string, string>[]} [shots] */
function thumbs(shots) {
  if (!shots || !shots.length) return '';
  const one = (/** @type {string} */ src, /** @type {string} */ what, /** @type {string} */ page) => src ? `<a href="${esc(src)}"><img src="${esc(src)}" alt="${esc(page)}, ${(/** @type {Record<string,string>} */ (qaLib.SIZE_NAME))[what]}" loading="lazy" class="is-${what}"></a>` : '';
  return `<div class="hub-shots">${shots.map((s) => qaLib.SIZES.map((z) => one(s[z] || '', z, s.page)).join('')).join('')}</div>`;
}

function run() {
  const b = boardLib.load();
  const focus = b.cards.filter((c) => c.lane === 'focus');
  const state = runLib.read();
  const w = state.window;
  const notes = devlog.sessions();
  const commits = devlog.commits();
  const ahead = Number(git(['rev-list', '--count', 'origin/main..HEAD']) || 0);
  const dirty = git(['status', '--porcelain']).split('\n').filter(Boolean).length;

  /** @param {import('./board').Card} card */
  const milestone = (card) => {
    const at = boardLib.STAGES.indexOf(card.stage || '');
    const steps = card.steps || [];
    const q = qaLib.counts(qaLib.items(card));
    const build = steps.filter((s) => /^Claude/.test(s.who));
    const since = notes.filter((n) => n.date >= (card.added || '')).length;
    const g = state.gate;
    /** @type {Record<string, string[]>} */
    const facts = {
      Plan: [card.plan ? 'The plan: ' + card.plan : '', at === 0 && (card.qa || []).length ? `Playtest: ${q.good + q.tweak} of ${q.total} marked` : '', at > 0 ? 'Agreed' : 'Not agreed yet'],
      Build: [`${build.filter((s) => s.status === 'done').length} of ${build.length} build steps done`, plural(since, 'close note') + ' since it was added'],
      QA: [g ? `Machine gate ${g.ok ? 'passed' : 'FAILED'} ${g.at}, ${g.minutes} min` : 'Machine gate: not run yet', `Your list: ${q.good} of ${q.total} good`],
      Tweaks: [`${q.tweak} with Claude`, `${q.recheck} back for another look`],
      Ship: [ahead ? plural(ahead, 'commit') + ' saved, not pushed' : 'Nothing saved and unpushed', dirty ? plural(dirty, 'file') + ' not committed' : 'Nothing uncommitted'],
    };
    return `<h3 class="hub-ms">${esc(card.title)}${card.role ? ` <span class="hub-badge is-${esc(card.role)}">${esc(card.role)}</span>` : ''}</h3>
<ol class="hub-stages">${kit.milestone.map((m, i) => `<li class="hub-stage${i < at ? ' is-done' : i === at ? ' is-now' : ''}"${i === at ? ' aria-current="step"' : ''}>
  <h3>${i < at ? icon('check') : ''}${m.id}${i === at ? '<span class="hub-here">here</span>' : ''}</h3>
  <p class="who">${m.david ? 'Your part' : 'Runs without you'}</p>
  <p>${esc(m.text)}</p>
  <ul class="facts">${facts[m.id].filter(Boolean).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
</li>`).join('')}</ol>`;
  };
  const stages = focus.length ? focus.map(milestone).join('\n') : '<p class="hub-empty">Nothing is in focus, so there is no milestone to draw.</p>';

  const win = w ? `<ol class="obs-loop">
  <li class="obs-stage obs-stage--open"><h3>Open <small>${esc(w.opened.slice(11))}</small></h3>${checks(w.open, 'The full open has not run in this window.')}</li>
  <li class="obs-stage obs-stage--work"><h3>Work <small>${plural(w.work.length, 'step')}</small></h3>${w.work.length ? `<ul class="hub-checks">${w.work.map((e) => `<li class="${e.ok === false ? 'is-bad' : 'is-ok'}">
    <span class="hub-mark">${icon(e.ok === false ? 'circle-x' : 'circle-check')}</span>
    <span><b>${esc(e.label)}</b><span class="s">${esc(e.at.slice(11))}${e.summary ? ' · ' + esc(e.summary) : ''}</span>${thumbs(e.shots)}</span>
  </li>`).join('')}</ul>` : '<p class="hub-empty">No steps filed yet.</p>'}</li>
  <li class="obs-stage obs-stage--close"><h3>Close <small>${w.closed ? esc(w.closed.slice(11)) : 'not yet'}</small></h3>${checks(w.close, 'The close has not run in this window.')}</li>
</ol>` : '<p class="hub-empty">No window on record on this computer yet. The next full open starts one.</p>';

  const push = (/** @type {any} */ c) => `<li><time datetime="${esc(c.date)}">${esc(c.date)}</time><span class="h">${esc(c.hash)}</span><span class="t">${esc(c.title)}</span>${c.seen.length ? `<span class="a">${c.seen.map((/** @type {string} */ a) => `<span class="obs-pill">${esc(a)}</span>`).join('')}</span>` : ''}</li>`;
  const history = `<h2 class="obs-h2" id="windows">Windows <small>${plural(notes.length, 'close note')} · ${plural(commits.length, 'push', 'pushes')}</small></h2>
<div class="obs-cards hub-notes">${notes.slice(0, 6).map((n) => `<section class="obs-card">
  <p class="obs-lab">${esc(n.id)}${n.pushed ? ' · pushed ' + esc(n.pushed) : ' · not pushed'}</p>
  <p><strong>${esc(n.title)}</strong></p>
  ${n.did.length ? `<ul>${n.did.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
</section>`).join('')}</div>
<ul class="obs-pushes">${commits.slice(0, 8).map(push).join('')}</ul>
${commits.length > 8 ? `<details class="obs-more"><summary>${commits.length - 8} earlier pushes</summary><ul class="obs-pushes">${commits.slice(8).map(push).join('')}</ul></details>` : ''}`;

  const body = `<div class="obs-head">
  <h1>Run sheet</h1>
  <p>The process, filling itself in. At the top, each milestone in focus and the stage it is at. Under them is the window that is open: what each step found, and the pictures filed along the way.</p>
</div>
<h2 class="obs-h2" id="milestone">In focus <small>${plural(focus.length, 'milestone')}</small></h2>
${stages}
<h2 class="obs-h2" id="window">This window${w ? ` <small>${esc(w.id)} · opened ${esc(w.opened)}${w.closed ? ' · closed ' + esc(w.closed.slice(11)) : ''}</small>` : ''}</h2>
${win}
${history}`;
  return layout({ title: 'Run sheet', tab: 'run', body });
}

/* ── the QA list ────────────────────────────────────────────────────────── */

/** @param {any} it @param {string} cardId */
function qaItem(it, cardId) {
  const p = it.pictures;
  const fig = (/** @type {string} */ src, /** @type {string} */ cap, /** @type {string} */ what) => src ? `<figure><a href="${esc(src)}"><img src="${esc(src)}" alt="${esc(it.text)}, ${cap}" loading="lazy" class="is-${what}"></a><figcaption>${cap}</figcaption></figure>` : '';
  const name = (/** @type {string} */ z) => (/** @type {Record<string,string>} */ (qaLib.SIZE_NAME))[z];
  const pics = qaLib.SIZES.map((z) => fig(p.before[z], 'before, ' + name(z), z) + fig(p.after[z], 'now, ' + name(z), z)).join('');
  const how = it.how ? `<p class="hub-try"><b>Try:</b> ${md(it.how)}</p>` : '';
  const look = it.look ? `<p class="hub-try"><b>Look for:</b> ${md(it.look)}</p>` : '';
  const said = it.note && (it.state === 'tweak' || it.state === 'recheck') ? `<p class="hub-said"><b>You said:</b> ${esc(it.note)}</p>` : '';
  const fix = it.state === 'recheck' && it.fix ? `<p class="hub-fix"><b>What changed:</b> ${esc(it.fix)}</p>` : '';
  const tid = 'n-' + qaLib.slug(it.id);
  return `<li class="hub-qa-item" data-state="${esc(it.state)}" data-item="${esc(it.id)}" data-card="${esc(cardId)}">
  <div class="hub-qa-top"><h3>${esc(it.text)}</h3><span class="obs-pill">${esc(it.group || (it.kind === 'page' ? 'a page that changed' : 'a check'))}</span></div>
  ${how}${look}
  ${it.link ? `<a class="go" href="${esc(it.link)}"${/^\/__hub/.test(it.link) ? '' : ' target="_blank" rel="noopener"'}>Open it ${icon('arrow-right')}</a>` : ''}
  ${said}${fix}
  ${pics ? `<div class="hub-pair">${pics}</div>` : ''}
  <div class="hub-actions">
    <button class="hub-btn hub-pick is-good" type="button" data-mark="good" aria-pressed="${it.state === 'good'}">${icon('check')}Good</button>
    <button class="hub-btn hub-pick is-tweak" type="button" data-mark="tweak" aria-pressed="${it.state === 'tweak'}">${icon('pencil')}Needs a tweak</button>
    <span class="w">${it.at ? esc(it.stale ? 'Changed since your Good of ' : it.state === 'good' ? 'Marked good ' : it.state === 'tweak' ? 'Sent to Claude ' : 'Back to you ') + esc(it.at) : ''}</span>
  </div>
  <div class="hub-tweak" hidden>
    <label class="obs-lab" for="${tid}">What should change?</label>
    <textarea class="hub-input" id="${tid}" rows="3" maxlength="2000">${it.state === 'tweak' ? esc(it.note) : ''}</textarea>
    <div class="hub-row"><span class="hub-err" role="alert"></span><button class="hub-btn hub-btn--go" type="button" data-send>Send to Claude</button></div>
  </div>
</li>`;
}

/* a good item, folded to one line; it opens to the whole item, so the mark can still change */
const goodRow = (/** @type {string} */ title, /** @type {string} */ group, /** @type {string} */ at, /** @type {string} */ full) =>
  `<li class="hub-good-row"><details><summary>${icon('check')}<span class="t">${esc(title)}</span>${group ? `<span class="obs-pill">${esc(group)}</span>` : ''}<span class="w">${esc(at)}</span></summary><ul class="hub-qa">${full}</ul></details></li>`;
const groupOf = (/** @type {any} */ i) => i.group || (i.kind === 'page' ? 'A page that changed' : 'A check');
const groupSlug = (/** @type {string} */ g) => g.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** @param {string} [pick] a card id from ?card= @param {string} [folder] a group slug from ?group= */
function qa(pick, folder) {
  const b = boardLib.load();
  const card = (pick && b.cards.find((c) => c.id === pick)) || qaLib.defaultCard(b);
  if (!card) return layout({ title: 'QA', tab: 'qa', body: '<div class="obs-head"><h1>QA list</h1><p>Nothing is in focus, so there is nothing to check yet.</p></div>' });
  const list = qaLib.items(card);
  const c = qaLib.counts(list);
  const g = runLib.read().gate;
  const playtest = card.stage === 'Plan' && (card.qa || []).length > 0;
  const building = card.stage === 'Build' || (card.stage === 'Plan' && !playtest);
  // with two cards in focus, each list is one tap away; so is a finished card's list the same push carries
  const rides = (/** @type {any} */ x) => x.lane === 'focus' || (x.lane === 'next' && ['QA', 'Tweaks', 'Ship'].includes(x.stage) && (x === card || !qaLib.counts(qaLib.items(x)).clear));
  const lists = b.cards.filter((x) => rides(x) && ((x.qa || []).length || x.qaPages !== false));
  const switcher = lists.length > 1 ? `<nav class="hub-switch" aria-label="Which list">${lists.map((x) => {
    const n = qaLib.counts(qaLib.items(x));
    return `<a class="toggle-chip${x.id === card.id ? ' on' : ''}" href="/__hub/qa?card=${esc(x.id)}"${x.id === card.id ? ' aria-current="page"' : ''}>${esc(x.title)} · ${n.clear ? 'clear' : n.todo + n.recheck + ' to look at'}</a>`;
  }).join('')}</nav>` : '';
  /* the folders: one chip per group of the list, with what is left to look at in each; a chip shows that group alone */
  const folders = [...new Set(list.map(groupOf))];
  const shown = folder ? list.filter((i) => groupSlug(groupOf(i)) === folder) : list;
  const left = (/** @type {any[]} */ its) => its.filter((i) => i.state === 'todo' || i.state === 'recheck').length;
  const chip = (/** @type {string} */ label, /** @type {string} */ slug, /** @type {any[]} */ its) => {
    const on = (folder || '') === slug, n = left(its);
    return `<a class="toggle-chip${on ? ' on' : ''}" href="/__hub/qa?card=${esc(card.id)}${slug ? '&group=' + esc(slug) : ''}"${on ? ' aria-current="page"' : ''}>${esc(label)} · ${n ? n + ' left' : 'done'}</a>`;
  };
  const todoHere = shown.filter((i) => i.state === 'todo').length;
  const folderRow = (folders.length > 1 ? `<nav class="hub-switch hub-folders" aria-label="Folders">${chip('All', '', list)}${folders.map((g) => chip(g, groupSlug(g), list.filter((i) => groupOf(i) === g))).join('')}</nav>` : '')
    + (todoHere > 1 ? `<p class="hub-markall-row"><button class="hub-btn hub-markall" type="button" data-mark-all>${icon('check-check')}Mark the ${todoHere} still to look at${folder ? ' in this folder' : ''} Good</button> <span class="w">Back for another look stays yours to open.</span></p>` : '');
  /* inside a state, the items keep the list's own order, with a small head where a new group starts */
  const items = (/** @type {any[]} */ its) => { let last = ''; return its.map((i) => { const g = groupOf(i), head = !folder && g !== last ? `<li class="hub-qa-sub">${esc(g)}</li>` : ''; last = g; return head + qaItem(i, card.id); }).join(''); };
  const group = (/** @type {string} */ state, /** @type {string} */ title, /** @type {string} */ sub) => {
    const its = shown.filter((i) => i.state === state);
    if (!its.length) return '';
    if (state === 'good') return `<details class="hub-good"><summary><span class="obs-h2">${title} <small>${its.length} · folded; open one to change its mark</small></span></summary><ul class="hub-good-list">${its.map((i) => goodRow(i.text, folder ? '' : groupOf(i), i.at ? 'Marked good ' + i.at : '', qaItem(i, card.id))).join('')}</ul></details>`;
    return `<h2 class="obs-h2">${title} <small>${its.length}${sub ? ' · ' + sub : ''}</small></h2><ul class="hub-qa">${items(its)}</ul>`;
  };
  const body = `<div class="obs-head">
  <h1>${playtest ? 'Playtest' : 'QA list'} <span class="hub-of">· ${esc(card.title)}</span></h1>
  <p>${playtest ? 'Every setup, each one a tap away, and what to try in it. Play each on the device it names, then mark it: Good means leave it alone; Needs a tweak, with a note, means change it. Your notes decide what gets built next.' : 'Everything this milestone changed, on one list. Open each one on your phone and at your desk, then mark it. A note becomes Claude\'s fix list, and only what gets fixed comes back to you.'}</p>
</div>
${switcher}
${folderRow}
${playtest && card.plan ? `<p class="hub-done"><a href="/__hub/plan?card=${esc(card.id)}">Read the deep dive</a> that goes with this playtest.</p>` : ''}
${building ? `<p class="hub-alert">Still building. This is what the list will hold; it is yours at the QA stage, and the pictures fill in as steps finish.</p>` : ''}
${c.clear ? `<p class="hub-alert is-good">${icon('circle-check')} ${playtest ? 'Every setup is marked. Next, Claude merges your notes and the deep dive into one build list for your yes.' : 'The list is clear. Next is Ship.'}</p>` : ''}
<div class="obs-cards hub-qa-sum">
  <div class="obs-card"><p class="obs-lab">To look at</p><p class="obs-big">${c.todo + c.recheck} <small>of ${c.total}</small></p></div>
  <div class="obs-card"><p class="obs-lab">Good</p><p class="obs-big">${c.good}</p></div>
  <div class="obs-card"><p class="obs-lab">With Claude</p><p class="obs-big">${c.tweak}</p></div>
  <div class="obs-card"><p class="obs-lab">${playtest ? 'What this is' : 'The machine went first'}</p><p>${playtest ? 'A playtest of the game as it is live now. Nothing new is built yet, so there is no build for the machine to check.' : g ? `${g.ok ? 'Passed' : '<strong>Failed</strong>'} ${esc(g.at)}, in ${g.minutes} min. ${esc(g.summary)}` : 'The full check of the whole site has not run for this milestone yet.'}</p></div>
</div>
${group('recheck', 'Back for another look', 'fixed since your note')}
${group('todo', 'To look at', '')}
${group('tweak', 'With Claude', 'your notes')}
${group('good', 'Good', '')}`;
  return layout({ title: playtest ? 'Playtest' : 'QA list', tab: 'qa', body });
}

/* ── the puzzle sheet ───────────────────────────────────────────────────── */

/* Device Assembly's every wall, from `npm run da:qa` (scripts/da-qa.js): opened by its link at a phone and a desk,
   pictured empty and built, every break checked for where it stops, walls rebuilt by a thumb that misses. A new wall is on the
   sheet the next time it runs. A wall takes a mark like a QA item (wall:<id>, in the card's marks), so a puzzle that
   needs work comes back to Claude with a note; the marks never hold up a milestone's Ship. */
/** @param {string} [only] a group's slug from ?group=: the sheet shows that group alone (David, 2026-10-07: "another QA on specifically ventilators only") */
function puzzles(only) {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(__dirname, '..', '..', 'tmp', 'da-qa', 'report.json');
  const head = (/** @type {string} */ p) => `<div class="obs-head"><h1>Puzzles <span class="hub-of">· Device Assembly</span></h1><p>${p}</p></div>`;
  if (!fs.existsSync(file)) return layout({ title: 'Puzzles', tab: 'puzzles', body: head('The sheet has not run on this computer yet. Claude runs it with <code>npm run da:qa</code>; it takes a few minutes.') });
  /** @type {any} */
  const rep = JSON.parse(fs.readFileSync(file, 'utf8'));
  const marks = qaLib.readMarks('device-assembly').items || {};
  const ok = (/** @type {boolean|null} */ v, /** @type {string} */ yes, /** @type {string} */ no) => v === null || v === undefined ? '' : `<span class="obs-pill ${v ? 'is-good' : 'is-bad'}">${v ? icon('check') : icon('x')} ${esc(v ? yes : no)}</span>`;
  const fig = (/** @type {string} */ src, /** @type {string} */ cap, /** @type {string} */ what) => src ? `<figure><a href="${esc(src)}"><img src="${esc(src)}" alt="${esc(cap)}" loading="lazy" class="is-${what}"></a><figcaption>${esc(cap)}</figcaption></figure>` : '';
  /** @param {any} w */
  /** @type {any} */
  const card = (w) => {
    const m = marks['wall:' + w.id] || {}, state = m.mark === 'good' ? 'good' : m.mark === 'tweak' ? 'tweak' : m.mark === 'recheck' ? 'recheck' : 'todo';
    if (state === 'good' && !card.full) { card.full = true; const whole = card(w); card.full = false; return goodRow((w.kicker || w.id) + ' · ' + (w.title || ''), '', m.at ? 'Marked good ' + m.at : '', whole); }
    const errs = (w.phone.errors || []).concat(w.desktop.errors || []);
    const checks = [ok(w.opened === w.asked || /^shift:/.test(w.asked), 'opens on its link', 'opened ' + (w.opened || 'nothing')), ok(!errs.length, 'no errors', errs[0] || 'an error'),
      ok(!w.phone.overflow && !w.desktop.overflow, 'fits the screen', 'runs off the side'), ok(w.solvable, 'its answer passes', 'its answer fails'),
      w.breaks ? ok(!w.breaks.vague.length, w.breaks.located + ' of ' + w.breaks.total + ' breaks say where', w.breaks.vague.length + ' breaks do not say where') : ''].join(' ');
    const tid = 'w-' + qaLib.slug(w.id);
    return `<li class="hub-qa-item" data-state="${state}" data-item="wall:${esc(w.id)}" data-card="device-assembly">
  <div class="hub-qa-top"><h3>${esc((w.kicker || w.id) + ' · ' + (w.title || ''))}</h3><span class="obs-pill">${esc(w.group || '')}</span></div>
  <p class="hub-try">${esc(w.order || '')}</p>
  <p class="hub-wallchecks">${checks}</p>
  <a class="go" href="${esc(w.link)}" target="_blank" rel="noopener">Play it ${icon('arrow-right')}</a>
  ${m.note && (state === 'tweak' || state === 'recheck') ? `<p class="hub-said"><b>You said:</b> ${esc(m.note)}</p>` : ''}
  ${state === 'recheck' && m.fix ? `<p class="hub-fix"><b>What changed:</b> ${esc(m.fix)}</p>` : ''}
  <div class="hub-pair">${fig(w.phone.shots.empty, 'phone, empty', 'phone')}${fig(w.phone.shots.built, 'phone, built', 'phone')}${fig(w.desktop.shots.empty, 'desk, empty', 'desktop')}${fig(w.desktop.shots.built, 'desk, built', 'desktop')}</div>
  <div class="hub-actions">
    <button class="hub-btn hub-pick is-good" type="button" data-mark="good" aria-pressed="${state === 'good'}">${icon('check')}Good</button>
    <button class="hub-btn hub-pick is-tweak" type="button" data-mark="tweak" aria-pressed="${state === 'tweak'}">${icon('pencil')}Needs a tweak</button>
    <span class="w">${m.at ? esc((state === 'good' ? 'Marked good ' : state === 'tweak' ? 'Sent to Claude ' : 'Back to you ') + m.at) : ''}</span>
  </div>
  <div class="hub-tweak" hidden>
    <label class="obs-lab" for="${tid}">What should change?</label>
    <textarea class="hub-input" id="${tid}" rows="3" maxlength="2000">${state === 'tweak' ? esc(m.note || '') : ''}</textarea>
    <div class="hub-row"><span class="hub-err" role="alert"></span><button class="hub-btn hub-btn--go" type="button" data-send>Send to Claude</button></div>
  </div>
</li>`;
  };
  const walls = rep.walls || [];
  const clean = walls.filter((/** @type {any} */ w) => w.ok).length, tried = walls.reduce((/** @type {number} */ a, /** @type {any} */ w) => a + (w.breaks ? w.breaks.total : 0), 0);
  const order = ['Tutorial', 'Levels', 'Find the fault', 'Ventilators', 'Sandbox', 'Dealt', 'The shift'];
  const all = [...new Set([...order, ...walls.map((/** @type {any} */ w) => w.group)])].map((g) => ({ g, ws: walls.filter((/** @type {any} */ w) => w.group === g) })).filter((x) => x.ws.length);
  const groups = only ? all.filter((x) => groupSlug(x.g) === only) : all;
  /* one chip per group, with what is left to look at in it; a chip shows that group alone */
  const left = (/** @type {any[]} */ ws) => ws.filter((w) => { const m = marks['wall:' + w.id] || {}; return m.mark !== 'good'; }).length;
  const chip = (/** @type {string} */ label, /** @type {string} */ slug, /** @type {any[]} */ ws) => { const on = slug === (only || ''), n = left(ws);
    return `<a class="toggle-chip${on ? ' on' : ''}" href="/__hub/puzzles${slug ? '?group=' + esc(slug) : ''}"${on ? ' aria-current="page"' : ''}>${esc(label)} · ${n ? n + ' left' : 'done'}</a>`; };
  const chips = `<nav class="hub-switch hub-folders" aria-label="Groups">${chip('All', '', walls)}${all.map((x) => chip(x.g, groupSlug(x.g), x.ws)).join('')}</nav>`;
  const t = rep.touch;
  const body = `${head('Every wall the game has, and a spread of dealt ones, opened by its link at a phone and at a desk, pictured empty and built, and broken one part at a time to check that the test says where it stops. A new wall is here by itself the next time the sheet runs. Look when you want to; mark a wall Needs a tweak, with a note, when one needs work.')}
<div class="obs-cards hub-qa-sum">
  <div class="obs-card"><p class="obs-lab">Walls</p><p class="obs-big">${clean} <small>clean of ${walls.length}</small></p></div>
  <div class="obs-card"><p class="obs-lab">Breaks tried</p><p class="obs-big">${tried}</p><p>${walls.every((/** @type {any} */ w) => !w.breaks || !w.breaks.vague.length) ? 'Every one says where the gas stops.' : 'Some do not say where; they are marked below.'}</p></div>
  <div class="obs-card"><p class="obs-lab">Played by touch</p><p>${t ? `${t.ok ? 'A thumb that misses rebuilds every wall' : '<strong>The thumb test failed</strong>'}: ${esc(t.steps.map((/** @type {any} */ s) => s.what + (s.ok ? '' : ' (no)')).join(', '))}.` : 'Not run.'}</p></div>
  <div class="obs-card"><p class="obs-lab">A phone's real screen</p><p>${rep.screens ? `${rep.screens.filter((/** @type {any} */ x) => x.ok).length} of ${rep.screens.length} fit with nothing to scroll: ${esc(rep.screens.map((/** @type {any} */ x) => x.name + ' ' + x.wall + ' px wall' + (x.small ? ', small: play it zoomed' : '') + (x.ok ? '' : ' (no)')).join('; '))}.` : 'Not run.'}</p></div>
  <div class="obs-card"><p class="obs-lab">The sheet ran</p><p>${esc(rep.at || '')}. The engine half runs in every verify: every dealt wall solves, every break says where, no hint tells a thumb to right-click.</p></div>
</div>
${chips}
${groups.map((x) => `<h2 class="obs-h2">${esc(x.g)} <small>${x.ws.length}</small></h2><ul class="hub-qa">${x.ws.map(card).join('')}</ul>`).join('')}`;
  return layout({ title: 'Puzzles', tab: 'puzzles', body });
}

/* ── the site ───────────────────────────────────────────────────────────── */

function site() {
  const s = devlog.site();
  if (!s) return layout({ title: 'Site blocks', tab: 'site', body: '<div class="obs-head"><h1>Site blocks</h1><p>The page ledger has not run on this computer yet. It runs at every close; ask Claude to run it now.</p></div>' });
  const sum = s.summary;
  const pct = (/** @type {number} */ a, /** @type {number} */ n) => (n ? Math.round((a / n) * 1000) / 10 : 0);
  const plates = s.byArea.map((a) => `<section class="obs-plate${a.pages > 10 ? ' is-wide' : ''}" aria-labelledby="pl-${a.id}">
  <h2 id="pl-${a.id}">${esc(a.label)} <small>${plural(a.pages, 'page')} · ${a.p2} at standard${a.locked ? ' · ' + a.locked + ' locked' : ''}</small></h2>
  <div class="obs-meter" aria-hidden="true"><i class="m2" style="width:${pct(a.p2, a.pages)}%"></i><i class="m1" style="width:${pct(a.p1, a.pages)}%"></i></div>
  <ul class="obs-bricks">${a.rows.map((/** @type {any} */ r, /** @type {number} */ i) => {
    const ph = r.phase === 1 || r.phase === 2 ? r.phase : 'q';
    const tid = `tpl-${a.id}-${i + 1}`;
    return `<li>
    <button type="button" class="obs-brick ph-${ph}" aria-expanded="false" aria-controls="obsDock" data-tpl="${tid}">
      <span class="n">${esc(r.short)}</span>
      <span class="m"><span class="t">${r.phase === 2 ? 'Phase 2' : r.phase === 1 ? 'Phase 1 · ' + plural(r.holds.length, 'hold') : 'Not measured'}</span>${r.locked ? icon('lock') + '<span class="obs-sr">, locked</span>' : ''}${r.night && !r.nightChanged ? icon('moon') + '<span class="obs-sr">, reviewed at night</span>' : ''}${r.day && !r.dayChanged ? icon('sun') + '<span class="obs-sr">, reviewed in day</span>' : ''}${r.uncommitted ? icon('pencil') + '<span class="obs-sr">, changes not pushed</span>' : ''}${r.phases.length ? icon('palette') + '<span class="obs-sr">, in a design phase</span>' : ''}</span>
    </button>
    <template id="${tid}">
      <button class="obs-pane-x" type="button" data-close aria-label="Close">&times;</button>
      <h3>${esc(r.title)}</h3>
      <a class="go" href="${esc(r.url)}">Open the page ${icon('arrow-right')}</a>
      <dl>
        <dt>Area</dt><dd>${esc(a.label)}, ${esc(r.kind)}</dd>
        <dt>Standard</dt><dd>${r.phase === 2 ? 'Phase 2: passes every check for a ' + esc(r.kind) + '.' : r.phase === 1 ? 'Phase 1, held back by:<ul>' + r.holds.map((/** @type {string} */ h) => `<li>${esc(h)}</li>`).join('') + '</ul>' : 'Not measured yet.'}</dd>
        <dt>Changed</dt><dd>${r.changed ? 'Last pushed ' + esc(r.changed) : 'Never pushed'}${r.uncommitted ? ', with changes not pushed yet' : ''}.</dd>
        <dt>Locked</dt><dd>${r.locked ? 'Since ' + esc(r.locked) + (r.lockNote ? '. ' + esc(r.lockNote) : '') : 'No'}</dd>
        <dt>Night</dt><dd>${r.night ? (r.nightChanged ? 'Changed since your mark of ' : 'Reviewed ') + esc(r.night) : 'Not yet'}</dd>
        <dt>Day</dt><dd>${r.day ? (r.dayChanged ? 'Changed since your mark of ' : 'Reviewed ') + esc(r.day) : 'Not yet'}</dd>
        ${r.legacy ? `<dt>Before the refresh</dt><dd>Reviewed ${esc(r.legacy)}</dd>` : ''}
        ${r.phases.length ? `<dt>Design phase</dt><dd>${esc(r.phases.join('; '))}</dd>` : ''}
      </dl>
    </template>
  </li>`;
  }).join('')}</ul>
</section>`).join('\n');

  const body = `<div class="obs-head">
  <h1>Site blocks</h1>
  <p>Every live page as a block, grouped by area. The color is the standard a page meets today, worked out by the page ledger ${esc(ago(daysAgo(s.at)))}. A lock means David has called a page finished: it still gets defect fixes and small standard fixes, and nothing new, while new work goes on around it.</p>
</div>
<div class="obs-cards hub-gap">
  <div class="obs-card"><p class="obs-lab">Live pages</p><p class="obs-big">${sum.pages}</p></div>
  <div class="obs-card"><p class="obs-lab">Meet today's standard</p><p class="obs-big">${sum.p2} <small>Phase 2</small></p></div>
  <div class="obs-card"><p class="obs-lab">Held back by a named check</p><p class="obs-big">${sum.p1} <small>Phase 1</small></p></div>
  <div class="obs-card"><p class="obs-lab">Locked · reviewed night and day</p><p class="obs-big">${sum.locked} <small>locked</small> · ${sum.reviewed} <small>both</small></p></div>
</div>
<h2 class="obs-h2" id="blocks">The blocks <small>${s.byArea.length} areas</small></h2>
<ul class="obs-key">
  <li><span class="sw" style="background:var(--ph-2)" aria-hidden="true"></span><span><b>Phase 2.</b> Passes every check for its kind.</span></li>
  <li><span class="sw" style="background:var(--ph-1)" aria-hidden="true"></span><span><b>Phase 1.</b> Fails at least one; the block names which.</span></li>
  <li>${icon('lock')}<span><b>Locked.</b> Finished as of a date.</span></li>
  <li>${icon('check')}<span><b>Reviewed.</b> David has looked at it.</span></li>
  <li>${icon('pencil')}<span><b>In work.</b> Changes not pushed yet.</span></li>
  <li>${icon('palette')}<span><b>Design phase.</b> Open for new design.</span></li>
</ul>
<div class="obs-site">
  <div class="obs-plates">${plates}</div>
  <aside class="obs-pane is-parked" id="obsDock" aria-label="Page detail" aria-live="polite">
    <p class="hint">Pick a block to see what holds it back, when it last changed, and whether it is locked.</p>
  </aside>
</div>
<h2 class="obs-h2" id="how">Phases and locks</h2>
<div class="obs-cards">
  <section class="obs-card"><p class="obs-lab">The phase is computed</p><p>The page ledger holds each page to the checks for its kind: a tool, a game, a reading page, a hub. Phase 2 passes all of them. Phase 1 fails at least one and says which, so the list of what to fix next is always on the block. When a new rule lands, a page that fails it drops back to Phase 1 by itself.</p></section>
  <section class="obs-card"><p class="obs-lab">A lock is David's call</p><p>Tell Claude which pages to lock and from what date. A locked page still gets defect fixes and the small standard fixes the ledger names. No new design, no new content and no rewrites until David lifts the lock. The close step warns when a locked page changes.</p></section>
</div>`;
  return layout({ title: 'Site blocks', tab: 'site', body });
}

/* ── the library ────────────────────────────────────────────────────────── */

function library() {
  const chip = (/** @type {string} */ id) => { const k = kit.byId[id]; return k ? `<span class="obs-chip k-${k.kind}">${esc(k.name)}</span>` : ''; };
  const body = `<div class="obs-head">
  <h1>Library</h1>
  <p>How the work is meant to run, and every tool it uses, as blocks. For David and Claude, and for anyone learning how the site gets built.</p>
</div>
<h2 class="obs-h2" id="milestone">A milestone, five stages</h2>
<ol class="hub-stages">${kit.milestone.map((m) => `<li class="hub-stage">
  <h3>${m.id}</h3>
  <p class="who">${m.david ? 'Your part' : 'Runs without you'}</p>
  <p>${esc(m.text)}</p>
  <div class="obs-chips">${m.blocks.map(chip).join('')}</div>
</li>`).join('')}</ol>
<h2 class="obs-h2" id="window">A window, open to close <small>inside Build and Tweaks</small></h2>
<ol class="obs-loop">${kit.loop.map((stage) => `<li class="obs-stage obs-stage--${stage.id}">
  <h3>${esc(stage.label)} <small>${esc(stage.sub)}</small></h3>
  <ol class="obs-steps">${stage.steps.map((st) => `<li><b>${esc(st.name)}</b><p>${esc(st.text)}</p><div class="obs-chips">${st.blocks.map(chip).join('')}</div></li>`).join('')}</ol>
</li>`).join('')}</ol>
<h2 class="obs-h2" id="blocks">The blocks <small>${kit.blocks.length} pieces</small></h2>
<ul class="obs-key">${kit.kinds.map((k) => `<li class="k-${k.id}"><span class="sw" aria-hidden="true"></span><span><b>${esc(k.label)}.</b> ${esc(k.note)}</span></li>`).join('')}</ul>
${kit.sets.map((s) => `<section class="obs-set" aria-labelledby="set-${s.id}">
  <h3 class="obs-lab" id="set-${s.id}">${esc(s.label)}</h3>
  <ul class="obs-blocks">${s.blocks.map((/** @type {any} */ k) => `<li class="obs-block k-${k.kind}" id="b-${k.id}">
    <span class="obs-block-name">${esc(k.name)}${k.more ? `<button class="hu-i" type="button" data-def="${esc('<b>' + esc(k.name) + '</b>' + esc(k.more))}" aria-label="More about ${esc(k.name)}">i</button>` : ''}</span>
    <code>${esc(k.how)}</code>
    <p>${esc(k.what)}</p>
    <span class="obs-when">${k.when.map((/** @type {string} */ w) => `<span class="obs-pill">${esc(w)}</span>`).join('')}<span class="obs-pill">${esc(kit.kindLabel[k.kind])}</span></span>
  </li>`).join('')}</ul>
</section>`).join('\n')}`;
  return layout({ title: 'Library', tab: 'library', body, kitJs: true });
}

/* ── a card's plan ──────────────────────────────────────────────────────── */

/** The plan documents are Markdown in docs/. This draws the small part of Markdown they use: headings,
 *  paragraphs, lists, tables, rules, **bold** and `code`. Everything is escaped first. @param {string} text */
function mdDoc(text) {
  const inline = (/** @type {string} */ s) => md(s);
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  const flush = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flush(); const n = Math.min(h[1].length + 1, 4); out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }
    if (/^---+\s*$/.test(l)) { flush(); out.push('<hr>'); continue; }
    if (/^\s*$/.test(l)) { flush(); continue; }
    if (/^\|/.test(l)) {
      flush();
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      i--;
      const cells = (/** @type {string} */ r) => r.replace(/^\||\|\s*$/g, '').split('|').map((c) => c.trim());
      // the separator row has dashes; an empty header row (| | |) has none and must stay
      const body = rows.filter((r) => !(/-/.test(r) && /^\|[\s:|-]+\|?\s*$/.test(r)));
      const head = cells(body[0]);
      const blank = head.every((c) => !c);
      out.push('<div class="hub-doc-table"><table>' + (blank ? '' : '<thead><tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead>')
        + '<tbody>' + body.slice(1).map((r) => '<tr>' + cells(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
      continue;
    }
    const li = l.match(/^(\s*)(?:[-*]|\d+\.)\s+(.*)$/);
    if (li) {
      flush();
      const ordered = /^\s*\d+\./.test(l);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)(?:[-*]|\d+\.)\s+(.*)$/);
        if (m) { items.push({ deep: m[1].length > 0, text: m[2] }); i++; continue; }
        if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1].text += ' ' + lines[i].trim(); i++; continue; }
        break;
      }
      i--;
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>` + items.map((it) => `<li${it.deep ? ' class="deep"' : ''}>${inline(it.text)}</li>`).join('') + `</${tag}>`);
      continue;
    }
    para.push(l.trim());
  }
  flush();
  return out.join('\n');
}

/** @param {string} [pick] a card id */
function plan(pick) {
  const fs = require('fs');
  const path = require('path');
  const b = boardLib.load();
  const card = (pick && b.cards.find((c) => c.id === pick)) || b.cards.find((c) => c.lane === 'focus' && c.plan);
  const file = card && card.plan ? path.join(__dirname, '..', '..', card.plan) : '';
  const docs = path.join(__dirname, '..', '..', 'docs') + path.sep;
  if (!card || !file.startsWith(docs) || !/\.md$/.test(file) || !fs.existsSync(file)) {
    return layout({ title: 'Plan', tab: '', body: '<div class="obs-head"><h1>No plan to show</h1><p>The card has no plan document yet.</p></div>' });
  }
  const text = fs.readFileSync(file, 'utf8');
  const body = `<p class="hub-doc-from"><a class="go" href="/__hub">${icon('arrow-left')} The board</a> <span class="w">${esc(card.plan)}</span></p>
<article class="hub-doc">${mdDoc(text)}</article>`;
  return layout({ title: card.title + ', the plan', tab: '', body });
}

module.exports = { board, run, qa, puzzles, site, library, plan, mdDoc, layout, esc, md, icon, TABS };
