// The newest version, by itself between rounds (docs/design/36-updating.md).
// The page looks whether a newer version is out (version.js's build, asked
// for afresh) when it is shown again after being hidden and every 30 minutes,
// and when one is, it reloads into it on the start card or the round-over
// card, never during a round, with no question (records and settings are
// kept, as on any reload). Online, the host looks before opening a room, and
// a friend turned away for running another version looks then (hooks in
// game/friends.js). After an update the start card shows what is new for a
// few rounds (version.js's news). Loaded before game/: the game's names
// (state, online, the elements) are read only when it looks, never as it loads.
window.SnakeUpdate = (() => {
  const V = window.SnakeVersion;
  const AGAIN = 30 * 60 * 1000, ROUNDS = 3, ASK = 2500;
  const TRIED = 'snake-update', NEWS = 'snake-news'; // (sessionStorage: the build reloaded for, and what to do then; localStorage: the news seen, rounds left)
  const read = (s, k) => { try { return JSON.parse(s.getItem(k)); } catch { return null; } };
  const keep = (s, k, v) => { try { if (v == null) s.removeItem(k); else s.setItem(k, JSON.stringify(v)); } catch { /* a private window: this visit only */ } };
  const tried = read(sessionStorage, TRIED);
  keep(sessionStorage, TRIED, tried && { to: tried.to }); // (what to do then is done once)
  let waiting = null, looking = null, going = false;

  const api = {
    // The build that is out now, or null (offline, or not served).
    latest: async () => {
      const res = await fetch('version.js', { cache: 'no-store' });
      return res.ok ? /build: '([^']+)'/.exec(await res.text())?.[1] ?? null : null;
    },
    look, beforeRoom, news, waiting: () => waiting,
  };

  // Whether a newer version is out (a build this visit already reloaded for
  // and didn't get, the site still half published, is let be).
  function look() {
    if (going || !/^https?:$/.test(location.protocol)) return Promise.resolve(waiting);
    return (looking ??= api.latest()
      .then(b => { if (b && b !== V.build && b !== tried?.to) waiting = b; return waiting; })
      .catch(() => waiting)
      .finally(() => { looking = null; }));
  }

  // Between rounds: the start card or the round-over card, alone (not online,
  // nor with the Field guide, the rivals' picker or a name being typed).
  function between() {
    if (online || (state !== 'ready' && state !== 'over')) return false;
    if (!recordsEl.hidden || !pickerEl.hidden) return false;
    return !document.activeElement?.matches('input, textarea, select');
  }

  // Into the new version: its files fetched afresh first, so the reload gets
  // all of them new (Pages lets a browser keep a file 10 minutes).
  async function update(then = null) {
    going = true;
    keep(sessionStorage, TRIED, { to: waiting, then });
    const own = [...document.querySelectorAll('script[src], link[rel=stylesheet][href]')].map(e => e.getAttribute('src') || e.getAttribute('href')).filter(f => !/^https?:/.test(f));
    const files = [location.href.split('#')[0], './', ...own];
    navigator.serviceWorker?.getRegistration().then(r => r?.update()).catch(() => {});
    await Promise.race([Promise.all(files.map(f => fetch(f, { cache: 'reload' }).catch(() => {}))), new Promise(r => setTimeout(r, 5000))]);
    location.reload();
  }

  // Online: before opening a room (the host), or after a room turned you away
  // for its version (a friend, with its code): true if the page is updating.
  async function beforeRoom(code = null) {
    await Promise.race([look(), new Promise(r => setTimeout(r, ASK))]);
    if (!waiting || going) return false;
    if (code) {
      const u = new URL(location.href);
      u.searchParams.set('join', code); // (the new version joins straight, as a friend's link does)
      try { history.replaceState(null, '', u.pathname + u.search); } catch { /* file:// */ }
    }
    update(code ? null : 'host');
    return true;
  }

  // What is new, for the start card's flavour line: a returning player's
  // first few rounds on a version with news they haven't seen (a first visit
  // is all new, and shows none).
  const top = V.news[0];
  let seen = read(localStorage, NEWS);
  if (top && seen?.on !== top.on) {
    let returning = !!seen;
    try { returning ||= Object.keys(localStorage).some(k => /^(snake-|barkbite-)/.test(k)); } catch { /* none */ }
    seen = { on: top.on, left: returning ? ROUNDS : 0 };
    keep(localStorage, NEWS, seen);
  }
  function news() { return seen?.left > 0 ? `New: ${top.line}` : ''; }

  // The watch: a round started (from a card) uses up one of the news' rounds;
  // a version waiting goes in as soon as the game is between rounds.
  let was = null;
  setInterval(() => {
    if (typeof state === 'undefined') return;
    if (state === 'countdown' && (was === 'ready' || was === 'over') && seen?.left > 0) { seen.left--; keep(localStorage, NEWS, seen); }
    was = state;
    if (waiting && !going && between()) update();
  }, 250);
  setInterval(look, AGAIN);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') look(); });

  // The host's room, opened as asked, now in the new version.
  if (tried?.then === 'host') addEventListener('load', () => setTimeout(() => { if (state === 'ready' && !online) { openFriends(); hostRoom(); } }, 0));

  return api;
})();
