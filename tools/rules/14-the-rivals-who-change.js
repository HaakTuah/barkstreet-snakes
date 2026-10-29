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
  for (let lap = 0; lap < 8; lap++) { const y = 3 + (lap % 8) * 2; for (let x = 2; x < N - 2; x++) straight.push([lap % 2 ? N - 1 - x : x, y]); straight.push([lap % 2 ? 2 : N - 3, y + 1]); }
  const ring = [];
  const loop = [[10, 10], [11, 10], [12, 10], [13, 10], [13, 11], [13, 12], [13, 13], [12, 13], [11, 13], [10, 13], [10, 12], [10, 11]]; // (round a 4 x 4 square)
  while (ring.length < 400) ring.push(loop[ring.length % loop.length]);
  const a = watch(straight, 6), b = watch(ring, 11);
  // Through the AI's own view: Copycat, having watched snake 7 run long and straight, takes it as its model once it
  // leads, and plays as Mason does. (The view says nothing of who 7 is: a person or a rival making these moves is
  // read the same.)
  const obs = {};
  for (let t = 6; t < straight.length; t++) {
    const body = straight.slice(t - 5, t + 1).reverse().map(([x, y]) => ({ x, y }));
    const [hx, hy] = straight[t], [px, py] = straight[t - 1];
    AI.watchStyles(obs, [{ id: 7, body, dir: { x: hx - px, y: hy - py } }], t);
  }
  const memory = { watch: obs };
  AI.decide(aiView({ tick: 1000, me: aiMe(line(6, 20, 5), 'right'), others: [aiRival(7, line(12, 4, 12), 'right'), aiRival(8, line(20, 14, 4), 'right')] }), AI.PERSONAS.copycat, memory);
  check('Copycat, in play, takes a leader it has watched run long and straight as its model, and plays as Mason does', memory.modelId === 7 && memory.style === 'mason', JSON.stringify({ model: memory.modelId, style: memory.style }));
  check('Copycat reads a long straight runner as Mason, and a snake round its own tail as Ouroboros', a === 'mason' && b === 'ouroboros', JSON.stringify({ a, b }));
}
