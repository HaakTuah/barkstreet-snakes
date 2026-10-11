// Local high scores and win/loss stats, saved in this browser only.
window.SnakeRecords = (() => {
  const SCORES_KEY = 'snake-highscores';
  const STATS_KEY = 'snake-stats';
  const NAME_KEY = 'snake-name';
  const MAX_SCORES = 10;
  const MAX_NAME = 16;

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }

  const emptyStats = () => ({ played: 0, wins: 0, draws: 0, places: [0, 0, 0, 0], killers: {}, totalEaten: 0 });

  // Better placement first, a win beats a shared-first draw, then more food, then older.
  const compare = (a, b) => a.place - b.place || b.won - a.won || b.eaten - a.eaten || a.date - b.date;

  const scores = () => load(SCORES_KEY, []);
  const stats = () => ({ ...emptyStats(), ...load(STATS_KEY, {}) });
  const getName = () => load(NAME_KEY, 'You');

  // result = { place, won, draw, eaten, killer }. Returns the new entry's id and
  // its rank in the top 10 (0 if it didn't make it).
  function record(result) {
    const st = stats();
    st.played++;
    if (result.won) st.wins++;
    if (result.draw) st.draws++;
    st.places[result.place - 1]++;
    if (result.killer) st.killers[result.killer] = (st.killers[result.killer] || 0) + 1;
    st.totalEaten += result.eaten;
    save(STATS_KEY, st);

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: getName(),
      place: result.place,
      won: !!result.won,
      draw: !!result.draw,
      eaten: result.eaten,
      date: Date.now(),
    };
    const list = [...scores(), entry].sort(compare).slice(0, MAX_SCORES);
    save(SCORES_KEY, list);
    return { id: entry.id, rank: list.findIndex(e => e.id === entry.id) + 1 };
  }

  function rename(id, name) {
    name = name.trim().slice(0, MAX_NAME) || 'You';
    save(NAME_KEY, name);
    const list = scores();
    const entry = list.find(e => e.id === id);
    if (entry) { entry.name = name; save(SCORES_KEY, list); }
  }

  function reset() {
    try { localStorage.removeItem(SCORES_KEY); localStorage.removeItem(STATS_KEY); } catch { /* storage unavailable */ }
  }

  // ---------------------------------------------------------------- rendering

  const ordinal = n => n + (['th', 'st', 'nd', 'rd'][n] || 'th');
  const placeLabel = e => e.won ? 'Won' : e.draw ? 'Draw' : ordinal(e.place);

  function el(tag, props = {}, ...children) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  function renderScores(container, highlightId) {
    const list = scores();
    if (!list.length) {
      container.append(el('p', { className: 'empty', textContent: 'No scores yet. Finish a round to get on the board.' }));
      return;
    }
    const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
    const rows = list.map((e, i) => el('tr', { className: e.id === highlightId ? 'highlight' : '' },
      el('td', { className: 'num', textContent: i + 1 }),
      el('td', { className: 'name', textContent: e.name }),
      el('td', { className: e.won ? 'won' : '', textContent: placeLabel(e) }),
      el('td', { className: 'num', textContent: e.eaten }),
      el('td', { className: 'muted', textContent: fmt.format(e.date) }),
    ));
    container.append(el('table', { className: 'scores-table' },
      el('thead', {}, el('tr', {},
        el('th', { className: 'num', textContent: '#' }),
        el('th', { textContent: 'Name' }),
        el('th', { textContent: 'Result' }),
        el('th', { className: 'num', textContent: 'Food' }),
        el('th', { textContent: 'Date' }),
      )),
      el('tbody', {}, ...rows),
    ));
  }

  // colors: { name -> color } for the snakes, used in the "what killed you" bars.
  function renderStats(container, colors) {
    const st = stats();
    if (!st.played) {
      container.append(el('p', { className: 'empty', textContent: 'No rounds played yet.' }));
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
      tile('Avg food', (st.totalEaten / st.played).toFixed(1)),
    ));

    const bars = (title, items) => {
      const max = Math.max(1, ...items.map(i => i.count));
      return el('section', { className: 'bars' },
        el('h3', { textContent: title }),
        ...items.map(i => el('div', { className: 'bar-row' },
          el('span', { className: 'bar-label', textContent: i.label }),
          el('span', { className: 'bar-track' },
            el('span', { className: 'bar-fill', style: `width:${100 * i.count / max}%;background:${i.color}` })),
          el('span', { className: 'bar-count', textContent: i.count }),
        )),
      );
    };

    container.append(bars('Finishing place', st.places.map((count, i) => ({
      label: i === 0 ? '1st' : ordinal(i + 1), count, color: 'var(--accent)',
    }))));

    const killerLabel = k => k === 'wall' ? 'The wall' : k === 'self' ? 'Yourself' : k;
    const killers = Object.entries(st.killers)
      .map(([k, count]) => ({ label: killerLabel(k), count, color: colors[k] || 'var(--muted)' }))
      .sort((a, b) => b.count - a.count);
    if (killers.length) {
      const top = killers[0];
      const tied = killers.filter(k => k.count === top.count).length > 1;
      container.append(el('p', { className: 'nemesis' },
        tied ? 'No single nemesis yet' : el('span', {}, 'Your nemesis: ', el('strong', { textContent: top.label, style: `color:${top.color}` }))));
      container.append(bars('What killed you', killers));
    }
  }

  return { scores, stats, record, rename, reset, getName, renderScores, renderStats, ordinal };
})();
