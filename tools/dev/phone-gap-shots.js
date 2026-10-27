// Pictures of an upright phone mid-round, the chatter with a few lines and
// the woodpecker perched under the board's left, on
// any copy of the game (for a before and after):
//   node phone-gap-shots.js <root> <out-prefix> <w>x<h>@<dpr> ... [--open]
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3];
const sizes = process.argv.slice(4).filter(a => /^\d/.test(a)), openIt = process.argv.includes('--open');
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); })();` });
    for (const s of sizes) {
      const m = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(s);
      await b.viewport(+m[1], +m[2], { scale: +(m[3] || 3), mobile: true });
      await b.go(site.url + 'index.html?debug', { settle: 800 });
      await b.eval(`document.getElementById('start').click(); 'ok'`);
      await b.eval(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
      await b.eval(`(() => { const log = document.getElementById('chatlog'); for (const t of ['Mind the bark, friend.', 'Out of my way! I’m starving, and the bark is bare!', 'Hm.']) log.insertAdjacentHTML('afterbegin', '<li><strong>Gobbler</strong> <span>' + t + '</span></li>'); dispatchEvent(new Event('resize')); return 'ok'; })()`);
      await sleep(300);
      await b.eval(`(() => { const g = SnakeDebug.game(), R = SnakeRender; g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000); g.woodpecker = null; SnakeDebug.draw(); g.woodpecker = { x: 6, y: 20, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick + 1e6, pecks: 0 }; let now = performance.now(); for (let i = 0; i < 6; i++) R.frame(0.5, now += 16); return 'ok'; })()`);
      if (openIt) { await b.eval(`document.querySelector('.chatter').click(); 'ok'`); await sleep(300); }
      await b.shot(`${out}-${m[1]}x${m[2]}.jpg`, 80);
      const r = await b.eval(`JSON.stringify((() => { const q = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }; return { board: q('#frame') || q('canvas'), ledge: q('#perch-ledge'), foot: q('.board-foot') || q('#help'), chatter: q('.chatter'), vh: innerHeight }; })())`);
      console.log(s, r);
    }
  } finally { await b.close(); site.close(); }
})();
