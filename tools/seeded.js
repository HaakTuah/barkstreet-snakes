// mulberry32: a small, fast seeded random number generator, for the tools that play the game from a
// seed (the suites, the simulation, the A/B test, the AI bench). One definition, so the same seed
// draws the same numbers everywhere and the fingerprints hold. Never change what it draws.
// seeded(seed)() gives the next number in [0, 1); .state() is where it has got to, and
// seeded(that) goes on from there.
function seeded(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.state = () => a;
  return next;
}

module.exports = seeded;
