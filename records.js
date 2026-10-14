// The Hall of Fame, your stats and your best score, saved in this browser
// only. Every storage access is wrapped, and whatever comes back from storage
// is checked before use, so blocked or corrupt storage never breaks the game.
window.SnakeRecords = (() => {
  const SCORES_KEY = 'snake-highscores';
  const STATS_KEY = 'snake-stats';
  const NAME_KEY = 'snake-name';
  const BEST_KEY = 'snake-best';
  const PLAYER_KEY = 'snake-player';
  const MAX_SCORES = 10;
  const MAX_NAME = 16;
  const DEFAULT_NAME = 'Green'; // (what the game calls you until you carve a name)
  const OLD_DEFAULT = 'You';    // (what your unnamed rows used to say: they say Green now)

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }

  // Names from anywhere (typed, stored or a friend's) lose control and
  // text-direction characters, keep single spaces, and are cut at MAX_NAME
  // characters (whole ones: never half an emoji).
  const UNSAFE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;
  function cleanName(text) {
    return [...String(text ?? '').replace(UNSAFE, '').replace(/\s+/g, ' ').trim()].slice(0, MAX_NAME).join('').trim();
  }
  // Anything else stored or shared: plain colours, plausible numbers and dates, short ids.
  const cleanColor = c => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#a8a29e');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, num(v)));
  const cleanId = v => String(v ?? '').replace(/[^\w-]/g, '').slice(0, 40);
  const isDate = d => Number.isFinite(d) && d > 0 && d <= Date.now() + 864e5;

  const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const count = v => Math.round(clamp(v, 0, 1e6)); // a tally: a whole number, never negative

  // Rank: better place first (a win beats a shared-first draw), then the
  // longer survival, then more food, then the older entry.
  const compare = (a, b) => a.place - b.place || b.won - a.won || b.survived - a.survived || b.eaten - a.eaten || a.date - b.date;

  // Rivals that were renamed: their old rows and kills carry over.
  const RENAMED = Object.freeze({ __proto__: null, Hunter: 'Sniper' });

  // Stored entries, cleaned up: anything malformed is dropped.
  function scores() {
    const raw = load(SCORES_KEY, []);
    if (!Array.isArray(raw)) return [];
    return raw.filter(e => e && typeof e === 'object' && Number.isFinite(e.place) && isDate(e.date)).map(cleanEntry).sort(compare);
  }

  // A row's name: a renamed rival goes by its new one, and your own unnamed
  // rows (from before, "You") are Green.
  function rowName(e) {
    if (e.ai && typeof e.name === 'string' && RENAMED[e.name]) return RENAMED[e.name];
    const name = cleanName(e.name);
    return !name || (name === OLD_DEFAULT && !e.ai && !e.friend) ? DEFAULT_NAME : name;
  }

  function cleanEntry(e) {
    return {
      id: cleanId(e.id ?? e.date) || cleanId(e.date), name: rowName(e),
      color: cleanColor(e.color), ai: !!e.ai,
      place: Math.round(clamp(e.place, 1, 4)), won: !!e.won, draw: !!e.draw,
      eaten: Math.round(clamp(e.eaten, 0, 9999)), survived: Math.round(clamp(e.survived, 0, 36e5)), date: e.date,
      watched: !!e.watched,
      friend: !!e.friend && !e.ai,
      owner: typeof e.owner === 'string' ? cleanId(e.owner) : (e.ai || e.friend ? '' : playerId()),
      round: typeof e.round === 'string' ? cleanId(e.round) : '',
    };
  }

  // A random id for whoever plays in this browser, so a round shared between
  // friends' Halls of Fame is never counted twice.
  let me = null;
  function playerId() {
    if (me) return me;
    const stored = load(PLAYER_KEY, null);
    me = typeof stored === 'string' && /^[a-z0-9]{8,40}$/.test(stored) ? stored : Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    if (me !== stored) save(PLAYER_KEY, me);
    return me;
  }

  // The same round of the same person, wherever it was recorded.
  const sameAs = e => (e.owner && e.round ? `r:${e.round}:${e.owner}` : e.owner ? `o:${e.owner}:${e.id}` : null);

  function stats() {
    const raw = load(STATS_KEY, {});
    const s = raw && typeof raw === 'object' ? raw : {};
    const places = Array.isArray(s.places) && s.places.length === 4 ? s.places.map(count) : [0, 0, 0, 0];
    const killers = Object.create(null); // (so a rival named "constructor" is just a name)
    if (s.killers && typeof s.killers === 'object' && !Array.isArray(s.killers)) for (const [k, v] of Object.entries(s.killers)) {
      const name = RENAMED[k] || cleanName(k); // (RENAMED has no prototype, so "constructor" isn't in it)
      if (name) killers[name] = (killers[name] || 0) + count(v);
    }
    return { played: count(s.played), wins: count(s.wins), draws: count(s.draws), places, killers, totalEaten: count(s.totalEaten) };
  }

  function getName() {
    const n = load(NAME_KEY, DEFAULT_NAME);
    return typeof n === 'string' && n.trim() && n !== OLD_DEFAULT ? n.slice(0, MAX_NAME) : DEFAULT_NAME;
  }
  const hasName = () => getName() !== DEFAULT_NAME;

  const getBest = () => num(load(BEST_KEY, 0));
  const setBest = v => save(BEST_KEY, v);

  // The stored list is the overall top 10 plus your own top 10, so the AIs
  // can't push all of your rounds out.
  const topOverall = list => list.slice(0, MAX_SCORES);
  const topPlayer = list => list.filter(e => !e.ai && !e.friend).slice(0, MAX_SCORES);

  // score = { name, color, ai, place, won, draw, eaten, survived, watched,
  //   friend, owner, round, id, date }. The last five are for rounds that came
  //   from friends or were played with them; a round already here isn't added
  //   twice. Returns the entry id.
  function addScore(score) {
    const entry = cleanEntry({
      ...score,
      id: typeof score.id === 'string' && cleanId(score.id) ? score.id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: isDate(score.date) ? score.date : Date.now(),
      owner: score.ai ? '' : typeof score.owner === 'string' ? score.owner : playerId(),
    });
    const list = scores();
    const key = sameAs(entry);
    const already = key && list.find(e => sameAs(e) === key);
    if (already) return already.id;
    const sorted = [...list, entry].sort(compare);
    const keep = new Set([...topOverall(sorted), ...topPlayer(sorted)]);
    save(SCORES_KEY, sorted.filter(e => keep.has(e)));
    return entry.id;
  }

  // Where an entry sits: { overall, personal }, each 1-based or 0 if not in that top 10.
  function rankOf(id) {
    const list = scores();
    return {
      overall: topOverall(list).findIndex(e => e.id === id) + 1,
      personal: topPlayer(list).findIndex(e => e.id === id) + 1,
    };
  }

  // result = { place, won, draw, eaten, survived, killer }. Updates your stats
  // and adds a Hall of Fame entry under your saved name. Returns the entry id.
  function recordPlayer(result) {
    const st = stats();
    st.played++;
    if (result.won) st.wins++;
    if (result.draw) st.draws++;
    if (result.place >= 1 && result.place <= 4) st.places[result.place - 1]++;
    const killer = result.killer && cleanName(result.killer);
    if (killer) st.killers[killer] = (st.killers[killer] || 0) + 1;
    st.totalEaten += num(result.eaten);
    save(STATS_KEY, st);
    return addScore({ ...result, name: getName(), ai: false });
  }

  // Your best rounds, to share with friends when you play together. Unnamed
  // ones go under the name you're playing as.
  function shareable(playingAs) {
    return topPlayer(scores()).map(e => ({
      id: e.id, name: e.name === DEFAULT_NAME ? playingAs : e.name, place: e.place, won: e.won, draw: e.draw,
      eaten: e.eaten, survived: e.survived, date: e.date, round: e.round, owner: e.owner,
    }));
  }

  // Rows a friend shared, as the host passes them on: only that friend's own
  // (owner), at most ten, cleaned.
  function cleanShared(entries, owner) {
    if (!Array.isArray(entries)) return [];
    return entries.filter(e => e && typeof e === 'object' && e.owner === owner && Number.isFinite(e.place) && isDate(e.date)).slice(0, MAX_SCORES)
      .map(e => { const c = cleanEntry(e); return { id: c.id, name: c.name, place: c.place, won: c.won, draw: c.draw, eaten: c.eaten, survived: c.survived, date: c.date, round: c.round, owner: c.owner }; });
  }

  // A friend's shared rounds, in their seat color. Checked like anything else
  // from outside, and your own rounds coming back are skipped.
  function importShared(entries, color) {
    if (!Array.isArray(entries)) return;
    for (const e of entries.slice(0, 4 * MAX_SCORES)) {
      if (!e || typeof e !== 'object' || typeof e.owner !== 'string' || !e.owner || e.owner === playerId()) continue;
      if (!Number.isFinite(e.place) || e.place < 1 || e.place > 4 || !isDate(e.date)) continue;
      addScore({ ...e, name: e.name || 'Friend', color, friend: true, ai: false, watched: false });
    }
  }

  // A friend's result in a round you played together (never one claiming to be yours).
  function recordFriend(result, { name, color, owner, round }) {
    if (owner === playerId()) return null;
    return addScore({ ...result, name, color, owner, round, friend: true });
  }

  // Your name, as the Hall of Fame and your friends online see it.
  function setName(name) {
    name = cleanName(name);
    if (!name || name === OLD_DEFAULT) name = DEFAULT_NAME;
    save(NAME_KEY, name);
    return name;
  }

  // Carving a name: this round's row takes it, and so do all your unnamed ones.
  function rename(id, name) {
    name = setName(name);
    const list = scores();
    const carve = list.filter(e => e.id === id || (!e.ai && !e.friend && e.name === DEFAULT_NAME));
    for (const e of carve) e.name = name;
    if (carve.length) save(SCORES_KEY, list);
  }

  function reset() {
    try {
      localStorage.removeItem(SCORES_KEY);
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem(BEST_KEY);
    } catch { /* storage unavailable */ }
  }

  // ---------------------------------------------------------------- rendering

  const ordinal = n => n + (['th', 'st', 'nd', 'rd'][n] || 'th');
  const placeLabel = e => e.won ? 'Won' : e.draw ? 'Shared 1st' : ordinal(e.place);
  const clock = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

  function el(tag, props = {}, ...children) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  const dot = color => { const d = el('span', { className: 'dot' }); d.style.background = cleanColor(color); return d; };

  // filter: 'all' (everyone, overall top 10) or 'me' (your top 10).
  // playerColor colors your rows' dots; AI rows use the color saved with them.
  const safeDate = (fmt, d) => { try { return fmt.format(d); } catch { return ''; } };

  function renderScores(container, highlightId, filter, playerColor) {
    const all = scores();
    const list = filter === 'me' ? topPlayer(all) : topOverall(all);
    if (!list.length) {
      container.append(el('p', { className: 'empty', textContent: 'No legends yet. Go make one.' }));
      return;
    }
    const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
    const rows = list.map((e, i) => el('tr', { ...(e.id === highlightId && { ariaCurrent: 'true' }), className: [e.id === highlightId && 'highlight', e.ai && 'ai', e.friend && 'friend'].filter(Boolean).join(' ') },
      el('td', { className: 'num', textContent: i + 1 }),
      el('td', { className: 'name', title: e.watched ? `${e.name} (a watched round)` : e.friend ? `${e.name} (a friend)` : e.name },
        dot(e.ai || e.friend ? e.color : playerColor), e.name, ...(e.friend ? [el('span', { className: 'who', textContent: 'friend' })] : []),
        ...(e.id === highlightId ? [el('span', { className: 'who', textContent: 'this round' })] : [])),
      el('td', { className: e.won ? 'won' : '', textContent: placeLabel(e) }),
      el('td', { className: 'num', textContent: e.survived ? clock(e.survived) : '–' }),
      el('td', { className: 'num', textContent: e.eaten }),
      el('td', { className: 'muted date', textContent: safeDate(fmt, e.date) }),
    ));
    container.append(el('table', { className: 'scores-table' },
      el('thead', {}, el('tr', {},
        el('th', { className: 'num', textContent: '#' }),
        el('th', { textContent: 'Name' }),
        el('th', { textContent: 'Result' }),
        el('th', { className: 'num', textContent: 'Time' }),
        el('th', { className: 'num', textContent: 'Score' }),
        el('th', { className: 'date', textContent: 'Date' }),
      )),
      el('tbody', {}, ...rows),
    ));
  }

  // colors: { name -> color } for the snakes, used in the "what got you" bars.
  function renderStats(container, colors) {
    const st = stats();
    if (!st.played) {
      container.append(el('p', { className: 'empty', textContent: "You haven’t played yet. The log is waiting." }));
      return;
    }
    const avgPlace = st.places.reduce((sum, n, i) => sum + n * (i + 1), 0) / st.played;
    const tile = (label, value, sub) => el('div', { className: 'tile' },
      el('div', { className: 'tile-value', textContent: value }),
      el('div', { className: 'tile-label', textContent: label + (sub ? ` · ${sub}` : '') }),
    );
    container.append(el('div', { className: 'tiles' },
      tile('Rounds', st.played),
      tile('Wins', st.wins, `${Math.round(100 * st.wins / st.played)}%`),
      tile('Avg place', avgPlace.toFixed(1)),
      tile('Avg score', (st.totalEaten / st.played).toFixed(1)),
    ));

    const bars = (title, items) => {
      const max = Math.max(1, ...items.map(i => i.count));
      return el('section', { className: 'bars' },
        el('h3', { textContent: title }),
        ...items.map(i => el('div', { className: 'bar-row' },
          el('span', { className: 'bar-label' }, ...(i.color ? [dot(i.color)] : []), i.label),
          el('span', { className: 'bar-track' },
            el('span', { className: 'bar-fill', style: `width:${100 * i.count / max}%;background:${i.fill || i.color}` })),
          el('span', { className: 'bar-count', textContent: i.count }),
        )),
      );
    };

    // (1st place counts wins and shared firsts: shown apart, so it agrees with Wins.)
    const finishes = [{ label: 'Won', count: st.wins, fill: 'var(--leaf)' }];
    if (st.draws) finishes.push({ label: 'Shared 1st', count: st.draws, fill: 'var(--leaf)' });
    for (let i = 1; i < 4; i++) finishes.push({ label: ordinal(i + 1), count: st.places[i], fill: 'var(--leaf)' });
    container.append(bars('How you finished', finishes));

    // Bar labels, and how each reads in "Your nemesis: …".
    // (The key stays 'wall', so old stats carry over; the words say edge, as the game does.)
    const killerLabel = k => k === 'wall' ? 'Edges & holes' : k === 'self' ? 'Yourself' : k === 'hunger' ? 'Hunger' : k === 'fire' ? 'Fire' : k;
    const nemesisOf = k => k === 'wall' ? 'the edge of the log' : k === 'self' ? 'you' : k === 'hunger' ? 'your own tummy' : k === 'fire' ? 'a bolt from the blue' : k;
    const killers = Object.entries(st.killers)
      .map(([k, count]) => ({ key: k, label: killerLabel(k), count, color: colors[k] || '#a8a29e' }))
      .sort((a, b) => b.count - a.count);
    if (killers.length) {
      const top = killers[0];
      const tied = killers.filter(k => k.count === top.count).map(k => nemesisOf(k.key));
      container.append(el('p', { className: 'nemesis' }, tied.length > 1
        ? `No nemesis yet: ${tied.slice(0, -1).join(', ')} and ${tied[tied.length - 1]} are tied.`
        : el('span', {}, 'Your nemesis: ', dot(top.color), el('strong', { textContent: nemesisOf(top.key) }), '.')));
      container.append(bars('What got you', killers));
    }
  }

  return {
    MAX_SCORES, cleanName, cleanShared, scores, stats, addScore, recordPlayer, recordFriend, shareable, importShared, playerId, rankOf, rename, setName, reset, getName, hasName, getBest, setBest,
    renderScores, renderStats, ordinal, clock,
  };
})();
