// Ouroboros: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.ouroboros = {
  name: 'Ouroboros', color: '#b8860b', look: 'ouroboros',
  blurb: 'Chases its own tail, then moves as a ring. Mind the middle.',
  kill: ['Ouroboros came full circle.', 'What goes around came around.', 'First its own tail. Then you.'],
  win: ['And round again.', 'It’s won this one before.'],
  w: {
    style: powerStyle({ coil: true }), // (7b: it jumps its own coils)
    space: 1.0, territory: 0.6, aggression: 0.2,
    food: 3, eat: 45, pellet: 1.2, foodRange: 40,
    margin: 3, headRisk: 800, zoneRisk: 150,
    coil: { weight: 20, from: 10 }, // (7b: its tail dropped as anyone's, once boxed in in the endgame, its style; 2h had it only when every crawl crashes)
  },
};
