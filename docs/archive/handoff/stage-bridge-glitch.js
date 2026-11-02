// Staged moments for "show it in the board": a real round, then your snake
// and the log set up for one move, and the loop driven frame by frame
// (requestAnimationFrame held), a shot each tick or so.
//   node stage.js <root> <label> <w>x<h>[@dpr][t] <scene,...> [--query=...]
const path = require('path'), fs = require('fs');
const root = path.resolve(process.argv[2]), label = process.argv[3];
const m = /^(\d+)x(\d+)(?:@([\d.]+))?(t?)$/.exec(process.argv[4]);
const [W, H, DPR, TOUCH] = [+m[1], +m[2], +(m[3] || 1), !!m[4]];
const SCENES = (process.argv[5] || 'jump').split(',');
const QUERY = (process.argv.find(a => a.startsWith('--query=')) || '--query=').slice(8);
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const PRE = `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(function held(ts) { if (window.__autoRaf) cb(ts); else raw(held); }); try { localStorage.clear(); } catch {} })();`;

// Each scene: set-up (page source, run once the round is going and held),
// then a list of steps: ['f', n] n frames; ['shot', name]; ['key', k]; ['js', src].
const clearAround = `g.food = []; for (const o of g.snakes.slice(1)) { o.prev = o.body.map(c => ({ ...c })); }`;
const park = `(() => { const g = SnakeDebug.game(), E = SnakeEngine; g.snakes.slice(1).forEach((o, i) => { const y = [0, 23, 21][i]; o.body = Array.from({ length: 5 }, (_, k) => ({ x: 4 + k, y })); o.dir = E.DIRS.left; o.prev = o.body.map(c => ({ ...c })); o.memory = {}; }); g.food = []; g.fires.clear(); return 'ok'; })()`;
const me = (cells, dir, extra = '') => `(() => { const g = SnakeDebug.game(), E = SnakeEngine, s = g.snakes[0]; s.body = ${JSON.stringify(cells)}; s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS.${dir}; s.queue = []; s.stunUntil = -1; s.leapReadyAt = 0; s.flashReadyAt = 0; s.leaps = 0; s.dashes = 0; s.grow = 0; s.nextStarve = g.time + 60000; s.leapArmed = -1; s.flashArmed = -1; ${extra}; return 'ok'; })()`;
const row = (x, y, n, dx = -1) => Array.from({ length: n }, (_, i) => ({ x: x + dx * i, y }));
const SET = {
  bridge: { set: [park, me(row(12, 12, 9), 'right', 's.flashReadyAt = g.time + 60000; s.leapReadyAt = g.time + 60000'), `(() => { const g = SnakeDebug.game(); for (let y = 10; y <= 14; y++) for (let x = 9; x <= 11; x++) g.holes.add(y * 24 + x); return 'ok'; })()`],
    steps: [['f', 3], ['shot', 'a'], ['f', 4], ['shot', 'b'], ['tickshot', 'c'], ['tickshot', 'd']] },
  // A ditch of holes across your way, five cells on: the ring comes in reach, you press, it goes solid, the jump.
  jump: { set: [park, me(row(5, 12, 7), 'right', 's.flashReadyAt = g.time + 60000'), `(() => { const g = SnakeDebug.game(); for (let y = 9; y <= 15; y++) g.holes.add(y * 24 + 12); return 'ok'; })()`],
    steps: [['tickshot', 'a-far'], ['tickshot', 'b-coming'], ['tickshot', 'c-inreach'], ['key', ' '], ['f', 2], ['shot', 'd-pressed'], ['tickshot', 'e-waiting'], ['tickshot', 'f-waiting2'], ['tickshot', 'g-up'], ['tickshot', 'h-landed'], ['tickshot', 'i-after']] },
  // A rival lying across your way (a jump over a body), flash resting.
  jumpbody: { set: [park, me(row(4, 11, 7), 'right', 's.flashReadyAt = g.time + 60000'), `(() => { const g = SnakeDebug.game(), E = SnakeEngine, o = g.snakes[2]; o.body = Array.from({ length: 16 }, (_, k) => ({ x: 11, y: 19 - k })); o.dir = E.DIRS.down; o.prev = o.body.map(c => ({ ...c })); return 'ok'; })()`],
    steps: [['tickshot', 'a'], ['tickshot', 'b'], ['tickshot', 'c'], ['tickshot', 'd']] },
  // Your plain flash, rested, on open log (until learned: the way, and the key), then up to a body two cells on (the ×).
  flash: { set: [park, me(row(6, 8, 7), 'right', 's.leapReadyAt = g.time + 60000'), `(() => { const g = SnakeDebug.game(), E = SnakeEngine, o = g.snakes[2]; o.body = Array.from({ length: 16 }, (_, k) => ({ x: 13, y: 16 - k })); o.dir = E.DIRS.down; o.prev = o.body.map(c => ({ ...c })); return 'ok'; })()`],
    steps: [['tickshot', 'a-open'], ['tickshot', 'b-open'], ['tickshot', 'c-open'], ['tickshot', 'd-bump'], ['tickshot', 'e-bump']] },
  // Golden flashes held, a rival one thick across your way: the cut line and Snip!, then the cut.
  snip: { set: [park, me(row(5, 10, 8), 'right', 's.dashes = 2; s.leapReadyAt = g.time + 60000'), `(() => { const g = SnakeDebug.game(), E = SnakeEngine, o = g.snakes[1]; o.body = Array.from({ length: 14 }, (_, k) => ({ x: 9, y: 16 - k })); o.dir = E.DIRS.down; o.prev = o.body.map(c => ({ ...c })); return 'ok'; })()`],
    steps: [['tickshot', 'a'], ['tickshot', 'b'], ['key', 'Shift'], ['f', 2], ['shot', 'c-pressed'], ['tickshot', 'c-cut'], ['tickshot', 'd-after'], ['f', 10], ['shot', 'e-after']] },
  // Golden flashes held, heading for the edge: the starburst and Boom!.
  boom: { set: [park, me(row(18, 6, 7), 'right', 's.dashes = 2; s.leapReadyAt = g.time + 60000')],
    steps: [['tickshot', 'a'], ['tickshot', 'b'], ['tickshot', 'c']] },
  // Golden jumps held, a ditch two wide: the Honey ring two past it.
  goldjump: { set: [park, me(row(5, 14, 7), 'right', 's.leaps = 2; s.flashReadyAt = g.time + 60000'), `(() => { const g = SnakeDebug.game(); for (let y = 11; y <= 17; y++) { g.holes.add(y * 24 + 10); g.holes.add(y * 24 + 11); } return 'ok'; })()`],
    steps: [['tickshot', 'a'], ['tickshot', 'b'], ['tickshot', 'c'], ['key', ' '], ['f', 2], ['shot', 'd-pressed'], ['tickshot', 'e'], ['tickshot', 'f-up'], ['tickshot', 'g'], ['tickshot', 'h']] },
  // Asked to jump with nothing in reach: dots along the cells it still waits over.
  window: { set: [park, me(row(5, 16, 7), 'right', 's.flashReadyAt = g.time + 60000')],
    steps: [['key', ' '], ['f', 2], ['shot', 'a-asked'], ['tickshot', 'b'], ['tickshot', 'c'], ['tickshot', 'd'], ['tickshot', 'e-gone']] },
  // The first seconds as they really are: both ready, a rival ahead.
  both: { set: [park, me(row(6, 12, 7), 'right'), `(() => { const g = SnakeDebug.game(), E = SnakeEngine, o = g.snakes[2]; o.body = Array.from({ length: 16 }, (_, k) => ({ x: 13, y: 19 - k })); o.dir = E.DIRS.down; o.prev = o.body.map(c => ({ ...c })); return 'ok'; })()`],
    steps: [['tickshot', 'a'], ['tickshot', 'b'], ['tickshot', 'c'], ['tickshot', 'd']] },
};

(async () => {
  const site = await serve(root), b = await launch();
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });
    await b.viewport(W, H, { scale: DPR, mobile: TOUCH });
    for (const scene of SCENES) {
      const S = SET[scene];
      await b.go(`${site.url}index.html?debug${QUERY ? '&' + QUERY : ''}`, { settle: 900 });
      await b.eval(`SnakeDebug.setup(['sniper', 'mason', 'gobbler']); SnakeDebug.pinQuality(2); document.getElementById('start').click(); 'ok'`);
      await b.eval(`new Promise(r => { const t = setInterval(() => { if (SnakeDebug.state() === 'running') { clearInterval(t); r(); } }, 20); })`);
      await b.eval(`window.__autoRaf = false; 'ok'`);
      await sleep(80);
      await b.eval(`SnakeRender.showYou(false); document.getElementById('steer-hint').classList.remove('on'); SnakeDebug.frames(40); 'ok'`); // (YOU and the steering hint go, as they do once you steer)
      for (const s of S.set) await b.eval(s);
      await b.eval(`(() => { const t = document.getElementById('toast'); t.hidden = true; t.className = 'toast'; return 'ok'; })()`); // (Go!'s banner: gone by now in real time)
      await b.eval(`SnakeDebug.frames(1); 'ok'`);
      const tickMs = await b.eval(`SnakeEngine.tickMs(SnakeDebug.game())`);
      const fpt = Math.max(1, Math.round(tickMs / (1000 / 60)));
      let n = 0;
      for (const [kind, arg] of S.steps) {
        if (kind === 'f') await b.eval(`SnakeDebug.frames(${arg}); 'ok'`);
        else if (kind === 'key') await b.eval(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(arg)}, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { key: ${JSON.stringify(arg)}, bubbles: true })); return 'ok'; })()`);
        else if (kind === 'js') await b.eval(arg);
        if (kind === 'shot' || kind === 'tickshot') {
          if (kind === 'tickshot') await b.eval(`SnakeDebug.frames(4, ${tickMs / 4}); 'ok'`);
          const f = path.join(SHOTS, `${label}-${scene}-${String(++n).padStart(2, '0')}-${arg}.png`);
          const info = await b.eval(`(() => { const g = SnakeDebug.game(), s = g.snakes[0]; return { tick: g.tick, head: s.body[0], len: s.body.length, armed: s.leapArmed, alive: s.alive, toast: document.getElementById('toast').hidden ? '' : document.getElementById('toast').textContent }; })()`);
          await b.shot(f.replace(/\.png$/, '.jpg'), 88);
          const clip = await b.eval(`(() => { const r = document.getElementById('game').getBoundingClientRect(), c = r.width / 24, s = SnakeDebug.game().snakes[0], h = s.body[0], d = s.dir; const cx = h.x + 0.5 + d.x * 4, cy = h.y + 0.5 + d.y * 4; const x = Math.max(r.left, Math.min(r.right - 16 * c, r.left + (cx - 8) * c)), y = Math.max(r.top, Math.min(r.bottom - 10 * c, r.top + (cy - 5) * c)); return { x, y, width: 16 * c, height: 10 * c, scale: 1 }; })()`);
          const cr = await b.send('Page.captureScreenshot', { format: 'png', clip });
          fs.writeFileSync(f.replace(/\.png$/, '-zoom.png'), Buffer.from(cr.data, 'base64'));
          console.log(`${label} ${scene} ${arg}: tick ${info.tick} head ${info.head.x},${info.head.y} len ${info.len} armed ${info.armed} ${info.alive ? '' : 'DEAD'} ${info.toast ? '| banner: ' + info.toast : ''}`);
        }
      }
    }
    if (b.errors.length) console.log('page errors:', b.errors);
  } finally { await b.close(); site.close(); }
})().catch(e => { console.error(e); process.exit(1); });
