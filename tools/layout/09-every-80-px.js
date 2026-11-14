// ------------------------------- over the board, every 80 px of height
// Windows over the board, narrower than 5:4, 460 to 1040 px wide, every
// 80 px of height from 560 to 1120, with a mouse and with touch, the
// window resized under the page: the board is never smaller than on main
// before the page was one screen tall (MAIN_OVER, pinned: the window's
// height less 260 px; the one-screen work's first build took up to 92 px
// off it here, for the chatter's two lines), and nothing scrolls, down or
// sideways, at the start card, or playing or watching with the chatter
// full (the chatter and the help give way: to a strip or none, and where
// the help doesn't fit its row).
for (const touch of [false, true]) {
  for (const w of [460, 600, 760, 900, 1040]) {
    const tag = `${w} px wide${touch ? ' with touch' : ''}, over the board`;
    if (only && !tag.includes(only)) continue;
    const hs = Object.keys(MAIN_OVER).filter(k => k.startsWith(`${w}x`)).map(k => Number(k.split('x')[1]));
    const bad = { 'the start card': [], 'playing, the chatter full': [], 'watching, the chatter full': [] }, small = [];
    const sweep = async state => {
      for (const h of hs) {
        await b.viewport(w, h, { scale: touch ? 2 : 1, mobile: touch });
        await settle();
        const s = await ev(SCROLL), bw = await ev(BOARD_W), want = MAIN_OVER[`${w}x${h}`];
        if (s.h > s.vh || s.w > s.vw) bad[state].push(`${h} (${s.w}×${s.h})`);
        if (bw < want - 0.5) small.push(`${h} ${state}: ${r1(bw)} (main ${want})`);
      }
    };
    const d = { w, h: hs[0], dpr: touch ? 2 : 1, desktop: !touch };
    await open(d);
    await sweep('the start card');
    await toRound();
    await ev(FILL);
    await sweep('playing, the chatter full');
    await ev(`window.__autoRaf = true; 'ok'`);
    await open(d);
    await toRound('watch');
    await ev(FILL);
    await sweep('watching, the chatter full');
    await ev(`window.__autoRaf = true; 'ok'`);
    for (const [state, list] of Object.entries(bad)) check(!list.length, `${tag}, ${hs[0]} to ${hs[hs.length - 1]} px tall, every 80: ${state}, nothing scrolls`, list.length ? `scrolls at ${list.join(', ')}` : `${hs.length} heights`);
    check(!small.length, `${tag}, ${hs[0]} to ${hs[hs.length - 1]} px tall, every 80: the board is never smaller than on main before the page was one screen tall`, small.join('; ') || hs.map(h => `${h}: ${MAIN_OVER[`${w}x${h}`]}`).join(', '));
  }
}
