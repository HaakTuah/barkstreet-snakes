// Every number that controls how Bark & Bite plays and feels, in one place.
// Rules are read by engine.js (and by the headless simulator); feel and juice
// by snake.js and render.js. Times are in milliseconds unless noted.
window.TUNING = Object.freeze({
  // ------------------------------------------------------------- the board
  GRID: 24,                 // cells per side
  OPPONENTS: 3,             // AI rivals in a normal round (an AI-only round has one more)

  // ------------------------------------------------------------------ food
  APPLES: 3,                // green apples on the board at all times (+1)
  MUSHROOMS: 2,             // red mushrooms on the board at all times
  MUSHROOM_TICKS: 180,      // a mushroom withers (and regrows elsewhere) after this many ticks
  GOLDEN_CHANCE: 0.004,     // chance per tick of a golden apple, while there is none
  GOLDEN_TICKS: 120,        // a golden apple rots after this many ticks
  GOLDEN_GROWTH: 3,         // a golden apple is worth this much
  BEETLE_FIRST_MS: 15000,   // beetles start coming out after this long...
  BEETLE_CHANCE: 0.006,     // ...with this chance per tick, while there is none (and no woodpecker)
  BEETLE_TICKS: 260,        // a beetle nobody catches flies off after this many ticks
  BEETLE_EVERY: 3,          // it crawls one cell every this many ticks...
  BEETLE_SCARED_EVERY: 1,   // ...or every tick, as fast as a snake, bolting from a head...
  BEETLE_FEAR: 2,           // ...within this many cells (so you catch one by cutting it off)
  BEETLE_GROWTH: 2,         // a beetle is worth this much
  SHRINK: 3,                // a mushroom takes this many segments off...
  MIN_LENGTH: 3,            // ...but never below this

  // ---------------------------------------------------------------- hunger
  HUNGER_MS: 20000,         // this long without food (mushrooms don't count) and you start shrinking
  STARVE_EVERY_MS: 1500,    // ...one segment this often, starving at MIN_LENGTH
  HUNGER_WARN_MS: 6000,     // warn you when this much time is left

  // ----------------------------------------------------------------- speed
  OPENING_TICK: 170,        // the first ticks of a round are slower, so the start is forgiving...
  OPENING_TICKS: 3,         // ...for this many ticks, easing down to START_TICK
  START_TICK: 120,          // ms per tick once the round is underway
  MIN_TICK: 90,             // the fastest it ever gets...
  RAMP_MS: 120000,          // ...reached after this much game time (a gentle 25% speed-up)
  MUSIC_MID_MS: 45000,      // the soundtrack picks up (shaker, faster) after this much game time

  // ---------------------------------------------------------- sudden death
  SUDDEN_DEATH_MS: 120000,  // the woodpecker arrives after two minutes; no new food after that
  PECK_EVERY: 2,            // ticks between holes once it's here

  // --------------------------------------------------------------------- AI
  REACTION_MS: 240,         // how stale every AI's view of the other snakes is
  HISTORY: 8,               // board snapshots kept for that delay

  // ------------------------------------------------------------- the round
  COUNTDOWN_BEAT: 350,      // 3, 2, 1: each beat this long (any direction skips it)
  DEATH_FREEZE: 350,        // freeze-frame when you die, before the card rises
  ROUND_END_PAUSE: 600,     // let the last moment breathe before the round-over card

  // ----------------------------------------------------------------- input
  QUEUE: 3,                 // turns you can queue ahead
  SWIPE_CELLS: 0.5,         // a swipe registers after the finger travels this many cells

  // ------------------------------------------------------------------ juice
  PARTICLES_EAT: 10,        // particles in an eating pop
  PARTICLES_DEATH: 26,      // particles when a snake dies
  PARTICLE_LIFE: 520,       // how long a particle lives
  SHAKE_PX: 4,              // board shake when you die (none with reduced motion)
  SHAKE_MS: 220,
  BLINK_MIN: 2600,          // snakes blink every BLINK_MIN..BLINK_MAX ms...
  BLINK_MAX: 6000,
  BLINK_MS: 130,            // ...for this long
  TONGUE_EVERY: 2800,       // your snake flicks its tongue about this often (more near food)
  TONGUE_MS: 260,
  GLANCE_EASE: 0.18,        // how quickly eyes turn toward what a snake is looking at (per frame, 0..1)
  GULP: 0.2,                // a bite's bulge travelling down the body (cells added to the radius)...
  GULP_LENGTH: 1.3,         // ...and how many segments it spans
  GOBBLE: 0.34,             // Gobbler wolfs it down: a bigger, longer gulp
  GOBBLE_LENGTH: 2,
  BITE_MS: 240,             // the head's little squash at the moment of a bite
  CHEW_MS: 420,             // and the mouth's chewing after it
});
