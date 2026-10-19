#!/usr/bin/env node
// The controls, in headless Chrome with real key, mouse and touch events (the
// DevTools protocol), on a virtual 60 Hz clock: the page's own animation loop
// is stopped and the game's frames are driven by hand (SnakeDebug.frames), so
// nothing else running on the machine can bend the timing. It checks what
// DESIGN promises:
// - Space jumps; E and either Shift flash; a tap jumps; a fresh swipe the way
//   you're going flashes.
// - Pressing the way you're going, a held key and its auto-repeat, and the
//   press that starts or wakes a round never fire a power.
// - Space, E and Shift never start, wake or dismiss anything (a button you
//   Tabbed to still takes Space).
// - Two presses in one tick turn on consecutive ticks; a press reaches the
//   engine within one tick and one frame.
// - Swipes never jump, over a sweep of finger speeds and angles (touch moves
//   arrive once a frame, as Chrome sends them, paced in real time so the
//   tap's own clock runs true); nor does a thumb resting before it swipes,
//   or while the other one swipes. A finger held still jumps before it lifts
//   only with something to hop; once it's lifted, a swipe after it leaves
//   that jump be (a held tap, then a flash). A quick tap that drifts 7-11 px as it lifts
//   still jumps; a long stroke 35-44° off the axis still turns; a double
//   flick the same way is the turn, not a flash.
// - Mashing jump over your death's card never starts a round, nor focuses
//   its name field (the phone's keyboard).
// - The mouse (real presses too): on the board, the left button jumps and the
//   right one flashes, with no menu popping up; both at once, the jump first;
//   the middle button, Ctrl and clicks off the board fire nothing; a card over
//   the board is the card's (its buttons do what they did); and mashing jump
//   with it never presses Play again or focuses the name field either.
// And two of the loop's own: the rivals have all thought before the board is
// drawn into their next move (at 30 frames a second too), and a banner keeps
// its place while that's clear. And choking as the page tells it: your first
// choke's and nudge's lessons, a choke's gag and its cough a beat later (once
// a cough), and a rival's heard as a rival's.
// And the beetles and the woodpecker as it tells them: a beetle digging in
// near you teaches its lesson and is heard as yours (a rival's, as a
// rival's), one that dug in goes under unheard while one down a burrow or up
// out of one scrabbles, the woodpecker's coming its rules, and knocked food
// is heard once a strike, quietly, where the first piece that flies was.
// It prints what it measured: press-to-tick, tap-to-jump and swipe latencies.
//
//   node tools/input-test.js
const { launch, serve } = require('./browser');

const P = 1000 / 60; // one frame
const results = [];
let failed = 0;
const check = (ok, what, detail = '') => {
  results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
};
const stats = list => {
  const s = [...list].sort((a, b) => a - b);
  return { n: s.length, mean: +(s.reduce((a, b) => a + b, 0) / (s.length || 1)).toFixed(1), median: +(s[s.length >> 1] ?? 0).toFixed(1), max: +(s[s.length - 1] ?? 0).toFixed(1) };
};

// Before the page's own scripts: a switch for its animation loop (and the
// browser's own, raw); and the page's endless decorations held still (the
// leaves swaying, the frame's sheen, the Play button's call: what reduced
// motion stills), so the frames the browser keeps making cost next to
// nothing while nothing moves. The controls are the same either way.
const PRE = `(() => {
  const raw = window.requestAnimationFrame.bind(window);
  window.__raf = raw;
  window.__autoRaf = true;
  window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); });
  document.addEventListener('DOMContentLoaded', () => {
    const still = document.createElement('style');
    still.textContent = 'h1 .amp, .leaves, .frame-sheen > i, #start::after, .toast::after, .chatlog li, .bubble > span, .scoreboard li.leader .len::before { animation: none !important; }';
    document.head.append(still);
  });
})();`;

// In the page, once a round is going: the virtual clock (vf), a log of every
// power asked for and every tick, a board held still (rivals stunned in a
// corner, no food, no hunger, the clock held so ticks stay 120 ms), and a
// way to put your snake back in the middle (centre).
const INSTRUMENT = `(() => {
  const E = window.SnakeEngine;
  window.__vt = 0;
  const L = window.__log = { powers: [], steps: [] };
  const wrap = name => { const f = E[name]; E[name] = (g, s) => { L.powers.push({ kind: name, vt: __vt, t: performance.now(), tick: g.tick }); return f(g, s); }; };
  wrap('leap'); wrap('flash');
  const step = E.step;
  E.step = g => {
    const me = g.snakes[0], before = { x: me.dir.x, y: me.dir.y };
    const out = step(g);
    L.steps.push({ vt: __vt, tick: g.tick, before, dir: { x: me.dir.x, y: me.dir.y }, evs: g.events.filter(e => e.snake === me).map(e => e.type + (e.plain ? ':plain' : '')), len: E.tickMs(g) });
    g.food.length = 0;
    g.time = 1000;
    g.weather.until = 1e12;
    for (const s of g.snakes) { s.nextStarve = 1e15; s.lastAte = g.time; }
    return out;
  };
  window.vf = n => { for (let i = 0; i < n; i++) { __vt += ${P}; SnakeDebug.frames(1, ${P}); } return SnakeDebug.state(); };
  window.toTick = () => { const n = L.steps.length; for (let i = 0; i < 20; i++) { vf(1); if (L.steps.length > n) break; } return 'ok'; };
  window.hold = () => {
    const g = SnakeDebug.game();
    g.snakes.forEach((s, i) => { if (i === 0) return; s.stunUntil = 1e9; const x = (i - 1) * 2; s.body = [{ x, y: 21 }, { x, y: 22 }, { x, y: 23 }]; s.prev = null; });
    g.food.length = 0; g.time = 1000; g.weather.until = 1e12;
    return 'ok';
  };
  window.centre = () => {
    const g = SnakeDebug.game(), me = g.snakes[0];
    me.body = [{ x: 12, y: 12 }, { x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }, { x: 7, y: 12 }];
    me.prev = null; me.dir = E.DIRS.right; me.queue.length = 0; me.stunUntil = -1; me.flight = null;
    me.leapArmed = -1; me.flashArmed = -1; me.leapReadyAt = 0; me.flashReadyAt = 0; me.leaps = 0; me.dashes = 0; me.turnedAt = null; me.heldReverse = null;
    return 'ok';
  };
  window.dirName = d => Object.keys(E.DIRS).find(k => E.DIRS[k].x === d.x && E.DIRS[k].y === d.y);
  // Your snake laid out heading this way (its body behind it), in the middle.
  window.face = name => { const me = SnakeDebug.game().snakes[0], d = E.DIRS[name]; me.body = me.body.map((c, i) => ({ x: 12 - d.x * i, y: 12 - d.y * i })); me.dir = d; me.prev = null; return 'ok'; };
  window.cardUp = () => !document.getElementById('overlay').classList.contains('hidden');
  return 'ok';
})()`;

// Touch (and the mouse over a card) runs on a virtual clock too: the page's
// timers (the tap's own among them) and its clock wait for vadvance(ms), and
// a finger's moves arrive once a frame, as a phone sends them. The browser
// keeps making frames, but the game's own stay stopped, so nothing moves on
// the board. Page-side: when each touch began, and when it first did
// something (a power, or a turn queued), on that clock.
const VCLOCK = `(() => {
  (function idle() { __raf(idle); })();
  const real = window.setTimeout.bind(window), unreal = window.clearTimeout.bind(window);
  const vc = window.__vclock = { now: 0, timers: new Map(), id: 1e6 }, base = performance.now();
  performance.now = () => base + vc.now;
  window.setTimeout = (fn, ms, ...args) => { const id = vc.id++; vc.timers.set(id, { at: vc.now + (ms || 0), fn: () => fn(...args) }); return id; };
  window.clearTimeout = id => { if (!vc.timers.delete(id)) unreal(id); };
  window.vadvance = ms => {
    const end = vc.now + ms;
    for (;;) {
      let due = null;
      for (const [id, t] of vc.timers) if (t.at <= end && (!due || t.at < due[1].at)) due = [id, t];
      if (!due) break;
      vc.timers.delete(due[0]);
      vc.now = due[1].at;
      due[1].fn();
    }
    vc.now = end;
    return 'ok';
  };
  window.__touch = { start: 0, did: 0, what: '', second: 0 };
  document.addEventListener('touchstart', () => { __touch.start = vc.now; __touch.did = 0; __touch.what = ''; __touch.second = 0; window.__q0 = SnakeDebug.game().snakes[0].queue.length; }, { capture: true, passive: true });
  const seen = () => {
    const me = SnakeDebug.game().snakes[0];
    if (!__touch.second && me.queue.length >= __q0 + 2) __touch.second = vc.now; // (a chained turn)
    if (!__touch.did && (me.queue.length !== __q0 || me.heldReverse)) { __touch.did = vc.now; __touch.what = 'turn'; }
  };
  document.addEventListener('touchmove', seen, { passive: true });
  for (const n of ['leap', 'flash']) { const f = SnakeEngine[n]; SnakeEngine[n] = (g, s) => { if (!__touch.did) { __touch.did = vc.now; __touch.what = n; } return f(g, s); }; }
  return 'ok';
})()`;

const KEYS = {
  ' ': { key: ' ', code: 'Space', vk: 32, text: ' ' },
  e: { key: 'e', code: 'KeyE', vk: 69, text: 'e' },
  ShiftLeft: { key: 'Shift', code: 'ShiftLeft', vk: 16, location: 1 },
  ShiftRight: { key: 'Shift', code: 'ShiftRight', vk: 16, location: 2 },
  ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', vk: 38 },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', vk: 40 },
  ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', vk: 37 },
  ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', vk: 39 },
  d: { key: 'd', code: 'KeyD', vk: 68, text: 'd' },
  p: { key: 'p', code: 'KeyP', vk: 80, text: 'p' },
  r: { key: 'r', code: 'KeyR', vk: 82, text: 'r' },
  Escape: { key: 'Escape', code: 'Escape', vk: 27 },
  Tab: { key: 'Tab', code: 'Tab', vk: 9 },
};

(async () => {
  const site = await serve();
  const b = await launch();
  const ev = expr => b.eval(expr);
  const down = (name, repeat = false) => { const k = KEYS[name]; return b.send('Input.dispatchKeyEvent', { type: k.text ? 'keyDown' : 'rawKeyDown', key: k.key, code: k.code, windowsVirtualKeyCode: k.vk, text: k.text, location: k.location || 0, autoRepeat: repeat }); };
  const up = name => { const k = KEYS[name]; return b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k.key, code: k.code, windowsVirtualKeyCode: k.vk, location: k.location || 0 }); };
  const key = async name => { await down(name); await up(name); };
  const powers = () => ev('__log.powers.length');
  const state = () => ev('SnakeDebug.state()');
  // A round started from a fresh start card, the page's loop stopped once it
  // runs (its countdown on the virtual clock too: its frames, without waiting
  // them out), drawn at the plainest quality (the controls don't care, and
  // each frame driven by hand costs a fraction).
  const startRound = async () => {
    await ev(`window.__autoRaf = true; 'ok'`);
    await b.go(site.url + '?debug', { settle: 0 });
    await ev('new Promise(r => __raf(() => __raf(r)))'); // (laid out)
    await ev(`document.getElementById('start').click(); 'ok'`);
    const going = await ev(`(() => { window.__autoRaf = false; for (let i = 0; i < 600 && SnakeDebug.state() !== 'running'; i++) SnakeDebug.frames(1, ${P}); return SnakeDebug.state(); })()`);
    if (going !== 'running') throw new Error('the round never started: ' + going);
    await ev(`SnakeDebug.pinQuality(0); 'ok'`);
  };
  // A fresh round, held still; your snake in the middle heading right.
  const freshRound = async () => {
    await startRound();
    await ev(INSTRUMENT);
    await ev('hold()');
    await ev('centre()');
    await ev('vf(30)');
  };
  // Frames until the next tick has run (and the frame it ran in).
  const toTick = () => ev('toTick()');

  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });

    // ---------------------------------------------------------- keyboard
    await b.viewport(1280, 800);
    await b.go(site.url + '?debug');

    // The start card: Space, E and Shift start nothing; a Tabbed-to Play takes Space.
    await b.sleep(300);
    for (const k of [' ', 'e', 'ShiftLeft', 'ShiftRight']) await key(k);
    await b.sleep(100);
    check(await state() === 'ready', 'the start card: Space, E and Shift start nothing');
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

    // -------------------------------------------------------------- mouse
    // Real mouse presses (the DevTools protocol's, as a mouse sends them).
    // Over the board the left button jumps and the right one flashes, on the
    // next tick, as Space and E do, and no menu pops up there; both at once
    // (the right pressed while the left is held), the jump and then the
    // flash. The middle button, a click with Ctrl, and clicks off the board
    // fire nothing (and keep their menu). A card over the board is the
    // card's: clicks there fire nothing, its buttons do what they did, and
    // only its own text keeps the menu. Mashing jump as your death's card
    // comes up never presses its Play again, nor focuses its name field; a
    // click once it's settled does.
    const MOUSE_BITS = { left: 1, right: 2, middle: 4 };
    let mouseHeld = 0;
    const mouse = (type, button, at, modifiers = 0) => {
      mouseHeld = type === 'mousePressed' ? mouseHeld | MOUSE_BITS[button] : mouseHeld & ~MOUSE_BITS[button];
      return b.send('Input.dispatchMouseEvent', { type, x: at[0], y: at[1], button, buttons: mouseHeld, clickCount: 1, modifiers });
    };
    const clickAt = async (button, at, modifiers = 0) => { await mouse('mousePressed', button, at, modifiers); await mouse('mouseReleased', button, at, modifiers); };
    const middleOf = sel => ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    const MENUS = `(() => { window.__menus = []; addEventListener('contextmenu', e => __menus.push(e.defaultPrevented ? 'none' : 'menu')); return 'ok'; })()`;

    // The start card: clicks on the board round it, or on its words, start nothing; a menu only over its words; Play, clicked, plays.
    await ev(`window.__autoRaf = true; 'ok'`);
    await b.go(site.url + '?debug');
    await b.sleep(300);
    await ev(MENUS);
    let rim = await ev(`(() => { const r = document.getElementById('game').getBoundingClientRect(); return [r.x + 12, r.y + 12]; })()`); // (the board's corner, round the card)
    for (const at of [rim, await middleOf('#overlay-title')]) { await clickAt('left', at); await clickAt('right', at); }
    await b.sleep(100);
    const startMenus = await ev('__menus.splice(0).join(" ")'), stillReady = await state();
    await clickAt('left', await middleOf('#start'));
    await b.sleep(100);
    check(stillReady === 'ready' && startMenus === 'none menu' && await state() === 'countdown', 'the start card: clicks round it or on its words start nothing, a menu only over its words; Play, clicked, plays', `${stillReady}, menus ${startMenus}`);

    await freshRound();
    await ev(MENUS);
    const board = await ev(`document.getElementById('game').getBoundingClientRect().toJSON()`);
    const onBoard = [board.x + board.width / 2 + 40, board.y + board.height / 2 + 60]; // (somewhere on the log, off the middle)
    rim = [board.x + 12, board.y + 12];
    await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: onBoard[0], y: onBoard[1], buttons: 0 });
    for (const [button, kind, ev1] of [['left', 'leap', 'leap'], ['right', 'flash', 'dash:plain']]) {
      let ok = 0;
      for (let n = 0; n < 12; n++) {
        await ev('centre()');
        await ev(`vf(${Math.floor(Math.random() * 8)})`);
        if (kind === 'leap') await ev(`(() => { const g = SnakeDebug.game(), me = g.snakes[0], h = me.body[0]; g.holes.add(h.y * 24 + h.x + 1); return 'ok'; })()`); // (something to hop)
        before = await powers();
        const steps = await ev('__log.steps.length');
        await clickAt(button, onBoard);
        const asked = await ev(`__log.powers.slice(${before})`);
        await toTick();
        const step = await ev(`__log.steps[${steps}]`);
        await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
        if (asked.length === 1 && asked[0].kind === kind && step?.evs.includes(ev1)) ok++;
      }
      check(ok === 12, `the ${button} mouse button on the board ${kind === 'leap' ? 'jumps' : 'flashes'} on the next tick`, `${ok}/12`);
    }
    const boardMenus = await ev('__menus.splice(0)');
    check(boardMenus.length === 12 && boardMenus.every(m => m === 'none'), 'no menu pops up over the board', `${boardMenus.filter(m => m === 'none').length} of ${boardMenus.length} kept down`);

    // Both buttons: the right pressed while the left is held (a chord: the browser sends it as a move).
    await ev('centre()');
    await ev(`(() => { const g = SnakeDebug.game(), h = g.snakes[0].body[0]; g.holes.add(h.y * 24 + h.x + 1); return 'ok'; })()`);
    before = await powers();
    let steps = await ev('__log.steps.length');
    await mouse('mousePressed', 'left', onBoard); await mouse('mousePressed', 'right', onBoard);
    await mouse('mouseReleased', 'right', onBoard); await mouse('mouseReleased', 'left', onBoard);
    for (let n = 0; n < 4; n++) await toTick();
    await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
    const chord = { asked: await ev(`__log.powers.slice(${before}).map(p => p.kind).join(',')`), got: await ev(`__log.steps.slice(${steps}).flatMap(s => s.evs).join(' ')`) };
    check(chord.asked === 'leap,flash' && chord.got === 'leap dash:plain', 'both mouse buttons at once: the jump, then the flash once down', JSON.stringify(chord));
    await ev('__menus.length = 0');

    // Nothing else fires: the middle button, Ctrl with either button, clicks off the board (which keep their menu).
    await ev('centre()');
    before = await powers();
    await clickAt('middle', onBoard);
    await clickAt('left', onBoard, 2); await clickAt('right', onBoard, 2);
    for (const sel of ['#scoreboard li:nth-child(2)', 'h1', '.chatter-head', '#help']) { const at = await middleOf(sel); await clickAt('left', at); await clickAt('right', at); }
    await ev('vf(2)');
    const offMenus = await ev('__menus.splice(0).join(" ")');
    check(await powers() === before && await state() === 'running' && offMenus === 'none menu menu menu menu', 'the middle button, Ctrl and clicks off the board fire nothing; the menu stays off the board', `menus ${offMenus}`);

    // A nap: clicks on its card, or the board round it, wake nothing and fire nothing; its Wake up, clicked, wakes.
    await ev('centre()');
    await key('p'); await ev('vf(2)');
    before = await powers();
    for (const at of [rim, await middleOf('#overlay-title')]) { await clickAt('left', at); await clickAt('right', at); }
    await ev('vf(2)');
    const napMenus = await ev('__menus.splice(0).join(" ")'), stillNapped = await state();
    await clickAt('left', await middleOf('#start'));
    await ev('vf(2)');
    const woke = await state();
    await ev('vf(40)');
    check(stillNapped === 'paused' && woke === 'countdown' && await state() === 'running' && await powers() === before && napMenus === 'none menu',
      'napping: clicks on its card or round it wake and fire nothing, a menu only over its words; Wake up, clicked, wakes', `${stillNapped}, then ${woke}; menus ${napMenus}`);

    // Mashing jump with the mouse as you crash out: once your death's card is
    // up, each click lands on its Play again. None starts a round (a click a
    // moment after it came up, or in a run of quick clicks that began then);
    // a click once it's settled does.
    await ev(VCLOCK);
    await ev('centre()');
    await ev(`(() => { const me = SnakeDebug.game().snakes[0]; me.body = [{ x: 22, y: 12 }, { x: 21, y: 12 }, { x: 20, y: 12 }]; me.prev = null; return 'ok'; })()`);
    const mouseMash = [];
    for (let i = 0; i < 14; i++) { // (a click every 110 ms for about 1.5 s)
      const up = await ev('cardUp()');
      const at = up ? await middleOf('#start') : onBoard;
      await mouse('mousePressed', 'left', at);
      await ev('vadvance(50)');
      await mouse('mouseReleased', 'left', at);
      await ev('vadvance(60)');
      await ev('vf(7)');
      mouseMash.push(`${up ? 'card' : 'board'}:${await state()}`);
    }
    const mouseMashed = await ev(`({ s: SnakeDebug.state(), up: cardUp(), alive: SnakeDebug.game().snakes[0].alive, title: document.getElementById('overlay-title').textContent })`);
    await ev('vadvance(600)'); await ev('vf(36)');
    await clickAt('left', await middleOf('#start'));
    await ev('vadvance(20)');
    const mouseSettled = await state();
    check(!mouseMashed.alive && mouseMashed.up && mouseMashed.s === 'running' && mouseMash.some(m => m.startsWith('card')) && mouseSettled === 'countdown',
      'mashing jump with the mouse over your death card never plays again; a click once it’s settled does', `${mouseMashed.title} ${mouseMash.filter(m => m.startsWith('card')).length} clicks on Play again, then ${mouseSettled}`);

    // Nor focuses the name field a card offering the carve has in its middle (keys mashed next would carve them).
    await ev(`(() => { window.__best = localStorage.getItem('snake-best'); localStorage.setItem('snake-best', '1'); return 'ok'; })()`);
    await freshRound();
    await ev(VCLOCK);
    await ev(`(() => { const me = SnakeDebug.game().snakes[0]; me.body = [{ x: 22, y: 12 }, { x: 21, y: 12 }, { x: 20, y: 12 }]; me.prev = null; me.eaten = 25; return 'ok'; })()`);
    let carveClicks = 0, mouseFocused = false;
    for (let i = 0; i < 14; i++) {
      const offered = await ev(`cardUp() && !document.getElementById('name-row').hidden`);
      const at = offered ? await middleOf(i % 2 ? '#name-rank' : '#name-input') : onBoard;
      if (offered) carveClicks++;
      await mouse('mousePressed', 'left', at);
      await ev('vadvance(50)');
      await mouse('mouseReleased', 'left', at);
      await ev('vadvance(60)');
      await ev('vf(7)');
      if (await ev(`document.activeElement?.id === 'name-input'`)) mouseFocused = true;
    }
    await ev('vadvance(600)'); await ev('vf(36)');
    await clickAt('left', await middleOf('#name-input'));
    await ev('vadvance(20)');
    const mouseFocusedLater = await ev(`document.activeElement?.id === 'name-input'`);
    await ev(`(() => { if (window.__best == null) localStorage.removeItem('snake-best'); else localStorage.setItem('snake-best', __best); return 'ok'; })()`);
    check(carveClicks > 0 && !mouseFocused && mouseFocusedLater, 'mashing jump with the mouse over a card offering the carve never focuses the name field; a click once it’s settled does',
      `${carveClicks} clicks on the field or its words, ${mouseFocused ? 'focused' : 'not focused'}; then ${mouseFocusedLater ? 'focused' : 'not focused'}`);

    // -------------------------------------------------------------- touch
    await b.viewport(390, 844, { scale: 3, mobile: true });
    await freshRound();
    const box = await ev(`document.getElementById('game').getBoundingClientRect().toJSON()`);
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const touch = (type, pts) => b.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    await ev(VCLOCK);

    // A tap jumps (on lift, or held still for TAP_JUMP_MS with something to
    // hop on the way); taps on a button or a tag don't.
    const tapLat = [], tapLatHop = [];
    let tapsOk = 0;
    for (const ahead of [0, 3]) {
      for (const contact of [30, 50, 70, 90, 120, 200, 400]) {
        await ev('centre()');
        if (ahead) await ev(`(() => { const g = SnakeDebug.game(), h = g.snakes[0].body[0]; g.holes.add(h.y * 24 + h.x + ${ahead}); return 'ok'; })()`);
        before = await powers();
        await touch('touchStart', [{ x: cx + 20, y: cy + 30, id: 1 }]);
        await ev(`vadvance(${contact})`);
        await touch('touchEnd', []);
        await ev('vadvance(50)');
        await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
        const asked = await ev(`__log.powers.slice(${before})`);
        const t = await ev('__touch');
        if (asked.length === 1 && asked[0].kind === 'leap') { tapsOk++; (ahead ? tapLatHop : tapLat).push(t.did - t.start); }
      }
    }
    check(tapsOk === 14, 'a tap on the board jumps, once', `${tapsOk}/14, touch-down to jump ${JSON.stringify(stats(tapLat))}; with a hole ahead ${JSON.stringify(stats(tapLatHop))}`);
    before = await powers();
    for (const sel of ['#mute', '#scoreboard li:nth-child(2)', '#scoreboard li:nth-child(1)']) {
      const r = await ev(`document.querySelector('${sel}').getBoundingClientRect().toJSON()`);
      await touch('touchStart', [{ x: r.x + r.width / 2, y: r.y + r.height / 2, id: 1 }]);
      await ev('vadvance(120)');
      await touch('touchEnd', []);
      await ev('vadvance(50)');
    }
    await ev(`SnakeAudio.isMuted() && document.getElementById('mute').click(); 'ok'`); // (unmuted again)
    check(await powers() === before && await state() === 'running', 'a tap on a button or a name tag doesn’t jump');

    // A finger: down at a random point in a frame (resting first for rest
    // ms), then moving at v px/ms (dx, dy: its way), its position sent at
    // each frame, up to 70 px (or, with lift: n, lifting n frames after it
    // first did something, still going).
    const swipe = async (dx, dy, { v = 0.6, frames = 8, from = [cx - dx * 30, cy - dy * 30], rest = 0, lift = Infinity } = {}) => {
      let t = (1 - Math.random()) * P; // (from the touch to the next frame)
      await touch('touchStart', [{ x: from[0], y: from[1], id: 1 }]);
      await ev(`vadvance(${rest + t})`);
      for (let f = 0, after = 0; f < frames; f++) {
        const d = Math.min(70, t * v);
        await touch('touchMove', [{ x: from[0] + dx * d, y: from[1] + dy * d, id: 1 }]);
        const did = await ev(`vadvance(${P}), __touch.did`);
        t += P;
        if (did && ++after > lift) break;
      }
      await touch('touchEnd', []);
      await ev('vadvance(50)');
    };

    // A fresh swipe the way you're going flashes; a finger that keeps going doesn't again.
    await ev('centre()');
    before = await powers();
    await swipe(1, 0, { frames: 12 });
    const ahead = await ev(`__log.powers.slice(${before}).map(p => p.kind).join(',')`);
    check(ahead === 'flash', 'a fresh swipe ahead flashes, once, however far the finger goes', ahead || 'nothing');
    // A swipe the way the last one turned you, just after it lifted, is that
    // turn swiped twice (a double flick, to make sure), not a flash: the
    // second touch down 60-250 ms after the first lifts. A moment later, a flash.
    const flicks = [];
    for (const gap of [0, 60, 120, 170, 250, 400]) {
      await ev('centre()');
      await swipe(0, -1, { frames: 4 }); // (a turn up: about 60 ms of motion, then the lift...)
      before = await powers();
      await ev(`vadvance(${Math.max(0, gap - 50)})`);
      await swipe(0, -1, { frames: 4 }); // (...and up again)
      flicks.push(`${gap}:${await ev(`__log.powers.slice(${before}).map(p => p.kind).join(',')`) || '-'}`);
    }
    check(flicks.join(' ') === '0:- 60:- 120:- 170:- 250:- 400:flash', 'a swipe the way you just turned is that turn again, not a flash; a moment later, it flashes', `gap from lift: ${flicks.join(' ')}`);

    // A chained turn: one finger, right and then up, at 0.6 px/ms; the second
    // turn counts from the corner (SWIPE_CHAIN_PX).
    const chainLat = [];
    let chained = 0;
    for (let n = 0; n < 8; n++) {
      await ev('centre()');
      await ev("face('up')");
      const from = [cx - 40, cy + 30], corner = 50; // (ms: 30 px right, then up)
      let t = (1 - Math.random()) * P;
      await touch('touchStart', [{ x: from[0], y: from[1], id: 1 }]);
      await ev(`vadvance(${t})`);
      for (let f = 0; f < 8; f++) {
        const x = from[0] + Math.min(t, corner) * 0.6, y = from[1] - Math.max(0, t - corner) * 0.6;
        await touch('touchMove', [{ x, y, id: 1 }]);
        await ev(`vadvance(${P})`);
        t += P;
      }
      await touch('touchEnd', []);
      await ev('vadvance(50)');
      const q = await ev("SnakeDebug.game().snakes[0].queue.map(dirName).join(',')");
      const tt = await ev('__touch');
      if (q === 'right,up') { chained++; chainLat.push(tt.second - tt.start - corner); }
    }
    check(chained === 8, 'one finger chains turns (right, then up)', `${chained}/8, corner to turn ${JSON.stringify(stats(chainLat))}`);

    // A finger held still jumps without waiting for the lift only with
    // something to hop on the way; a thumb resting before it swipes doesn't
    // jump (and a jump its hold asked for, not gone yet, is taken back);
    // nor does a thumb resting while the other swipes.
    const hole = n => ev(`(() => { const g = SnakeDebug.game(), h = g.snakes[0].body[0]; g.holes.add(h.y * 24 + h.x + ${n}); return 'ok'; })()`);
    const leaps = from => ev(`__log.powers.slice(${from}).filter(p => p.kind === 'leap').length`);
    await ev('centre()');
    await hole(2);
    before = await powers();
    await touch('touchStart', [{ x: cx + 20, y: cy + 30, id: 1 }]);
    await ev('vadvance(100)');
    const heldJump = await leaps(before);
    await touch('touchEnd', []);
    await ev('vadvance(50)');
    await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
    check(heldJump === 1 && await leaps(before) === 1, 'held still with something to hop, a touch jumps before it lifts, once', `${heldJump} by 100 ms`);
    const rests = [];
    let failedRest = false;
    for (const [rest, ahead] of [[90, 0], [120, 0], [200, 0], [120, 2]]) {
      await ev('centre()');
      if (ahead) await hole(ahead);
      before = await powers();
      await swipe(0, -1, { frames: 5, rest });
      const r = await ev(`(() => { const me = SnakeDebug.game().snakes[0]; return { q: me.queue.map(dirName).join(','), armed: me.leapArmed }; })()`);
      await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
      rests.push(`${rest} ms${ahead ? ' (a hole ahead)' : ''}: ${r.q || 'no turn'}, ${r.armed >= 0 ? 'a jump waiting' : 'no jump waiting'}`);
      if (r.q !== 'up' || r.armed >= 0) failedRest = true;
    }
    check(!failedRest, 'a thumb resting before it swipes turns, and no jump goes', rests.join('; '));
    await ev('centre()');
    before = await powers();
    await touch('touchStart', [{ x: cx - 60, y: cy + 60, id: 1 }]); // (a thumb resting...)
    await ev('vadvance(100)');
    for (let f = 0; f <= 6; f++) { // (...while the other swipes up)
      await touch(f ? 'touchMove' : 'touchStart', [{ x: cx - 60, y: cy + 60, id: 1 }, { x: cx + 60, y: cy + 40 - f * 10, id: 2 }]);
      await ev(`vadvance(${P})`);
    }
    await touch('touchMove', [{ x: cx - 60, y: cy + 60, id: 1 }]); // (the swiping one lifts...)
    await ev('vadvance(120)');
    await touch('touchEnd', []); // (...then the resting one)
    await ev('vadvance(50)');
    const two = await ev(`({ leaps: __log.powers.slice(${before}).filter(p => p.kind === 'leap').length, q: SnakeDebug.game().snakes[0].queue.map(dirName).join(',') })`);
    check(two.leaps === 0 && two.q === 'up', 'a thumb resting while the other swipes doesn’t jump', JSON.stringify(two));
    // ...but with something to hop, its jump has gone before the other
    // swipes: taken back while it's still resting.
    await ev('centre()');
    await hole(2);
    await touch('touchStart', [{ x: cx - 60, y: cy + 60, id: 1 }]);
    await ev('vadvance(100)');
    const armedRest = await ev('SnakeDebug.game().snakes[0].leapArmed >= 0');
    for (let f = 0; f <= 6; f++) {
      await touch(f ? 'touchMove' : 'touchStart', [{ x: cx - 60, y: cy + 60, id: 1 }, { x: cx + 60, y: cy + 40 - f * 10, id: 2 }]);
      await ev(`vadvance(${P})`);
    }
    const twoHop = await ev(`(() => { const me = SnakeDebug.game().snakes[0]; return { armed: me.leapArmed >= 0, q: me.queue.map(dirName).join(',') }; })()`);
    await touch('touchMove', [{ x: cx - 60, y: cy + 60, id: 1 }]);
    await touch('touchEnd', []);
    await ev('vadvance(50)');
    await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
    check(armedRest && !twoHop.armed && twoHop.q === 'up', 'a thumb resting with something to hop, while the other swipes: its jump is taken back', JSON.stringify(twoHop));
    // A tap held long enough to jump before it lifted, then (the finger up)
    // a fresh swipe ahead: a jump and a flash, both kept. The tap was a tap,
    // whatever the next touch does. (Something right in front: the jump,
    // then the flash once down; three ahead: the flash, then the jump.)
    const combos = [];
    let combosOk = 0;
    for (const [ahead, want] of [[1, 'leap dash:plain'], [3, 'dash:plain leap']]) {
      for (const contact of [100, 150]) {
        await ev('centre()');
        await hole(ahead);
        await touch('touchStart', [{ x: cx + 20, y: cy + 30, id: 1 }]);
        await ev(`vadvance(${contact})`);
        await touch('touchEnd', []);
        await ev('vadvance(50)');
        const steps = await ev('__log.steps.length');
        await swipe(1, 0, { frames: 5 });
        for (let n = 0; n < 4; n++) await toTick();
        await ev(`SnakeDebug.game().holes.clear(); 'ok'`);
        const got = await ev(`__log.steps.slice(${steps}).flatMap(s => s.evs).join(' ')`);
        combos.push(`${ahead} ahead, held ${contact} ms: ${got || 'nothing'}`);
        if (got === want) combosOk++;
      }
    }
    check(combosOk === 4, 'a held tap, lifted, then a fresh swipe ahead: the jump and the flash both go', combos.join('; '));

    // A quick tap that rolls a few pixels as it lifts is still a tap.
    const drifts = [];
    for (const d of [3, 7, 9, 11]) {
      let ok = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        await ev('centre()');
        before = await powers();
        await touch('touchStart', [{ x: cx + 20, y: cy + 30, id: 1 }]);
        await ev(`vadvance(${P})`);
        await touch('touchMove', [{ x: cx + 20 + dx * d / 2, y: cy + 30 + dy * d / 2, id: 1 }]);
        await ev(`vadvance(${P})`);
        await touch('touchMove', [{ x: cx + 20 + dx * d, y: cy + 30 + dy * d, id: 1 }]);
        await ev(`vadvance(${50 - 2 * P})`);
        await touch('touchEnd', []);
        await ev('vadvance(50)');
        const q = await ev('SnakeDebug.game().snakes[0].queue.length');
        if (await leaps(before) === 1 && !q) ok++;
      }
      drifts.push(`${d} px ${ok}/4`);
    }
    check(drifts.every(t => t.endsWith('4/4')), 'a quick tap that drifts as it lifts still jumps', drifts.join(', '));

    // A long straight stroke well off the axis still turns, its main way.
    const slants = [];
    for (const deg of [35, 44]) {
      let ok = 0;
      for (const [dx, dy, name] of [[1, 0, 'right'], [-1, 0, 'left']]) {
        await ev('centre()');
        await ev("face('up')");
        const a = deg * Math.PI / 180;
        await swipe(dx * Math.cos(a), -Math.sin(a), { v: 0.5, frames: 13 });
        if (await ev("SnakeDebug.game().snakes[0].queue.map(dirName).join(',')") === name) ok++;
      }
      slants.push(`${deg}° ${ok}/2`);
    }
    check(slants.every(t => t.endsWith('2/2')), 'a long stroke 35-44° off the axis turns its main way', slants.join(', '));

    // Swipes never jump: finger speeds 0.15-1.2 px/ms, straight and slanted, every way.
    // (Each lifts two frames after it turns, still going: the lift the tap rule
    // could most easily mistake; one that never turns goes the whole 70 px.)
    const reg = {};
    let jumps = 0, swipes = 0, wrong = 0, none = 0;
    for (const v of [0.15, 0.2, 0.3, 0.45, 0.6, 0.8, 1.0, 1.2]) {
      for (const slant of [0, 10, 20, 30, 40]) {
        for (const [dx, dy, name] of [[1, 0, 'right'], [-1, 0, 'left'], [0, -1, 'up'], [0, 1, 'down']]) {
          await ev('centre()');
          await ev(`face('${name === 'down' ? 'right' : name === 'up' ? 'left' : 'up'}')`); // (never straight back, nor ahead: every swipe is a turn)
          const a = slant * Math.PI / 180, sx = dx * Math.cos(a) - dy * Math.sin(a), sy = dy * Math.cos(a) + dx * Math.sin(a);
          before = await powers();
          await swipe(sx, sy, { v, frames: Math.ceil(70 / v / P) + 1, lift: 2 });
          swipes++;
          const asked = await ev(`__log.powers.slice(${before}).map(p => p.kind)`);
          if (asked.includes('leap')) jumps++;
          const t = await ev('__touch');
          const turned = await ev(`(() => { const me = SnakeDebug.game().snakes[0]; return me.queue.length ? dirName(me.queue[0]) : ''; })()`);
          if (!t.did) none++;
          else if (t.what === 'turn' && turned !== name) wrong++;
          if (t.did && slant <= 20) (reg[v] ||= []).push(t.did - t.start);
        }
      }
    }
    check(jumps === 0, 'swipes never jump', `${jumps} of ${swipes} swipes; ${none} slanted 40° never registered (a way must be half again the other), ${wrong} went another way`);
    const regStats = Object.fromEntries(Object.entries(reg).map(([v, l]) => [v, stats(l).median]));

    // A banner stays where it is while its place is clear: a head coming into
    // it moves it to the first place that's clear (the top, the foot, the
    // middle), and with heads in all three it fades where it is. (Picked
    // afresh every frame, it went back to the top the moment that cleared,
    // and hopped about three times in its three seconds on a short phone.)
    await ev('centre()');
    await ev(`(() => {
      const E = SnakeEngine;
      window.put = (id, x, y, dir = 'right') => { const s = SnakeDebug.game().snakes[id], d = E.DIRS[dir]; s.body = s.body.map((c, i) => ({ x: x - d.x * i, y: y - d.y * i })); s.prev = null; s.dir = d; s.queue.length = 0; return 'ok'; };
      window.slot = () => { const t = document.getElementById('toast'); return t.hidden ? 'hidden' : (t.classList.contains('low') ? 'foot' : t.classList.contains('mid') ? 'middle' : 'top') + (t.classList.contains('under') ? ' faded' : ''); };
      const step = E.step; E.step = g => { const out = step(g); if (window.__news) { g.events.push(window.__news); window.__news = null; } return out; }; // (news, on the next tick)
      return 'ok';
    })()`);
    await ev(`put(1, 12, 22, 'down')`); // (a rival's head at the foot)
    await ev('put(0, 12, 6)'); // (yours in none of the three)
    await ev(`(() => { delete SnakeDebug.game().told?.golden; window.__news = { type: 'spawn', kind: 'golden' }; return 'ok'; })()`);
    await toTick();
    const slots = [await ev('slot()')];
    for (const [moves, why] of [
      [['put(0, 12, 2)'], 'yours at the top'],
      [['put(0, 12, 6)'], 'yours out again'],
      [[`put(2, 12, 1, 'up')`, 'put(0, 12, 12)'], 'a rival at the top, yours in the middle'],
      [['put(0, 12, 6)'], 'yours out again'],
      [[`put(2, 4, 21, 'down')`, 'put(0, 12, 12)'], 'the rival away, yours in the middle'],
    ]) {
      for (const m of moves) await ev(m);
      await ev('vf(1)');
      slots.push(`${why}: ${await ev('slot()')}`);
    }
    check(slots.map(s => s.replace(/^.*: /, '')).join(', ') === 'top, middle, middle, middle faded, middle, top',
      'a banner stays put while its place is clear, moves only when a head comes into it, and fades where it is with heads everywhere', slots.join('; '));

    // Choking, as the page tells it (the engine's chokes and nudges staged by
    // hand, as it makes them): your first choke's lesson, and its gag at once
    // and its cough a beat later, once a cough (a bead spat while you cough
    // starts no other); your first nudge's lesson, once the choke's has had
    // its time; a rival's choke and cough, heard as a rival's. (What the page
    // asks to play: the cues themselves are audio.js's.)
    await ev(`(() => {
      const E = SnakeEngine, A = SnakeAudio, play = A.play, g = SnakeDebug.game();
      window.__heard = [];
      A.play = (name, opts) => { if (name === 'choke' || name === 'cough') __heard.push({ name, rival: !!opts?.rival, tick: SnakeDebug.game().tick }); return play(name, opts); };
      Object.assign(g.told ||= {}, { beetle: true, goldBeetle: true, leaf: true, goldcap: true, burrow: true, rainbow: true, baked: true }); // (no news on the tick to speak first)
      const step = E.step; E.step = g => { const out = step(g); const f = window.__staged; window.__staged = null; if (f) f(g); return out; };
      // A choke on the next tick (fresh: a cough from it; again: a bead spat mid-cough), or a nudge.
      window.stageChoke = (id, fresh = true) => { window.__staged = g => { const s = g.snakes[id], h = s.body[0]; g.events.push({ type: 'choke', snake: s, x: h.x, y: h.y, tx: h.x, ty: h.y - 1 }); if (fresh) s.coughUntil = g.tick - 1 + TUNING.COUGH_TICKS; }; return 'ok'; };
      window.stageNudge = (id, kind) => { window.__staged = g => { const s = g.snakes[id], h = s.body[0]; g.events.push({ type: 'nudge', snake: s, kind, x: h.x, y: h.y, tx: h.x + 1, ty: h.y }); }; return 'ok'; };
      window.toastText = () => { const t = document.getElementById('toast'); return t.hidden ? '' : t.textContent; };
      return 'ok';
    })()`);
    await ev('vadvance(4000)'); // (the banner before has had its time)
    await ev('stageChoke(0)');
    await toTick();
    const choked = await ev(`({ tick: SnakeDebug.game().tick, toast: toastText() })`);
    await toTick(); await toTick();
    await ev('stageChoke(0, false)'); // (another of your beads, mid-cough)
    await toTick(); await toTick(); await toTick();
    await ev(`stageNudge(0, 'food')`);
    await toTick();
    const nudgedAt = await ev('toastText()');
    await ev('vadvance(3000)');
    const nudged = await ev('toastText()');
    const mine = await ev('__heard.splice(0)');
    await ev('stageChoke(1)');
    await toTick(); await toTick(); await toTick();
    const theirs = await ev('__heard.splice(0)');
    await ev(`(() => { for (const s of SnakeDebug.game().snakes) s.coughUntil = -1; return 'ok'; })()`);
    const said = list => list.map(h => `${h.name}${h.rival ? '~' : ''}@${h.tick - choked.tick}`).join(' ');
    check(choked.toast === 'You choke on your own tail!' && said(mine) === 'choke@0 cough@2 choke@3',
      'your first choke: its lesson, its gag, and its cough two ticks later, once a cough', `“${choked.toast}”; heard ${said(mine)}`);
    check(nudgedAt === choked.toast && nudged === 'No eating while you cough: food rolls aside.',
      'your first nudge while coughing: its lesson, once the choke’s has had its time', `“${nudgedAt}”, then “${nudged}”`);
    check(theirs.length === 2 && theirs.every(h => h.rival) && theirs[1].tick - theirs[0].tick === 2 && theirs[0].name === 'choke' && theirs[1].name === 'cough',
      'a rival’s choke and cough are heard as a rival’s', theirs.map(h => `${h.name}${h.rival ? '~' : ''}`).join(' '));

    // Round six A's beetles and woodpecker, as the page tells them (digs,
    // dives, knocks and the woodpecker's coming staged by hand, as the engine
    // makes them): a beetle digging in far from your head teaches nothing,
    // and one a rival cornered is heard as a rival's; the woodpecker's coming
    // teaches its rules once its own banner has had its time; a beetle digging
    // in near you (8 cells at most) is heard as yours, and teaches "A cornered
    // beetle digs in…" the first time the banner's free for it (it's over in a
    // second: never left waiting); one that dug in goes under unheard (it was
    // heard boring in), and the burrow its dig leaves (the engine's pair, on
    // one tick) neither cracks open nor is news that one did: it teaches "A
    // beetle that digs in leaves a burrow behind." the first time the banner's
    // free for one, and only once a round; one closing over crumbles, softly;
    // one down a burrow or up out of one scrabbles (a sound of its own, not the
    // bore), and a burrow cracking open creaks; and food the woodpecker knocks aside is heard
    // once a strike, quietly, the world's, from where the first piece that
    // flies was (none for food it ate, even first in the strike's list).
    await ev(`(() => {
      const A = SnakeAudio, play = A.play;
      window.__cues = [];
      A.play = (name, opts) => { if (name === 'dig' || name === 'knock' || name === 'scrabble' || name === 'burrow' || name === 'heal') __cues.push(name + (opts?.rival ? '~' : '') + (opts?.volume != null ? '@' + opts.volume : '') + (name === 'knock' ? ':' + (opts?.pan ?? 0).toFixed(2) : '')); return play(name, opts); };
      window.stageEvents = list => { window.__staged = g => { for (const e of list(g)) g.events.push(e); }; return 'ok'; };
      return 'ok';
    })()`);
    const DIG_LESSON = 'A cornered beetle digs in. Grab it before it’s gone!', FAIR_LESSON = 'The woodpecker knocks food aside, and won’t shut you in if it can help it.';
    const BURROW_LESSON = 'A beetle that digs in leaves a burrow behind.';
    const dugPairAt = (x, y, more = '') => ev(`stageEvents(() => [{ type: 'dive', x: ${x}, y: ${y}, dug: 1 }, { type: 'burrow', x: ${x}, y: ${y}, dug: 1 }${more}])`); // (a dig over: the engine's pair)
    const cues = () => ev('__cues.splice(0).join(" ")');
    const digNear = (dx, dy) => ev(`stageEvents(g => { const h = g.snakes[0].body[0]; return [{ type: 'dig', x: h.x + ${dx}, y: h.y + ${dy}, until: g.tick + 8 }]; })`);
    await ev('centre()');
    await ev(`put(1, 2, 2, 'right')`); // (a rival's head far from yours)
    await ev('vadvance(4000)');
    await ev(`stageEvents(g => { const h = g.snakes[1].body[0]; return [{ type: 'dig', x: h.x + 1, y: h.y + 1, until: g.tick + 8 }]; })`);
    await toTick();
    const farDig = { toast: await ev('toastText()'), heard: await cues() };
    await ev(`stageEvents(g => { g.woodpecker = { x: 12, y: 0, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick + 12 }; return [{ type: 'woodpecker' }]; })`);
    await toTick();
    const peckNews = await ev('toastText()');
    await digNear(8, 0); // (while the woodpecker's news holds the banner)
    await toTick();
    const heldDig = { toast: await ev('toastText()'), heard: await cues() };
    await ev('vadvance(2600)');
    const fair = await ev('toastText()');
    await ev('vadvance(6000)'); // (its time, and the time back if it faded under a head)
    await digNear(-3, 2);
    await toTick();
    const nearDig = { toast: await ev('toastText()'), heard: await cues() };
    await dugPairAt(3, 3); // (while the dig's lesson holds the banner)
    await toTick();
    const heldPair = { toast: await ev('toastText()'), heard: await cues() };
    await ev('vadvance(6000)'); // (the dig's lesson has had its time: the banner's free)
    await cues(); // (anything the round itself did meanwhile)
    await ev(`(() => { delete SnakeDebug.game().told.burrow; return 'ok'; })()`); // (a burrow cracking open would be news)
    await dugPairAt(4, 4);
    await toTick();
    const dugPair = { toast: await ev('toastText()'), heard: await cues() };
    await ev('vadvance(400)');
    await ev(`stageEvents(() => [{ type: 'dive', x: 4, y: 4 }])`);
    await toTick();
    await ev('vadvance(400)');
    await ev(`stageEvents(() => [{ type: 'emerge', x: 9, y: 4 }])`);
    await toTick();
    await ev('vadvance(400)');
    await ev(`(() => { SnakeDebug.game().told.burrow = true; return 'ok'; })()`);
    await ev(`stageEvents(() => [{ type: 'burrow', x: 9, y: 9 }])`); // (one cracking open)
    await toTick();
    const dives = await cues();
    await ev('vadvance(6000)'); // (the banner's free again)
    await dugPairAt(6, 4, `, { type: 'heal', x: 9, y: 9 }`); // (another dig over, at three burrows: the one unused longest closes over)
    await toTick();
    const dugAgain = { toast: await ev('toastText()'), heard: await cues() };
    await ev(`stageEvents(() => [{ type: 'knock', kind: 'pellet', x: 2, y: 6, tx: null, ty: null, color: '#abc' }, { type: 'knock', kind: 'food', x: 5, y: 5, tx: 7, ty: 5 }, { type: 'knock', kind: 'beetle', x: 6, y: 5, tx: 6, ty: 8, gold: 1 }, { type: 'knock', kind: 'pellet', x: 5, y: 6, tx: null, ty: null }])`);
    await toTick();
    const knocked = await cues();
    await ev('vadvance(1000)');
    await ev(`stageEvents(() => [{ type: 'knock', kind: 'food', x: 5, y: 5, tx: null, ty: null }])`);
    await toTick();
    const ate = await cues();
    await ev(`SnakeDebug.game().woodpecker = null; 'ok'`);
    check(farDig.toast !== DIG_LESSON && farDig.heard === 'dig~', 'a beetle a rival corners, far from you: heard as a rival’s, and no lesson', `“${farDig.toast}”; heard ${farDig.heard}`);
    check(/woodpecker|Rat-a-tat/.test(peckNews) && fair === FAIR_LESSON, 'the woodpecker’s coming: its news, then its rules once the news has had its time', `“${peckNews}”, then “${fair}”`);
    check(heldDig.toast === peckNews && heldDig.heard === 'dig' && nearDig.toast === DIG_LESSON && nearDig.heard === 'dig',
      'a beetle digging in near you: heard as yours; its lesson the first time the banner’s free for it', `held: “${heldDig.toast}”, heard ${heldDig.heard}; later “${nearDig.toast}”, heard ${nearDig.heard}`);
    check(heldPair.heard === '' && dugPair.heard === '' && !/cracked open|digging under the bark/.test(dugPair.toast), 'a beetle that dug in goes under unheard, and the burrow its dig leaves neither cracks open nor is news that one did',
      `heard ${heldPair.heard || 'nothing'}, then ${dugPair.heard || 'nothing'}; “${dugPair.toast}”`);
    check(heldPair.toast === DIG_LESSON && dugPair.toast === BURROW_LESSON && dugAgain.toast !== BURROW_LESSON,
      'the burrow a dig leaves teaches its rule the first time the banner’s free for one, and once a round', `held: “${heldPair.toast}”; then “${dugPair.toast}”; later “${dugAgain.toast}”`);
    check(dugAgain.heard === 'heal', 'a burrow closing over crumbles (the dig that closed it, and its burrow, unheard)', `heard ${dugAgain.heard || 'nothing'}`);
    check(dives === 'scrabble scrabble burrow', 'one down a burrow, or up out of one, scrabbles (not the bore); a burrow cracking open creaks', `heard ${dives || 'nothing'}`);
    const pan5 = ((5 + 0.5) / 24 * 2 - 1) * 0.8;
    check(knocked === 'knock@0.5:' + pan5.toFixed(2) && ate === '', 'food the woodpecker knocks aside: heard once a strike, quietly, the world’s, where the first piece that flies was; none for food it ate', `heard ${knocked || 'nothing'} (from x 5: pan ${pan5.toFixed(2)}), then ${ate || 'nothing'}`);

    // Your death's card: a thumb mashing jump as you crash, landing on its
    // Play again, never starts a round; a tap once it's settled does.
    await ev('centre()');
    await ev(`(() => { const me = SnakeDebug.game().snakes[0]; me.body = [{ x: 22, y: 12 }, { x: 21, y: 12 }, { x: 20, y: 12 }]; me.prev = null; return 'ok'; })()`);
    const mash = [];
    for (let i = 0; i < 14; i++) { // (a tap every 110 ms for about 1.5 s)
      const up = await ev('cardUp()');
      const at = up ? await ev(`(() => { const r = document.getElementById('start').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`) : { x: cx + 20, y: cy + 30 };
      await touch('touchStart', [{ ...at, id: 1 }]);
      await ev('vadvance(50)');
      await touch('touchEnd', []);
      await ev('vadvance(60)');
      await ev('vf(7)');
      mash.push(`${up ? 'card' : 'board'}:${await state()}`);
    }
    const mashed = await ev(`({ s: SnakeDebug.state(), up: cardUp(), alive: SnakeDebug.game().snakes[0].alive, title: document.getElementById('overlay-title').textContent })`);
    await ev('vadvance(600)'); await ev('vf(36)');
    const r = await ev(`(() => { const r = document.getElementById('start').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await touch('touchStart', [{ ...r, id: 1 }]);
    await ev('vadvance(60)');
    await touch('touchEnd', []);
    await ev('vadvance(20)');
    const settled = await state();
    check(!mashed.alive && mashed.up && mashed.s === 'running' && mash.some(m => m.startsWith('card')) && settled === 'countdown',
      'mashing jump over your death card never plays again; a tap once it’s settled does', `${mashed.title} ${mash.filter(m => m.startsWith('card')).length} taps on Play again, then ${settled}`);

    // Nor does mashing focus its name field. A round that earned a place in
    // the Hall of Fame (a new best here) offers "Carve your name" in the
    // card's middle, just where a thumb mashing jump lands, and a focused
    // field brings the phone's keyboard up over the round. A tap on it (or
    // its words) once the card's settled does focus it.
    await ev(`(() => { localStorage.setItem('snake-best', '1'); return 'ok'; })()`);
    await freshRound();
    await ev(VCLOCK);
    await ev(`(() => { const me = SnakeDebug.game().snakes[0]; me.body = [{ x: 22, y: 12 }, { x: 21, y: 12 }, { x: 20, y: 12 }]; me.prev = null; me.eaten = 25; return 'ok'; })()`);
    const fieldAt = id => ev(`(() => { const r = document.getElementById('${id}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    let carveTaps = 0, focusedMash = false;
    for (let i = 0; i < 14; i++) {
      const offered = await ev(`cardUp() && !document.getElementById('name-row').hidden`);
      const at = offered ? await fieldAt(i % 2 ? 'name-rank' : 'name-input') : { x: cx, y: cy };
      if (offered) carveTaps++;
      await touch('touchStart', [{ ...at, id: 1 }]);
      await ev('vadvance(50)');
      await touch('touchEnd', []);
      await ev('vadvance(60)');
      await ev('vf(7)');
      if (await ev(`document.activeElement?.id === 'name-input'`)) focusedMash = true;
    }
    const carveState = await state();
    await ev('vadvance(600)'); await ev('vf(36)');
    await touch('touchStart', [{ ...await fieldAt('name-input'), id: 1 }]);
    await ev('vadvance(60)');
    await touch('touchEnd', []);
    await ev('vadvance(20)');
    const focusedLater = await ev(`document.activeElement?.id === 'name-input'`);
    check(carveTaps > 0 && !focusedMash && carveState === 'running' && focusedLater,
      'mashing jump over a card offering the carve never focuses the name field; a tap once it’s settled does', `${carveTaps} taps on the field or its words, ${focusedMash ? 'focused' : 'not focused'}; then ${focusedLater ? 'focused' : 'not focused'}`);

    console.log(results.join('\n'));
    console.log('\nmeasured (virtual 60 Hz, 120 ms ticks):');
    console.log('  press to tick, turns:', JSON.stringify(stats(turnLat)));
    console.log('  press to tick, jumps:', JSON.stringify(stats(pressLat.jump)), ' flashes:', JSON.stringify(stats(pressLat.flash)));
    console.log('  touch-down to jump (taps held 30-400 ms; nothing to hop: on the lift):', JSON.stringify(stats(tapLat)), ' with a hole ahead (held still: at TAP_JUMP_MS):', JSON.stringify(stats(tapLatHop)));
    console.log('  a chained turn, from the finger’s corner (0.6 px/ms):', JSON.stringify(stats(chainLat)));
    console.log('  touch-down to a swipe registering, median ms by finger speed (px/ms):', JSON.stringify(regStats));
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log('\nall passed');
})().catch(e => { console.error(e); process.exit(1); });
