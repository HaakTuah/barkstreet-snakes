// Pictures of round six B part 4's golden flight on a staged board, the
// page's loop stopped: your snake holding a golden jump beside a hollow,
// the jump asked for (its landing ring before it goes), then a picture at
// each tick in the air (held past the plain hop, a turn in the air) and one
// after it comes down where the jump was let go.
//   node shots.js <root> <out-prefix>
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3];
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); })()` });
    await b.viewport(800, 800);
    await b.go(site.url + '?debug', { settle: 800 });
    await b.eval(`(() => {
      window.__autoRaf = false;
      const E = SnakeEngine, R = SnakeRender, G = E.GRID;
      const g = window.__g = E.createGame({ withPlayer: true, personas: ['gobbler'] });
      g.snakes = g.snakes.slice(0, 2);
      g.time = 60000; g.tick = 500; g.weather.until = 1e12;
      for (let y = 9; y <= 13; y++) for (let x = 7; x <= 9; x++) g.holes.add(y * G + x);
      const [me, o] = g.snakes;
      me.body = Array.from({ length: 9 }, (_, i) => ({ x: 6 - i, y: 10 })); me.dir = E.DIRS.right; me.leaps = 2;
      o.body = [[13, 12], [14, 12], [15, 12], [16, 12], [16, 13]].map(([x, y]) => ({ x, y })); o.dir = E.DIRS.left;
      for (const s of g.snakes) { s.prev = s.body.map(c => ({ ...c })); s.lastAte = g.time; s.nextStarve = g.time + 99999; }
      g.food = [{ x: 12, y: 7, kind: 'food', expires: g.tick + 900 }];
      document.getElementById('overlay').classList.add('hidden');
      R.setViewer(0); R.setGame(g);
      window.__t = performance.now() + 1e6;
      E.leap(g, me);
      for (let i = 0; i < 6; i++) { __t += 33; R.frame(0.3, __t); }
      return 'ok';
    })()`);
    await sleep(150);
    await b.shot(`${out}-0-asked.jpg`, 88);
    for (let n = 1; n <= 7; n++) {
      const r = await b.eval(`(() => {
        const E = SnakeEngine, R = SnakeRender, g = window.__g, me = g.snakes[0];
        g.snakes[1].queue = [];
        if (me.flight && me.flight.flown === 3) me.queue = [E.DIRS.up]; // (steered up over the far rim)
        if (me.flight && me.flight.flown === 4) E.letGo(g, me);         // (let go: down on the next cell)
        for (const s of g.snakes) s.prev = s.body.map(c => ({ ...c }));
        E.step(g); R.onTick(g.events);
        for (let i = 0; i < 4; i++) { __t += 30; R.frame(0.25 * (i + 1) * 0.5, __t); }
        return JSON.stringify({ head: me.body[0], flown: me.flight?.flown, dir: me.dir, alive: me.alive, landing: !!me.landing });
      })()`);
      console.log(n, r);
      await sleep(120);
      await b.shot(`${out}-${n}.jpg`, 88);
    }
  } finally { await b.close(); site.close(); }
})();
