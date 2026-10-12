// THE DEV BLOG (2026-10-11). David: "start a blog on the secret menu page ... where we will basically write our general
// development process ... every couple of updates we will do a blog update with things that we have figured out like best
// practices and content ideas and feedback we've got from the community ... and it'll track if we made updates based on
// some of those feedbacks or not". Secret menu only: every page under /secret-menu/blog/ is noindex and out of every
// collection, so the sitemap, the feed and the site search never see it.
//
// A post is its own page at /secret-menu/blog/<slug>/ (its words live there). This file holds what the blog's front page
// and the feedback tracker need, newest post first.
//   feedback row: heard (what was said, short), from (who or where), status done | planned | not,
//                 did (what changed, or the plan, or why not), when (YYYY-MM-DD, for done rows)
// tests/dev-blog.test.js holds every post to a page and every row to a status.

const STATUS = { done: 'Done', planned: 'Planned', not: 'Not doing' };
// a date written out from its own parts, never through Date (a bare YYYY-MM-DD is UTC midnight, the day before in Mountain time)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const long = (d) => { const [y, m, day] = d.split('-').map(Number); return MONTHS[m - 1] + ' ' + day + ', ' + y; };

const posts = [
  {
    slug: 'site-1-0',
    n: 1,
    title: 'Site 1.0: How This Site Got Built',
    date: '2026-10-11',
    summary: 'Six and a half months from the first commit to the first full page-by-page review: four looks, eight tools, three games, and a lot of nights.',
    feedback: [
      { heard: 'No Share button on the Learn modules or the Rounds pieces; a reader can copy the address.', from: 'David, site review', status: 'done', did: 'Removed from the end of every Learn module and Rounds piece.', when: '2026-10-11' },
      { heard: 'Fold the sources list on every Learn module.', from: 'David, site review', status: 'done', did: 'Eleven modules now keep their sources in a closed list that opens on a tap.', when: '2026-10-11' },
      { heard: 'The dotted line on the home map should stop or slow down after 20 or 30 seconds.', from: 'David, site review', status: 'done', did: 'It slows after 20 seconds and rests at 30. A hover or a press on the compass wakes it.', when: '2026-10-11' },
      { heard: 'The secret menu tile on home should have a route to it and stand raised, like the zone tiles.', from: 'David, site review', status: 'done', did: 'A raised green tile with its own route from the compass. Same triggers as before.', when: '2026-10-11' },
      { heard: 'The secret menu does not need a search box.', from: 'David, site review', status: 'done', did: 'Gone. The search in the nav still works.', when: '2026-10-11' },
      { heard: 'The Data Observatory, the Traffic tab and the SQL editor stayed dark in day.', from: 'David, site review', status: 'done', did: 'All three go light in day now; the older tools were swept for the same fault.', when: '2026-10-11' },
      { heard: 'Five policy pages are finished and do not need another review.', from: 'David, site review', status: 'done', did: 'Accessibility, AI and the disclaimer left the review list for good, with privacy and terms.', when: '2026-10-11' },
      { heard: 'Guest modules should look like every other module; no separate palette for guest authors.', from: 'David, site review', status: 'done', did: 'The oxygen payment module now wears the standard look in both themes. Its words did not change.', when: '2026-10-11' },
      { heard: 'The Career Tree, the System Layers map and the Hospital Map feel cluttered on a phone.', from: 'David, site review', status: 'planned', did: 'A phone pass on the older tools, as its own phase.' },
      { heard: 'On the maps it should be obvious what can be clicked, picked or filtered.', from: 'David, site review', status: 'planned', did: 'One visual standard for the controls on every map.' },
      { heard: 'Clinical SQL Mystery could grow into a game with levels, like Device Assembly.', from: 'David, site review', status: 'planned', did: 'An idea for a later phase.' },
      { heard: 'Patient Populations is close to being a Learn module.', from: 'David, site review', status: 'planned', did: 'More sourcing first; it stays on the secret menu until then.' }
    ]
  }
];

posts.forEach((p) => { p.dateText = long(p.date); });

// the tracker's totals across every post
const all = posts.flatMap((p) => p.feedback.map((f) => ({ ...f, post: p.slug, postN: p.n, postTitle: p.title })));
const totals = { heard: all.length, done: 0, planned: 0, not: 0 };
all.forEach((f) => { totals[f.status]++; });

module.exports = { posts, STATUS, totals, all };
