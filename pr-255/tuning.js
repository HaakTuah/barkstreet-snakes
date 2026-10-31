// Every number that controls how Barkstreet Snakes plays and feels, in one place.
// Rules are read by engine.js (and by the headless simulator); feel and juice
// by game/ and render/. Times are in milliseconds unless noted.
window.TUNING = Object.freeze({
  // ------------------------------------------------------------- the board
  GRID: 24,                 // cells per side
  OPPONENTS: 3,             // AI rivals in a normal round (an AI-only round has one more)

  // ------------------------------------------------------------------ food
  APPLES: 2,                // green apples on the board at all times (eaten or rotted, another drops somewhere): two since round six A, with beetles carrying more of the food (three was "a bit too plentiful")
  APPLE_TICKS: 110,         // an apple rots away after about this many ticks (give or take a quarter: about 8-16 s), and another drops somewhere
  MUSHROOMS: 2,             // red mushrooms on the board at all times
  MUSHROOM_TICKS: 180,      // a mushroom withers (and regrows elsewhere) after this many ticks
  GOLDEN_CHANCE: 0.004,     // chance per tick of a golden apple, while there is none
  GOLDEN_TICKS: 120,        // a golden apple rots after this many ticks
  GOLDEN_GROWTH: 3,         // a golden apple is worth this much
  BEETLE_FIRST_MS: 15000,   // beetles start coming out after this long...
  BEETLE_CHANCE: 0.008,     // ...with this chance per tick, while fewer than BEETLE_MAX are out (and once the woodpecker's here too): about three times as many as before round six A (at 0.012, once the rivals hunted well, snakes grew 8% more a minute than with three apples)...
  BEETLE_MAX: 2,            // ...beetles out at once, above ground or under
  BEETLE_TICKS: 260,        // a beetle nobody catches flies off after this many ticks
  PELLET_TICKS: 150,        // body food (beads) rots after about this many ticks (give or take a quarter)...
  PELLET_COOKED: 1.5,       // ...roasted beads last this many times as long
  CORPSE_EVERY: 2,          // a dead snake leaves a bead on every this-many segments (at least MIN_LENGTH of them); crash drops and cut tails stay whole
  SHROOM_GAP: 2,            // mushrooms never sprout this close to a head (nobody could see one appear in front of them in time)
  BEETLE_EVERY: 3,          // it crawls one cell every this many ticks...
  BEETLE_SCARED_EVERY: 2,   // ...or every 2, scurrying away (half a snake's speed: a chase you can win)...
  BEETLE_FEAR: 6,           // ...from any head within this many cells (4 until the dig became a race: one that runs sooner reaches its burrow more often)
  BEETLE_HOME_REACH: 7,     // a scared beetle runs for a burrow nearer than this...
  BEETLE_DIG_FEAR: 6,       // ...and one with a head this near and no burrow in reach digs in where it is...
  BEETLE_DIG: 6,            // ...taking this many ticks (it stays put, and can still be caught), then it's underground, as after a dive. A race you can win: never fewer than BEETLE_DIG_FEAR, so a head coming straight at it from where the dig starts gets there on its last tick (5 ticks from a head within 7, nobody coming at one ever did)
  BEETLE_GROWTH: 2,         // a beetle is worth this much
  // Powers. Everyone can jump and flash, two separate presses (Space or a
  // tap; E, Shift or a swipe the way you're going). A jump hops islands: up
  // over what's right in front (a body, a hole or fire) and up to
  // LEAP_REACH cells of it, a cell a tick, landing on the first free cell
  // beyond, for the tip of your tail; then it needs a moment. A flash goes FLASH_LENGTH
  // cells in one tick along the ground, free, then rests. Round six B: a
  // flash cuts through a body FLASH_THICK thick (a dash, DASH_THICK) with
  // free log beyond (anyone's, your own too: the part behind the cut falls
  // to beads; fewer than MIN_LENGTH left in front of it, and it's out), and
  // a flash that runs into what it can't get through has failed.
  LEAP_COST: 1,             // a leap costs this many segments off the tail (and needs more than MIN_LENGTH)...
  LEAP_COOLDOWN_MS: 4000,   // ...and can't be done again for this long
  LEAP_WINDOW: 5,           // a jump pressed for waits this many ticks for something right in front to hop, and somewhere to land within reach (so a press made with a hurdle 4 or 5 cells ahead still goes; 3 before round six B), for rivals too
  LEAP_REACH: 3,            // round six B, the island hop: a jump goes over up to this many cells of anything it hops (bodies, holes, fire; one before), a cell a tick in the air, and comes down on the first free cell beyond: over three, it's up three ticks and lands on the fourth
  FLASH_LENGTH: 2,          // a flash: this many cells in one tick, along the ground (it eats on the way, cuts a body one thick with free log beyond, and puts out the first fire it passes)...
  FLASH_COST: 0,            // ...for this many segments off the tail (free: a cost made rounds longer and starved snakes, in simulation)...
  FLASH_COOLDOWN_MS: 12000, // ...and then it rests this long (6 s before it cut: round six B wants 10 to 12 s; at 11, rivals cut 10 times a round)
  FLASH_THICK: 1,           // a flash cuts through a body this many cells thick, a dash DASH_THICK; with nothing free beyond, or thicker, or a head, it fails
  FAIL_LOSS: 5,             // a failed flash (into the edge, a hole, a head, a body it can't cut) costs this many segments off the tail, not CRASH_LOSS...
  FAIL_STUN_TICKS: 6,       // ...and stuns this long, not STUN_TICKS (a golden one into the edge or a hole still blows up)
  GOLD_BEETLE_CHANCE: 0.16, // a beetle coming out is a golden one this often (about two golden beetles a round, as many as with more beetles at 0.12): catch it for golden jumps (the same island hop, free)...
  LEAP_CHARGES: 2,          // ...this many (up to LEAP_MAX held at once)
  LEAP_MAX: 3,
  LEAF_CHANCE: 0.25,        // wind: each gust might blow a golden leaf onto the log (one at a time): dashes...
  LEAF_TICKS: 90,           // ...it blows away after this many ticks
  DASH_CHARGES: 2,          // ...this many (up to DASH_MAX held): golden flashes, three cells in one tick, cutting through a body up to DASH_THICK thick and putting out every fire (the edge or a hole: you blow up)
  DASH_MAX: 3,
  DASH_LENGTH: 3,
  DASH_THICK: 2,
  GOLDCAP_CHANCE: 0.55,     // rain: once in a while a golden mushroom comes up (one a spell, at most)...
  GOLDCAP_TICKS: 120,       // ...and withers after this many ticks
  WRAP_MS: 12000,           // ...eat it, and for this long the edges wrap round (off one side, in at the other); another adds as much again...
  WRAP_MAX_MS: 20000,       // ...up to this much in all
  SHRINK: 3,                // a mushroom takes this many segments off the first time...
  MIN_LENGTH: 3,            // ...but never below this
  // Round six B: a mushroom comes back up. Swallowed, it sits in the cheek
  // (the mouth full: nothing else is eaten) for CHEEK_TICKS, then it's spat
  // SPIT_REACH cells ahead of the head, over anything between, a shade
  // stronger: one segment more each time it comes back up, to SHRINK_MAX.
  CHEEK_TICKS: 9,           // about a second: the ring 3 ahead shows where it'll land, for anyone to dodge
  SPIT_REACH: 3,
  SHRINK_MAX: 5,
  SPIT_WILT_MIN: 20,        // a spat mushroom wilts in half the time it had left, but lies at least this many ticks
  START_LENGTH: 4,          // every snake starts this long: one more than the least, so a first crash costs a segment, not the round

  // --------------------------------------------------------------- crashes
  // A crash (into the edge, a hole, a body, or head-on) isn't the end: your
  // head bounces back, the tail breaks off as food, and you're stunned a
  // moment. You're out if you crash at MIN_LENGTH, or with nowhere to turn.
  CRASH_LOSS: 3,            // segments a crash knocks off your tail (never below MIN_LENGTH)...
  STUN_TICKS: 4,            // ...and how long it stuns you (you can steer meanwhile)

  // ---------------------------------------------------------- fire and food
  BURN_TICKS: 18,           // crawl into fire and you burn this long (3 segments: like a crash, but you keep moving)...
  BURN_EVERY: 6,            // ...losing a segment this often (out, at MIN_LENGTH)...
  BURN_RAIN_TICKS: 6,       // ...though rain or snow puts you out within this many ticks
  COOK_TICKS: 18,           // food in the fire bakes after burning this long (a baked apple, a roast)...
  ASH_TICKS: 45,            // ...and goes to ash after this long
  COOKED_GROWTH: 2,         // baked food is worth this much

  // ---------------------------------------------------------------- hunger
  HUNGER_MS: 20000,         // this long without food (mushrooms don't count) and you start shrinking, in the opening and once the woodpecker's here...
  HUNGER_MID_MS: 12000,     // ...but a meal between HUNGER_MID_FROM_MS and then keeps you only this long (with 20 s, a snake was hungry 3% of the time before 2:00; with 13, 9%; once the rivals hunted well, 8% with 13 and about 10% with 12)
  HUNGER_MID_FROM_MS: 45000,
  STARVE_EVERY_MS: 1500,    // ...one segment this often, starving at MIN_LENGTH
  HUNGER_WARN_MS: 6000,     // warn you when this much time is left (half again as early at your smallest)
  BANNER_BASE_MS: 1000,     // a banner is held for its reading time, read in glances while you steer: this...
  BANNER_WORD_MS: 400,      // ...and this a word...
  BANNER_MAX_MS: 4500,      // ...up to this (9 words or more); nothing cuts it short but a card
  BANNER_FADE_MS: 240,      // its time up, it fades out over this long...
  BANNER_BREATHE_MS: 500,   // ...and the next one waiting comes up this long after that
  LESSON_WAIT_MS: 6000,     // a lesson waits its turn this long at most, in the round's time (behind one banner, never two: by then its moment has passed); round news and the weather wait as long as it takes
  BANNER_MIN_FONT: 0.8,     // on a phone held upright a banner is one line over the title row: its words shrink to fit, to this much of their size at the least
  NOTE_FIND_MS: 1000,       // a rival's note as a banner (asked for from its tag while you watch): up as long as it takes to find and read,
  NOTE_CHAR_MS: 55,         // ...this much a character (about 200 words a minute)...
  NOTE_MIN_MS: 3500,        // ...but no less than this
  NOTE_MAX_MS: 9000,        // ...nor more (its longest, with the most powers held, is 143 characters: 8.9 s)
  WRAP_WARN_MS: 2000,       // the edges' wrap: a warning, and the glow fading, this long before it ends
  LEAP_SWELL: 0.38,         // in the air, the head swells this much at the top of a leap (seen from above, rising is coming toward you)...
  LEAP_SWELL_GOLD: 0.5,     // ...and a golden leap's, this much
  STREAK_MS: 340,           // a dash's speed lines fade over this long
  DRAW_LEAD_MS: 60,         // the board is drawn this far ahead (drawing only: the cell your head is drawn in is the cell your press turns at)...
  DRAW_LEAD_MAX: 0.5,       // ...but never more than half a tick (45 ms at full speed): any more, and late in a tick your head was drawn in the next cell while a press still turned it at this one, and it was pulled back
  FACE_EASE_MS: 60,         // your own face turns toward a new heading over about this long (rivals keep the steady line)

  // ----------------------------------------------------------------- speed
  OPENING_TICK: 170,        // the first ticks of a round are slower, so the start is forgiving...
  OPENING_TICKS: 3,         // ...for this many ticks, easing down to START_TICK
  START_TICK: 120,          // ms per tick once the round is underway
  MIN_TICK: 90,             // the fastest it ever gets...
  RAMP_MS: 120000,          // ...reached after this much game time (a gentle speed-up: about a third faster)
  MUSIC_MID_MS: 45000,      // the soundtrack picks up (shaker, faster) after this much game time

  // ---------------------------------------------------------- sudden death
  SUDDEN_DEATH_MS: 120000,  // the woodpecker arrives after two minutes; nothing new grows after that but the last apples (SD_APPLE_GAP), though beetles still come out
  PECK_ARRIVE_TICKS: 12,    // it lands, has a look round...
  PECK_CHUNK: 12,           // ...then takes out a patch of this many cells somewhere on the log...
  PECK_AIM_TICKS: 17,       // ...eyeing it this long first (everyone sees where: about a second and a half)...
  PECK_PROMISE_TICKS: 5,    // ...and this many moves before it strikes, where the food in its mark will land is a promise (the rings stop moving; on the tick before, a ring could still hop in the last 0.2 s)
  PECK_REST_TICKS: 30,      // ...and resting this long after its first strike (about 3 s)...
  PECK_HUNGRIER: 0.85,      // ...but it gets hungrier: each rest this much of the one before (down to PECK_REST_MIN)...
  PECK_REST_MIN: 10,
  PECK_CHUNK_MAX: 20,       // ...and each patch a cell bigger than the last (up to this): fewer, rounder holes fill the log as fast as the old 9 to 16 with longer rests
  PECK_CLEARANCE: 4,        // it aims more than this far from every head (nobody can be in a fresh mark before they can see it), and never shuts anyone in, while there's such a spot; food in the mark is knocked aside at the strike
  PECK_NO_ORPHANS: 2,       // a patch that would cut off an island of this many cells or fewer takes them too (unless a snake's on one: then another patch)
  PECK_UNDER_BODY: 0.33,    // this share of strikes starts under a body (a body lying over a fresh hole bridges it; only a head falls in)
  PECK_WIDEN: 0.5,          // this share widens an old hollow (fewer, bigger hollows)
  SD_APPLE_GAP: 20,         // sudden death: with no apple on the board, the next falls this many ticks after the last went, times its number (about 2 s, 4 s, 6 s...)

  // --------------------------------------------------------------- burrows
  BURROW_MAX: 3,            // beetle burrows that crack open in the bark over a round (harmless to cross)
  BURROW_NEW_CHANCE: 0.5,   // a beetle coming out opens a new burrow this often (always, if none is free)
  BURROW_FROM_DIG: true,    // a beetle's dig leaves a burrow where it dug, counting toward BURROW_MAX (at the most, the one unused longest closes over to make room): the burrows follow the hunting (escapes from a chase 29.5% to 32.8%, inside the 20-35% that keeps a chase worth it; rounds as long)...
  BURROW_SPACING: 10,       // burrows keep this far apart (across and down): a new one cracks open at least this far from the others whenever there is room (the quietest of a few such spots), and a dig nearer than this to a burrow takes its place (that one closes over). Without it, two or three bunched up: a pair 4 cells or less apart in 24% of rounds (10% before round six A)
  BURROW_SHUT_MIN_MS: 6000, // a burrow closing over (past BURROW_MAX open, the one unused longest) grows shut over a random time between these, so there are three most of the time and briefly four: a beetle can still dive in meanwhile, but none comes out (the owner's playtest: closing over instantly looked abrupt)
  BURROW_SHUT_MAX_MS: 14000, // (escapes from a chase 25.4/25.5% before, 24.8/25.9% after, seeds 3/11: inside the 20-35%)
  BURROW_HEAL_MS: 0,        // ...and (off at 0) a burrow no beetle has gone into or come out of for this long closes over: sawdust and moss fill it (tried at 30 and 60 s: fewer burrows open, nothing else, and with digs leaving burrows, escapes nearer the 35% ceiling)
  BEETLE_UNDER_MIN: 8,      // a scared beetle that reaches a burrow dives in (or one cornered digs in), and comes out of a burrow after this many ticks...
  BEETLE_UNDER_MAX: 16,     // ...up to this many

  // --------------------------------------------------------------- weather
  WEATHER_FIRST_MS: 15000,  // the first spell of weather comes after this long...
  CLEAR_MIN_MS: 8000,       // ...and a clear spell between the others lasts this long...
  CLEAR_MAX_MS: 16000,
  SPELL_MIN_MS: 12000,      // ...a spell of weather this long
  SPELL_MAX_MS: 18000,
  WEATHER_ODDS: Object.freeze({ sun: 1, wind: 1, rain: 1, storm: 1, snow: 1 }), // how many of each spell go in the weather bag (shuffled, drawn without putting back: one each, and every kind comes before any repeats)...
  STORM_FROM_MS: 30000,     // ...(no storms before this: one drawn sooner waits in the bag)
  SNOW_FROM_MS: 45000,      // ...(and no winter before this: snow in the first half-minute starved 5-long snakes)
  SUN_GOLDEN: 5,            // sun: golden hour, golden apples this many times as likely
  GUST_EVERY_MS: 3500,      // wind: a gust this often, knocking an apple loose...
  WINDFALL_MAX: 3,          // ...up to this many apples more than usual
  RAIN_MUSHROOMS: 2,        // rain: this many more mushrooms sprout
  RAINBOW_CHANCE: 0.5,      // when rain stops: a rainbow, with a golden apple at its end
  SNOW_APPLES: 1,           // winter, the lean season: one apple (rotting twice as fast), no new mushrooms, no golden apples...
  SNOW_HUNGER: 1.75,        // ...and everyone gets hungry this many times as fast (it's cold)
  AFTER_STORM_RAIN: 0.6,    // a storm is often followed by rain
  STRIKE_MIN_MS: 2000,      // storm: lightning this often...
  STRIKE_MAX_MS: 4000,
  STRIKE_WARN_TICKS: 10,    // ...crackling where it will strike for this many ticks first (about a second)...
  STRIKE_CLEARANCE: 4,      // ...never within this many cells of a head
  FIRE_TICKS: 50,           // a burning cell burns this long (about 5 s) and sets alight a head that enters it...
  FIRE_SMOLDER_TICKS: 4,    // ...after smouldering (harmless) this long when fire spreads to it
  FIRE_SPREAD: 0.1,         // each tick, each burning cell catches a neighbour with this chance...
  FIRE_MAX: 6,              // ...but one strike's fire covers at most this many cells...
  FIRE_TOTAL: 12,           // ...and catches at most this many over its whole life...
  FIRE_BOARD_MAX: 30,       // ...and the whole board at most this many
  RAIN_DOUSE_TICKS: 6,      // rain (or snow) puts a fire out within this many ticks
  EMBER_CHANCE: 0.025,      // wind (and storms): each tick, a burning cell flings a burning leaf with this chance...
  EMBER_REACH: 4,           // ...up to this many cells downwind (2 at least)...
  EMBER_SMOLDER_TICKS: 8,   // ...where it smoulders this long (a jump is a surprise, so more warning)...
  EMBER_FIRE_TICKS: 22,     // ...then burns this long, a small fire that doesn't spread

  // --------------------------------------------------------------------- AI
  REACTION_MS: 240,         // how stale every AI's view of the other snakes is
  HISTORY: 8,               // board snapshots kept for that delay
  AI_HUNGRY_MS: 10000,      // with this long left before starving, an AI starts looking for food, harder as it gets closer
  AI_DESPERATE_MS: 11000,   // with less than this much life left by hunger (its own clock, shrinking included), an AI drops its errands and takes its chances for food
  LAND_REACH: 0.5,          // a cell is Sovereign's or a colony's land when its centre is within the field's radius plus this of the field's centre (one rule: AI, chatter, HUD, borders)

  // ------------------------------------------------------------- the round
  COUNTDOWN_BEAT: 350,      // 3, 2, 1: each beat this long (any direction skips it)
  DEATH_FREEZE: 350,        // freeze-frame when you die, before the card rises
  ROUND_END_PAUSE: 600,     // let the last moment breathe before the round-over card
  MAX_FRAME_MS: 250,        // after a stall (a busy machine, a debugger), the round moves on at most this much...
  MAX_CATCHUP: 4,           // ...and catches up at most this many ticks in one frame (online, or watching fast: the clock is everyone's)...
  SOLO_CATCHUP: 1,          // ...but playing alone, at most this many: a hitch is a moment's slow-down, not a jump
  YOU_AFTER_STEER_MS: 600,  // ...or this long after you first steer (you've found yourself)
  YOU_MS: 3500,             // YOU marks your snake this long into a round (or 600 ms after you first steer)

  // ----------------------------------------------------------------- input
  QUEUE: 3,                 // turns you can queue ahead
  CHORD_MS: 60,             // a reversal pressed this soon before the turn it needs (a U-turn's keys rolled together) still counts
  POWER_AFTER_TURN_MS: 300, // a fresh swipe the way the last swipe turned you, this soon after that one lifted (or while it's down), is the turn swiped twice to make sure, not a flash (a double flick puts its second touch down 150-280 ms after the first lifts; keys only steer: no such guard)
  SWIPE_CELLS: 0.5,         // a swipe registers after the finger travels this many cells...
  SWIPE_MIN_PX: 12,         // ...and at least this far (about 3 mm), so a jittery finger doesn't turn
  SWIPE_CHAIN_PX: 8,        // ...but a finger already swiping chains its next turn after this far
  SWIPE_AXIS: 1.5,          // ...its way this many times the other (a slant waits until it's clearly one way)...
  SWIPE_SURE: 2,            // ...or until it's gone this many times the distance, when its main way counts (a straight stroke 35-45° off never turned at all)
  TAP_JUMP_MS: 80,          // a touch that stays still this long is a jump without waiting for the lift, if there's something to hop on the way (a resting thumb isn't a jump; a slow swipe, 0.15 px/ms, is seen moving by about 57 ms: touch moves come once a frame)
  TAP_STILL_PX: 6,          // ...still: within this far of where it touched; a touch that lifts this still is a tap: a jump...
  TAP_QUICK_MS: 250,        // ...and so is one lifted this soon that never went as far as a swipe (a finger rolls 7-11 px as it lifts in a hurry)
  CARD_TAP_MS: 500,         // a card that comes up by itself (your death's, the round's end) takes no touch on its buttons that began before it, or this soon after...
  CARD_MASH_MS: 350,        // ...nor one of a run of touches, each this soon after the last, that did (mashing jump never plays again)

  // ---------------------------------------------------------------- online
  HOST_DELAY_MAX: 150,      // the host's turns wait a friend's round trip, but never longer than this
  AWAY_MS: 750,             // a friend silent this long gets an AI at the wheel...
  AWAY_TOAST_MS: 2000,      // ...and a banner if it lasts this long

  // ------------------------------------------------------------------ juice
  PARTICLES_EAT: 10,        // particles in an eating pop
  PARTICLES_DEATH: 26,      // particles when a snake dies
  PARTICLE_LIFE: 520,       // how long a particle lives
  SHAKE_PX: 4,              // board shake when you die (none with reduced motion)
  SHAKE_MS: 220,
  BLINK_MIN: 2600,          // snakes blink every BLINK_MIN..BLINK_MAX ms...
  BLINK_MAX: 6000,
  BLINK_MS: 130,            // ...for this long
  TONGUE_EVERY: 2800,       // every snake flicks its tongue about this often (each at its own rate; more near food for you and Gobbler)
  TONGUE_MS: 260,
  GLANCE_EASE: 0.18,        // how quickly eyes turn toward what a snake is looking at (per frame, 0..1)
  GULP: 0.2,                // a bite's bulge travelling down the body (cells added to the radius)...
  GULP_LENGTH: 1.3,         // ...and how many segments it spans
  GOBBLE: 0.34,             // Gobbler wolfs it down: a bigger, longer gulp
  GOBBLE_LENGTH: 2,
  BITE_MS: 240,             // the head's little squash at the moment of a bite
  CHEW_MS: 420,             // and the mouth's chewing after it
  CHEEKS_MS: 900,           // Gobbler's cheeks puff up at a bite and go down over this long
  FLOAT_MS: 700,            // a "+1" rises and fades over this long
  GOLDEN_DIM_TICKS: 30,     // a golden apple dims (calmly) over its last this-many ticks
  CORPSE_FADE_MS: 250,      // with reduced motion, a dead snake fades over this long instead of bursting
});
