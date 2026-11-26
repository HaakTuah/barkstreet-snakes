#!/usr/bin/env node
// The browser's own work, from Chrome traces (headless, 800x800 at 2x
// density): what tools/bench.js's script timings can't see.
//   1. watching an AI round at 1x, then 2. at 4x, the drawing quality pinned:
//      the main thread (busy ms a second; the animation-frame callback per
//      frame), style recalculation, paint and the GPU process (busy ms a second);
//   3. the staged scenes (tools/scenes.js), drawn every animation frame from
//      the title card (nothing else draws): the GPU process's time per frame.
//
//   node tools/trace.js [seconds per run] [--root dir]   (default 15)
const path = require('path');
const { launch, serve } = require('./browser');
const { setup } = require('./scenes');
const args = process.argv.slice(2);
const at = args.indexOf('--root'), ROOT = at >= 0 ? path.resolve(args.splice(at, 2)[1]) : undefined;
const SECONDS = Number(args[0]) || 15;
const CATEGORIES = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'toplevel', 'gpu', 'viz', 'cc'].join(',');

const q = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };

async function record(b, ms) {
  const events = [];
  const off = b.on('Tracing.dataCollected', p => events.push(...p.value));
  const done = new Promise(res => { const stop = b.on('Tracing.tracingComplete', () => { stop(); res(); }); });
  await b.send('Tracing.start', { categories: CATEGORIES, transferMode: 'ReportEvents' });
  await b.sleep(ms);
  await b.send('Tracing.end');
  await done;
  off();
  return events;
}

// Busy time per thread (the union of its tasks, since task events nest), and
// the timeline events that matter.
function summarise(events, ms) {
  const names = new Map(); // "pid:tid" -> thread name
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') names.set(`${e.pid}:${e.tid}`, e.args.name);
  const tasks = {}, raf = [], work = { style: 0, paint: 0, layout: 0 };
  for (const e of events) {
    const thread = names.get(`${e.pid}:${e.tid}`) || '?';
    if (e.ph !== 'X') continue;
    const dur = (e.dur || 0) / 1000;
    if ((e.name === 'ThreadControllerImpl::RunTask' || e.name === 'RunTask') && (thread === 'CrRendererMain' || thread === 'CrGpuMain' || thread === 'VizCompositorThread')) (tasks[thread] ||= []).push([e.ts, e.ts + (e.dur || 0)]);
    if (thread !== 'CrRendererMain') continue;
    if (e.name === 'FireAnimationFrame') raf.push(dur);
    if (e.name === 'UpdateLayoutTree') work.style += dur;
    if (e.name === 'Paint' || e.name === 'PrePaint') work.paint += dur;
    if (e.name === 'Layout') work.layout += dur;
  }
  const busy = {};
  for (const [thread, list] of Object.entries(tasks)) {
    list.sort((a, b) => a[0] - b[0]);
    let total = 0, end = -Infinity;
    for (const [s0, s1] of list) { if (s1 <= end) continue; total += s1 - Math.max(s0, end); end = s1; }
    busy[thread] = total / 1000;
  }
  const perSecond = v => +(v / (ms / 1000)).toFixed(1);
  return {
    'main thread busy, ms a second': perSecond(busy.CrRendererMain || 0),
    'GPU process busy, ms a second': perSecond(busy.CrGpuMain || 0),
    'compositor busy, ms a second': perSecond(busy.VizCompositorThread || 0),
    'animation frames a second': perSecond(raf.length),
    'animation frame callback, median / p95 / p99 / worst ms': [q(raf, 0.5), q(raf, 0.95), q(raf, 0.99), q(raf, 1)],
    'style, ms a second': perSecond(work.style), 'paint, ms a second': perSecond(work.paint), 'layout, ms a second': perSecond(work.layout),
  };
}

(async () => {
  const site = await serve(ROOT);
  const b = await launch();
  try {
    await b.viewport(800, 800, { scale: 2 });
    await b.go(site.url + '?debug');
    // The scenes first, from the title card: nothing else draws.
    for (const scene of ['long', 'fields']) {
      await b.eval(setup(scene));
      await b.eval(`(() => { window.__on = true; const draw = ts => { if (!window.__on) return; __scene.draw((__scene.f++ % 10) / 10, ts); requestAnimationFrame(draw); }; requestAnimationFrame(draw); return 'ok'; })()`);
      await b.sleep(1500);
      const ms = Math.min(SECONDS, 8) * 1000;
      const s = summarise(await record(b, ms), ms);
      await b.eval(`window.__on = false; 'ok'`);
      s['GPU process per frame, ms'] = +(s['GPU process busy, ms a second'] / Math.max(1, s['animation frames a second'])).toFixed(2);
      console.log(`${scene} scene`, s);
    }
    await b.eval(`SnakeRender.setGame(SnakeDebug.game()); SnakeDebug.pinQuality?.(2); setInterval(() => { if (SnakeDebug.state() === 'over') { document.getElementById('watch').click(); setTimeout(() => window.__speedKey && document.dispatchEvent(new KeyboardEvent('keydown', { key: window.__speedKey, bubbles: true })), 200); } }, 300); 'ok'`);
    for (const [label, key] of [['1x', '1'], ['4x', '3']]) {
      await b.eval(`document.getElementById('watch').click(); 'ok'`);
      await b.eval(`window.__speedKey = ${JSON.stringify(key)}; 0`); // (pressed again after each restart)
      await b.key(key);
      await b.sleep(3000);
      const ms = SECONDS * 1000;
      console.log(`watching at ${label}`, summarise(await record(b, ms), ms));
    }
    if (b.errors.length) console.log('page errors:', b.errors);
  } finally {
    await b.close();
    site.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
