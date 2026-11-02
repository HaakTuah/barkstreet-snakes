// Copycat: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.copycat = {
  name: 'Copycat', color: '#de2910', look: 'copycat', driver: 'copycat',
  blurb: 'Copies whoever leads: their colours, paled, and how they play. Party member.',
  kill: ['It learned that from someone.', 'Somebody taught it that. Maybe you.', 'The Party thanks you for your sacrifice.'],
  win: ['Imitation pays.', 'A victory for the collective.', 'It copied the winner until it was one.'],
  w: { ...DRAB, mimic: 120, lure: { weight: 4, dist: 5 } },
};

// Copy whoever leads: the longest snake (changing model only when
// another leads it by 3 or more). It shadows its model a few cells
// away, moving the way it moves, and plays as it has seen it play:
// the style it's nearest to (styleOf), with that rival's habits, its
// weights and its driver. Watching everyone the same way, it copies a
// person by what they do, never for being one.
DRIVERS.copycat = function () {
  watchStyles(memory.watch ||= {}, [me, ...others], view.tick - age); // (as it saw them: its eyes are as slow as anyone's)
  let best = -1;
  for (const k of all) if (best < 0 || others[k].body.length > others[best].body.length) best = k;
  const current = indexOf(memory.modelId);
  const k = current >= 0 && others[current].body.length + 3 > others[best].body.length ? current : best;
  if (k < 0) return;
  // (A new read of its model holds STYLE_HOLD ticks before it takes it:
  // a style isn't dropped on a moment's change of pace.)
  const read = styleOf(memory.watch[others[k].id]), now = view.tick;
  let style = others[k].id === memory.modelId && memory.style ? memory.style : read; // (its first read, it takes at once)
  if (read === style) memory.readSince = null;
  else if (memory.readAs !== read || memory.readSince == null) { memory.readAs = read; memory.readSince = now; }
  else if (now - memory.readSince >= STYLE_HOLD) { style = read; memory.readSince = null; }
  if (others[k].id !== memory.modelId || style !== memory.style) for (const key of COPY_MEMORY) memory[key] = null; // (a new model, or a new read of it: what the last copy kept is gone)
  memory.modelId = others[k].id;
  memory.style = style;
  if (style) {
    const copy = PERSONAS[style];
    intent.w = COPIES[style] ||= { ...(MOOD_FORMS[style] || copy.w), mimic: COPY_MIMIC, lure: copy.w.lure || PERSONAS.copycat.w.lure };
    if (copy.driver) DRIVERS[copy.driver]();
  }
  if (intent.lure < 0) intent.lure = k; // (shadowing it, unless the copy has its own lure: Vulture's, Joker's)
  intent.mimicDir = others[k].dir;
};
