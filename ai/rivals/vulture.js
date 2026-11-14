// Vulture: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.vulture = {
  name: 'Vulture', color: '#27272a', ink: '#f9a8d4', look: 'vulture', driver: 'vulture',
  blurb: 'Circles snakes in trouble and feasts on what they leave behind.',
  kill: ['Vulture was waiting for this.', 'It circled. You slipped. It ate.', 'Vulture thanks you for the beads.'],
  win: ['Picking over the leftovers.', 'It waited everyone out.', 'Last one at the table.'],
  w: {
    style: powerStyle({ bead: 0.5 }), // (7b: it flashes to beads)
    space: 1.3, territory: 0.4,
    food: 4, eat: 60, normalFood: 0.15, pellet: 3, foodRange: 40, contested: true,
    margin: 6, headRisk: 900, zoneRisk: 200, lure: { weight: 8, dist: 8 },
  },
};

// Hover near the snake most likely to die soon (least room for its length).
DRIVERS.vulture = function () {
  body0ToOwnFree(me.body, me.body.length, 0);
  let best = -1, bestScore = Infinity, currentScore = Infinity;
  for (const k of all) {
    const s = roomOf(k) / Math.max(4, others[k].body.length);
    if (s < bestScore) { bestScore = s; best = k; }
    if (others[k].id === memory.lureId) currentScore = s;
  }
  clearOwnFree(me.body, me.body.length);
  const current = indexOf(memory.lureId);
  intent.lure = current >= 0 && currentScore <= bestScore * 1.5 ? current : best;
  memory.lureId = intent.lure >= 0 ? others[intent.lure].id : null;
};
