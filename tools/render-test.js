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
//   rainbow streams back along it as it goes, faster than it crawls
//   (backward over the log, each segment round the rainbow about once a
//   second; still while it's stunned, a burst as it flashes; with reduced
//   motion a slow drift where it is), its gold line runs round its points, and a dead Star's beads go
//   round the rainbow from its head. Its tell is a countdown: its points go
//   dim as it flashes and light one by one through its rest, its middle
//   always lit (with reduced motion too: a point at a time, never a blink),
//   and its twinkles burst as it flashes, not as its flash comes back. Its
//   face is upright at every heading. Copycat copying it wears a pale copy
//   of its rainbow (not a pale gold), and it goes off in a rainbow ring.
//   Its gag is its mustache: the ends twirl up beside its eyes and nothing
//   comes out past its chin; Copycat copying it holds up a stick-on one.
// - Scorch marks are soot, not holes: a burned cell is no more than a little
//   darker, and not darkest in its middle.
// - Jumps you can see: at the top the neck arches up behind the head and
//   the shadow, left on the ground, falls across the body hopped; after, the
//   body still arches over what it crossed (both, for a golden jump over
//   two); dust puffs at take-off, rings the landing, and a faint trail
//   marks the way; with reduced motion the lift and shadow, no dust or trail.
// - Bridges you can see: a body over a pit is shaded underneath and sags,
//   its shadow shows on the pit's floor (dark, in a floor lit round it),
//   and a tail end over a hole droops, darker.
// - Choking (staged from the engine's choke and nudge events): the cheeks
//   puff with the bead in its mouth (none of it over the face), then it's
//   spat aside out of its cheek, in an arc to where it went; coughing, the
//   mouth stays shut and puffs of breath come out, big enough to see on a
//   phone, the head jolting (with reduced motion, the puffs still, no
//   jolt); nudged food rolls aside, and a beetle scurries.
// - Beetles and the woodpecker's knock (staged from the engine's state and
//   events): two beetles out at once, each drawn; a cornered one digs in
//   (it sinks, a collar of sawdust round it, sawdust spraying; with reduced
//   motion, still and no spray), and its bore is left a burrow, freshly
//   bored (raw splinters, sawdust round it), settling into an ordinary one
//   in a few seconds; no heap is left where no burrow is; a burrow closing
//   over fills with sawdust and moss and is gone into the bark in about a
//   second (with reduced motion, filled at once, then fading); through the
//   aim, food in the mark trembles (by CSS px: on a phone too) and a ring
//   marks where it'll be knocked to (the engine's own list: never two on
//   one cell, never a burrow); at the strike it flies there in an arc,
//   rimmed so it reads over a body, and a beetle scurries there. Copycat
//   copying Star keeps its own red head.
// - A pecked flag is a lost colony: the flag tips and falls into the pit
//   (the other colony's stands), its land shrinks away into the pit, and
//   Sovereign's banner is carried to its new capital, not jumping there.
// - A strike that doesn't stutter: the land a strike leaves, made ahead
//   while the woodpecker aims and swapped in, is the very land made at the
//   strike, pixel for pixel; and with the land changing otherwise as it
//   strikes, it's made the old way, and is still the same.
// - Every Field guide picture draws (the mushroom on bark; a snake holding
//   golden powers; your rests).
// - The next round's stretch of log, made ahead in idle time, is the very
//   bark and leaf shadows a round starting without it builds from the same
//   seed.
// - A woodpecker you can believe: resting, its eye follows a head moving
//   near it (its pupil, read off its own layer); through the aim its head
//   turns to its patch, tilting, its eye on it; it strikes a blow on each
//   knock of the drum (one table for both), the last on the strike's tick;
//   drumming, it clings clear of the rings where food in its mark will
//   land, if it can, and a ring or a piece in the air it still covers is
//   drawn over it; in a round the game starts the drum so its last knock
//   lands on the strike as drawn, and says "kik!" on the frame it lands back on its
//   perch; its layer is the board and the room round it, and a phone's
//   address bar coming and going never makes it again; with reduced
//   motion, no wingbeats and no bob, and fewer, slower blows.
//
//   node tools/render-test.js [--seed N]   (N: other staged boards, other bark)
const { launch, serve } = require('./browser');

const SEED = process.argv.includes('--seed') ? Number(process.argv[process.argv.indexOf('--seed') + 1]) : 1;
const CELL = 32; // (the board's units a cell, as render/ draws them)
const results = [];
let failed = 0;
const check = (ok, what, detail = '') => {
  results.push(`${ok ? 'ok  ' : 'FAIL'} ${what}${detail ? ` (${detail})` : ''}`);
  if (!ok) failed++;
};

// Before the page's own scripts: a switch for its animation loop; a wait for
// the page to settle (the board laid out, at its size, after a load or a
// new viewport: three frames, the last two at the same size); and the same
// randomness every time, from a seed set as each staged board is shown (so
// each gets the same stretch of bark: nothing else draws at random while
// the loop is stopped). Nothing runs in idle time on its own: the next
// round's log the renderer asks to make ahead then is kept (__nextLog), and
// made only by the check that compares it with one built directly; made
// whenever the page found a moment, it would have drawn its own seed.
const PRE = `(() => {
  const raw = window.requestAnimationFrame.bind(window);
  window.__autoRaf = true;
  window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); });
  window.__settle = () => new Promise(r => { let was = '', n = 0; (function f() { raw(() => { const c = document.getElementById('game'), now = c ? c.width + 'x' + c.height : ''; n = now === was ? n + 1 : 0; was = now; if (n >= 2) r('ok'); else f(); }); })(); });
  let seed = ${SEED};
  window.__reseed = s => { seed = s >>> 0; };
  Math.random = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  window.__nextLog = null;
  window.requestIdleCallback = cb => { if (cb.name === 'makeNext') window.__nextLog = cb; return 0; };
})();`;

// Staged boards, drawn by hand (the page's loop stopped), and pixels read off them.
const STAGE = `(() => {
  window.__autoRaf = false;
  window.E = SnakeEngine; window.R = SnakeRender;
  window.__t = performance.now() + 1e6;
  window.drawN = (n, alpha = 0.5, step = 33) => { for (let i = 0; i < n; i++) { __t += step; R.frame(alpha, __t); } return n; };
  window.setBody = (s, cells, dir) => { s.body = cells.map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; s.queue = []; s.planned = null; };
  let boards = 0;
  window.stage = personas => { __reseed(${SEED} * 1000 + ++boards); const g = E.createGame({ withPlayer: true, personas }); g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.snakes.forEach((s, i) => setBody(s, [[2 + 4 * i, 23], [1 + 4 * i, 23], [4 * i, 23]], 'right')); return g; };
  window.show = g => { document.getElementById('overlay').classList.add('hidden'); R.setViewer(0); __reseed(${SEED} * 1000 + 500 + boards); R.setGame(g); return g; };
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

    // ------------------------------------------------ staged boards
    await ev(`window.__autoRaf = true; 'ok'`);
    await b.go(site.url + '?debug', { settle: 0 });
    await ev('__settle()');
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
    await ev('__settle()');
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
    // none), the old rainbow streaming back along its body as it goes (round
    // the rainbow about once a second at a segment, at 1.25 times its crawl,
    // so a colour goes back over the log at a quarter of it; still while it's
    // stunned; a burst as it flashes; drifting slowly where it is with
    // reduced motion), the gold line round its points, and its beads in
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
      R.setReducedMotion(true); // (its rainbow drifting slowly where it is: its neck isn't yellow, nor its points twinkling)
      __t = 7e6; show(g); drawN(20);
      out.points = [0.66, 0.7].map(r => runs(ring(rest, r), yellow));
      const still = SEGS.map(i => hue(seg(rest, i)));
      drawN(15); // (half a second on)
      const still2 = SEGS.map(i => hue(seg(rest, i)));
      drawN(60); // (two seconds more)
      out.still = { a: still, b: still2, c: SEGS.map(i => hue(seg(rest, i))) };
      R.setReducedMotion(false);
      drawN(20);
      // Going: a tick every 120 ms, 8 frames a tick (as at the opening
      // speed): segment 3's hue, and the hue on the log at a cell its body
      // lies over all the while, every other frame, unwound (degrees
      // turned). (Read off a copy of its row, not the board: read back that
      // often, the board would be moved off the GPU, and every check after
      // this one would see the CPU's drawing.)
      const turned = list => { let sum = 0; for (let i = 1; i < list.length; i++) sum += ((list[i] - list[i - 1] + 540) % 360) - 180; return Math.round(sum); };
      const board = document.getElementById('game'), copy = document.createElement('canvas'), cg = copy.getContext('2d', { willReadFrequently: true }), kk = board.width / (TUNING.GRID * ${CELL});
      copy.width = board.width; copy.height = Math.ceil(${CELL} * kk);
      const rowHue = (x, y) => { const d = cg.getImageData(Math.round(x * ${CELL} * kk), Math.round((y - 8) * ${CELL} * kk), 3, 3).data; let r = 0, gg = 0, bb = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; } return hue([r, gg, bb]); };
      const move = (s, cells = 1, events = []) => { s.prev = s.body.map(c => ({ ...c })); for (let j = 0; j < cells; j++) { const h = s.body[0]; s.body.unshift({ x: h.x + 1, y: h.y }); s.body.pop(); } g.tick++; R.onTick(events); };
      const play = (ticks, go) => {
        const s3 = [], log = [];
        for (let t = 0; t < ticks; t++) {
          go(t);
          for (let f = 1; f <= 8; f++) {
            __t += 15; R.frame(f / 8, __t);
            if (f % 2) continue;
            cg.clearRect(0, 0, copy.width, copy.height); cg.drawImage(board, 0, Math.round(8 * ${CELL} * kk), copy.width, copy.height, 0, 0, copy.width, copy.height);
            const [hx] = at(rest);
            s3.push(rowHue(hx - 3 + 0.04, 8.54)); log.push(rowHue(8.54, 8.54));
          }
        }
        return { seg: turned(s3), log: turned(log), ms: ticks * 120 };
      };
      setBody(rest, Array.from({ length: 16 }, (_, i) => [13 - i, 8]), 'right');
      drawN(10);
      out.going = play(6, () => move(rest)); // (13 to 19: cell 8 under segments 5 to 11)
      rest.stunUntil = g.tick + 20; // (stunned, it stays where it is: from the tick after, once it's no longer drawn on ahead)
      const stay = () => { rest.prev = rest.body.map(c => ({ ...c })); g.tick++; R.onTick([]); };
      play(1, stay);
      out.stunned = play(4, stay);
      rest.stunUntil = -1;
      setBody(rest, Array.from({ length: 16 }, (_, i) => [13 - i, 8]), 'right');
      drawN(10);
      out.normal = play(3, () => move(rest));
      setBody(rest, Array.from({ length: 16 }, (_, i) => [13 - i, 8]), 'right');
      drawN(10);
      out.flash = play(3, t => t ? move(rest) : move(rest, 1 + TUNING.DASH_LENGTH, [{ type: 'dash', snake: rest, x: 13, y: 8, plain: true }])); // (a flash, then on)
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
    const { a: s0, b: s1, c: s2 } = stars.still, d1 = s0.map((h, i) => dh(h, s1[i])), d2 = s0.map((h, i) => dh(h, s2[i]));
    check(new Set(s0).size === 4 && d1.every(d => d <= 10) && d2.every(d => d >= 12 && d <= 45) && Math.max(...d2) - Math.min(...d2) <= 8,
      'with reduced motion, Star’s rainbow drifts slowly where it is', `hues of segments 2, 3, 4, 7: ${s0.join(', ')}, half a second on ${s1.join(', ')}, two seconds more ${s2.join(', ')}`);
    const { going, stunned, normal, flash } = stars, perSec = v => Math.round(v / going.ms * 1000);
    check(perSec(going.seg) >= 220 && perSec(going.seg) <= 420 && perSec(going.log) >= 25 && perSec(going.log) <= 100,
      'Star’s rainbow streams back as it goes, faster than its crawl: backward over the log, each segment round the rainbow about once a second',
      `going at 120 ms a tick: segment 3 turned ${going.seg}° (${perSec(going.seg)}° a second), the log under it ${going.log}° (${perSec(going.log)}° a second: a colour going back over it at ${(perSec(going.log) / 28 / (1000 / 120)).toFixed(2)} of its crawl)`);
    check(Math.abs(stunned.seg) <= 4 && Math.abs(stunned.log) <= 4, 'stunned, it stays, and so does its rainbow', `segment 3 turned ${stunned.seg}°, the log under it ${stunned.log}°, in ${stunned.ms} ms`);
    check(flash.seg >= 2 * normal.seg, 'a flash bursts its rainbow on', `segment 3 turned ${flash.seg}° in the three ticks from a flash, ${normal.seg}° in three going on`);
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
    await ev('__settle()');
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

    // Star's gag is its mustache (round six A; it flicked out a star on a
    // ribbon of rainbow, which the owner didn't like): half way through it,
    // the mustache's ends have twirled up beside its eyes, and nothing bright
    // has come out past its chin (only a pale puff of breath). Copycat
    // copying it holds up a stick-on mustache under its nose instead. Star
    // heading down (its face upright, its chin down), Copycat heading right.
    const gag = await ev(`(() => {
      SnakeDebug.pinQuality(2);
      R.setReducedMotion(false);
      const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
      const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
      const white = (r, g, b) => Math.min(r, g, b) > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 40, bright = (r, g, b) => Math.max(r, g, b) > 150 && Math.max(r, g, b) - Math.min(r, g, b) > 90;
      const g = stage(['star', 'copycat', 'mason']), [, st, cc] = g.snakes;
      setBody(st, Array.from({ length: 8 }, (_, i) => [8, 9 - i]), 'down'); st.flashReadyAt = g.time + 3000; // (half rested: no twinkles)
      setBody(cc, Array.from({ length: 8 }, (_, i) => [13 - i, 16]), 'right'); cc.memory.modelId = st.id;
      show(g); R.setViewer(99); drawN(20);
      const look = () => { const [x, y] = at(st), [cx, cy] = at(cc);
        return { beside: count(x - 0.74, y - 0.14, 0.3, 0.26, white) + count(x + 0.44, y - 0.14, 0.3, 0.26, white), past: count(x - 0.45, y + 0.86, 0.9, 0.6, bright), nose: count(cx + 0.18, cy - 0.32, 0.36, 0.64, white) }; };
      const rest = look();
      R.flick(st, 0.5); R.flick(cc, 0.5); drawN(1, 0.5, 0.01);
      return { rest, mid: look() };
    })()`);
    check(gag.mid.beside > 3 * gag.rest.beside + 12 && gag.mid.past === 0 && gag.rest.past === 0, 'Star’s gag is its mustache: its ends twirl up beside its eyes, and nothing comes out past its chin',
      `white beside its eyes ${gag.rest.beside} at rest, ${gag.mid.beside} half way through; bright pixels past its chin ${gag.rest.past}, ${gag.mid.past}`);
    check(gag.mid.nose > gag.rest.nose + 12, 'Copycat copying Star holds up a stick-on mustache', `white at its nose ${gag.rest.nose} at rest, ${gag.mid.nose} half way through its flick`);

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
      { const [hx, hy] = at(cc); out.head = rgb(hx + 0.02, hy + 0.3); } // (its head, below its eye: its own red)
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
    const [hr, hg, hb] = bows.head;
    check(hr > 170 && hg < 90 && hb < 80, 'copying Star, Copycat’s cat-eared head keeps its own red, the flag’s', `its head ${bows.head.join(', ')} (its own #de2910 is 222, 41, 16)`);
    const ringWant = [32, 55, 130, 205]; // (orange, yellow, green, blue: the arcs at 0°, 60°, 120° and 180°)
    check(bows.ring.every((h, i) => dh(h, ringWant[i]) < 25), 'Star goes off in a ring of its rainbow, not its stand-in gold',
      `the ring’s hues at 0°, 60°, 120°, 180°: ${bows.ring.join(', ')} (want about ${ringWant.join(', ')})`);
    await b.viewport(800, 800);
    await ev('__settle()');

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

    // Jumps you can see (round six A: a jump was mostly the head swelling).
    // Your snake jumps Gobbler's body, lying one thick across its way, and
    // then, golden, Gobbler's and Sniper's side by side; the jump asked for
    // a tick ahead, as a press is, and drawn half a tick ahead, as the game
    // draws it. At the top of the jump its neck is up behind its head, in an
    // arch (wider than its body further back), and its shadow, left on the
    // ground, falls across the body it hops (just below it and to the right,
    // that body darkens: the shadow was drawn under every body). Two ticks
    // on, its body still arches over what it crossed (the segment over it
    // wider than the rest), over both for the golden jump. Lively, dust
    // puffs where it takes off and rings where it lands, and a faint trail
    // marks its way; with reduced motion, none of either, but the lift and
    // the shadow still show.
    await b.viewport(800, 800, { scale: 2 });
    await ev('__settle()');
    const jumps = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
      const green = (r, g, b) => g > 150 && g > r + 40 && g > b + 30, trail = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b > 140 && b > 110 && !green(r, g, b);
      const doStep = g => { for (const s of g.snakes) s.prev = s.body.map(c => ({ ...c })); E.step(g); g.food.length = 0; R.onTick(g.events); }; // (no food: an apple that turned up would pass for a body)
      const frame = al => { __t += 30; R.frame(al, __t); };
      const out = {};
      for (const still of [false, true]) for (const gold of [false, true]) {
        R.setReducedMotion(still);
        const g = stage(['gobbler', 'sniper', 'mason']), [you, gob, sn, ma] = g.snakes;
        for (const s of g.snakes) s.nextStarve = 1e15;
        setBody(ma, [[2, 22], [1, 22], [0, 22]], 'right'); ma.stunUntil = 1e9;
        setBody(sn, [[6, 22], [5, 22], [4, 22]], 'right'); sn.stunUntil = 1e9;
        setBody(you, Array.from({ length: 8 }, (_, i) => [9 - i, 12]), 'right'); you.leapReadyAt = 0;
        setBody(gob, Array.from({ length: 9 }, (_, i) => [10, 8 + i]), 'down'); gob.stunUntil = 1e9;
        if (gold) { setBody(sn, Array.from({ length: 9 }, (_, i) => [11, 16 - i]), 'up'); you.leaps = 2; }
        show(g); R.setViewer(99); R.setLead(0.5); drawN(10, 1); // (no rests round its head, nor halo: they'd pass for the trail)
        frame(0);
        const under0 = lum(pixels(9.62, 13.4, 0.76, 0.35)); // (the body it hops, below it, clear of its outline)
        E.leap(g, you);
        for (const al of [0.25, 0.5, 0.75]) frame(al);
        doStep(g);
        for (const al of [0, 0.25, 0.5]) frame(al); // (the top of the jump)
        const hx = R.headPx(you, 0.5, TUNING.GRID * ${CELL}, {}).x / ${CELL}; // (where its head's drawn: its neck's a cell behind, and measured just ahead of it, clear of the dust kicked up behind)
        const r = { under: +(lum(pixels(9.62, 13.4, 0.76, 0.35)) / under0).toFixed(2), neck: count(hx - 0.65, 11, 0.2, 2, green), back: count(hx - 3.65, 11, 0.2, 2, green), off: R.motes };
        doStep(g);
        frame(0.25); const m0 = R.motes;
        frame(0.5); // (down)
        r.ring = R.motes - m0;
        r.trail = count(9.85, 11.5, 1.5, 0.2, trail) + count(9.85, 13.3, 1.5, 0.2, trail);
        doStep(g); frame(0.5);
        r.cross = count(10.4, 11, 0.2, 2, green); r.cross2 = count(11.4, 11, 0.2, 2, green); r.flat = count(7.4, 11, 0.2, 2, green);
        out[(still ? 'reduced ' : '') + (gold ? 'golden' : 'plain')] = r;
      }
      R.setReducedMotion(false);
      R.setLead(0.5);
      SnakeDebug.pinQuality(2);
      return out;
    })()`);
    for (const [what, r] of Object.entries(jumps)) {
      const still = what.startsWith('reduced');
      check(r.neck > 1.12 * r.back && r.under < 0.96, `a ${what} jump: at its top its neck arches up behind its head, and its shadow falls across what it hops`,
        `its neck ${r.neck} pixels across, ${r.back} further back; the body under it, below and to the right, at ${r.under} of its brightness`);
      check(r.cross > 1.15 * r.flat && (!what.includes('golden') || r.cross2 > 1.15 * r.flat), `a ${what} jump: two ticks on, its body still arches over what it crossed`,
        `the segment over it ${r.cross}${what.includes('golden') ? ` and ${r.cross2}` : ''} pixels across, ${r.flat} on the bark`);
      if (still) check(r.off === 0 && r.ring === 0 && r.trail === 0, `a ${what} jump: no dust and no trail`, `${r.off} motes as it took off, ${r.ring} more as it landed; ${r.trail} trail pixels`);
      else check(r.off >= 4 && r.ring >= 8 && (what.includes('golden') || r.trail > 30), `a ${what} jump: dust puffs as it takes off and rings it as it lands, and a faint trail marks its way`,
        `${r.off} motes as it took off, ${r.ring} more as it landed${what.includes('golden') ? '' : `; ${r.trail} trail pixels beside its way`}`);
    }

    // Bridges you can see (round six A: a body over a hole looked as if it
    // hovered). Sniper lies across a hollow three cells long (its body over
    // the middle one) and Gobbler's tail lies over a hole, its head on the
    // bark; each against the same body with no hole there, and the hollow
    // against itself with nobody over it. Over the pit, the span is shaded
    // underneath (its lower edge darker, its upper half as it was) and sags
    // (narrower), and its shadow shows on the pit's floor, further off than
    // on the bark: just below the span it's dark, in a floor lit round it
    // (on the all but black floor, a shadow alone didn't show: the pit
    // below it was barely darker); the tail hanging over the hole droops
    // into it, darker.
    const bridge = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
      const reddish = (r, g, b) => r > 120 && r > g + 50 && r > b + 40;
      const g = stage(['sniper', 'gobbler', 'mason']), [you, sn, gob, ma] = g.snakes;
      setBody(you, [[2, 22], [1, 22], [0, 22]], 'right'); you.stunUntil = 1e9;
      setBody(ma, [[2, 2], [1, 2], [0, 2]], 'right'); ma.stunUntil = 1e9;
      const HOLES = [11 * 24 + 10, 12 * 24 + 10, 13 * 24 + 10, 5 * 24 + 18];
      const look = () => ({ width: count(10.4, 11.3, 0.2, 2.4, reddish), edge: lum(pixels(10.3, 12.7, 0.4, 0.14)), top: lum(pixels(10.3, 12.16, 0.4, 0.14)), shade: lum(pixels(10.3, 12.9, 0.4, 0.25)), lit: lum(pixels(10.3, 13.3, 0.4, 0.2)), tail: lum(pixels(18.3, 5.3, 0.4, 0.4)),
        band: lum(pixels(9.95, 12.71, 0.15, 0.08)), bandTop: lum(pixels(9.95, 12.24, 0.15, 0.08)) }); // (shade: just below the span; lit: the floor a little further; band: the lower edge of the band into it, between the segments)
      const place = () => { setBody(sn, Array.from({ length: 8 }, (_, i) => [13 - i, 12]), 'right'); sn.stunUntil = 1e9; setBody(gob, [[15, 5], [16, 5], [17, 5], [18, 5]], 'left'); gob.stunUntil = 1e9; };
      for (const k of HOLES) g.holes.add(k);
      place(); show(g); drawN(10, 1);
      const over = look();
      setBody(sn, Array.from({ length: 8 }, (_, i) => [13 - i, 20]), 'right'); setBody(gob, [[15, 8], [16, 8], [17, 8], [18, 8]], 'left');
      g.tick++; drawN(4, 1);
      const empty = look();
      for (const k of HOLES) g.holes.delete(k);
      place(); g.tick++; drawN(4, 1);
      const bark = look();
      SnakeDebug.pinQuality(2);
      return { over, empty, bark };
    })()`);
    const { over, empty, bark } = bridge, f2 = v => v.toFixed(2);
    check(over.edge / over.top < 0.85 * bark.edge / bark.top && over.band / over.bandTop < 0.92 * bark.band / bark.bandTop && over.width < 0.8 * bark.width, 'a body over a pit is shaded underneath, the bands between its segments too, and sags between the rims',
      `its lower edge at ${f2(over.edge / over.top)} of its upper half's brightness (${f2(bark.edge / bark.top)} on the bark), the band's ${f2(over.band / over.bandTop)} (${f2(bark.band / bark.bandTop)}); ${over.width} pixels across, ${bark.width} on the bark`);
    check(over.shade < 0.6 * over.lit && over.lit > 1.5 * empty.lit, 'its shadow shows on the pit’s floor: dark just below it, in a floor lit round it',
      `just below it ${f2(over.shade)}, the floor a little further ${f2(over.lit)} (${f2(empty.lit)} with nobody over the pit)`);
    check(over.tail < 0.75 * bark.tail, 'a tail end over a hole droops into it, darker', `at ${f2(over.tail / bark.tail)} of its brightness on the bark`);

    // Choking and the cough (round six A), staged as the engine reports them
    // (the choke and nudge events, s.coughUntil). Joker chokes on its own
    // bead right in front of it and spits it aside: its cheeks puff out for
    // a moment (its white face wider across) with the bead in its mouth,
    // none of it drawn (over its face, on a phone, the bead was the whole
    // head); then it's spat out of its cheek on the side it lands, never
    // over its face, up off its shadow on the ground, and lands where it went.
    // Gobbler coughs with an apple right ahead: its mouth stays shut (it
    // gapes at food otherwise) and puffs of breath come out past it, with
    // reduced motion too. Food a coughing head nudges rolls there (half way,
    // it's between the cells), and a beetle scurries. Every count and centre
    // is of pixels the snakes and food changed: against the same board with
    // nobody near and nothing on it (the same log under it), so none depends
    // on the bark (a knot's ink beside Joker's face passed for its cheeks).
    const choke = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
      const g = stage(['joker', 'gobbler', 'mason']), [you, jo, gob, ma] = g.snakes;
      // The bare board: everyone still along the bottom row, where stage() put them, no food. (Shown again, below, it gets the same log.)
      show(g); R.setViewer(99); drawN(20, 0.5);
      const cv = document.getElementById('game'), W = cv.width, kk = W / (TUNING.GRID * ${CELL}), bare = cv.getContext('2d').getImageData(0, 0, W, cv.height).data;
      const changed = (x, y, w, h, is, each) => { // (each pixel in the box that passes is() and isn't what the bare board has there)
        const p = pixels(x, y, w, h), d = p.data, px = Math.round(x * ${CELL} * kk), py = Math.round(y * ${CELL} * kk);
        for (let i = 0; i < d.length; i += 4) {
          const col = (i / 4) % p.width, row = Math.floor(i / 4 / p.width), j = ((py + row) * W + px + col) * 4;
          if (is(d[i], d[i + 1], d[i + 2]) && Math.abs(d[i] - bare[j]) + Math.abs(d[i + 1] - bare[j + 1]) + Math.abs(d[i + 2] - bare[j + 2]) > 24) each(col, row);
        }
        return p;
      };
      const count = (x, y, w, h, is) => { let n = 0; changed(x, y, w, h, is, () => n++); return n; };
      const centre = (x, y, w, h, is) => { let n = 0, sx = 0, sy = 0; const p = changed(x, y, w, h, is, (c, r) => { n++; sx += c; sy += r; }); return n ? [+(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : null; };
      const sky = (r, g, b) => b > 200 && g > 150 && r < 120, face = (r, g, b) => Math.min(r, g, b) > 215 || Math.max(r, g, b) < 40, mouth = (r, g, b) => r > 40 && r < 90 && g < 30 && b < 30, darker = (r, g, b) => r + g + b < 160;
      const lime = (r, g, b) => g > 150 && r > 100 && r < 170 && b < 60, emerald = (r, g, b) => g > 110 && g > r + 60 && b > 80 && b < g;
      const pale = (r, g, b) => Math.min(r, g, b) > 200 && b > 180;
      const out = {};
      setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
      setBody(jo, Array.from({ length: 6 }, (_, i) => [8 - i, 8]), 'right');
      setBody(gob, Array.from({ length: 6 }, (_, i) => [8 - i, 16]), 'right');
      setBody(ma, Array.from({ length: 6 }, (_, i) => [16, 6 - i]), 'down');
      g.food.push({ x: 8, y: 10, kind: 'pellet', color: '#38bdf8', owner: jo.id, expires: g.tick + 900 }); // (sky: nothing else here is)
      g.food.push({ x: 10, y: 16, kind: 'food', expires: g.tick + 900 });
      g.food.push({ x: 15, y: 12, kind: 'food', expires: g.tick + 900 });
      g.food.push({ x: 4, y: 12, kind: 'beetle', dir: E.DIRS.right, movedAt: g.tick - 50, expires: g.tick + 900 });
      show(g); R.setViewer(99); drawN(20, 0.5); // (half way through the tick, drawn at its cells: nobody's moving)
      { // (the bark far from everyone, cells 19 to 23 across, 8 to 10 down, is just as it was bare: the same log)
        const x0 = Math.round(19 * ${CELL} * kk), y0 = Math.round(8 * ${CELL} * kk), w = W - x0, d = cv.getContext('2d').getImageData(x0, y0, w, Math.round(3 * ${CELL} * kk)).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) { const j = ((y0 + Math.floor(i / 4 / w)) * W + x0 + (i / 4) % w) * 4; if (d[i] !== bare[j] || d[i + 1] !== bare[j + 1] || d[i + 2] !== bare[j + 2]) n++; }
        if (n) throw new Error('the choke board’s bark far from everyone isn’t as it was bare (' + n + ' pixels): its counts would be against another log');
      }
      // (each measured from where its head's drawn that frame, as it eases out of the move the drawing guessed it'd make)
      const cheeks = () => { const [x, y] = at(jo); return count(x + 0.05, y - 0.8, 0.6, 0.24, face); }; // (white or ink, just past its face, on the side the bead doesn't fly over)
      const shut = () => { const [x, y] = at(gob); return count(x, y - 0.4, 0.8, 0.8, mouth); }, puffed = () => { const [x, y] = at(gob); return count(x + 0.45, y - 0.6, 1.2, 1.2, pale); };
      const orange = (r, g, b) => r > 200 && g > 100 && g < 190 && b < 110, front = () => { const [x, y] = at(gob); let m = -1; const p = changed(x - 0.5, y - 0.6, 1.4, 1.2, orange, c => { m = Math.max(m, c); }); return m < 0 ? null : x - 0.5 + (m + 1) / p.width * 1.4; }; // (how far its head reaches ahead, cells)
      out.before = { cheeks: cheeks(), mouth: shut() };
      g.tick++;
      jo.coughUntil = g.tick + 9; gob.coughUntil = g.tick + 9;
      R.onTick([{ type: 'choke', snake: jo, x: 9, y: 8, tx: 8, ty: 10 }, { type: 'nudge', snake: ma, kind: 'food', x: 16, y: 13, tx: 15, ty: 12 }, { type: 'nudge', snake: ma, kind: 'beetle', x: 5, y: 12, tx: 4, ty: 12 }]);
      const [hx, hy] = at(jo), onFace = () => count(hx - 0.35, hy - 0.35, 0.7, 0.7, sky); // (its eyes and snout)
      drawN(1, 0.05, 80);
      out.gag = { cheeks: cheeks(), bead: count(6.5, 6.5, 4, 5, sky) };
      drawN(1, 0.5, 80); // (half way: 160 ms)
      const bead = centre(7.5, 7.5, 3, 4, sky);
      out.mid = { bead, face: onFace(), shadow: bead && centre(bead[0] - 0.5, bead[1] + 0.5, 1, 0.8, darker), apple: centre(14.2, 11.2, 3, 3, lime), beetle: centre(3, 11, 3, 2, emerald) }; // (its shadow on the ground: below where its ink rim reaches)
      g.tick++; drawN(4, 0.5, 80); // (the next tick: all of it there)
      out.end = { bead: centre(7.5, 7.5, 3, 4, sky), apple: centre(14.2, 11.2, 3, 3, lime), beetle: centre(3, 11, 3, 2, emerald) };
      let reach = 0;
      const puffs = () => { let n = 0; reach = 0; for (let i = 0; i < 10; i++) { drawN(1, 0.5, 30); n = Math.max(n, puffed()); reach = Math.max(reach, front()); } return n; };
      out.cough = { mouth: shut(), puffs: puffs(), reach };
      R.setReducedMotion(true);
      out.still = { puffs: puffs(), reach };
      R.setReducedMotion(false);
      gob.coughUntil = -1; g.tick++; drawN(10, 0.5, 30);
      out.after = { mouth: shut(), puffs: puffed(), reach: front() };
      out.cellPx = Math.round((W / TUNING.GRID) ** 2);
      SnakeDebug.pinQuality(2);
      return out;
    })()`);
    const between = (c, x0, y0, x1, y1) => !!c && Math.min(x0, x1) + 0.1 < c[0] && c[0] < Math.max(x0, x1) - 0.1 && Math.min(y0, y1) - 0.05 < c[1] && c[1] < Math.max(y0, y1) + 0.05;
    const bead = choke.mid.bead, shade = choke.mid.shadow;
    check(choke.gag.cheeks > choke.before.cheeks + 8 && choke.gag.bead === 0 && between(bead, 8.3, 8.9, 9.6, 10.5) && choke.mid.face === 0 && !!shade && shade[1] - bead[1] > 0.45 && !!choke.end.bead && Math.abs(choke.end.bead[0] - 8.5) < 0.12 && Math.abs(choke.end.bead[1] - 10.5) < 0.2,
      'choking on its own bead, its cheeks puff out with the bead in its mouth, then it spits it aside out of its cheek, never over its face, up in a little arc, to land where it went',
      `its face just past its cheeks ${choke.before.cheeks} pixels, then ${choke.gag.cheeks} as it gags, the bead's ${choke.gag.bead} pixels drawn then; half way at ${bead?.slice(0, 2)}, ${choke.mid.face} over its face, its shadow on the ground at y ${shade?.[1]}; then at ${choke.end.bead}`);
    check(choke.before.mouth > 20 && choke.cough.mouth * 3 < choke.before.mouth && choke.after.mouth > 20 && choke.cough.puffs > 10 && choke.still.puffs > 10 && choke.after.puffs === 0, 'coughing, its mouth stays shut and puffs of breath come out past it (with reduced motion too)',
      `Gobbler’s mouth, an apple right ahead: ${choke.before.mouth} pixels open, ${choke.cough.mouth} coughing, ${choke.after.mouth} after; puffs ${choke.cough.puffs}, with reduced motion ${choke.still.puffs}, after ${choke.after.puffs}`);
    const jolt = choke.cough.reach - choke.after.reach, calmJolt = choke.still.reach - choke.after.reach;
    check(choke.cough.puffs > 0.1 * choke.cellPx && choke.still.puffs > 0.1 * choke.cellPx && jolt > 0.09 && Math.abs(calmJolt) < 0.03, 'a cough reads at a phone’s size: a puff a good part of a cell, the head jolting forward with it (with reduced motion, no jolt)',
      `the puff at its biggest ${(choke.cough.puffs / choke.cellPx).toFixed(2)} of a cell (${(choke.still.puffs / choke.cellPx).toFixed(2)} with reduced motion); the head’s front ${jolt.toFixed(2)} cells further forward at a cough (${calmJolt.toFixed(2)} with reduced motion)`);
    check(between(choke.mid.apple, 15.5, 12.5, 16.5, 13.5) && !!choke.end.apple && Math.abs(choke.end.apple[0] - 15.5) < 0.15 && between(choke.mid.beetle, 4.5, 12.5, 5.5, 12.5) && !!choke.end.beetle && Math.abs(choke.end.beetle[0] - 4.5) < 0.15,
      'food a coughing head nudges rolls aside, and a beetle scurries', `the apple half way at ${choke.mid.apple}, then ${choke.end.apple}; the beetle ${choke.mid.beetle}, then ${choke.end.beetle}`);

    // Beetles and the woodpecker's knock (round six A), staged as the engine
    // reports them: two beetles out at once; b.digUntil and the dig and dive
    // events; the woodpecker's mark and the knock events, to where the
    // engine's knocks says (the strike's own list). Two beetles: one walks on, a cell every other
    // tick, and both are drawn every frame; the other, cornered, digs in:
    // smaller as it goes down, a collar of sawdust round it, sawdust spraying
    // off it to the end; gone (its dive), its bore is left a burrow, as the
    // engine leaves it (BURROW_FROM_DIG): freshly bored at first (raw pale
    // wood and sawdust round its hole, far more than an ordinary burrow has),
    // and a few seconds later as an ordinary one, its hole open all along.
    // With reduced motion: no spray, and it's drawn sunk part way, still. A
    // dug dive that leaves no burrow leaves nothing (no heap without a
    // burrow). A burrow closing over: half way, its hole is stopped up with
    // sawdust and moss is over it; a second on, the bark is as it was (with
    // reduced motion, filled and mossed at once). Through the aim, food in the mark trembles
    // and food outside it doesn't, and a ring marks where the rule will knock
    // each piece (one for each); at the strike it flies there, up in an arc, rimmed in ink and
    // parchment over whatever it crosses (a longer throw higher, and longer in the air), and a beetle knocked scurries
    // there. Counts and centres are of pixels changed against the bare
    // board, as the choke's are.
    const dug = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const N = TUNING.GRID;
      const cv = document.getElementById('game'), W = cv.width, kk = W / (N * ${CELL});
      let bare = null;
      const bareNow = () => { bare = cv.getContext('2d').getImageData(0, 0, W, cv.height).data; };
      const changed = (x, y, w, h, is, each) => {
        const p = pixels(x, y, w, h), d = p.data, px = Math.round(x * ${CELL} * kk), py = Math.round(y * ${CELL} * kk);
        for (let i = 0; i < d.length; i += 4) {
          const col = (i / 4) % p.width, row = Math.floor(i / 4 / p.width), j = ((py + row) * W + px + col) * 4;
          if (is(d[i], d[i + 1], d[i + 2]) && Math.abs(d[i] - bare[j]) + Math.abs(d[i + 1] - bare[j + 1]) + Math.abs(d[i + 2] - bare[j + 2]) > 24) each(col, row);
        }
        return p;
      };
      const count = (x, y, w, h, is) => { let n = 0; changed(x, y, w, h, is, () => n++); return n; };
      const centre = (x, y, w, h, is) => { let n = 0, sx = 0, sy = 0; const p = changed(x, y, w, h, is, (c, r) => { n++; sx += c; sy += r; }); return n ? [+(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : null; };
      const emerald = (r, g, b) => g > 110 && g > r + 60 && b > 80 && b < g, green = (r, g, b) => g > r + 25 && g > 50 && b < g, tan = (r, g, b) => r > 170 && g > 125 && b > 70 && b < 175 && r > b + 45;
      const sky = (r, g, b) => b > 200 && g > 150 && r < 120, paler = (r, g, b) => r > 150 && g > 130 && b > 95, parch = (r, g, b) => Math.min(r, g, b) > 228;
      const raw = (r, g, b) => r > 165 && g > 130 && r > b + 25, dark = (r, g, b) => r + g + b < 90, olive = (r, g, b) => g > r + 12 && g > b + 25 && r < 120, any = () => true;
      const out = { a: [], b: [], drawn: [], collar: [], parts: [], cellPx: Math.round((W / N) * (W / N)) };
      // Two beetles, one digging in.
      const g = stage(['mason', 'ghost', 'drab']);
      show(g); R.setViewer(99); drawN(20, 0.5); bareNow();
      const A = { x: 5, y: 6, kind: 'beetle', dir: E.DIRS.right, movedAt: g.tick - 50, expires: g.tick + 900 };
      const B = { x: 15, y: 6, kind: 'beetle', dir: E.DIRS.up, movedAt: g.tick - 50, expires: g.tick + 900, scared: true, digUntil: g.tick + TUNING.BEETLE_DIG };
      g.food.push(A, B);
      g.burrows.push({ x: 20, y: 10, at: g.tick, used: g.time }); // (an ordinary one, to hold the dug one up against)
      show(g); R.setViewer(99); drawN(8, 0.5, 30);
      out.full = count(14, 5, 3, 3, emerald);
      R.onTick([{ type: 'dig', x: 15, y: 6, until: B.digUntil }]);
      for (let t = 0; t < TUNING.BEETLE_DIG; t++) { // (the whole dig, tick by tick)
        if (t) { g.tick++; if (t % 2 === 0) { A.px = A.x; A.py = A.y; A.x++; A.movedAt = g.tick - 1; } R.onTick([]); }
        for (const al of [0.25, 0.5, 0.75, 1]) {
          __t += 30; R.frame(al, __t);
          out.a.push(count(A.x - 1.5, 5, 3, 3, emerald)); out.b.push(count(14, 5, 3, 3, emerald)); out.drawn.push(count(14, 5, 3, 3, green)); out.collar.push(count(14, 5, 3, 3, tan)); out.parts.push(R.particles);
        }
      }
      g.tick++; g.food.splice(g.food.indexOf(B), 1);
      g.burrows.push({ x: 15, y: 6, at: g.tick, used: g.time, dug: 1 }); // (its bore, left a burrow, as the engine does)
      R.onTick([{ type: 'dive', x: 15, y: 6, dug: 1 }, { type: 'burrow', x: 15, y: 6, dug: 1 }]);
      drawN(12, 0.5, 40);
      out.fresh = { raw: count(14.85, 5.85, 1.3, 1.3, raw), hole: count(15.3, 6.3, 0.4, 0.4, dark), plain: count(19.85, 9.85, 1.3, 1.3, raw), bugGone: count(14, 5, 3, 3, emerald) };
      drawN(60, 0.5, 80); // (4.8 s on)
      out.settled = { raw: count(14.85, 5.85, 1.3, 1.3, raw), hole: count(15.3, 6.3, 0.4, 0.4, dark), plain: count(19.85, 9.85, 1.3, 1.3, raw) };
      // With reduced motion: no spray, a still sink.
      R.setReducedMotion(true);
      const C = { x: 10, y: 15, kind: 'beetle', dir: E.DIRS.up, movedAt: g.tick - 50, expires: g.tick + 900, scared: true, digUntil: g.tick + TUNING.BEETLE_DIG };
      g.food.push(C); drawN(10, 0.5, 60); // (the sprays before it, settled)
      out.calm = { parts: [], bug: [] };
      R.onTick([{ type: 'dig', x: 10, y: 15, until: C.digUntil }]);
      for (let t = 0; t < TUNING.BEETLE_DIG - 1; t++) { g.tick++; R.onTick([]); drawN(2, 0.5, 60); out.calm.parts.push(R.particles); out.calm.bug.push(count(9, 14, 3, 3, emerald)); }
      R.setReducedMotion(false);
      // The knock: a bead and a beetle in the mark, another bead outside it.
      const g2 = stage(['mason', 'ghost', 'drab']);
      show(g2); R.setViewer(99); drawN(20, 0.5); bareNow();
      const P = [];
      for (let y = 11; y <= 13; y++) for (let x = 10; x <= 13; x++) P.push(y * N + x);
      const bead = { x: 11, y: 12, kind: 'pellet', color: '#38bdf8', owner: 1, expires: g2.tick + 900 }, other = { x: 4, y: 4, kind: 'pellet', color: '#38bdf8', owner: 1, expires: g2.tick + 900 };
      const bug = { x: 13, y: 11, kind: 'beetle', dir: E.DIRS.up, movedAt: g2.tick - 50, expires: g2.tick + 900 };
      g2.food.push(bead, other, bug);
      g2.time = 130000;
      g2.woodpecker = { x: 11.5, y: 12, at: g2.time - 5000, target: P, strikeAt: g2.tick + 4, last: [], struckAt: -1, restUntil: 1e9, pecks: 1 };
      show(g2); R.setViewer(99); drawN(25, 0.5, 30); // (the food popped in)
      const spots = [[], []];
      for (let i = 0; i < 8; i++) { drawN(1, 0.5, 23); spots[0].push(centre(10, 11, 3, 3, sky)); spots[1].push(centre(3, 3, 3, 3, sky)); }
      const spread = list => list.every(Boolean) ? +(Math.max(...list.map(c => c[0])) - Math.min(...list.map(c => c[0]))).toFixed(3) : -1; // (across: a bead bobs up and down where it lies, in or out of the mark)
      out.tremble = spread(spots[0]); out.steady = spread(spots[1]);
      const cell = c => c && (typeof c === 'number' ? [c % N, Math.floor(c / N)] : Array.isArray(c) ? c : [c.x, c.y]);
      const [tx, ty] = cell(E.knockTo(g2, 11, 12, P));
      out.to = [tx, ty];
      out.ring = count(tx - 0.2, ty - 0.2, 1.4, 1.05, paler); out.noRing = count(18, 18, 1.4, 1.05, paler); // (clear of the mark's own rim, a cell below)
      out.rings = E.knocks(g2, P).filter(({ to }) => to && count(to.x - 0.2, to.y - 0.2, 1.4, 1.05, paler) > 10).length; // (one for each piece in the mark)
      // On the aim's last tick, the engine's promise (w.landings): the bead's ring where it was promised (a free cell
      // nothing else is drawn on), though the rule as the board stands would put it elsewhere; the beetle's by the rule.
      const free = ([x, y]) => !g2.snakes.some(s => s.alive && s.body.some(c => c.x === x && c.y === y)) && !g2.food.some(f => f.x === x && f.y === y) && count(x - 0.2, y - 0.2, 1.4, 1.05, paler) === 0;
      const vow = [[18, 16], [16, 18], [18, 20], [20, 18], [20, 6]].find(free);
      g2.woodpecker.landings = [[12 * N + 11, vow[1] * N + vow[0]]];
      g2.tick++; drawN(2, 0.5, 30);
      out.promised = { at: vow, ring: count(vow[0] - 0.2, vow[1] - 0.2, 1.4, 1.05, paler), rule: count(tx - 0.2, ty - 0.2, 1.4, 1.05, paler),
        rings: E.knocks(g2, P, g2.woodpecker.landings).filter(({ to }) => to && count(to.x - 0.2, to.y - 0.2, 1.4, 1.05, paler) > 10).length };
      out.promised.ruleIsBeetles = E.knocks(g2, P, g2.woodpecker.landings).some(({ food, to }) => food === bug && to && to.x === tx && to.y === ty);
      delete g2.woodpecker.landings;
      for (const k of P) g2.holes.add(k);
      g2.woodpecker.target = []; g2.woodpecker.struckAt = g2.tick;
      bead.x = tx; bead.y = ty;
      const [bx, by] = cell(E.knockTo(g2, 13, 11, P));
      bug.px = 13; bug.py = 11; bug.x = bx; bug.y = by; bug.movedAt = g2.tick;
      g2.tick++;
      R.onTick([{ type: 'knock', kind: 'pellet', x: 11, y: 12, tx, ty }, { type: 'knock', kind: 'beetle', x: 13, y: 11, tx: bx, ty: by }]);
      drawN(1, 0.05, 1);
      drawN(1, 0.5, 225); // (about half way through its flight)
      const mid = centre(9, 7, 5, 7, sky);
      out.mid = { bead: mid, beetle: centre(12, 10, 4, 3, emerald), rim: mid ? count(mid[0] - 0.6, mid[1] - 0.6, 1.2, 1.2, parch) : 0 };
      drawN(4, 0.5, 120); g2.tick++; drawN(2, 0.5, 60);
      const end = centre(9, 7, 5, 7, sky);
      out.end = { bead: end, beetle: centre(12, 10, 4, 3, emerald), rim: end ? count(end[0] - 0.6, end[1] - 0.6, 1.2, 1.2, parch) : 0, bug: [bx, by] };
      // A longer throw is in the air longer and flies higher: a bead knocked a cell, then one knocked 4, each
      // followed through its flight (its centre every 30 ms; up is less y).
      out.throws = [];
      for (const D of [1, 4]) {
        drawN(10, 0.5, 60); bareNow();
        const f = { x: 3 + D, y: 17, kind: 'pellet', color: '#38bdf8', owner: 1, expires: g2.tick + 900 };
        g2.food.push(f); g2.tick++;
        R.onTick([{ type: 'knock', kind: 'pellet', x: 3, y: 17, tx: f.x, ty: f.y }]);
        const path = [];
        for (let i = 0; i < 26; i++) { drawN(1, 0.5, 30); path.push(centre(2, 14, 9, 4.5, sky)); }
        const at = c => !!c && Math.abs(c[0] - (f.x + 0.5)) < 0.15 && Math.abs(c[1] - 17.5) < 0.15;
        let landed = path.length; while (landed > 0 && at(path[landed - 1])) landed--;
        out.throws.push({ D, top: Math.min(...path.filter(Boolean).map(c => c[1])), landsBy: 30 * (landed + 1), down: at(path[path.length - 1]) });
        g2.food.splice(g2.food.indexOf(f), 1); g2.tick++; R.onTick([]);
      }
      // No heap without a burrow: a dug dive that leaves none (BURROW_FROM_DIG off) leaves nothing, once the collar's closed.
      // Then a burrow closing over, and one with reduced motion.
      const g3 = stage(['mason', 'ghost', 'drab']);
      show(g3); R.setViewer(99); drawN(20, 0.5); bareNow();
      R.onTick([{ type: 'dive', x: 10, y: 15, dug: 1 }]);
      drawN(3, 0.5, 40); out.noHeap = { during: count(9, 14, 3, 3, any) };
      drawN(15, 0.5, 40); out.noHeap.after = count(9, 14, 3, 3, any);
      const H = { x: 6, y: 15, at: g3.tick - 400, used: 0 }, H2 = { x: 17, y: 15, at: g3.tick - 400, used: 0 };
      g3.burrows.push(H, H2); drawN(25, 0.5, 40);
      const healAt = (x, y) => ({ hole: count(x - 0.2, y - 0.2, 0.4, 0.4, dark), plug: count(x - 0.5, y - 0.5, 1, 1, tan), moss: count(x - 0.5, y - 0.5, 1, 1, olive), all: count(x - 1.5, y - 1.5, 3, 3, any) });
      out.heal = { before: healAt(6.5, 15.5) };
      g3.burrows.splice(0, 1); g3.tick++;
      R.onTick([{ type: 'heal', x: 6, y: 15 }]);
      drawN(1, 0.5, 33); out.heal.start = healAt(6.5, 15.5);
      drawN(13, 0.5, 33); out.heal.mid = healAt(6.5, 15.5); // (about 0.46 s)
      drawN(30, 0.5, 33); out.heal.end = healAt(6.5, 15.5); // (about 1.45 s: its scar)
      drawN(70, 0.5, 300); out.heal.gone = healAt(6.5, 15.5); // (about 22 s: the scar's gone too)
      // A burrow growing shut: its opening shrinking as sawdust and moss come in over the 6 to 14 s.
      const H3 = { x: 12, y: 15, at: g3.tick - 400, used: 0 };
      g3.burrows.push(H3); g3.tick++; R.onTick([]); drawN(25, 0.5, 40);
      out.shut = { open: healAt(12.5, 15.5) };
      for (const [name, done] of [['third', 0.33], ['twoThirds', 0.67], ['nearly', 0.95]]) {
        H3.shutFrom = g3.time - 10000 * done; H3.shutAt = H3.shutFrom + 10000; g3.tick++; R.onTick([]);
        drawN(3, 0.5, 33); out.shut[name] = healAt(12.5, 15.5);
      }
      g3.burrows.splice(g3.burrows.indexOf(H3), 1); g3.tick++;
      R.onTick([{ type: 'heal', x: 12, y: 15 }]);
      drawN(1, 0.5, 33); out.shut.closing = healAt(12.5, 15.5);
      R.setReducedMotion(true);
      g3.burrows.splice(0, 1); g3.tick++;
      R.onTick([{ type: 'heal', x: 17, y: 15 }]);
      drawN(1, 0.5, 60); out.heal.calm = healAt(17.5, 15.5);
      drawN(30, 0.5, 50); out.heal.calmEnd = healAt(17.5, 15.5);
      R.setReducedMotion(false);
      SnakeDebug.pinQuality(2);
      return out;
    })()`);
    {
      const min = a => Math.min(...a), max = a => Math.max(...a), late = a => a.slice(-4), early = a => a.slice(0, 4); // (the dig's first tick and its last: four frames each)
      check(min(dug.a) > 40 && min(dug.drawn) > 10, 'two beetles out at once, each drawn every frame (one walking on, one digging in)', `the walker’s emerald pixels ${min(dug.a)} to ${max(dug.a)}, the digger’s green ${min(dug.drawn)} to ${max(dug.drawn)}`);
      check(max(late(dug.b)) < 0.6 * min(early(dug.b)) && min(late(dug.collar)) > max(early(dug.collar)) + 20 && min(late(dug.parts)) > 0,
        'a cornered beetle digs in: it sinks into the bark, a collar of sawdust round it, sawdust spraying off it to the end',
        `its emerald pixels ${early(dug.b).join(', ')} as it starts (${dug.full} before), ${late(dug.b).join(', ')} at the end; sawdust ${early(dug.collar).join(', ')}, then ${late(dug.collar).join(', ')}; particles in the air at the end ${late(dug.parts).join(', ')}`);
      const fr = dug.fresh, se = dug.settled;
      check(fr.bugGone === 0 && fr.hole > 10 && se.hole > 10 && fr.raw > 2 * fr.plain + 0.12 * dug.cellPx && se.raw <= se.plain + 0.03 * dug.cellPx,
        'gone in, its bore is left a burrow: freshly bored (raw wood and sawdust round it), an ordinary burrow a few seconds on',
        `raw wood and sawdust ${fr.raw} pixels just after, ${se.raw} 4.8 s on (an ordinary burrow ${fr.plain}, ${se.plain}); its hole ${fr.hole}, then ${se.hole} dark pixels; ${fr.bugGone} of the beetle (a cell ${dug.cellPx})`);
      check(dug.noHeap.during > 20 && dug.noHeap.after === 0, 'no heap without a burrow: a dig that leaves none leaves nothing once its collar has closed', `${dug.noHeap.during} pixels changed as it closes, ${dug.noHeap.after} after`);
      const hl = dug.heal;
      check(hl.before.hole > 10 && hl.start.hole > 5 && hl.mid.hole * 4 < hl.before.hole && hl.mid.plug + hl.mid.moss > 0.08 * dug.cellPx && hl.mid.moss > 0.025 * dug.cellPx && hl.end.hole === 0 && hl.end.moss === 0 && hl.end.all > 0 && hl.gone.all === 0,
        'a burrow closing over fills with sawdust, moss over it, and is gone into the bark in about a second, leaving a faint scar a while',
        `its hole ${hl.before.hole} dark pixels, ${hl.start.hole} as it starts, ${hl.mid.hole} half way, with ${hl.mid.plug} of sawdust and ${hl.mid.moss} of moss; ${hl.end.all} pixels changed 1.45 s on (its scar), ${hl.gone.all} 22 s on (a cell ${dug.cellPx})`);
      const sh = dug.shut;
      check(sh.open.hole > 10 && sh.third.hole < sh.open.hole && sh.twoThirds.hole < 0.7 * sh.open.hole && sh.nearly.hole < 0.45 * sh.open.hole && sh.twoThirds.plug > sh.open.plug && sh.nearly.moss > 0.02 * dug.cellPx && sh.closing.hole <= sh.nearly.hole + 2,
        'a burrow growing shut: its opening shrinks as sawdust comes in from the rim and moss grows over it, and it closes over from there',
        `its hole ${sh.open.hole} dark pixels open, ${sh.third.hole} a third of the way, ${sh.twoThirds.hole} two thirds, ${sh.nearly.hole} nearly shut, ${sh.closing.hole} closing over; sawdust ${sh.open.plug}, ${sh.twoThirds.plug}; moss nearly shut ${sh.nearly.moss}`);
      check(hl.calm.hole * 4 < hl.before.hole && hl.calm.plug + hl.calm.moss > 0.08 * dug.cellPx && hl.calm.moss > 0.025 * dug.cellPx && hl.calmEnd.hole === 0 && hl.calmEnd.moss === 0,
        'with reduced motion, it’s filled and mossed at once, then fades', `its hole ${hl.calm.hole}, sawdust ${hl.calm.plug}, moss ${hl.calm.moss} at once; ${hl.calmEnd.all} pixels changed after`);
      check(max(dug.calm.parts) === 0 && max(dug.calm.bug) - min(dug.calm.bug) <= 3 && max(dug.calm.bug) < 0.8 * dug.full && min(dug.calm.bug) > 10,
        'with reduced motion, it’s drawn sunk part way, still, and no sawdust flies', `its emerald pixels ${dug.calm.bug.join(', ')} (${dug.full} up on the bark); particles ${max(dug.calm.parts)}`);
      check(dug.tremble > 0.02 && dug.steady < dug.tremble / 4 && dug.ring > 10 && dug.noRing === 0 && dug.rings === 2, 'through the woodpecker’s aim, food in its mark trembles, food outside it is still, and a ring marks where it’ll be knocked to (the engine’s list: one for each piece)',
        `the bead in the mark moves ${dug.tremble} cells across, frame to frame, the one outside ${dug.steady}; ${dug.ring} ring pixels at ${dug.to} (the rule’s cell), ${dug.noRing} at a cell nothing lands on; rings at ${dug.rings} of the 2 landings`);
      const vow = dug.promised;
      check(vow.ring > 10 && vow.rings === 2 && (vow.ruleIsBeetles || vow.rule <= 2), 'on the aim’s last tick, the rings show the engine’s promise (where the strike will land each piece while its cell is free)',
        `${vow.ring} ring pixels at the promised ${vow.at}, rings at ${vow.rings} of the 2 landings; ${vow.rule} at the rule’s ${dug.to}${vow.ruleIsBeetles ? ' (the beetle’s by the rule now)' : ''}`);
      const [tx, ty] = dug.to, b = dug.mid.bead, e = dug.end.bead;
      check(!!b && b[1] < ty + 0.5 - 0.3 && Math.abs(b[0] - (tx + 0.5)) < 0.3 && dug.mid.rim > dug.end.rim + 15 && !!e && Math.abs(e[0] - (tx + 0.5)) < 0.15 && Math.abs(e[1] - (ty + 0.5)) < 0.2,
        'at the strike, the food flies to where the rule said, up in an arc, rimmed so it reads over a body', `the bead half way at ${b} (it lands at ${tx + 0.5},${ty + 0.5}), then at ${e}; parchment round it ${dug.mid.rim} in the air, ${dug.end.rim} landed`);
      const [near, far] = dug.throws;
      check(near.down && far.down && far.landsBy >= near.landsBy + 120 && far.top < near.top - 0.3 && near.top < 17.5 - 0.4,
        'a longer throw is in the air longer and flies higher (the knock’s arc grows with the way it goes)',
        `knocked 1 cell, up to y ${near.top} (it lies at 17.5), down by ${near.landsBy} ms; knocked 4 cells, up to y ${far.top}, down by ${far.landsBy} ms`);
      const bm = dug.mid.beetle, be = dug.end.beetle, [bx, by] = dug.end.bug, d = (c, x, y) => Math.hypot(c[0] - x, c[1] - y);
      check(!!bm && d(bm, 13.5, 11.5) > 0.25 && d(bm, bx + 0.5, by + 0.5) > 0.25 && d(bm, 13.5, 11.5) + d(bm, bx + 0.5, by + 0.5) < d([13.5, 11.5], bx + 0.5, by + 0.5) + 0.2 && !!be && d(be, bx + 0.5, by + 0.5) < 0.2,
        'a beetle knocked out of the mark scurries there', `half way at ${bm}, then ${be} (from 13.5,11.5 to ${bx + 0.5},${by + 0.5})`);
    }

    // A pecked flag is a lost colony (round six A). The woodpecker pecks out
    // the cell under Colonist's second colony's flag, and under Sovereign's
    // capital; a tick later Colonist forgets the colony and Sovereign's realm
    // moves, as the rules have it. The flag doesn't vanish: it's still there
    // just after the peck, tips over (its ensign's navy lower) and is gone
    // into the pit a moment later, the other colony's flag standing; the
    // lost land shrinks away into the pit (its far edge before its near
    // one); and the banner is carried from the old capital (between the two,
    // part way) to the new one, not jumping there.
    const lost = await ev(`(() => {
      SnakeDebug.pinQuality(0);
      const centre = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0, sx = 0, sy = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) { n++; sx += (i / 4) % p.width; sy += Math.floor(i / 4 / p.width); } return n ? [n, +(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : [0]; };
      const navy = (r, g, b) => b > 80 && r < 40 && g < 60, cream = (r, g, b) => r > 225 && g > 215 && b > 180;
      const g = stage(['colonist', 'sovereign', 'mason']), [you, col, sov, ma] = g.snakes;
      setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
      setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
      setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 21]), 'right');
      setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right');
      col.memory.colonies = [{ x: 5, y: 8, radius: 3, n: 1 }, { x: 12, y: 7, radius: 3, n: 2 }];
      sov.memory.home = { x: 17, y: 15, radius: 4 };
      show(g); drawN(30, 0.5, 60);
      const flag = () => centre(11.5, 5.4, 2.6, 2.8, navy), banner = (x0, x1) => centre(x0, 13, x1 - x0, 3, cream);
      const out = { before: { flag: flag(), other: centre(4.5, 5.4, 2.6, 2.8, navy) } };
      for (const k of [7 * 24 + 12, 7 * 24 + 13, 8 * 24 + 12, 15 * 24 + 17, 15 * 24 + 16, 16 * 24 + 17]) g.holes.add(k);
      g.tick++; R.onTick([{ type: 'peck', x: 12, y: 7, cells: [7 * 24 + 12] }]);
      drawN(1, 0.5, 60);
      out.pecked = { flag: flag() };
      drawN(1, 0.5, 60); // (a tick later: forgotten, and moved)
      col.memory.colonies = [col.memory.colonies[0]]; sov.memory.home = { x: 12, y: 14, radius: 4 }; g.tick++;
      drawN(2, 0.5, 60);
      out.tipping = { flag: flag() };
      drawN(1, 0.5, 60);
      out.shrinking = { far: R.landShown(col, 9, 7), near: R.landShown(col, 11, 7) }; // (three cells from the pit, and one)
      drawN(3, 0.5, 60);
      out.carried = banner(12.6, 18.4); // (about half way)
      drawN(20, 0.5, 60);
      out.after = { flag: flag(), other: centre(4.5, 5.4, 2.6, 2.8, navy), land: R.landShown(col, 11, 7), banner: banner(11, 14.4) };
      SnakeDebug.pinQuality(2);
      return out;
    })()`);
    const lf = lost;
    check(lf.before.flag[0] > 20 && lf.pecked.flag[0] > 20 && lf.tipping.flag[0] > 5 && lf.tipping.flag[2] > lf.pecked.flag[2] + 0.1 && lf.after.flag[0] === 0 && lf.after.other[0] > 10,
      'a colony’s flag pecked out tips over and falls into the pit; the other colony’s stands', `its ensign’s navy (pixels, y): ${lf.before.flag.join(' at ')} before, ${lf.pecked.flag.join(' at ')} just after the peck, ${lf.tipping.flag.join(' at ')} tipping, ${lf.after.flag[0]} after; the other ${lf.after.other[0]}`);
    check(!lf.shrinking.far && lf.shrinking.near && !lf.after.land, 'its land shrinks away into the pit', `three cells from the pit ${lf.shrinking.far ? 'still there' : 'gone'} while the cell beside it is ${lf.shrinking.near ? 'still there' : 'gone'}; ${lf.after.land ? 'some left' : 'all gone'} after`);
    check(lf.carried[0] > 10 && lf.carried[1] > 13.5 && lf.carried[1] < 16.8 && lf.after.banner[0] > 10 && Math.abs(lf.after.banner[1] - 12.9) < 0.6,
      'Sovereign’s banner is carried to its new capital', `its parchment part way at x ${lf.carried[1]} (${lf.carried[0]} pixels; from 17 to 12), then at ${lf.after.banner[1]}`);

    // A strike that doesn't stutter (round six A): the land a strike will
    // leave is made ahead while the woodpecker aims, and swapped in at the
    // strike. Sovereign's realm and Colonist's colony meet (dashed sides
    // between them), and the patch cuts both. Made ahead, the board just
    // after the strike is the very one made at the strike (the old way, with
    // making ahead switched off), pixel for pixel; and with the land changing
    // otherwise as it strikes (Sovereign's realm growing a ring), it's made
    // the old way then, and still the same. (The land's part of the board,
    // clear of the snakes, whose blinks come when they will; with reduced
    // motion, so nothing else moves between the two; each after one of its
    // own first, so the flags are the same.)
    const ahead = await ev(`(() => {
      SnakeDebug.pinQuality(2);
      R.setReducedMotion(true);
      const g = stage(['colonist', 'sovereign', 'mason']), [you, col, sov, ma] = g.snakes;
      setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
      setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
      setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 21]), 'right');
      setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right');
      col.memory.colonies = [{ x: 8, y: 10, radius: 3, n: 1 }];
      sov.memory.home = { x: 14, y: 11, radius: 4 };
      for (const k of [3 * 24 + 20, 4 * 24 + 20, 4 * 24 + 21]) g.holes.add(k);
      show(g); drawN(10, 0.5, 60);
      const P = [];
      for (let y = 9; y <= 12; y++) for (let x = 10; x <= 12; x++) P.push(y * 24 + x); // (across the line where they meet)
      const board = () => pixels(4, 5, 17, 13).data;
      const strike = (on, grow) => {
        R.prebuild(on);
        g.woodpecker = { x: 11, y: 10, at: g.time, target: P.slice(), strikeAt: g.tick + 17, last: [], struckAt: -1, restUntil: 1e9, pecks: 1 };
        drawN(30, 0.5, 60);
        const ready = R.prebuilt;
        for (const k of P) g.holes.add(k);
        g.woodpecker = null;
        if (grow) sov.memory.home = { x: 14, y: 11, radius: 5 };
        g.tick++; drawN(1, 0.5, 60);
        const out = { ready, px: board(), cut: R.landShown(sov, 12, 11) || R.landShown(col, 10, 10) };
        for (const k of P) g.holes.delete(k);
        sov.memory.home = { x: 14, y: 11, radius: 4 };
        g.tick++; drawN(10, 0.5, 60);
        return out;
      };
      const differ = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
      strike(true, false);
      const made = strike(true, false), old = strike(false, false);
      strike(true, true);
      const madeGrow = strike(true, true), oldGrow = strike(false, true);
      R.prebuild(true); R.setReducedMotion(false);
      return { ready: made.ready, cut: made.cut, n: differ(made.px, old.px), growReady: madeGrow.ready, nGrow: differ(madeGrow.px, oldGrow.px), changed: differ(made.px, madeGrow.px), pixels: made.px.length / 4 };
    })()`);
    check(ahead.ready && !ahead.cut && ahead.n === 0, 'the land a strike leaves, made ahead while the woodpecker aims, is the very land made at the strike', `${ahead.ready ? 'made ahead' : 'not made ahead'}; ${ahead.cut ? 'the patch still shows as land' : 'the patch is no land'} after it; ${ahead.n} of ${ahead.pixels * 4} values differ from it made at the strike`);
    check(ahead.growReady && ahead.changed > 0 && ahead.nGrow === 0, 'with the land changing otherwise as it strikes, it’s made the old way, and is the same', `${ahead.nGrow} values differ from it made at the strike (the realm grown: ${ahead.changed} from the board without)`);

    // The Field guide's pictures.
    const guide = await ev(`(() => {
      const out = {};
      for (const k of ['apple', 'golden', 'mushroom', 'goldcap', 'leaf', 'beetle', 'goldbeetle', 'pellet', 'roast', 'baked', 'jump', 'flash', 'wrap', 'held', 'rests', 'hole', 'fire', 'land', 'choke', 'lostflag', 'cough', 'dig', 'knock', 'basic-win', 'basic-steer', 'basic-crash', 'basic-hunger']) {
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

    // The next round's stretch of log, made ahead: once nothing has been
    // drawn for a moment, the renderer asks to build its bark and leaf
    // shadows in idle time, and a round starting takes them. Made then (its
    // seed the first number drawn from S) and taken by a round starting (whose
    // own seed, had it built its log itself, would have come from elsewhere),
    // the board is the very one a round builds itself from S, bark and leaf
    // shadows (lively, at full quality), and not another seed's. Each round
    // is started and drawn the same way, after another: the same board
    // afresh, as stage() makes one (new snakes, so their blinks and eyes start
    // again), its first frame a second after the last. (Last of the staged
    // boards, so the others keep their seeds.)
    const START = `const S = ${SEED} * 1000 + 901, start = seed => {
      __reseed(S + 5);
      const g = E.createGame({ withPlayer: true, personas: ['gobbler', 'ghost', 'mason'] }); g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.snakes.forEach((s, i) => setBody(s, [[2 + 4 * i, 23], [1 + 4 * i, 23], [4 * i, 23]], 'right'));
      const c = document.getElementById('game'); __t = 9e6 - 1000; R.frame(0.5, __t); R.setViewer(0); __reseed(seed); R.setGame(g); __reseed(S + 2); __t = 9e6; drawN(5);
      return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };`;
    await ev(`(() => { SnakeDebug.pinQuality(2); show(stage(['gobbler', 'ghost', 'mason'])); ${START} start(S + 4); window.__nextLog = null; return 'ok'; })()`);
    const asked = await ev(`new Promise(r => { const t0 = performance.now(); (function f() { if (window.__nextLog || performance.now() - t0 > 8000) r(!!window.__nextLog); else setTimeout(f, 50); })(); })`);
    const log = !asked ? null : await ev(`(() => {
      ${START}
      __reseed(S); __nextLog(); // (made now, as in idle time)
      const idle = start(S + 3), direct = start(S), other = start(S + 1), W = document.getElementById('game').width;
      const differ = (a, b) => { let n = 0, x0 = W, y0 = W, x1 = -1, y1 = -1; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 6) { n++; const x = (i / 4) % W, y = Math.floor(i / 4 / W); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        const cell = v => (v / W * TUNING.GRID).toFixed(1); return { n, where: n ? cell(x0) + '-' + cell(x1) + ' across, ' + cell(y0) + '-' + cell(y1) + ' down' : '' }; };
      return { pixels: idle.length / 4, idle: differ(idle, direct), other: differ(other, direct).n };
    })()`);
    check(!!log && log.idle.n === 0 && log.other > log.pixels / 4, 'the next round’s log, made ahead in idle time, is the very bark and leaf shadows a round builds itself from the same seed',
      !log ? 'the renderer never asked for it in idle time' : `${log.idle.n} of ${log.pixels} pixels differ from it built directly${log.idle.n ? ` (cells ${log.idle.where})` : ''}; another seed’s, ${log.other}`);

    // ------------------------------------------- a woodpecker you can believe
    // Round six A's woodpecker, staged on a held board at a laptop's size
    // (its own layer's pixels and the renderer's account of its pose):
    // - resting, its eye follows what moves near it: its pupil, read off its
    //   layer, turns toward your head moved above it, then below it;
    // - through the aim its head turns to its marked patch (its beak toward
    //   it, more than resting), its eye on it, and tilts this way and that;
    // - it drums a blow on each knock of the drum (SnakeAudio.drumBlows, one
    //   table), its beak on the spot at each and drawn back between, the
    //   last on the strike's tick; and in a real round the game starts the
    //   drum you hear so its last knock lands on the strike as drawn, and
    //   says "kik!" as it lands back on its perch, as drawn;
    // - its layer is the board and the room round it (not the page), and a
    //   phone's address bar coming and going never makes it again;
    // - with reduced motion, no wingbeats (its wings still through a flight,
    //   one glide) and no bob, and fewer, slower blows, the last still on
    //   the strike.
    await b.viewport(1280, 800);
    await b.go(site.url + '?debug', { settle: 0 });
    await ev('__settle()');
    await ev(STAGE);
    const BIRD = `
      const g = show(stage(['gobbler', 'ghost', 'mason'])), N = TUNING.GRID;
      g.time = TUNING.SUDDEN_DEATH_MS + 5000; g.tick = 2000;
      g.snakes.forEach((s, i) => setBody(s, [[4 + 4 * i, 23], [3 + 4 * i, 23], [2 + 4 * i, 23]], 'right'));
      const ms = E.tickMs(g), L = document.getElementById('bird-layer');
      // (drawn m ms before its strike, or with after, m ms after it: the tick and how far through it)
      const at = (m, n = 1, step = 16) => { const K = Math.ceil(m / ms); g.woodpecker.strikeAt = g.tick - 1 + K; drawN(n, K - m / ms, step); return R.birdPose(); };
      const after = (m, n = 1) => { const K = Math.floor(m / ms); Object.assign(g.woodpecker, { struckAt: g.tick - 1 - K, strikeAt: g.tick - 1 - K, restUntil: g.tick - 1 - K + TUNING.PECK_REST_MIN }); drawN(n, m / ms - K, 16); return R.birdPose(); };
      const rest = spot => { g.woodpecker = { x: spot % N, y: Math.floor(spot / N), at: g.time - 9000, target: [], strikeAt: -1, last: [spot], struckAt: g.tick - 400, restUntil: g.tick + 1e6, pecks: 2 }; };
      const aim = (spot, from, pecks = 1) => { g.woodpecker = { x: spot % N, y: Math.floor(spot / N), at: g.time - 9000, target: [spot], strikeAt: g.tick + 17, last: [from], struckAt: g.tick - 60, restUntil: g.tick, pecks }; drawN(1); return R.birdPlan(); };
      const cellNear = (x, y) => [Math.max(0, Math.min(N - 1, Math.round(x / 32 - 0.5))), Math.max(0, Math.min(N - 1, Math.round(y / 32 - 0.5)))];
    `;
    const eye = await ev(`(() => {
      ${BIRD}
      R.setReducedMotion(false);
      const home = 12 * N + 22; // (it rests by (22, 12), beside the board)
      rest(home); drawN(30);
      const p0 = R.birdPose(), out = [];
      for (const dy of [-6, 6]) {
        const [x, y] = cellNear(p0.eyeAt[0] + 32 * 4 * p0.flip, p0.eyeAt[1] + 32 * dy), you = g.snakes[0];
        setBody(you, [[x, y], [x, Math.min(N - 1, y + 1)], [x, Math.min(N - 1, y + 2)]], 'up');
        drawN(70, 0.5, 16);
        const p = R.birdPose(), d = L.getContext('2d').getImageData(Math.round(p.eye[0] - p.eye[2]), Math.round(p.eye[1] - p.eye[2]), Math.round(2 * p.eye[2]), Math.round(2 * p.eye[2])).data, W = Math.round(2 * p.eye[2]);
        let sx = 0, sy = 0, n = 0; // (the pupil: the dark pixels inside the eye's white)
        for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4; if (d[k + 3] > 200 && d[k] + d[k + 1] + d[k + 2] < 120 && (i - W / 2) ** 2 + (j - W / 2) ** 2 < (W / 2 - 1) ** 2) { sx += i; sy += j; n++; } }
        const ox = n ? sx / n - W / 2 + 0.5 : 0, oy = n ? sy / n - W / 2 + 0.5 : 0, tx = x * 32 + 16 - p.eyeAt[0], ty = y * 32 + 16 - p.eyeAt[1];
        out.push({ dy, dark: n, off: [+ox.toFixed(2), +oy.toFixed(2)], cos: +((ox * tx + oy * ty) / (Math.hypot(ox, oy) * Math.hypot(tx, ty) || 1)).toFixed(2), r: +p.eye[2].toFixed(1) });
      }
      g.snakes[0].body = [[4, 23], [3, 23], [2, 23]].map(([x, y]) => ({ x, y }));
      return out;
    })()`);
    check(eye.every(e => e.dark > 3 && e.cos > 0.7) && eye[0].off[1] < 0 && eye[1].off[1] > 0, 'resting, the woodpecker’s eye follows your head moving near it: its pupil turns up to it above, then down to it below',
      eye.map(e => `${e.dy < 0 ? 'above' : 'below'}: pupil ${e.off.join(', ')} px off the middle (eye ${e.r} px), toward the head by cos ${e.cos}`).join('; '));

    const look = await ev(`(() => {
      ${BIRD}
      const home = 12 * N + 22, spot = 4 * N + 6;
      rest(home); drawN(40);
      const tx = 6 * 32 + 16, ty = 4 * 32 + 16, toward = p => { const hx = p.eyeAt[0], hy = p.eyeAt[1], bx = p.beak[0] - hx, by = p.beak[1] - hy, dx = tx - hx, dy = ty - hy; return (bx * dx + by * dy) / (Math.hypot(bx, by) * Math.hypot(dx, dy)); };
      const resting = toward(R.birdPose());
      const plan = aim(spot, home), m = (plan.depart + 200 + plan.aim - plan.hop) / 2;
      const turns = new Set(), seen = [];
      for (let f = 0; f < 50; f++) { const p = at(m, 1, 16); turns.add(Math.round(p.turn * 20)); seen.push(p); }
      const p = seen[seen.length - 1], gaze = (p.gaze[0] * (tx - p.eyeAt[0]) + p.gaze[1] * (ty - p.eyeAt[1])) / Math.hypot(tx - p.eyeAt[0], ty - p.eyeAt[1]);
      return { resting: +resting.toFixed(2), aiming: +toward(p).toFixed(2), gaze: +gaze.toFixed(2), turns: turns.size, phase: p.phase };
    })()`);
    check(look.phase === 'eye' && look.aiming > 0.85 && look.gaze > 0.9 && look.turns >= 2, 'through the aim, the woodpecker’s head turns to its marked patch, tilting this way and that, its eye on it',
      `its beak toward the patch by cos ${look.resting} resting, ${look.aiming} aiming (${look.phase}); its eye by cos ${look.gaze}; ${look.turns} head angles in 0.8 s`);

    const blows = await ev(`(() => {
      ${BIRD}
      const spot = 10 * N + 9, tx = 9 * 32 + 16, ty = 10 * 32 + 16;
      rest(spot); drawN(10);
      const plan = aim(spot, spot), table = SnakeAudio.drumBlows(1), D = table[table.length - 1];
      const dist = p => Math.hypot(p.beak[0] - tx, p.beak[1] - ty), out = { n: plan.times.length, table: table.length, same: plan.times.every((t, i) => t === table[i] - D), on: [], off: [] };
      for (let i = 0; i < plan.times.length; i++) {
        const p = at(-plan.times[i]); out.on.push(+dist(p).toFixed(1)); // (on a blow: its beak on the spot)
        if (i) out.off.push(+dist(at(-(plan.times[i] + plan.times[i - 1]) / 2)).toFixed(1)); // (between: drawn back)
      }
      const before = at(4), last = at(0);
      out.before = { blows: before.blows, d: +dist(before).toFixed(1) }; out.last = { blows: last.blows, phase: last.phase, d: +dist(last).toFixed(1), tp: last.tp, strikeAt: g.woodpecker.strikeAt };
      // (the strike's tick: the patch a hole now, its head pulled out)
      g.woodpecker.target = []; g.woodpecker.last = [spot];
      const hole = after(0); out.hole = { phase: hole.phase, d: +dist(hole).toFixed(1) };
      const pulled = after(60); out.pulled = { phase: pulled.phase, d: +dist(pulled).toFixed(1) };
      return out;
    })()`);
    check(blows.n === blows.table && blows.same && blows.on.every(d => d < 3) && blows.off.every(d => d > 6), 'drumming, the woodpecker strikes a blow on each knock of the drum (one table for both), its beak on the spot at each and drawn back between',
      `${blows.n} blows, ${blows.table} knocks; its beak ${Math.max(...blows.on)} units off the spot at most on a blow, ${Math.min(...blows.off)} at least between`);
    check(blows.before.blows === blows.n - 1 && blows.last.blows === blows.n && blows.last.d < 3 && blows.last.tp === blows.last.strikeAt && blows.hole.phase === 'linger' && blows.hole.d < 3 && blows.pulled.d > 6,
      'its last blow lands on the strike’s tick, as the patch gives way, and then it pulls its head out of the hole',
      `4 ms before: blow ${blows.before.blows} of ${blows.n}; on the tick: blow ${blows.last.blows}, its beak ${blows.last.d} units off; the strike made: ${blows.hole.phase}, ${blows.hole.d} units off, 60 ms on ${blows.pulled.d}`);

    // Drumming, it never hides where the food in its mark will land (the
    // ring is a promise you plan by): a patch of 3 by 4 with the spot at
    // (6, 10), the bird coming from the right. Nothing in the mark, it
    // clings as it came, over (8, 11); with an apple whose ring is (8, 11),
    // it clings the other way, the ring clear, its beak still on the spot.
    // With apples both sides, every way covers a ring: the one it covers is
    // drawn over it (its layer at the ring, with and without), and so is a
    // piece in the air under it.
    const promise = await ev(`(() => {
      ${BIRD}
      const lg = L.getContext('2d');
      const px = (bx, by) => { const z = R.birdPose().layer, k = z.W / z.w, bd = document.getElementById('game').getBoundingClientRect(), c = bd.width / (N * 32); const x = Math.round((bd.left + bx * c - z.x) * k), y = Math.round((bd.top + by * c - z.y) * k); return x < 0 || y < 0 || x >= L.width || y >= L.height ? [0, 0, 0, 0] : Array.from(lg.getImageData(x, y, 1, 1).data); }; // (its layer's pixel at a board point)
      const ringPts = (x, y, r) => Array.from({ length: 32 }, (_, q) => [(x + 0.5) * 32 + Math.cos(q * Math.PI / 16) * r, (y + 0.5) * 32 + Math.sin(q * Math.PI / 16) * r]);
      const covered = (x, y) => ringPts(x, y, 12).filter(([bx, by]) => px(bx, by)[3] > 128).length;
      const differ = (a, b) => a.filter((c, i) => c[3] > 128 && Math.abs(c[0] - b[i][0]) + Math.abs(c[1] - b[i][1]) + Math.abs(c[2] - b[i][2]) > 30).length;
      const P = []; for (let y = 9; y <= 12; y++) for (let x = 5; x <= 7; x++) P.push(y * N + x);
      const spot = 10 * N + 6, lands = () => E.knocks(g, P).filter(k => k.to).map(k => [k.to.x, k.to.y]);
      const mark = foods => { g.tick++; g.food = foods.map(([x, y]) => ({ x, y, kind: 'food', expires: g.tick + 900 })); g.woodpecker = { x: 6, y: 10, at: g.time - 9000, target: P, strikeAt: g.tick + 17, last: [spot], struckAt: g.tick - 60, restUntil: g.tick, pecks: 1 }; drawN(3); return R.birdPlan(); };
      const out = {};
      let plan = mark([]), pose = at(-plan.times[3]);
      out.came = { flip: pose.flip, phase: pose.phase, covered: covered(8, 11) };
      plan = mark([[7, 11]]); out.lands1 = lands(); pose = at(-plan.times[3]);
      out.one = { flip: pose.flip, phase: pose.phase, covered: covered(8, 11), beak: +Math.hypot(pose.beak[0] - 6.5 * 32, pose.beak[1] - 10.5 * 32).toFixed(1) };
      plan = mark([[5, 11], [7, 11]]); out.lands2 = lands(); pose = at(-plan.times[3]);
      const hid = out.lands2.map(([x, y]) => ({ x, y, n: covered(x, y) })).sort((a, b) => b.n - a.n)[0], t = __t;
      const ring = () => ringPts(hid.x, hid.y, 12).concat(ringPts(hid.x, hid.y, 13)).map(([bx, by]) => px(bx, by));
      R.birdOver(false); R.birdFrame(0.5, t); const off = ring();
      R.birdOver(true); R.birdFrame(0.5, t); const on = ring();
      out.two = { phase: R.birdPose().phase, hid, under: off.filter(c => c[3] > 128).length, over: differ(off, on) };
      let cell = null; // (under its body, a piece's height clear of the rings)
      for (let y = 6; y <= 17 && !cell; y++) for (let x = 0; x < N && !cell; x++) {
        if (P.includes(y * N + x) || out.lands2.some(([lx, ly]) => Math.hypot(lx - x, ly + 0.6 - y) < 0.8)) continue;
        if ([[0.5, 0.5], [0.5, -0.1], [0.2, -0.1], [0.8, -0.1]].every(([dx, dy]) => px((x + dx) * 32, (y + dy) * 32)[3] > 200)) cell = [x, y];
      }
      g.food.push({ x: cell[0], y: cell[1], kind: 'food', expires: g.tick + 900 });
      R.onTick([{ type: 'knock', kind: 'food', x: cell[0], y: cell[1], tx: cell[0], ty: cell[1] }]); // (tossed up where it lies: half way, at the top of its hop)
      const cx = (cell[0] + 0.5) * 32, cy = (cell[1] - 0.1) * 32, disc = () => { const o = []; for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) if (dx * dx + dy * dy <= 64) o.push(px(cx + dx, cy + dy)); return o; };
      R.birdOver(false); R.birdFrame(0.5, t + 160); const off2 = disc();
      R.birdOver(true); R.birdFrame(0.5, t + 160); const on2 = disc();
      out.air = { cell, under: off2.filter(c => c[3] > 128).length, of: off2.length, over: differ(off2, on2) };
      g.food = [];
      return out;
    })()`);
    {
      const { came, one, two, air } = promise;
      check(came.phase === 'drum' && came.covered > 24 && one.phase === 'drum' && JSON.stringify(promise.lands1) === '[[8,11]]' && one.covered === 0 && one.flip !== came.flip && one.beak < 3,
        'drumming, the woodpecker clings clear of a ring where food in its mark will land, if it can',
        `as it came (facing ${came.flip > 0 ? 'right' : 'left'}) it covers ${came.covered} of 32 points round the ring at 8,11; with an apple landing there it faces ${one.flip > 0 ? 'right' : 'left'}, covering ${one.covered}, its beak ${one.beak} units off the spot`);
      check(two.phase === 'drum' && two.hid.n > 8 && two.over > 0.4 * two.under && air.under === air.of && air.over > 0.8 * air.of,
        'and where it can’t, the ring it covers is drawn over it, as is a piece in the air under it',
        `rings at ${JSON.stringify(promise.lands2)}: ${two.hid.n} of 32 points at ${two.hid.x},${two.hid.y} under it, ${two.over} of its ${two.under} pixels there drawn over; an apple up in the air over ${air.cell}: ${air.over} of ${air.of} pixels drawn over it`);
    }

    // The sound, in a real round on a virtual 60 Hz clock: the drum the game
    // starts (when, how late, how fast) and its last knock against the moment
    // the drawing reaches the strike; the "kik!" against the bird's landing.
    await round('TUNING.SUDDEN_DEATH_MS + 5000');
    const heard = await ev(`(() => {
      const g = SnakeDebug.game(), N = TUNING.GRID, me = g.snakes[0];
      me.stunUntil = 1e9; me.body = [{ x: 3, y: 21 }, { x: 3, y: 22 }, { x: 3, y: 23 }]; me.prev = null;
      const plays = [], play = SnakeAudio.play;
      SnakeAudio.play = (name, o) => { if (name === 'drum' || name === 'call' || name === 'crash') plays.push({ name, o: { ...o }, f: __frames.length }); return play(name, o); };
      g.woodpecker = { x: 15, y: 8, at: g.time, target: [8 * N + 15], strikeAt: g.tick + 17, last: [], struckAt: -1, restUntil: g.tick, pecks: 1 };
      const S = g.woodpecker.strikeAt, tps = [];
      for (let f = 0; f < 200; f++) { vf(1); tps.push(SnakeRender.birdPose().tp); if (g.woodpecker.struckAt === S && plays.some(p => p.name === 'call')) break; }
      SnakeAudio.play = play;
      const frame = 1000 / 60, T0 = __frames.length - tps.length; // (frame k of these at time k * frame)
      const when = v => { for (let k = 1; k < tps.length; k++) if (tps[k - 1] < v && tps[k] >= v) return (k - 1 + (v - tps[k - 1]) / (tps[k] - tps[k - 1])) * frame; return null; };
      const drum = plays.filter(p => p.name === 'drum'), kik = plays.filter(p => p.name === 'call'), crash = plays.filter(p => p.name === 'crash');
      const D = SnakeAudio.drumBlows(1).slice(-1)[0], ms = SnakeEngine.tickMs(g);
      const d = drum[0], first = d ? (d.f - T0) * frame + d.o.delay * 1000 - d.o.from / d.o.rate : null, last = d ? first + D / d.o.rate : null;
      const home = SnakeRender.birdHome(), k = kik[0];
      return { drums: drum.length, strike: when(S), first, last, from: d?.o.from, strikeN: d?.o.strike, crash: crash.length, kiks: kik.length, settle: k?.o.settle, kikAt: k ? (k.f - T0) * frame : null, lands: when(S + home / ms) };
    })()`);
    check(heard.drums === 1 && heard.strikeN === 1 && Math.abs(heard.last - heard.strike) < 1 && heard.crash === 1, 'in a round, the game starts the woodpecker’s drum on its first blow as drawn, so its last knock lands on the strike', heard.drums ? `the drum's last knock ${heard.last?.toFixed(1)} ms in, the strike drawn at ${heard.strike?.toFixed(1)}; ${heard.from} ms of it past as it started; ${heard.crash} crash` : 'no drum');
    check(heard.kiks === 1 && heard.settle && heard.kikAt >= heard.lands - 0.5 && heard.kikAt - heard.lands < 17, 'and it says “kik!” as it settles back on its perch, on the frame it lands', `the call ${heard.kikAt?.toFixed(1)} ms in, landing at ${heard.lands?.toFixed(1)}`);

    // Its layer: the board and the room round it, placed with CSS, not the
    // page; and on a phone, the address bar coming and going (the page
    // shorter, then as it was) never makes it again.
    await b.go(site.url + '?debug', { settle: 0 });
    await ev('__settle()');
    await ev(STAGE);
    const layer = await ev(`(() => {
      ${BIRD}
      rest(12 * N + 22); drawN(5);
      const lb = L.getBoundingClientRect(), bd = document.getElementById('game').getBoundingClientRect(), reach = 6.5 * 32 * 0.85 * bd.width / (N * 32);
      const shown = (Math.min(innerWidth, lb.right) - Math.max(0, lb.left)) * (Math.min(innerHeight, lb.bottom) - Math.max(0, lb.top));
      return { inside: lb.left >= bd.left - reach - 3 && lb.right <= bd.right + reach + 3 && lb.top >= bd.top - reach - 3 && lb.bottom <= bd.bottom + reach + 3, share: +(shown / (innerWidth * innerHeight)).toFixed(2), was: (innerWidth * innerHeight) };
    })()`);
    await b.viewport(390, 844, { scale: 3, mobile: true });
    await b.go(site.url + '?debug', { settle: 0 });
    await ev('__settle()');
    await ev(STAGE);
    // On a phone, food in the woodpecker's mark trembles enough to see: it
    // was under a pixel there, by the board's units. An apple in a marked
    // patch, early in the aim and near the strike: how far it moves across,
    // frame to frame, in CSS px.
    const tremble = await ev(`(() => {
      ${BIRD}
      const lime = (r, g, b) => g > 150 && r > 100 && r < 170 && b < 60, css = document.getElementById('game').getBoundingClientRect().width / N;
      const centre = () => { const p = pixels(9, 9, 3, 3); let n = 0, sx = 0; for (let i = 0; i < p.data.length; i += 4) if (lime(p.data[i], p.data[i + 1], p.data[i + 2])) { n++; sx += (i / 4) % p.width; } return n ? 9 + sx / n / p.width * 3 : null; };
      const spread = left => { g.woodpecker.strikeAt = g.tick - 1 + left; const xs = []; for (let i = 0; i < 9; i++) { drawN(1, 0.5, 23); xs.push(centre()); } return xs.every(v => v != null) ? +((Math.max(...xs) - Math.min(...xs)) * css).toFixed(2) : -1; };
      const P = []; for (let y = 9; y <= 11; y++) for (let x = 9; x <= 11; x++) P.push(y * N + x);
      g.food = [{ x: 10, y: 10, kind: 'food', expires: g.tick + 900 }];
      g.woodpecker = { x: 10, y: 10, at: g.time - 9000, target: P, strikeAt: g.tick + 17, last: [], struckAt: -1, restUntil: 1e9, pecks: 1 };
      drawN(30, 0.5, 16);
      const out = { early: spread(15), late: spread(1) };
      g.woodpecker = null; g.food = []; drawN(2);
      return out;
    })()`);
    check(tremble.early >= 1.5 && tremble.late >= 3, 'on a phone, food in the woodpecker’s mark trembles enough to see, more as the strike nears', `it moves ${tremble.early} CSS px across early in the aim, ${tremble.late} near the strike`);
    await ev(`(() => {
      ${BIRD}
      rest(23 * N + 12); drawN(5);
      window.__sets = 0;
      for (const k of ['width', 'height']) { const was = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k); Object.defineProperty(L, k, { configurable: true, get() { return was.get.call(this); }, set(v) { __sets++; was.set.call(this, v); } }); }
      window.__layerWas = [L.width, L.height];
      return 'ok';
    })()`);
    for (const h of [790, 844, 760, 844]) { await b.viewport(390, h, { scale: 3, mobile: true }); await b.sleep(120); await ev(`(() => { window.dispatchEvent(new Event('resize')); drawN(3); return 'ok'; })()`); }
    const bar = await ev(`({ sets: __sets, was: __layerWas, now: [document.getElementById('bird-layer').width, document.getElementById('bird-layer').height] })`);
    check(layer.inside && layer.share < 0.8 && bar.sets === 0, 'the woodpecker’s layer is the board and the room round it, not the page, and a phone’s address bar coming and going never makes it again',
      `${layer.inside ? 'within' : 'past'} its reach round the board, ${Math.round(layer.share * 100)}% of a 1280×800 window; on a phone the screen 844, 790, 760 px tall: made again ${bar.sets} times (${bar.was.join('×')} → ${bar.now.join('×')})`);

    // With reduced motion: a flight is one glide (its wings still, no
    // bounding), no bob resting, and fewer, slower blows, the last still on
    // the strike.
    await b.viewport(1280, 800);
    await b.go(site.url + '?debug', { settle: 0 });
    await ev('__settle()');
    await ev(STAGE);
    const calm = await ev(`(() => {
      ${BIRD}
      const run = reducedNow => {
        R.setReducedMotion(reducedNow);
        const spot = 6 * N + 4, home = 12 * N + 22, o = {};
        rest(home); drawN(5);
        const crouch = new Set();
        for (let f = 0; f < 120; f++) { drawN(1, 0.5, 16); crouch.add(Math.round(R.birdPose().crouch * 1000)); }
        o.bob = crouch.size;
        const plan = aim(spot, home), strokes = [], ys = [];
        for (let m = plan.depart - 10; m > plan.drum + plan.settle + 10; m -= 8) { const p = at(m); strokes.push(p.stroke); ys.push(p.wing); }
        let turns = 0; for (let i = 2; i < strokes.length; i++) if ((strokes[i] - strokes[i - 1]) * (strokes[i - 1] - strokes[i - 2]) < 0) turns++;
        o.beats = turns; o.blows = plan.times.length; o.gap = Math.min(...plan.times.slice(1).map((t, i) => t - plan.times[i])); o.last = plan.times[plan.times.length - 1];
        return o;
      };
      const lively = run(false), calm = run(true);
      R.setReducedMotion(false);
      return { lively, calm };
    })()`);
    check(calm.lively.beats >= 3 && calm.calm.beats === 0 && calm.lively.bob > 3 && calm.calm.bob === 1 && calm.calm.blows < calm.lively.blows && calm.calm.gap > 2 * calm.lively.gap && calm.calm.last === 0,
      'with reduced motion, the woodpecker glides with its wings still (no wingbeats) and doesn’t bob, and its blows are fewer and slower, the last still on the strike',
      `wingbeats turning ${calm.lively.beats} times in a flight, ${calm.calm.beats} with reduced motion; ${calm.lively.bob} and ${calm.calm.bob} crouches resting; ${calm.lively.blows} blows ${calm.lively.gap} ms apart at the fastest, ${calm.calm.blows} at ${calm.calm.gap}`);

    console.log(results.join('\n'));
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log('\nall passed');
})().catch(e => { console.error(e); process.exit(1); });
