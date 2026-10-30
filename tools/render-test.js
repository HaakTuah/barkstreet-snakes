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
// - A rainbow is upright wherever its golden apple is on the log (left,
//   middle or right, in either half, high or low): it rises out of the
//   apple to its top on the board, between the apple and the far side, and
//   comes down toward the far side, red outermost; from an apple by the
//   middle it rises clearly.
// - Jumps you can see: at the top the neck arches up behind the head and
//   the shadow, left on the ground, falls across the body hopped; after, the
//   body still arches over what it crossed (both, for a golden jump over
//   two); dust puffs at take-off, rings the landing, and a faint trail
//   marks the way; with reduced motion the lift and shadow, no dust or trail.
// - Bridges you can see: a body over a pit is shaded underneath and sags,
//   its shadow shows on the pit's floor (dark, in a floor lit round it),
//   and a tail end over a hole droops, darker; its outline stays as smooth
//   as on the bark (no segment bulging above its line, the rim unbroken).
// - Squashing your own bead (staged from the engine's squash event): it's
//   gone at once, never spat or rolled, and a splat in its colour, wider
//   than the bead, lies where it was and fades within 3 s.
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
//   rimmed so it reads over a body, and a beetle scurries there. Copycat's
//   head, copying, is half its model's colour and half its red, in a thin
//   red rim; copying no one, all red.
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
// The checks are in tools/render/, one file per area, run in name order as the body of this one
// (tools/parts.js): 01 a flash, as drawn, 02 beads and golden pips, 03 Star, 04 scorch, rainbows,
// jumps and bridges, 05 the squash and beetles, 06 flags, strikes and the Field guide, 07 the
// woodpecker, 08 hunger, 09 the chomps (what the round plays when you or a rival eats), 10 flags bending under a snake, standing in depth and hit head-on. A new check goes in its area's file, or a new one.
const path = require('path');
const runParts = require('./parts.js');
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
  // Each check starts with seeds(n), its own: its boards are numbered on from
  // n, and their seeds come from those numbers, so a check added or moved
  // elsewhere can't change another's boards (each n is where the count of
  // boards had reached there, when the seeds came from that count).
  window.seeds = n => { boards = n; };
  window.stage = personas => { __reseed(${SEED} * 1000 + ++boards); const g = E.createGame({ withPlayer: true, personas }); g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.snakes.forEach((s, i) => { setBody(s, [[2 + 4 * i, 23], [1 + 4 * i, 23], [4 * i, 23]], 'right'); s.lastAte = g.time; }); return g; }; // (each just fed: hungry, a body slims, growls and pales)
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

    await runParts.inside(path.join(__dirname, 'render'), { SEED, CELL, check, STAGE, site, b, ev });

    console.log(results.join('\n'));
    if (b.errors.length) { console.log('page errors:', b.errors); failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
  console.log(`\nall passed (${results.length} checks)`);
})().catch(e => { console.error(e); process.exit(1); });
