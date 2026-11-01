// 2s pictures: the woodpecker's mark with a piece it cuts loose shaded to
// fall, and that piece tipping away at the strike, on a staged board (an
// old hollow down from the top edge and one in from the right, a corner of
// log between them that the mark cuts loose, an apple on it, four snakes):
//   node tools/dev/fall-shots.js <out-prefix> [WxH@dpr]
const path = require('path');
const root = path.join(__dirname, '..', '..'), out = process.argv[2] || 'fall';
const size = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(process.argv.find(a => /^\d+x\d+/.test(a)) || '900x900@2');
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { let s = 7; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const raw = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => window.__autoRaf === false ? 0 : raw(f); })()` });
    await b.viewport(+size[1], +size[2], { scale: +(size[3] || 2) });
    await b.go(site.url + 'index.html?debug', { settle: 800 });
    await b.eval(`(() => {
      window.__autoRaf = false;
      const E = SnakeEngine, R = SnakeRender, N = TUNING.GRID, K = (x, y) => y * N + x;
      window.__t = performance.now() + 1e6;
      window.drawN = (n, alpha = 0.5, step = 33) => { for (let i = 0; i < n; i++) { __t += step; R.frame(alpha, __t); } };
      const g = E.createGame({ withPlayer: true, personas: ['gobbler', 'mason', 'ghost'] });
      g.time = TUNING.SUDDEN_DEATH_MS + 20000; g.tick = 1400; g.weather = { kind: 'sun', since: 0, until: 1e9 };
      const set = (s, cells, dir) => { s.body = cells.map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; };
      set(g.snakes[0], [[12, 9], [11, 9], [10, 9], [9, 9], [8, 9]], 'right');
      set(g.snakes[1], [[6, 15], [6, 16], [6, 17], [6, 18], [6, 19], [6, 20]], 'up');
      set(g.snakes[2], [[14, 18], [13, 18], [12, 18], [11, 18]], 'right');
      set(g.snakes[3], [[3, 4], [3, 3], [3, 2]], 'down');
      for (let y = 0; y <= 5; y++) for (const x of [16, 17]) g.holes.add(K(x, y));       // (an old hollow down from the top...)
      for (let x = 20; x < N; x++) for (const y of [9, 10]) g.holes.add(K(x, y));        // (...and one in from the right)
      const fall = [], patch = [];
      for (let y = 0; y <= 8; y++) for (let x = 18; x < N; x++) if (!(y >= 6 && x <= 19)) fall.push(K(x, y)); // (the corner between them)
      for (let y = 6; y <= 10; y++) for (let x = 16; x <= 19; x++) if (!g.holes.has(K(x, y))) patch.push(K(x, y)); // (the mark that cuts it loose)
      g.food = [{ x: 21, y: 3, kind: 'food' }, { x: 5, y: 10, kind: 'food' }];
      g.woodpecker = { x: 17, y: 8, at: g.time - 9000, target: [...patch, ...fall], fall, strikeAt: g.tick + 5, last: [], struckAt: g.tick - 30, restUntil: g.tick, pecks: 6 };
      window.__g = g; window.__patch = patch; window.__fall = fall;
      document.getElementById('overlay').classList.add('hidden');
      R.setViewer(0); R.setGame(g);
      drawN(30, 0.5);
      return 'ok';
    })()`);
    await sleep(100);
    await b.shot(`${out}-mark.jpg`, 85);
    // The strike: the patch and the piece are holes, the bird's mark gone, and the piece tips away.
    await b.eval(`(() => {
      const g = __g, w = g.woodpecker;
      for (const k of w.target) g.holes.add(k);
      g.food = g.food.filter(f => !__fall.includes(f.y * TUNING.GRID + f.x));
      Object.assign(w, { target: [], last: [...__patch, ...__fall], struckAt: g.tick, restUntil: g.tick + 20 }); delete w.fall;
      g.tick++;
      SnakeRender.onTick([{ type: 'peck', x: w.x, y: w.y, cells: [...__patch, ...__fall], under: [], fall: __fall }]);
      drawN(9, 0.5, 33);
      return 'ok';
    })()`);
    await sleep(100);
    await b.shot(`${out}-falling.jpg`, 85);
  } finally { await b.close(); site.close(); }
})();
