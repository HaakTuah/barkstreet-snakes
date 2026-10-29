// Pictures of Wildcard's hair: four Wildcards heading right, left, up and
// down on a staged board, the same on any copy of the game (for a before and
// after), the page's loop stopped, cropped round the four heads.
//   node shots.js <root> <out.jpg> [<w>x<h>[@dpr]] [reduced|still] [weather]
// (weather: clear by default; snow for a light board, storm for a dark one;
// WILD_HAIR=<version> picks one of the versions on offer, where there are some)
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3];
const m = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(process.argv[4] || '800x800');
const reduced = process.argv[5] === 'reduced', kind = process.argv[6] || 'clear';
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
      ${process.env.WILD_HAIR ? `wildHairPick = ${JSON.stringify(process.env.WILD_HAIR)};` : ''}
      const E = SnakeEngine, R = SnakeRender;
      const set = (s, cells, dir) => { s.body = cells.map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; s.queue = []; s.planned = null; };
      const g = E.createGame({ withPlayer: false, personas: ['wildcard', 'wildcard', 'wildcard', 'wildcard'] });
      g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.weather.kind = ${JSON.stringify(kind)}; g.weather.since = 0;
      const run = (x, y, dx, dy) => Array.from({ length: 4 }, (_, j) => [x - dx * j, y - dy * j]);
      const plan = [[run(4, 4, 1, 0), 'right'], [run(6, 4, -1, 0), 'left'], [run(10, 3, 0, -1), 'up'], [run(12, 6, 0, 1), 'down']];
      g.snakes.forEach((s, i) => { s.personaKey = 'wildcard'; set(s, plan[i][0], plan[i][1]); s.lastAte = g.time; });
      document.getElementById('overlay').classList.add('hidden');
      R.setViewer(-1); R.setGame(g);
      let t = performance.now() + 1e6; for (let i = 0; i < 8; i++) { t += 33; R.frame(1, t); }
      const cv = document.querySelector('canvas').getBoundingClientRect(), cell = cv.width / TUNING.GRID;
      return { x: cv.left + 2.6 * cell, y: cv.top + 2.2 * cell, w: 10.8 * cell, h: 5.6 * cell, cell };
    })()`);
    await sleep(150);
    const raw = out.replace(/\.jpg$/, '-full.jpg');
    await b.shot(raw, 92);
    console.log(JSON.stringify(box), dpr);
    require('child_process').execFileSync('node', [path.join(root, 'tools/dev/crop.js'), raw, out, ...[box.x, Math.max(0, box.y), box.w, box.h].map(v => String(Math.round(v * dpr)))], { stdio: 'inherit' });
  } finally { await b.close(); site.close(); }
})();
