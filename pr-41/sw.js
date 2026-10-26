// Offline play, once the game has been opened from a server: network first,
// so a new version is never hidden behind an old one, and the cache only
// when the network's gone. Same-origin GETs only (the font and online play
// go their own way).
// A pull request's preview (pr-<n>/ beside main on Pages: see
// .github/workflows/pages.yml) has a service worker of its own, scoped to its
// folder, with a cache of its own: main's never answers for a preview, nor a
// preview's for main, and each drops only its own old caches.
const SCOPE = new URL(self.registration.scope).pathname; // (its folder: /barkstreet-snakes/ for main, /barkstreet-snakes/pr-<n>/ for a preview)
const PREVIEW = (SCOPE.match(/\/pr-(\d+)\/$/) || [])[1];
const CACHE = (PREVIEW ? `barkstreet-snakes-pr${PREVIEW}-` : 'barkstreet-snakes-') + '2'; // (a new number drops the old cache on activate; only the game's own: every project site of the account shares this origin)
const OURS = PREVIEW ? k => k.startsWith(`barkstreet-snakes-pr${PREVIEW}-`) : k => /^(barkstreet-snakes|bark-and-bite)-(?!pr\d)/.test(k);
const FILES = ['./', 'index.html', 'style.css', 'tuning.js', 'ai.js', 'engine.js', 'records.js', 'chatter.js', 'audio.js', 'render/core.js', 'render/sprites.js', 'render/looks.js', 'render/lead.js', 'render/shadows.js', 'render/bodies.js', 'render/marks.js', 'render/tongues.js', 'render/faces.js', 'render/land.js', 'render/flags.js', 'render/food.js', 'render/weather.js', 'render/bird.js', 'render/bird-draw.js', 'render/holes.js', 'render/world.js', 'online.js', 'net.js', 'snake.js'];

self.addEventListener('install', e => {
  self.skipWaiting();
  // (one file failing doesn't stop the rest: it's cached the next time it's fetched)
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
});
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && OURS(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const plain = new URL(req.url); plain.search = ''; // (a room link's ?join=… is the same page: one copy of it)
  if (!PREVIEW && /^pr-\d+(\/|$)/.test(plain.pathname.slice(SCOPE.length))) return; // (a preview's, before its own worker takes it over: the network's)
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(plain.href, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(hit => hit || Response.error()))); // (its own cache only)
});
