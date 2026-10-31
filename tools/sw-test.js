#!/usr/bin/env node
// Checks the service worker (sw.js): it keeps every file the page loads, and
// main's offline copy and a pull request's preview (pr-<n>/ beside main on
// Pages) never mix: each has a cache of its own, answers only from it, drops
// only its own old caches, and main's leaves a preview's requests alone.
//
//   node tools/sw-test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const ok = (cond, what) => { if (!cond) { console.error('FAIL:', what); process.exit(1); } console.log('ok  ', what); };

// A worker registered at `scope`, over one origin's caches (shared, as a
// browser's are) and a network that answers `net` (a Response, or a throw).
function worker(scope, caches, net) {
  const on = {};
  const self = { registration: { scope }, skipWaiting() {}, clients: { claim: async () => {} }, addEventListener: (t, f) => (on[t] = f) };
  const ctx = vm.createContext({ self, caches, location: new URL(scope), URL, Promise, Response: { error: () => 'error' }, fetch: async () => net() });
  vm.runInContext(src, ctx);
  return {
    async event(type, extra = {}) { let wait = null; on[type]({ waitUntil: p => (wait = p), respondWith: p => (wait = p), ...extra }); return { answered: !!wait && type === 'fetch', out: await wait }; },
    fetch(url) { return this.event('fetch', { request: { method: 'GET', url } }); },
  };
}
function originCaches() {
  const all = new Map();
  const cache = name => {
    if (!all.has(name)) all.set(name, new Map());
    const m = all.get(name);
    return { add: async f => m.set(f, 'file'), put: async (k, v) => m.set(k, v), match: async (req, o) => { const u = new URL(req.url); if (o?.ignoreSearch) u.search = ''; return m.get(u.href); } };
  };
  return { all, open: async name => cache(name), keys: async () => [...all.keys()], delete: async name => all.delete(name), match: async () => 'ANY CACHE' };
}
const flush = () => new Promise(r => setTimeout(r, 0));

(async () => {
  // Every script the page loads is kept for offline play.
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"|<link rel="stylesheet" href="([^"]+)"/g)].map(m => m[1] || m[2]).filter(f => !/^https?:/.test(f)); // (the font comes from Google)
  const files = vm.runInNewContext(src.match(/const FILES = (\[[^\]]*\])/)[1]);
  ok(scripts.length > 0 && scripts.every(s => files.includes(s)), `sw.js keeps every script and stylesheet index.html loads (${scripts.length})`);
  ok(files.every(f => f === './' || fs.existsSync(path.join(root, f))), 'every file sw.js keeps is there');

  const MAIN = 'https://haaktuah.github.io/barkstreet-snakes/', PR = MAIN + 'pr-41/';
  const caches = originCaches();
  caches.all.set('barkstreet-snakes-1', new Map()); // (main's old caches)
  caches.all.set('barkstreet-snakes-4', new Map());
  caches.all.set('bark-and-bite-3', new Map());     // (from before the game's rename)
  caches.all.set('barkstreet-snakes-pr7-1', new Map()); // (another preview's)
  caches.all.set('amarna-letters-1', new Map());    // (another game on the same origin)
  const online = () => ({ ok: true, clone() { return this; } });
  const main = worker(MAIN, caches, online), pr = worker(PR, caches, online);
  await main.event('install'); await main.event('activate');
  await pr.event('install'); await pr.event('activate');
  const names = [...caches.all.keys()].sort();
  ok(names.includes('barkstreet-snakes-5') && names.includes('barkstreet-snakes-pr41-5'), `main and the preview each have a cache of their own (${names.join(', ')})`);
  ok(!names.includes('barkstreet-snakes-1') && !names.includes('barkstreet-snakes-4') && !names.includes('bark-and-bite-3'), "main's worker drops main's old caches");
  ok(names.includes('barkstreet-snakes-pr7-1') && names.includes('amarna-letters-1'), "neither drops another preview's cache or another game's");
  ok([...caches.all.get('barkstreet-snakes-5').keys()].includes('render/world.js'), "main's cache keeps the renderer's files");

  // Main's worker leaves a preview's requests to the network (its own takes them over once it's there).
  ok(!(await main.fetch(PR + 'index.html')).answered && !(await main.fetch(MAIN + 'pr-41')).answered, "main's worker doesn't answer for a preview");
  ok((await main.fetch(MAIN + 'index.html?join=abc')).answered, "main's worker answers for main");
  await flush();
  ok(caches.all.get('barkstreet-snakes-5').has(MAIN + 'index.html'), "main's pages go into main's cache");
  await pr.fetch(PR + 'index.html'); await flush();
  ok(caches.all.get('barkstreet-snakes-pr41-5').has(PR + 'index.html') && !caches.all.get('barkstreet-snakes-5').has(PR + 'index.html'), "a preview's pages go into its own cache, not main's");
  // update.js's look at the newest version.js (no-store) keeps no copy: the offline copy's stays with its own files.
  await main.event('fetch', { request: { method: 'GET', url: MAIN + 'version.js', cache: 'no-store' } }); await flush();
  ok(!caches.all.get('barkstreet-snakes-5').has(MAIN + 'version.js'), "a look at the newest version.js isn't kept for offline play");

  // Offline, each answers only from its own cache.
  const off = () => { throw new Error('offline'); };
  const mainOff = worker(MAIN, caches, off), prOff = worker(PR, caches, off);
  const kept = (await mainOff.fetch(MAIN + 'index.html')).out;
  ok(kept !== 'error' && kept !== 'ANY CACHE', 'offline, main is played from its own cache');
  ok((await prOff.fetch(PR + 'style/base.css')).out === 'error', "offline, a preview never gets main's copy of a file it hasn't kept");
  caches.all.get('barkstreet-snakes-pr41-5').set(PR + 'style/base.css', 'preview css');
  ok((await prOff.fetch(PR + 'style/base.css')).out === 'preview css', 'offline, a preview is played from its own cache');
  console.log('\nall sw checks passed');
})().catch(e => { console.error('FAIL:', e); process.exit(1); });
