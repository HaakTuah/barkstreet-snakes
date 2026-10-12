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

  // The stored list is the overall top 10 plus the player's own top 10, so the
  // AIs can't push all of your rounds out.
  const topOverall = list => list.slice(0, MAX_SCORES);
  const topPlayer = list => list.filter(e => !e.ai).slice(0, MAX_SCORES);

  // score = { name, color, ai, place, won, draw, eaten }. Returns the entry id.
  function addScore(score) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: score.name,
      color: score.color,
      ai: !!score.ai,
      place: score.place,
      won: !!score.won,
      draw: !!score.draw,
      eaten: score.eaten,
      date: Date.now(),
    };
    const sorted = [...scores(), entry].sort(compare);
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

  // result = { place, won, draw, eaten, killer, color }. Updates your stats and
  // adds a high-score entry under your saved name. Returns the entry id.
  function recordPlayer(result) {
    const st = stats();
    st.played++;
    if (result.won) st.wins++;
    if (result.draw) st.draws++;
    st.places[result.place - 1]++;
    if (result.killer) st.killers[result.killer] = (st.killers[result.killer] || 0) + 1;
    st.totalEaten += result.eaten;
    save(STATS_KEY, st);
    return addScore({ ...result, name: getName(), ai: false });
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

  // filter: 'all' (everyone, overall top 10) or 'me' (your top 10).
  // playerColor colors your rows' dots; AI rows use the color saved with them.
  function renderScores(container, highlightId, filter, playerColor) {
    const all = scores();
    const list = filter === 'me' ? topPlayer(all) : topOverall(all);
    if (!list.length) {
      container.append(el('p', { className: 'empty', textContent: 'No legends yet. Go make one.' }));
      return;
    }
    const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
    const rows = list.map((e, i) => el('tr', { className: [e.id === highlightId && 'highlight', e.ai && 'ai'].filter(Boolean).join(' ') },
      el('td', { className: 'num', textContent: i + 1 }),
      el('td', { className: 'name' },
        el('span', { className: 'dot', style: `background:${e.ai ? e.color : playerColor}` }),
        e.name),
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
      container.append(el('p', { className: 'empty', textContent: "You haven't played yet. The tree is waiting." }));
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

    container.append(bars('How you finished', st.places.map((count, i) => ({
      label: i === 0 ? '1st' : ordinal(i + 1), count, color: 'var(--accent)',
    }))));

    const killerLabel = k => k === 'wall' ? 'Walls & holes' : k === 'self' ? 'Yourself' : k === 'hunger' ? 'Starvation' : k;
    const killers = Object.entries(st.killers)
      .map(([k, count]) => ({ label: killerLabel(k), count, color: colors[k] || 'var(--muted)' }))
      .sort((a, b) => b.count - a.count);
    if (killers.length) {
      const top = killers[0];
      const tied = killers.filter(k => k.count === top.count).length > 1;
      container.append(el('p', { className: 'nemesis' },
        tied ? 'No nemesis yet. Everyone gets you equally.' : el('span', {}, 'Your nemesis: ', el('strong', { textContent: top.label, style: `color:${top.color}` }))));
      container.append(bars('What got you', killers));
    }
  }

  return { scores, stats, addScore, recordPlayer, rankOf, rename, reset, getName, renderScores, renderStats, ordinal };
})();
