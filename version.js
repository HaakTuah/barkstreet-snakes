// The version this page is, and what is new in it. build is stamped with the
// commit by .github/workflows/pages.yml as it builds the site (main's and each
// preview's); anywhere else it stays 'dev', and nothing updates. update.js asks
// for this file afresh to learn whether a newer version is out.
// news: one line per change a player would notice, newest first, written by
// the PR that makes it, since every merge goes live (50 characters at most:
// with "New: " in front it takes the start card's intro line for a few rounds
// after the update, so no longer than the intro, as the ui suite checks). A
// version without its line just shows the last one to whoever has not seen it.
window.SnakeVersion = {
  build: 'dev',
  news: [
    { on: '2026-11-13', line: 'Rivals cross marks in time, and keep a jump out.' },
    { on: '2026-11-13', line: 'Star dashes less, jumps more; Metagamer reads you.' },
    { on: '2026-11-13', line: 'Rivals dash in style: Sniper cuts, Gobbler races.' },
    { on: '2026-11-13', line: 'Rivals dash less, keeping stamina for what pays.' },
    { on: '2026-11-12', line: 'The woodpecker’s piece is shaded as it’s cut.' },
    { on: '2026-11-12', line: 'Hunger bites 12 s after every meal, all round.' },
    { on: '2026-11-12', line: 'Joining friends now works even if PeerJS is down.' },
    { on: '2026-11-12', line: 'Portals are now swirling ovals, as in Portal.' },
    { on: '2026-11-12', line: 'Failed joins now say what went wrong.' },
    { on: '2026-11-10', line: 'Portals glow blue and orange, as in Portal.' },
    { on: '2026-11-09', line: 'The woodpecker cuts the log away. Get off it!' },
    { on: '2026-11-08', line: 'The woodpecker comes in acts. Mind its gaze.' },
    { on: '2026-11-08', line: 'Rounds now come lean, normal or plentiful.' },
    { on: '2026-11-08', line: 'Rivals play the endgame smarter: fewer crashes.' },
    { on: '2026-11-08', line: 'Hungry rivals now fight you for the apples.' },
    { on: '2026-11-08', line: 'Knock out a snake to spill its golden powers.' },
    { on: '2026-11-08', line: 'Spat mushrooms fly straight ahead: aim with care.' },
    { on: '2026-11-07', line: 'Rivals spot far-off snakes a beat late, like you.' },
    { on: '2026-11-07', line: 'Meals bank stamina; golden apples bring a shield.' },
    { on: '2026-11-07', line: 'The rivals’ speech bubbles no longer overlap.' },
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
