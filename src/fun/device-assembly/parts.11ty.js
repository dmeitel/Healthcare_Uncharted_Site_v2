/* Device Assembly's plain addresses (DECISIONS B6, 2026-10-06: "a URL for like the daily puzzle ... the training part
   the challenge part or each of the kind of different limbs of that game"). One small page per part, each forwarding to
   the game with the token it opens (?wall=<token>); the game then shows the plain address while that part is on screen
   (addressOf and setAddress in index.html). A real page at each address, not a server rewrite, so the address works on
   the dev server, on the hub and on Netlify alike, and a shared link gets its own title and description in a preview.
   tests/device-assembly-door.test.js holds every token here to opening something in the game. */
const PARTS = [
  { slug: 'today', wall: 'today', name: 'today’s wall', title: 'Device Assembly: Today’s Wall',
    description: 'The same respiratory equipment setup puzzle for everyone today, on the wall behind the bed. Build it, test it, share your time.' },
  { slug: 'training', wall: 'training', name: 'the training', title: 'Device Assembly: Training',
    description: 'Five short walls that teach the moves of Device Assembly: connect, adapt, assemble, place and optimize.' },
  { slug: 'paths', wall: 'paths', name: 'the paths', title: 'Device Assembly: Paths',
    description: 'Five paths of respiratory setup walls, easy to hard: oxygen on the floor, humidity and aerosol, high flow, find the fault and ventilators.' },
  { slug: 'paths/oxygen', wall: 'path:oxygen', name: 'Oxygen on the floor', title: 'Device Assembly: Oxygen on the Floor',
    description: 'Six oxygen setups on the wall behind the bed, easy to hard.' },
  { slug: 'paths/humidity', wall: 'path:humidity', name: 'Humidity and aerosol', title: 'Device Assembly: Humidity and Aerosol',
    description: 'Six humidified oxygen and aerosol setups on the wall behind the bed, easy to hard.' },
  { slug: 'paths/high-flow', wall: 'path:high-flow', name: 'High flow', title: 'Device Assembly: High Flow',
    description: 'Four high flow nasal cannula setups on the wall behind the bed, easy to hard.' },
  { slug: 'paths/find-the-fault', wall: 'path:find-the-fault', name: 'Find the fault', title: 'Device Assembly: Find the Fault',
    description: 'Six setups already built, with something wrong in each. Find it and fix it.' },
  { slug: 'paths/ventilators', wall: 'path:ventilators', name: 'Ventilators', title: 'Device Assembly: Ventilators',
    description: 'Seven ventilator setups on an ICU wall, from laying the circuit on either side of the bed to what goes in line, easy to hard.' },
  { slug: 'random', wall: 'gen:new', name: 'a random wall', title: 'Device Assembly: A Random Wall',
    description: 'A respiratory equipment setup puzzle, dealt fresh every time.' },
  { slug: 'shift', wall: 'shift:new', name: 'the shift', title: 'Device Assembly: The Shift',
    description: 'Five walls, one patient. The order changes as the shift goes on.' },
  { slug: 'race', wall: 'race:new', name: 'a race', title: 'Device Assembly: Race',
    description: 'Race friends or bots to build the same respiratory setup.' },
  { slug: 'make', wall: 'make:new', name: 'the wall maker', title: 'Device Assembly: Make a Wall',
    description: 'Pick the order and the twist, then share the wall you made.' },
];

class DeviceAssemblyParts {
  data() {
    return {
      layout: 'base.njk',
      navPage: 'fun',
      noindex: true,
      eleventyExcludeFromCollections: true,
      og_image: '/assets/images/tool-thumbs/fun-device-assembly.png',
      parts: PARTS,
      pagination: { data: 'parts', size: 1, alias: 'part' },
      permalink: (d) => `/fun/device-assembly/${d.part.slug}/`,
      eleventyComputed: { title: (d) => d.part.title, description: (d) => d.part.description },
    };
  }
  render(d) {
    const to = '/fun/device-assembly/?wall=' + d.part.wall;
    return `<meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace('${to}' + (location.search ? '&' + location.search.slice(1) : ''));</script>
<style>
  .redirect-note { max-width:640px; margin:96px auto; padding:0 24px; font-size:var(--t-body); line-height:1.7; color:var(--t2); }
  .redirect-note a { color:var(--teal); }
  [data-theme="light"] .redirect-note a { color:var(--teal-ink); }
</style>
<div class="redirect-note"><p>Taking you to <a href="${to}">${d.part.name}</a> in Device Assembly.</p></div>
`;
  }
}
DeviceAssemblyParts.PARTS = PARTS;
module.exports = DeviceAssemblyParts;
