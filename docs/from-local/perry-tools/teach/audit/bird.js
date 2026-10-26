// The woodpecker's size on a screen, at rest, eyeing its chunk, flying to
// it and drumming it, for a few spots: its ink measured on its own layer
// (alpha >= 160: its shadow, at 0.28, left out; on round six A's branch the
// chips are left out by measuring the drum with reduced motion, which keeps
// its drum pose), in CSS px, in cells and against the board; on the branch
// that has it, its pose's own scale and eye too. Crops of each state.
//   node bird.js <root> <label>
const path = require('path'), fs = require('fs');
const root = path.resolve(process.argv[2]), label = process.argv[3];
const { launch, serve, sleep } = require(path.join(root, 'tools', 'browser.js'));
const OUT = path.join(__dirname, 'out'), SHOTS = path.join(__dirname, 'bird-shots');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
const SCREENS = [['p390x844', 390, 844, 3, true], ['p360x640', 360, 640, 3, true], ['p375x667', 375, 667, 2, true], ['p412x915', 412, 915, 2.625, true], ['l844x390', 844, 390, 3, true], ['d1920x945', 1920, 945, 1, false], ['d1366x657', 1366, 657, 1, false]];
const SPOTS = [[12, 21], [2, 12], [21, 3], [12, 12]];
const PRE = `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(function held(ts) { if (window.__autoRaf) cb(ts); else raw(held); }); try { localStorage.clear(); } catch {} })();`;

// One state for a spot: sets the woodpecker so, draws a frame, measures its ink.
const MEASURE = (x, y, state) => `(() => {
  const g = SnakeDebug.game(), R = SnakeRender, E = SnakeEngine, cell = ${y} * 24 + ${x};
  const p2 = typeof R.birdPose === 'function';
  g.time = Math.max(g.time, TUNING.SUDDEN_DEATH_MS + 1000);
  const ms = E.tickMs(g);
  let now = performance.now() + 5000;
  R.setReducedMotion(false);
  g.woodpecker = null; R.frame(0.5, now += 16);
  const rest = { x: ${x}, y: ${y}, at: g.time, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: g.tick + 1e6, pecks: 0 };
  const aim = K => ({ x: ${x}, y: ${y}, at: g.time, target: [cell], strikeAt: g.tick - 1 + K, last: [cell], struckAt: g.tick - 60, restUntil: g.tick, pecks: 1 });
  let alpha = 0.5;
  if ('${state}' === 'rest') { g.woodpecker = rest; R.frame(alpha, now += 16); R.frame(alpha, now += 16); }
  else if (p2) {
    g.woodpecker = aim(30); R.frame(0.5, now += 16);
    const plan = R.birdPlan();
    const m = '${state}' === 'eye' ? plan.depart + 120 : '${state}' === 'fly' ? (plan.drum + plan.settle + plan.depart) / 2 : plan.drum / 2;
    if ('${state}' === 'drum') R.setReducedMotion(true); // (no chips: its drum pose is the same)
    const K = Math.ceil(m / ms); alpha = K - m / ms;
    g.woodpecker = aim(K); R.frame(alpha, now += 16);
  } else {
    // (main: flying while 1 < strikeAt - tp < 3.5, drumming after)
    const K = '${state}' === 'eye' ? 12 : '${state}' === 'fly' ? 2 : 0; alpha = 0.75;
    g.woodpecker = aim(K + 0); g.woodpecker.strikeAt = g.tick + K; R.frame(alpha, now += 16);
  }
  const L = document.getElementById('bird-layer'), lb = L.getBoundingClientRect(), sx = L.width / lb.width, sy = L.height / lb.height;
  const data = L.getContext('2d').getImageData(0, 0, L.width, L.height).data;
  const b = document.getElementById('game').getBoundingClientRect(), cellCss = b.width / 24;
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, over = 0, ink = 0;
  for (let j = 0; j < L.height; j++) for (let i = 0; i < L.width; i++) {
    if (data[(j * L.width + i) * 4 + 3] < 160) continue;
    ink++;
    if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j;
    const cx = lb.left + i / sx, cy = lb.top + j / sy;
    if (cx >= b.left && cx < b.right && cy >= b.top && cy < b.bottom) over++;
  }
  const r1 = v => Math.round(v * 10) / 10;
  const box = x1 < 0 ? null : { x: r1(lb.left + x0 / sx), y: r1(lb.top + y0 / sy), w: r1((x1 - x0 + 1) / sx), h: r1((y1 - y0 + 1) / sy) };
  const pose = p2 ? R.birdPose() : null;
  R.setReducedMotion(matchMedia('(prefers-reduced-motion: reduce)').matches);
  return { state: '${state}', spot: [${x}, ${y}], box, inkCssPx2: r1(ink / sx / sy), overBoardCssPx2: r1(over / sx / sy), board: { x: r1(b.left), y: r1(b.top), w: r1(b.width) }, cellCss: r1(cellCss), vw: innerWidth, vh: innerHeight,
    pose: pose && { phase: pose.phase, s: Math.round(pose.s * 1000) / 1000, eyeCssPx: r1(2 * pose.eye[2] / (L.width / lb.width)) } };
})()`;

(async () => {
  const site = await serve(root), b = await launch();
  const rows = [];
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: PRE });
    for (const [name, w, h, dpr, mobile] of SCREENS) {
      await b.viewport(w, h, { scale: dpr, mobile });
      await b.go(`${site.url}index.html?debug`, { settle: 900 });
      await b.eval(`SnakeDebug.setup(['sniper', 'mason', 'gobbler']); SnakeDebug.pinQuality(2); document.getElementById('start').click(); 'ok'`);
      await sleep(1800);
      await b.eval(`window.__autoRaf = false; 'ok'`);
      await sleep(100);
      for (const [x, y] of SPOTS) for (const st of ['rest', 'eye', 'fly', 'drum']) {
        const m = await b.eval(MEASURE(x, y, st));
        m.screen = name; m.dpr = dpr;
        rows.push(m);
        const hc = m.box ? (m.box.h / m.cellCss).toFixed(1) : '-';
        console.log(`${label} ${name} spot ${x},${y} ${st.padEnd(4)}: ${m.box ? `${m.box.w}x${m.box.h} css px at ${m.box.x},${m.box.y} = ${hc} cells tall, ${(100 * m.box.h / m.board.w).toFixed(1)}% of the board` : 'not drawn'}; cell ${m.cellCss} px; board ${m.board.w}${m.pose ? `; pose ${m.pose.phase} s ${m.pose.s}, eye ${m.pose.eyeCssPx} px` : ''}`);
        if (m.box && (x === 12 && y === 21 || name.startsWith('d1920') && x === 2)) { // (a crop: the bird and the board round it, at the screen's own pixels)
          const pad = Math.max(30, m.box.h * 0.6), cx = Math.max(0, m.box.x - pad), cy = Math.max(0, m.box.y - pad);
          const cw = Math.min(w - cx, m.box.w + 2 * pad), ch = Math.min(h - cy, m.box.h + 2 * pad);
          const r = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: cx, y: cy, width: cw, height: ch, scale: 1 } });
          fs.writeFileSync(path.join(SHOTS, `${label}-${name}-${x}-${y}-${st}.png`), Buffer.from(r.data, 'base64'));
        }
      }
      // A whole-screen shot of it at rest by the bottom middle, for scale.
      await b.eval(MEASURE(12, 21, 'eye'));
      await b.shot(path.join(SHOTS, `${label}-${name}-full-eye.jpg`), 70);
    }
    if (b.errors.length) console.log('errors', b.errors);
  } finally { await b.close(); site.close(); }
  fs.writeFileSync(path.join(OUT, `bird-${label}.json`), JSON.stringify(rows, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
