/**
 * dailies.js · every daily puzzle on the site, for today's puzzles (2026-10-18).
 *
 * The Fun page's "Today's puzzles" shelf and the /fun/today/ page draw one card per entry
 * (src/_includes/components/fun-today.njk), and src/assets/js/fun-today.js fills in today's number and
 * where you stand from what each game saves in the browser. A new daily is one more entry here and one more
 * reader in fun-today.js; tests/fun-today.test.js holds each entry to its game (the first day, the link, the keys).
 *
 *   id     the reader in fun-today.js            href  today's puzzle itself, not the game's front door
 *   one    the game's day #1 (YYYY-MM-DD)        word  what the game calls one day's puzzle
 *   thumb  the picture in tool-thumbs/           line  what the card says before its script runs
 */
module.exports = [
  { id: 'headwall', name: 'Headwall', href: '/fun/headwall/today/', one: '2026-10-03', word: 'Wall', thumb: 'fun-device-assembly',
    line: 'The same wall for everyone today.' },
  { id: 'huddle', name: 'Daily Huddle', href: '/fun/daily-huddle/?board=today', one: '2026-10-14', word: 'Board', thumb: 'fun-daily-huddle',
    line: 'The same board for everyone today.' }
];
