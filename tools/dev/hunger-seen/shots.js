// Pictures of hunger on the body: four snakes on a staged board, the same
// on any copy of the game (for a before and after), the page's loop stopped:
// you just fed, Sniper half way through its meal, Gobbler with 2 s left
// (the warning), Mason starving.
//   node shots.js <root> <out-prefix> [<w>x<h>[@dpr]]
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3];
const m = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(process.argv[4] || '800x800');
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); let s = 7; Math.random = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();` });
    await b.viewport(+m[1], +m[2], { scale: +(m[3] || 1), mobile: !!m[3] });
    await b.go(site.url + '?debug', { settle: 800 });
    for (const [k, t] of [['a', 0], ['b', 170]]) {
      await b.eval(`(() => {
        window.__autoRaf = false;
        const E = SnakeEngine, R = SnakeRender;
        const set = (s, cells, dir) => { s.body = cells.map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; s.queue = []; s.planned = null; };
        const g = window.__g || (window.__g = E.createGame({ withPlayer: true, personas: ['sniper', 'gobbler', 'mason'] }));
        g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12;
        const left = [20000, 6000, 2000, -2000];
        g.snakes.forEach((s, i) => { set(s, Array.from({ length: 9 }, (_, j) => [15 - j, 6 + 4 * i]), 'right'); s.mealMs = i ? 12000 : 20000; s.lastAte = g.time - TUNING.HUNGER_MS + left[i]; });
        document.getElementById('overlay').classList.add('hidden');
        R.setViewer(0); R.setGame(g);
        let t = performance.now() + 1e6 + ${t}; for (let i = 0; i < 8; i++) { t += 33; R.frame(1, t); }
        return 'ok';
      })()`);
      await sleep(150);
      await b.shot(`${out}-${k}.jpg`, 90);
    }
  } finally { await b.close(); site.close(); }
})();
