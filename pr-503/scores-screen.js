// The Hall of Fame and your stats, drawn into their screens (see records.js, which
// keeps them): window.SnakeRecords's renderScores, renderStats, ordinal and clock.
// After records.js, which gives it the records to draw.
(() => {
  const { scores, stats, kept } = window.SnakeRecords;
  const { topOverall, topPlayer, cleanColor, isKept, started } = kept;

  const ordinal = n => n + (['th', 'st', 'nd', 'rd'][n] || 'th');
  const placeLabel = e => e.won ? 'Won' : e.draw ? 'Shared 1st' : ordinal(e.place);
  const clock = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

  function el(tag, props = {}, ...children) {
    const node = Object.assign(document.createElement(tag), props);
    node.append(...children);
    return node;
  }

  // paint: a background the game draws for that snake, as on its tag (Mason's marble, Ghost's pale fill), or null for its colour.
  const dot = (color, paint = null) => { const d = el('span', { className: 'dot' }); d.style.background = paint || cleanColor(color); return d; };
  // A tag after a name, with a comma only a screen reader hears ("Green, this round", not "Greenthis round").
  const tag = text => [el('span', { className: 'sr-only', textContent: ', ' }), el('span', { className: 'who', textContent: text })];

  // At the top of both tabs, while nothing here will outlast the tab.
  const keepingNote = container => {
    if (!isKept()) container.append(el('p', { className: 'records-note', textContent: 'This browser isn’t keeping records, so these last until you close the tab.' }));
  };

  // filter: 'all' (everyone, overall top 10) or 'me' (your top 10).
  // playerColor colors your rows' dots; AI rows use the color saved with them.
  const safeDate = (fmt, d) => { try { return fmt.format(d); } catch { return ''; } };

  // paint: (a rival's name) => a dot's background, or null (see dot).
  function renderScores(container, highlightId, filter, playerColor, paint = null) {
    const all = scores();
    const list = filter === 'me' ? topPlayer(all) : topOverall(all);
    keepingNote(container);
    if (!list.length) {
      container.append(el('p', { className: 'empty', textContent: 'No legends yet. Go make one.' }));
      return;
    }
    const fmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
    const rows = list.map((e, i) => el('tr', { ...(e.id === highlightId && { ariaCurrent: 'true' }), className: [e.id === highlightId && 'highlight', e.ai && 'ai', e.friend && 'friend'].filter(Boolean).join(' ') },
      el('td', { className: 'num', textContent: i + 1 }),
      el('td', { className: 'name', title: (e.watched ? `${e.name} (a watched round)` : e.friend ? `${e.name} (a friend)` : e.name) + (e.chosen ? ', rivals chosen' : '') },
        dot(e.ai || e.friend ? e.color : playerColor, e.ai && paint ? paint(e.name) : null), e.name, ...(e.friend ? tag('friend') : []),
        ...(e.id === highlightId ? tag('this round') : []), ...(e.chosen ? tag('chosen') : [])),
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
  function renderStats(container, colors, paint = null) {
    const st = stats();
    keepingNote(container);
    if (!st.played) {
      // (Never "you haven't played" to someone who has, this session: after a clear, it's a fresh start.)
      container.append(el('p', { className: 'empty', textContent: started() ? 'A clean slate. The log is waiting.' : 'You haven’t played yet. The log is waiting.' }));
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
          el('span', { className: 'bar-label' }, ...(i.color ? [dot(i.color, i.paint)] : []), i.label),
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

    // What got you that isn't a snake: its bar label, and how it reads in
    // "Your nemesis: …" (the same thing, in the same words; "&" keeps the edge
    // and its holes one thing in a tie). The key stays 'wall', so old stats
    // carry over; the words say edge, as the game does. (Pecks were counted
    // there too, before the woodpecker had its own.)
    const NOT_A_SNAKE = {
      __proto__: null, // (so a rival named "constructor" is just a name)
      wall: ['Edge & holes', 'the edge & holes'],
      woodpecker: ['Woodpecker', 'the woodpecker'],
      self: ['Yourself', 'yourself'],
      hunger: ['Hunger', 'hunger'],
      fire: ['Fire', 'fire'],
    };
    const killerLabel = k => NOT_A_SNAKE[k]?.[0] ?? k;
    const nemesisOf = k => NOT_A_SNAKE[k]?.[1] ?? k;
    const killers = Object.entries(st.killers)
      .map(([k, count]) => ({ key: k, label: killerLabel(k), count, color: colors[k] || '#a8a29e', paint: paint ? paint(k) : null }))
      .sort((a, b) => b.count - a.count);
    if (killers.length) {
      const top = killers[0];
      const tied = killers.filter(k => k.count === top.count).map(k => nemesisOf(k.key));
      container.append(el('p', { className: 'nemesis' }, tied.length > 1
        ? `No nemesis yet: ${tied.slice(0, -1).join(', ')} and ${tied[tied.length - 1]} are tied.`
        : el('span', {}, 'Your nemesis: ', dot(top.color, top.paint), el('strong', { textContent: nemesisOf(top.key) }), '.')));
      container.append(bars('What got you', killers));
    }
  }

  Object.assign(window.SnakeRecords, { renderScores, renderStats, ordinal, clock });
})();
