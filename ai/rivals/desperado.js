// Desperado: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.desperado = {
  name: 'Desperado', color: '#ea580c', look: 'desperado',
  blurb: 'Skims edges, bodies and heads for the thrill of it. Yeehaw.',
  kill: ['Desperado drew first.', 'Another notch on the six-shooter.', 'Every showdown has a loser.'],
  win: ['Rides off into the sunset.', 'Last snake in town.', 'Not a scratch on the hat.'],
  w: {
    space: 1, territory: 0.6,
    food: 6, eat: 80, pellet: 1.5, foodRange: 40,
    margin: 5, headRisk: 600, zoneRisk: 40, thrill: 25, leapNow: 0.6, landing: 1.2, // (a leap now out of a trap, cheaper still; a flier's ring for the thrill of it)
    nerve: { base: 0.7 }, // (it'll stare down a rival's head for an apple)
  },
};
