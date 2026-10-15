#!/usr/bin/env node
// Frame-time benchmark in headless Chrome (at 2x pixel density):
//   1. the staged scenes (tools/scenes.js: long snakes, Sovereign's and
//      Colonist's land with and without it, holes): the script time of
//      draw(), and the full cost of a frame (script plus the GPU's raster,
//      measured to a readback: see scenes.js); what the land costs, as a
//      ratio to its twin without it; the woodpecker's strike, a frame
//      that paints 14 new holes, against a steady one; and fire burning
//      out, a frame that paints three cells' soot, against a steady one
//   2. step(): whole ticks including every AI decision, over AI-only rounds
//   3. real frames: script time of every animation frame while watching at
//      1x and 4x, with the drawing quality pinned (the governor stays out)
//
//   node tools/bench.js [seconds per watching run] [--root dir]   (default 60)
//
// For the browser's own work while watching (style, paint and the GPU
// process), see tools/trace.js.
const path = require('path');
const { launch, serve } = require('./browser');
const { setup, throughput, strikes, burnouts } = require('./scenes');
const args = process.argv.slice(2);
const at = args.indexOf('--root'), ROOT = at >= 0 ? path.resolve(args.splice(at, 2)[1]) : undefined;
const WATCH = Number(args[0]) || 60;
const SUMMARY = `const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };
const sum = a => ({ frames: a.length, median: q(a, 0.5), p95: q(a, 0.95), p99: q(a, 0.99), worst: q(a, 1), 'over 6.94 ms': a.filter(x => x > 6.94).length, 'over 16.7 ms': a.filter(x => x > 16.7).length });`;

(async () => {
  const site = await serve(ROOT);
  const b = await launch();
  try {
    await b.viewport(800, 800, { scale: 2 });
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      (() => { const raf = window.requestAnimationFrame.bind(window); window.__ft = [];
        window.requestAnimationFrame = cb => raf(ts => { const t0 = performance.now(); cb(ts); window.__ft.push(performance.now() - t0); }); })();` });
    await b.go(site.url + '?debug');

    const full = {};
    for (const scene of ['long', 'fields', 'nofields', 'intruders', 'intruders-bare', 'holes']) {
      await b.eval(setup(scene));
      const script = await b.eval(`(() => { ${SUMMARY}
        const times = [], x = document.getElementById('game').getContext('2d');
        window.__t ||= performance.now();
        for (let f = 0; f < 400; f++) {
          if (f % 10 === 0) x.getImageData(0, 0, 1, 1); // (the GPU caught up, untimed: its backlog isn't script time)
          __t += 7; const t0 = performance.now(); __scene.draw((f % 10) / 10, __t); times.push(performance.now() - t0);
        }
        return sum(times.slice(100));
      })()`); // (script only: the GPU's share is in the full cost)
      full[scene] = await b.eval(throughput());
      console.log(`${scene} scene: draw() script`, script, `full cost per frame ${full[scene]} ms`);
    }
    console.log(`the land's full cost: ${(full.fields / full.nofields).toFixed(2)}x the same board without it (at most 1.5x), ${(full.intruders / full['intruders-bare']).toFixed(2)}x with a rival on it`);
    await b.eval(setup('holes'));
    console.log("the woodpecker's strike, holes scene (full cost of a frame, ms)", await b.eval(strikes()));
    await b.eval(setup('holes'));
    console.log('fire burning out in three cells, their soot painted in, holes scene (full cost of a frame, ms)', await b.eval(burnouts()));
    await b.eval(`SnakeRender.setGame(SnakeDebug.game()); 'ok'`);

    const step = await b.eval(`(() => { ${SUMMARY}
      const E = SnakeEngine, all = [];
      for (let r = 0; r < 4; r++) {
        const g = E.createGame({ withPlayer: false });
        while (g.snakes.filter(s => s.alive).length > 1 && g.time < 300000) { const t0 = performance.now(); E.step(g); all.push(performance.now() - t0); }
      }
      return sum(all);
    })()`);
    console.log('step(), every AI decision included', step);

    await b.eval(`SnakeDebug.pinQuality?.(2); setInterval(() => { if (SnakeDebug.state() === 'over') { document.getElementById('watch').click(); setTimeout(() => window.__speedKey && document.dispatchEvent(new KeyboardEvent('keydown', { key: window.__speedKey, bubbles: true })), 200); } }, 300); 'ok'`);
    for (const [label, key] of [['1x', '1'], ['4x', '3']]) {
      await b.eval(`document.getElementById('watch').click(); 'ok'`);
      await b.eval(`window.__speedKey = ${JSON.stringify(key)}; 0`); // (pressed again after each restart)
      await b.key(key); // (the speed can be set during the countdown)
      await b.sleep(2500);
      await b.eval(`__ft.length = 0; window.__t0 = performance.now(); 'ok'`);
      await b.sleep(WATCH * 1000);
      console.log(`frames watching at ${label}`, await b.eval(`(() => { ${SUMMARY} const s = sum(__ft); s.fps = Math.round(__ft.length / ((performance.now() - __t0) / 1000)); return s; })()`));
    }
    if (b.errors.length) console.log('page errors:', b.errors);
  } finally {
    await b.close();
    site.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
