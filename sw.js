// Offline play, once the game has been opened from a server: network first,
// so a new version is never hidden behind an old one, and the cache only
// when the network's gone. Same-origin GETs only (online play goes its own
// way).
// A pull request's preview (pr-<n>/ beside main on Pages: built by
// .github/workflows/pages.yml, published by preview.yml) has a service worker
// of its own, scoped to its folder, with a cache of its own: main's never
// answers for a preview, nor a preview's for main, and each drops only its own
// old caches.
const SCOPE = new URL(self.registration.scope).pathname; // (its folder: /barkstreet-snakes/ for main, /barkstreet-snakes/pr-<n>/ for a preview)
const PREVIEW = (SCOPE.match(/\/pr-(\d+)\/$/) || [])[1];
const CACHE = (PREVIEW ? `barkstreet-snakes-pr${PREVIEW}-` : 'barkstreet-snakes-') + '5'; // (a new number drops the old cache on activate; only the game's own: every project site of the account shares this origin)
const OURS = PREVIEW ? k => k.startsWith(`barkstreet-snakes-pr${PREVIEW}-`) : k => /^(barkstreet-snakes|bark-and-bite)-(?!pr\d)/.test(k);
const FILES = ['./', 'index.html', 'style/font.css', 'fonts/fredoka-latin.woff2', 'fonts/fredoka-latin-ext.woff2', 'style/base.css', 'style/panels.css', 'style/small-boards.css', 'style/phones.css', 'style/beside.css', 'style/header.css', 'style/access.css', 'tuning.js', 'ai/core.js', 'ai/rivals.js', 'ai/rivals/sniper.js', 'ai/rivals/gobbler.js', 'ai/rivals/ghost.js', 'ai/rivals/sovereign.js', 'ai/rivals/colonist.js', 'ai/rivals/drab.js', 'ai/rivals/vulture.js', 'ai/rivals/mason.js', 'ai/rivals/wildcard.js', 'ai/rivals/creeper.js', 'ai/rivals/metagamer.js', 'ai/rivals/capricious.js', 'ai/rivals/copycat.js', 'ai/rivals/desperado.js', 'ai/rivals/mute.js', 'ai/rivals/ouroboros.js', 'ai/rivals/joker.js', 'ai/rivals/star.js', 'ai/moods.js', 'ai/buffers.js', 'ai/room.js', 'ai/sight.js', 'ai/risk.js', 'ai/portals.js', 'ai/spit.js', 'ai/food.js', 'ai/beetles.js', 'ai/evaluate.js', 'ai/search.js', 'ai/powers.js', 'ai/flash.js', 'ai/leaps.js', 'ai/decide.js', 'engine/core.js', 'engine/luck.js', 'engine/food.js', 'engine/roll.js', 'engine/beetles.js', 'engine/weather.js', 'engine/pits.js', 'engine/woodpecker.js', 'engine/outline.js', 'engine/fight.js', 'engine/landings.js', 'engine/portals.js', 'engine/view.js', 'engine/powers.js', 'engine/crashes.js', 'engine/step.js', 'records.js', 'lineup.js', 'scores-screen.js', 'chatter/voices.js', 'chatter/voices/sniper.js', 'chatter/voices/gobbler.js', 'chatter/voices/ghost.js', 'chatter/voices/sovereign.js', 'chatter/voices/colonist.js', 'chatter/voices/drab.js', 'chatter/voices/vulture.js', 'chatter/voices/mason.js', 'chatter/voices/wildcard.js', 'chatter/voices/creeper.js', 'chatter/voices/metagamer.js', 'chatter/voices/capricious.js', 'chatter/voices/copycat.js', 'chatter/voices/desperado.js', 'chatter/voices/mute.js', 'chatter/voices/ouroboros.js', 'chatter/voices/joker.js', 'chatter/voices/star.js', 'chatter/impressions.js', 'chatter/talk.js', 'chatter/moments.js', 'audio/cues.js', 'audio/music.js', 'audio/weather.js', 'audio/sound.js', 'render/core.js', 'render/sprites.js', 'render/looks.js', 'render/gaze.js', 'render/hunger.js', 'render/jumps.js', 'render/lead.js', 'render/shadows.js', 'render/bodies.js', 'render/marks.js', 'render/tongues.js', 'render/faces.js', 'render/stamina.js', 'render/shield.js', 'render/land.js', 'render/flags.js', 'render/food.js', 'render/burrows.js', 'render/weather.js', 'render/bird-perch.js', 'render/bird.js', 'render/bird-drum.js', 'render/bird-draw.js', 'render/holes.js', 'render/watch.js', 'render/cut.js', 'render/portals.js', 'render/blasts.js', 'render/edges.js', 'render/you.js', 'render/corpses.js', 'render/events.js', 'render/setup.js', 'render/world.js', 'online.js', 'net-relays.js', 'net.js', 'version.js', 'update.js', 'game/core.js', 'game/round.js', 'game/banners.js', 'game/toasts.js', 'game/cards.js', 'game/hud.js', 'game/input.js', 'game/friends.js', 'game/screen.js', 'THIRD-PARTY-NOTICES.txt'];

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
    if (res.ok && req.cache !== 'no-store') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(plain.href, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(hit => hit || Response.error()))); // (its own cache only)
});
