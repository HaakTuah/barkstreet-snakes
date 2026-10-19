#!/usr/bin/env node
// Frame-time benchmark in headless Chrome (at 2x pixel density):
//   1. the staged scenes (tools/scenes.js: long snakes, Sovereign's and
//      Colonist's land with and without it, holes): the script time of
//      draw(), and the full cost of a frame (script plus the GPU's raster,
//      measured to a readback: see scenes.js); what the land costs against
//      its twin without it, the two alternated in one page (a shared, busy
//      machine drifts more between two runs a minute apart than the land
//      costs): ms a frame and the ratio, and of that, the land's colour
//      round the rivals on it, drawn and not, alternated in one page; the
//      woodpecker's strike, a frame that paints 14 new holes, against a
//      steady one, and its strike cutting the land (the land after it made
//      ahead while it aims: the aim's frames, a steady one and the strike's);
//      and fire burning out, a frame that paints three cells' soot, against
//      a steady one
//   2. step(): whole ticks including every AI decision, over AI-only rounds
//   3. real frames: script time of every animation frame while watching at
//      1x and 4x, with the drawing quality pinned (the governor stays out)
//
//   node tools/bench.js [seconds per watching run] [--root dir]   (default 60)
//   node tools/bench.js --land [pairs] [--root dir]   (only the land against its twin; default 10 pairs)
//   node tools/bench.js --base REV|DIR [pairs] [--root dir] [--scenes a,b]
//      (this copy against another, in one page: see versus below)
//
// For the browser's own work while watching (style, paint and the GPU
// process), see tools/trace.js.
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { execFileSync } = require('child_process');
const { launch, serve } = require('./browser');
const { setup, throughput, strikes, burnouts, landStrikes } = require('./scenes');
const args = process.argv.slice(2);
const at = args.indexOf('--root'), ROOT = at >= 0 ? path.resolve(args.splice(at, 2)[1]) : undefined;
const land = args.indexOf('--land'), LAND_ONLY = land >= 0 && !!args.splice(land, 1).length;
const bs = args.indexOf('--base'), BASE = bs >= 0 ? args.splice(bs, 2)[1] : null;
const sc = args.indexOf('--scenes'), SCENE_LIST = sc >= 0 ? args.splice(sc, 2)[1].split(',') : null;
const WATCH = Number(args[0]) || 60, PAIRS = LAND_ONLY ? Number(args[0]) || 10 : BASE ? Number(args[0]) || 16 : 6;
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
// The land against its twin without it (see scenes.js), alternated in one
// page, pairs times over: what it adds a frame (ms: the median of the pairs'
// differences) and the ratio of the medians (the budget: at most 1.5x).
async function landTwins(b, pairs) {
  for (const [what, w, wo] of [['the land', 'fields', 'nofields'], ['a rival on it', 'intruders', 'intruders-bare']]) {
    const on = [], off = [], diff = [];
    for (let k = 0; k < pairs; k++) {
      const t = {};
      for (const scene of k % 2 ? [wo, w] : [w, wo]) { await b.eval(setup(scene)); t[scene] = await b.eval(throughput(4)); }
      on.push(t[w]); off.push(t[wo]); diff.push(t[w] - t[wo]);
    }
    console.log(`${what}, alternated with its twin ${pairs} times: +${med(diff).toFixed(2)} ms a frame, ${(med(on) / med(off)).toFixed(2)}x (${med(on).toFixed(2)} against ${med(off).toFixed(2)} ms; each pair ${on.map((x, i) => (x / off[i]).toFixed(2)).join(' ')})`);
  }
  // And of that, the land's colour round the rivals on it (its glow, its
  // keyline and its line): the same board drawn with it and without it
  // (SnakeRender.hues), 30 times over, each time with, without, without,
  // with (so a slow first batch after a pause, or a drift, falls on both).
  for (const scene of ['fields', 'intruders']) {
    await b.eval(setup(scene));
    const r = await b.eval(`(async () => {
      const R = SnakeRender;
      const run = on => { R.hues(on); const t0 = performance.now(); for (let i = 0; i < 20; i++) { __t += 7; __scene.draw((__scene.f++ % 10) / 10, __t); } __sync(); return (performance.now() - t0) / 20; };
      run(true); run(false);
      const diff = [];
      for (let k = 0; k < 30; k++) {
        await new Promise(r => setTimeout(r, 10));
        run(true); // (untimed: the first after a pause)
        const a = run(true), b = run(false), c = run(false), d = run(true);
        diff.push((a + d - b - c) / 2);
      }
      R.hues(true);
      const s = diff.sort((p, q) => p - q);
      return { ms: +s[s.length >> 1].toFixed(2), p25: +s[s.length >> 2].toFixed(2), p75: +s[(3 * s.length) >> 2].toFixed(2) };
    })()`);
    console.log(`the land's colour round its rivals, ${scene} scene: +${r.ms} ms a frame (quartiles ${r.p25} to ${r.p75})`);
  }
}
const SUMMARY = `const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };
const sum = a => ({ frames: a.length, median: q(a, 0.5), p95: q(a, 0.95), p99: q(a, 0.99), worst: q(a, 1), 'over 6.94 ms': a.filter(x => x > 6.94).length, 'over 16.7 ms': a.filter(x => x > 16.7).length });`;

// This copy (or --root's) against another (--base: a git revision or a
// folder), in one page: each in an iframe of its own, side by side, the same
// staged scene in both, and their frames timed in turn, pairs times over,
// first one then the other first (a shared, busy machine drifts more between
// two pages, let alone two runs, than most changes cost). For each scene:
// the full cost of a frame in each (ms, the median of the pairs), and the
// ratio, after against before (the median of each pair's, and its
// quartiles: a ratio inside them is noise). Then the woodpecker's strike
// cutting the land (strike-land: the frame of the strike, and the worst of
// the aim's frames before it), and its strike in late sudden death (holes),
// each a round at a time in turn.
const VERSUS_SCENES = ['long', 'long-star', 'fields', 'intruders', 'holes', 'bridges', 'leaps'];
function copyOf(where) {
  if (fs.existsSync(where) && fs.statSync(where).isDirectory()) return path.resolve(where);
  const rev = execFileSync('git', ['rev-parse', '--short', where], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim();
  const dir = path.join(os.tmpdir(), `barkbite-base-${rev}`);
  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    fs.mkdirSync(dir, { recursive: true });
    const names = execFileSync('git', ['ls-tree', '--name-only', rev], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).split('\n').filter(f => /\.(html|css|js)$/.test(f));
    for (const f of names) fs.writeFileSync(path.join(dir, f), execFileSync('git', ['show', `${rev}:${f}`], { cwd: path.join(__dirname, '..'), maxBuffer: 1 << 26 }));
  }
  return dir;
}
// One server for both: /a/ is this copy, /b/ the other, / the page holding them.
function serveTwo(a, b) {
  const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
  const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;display:flex;background:#111">
    <iframe id="B" src="/b/index.html?debug" style="width:800px;height:800px;border:0"></iframe>
    <iframe id="A" src="/a/index.html?debug" style="width:800px;height:800px;border:0"></iframe></body>`;
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(PAGE); }
    const m = u.match(/^\/([ab])(\/.*)$/), root = m && (m[1] === 'a' ? a : b);
    if (!root) { res.writeHead(404); return res.end(); }
    const file = path.join(root, path.normalize(m[2])), rel = path.relative(root, file);
    if (rel.startsWith('..') || path.isAbsolute(rel)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() })));
}
async function versus() {
  const a = ROOT || path.join(__dirname, '..'), base = copyOf(BASE);
  const site = await serveTwo(a, base);
  const b = await launch();
  const quart = xs => { const s = [...xs].sort((p, q) => p - q); return [s[s.length >> 2], med(s), s[(3 * s.length) >> 2]]; };
  try {
    await b.viewport(1600, 800, { scale: 2 });
    await b.go(site.url, { settle: 1500 });
    const inFrame = (id, src) => b.eval(`document.getElementById('${id}').contentWindow.eval(${JSON.stringify(src)})`);
    for (const id of ['A', 'B']) await inFrame(id, `SnakeDebug.pinQuality?.(2); 'ok'`);
    console.log(`after: ${a}\nbefore: ${base} (${BASE})\n${PAIRS} pairs a scene, ms a frame (full cost), after/before`);
    for (const scene of SCENE_LIST || VERSUS_SCENES) {
      for (const id of ['A', 'B']) await inFrame(id, setup(scene));
      const t = { A: [], B: [] }, ratio = [];
      for (let k = 0; k < PAIRS; k++) {
        for (const id of k % 2 ? ['B', 'A'] : ['A', 'B']) t[id].push(await inFrame(id, throughput(4)));
        ratio.push(t.A[k] / t.B[k]);
      }
      const [r25, r50, r75] = quart(ratio);
      console.log(`${scene}: ${med(t.A).toFixed(2)} against ${med(t.B).toFixed(2)} ms, ${r50.toFixed(3)}x (quartiles ${r25.toFixed(3)} to ${r75.toFixed(3)})`);
    }
    for (const [scene, run, what] of [['strike-land', landStrikes(2, 30), 'the strike cutting the land'], ['holes', strikes(4), 'the strike in late sudden death']]) {
      if (SCENE_LIST && !SCENE_LIST.includes(scene)) continue;
      for (const id of ['A', 'B']) await inFrame(id, setup(scene));
      const all = { A: [], B: [] };
      for (let k = 0; k < Math.max(4, PAIRS >> 1); k++) for (const id of k % 2 ? ['B', 'A'] : ['A', 'B']) all[id].push(await inFrame(id, run));
      const pick = (id, key, stat) => med(all[id].map(r => r[key][stat]));
      for (const key of Object.keys(all.A[0])) {
        console.log(`${what}, ${key} frames: median ${pick('A', key, 'median').toFixed(2)} against ${pick('B', key, 'median').toFixed(2)} ms (${(pick('A', key, 'median') / pick('B', key, 'median')).toFixed(2)}x), worst ${pick('A', key, 'worst').toFixed(2)} against ${pick('B', key, 'worst').toFixed(2)}`);
      }
    }
    if (b.errors.length) console.log('page errors:', b.errors);
  } finally {
    await b.close();
    site.close();
  }
}

(async () => {
  if (BASE) return versus();
  const site = await serve(ROOT);
  const b = await launch();
  try {
    await b.viewport(800, 800, { scale: 2 });
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      (() => { const raf = window.requestAnimationFrame.bind(window); window.__ft = [];
        window.requestAnimationFrame = cb => raf(ts => { const t0 = performance.now(); cb(ts); window.__ft.push(performance.now() - t0); }); })();` });
    await b.go(site.url + '?debug');
    if (LAND_ONLY) { await b.eval(`SnakeDebug.pinQuality?.(2); 'ok'`); await landTwins(b, PAIRS); return; }

    const full = {};
    for (const scene of ['long', 'long-star', 'fields', 'nofields', 'intruders', 'intruders-bare', 'holes']) {
      await b.eval(setup(scene));
      const script = await b.eval(`(() => { ${SUMMARY}
        const times = [];
        window.__t ||= performance.now();
        for (let f = 0; f < 400; f++) {
          if (f % 10 === 0) __sync(); // (the GPU caught up, untimed: its backlog isn't script time; see scenes.js)
          __t += 7; const t0 = performance.now(); __scene.draw((f % 10) / 10, __t); times.push(performance.now() - t0);
        }
        return sum(times.slice(100));
      })()`); // (script only: the GPU's share is in the full cost)
      full[scene] = await b.eval(throughput());
      console.log(`${scene} scene: draw() script`, script, `full cost per frame ${full[scene]} ms`);
    }
    await landTwins(b, PAIRS);
    await b.eval(setup('holes'));
    console.log("the woodpecker's strike, holes scene (full cost of a frame, ms)", await b.eval(strikes()));
    await b.eval(setup('strike-land'));
    console.log("the woodpecker's strike cutting Sovereign's and Colonist's land, and the aim's frames before it (full cost of a frame, ms)", await b.eval(landStrikes()));
    await b.eval(setup('holes'));
    console.log('fire burning out in three cells, their soot painted in, holes scene (full cost of a frame, ms)', await b.eval(burnouts()));
    await b.eval(`SnakeRender.setGame(SnakeDebug.game()); 'ok'`);

    const step = await b.eval(`(() => { ${SUMMARY}
      const E = SnakeEngine, all = [];
      for (let r = 0; r < 4; r++) {
        const g = E.createGame({ withPlayer: false });
        while (g.snakes.filter(s => s.alive).length > 1 && g.time < 300000) { const t0 = performance.now(); E.step(g); all.push(performance.now() - t0); }
      }
      return sum(all);
    })()`);
    console.log('step(), every AI decision included', step);

    await b.eval(`SnakeDebug.pinQuality?.(2); setInterval(() => { if (SnakeDebug.state() === 'over') { document.getElementById('watch').click(); setTimeout(() => window.__speedKey && document.dispatchEvent(new KeyboardEvent('keydown', { key: window.__speedKey, bubbles: true })), 200); } }, 300); 'ok'`);
    for (const [label, key] of [['1x', '1'], ['4x', '3']]) {
      await b.eval(`document.getElementById('watch').click(); 'ok'`);
      await b.eval(`window.__speedKey = ${JSON.stringify(key)}; 0`); // (pressed again after each restart)
      await b.key(key); // (the speed can be set during the countdown)
      await b.sleep(2500);
      await b.eval(`__ft.length = 0; window.__t0 = performance.now(); 'ok'`);
      await b.sleep(WATCH * 1000);
      console.log(`frames watching at ${label}`, await b.eval(`(() => { ${SUMMARY} const s = sum(__ft); s.fps = Math.round(__ft.length / ((performance.now() - __t0) / 1000)); return s; })()`));
    }
    if (b.errors.length) console.log('page errors:', b.errors);
  } finally {
    await b.close();
    site.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
