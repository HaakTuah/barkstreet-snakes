// A burrow growing shut, staged as tools/render-test.js stages it (a board
// drawn by hand, its loop held): open, a third, two thirds and 0.95 of its
// shut time, just after its 'heal' and 1.5 s on (its scar). Each frame a
// crop of 3 by 3 cells round it, and all six in a strip.
//   node frames.js <root> <out-dir> <label> <w>x<h>[@dpr][t] [--calm] [--cell=x,y]
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const [rootArg, outArg, label, size] = process.argv.slice(2), CALM = process.argv.includes('--calm');
const [CX, CY] = (process.argv.find(a => a.startsWith('--cell=')) || '--cell=7,9').slice(7).split(',').map(Number);
const root = path.resolve(rootArg), out = path.resolve(outArg);
const m = /^(\d+)x(\d+)(?:@([\d.]+))?(t?)$/.exec(size);
const { launch, serve } = require(path.join(root, 'tools', 'browser.js'));
fs.mkdirSync(out, { recursive: true });
const PRE = `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(function held(ts) { if (window.__autoRaf) cb(ts); else raw(held); }); let seed = 7; Math.random = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; try { localStorage.clear(); } catch {} })();`;
(async () => {
  const site = await serve(root), b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });
    await b.viewport(+m[1], +m[2], { scale: +(m[3] || 1), mobile: !!m[4] });
    await b.go(`${site.url}index.html?debug`, { settle: 900 });
    await b.eval(`(() => {
      window.CX = ${CX}; window.CY = ${CY}; window.__autoRaf = false; window.E = SnakeEngine; window.R = SnakeRender; SnakeDebug.pinQuality(2);
      window.__t = performance.now() + 1e6;
      window.drawN = (n, step = 33) => { for (let i = 0; i < n; i++) { __t += step; R.frame(0.5, __t); } };
      const g = window.G = E.createGame({ withPlayer: true, personas: ['mason', 'ghost', 'drab'] });
      g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12;
      g.snakes.forEach((s, i) => { s.body = [[2 + 4 * i, 23], [1 + 4 * i, 23], [4 * i, 23]].map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS.right; s.queue = []; });
      document.getElementById('overlay').classList.add('hidden'); R.setViewer(99); R.setGame(g);
      ${CALM ? 'R.setReducedMotion(true);' : ''}
      window.H = { x: CX, y: CY, at: g.tick - 400, used: 0 }; g.burrows = [H]; g.tick++; R.onTick([]); drawN(25, 40);
      return 'ok';
    })()`);
    const clip = await b.eval(`(() => { const r = document.getElementById('game').getBoundingClientRect(), c = r.width / TUNING.GRID, CX = ${CX}, CY = ${CY}; return { x: r.left + (CX - 1) * c, y: r.top + (CY - 1) * c, width: 3 * c, height: 3 * c, scale: 1 }; })()`);
    const shots = [];
    const shot = async name => { const f = path.join(out, `${label}-${String(shots.length + 1).padStart(2, '0')}-${name}.png`); const r = await b.send('Page.captureScreenshot', { format: 'png', clip }); fs.writeFileSync(f, Buffer.from(r.data, 'base64')); shots.push([name, f]); };
    await shot('open');
    for (const [name, done] of [['third', 1 / 3], ['two-thirds', 2 / 3], ['nearly', 0.95]]) {
      await b.eval(`(() => { H.shutFrom = G.time - 10000 * ${done}; H.shutAt = H.shutFrom + 10000; G.tick++; R.onTick([]); drawN(3); return 'ok'; })()`);
      await shot(name);
    }
    await b.eval(`(() => { G.burrows = []; G.tick++; R.onTick([{ type: 'heal', x: ${CX}, y: ${CY} }]); drawN(3); return 'ok'; })()`);
    await shot('heal');
    await b.eval(`(() => { drawN(45); return 'ok'; })()`);
    await shot('scar');
    execFileSync('node', [path.join(root, 'tools', 'dev', 'montage.js'), path.join(out, `${label}-strip.jpg`), '240', ...shots.map(([n, f]) => `${n}=${f}`)], { stdio: 'inherit' });
  } finally { await b.close(); site.close?.(); }
})().catch(e => { console.error(e); process.exit(1); });
