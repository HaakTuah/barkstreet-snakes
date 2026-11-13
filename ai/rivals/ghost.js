// Ghost: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.ghost = {
  name: 'Ghost', color: '#f1f5f9', look: 'ghost',
  blurb: 'Keeps its distance from everyone, and slips through the gaps.',
  kill: ['Ghost? You never even saw it.', 'Ghost slipped through. You didn’t.', 'You felt a chill. Then nothing.'],
  win: ['Was it ever really here?', 'It never made a sound.'],
  w: {
    style: powerStyle({ keep: 2 }), // (7b: it keeps a flash ready to escape)
    space: 2, territory: 0.6,
    food: 3, eat: 30, pellet: 1, foodRange: 15, hungryBelow: 18, fedFactor: 0.4,
    keep: 7, // (2h: the most sparing in the endgame)
    margin: 6, headRisk: 900, zoneRisk: 150, distance: 5, spit: 0.2, leapNow: 0.8, // (a leap now out of a trap, a little cheaper) // (at 6, once the rivals read knocked food and digging beetles, it won 39 / 31%)
  },
};
