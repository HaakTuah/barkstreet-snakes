// ------------------------------------- held upright, every 10 px of height
// Phones held upright from 320 to 430 px wide, every 10 px of height
// from 440 to 940, the screen resized under the page: the start card,
// playing with the chatter full, and watching with it full. The page is
// one screen tall at every one (it used to scroll on every phone with
// its browser's bars showing, even at the start card), and the board is
// never smaller than on main before the page was one screen tall
// (MAIN_UP, pinned: the owner's call, the board first; the help and the
// chatter give way, to a strip or none, its lines in bubbles).
for (const w of [320, 360, 375, 390, 412, 414, 430]) {
  if (only && !String(w).includes(only)) continue;
  const bad = { 'the start card': [], 'playing, the chatter full': [], 'watching, the chatter full': [] }, small = [], bannerBad = [];
  const sweep = async state => {
    for (let h = 440; h <= 940; h += 10) {
      await b.viewport(w, h, { scale: 3, mobile: true });
      await settle();
      const s = await ev(SCROLL), bw = await ev(BOARD_W), want = MAIN_UP[w][(h - 440) / 10];
      if (s.h > s.vh || s.w > s.vw) bad[state].push(`${h} (${s.w}×${s.h})`);
      if (bw < want - 0.5) small.push(`${h} ${state}: ${r1(bw)} (main ${want})`);
      if (state.startsWith('playing')) { // (a banner: the one up as the screen changed, and one put up now)
        const moved = await ev(BANNER(undefined, false)), fresh = await ev(BANNER(BANNERS[(h / 10) % BANNERS.length]));
        for (const [what, p] of [['as the screen changed', moved], ['put up', fresh]]) if (p && bannerWrong(p, true).length) bannerBad.push(`${h} ${what}: “${p.text}” ${bannerWrong(p, true).join(', ')}`);
      }
    }
  };
  await open({ w, h: 440, dpr: 3 });
  await sweep('the start card');
  await toRound();
  await ev(FILL);
  await sweep('playing, the chatter full');
  await ev(`window.__autoRaf = true; 'ok'`);
  await open({ w, h: 440, dpr: 3 });
  await toRound('watch');
  await ev(FILL);
  await sweep('watching, the chatter full');
  await ev(`window.__autoRaf = true; 'ok'`);
  for (const [state, list] of Object.entries(bad)) check(!list.length, `${w} px wide, upright, 440 to 940 px tall, every 10: ${state}, nothing scrolls`, list.length ? `scrolls at ${list.join(', ')}` : '51 heights');
  check(!small.length, `${w} px wide, upright, 440 to 940 px tall, every 10: the board is never smaller than on main before the page was one screen tall`, small.join('; ') || `${MAIN_UP[w][0]} to ${Math.max(...MAIN_UP[w])} px on main, each height`);
  check(!bannerBad.length, `${w} px wide, upright, 440 to 940 px tall, every 10: playing, a banner is one line over the header's title row, its words whole, never over the board, your tag or the pause button, put up there and as the screen changes`, bannerBad.join('; ') || '51 heights');
}
