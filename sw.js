// Offline play, once the game has been opened from a server: network first,
// so a new version is never hidden behind an old one, and the cache only
// when the network's gone. Same-origin GETs only (the font and online play
// go their own way).
const CACHE = 'bark-and-bite-2'; // (a new name drops the old cache on activate)
const FILES = ['./', 'index.html', 'style.css', 'tuning.js', 'ai.js', 'engine.js', 'records.js', 'chatter.js', 'audio.js', 'render.js', 'online.js', 'net.js', 'snake.js'];

self.addEventListener('install', e => {
  self.skipWaiting();
  // (one file failing doesn't stop the rest: it's cached the next time it's fetched)
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
});
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const plain = new URL(req.url); plain.search = ''; // (a room link's ?join=… is the same page: one copy of it)
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(plain.href, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || Response.error())));
});
