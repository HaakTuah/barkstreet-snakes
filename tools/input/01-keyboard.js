// ---------------------------------------------------------- keyboard
await b.viewport(1280, 800);
await b.go(site.url + '?debug');

// The start card: Space, E and Shift start nothing; a Tabbed-to Play takes Space.
await b.sleep(300);
for (const k of [' ', 'e', 'ShiftLeft', 'ShiftRight']) await key(k);
await b.sleep(100);
check(await state() === 'ready', 'the start card: Space, E and Shift start nothing');
const seatsFirst = [];
for (let i = 0; i < 3; i++) { await key('Tab'); seatsFirst.push(await ev(`document.activeElement?.dataset?.seat ?? ''`)); }
check(seatsFirst.join() === '0,1,2', "the start card: Tab goes through the rivals' seats first, then Play", `seats ${seatsFirst.join()}`);
await key('Tab');
const focused = await ev(`document.activeElement?.id || document.activeElement?.className`);
await key(' ');
await b.sleep(100);
check(focused === 'start' && await state() !== 'ready', 'the start card: Play, Tabbed to, takes Space', `focus on ${focused}`);

// An arrow the way you face starts the round, and fires no power.
await ev(`window.__autoRaf = true; 'ok'`);
await b.go(site.url + '?debug');
await b.sleep(300);
await ev(`(() => { const E = window.SnakeEngine; window.__early = 0; for (const n of ['leap', 'flash']) { const f = E[n]; E[n] = (g, s) => { __early++; return f(g, s); }; } return 'ok'; })()`);
const faces = await ev(`Object.keys(SnakeEngine.DIRS).find(k => SnakeEngine.DIRS[k] === SnakeDebug.game().snakes[0].dir)`);
await key({ right: 'ArrowRight', left: 'ArrowLeft', up: 'ArrowUp', down: 'ArrowDown' }[faces]);
await b.sleep(150);
const started = await ev(`({ s: SnakeDebug.state(), early: __early, armed: [SnakeDebug.game().snakes[0].leapArmed, SnakeDebug.game().snakes[0].flashArmed] })`);
check(started.s === 'running' && started.early === 0 && started.armed.every(v => v < 0), 'an arrow ahead on the start card starts the round, and no power', JSON.stringify(started));

await freshRound();

// Space jumps, E and Shift flash: asked for on the press, gone on the next tick.
const pressLat = { jump: [], flash: [] };
for (const [k, kind, ev1] of [[' ', 'leap', 'leap'], ['e', 'flash', 'dash:plain'], ['ShiftLeft', 'flash', 'dash:plain'], ['ShiftRight', 'flash', 'dash:plain']]) {
  let ok = 0;
  for (let n = 0; n < 12; n++) {
    await ev('centre()');
    await ev(`vf(${Math.floor(Math.random() * 8)})`);
    if (kind === 'leap') await ev(`(() => { const g = SnakeDebug.game(), me = g.snakes[0], h = me.body[0]; g.holes.add(h.y * 24 + h.x + 1); return 'ok'; })()`); // (something to hop)
    const u = Math.random(), before = await powers(), steps = await ev('__log.steps.length');
    await ev(`window.__vt += ${u * P}; 'ok'`); // (the press lands part-way through a frame)
    const at = await ev('__vt');
    await key(k);
    await ev(`window.__vt -= ${u * P}; 'ok'`);
    const asked = await ev(`__log.powers.slice(${before})`);
    await toTick();
    const step = await ev(`__log.steps[${steps}]`);
    await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
    if (asked.length === 1 && asked[0].kind === kind && step?.evs.includes(ev1)) ok++;
    if (step) pressLat[kind === 'leap' ? 'jump' : 'flash'].push(step.vt - at);
  }
  check(ok === 12, `${k === ' ' ? 'Space' : k} ${kind === 'leap' ? 'jumps' : 'flashes'} on the next tick`, `${ok}/12`);
}

// Pressing the way you're going, and holding a key, fire nothing.
await ev('centre()');
let before = await powers();
for (const k of ['ArrowRight', 'd', 'ArrowRight']) { await key(k); await ev('vf(3)'); }
const queued = await ev('SnakeDebug.game().snakes[0].queue.length');
check(await powers() === before && queued === 0, 'pressing the way you’re going does nothing', `queue ${queued}`);
for (const k of [' ', 'e', 'ShiftLeft']) {
  await ev('centre()');
  before = await powers();
  await down(k);
  for (let i = 0; i < 6; i++) { await ev('vf(2)'); await down(k, true); } // (the keyboard's auto-repeat)
  await up(k);
  check(await powers() - before === 1, `${k === ' ' ? 'Space' : k} held down fires once`, `${await powers() - before} asked`);
}
await ev('centre()');
before = await powers();
await down('ArrowUp');
for (let i = 0; i < 6; i++) { await ev('vf(2)'); await down('ArrowUp', true); }
await up('ArrowUp');
await toTick();
check(await powers() === before, 'an arrow held down (auto-repeat) fires no power');

// Two presses in one tick turn on consecutive ticks.
let pairs = 0;
for (let n = 0; n < 20; n++) {
  await ev('centre()');
  await ev(`vf(${2 + Math.floor(Math.random() * 6)})`);
  const steps = await ev('__log.steps.length');
  await key('ArrowUp'); await key('ArrowLeft');
  await toTick(); await toTick();
  const [a, c] = await ev(`__log.steps.slice(${steps}, ${steps + 2}).map(s => dirName(s.dir))`);
  if (a === 'up' && c === 'left') pairs++;
}
check(pairs === 20, 'two presses in one tick turn on consecutive ticks', `${pairs}/20`);

// Press to tick: a turn reaches the engine within one tick and one frame.
const turnLat = [];
let late = 0;
for (let n = 0; n < 60; n++) {
  await ev('centre()');
  await ev(`vf(${Math.floor(Math.random() * 8)})`);
  const u = Math.random(), steps = await ev('__log.steps.length');
  await ev(`window.__vt += ${u * P}; 'ok'`);
  const at = await ev('__vt');
  await key(n % 2 ? 'ArrowUp' : 'ArrowDown');
  await ev(`window.__vt -= ${u * P}; 'ok'`);
  await toTick();
  const step = await ev(`__log.steps[${steps}]`);
  if (!step || step.dir.y === 0) { late++; continue; }
  turnLat.push(step.vt - at);
  if (step.vt - at > step.len + P + 0.01) late++;
}
const allLat = [...turnLat, ...pressLat.jump, ...pressLat.flash];
check(late === 0 && Math.max(...allLat) <= 120 + P + 0.01, 'every press reaches the engine within a tick and a frame', `turns ${JSON.stringify(stats(turnLat))}`);

// Napping: P and Esc nap and wake; Space, E and Shift don't wake; the
// press that wakes, and the arrow that skips the wake beat, fire nothing.
await ev('centre()');
before = await powers();
await key('p'); await ev('vf(2)');
const napped = await state();
for (const k of [' ', 'e', 'ShiftRight']) { await key(k); await ev('vf(2)'); }
const stillNapping = await state();
await key('p'); await ev('vf(2)');
const waking = await state();
await key('ArrowRight'); await ev('vf(2)');
const awake = await state();
await key('Escape'); await ev('vf(2)');
const napped2 = await state();
await key('Escape'); await ev('vf(30)');
check(napped === 'paused' && stillNapping === 'paused' && waking === 'countdown' && awake === 'running' && napped2 === 'paused' && await state() === 'running' && await powers() === before,
  'P and Esc nap and wake; Space, E and Shift don’t; waking fires no power', [napped, stillNapping, waking, awake, napped2].join(' '));

// Start over? (R): Space doesn't answer it; an arrow ahead keeps going, and fires nothing.
before = await powers();
await key('r'); await ev('vf(2)');
const asking = await ev(`({ s: SnakeDebug.state(), title: document.getElementById('overlay-title').textContent })`);
await key(' '); await ev('vf(2)');
const still = await state();
await key('ArrowRight'); await ev('vf(2)');
check(asking.s === 'paused' && /Start over/.test(asking.title) && still === 'paused' && await state() === 'running' && await powers() === before, 'Start over?: Space doesn’t answer, an arrow ahead keeps going, no power');

// Your death card: Space, E and Shift don't dismiss it or start a round
// (even with Play again focused); Esc keeps watching.
await ev(`(() => { const g = SnakeDebug.game(), me = g.snakes[0]; me.body = [{ x: 23, y: 5 }, { x: 22, y: 5 }, { x: 21, y: 5 }]; me.prev = null; me.dir = SnakeEngine.DIRS.right; me.queue.length = 0; return 'ok'; })()`);
await toTick();
await ev('vf(40)');
const card = await ev(`({ alive: SnakeDebug.game().snakes[0].alive, up: cardUp(), title: document.getElementById('overlay-title').textContent })`);
await ev(`document.getElementById('start').focus(); 'ok'`);
for (const k of [' ', 'e', 'ShiftLeft', ' ']) { await key(k); await ev('vf(2)'); }
const kept = await ev(`({ up: cardUp(), s: SnakeDebug.state(), title: document.getElementById('overlay-title').textContent, tick: SnakeDebug.game().tick > 0 })`);
await key('Escape'); await ev('vf(2)');
const watching = await ev(`({ up: cardUp(), s: SnakeDebug.state() })`);
check(!card.alive && card.up && kept.up && kept.s === 'running' && kept.title === card.title && !watching.up && watching.s === 'running',
  'your death card: Space, E and Shift leave it be; Esc keeps watching', `${card.title}`);

// The round-over card: Space doesn't start the next round.
await ev(`(() => { const g = SnakeDebug.game(); g.snakes[1].alive = false; g.snakes[2].alive = false; return 'ok'; })()`);
await toTick();
await ev('vf(60)');
const over = await ev(`({ s: SnakeDebug.state(), up: cardUp() })`);
await ev(`document.getElementById('start').focus(); 'ok'`);
for (const k of [' ', 'e', 'ShiftRight']) { await key(k); await ev('vf(2)'); }
check(over.s === 'over' && over.up && await state() === 'over', 'the round-over card: Space, E and Shift start nothing', JSON.stringify(over));

// The rivals think about their next move in the frames after a tick (not
// the tick's own, while there are frames enough), and every one has before
// the board is drawn into it: at full speed (90 ms ticks) on a 60 Hz
// screen, and on a 30 Hz one (a phone saving power), you playing.
const thought = [];
for (const hz of [60, 30]) {
  await startRound();
  thought.push(await ev(`(() => {
    const E = SnakeEngine, R = SnakeRender, AI = SnakeAI, dt = 1000 / ${hz}, mind = {};
    E.tickMs = () => 90;
    const st = { hz: ${hz}, ticks: 0, crossings: 0, unplanned: 0, tickFrames: 0, thoughtOnTick: 0 };
    let lead = 0, crossed = -1, ticked = false, thinks = 0;
    const setLead = R.setLead; R.setLead = t => { lead = t; return setLead(t); };
    const think = E.thinkAhead; E.thinkAhead = (g, s) => { thinks++; return think(g, s); };
    const step = E.step; E.step = g => { ticked = true; return step(g); };
    const frame = R.frame; R.frame = (alpha, now) => {
      const g = SnakeDebug.game();
      if (alpha + lead > 1 && crossed !== g.tick) { // (drawn into the next move: everyone who can think has)
        crossed = g.tick; st.crossings++;
        for (const s of g.snakes) if (s !== g.snakes[0] && E.canThinkAhead(g, s)) st.unplanned++;
      }
      return frame(alpha, now);
    };
    let last = -1;
    for (let i = 0; i < ${hz} * 20; i++) {
      const g = SnakeDebug.game(), me = g.snakes[0];
      if (SnakeDebug.state() !== 'running' || !me.alive) break;
      if (g.tick !== last) { // (you, steered as a careful player would, and nobody starving)
        last = g.tick;
        const d = AI.decide(E.aiView(g, me), E.PERSONAS.drab, mind);
        if (d !== me.dir && !me.queue.length) me.queue.push(d);
        for (const s of g.snakes) s.nextStarve = Math.max(s.nextStarve, g.time + 5000);
      }
      ticked = false; thinks = 0;
      SnakeDebug.frames(1, dt);
      if (ticked) { st.tickFrames++; if (thinks) st.thoughtOnTick++; }
    }
    st.ticks = SnakeDebug.game().tick;
    return st;
  })()`));
}
check(thought.every(t => t.crossings >= 100 && !t.unplanned) && !thought[0].thoughtOnTick,
  'the rivals have all thought before the board is drawn into their next move (60 and 30 Hz, full speed); at 60 Hz never in the frame that ticked',
  thought.map(t => `${t.hz} Hz: ${t.unplanned} unplanned in ${t.crossings} ticks, ${t.thoughtOnTick} of ${t.tickFrames} tick frames thought`).join('; '));
