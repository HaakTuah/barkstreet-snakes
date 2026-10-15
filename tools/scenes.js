// Staged boards for the benchmarks, as page-side source: each defines
// window.__scene = { game, draw(alpha, now) } on a page loaded with ?debug.
// The scene is set once (setGame rebuilds the bark: never per frame), and the
// game itself stays on its title card, so nothing else draws.
//
//   long:   4 snakes x 70 segments, 40 beads, 60 holes (the second pass's scene)
//   fields: Sovereign's realm and Colonist's three colonies (two overlapping,
//           one inside the realm), 150 holes, 4 snakes of 30
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
  fields: `(() => {
    const E = SnakeEngine, g = E.createGame({ withPlayer: true, personas: ['sovereign', 'colonist', 'gobbler'] });
    const [you, sov, col, gob] = g.snakes;
    const line = (x, y, n, dx, dy) => Array.from({ length: n }, (_, i) => ({ x: x - dx * i, y: y - dy * i }));
    you.body = line(2, 2, 30, 0, -1).map((c, i) => ({ x: 2 + Math.floor(i / 22), y: i % 22 })); you.dir = E.DIRS.down;
    sov.body = line(23, 0, 30, 0, -1).map((c, i) => ({ x: 21 - Math.floor(i / 22), y: i % 22 })); sov.dir = E.DIRS.down;
    col.body = Array.from({ length: 30 }, (_, i) => ({ x: 4 + i % 16, y: 22 + Math.floor(i / 16) })); col.dir = E.DIRS.left;
    gob.body = Array.from({ length: 30 }, (_, i) => ({ x: 6 + i % 12, y: 12 + Math.floor(i / 12) })); gob.dir = E.DIRS.right;
    for (const s of g.snakes) { s.prev = s.body.map(c => ({ ...c })); }
    sov.memory.home = { x: 15, y: 8, radius: 6 };
    col.memory.colonies = [{ x: 6, y: 6, radius: 4, n: 1 }, { x: 10, y: 9, radius: 4, n: 2 }, { x: 16, y: 10, radius: 4, n: 3 }];
    g.food = [];
    for (let k = 0; k < 150; k++) g.holes.add(((k * 37) % 24) * 24 + (k * 11) % 24);
    return g;
  })()`,
};

// Page-side source that sets up a scene: window.__scene.draw(alpha, now).
const setup = name => `(() => {
  const R = SnakeRender, g = ${SCENES[name]};
  R.setGame(g);
  window.__scene = { game: g, f: 0, draw(alpha, now) { R.frame(alpha, now); } };
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

module.exports = { SCENES, setup, throughput };
