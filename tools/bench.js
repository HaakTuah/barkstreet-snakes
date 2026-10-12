#!/usr/bin/env node
// Frame-time benchmark in headless Chrome (at 2x pixel density):
//   1. draw(): the long-snake scene (4 x 70 segments, meat, holes), script time
//   2. step(): whole ticks including every AI decision, over AI-only rounds
//   3. real frames: script time of every animation frame while watching at 1x and 4x
//
//   node tools/bench.js [seconds per watching run]   (default 60)
//
// Script time only: for the browser's own work (style, paint and the GPU
// process), record a trace in Chrome DevTools while watching. See AUDIT.md.
const { launch, serve } = require('./browser');
const WATCH = Number(process.argv[2]) || 60;
const SUMMARY = `const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };
const sum = a => ({ frames: a.length, median: q(a, 0.5), p95: q(a, 0.95), p99: q(a, 0.99), worst: q(a, 1), 'over 6.94 ms': a.filter(x => x > 6.94).length, 'over 16.7 ms': a.filter(x => x > 16.7).length });`;

(async () => {
  const site = await serve();
  const b = await launch();
  try {
    await b.viewport(800, 800, { scale: 2 });
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      (() => { const raf = window.requestAnimationFrame.bind(window); window.__ft = [];
        window.requestAnimationFrame = cb => raf(ts => { const t0 = performance.now(); cb(ts); window.__ft.push(performance.now() - t0); }); })();` });
    await b.go(site.url + '?debug');

    const draw = await b.eval(`(() => { ${SUMMARY}
      const E = SnakeEngine, R = SnakeRender, g = E.createGame({ withPlayer: true });
      g.snakes.forEach((s, i) => {
        const body = [];
        for (let k = 0; k < 70; k++) body.push({ x: Math.floor(k / 24) % 2 ? 23 - k % 24 : k % 24, y: Math.min(23, i * 6 + Math.floor(k / 24)) });
        s.body = body; s.prev = body.map(c => ({ ...c })); s.dir = E.DIRS.right;
      });
      g.food = [];
      for (let k = 0; k < 40; k++) g.food.push({ x: k % 24, y: 4 + (k % 2) * 6 + Math.floor(k / 24), kind: 'pellet', color: '#4ade80' });
      for (let k = 0; k < 60; k++) g.holes.add((5 + Math.floor(k / 24) * 6 + 2) * 24 + k % 24);
      R.setGame(g);
      const times = []; let t = performance.now();
      for (let f = 0; f < 600; f++) { t += 7; const t0 = performance.now(); R.frame((f % 10) / 10, t); times.push(performance.now() - t0); }
      R.setGame(SnakeDebug.game());
      return sum(times.slice(100));
    })()`);
    console.log('draw(), long-snake scene', draw);

    const step = await b.eval(`(() => { ${SUMMARY}
      const E = SnakeEngine, all = [];
      for (let r = 0; r < 4; r++) {
        const g = E.createGame({ withPlayer: false });
        while (g.snakes.filter(s => s.alive).length > 1 && g.time < 300000) { const t0 = performance.now(); E.step(g); all.push(performance.now() - t0); }
      }
      return sum(all);
    })()`);
    console.log('step(), every AI decision included', step);

    await b.eval(`setInterval(() => { if (SnakeDebug.state() === 'over') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true })); }, 300); 'ok'`);
    for (const [label, key] of [['1x', '1'], ['4x', '3']]) {
      await b.eval(`document.getElementById('watch').click(); 'ok'`);
      await b.key(key); // (the speed can be set during the countdown)
      await b.sleep(2500);
      await b.eval(`__ft.length = 0; 'ok'`);
      await b.sleep(WATCH * 1000);
      console.log(`frames watching at ${label}`, await b.eval(`(() => { ${SUMMARY} return sum(__ft); })()`));
    }
    if (b.errors.length) console.log('page errors:', b.errors);
  } finally {
    await b.close();
    site.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
