// The rivals you chose for the start card's seats, and the deck they are dealt
// from, kept in this browser (see records.js): window.SnakeRecords's seats,
// setSeat, deal and undeal. After records.js, which gives it the storage.
(() => {
  const { load, save } = window.SnakeRecords.kept;
  const LINEUP_KEY = 'snake-lineup'; // (the rivals you chose, for good: no longer read, and never renamed; see VISIT_KEY)
  const VISIT_KEY = 'snake-visit-lineup'; // (the rivals you chose this visit, seat by seat)
  const DECK_KEY = 'snake-deck';     // (the rivals still to be dealt before any comes round again)

  // The rivals you chose for the start card's seats: a persona's key, or null
  // for "Any" (dealt). They last this visit (this tab, reloads too, in
  // sessionStorage), and the next time the game is opened every seat is "Any".
  // pool: the keys there are, so a stored one that's gone (or a seat chosen
  // twice) comes back as "Any".
  const SEATS = 3;
  let visitSeats = null; // (where sessionStorage won't keep them)
  function seats(pool) {
    let raw = visitSeats;
    try { raw = JSON.parse(sessionStorage.getItem(VISIT_KEY)) ?? visitSeats; } catch { /* storage unavailable */ }
    const out = [];
    for (let i = 0; i < SEATS; i++) {
      const k = Array.isArray(raw) ? raw[i] : null;
      out.push(typeof k === 'string' && pool.includes(k) && !out.includes(k) ? k : null);
    }
    return out;
  }
  // Seat i gets key (null: "Any"). One already in another seat swaps with it.
  function setSeat(pool, i, key) {
    const list = seats(pool);
    if (!(i >= 0 && i < SEATS)) return list;
    key = typeof key === 'string' && pool.includes(key) ? key : null;
    const other = key ? list.indexOf(key) : -1;
    if (other >= 0 && other !== i) list[other] = list[i];
    list[i] = key;
    visitSeats = list;
    try { sessionStorage.setItem(VISIT_KEY, JSON.stringify(list)); } catch { /* kept in visitSeats */ }
    return list;
  }

  // n rivals from this browser's deck: every one of pool is dealt before any
  // comes round again. skip: keys not to deal (chosen ones; they stay in the
  // deck for later). The deck is shuffled afresh when it runs out, after
  // whatever it still holds.
  function deal(pool, n, skip = []) {
    const raw = load(DECK_KEY, []);
    let deck = Array.isArray(raw) ? raw.filter((k, i) => pool.includes(k) && raw.indexOf(k) === i) : [];
    const out = [];
    for (let fresh = 0; out.length < n && fresh < 2; fresh++) {
      deck = deck.filter(k => {
        if (out.length >= n || skip.includes(k) || out.includes(k)) return true;
        out.push(k);
        return false;
      });
      if (out.length < n) {
        const more = pool.filter(k => !deck.includes(k));
        for (let i = more.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [more[i], more[j]] = [more[j], more[i]]; }
        deck.push(...more);
      }
    }
    save(DECK_KEY, deck);
    return out;
  }

  // Rivals dealt but never met go back in the deck. Within a visit they go on
  // top, so they're next; anywhere (the page closing on a start card), each
  // goes to a random place among the rivals not yet dealt: everyone is still
  // met before anyone comes round again, but opening the game gives a fresh cast.
  function undeal(pool, keys, { anywhere = false } = {}) {
    if (!keys.length) return;
    const raw = load(DECK_KEY, []), deck = Array.isArray(raw) ? raw.filter(k => pool.includes(k)) : [];
    const back = keys.filter((k, i) => pool.includes(k) && !deck.includes(k) && keys.indexOf(k) === i);
    if (!anywhere) return save(DECK_KEY, [...back, ...deck]);
    for (const k of back) deck.splice(Math.floor(Math.random() * (deck.length + 1)), 0, k);
    save(DECK_KEY, deck);
  }

  Object.assign(window.SnakeRecords, { SEATS, seats, setSeat, deal, undeal });
})();
