// The round's luck ("Same seed, same game"): every draw the rules make comes from the round's own stream (luck: game.rng,
// from game.seed), and each decision a rival makes from a stream of its own, seeded from the round, the tick and the
// snake (mindOf, handed to decide). So neither the order the rivals think in, nor whether one thought ahead, nor what the
// drawing, the chatter and the room codes draw (Math.random: unseeded in the page) changes the game (#729). The seed is
// the round's own, or one drawn from Math.random when createGame is given none. The generator is mulberry32, defined
// here once: the tools' seeded draws (tools/seeded.js) read it from this file too.
const MULBERRY = 0x6d2b79f5;
function mulberry(a) { // (a: the stream's state, moved on by MULBERRY)
  let t = Math.imul(a ^ (a >>> 15), a | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function luck(game) { return mulberry(game.rng = (game.rng + MULBERRY) >>> 0); } // (game: anything holding a stream's state as rng)
function mindOf(game, s) {
  let a = Math.imul(game.seed ^ Math.imul(game.tick + 1, 0x9e3779b1) ^ Math.imul(s.id + 1, 0x85ebca6b), 0xc2b2ae35) >>> 0;
  return () => mulberry(a = (a + MULBERRY) >>> 0);
}
const between = (game, a, b) => a + luck(game) * (b - a);
if (typeof module === 'object') module.exports = { MULBERRY, mulberry }; // (for tools/seeded.js: in the page and the tools' contexts, nothing)
