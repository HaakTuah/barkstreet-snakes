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
//   column shows as many of them as one in the middle).
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

    // Golden power pips at the board's edge: as many shown as in the middle.
    const pips = await ev(`(() => {
      const count = x => {
        const g = stage(['gobbler', 'ghost', 'mason']), you = g.snakes[0];
        setBody(you, Array.from({ length: 8 }, (_, i) => [x, 6 + i]), 'up'); you.leaps = 2; you.dashes = 2;
        show(g); drawN(20);
        const d = pixels(Math.max(0, x - 3), 3, 7, 6).data, near = (i, c) => Math.abs(d[i] - c[0]) < 30 && Math.abs(d[i + 1] - c[1]) < 30 && Math.abs(d[i + 2] - c[2]) < 30;
        let sky = 0, ember = 0;
        for (let i = 0; i < d.length; i += 4) { if (near(i, [168, 220, 245])) sky++; else if (near(i, [247, 168, 102])) ember++; }
        return { sky, ember };
      };
      return { edge: count(0), middle: count(10) };
    })()`);
    check(pips.edge.sky >= 0.85 * pips.middle.sky && pips.edge.ember >= 0.85 * pips.middle.ember && pips.middle.sky > 0 && pips.middle.ember > 0,
      'golden power pips stay on the board at its edge', `sky and ember pixels, at the edge ${pips.edge.sky} and ${pips.edge.ember}, in the middle ${pips.middle.sky} and ${pips.middle.ember}`);

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
