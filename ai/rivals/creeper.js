// Creeper: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.creeper = {
  name: 'Creeper', color: '#0d9488', look: 'creeper',
  blurb: 'Sneaks up and rides right behind other snakes’ tails.',
  kill: ['Creeper was never far away.', 'You should have turned around.', 'It had been following you for ages.'],
  win: ['Quietly.', 'Nobody looked behind them.'],
  w: {
    style: { tail: 0.5 }, // (7b: it flashes in behind a tail)
    space: 1, territory: 0.5,
    food: 3, eat: 50, pellet: 1, foodRange: 30,
    margin: 5, headRisk: 900, zoneRisk: 150, tail: 45, drop: 'ready', // (2h: its tail dropped once it sees itself boxed in, all round)
  },
};
