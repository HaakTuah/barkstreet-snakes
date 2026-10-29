// Pictures of the woodpecker perched under the board on a phone held
// upright (2k+, "The woodpecker perches clear of the buttons' words"), on
// any copy of the game, for a before and after: resting at rest for each
// spot along the bottom row (x across, y 22), one picture each, and which
// of the row's words its box covers (the speed buttons', the switches',
// the captions):
//   node shots.js <root> <out-prefix> <w>x<h>@<dpr>[m] ...   (m: a phone)
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3], sizes = process.argv.slice(4);
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); try { localStorage.clear(); } catch (e) {} })();` });
    for (const s of sizes) {
      const m = /^(\d+)x(\d+)(?:@([\d.]+))?(m?)$/.exec(s);
      await b.viewport(+m[1], +m[2], { scale: +(m[3] || 2), mobile: !!m[4] });
      await b.go(site.url + 'index.html?debug', { settle: 800 });
      await b.eval(`document.getElementById('watch')?.click(); 'ok'`);
      await b.eval(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
      await sleep(300);
      for (const x of [1, 6, 12, 17, 22]) {
        const on = await b.eval(`(() => { const g = SnakeDebug.game(); g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000); g.woodpecker = null; SnakeDebug.draw();
          g.woodpecker = { x: ${x}, y: 22, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick + 1e6, pecks: 0 };
          let now = performance.now(); for (let i = 0; i < 6; i++) SnakeRender.frame(0.5, now += 16);
          const P = SnakeRender.birdPose(), sc = boardRect.w / SIZE, f = P.flip > 0, s = P.s * BU * sc;
          const bx0 = boardRect.x + P.x * sc + (f ? BIRD_BOX[0] : -BIRD_BOX[2]) * s, bx1 = boardRect.x + P.x * sc + (f ? BIRD_BOX[2] : -BIRD_BOX[0]) * s;
          const by0 = boardRect.y + P.y * sc + BIRD_BOX[1] * s, by1 = boardRect.y + P.y * sc + BIRD_BOX[3] * s;
          return [...document.querySelectorAll('.foot .speed > span, .foot button, #chatter-label')].filter(e => { const rg = document.createRange(); rg.selectNodeContents(e); const r = rg.getBoundingClientRect(); return r.width && r.left < bx1 && r.right > bx0 && r.top < by1 && r.bottom > by0; }).map(e => e.textContent.trim()).join(' ') || '-'; })()`);
        await b.shot(`${out}-${m[1]}x${m[2]}-x${x}.jpg`, 82);
        console.log(s, `spot ${x},22: its box over ${on}`);
      }
    }
  } finally { await b.close(); site.close(); }
})();
