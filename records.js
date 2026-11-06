// The Hall of Fame, your stats and your best score, saved in this browser
// only. Every storage access is wrapped, and whatever comes back from storage
// is checked before use, so blocked or corrupt storage never breaks the game.
// Drawn by scores-screen.js and joined by lineup.js (the seats and the deck),
// which both read `kept`: the storage and what is kept in it.
window.SnakeRecords = (() => {
  const SCORES_KEY = 'snake-highscores';
  const STATS_KEY = 'snake-stats';
  const NAME_KEY = 'snake-name';
  const BEST_KEY = 'snake-best';
  const PLAYER_KEY = 'snake-player';
  const PROBE_KEY = 'snake-probe';
  const MAX_SCORES = 10;
  const MAX_NAME = 16;
  const DEFAULT_NAME = 'Green'; // (what the game calls you until you carve a name)
  const OLD_DEFAULT = 'You';    // (what your unnamed rows used to say: they say Green now)

  // A browser that won't keep anything (storage blocked, or full) still gets
  // its records for as long as the tab is open: whatever couldn't be written
  // is kept here instead, as storage would have it, and the Hall of Fame says so.
  const memory = new Map();
  let keeping = true;
  try { localStorage.setItem(PROBE_KEY, '1'); localStorage.removeItem(PROBE_KEY); } catch { keeping = false; }
  let playedHere = 0, wiped = false; // (this session: rounds recorded, and whether you cleared everything)

  function load(key, fallback) {
    try { return JSON.parse(memory.has(key) ? memory.get(key) : localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }

  function save(key, value) {
    const text = JSON.stringify(value);
    try { localStorage.setItem(key, text); memory.delete(key); } catch { keeping = false; memory.set(key, text); }
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
      chosen: !!e.chosen, // (a round whose rivals were chosen, not dealt)
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
  // Nothing kept to clear: no rows, no rounds in your story, no Best.
  const isEmpty = () => !scores().length && !stats().played && !getBest();
  const setBest = v => save(BEST_KEY, v);

  // The stored list is the overall top 10 plus your own top 10, so the AIs
  // can't push all of your rounds out.
  const topOverall = list => list.slice(0, MAX_SCORES);
  const topPlayer = list => list.filter(e => !e.ai || !e.friend).slice(0, MAX_SCORES);

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
    playedHere++;
    return addScore({ ...result, name: getName(), ai: false });
  }

  // Your best rounds, to share with friends when you play together. Unnamed
  // ones go under the name you're playing as.
  function shareable(playingAs) {
    return topPlayer(scores()).map(e => ({
      id: e.id, name: e.name === DEFAULT_NAME ? playingAs : e.name, place: e.place, won: e.won, draw: e.draw,
      eaten: e.eaten, survived: e.survived, date: e.date, round: e.round, owner: e.owner, chosen: e.chosen,
    }));
  }

  // Rows a friend shared, as the host passes them on: only that friend's own
  // (owner), at most ten, cleaned.
  function cleanShared(entries, owner) {
    if (!Array.isArray(entries)) return [];
    return entries.filter(e => e && typeof e === 'object' && e.owner === owner && Number.isFinite(e.place) && isDate(e.date)).slice(0, MAX_SCORES)
      .map(e => { const c = cleanEntry(e); return { id: c.id, name: c.name, place: c.place, won: c.won, draw: c.draw, eaten: c.eaten, survived: c.survived, date: c.date, round: c.round, owner: c.owner, chosen: c.chosen }; });
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
    for (const key of [SCORES_KEY, STATS_KEY, BEST_KEY]) memory.delete(key);
    try {
      localStorage.removeItem(SCORES_KEY);
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem(BEST_KEY);
    } catch { /* storage unavailable */ }
    wiped = true;
  }

  return {
    MAX_SCORES, cleanName, cleanShared, scores, stats, addScore, recordPlayer, recordFriend, shareable, importShared, playerId, rankOf, rename, setName, reset, getName, hasName, getBest, setBest, isEmpty,
    kept: { load, save, topOverall, topPlayer, cleanColor, isKept: () => keeping, started: () => playedHere > 0 || wiped },
  };
})();
