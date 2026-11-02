// Star: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.star = {
  name: 'Star', color: '#eab308', look: 'star', // (a rainbow body behind a sunflower star; sunflower stands in for it in text)
  blurb: 'Jumps and dashes every chance it gets. Catch it when it dims.',
  kill: ['Star was there in a flash.', 'Back in its day, that was just the warm-up.', 'Make a wish.'],
  win: ['Not bad for an old-timer.', 'Never once sat still.', 'One more dash, for the road.'],
  w: {
    space: 1, territory: 1.2, // (at 0.6 it won 23%, in every round of 800; at 1.2, 26.5%, and 28.4% once its jumps kept clear of heads and its golden dashes weren't thrown away)
    food: 5, eat: 70, pellet: 1.2, foodRange: 40,
    margin: 4, headRisk: 700, zoneRisk: 100,
    // Its powers are free to it, unless one ends where a rival could
    // strike (half a head's risk: in reach of its powers, or nearer), or
    // it's a golden dash just for speed: it flashes over four times as
    // often as anyone, and jumps ten times as often.
    powers: { price: 0, risk: 350, everyWay: true, jumpAny: true, dashSpend: true },
    golden: { power: 6, apple: 1.5, contested: 0.5 }, // (it eats about twice as much golden power food as anyone)
  },
};
