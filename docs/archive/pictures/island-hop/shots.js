// Pictures of round six B's island hop on a staged board, the page's loop
// stopped: your snake folded on a strip of log, an island three cells
// across a hollow, the jump asked for (its landing ring before it goes),
// then a picture at each tick it's in the air and one after it lands.
//   node shots.js <root> <out-prefix>
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3];
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); let s = 7; Math.random = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();` });
    await b.viewport(800, 800);
    await b.go(site.url + '?debug', { settle: 800 });
    await b.eval(`(() => {
      window.__autoRaf = false;
      const E = SnakeEngine, R = SnakeRender, G = E.GRID;
      const g = window.__g = E.createGame({ withPlayer: true, personas: ['gobbler'] });
      g.snakes = g.snakes.slice(0, 2);
      g.time = 60000; g.tick = 500; g.weather.until = 1e12;
      const strip = (x, y) => x >= 1 && x <= 2 && y >= 2 && y <= 21, isle = (x, y) => x >= 6 && x <= 12 && y >= 8 && y <= 14, far = (x, y) => x >= 16 && x <= 22 && y >= 3 && y <= 20;
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if (!strip(x, y) && !isle(x, y) && !far(x, y)) g.holes.add(y * G + x);
      const [me, o] = g.snakes;
      me.body = [];
      for (let y = 11; y <= 21; y++) me.body.push({ x: 2, y });
      for (let y = 21; y >= 9; y--) me.body.push({ x: 1, y });
      me.dir = E.DIRS.right; me.body.unshift({ x: 2, y: 10 }); me.body.pop();
      o.body = [[19, 10], [19, 11], [19, 12], [19, 13]].map(([x, y]) => ({ x, y })); o.dir = E.DIRS.up;
      for (const s of g.snakes) { s.prev = s.body.map(c => ({ ...c })); s.lastAte = g.time; s.nextStarve = g.time + 99999; }
      g.food = [{ x: 10, y: 11, kind: 'food', expires: g.tick + 900 }];
      document.getElementById('overlay').classList.add('hidden');
      R.setViewer(0); R.setGame(g);
      window.__t = performance.now() + 1e6;
      E.leap(g, me);
      for (let i = 0; i < 6; i++) { __t += 33; R.frame(0.3, __t); }
      return 'ok';
    })()`);
    await sleep(150);
    await b.shot(`${out}-0-asked.jpg`, 88);
    for (let n = 1; n <= 5; n++) {
      await b.eval(`(() => {
        const E = SnakeEngine, R = SnakeRender, g = window.__g;
        g.snakes[1].queue = [];
        for (const s of g.snakes) s.prev = s.body.map(c => ({ ...c }));
        E.step(g); R.onTick(g.events);
        for (let i = 0; i < 4; i++) { __t += 30; R.frame(0.25 * (i + 1) * 0.5, __t); }
        return 'ok';
      })()`);
      await sleep(120);
      await b.shot(`${out}-${n}.jpg`, 88);
    }
  } finally { await b.close(); site.close(); }
})();
