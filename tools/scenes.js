// Staged boards for the benchmarks, as page-side source: each defines
// window.__scene = { game, draw(alpha, now) } on a page loaded with ?debug.
// The scene is set once (setGame rebuilds the bark: never per frame), and the
// game itself stays on its title card, so nothing else draws.
//
//   long:      4 snakes x 70 segments, 40 beads, 60 holes (the second pass's scene)
//   long-star: the same with Star in Sniper's seat (round five: its rainbow, its
//              star for a head and the twinkles its tail sheds)
//   fields:    Sovereign's realm and Colonist's three colonies (two overlapping,
//              one inside the realm), 150 holes, 4 snakes of 30
//   nofields:  the same board without the land (its twin: the land's cost is the ratio)
//   intruders: the fields board with a rival's head deep in the realm (Gobbler
//              as a serpentine through it): the land lit up, its colour round the rival
//   intruders-bare: the same board without the land (its twin)
//   holes:     late sudden death, about 170 holes in a few big hollows, 3 snakes
//              of 30; __scene.strike is a patch of 14 more, for a strike frame
//   bridges:   round six A's bodies over holes: 4 snakes of 30 lying across
//              ditches of holes (bridging them: shadows down in the pits, shaded
//              underneath, sagging), and a tail hanging into one
//   leaps:     the long scene with two snakes up in the air, held at the top of
//              a jump, its tick never coming (round six A: the arch along the
//              neck, its shadow laid over the bodies on the ground, the trail)
const fields = ({ land = true, intruder = false } = {}) => `(() => {
    const E = SnakeEngine, g = E.createGame({ withPlayer: true, personas: ['sovereign', 'colonist', 'gobbler'] });
    const [you, sov, col, gob] = g.snakes;
    const line = (x, y, n, dx, dy) => Array.from({ length: n }, (_, i) => ({ x: x - dx * i, y: y - dy * i }));
    you.body = line(2, 2, 30, 0, -1).map((c, i) => ({ x: 2 + Math.floor(i / 22), y: i % 22 })); you.dir = E.DIRS.down;
    sov.body = line(23, 0, 30, 0, -1).map((c, i) => ({ x: 21 - Math.floor(i / 22), y: i % 22 })); sov.dir = E.DIRS.down;
    col.body = Array.from({ length: 30 }, (_, i) => ({ x: 4 + i % 16, y: 22 + Math.floor(i / 16) })); col.dir = E.DIRS.left;
    gob.body = Array.from({ length: 30 }, (_, i) => ({ x: 6 + i % 12, y: 12 + Math.floor(i / 12) })); gob.dir = E.DIRS.right;
    ${intruder ? 'gob.body = Array.from({ length: 30 }, (_, i) => ({ x: 15 - Math.floor(i / 10), y: Math.floor(i / 10) % 2 ? 17 - i % 10 : 8 + i % 10 })); gob.dir = E.DIRS.up;' : ''}
    for (const s of g.snakes) { s.prev = s.body.map(c => ({ ...c })); }
    ${land ? `sov.memory.home = { x: 15, y: 8, radius: 6 };
    col.memory.colonies = [{ x: 6, y: 6, radius: 4, n: 1 }, { x: 10, y: 9, radius: 4, n: 2 }, { x: 16, y: 10, radius: 4, n: 3 }];` : ''}
    g.food = [];
    for (let k = 0; k < 150; k++) g.holes.add(((k * 37) % 24) * 24 + (k * 11) % 24);
    return g;
  })()`;
const long = first => `(() => {
    const E = SnakeEngine, R = SnakeRender, g = E.createGame({ withPlayer: true, personas: ['${first}', 'mason', 'gobbler'] });
    g.snakes.forEach((s, i) => {
      const body = [];
      for (let k = 0; k < 70; k++) body.push({ x: Math.floor(k / 24) % 2 ? 23 - k % 24 : k % 24, y: Math.min(23, i * 6 + Math.floor(k / 24)) });
      s.body = body; s.prev = body.map(c => ({ ...c })); s.dir = E.DIRS.right;
    });
    g.food = [];
    for (let k = 0; k < 40; k++) g.food.push({ x: k % 24, y: 4 + (k % 2) * 6 + Math.floor(k / 24), kind: 'pellet', color: '#4ade80' });
    for (let k = 0; k < 60; k++) g.holes.add((5 + Math.floor(k / 24) * 6 + 2) * 24 + k % 24);
    return g;
  })()`;
const SCENES = {
  long: long('sniper'),
  'long-star': long('star'),
  bridges: `(() => {
    const E = SnakeEngine, g = E.createGame({ withPlayer: true, personas: ['sniper', 'mason', 'gobbler'] });
    for (let y = 0; y < 24; y++) for (const x of [4, 5, 11, 17, 18]) g.holes.add(y * 24 + x); // (ditches down the log, one and two cells wide)
    g.snakes.forEach((s, i) => {
      const row = 2 + i * 6, body = [];
      for (let k = 0; k < 30; k++) body.push(k < 22 ? { x: 22 - k, y: row } : { x: 1, y: row + 1 + (k - 22) % 3 }); // (across the ditches, then down the left)
      s.body = body; s.prev = body.map(c => ({ ...c })); s.dir = E.DIRS.right;
    });
    const t = g.snakes[3]; t.body = t.body.slice(0, 18); t.prev = t.body.map(c => ({ ...c })); // (its tail end over the ditch at 4 and 5)
    g.food = [];
    return g;
  })()`,
  leaps: `(() => {
    const g = ${long('sniper')}, [a, b] = g.snakes;
    window.__leaps = [{ type: 'leap', snake: a, x: a.body[0].x, y: a.body[0].y, gold: 0, reach: 1 }, { type: 'leap', snake: b, x: b.body[0].x, y: b.body[0].y, gold: 1, reach: 1 }];
    return g;
  })()`,
  fields: fields(),
  nofields: fields({ land: false }),
  intruders: fields({ intruder: true }),
  'intruders-bare': fields({ land: false, intruder: true }),
  holes: `(() => {
    const E = SnakeEngine, N = 24, g = E.createGame({ withPlayer: true, personas: ['mason', 'ghost', 'sniper'] });
    let seed = 23;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const snake = (s, x, y, len) => { s.body = Array.from({ length: 30 }, (_, i) => { const row = Math.floor(i / len), j = i % len; return { x: x - (row % 2 ? len - 1 - j : j), y: y + row }; }); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS.right; };
    snake(g.snakes[0], 12, 9, 6); snake(g.snakes[1], 22, 1, 6); snake(g.snakes[2], 10, 18, 6); g.snakes[3].alive = false;
    const busy = new Set(); for (const s of g.snakes) if (s.alive) for (const c of s.body) busy.add(c.y * N + c.x);
    // Patches as round four's woodpecker grows them: compact, half of them widening an old hollow.
    const patchFrom = (size, from) => {
      const patch = new Set([from]);
      while (patch.size < size) {
        const opts = [], w = [];
        for (const k of patch) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = k % N + dx, y = (k - k % N) / N + dy, n = y * N + x;
          if (x < 0 || y < 0 || x >= N || y >= N || patch.has(n) || g.holes.has(n) || busy.has(n)) continue;
          let a = 0, b = 0;
          for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const m = (y + ey) * N + x + ex; if (patch.has(m)) a++; if (g.holes.has(m)) b++; }
          opts.push(n); w.push((1 + 3 * a + 2 * b) ** 2);
        }
        if (!opts.length) break;
        let r = rnd() * w.reduce((p, q) => p + q, 0), i = 0;
        while (r > w[i]) r -= w[i++];
        patch.add(opts[i]);
      }
      return [...patch];
    };
    const startNear = () => {
      if (g.holes.size && rnd() < 0.5) {
        const hs = [...g.holes];
        for (let t = 0; t < 40; t++) { const h = hs[Math.floor(rnd() * hs.length)], x = h % N + [1, -1, 0, 0][t % 4], y = (h - h % N) / N + [0, 0, 1, -1][t % 4], n = y * N + x; if (x >= 0 && y >= 0 && x < N && y < N && !g.holes.has(n) && !busy.has(n)) return n; }
      }
      for (;;) { const n = Math.floor(rnd() * N * N); if (!g.holes.has(n) && !busy.has(n)) return n; }
    };
    for (let s = 0; s < 16; s++) for (const k of patchFrom(Math.min(14, 7 + s), startNear())) g.holes.add(k);
    g.food = [];
    g.time = 175000;
    g.strike = patchFrom(14, startNear());
    return g;
  })()`,
};

// Page-side source: window.__sync(), which waits for the GPU to finish the
// board, by reading one pixel of it back through a one-pixel canvas of its
// own. (Read back from the board itself, Chrome takes it for a canvas that's
// read often and moves it off the GPU: after about a hundred readbacks every
// frame cost ten times as much, a circle the most, so whatever ran late in a
// run of tools/bench.js was timed on the CPU.)
const SYNC = `window.__sync ||= (() => {
  const c = document.getElementById('game'), p = document.createElement('canvas'); p.width = p.height = 1;
  const g = p.getContext('2d', { willReadFrequently: true });
  return () => { g.drawImage(c, 0, 0, 1, 1, 0, 0, 1, 1); g.getImageData(0, 0, 1, 1); };
})();`;

// Page-side source that sets up a scene: window.__scene.draw(alpha, now).
// It's drawn for a moment first, so what pops in or grows has settled.
const setup = name => `(() => {
  ${SYNC}
  const R = SnakeRender, g = ${SCENES[name]};
  R.setGame(g);
  if (window.__leaps) { R.onTick(__leaps); window.__leaps = null; } // (the leaps scene's jumps, as the game reports them)
  window.__scene = { game: g, f: 0, strike: g.strike || null, draw(alpha, now) { R.frame(alpha, now); } };
  window.__t ||= performance.now(); // (one clock for every run in the page: it only goes forward)
  for (let i = 0; i < 100; i++) { __t += 16; R.frame(0.5, __t); }
  return 'ok';
})()`;

// Page-side source: the full cost of a frame (script and the GPU's raster),
// drawn back to back in batches, each closed by a one-pixel readback that
// waits for the GPU (see SYNC). Resolves to ms per frame (median over the batches).
const throughput = (batches = 12, frames = 30) => `(async () => {
  ${SYNC}
  window.__t ||= performance.now(); // (one clock for every run in the page: it only goes forward)
  const run = () => { const t0 = performance.now(); for (let i = 0; i < ${frames}; i++) { __t += 7; __scene.draw((__scene.f++ % 10) / 10, __t); } __sync(); return (performance.now() - t0) / ${frames}; };
  run();
  const out = [];
  for (let b = 0; b < ${batches}; b++) { await new Promise(r => setTimeout(r, 20)); out.push(run()); }
  out.sort((a, b) => a - b);
  return +out[out.length >> 1].toFixed(2);
})()`;

// Page-side source: on the holes scene, the woodpecker's strike. Each round
// times a steady frame, then the frame that paints the 14 new holes into the
// board, each closed by a readback (so the GPU's share counts), then takes
// them away again (untimed). Resolves to { steady, strike } summaries.
const strikes = (rounds = 24) => `(async () => {
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };
  const sum = a => ({ median: q(a, 0.5), p90: q(a, 0.9), worst: q(a, 1) });
  ${SYNC}
  const g = __scene.game, steady = [], strike = [];
  for (let n = 0; n < ${rounds}; n++) {
    await new Promise(r => setTimeout(r, 15));
    __sync();
    let t0 = performance.now(); __t += 16; __scene.draw(0.5, __t); __sync(); steady.push(performance.now() - t0);
    for (const k of __scene.strike) g.holes.add(k);
    t0 = performance.now(); __t += 16; __scene.draw(0.5, __t); __sync(); strike.push(performance.now() - t0);
    for (const k of __scene.strike) g.holes.delete(k);
    __t += 16; __scene.draw(0.5, __t); // (the board painted again without them)
  }
  return { steady: sum(steady), strike: sum(strike) };
})()`;

// Page-side source: on the holes scene, fire burning out. Each round sets
// three cells burning (a frame, untimed), times a steady frame, then the
// frame where they burn out and their soot is painted into the board (see
// render.js's drawScorch), each closed by a readback. Resolves to { steady,
// burnout } summaries.
const burnouts = (rounds = 24) => `(async () => {
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };
  const sum = a => ({ median: q(a, 0.5), p90: q(a, 0.9), worst: q(a, 1) });
  ${SYNC}
  const g = __scene.game, steady = [], burnout = [];
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < ${rounds}; n++) {
    await new Promise(r => setTimeout(r, 15));
    const cells = [];
    while (cells.length < 3) { const k = Math.floor(rnd() * 576); if (!g.holes.has(k) && !cells.includes(k)) cells.push(k); }
    g.fires = new Map(cells.map(k => [k, { from: 0, until: 1e9 }])); g.tick++; __t += 16; __scene.draw(0.5, __t); __sync();
    let t0 = performance.now(); __t += 16; __scene.draw(0.5, __t); __sync(); steady.push(performance.now() - t0);
    g.fires = new Map(); g.tick++;
    t0 = performance.now(); __t += 16; __scene.draw(0.5, __t); __sync(); burnout.push(performance.now() - t0);
  }
  return { steady: sum(steady), burnout: sum(burnout) };
})()`;

module.exports = { SCENES, setup, throughput, strikes, burnouts };
