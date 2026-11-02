// Frame strips of a snake crossing a colony's flag and Sovereign's banner
// (2l, flags that bend as a snake goes over them), from each side, and
// passing the row behind it and in front of it (2p), on any
// copy of the game: a crop round the flag at each tick as the snake comes
// on, lies on it and leaves, then as it springs back. One picture a frame:
//   node shots.js <root> <out-dir> <w>x<h>@<dpr>[m] ...   (m: a phone)
// writes <out-dir>/<size>-<flag>-<side>-<n>.jpg; tools/dev/montage.js
// lays them out.
const fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3], sizes = process.argv.slice(4);
const { launch, serve } = require(path.join(root, 'tools', 'browser.js'));
const FLAGS = { flag: [12, 7], banner: [17, 15] };
const SIDES = { east: [1, 0, 'right'], west: [-1, 0, 'left'], north: [0, -1, 'up'], south: [0, 1, 'down'], behind: [1, 0, 'right', -1], front: [1, 0, 'right', 1] }; // (2p: behind and front pass the row above it and below it)
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); try { localStorage.clear(); } catch (e) {} })();` });
    for (const s of sizes) {
      const m = /^(\d+)x(\d+)(?:@([\d.]+))?(m?)$/.exec(s);
      await b.viewport(+m[1], +m[2], { scale: +(m[3] || 2), mobile: !!m[4] });
      await b.go(site.url + 'index.html?debug', { settle: 800 });
      await b.eval(`(() => { window.__autoRaf = false; const E = SnakeEngine, R = SnakeRender;
        window.__t = performance.now() + 1e6;
        window.drawN = (n, alpha, step) => { for (let i = 0; i < n; i++) { __t += step; R.frame(alpha, __t); } };
        window.setBody = (s, cells, dir) => { s.prev = s.body ? s.body.map(c => ({ ...c })) : null; s.body = cells.map(([x, y]) => ({ x, y })); if (!s.prev || s.prev.length !== s.body.length) s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; s.queue = []; s.planned = null; };
        const g = E.createGame({ withPlayer: true, personas: ['colonist', 'sovereign', 'mason'] }); g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12;
        const [you, col, sov, ma] = g.snakes; window.__g = g;
        g.snakes.forEach(s => { s.lastAte = g.time; });
        setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
        setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 21]), 'right');
        setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right');
        setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
        col.memory.colonies = [{ x: 12, y: 7, radius: 3, n: 2 }];
        sov.memory.home = { x: 17, y: 15, radius: 4 };
        document.getElementById('overlay').classList.add('hidden'); R.setViewer(0); R.setGame(g); drawN(30, 0.5, 60); return 'ok'; })()`);
      const box = await b.eval(`(() => { const r = document.getElementById('game').getBoundingClientRect(); return [r.left, r.top, r.width / TUNING.GRID]; })()`);
      for (const [fname, [fx, fy]] of Object.entries(FLAGS)) for (const [side, [dx, dy, dir, row = 0]] of Object.entries(SIDES)) {
        let n = 0;
        const shot = async () => {
          const c = box[2], r = await b.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, clip: { x: box[0] + (fx - 2) * c, y: box[1] + (fy - 2) * c, width: 5 * c, height: 4.5 * c, scale: 1 } });
          fs.writeFileSync(path.join(out, `${m[1]}x${m[2]}-${fname}-${side}-${n++}.jpg`), Buffer.from(r.data, 'base64'));
        };
        // (the head from two cells short of the flag to past it, the tail leaving it, then the spring back)
        for (let h = -2; h <= 6; h++) {
          const cells = [0, 1, 2, 3].map(i => [fx + dx * (h - i), fy + row + dy * (h - i)]);
          await b.eval(`(() => { setBody(__g.snakes[0], ${JSON.stringify(cells)}, '${dir}'); __g.tick++; drawN(3, 0.5, 33); return 'ok'; })()`);
          await shot();
        }
        for (const ms of [66, 132, 200, 300, 600]) { await b.eval(`drawN(2, 0.5, ${ms / 2 - (ms > 66 ? 0 : 0)}); 'ok'`); await shot(); }
        await b.eval(`(() => { setBody(__g.snakes[0], [[2, 22], [1, 22], [0, 22]], 'right'); drawN(30, 0.5, 60); return 'ok'; })()`);
      }
      console.log(s, 'done');
    }
  } finally { await b.close(); site.close(); }
})().catch(e => { console.error(e); process.exit(1); });
