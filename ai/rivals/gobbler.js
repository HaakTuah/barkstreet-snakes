// Gobbler: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.gobbler = {
  name: 'Gobbler', color: '#fb923c', look: 'gobbler',
  blurb: 'Eats everything, even a rival’s apple. Hates mushrooms.',
  kill: ['Gobbler didn’t even stop chewing.', 'It burped. That was the eulogy.', 'Gobbler was thinking about apples. It always is.'],
  win: ['And it’s still hungry.', 'Not a crumb left.', 'Now, about pudding.'],
  w: {
    space: 1.6, territory: 0.2,
    food: 10, eat: 300, pellet: 3, foodRange: 60, contested: 1, mushroom: -6, // (twice what a mushroom costs anyone else: it hates them)
    hurry: 1.5, // (beetles are its food too: it keeps after one on the run longer than anyone. With two apples on the log, and rivals that read a beetle's dig, it won 16 / 15% at the usual 2; at 1.5, 20 / 26%)
    margin: 10, headRisk: 2200, zoneRisk: 700, // greedy (a rival's apple too), but it flinches from heads and wants room (it used to win only 8%; at 1500 and 500, 12-17%)
    keep: 24, // (2h: in the endgame the greediest still, its food share its trademark)
    nerve: { base: 0.5, hungry: 0.7 }, // (...except over an apple, even fed (2b: 0.3 before), the less the longer since its last meal)
  },
};
