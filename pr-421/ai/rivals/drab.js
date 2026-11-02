// Drab: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.drab = {
  name: 'Drab', color: '#c8bf94', look: 'drab',
  blurb: 'Plays it safe and sensible. Nothing special.',
  kill: ['You lost to Drab. Drab!', 'Drab didn’t mean anything by it.', 'Beaten by beige.'],
  win: ['Somehow.', 'Mildly pleased.', 'It says it was fine.'],
  w: { ...DRAB, landing: 0.15 }, // (a flier's ring hardly ever)
};
