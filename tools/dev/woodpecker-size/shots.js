// Pictures of the woodpecker at its size (2c, "The woodpecker, 1.3
// times"; 2k, as big as it can get away with), on any copy of the game,
// for a before and after: perched at rest (beside the board, or under it
// on a phone held upright), flying out to its chunk, and drumming it on
// the board, and how tall it stands, CSS px:
//   node shots.js <root> <out-prefix> <w>x<h>@<dpr>[m] ...   (m: a phone)
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3], sizes = process.argv.slice(4);
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); try { localStorage.clear(); } catch (e) {} })();` });
    for (const s of sizes) {
      const m = /^(\d+)x(\d+)(?:@([\d.]+))?(m?)$/.exec(s);
      await b.viewport(+m[1], +m[2], { scale: +(m[3] || 2), mobile: !!m[4] });
      await b.go(site.url + 'index.html?debug', { settle: 800 });
      await b.eval(`document.getElementById('watch')?.click(); 'ok'`);
      await b.eval(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
      await sleep(300);
      // (one strike staged on the held board: its rest, then the drum)
      await b.eval(`(() => { const g = SnakeDebug.game(); window.__cell = 18 * GRID + 12; window.__t0 = g.tick; window.__S = g.tick + 40;
        g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000); g.woodpecker = null; SnakeDebug.draw();
        g.woodpecker = { x: 12, y: 18, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick + 1e6, pecks: 0 };
        window.__now = performance.now(); for (let i = 0; i < 6; i++) SnakeRender.frame(0.5, window.__now += 16); return 'ok'; })()`);
      const tall = `Math.round(SnakeRender.birdPose().s * (BIRD_BOX[3] - BIRD_BOX[1]) * BU * boardRect.w / SIZE)`;
      const rest = await b.eval(tall);
      await b.shot(`${out}-rest-${m[1]}x${m[2]}.jpg`, 82);
      await b.eval(`(() => { const g = SnakeDebug.game(), R = SnakeRender, S = window.__S; let n = 0;
        Object.assign(g.woodpecker, { target: [window.__cell], strikeAt: S, restUntil: window.__t0 });
        for (let t = window.__t0; t < S + 40; t++) { g.tick = t; for (const u of [0, 0.25, 0.5, 0.75]) { R.frame(u, window.__now += 16); if (R.birdPose().phase === 'out' && ++n === 3) { window.__t = t + 1; return 'ok'; } } }
        window.__t = window.__t0; return 'none'; })()`);
      await b.shot(`${out}-fly-${m[1]}x${m[2]}.jpg`, 82);
      const drum = await b.eval(`(() => { const g = SnakeDebug.game(), R = SnakeRender, S = window.__S;
        for (let t = window.__t; t < S + 40; t++) { g.tick = t; for (const u of [0, 0.25, 0.5, 0.75]) { R.frame(u, window.__now += 16); if (R.birdPose().phase === 'drum' && t >= S - 2) return ${tall}; } }
        return -1; })()`);
      await b.shot(`${out}-drum-${m[1]}x${m[2]}.jpg`, 82);
      console.log(s, `perched ${rest} px tall, drumming ${drum} px`);
    }
  } finally { await b.close(); site.close(); }
})();
