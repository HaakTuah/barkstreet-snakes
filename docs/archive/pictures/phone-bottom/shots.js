// Pictures of an upright phone's bottom mid-round (1b++, "The phone's
// bottom"), on any copy of the game, for a before and after: playing and
// watching, the chatter as the page leaves it at the start (or opened or
// shrunk with --open / --shrunk), the woodpecker perched under the board
// at the column x (cells, 6 by default), and what each part's box is:
//   node shots.js <root> <out-prefix> <w>x<h>@<dpr> ... [--open|--shrunk] [--x N]
const path = require('path');
const root = path.resolve(process.argv[2]), out = process.argv[3], argv = process.argv.slice(4);
const sizes = argv.filter(a => /^\d+x/.test(a)), want = argv.includes('--open') ? 'true' : argv.includes('--shrunk') ? 'false' : '';
const bx = argv.includes('--x') ? +argv[argv.indexOf('--x') + 1] : 6;
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
(async () => {
  const site = await serve(root); const b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); try { localStorage.clear(); } catch (e) {} })();` });
    for (const s of sizes) {
      const m = /^(\d+)x(\d+)(?:@([\d.]+))?$/.exec(s);
      await b.viewport(+m[1], +m[2], { scale: +(m[3] || 3), mobile: true });
      for (const watching of [false, true]) {
        await b.go(site.url + 'index.html?debug', { settle: 800 });
        await b.eval(`document.getElementById(${watching ? "'watch'" : "'start'"})?.click(); 'ok'`);
        if (watching) await b.eval(`(() => { const g = SnakeDebug.game(); if (!document.getElementById('watch')) { g.snakes[0].alive = false; } return 'ok'; })()`);
        await b.eval(`SnakeDebug.frames(80); window.__autoRaf = false; 'ok'`);
        await b.eval(`(() => { const log = document.getElementById('chatlog'); for (const t of ['Mind the bark, friend.', 'Out of my way! I’m starving, and the bark is bare!', 'Hm.', 'That bird’s peckin’ up my colony!']) log.insertAdjacentHTML('afterbegin', '<li><strong>Gobbler</strong> <span>' + t + '</span></li>'); dispatchEvent(new Event('resize')); return 'ok'; })()`);
        await sleep(300);
        const exp = await b.eval(`document.querySelector('.chatter').getAttribute('aria-expanded')`);
        if (want && exp !== want) { await b.eval(`document.querySelector('.chatter .chatlog').click(); 'ok'`); await sleep(300); }
        await b.eval(`(() => { const g = SnakeDebug.game(), R = SnakeRender; g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000); g.woodpecker = null; SnakeDebug.draw(); g.woodpecker = { x: ${bx}, y: 20, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick + 1e6, pecks: 0 }; let now = performance.now(); for (let i = 0; i < 6; i++) R.frame(0.5, now += 16); return 'ok'; })()`);
        const name = `${out}-${watching ? 'watching' : 'playing'}-${m[1]}x${m[2]}.jpg`;
        await b.shot(name, 80);
        const r = await b.eval(`JSON.stringify((() => { const q = s => { const e = document.querySelector(s); if (!e || !e.getBoundingClientRect().height) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }; return { board: q('#game'), foot: q('.foot'), speed: q('#speed'), toggle: q('#chatter-toggle'), chatter: q('.chatter'), log: q('#chatlog'), open: document.querySelector('.chatter').getAttribute('aria-expanded'), lines: [...document.querySelectorAll('#chatlog li')].filter(l => l.getBoundingClientRect().height && !l.classList.contains('gone')).length, bird: Math.round(SnakeRender.birdPose().s * 100) / 100, vh: innerHeight }; })())`);
        console.log(path.basename(name), r);
      }
    }
  } finally { await b.close(); site.close(); }
})();
