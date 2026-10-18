// A small headless-Chrome driver for the tools (shots.js, bench.js): it serves
// this folder on a free port, launches Chrome with a throwaway profile and
// speaks the DevTools protocol over Node's built-in WebSocket. No dependencies.
// Chrome is found in the usual places, or set CHROME=/path/to/chrome.
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const candidates = {
    win32: ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'],
    linux: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
  }[process.platform] || [];
  const found = candidates.find(p => fs.existsSync(p));
  if (!found) throw new Error('Chrome not found: set CHROME=/path/to/chrome');
  return found;
}

// Serves the game (this repo, or another copy of it: root) on a free local
// port; resolves to its base URL and a close().
function serve(root = ROOT) {
  const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u === '/') u = '/index.html';
    const file = path.join(root, path.normalize(u));
    const rel = path.relative(root, file);
    if (rel.startsWith('..') || path.isAbsolute(rel)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() })));
}

async function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'barkbite-chrome-'));
  // Chrome runs at below-normal priority, so whoever's using the computer
  // comes first (its processes take it from here as they start: lowered for
  // the spawn, then set back). BARKBITE_PRIORITY=normal for timing runs.
  const pr = os.constants.priority, low = process.env.BARKBITE_PRIORITY !== 'normal';
  let was = null;
  if (low) try { was = os.getPriority(); os.setPriority(pr.PRIORITY_BELOW_NORMAL); } catch {}
  const proc = spawn(findChrome(), [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
    ...(process.env.CI ? ['--no-sandbox'] : []), // (a CI runner's Linux can't give Chrome its sandbox)
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (was != null) try { os.setPriority(was); } catch {}
  // Chrome says where its DevTools endpoint is on stderr.
  const port = await new Promise((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not start')), 15000);
    proc.stderr.on('data', d => {
      text += d;
      const m = text.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (m) { clearTimeout(timer); resolve(Number(m[1])); }
    });
  });
  let targets = [];
  for (let i = 0; i < 50 && !targets.some(t => t.type === 'page'); i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { /* not yet */ }
    if (!targets.some(t => t.type === 'page')) await sleep(100);
  }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map(), listeners = [], errors = [];
  ws.onmessage = m => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method) for (const l of listeners) l(msg);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const n = ++id; pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method, params })); });
  const once = method => new Promise(res => { const l = msg => { if (msg.method === method) { listeners.splice(listeners.indexOf(l), 1); res(msg.params); } }; listeners.push(l); });
  listeners.push(msg => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  });
  await send('Page.enable');
  await send('Runtime.enable');
  const VK = { Enter: 13, ' ': 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Escape: 27 };
  let closed = false;
  return {
    send, errors, sleep,
    // Listen for a DevTools event (e.g. 'Tracing.dataCollected'); returns a function that stops listening.
    on(method, fn) { const l = msg => { if (msg.method === method) fn(msg.params); }; listeners.push(l); return () => listeners.splice(listeners.indexOf(l), 1); },
    async viewport(width, height, { scale = 1, mobile = false } = {}) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
    },
    async go(url) { const loaded = once('Page.loadEventFired'); await send('Page.navigate', { url }); await loaded; await sleep(400); },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async shot(file, quality = 85) { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); },
    async key(key) {
      const text = key === 'Enter' ? '\r' : key.length === 1 ? key : undefined;
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, windowsVirtualKeyCode: VK[key] || key.toUpperCase().charCodeAt(0), text });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, windowsVirtualKeyCode: VK[key] || key.toUpperCase().charCodeAt(0) });
    },
    async close() {
      if (closed) return;
      closed = true;
      try { await Promise.race([send('Browser.close'), sleep(3000)]); } catch { /* gone */ }
      await Promise.race([new Promise(r => proc.once('exit', r)), sleep(5000)]);
      proc.kill();
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Windows may hold it a moment */ }
    },
  };
}

// In-page helpers for the tools: an autopilot that steers your snake through
// real key events (one decision a tick, with a rival's brain), and a waiter.
const HELPERS = `
window.pilot = { on: false, persona: 'gobbler', crash: false, tick: -1 };
window.press = key => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true })); };
setInterval(() => {
  if (!pilot.on || SnakeDebug.state() !== 'running') return;
  const g = SnakeDebug.game(), me = g.snakes[0];
  if (!me || !me.isPlayer || !me.alive || pilot.tick === g.tick) return;
  pilot.tick = g.tick;
  let d;
  if (pilot.crash) { // head for the nearest edge
    const h = me.body[0], N = TUNING.GRID;
    const options = [['left', h.x], ['right', N - 1 - h.x], ['up', h.y], ['down', N - 1 - h.y]]
      .filter(([n]) => { const v = SnakeEngine.DIRS[n]; return !(v.x === -me.dir.x && v.y === -me.dir.y); })
      .sort((a, b) => a[1] - b[1]);
    d = SnakeEngine.DIRS[options[0][0]];
  } else {
    me.pilotMemory ||= {};
    d = SnakeAI.decide(SnakeEngine.aiView(g, me), SnakeAI.PERSONAS[pilot.persona], me.pilotMemory);
  }
  const name = Object.keys(SnakeEngine.DIRS).find(k => SnakeEngine.DIRS[k] === d);
  if (d !== me.dir) press({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[name]);
}, 4);
window.waitFor = (cond, ms = 60000) => new Promise((res, rej) => {
  const t0 = performance.now();
  (function check() { let v; try { v = cond(); } catch (e) { return rej(e); } if (v) return res(v); if (performance.now() - t0 > ms) return rej(new Error('timeout: ' + cond)); setTimeout(check, 10); })();
});
window.cardUp = () => !document.getElementById('overlay').classList.contains('hidden');
window.me = () => SnakeDebug.game().snakes[0];
window.running = () => waitFor(() => SnakeDebug.state() === 'running');
'ok'`;

module.exports = { launch, serve, sleep, HELPERS };
