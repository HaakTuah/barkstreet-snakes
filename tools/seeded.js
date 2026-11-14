// mulberry32: a small, fast seeded random number generator, for the tools that play the game from a
// seed (the suites, the simulation, the A/B test, the AI bench). One definition, the game's own
// (engine/luck.js), so the same seed draws the same numbers everywhere and the fingerprints hold.
// Never change what it draws.
// seeded(seed)() gives the next number in [0, 1); .state() is where it has got to, and
// seeded(that) goes on from there.
const { MULBERRY, mulberry } = require('../engine/luck.js');
function seeded(seed) {
  let a = seed >>> 0;
  const next = () => mulberry(a = (a + MULBERRY) >>> 0);
  next.state = () => a;
  return next;
}

module.exports = seeded;
