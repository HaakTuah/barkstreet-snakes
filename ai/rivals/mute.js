// Mute: its look, its words and its weights (the template every rival shares: ai/rivals.js).

PERSONAS.mute = {
  name: 'Mute', color: '#a855f7', look: 'mute', driver: 'sniper', // (a rainbow; violet stands in for it in text)
  blurb: 'A mime. Picks someone and closes an invisible box round them.',
  kill: ['Mute had the last word. Silently.', '*taps on your invisible box*', '*lowers an invisible curtain*'],
  win: ['*takes a silent bow*', '*accepts an invisible bouquet*', '*lifts an invisible trophy*'],
  w: {
    style: powerStyle({ seal: 0.7 }), // (7b: it flashes to seal its box)
    space: 1.2, territory: 1.6, aggression: 1,
    food: 4, eat: 70, pellet: 1.2, foodRange: 40,
    margin: 6, headRisk: 700, zoneRisk: 120, thick: 15,
    hunt: { squeeze: 4, chase: 2, lead: 1 },
  },
};
