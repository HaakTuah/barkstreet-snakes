// The rivals' shared template: what each weight means, the defaults every
// rival starts from, the habits several share (DRAB, HUNT), and choosing a
// victim to hunt. Each rival's own part is in ai/rivals/, in the cast's
// order: its PERSONAS entry and, for some, its DRIVERS entry (run once a
// decision, with a memory that lasts the round).

// Weights (w), all optional unless noted:
//   space, territory, aggression  room / board share / shrinking everyone else
//   food, eat, pellet, foodRange  pull per step toward food, eating bonus, pellet worth, reach (required)
//   normalFood                    worth of a green apple (default 1); a golden apple is worth 3x
//   mushroom                      worth of a mushroom, which shrinks you (default and at most -SHRINK: it costs that many apples' worth of length)
//   contested                     how much food a rival reaches first still counts (0-1, true = 1; hunger raises it)
//   hungryBelow, fedFactor        at this length or more, food matters only fedFactor as much
//   keep                          in the endgame (from the woodpecker on), the length worth keeping over
//                                   MIN_LENGTH, a crash and hunger buffer (default KEEP); beyond it a meal is
//                                   worth only the hunger it stops (2h, see readAppetite)
//   drop                          when I drop my own tail with a flash: 'late' only when every crawl
//                                   crashes; 'ready' once the search sees me boxed in, all round (default:
//                                   so in the endgame, before that only when every crawl crashes; 2h)
//   margin, headRisk, zoneRisk    spare room wanted / fear of a rival's next move / of where it might be (required)
//   nerve                         { base, hungry }: at a cell with food on it, how much of a rival's
//                                   threat (headRisk and zoneRisk as read there) I set aside (0-1):
//                                   base, and hungry more for every share of my hunger clock gone
//                                   since I last ate (the maps stay as they are; only what I'd
//                                   stake on the apple changes)
//   distance                      reward per step of distance from the nearest rival head
//   hunt                          { squeeze, chase, lead }: shrink the victim's room, get in front of it
//   home                          { radius, leave, grow, max, drift }: stay near a home circle (radius
//                                   at the start, a cell more for every `grow` segments, up to `max`;
//                                   it drifts off lost land every `drift` ticks), hunt intruders
//   lure                          { weight, dist }: hover about `dist` from a chosen snake's head
//   turn                          penalty for every change of direction
//   tail                          reward for riding just behind a rival's tail
//   mimic                         bonus for moving the way the model snake moves
//   colony, goal                  { radius, max, every }: plant and defend flags; pull per step toward the next site
//   thrill                        reward for every wall, body or rival head right next to me
//   coil                          { weight, from }: from this length on, reward for keeping my head
//                                   close behind my own tail, so I move as a ring
//   thick                         reward for each cell of my own body beside my head (not my neck):
//                                   a wall two thick can't be hopped
//   leapNow                       what a leap now (only out of a trap) costs me, as a share of the jump's
//                                   price (round six B; default 1)
//   landing                       how much putting a flier out by lying on its ring is worth to me
//                                   (2y; default 0.6, times 0.5 + my aggression, see ringCover)
//   spit                          how much a shot with a mushroom is worth to me, when I weigh eating
//                                   one on purpose (round six B; default SPIT)
//   aim                           how hard I work to land one I've got in my cheek: getting in line with a
//                                   head and leading it (3b+; default 1)
//   powers                        { price, risk, everyWay, jumpAny, dashSpend, keepFlash }: a power habit (see
//                                   powerPick). price: what every power costs me, as a share of what it
//                                   costs anyone else, wherever it ends with no more risk than `risk`
//                                   (beyond that, the full price); everyWay: the flash weighed every way,
//                                   not just the way I'd crawl; jumpAny: the plain jump over any hurdle
//                                   with somewhere free to land that no rival could reach first, not
//                                   just out of a crash or onto food; dashSpend: golden dashes spent on
//                                   speed too (at the full price), and not kept for a trap (or a cut
//                                   that puts a rival out) as everyone else's; keepFlash: the reserve
//                                   I keep is a flash's worth, for flashes, and a jump that leaves less
//                                   costs this share of the wait it costs anyone (2u)
//   golden                        { power, apple, contested }: golden power food (golden beetles, leaves,
//                                   golden mushrooms) worth this many times what it's worth to anyone
//                                   else, and a golden apple this many; contested: how much golden power
//                                   food a rival reaches first still counts (0-1)
//   style                         my power style (part 7b): { race, cut, chase, bead, tail, skim, swerve,
//                                   wall: the share of a plain flash's spend I pay for one that does
//                                   that; keep: my wait below the reserve times this; coil: a jump over
//                                   my own body for its own sake } (see ai/styles.js)
//   hurry                         how much a move longer to catch a beetle counts against it (default
//                                   BUG_HURRY: lower, it keeps after a beetle on the run longer)
const DRAB = {
  space: 1.2, territory: 1.5, aggression: 0.3,
  food: 5, eat: 80, pellet: 1.2, foodRange: 60,
  margin: 8, headRisk: 700, zoneRisk: 150, spit: 0.05, leapNow: 4, // (hardly ever a mushroom on purpose; a leap now out of a trap, at four times the price)
};
const HUNT = { squeeze: 2.5, chase: 6, lead: 4 };

// Each persona: name, color, look (how it's drawn), driver (stateful
// behaviour, optional), weights, and flavor text: a blurb for the start
// screen, and a few lines each for when it kills you and when it wins
// (taken in turn, never the same twice running).
const PERSONAS = {}; // (each rival puts its own in: ai/rivals/)
const DRIVERS = {};  // (the drivers by name, likewise)

// A persona's weights as one shape, whoever's they are: every weight above,
// in this order, and a weight it hasn't got undefined, as it would read
// anyway (a new one, not listed here, still reads true, just slower). The
// compiled search reads each the same way every time, instead of learning
// a new shape with every persona it meets, and starting over.
const WEIGHTS = {
  space: undefined, territory: undefined, aggression: undefined,
  food: undefined, eat: undefined, pellet: undefined, foodRange: undefined, normalFood: undefined, mushroom: undefined,
  contested: undefined, hungryBelow: undefined, fedFactor: undefined, keep: undefined, drop: undefined,
  margin: undefined, headRisk: undefined, zoneRisk: undefined, nerve: undefined, distance: undefined,
  hunt: undefined, home: undefined, lure: undefined, turn: undefined, tail: undefined, mimic: undefined,
  colony: undefined, goal: undefined, thrill: undefined, coil: undefined, thick: undefined, powers: undefined, golden: undefined, hurry: undefined,
  spit: undefined, leapNow: undefined, landing: undefined, style: undefined,
};
const weighed = w => Object.assign({ ...WEIGHTS }, w);

// Choose the rival I have the best shot at: little room, I can get in
// front of it quickly, and long (more pellets). Stick with the current
// victim unless another is clearly better.
function pickVictim(candidates, hunt) {
  if (!candidates.length) { memory.victimId = null; return; }
  body0ToOwnFree(me.body, me.body.length, 0);
  let best = -1, bestScore = Infinity, currentScore = Infinity;
  for (const k of candidates) {
    const tgt = targetOf(k, hunt.lead);
    const s = manhattan(myHead, tgt) + roomOf(k) / 6 - others[k].body.length / 4;
    if (s < bestScore) { bestScore = s; best = k; }
    if (others[k].id === memory.victimId) currentScore = s;
  }
  clearOwnFree(me.body, me.body.length);
  const current = indexOf(memory.victimId);
  const k = current >= 0 && candidates.includes(current) && currentScore <= bestScore + 5 ? current : best;
  memory.victimId = others[k].id;
  intent.victim = k;
  intent.target = targetOf(k, hunt.lead);
}

function targetOf(k, lead) {
  const o = others[k], d = o.dir, h = heads[k];
  if (o.air - age > 1 && o.land >= 0) return { x: o.land % N, y: (o.land - o.land % N) / N }; // (up in the air: where its ring is, the one place it'll certainly be)
  return {
    x: Math.min(N - 1, Math.max(0, h.x + d.x * lead)),
    y: Math.min(N - 1, Math.max(0, h.y + d.y * lead)),
  };
}
