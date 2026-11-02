// Pictures of the woodpecker pecking beside a snake (2e, "The woodpecker
// pecks beside a snake, not on it"), on any copy of the game, for a
// before and after: drumming a cell a snake's tail ends on, and an empty
// cell, near the strike; with the cell's box on the picture, image px:
//   node shots.js <root> <out-prefix> <w>x<h>@<dpr>[m] ...   (m: a phone)
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3], sizes = process.argv.slice(4);
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); try { localStorage.clear(); } catch (e) {} })();` });
    for (const s of sizes) {
      const m = /^(\d+)x(\d+)(?:@([\d.]+))?(m?)$/.exec(s), dpr = +(m[3] || 2);
      for (const kind of ['tail', 'empty']) {
        await b.viewport(+m[1], +m[2], { scale: dpr, mobile: !!m[4] });
        await b.go(site.url + 'index.html?debug', { settle: 800 });
        await b.eval(`document.getElementById('watch')?.click(); 'ok'`);
        await b.eval(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
        await sleep(300);
        const box = await b.eval(`(() => { const g = SnakeDebug.game(), R = SnakeRender, cx = 12, cy = 12, S = g.tick + 40, t0 = g.tick;
          g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
          const put = (sn, cells) => { sn.body = cells.map(([x, y]) => ({ x, y })); sn.prev = sn.body.map(c => ({ ...c })); sn.queue = []; };
          g.snakes.forEach((sn, i) => put(sn, [[3 + 5 * i, 3], [2 + 5 * i, 3], [1 + 5 * i, 3]]));
          if (${kind === 'tail'}) put(g.snakes[0], [[cx, cy - 4], [cx, cy - 3], [cx, cy - 2], [cx, cy - 1], [cx, cy]]);
          g.food = g.food.filter(f => Math.abs(f.x - cx) > 3 || Math.abs(f.y - cy) > 3);
          g.woodpecker = { x: cx, y: cy, at: g.time, target: [cy * GRID + cx], strikeAt: S, last: [], struckAt: -1, restUntil: t0, pecks: 0 };
          let now = performance.now();
          for (let t = t0; t < S + 1; t++) { g.tick = t; for (const u of [0, 0.25, 0.5, 0.75]) { R.frame(u, now += 16); if (R.birdPose().phase === 'drum' && t >= S - 1) {
            const k = boardRect.w / SIZE; return [boardRect.x + cx * CELL * k, boardRect.y + cy * CELL * k, CELL * k].map(v => Math.round(v * ${dpr})); } } }
          return null; })()`);
        await b.shot(`${out}-${kind}-${m[1]}x${m[2]}.jpg`, 85);
        console.log(s, kind, 'cell at', box && box.join(' '));
      }
    }
  } finally { await b.close(); site.close(); }
})();
