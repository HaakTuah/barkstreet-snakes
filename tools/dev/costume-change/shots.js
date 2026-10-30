// Pictures of a costume change (2t): Capricious changing mood, or Copycat
// taking on a new model, shot at each of the times given (ms after the
// change; 0: just before it), the page's loop stopped, cropped round the
// head. One picture a time, <prefix>-<ms>.jpg; tools/dev/montage.js lays
// them out.
//   node shots.js <root> <prefix> capricious|copycat <from> <to> <w>x<h>[@dpr] [reduced] [ms,ms,...]
// (from, to: a mood, or for Copycat its model's persona; '-' for none:
// Capricious undecided, Copycat copying no one)
const path = require('path');
const [rootArg, prefix, who, fromArg, toArg, size, mode, times] = process.argv.slice(2);
const root = path.resolve(rootArg), m = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(size || '800x800');
const reduced = mode === 'reduced', at = (times || '0,80,160,240,320,420,560').split(',').map(Number);
const from = fromArg === '-' ? null : fromArg, to = toArg === '-' ? null : toArg;
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
      const E = SnakeEngine, R = SnakeRender, who = ${JSON.stringify(who)}, from = ${JSON.stringify(from)};
      const set = (s, cells, dir) => { s.body = cells.map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; s.queue = []; s.planned = null; };
      const others = ['mason', 'ghost', 'sniper', 'gobbler', 'joker', 'star', 'vulture', 'sovereign'].filter(k => k !== ${JSON.stringify(to)} && k !== from).slice(0, 1);
      const models = who === 'copycat' ? [${JSON.stringify(from)}, ${JSON.stringify(to)}].filter(Boolean) : [];
      const g = E.createGame({ withPlayer: false, personas: [who, ...models, ...others].slice(0, 4) });
      g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.weather.kind = 'clear'; g.weather.since = 0;
      const s = g.snakes[0];
      g.snakes.forEach((o, i) => { if (i) set(o, [[3, 18 + i], [2, 18 + i], [1, 18 + i]], 'right'); o.lastAte = g.time; });
      set(s, Array.from({ length: 5 }, (_, i) => [8 - i, 6]), 'right'); s.lastAte = g.time;
      const byKey = k => g.snakes.find(o => o.personaKey === k);
      const wear = k => { if (who === 'capricious') { s.memory.mood = k; s.memory.moodChangedAt = g.time; } else s.memory.modelId = k ? byKey(k).id : null; };
      wear(from);
      document.getElementById('overlay').classList.add('hidden');
      R.setViewer(-1); R.setGame(g);
      window.__t = performance.now() + 1e6; window.__draw = ms => { const n = Math.max(1, Math.round(ms / 20)); for (let i = 0; i < n; i++) { __t += ms / n; R.frame(1, __t); } };
      __draw(800);
      window.__wear = () => wear(${JSON.stringify(to)});
      const cv = document.querySelector('canvas').getBoundingClientRect(), cell = cv.width / TUNING.GRID;
      return { x: cv.left + 6.6 * cell, y: cv.top + 4.6 * cell, w: 3.4 * cell, h: 2.8 * cell };
    })()`);
    let t = 0;
    for (const ms of at) {
      if (ms > 0 && t === 0) await b.eval(`__wear(), __draw(1), 'ok'`); // (the change, then on to ms)
      if (ms > t) await b.eval(`__draw(${ms - Math.max(t, 1)}), 'ok'`);
      t = ms;
      await sleep(80);
      const raw = `${prefix}-${ms}-full.jpg`;
      await b.shot(raw, 92);
      require('child_process').execFileSync('node', [path.join(root, 'tools/dev/crop.js'), raw, `${prefix}-${ms}.jpg`, ...[box.x, box.y, box.w, box.h].map(v => String(Math.round(v * dpr)))], { stdio: 'ignore' });
    }
  } finally { await b.close(); site.close(); }
})();
