// Pictures of rainbows on a staged board, the same on any copy of the game
// (for a before and after), the page's loop stopped: one picture per apple,
// each rainbow grown and glowing, a golden apple where it came from.
//   node shots.js <root> <out-prefix> [x,y ...]   (default: 11,6 11,18 3,19 20,3)
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3];
const apples = (process.argv.length > 4 ? process.argv.slice(4) : ['11,6', '11,18', '3,19', '20,3']).map(a => a.split(',').map(Number));
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); let s = 7; Math.random = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();` });
    await b.viewport(800, 800);
    await b.go(site.url + '?debug', { settle: 800 });
    for (const [x, y] of apples) {
      await b.eval(`(() => {
        window.__autoRaf = false;
        const E = SnakeEngine, R = SnakeRender;
        const g = window.__g || (window.__g = E.createGame({ withPlayer: true, personas: ['gobbler', 'ghost', 'mason'] }));
        g.time = 60000; g.tick = 500; g.weather.until = 1e12;
        g.snakes.forEach((s, i) => { s.body = [[2 + 4 * i, 23], [1 + 4 * i, 23], [4 * i, 23]].map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS.right; s.lastAte = g.time; });
        g.food = [{ x: ${x}, y: ${y}, kind: 'golden', expires: g.tick + 900 }];
        document.getElementById('overlay').classList.add('hidden');
        R.setViewer(0); R.setGame(g);
        window.__t = (window.__t || performance.now() + 1e6) + 20000;
        for (let i = 0; i < 5; i++) { __t += 33; R.frame(0.5, __t); }
        R.onTick([{ type: 'rainbow', x: ${x}, y: ${y} }]);
        for (let i = 0; i < 80; i++) { __t += 33; R.frame(0.5, __t); }
        return 'ok';
      })()`);
      await sleep(150);
      await b.shot(`${out}-${x}-${y}.jpg`, 88);
    }
  } finally { await b.close(); site.close(); }
})();
