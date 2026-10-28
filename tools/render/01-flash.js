// ------------------------------------------------- a flash, as drawn
// A real round, its loop stopped and stepped by hand on a virtual 60 Hz
// clock (vf(n): n frames), the rivals stunned out of the way, everyone
// held fed, its clock held at `time`. Each frame keeps where your head's
// drawn (__frames: x, y in cells) and the streaks drawn (__streaks), each
// tick your head's cells and what it did (__steps).
const round = async time => {
  await ev(`window.__autoRaf = true; 'ok'`);
  await b.go(site.url + '?debug', { settle: 0 });
  await ev('__settle()');
  await ev(`document.getElementById('start').click(); 'ok'`);
  // (the countdown on the virtual clock too: its frames, without waiting them out)
  const going = await ev(`(() => { window.__autoRaf = false; for (let i = 0; i < 600 && SnakeDebug.state() !== 'running'; i++) SnakeDebug.frames(1, 1000 / 60); return SnakeDebug.state(); })()`);
  if (going !== 'running') throw new Error('the round never started: ' + going);
  await ev(`(() => {
    window.__autoRaf = false;
    const E = SnakeEngine, step = E.step;
    window.__steps = []; window.__frames = []; window.__streaks = []; window.__parts = [];
    E.step = g => {
      const me = g.snakes[0], from = me.body[0].x, out = step(g);
      __steps.push({ frame: __frames.length, from, to: me.body[0].x, dash: g.events.some(e => e.type === 'dash' && e.snake === me), leap: g.events.some(e => e.type === 'leap' && e.snake === me) });
      g.food.length = 0; g.time = ${time}; g.weather.until = 1e12;
      for (const s of g.snakes) { s.nextStarve = 1e15; s.lastAte = g.time; }
      return out;
    };
    window.vf = n => { for (let i = 0; i < n; i++) { SnakeDebug.frames(1, 1000 / 60); const g = SnakeDebug.game(), o = SnakeRender.headPx(g.snakes[0], 1, TUNING.GRID * ${CELL}, {}); __frames.push({ x: o.x / ${CELL} - 0.5, y: o.y / ${CELL} - 0.5 }); __streaks.push(SnakeRender.streaked()); __parts.push(SnakeRender.particles); } };
    const g = SnakeDebug.game();
    g.snakes.forEach((s, i) => { if (i) { s.stunUntil = 1e9; const x = (i - 1) * 2; s.body = [{ x, y: 21 }, { x, y: 22 }, { x, y: 23 }]; s.prev = null; } });
    g.food.length = 0; g.time = ${time};
    for (const s of g.snakes) { s.nextStarve = 1e15; s.lastAte = g.time; } // (held fed: late in a round, hunger would end it)
    return 'ok';
  })()`);
  await ev('vf(40)'); // (past the opening's slower ticks)
};
// Frames until the next tick, and then n more.
const toTick = (n = 0) => ev(`(() => { const n0 = __steps.length; for (let i = 0; i < 14 && __steps.length === n0; i++) vf(1); vf(${n}); return 'ok'; })()`);
const KEYS = { e: ['KeyE', 69], ' ': ['Space', 32], ArrowUp: ['ArrowUp', 38] };
const press = async key => {
  const [code, vk] = KEYS[key];
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text: key.length === 1 ? key : undefined });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
};
const step = (frames, f) => Math.hypot(frames[f].x - frames[f - 1].x, frames[f].y - frames[f - 1].y); // (cells the head's drawn moving, frame f - 1 to f)
const FAST = 'TUNING.SUDDEN_DEATH_MS - 1000'; // (as fast as it gets before the woodpecker comes)
for (const { what, time, gold } of [
  { what: 'a flash at 120 ms ticks', time: 1000, gold: false },
  { what: 'a flash at full speed', time: FAST, gold: false },
  { what: 'a golden dash', time: 1000, gold: true },
]) {
  await round(time);
  await ev(`(() => { const g = SnakeDebug.game(), me = g.snakes[0]; me.body = [8, 7, 6, 5, 4, 3].map(x => ({ x, y: 12 })); me.prev = null; me.dir = SnakeEngine.DIRS.right; me.queue.length = 0; me.stunUntil = -1; me.flight = null; me.leapArmed = me.flashArmed = -1; me.flashReadyAt = 0; me.dashes = ${gold ? 2 : 0}; me.leaps = 0; return 'ok'; })()`);
  await ev('vf(12)');
  // Just after a tick, press E (early in the tick: the head still short of its cell's centre).
  await toTick(1);
  await press('e');
  await ev('vf(24)');
  const { steps, frames: drawn } = await ev('({ steps: __steps, frames: __frames })'), frames = drawn.map(f => f.x);
  const dash = steps.find(s => s.dash && s.to - s.from >= 2);
  if (!dash) { check(false, `${what}: it went`, 'no dash'); continue; }
  const prev = steps.filter(s => s.frame < dash.frame).pop(), seen = frames.slice(prev ? prev.frame : 0, dash.frame).some(x => x > dash.from + 1);
  check(seen, `${what}: shown before its tick`, `drawn ${frames.slice(dash.frame - 3, dash.frame).map(x => x.toFixed(2)).join(', ')} before the tick, from cell ${dash.from}`);
  const after = [];
  for (let f = dash.frame; f < dash.frame + 6 && f < frames.length; f++) after.push(frames[f] - frames[f - 1]);
  check(after.every(d => d > 0.04 && d < 0.45), `${what}: glides on, never standing still`, `steps a frame from its tick: ${after.map(d => d.toFixed(2)).join(', ')} cells`);
}

// Set right after a tick, to be right as the next one's done (the
// drawing reads the board once a tick): your snake along row 12 heading
// right, its head in column 8 once it's moved, rested, holding `dashes`
// golden flashes; and (page-side source) anything else.
const setUp = async (dashes, more = '') => {
  await toTick();
  await ev(`(() => {
    const g = SnakeDebug.game(), me = g.snakes[0], E = SnakeEngine;
    me.body = [7, 6, 5, 4, 3, 2].map(x => ({ x, y: 12 })); me.prev = me.body.map(c => ({ x: c.x - 1, y: c.y })); me.dir = E.DIRS.right; me.queue.length = 0;
    me.stunUntil = -1; me.flight = null; me.leapArmed = me.flashArmed = -1; me.flashReadyAt = me.leapReadyAt = 0; me.dashes = ${dashes}; me.leaps = 0; me.grow = 0;
    ${more}
    return 'ok';
  })()`);
  await toTick();
};

// A jump and a flash pressed together, a body one thick right in front:
// the game hops (the flash waits till it's landed), and so does the
// drawing. The head rises on toward it before the tick, never standing
// still nor sliding back, and no dash is drawn through the body (it was
// drawn guessing the flash: a plain one stood still for half a tick, a
// golden one dashed through the body and slid back once it leapt).
for (const gold of [false, true]) {
  const what = `Space and E together, a body right in front${gold ? ', golden flashes held' : ''}`;
  await round(1000);
  await setUp(gold ? 2 : 0, `const o = g.snakes[1]; o.body = [10, 11, 12, 13, 14].map(y => ({ x: 9, y })); o.prev = o.body.map(c => ({ ...c })); o.dir = E.DIRS.up; o.stunUntil = 1e9;`);
  await ev('vf(1)');
  const f0 = await ev('__frames.length');
  await press(' '); await press('e');
  await toTick(6);
  const { steps, frames, streaks } = await ev('({ steps: __steps, frames: __frames, streaks: __streaks })');
  const tick = steps.find(s => s.frame >= f0);
  check(!!tick && tick.leap && !tick.dash, `${what}: the game hops`, tick ? `${tick.leap ? 'a leap' : 'no leap'}${tick.dash ? ', and a dash' : ''}` : 'no tick');
  if (!tick) continue;
  const moves = [];
  for (let f = f0; f < tick.frame + 6 && f < frames.length; f++) moves.push(frames[f].x - frames[f - 1].x);
  check(moves.every(d => d > 0.04 && d < 0.45), `${what}: the head rises on, never standing still`, `steps a frame from the press: ${moves.map(d => d.toFixed(2)).join(', ')} cells (the tick after the ${tick.frame - f0 + 1}th)`);
  check(streaks.slice(f0, tick.frame).every(k => !k.length), `${what}: no dash drawn before the tick`);
}

// A flash, then a turn two frames later (E rolled into an arrow): the
// game takes the turn and flashes the new way. The drawing glides there,
// as fast as a dash goes, never leaping across (it jumped 1.8 cells in a
// frame, a golden one 3.3), and the streak goes the new way: none is
// left along the old row, and no flecks fly before the tick (a guess
// that's put right leaves none). At full speed the turn's press can land
// in the tick's own frame (the tick shows it went elsewhere): the same.
for (const { what, time, gold, e } of [
  { what: 'a flash, then a turn', time: 1000, gold: false, e: 3 },
  { what: 'a golden dash, then a turn', time: 1000, gold: true, e: 3 },
  { what: 'a flash at full speed, then a turn', time: FAST, gold: false, e: 2 },
]) {
  await round(time);
  await setUp(gold ? 2 : 0);
  const f0 = await ev('__frames.length');
  await ev(`vf(${e})`);
  await press('e');
  await ev('vf(2)');
  await press('ArrowUp');
  await ev('vf(14)');
  const { steps, frames, streaks, parts } = await ev('({ steps: __steps, frames: __frames, streaks: __streaks, parts: __parts })');
  const fa = f0 + e + 2, tick = steps.find(s => s.frame >= f0 + e);
  check(!!tick && tick.dash, `${what}: it flashed`, tick ? `the tick after the ${tick.frame - f0 + 1}th frame` : 'no tick');
  if (!tick) continue;
  const moves = [];
  for (let f = fa; f < fa + 10 && f < frames.length; f++) moves.push(step(frames, f));
  check(moves.every(d => d < 0.7), `${what}: the head glides to the new way, never leaping across`, `steps a frame from the turn: ${moves.map(d => d.toFixed(2)).join(', ')} cells${tick.frame === fa ? ' (its tick the turn’s frame)' : ''}`);
  const old = streaks.slice(fa).some(ks => ks.some(k => k.to[1] === 12 && k.to[0] > 8)), up = streaks.slice(tick.frame).some(ks => ks.some(k => k.to[0] === 8 && k.to[1] < 12));
  check(!old && up, `${what}: its streak goes the new way`, `${old ? 'one left along the old row' : 'none along the old row'}, ${up ? 'one going up' : 'none going up'}`);
  check(parts.slice(f0, tick.frame).every(n => n === 0), `${what}: no flecks before the tick`, `particles a frame: ${parts.slice(f0, tick.frame + 1).join(', ')}`);
}
