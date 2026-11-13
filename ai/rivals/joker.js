// Joker: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.joker = {
  name: 'Joker', color: '#a21caf', look: 'joker', driver: 'joker',
  blurb: 'Lures chasers into dead ends and swerves away at the last moment.',
  kill: ['Joker led you on. You followed.', 'It swerved. You didn’t.', 'You fell for it. Everyone does.'],
  win: ['Who’s laughing now?', 'Thank you! It’s here all week.', 'And the last laugh.'],
  w: {
    style: { swerve: 0.5 }, // (7b: it springs its lure with a flash off its line)
    space: 1, territory: 0.6,
    food: 5, eat: 70, pellet: 1.2, foodRange: 40,
    margin: 6, headRisk: 600, zoneRisk: 40, turn: -12, // (at 4, once the rivals read knocked food and digging beetles, it won 12 / 18%: it wants a little more room behind its lures)
    lure: { weight: 6, dist: 3 }, hunt: { squeeze: 3, chase: 0, lead: 2 }, spit: 4, // (a mushroom for the laugh)
  },
};

// Get the attention of the nearest rival heading my way, stay just in
// front of it, and steer so its room shrinks behind me: bait it into a
// dead end it can't see coming.
DRIVERS.joker = function () {
  let best = -1, bestD = Infinity;
  for (const k of all) {
    const o = others[k], h = heads[k];
    const toMe = { x: myHead.x - h.x, y: myHead.y - h.y };
    const d = manhattan(h, myHead);
    const chasing = o.dir.x * toMe.x + o.dir.y * toMe.y > 0;
    const score = d - (chasing ? 4 : 0);
    if (score < bestD) { bestD = score; best = k; }
  }
  if (best < 0) return;
  intent.lure = best;
  intent.victim = best;
  intent.target = heads[best];
  memory.victimId = others[best].id;
};
