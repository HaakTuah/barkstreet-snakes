// The version this page is, and what is new in it. build is stamped with the
// commit by .github/workflows/pages.yml as it publishes the site (main's and
// each preview's); anywhere else it stays 'dev', and nothing updates. update.js
// asks for this file afresh to learn whether a newer version is out.
// news: one line per milestone, newest first, written with it (50 characters
// at most: with "New: " in front it takes the start card's intro line for a
// few rounds after the update, so no longer than the intro, as the ui suite
// checks). A milestone without its line just shows the last one to whoever has
// not seen it yet.
window.SnakeVersion = {
  build: '29063b6',
  news: [
    { on: '2026-11-07', line: 'The key you’re going dashes, like a swipe ahead.' },
    { on: '2026-11-07', line: 'Jump and dash share stamina; tired snakes show it.' },
    { on: '2026-11-06', line: 'Rings show who’s racing you; Mason’s vein is rose.' },
    { on: '2026-11-06', line: 'A flag’s pole now shows through a fallen snake.' },
    { on: '2026-11-06', line: 'A flag’s pole stays in sight behind other snakes.' },
    { on: '2026-11-03', line: 'Spat a mushroom? You slide over it while wet.' },
    { on: '2026-11-03', line: 'Gold portals at the edges: anyone can follow you.' },
    { on: '2026-11-02', line: 'Hunger warns you in time, even in the snow.' },
    { on: '2026-11-02', line: 'Flights go 5 cells. Rivals can steal your landing.' },
    { on: '2026-11-02', line: 'Going Back no longer brings the same rivals twice.' },
    { on: '2026-11-02', line: 'Hold a golden jump to fly, and steer as you go.' },
    { on: '2026-11-02', line: 'Beads match their snake. Flags fall. Spit’s timed.' },
    { on: '2026-11-01', line: 'The flash is now the dash.' },
    { on: '2026-11-01', line: 'Bits of log cut off by holes now fall away.' },
    { on: '2026-11-01', line: 'Any key ends a nap. The bird is bigger on phones.' },
    { on: '2026-10-31', line: 'The game now updates itself between rounds.' },
  ],
};
