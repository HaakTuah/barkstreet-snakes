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
    // it's a golden dash just for speed: it flashes and jumps far more
    // often than anyone (how much: "Star" in 39-the-rivals.md). What it keeps is a
    // flash's worth of stamina: a jump that leaves less costs it the wait,
    // at keepFlash times what it costs anyone, so its jumps don't eat its
    // flashes. (At a tenth, they did the other way round: its jumps fell
    // to a quarter of its plain powers; at a hundredth both keep in band.)
    // Its flashes mind the wait below a jump's worth as anyone's do (7c:
    // free of it, it spent every flash and died boxed in its own coils,
    // with nothing left to jump or drop its tail: 12% of its rounds won).
    powers: { price: 0, risk: 350, everyWay: true, jumpAny: true, dashSpend: true, keepFlash: 0.01 },
    golden: { power: 6, apple: 1.5, contested: 0.5 }, // (it eats about twice as much golden power food as anyone)
  },
};
