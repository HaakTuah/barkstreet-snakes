#!/usr/bin/env node
// Frame-time benchmark in headless Chrome (at 2x pixel density):
//   1. the staged scenes (tools/scenes.js: long snakes, Sovereign's and
//      Colonist's land with and without it, holes): the script time of
//      draw(), and the full cost of a frame (script plus the GPU's raster,
//      measured to a readback: see scenes.js); what the land costs against
//      its twin without it, the two alternated in one page (a shared, busy
//      machine drifts more between two runs a minute apart than the land
//      costs): ms a frame and the ratio, and of that, the land's colour
//      round the rivals on it, drawn and not, alternated in one page; the
//      woodpecker's strike, a frame that paints 14 new holes, against a
//      steady one; and fire burning out, a frame that paints three cells'
//      soot, against a steady one
//   2. step(): whole ticks including every AI decision, over AI-only rounds
//   3. real frames: script time of every animation frame while watching at
//      1x and 4x, with the drawing quality pinned (the governor stays out)
//
//   node tools/bench.js [seconds per watching run] [--root dir]   (default 60)
//   node tools/bench.js --land [pairs] [--root dir]   (only the land against its twin; default 10 pairs)
//
// For the browser's own work while watching (style, paint and the GPU
// process), see tools/trace.js.
const path = require('path');
const { launch, serve } = require('./browser');
const { setup, throughput, strikes, burnouts } = require('./scenes');
const args = process.argv.slice(2);
const at = args.indexOf('--root'), ROOT = at >= 0 ? path.resolve(args.splice(at, 2)[1]) : undefined;
const land = args.indexOf('--land'), LAND_ONLY = land >= 0 && !!args.splice(land, 1).length;
const WATCH = Number(args[0]) || 60, PAIRS = LAND_ONLY ? Number(args[0]) || 10 : 6;
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
// The land against its twin without it (see scenes.js), alternated in one
// page, pairs times over: what it adds a frame (ms: the median of the pairs'
// differences) and the ratio of the medians (the budget: at most 1.5x).
async function landTwins(b, pairs) {
  for (const [what, w, wo] of [['the land', 'fields', 'nofields'], ['a rival on it', 'intruders', 'intruders-bare']]) {
    const on = [], off = [], diff = [];
    for (let k = 0; k < pairs; k++) {
      const t = {};
      for (const scene of k % 2 ? [wo, w] : [w, wo]) { await b.eval(setup(scene)); t[scene] = await b.eval(throughput(4)); }
      on.push(t[w]); off.push(t[wo]); diff.push(t[w] - t[wo]);
    }
    console.log(`${what}, alternated with its twin ${pairs} times: +${med(diff).toFixed(2)} ms a frame, ${(med(on) / med(off)).toFixed(2)}x (${med(on).toFixed(2)} against ${med(off).toFixed(2)} ms; each pair ${on.map((x, i) => (x / off[i]).toFixed(2)).join(' ')})`);
  }
  // And of that, the land's colour round the rivals on it (its glow, its
  // keyline and its line): the same board drawn with it and without it
  // (SnakeRender.hues), 30 times over, each time with, without, without,
  // with (so a slow first batch after a pause, or a drift, falls on both).
  for (const scene of ['fields', 'intruders']) {
    await b.eval(setup(scene));
    const r = await b.eval(`(async () => {
      const R = SnakeRender;
      const run = on => { R.hues(on); const t0 = performance.now(); for (let i = 0; i < 20; i++) { __t += 7; __scene.draw((__scene.f++ % 10) / 10, __t); } __sync(); return (performance.now() - t0) / 20; };
      run(true); run(false);
      const diff = [];
      for (let k = 0; k < 30; k++) {
        await new Promise(r => setTimeout(r, 10));
        run(true); // (untimed: the first after a pause)
        const a = run(true), b = run(false), c = run(false), d = run(true);
        diff.push((a + d - b - c) / 2);
      }
      R.hues(true);
      const s = diff.sort((p, q) => p - q);
      return { ms: +s[s.length >> 1].toFixed(2), p25: +s[s.length >> 2].toFixed(2), p75: +s[(3 * s.length) >> 2].toFixed(2) };
    })()`);
    console.log(`the land's colour round its rivals, ${scene} scene: +${r.ms} ms a frame (quartiles ${r.p25} to ${r.p75})`);
  }
}
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
    if (LAND_ONLY) { await b.eval(`SnakeDebug.pinQuality?.(2); 'ok'`); await landTwins(b, PAIRS); return; }

    const full = {};
    for (const scene of ['long', 'fields', 'nofields', 'intruders', 'intruders-bare', 'holes']) {
      await b.eval(setup(scene));
      const script = await b.eval(`(() => { ${SUMMARY}
        const times = [];
        window.__t ||= performance.now();
        for (let f = 0; f < 400; f++) {
          if (f % 10 === 0) __sync(); // (the GPU caught up, untimed: its backlog isn't script time; see scenes.js)
          __t += 7; const t0 = performance.now(); __scene.draw((f % 10) / 10, __t); times.push(performance.now() - t0);
        }
        return sum(times.slice(100));
      })()`); // (script only: the GPU's share is in the full cost)
      full[scene] = await b.eval(throughput());
      console.log(`${scene} scene: draw() script`, script, `full cost per frame ${full[scene]} ms`);
    }
    await landTwins(b, PAIRS);
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
