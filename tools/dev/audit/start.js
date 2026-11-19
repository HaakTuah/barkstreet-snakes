#!/usr/bin/env node
// How long the game takes to start (the code audit, issue #764; the question of #763): the page opened for the first time, opened a
// second time, and a round started, in headless Chrome, served as the live site serves it (gzip, a ten-minute cache), at the machine's own
// speed (desktop), as a phone on a good connection (phone4g: 4x slower CPU, 9 Mbit/s down, 70 ms round trip) and on a poor one (phone:
// 1.6 Mbit/s, 150 ms). The server speaks HTTP/1.1, six connections at a time, where the live site multiplexes, so the phones' first visits
// overstate what a request costs there: read them against each other and against the last audit's, not as the live site's time.
// Measures and prints; fails nothing:  node tools/dev/audit/start.js [--runs 5] [--json file] [--root dir] [--profile desktop|phone4g|phone]
//
// Each number is the median of the runs. A run is a fresh Chrome with an empty profile, so a first visit has no cache and no service worker.
//   paint        ms from the start of the navigation to the first contentful paint (the card's first look)
//   dcl, load    ms to DOMContentLoaded and to the load event. The page's 130 scripts are plain, none deferred, so every one has run, and the
//                Play button works, at DOMContentLoaded: that is when the start card can be used
//   second       the same, on a second visit with the service worker and the HTTP cache the first left
//   round        ms from pressing Play until the round shows (its state changes) and until its first tick has passed
//   requests, kb what the server sent in the first 8 s of a first visit (the page's files and the service worker's own fetches),
//                and the gzipped bytes of them
//   script, task ms Chrome spent running scripts, and in all its tasks, for a first visit's load
const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');
const { launch, sleep } = require('../../browser.js');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const runs = Number(opt('--runs', 5));
const root = path.resolve(opt('--root', path.join(__dirname, '../../..')));
const only = opt('--profile', null);
const PROFILES = {
  desktop: { cpu: 1, net: null },
  phone4g: { cpu: 4, net: { latency: 70, downloadThroughput: 9e6 / 8, uploadThroughput: 4e6 / 8 } },
  phone: { cpu: 4, net: { latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 } },
};
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

// The folder as GitHub Pages serves it: gzip for text, Cache-Control: max-age=600. `log` counts what it sends.
function serve() {
  const log = { n: 0, bytes: 0, start: 0 };
  const cache = new Map();
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/') u = '/index.html';
    const file = path.join(root, path.normalize(u));
    if (path.relative(root, file).startsWith('..')) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      const type = TYPES[path.extname(file)] || 'application/octet-stream', text = /^(text|application\/json|image\/svg)/.test(type);
      let body = data;
      if (text) { if (!cache.has(file)) cache.set(file, zlib.gzipSync(data, { level: 9 })); body = cache.get(file); }
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'max-age=600', ...(text ? { 'Content-Encoding': 'gzip' } : {}) });
      if (log.start) { log.n++; log.bytes += body.length; }
      res.end(body);
    });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ url: `http://127.0.0.1:${server.address().port}/`, log, close: () => server.close() })));
}

const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const TIMES = `(() => { const n = performance.getEntriesByType('navigation')[0], p = performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint'); return { paint: p ? p.startTime : -1, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd }; })()`;

async function visit(b, url) {
  await b.go(url, { settle: 0 });
  await sleep(300);
  return b.eval(TIMES);
}

async function once(profile, base) {
  const P = PROFILES[profile], b = await launch();
  try {
    await b.send('Network.enable');
    await b.send('Performance.enable');
    await b.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
    if (P.net) await b.send('Network.emulateNetworkConditions', { offline: false, ...P.net });
    await b.viewport(profile === 'phone' ? 390 : 1280, profile === 'phone' ? 844 : 800, { scale: 1, mobile: profile === 'phone' });
    base.log.n = 0; base.log.bytes = 0; base.log.start = 1;
    const first = await visit(b, base.url + '?debug');
    await sleep(8000); // the service worker's install finishes fetching its list
    base.log.start = 0;
    const metrics = Object.fromEntries((await b.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
    const second = await visit(b, base.url + '?debug');
    await sleep(500);
    // a round: Play, then until the state changes and the first tick has passed
    const round = await b.eval(`new Promise(res => { const t0 = performance.now(), s0 = SnakeDebug.state(); let shown = -1;
      document.getElementById('start').click();
      (function poll() { const now = performance.now() - t0; let g = null; try { g = SnakeDebug.game(); } catch {}
        if (shown < 0 && SnakeDebug.state() !== s0) shown = now;
        if (SnakeDebug.state() === 'running' && g && g.tick > 0) return res({ shown, tick: now });
        if (now > 30000) return res({ shown, tick: -1 }); setTimeout(poll, 5); })(); })`);
    return { first, second, round, requests: base.log.n, kb: Math.round(base.log.bytes / 1024), script: Math.round(metrics.ScriptDuration * 1000), task: Math.round(metrics.TaskDuration * 1000), errors: b.errors.length };
  } finally { await b.close(); }
}

(async () => {
  const base = await serve();
  const result = { runs, at: new Date().toISOString().slice(0, 10), profiles: {} };
  for (const profile of Object.keys(PROFILES)) {
    if (only && only !== profile) continue;
    const rs = [];
    for (let i = 0; i < runs; i++) rs.push(await once(profile, base));
    const m = f => Math.round(median(rs.map(f)));
    result.profiles[profile] = { ...PROFILES[profile], firstVisit: { paint: m(r => r.first.paint), dcl: m(r => r.first.dcl), load: m(r => r.first.load) }, secondVisit: { paint: m(r => r.second.paint), dcl: m(r => r.second.dcl), load: m(r => r.second.load) }, roundShown: m(r => r.round.shown), roundTick: m(r => r.round.tick), requests: m(r => r.requests), gzippedKb: m(r => r.kb), scriptMs: m(r => r.script), taskMs: m(r => r.task), consoleErrors: rs.reduce((a, r) => a + r.errors, 0) };
    const p = result.profiles[profile];
    console.log(`${profile.padEnd(8)} first visit: paint ${p.firstVisit.paint}, DOMContentLoaded ${p.firstVisit.dcl}, load ${p.firstVisit.load} ms | second visit: ${p.secondVisit.paint} / ${p.secondVisit.dcl} / ${p.secondVisit.load} ms | round shown ${p.roundShown} ms, first tick ${p.roundTick} ms | ${p.requests} requests, ${p.gzippedKb} kB gzipped, script ${p.scriptMs} ms of ${p.taskMs} ms`);
  }
  base.close();
  const out = opt('--json', null);
  if (out) fs.writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
