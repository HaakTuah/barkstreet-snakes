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
// near enough to catch teaches its lesson and is heard as yours (a rival's,
// as a rival's), one that dug in goes under unheard while one down a burrow
// or up out of one scrabbles, the burrow a dig leaves and one closing over
// teach theirs, in that order (a dig far from you, then its burrow: the dig
// and the burrow at once), the woodpecker's coming its rule, a flag or a
// capital it pecks out theirs, and knocked food is heard once a strike,
// quietly, where the first piece that flies was. Every lesson is 60
// characters at most. And the banners (DESIGN "Teaching by showing"): each
// held for its reading time, the next a breather after the last one's fade,
// round news waiting behind a waiting lesson (not cutting in and losing
// it), a lesson whose moment has passed let go; at the board's top or foot,
// never its middle, and on a phone held upright above the board, every one
// of the game's on one line over the title row, its words whole, at 360 and
// 320 px. And rivals chosen with SnakeDebug.setup are the ones Watch AIs
// watches.
// It prints what it measured: press-to-tick, tap-to-jump and swipe latencies.
//
//   node tools/input-test.js
// The checks are in tools/input/, one file per area, run in name order as the body of this one
// (tools/parts.js): 01 keyboard, 02 mouse, 03 touch, 04 where a banner goes and choking, 05 beetles
// and the woodpecker, 06 pecked flags and banners in turn, 07 the death card, the testers' setup and
// the lessons (and the measured latencies). A new check goes in its area's file, or a new one.
const path = require('path');
const runParts = require('./parts.js');
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

    await runParts.inside(path.join(__dirname, 'input'), { launch, serve, P, results, check, stats, PRE, INSTRUMENT, VCLOCK, KEYS, site, b, ev, down, up, key, powers, state, startRound, freshRound, toTick });
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log(`\nall passed (${results.length} checks)`);
})().catch(e => { console.error(e); process.exit(1); });
