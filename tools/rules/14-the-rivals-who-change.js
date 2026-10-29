// ---------------------------------------------------------------- 3b: the rivals who change (Capricious, Copycat, Wildcard)

{ // Capricious deals its moods from a shuffled deck of every other rival (not Drab, its dithering, nor itself): each
  // once before any comes back, never the same twice running, a moment undecided between them, and each mood starts
  // without what the last one remembered (its realm, its flag, its victim).
  const g = board([[line(5, 5, 5), 'right'], [line(5, 18, 5), 'right']]);
  const s = g.snakes[0], memory = {}, seen = [];
  let undecided = 0, kept = false;
  seededWhile(31, () => {
    for (let t = 0; t < 40; t++) {
      const view = { ...E.aiView(g, s), timeMs: 1000 + t * 16000 };
      AI.decide(view, AI.PERSONAS.capricious, memory);
      if (memory.mood) { if (seen[seen.length - 1] !== memory.mood) seen.push(memory.mood); if (memory.mood === 'sovereign') memory.home = { x: 1, y: 1, radius: 3 }; }
      else { undecided++; if (memory.home) kept = true; }
    }
  });
  const first = seen.slice(0, 16), others = AI.POOL.filter(k => k !== 'capricious' && k !== 'drab');
  check('Capricious does every other rival, each once before any comes back, with a moment undecided between',
    first.length === 16 && new Set(first).size === 16 && others.every(k => first.includes(k)) && seen.every((m, i) => i === 0 || m !== seen[i - 1]) && undecided >= 15, JSON.stringify({ seen, undecided }));
  check('a mood\'s memory (Sovereign\'s realm) is gone when it ends', !kept);
}

{ // Copycat's eye reads a snake by what it does, from its id, body and heading alone (nothing says who is a person):
  // a long straight runner is read as Mason, a snake chasing its own tail round a ring as Ouroboros.
  const N = T.GRID, watch = (path, len) => {
    const obs = {};
    for (let t = len; t < path.length; t++) {
      const body = path.slice(t - len + 1, t + 1).reverse().map(([x, y]) => ({ x, y }));
      const [hx, hy] = path[t], [px, py] = path[t - 1];
      AI.watchStyles(obs, [{ id: 7, body, dir: { x: hx - px, y: hy - py } }, { id: 8, body: [{ x: 0, y: N - 1 }], dir: D.right }], t);
    }
    return AI.styleOf(obs[7]);
  };
  const straight = [];
  for (let lap = 0; straight.length < 400; lap++) { const y = 3 + (lap % 8) * 2; for (let x = 2; x < N - 2; x++) straight.push([lap % 2 ? N - 1 - x : x, y]); straight.push([lap % 2 ? 2 : N - 3, y + 1]); }
  const ring = [];
  const loop = [[10, 10], [11, 10], [12, 10], [13, 10], [13, 11], [13, 12], [13, 13], [12, 13], [11, 13], [10, 13], [10, 12], [10, 11]]; // (round a 4 x 4 square)
  while (ring.length < 400) ring.push(loop[ring.length % loop.length]);
  const a = watch(straight, 6), b = watch(ring, 11);
  check('Copycat reads a long straight runner as Mason, and a snake round its own tail as Ouroboros', a === 'mason' && b === 'ouroboros', JSON.stringify({ a, b }));
}

{ // Wildcard draws two or three traits a round, never two that pull against each other, each pushed to an extreme
  // and everything else plain (Drab's): over many rounds every trait comes up, and its mix is in its memory (its
  // name tag's note says it, and it brags about it).
  const mixes = [];
  seededWhile(37, () => {
    for (let r = 0; r < 300; r++) {
      const g = board([[line(5, 5, 5), 'right'], [line(5, 18, 5), 'right']]), memory = {};
      AI.decide(E.aiView(g, g.snakes[0]), AI.PERSONAS.wildcard, memory);
      mixes.push(memory.mix);
    }
  });
  const clash = m => (m.includes('coward') && (m.includes('reckless') || m.includes('hunter') || m.includes('tailRider'))) || (m.includes('territorial') && m.includes('tailRider'));
  const all = new Set(mixes.flat());
  check('Wildcard draws two or three traits a round, none clashing, and every trait comes up',
    mixes.every(m => Array.isArray(m) && m.length >= 2 && m.length <= 3 && new Set(m).size === m.length && !clash(m)) && Object.keys(AI.TRAITS).every(t => all.has(t)), JSON.stringify(mixes.slice(0, 5)));
}

{ // A Wildcard whose round's mix shows off spends its powers as Star does (an apple four on, open ground: it flashes
  // for it); one whose mix doesn't, doesn't.
  const view = () => aiView({ me: aiMe(line(6, 12, 5), 'right', { flashIn: 0 }), others: [aiRival(1, line(20, 2, 5), 'right')], food: [{ x: 10, y: 12, kind: 'food', expires: 999 }] });
  const flashes = mix => { let n = 0; for (let i = 0; i < 6; i++) { const memory = { mix }, v = view(); AI.decide(v, AI.PERSONAS.wildcard, memory); if (memory.flash === v.tick) n++; } return n; };
  const shows = flashes(['showOff', 'hungry']), plain = flashes(['hungry', 'reckless']);
  check('a Wildcard that shows off this round flashes where Star would; one that doesn\'t, doesn\'t', shows === 6 && plain === 0, JSON.stringify({ shows, plain }));
}
