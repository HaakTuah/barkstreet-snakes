// Offline play, once the game has been opened from a server: network first,
// so a new version is never hidden behind an old one, and the cache only
// when the network's gone. Same-origin GETs only (the font and online play
// go their own way).
const CACHE = 'bark-and-bite';
const FILES = ['./', 'index.html', 'style.css', 'tuning.js', 'ai.js', 'engine.js', 'records.js', 'chatter.js', 'audio.js', 'render.js', 'online.js', 'net.js', 'snake.js'];

self.addEventListener('install', e => {
  self.skipWaiting();
  // (one file failing doesn't stop the rest: it's cached the next time it's fetched)
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || Response.error())));
});
