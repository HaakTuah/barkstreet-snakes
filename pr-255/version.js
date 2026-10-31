// The version this page is, and what is new in it. build is stamped with the
// commit by .github/workflows/pages.yml as it publishes the site (main's and
// each preview's); anywhere else it stays 'dev', and nothing updates. update.js
// asks for this file afresh to learn whether a newer version is out.
// news: one line per milestone, newest first, written with it (under about 60
// characters: it takes the start card's intro line for a few rounds after the
// update, so no longer than the intro). A milestone without its line just shows the last one to whoever has
// not seen it yet.
window.SnakeVersion = {
  build: 'dc517ec',
  news: [
    { on: '2026-10-31', line: 'The game now updates itself between rounds.' },
  ],
};
