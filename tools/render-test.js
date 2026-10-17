#!/usr/bin/env node
// What the renderer promises that the picture itself can show, checked in
// headless Chrome (pixels read back off the board, and where the head is
// drawn, frame by frame):
// - A flash, or a golden dash, is there at once and glides on: it shows from
//   when the head is drawn past its cell's centre, before its tick, and the
//   head never stands still after it (your E key, on a virtual 60 Hz clock,
//   at 120 and 90 ms ticks).
// - Space and E together, a body one thick right in front: the game hops
//   first, and so does the drawing (the head rises on before the tick, never
//   standing still or sliding back, and no dash is drawn through the body);
//   stunned, the mark shows the hop (two thick, nowhere to land: the flash).
// - A flash, then a turn two frames later (even in the tick's own frame):
//   the head glides to the new way, never leaping across; its streak goes
//   the new way, none left along the old row, and no flecks fly before the
//   tick.
// - A dead snake's beads keep its markings (Joker's purple and amber,
//   Wildcard's collar, stars and stripes), though only every other segment
//   leaves one.
// - Golden power pips stay on the board at its edge (a head in the first
//   column, the top row or a corner shows as many of them as one in the
//   middle), never on the head (none inside its face, where moving the arc
//   in put them over its eyes), and stunned, the stars keep clear of them.
// - Star: its head is a star (five points round it, one to the back), its
//   rainbow flows down its body from the head (and holds still with reduced
//   motion), its gold line runs round its points, and a dead Star's beads go
//   round the rainbow from its head. Its tell is a countdown: its points go
//   dim as it flashes and light one by one through its rest, its middle
//   always lit (with reduced motion too: a point at a time, never a blink),
//   and its twinkles burst as it flashes, not as its flash comes back. Its
//   face is upright at every heading. Copycat copying it wears a pale copy
//   of its rainbow (not a pale gold), and it goes off in a rainbow ring.
// - Scorch marks are soot, not holes: a burned cell is no more than a little
//   darker, and not darkest in its middle.
// - Every Field guide picture draws (the mushroom on bark; a snake holding
//   golden powers; your rests).
//
//   node tools/render-test.js
const { launch, serve } = require('./browser');

const CELL = 32; // (the board's units a cell, as render.js draws them)
const results = [];
let failed = 0;
const check = (ok, what, detail = '') => {
  results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
};

// Before the page's own scripts: a switch for its animation loop.
const PRE = `(() => {
  const raw = window.requestAnimationFrame.bind(window);
  window.__autoRaf = true;
  window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); });
})();`;

// Staged boards, drawn by hand (the page's loop stopped), and pixels read off them.
const STAGE = `(() => {
  window.__autoRaf = false;
  window.E = SnakeEngine; window.R = SnakeRender;
  window.__t = performance.now() + 1e6;
  window.drawN = (n, alpha = 0.5, step = 33) => { for (let i = 0; i < n; i++) { __t += step; R.frame(alpha, __t); } return n; };
  window.setBody = (s, cells, dir) => { s.body = cells.map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; s.queue = []; s.planned = null; };
  window.stage = personas => { const g = E.createGame({ withPlayer: true, personas }); g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.snakes.forEach((s, i) => setBody(s, [[2 + 4 * i, 23], [1 + 4 * i, 23], [4 * i, 23]], 'right')); return g; };
  window.show = g => { document.getElementById('overlay').classList.add('hidden'); R.setViewer(0); R.setGame(g); return g; };
  // The board's pixels in a box of cells (x0, y0, w, h in cells), as an ImageData.
  window.pixels = (x0, y0, w, h) => { const c = document.getElementById('game'), k = c.width / (TUNING.GRID * ${CELL}); return c.getContext('2d').getImageData(Math.round(x0 * ${CELL} * k), Math.round(y0 * ${CELL} * k), Math.round(w * ${CELL} * k), Math.round(h * ${CELL} * k)); };
  window.lum = d => { let s = 0; for (let i = 0; i < d.data.length; i += 4) s += 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]; return s / (d.data.length / 4); };
  window.rgb = (x, y) => { const d = pixels(x, y, 0.12, 0.12).data; let r = 0, g = 0, b = 0, n = d.length / 4; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; } return [r / n, g / n, b / n].map(Math.round); };
  return 'ok';
})()`;

(async () => {
  const site = await serve();
  const b = await launch();
  const ev = expr => b.eval(expr);
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });
    await b.viewport(800, 800);

    // ------------------------------------------------- a flash, as drawn
    // A real round, its loop stopped and stepped by hand on a virtual 60 Hz
    // clock (vf(n): n frames), the rivals stunned out of the way, everyone
    // held fed, its clock held at `time`. Each frame keeps where your head's
    // drawn (__frames: x, y in cells) and the streaks drawn (__streaks), each
    // tick your head's cells and what it did (__steps).
    const round = async time => {
      await ev(`window.__autoRaf = true; 'ok'`);
      await b.go(site.url + '?debug');
      await ev(`document.getElementById('start').click(); 'ok'`);
      await ev(`new Promise(r => { const c = () => SnakeDebug.state() === 'running' ? r('ok') : setTimeout(c, 10); c(); })`);
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
    const toTick = async (n = 0) => {
      const n0 = await ev('__steps.length');
      for (let i = 0; i < 14 && await ev('__steps.length') === n0; i++) await ev('vf(1)');
      if (n) await ev(`vf(${n})`);
    };
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

    // ------------------------------------------------ staged boards
    await ev(`window.__autoRaf = true; 'ok'`);
    await b.go(site.url + '?debug');
    await b.sleep(300);
    await ev(STAGE);

    // A dead snake's beads: every other segment, in its own markings.
    const beads = await ev(`(() => {
      const g = stage(['joker', 'wildcard', 'colonist']), [you, joker, wild] = g.snakes;
      setBody(joker, Array.from({ length: 16 }, (_, i) => [20 - i, 4]), 'right');
      setBody(wild, Array.from({ length: 16 }, (_, i) => [20 - i, 10]), 'right');
      show(g); drawN(10);
      for (const s of [joker, wild]) { s.alive = false; s.killer = 'wall'; s.body.forEach((c, j) => { if (j % TUNING.CORPSE_EVERY === 0) g.food.push({ x: c.x, y: c.y, kind: 'pellet', color: s.color, owner: s.id, expires: g.tick + 900 }); }); }
      g.tick++;
      R.onTick([{ type: 'death', snake: joker }, { type: 'death', snake: wild }]);
      drawN(90);
      const at = (y, n) => rgb(20 - n * TUNING.CORPSE_EVERY + 0.5, y + 0.55); // (the bead's middle, below its gloss)
      return { joker: [1, 2, 3, 4, 5].map(n => at(4, n)), wild: [2, 3, 4, 5, 6, 7].map(n => at(10, n)) };
    })()`);
    const amber = ([r, g, b]) => r > b + 80 && g > b + 40, purple = ([r, g, b]) => r > g + 50 && b > g + 50, red = ([r, g, b]) => r > g + 60 && r > b + 50;
    const navy = ([r, g, b]) => b > r + 15 && b > g + 15, white = ([r, g, b]) => Math.min(r, g, b) > 140 && Math.max(r, g, b) - Math.min(r, g, b) < 45;
    check(beads.joker.every((c, i) => (i % 2 ? purple : amber)(c)), 'Joker’s beads alternate amber and purple', JSON.stringify(beads.joker));
    const wildWant = [navy, navy, white, red, white, red];
    check(beads.wild.every((c, i) => wildWant[i](c)), 'Wildcard’s beads keep the stars and stripes', JSON.stringify(beads.wild));

    // Stunned, a jump and a flash both asked, a turn up pressed, a body one
    // thick right above: the game will hop it (a jump goes first), so the
    // mark is the jump's hop, in sky, not the flash's chevrons, in ember.
    // Two thick, there's nowhere to land: the flash's.
    const marks = await ev(`(() => {
      const out = {};
      for (const thick of [1, 2]) {
        const g = stage(['creeper', 'ghost', 'mason']), [you, o] = g.snakes;
        setBody(you, Array.from({ length: 8 }, (_, i) => [10 - i, 13]), 'right');
        setBody(o, Array.from({ length: 7 * thick }, (_, i) => i < 7 ? [7 + i, 12] : [20 - i, 11]), 'left'); o.stunUntil = 1e9;
        you.stunUntil = g.tick + 2; you.queue = [E.DIRS.up]; you.leapReadyAt = you.flashReadyAt = 0;
        E.leap(g, you); E.flash(g, you);
        show(g); drawN(10);
        const d = pixels(9, 10.5, 3, 2.5).data, near = (i, c) => Math.abs(d[i] - c[0]) < 30 && Math.abs(d[i + 1] - c[1]) < 30 && Math.abs(d[i + 2] - c[2]) < 30;
        let sky = 0, ember = 0;
        for (let i = 0; i < d.length; i += 4) { if (near(i, [168, 220, 245])) sky++; else if (near(i, [247, 168, 102])) ember++; }
        const did = [];
        for (let k = 0; k < 3; k++) { E.step(g); for (const e of g.events) if (e.snake === you && ['leap', 'dash', 'fizzle', 'crash'].includes(e.type)) did.push(e.type); }
        out[thick] = { sky, ember, did: did.join(', ') || 'nothing' };
      }
      return out;
    })()`);
    check(marks[1].sky > 8 && marks[1].ember < 3 && marks[1].did.startsWith('leap'), 'stunned, a jump and a flash asked, a body one thick ahead: the jump’s mark (the game hops)', `sky ${marks[1].sky}, ember ${marks[1].ember} pixels; then ${marks[1].did}`);
    check(marks[2].ember > 8 && marks[2].sky < 3, 'stunned, both asked, a body two thick ahead: the flash’s mark', `sky ${marks[2].sky}, ember ${marks[2].ember} pixels; then ${marks[2].did}`);

    // Golden power pips at the board's edge, the arc behind the head off it
    // (a head just turned off an edge, a corner): none cut off (as many of
    // their pixels as in the middle of the board), none on the head (no sky
    // or ember inside its face: moving the arc in put them over its eyes),
    // and stunned, the stars keep clear of them (as many still showing). On
    // a bigger board: a pip is a few pixels across on the usual one. Each
    // look is drawn on the same clock (the ember dashes running along the
    // gold line, and the stars going round, at the same place in every one:
    // on the page's own clock, their edges' blend with the gold passed for
    // ember a varying amount, and an edge sometimes fell short), with no
    // falling leaves.
    await b.viewport(1600, 1600);
    await b.sleep(400);
    const pips = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const look = (body, dir, leaps, dashes, middle, stun) => {
        const g = stage(['creeper', 'vulture', 'mason']), you = g.snakes[0], [hx, hy] = body[0], dx = middle ? 11 - hx : 0, dy = middle ? 11 - hy : 0;
        setBody(you, body.map(([x, y]) => [x + dx, y + dy]), dir); you.leaps = leaps; you.dashes = dashes;
        g.snakes.slice(1).forEach((s, i) => setBody(s, [[19, 19 + 2 * i], [18, 19 + 2 * i], [17, 19 + 2 * i]], 'right'));
        if (stun) you.stunUntil = g.tick + 5;
        __t = 5e6; show(g); drawN(20);
        const x0 = Math.max(0, hx + dx - 3), y0 = Math.max(0, hy + dy - 3), w = Math.min(TUNING.GRID, hx + dx + 4) - x0, h = Math.min(TUNING.GRID, hy + dy + 4) - y0;
        const p = pixels(x0, y0, w, h), d = p.data, ppc = p.width / w, near = (i, c) => Math.abs(d[i] - c[0]) < 30 && Math.abs(d[i + 1] - c[1]) < 30 && Math.abs(d[i + 2] - c[2]) < 30;
        let all = 0, face = 0, sky = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (near(i, [168, 220, 245])) sky++;
          else if (!near(i, [247, 168, 102])) continue;
          all++;
          const px = x0 + ((i / 4) % p.width + 0.5) / ppc, py = y0 + (Math.floor(i / 4 / p.width) + 0.5) / ppc;
          if (Math.hypot(px - (hx + dx + 0.5), py - (hy + dy + 0.5)) < 0.44) face++;
        }
        return { all, face, sky, ember: all - sky };
      };
      const col = (x, y0, n) => Array.from({ length: n }, (_, i) => [x, y0 + i]), row = (x0, y, n) => Array.from({ length: n }, (_, i) => [x0 + i, y]);
      const cases = [
        ['in the first column heading up', col(0, 6, 8), 'up', 2, 2],
        ['in the first column heading right, just turned off it', col(0, 6, 6), 'right', 3, 2],
        ['in the first column heading right, one of each', col(0, 6, 6), 'right', 1, 1],
        ['in the top row heading down', row(12, 0, 6), 'down', 2, 2],
        ['in the bottom-left corner heading right', Array.from({ length: 6 }, (_, i) => [0, 23 - i]), 'right', 3, 3],
        ['in the last column heading left', col(23, 12, 6), 'left', 2, 1],
      ];
      const out = cases.map(([what, body, dir, leaps, dashes]) => ({ what, edge: look(body, dir, leaps, dashes, false, false), stun: look(body, dir, leaps, dashes, false, true), middle: look(body, dir, leaps, dashes, true, false) }));
      SnakeDebug.pinQuality(2);
      return out;
    })()`);
    for (const { what, edge, stun, middle } of pips) {
      check(middle.all > 0 && edge.all >= 0.85 * middle.all && edge.face === 0 && stun.all >= 0.85 * middle.all,
        `golden power pips ${what}: all on the board, none on the head, clear of the stun stars`, `sky and ember pixels ${edge.sky} and ${edge.ember} (in the middle ${middle.sky} and ${middle.ember}, stunned ${stun.sky} and ${stun.ember}), ${edge.face} inside its face`);
    }

    // Star: a star for a head (five points round it, where a round head has
    // none), the old rainbow flowing down its body from the head (held still
    // with reduced motion), the gold line round its points, and its beads in
    // rainbow order. Two Stars heading right along rows 8 and 14, one
    // resting, one ready; Mason (a round head) beside them. (Its tell, its
    // face and its rainbow on others: below.)
    const stars = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round((h * 60 + 360) % 360); };
      const yellow = ([r, g, b]) => r > 150 && g > 100 && b < 120 && r - b > 70 && r >= g, honey = ([r, g, b]) => r > 225 && g > 195 && b > 95 && b < 185;
      const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
      // The colours round a head, n of them, r cells out, starting straight ahead (heading right) and going round.
      const ring = (s, r, n = 72) => { const [cx, cy] = at(s), p = pixels(cx - 1.5, cy - 1.5, 3, 3), ppc = p.width / 3, out = [];
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, j = (Math.round((1.5 + Math.sin(a) * r) * ppc) * p.width + Math.round((1.5 + Math.cos(a) * r) * ppc)) * 4; out.push([p.data[j], p.data[j + 1], p.data[j + 2]]); }
        return out; };
      // The middles of the runs of colours that pass is(), in degrees round from straight ahead.
      const runs = (ring, is) => { const n = ring.length, out = []; for (let i = 0; i < n; i++) { if (!is(ring[i]) || is(ring[(i + n - 1) % n])) continue; let j = i; while (is(ring[(j + 1) % n]) && j - i < n) j++; out.push(Math.round(((i + j) / 2 / n * 360) % 360)); } return out; };
      const seg = (s, i) => { const [cx, cy] = at(s); return rgb(cx - i + 0.04, cy + 0.04); }; // (segment i's middle, below its sheen)
      const SEGS = [2, 3, 4, 7], out = {};
      const g = stage(['star', 'star', 'mason']), [you, rest, ready] = g.snakes;
      setBody(rest, Array.from({ length: 16 }, (_, i) => [16 - i, 8]), 'right'); rest.flashReadyAt = g.time + 1e6;
      setBody(ready, Array.from({ length: 16 }, (_, i) => [16 - i, 14]), 'right'); ready.flashReadyAt = 0;
      R.setReducedMotion(true); // (its rainbow held still: its neck isn't yellow, nor its points twinkling)
      __t = 7e6; show(g); drawN(20);
      out.points = [0.66, 0.7].map(r => runs(ring(rest, r), yellow));
      const still = SEGS.map(i => seg(rest, i));
      drawN(15); // (half a second on)
      out.still = { before: still, after: SEGS.map(i => seg(rest, i)) };
      R.setReducedMotion(false);
      drawN(20);
      const t0 = SEGS.map(i => hue(seg(rest, i)));
      for (let i = 0; i < 28; i++) { __t += 15; R.frame(0.5, __t); } // (28 hues on, 15 ms each: a segment's worth)
      const t1 = SEGS.map(i => hue(seg(rest, i)));
      out.flow = { t0, t1 };
      // Golden powers held: the gold line round its two front points.
      rest.leaps = 2; drawN(10);
      const gold = ring(rest, 0.875, 360);
      out.gold = [-36, 36].map(d => [-2, -1, 0, 1, 2].some(k => honey(gold[(360 + d + k) % 360])));
      R.setReducedMotion(false);
      // A dead Star's beads: every other segment, round the rainbow from its head.
      const g2 = stage(['star', 'ghost', 'mason']), st = g2.snakes[1];
      setBody(st, Array.from({ length: 16 }, (_, i) => [20 - i, 10]), 'right');
      show(g2); drawN(10);
      st.alive = false; st.killer = 'wall'; st.body.forEach((c, j) => { if (j % TUNING.CORPSE_EVERY === 0) g2.food.push({ x: c.x, y: c.y, kind: 'pellet', color: st.color, owner: st.id, expires: g2.tick + 900 }); });
      g2.tick++;
      R.onTick([{ type: 'death', snake: st }]);
      drawN(90);
      out.beads = [0, 1, 2, 3, 4, 5, 6].map(n => hue(rgb(20 - n * TUNING.CORPSE_EVERY + 0.5, 10 + 0.55)));
      SnakeDebug.pinQuality(2);
      return out;
    })()`);
    const dh = (a, b) => Math.abs(((a - b + 540) % 360) - 180), POINTS = [36, 108, 180, 252, 324]; // (heading right, a point to the back)
    check(stars.points.some(p => p.length === 5 && POINTS.every(d => p.some(m => dh(m, d) < 12))), 'Star’s head is a star: five points round it, one to the back',
      `yellow runs ${stars.points.map((p, i) => `${[0.66, 0.7][i]} cells out at ${p.join(', ')}°`).join('; ')} (a round head reaches 0.54)`);
    const same = stars.still.before.every((c, i) => c.every((v, j) => Math.abs(v - stars.still.after[i][j]) <= 2));
    check(same, 'Star’s rainbow holds still with reduced motion', `segments 2, 3, 4, 7: ${JSON.stringify(stars.still.before)} then ${JSON.stringify(stars.still.after)}`);
    const { t0, t1 } = stars.flow;
    check(new Set(t0).size === 4 && t0.every((h, i) => dh(h, t1[i]) > 15) && dh(t1[1], t0[0]) < 14 && dh(t1[2], t0[1]) < 14,
      'Star’s rainbow flows down its body from the head', `hues of segments 2, 3, 4, 7: ${t0.join(', ')}, a segment’s worth later ${t1.join(', ')}`);
    check(stars.gold.every(Boolean), 'holding golden powers, Star’s gold line runs round its points', `Honey just past its two front points: ${stars.gold.join(', ')}`);
    const want = [0, 32, 55, 130, 205, 275, 0];
    check(stars.beads.every((h, i) => dh(h, want[i]) < 22), 'a dead Star’s beads go round the rainbow from its head', `hues ${stars.beads.join(', ')} (red, orange, yellow, green, blue, violet, red: ${want.join(', ')})`);

    // Star's tell is a countdown on its points: its middle always its
    // sunflower; just flashed, its five points dim; they light one by one as
    // its rest runs down (a point each 1.2 s), and never go out until it
    // flashes again, with reduced motion too (it flashes the moment it can,
    // so a star lit only while its flash was ready was dim nearly all the
    // time, and with reduced motion blinked). Its twinkles burst off its
    // points as it flashes, not as its flash comes back (it never holds it
    // for long). Its face is upright at every heading (the mustache under its
    // eyes: heading up it sat over them, as huge angry brows). Stars heading
    // down, read at three of its points (its back point, up, the first to
    // light, the next round, the second, and the last: the other two have
    // its mustache over them) and either side of its eyes, in pixels of
    // just its sunflower or its dim mustard (an inked edge over sunflower
    // passes for mustard).
    const tell = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
      const SUN = [249, 194, 46], DIM = [176, 137, 58], d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
      // Lit (1) or dim (0), r cells out from s's head at angle ang: more pixels round there of its sunflower than of its mustard.
      const lit = (s, ang, r) => { const [cx, cy] = at(s), p = pixels(cx + Math.cos(ang) * r - 0.07, cy + Math.sin(ang) * r - 0.07, 0.14, 0.14); let sun = 0, dim = 0;
        for (let i = 0; i < p.data.length; i += 4) { const c = [p.data[i], p.data[i + 1], p.data[i + 2]]; if (d2(c, SUN) < 15 * 15) sun++; else if (d2(c, DIM) < 15 * 15) dim++; }
        return sun > dim ? 1 : 0; };
      const points = s => [0, 1, 4].map(j => lit(s, (270 + 72 * j) * Math.PI / 180, 0.55)).join(''); // (its first, second and fifth)
      const middle = s => lit(s, 0, 0.33) && lit(s, Math.PI, 0.33) ? 1 : 0;
      const down = (s, x) => setBody(s, Array.from({ length: 10 }, (_, i) => [x, 14 - i]), 'down');
      const out = { now: {}, run: {} };
      for (const still of [true, false]) {
        R.setReducedMotion(still);
        const how = still ? 'reduced' : 'lively';
        // Just flashed, half rested, rested.
        const g = stage(['star', 'star', 'star']), [, a, b2, c] = g.snakes;
        down(a, 6); down(b2, 12); down(c, 18);
        a.flashReadyAt = g.time + 6000; b2.flashReadyAt = g.time + 3000; c.flashReadyAt = g.time;
        show(g); drawN(20);
        out.now[how] = [a, b2, c].map(s => ({ points: points(s), middle: middle(s) }));
        // A whole rest, a frame every 100 ms of the game's clock: its points lit, and its middle.
        const g2 = stage(['star', 'mason', 'ghost']), st = g2.snakes[1];
        down(st, 12);
        st.flashReadyAt = g2.time + 6000;
        show(g2); drawN(20, 0.5, 100);
        const run = [];
        for (let t = 0; t <= 6500; t += 100) { g2.time = 60000 + t; drawN(1, 0.5, 100); run.push([t, points(st).split('').reduce((n, v) => n + +v, 0), middle(st)]); }
        out.run[how] = run;
      }
      // The burst: its flash comes back (no burst), then it flashes (a burst), lively.
      R.setReducedMotion(false);
      const white = s => { const [cx, cy] = at(s), p = pixels(cx - 1.2, cy - 1.2, 2.4, 2.4); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (p.data[i] > 240 && p.data[i + 1] > 240 && p.data[i + 2] > 240) n++; return n; };
      const g3 = stage(['star', 'mason', 'ghost']), st3 = g3.snakes[1];
      down(st3, 12);
      st3.flashReadyAt = g3.time + 100;
      show(g3); drawN(20);
      const base = white(st3);
      g3.time += 200; // (its flash back)
      let back = 0; for (let i = 0; i < 8; i++) { drawN(1); back = Math.max(back, white(st3) - base); }
      st3.flashReadyAt = g3.time + 6000; g3.tick++;
      R.onTick([{ type: 'dash', snake: st3, x: 12, y: 11, n: 3, plain: 1 }]); // (it flashes)
      let flash = 0; for (let i = 0; i < 8; i++) { drawN(1); flash = Math.max(flash, white(st3) - base); }
      out.burst = { base, back, flash };
      R.setReducedMotion(false);
      SnakeDebug.pinQuality(2);
      return out;
    })()`);
    for (const how of ['reduced', 'lively']) {
      const [spent, half, full] = tell.now[how];
      check(spent.points === '000' && half.points === '110' && full.points === '111' && spent.middle && half.middle && full.middle,
        `Star’s tell, ${how === 'reduced' ? 'with reduced motion' : 'lively'}: just flashed its points are dim, half rested the first two lit, rested all, its middle lit throughout`,
        `its first, second and fifth points ${spent.points}, ${half.points}, ${full.points}; its middle ${spent.middle}${half.middle}${full.middle}`);
      const run = tell.run[how], steps = run.filter((r, i) => i && r[1] !== run[i - 1][1]), when = [1200, 2400, 6000];
      check(run[0][1] === 0 && run.every(r => r[2]) && steps.length === 3 && steps.every((r, i) => r[1] === i + 1 && Math.abs(r[0] - when[i]) <= 250),
        `Star’s tell, ${how === 'reduced' ? 'with reduced motion' : 'lively'}: through a rest its points light in turn, a point each 1.2 s, none going out, its middle lit`,
        `its first, second and fifth points lit (ms into the rest: how many) ${steps.map(r => `${r[0]}: ${r[1]}`).join(', ')}; middle dim in ${run.filter(r => !r[2]).length} of ${run.length} frames`);
    }
    check(tell.burst.flash > 150 && tell.burst.back * 3 < tell.burst.flash, 'Star’s twinkles burst off its points as it flashes, not as its flash comes back',
      `white pixels round its head over a few frames: ${tell.burst.back} as its flash came back, ${tell.burst.flash} as it flashed (${tell.burst.base} before)`);
    // Its face at each heading, half rested (no twinkles) and held still, on
    // a sharper board (more pixels to its mustache): the white past the reach
    // of its brows (and eyes) is its mustache's ends, and sits under its middle.
    await b.viewport(800, 800, { scale: 2 });
    await b.sleep(400);
    const face = await ev(`(() => {
      SnakeDebug.pinQuality(2);
      R.setReducedMotion(true);
      const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
      const g = stage(['star', 'star', 'star']), heads = g.snakes;
      setBody(heads[0], Array.from({ length: 8 }, (_, i) => [5, 8 + i]), 'up');
      setBody(heads[1], Array.from({ length: 8 }, (_, i) => [12, 15 - i]), 'down');
      setBody(heads[2], Array.from({ length: 8 }, (_, i) => [8 + i, 20]), 'left');
      setBody(heads[3], Array.from({ length: 8 }, (_, i) => [20 - i, 4]), 'right');
      heads[0].persona = heads[1].persona; heads[0].personaKey = 'star'; heads[0].memory = {}; // (you, as a Star)
      for (const s of heads) s.flashReadyAt = g.time + 3000;
      show(g); R.setViewer(99); drawN(20);
      const out = heads.map(s => { const [cx, cy] = at(s), p = pixels(cx - 1, cy - 1, 2, 2); let n = 0, sy = 0;
        for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
          const i = (y * p.width + x) * 4, mn = Math.min(p.data[i], p.data[i + 1], p.data[i + 2]), mx = Math.max(p.data[i], p.data[i + 1], p.data[i + 2]);
          if (mn > 185 && mx - mn < 45 && Math.abs(x / p.width * 2 - 1) > 0.36) { n++; sy += y; } // (whitish, more than 0.36 cells to either side)
        }
        return { n, below: n ? +((sy / n) / p.height * 2 - 1).toFixed(2) : 0 }; }); // (cells below its middle)
      R.setReducedMotion(false);
      return out;
    })()`);
    check(face.every(f => f.n >= 6 && f.below > 0.1), 'Star’s face is upright at every heading: its mustache under its eyes',
      `its mustache’s ends (pixels, cells below the head’s middle), heading up, down, left, right: ${face.map(f => `${f.n}, ${f.below}`).join('; ')}`);

    // Star's rainbow on others: Copycat copying Star wears a pale copy of it,
    // flowing as Star's does (its tint of Star's stand-in colour in text was
    // a pale gold all over, that read as a power and hid its gold line), and
    // the shockwave Star goes off with is its rainbow, not that gold (with
    // reduced motion, the ring's there at once: read round its lower half,
    // clear of the word over its head).
    const bows = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round((h * 60 + 360) % 360); };
      const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
      const seg = (s, i) => { const [cx, cy] = at(s); return rgb(cx - i + 0.04, cy + 0.04); };
      const SEGS = [2, 3, 4, 7], out = {};
      R.setReducedMotion(false);
      const g = stage(['copycat', 'star', 'mason']), [, cc, st] = g.snakes;
      setBody(st, Array.from({ length: 12 }, (_, i) => [16 - i, 8]), 'right');
      setBody(cc, Array.from({ length: 12 }, (_, i) => [16 - i, 14]), 'right'); cc.memory.modelId = st.id;
      show(g); drawN(20);
      out.copy = SEGS.map(i => seg(cc, i));
      out.star = SEGS.map(i => seg(st, i));
      out.tint = R.colorOf(cc);
      // Star out: its shockwave, held still (reduced motion), a moment on.
      R.setReducedMotion(true);
      const g2 = stage(['star', 'ghost', 'mason']), s2 = g2.snakes[1];
      setBody(s2, Array.from({ length: 12 }, (_, i) => [16 - i, 12]), 'right');
      show(g2); drawN(5);
      s2.alive = false; s2.killer = 'wall'; g2.tick++;
      R.onTick([{ type: 'death', snake: s2 }]);
      drawN(1);
      const [hx, hy] = [16.5, 12.5], rr = 2.25; // (its ring, held at half its reach)
      out.ring = [0, 60, 120, 180].map(d => hue(rgb(hx + Math.cos(d * Math.PI / 180) * rr - 0.06, hy + Math.sin(d * Math.PI / 180) * rr - 0.06)));
      R.setReducedMotion(false);
      SnakeDebug.pinQuality(2);
      return out;
    })()`);
    const hueOf = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn || 1; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return Math.round((h * 60 + 360) % 360); };
    const copyHues = bows.copy.map(hueOf), starHues = bows.star.map(hueOf), paler = bows.copy.every((c, i) => Math.min(...c) > Math.min(...bows.star[i]) + 20);
    check(new Set(copyHues).size === 4 && copyHues.every((h, i) => dh(h, starHues[i]) < 14) && paler && bows.tint !== '#f3d577',
      'Copycat copying Star wears a pale copy of its rainbow, flowing with Star’s, not a pale gold',
      `hues of segments 2, 3, 4, 7: ${copyHues.join(', ')} (Star’s ${starHues.join(', ')}); ${JSON.stringify(bows.copy)} against ${JSON.stringify(bows.star)}; its colour ${bows.tint}`);
    const ringWant = [32, 55, 130, 205]; // (orange, yellow, green, blue: the arcs at 0°, 60°, 120° and 180°)
    check(bows.ring.every((h, i) => dh(h, ringWant[i]) < 25), 'Star goes off in a ring of its rainbow, not its stand-in gold',
      `the ring’s hues at 0°, 60°, 120°, 180°: ${bows.ring.join(', ')} (want about ${ringWant.join(', ')})`);
    await b.viewport(800, 800);
    await b.sleep(400);

    // Scorch: soot, not holes (no canopy or falling leaves: SnakeDebug.pinQuality(0)).
    const soot = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const g = stage(['gobbler', 'ghost', 'mason']);
      const cells = [[10, 5], [11, 5], [12, 5], [10, 6], [11, 6], [12, 6], [11, 7], [5, 12]];
      show(g); drawN(10);
      const look = () => cells.map(([x, y]) => ({ mid: lum(pixels(x + 0.35, y + 0.35, 0.3, 0.3)), cell: lum(pixels(x, y, 1, 1)) }));
      const before = look();
      g.fires = new Map(cells.map(([x, y]) => [y * TUNING.GRID + x, { from: 0, until: 1e9 }])); g.tick++; drawN(3);
      g.fires = new Map(); g.tick++; drawN(150); // (the smoke cleared)
      const after = look();
      SnakeDebug.pinQuality(2);
      return cells.map((c, i) => ({ cell: +(after[i].cell / before[i].cell).toFixed(2), mid: +(after[i].mid / before[i].mid).toFixed(2) }));
    })()`);
    check(soot.every(s => s.cell >= 0.78), 'a burned cell is no more than a little darker', soot.map(s => s.cell).join(', '));
    check(soot.every(s => s.mid >= 0.8 * s.cell), 'and not darkest in its middle (no dark disc)', soot.map(s => `${s.mid}/${s.cell}`).join(', '));

    // The Field guide's pictures.
    const guide = await ev(`(() => {
      const out = {};
      for (const k of ['apple', 'golden', 'mushroom', 'goldcap', 'leaf', 'beetle', 'goldbeetle', 'pellet', 'roast', 'baked', 'jump', 'flash', 'wrap', 'held', 'rests', 'hole', 'fire', 'land']) {
        const c = R.guideSprite(k, 72), d = c.getContext('2d').getImageData(0, 0, 72, 72).data;
        let ink = 0, sky = 0, ember = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 200) ink++;
          if (d[i + 3] > 200 && Math.abs(d[i] - 168) < 30 && Math.abs(d[i + 1] - 220) < 30 && Math.abs(d[i + 2] - 245) < 30) sky++;
          if (d[i + 3] > 200 && Math.abs(d[i] - 247) < 30 && Math.abs(d[i + 1] - 168) < 30 && Math.abs(d[i + 2] - 102) < 30) ember++;
        }
        out[k] = { ink, sky, ember, edge: d[(36 * 72 + 2) * 4 + 3] };
      }
      return out;
    })()`);
    check(Object.values(guide).every(g => g.ink > 200), 'every Field guide picture draws', Object.entries(guide).filter(([, g]) => g.ink <= 200).map(([k]) => k).join(', ') || 'all');
    check(guide.mushroom.edge > 200, 'the guide’s mushroom is on bark');
    check(guide.held.sky > 0 && guide.held.ember > 0 && guide.rests.sky > 0 && guide.rests.ember > 0, 'the guide shows golden pips and your rests', `held ${guide.held.sky}/${guide.held.ember}, rests ${guide.rests.sky}/${guide.rests.ember} sky/ember pixels`);

    console.log(results.join('\n'));
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log('\nall passed');
})().catch(e => { console.error(e); process.exit(1); });
