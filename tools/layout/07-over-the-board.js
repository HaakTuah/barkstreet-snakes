// ---------------------------------- over the board, the board first
// Near-square and narrow windows and touch screens held upright, the
// header over the board (STACKED): playing and watching with the
// chatter full, the board as big as on main (pinned), nothing scrolls,
// the chatter's lines whole or none (its switch there), the help in the
// row under the board and never squeezed past its box or the screen's
// edge (watching on a touch screen it ran under the switch and off the
// screen, and a narrow window's keys took four to six lines, scrolling
// the page: now it gives way), and the speed buttons in the row, taking
// a tap.
for (const d of STACKED) {
  if (only && !d.name.includes(only)) continue;
  const tag = d.name;
  await open(d);
  await toRound();
  const play = await ev(LAYOUT);
  check(play.board.w >= d.main - 0.5, `${tag}: playing, the board is no smaller than on main, ${d.main} px`, `${r1(play.board.w)} px`);
  check(!play.help || (play.help.y >= play.foot.y - 0.5 && play.help.b <= Math.min(play.foot.b, play.vh) + 0.5 && play.help.r <= play.vw + 0.5), `${tag}: playing, the help is in the row under the board and on the screen, or gives way`, play.help ? `${r1(play.help.y)}-${r1(play.help.b)}, the row ${r1(play.foot.y)}-${r1(play.foot.b)} of ${play.vh}` : 'given way');
  check(await ev(`(() => { const h = document.getElementById('help'); return h.scrollWidth <= h.clientWidth + 1; })()`), `${tag}: playing, the help line isn't cut off at the side`);
  await chatterFull(tag, false);
  await ev(`window.__autoRaf = true; 'ok'`);
  await open(d);
  await toRound('watch');
  const watch = await ev(LAYOUT);
  const reach = await ev(REACH('#speed button, #chatter-toggle'));
  check(reach.length === 4 && reach.every(r => r.on && r.taps) && watch.speed.y >= watch.foot.y - 0.5 && watch.speed.b <= watch.foot.b + 0.5, `${tag}: watching, the speed buttons and the chatter's switch are in the row under the board, on the screen, and take a tap`, reach.filter(r => !r.on || !r.taps).map(r => r.what).join(', ') || 'all four');
  const squeezed = await ev(`(() => { const h = document.getElementById('help'); return !!h.getClientRects().length && (h.scrollWidth > h.clientWidth + 1 || h.getBoundingClientRect().right > innerWidth + 0.5); })()`);
  check(!squeezed && watch.scrollW <= watch.vw, `${tag}: watching, the help isn't squeezed past its box or the screen's edge (it gives way), and nothing scrolls sideways`, `${watch.scrollW} of ${watch.vw}${watch.help ? `, the help ${r1(watch.help.x)}-${r1(watch.help.r)}` : ', the help given way'}`);
  await chatterFull(tag, true);
  await ev(`window.__autoRaf = true; 'ok'`);
}
