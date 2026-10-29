// Pictures of round six B's bridges on a staged board, the page's loop
// stopped: Gobbler lying across a pit, your snake crawling onto its back,
// along it, and off onto bark at the rim (a picture a tick).
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
      for (let x = 9; x <= 13; x++) for (let y = 10; y <= 13; y++) g.holes.add(y * G + x);
      const [me, o] = g.snakes;
      me.body = Array.from({ length: 8 }, (_, i) => ({ x: 11, y: 8 - i })); me.dir = E.DIRS.down;
      o.body = Array.from({ length: 14 }, (_, i) => ({ x: 17 - i, y: 10 })); o.dir = E.DIRS.right; o.persona = null; o.isPlayer = true; o.queue = [];
      for (const s of g.snakes) { s.prev = s.body.map(c => ({ ...c })); s.lastAte = g.time; s.nextStarve = g.time + 99999; }
      g.food = [];
      document.getElementById('overlay').classList.add('hidden');
      R.setViewer(0); R.setGame(g);
      window.__t = performance.now() + 1e6;
      for (let i = 0; i < 6; i++) { __t += 33; R.frame(0.3, __t); }
      return 'ok';
    })()`);
    const turns = [null, null, 'right', 'right', 'up'];
    for (let n = 0; n < turns.length; n++) {
      await b.eval(`(() => {
        const E = SnakeEngine, R = SnakeRender, g = window.__g, me = g.snakes[0];
        ${turns[n] ? `me.queue = [E.DIRS.${turns[n]}];` : ''}
        g.snakes[1].queue = [];
        for (const s of g.snakes) s.prev = s.body.map(c => ({ ...c }));
        E.step(g); R.onTick(g.events);
        for (let i = 0; i < 4; i++) { __t += 30; R.frame(0.25 * (i + 1) * 0.5, __t); }
        return 'ok';
      })()`);
      await sleep(120);
      await b.shot(`${out}-${n + 1}.jpg`, 88);
    }
  } finally { await b.close(); site.close(); }
})();
