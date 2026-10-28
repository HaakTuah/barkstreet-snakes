// ------------------------------------------- the cards that come by themselves
// Your death's card and the round's end, on the smallest screens and the
// owner's: their buttons on the screen and taking a tap.
for (const d of DEVICES.filter(x => [320, 640, 780].includes(x.w) || (x.w === 390 && !x.insets))) {
  await open(d);
  await ev(HELPERS);
  await toRound();
  await ev(`window.__autoRaf = true; __kill.push(0); 'ok'`);
  const died = await ev(`waitFor(() => cardUp(), 8000).then(() => true, () => false)`);
  await b.sleep(650); // (it takes no tap for a moment)
  let reach = await ev(REACH('#overlay .buttons button'));
  check(died && reach.length >= 2 && reach.every(r => r.on && r.taps), `${d.name}: your death's card and its buttons take a tap`, reach.map(r => `${r.what}${r.on && r.taps ? '' : ' (cut off)'}`).join(', '));
  const pair = await ev(`(() => { const g = document.getElementById('game').getBoundingClientRect(), c = document.querySelector('#overlay .card').getBoundingClientRect(); return { board: g.height, card: c.height, tops: [...document.querySelectorAll('#overlay .buttons button:not(.text-button)')].filter(el => el.getBoundingClientRect().width).map(el => el.getBoundingClientRect().top) }; })()`);
  if (pair.board <= 330) check(pair.tops.length === 2 && Math.abs(pair.tops[0] - pair.tops[1]) < 2, `${d.name}: on a ${Math.round(pair.board)} px board, your death's card has its two buttons side by side (stacked, they'd cover the board)`, `the card ${Math.round(pair.card)} px tall`);
  await ev(`document.getElementById('watch').click(); __kill.push(2, 3); 'ok'`); // (keep watching; then the round ends)
  const over = await ev(`waitFor(() => SnakeDebug.state() === 'over' && cardUp(), 15000).then(() => true, () => false)`);
  await b.sleep(650);
  reach = await ev(REACH('#overlay .buttons button'));
  check(over && reach.length >= 2 && reach.every(r => r.on && r.taps), `${d.name}: the round's end card and its buttons take a tap`, reach.map(r => `${r.what}${r.on && r.taps ? '' : ' (cut off)'}`).join(', '));
}

// ------------------------------------------------------- full screen
// A tap on the button (a real touch: full screen needs one) goes in, and
// another comes out; its label and icon say which way it goes. Where the
// browser can't (an iPhone), there's no button.
const fsTap = async want => {
  const r = await ev(`document.getElementById('fullscreen').getBoundingClientRect().toJSON()`);
  const at = { x: r.x + r.width / 2, y: r.y + r.height / 2, id: 1 };
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await b.sleep(400);
  // (on a busy machine the change can come later: up to two seconds for the screen to change and the button to follow)
  await ev(`new Promise(done => { const f = document.getElementById('fullscreen'), t0 = performance.now(); (function wait() { if ((!!document.fullscreenElement === ${want} && f.dataset.full === '${want}') || performance.now() - t0 > 2000) done(1); else setTimeout(wait, 50); })(); })`);
  return ev(`(() => { const f = document.getElementById('fullscreen'); return { full: !!document.fullscreenElement, label: f.getAttribute('aria-label'), icon: f.dataset.full }; })()`);
};
for (const d of [CALLS, CALLS_SIDE]) {
  await open(d);
  const shown = await ev(`document.fullscreenEnabled && !document.getElementById('fullscreen').hidden`);
  const was = await ev(`document.getElementById('fullscreen').getAttribute('aria-label')`);
  const into = await fsTap(true), out = await fsTap(false);
  check(shown && was === 'Full screen' && into.full && into.label === 'Leave full screen' && into.icon === 'true' && !out.full && out.label === 'Full screen' && out.icon === 'false',
    `${d.name}: the full screen button is there, a tap goes in and another comes out, its label following`, `"${was}" → ${into.full ? 'full' : 'not full'}, "${into.label}" → ${out.full ? 'full' : 'not full'}, "${out.label}"`);
}
await open(CALLS, '&nofs');
const noFs = await ev(`(() => { const f = document.getElementById('fullscreen'); return f.hidden && !f.getBoundingClientRect().width; })()`);
const buttonsNoFs = await ev(`[...document.querySelectorAll('header .hud button')].filter(el => el.getBoundingClientRect().width).length`);
check(noFs && buttonsNoFs === 5, 'where the browser has no full screen for a page (an iPhone), there\'s no button', `${buttonsNoFs} buttons in the header`);

// ----------------------------------------------------- the screen awake
// What the stand-in wake lock was asked, step by step: request, release,
// lost (the browser let go, as for a hidden tab).
await open(CALLS);
await ev(HELPERS);
const expect = async (what, wantHeld, wantLog) => {
  await b.sleep(60);
  const h = await ev(`!!__wake.held`), log = await ev(`__wake.log.join(' ')`);
  check(h === wantHeld && log === wantLog, `the screen stays awake: ${what}`, `${h ? 'held' : 'not held'}; asked: ${log || 'nothing'}${log === wantLog ? '' : `, wanted ${wantLog || 'nothing'}`}`);
};
await expect('the start card: not held', false, '');
await ev(`document.getElementById('start').click(); 'ok'`);
await expect('the countdown: held', true, 'request');
await ev(`SnakeDebug.frames(80); 'ok'`);
check(await ev('SnakeDebug.state()') === 'running', 'the round is going');
await expect('playing: still held, asked once', true, 'request');
await ev(`document.getElementById('pause').click(); 'ok'`);
await expect('a nap lets it go', false, 'request release');
await ev(`document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
await expect('waking asks again', true, 'request release request');
await ev(`document.getElementById('records-open').click(); 'ok'`);
await expect('the Hall of Fame (a nap) lets it go', false, 'request release request release');
await ev(`document.getElementById('records-close').click(); 'ok'`);
await expect('closing it, still napping: not asked', false, 'request release request release');
await ev(`document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
await expect('waking again', true, 'request release request release request');
await ev(`__wake.log.length = 0; __setHidden(true); 'ok'`);
await expect('a hidden tab loses it (and naps)', false, 'lost');
await ev(`__setHidden(false); 'ok'`);
await expect('back, but napping: not asked', false, 'lost');
await ev(`document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
await expect('waking asks', true, 'lost request');
await ev(`__wake.log.length = 0; __lose(); 'ok'`);
await expect('lost while the round goes on (the browser let go)', false, 'lost');
await ev(`document.dispatchEvent(new Event('visibilitychange')); 'ok'`);
await expect('the tab shown again: asked again, as it\'s still wanted', true, 'lost request');
await ev(`__wake.log.length = 0; window.__autoRaf = true; __kill.push(0); 'ok'`);
await ev(`waitFor(() => cardUp(), 8000).then(() => 1)`);
await expect('your death\'s card lets it go', false, 'release');
await ev(`document.getElementById('watch').click(); 'ok'`);
await expect('keep watching: held', true, 'release request');
await ev(`__kill.push(2, 3); 'ok'`);
await ev(`waitFor(() => SnakeDebug.state() === 'over', 15000).then(() => 1)`);
await expect('the round over: let go', false, 'release request release');
await ev(`waitFor(() => cardUp(), 8000).then(() => 1)`);
await b.sleep(600); // (the card takes no tap for a moment)
await ev(`__wake.log.length = 0; document.getElementById('watch').click(); 'ok'`); // (Watch AIs)
await expect('an AI round to watch: its countdown, held', true, 'request');
await ev(`SnakeDebug.frames(80); 'ok'`);
check(await ev('SnakeDebug.state() === "running" && !SnakeDebug.game().withPlayer'), 'an AI round is being watched');
await expect('watching: held', true, 'request');
await ev(`document.getElementById('pause').click(); 'ok'`);
await expect('napping the watched round lets it go', false, 'request release');
await ev(`__wake.log.length = 0; __wake.refuse = true; document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
await ev(`SnakeDebug.frames(40); document.querySelector('#speed button[data-speed="2"]').click(); SnakeDebug.frames(10); 'ok'`); // (more changes while it's still wanted)
await expect('refused (a battery saver, say): asked once, not again and again', false, 'request');
await ev(`document.getElementById('pause').click(); __wake.refuse = false; document.getElementById('start').click(); SnakeDebug.frames(40); 'ok'`);
await expect('the next time it\'s wanted, asked again', true, 'request request');
await open(CALLS, '&nowake');
await toRound();
await ev(`window.__autoRaf = true; document.getElementById('pause').click(); 'ok'`);
check(await ev('typeof navigator.wakeLock === "undefined" && SnakeDebug.state() === "paused"'), 'with no wake lock at all, a round plays and naps as ever');

// ------------------------------------------------------------ swipes
// A real touch swipe on the board, across the way your snake is going, turns it.
for (const d of [CALLS, sized(320, 640), CALLS_SIDE, sized(640, 320)]) {
  await open(d);
  await toRound();
  const g = await ev(`(() => { const r = document.getElementById('game').getBoundingClientRect(), me = SnakeDebug.game().snakes[0], D = SnakeEngine.DIRS; return { x: r.x + r.width / 2, y: r.y + r.height / 2, across: me.dir === D.left || me.dir === D.right }; })()`);
  const way = g.across ? 'up' : 'right', dx = g.across ? 0 : 7, dy = g.across ? -7 : 0;
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.x, y: g.y, id: 1 }] });
  for (let i = 1; i <= 8; i++) {
    await b.sleep(16);
    await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: g.x + dx * i, y: g.y + dy * i, id: 1 }] });
  }
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await b.sleep(60);
  const turned = await ev(`(() => { const me = SnakeDebug.game().snakes[0], D = SnakeEngine.DIRS; return me.queue.includes(D.${way}) || me.dir === D.${way}; })()`);
  check(turned, `${d.name}: a swipe ${way} on the board turns your snake ${way}`);
  await ev(`window.__autoRaf = true; 'ok'`);
}
