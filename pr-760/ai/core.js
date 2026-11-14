// AI brain for the rival snakes.
//
// Fairness: an AI sees the *other* snakes as they were `age` ticks ago (its
// reaction time; one far off a little more, as a person notices it, its
// timers counted on to `age`), so it can't respond to a sudden turn any faster than a
// human could. It treats the cells an opponent might have reached since then
// as risky. It always knows its own body exactly. It is never told which
// snake is the human: every rival is just a snake with an id.
//
// Cleverness: for every move sequence up to `depth` steps it scores the result
// with a timed flood fill (do I still have room? can I get onto my own trail
// and chase my tail? is the room I need only through a narrow neck that a
// rival could get to and shut? most often: am I pinned against the edge or a
// body, with one or two ways on a rival could come round to?), a Voronoi
// split of the board (whose territory is this?) and the food it can reach
// before anyone else.
//
// Personality: on top of that shared sense, each persona adds its own goal
// terms, and some have a "driver" that runs once per decision with a memory
// that lasts the whole round (who to hunt, where home is, current mood, ...).
//
// The AI is split into the files of ai/, by what they do, so a change reads
// a few small files instead of one big one. Like render/'s, they are plain
// scripts that share one scope: index.html loads them in the order below
// (sw.js lists them too), each sees every name the others declare, and the
// last, decide.js, makes window.SnakeAI. So a file may call anything from
// inside its functions, but what runs as it loads (a table, a constant
// worked out from another) may use only names from itself or the files
// before it. The scope is the page's, so every name at a file's top must be
// unique across all its scripts and no browser global (tools/scope-test.js
// checks both). decide() reads the board in parts, in turn (seeBoard,
// readRisk, ...); what a part works out for the rest it keeps in names
// declared beside it, set again for every decision.
//
//   core.js        directions, the rules' numbers, the search's constants, small helpers
//   rivals.js      the rivals' shared template: the weights, the defaults, hunting a victim
//   rivals/*.js    each rival (in the cast's order): its look, words and weights, and its driver if it has one
//   moods.js       Capricious's moods and Copycat's copies, and reading a snake's style
//   buffers.js     the scratch boards the search runs on, reused between decisions
//   room.js        the flood fills: a rival's reach, my room and its necks, the territory split
//   sight.js       the board as I see it: bodies, bridges, where heads are now, each snake's room
//   risk.js        where a rival could strike, how soon it could be anywhere, a flier's ring
//   portals.js     the portals: how long each stays open, a step through one, a rival coming out of one
//   spit.js        mushrooms: the shots I could take, and the ones I'd dodge
//   food.js        desperation, appetite, and what each thing on the board is worth to me
//   beetles.js     where beetles go, and catching them
//   evaluate.js    scoring a line of moves, and the board as a line leaves it
//   search.js      moving and searching ahead, and a move that looks fatal
//   powers.js      the powers weighed as moves (powerPick), and where one leaves me
//   flash.js       the flash and golden dashes: races, cuts
//   styles.js      each rival's power style: what it spends a plain power on readily
//   leaps.js       the jump and golden flights: where each comes down, a flier's ring, a landing that shuts a rival in
//   decide.js      decide(): its parts in turn, the best move, and window.SnakeAI
const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const DIR_LIST = Object.values(DIRS);

const TUNE = window.TUNING; // (the rules' numbers, so the AI's picture of them stays true)
const TRAPPED = 5000;
const NECK_COST = 2000;       // the room I need is through a gap a rival could get to and shut...
const DAWDLE = 8;        // ...even this many ticks after me (I don't always leave a pocket straight away)...
// ...and the gap right by my head: pinned against the edge or a body, with one
// or two ways on that a rival could come round to. This nearest case is
// most of what the neck test catches (nine in ten), and its allowance is
// the dial between fewer boxed-in deaths and longer rounds.
const PINNED_DAWDLE = 8;
// But a meal isn't a pin. A line that has just eaten is against the edge, a
// hole or a body (or in a corner) only because the food was there, and it
// leaves on its next move. So for MEAL_PLIES steps after eating, any neck's
// allowance is MEAL_DAWDLE: only a rival that could get to the gap about as
// soon as I could (a head that could cut me off) makes it a trap. (With 8,
// any rival within a dozen cells did: food by the edge was refused half the
// time, and snakes circled it.)
const MEAL_DAWDLE = 2, MEAL_PLIES = 3;
const HOLE = 1 << 30;    // "frees up" never
const DEAD = -1e6;
const EMPTY = new Set();
const NO_FIRE_SEEN = new Map(); // (the board the woodpecker's knock is worked out on: what I see of fire is among the holes)
const ROOM_CAP = 120;    // stop counting a rival's room past this
const DISTANCE_CAP = 14; // distance-keepers are happy once this far away
const PLAIN_GOLD = { power: 1, apple: 1 }; // (golden things worth what they're worth: no craving)
const NO_HABIT = { price: 1 };             // (powers at their price, used only when they pay)
const SHUT_FOOD = 2, FOOD_CUT = 12; // a rival's nearest food put FOOD_CUT moves or more further off by my landing, in apples (see shutIn)
const SHUT_IN = 4, SHUT_MOVES = 10; // a rival shut in by my flight's landing, all the room it gets to in SHUT_MOVES moves cut away, in apples (see shutIn)
const CUT_TAIL = 12;     // a cut rival's tail counts for at most this many segments (see flashOpt)
const KILL = 6;          // a rival put out, cut off at the neck or come down on my body, in apples (times 0.5 + my aggression: see flashOpt, cover)
const STAY = 0.8, LANDING = 0.6; // 2y: the share of a flier's moves it doesn't steer its ring away on; how much taking a landing is worth to me (w.landing) if my style doesn't say
const SPARE = 0.3;       // 2y: a held flight with no other safe landing left at its last turn, in apples against it (see spare)
// How much less a move counts the further on in the search it is: eating
// (a bonus for eating sooner), risk and turning, worked out once for the
// first STEPS_AHEAD steps (every move reads them).
const STEPS_AHEAD = 32;
// The endgame (2h): the length worth keeping over MIN_LENGTH by default (w.keep):
// a crash or two (CRASH_LOSS each; one at my smallest puts me out) and a hunger
// buffer (a segment every STARVE_EVERY_MS); and with ROOMY times my length of free
// log a snake or more, growing still costs nothing that matters (2h, see readAppetite).
const KEEP = 2 * TUNE.CRASH_LOSS + 4, ROOMY = 4;
const NERVE_MAX = 0.85; // (a persona's nerve never sets aside a threat whole: the odds still count)
const perStep = r => Float64Array.from({ length: STEPS_AHEAD }, (_, t) => Math.pow(r, t));
const SOONER = perStep(0.85), RISK_AHEAD = perStep(0.6), TURN_AHEAD = perStep(0.9);

const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const sameDir = (a, b) => a.x === b.x && a.y === b.y;
// The stream a decision draws from: the one the engine hands decide (each decision's own: mindOf in engine/luck.js), or
// Math.random for a caller that hands none.
const MATH_DRAW = () => Math.random();
let aiDraw = MATH_DRAW;
const rand = (a, b) => a + aiDraw() * (b - a);
// Land (Sovereign's realm, a colony): a cell whose centre is within the
// field's radius, and LAND_REACH, of its centre. (One rule everywhere: the
// AI, the chatter, the tags and the borders drawn.)
const onOwnLand = (c, f) => Math.hypot(c.x - f.x, c.y - f.y) <= f.radius + TUNE.LAND_REACH;
