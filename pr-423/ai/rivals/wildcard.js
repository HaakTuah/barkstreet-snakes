// Wildcard: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.wildcard = {
  name: 'Wildcard', color: '#b22234', look: 'wildcard', driver: 'wildcard', // (red, white and blue)
  blurb: 'A random mix of habits, new every round. Great hair.',
  kill: ['Nobody knows how, least of all Wildcard.', 'A total accident. It’s calling it genius.'],
  win: ['Tremendous. Nobody wins like this.', 'A landslide. The biggest ever.', 'Four more rounds!'],
  w: DRAB, // replaced by a random set on its first move
};

// Wildcard: a random but sensible set of weights, drawn once per round.
function randomWeights() {
  const chance = p => Math.random() < p;
  const w = {
    space: rand(0.8, 2), territory: rand(0.2, 1.8), aggression: rand(0, 0.5),
    food: rand(2, 12), eat: rand(30, 300), pellet: rand(1, 3), foodRange: Math.round(rand(15, 60)),
    contested: chance(0.4), margin: Math.round(rand(2, 10)),
    headRisk: rand(500, 1200), zoneRisk: rand(30, 400),
  };
  if (chance(0.4)) w.distance = rand(5, 25);
  if (chance(0.3)) w.turn = rand(5, 30);
  if (chance(0.3)) w.tail = rand(10, 40);
  if (chance(0.4)) w.hunt = HUNT;
  return w;
}

DRIVERS.wildcard = function () {
  memory.w ||= randomWeights();
  intent.w = memory.w;
  if (intent.w.hunt) pickVictim(all, intent.w.hunt);
};
