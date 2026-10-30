// AI brain for the rival snakes.
//
// Fairness: an AI sees the *other* snakes as they were `age` ticks ago (its
// reaction time), so it can't respond to a sudden turn any faster than a
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
window.SnakeAI = (() => {
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const DIR_LIST = Object.values(DIRS);

  // Weights (w), all optional unless noted:
  //   space, territory, aggression  room / board share / shrinking everyone else
  //   food, eat, pellet, foodRange  pull per step toward food, eating bonus, pellet worth, reach (required)
  //   normalFood                    worth of a green apple (default 1); a golden apple is worth 3x
  //   mushroom                      worth of a mushroom, which shrinks you (default and at most -SHRINK: it costs that many apples' worth of length)
  //   contested                     how much food a rival reaches first still counts (0-1, true = 1; hunger raises it)
  //   hungryBelow, fedFactor        at this length or more, food matters only fedFactor as much
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
  //   leapNow                       what a leap now over open ground costs me, as a share of the jump's
  //                                   price (round six B; default 1)
  //   spit                          how much a shot with a mushroom is worth to me, when I weigh eating
  //                                   one on purpose (round six B; default SPIT)
  //   powers                        { price, risk, everyWay, jumpAny, dashSpend }: a power habit (see
  //                                   powerPick). price: what every power costs me, as a share of what it
  //                                   costs anyone else, wherever it ends with no more risk than `risk`
  //                                   (beyond that, the full price); everyWay: the flash weighed every way,
  //                                   not just the way I'd crawl; jumpAny: the plain jump over any hurdle
  //                                   with somewhere free to land that no rival could reach first, not
  //                                   just out of a crash or onto food; dashSpend: golden dashes spent on
  //                                   speed too (at the full price), not just on cuts and golden things
  //   golden                        { power, apple, contested }: golden power food (golden beetles, leaves,
  //                                   golden mushrooms) worth this many times what it's worth to anyone
  //                                   else, and a golden apple this many; contested: how much golden power
  //                                   food a rival reaches first still counts (0-1)
  //   hurry                         how much a move longer to catch a beetle counts against it (default
  //                                   BUG_HURRY: lower, it keeps after a beetle on the run longer)
  const DRAB = {
    space: 1.2, territory: 1.5, aggression: 0.3,
    food: 5, eat: 80, pellet: 1.2, foodRange: 60,
    margin: 8, headRisk: 700, zoneRisk: 150, spit: 0.05, leapNow: 4, // (hardly ever a mushroom on purpose, nor a leap now)
  };
  const HUNT = { squeeze: 2.5, chase: 6, lead: 4 };

  // Each persona: name, color, look (how it's drawn), driver (stateful
  // behaviour, optional), weights, and flavor text: a blurb for the start
  // screen, and a few lines each for when it kills you and when it wins
  // (taken in turn, never the same twice running).
  const PERSONAS = {
    sniper: {
      name: 'Sniper', color: '#b91c1c', look: 'sniper', driver: 'sniper',
      blurb: 'Picks whichever snake it has the best shot at and cuts it off.',
      kill: ['It had you lined up three moves ago.', 'You were the best shot it had.', 'It got in front of you. It always does.'],
      win: ['Nobody was safe.', 'Not a wasted move.', 'It never once blinked.'],
      w: {
        space: 1, territory: 0.8, aggression: 0.3,
        food: 6, eat: 80, pellet: 1.5, foodRange: 40, hungryBelow: 16, fedFactor: 0.3,
        margin: 10, headRisk: 600, zoneRisk: 80, thick: 15, hunt: HUNT, spit: 2.5, // (a mushroom for the head shot)
      },
    },
    gobbler: {
      name: 'Gobbler', color: '#fb923c', look: 'gobbler',
      blurb: 'Eats everything, even a rival’s apple. Hates mushrooms.',
      kill: ['Gobbler didn’t even stop chewing.', 'It burped. That was the eulogy.', 'Gobbler was thinking about apples. It always is.'],
      win: ['And it’s still hungry.', 'Not a crumb left.', 'Now, about pudding.'],
      w: {
        space: 1.6, territory: 0.2,
        food: 10, eat: 300, pellet: 3, foodRange: 60, contested: 1, mushroom: -6, // (twice what a mushroom costs anyone else: it hates them)
        hurry: 1.5, // (beetles are its food too: it keeps after one on the run longer than anyone. With two apples on the log, and rivals that read a beetle's dig, it won 16 / 15% at the usual 2; at 1.5, 20 / 26%)
        margin: 10, headRisk: 2200, zoneRisk: 700, // greedy (a rival's apple too), but it flinches from heads and wants room (it used to win only 8%; at 1500 and 500, 12-17%)
        nerve: { base: 0.3, hungry: 0.7 }, // (...except over an apple, the less the longer since its last meal)
      },
    },
    ghost: {
      name: 'Ghost', color: '#f1f5f9', look: 'ghost',
      blurb: 'Keeps its distance from everyone, and slips through the gaps.',
      kill: ['Ghost? You never even saw it.', 'Ghost slipped through. You didn’t.', 'You felt a chill. Then nothing.'],
      win: ['Was it ever really here?', 'It never made a sound.'],
      w: {
        space: 2, territory: 0.6,
        food: 3, eat: 30, pellet: 1, foodRange: 15, hungryBelow: 18, fedFactor: 0.4,
        margin: 6, headRisk: 900, zoneRisk: 150, distance: 5, spit: 0.2, leapNow: 0.8, // (a leap now to slip a trap) // (at 6, once the rivals read knocked food and digging beetles, it won 39 / 31%)
      },
    },
    sovereign: {
      name: 'Sovereign', color: '#2563eb', look: 'sovereign', driver: 'sovereign',
      blurb: 'Rules its own patch of bark and attacks anyone who trespasses.',
      kill: ['The Sovereign does not share.', 'Removed by royal decree.', 'Every inch is royal. You were on one.'],
      win: ['Long live the Sovereign.', 'The realm is the whole log now.', 'We are, at last, amused.'],
      w: {
        space: 1.5, territory: 1, aggression: 0.2,
        food: 5, eat: 70, pellet: 1.2, foodRange: 30,
        margin: 3, headRisk: 500, zoneRisk: 80,
        home: { radius: 4, leave: 30, grow: 8, max: 7, drift: 15 }, hunt: { squeeze: 2.5, chase: 6, lead: 3 },
      },
    },
    colonist: {
      name: 'Colonist', color: '#e11d48', look: 'colonist', driver: 'colonist',
      blurb: 'A redcoat who plants flags all over and defends every one.',
      kill: ['Another patch of bark for the Crown.', 'You were annexed. Politely.', 'All very civilised, of course.'],
      win: ['The final flag is planted.', 'An empire of one log.', 'Victory, then tea.'],
      w: {
        space: 1.2, territory: 1.3, aggression: 0.2, // (at 1.4, once the rivals read knocked food and digging beetles, it won 27 / 37%)
        food: 5, eat: 70, pellet: 1.2, foodRange: 30,
        margin: 5, headRisk: 700, zoneRisk: 120,
        colony: { radius: 4, max: 3, every: 12000 }, goal: 4,
        hunt: { squeeze: 2, chase: 5, lead: 3 },
      },
    },
    drab: {
      name: 'Drab', color: '#c8bf94', look: 'drab',
      blurb: 'Plays it safe and sensible. Nothing special.',
      kill: ['You lost to Drab. Drab!', 'Drab didn’t mean anything by it.', 'Beaten by beige.'],
      win: ['Somehow.', 'Mildly pleased.', 'It says it was fine.'],
      w: DRAB,
    },
    vulture: {
      name: 'Vulture', color: '#27272a', ink: '#f9a8d4', look: 'vulture', driver: 'vulture',
      blurb: 'Circles snakes in trouble and feasts on what they leave behind.',
      kill: ['Vulture was waiting for this.', 'It circled. You slipped. It ate.', 'Vulture thanks you for the beads.'],
      win: ['Picking over the leftovers.', 'It waited everyone out.', 'Last one at the table.'],
      w: {
        space: 1.3, territory: 0.4,
        food: 4, eat: 60, normalFood: 0.15, pellet: 3, foodRange: 40, contested: true,
        margin: 6, headRisk: 900, zoneRisk: 200, lure: { weight: 8, dist: 8 },
      },
    },
    mason: {
      name: 'Mason', color: '#ebe5d9', ink: '#8a8170', look: 'mason', // Caesar in marble (ink: his name, outline and tag, in stone)
      blurb: 'Walls off the board, then keeps the biggest piece.',
      kill: ['Mason had a spot picked out for you.', 'You were on the wrong side of the wall.', 'All roads led to Mason.'],
      win: ['Veni, vidi, Mason.', 'Winnus maximus.', 'Rome took longer.'],
      w: {
        space: 1.3, territory: 1.8,
        food: 3, eat: 40, pellet: 1, foodRange: 30,
        margin: 6, headRisk: 800, zoneRisk: 150, turn: 25, thick: 60, // (thick 45 before round six B: a plain flash cuts a wall one thick, so it lays them two thick)
      },
    },
    wildcard: {
      name: 'Wildcard', color: '#b22234', look: 'wildcard', driver: 'wildcard', // (red, white and blue)
      blurb: 'A random mix of habits, new every round. Great hair.',
      kill: ['Nobody knows how, least of all Wildcard.', 'A total accident. It’s calling it genius.'],
      win: ['Tremendous. Nobody wins like this.', 'A landslide. The biggest ever.', 'Four more rounds!'],
      w: DRAB, // replaced by a random set on its first move
    },
    creeper: {
      name: 'Creeper', color: '#0d9488', look: 'creeper',
      blurb: 'Sneaks up and rides right behind other snakes’ tails.',
      kill: ['Creeper was never far away.', 'You should have turned around.', 'It had been following you for ages.'],
      win: ['Quietly.', 'Nobody looked behind them.'],
      w: {
        space: 1, territory: 0.5,
        food: 3, eat: 50, pellet: 1, foodRange: 30,
        margin: 5, headRisk: 900, zoneRisk: 150, tail: 45,
      },
    },
    metagamer: {
      name: 'Metagamer', color: '#22d3ee', look: 'metagamer', driver: 'metagamer',
      blurb: 'Studies how each rival plays, then counters it.',
      kill: ['Metagamer had you figured out.', 'Your playstyle: noted. Your round: over.', 'You were a data point.'],
      win: ['The spreadsheet called it.', 'Win probability: 100%.', 'GG.'],
      w: { ...DRAB, hunt: HUNT, lure: { weight: 5, dist: 6 } },
    },
    capricious: {
      name: 'Capricious', color: '#ec4899', look: 'capricious', driver: 'capricious',
      blurb: 'Does impressions of all the others, by turns, in costume.',
      kill: ['Capricious felt like it. Just then.', 'A moment later, it wouldn’t have bothered.', 'Wrong place, wrong mood.'],
      win: ['And already wants something else.', 'It loves winning! For now.'],
      w: DRAB, // replaced by the current mood's weights
    },
    copycat: {
      name: 'Copycat', color: '#de2910', look: 'copycat', driver: 'copycat',
      blurb: 'Copies whoever leads: their colours, paled, and how they play. Party member.',
      kill: ['It learned that from someone.', 'Somebody taught it that. Maybe you.', 'The Party thanks you for your sacrifice.'],
      win: ['Imitation pays.', 'A victory for the collective.', 'It copied the winner until it was one.'],
      w: { ...DRAB, mimic: 120, lure: { weight: 4, dist: 5 } },
    },
    desperado: {
      name: 'Desperado', color: '#ea580c', look: 'desperado',
      blurb: 'Skims edges, bodies and heads for the thrill of it. Yeehaw.',
      kill: ['Desperado drew first.', 'Another notch on the six-shooter.', 'Every showdown has a loser.'],
      win: ['Rides off into the sunset.', 'Last snake in town.', 'Not a scratch on the hat.'],
      w: {
        space: 1, territory: 0.6,
        food: 6, eat: 80, pellet: 1.5, foodRange: 40,
        margin: 5, headRisk: 600, zoneRisk: 40, thrill: 25, leapNow: 0.6, // (a leap now for the thrill)
        nerve: { base: 0.7 }, // (it'll stare down a rival's head for an apple)
      },
    },
    mute: {
      name: 'Mute', color: '#a855f7', look: 'mute', driver: 'sniper', // (a rainbow; violet stands in for it in text)
      blurb: 'A mime. Picks someone and closes an invisible box round them.',
      kill: ['Mute had the last word. Silently.', '*taps on your invisible box*', '*lowers an invisible curtain*'],
      win: ['*takes a silent bow*', '*accepts an invisible bouquet*', '*lifts an invisible trophy*'],
      w: {
        space: 1.2, territory: 1.6, aggression: 0.8,
        food: 4, eat: 70, pellet: 1.2, foodRange: 40,
        margin: 6, headRisk: 700, zoneRisk: 120, thick: 15,
        hunt: { squeeze: 4, chase: 2, lead: 1 },
      },
    },
    ouroboros: {
      name: 'Ouroboros', color: '#b8860b', look: 'ouroboros',
      blurb: 'Chases its own tail, then moves as a ring. Mind the middle.',
      kill: ['Ouroboros came full circle.', 'What goes around came around.', 'First its own tail. Then you.'],
      win: ['And round again.', 'It’s won this one before.'],
      w: {
        space: 1.0, territory: 0.6, aggression: 0.2,
        food: 3, eat: 45, pellet: 1.2, foodRange: 40,
        margin: 3, headRisk: 800, zoneRisk: 150,
        coil: { weight: 20, from: 10 },
      },
    },
    joker: {
      name: 'Joker', color: '#a21caf', look: 'joker', driver: 'joker',
      blurb: 'Lures chasers into dead ends and swerves away at the last moment.',
      kill: ['Joker led you on. You followed.', 'It swerved. You didn’t.', 'You fell for it. Everyone does.'],
      win: ['Who’s laughing now?', 'Thank you! It’s here all week.', 'And the last laugh.'],
      w: {
        space: 1, territory: 0.6,
        food: 5, eat: 70, pellet: 1.2, foodRange: 40,
        margin: 6, headRisk: 600, zoneRisk: 40, turn: -12, // (at 4, once the rivals read knocked food and digging beetles, it won 12 / 18%: it wants a little more room behind its lures)
        lure: { weight: 6, dist: 3 }, hunt: { squeeze: 3, chase: 0, lead: 2 }, spit: 4, // (a mushroom for the laugh)
      },
    },
    star: {
      name: 'Star', color: '#eab308', look: 'star', // (a rainbow body behind a sunflower star; sunflower stands in for it in text)
      blurb: 'Jumps and flashes every chance it gets. Catch it when it dims.',
      kill: ['Star was there in a flash.', 'Back in its day, that was just the warm-up.', 'Make a wish.'],
      win: ['Not bad for an old-timer.', 'Never once sat still.', 'One more flash, for the road.'],
      w: {
        space: 1, territory: 1.2, // (at 0.6 it won 23%, in every round of 800; at 1.2, 26.5%, and 28.4% once its jumps kept clear of heads and its golden dashes weren't thrown away)
        food: 5, eat: 70, pellet: 1.2, foodRange: 40,
        margin: 4, headRisk: 700, zoneRisk: 100,
        // Its powers are free to it, unless one ends where a rival could
        // strike (half a head's risk: in reach of its powers, or nearer), or
        // it's a golden dash just for speed: it flashes over four times as
        // often as anyone, and jumps ten times as often.
        powers: { price: 0, risk: 350, everyWay: true, jumpAny: true, dashSpend: true },
        golden: { power: 6, apple: 1.5, contested: 0.5 }, // (it eats about twice as much golden power food as anyone)
      },
    },
  };
  const POOL = Object.keys(PERSONAS);
  // Capricious's deck: every other rival (its own undecided self, Drab's
  // habits, is the dithering in between, not a card). A rival whose style
  // needs long memory gets the short form of it for a mood's length (the
  // rest play as themselves): Sovereign claims a small home and guards it,
  // Colonist lays one small claim, Ouroboros coils from shorter. (Metagamer
  // counters whoever it watched during the mood, Copycat shadows the leader,
  // Wildcard draws a mix for the mood: each mood starts its memory afresh.)
  const MOODS = POOL.filter(k => k !== 'capricious' && k !== 'drab');
  const MOOD_FORMS = {
    sovereign: { ...PERSONAS.sovereign.w, home: { ...PERSONAS.sovereign.w.home, max: 5 } },
    colonist: { ...PERSONAS.colonist.w, colony: { ...PERSONAS.colonist.w.colony, radius: 3, max: 1, every: Infinity } },
    ouroboros: { ...PERSONAS.ouroboros.w, coil: { ...PERSONAS.ouroboros.w.coil, from: 7 } },
  };
  // What a driver remembers that's only its own: a new mood starts without it.
  const MOOD_MEMORY = ['home', 'colonies', 'site', 'nextSiteAt', 'planted', 'driftAt', 'victimId', 'lureId', 'obs', 'labels', 'w', 'modelId', 'style', 'watch', 'readAs', 'readSince'];
  // Copycat's copies: its model's style's habits (the short forms, as
  // Capricious's), shadowing it as it goes: less pull to move the way it
  // moves than plain Copycat's, so the habits show.
  const COPY_MEMORY = MOOD_MEMORY.filter(k => !['modelId', 'style', 'watch', 'readAs', 'readSince'].includes(k));
  const COPY_MIMIC = 40;
  const COPIES = {};

  // Copycat's eye for how a snake plays: only what anyone can see it do
  // (no names: a person is read the same way as a rival). Over the ticks it
  // watches, each snake's
  //   run     moves per turn (long straight runs: Mason)
  //   coiled  of its time 10 long or more, the share with its head within 3 of its tail (Ouroboros)
  //   riding  the share of its time with its head within 2 of the tail end of a snake 8 or longer (Creeper)
  //   apart   cells from the nearest other head, capped at 14 (Ghost)
  //   near    the share of its time with another head within 4 (the aggressive: Sniper, Mute, Joker...)
  //   eat     segments grown, a hundred ticks (Gobbler)
  //   power   moves of more than one cell (jumps and flashes), a hundred ticks (Star)
  //   spread  how far its head strays from where it mostly is (a home: Sovereign)
  // and the style it's nearest to (STYLES: each rival's own, as measured by
  // tools/dev/copycat-styles.js, in units of each trait's spread there).
  const STYLE_TRAITS = ['run', 'coiled', 'riding', 'apart', 'near', 'eat', 'power', 'spread'];
  const STYLE_MIN = 60; // (ticks watched before it judges a style)
  const STYLE_HOLD = 40; // (ticks a new read of its model holds before Copycat changes style)
  function watchStyles(obs, snakes, tick) {
    for (const o of snakes) {
      const ob = (obs[o.id] ||= { tick: -1, n: 0, moves: 0, turns: 0, long: 0, coiled: 0, riding: 0, apart: 0, near: 0, grown: 0, power: 0, sx: 0, sy: 0, sxx: 0, syy: 0, len: o.body.length, hx: o.body[0].x, hy: o.body[0].y, dx: o.dir.x, dy: o.dir.y });
      if (ob.tick === tick) continue;
      const last = ob.tick;
      ob.tick = tick;
      const h = o.body[0], L = o.body.length, t = o.body[L - 1];
      const step = Math.abs(h.x - ob.hx) + Math.abs(h.y - ob.hy);
      if (step > 0) { ob.moves++; if (o.dir.x !== ob.dx || o.dir.y !== ob.dy) ob.turns++; }
      if (step > 1 && step < 4 && tick === last + 1) ob.power++; // (in one tick: not the edges wrapping round, nor ticks I didn't look)
      if (L > ob.len) ob.grown += L - ob.len;
      ob.n++;
      if (L >= 10) { ob.long++; if (manhattan(h, t) <= 3) ob.coiled++; }
      let apart = 14, ride = false;
      for (const p of snakes) {
        if (p === o) continue;
        apart = Math.min(apart, manhattan(h, p.body[0]));
        if (p.body.length >= 8 && manhattan(h, p.body[p.body.length - 1]) <= 2) ride = true;
      }
      ob.apart += apart;
      if (apart <= 4) ob.near++;
      if (ride) ob.riding++;
      ob.sx += h.x; ob.sy += h.y; ob.sxx += h.x * h.x; ob.syy += h.y * h.y;
      ob.len = L; ob.hx = h.x; ob.hy = h.y; ob.dx = o.dir.x; ob.dy = o.dir.y;
    }
  }
  function traitsOf(ob) {
    const n = Math.max(1, ob.n), mx = ob.sx / n, my = ob.sy / n;
    return [ob.moves / Math.max(1, ob.turns), ob.coiled / Math.max(1, ob.long), ob.riding / n, ob.apart / n, ob.near / n,
      100 * ob.grown / n, 100 * ob.power / n, Math.sqrt(Math.max(0, ob.sxx / n - mx * mx + ob.syy / n - my * my))];
  }
  // (Measured on 200 rounds, seed 17, and read back: Star 100% as itself,
  // Joker 99, Mason 98, Gobbler 88, Ouroboros 87, Ghost 86, Creeper 74,
  // Vulture 73, Desperado 61, Sovereign 58, Sniper 43, Drab 29. Colonist,
  // whose mark is its flags, plays like the field from outside: not a style.)
  const STYLES = {
    creeper: [2.014, 0.111, 0.041, 9.118, 0.105, 3.648, 0.24, 7.41], // (317)
    desperado: [1.978, 0.111, 0.01, 9.968, 0.086, 4.039, 0.32, 8.038], // (411)
    drab: [2.029, 0.151, 0.012, 9.513, 0.079, 4.044, 0.212, 6.916], // (421)
    ghost: [1.99, 0.148, 0.01, 11.157, 0.039, 3.722, 0.226, 8.12], // (438)
    gobbler: [2.388, 0.112, 0.021, 8.398, 0.153, 4.932, 0.421, 8.006], // (377)
    joker: [1.151, 0.125, 0.012, 8.947, 0.09, 3.761, 0.212, 6.975], // (413)
    mason: [3.923, 0.162, 0.011, 10.117, 0.063, 3.478, 0.198, 7.585], // (503)
    ouroboros: [1.919, 0.489, 0.008, 9.813, 0.07, 3.864, 0.219, 6.993], // (319)
    sniper: [1.891, 0.121, 0.012, 8.983, 0.096, 3.858, 0.256, 7.053], // (413)
    sovereign: [1.857, 0.185, 0.012, 9.526, 0.082, 3.702, 0.227, 5.237], // (424)
    star: [2.074, 0.136, 0.014, 9.594, 0.085, 4.44, 1.824, 7.222], // (394)
    vulture: [1.919, 0.123, 0.022, 8.207, 0.096, 2.523, 0.268, 6.696], // (331)
  };
  const STYLE_SCALE = [0.202, 0.087, 0.01, 0.652, 0.035, 1.035, 0.212, 1.457];
  function styleOf(ob) {
    if (!ob || ob.n < STYLE_MIN) return null;
    const f = traitsOf(ob);
    let best = null, bestD = Infinity;
    for (const key in STYLES) {
      const c = STYLES[key];
      let d = 0;
      for (let i = 0; i < f.length; i++) d += ((f[i] - c[i]) / STYLE_SCALE[i]) ** 2;
      if (d < bestD) { bestD = d; best = key; }
    }
    return best;
  }

  const TUNE = window.TUNING; // (the rules' numbers, so the AI's picture of them stays true)
  const TRAPPED = 5000;
  const NECK = 2000;       // the room I need is through a gap a rival could get to and shut...
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
  const NO_FIRES = new Map(); // (the board the woodpecker's knock is worked out on: what I see of fire is among the holes)
  const ROOM_CAP = 120;    // stop counting a rival's room past this
  const DISTANCE_CAP = 14; // distance-keepers are happy once this far away
  const PLAIN_GOLD = { power: 1, apple: 1 }; // (golden things worth what they're worth: no craving)
  const NO_HABIT = { price: 1 };             // (powers at their price, used only when they pay)
  const CUT_TAIL = 12;     // a cut rival's tail counts for at most this many segments (see flashOpt)
  // Mushrooms come back up (round six B). A segment off a rival's length,
  // hit with a spat mushroom, is worth SPIT_SEG of an apple to me (my own
  // segment, lost to one, a whole apple); AIM: how much I aim mine (0: I
  // spit it wherever I'm facing); SPIT_HIT: the chance I'd guess a shot has
  // of landing on a head, when I weigh eating one on purpose (w.spit: how
  // much a shot is worth to me; SPIT: anyone's).
  // A shot is weighed only at a mushroom within SPIT_NEAR of my head, with a
  // rival's head within a spit of it: farther, it's a guess, not a shot.
  const SPIT_SEG = 0.5, AIM = 1, SPIT_HIT = 0.35, SPIT = 0.5, SPIT_NEAR = 4;
  const BUG_AHEAD = 16;    // how many moves ahead I read a beetle's way...
  const BUG_HURRY = 2;     // ...and how much a move longer to catch one counts against it, as a step further counts for an apple (a beetle on the run is a meal only while I keep after it: at 1, chases dragged on)
  const BUG_WAYS = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]; // (the order a beetle weighs its ways in: up, right, down, left)
  // How much less a move counts the further on in the search it is: eating
  // (a bonus for eating sooner), risk and turning, worked out once for the
  // first STEPS_AHEAD steps (every move reads them).
  const STEPS_AHEAD = 32;
  const NERVE_MAX = 0.85; // (a persona's nerve never sets aside a threat whole: the odds still count)
  const perStep = r => Float64Array.from({ length: STEPS_AHEAD }, (_, t) => Math.pow(r, t));
  const SOONER = perStep(0.85), RISK_AHEAD = perStep(0.6), TURN_AHEAD = perStep(0.9);

  // Scratch buffers, reused between calls (grid size is fixed per page), so the
  // search allocates next to nothing however many positions it scores. Besides
  // the per-cell grids: `nbr` lists each cell's neighbours in DIR_LIST order
  // (-1 off the board), and `queue` holds a breadth-first search, one distance
  // after another. No search visits a cell twice, so N * N is always enough.
  let bufN = 0, mineFree, otherFree, ownFree, risk, strikes, seen;
  let bridgeUntil, ridesWas, foodValue, foodGrow, foodFrom, foodCells, goldCells, beadCells, queue, nbr, necks, reach, lineAt, lineSeen, lineMark, lineIn, lineOut, myCells, marks, leave, leaveStamp, chase, chaseKey;
  let nearStamp, nearHead, nearWho, nearHome, nearGap, nearBeak;
  let stamp = 0;
  // The board the searches of a search state run on (see evaluate), framed
  // by a border of HOLE so a cell's neighbours are just a row either side of
  // it and a cell either side (W wide; `framed` gives a cell's index on it,
  // `unframed` its index on the grid again, -1 for the frame). `terr` holds
  // for each cell when it frees up for a rival, my body placed on it, or once
  // the territory search claims it, CLAIMED plus when, and whose it is (in
  // its lowest bits); `terrFree` is what every search state starts from
  // (copied in whole: quicker than undoing one); `meLater` is when a cell
  // frees up for me, where that's later (a rival may be where I last saw it
  // heading: the cells in laterCells, laterWas keeping the board's own while
  // my room's fill reads them). inBody marks my body in a search state;
  // seenF and distF, where my room's fill got to and how soon; seenH, where
  // a hunted rival's room did. `reach` is on it too, and reachBlock, when a
  // cell frees up for a rival's reach.
  let W = 0, framed, unframed, bridgeF, terr, terrFree, meLater, laterCells, laterWas, inBody, seenF, seenH, distF, reachBlock;
  const CLAIMED = HOLE + (HOLE >> 1), NOW = -HOLE; // (NOW: free already)
  // The beetles as the search moves them (up to BUGS, as many as can be out
  // at once), each in SLOTS slots from b * SLOTS: its state after s of its
  // crawls (slot s; 0: as it is; BUG_SLOT and the next: playing a chase
  // out): its cell (-1: eaten, down a burrow or dug in), its way (in
  // BUG_WAYS; -1: none), when it last moved, the tick it's gone if it's
  // digging in (0: it isn't), and once it's dug in, where (a burrow's there
  // now: -1 for none).
  const BUG_SLOT = 10, SLOTS = BUG_SLOT + 2, BUGS = Math.max(1, TUNE.BEETLE_MAX || 1);
  const bugCell = new Int32Array(SLOTS * BUGS), bugWay = new Int32Array(SLOTS * BUGS), bugMoved = new Float64Array(SLOTS * BUGS);
  const bugDig = new Float64Array(SLOTS * BUGS), bugDug = new Int32Array(SLOTS * BUGS);
  const bugV = new Float64Array(BUGS), bugUntil = new Float64Array(BUGS), bugGold = new Uint8Array(BUGS); // (each one's worth, when it flies off, and whether I crave it)
  const CHASE_KEY = 8;
  function ensureBuffers(N) {
    if (bufN === N) return;
    bufN = N;
    const size = N * N;
    mineFree = new Int32Array(size);
    otherFree = new Int32Array(size);
    ownFree = new Int32Array(size);
    risk = new Float32Array(size);
    strikes = new Float32Array(size); // (a rival's head next tick, and its body after: see decide)
    seen = new Int32Array(size);
    bridgeUntil = new Int32Array(size);
    ridesWas = new Int32Array(size); // (round six B: a rival's body over a pit, a bridge for my head till it leaves, ticks from now; 0: none)
    foodValue = new Float64Array(size); // what eating a cell is worth
    foodGrow = new Int8Array(size);     // what eating a cell does to my length
    foodFrom = new Int32Array(size);    // the first move that can eat it, if it isn't there yet (food the woodpecker will knock there; 0: it's there)
    foodCells = new Int32Array(size);   // food never shares a cell
    goldCells = new Int32Array(size);
    beadCells = new Int32Array(size);   // (the rivals' own beads among them)
    queue = new Int32Array(size);
    necks = new Int32Array(size * 4); // (a neck: its one or two cells (on the framed board), the room before it, and how far it is)
    myCells = new Int32Array(size);   // my own body as it is (marked with a stamp)
    marks = new Int32Array(size);     // where there is food, and whose own beads (marked with stamps)
    leave = new Int32Array(size);     // when each cell of my body as it is is left (where leaveStamp has a stamp)
    leaveStamp = new Int32Array(size);
    chase = new Int32Array(size * BUGS); // a beetle's chase played out from a cell (where chaseKey holds what it was worked out for), each beetle's apart
    chaseKey = new Float64Array(size * BUGS * CHASE_KEY);
    nearStamp = new Int32Array(size);   // for a beetle on a cell (where nearStamp has a stamp): how near the nearest rival's head is, and whose;
    nearHead = new Int32Array(size);    // and the nearest burrow in reach (-1: none), and how far
    nearWho = new Int32Array(size);
    nearHome = new Int32Array(size);
    nearGap = new Int32Array(size);
    nearBeak = new Int32Array(size);    // and how far off the woodpecker's mark (on it, less than 0: see E.beakGap)
    nbr = new Int32Array(size * 4);
    for (let i = 0; i < size; i++) {
      const x = i % N, y = (i - x) / N;
      DIR_LIST.forEach((d, k) => {
        const nx = x + d.x, ny = y + d.y;
        nbr[4 * i + k] = nx >= 0 && ny >= 0 && nx < N && ny < N ? ny * N + nx : -1;
      });
    }
    W = N + 2;
    framed = new Int32Array(size);
    unframed = new Int32Array(W * W).fill(-1);
    for (let i = 0; i < size; i++) { framed[i] = W + 1 + i + 2 * Math.floor(i / N); unframed[framed[i]] = i; }
    terr = new Int32Array(W * W).fill(HOLE);
    bridgeF = new Int32Array(W * W); // (bridgeUntil on the framed board, for my room: see fillRoom)
    terrFree = new Int32Array(W * W).fill(HOLE);
    meLater = new Int32Array(W * W).fill(NOW);
    inBody = new Int32Array(W * W);   // (my body in a search state, marked with a stamp)
    laterCells = new Int32Array(size);
    laterWas = new Int32Array(size);
    seenF = new Int32Array(W * W);
    seenH = new Int32Array(W * W);
    reach = new Int32Array(W * W);      // the soonest any rival could be in a cell (ticks from now)
    lineAt = new Int32Array(W * W);     // ...on a line of mine (see decide's lineOn), and the line's cells
    lineSeen = new Int32Array(W * W); lineMark = new Int32Array(W * W); lineIn = new Int32Array(W * W); lineOut = new Int32Array(W * W);
    reachBlock = new Int32Array(W * W).fill(HOLE);
    distF = new Int32Array(W * W);
  }

  // Where each snake's territory search starts, for up to `n` snakes.
  // (And coughs: how many of each rival's next moves eat nothing.)
  let ownersCap = 0, srcI, srcT, srcOwn, coughs, headX, headY;
  function ensureOwners(n) {
    if (n <= ownersCap) return;
    ownersCap = n;
    coughs = new Int32Array(n);
    headX = new Int32Array(n); // (the rivals' heads where I reckon they are now, for the beetle)
    headY = new Int32Array(n);
    srcI = new Int32Array(n);
    srcT = new Int32Array(n);
    srcOwn = new Int8Array(n);
  }

  // Bodies for the search, one buffer per step: a move at step s writes the
  // new body into bodies[s] and reads only bodies[s - 1]. A buffer holds at
  // least `cells` cells, and the length in use is passed alongside it.
  const bodies = [];
  function ensureBodies(steps, cells) {
    for (let s = 1; s <= steps; s++) {
      const b = (bodies[s] ||= []);
      while (b.length < cells) b.push({ x: 0, y: 0 });
    }
  }

  // The searches over the framed board, kept apart from decide and evaluate
  // (they read only these tables and plain numbers), so each is compiled once
  // and stays so: a function that meets something of a new shape (a persona,
  // a kind of food) is compiled again, which costs more the bigger it is, and
  // runs uncompiled meanwhile. Each cell's four neighbours are written out, in
  // DIR_LIST order: they're the hot loops.

  // A body on a table of when each cell frees up: its segment j of len
  // leaves after len - j + extra ticks (where something else is there
  // longer, that stays).
  function occupy(table, body, len, extra, N) {
    for (let j = 0; j < len; j++) {
      const c = body[j], i = c.y * N + c.x, v = len - j + extra;
      if (v > table[i]) table[i] = v;
    }
  }

  // The territory board's tables, from otherFree and mineFree (a cell free
  // now: NOW), and the cells meLater holds longer, in laterCells. Returns how many.
  function frameBoards(N) {
    let n = 0;
    for (let i = 0; i < N * N; i++) {
      const p = framed[i], o = otherFree[i], m = mineFree[i];
      terrFree[p] = o > 0 ? o : NOW;
      meLater[p] = m > o ? m : NOW;
      if (m > o) laterCells[n++] = p;
    }
    return n;
  }

  // A rival's reach (see decide), from cell h on the framed board, where it
  // moves again from t0: the soonest it could be in each cell, into `reach`
  // (where anyone's is sooner, that stays).
  function reachFrom(h, t0) {
    const stampR = ++stamp, Q = queue, S = seenF, B = reachBlock, R = reach, Wd = W;
    Q[0] = h;
    S[h] = stampR;
    R[h] = Math.min(R[h], t0);
    let read = 0, write = 1;
    for (let s = t0 + 1; read < write; s++) {
      const levelEnd = write;
      while (read < levelEnd) {
        const p = Q[read++];
        let q = p - Wd;
        if (S[q] !== stampR && B[q] <= s) { S[q] = stampR; if (s < R[q]) R[q] = s; Q[write++] = q; }
        q = p + Wd;
        if (S[q] !== stampR && B[q] <= s) { S[q] = stampR; if (s < R[q]) R[q] = s; Q[write++] = q; }
        q = p - 1;
        if (S[q] !== stampR && B[q] <= s) { S[q] = stampR; if (s < R[q]) R[q] = s; Q[write++] = q; }
        q = p + 1;
        if (S[q] !== stampR && B[q] <= s) { S[q] = stampR; if (s < R[q]) R[q] = s; Q[write++] = q; }
      }
    }
  }

  // How much room a rival has from its head at start, with my body on the
  // territory board in its way (see decide's roomOf: the same count, for a
  // search state), marked in seenH.
  function roomOn(start) {
    const stampS = ++stamp, Q = queue, S = seenH, B = terr, Wd = W;
    S[start] = stampS;
    Q[0] = start;
    let read = 0, write = 1, room = 0;
    for (let d = 1; read < write && room < ROOM_CAP; d++) {
      const levelEnd = write;
      while (read < levelEnd) {
        const p = Q[read++];
        let q = p - Wd;
        if (S[q] !== stampS && B[q] <= d) { S[q] = stampS; room++; Q[write++] = q; }
        q = p + Wd;
        if (S[q] !== stampS && B[q] <= d) { S[q] = stampS; room++; Q[write++] = q; }
        q = p - 1;
        if (S[q] !== stampS && B[q] <= d) { S[q] = stampS; room++; Q[write++] = q; }
        q = p + 1;
        if (S[q] !== stampS && B[q] <= d) { S[q] = stampS; room++; Q[write++] = q; }
      }
    }
    return Math.min(room, ROOM_CAP);
  }

  // What food that isn't there yet pulls (the woodpecker will knock it
  // there: see foodFrom), as food `range` pulls: there from move `from`, I'd
  // be there on move `at` (from t; coughing till `mute`, I'd only nudge it).
  // It counts from when it lands, and every move I'd be there before I need
  // be counts EARLY more: nearby, I can be on it as it lands; anywhere I
  // could just get back from in time, I'm racing the clock.
  const EARLY = 0.1;
  const latePull = (range, t, at, from, mute) => Math.max(0, range + t - Math.max(from, mute + 1) + EARLY * (from - at));

  // My room's flood fill (see evaluate), from my head at headP, t moves on,
  // marking what it gets to with stampF (and how soon, in distF); my body is
  // on the territory board, marked in inBody with bodyMark. eager: look for
  // food as it goes (a contested-food eater, which searches on past the room
  // cap, up to foodRange, till it sees some). Into `room`: how many cells
  // (not capped), how soon I'm on my own trail (HOLE: never) and how many
  // necks (in `necks`, four numbers each); it returns the best food it saw if
  // eager (food that isn't there yet, from when it is).
  const room = new Int32Array(3);
  function fillRoom(headP, t, cap, need, eager, foodRange, mute, bodyMark, stampF, laterCount) {
    const Q = queue, S = seenF, B = terr, BU = bridgeF, ML = meLater, D = distF, Wd = W; // (BU: a bridge is a way through while it lasts, but not under my own body)
    // (Where meLater says a cell's taken longer, the board says so too while
    // it runs: one test where it would be two.)
    for (let k = 0; k < laterCount; k++) { const q = laterCells[k]; laterWas[k] = B[q]; if (ML[q] > B[q]) B[q] = ML[q]; }
    S[headP] = stampF;
    Q[0] = headP;
    let read = 0, write = 1, space = 0, anyFood = 0, trail = HOLE, neckCount = 0;
    for (let d = 1; read < write && (space < cap || (eager && !anyFood && d <= foodRange)); d++) {
      const levelEnd = write, by = t + d, pull = eager ? Math.max(0, foodRange - (t + d > mute ? d : mute + 1 - t)) : 0; // (coughing, I'd only nudge it)
      while (read < levelEnd) {
        const p = Q[read++];
        let q = p - Wd;
        if (S[q] !== stampF && (B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) {
          S[q] = stampF; D[q] = d; Q[write++] = q;
          if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; } // (a bridge: a way through, not room, nor my trail)
          if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
        }
        q = p + Wd;
        if (S[q] !== stampF && (B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) {
          S[q] = stampF; D[q] = d; Q[write++] = q;
          if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; } // (a bridge: a way through, not room, nor my trail)
          if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
        }
        q = p - 1;
        if (S[q] !== stampF && (B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) {
          S[q] = stampF; D[q] = d; Q[write++] = q;
          if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; } // (a bridge: a way through, not room, nor my trail)
          if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
        }
        q = p + 1;
        if (S[q] !== stampF && (B[q] <= by || (BU[q] > by && inBody[q] !== bodyMark))) {
          S[q] = stampF; D[q] = d; Q[write++] = q;
          if (B[q] <= by) { space++; if (d < trail && inBody[q] === bodyMark) trail = d; } // (a bridge: a way through, not room, nor my trail)
          if (eager) { const i = unframed[q], v = foodValue[i]; if (v > 0) anyFood = Math.max(anyFood, v * (foodFrom[i] > by ? latePull(foodRange, t, by, foodFrom[i], mute) : pull)); }
        }
      }
      const width = write - levelEnd;
      if (width && width <= 2 && levelEnd - 1 < need) {
        necks[neckCount++] = Q[levelEnd];
        necks[neckCount++] = Q[write - 1];
        necks[neckCount++] = levelEnd - 1;
        necks[neckCount++] = d;
      }
    }
    for (let k = 0; k < laterCount; k++) B[laterCells[k]] = laterWas[k];
    room[0] = space; room[1] = trail; room[2] = neckCount;
    return anyFood;
  }

  // The territory search (see evaluate): its sources in srcI, srcT, srcOwn
  // [0, ns), my body on the board placed at time t. Into `tally`: my count
  // and the rivals'. stop: it may stop once I claim nothing more, when no
  // rival still coughs after coughMax and no rival's own bead is left
  // unclaimed (beadCells[0, beadCount)) (see evaluate).
  const tally = new Int32Array(2);
  function spread(ns, t, age, bits, tags, stop, coughMax, beadCount) {
    const B = terr, Q = queue, ML = meLater, Wd = W;
    let mine = 0, theirs = 0, si = 0, T = srcT[0], read = 0, write = 0; // (Q[read, write): the cells claimed at time T)
    while (read < write || si < ns) {
      while (si < ns && srcT[si] === T) {
        const p = srcI[si], tag = srcOwn[si++];
        if (B[p] < CLAIMED) {
          B[p] = CLAIMED + ((T + age) << bits) + tag;
          if (tag === 1) mine++; else theirs++;
          Q[write++] = p;
        }
      }
      // (Worked out once a level; my cells apart from the rivals'.)
      const levelEnd = write, T1 = T + 1, next = CLAIMED + ((T1 + age) << bits), mineBefore = mine, mineNext = next + 1;
      while (read < levelEnd) {
        const p = Q[read++], tag = B[p] & tags;
        if (tag === 1) { // mine: a cell free by then for me (unless a rival may be there), or a rival's claimed at T + 1 (contested)
          let q = p - Wd, s = B[q];
          if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && (s & tags) > 1) { theirs--; B[q] = next; }
          q = p + Wd; s = B[q];
          if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && (s & tags) > 1) { theirs--; B[q] = next; }
          q = p - 1; s = B[q];
          if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && (s & tags) > 1) { theirs--; B[q] = next; }
          q = p + 1; s = B[q];
          if (s <= T1) { if (ML[q] <= T1) { B[q] = mineNext; mine++; Q[write++] = q; } } else if (s >= next && (s & tags) > 1) { theirs--; B[q] = next; }
        } else if (tag) { // a rival's (0: it became contested): a cell free by then, or someone else's claimed at T + 1 (contested)
          const claim = next + tag;
          let q = p - Wd, s = B[q], o = s & tags;
          if (s <= T1) { B[q] = claim; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
          q = p + Wd; s = B[q]; o = s & tags;
          if (s <= T1) { B[q] = claim; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
          q = p - 1; s = B[q]; o = s & tags;
          if (s <= T1) { B[q] = claim; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
          q = p + 1; s = B[q]; o = s & tags;
          if (s <= T1) { B[q] = claim; theirs++; Q[write++] = q; } else if (s >= next && o && o !== tag) { if (o === 1) mine--; else theirs--; B[q] = next; }
        }
      }
      if (mine === mineBefore && T >= t && stop && T1 + 1 > coughMax) {
        let open = false; // (a rival's own bead nobody's claimed yet)
        for (let k = 0; k < beadCount && !open; k++) open = foodValue[beadCells[k]] > 0 && B[framed[beadCells[k]]] < CLAIMED;
        if (!open) break;
      }
      T = read < write || si >= ns ? T + 1 : srcT[si];
    }
    tally[0] = mine; tally[1] = theirs;
  }

  const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const sameDir = (a, b) => a.x === b.x && a.y === b.y;
  const rand = (a, b) => a + Math.random() * (b - a);
  // Land (Sovereign's realm, a colony): a cell whose centre is within the
  // field's radius, and LAND_REACH, of its centre. (One rule everywhere: the
  // AI, the chatter, the tags and the borders drawn.)
  const onLand = (c, f) => Math.hypot(c.x - f.x, c.y - f.y) <= f.radius + TUNE.LAND_REACH;

  // A persona's weights as one shape, whoever's they are: every weight above,
  // in this order, and a weight it hasn't got undefined, as it would read
  // anyway (a new one, not listed here, still reads true, just slower). The
  // compiled search reads each the same way every time, instead of learning
  // a new shape with every persona it meets, and starting over.
  const WEIGHTS = {
    space: undefined, territory: undefined, aggression: undefined,
    food: undefined, eat: undefined, pellet: undefined, foodRange: undefined, normalFood: undefined, mushroom: undefined,
    contested: undefined, hungryBelow: undefined, fedFactor: undefined,
    margin: undefined, headRisk: undefined, zoneRisk: undefined, nerve: undefined, distance: undefined,
    hunt: undefined, home: undefined, lure: undefined, turn: undefined, tail: undefined, mimic: undefined,
    colony: undefined, goal: undefined, thrill: undefined, coil: undefined, thick: undefined, powers: undefined, golden: undefined, hurry: undefined,
    spit: undefined, leapNow: undefined,
  };
  const weighed = w => Object.assign({ ...WEIGHTS }, w);

  // Wildcard: a random but sensible set of weights, drawn once per round.
  function randomWeights() {
    const chance = p => Math.random() < p;
    const w = {
      space: rand(0.8, 2), territory: rand(0.2, 1.8), aggression: rand(0, 0.5),
      food: rand(2, 12), eat: rand(30, 300), pellet: rand(1, 3), foodRange: Math.round(rand(15, 60)),
      contested: chance(0.4), margin: Math.round(rand(2, 10)),
      headRisk: rand(500, 1200), zoneRisk: rand(30, 400),
    };
    if (chance(0.4)) w.distance = rand(5, 25);
    if (chance(0.3)) w.turn = rand(5, 30);
    if (chance(0.3)) w.tail = rand(10, 40);
    if (chance(0.4)) w.hunt = HUNT;
    return w;
  }

  // view = { grid, me: { id, body, dir, grow }, others: [{ id, body, dir }],
  //          food: [{ x, y, kind }], holes: Set of cell indexes, age, tick, timeMs,
  //          pecks: the woodpecker's mark (among the holes), strikeAt: its strike's tick,
  //          landings: where it promised the food in its mark would land (its rings in the last PECK_PROMISE_TICKS moves),
  //          burrows: [{ x, y, shutAt (once it grows shut: the game time it closes over) }] }
  // memory: an object kept for this snake for the whole round.
  function decide(view, persona, memory = {}) {
    const N = view.grid;
    const { me, others, food, age } = view;
    const holes = view.holes || new Set();
    const depth = persona.depth ?? 3;
    ensureBuffers(N);
    ensureOwners(others.length + 1);
    const steps = Math.max(1, depth); // even a depth-0 search makes one move
    ensureBodies(Math.max(TUNE.GOLD_FLY + 2, steps), me.body.length + steps + TUNE.GOLD_FLY + 4); // a body grows at most one cell a step (a power moves up to three at once, eating; a jump is down LEAP_REACH + 1 steps on, a golden flight GOLD_FLY + 1)
    mineFree.fill(0); otherFree.fill(0); risk.fill(0); strikes.fill(0);

    const inside = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
    const myHead = me.body[0];

    // Woodpecker holes never close: treat them like walls.
    for (const i of holes) otherFree[i] = HOLE;

    // Opponent bodies as last seen. A segment j from the head leaves its cell
    // after (len - j) ticks; we ignore the time that has passed since the
    // snapshot, which is conservative in case they ate something.
    // (A rival I saw stunned stays put that much longer: its stars show.)
    const stunLeft = o => Math.max(0, (o.stun || 0) - age);
    for (const o of others) occupy(otherFree, o.body, o.body.length, stunLeft(o), N);
    mineFree.set(otherFree);
    // Bridges (round six B): a rival's body over a pit (behind its head) I
    // may crawl onto while it's still there: till it leaves, as I'd see it
    // (less the time since I saw it, the soonest it could be gone).
    const pitHole = i => holes.has(i) && !(view.fire || EMPTY).has(i) && !(view.pecks || EMPTY).has(i); // (a hole, not fire nor the woodpecker's mark)
    bridgeUntil.fill(0); bridgeF.fill(0);
    for (const o of others) {
      if (o.air || pitHole(o.body[0].y * N + o.body[0].x)) continue; // (its own head over a pit: its body holds nobody up)
      const moved = Math.max(0, age - (o.stun || 0)); // (the moves it has made since I saw it, at least)
      for (let j = 1; j < o.body.length; j++) {
        const c = o.body[j], i = c.y * N + c.x;
        if (pitHole(i)) { bridgeUntil[i] = Math.max(bridgeUntil[i], o.body.length - j - moved); bridgeF[framed[i]] = bridgeUntil[i]; }
      }
    }

    // Where is each opponent now? Assume it kept going straight for `age`
    // ticks and treat that path as occupied (for me only).
    const heads = [];
    for (const o of others) {
      const L = o.body.length;
      let hx = o.body[0].x, hy = o.body[0].y;
      for (let s = Math.min(age, o.stun || 0) + 1; s <= age; s++) { // (stunned, it didn't move)
        let nx = hx + o.dir.x, ny = hy + o.dir.y;
        if (o.wrap > 0) { nx = (nx + N) % N; ny = (ny + N) % N; } // (the edges wrap for it a while)
        if (!inside(nx, ny) || otherFree[ny * N + nx] > s) break;
        hx = nx; hy = ny;
        mineFree[hy * N + hx] = Math.max(mineFree[hy * N + hx], L);
      }
      headX[heads.length] = hx; headY[heads.length] = hy;
      heads.push({ x: hx, y: hy });
    }
    // The territory search's board, from the same tables.
    const laterCount = frameBoards(N);
    const tagBits = 32 - Math.clz32(others.length + 1), tags = (1 << tagBits) - 1; // (see evaluate)

    // How much room snake k has from its predicted head. `blockT` > 0 means my
    // body (as placed in ownFree for a search state at time blockT) is in the way.
    function roomOf(k, blockT = 0) {
      const h = heads[k];
      const start = h.y * N + h.x;
      const stampS = ++stamp;
      seen[start] = stampS;
      queue[0] = start;
      // queue[read, write) is still to expand; it holds one distance at a time.
      let read = 0, write = 1, room = 0;
      for (let d = 1; read < write && room < ROOM_CAP; d++) {
        const levelEnd = write;
        while (read < levelEnd) {
          const i = queue[read++];
          for (let n = 4 * i; n < 4 * i + 4; n++) {
            const ni = nbr[n];
            if (ni < 0 || seen[ni] === stampS || otherFree[ni] > d || (ownFree[ni] && ownFree[ni] > d - blockT)) continue; // (a cell that isn't my body is free of me)
            seen[ni] = stampS;
            room++;
            queue[write++] = ni;
          }
        }
      }
      return Math.min(room, ROOM_CAP);
    }

    // ------------------------------------------------------------- drivers
    // ctx: the effective weights for this decision plus who to hunt / lure
    // toward / keep away from. Drivers fill it in from the game state.
    const ctx = { w: persona.w, victim: -1, target: null, lure: -1, avoid: null, home: null, mimicDir: null, goal: null }; // (every field from the start: one shape)
    const indexOf = id => others.findIndex(o => o.id === id);
    // A hole the woodpecker made, as I see it (among the holes I keep out
    // of, fire and its mark aren't pits).
    const fire = view.fire || EMPTY, mark = view.pecks || EMPTY;
    const pitAt = i => holes.has(i) && !fire.has(i) && !mark.has(i), pit = (x, y) => pitAt(y * N + x);

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
      ctx.victim = k;
      ctx.target = targetOf(k, hunt.lead);
    }

    function targetOf(k, lead) {
      const d = others[k].dir, h = heads[k];
      return {
        x: Math.min(N - 1, Math.max(0, h.x + d.x * lead)),
        y: Math.min(N - 1, Math.max(0, h.y + d.y * lead)),
      };
    }

    const all = others.map((_, k) => k);

    const drivers = {
      sniper() { pickVictim(all, ctx.w.hunt); },

      // Its realm: a circle round where it started, that grows as it does
      // (and shrinks again if it wastes away), and drifts a cell at a time
      // off land that's been lost (holes, fire). Anyone in it gets hunted.
      // A capital the woodpecker pecks out moves the realm at once, banner
      // and all, to the nearest good land.
      sovereign() {
        const H = ctx.w.home, len = me.body.length;
        memory.home ||= { x: myHead.x, y: myHead.y, radius: H.radius };
        const home = ctx.home = memory.home;
        const needs = R => 3 + H.grow * (R - H.radius); // (the length it takes to hold a realm of radius R)
        if (home.radius < H.max && len >= needs(home.radius + 1)) home.radius++;
        else if (home.radius > H.radius && len < needs(home.radius) - 2) home.radius--;
        const fit = v => Math.min(N - home.radius - 2, Math.max(home.radius + 1, v));
        home.x = fit(home.x);
        home.y = fit(home.y);
        const land = (cx, cy) => {
          let n = 0;
          for (let y = cy - home.radius; y <= cy + home.radius; y++) {
            for (let x = cx - home.radius; x <= cx + home.radius; x++) {
              if (inside(x, y) && Math.hypot(x - cx, y - cy) <= home.radius + TUNE.LAND_REACH && !holes.has(y * N + x)) n++;
            }
          }
          return n;
        };
        if (pit(home.x, home.y)) { // (the nearest capital that isn't a pit, the most land of those as near)
          let best = null, most = -1;
          for (let r = 1; r < N && !best; r++) {
            for (let dx = -r; dx <= r; dx++) {
              for (const dy of dx === -r || dx === r ? [0] : [r - Math.abs(dx), Math.abs(dx) - r]) {
                const x = fit(home.x + dx), y = fit(home.y + dy);
                if (Math.abs(x - home.x) + Math.abs(y - home.y) !== r || pit(x, y)) continue; // (that far, once fitted on the board)
                const n = land(x, y);
                if (n > most) { most = n; best = { x, y }; }
              }
            }
          }
          if (best) { home.x = best.x; home.y = best.y; memory.driftAt = view.tick + H.drift; }
        }
        if (view.tick >= (memory.driftAt ?? 0)) {
          memory.driftAt = view.tick + H.drift;
          let best = null, most = land(home.x, home.y) + 2; // (only for clearly better land)
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const x = fit(home.x + dx), y = fit(home.y + dy);
            if ((x === home.x && y === home.y) || pit(x, y)) continue;
            const n = land(x, y);
            if (n > most) { most = n; best = { x, y }; }
          }
          if (best) { home.x = best.x; home.y = best.y; }
        }
        const intruders = all.filter(k => onLand(heads[k], ctx.home));
        if (intruders.length) pickVictim(intruders, ctx.w.hunt);
        else memory.victimId = null;
      },

      // Plant a flag where it starts, then every so often travel to the open
      // spot furthest from rivals and plant another (oldest flag goes when it
      // has too many). Anyone near any flag gets hunted. A flag the
      // woodpecker pecks out falls into the pit: that colony is lost, land
      // and all, and it sets off to plant another.
      colonist() {
        const col = ctx.w.colony;
        const clamp = v => Math.min(N - 2, Math.max(1, v));
        // (n: which colony it is, first, second, ...: each flies its own flag.)
        memory.colonies ||= [{ x: clamp(myHead.x), y: clamp(myHead.y), radius: col.radius, n: 1 }];
        if (memory.colonies.some(c => pit(c.x, c.y))) {
          memory.colonies = memory.colonies.filter(c => !pit(c.x, c.y));
          if (!memory.site) memory.nextSiteAt = view.timeMs;
        }
        if (memory.site && pit(memory.site.x, memory.site.y)) { memory.site = null; memory.nextSiteAt = view.timeMs; } // (and where it was going, another)
        if (memory.site && manhattan(myHead, memory.site) <= 1) {
          memory.planted = (memory.planted || 0) + 1;
          memory.colonies.push({ ...memory.site, radius: col.radius, n: memory.planted + 1 });
          if (memory.colonies.length > col.max) memory.colonies.shift();
          memory.site = null;
          memory.nextSiteAt = view.timeMs + col.every;
        }
        memory.nextSiteAt ??= view.timeMs + col.every;
        if (!memory.site && view.timeMs >= memory.nextSiteAt) {
          let best = null, bestScore = -Infinity;
          for (let y = 2; y < N - 2; y += 2) {
            for (let x = 2; x < N - 2; x += 2) {
              if (holes.has(y * N + x) || otherFree[y * N + x]) continue;
              if (memory.colonies.some(c => Math.hypot(c.x - x, c.y - y) < c.radius * 2)) continue;
              const p = { x, y };
              const away = Math.min(DISTANCE_CAP, ...heads.map(h => manhattan(h, p)));
              const s = away - 0.4 * manhattan(myHead, p);
              if (s > bestScore) { bestScore = s; best = p; }
            }
          }
          memory.site = best;
          if (!best) memory.nextSiteAt = view.timeMs + col.every;
        }
        const intruders = all.filter(k => memory.colonies.some(c => onLand(heads[k], c)));
        if (intruders.length) pickVictim(intruders, ctx.w.hunt);
        else {
          memory.victimId = null;
          ctx.goal = memory.site;
        }
      },

      // Get the attention of the nearest rival heading my way, stay just in
      // front of it, and steer so its room shrinks behind me: bait it into a
      // dead end it can't see coming.
      joker() {
        let best = -1, bestD = Infinity;
        for (const k of all) {
          const o = others[k], h = heads[k];
          const toMe = { x: myHead.x - h.x, y: myHead.y - h.y };
          const d = manhattan(h, myHead);
          const chasing = o.dir.x * toMe.x + o.dir.y * toMe.y > 0;
          const score = d - (chasing ? 4 : 0);
          if (score < bestD) { bestD = score; best = k; }
        }
        if (best < 0) return;
        ctx.lure = best;
        ctx.victim = best;
        ctx.target = heads[best];
        memory.victimId = others[best].id;
      },

      // Hover near the snake most likely to die soon (least room for its length).
      vulture() {
        body0ToOwnFree(me.body, me.body.length, 0);
        let best = -1, bestScore = Infinity, currentScore = Infinity;
        for (const k of all) {
          const s = roomOf(k) / Math.max(4, others[k].body.length);
          if (s < bestScore) { bestScore = s; best = k; }
          if (others[k].id === memory.lureId) currentScore = s;
        }
        clearOwnFree(me.body, me.body.length);
        const current = indexOf(memory.lureId);
        ctx.lure = current >= 0 && currentScore <= bestScore * 1.5 ? current : best;
        memory.lureId = ctx.lure >= 0 ? others[ctx.lure].id : null;
      },

      wildcard() {
        memory.w ||= randomWeights();
        ctx.w = memory.w;
        if (ctx.w.hunt) pickVictim(all, ctx.w.hunt);
      },

      // Mood swings. It starts each round undecided (its own self, playing it
      // safe) for a few seconds, then every 8-15 s does an impression of
      // another rival, dealt from a shuffled deck of all of them (each once
      // before any comes back, never the same twice running), dithering for
      // a moment in between.
      capricious() {
        memory.moodUntil ??= view.timeMs + rand(3500, 5500);
        if (view.timeMs >= memory.moodUntil) {
          for (const k of MOOD_MEMORY) memory[k] = null; // (whatever the last mood kept is gone: its realm, its flag, who it hunted)
          if (memory.mood) { // over it: a moment of not knowing what next
            memory.lastMood = memory.mood;
            memory.mood = null;
            memory.moodUntil = view.timeMs + rand(1200, 2000);
          } else {
            if (!memory.deck?.length) {
              const deck = memory.deck = [...MOODS];
              for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
              if (deck[deck.length - 1] === memory.lastMood) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]]; // (dealt from the end)
            }
            memory.mood = memory.deck.pop();
            memory.moodUntil = view.timeMs + rand(8000, 15000);
          }
          memory.moodChangedAt = view.timeMs;
        }
        if (!memory.mood) return; // (undecided: its own, safe weights)
        const mood = PERSONAS[memory.mood];
        ctx.w = MOOD_FORMS[memory.mood] || mood.w;
        if (mood.driver) drivers[mood.driver]();
      },

      // Watch every rival's behaviour and counter it: keep away from the
      // aggressive ones, shadow the greedy ones for their pellets, and once
      // I'm grown, hunt the evasive ones.
      metagamer() {
        memory.obs ||= {};
        const allHeads = [myHead, ...heads];
        const labels = {};
        others.forEach((o, k) => {
          const ob = (memory.obs[o.id] ||= { len0: o.body.length, samples: 0, near: 0 });
          ob.samples++;
          if (allHeads.some(h => h !== heads[k] && manhattan(h, heads[k]) <= 4)) ob.near++;
          const eatRate = (o.body.length - ob.len0) / (ob.samples + 30);
          labels[o.id] = ob.near / ob.samples > 0.25 ? 'aggressive' : eatRate > 0.04 ? 'greedy' : 'evasive';
        });
        memory.labels = labels;
        ctx.avoid = others.map(o => labels[o.id] === 'aggressive' ? 20 : 0);
        const greedy = all.filter(k => labels[others[k].id] === 'greedy');
        if (greedy.length) ctx.lure = greedy.reduce((a, b) => manhattan(myHead, heads[a]) <= manhattan(myHead, heads[b]) ? a : b);
        const grown = me.body.length + me.grow >= 14;
        if (grown) pickVictim(all.filter(k => labels[others[k].id] === 'evasive'), ctx.w.hunt);
      },

      // Copy whoever leads: the longest snake (changing model only when
      // another leads it by 3 or more). It shadows its model a few cells
      // away, moving the way it moves, and plays as it has seen it play:
      // the style it's nearest to (styleOf), with that rival's habits, its
      // weights and its driver. Watching everyone the same way, it copies a
      // person by what they do, never for being one.
      copycat() {
        watchStyles(memory.watch ||= {}, [me, ...others], view.tick - age); // (as it saw them: its eyes are as slow as anyone's)
        let best = -1;
        for (const k of all) if (best < 0 || others[k].body.length > others[best].body.length) best = k;
        const current = indexOf(memory.modelId);
        const k = current >= 0 && others[current].body.length + 3 > others[best].body.length ? current : best;
        if (k < 0) return;
        // (A new read of its model holds STYLE_HOLD ticks before it takes it:
        // a style isn't dropped on a moment's change of pace.)
        const read = styleOf(memory.watch[others[k].id]), now = view.tick;
        let style = others[k].id === memory.modelId && memory.style ? memory.style : read; // (its first read, it takes at once)
        if (read === style) memory.readSince = null;
        else if (memory.readAs !== read || memory.readSince == null) { memory.readAs = read; memory.readSince = now; }
        else if (now - memory.readSince >= STYLE_HOLD) { style = read; memory.readSince = null; }
        if (others[k].id !== memory.modelId || style !== memory.style) for (const key of COPY_MEMORY) memory[key] = null; // (a new model, or a new read of it: what the last copy kept is gone)
        memory.modelId = others[k].id;
        memory.style = style;
        if (style) {
          const copy = PERSONAS[style];
          ctx.w = COPIES[style] ||= { ...(MOOD_FORMS[style] || copy.w), mimic: COPY_MIMIC, lure: copy.w.lure || PERSONAS.copycat.w.lure };
          if (copy.driver) drivers[copy.driver]();
        }
        if (ctx.lure < 0) ctx.lure = k; // (shadowing it, unless the copy has its own lure: Vulture's, Joker's)
        ctx.mimicDir = others[k].dir;
      },
    };

    // A body is its first `len` cells (search bodies live in longer buffers).
    function body0ToOwnFree(body, len, grow) {
      for (let j = 0; j < len; j++) ownFree[body[j].y * N + body[j].x] = len - j + grow;
    }
    function clearOwnFree(body, len) {
      for (let j = 0; j < len; j++) ownFree[body[j].y * N + body[j].x] = 0;
    }

    if (persona.driver && others.length) drivers[persona.driver]();

    // Desperate: hunger will finish me soon. My own clock, as a person sees
    // their bar: till my next shrink, then a segment every STARVE_EVERY_MS
    // down to my smallest (all of it faster in snow). Nothing else matters
    // now: no errands, any food I can reach in time (a rival's too), and
    // risks I wouldn't take otherwise. With no food in reach, I hunt: a
    // rival that crashes drops beads.
    const myLen = me.body.length + me.grow;
    const winter = view.weather === 'snow';
    const lifeMs = me.starveIn == null ? Infinity : (me.starveIn + (myLen - TUNE.MIN_LENGTH) * TUNE.STARVE_EVERY_MS) / (winter ? TUNE.SNOW_HUNGER : 1);
    const lifeTicks = lifeMs / Math.max(TUNE.MIN_TICK, TUNE.START_TICK - (TUNE.START_TICK - TUNE.MIN_TICK) * view.timeMs / TUNE.RAMP_MS);
    const desperate = lifeMs < TUNE.AI_DESPERATE_MS;
    memory.desperate = desperate;
    if (desperate) {
      const w0 = ctx.w;
      ctx.w = {
        ...w0, contested: 1, foodRange: Math.max(60, w0.foodRange), normalFood: 1, pellet: Math.max(1, w0.pellet ?? 1), mushroom: -TUNE.SHRINK,
        margin: Math.min(2, w0.margin), headRisk: 0.4 * w0.headRisk, zoneRisk: 0.3 * w0.zoneRisk,
        territory: 0.5 * w0.territory, aggression: 0, distance: 0, tail: 0, thrill: 0, turn: 0, coil: null, thick: 0, hunt: HUNT,
      };
      ctx.victim = -1; ctx.target = null; ctx.lure = -1; ctx.avoid = null; ctx.home = null; ctx.mimicDir = null; ctx.goal = null;
      const meal = f => f.kind !== 'mushroom' && !(f.kind === 'pellet' && f.owner === me.id) && manhattan(f, myHead) <= lifeTicks;
      if (others.length && !food.some(meal)) pickVictim(all, HUNT);
    }
    const w = weighed(ctx.w);

    // Risk: cells each rival could step into next tick (head-on: `strikes`,
    // read with when I'd get there, see evaluate), and its wider reach since
    // I last saw it (soft zone, `risk`).
    // (A rival still stunned next tick can't strike; one I just met head-on,
    // I give twice the berth for a while, so we don't go for the same cell again.)
    // Only cells it can step into: not back into its neck, a hole or a body
    // still there.
    others.forEach((o, k) => {
      const strike = stunLeft(o) > 1 ? 0 : w.headRisk * (o.id === me.bumped ? 2 : 1);
      const wrapO = o.wrap > 0, at = v => wrapO ? (v + N) % N : v; // (the edges wrap for it a while)
      for (const d of DIR_LIST) {
        if (d.x === -o.dir.x && d.y === -o.dir.y) continue; // (its neck)
        const nx = at(heads[k].x + d.x), ny = at(heads[k].y + d.y);
        if (inside(nx, ny) && otherFree[ny * N + nx] - age <= 1) strikes[ny * N + nx] += strike; // (a body as seen, `age` ago)
      }
      // (Its powers reach further straight on: a dash three cells; anyone's
      // flash two, and anyone's leap LEAP_REACH + 1 if there's something in
      // front to hop (a golden one, whatever's in front). It may be resting
      // them: I can't tell. One I saw in the air comes down where its ring
      // is.
      // But a plain flash costs its rest, so a snake spends one racing for
      // food straight ahead of it, not to cross a cell it can't crawl to:
      // its flash I fear only with food on that line within its reach.)
      const fx = at(heads[k].x + o.dir.x), fy = at(heads[k].y + o.dir.y);
      const gold = o.dashes > 0 || o.leaps > 0, hop = inside(fx, fy) && otherFree[fy * N + fx] > 1;
      const far = Math.max(gold ? TUNE.DASH_LENGTH : TUNE.FLASH_LENGTH, gold || hop ? TUNE.LEAP_REACH + 1 : 1);
      if (o.air > 0 && o.land >= 0) strikes[o.land] += strike;
      const on = f => { for (let n = 1; n <= far + 1; n++) if (at(heads[k].x + o.dir.x * n) === f.x && at(heads[k].y + o.dir.y * n) === f.y) return true; return false; };
      if (gold || hop || food.some(f => f.kind !== 'mushroom' && on(f))) for (let i = 2; i <= far; i++) {
        const nx = at(heads[k].x + o.dir.x * i), ny = at(heads[k].y + o.dir.y * i);
        if (inside(nx, ny)) strikes[ny * N + nx] += strike * 0.5;
      }
      const stampZ = ++stamp;
      queue[0] = o.body[0].y * N + o.body[0].x;
      seen[queue[0]] = stampZ;
      let read = 0, write = 1;
      for (let s = 1; s <= age + 1; s++) {
        const levelEnd = write;
        while (read < levelEnd) {
          const i = queue[read++];
          for (let n = 4 * i; n < 4 * i + 4; n++) {
            const ni = nbr[n];
            if (ni < 0 || seen[ni] === stampZ || otherFree[ni] > s) continue;
            seen[ni] = stampZ;
            risk[ni] += w.zoneRisk;
            queue[write++] = ni;
          }
        }
      }
    });

    // Mushrooms come back up (round six B). Where a rival's head will be
    // after m more moves, as I'd guess: straight on from where I think it is
    // now, till something's in the way.
    const headAfter = (k, m) => {
      const o = others[k];
      let x = heads[k].x, y = heads[k].y;
      for (let n = 1; n <= m; n++) {
        const nx = x + o.dir.x, ny = y + o.dir.y;
        if (!inside(nx, ny) || otherFree[ny * N + nx] - age > n) break;
        x = nx; y = ny;
      }
      return { x, y };
    };
    // Where I could spit from to hit rival k after m moves (its head then,
    // as I'd guess it, SPIT_REACH ahead of mine, whichever way I'd face),
    // within `budget` moves of `from`: the nearest such cell, or null.
    const firingAt = (k, m, from, budget) => {
      const q = headAfter(k, m), R = TUNE.SPIT_REACH;
      let best = null, bestD = budget + 1;
      for (const d of DIR_LIST) {
        const x = q.x - d.x * R, y = q.y - d.y * R, dd = Math.abs(x - from.x) + Math.abs(y - from.y);
        if (inside(x, y) && !holes.has(y * N + x) && dd < bestD) { bestD = dd; best = { x, y }; }
      }
      return best;
    };
    // A segment's worth, in what the search counts an apple.
    const appleW = w.food * w.foodRange + w.eat;
    // Rivals with one in their cheek: it comes up SPIT_REACH ahead of their
    // head after the moves their bulge says (as I saw it, `age` ago), aimed
    // as they steer: likeliest straight on, else to a side. I keep my head
    // out of that ring when it comes, unless my own mouth is full then (it
    // bounces off). dodge: [move, cell, what it'd cost me] for each.
    const dodge = [];
    others.forEach((o, k) => {
      const m = (o.spitIn || 0) - age;
      if (m < 1 || m > steps || (me.spitIn || 0) >= m) return;
      const loss = Math.min(o.spitPower || TUNE.SHRINK, me.body.length - TUNE.MIN_LENGTH);
      if (loss <= 0) return;
      const p = headAfter(k, m), R = TUNE.SPIT_REACH;
      for (const d of DIR_LIST) {
        if (d.x === -o.dir.x && d.y === -o.dir.y) continue;
        const x = p.x + d.x * R, y = p.y + d.y * R;
        if (inside(x, y)) dodge.push(m, y * N + x, loss * appleW * (sameDir(d, o.dir) ? 1 : 0.5));
      }
    });
    // Mine: after me.spitIn moves it comes up SPIT_REACH ahead, the way I
    // face then. aim: [cell, worth] for each rival head I might hit there (a
    // segment of theirs SPIT_SEG of an apple, as many as it'd shrink them;
    // beside where I guess it'll be, a third: it may turn into it). Not one
    // whose own mouth is full by then: it would bounce off.
    const aimAt = me.spitIn || 0, aim = [];
    // (Till then, farther off than the search sees: I close in on the rival
    // I'd hit hardest, to about SPIT_REACH from its head, at the search's
    // last step. closeOn: [rival, worth].)
    const closeOn = [];
    if (AIM && aimAt > steps) {
      let bestV = 0, bx = 0, by = 0;
      others.forEach((o, k) => {
        if ((o.spitIn || 0) - age >= aimAt) return;
        const v = Math.min(me.spitPower || TUNE.SHRINK, o.body.length - TUNE.MIN_LENGTH), p = v > bestV && firingAt(k, aimAt, myHead, aimAt);
        if (p) { bestV = v; bx = p.x; by = p.y; }
      });
      if (bestV > 0) closeOn.push(bx, by, AIM * SPIT_SEG * appleW * bestV / 2);
    }
    if (AIM && aimAt >= 1 && aimAt <= steps) others.forEach((o, k) => {
      if ((o.spitIn || 0) - age >= aimAt) return;
      const v = AIM * SPIT_SEG * appleW * Math.min(me.spitPower || TUNE.SHRINK, o.body.length - TUNE.MIN_LENGTH);
      if (v <= 0) return;
      const q = headAfter(k, aimAt);
      aim.push(q.y * N + q.x, v);
      for (const d of DIR_LIST) if (inside(q.x + d.x, q.y + d.y)) aim.push((q.y + d.y) * N + q.x + d.x, v / 3);
    });

    // Reach: the soonest (in ticks from now) any rival could be in each cell,
    // spreading a cell a tick from where I last saw its head (once its stun
    // is over), round bodies and my own body as they are now. A gap I need
    // that a rival can reach first is a gap it could shut. (On the framed
    // board: a cell is free for a rival at s once reachBlock <= s, the time
    // it frees up of itself less `age`, since a rival's search starts then,
    // or that of my body, which is all there until now.)
    for (let i = 0; i < N * N; i++) reachBlock[framed[i]] = otherFree[i] - age;
    me.body.forEach((c, j) => { const i = c.y * N + c.x; reachBlock[framed[i]] = Math.max(otherFree[i] - age, me.body.length - j + me.grow); });
    // (A pit with a body across it is no barrier to a rival while it lasts:
    // it can ride across, on mine or any other's (never its own). Read as
    // open from now, for each rival in turn.)
    const rides = [];
    others.forEach((o, k) => { if (!o.air && !pitHole(o.body[0].y * N + o.body[0].x)) for (let j = 1; j < o.body.length; j++) { const i = o.body[j].y * N + o.body[j].x; if (pitHole(i)) rides.push(framed[i], k); } });
    me.body.forEach((c, j) => { const i = c.y * N + c.x; if (j > 0 && pitHole(i)) rides.push(framed[i], -1); });
    reach.fill(HOLE);
    others.forEach((o, k) => { // (from when it moved, or moves, again)
      for (let n = 0; n < rides.length; n += 2) if (rides[n + 1] !== k) { ridesWas[n >> 1] = reachBlock[rides[n]]; reachBlock[rides[n]] = Math.min(reachBlock[rides[n]], 0); }
      reachFrom(framed[o.body[0].y * N + o.body[0].x], (o.stun || 0) - age);
      for (let n = rides.length - 2; n >= 0; n -= 2) if (rides[n + 1] !== k) reachBlock[rides[n]] = ridesWas[n >> 1];
    });

    // How much food matters right now, given how long I already am. Hunger
    // trumps that: with under 10 s before I start starving, everyone goes
    // looking for food, harder the closer it gets (and food a rival may
    // reach first counts for more); desperate, harder still.
    const hunger = me.hungerLeft == null ? 0 : Math.min(1, Math.max(0, (TUNE.AI_HUNGRY_MS - me.hungerLeft) / TUNE.AI_HUNGRY_MS));
    // (Once the woodpecker's here nothing new grows: nobody can afford to be picky.)
    const lean = view.timeMs >= TUNE.SUDDEN_DEATH_MS;
    const fed = !hunger && !lean && myLen >= (w.hungryBelow ?? Infinity);
    const foodW0 = fed ? w.food * w.fedFactor : Math.max(w.food, 8 * hunger) * (1 + 2 * hunger);
    const eatW0 = fed ? w.eat * w.fedFactor : Math.max(w.eat, 150 * hunger) * (1 + 2 * hunger);
    const foodW = desperate ? Math.max(60, foodW0) : foodW0, eatW = desperate ? Math.max(600, eatW0) : eatW0;
    const contested = Math.max(Number(w.contested || 0), hunger);
    // Nerve: over food, the share of a rival's threat still counted, both its
    // head-on and where it may be by now (my persona's gamble at a contested
    // apple, not a reading of the risk: the maps stay as they are).
    const starved = me.hungerLeft == null ? 0 : Math.min(1, Math.max(0, 1 - me.hungerLeft / TUNE.HUNGER_MS));
    const nerveKeep = w.nerve ? 1 - Math.min(NERVE_MAX, (w.nerve.base || 0) + (w.nerve.hungry || 0) * starved) : 1;

    // How many ticks something I saw has left before it rots, withers or
    // flies off (in winter an apple rots twice as fast, and has done since I saw it).
    const ticksLeft = f => winter && f.kind === 'food' && !f.cooked ? (f.expires - view.tick - age) / 2 : f.expires - view.tick; // (baked, it keeps)

    // Food worth by kind. Negative means "avoid eating".
    const apple = w.normalFood ?? 1;
    const craving = w.golden || PLAIN_GOLD; // (for golden things: Star's)
    const worth = {
      food: Math.max(apple, hunger),
      golden: TUNE.GOLDEN_GROWTH * Math.max(apple, hunger) * craving.apple,
      beetle: TUNE.BEETLE_GROWTH * Math.max(apple, hunger), // it moves, but it's worth what it's worth
      pellet: w.pellet ?? 1,
      mushroom: Math.min(-TUNE.SHRINK, w.mushroom ?? -TUNE.SHRINK), // (it takes SHRINK segments off, and it isn't a meal: as many apples lost, hungry or not)
      leaf: 2 * Math.max(apple, hunger, 0.5) * craving.power, // (golden powers: worth it for what they do)
      goldcap: 1.5 * Math.max(apple, hunger, 0.5) * craving.power,
    };
    // A mushroom (round six B): it costs me as many apples as it's strong;
    // but with a shot, each segment's worth less the longer I am (a whole
    // apple up to 10 long), against the shot: as many segments off the nearest rival I could reach
    // with it (its head within a spit of where I'd swallow it) as it would
    // come back up strong, at SPIT_SEG of an apple each, times my taste for
    // it (w.spit) and the odds of a hit. Never better than a persona that
    // hates them says (w.mushroom), nor than nothing while my mouth is full.
    const spitTaste = w.spit ?? SPIT;
    const shroomWorth = f => {
      const power = f.power || TUNE.SHRINK, len = me.body.length + me.grow;
      let shot = 0;
      if (spitTaste > 0) others.forEach((o, k) => {
        const away = manhattan(f, myHead);
        if (away <= SPIT_NEAR && Math.abs(heads[k].x - f.x) + Math.abs(heads[k].y - f.y) <= SPIT_NEAR + TUNE.SPIT_REACH && (o.spitIn || 0) - age < away + TUNE.CHEEK_TICKS && firingAt(k, away + TUNE.CHEEK_TICKS, f, TUNE.CHEEK_TICKS)) shot = Math.max(shot, Math.min(Math.min(TUNE.SHRINK_MAX, power + 1), o.body.length - TUNE.MIN_LENGTH));
      });
      if (!shot) return Math.min(-power, w.mushroom ?? -power); // (no shot: what it costs anyone, as it always did)
      const lost = Math.min(power, Math.max(0, len - TUNE.MIN_LENGTH)) * Math.min(1, 10 / Math.max(1, len));
      const v = -lost + spitTaste * SPIT_HIT * SPIT_SEG * shot;
      return Math.min(v, w.mushroom ?? Infinity); // (desperate, w.mushroom is -SHRINK: no shots)
    };
    // My own beads aren't food: my head squashes one (round six B), and
    // then it's food for nobody (worth nothing to me in the search: valued
    // as a meal, it read as eating, and an aggressive rival took risks for
    // it). A rival's own beads are the same to it: whoever gets there
    // first, they're gone. mute: how many of my next moves eat nothing (none,
    // now there's no cough: kept for the search's tables). marks: where
    // there's food (stampFood), and my own beads (stampOwn).
    let mute = me.spitIn || 0; // (a mushroom in my cheek: my mouth is full till it's spat)
    const stampFood = ++stamp, stampOwn = ++stamp, marksEnd = stampOwn + 1;
    for (const f of food) marks[f.y * N + f.x] = f.kind === 'pellet' && f.owner === me.id ? stampOwn : stampFood;

    // (The burrows, as anyone sees them: nothing is knocked onto one, and a
    // scared beetle runs for one, one growing shut too: it can still dive in
    // until it closes over.)
    const burrows = [];
    if (view.burrows) for (const b of view.burrows) burrows.push(b.y * N + b.x);
    for (let k = 0; k < others.length; k++) coughs[k] = 0;
    const engine = window.SnakeEngine || {};
    // The woodpecker's mark: at the strike, each piece of food in it is
    // knocked aside to where the engine's own rule puts it (E.knocks: what
    // the rings show anyone through the aim, on the board as it will be at
    // the strike, tails moved on; and in its last PECK_PROMISE_TICKS moves
    // where the woodpecker promised), worked out on the board as I see it.
    // It's there from the strike on: the first move that can eat it is the
    // one after the strike's tick (`lands`). Never where it lies: that's a
    // hole by then, and the mark's no place to wait. (A beetle in the mark
    // runs from the beak as the search moves it, and is the bird's if it's
    // still there at the strike: see bugCrawl and knockBug.)
    foodFrom.fill(0);
    const strikeAt = mark.size && view.strikeAt != null && view.strikeAt >= view.tick && engine.knocks ? view.strikeAt : -1;
    const lands = strikeAt - view.tick + 2;
    const beakOf = strikeAt >= 0 && engine.beakDepth ? engine.beakDepth(mark, pitAt) : null; // (how far each cell of the mark is from the bark beyond, as the engine's beetles reckon it)
    let knocked = null, peckGame = null; // (knocked: cell -> where it lands, -1: the bird eats it)
    if (strikeAt >= 0) {
      peckGame = { snakes: [{ alive: true, body: me.body }, ...others.map(o => ({ alive: true, body: o.body, stunUntil: view.tick + Math.max(0, (o.stun || 0) - age) }))], food, burrows: view.burrows || [], holes, fires: NO_FIRES, tick: view.tick, woodpecker: { strikeAt } };
      knocked = new Map();
      for (const { food: f, to } of engine.knocks(peckGame, mark, view.landings)) {
        const from = f.y * N + f.x, i = to ? to.y * N + to.x : -1;
        knocked.set(from, i);
        if (i >= 0) { foodFrom[i] = lands; marks[i] = marks[from]; }
      }
    }
    const cellOf = f => {
      const i = f.y * N + f.x;
      if (knocked && knocked.has(i)) return knocked.get(i);
      return i;
    };

    // Per cell: foodValue is what eating it is worth (0 if nothing), foodGrow
    // what it does to my length (a mushroom takes off up to SHRINK; my own
    // bead, nothing). foodCells lists the cells worth something, and goldCells
    // the golden power food among them, for a craving that counts it even
    // where a rival may get there first. (Beetles are worked out apart: they move.)
    foodValue.fill(0); foodGrow.fill(0);
    let foodCount = 0, goldCount = 0, bugs = 0;
    const bugFood = [];
    for (const f of food) {
      if (f.kind === 'beetle' && bugs < BUGS) { bugFood[bugs++] = f; continue; }
      const own = f.kind === 'pellet' && f.owner === me.id, i = cellOf(f);
      if (i < 0) continue; // (nowhere to knock it: the bird eats it)
      foodGrow[i] = own ? 0 : f.kind === 'mushroom' ? -(f.power || TUNE.SHRINK) : f.kind === 'golden' ? TUNE.GOLDEN_GROWTH : f.kind === 'beetle' ? TUNE.BEETLE_GROWTH : f.cooked ? TUNE.COOKED_GROWTH : 1;
      let v = own ? 0 : f.kind === 'mushroom' ? shroomWorth(f) : worth[f.kind] ?? 0;
      if (!v) continue;
      if (f.cooked && v > 0) v *= TUNE.COOKED_GROWTH; // (baked: worth more)
      if (f.gold && v > 0) v *= 1.5 * craving.power; // (a golden beetle: leaps too)
      const away = foodFrom[i] ? Math.max(foodFrom[i], Math.abs(i % N - myHead.x) + Math.abs((i - i % N) / N - myHead.y)) : manhattan(f, myHead); // (knocked: where it lands, from when)
      if (f.expires != null && ticksLeft(f) < away) continue; // (it'll be gone before I get there)
      if (desperate && v > 0 && away > lifeTicks + 1) continue; // (I'd starve on the way)
      foodValue[i] += v;
      foodCells[foodCount++] = i;
      if (craving.contested && v > 0 && (f.gold || f.kind === 'leaf' || f.kind === 'goldcap')) goldCells[goldCount++] = i;
    }
    // (For the territory search, which can stop once I claim nothing more
    // unless food a rival gets to could still be mine: how long any rival
    // still coughs, and the rivals' own beads.)
    let coughMax = 0, beadCount = 0;
    for (let k = 0; k < others.length; k++) coughMax = Math.max(coughMax, coughs[k]);

    // Beetles: their ways are there for anyone to read. One crawls a cell
    // every BEETLE_EVERY ticks, straight on till something's in the way; with
    // a head within BEETLE_FEAR it scurries, a cell every BEETLE_SCARED_EVERY,
    // away from the nearest head (on its way if it can), toward a burrow
    // nearer than BEETLE_HOME_REACH, and dives in. Cornered (a head within
    // BEETLE_DIG_FEAR and no burrow in reach) it digs in where it is: it
    // stays put till it's gone, BEETLE_DIG ticks on, and leaves a burrow
    // there. (It wanders a little too, which nobody can read.) The search
    // moves each one along with every way it tries (it runs from my head
    // where the search puts it), and from where a search ends, it plays each
    // chase out: how soon I'd catch it going straight for it, or that it's
    // away first. The burrows are the ones anyone can see.
    let stampL = 0, stampC = 0, stampN = 0;
    for (let b = 0; b < bugs; b++) {
      const f = bugFood[b], o = b * SLOTS;
      bugV[b] = worth.beetle * (f.gold ? 1.5 * craving.power : 1);
      bugGold[b] = f.gold && craving.contested ? 1 : 0;
      bugUntil[b] = f.expires != null ? ticksLeft(f) : Infinity;
      if (desperate) bugUntil[b] = Math.min(bugUntil[b], lifeTicks + 1); // (I'd starve first)
      bugCell[o] = f.y * N + f.x; bugMoved[o] = f.movedAt ?? view.tick; bugDig[o] = f.digUntil > 0 ? f.digUntil : 0; bugDug[o] = -1;
      bugWay[o] = f.dir ? BUG_WAYS.findIndex(d => sameDir(d, f.dir)) : -1;
    }
    if (bugs) {
      stampL = ++stamp; stampC = ++stamp; stampN = ++stamp; // (my body as it is, and when each cell of it is left: a beetle can't go there)
      me.body.forEach((c, j) => { leaveStamp[c.y * N + c.x] = stampL; leave[c.y * N + c.x] = me.body.length - j + me.grow; });
    }
    // (For a beetle on cell c, at (x, y): the nearest rival's head, as I
    // reckon they are now, and the nearest burrow in reach, worked out the
    // first time a beetle's there.)
    function bugNear(c, x, y) {
      let d = HOLE, who = -1, home = -1, gap = TUNE.BEETLE_HOME_REACH;
      for (let k = 0; k < others.length; k++) { const e = Math.abs(x - headX[k]) + Math.abs(y - headY[k]); if (e < d) { d = e; who = k; } }
      for (let k = 0; k < burrows.length; k++) { const h = burrows[k], g = Math.abs(h % N - x) + Math.abs((h - h % N) / N - y); if (g < gap) { gap = g; home = h; } }
      nearStamp[c] = stampN; nearHead[c] = d; nearWho[c] = who; nearHome[c] = home; nearGap[c] = gap; nearBeak[c] = beakOf ? engine.beakGap(mark, beakOf, x, y) : 99;
    }
    // (The other beetle's state in slot s, for beetle b: where it's dug in
    // by then, a burrow's there. -1: there's no other.)
    const otherBug = (b, s) => bugs === 2 ? (1 - b) * SLOTS + s : -1;
    // A beetle's crawl after my move s + 1 (the tick s from now), with my
    // head then at (hx, hy): beetle b from its state in slot `from` into slot
    // `to`. In the engine's order: digging in, it stays put till it's gone;
    // cornered, it digs in; or it crawls, when it's time; then the
    // woodpecker's strike, which knocks it out of the mark. other: where
    // another beetle's state is then (see otherBug).
    const bugRest = Math.min(TUNE.BEETLE_SCARED_EVERY, TUNE.BEETLE_EVERY); // (it never crawls sooner than this)
    function bugStep(b, from, to, s, hx, hy, other) {
      const o = b * SLOTS, p = o + from, n = o + to, c = bugCell[p];
      bugCell[n] = c; bugWay[n] = bugWay[p]; bugMoved[n] = bugMoved[p]; bugDig[n] = bugDig[p]; bugDug[n] = bugDug[p];
      if (c < 0) return;
      const now = view.tick + s;
      bugCrawl(o, n, c, now, s, hx, hy, other >= 0 ? bugDug[other] : -1);
      if (now === strikeAt && bugCell[n] >= 0 && mark.has(bugCell[n])) knockBug(n);
    }
    function bugCrawl(o, n, c, now, s, hx, hy, dug) {
      const x = c % N, y = (c - x) / N;
      if (nearStamp[c] !== stampN) bugNear(c, x, y);
      const gap = beakOf && now <= strikeAt ? nearBeak[c] : 99, beak = -gap; // (the beak, as the engine's crawl has it: how far off the mark, less than 0 on it)
      if (bugDig[n] > 0 && gap < 0 && bugDig[n] > strikeAt) bugDig[n] = 0; // (a dig it can't finish before the strike: it runs instead)
      if (bugDig[n] > 0) { if (now >= bugDig[n]) { bugCell[n] = -1; bugDug[n] = gap < 0 ? -1 : c; } return; } // (digging in: there till it's gone, and a burrow's there, unless the beak's coming)
      let home = nearHome[c], homeGap = nearGap[c]; // (the nearest burrow in reach: another beetle's dig leaves one too)
      if (dug >= 0) { const g = Math.abs(dug % N - x) + Math.abs((dug - dug % N) / N - y); if (g < homeGap) { homeGap = g; home = dug; } }
      const since = now - bugMoved[n];
      let fear = Math.abs(x - hx) + Math.abs(y - hy), fx = hx, fy = hy, plan = 0;
      if (nearHead[c] < fear) { const k = nearWho[c]; fear = nearHead[c]; fx = headX[k]; fy = headY[k]; }
      const beaked = gap <= TUNE.BEETLE_FEAR;
      if (gap < 0) { // (under the beak: home if it can get there first, else off the mark, else it digs in, if it can be gone in time)
        const E = TUNE.BEETLE_SCARED_EVERY, first = Math.max(now, bugMoved[n] + E), inTime = m => first + E * (m - 1) <= strikeAt;
        if (home >= 0 && inTime(homeGap)) plan = 1;
        else if (inTime(beak)) plan = 2;
        else if (now + TUNE.BEETLE_DIG <= strikeAt) { bugDig[n] = now + TUNE.BEETLE_DIG; return; }
        else plan = 2;
        if (plan !== 1) home = -1;
        if (since < E) return;
      } else {
        if (home >= 0 && since < bugRest) return; // (too soon to crawl, scared or not, and with a burrow in reach it won't dig)
        if (home < 0 && fear <= TUNE.BEETLE_DIG_FEAR) { bugDig[n] = now + TUNE.BEETLE_DIG; return; } // (cornered: it digs in, and stays put)
        if (since < (fear <= TUNE.BEETLE_FEAR || beaked ? TUNE.BEETLE_SCARED_EVERY : TUNE.BEETLE_EVERY)) return;
        if (fear > TUNE.BEETLE_FEAR && !beaked) home = -1; // (only a scared one runs for home)
      }
      const fled = fear <= TUNE.BEETLE_FEAR, scared = fled || beaked;
      let best = -1, bestScore = -Infinity;
      for (let k = 0; k < 4; k++) {
        const nx = x + BUG_WAYS[k].x, ny = y + BUG_WAYS[k].y, ni = ny * N + nx;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || (mineFree[ni] > s + 1 && !(plan && beakOf.has(ni))) || (leaveStamp[ni] === stampL && leave[ni] > s + 1) || (nx === hx && ny === hy) || (ni !== bugCell[o] && marks[ni] >= stampFood && marks[ni] < marksEnd)) continue;
        let score = 0.5; // (its wandering, on average)
        const way = bugWay[n];
        if (k === way) score += 1.5; else if (way >= 0 && k === (way + 2) % 4) score -= 1;
        if (fled) score += 3 * (Math.abs(nx - fx) + Math.abs(ny - fy) - fear);
        if (home >= 0) score += (plan === 1 ? 4 : 2) * (homeGap - Math.abs(home % N - nx) - Math.abs((home - home % N) / N - ny));
        if (plan === 2 || (!plan && beaked)) { if (nearStamp[ni] !== stampN) bugNear(ni, nx, ny); score += 3 * (nearBeak[ni] - gap); }
        if (score > bestScore) { bestScore = score; best = k; }
      }
      if (best < 0) return;
      const ni = c + BUG_WAYS[best].y * N + BUG_WAYS[best].x;
      bugCell[n] = scared && (ni === dug || burrows.includes(ni)) ? -1 : ni; bugWay[n] = best; bugMoved[n] = now;
    }
    // The strike: a beetle still in the mark is the bird's (round six B, 2m).
    function knockBug(n) {
      bugCell[n] = -1; bugDug[n] = -1; bugDig[n] = 0;
    }
    // From a search's end (my head at (hx, hy) after t moves): the move I'd
    // catch beetle b on, going straight for it (the longer way first); too
    // far to tell, as many moves again as it's away then; or -1 if it's away
    // first (down a burrow, dug in, flown off, or I'd starve). (Searches that
    // end on the same cell, the beetle as it was, play out the same chase:
    // it's worked out once.)
    function bugCatch(b, t, hx, hy, other) {
      const p = b * SLOTS + t, at = b * N * N + hy * N + hx, k = CHASE_KEY * at, dug = other >= 0 ? bugDug[other] : -1;
      if (chaseKey[k] === stampC && chaseKey[k + 1] === t && chaseKey[k + 2] === mute && chaseKey[k + 3] === bugCell[p] && chaseKey[k + 4] === bugWay[p] && chaseKey[k + 5] === bugMoved[p] && chaseKey[k + 6] === bugDig[p] && chaseKey[k + 7] === dug) return chase[at];
      chaseKey[k] = stampC; chaseKey[k + 1] = t; chaseKey[k + 2] = mute; chaseKey[k + 3] = bugCell[p]; chaseKey[k + 4] = bugWay[p]; chaseKey[k + 5] = bugMoved[p]; chaseKey[k + 6] = bugDig[p]; chaseKey[k + 7] = dug;
      return (chase[at] = playChase(b, t, hx, hy, other));
    }
    function playChase(b, t, hx, hy, other) {
      const o = b * SLOTS;
      let from = BUG_SLOT;
      const p = o + t, q = o + from;
      bugCell[q] = bugCell[p]; bugWay[q] = bugWay[p]; bugMoved[q] = bugMoved[p]; bugDig[q] = bugDig[p]; bugDug[q] = bugDug[p];
      for (let m = t + 1; m <= BUG_AHEAD; m++) {
        const c = bugCell[o + from];
        if (c < 0 || m >= bugUntil[b]) return -1;
        const x = c % N, y = (c - x) / N, dx = Math.sign(x - hx), dy = Math.sign(y - hy);
        const along = Math.abs(x - hx) >= Math.abs(y - hy), nx = along ? hx + dx : hx, ny = along ? hy : hy + dy;
        if (!(mineFree[ny * N + nx] > m)) { hx = nx; hy = ny; } else if (along && dy) hy += dy; else if (!along && dx) hx += dx;
        if (hx === x && hy === y && m > mute) return m;
        const to = from === BUG_SLOT ? BUG_SLOT + 1 : BUG_SLOT;
        bugStep(b, from, to, m - 1, hx, hy, other);
        from = to;
      }
      const c = bugCell[o + from];
      if (c < 0) return -1;
      const m = BUG_AHEAD + Math.abs(c % N - hx) + Math.abs((c - c % N) / N - hy);
      return bugDig[o + from] > 0 && view.tick + m - 1 > bugDig[o + from] ? -1 : m; // (digging in: gone before I'd get there)
    }

    // Can my head step into cell (x, y) as move number `step` from now?
    function canEnter(body, len, grow, x, y, step) {
      if (!inside(x, y) || (mineFree[y * N + x] > step && !(bridgeUntil[y * N + x] > step))) return false; // (a bridge: while it lasts)
      const keep = grow > 0 ? len : len - 1;
      for (let j = 0; j < keep; j++) if (body[j].x === x && body[j].y === y) return false;
      return true;
    }

    // The board as a line of mine leaves it for the rivals, for the neck
    // test: my body is the first `len` cells of `body`, t moves on. Unlike
    // `reach`, which reads the board as it is now, the cells my line has
    // moved into since are mine from when I got there, so a rival my line has
    // sealed off (the one I've pinned against the edge, say) can't come round
    // through me. (lineOn marks those cells, in lineMark with lineStamp, and
    // when I'm in each, lineIn to lineOut; lineFree: whether a cell is free
    // for a rival at s, ticks from now.)
    let lineStamp = 0;
    function lineOn(body, len, grow, t) {
      lineStamp = ++stamp;
      for (let j = 0, n = Math.min(t, len); j < n; j++) { const p = framed[body[j].y * N + body[j].x]; lineMark[p] = lineStamp; lineIn[p] = t - j; lineOut[p] = len - j + grow + t; }
    }
    const lineFree = (q, s) => reachBlock[q] <= s && (lineMark[q] !== lineStamp || s < lineIn[q] || s >= lineOut[q]);
    // A timed flood fill over that board from rival k's head (every rival's,
    // k < 0), from when it moves again, to `by` at the latest: into lineAt,
    // the soonest it's in each cell it gets to (marked in seenH with the stamp
    // it returns), or with cap > 0, only how many cells, up to cap (marked in
    // lineSeen: what it found for the neck test is kept).
    function lineFill(k, by, cap) {
      const stampL = ++stamp, Q = queue, S = cap > 0 ? lineSeen : seenH, A = lineAt, Wd = W;
      let read = 0, write = 0, count = 0, first = HOLE, last = -HOLE;
      for (let o = 0; o < others.length; o++) if (k < 0 || o === k) { const s0 = (others[o].stun || 0) - age; first = Math.min(first, s0); last = Math.max(last, s0); }
      for (let s = first; s <= by; s++) {
        const levelEnd = write;
        while (read < levelEnd) {
          const p = Q[read++];
          let q = p - Wd;
          if (S[q] !== stampL && lineFree(q, s)) { S[q] = stampL; A[q] = s; Q[write++] = q; count++; }
          q = p + Wd;
          if (S[q] !== stampL && lineFree(q, s)) { S[q] = stampL; A[q] = s; Q[write++] = q; count++; }
          q = p - 1;
          if (S[q] !== stampL && lineFree(q, s)) { S[q] = stampL; A[q] = s; Q[write++] = q; count++; }
          q = p + 1;
          if (S[q] !== stampL && lineFree(q, s)) { S[q] = stampL; A[q] = s; Q[write++] = q; count++; }
        }
        for (let o = 0; o < others.length; o++) { // (a rival moves again from here: where I saw it, as `reach` has it)
          const h = others[o].body[0], p = framed[h.y * N + h.x];
          if ((k < 0 || o === k) && (others[o].stun || 0) - age === s && S[p] !== stampL) { S[p] = stampL; A[p] = s; Q[write++] = p; }
        }
        if ((cap > 0 && count >= cap) || (read === write && s >= last)) break;
      }
      return cap > 0 ? Math.min(count, cap) : stampL;
    }
    // The rival I'm hunting: whether it's sealed in already, with less room
    // than its length, whatever I do (then closing it in is nothing new).
    const victimLen = ctx.victim >= 0 ? others[ctx.victim].body.length : 0;
    lineStamp = -1; // (no line: the board as it is)
    const victimShut = ctx.victim >= 0 && lineFill(ctx.victim, HOLE, victimLen) < victimLen;

    let ateAt = -HOLE; // (the step the line being scored last ate at)
    function evaluate(body, len, grow, t) {
      const L = len + grow;
      const head = body[0];
      const headI = head.y * N + head.x;
      // A cell can be entered at absolute time T (ticks from now) once its
      // occupant has left: mineFree (or otherFree, for a rival) <= T, and my
      // own body, placed at time t, needs its own time (len - j + grow for
      // segment j) <= T - t.

      // 1. Room: timed flood fill from my head (tail cells open up as I move).
      //    It also finds the best food by distance alone, ignoring rivals.
      //    queue[read, write) is still to expand; it holds one distance at a time.
      //    Two more things it notes, for the trap tests at the end:
      //    - how soon I can get onto my own trail (a cell my body leaves
      //      before I get there): from there I can chase my tail round and
      //      round, so I'm not trapped however little room there is;
      //    - necks: a distance the fill gets through only one or two cells
      //      wide, while the room before it is less than I need. Everything
      //      beyond is through that gap (its cells, the room before it and
      //      its distance go in `necks`).
      //    It runs on the territory board (see 2.), with my body placed on it
      //    at time t: a cell is free for me at time t + d unless that or
      //    meLater says it's still taken.
      const headP = framed[headI], bodyMark = ++stamp;
      terr.set(terrFree);
      for (let j = 0; j < len; j++) { const p = framed[body[j].y * N + body[j].x], b = terrFree[p], m = len - j + grow + t; terr[p] = b > m ? b : m; inBody[p] = bodyMark; }
      const cap = L * 2 + 20;
      const need = L + w.margin;
      const stampF = ++stamp;
      // A contested-food eater keeps searching past the room cap until it sees
      // food, so it looks for food as it goes; anyone else, once it's done.
      const eager = !!w.contested;
      let anyFood = fillRoom(headP, t, cap, need, eager, w.foodRange, mute, bodyMark, stampF, laterCount), space = room[0];
      const trail = room[1], neckCount = room[2];
      if (!eager) { // (the food the fill got to, but my head's own cell)
        for (let k = 0; k < foodCount; k++) {
          const i = foodCells[k], v = foodValue[i], p = framed[i];
          if (v > 0 && seenF[p] === stampF && p !== headP) {
            const at = t + distF[p];
            anyFood = Math.max(anyFood, v * (foodFrom[i] > at ? latePull(w.foodRange, t, at, foodFrom[i], mute) : Math.max(0, w.foodRange + t - Math.max(at, mute + 1))));
          }
        }
      }
      space = Math.min(space, cap);
      // (What the hunting and the thrill (see 4. and on) want of the board as it
      // is, before the territory search claims it: the victim's room, and
      // how much right next to my head is taken a move on, the edge too.)
      const victimRoom = ctx.victim >= 0 ? roomOn(framed[heads[ctx.victim].y * N + heads[ctx.victim].x]) : 0;
      let edge = 0;
      if (w.thrill) for (const q of [headP - W, headP + W, headP - 1, headP + 1]) if (terr[q] > t + 1 || meLater[q] > t + 1) edge++;

      // 2. Territory: multi-source BFS, opponents start at their last seen
      //    head `age` ticks in the past, I start at my head at time t.
      //    Sources go in time order: the rivals all start at -age, and on a
      //    tie I go first. It runs on its own board (terr: see the buffers),
      //    with my body placed on it at time t: a cell is claimed at T + 1
      //    once whoever's in it has left (the free tables count ticks from
      //    now: a rival's search starts in the past, when everything empty
      //    now was empty too), and terr says when that is for anyone, or
      //    whose it is since when: CLAIMED + (T + age) * 2^bits + tag, where
      //    the tag is 1 for me, k + 2 for rival k and 0 once contested.
      const bits = tagBits;
      let ns = 0;
      const meFirst = t <= -age;
      if (meFirst) { srcI[ns] = headP; srcT[ns] = t; srcOwn[ns++] = 1; }
      for (let k = 0; k < others.length; k++) {
        const h = others[k].body[0];
        srcI[ns] = framed[h.y * N + h.x]; srcT[ns] = -age; srcOwn[ns++] = k + 2;
      }
      if (!meFirst) { srcI[ns] = headP; srcT[ns] = t; srcOwn[ns++] = 1; }
      // Once I claim nothing more, the rest is the rivals sharing out what's
      // left among themselves, which counts only for an aggressive snake,
      // or where a rival claims food it can't eat (it's coughing, or it's
      // its own bead): with none of that, the search can stop there.
      spread(ns, t, age, bits, tags, !w.aggression, coughMax, beadCount);
      const mine = tally[0], theirs = tally[1]; // (how many cells are mine, and how many the rivals')

      // 3. Food: a steady pull of foodW per step closer. Normally only food I
      //    reach before any rival counts in full, or that a rival gets to
      //    but can't eat (its own bead, or it's coughing and I can be there
      //    before it's over). (What I'd reach coughing, I'd only nudge: it's
      //    a meal once I'm over it, if no rival could get there before that.)
      //    Food the woodpecker will knock to a cell is there from the strike
      //    on: mine as any food is, if I'd get there first (whoever's nearer
      //    is nearer as it lands, if both wait for it), from when it lands.
      let foodScore = 0;
      for (let k = 0; k < foodCount; k++) {
        const i = foodCells[k], v = foodValue[i], s = terr[framed[i]], from = foodFrom[i];
        if (v <= 0 || s < CLAIMED) continue;
        let when = ((s - CLAIMED) >> bits) - age, early = 0;
        if ((s & tags) !== 1) {
          const o = (s & tags) - 2;
          if (o < 0) continue;
          const can = coughs[o]; // (till when it can't eat it: never, now)
          if (Math.max(when, from) > can) continue;
          when = Math.max(from, t + (seenF[framed[i]] === stampF ? distF[framed[i]] : Math.abs(i % N - head.x) + Math.abs((i - i % N) / N - head.y))); // (as the crow flies, past my room's count)
          if (when > can) continue;
        } else {
          if (from > when) { early = EARLY * (from - when); when = from; } // (see latePull)
          if (when <= mute && reach[framed[i]] <= mute) continue;
        }
        foodScore = Math.max(foodScore, v * Math.max(0, w.foodRange - (Math.max(when, mute + 1) - t) + early));
      }
      //    The beetles: how soon I'd catch each from here, playing the chase
      //    out (it runs, or digs in), or too far to tell, how far it is;
      //    nothing if it's away first. Mine if it's where I'd get to first
      //    now. A longer chase counts BUG_HURRY times a step further (or
      //    w.hurry: a beetle-eater keeps after one longer).
      for (let b = 0; b < bugs; b++) {
        const c = bugCell[b * SLOTS + t];
        if (c < 0) continue;
        const m = bugCatch(b, t, head.x, head.y, otherBug(b, t));
        if (m <= 0) continue;
        const pull = bugV[b] * Math.max(0, w.foodRange - (w.hurry ?? BUG_HURRY) * (m - t));
        if (terr[framed[c]] >= CLAIMED && (terr[framed[c]] & tags) === 1) foodScore = Math.max(foodScore, pull);
        else anyFood = Math.max(anyFood, pull);
        if (bugGold[b]) foodScore = Math.max(foodScore, craving.contested * pull);
      }
      // The rest counts as much as I care (contested: hunger raises it), and
      // with nothing uncontested I drift toward the nearest anyway, more weakly.
      foodScore = Math.max(foodScore, (foodScore ? contested : Math.max(0.3, contested)) * anyFood);
      // A craving: golden power food anywhere, a rival's side or not (as the crow flies; knocked, from when it lands).
      for (let k = 0; k < goldCount; k++) {
        const i = goldCells[k], v = foodValue[i], x = i % N;
        if (v > 0) foodScore = Math.max(foodScore, craving.contested * v * Math.max(0, w.foodRange - Math.max(Math.abs(x - head.x) + Math.abs((i - x) / N - head.y), foodFrom[i] - t)));
      }

      let score = w.space * space
        + w.territory * mine
        - (w.aggression || 0) * theirs
        + foodW * foodScore;

      // 4. Hunting: shrink the victim's room and get in front of it.
      if (ctx.victim >= 0) {
        score -= w.hunt.squeeze * victimRoom;
        score -= w.hunt.chase * manhattan(head, ctx.target);
      }

      // 5. Distance from rivals: from the nearest head (Ghost), or per rival.
      if (w.distance) {
        let nearest = DISTANCE_CAP;
        for (const h of heads) nearest = Math.min(nearest, manhattan(head, h));
        score += w.distance * nearest;
      }
      if (ctx.avoid) {
        for (let k = 0; k < heads.length; k++) score += ctx.avoid[k] * Math.min(DISTANCE_CAP, manhattan(head, heads[k]));
      }

      // 6. Hovering about `dist` from a chosen snake's head.
      if (ctx.lure >= 0) score -= w.lure.weight * Math.abs(manhattan(head, heads[ctx.lure]) - w.lure.dist);

      // Heading for a spot (Colonist's next flag).
      if (ctx.goal) score -= w.goal * manhattan(head, ctx.goal);

      // Desperado: the closer to danger, the better.
      if (w.thrill) {
        for (const h of heads) if (manhattan(head, h) <= 3) edge++;
        score += w.thrill * edge;
      }

      // 7. Staying home.
      if (ctx.home) {
        const out = Math.hypot(head.x - ctx.home.x, head.y - ctx.home.y) - ctx.home.radius - TUNE.LAND_REACH;
        if (out > 0) score -= w.home.leave * out;
      }

      // 8. Coiling: once long enough, keeping my head close behind my own tail,
      //    so I move as a ring (anything inside it is boxed in).
      if (w.coil && len >= w.coil.from) score += w.coil.weight * Math.max(0, 5 - manhattan(head, body[len - 1]));

      //    Thick walls (the trappers): my own body beside my head (not my
      //    neck). Doubled back along myself, my wall is two thick: nobody
      //    can hop it, and no plain flash can cut it (round six B: Mason's
      //    double walls).
      if (w.thick) {
        const neckP = framed[body[1].y * N + body[1].x];
        for (const q of [headP - W, headP + W, headP - 1, headP + 1]) if (q !== neckP && inBody[q] === bodyMark) score += w.thick;
      }

      // 9. Riding just behind a rival's tail.
      if (w.tail) {
        let best = 0;
        for (const o of others) {
          if (o.body.length < 8) continue; // short snakes' heads are too close to their tails
          best = Math.max(best, 4 - manhattan(head, o.body[o.body.length - 1]));
        }
        score += w.tail * best;
      }

      // Trapped: less room than I need, and no way onto my own trail.
      if (space < need && trail === HOLE) return score - TRAPPED - 100 * (need - space);
      // Nearly as bad: the room I need is through a neck that a rival could
      // get to and shut before I'm through, leaving me only the pocket on my
      // side of it. (Necks nearest first; one I'd get through well before
      // any rival could get there is mine to pass, and a pocket with my own
      // trail in it I can circle. Where the board as it is now says a rival
      // could, I look again with my line on it: see lineOn.)
      let filled = 0, closes = -1;
      for (let k = 0; k < neckCount; k += 4) {
        const d = necks[k + 3], slack = t - ateAt <= MEAL_PLIES ? MEAL_DAWDLE : d === 1 ? PINNED_DAWDLE : DAWDLE, by = t + d + slack;
        if (trail < d) break;
        const a = necks[k], b = necks[k + 1];
        if (reach[a] > by || reach[b] > by) continue;
        if (!filled) { // (once, as far on as any neck needs)
          let far = 0;
          for (let n = k; n < neckCount; n += 4) far = Math.max(far, necks[n + 3]);
          lineOn(body, len, grow, t);
          filled = lineFill(-1, t + far + Math.max(PINNED_DAWDLE, DAWDLE), 0);
        }
        const shut = seenH[a] === filled && seenH[b] === filled ? Math.max(lineAt[a], lineAt[b]) : HOLE;
        if (shut > by) continue;
        // A pin I close isn't a pin on me either: like a meal, the rival I
        // hunt is against the edge (or a body) only because it was there,
        // and I leave on my next move. So on a line that seals it in (less
        // room than its length, where it had that room), only a rival that
        // could get to the gap about as soon as I could makes it a trap.
        if (shut > t + d + MEAL_DAWDLE && ctx.victim >= 0 && !victimShut) {
          if (closes < 0) closes = lineFill(ctx.victim, HOLE, victimLen) < victimLen ? 1 : 0;
          if (closes) continue;
        }
        return score - Math.min(NECK + 50 * (need - necks[k + 2]), TRAPPED - 1); // (never worse than a sure trap, however long I am)
      }
      return score;
    }

    // While the edges wrap for me (a golden mushroom): how many steps ahead
    // that still holds (ticks are about 110 ms), and a step across an edge
    // (a neck on the far side) read as the one step it is.
    const wrapSteps = Math.floor((me.wrap || 0) / 130);
    const unit = v => v > 1 ? -1 : v < -1 ? 1 : v;

    // Score of moving `d` as step t + 1, then playing on for `depth - 1` more steps.
    // `body` is the first `len` cells; the moved body goes into bodies[t + 1].
    function move(body, len, grow, d, depth, t, bonus) {
      let nx = body[0].x + d.x, ny = body[0].y + d.y;
      if (t < wrapSteps) { nx = (nx + N) % N; ny = (ny + N) % N; } // (the edges wrap for me a while yet)
      if (!canEnter(body, len, grow, nx, ny, t + 1)) return null;
      const i = ny * N + nx;
      const turning = d.x !== unit(body[0].x - body[1].x) || d.y !== unit(body[0].y - body[1].y);
      // New head in front; the tail moves up unless I'm still growing.
      let g = grow, nlen = len + 1;
      if (g > 0) g--; else nlen--;
      // Eating must beat the pull that food had on us, plus a bonus for eating sooner.
      // Coughing, I eat nothing (what I reach is nudged aside); choking on my
      // own bead, I cough from here on. The beetles run from where this puts
      // me. (Food the woodpecker knocks here isn't here till the strike.)
      const was = foodValue[i], muted = t + 1 <= mute, late = foodFrom[i] > t + 1, here = late ? 0 : was;
      let caught = -1;
      if (!muted) for (let b = 0; b < bugs; b++) if (bugCell[b * SLOTS + t] === i) { caught = b; break; }
      const v = muted ? 0 : here + (caught >= 0 ? bugV[caught] : 0);
      const change = muted ? 0 : (late ? 0 : foodGrow[i]) + (caught >= 0 ? TUNE.BEETLE_GROWTH : 0);
      const muteWas = mute;
      if (change < 0) { // a mushroom: pending growth goes first, then the tail (and my mouth is full a while)
        mute = t + 1 + TUNE.CHEEK_TICKS;
        let n = -change;
        const fromGrow = Math.min(g, n);
        g -= fromGrow;
        n -= fromGrow;
        for (; n > 0 && nlen > TUNE.MIN_LENGTH; n--) nlen--;
      } else g += change;
      const nb = bodies[t + 1];
      nb[0].x = nx; nb[0].y = ny;
      for (let j = 1; j < nlen; j++) { nb[j].x = body[j - 1].x; nb[j].y = body[j - 1].y; }
      if (!muted && !late) foodValue[i] = 0; // (eaten, or spat aside)
      for (let b = 0; b < bugs; b++) {
        if (b === caught) { const n = b * SLOTS + t + 1; bugCell[n] = -1; bugDug[n] = -1; } else bugStep(b, t, t + 1, t, nx, ny, otherBug(b, t));
      }
      const ateBefore = ateAt;
      if (v > 0) ateAt = t + 1;
      const ahead = t < STEPS_AHEAD;
      // (A rival's head beside a cell: a head-on on my first move; on my
      // next `age`, its body, if it went there, which I can't see yet; after
      // that I'd see where it went in time to turn.)
      const keep = v > 0 ? nerveKeep : 1; // (my nerve over food; times 1, the very same numbers)
      let gain = v * (foodW * w.foodRange + eatW * (ahead ? SOONER[t] : Math.pow(0.85, t))) - risk[i] * keep * (ahead ? RISK_AHEAD[t] : Math.pow(0.6, t)) - (t <= age ? strikes[i] * keep * RISK_AHEAD[t] : 0);
      if (turning && w.turn) gain -= w.turn * (ahead ? TURN_AHEAD[t] : Math.pow(0.9, t));
      // (A mushroom coming up: mine aimed at a head, as I face after this
      // move; a rival's ring, my head kept out of it.)
      if (t + 1 === aimAt && aim.length) {
        const ax = nx + d.x * TUNE.SPIT_REACH, ay = ny + d.y * TUNE.SPIT_REACH;
        if (inside(ax, ay)) { const a = ay * N + ax; for (let n = 0; n < aim.length; n += 2) if (aim[n] === a) gain += aim[n + 1]; }
      }
      for (let n = 0; n < dodge.length; n += 3) if (dodge[n] === t + 1 && dodge[n + 1] === i) gain -= dodge[n + 2];
      if (closeOn.length && t + 1 === steps) { // (on my way to where I'd spit from: there by the time it comes up)
        const dist = Math.abs(nx - closeOn[0]) + Math.abs(ny - closeOn[1]), late = Math.max(0, dist - (aimAt - t - 1));
        gain += closeOn[2] * (Math.max(0, 1 - late / 4) - 0.02 * dist);
      }
      const score = depth <= 1
        ? evaluate(nb, nlen, g, t + 1) + bonus + gain
        : search(nb, nlen, g, depth - 1, t + 1, bonus + gain);
      foodValue[i] = was;
      mute = muteWas;
      ateAt = ateBefore;
      return score;
    }

    function search(body, len, grow, depth, t, bonus) {
      const backX = unit(body[1].x - body[0].x), backY = unit(body[1].y - body[0].y);
      let best = -Infinity;
      for (const d of DIR_LIST) {
        if (d.x === backX && d.y === backY) continue;
        const s = move(body, len, grow, d, depth, t, bonus);
        if (s !== null) best = Math.max(best, s);
      }
      // Dead end: dying later beats dying sooner.
      return best === -Infinity ? DEAD + t * 1000 : best;
    }

    // A move that looks fatal: a wall, a hole or my own body certainly is, but
    // a rival's cell may already be free (I see rivals as they were a moment
    // ago), so if it comes to that, the one that frees up soonest is the best bet.
    // Better than any crash, though, is going through fire: it costs as much
    // as a crash, but I keep moving (never just as a shortcut: only when
    // every other way is a crash or worse).
    function throughFire(x, y) {
      if (!inside(x, y) || !fire.has(y * N + x)) return false;
      const keep = me.grow > 0 ? me.body.length : me.body.length - 1;
      for (let j = 0; j < keep; j++) if (me.body[j].x === x && me.body[j].y === y) return false;
      for (const o of others) for (const c of o.body) if (c.x === x && c.y === y) return false;
      return true;
    }
    function maybeFree(x, y) {
      if (!inside(x, y) || holes.has(y * N + x)) return 0;
      const keep = me.grow > 0 ? me.body.length : me.body.length - 1;
      for (let j = 0; j < keep; j++) if (me.body[j].x === x && me.body[j].y === y) return 0;
      return 1000 - Math.min(999, mineFree[y * N + x]);
    }

    let bestDir = me.dir, bestScore = -Infinity;
    for (const d of DIR_LIST) {
      if (d.x === -me.dir.x && d.y === -me.dir.y) continue;
      let s = move(me.body, me.body.length, me.grow, d, depth, 0, 0);
      if (s === null) {
        const nx = myHead.x + d.x, ny = myHead.y + d.y;
        s = throughFire(nx, ny) ? 1.5 * DEAD : 2 * DEAD + maybeFree(nx, ny);
      }
      else if (ctx.mimicDir && sameDir(d, ctx.mimicDir)) s += w.mimic;
      s += Math.random() * 1e-3; // tie-break
      if (s > bestScore) { bestScore = s; bestDir = d; }
    }
    // Powers: each weighed as a move. The same search as crawling, from
    // where the power leaves me and to the same horizon, plus what it eats on
    // the way, less the risk where it lands and a price in apples (what an
    // apple is worth to me right now). Pressed only when it beats the best
    // crawl, and asked for just as a person presses (memory.flash, memory.power).
    const pick = powerPick(bestScore, bestDir);
    if (pick) {
      bestDir = pick.d;
      if (pick.flash) memory.flash = view.tick;
      else { memory.power = view.tick; memory.leapNow = pick.now ? view.tick : -1; memory.fly = pick.fly || 0; memory.flyTurn = pick.turn || null; } // (pressed twice for now; held for as far as it means to fly, steered where it means to turn)
    }
    return bestDir;

    // - The flash, rested: two cells in a tick along the ground, every one
    //   of them free by then, only the way I'd crawl anyway (or any way out
    //   of a crash). It costs two apples (it's free, but it rests: at one,
    //   rivals flashed three times a minute and did no better than the same
    //   rivals never flashing, or worse; an edge that small is mostly the
    //   search's own guesswork), or one to win a race (food a rival could
    //   reach as soon as I'd crawl there, but not as soon as I'd flash) or
    //   to get out of a crash. (Weighing every way cost half as much again
    //   as the whole decision, for a third more flashes; the rest were no
    //   better for it.)
    // - Golden dashes: only to cut someone in two (more readily the more
    //   aggressive I am), to grab something golden first, or as the way out.
    //   (Spent on speed, they stopped cutting anyone.)
    // - Golden leaps: whenever one pays (they're free, and held they're wasted).
    // - The plain jump: out of a crash, or to come down on food (it costs a
    //   segment and a rest: jumping for position, or just in case, lost).
    // Desperate, every power is half the price. (Nobody's told anyone's rests.)
    // A power habit (w.powers: Star's) prices them all far lower, and may
    // weigh the flash every way, jump any hurdle there's somewhere to land
    // beyond that no rival could get to first, and spend golden dashes on
    // speed (at the full price: free, it threw both away at once); by the
    // same tests of where each goes (it never takes one into a crash) and the
    // same risk where it ends. One that ends where a rival could strike costs
    // it the full price.
    function powerPick(crawl, crawlDir) {
      const jump = me.leaps > 0 || (me.leapIn === 0 && me.body.length > TUNE.MIN_LENGTH);
      if (me.flashIn !== 0 && !jump) return null;
      const U = Math.max(40, foodW * w.foodRange + eatW); // (an apple, to me, now)
      const habit = w.powers || NO_HABIT, safe = habit.risk ?? Infinity;
      const cheap = desperate ? 0.5 : 1;
      const keep = me.grow > 0 ? me.body.length : me.body.length - 1, stampM = ++stamp;
      for (let j = 0; j < keep; j++) myCells[me.body[j].y * N + me.body[j].x] = stampM;
      const trapped = crawl < DEAD / 2, boxed = crawl < -NECK;
      let hereFree = -1, hereFood = false, landFood = false; // (the free log round me, and whether there's food on it: see islandGain) // (boxed: the crawl leaves me less room than I need, or only through a gap a rival could shut)
      const pecks = view.pecks; // (the woodpecker's mark, if I'm shown it apart from the holes)
      const cellAt = (x, y) => {
        if (me.wrap > 0) { x = (x + N) % N; y = (y + N) % N; } // (the edges wrap for me)
        return inside(x, y) ? y * N + x : -1;
      };
      const free = i => i >= 0 && myCells[i] !== stampM && mineFree[i] <= 1; // (free by next tick)
      // Something to hop: a body still there next tick (mine too), or fire;
      // a hole, if I can tell it from the woodpecker's mark (a mark isn't a
      // hole yet: I'd crawl in), or if it's that or a crash.
      const hurdle = i => myCells[i] === stampM || (mineFree[i] > 1 && (mineFree[i] < HOLE || fire.has(i) || (pecks ? !pecks.has(i) : trapped)));
      const path = new Int32Array(Math.max(3, TUNE.LEAP_REACH + 1, TUNE.GOLD_FLY + 1));
      const straight = new Int32Array(path.length); // (the straight way, kept while a turned flight is tried in path)
      let leapNow = false, leapFly = 0, leapTurn = null; // (how the best jump leapOpt found goes: pressed twice, now; held, a golden flight's cells in the air, and its turn: { at: cells flown, dir })
      const ate = [-1, -1, -1], ateV = [0, 0, 0];
      let ateL = 0, ateG = 0, ateGain = 0, endRisk = 0, idle = false, muteWas = 0, ateBug = 0, ateWas = -HOLE; // (endRisk: the risk where the last one weighed ends; idle: it was a golden dash just for speed; muteWas, ateBug (which beetles, a bit each): for uneat)
      const meal = (i, step) => foodValue[i] > 0 && foodFrom[i] <= step; // (food there, on my move `step`)
      // (Each beetle's crawl after my move s + 1, my head then at (hx, hy):
      // the ones I ate there are gone.)
      const bugsOn = (s, hx, hy) => { for (let b = 0; b < bugs; b++) if (ateBug & (1 << b)) { const n = b * SLOTS + s + 1; bugCell[n] = -1; bugDug[n] = -1; } else bugStep(b, s, s + 1, s, hx, hy, otherBug(b, s)); };
      const cutter = !!w.hunt || (w.aggression || 0) >= 0.5; // (the hunters and the aggressive weigh a cut off to the side too)
      let best = null, ownCut = -1; // (ownCut: see flashOpt)
      const consider = (d, flash, v, price, extra) => {
        const full = endRisk > safe || idle;
        idle = false;
        if (v === null) return;
        v += extra - price * cheap * (full ? 1 : habit.price) * U;
        if (v > (best ? best.v : crawl + 1)) best = { d, flash, v, now: !flash && leapNow, fly: flash ? 0 : leapFly, turn: flash ? null : leapTurn };
      };
      for (const d of DIR_LIST) {
        if (d.x === -me.dir.x && d.y === -me.dir.y) continue;
        const extra = (ctx.mimicDir && sameDir(d, ctx.mimicDir) ? w.mimic : 0) - (w.turn && !sameDir(d, me.dir) ? w.turn : 0);
        if (me.dashes > 0) consider(d, true, flashOpt(d, true), 0.6, extra);
        else if (me.flashIn === 0 && (trapped || d === crawlDir || habit.everyWay || (cutter && bodyNear(d)))) consider(d, true, flashOpt(d, false), trapped || race(d) ? 1 : 2, extra);
        if (jump) { const v = leapOpt(d); consider(d, false, v, (me.leaps > 0 ? 0.35 : TUNE.LEAP_COST + 0.5) * (leapNow ? w.leapNow ?? 1 : 1), extra); } // (leap now, at its price to my style)
      }
      return best;

      // A race: food straight on, or that way, that a rival could get to
      // just as soon as I'd crawl there (but not as soon as I'd flash there,
      // a tick sooner).
      function race(d) {
        for (const f of food) {
          const i = f.y * N + f.x, k = Math.abs(f.x - myHead.x) + Math.abs(f.y - myHead.y);
          if (foodValue[i] > 0 && reach[framed[i]] === k && Math.abs(f.x - myHead.x - 2 * d.x) + Math.abs(f.y - myHead.y - 2 * d.y) === k - 2) return true;
        }
        return false;
      }

      // The cells a power passes, from my head, into path; false if one's off the board.
      function trace(d, n) {
        let x = myHead.x, y = myHead.y;
        for (let i = 0; i < n; i++) {
          const c = cellAt(x + d.x, y + d.y);
          if (c < 0) return false;
          x = c % N; y = (c - x) / N;
          path[i] = c;
        }
        return true;
      }

      // The island hop, as the engine takes it: up over what's right in
      // front, on over up to LEAP_REACH cells of hurdles, a cell a tick, and
      // down on the first free cell beyond, the tick after the last (span:
      // the cells it goes over; down span + 1 moves from now).
      function leapOpt(d) {
        const golden = me.leaps > 0;
        leapNow = false; leapFly = 0; leapTurn = null;
        let span = 0, n = 0; // (n: the cells on the board traced)
        const far = golden ? TUNE.GOLD_FLY : TUNE.LEAP_REACH;
        for (let x = myHead.x, y = myHead.y; n <= far; ) {
          const c = cellAt(x + d.x, y + d.y);
          if (c < 0) break; // (never off the board)
          x = c % N; y = (c - x) / N;
          path[n++] = c;
        }
        if (!n) return null;
        // The island hop, as the engine takes it: up over what's right in
        // front, on over up to LEAP_REACH cells of hurdles, and down on the
        // first free cell beyond, or a bridge that lasts. Over open ground,
        // leap now (pressed twice): over LEAP_REACH cells, down on the next,
        // else the farthest free short of it. Golden, held: on, down on any
        // free cell up to GOLD_FLY cells in the air, the best of them.
        // (Safe, for the moves of round six B, part 4 (leap now, flying on,
        // steering): only where no rival's head could get before I come down,
        // and leave its body there. Coming down on a body is the end, and at
        // first they did it 0.6 times a round, and lost the head-to-head for it.)
        const lands = (i, safe) => i < n && (free(path[i]) || bridgeUntil[path[i]] > i + 1) && !(safe && reach[framed[path[i]]] <= i);
        let first = -1, now = false;
        if (hurdle(path[0])) {
          for (span = 1; span <= Math.min(TUNE.LEAP_REACH, n - 1); span++) if (!hurdle(path[span])) break;
          if (span > Math.min(TUNE.LEAP_REACH, n - 1)) for (span = 1; span <= Math.min(TUNE.LEAP_REACH, n - 1); span++) if (bridgeUntil[path[span]] > span + 1) break; // (as the engine: a bridge that lasts only when no free cell is in reach)
          if (span > TUNE.LEAP_REACH || span >= n || !lands(span, false)) return null;
          first = span;
        } else {
          for (span = Math.min(TUNE.LEAP_REACH, n - 1); span >= 1 && !lands(span, false); span--); // (where the engine puts it down: the farthest free cell; safe or not, below)
          if (span < 1) return null;
          first = span; now = true;
        }
        let bestS = null, bestSpan = first;
        for (let k = first; k <= (golden ? Math.min(TUNE.GOLD_FLY, n - 1) : first); k++) {
          if ((k > first || now) && !lands(k, true)) continue; // (a leap now, or flying on: only down where it's safe)
          const v = landOpt(d, k, golden, now);
          if (v !== null && (bestS === null || v > bestS)) { bestS = v; bestSpan = k; }
        }
        // Golden, steered: on that way for `at` cells, then a turn (left or
        // right: the engine's airTurn, a person's as much as mine), and on,
        // down on any free cell up to GOLD_FLY cells in the air: the best of
        // them, if better than flying straight.
        let turn = null;
        if (golden) {
          straight.set(path);
          const n0 = n;
          for (const d2 of DIR_LIST) {
            if (d2.x === d.x || d2.y === d.y) continue; // (a turn: not on, nor back)
            for (let at = 1; at < TUNE.GOLD_FLY; at++) {
              if (at > n0) break;
              path.set(straight);
              n = at;
              for (let x = path[at - 1] % N, y = (path[at - 1] - x) / N; n <= TUNE.GOLD_FLY; ) {
                const c = cellAt(x + d2.x, y + d2.y);
                if (c < 0) break;
                x = c % N; y = (c - x) / N;
                path[n++] = c;
              }
              for (let k = at; k < n; k++) {
                if (!lands(k, true)) continue;
                const v = landOpt(d2, k, true, now);
                if (v !== null && (bestS === null || v > bestS)) { bestS = v; bestSpan = k; turn = { at, dir: d2 }; }
              }
            }
          }
          path.set(straight); n = n0;
        }
        leapNow = now; leapTurn = turn; leapFly = golden && (turn || bestSpan > first) ? bestSpan : 0;
        return bestS;
      }
      // A jump along d down on path[span], span + 1 moves from now (the cells before it in the air).
      function landOpt(d, span, golden, now) {
        const land = path[span];
        const down = span + 1;
        const isle = islandGain(land);
        if (!golden && !boxed && !isle && !meal(land, down) && !now) { // (the plain jump: out of a crash or a box, to an island, or onto food, or just short of it)
          const lx = land % N, past = cellAt(lx + d.x, (land - lx) / N + d.y);
          // (A habit's jump, for its own sake, only where no rival could get
          // to the landing before I'm down: one moving in as I take off and
          // the jump doesn't go, and I crawl into what I meant to hop.)
          if (!(past >= 0 && meal(past, down + 1)) && !(habit.jumpAny && reach[framed[land]] > down)) return null;
        }
        let L = me.body.length, g = me.grow;
        if (!golden) for (let n = 0; n < TUNE.LEAP_COST; n++) { if (g > 0) g--; else L--; }
        for (let i = 0; i <= span; i++) { if (g > 0) g--; else L--; L++; }
        const nb = bodies[down];
        for (let j = 0; j < L; j++) {
          if (j <= span) { const c = path[span - j]; nb[j].x = c % N; nb[j].y = (c - nb[j].x) / N; }
          else { const b = me.body[j - span - 1]; nb[j].x = b.x; nb[j].y = b.y; }
        }
        for (let s = 0; s < span; s++) for (let b = 0; b < bugs; b++) bugStep(b, s, s + 1, s, path[s] % N, (path[s] - path[s] % N) / N, otherBug(b, s)); // (a beetle runs from me in the air, and I come down where it is then)
        eatOn(-1, land, -1, L, g, 0.85, down); // (it eats where it lands)
        bugsOn(span, land % N, (land - land % N) / N);
        endRisk = risk[land] + strikes[land];
        const gain = ateGain + isle * U - 0.6 * endRisk;
        const score = depth > down ? search(nb, ateL, ateG, depth - down, down, gain) : evaluate(nb, ateL, ateG, down) + gain;
        uneat();
        return score;
      }

      // The island a jump reaches, in apples: folded up where I am, with
      // less free log round me than my length, or no food on it (the strip
      // the owner saw Gobbler fold up and die on), the free log I'd land on
      // beyond what I have here, per my length (at most 2), and an apple
      // more if there's food there and none here. Free log: cells I can
      // crawl to without crossing a hole (but on a bridge), nobody's body on them (counted up
      // to 3 lengths). 0 where I'm not cramped, the far side is no roomier,
      // or it's the same log (I could crawl there).
      function islandGain(land) {
        const L = me.body.length, cap = 3 * L, headI = myHead.y * N + myHead.x;
        if (hereFree < 0) { hereFree = landFree(headI, cap); hereFood = landFood; }
        if (hereFree >= L && hereFood) return 0;
        const there = landFree(land, cap);
        if (seen[headI] === stamp || there <= hereFree) return 0;
        return Math.min(2, (there - hereFree) / L) + (landFood && !hereFood ? 1 : 0);
      }
      function landFree(start, cap) {
        const stampS = ++stamp;
        seen[start] = stampS;
        queue[0] = start;
        let read = 0, write = 1, n = 0;
        landFood = false;
        while (read < write && n < cap) {
          const i = queue[read++];
          if (myCells[i] !== stampM && mineFree[i] <= 1) n++;
          if (foodValue[i] > 0) landFood = true;
          for (let k = 4 * i; k < 4 * i + 4; k++) {
            const j = nbr[k];
            if (j < 0 || seen[j] === stampS || (holes.has(j) && !(bridgeUntil[j] > 0))) continue; // (a bridge leads on)
            seen[j] = stampS;
            queue[write++] = j;
          }
        }
        return n;
      }

      // A flash, as the engine takes it (round six B: the flashes cut): the
      // plain one FLASH_LENGTH cells this tick along the ground, a golden one
      // (a dash) DASH_LENGTH. Through a body up to FLASH_THICK thick (a dash,
      // DASH_THICK) with free log beyond it, it cuts it: a rival's (worth its
      // tail to me in apples, more readily the more aggressive I am, and its
      // life if I leave it fewer than MIN_LENGTH in front: the neck cut) or my
      // own (dropping my tail: the search sees the room it leaves me, less
      // the length). Never a flash that fails (into the edge, a hole or the
      // woodpecker's mark, a head, a body too thick or with nothing free
      // beyond), nor a plain one into a second fire. (ownCut: my body's
      // length after, if I cut my own.)
      function flashOpt(d, gold) {
        const n = gold ? TUNE.DASH_LENGTH : TUNE.FLASH_LENGTH, thick = gold ? TUNE.DASH_THICK : TUNE.FLASH_THICK;
        if (!trace(d, n)) return null;
        const agg = (w.aggression || 0) + (w.hunt ? 0.5 : 0);
        const body = i => myCells[i] === stampM || (mineFree[i] > 1 && (!holes.has(i) || (fire.has(i) && others.some(o => o.body.some(q => q.y * N + q.x === i))))); // (mine, or a rival's that'll still be there, on fire too)
        let cut = 0, got = false, fires = 0, run = 0;
        ownCut = -1;
        for (let i = 0; i < n; i++) {
          const c = path[i];
          if (holes.has(c) && !fire.has(c)) return null; // (a hole, or the woodpecker's mark: it'd fail or blow up, or soon)
          if (fire.has(c) && !gold && fires++) return null; // (a second fire: it'd go in)
          if (!run && body(c)) {
            let r = 0, b = c, bx = c % N, by = (c - bx) / N;
            for (; r <= thick && b >= 0 && body(b); r++) { bx += d.x; by += d.y; b = cellAt(bx, by); }
            if (r > thick || b < 0 || pitHole(b) || myCells[b] === stampM || mineFree[b] > 1) return null; // (too thick, or nothing free beyond: it'd fail)
            for (let k = 0, x = c % N, y = (c - x) / N; k < r && i + k < n; k++, x += d.x, y += d.y) { // (a layer beyond its reach isn't cut: it's only why it can't go on)
              if (myCells[cellAt(x, y)] === stampM) { // (my own: my tail drops, only to get out of a trap)
                const j = me.body.findIndex(q => q.x === x && q.y === y);
                if (j < TUNE.MIN_LENGTH || !trapped) return null; // (only when it's that or the end: dropped any sooner (boxed), rivals dropped 5 tails a round and starved small)
                if (ownCut < 0 || j + n - 1 < ownCut) ownCut = j + n - 1;
                continue;
              }
              let o = null, j0 = -1;
              for (const q of others) { j0 = q.body.findIndex(p => p.x === x && p.y === y); if (j0 >= 0) { o = q; break; } }
              if (!o || j0 === 0) return null; // (a head, or where one may be)
              const j = j0 + Math.max(0, age - (o.stun || 0)); // (where it's cut: it's moved on since I saw it)
              const mark = o.id === memory.victimId ? 2 : 1; // (my target, twice over: Sniper cuts off its target, Mute its boxed one)
              cut += mark * (j < TUNE.MIN_LENGTH ? 6 * (0.5 + agg) : Math.min(CUT_TAIL, Math.max(0, o.body.length - j)) * 0.1 * (0.5 + agg)); // (in apples: out, or its tail off, up to CUT_TAIL of it: at 0.4 a segment, uncapped, rivals cut 14 times a round and the beads swamped the board; at 0.15, 10 times, and the cut starved small)
            }
            run = r;
          }
          if (run) run--;
          if (gold) for (const f of food) if (f.y * N + f.x === c && (f.kind === 'golden' || f.kind === 'leaf' || f.kind === 'goldcap' || f.gold)) got = true;
        }
        if (gold && !cut && !got && !trapped && ownCut < 0) { // (just for speed: only a habit's, and at anyone's price, so only for a real gain; free, it spent both at once, a zig-zag that got it nothing)
          if (!habit.dashSpend) return null;
          idle = true;
        }
        return groundOpt(n, cut * U);
      }
      // Is there a body within a flash's reach that way (worth weighing a cut there)?
      function bodyNear(d) {
        for (let i = 1, x = myHead.x, y = myHead.y; i <= TUNE.FLASH_LENGTH; i++) {
          const c = cellAt(x += d.x, y += d.y);
          if (c < 0) return false;
          if (myCells[c] === stampM || (!holes.has(c) && mineFree[c] > 1)) return true;
        }
        return false;
      }

      // Along the ground: n cells this tick (path[0..n-1]), eating them.
      function groundOpt(n, bonus) {
        let L = me.body.length, g = me.grow;
        for (let i = 0; i < n; i++) { if (g > 0) g--; else L--; L++; }
        if (ownCut >= 0) L = Math.min(L, ownCut); // (my tail dropped)
        const nb = bodies[1];
        for (let j = 0; j < L; j++) {
          if (j < n) { const c = path[n - 1 - j]; nb[j].x = c % N; nb[j].y = (c - nb[j].x) / N; }
          else { const b = me.body[j - n]; nb[j].x = b.x; nb[j].y = b.y; }
        }
        eatOn(path[0], path[1], n > 2 ? path[2] : -1, L, g, 1, 1);
        bugsOn(0, path[n - 1] % N, (path[n - 1] - path[n - 1] % N) / N);
        endRisk = risk[path[n - 1]] + strikes[path[n - 1]];
        const gain = bonus + ateGain - endRisk;
        const score = depth > 1 ? search(nb, ateL, ateG, depth - 1, 1, gain) : evaluate(nb, ateL, ateG, 1) + gain;
        uneat();
        return score;
      }

      // Eating the cells a power passes (a, b, c; -1: none) on my move
      // `step`, as a move eats: what it's worth (ateGain), and my length and
      // growth after (ateL, ateG; a mushroom shrinks me). Coughing, nothing
      // (and choking on my own bead, I cough from there). The food's off the
      // board meanwhile: uneat puts it back. (Food the woodpecker hasn't
      // knocked there yet isn't there.)
      function eatOn(a, b, c, L, g, soon, step) {
        ate[0] = a; ate[1] = b; ate[2] = c;
        ateGain = 0; muteWas = mute; ateBug = 0; ateWas = ateAt;
        for (let k = 0; k < 3; k++) {
          const i = ate[k];
          ateV[k] = 0;
          if (i < 0 || step <= mute) continue;
          const late = foodFrom[i] > step, here = late ? 0 : foodValue[i];
          let caught = -1;
          for (let q = 0; q < bugs; q++) if (bugCell[q * SLOTS + step - 1] === i) { caught = q; break; }
          const v = here + (caught >= 0 ? bugV[caught] : 0), change = (late ? 0 : foodGrow[i]) + (caught >= 0 ? TUNE.BEETLE_GROWTH : 0);
          if (change < 0) { // (a mushroom: my mouth is full after it, the rest of the way too)
            mute = Math.max(mute, step + TUNE.CHEEK_TICKS);
            let n = -change;
            const fromGrow = Math.min(g, n);
            g -= fromGrow;
            n -= fromGrow;
            for (; n > 0 && L > TUNE.MIN_LENGTH; n--) L--;
          } else g += change;
          if (caught >= 0) ateBug |= 1 << caught;
          if (!v) continue;
          ateGain += v * (foodW * w.foodRange + eatW * soon);
          ateV[k] = here;
          if (!late) foodValue[i] = 0;
          if (v > 0) ateAt = step;
        }
        ateL = L; ateG = g;
      }
      function uneat() {
        for (let k = 0; k < 3; k++) if (ateV[k]) foodValue[ate[k]] = ateV[k];
        mute = muteWas;
        ateAt = ateWas;
      }
    }
  }

  return { DIRS, PERSONAS, POOL, decide, watchStyles, traitsOf, styleOf, STYLE_TRAITS };
})();
