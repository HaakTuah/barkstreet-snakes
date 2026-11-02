// Pictures of a squashed bead's splat (2o): Joker goes over its own bead,
// and the splat it leaves is shot ms after the squash (0: the bead before),
// the page's loop stopped, cropped round the cell.
//   node shots.js <root> <out.jpg> <ms> [<w>x<h>[@dpr]] [reduced]
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3], ms = +process.argv[4];
const m = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(process.argv[5] || '800x800');
const reduced = process.argv[6] === 'reduced';
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); let s = 7; Math.random = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();` });
    if (reduced) await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const dpr = +(m[3] || 1);
    await b.viewport(+m[1], +m[2], { scale: dpr, mobile: !!m[3] && dpr >= 3 });
    await b.go(site.url + '?debug', { settle: 800 });
    const box = await b.eval(`(() => {
      window.__autoRaf = false;
      const E = SnakeEngine, R = SnakeRender;
      const set = (s, cells, dir) => { s.body = cells.map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; s.queue = []; s.planned = null; };
      const g = E.createGame({ withPlayer: false, personas: ['joker', 'mason', 'gobbler', 'ghost'] });
      g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.weather.kind = 'clear'; g.weather.since = 0;
      const [jo, ...rest] = g.snakes;
      rest.forEach((s, i) => set(s, [[2, 20 + i], [1, 20 + i], [0, 20 + i]], 'right'));
      const row = x0 => Array.from({ length: 6 }, (_, i) => [x0 - i, 6]);
      set(jo, row(7), 'right');
      const bead = { x: 8, y: 6, kind: 'pellet', color: '#a21caf', owner: jo.id, expires: g.tick + 900 };
      g.food.push(bead);
      document.getElementById('overlay').classList.add('hidden');
      R.setViewer(-1); R.setGame(g);
      let t = performance.now() + 1e6; const draw = (n, step) => { for (let i = 0; i < n; i++) { t += step; R.frame(1, t); } };
      draw(20, 33);
      if (${ms} > 0) {
        g.tick++; set(jo, row(8), 'right'); g.food.splice(g.food.indexOf(bead), 1);
        R.onTick([{ type: 'squash', snake: jo, x: 8, y: 6 }]);
        g.tick++; set(jo, row(14).map(([x]) => [x, 9]), 'right'); // (gone on, so the splat shows)
        draw(Math.ceil(${ms} / 20), 20);
      }
      const cv = document.querySelector('canvas').getBoundingClientRect(), cell = cv.width / TUNING.GRID;
      return { x: cv.left + 6.5 * cell, y: cv.top + 5 * cell, w: 3 * cell, h: 2.2 * cell };
    })()`);
    await sleep(150);
    const raw = out.replace(/\.jpg$/, '-full.jpg');
    await b.shot(raw, 92);
    require('child_process').execFileSync('node', [path.join(root, 'tools/dev/crop.js'), raw, out, ...[box.x, Math.max(0, box.y), box.w, box.h].map(v => String(Math.round(v * dpr)))], { stdio: 'inherit' });
  } finally { await b.close(); site.close(); }
})();
