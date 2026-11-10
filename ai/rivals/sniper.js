// Sniper: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.sniper = {
  name: 'Sniper', color: '#b91c1c', look: 'sniper', driver: 'sniper',
  blurb: 'Picks whichever snake it has the best shot at and cuts it off.',
  kill: ['It had you lined up three moves ago.', 'You were the best shot it had.', 'It got in front of you. It always does.'],
  win: ['Nobody was safe.', 'Not a wasted move.', 'It never once blinked.'],
  w: {
    space: 1, territory: 0.8, aggression: 0.3,
    food: 6, eat: 80, pellet: 1.5, foodRange: 40, hungryBelow: 16, fedFactor: 0.3,
    margin: 10, headRisk: 600, zoneRisk: 80, thick: 15, hunt: HUNT, spit: 2.5, aim: 3, landing: 1.5, // (a mushroom for the head shot, and it lines that shot up; a flier's ring, the one place it'll certainly be)
  },
};

DRIVERS.sniper = function () { pickVictim(all, intent.w.hunt); };
