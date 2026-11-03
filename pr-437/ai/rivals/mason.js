// Mason: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.mason = {
  name: 'Mason', color: '#ebe5d9', ink: '#8a8170', look: 'mason', // Caesar in marble (ink: his name, outline and tag, in stone)
  blurb: 'Walls off the board, then keeps the biggest piece.',
  kill: ['Mason had a spot picked out for you.', 'You were on the wrong side of the wall.', 'All roads led to Mason.'],
  win: ['Veni, vidi, Mason.', 'Winnus maximus.', 'Rome took longer.'],
  w: {
    space: 1.3, territory: 1.8,
    food: 3, eat: 40, pellet: 1, foodRange: 30,
    margin: 6, headRisk: 800, zoneRisk: 150, turn: 25, thick: 60, // (thick 45 before round six B: a plain flash cuts a wall one thick, so it lays them two thick)
  },
};
