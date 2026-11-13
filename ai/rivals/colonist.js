// Colonist: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.colonist = {
  name: 'Colonist', color: '#e11d48', look: 'colonist', driver: 'colonist',
  blurb: 'A redcoat who plants flags all over and defends every one.',
  kill: ['Another patch of bark for the Crown.', 'You were annexed. Politely.', 'All very civilised, of course.'],
  win: ['The final flag is planted.', 'An empire of one log.', 'Victory, then tea.'],
  w: {
    style: { chase: 0.5 }, // (7b: it chases intruders off its flags)
    space: 1.2, territory: 1.3, aggression: 0.2, // (at 1.4, once the rivals read knocked food and digging beetles, it won 27 / 37%)
    food: 5, eat: 70, pellet: 1.2, foodRange: 30,
    margin: 5, headRisk: 700, zoneRisk: 120,
    colony: { radius: 4, max: 3, every: 12000 }, goal: 4,
    hunt: { squeeze: 2, chase: 5, lead: 3 },
  },
};

// Plant a flag where it starts, then every so often travel to the open
// spot furthest from rivals and plant another (oldest flag goes when it
// has too many). Anyone near any flag gets hunted. A flag the
// woodpecker pecks out falls into the pit: that colony is lost, land
// and all, and it sets off to plant another.
DRIVERS.colonist = function () {
  const col = intent.w.colony;
  const clamp = v => Math.min(N - 2, Math.max(1, v));
  // (n: which colony it is, first, second, ...: each flies its own flag.)
  memory.colonies ||= [{ x: clamp(myHead.x), y: clamp(myHead.y), radius: col.radius, n: 1 }];
  if (memory.colonies.some(c => pit(c.x, c.y))) {
    memory.colonies = memory.colonies.filter(c => !pit(c.x, c.y));
    if (!memory.site) memory.nextSiteAt = view.timeMs;
  }
  if (memory.site && pit(memory.site.x, memory.site.y)) { memory.site = null; memory.nextSiteAt = view.timeMs; } // (and where it was going, another)
  if (memory.site && manhattan(myHead, memory.site) <= 1) {
    memory.planted = (memory.planted || 0) + 1;
    memory.colonies.push({ ...memory.site, radius: col.radius, n: memory.planted + 1 });
    if (memory.colonies.length > col.max) memory.colonies.shift();
    memory.site = null;
    memory.nextSiteAt = view.timeMs + col.every;
  }
  memory.nextSiteAt ??= view.timeMs + col.every;
  if (!memory.site && view.timeMs >= memory.nextSiteAt) {
    let best = null, bestScore = -Infinity;
    for (let y = 2; y < N - 2; y += 2) {
      for (let x = 2; x < N - 2; x += 2) {
        if (holes.has(y * N + x) || otherFree[y * N + x]) continue;
        if (memory.colonies.some(c => Math.hypot(c.x - x, c.y - y) < c.radius * 2)) continue;
        const p = { x, y };
        const away = Math.min(DISTANCE_CAP, ...heads.map(h => manhattan(h, p)));
        const s = away - 0.4 * manhattan(myHead, p);
        if (s > bestScore) { bestScore = s; best = p; }
      }
    }
    memory.site = best;
    if (!best) memory.nextSiteAt = view.timeMs + col.every;
  }
  const intruders = all.filter(k => memory.colonies.some(c => onOwnLand(heads[k], c)));
  if (intruders.length) pickVictim(intruders, intent.w.hunt);
  else {
    memory.victimId = null;
    intent.goal = memory.site;
  }
};
