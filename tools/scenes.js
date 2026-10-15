// Staged boards for the benchmarks, as page-side source: each defines
// window.__scene = { game, draw(alpha, now) } on a page loaded with ?debug.
// The scene is set once (setGame rebuilds the bark: never per frame), and the
// game itself stays on its title card, so nothing else draws.
//
//   long:      4 snakes x 70 segments, 40 beads, 60 holes (the second pass's scene)
//   fields:    Sovereign's realm and Colonist's three colonies (two overlapping,
//              one inside the realm), 150 holes, 4 snakes of 30
//   nofields:  the same board without the land (its twin: the land's cost is the ratio)
//   intruders: the fields board with a rival's head deep in the realm (Gobbler
//              as a serpentine through it): the land lit up, its colour round the rival
//   intruders-bare: the same board without the land (its twin)
//   holes:     late sudden death, about 170 holes in a few big hollows, 3 snakes
//              of 30; __scene.strike is a patch of 14 more, for a strike frame
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
const SCENES = {
  long: `(() => {
    const E = SnakeEngine, R = SnakeRender, g = E.createGame({ withPlayer: true, personas: ['sniper', 'mason', 'gobbler'] });
    g.snakes.forEach((s, i) => {
      const body = [];
      for (let k = 0; k < 70; k++) body.push({ x: Math.floor(k / 24) % 2 ? 23 - k % 24 : k % 24, y: Math.min(23, i * 6 + Math.floor(k / 24)) });
      s.body = body; s.prev = body.map(c => ({ ...c })); s.dir = E.DIRS.right;
    });
    g.food = [];
    for (let k = 0; k < 40; k++) g.food.push({ x: k % 24, y: 4 + (k % 2) * 6 + Math.floor(k / 24), kind: 'pellet', color: '#4ade80' });
    for (let k = 0; k < 60; k++) g.holes.add((5 + Math.floor(k / 24) * 6 + 2) * 24 + k % 24);
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

// Page-side source that sets up a scene: window.__scene.draw(alpha, now).
// It's drawn for a moment first, so what pops in or grows has settled.
const setup = name => `(() => {
  const R = SnakeRender, g = ${SCENES[name]};
  R.setGame(g);
  window.__scene = { game: g, f: 0, strike: g.strike || null, draw(alpha, now) { R.frame(alpha, now); } };
  window.__t ||= performance.now(); // (one clock for every run in the page: it only goes forward)
  for (let i = 0; i < 100; i++) { __t += 16; R.frame(0.5, __t); }
  return 'ok';
})()`;

// Page-side source: the full cost of a frame (script and the GPU's raster),
// drawn back to back in batches, each closed by a one-pixel readback that
// waits for the GPU. Resolves to ms per frame (median over the batches).
const throughput = (batches = 12, frames = 30) => `(async () => {
  const c = document.getElementById('game'), x = c.getContext('2d');
  window.__t ||= performance.now(); // (one clock for every run in the page: it only goes forward)
  const run = () => { const t0 = performance.now(); for (let i = 0; i < ${frames}; i++) { __t += 7; __scene.draw((__scene.f++ % 10) / 10, __t); } x.getImageData(0, 0, 1, 1); return (performance.now() - t0) / ${frames}; };
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
  const g = __scene.game, x = document.getElementById('game').getContext('2d'), steady = [], strike = [];
  for (let n = 0; n < ${rounds}; n++) {
    await new Promise(r => setTimeout(r, 15));
    x.getImageData(0, 0, 1, 1);
    let t0 = performance.now(); __t += 16; __scene.draw(0.5, __t); x.getImageData(0, 0, 1, 1); steady.push(performance.now() - t0);
    for (const k of __scene.strike) g.holes.add(k);
    t0 = performance.now(); __t += 16; __scene.draw(0.5, __t); x.getImageData(0, 0, 1, 1); strike.push(performance.now() - t0);
    for (const k of __scene.strike) g.holes.delete(k);
    __t += 16; __scene.draw(0.5, __t); // (the board painted again without them)
  }
  return { steady: sum(steady), strike: sum(strike) };
})()`;

module.exports = { SCENES, setup, throughput, strikes };
