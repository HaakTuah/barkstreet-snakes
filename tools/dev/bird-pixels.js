// The woodpecker's layer, hashed frame by frame through four staged strikes
// (its aim, the flight out, the drum, the flight home and its rest) at a phone
// upright, a phone on its side and a desktop, with the clock, the dice and the
// quality held still: run it on two copies of the game to prove a change to the
// bird's code draws it pixel for pixel the same (the bird.js split, say).
//   node tools/dev/bird-pixels.js <root>
const path = require('path');
const root = path.resolve(process.argv[2]);
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch(); const out = [];
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = false; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); let s = 7; Math.random = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; try { localStorage.clear(); } catch (e) {} })();` });
    for (const [w, h, dpr, mob] of [[390, 844, 3, true], [780, 320, 2, true], [1280, 800, 2, false]]) {
      await b.viewport(w, h, { scale: dpr, mobile: mob });
      await b.go(site.url + 'index.html?debug', { settle: 800 });
      await b.eval(`SnakeDebug.setup(['mason','drab','ghost']); document.getElementById('watch').click(); 'ok'`);
      await sleep(500);
      const r = await b.eval(`(() => {
        window.__autoRaf = false; SnakeDebug.pinQuality(2); SnakeDebug.frames(80);
        const g = SnakeDebug.game(), R = SnakeRender, L = document.getElementById('bird-layer'), hs = [];
        const hash = () => { const d = L.getContext('2d').getImageData(0, 0, L.width, L.height).data; let a = 2166136261 >>> 0; for (let i = 0; i < d.length; i += 3) a = Math.imul(a ^ d[i], 16777619) >>> 0; return L.width + 'x' + L.height + ':' + a.toString(16); };
        let now = 5e6;
        for (const [cx, cy] of [[12, 18], [1, 1], [22, 12], [3, 22]]) {
          const cell = cy * 24 + cx, t0 = g.tick, S = t0 + 40;
          g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000); g.woodpecker = null; SnakeDebug.draw();
          g.woodpecker = { x: cx, y: cy, at: g.time, target: [cell], strikeAt: S, last: [], struckAt: -1, restUntil: t0, pecks: 0 };
          for (let t = t0; t < S; t++) { g.tick = t; for (const u of [0, 0.5]) { R.frame(u, now += 16); hs.push(hash()); } }
          Object.assign(g.woodpecker, { target: [], last: [cell], struckAt: S, strikeAt: S, restUntil: S + TUNING.PECK_REST_MIN, pecks: 1 });
          for (let t = S; t < S + 40; t++) { g.tick = t; for (const u of [0, 0.5]) { R.frame(u, now += 16); hs.push(hash()); } }
        }
        return hs;
      })()`);
      out.push(`${w}x${h}: ${r.length} frames, ${new Set(r).size} distinct, digest ${require('crypto').createHash('md5').update(r.join(',')).digest('hex')}`);
    }
  } finally { await b.close(); site.close(); }
  console.log(out.join('\n'));
})();
