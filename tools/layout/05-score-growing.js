// ------------------------------------------------ Score and Best growing
// Held upright, Score and Best growing from 0 to 99, 100 and 1000 in a
// round held still (Best following Score past it): the header keeps its
// rows, and the board its size and place. (At 390×545-600 and 412×604
// the header grew a row at 100 or 1000, the page measured it again, and
// the board shrank in the middle of a round; taller, it moved down.)
for (const [w, h, dpr] of [[390, 545, 3], [390, 560, 3], [390, 575, 3], [390, 590, 3], [390, 600, 3], [412, 604, 2.625], [414, 622, 3], [428, 640, 3], [390, 844, 3], [375, 548, 2], [360, 640, 3], [344, 600, 3], [320, 460, 2]]) {
  if (only && !String(w).includes(only)) continue;
  await open({ w, h, dpr });
  await ev(`localStorage.setItem('snake-best', '0'); 'ok'`); // (your Best from the rounds before: none)
  await open({ w, h, dpr });
  await toRound();
  const at = [];
  for (const n of [0, 99, 100, 1000]) {
    await ev(`(() => { for (let i = 0; i < 60 && document.getElementById('score').textContent !== '${n}'; i++) { SnakeDebug.game().snakes[0].eaten = ${n}; SnakeDebug.frames(1); } return 'ok'; })()`); // (shown after the next tick)
    await settle(); await b.sleep(60); await settle(); // (the page measures what's above the board a moment after the header changes)
    at.push({ n, ...(await ev(`(() => { const g = document.getElementById('game').getBoundingClientRect(), hd = document.querySelector('header').getBoundingClientRect(); return { w: g.width, x: g.x, y: g.y, head: hd.height, score: document.getElementById('score').textContent, best: document.getElementById('best').textContent }; })()`)) });
  }
  const moved = at.filter(q => ['w', 'x', 'y', 'head'].some(k => Math.abs(q[k] - at[0][k]) > 0.25));
  const shown = at.every(q => q.score === String(q.n) && q.best === String(q.n));
  check(shown && !moved.length, `${w}×${h}: as Score and Best grow (0, 99, 100, 1000), the header keeps its rows and the board its size and place`,
    moved.length ? moved.map(q => `at ${q.n}: the header ${r1(q.head)} px (from ${r1(at[0].head)}), the board ${r1(q.w)} at ${r1(q.x)},${r1(q.y)} (from ${r1(at[0].w)} at ${r1(at[0].x)},${r1(at[0].y)})`).join('; ') : `the board ${r1(at[0].w)} at ${r1(at[0].x)},${r1(at[0].y)}, the header ${r1(at[0].head)} px${shown ? '' : '; Score and Best not shown as set'}`);
  await ev(`window.__autoRaf = true; 'ok'`);
}
