// Where a banner goes (DESIGN "Teaching by showing"). On a phone held
// upright, above the board, over the header's title row, whatever's on
// the board. Elsewhere it stays where it is on the board while its place
// is clear: a head coming into it moves it to the other place (the top,
// the foot) if that's clear, and with heads in both it fades where it
// is; never the middle of the board. (Picked afresh every frame, it went
// back to the top the moment that cleared, and hopped about three times
// in its three seconds on a short phone.)
await ev('centre()');
await ev(`(() => {
  const E = SnakeEngine;
  window.put = (id, x, y, dir = 'right') => { const s = SnakeDebug.game().snakes[id], d = E.DIRS[dir]; s.body = s.body.map((c, i) => ({ x: x - d.x * i, y: y - d.y * i })); s.prev = null; s.dir = d; s.queue.length = 0; return 'ok'; };
  window.slot = () => { const t = document.getElementById('toast'); return t.hidden ? 'hidden' : (t.classList.contains('above') ? 'above' : t.classList.contains('low') ? 'foot' : t.classList.contains('mid') ? 'middle' : 'top') + (t.classList.contains('under') ? ' faded' : ''); };
  // (its middle, from the board's top, in boards: the top or the foot is under a quarter in from its edge)
  window.slotAt = () => { const t = document.getElementById('toast').getBoundingClientRect(), g = document.getElementById('game').getBoundingClientRect(); return ((t.top + t.bottom) / 2 - g.top) / g.height; };
  const step = E.step; E.step = g => { const out = step(g); if (window.__news) { g.events.push(window.__news); window.__news = null; } return out; }; // (news, on the next tick)
  return 'ok';
})()`);
const golden = async () => { await ev('vadvance(6000)'); await ev(`(() => { delete SnakeDebug.game().told?.golden; window.__news = { type: 'spawn', kind: 'golden' }; return 'ok'; })()`); await toTick(); }; // (the banner free: news)
await ev(`put(1, 12, 22, 'down')`); // (a rival's head at the foot)
await ev('put(0, 12, 2)'); // (yours at the top)
await golden();
const upright = [await ev('slot()')];
await ev('put(0, 12, 21)'); await ev('vf(1)');
upright.push(await ev('slot()'));
check(upright.join(', ') === 'above, above', 'on a phone held upright, a banner is above the board, whatever heads are at its top or foot', upright.join(', '));
await b.viewport(1280, 800);
await ev('new Promise(r => __raf(() => __raf(() => __raf(r))))');
await ev('put(0, 12, 6)'); // (yours in neither place)
await golden();
const slots = [await ev('slot()')], at = [await ev('slotAt()')];
for (const [moves, why] of [
  [['put(0, 12, 1)'], 'yours at the top, a rival at the foot'],
  [[`put(1, 0, 12, 'down')`], 'the rival away'],
  [['put(0, 12, 6)'], 'yours out again'],
  [[`put(2, 12, 22, 'down')`], 'another rival at the foot'],
  [['put(0, 12, 1)'], 'yours at the top too'],
]) {
  for (const m of moves) await ev(m);
  await ev('vf(1)');
  slots.push(`${why}: ${await ev('slot()')}`);
  at.push(await ev('slotAt()'));
}
check(slots.map(s => s.replace(/^.*: /, '')).join(', ') === 'top, top faded, foot, foot, top, top faded',
  'a banner stays put while its place is clear, moves only when a head comes into it, and fades where it is with heads in both places', slots.join('; '));
check(at.every(f => f < 0.25 || f > 0.75) && !slots.some(s => s.includes('middle')), 'a banner is never in the middle of the board: at its top or its foot', at.map(f => f.toFixed(2)).join(', '));
await b.viewport(390, 844, { scale: 3, mobile: true });
await ev('new Promise(r => __raf(() => __raf(() => __raf(r))))');

// Squashing your own bead, as the page tells it (round six B; the engine's
// squashes staged by hand, as it makes them): your first squash's lesson
// and its splat, a second squash's splat and no second lesson; a rival's
// splat, heard as a rival's. (What the page asks to play: the cues
// themselves are audio/'s.)
await ev(`(() => {
  const E = SnakeEngine, A = SnakeAudio, play = A.play, g = SnakeDebug.game();
  window.__heard = [];
  A.play = (name, opts) => { if (name === 'squash') __heard.push({ name, rival: !!opts?.rival, tick: SnakeDebug.game().tick }); return play(name, opts); };
  Object.assign(g.told ||= {}, { beetle: true, goldBeetle: true, leaf: true, goldcap: true, burrow: true, rainbow: true, baked: true }); // (no news on the tick to speak first)
  g.toldField = true; g.weather.until = Infinity; // (nor a rival's land or a change of weather taking the banner: the round's rivals and sky are random, and either held the lessons below out of their turn on CI)
  const step = E.step; E.step = g => { const out = step(g); const f = window.__staged; window.__staged = null; if (f) f(g); return out; };
  // A squash on the next tick.
  window.stageSquash = id => { window.__staged = g => { const s = g.snakes[id], h = s.body[0]; g.events.push({ type: 'squash', snake: s, x: h.x, y: h.y }); }; return 'ok'; };
  window.toastText = () => { const t = document.getElementById('toast'); return t.hidden ? '' : t.textContent; };
  return 'ok';
})()`);
await ev('vadvance(5300)'); // (the banner before has had its time: its reading time, its fade and a breather)
await ev('stageSquash(0)');
await toTick();
const squashed = await ev(`({ tick: SnakeDebug.game().tick, toast: toastText() })`);
await toTick(); await toTick();
await ev('stageSquash(0)'); // (another of your beads)
await toTick();
await ev('vadvance(4200)'); // (the lesson's words: 1 s and 0.4 s a word, its fade and a breather)
const later = await ev('toastText()');
const mine = await ev('__heard.splice(0)');
await ev('stageSquash(1)');
await toTick(); await toTick();
const theirs = await ev('__heard.splice(0)');
const said = list => list.map(h => `${h.name}${h.rival ? '~' : ''}@${h.tick - squashed.tick}`).join(' ');
check(squashed.toast === 'Your own beads feed nobody.' && said(mine) === 'squash@0 squash@3',
  'your first squash: its lesson and its splat; the next, its splat alone', `“${squashed.toast}”; heard ${said(mine)}`);
check(later !== squashed.toast, '...the lesson only once', `“${later}”`);
check(theirs.length === 1 && theirs[0].rival, 'a rival’s squash is heard as a rival’s', theirs.map(h => `${h.name}${h.rival ? '~' : ''}`).join(' '));
