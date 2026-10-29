// The renderer (see render/core.js): each snake's animation state, its
// looks (which face, tongue and marks), its gaze, and its jumps and body
// over holes.

// ----------------------------------------------- per-snake animation state

// Blink, tongue, gaze and gulps live outside the game state; they're purely visual.
const anim = new WeakMap();
function animOf(s, now) {
  let a = anim.get(s);
  if (!a) {
    a = {
      nextBlink: now + T.BLINK_MIN + Math.random() * (T.BLINK_MAX - T.BLINK_MIN), blinkUntil: 0,
      nextTongue: now + T.TONGUE_EVERY * (0.5 + Math.random()), tongueUntil: 0, tongueMs: T.TONGUE_MS,
      gx: s.dir.x, gy: s.dir.y, near: 99, // where the eyes point (on the screen, eased), and how far that is
      wx: 0, wy: 0, wanderAt: 0,          // Wildcard's eyes wander about on their own
      gulps: [-99, -99, -99, -99], gulpAt: 0,
      gulpR: T.GULP, gulpW: T.GULP_LENGTH, ateAt: -1e9, // gulp size and length (Gobbler's are bigger), last bite
      // This frame's layout (see prepare): segment centres, the corner each
      // band bends through, radii and fills, sized for the body as it grows.
      n: 0, pts: new Float32Array(64), cor: new Float32Array(64), rad: new Float32Array(32), fills: new Array(32),
      offs: null, offList: [], offPool: [], // (where it's drawn across a wrapped edge, if it is: see unwrap)
      look: '', color: '', isPlayer: false, rim: false, bump: 0, tickPos: 0, lean: 0,
      // Drawn ahead (see predict): the cell its head goes to next (mx, my),
      // whether it moves (mv), grows (mg) or leaps (ml), how many cells
      // further a flash takes it (mf) and which way (mdx, mdy); the same as
      // the last frame drew them (pTick: that frame's tick), and each
      // segment's easing out of a wrong guess (fix: units, fading; see
      // prepare; fixFast: a flash's guess put right, which goes as fast as
      // a dash). streakTick: the tick its flash was seen coming, and where
      // to (streakX, streakY).
      mx: 0, my: 0, mv: 0, mg: 0, ml: 0, mf: 0, mdx: 0, mdy: 0, pmx: 0, pmy: 0, pmv: 0, pmf: 0, pmdx: 0, pmdy: 0, streakTick: -1, streakX: 0, streakY: 0, pTick: -1, phx: -99, phy: -99, fixFar: false, rise: 0, swell: 0,
      fix: new Float32Array(64), fixOn: false, fixFast: false, tdx: s.dir.x, tdy: s.dir.y, bx: 0, by: 0, drawnAt: -1,
      jc: false, fc: false, flashFx: -1e9, // (your rests: cooling last frame; when your flash came back)
      star: false, turn: 0, face: 0, hue: 0, hueAt: -1, glow: 1, brow: 1, flareAt: -1e9, shedAt: 0, // (Star: its head a star, turned so, its face upright; its rainbow (and Copycat's copy of it); its tell; its tail's twinkles)
      slim: 0, growl: 0, pale: 0, // (hungry: how much slimmer, how hard it growls, how pale: see hungerLook)
      // A meal going down (see mealSwell): when it ate as this screen saw it
      // (ateSeen: its clock's lastAte), when the swell began, and each
      // segment's slim and pale as drawn (slimSeg, paleSeg; paleTop, the most)
      // and as they were when it began (slimFrom, paleFrom); segN: how many last frame drew, fromN: when it began.
      ateSeen: -1, mealAt: -1e9, segN: 0, fromN: 0, paleTop: 0,
      slimSeg: new Float32Array(64), paleSeg: new Float32Array(64), slimFrom: new Float32Array(64), paleFrom: new Float32Array(64),
      flow: 0, flowW: 0, flowMv: 0, flowTick: -1, flowAt: -1, bursts: 0, burstAt: -1e9, // (how far it has gone, for its rainbow's stream: see flowOf; its flashes' bursts of it)
      // Up in the air and over holes (see liftOf and sinkOf): each segment's
      // lift (0..1, the top of a jump 1) and how far it hangs over a pit
      // (0..1) and sinks into it; its jumps, while their arch lasts; when it
      // last came down (its squash).
      lift: new Float32Array(32), hang: new Float32Array(32), sink: new Float32Array(32), lifted: false, bridging: false, liftSw: T.LEAP_SWELL,
      hops: [], holeTick: -1, holeGame: null, nearHole: false, landAt: -1e9, squash: 0,
      chokeAt: -1e9, coughFrom: 0, coughing: false, // (when it choked on its own bead; when its cough began, as this screen saw it)
    };
    anim.set(s, a);
  }
  return a;
}

// ------------------------------------------------------------ looks

// The look a snake is drawn with right now (Capricious borrows its mood's:
// its face, as a costume over its own colours).
function lookOf(s) {
  if (!s.persona) return 'player';
  if (s.persona.look === 'capricious' && s.memory.mood) return PERSONAS[s.memory.mood].look;
  return s.persona.look;
}
// The look its body is drawn with (its colours and markings, its beads):
// Capricious keeps its own, whatever the mood.
const coatOf = s => s.personaKey === 'capricious' ? 'capricious' : lookOf(s);

// Current body color, for personas whose color changes during a round.
function colorOf(s) {
  if (!s.persona) return s.color;
  if (s.personaKey === 'mute') return muteShown.get(s) || s.color;
  if (s.personaKey === 'copycat' && game) {
    const model = findById(s.memory.modelId);
    if (model && model.alive && coatOf(model) === 'star') return COPY_STAR; // (its body's a pale rainbow: see fillsOf)
    if (model && model.alive) return mix(model.color, '#ffffff', 0.45);
  }
  return s.color;
}
// Copycat copying Star, as one colour (its body is a pale copy of Star's
// rainbow): the rainbow's violet end, paled as its copy is. Not the tint of
// Star's stand-in colour in text, a pale gold that read as a power.
const COPY_STAR = '#d19df7'; // (paleRainbowOf(275)[0])

// Mute is a mood ring: its colour follows how it feels, from what anyone
// can see on the board. Stunned: dazed grey. Just made a kill: proud
// orchid. Hemmed in, or a rival's head close: a pale lilac with fright. Its
// victim close: deep plum (closing the box). Stalking someone: deep violet.
// Otherwise calm lavender. It changes over a moment, in a few steps. (The
// moods keep to violets and magentas no other rival wears: as rose it
// passed for Sniper or Colonist, white for Ghost, pink for Capricious. And
// they're spread in lightness as well as hue, so they read on the bark at
// a glance: dark for a hunt, light for a feeling, palest for fear.)
const MUTE_MOODS = { calm: '#c084fc', stalking: '#5b21b6', closing: '#86198f', scared: '#ddd6fe', proud: '#e879f9', dazed: '#9ca3af' };
const muteState = new WeakMap(), muteShown = new WeakMap(); // snake -> { from, to, at, key }; snake -> the colour now
const MUTE_FADE = 400; // (ms from one mood's colour to the next)
// ...and its face says it too: the brows (outer end, arch, inner end, along
// the head: more negative is higher) and, unless it's biting, the mouth.
const MUTE_BROWS = { calm: [0.05, -0.04, 0.04], stalking: [0.0, 0.03, 0.11], closing: [-0.03, 0.06, 0.15], scared: [0.09, 0.0, -0.05], proud: [0.03, -0.02, 0.07], dazed: [0.07, 0.07, 0.07] };
function muteMood(s) {
  if (s.stunUntil >= game.tick) return 'dazed'; // (until it moves again, as the stars: see drawBody)
  for (const o of game.snakes) if (!o.alive && o.killerId === s.id && o.killer !== 'self' && game.tick - (o.diedAt ?? -99) < 30) return 'proud';
  const h = s.body[0];
  let shut = 0, near = false;
  for (let d = 0; d < 4; d++) {
    const x = h.x + SIDES[2 * d], y = h.y + SIDES[2 * d + 1];
    if (x < 0 || y < 0 || x >= GRID || y >= GRID || game.holes.has(y * GRID + x) || bodyAt(x, y)) shut++;
  }
  for (const o of game.snakes) if (o !== s && o.alive && Math.abs(o.body[0].x - h.x) + Math.abs(o.body[0].y - h.y) <= 2) near = true;
  if (shut >= 3 || near) return 'scared';
  const v = findById(s.memory.victimId);
  if (v && v.alive) return Math.abs(v.body[0].x - h.x) + Math.abs(v.body[0].y - h.y) <= 4 ? 'closing' : 'stalking';
  return 'calm';
}
const SIDES = [1, 0, -1, 0, 0, 1, 0, -1];
// Is any living snake's body on (x, y)?
function bodyAt(x, y) {
  for (const o of game.snakes) {
    if (!o.alive) continue;
    for (const c of o.body) if (c.x === x && c.y === y) return true;
  }
  return false;
}
// Its colour is always a step of the way from one mood to another (a few
// dozen colours in all, each a cached colour ramp). A change of mood part
// way through a fade starts from whichever mood it was nearer (back to the
// one it came from, it just turns round), never from the step on show: that
// made a new colour, and a new ramp kept for good, nearly every time.
function updateMute(s, now) {
  const key = muteMood(s), mood = MUTE_MOODS[key];
  let m = muteState.get(s);
  if (!m) muteState.set(s, m = { from: mood, to: mood, at: -1e9 });
  m.key = key;
  if (mood !== m.to) {
    const k = reduced ? 1 : Math.min(1, (now - m.at) / MUTE_FADE);
    if (mood === m.from) { m.from = m.to; m.at = now - (1 - k) * MUTE_FADE; } // (turning round, from the step it's on)
    else { if (k >= 0.5) m.from = m.to; m.at = now; }
    m.to = mood;
  }
  const k = reduced ? 1 : Math.min(1, (now - m.at) / MUTE_FADE);
  muteShown.set(s, mix(m.from, m.to, Math.round(k * 6) / 6)); // (in steps: each a cached colour ramp)
}

function findById(id) {
  if (id == null || !game) return null;
  for (const o of game.snakes) if (o.id === id) return o;
  return null;
}

// ------------------------------------------------------------ the gaze

// What a snake is looking at: a cell, or null for straight ahead. Each rival
// looks at what it cares about, read from its memory (purely for show: what
// it draws never changes how anyone plays), so you can read who's hunting whom.
const spot = { x: 0, y: 0 };
function focusOf(s, look, a, now) {
  const m = s.memory;
  switch (look) {
    case 'player': case 'gobbler': return nearest(s, 'food');
    case 'drab': return nearest(s, 'food'); // a lazy look at lunch
    case 'sniper': case 'sovereign': case 'mute': return headOf(m.victimId) || nearest(s, 'head');
    case 'colonist': return headOf(m.victimId) || m.site || nearest(s, 'head');
    case 'vulture': return headOf(m.lureId) || nearest(s, 'head');
    case 'copycat': return headOf(m.modelId) || nearest(s, 'head');
    case 'creeper': return nearest(s, 'tail') || nearest(s, 'head');
    case 'mason': return nearest(s, 'head'); // keeping an eye on whoever's near the wall
    case 'ghost': case 'metagamer': case 'desperado': case 'joker': return nearest(s, 'head');
    case 'star': return nearest(s, 'gold') || nearest(s, 'head'); // (it craves golden powers above everything)
    case 'wildcard': // looks wherever, changing its mind every second or two
      if (now > a.wanderAt) {
        a.wanderAt = now + 900 + Math.random() * 1600;
        a.wx = Math.floor(Math.random() * GRID);
        a.wy = Math.floor(Math.random() * GRID);
      }
      spot.x = a.wx; spot.y = a.wy;
      return spot;
    default: return nearest(s, 'head');
  }
}

function headOf(id) {
  const o = findById(id);
  return o && o.alive ? o.body[0] : null;
}

// The nearest food (not mushrooms), golden power (a golden beetle, a
// golden leaf or a golden mushroom), rival head, or long rival's tail.
// Every snake's eyes follow something, so no face ever just stares ahead.
function nearest(s, what) {
  const h = s.body[0];
  let best = 1e9, out = null;
  if (what === 'food' || what === 'gold') {
    for (const f of game.food) {
      if (f.kind === 'mushroom' || (what === 'gold' && !(f.kind === 'leaf' || f.kind === 'goldcap' || f.kind === 'spill' || (f.kind === 'beetle' && f.gold)))) continue;
      const d = (f.x - h.x) * (f.x - h.x) + (f.y - h.y) * (f.y - h.y);
      if (d > 0 && d < best) { best = d; out = f; }
    }
  } else {
    for (const o of game.snakes) {
      if (o === s || !o.alive) continue;
      const c = what === 'head' ? o.body[0] : o.body.length >= 8 ? o.body[o.body.length - 1] : null;
      if (!c) continue;
      const d = (c.x - h.x) * (c.x - h.x) + (c.y - h.y) * (c.y - h.y);
      if (d > 0 && d < best) { best = d; out = c; }
    }
  }
  return out;
}

// Turn the eyes toward the focus (eased on the screen, so a turn of the
// head doesn't swing them, and at the same speed at any frame rate).
// With a turn pressed that hasn't shown yet (or, stunned, a jump or a
// flash asked for), they look the way it'll go instead, quickly: it's
// your press, answered.
function updateGaze(s, look, a, now) {
  const q = game ? queuedOf(s, a) : null, f = game && !q ? focusOf(s, look, a, now) : null;
  let tx = a.tdx, ty = a.tdy; // nothing to look at: straight ahead
  if (q) { tx = q.x; ty = q.y; }
  else if (f) {
    const h = s.body[0], dx = f.x - h.x, dy = f.y - h.y;
    const len = Math.hypot(dx, dy) || 1;
    a.near = len;
    tx = dx / len; ty = dy / len;
  } else a.near = 99;
  const ease = 1 - Math.pow(1 - (q ? 0.5 : T.GLANCE_EASE), frameDt / 16.7);
  a.gx += (tx - a.gx) * ease;
  a.gy += (ty - a.gy) * ease;
}

// The mouth: open when food is right in front, then a couple of chews after a bite.
let deadNow = false; // the snake being drawn has just died: mouth shut
let frameDt = 16;     // this frame's length, for easing
// Choked on its own bead, it coughs for a moment and eats nothing (the
// engine's s.coughUntil, synced to guests): its mouth stays shut, and no
// tongue or gag comes out (see drawCough for its puffs).
const coughing = s => !!game && s.coughUntil > game.tick;
// Choking, drawn: as it gags its cheeks puff out for a moment (gagCheeks),
// and while it coughs, a cough every COUGH_BEAT, each a little puff of
// breath out past its shut mouth (drawCough), growing and fading as it
// drifts off (with reduced motion, staying put as it fades), its head
// jolting (see prepare). The bead it spat flies off in a little arc (see
// moveFood). How far through its cough's beat it is (-1 before the first).
// (Made to read at arm's length on a phone, where the first puff was a
// speck of 3 to 6 px and the jolt under a pixel: the puff 0.14 to 0.28 of
// a cell, holding its white longer; the head swelling 15% and lurching a
// tenth of a cell forward over the first third of each beat.)
const GAG_MS = 280, COUGH_FIRST = 160, COUGH_BEAT = 300, COUGH_JOLT = 0.3, COUGH_SWELL = 0.15, COUGH_LURCH = 0.1;
function coughPhase(a, now) {
  const t = now - a.coughFrom - COUGH_FIRST;
  return t < 0 ? -1 : (t % COUGH_BEAT) / COUGH_BEAT;
}
// (In the face's frame, before its face: its cheeks, in the head's own
// colour and inked, out either side behind its mouth; a star's out past
// its mustache. Puffed up fast and down slower; with reduced motion,
// simply puffed while it lasts.)
function gagCheeks(a, col, now) {
  const t = (now - a.chokeAt) / GAG_MS;
  if (t < 0 || t >= 1) return;
  const c = CELL, puff = reduced ? 1 : t < 0.3 ? t / 0.3 : 1 - (t - 0.3) / 0.7, r = c * (0.1 + 0.12 * puff), x = c * (a.star ? 0.04 : 0.34), y = c * (a.star ? 0.44 : 0.33 + 0.06 * puff);
  ctx.beginPath();
  for (const sg of SIDES2) { ctx.moveTo(x + r, sg * y); ctx.arc(x, sg * y, r, 0, TAU); }
  ctx.strokeStyle = INK;
  ctx.lineWidth = c * 0.04;
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
}
// The meal goes down (the owner: it plumped up at once, "it should be an
// animation where you see it transform"): after a meal, from the head, each
// segment eases from how slim and pale it was drawn to how its clock says it
// should be now (a meal that refills it only partly fills it out only that
// far), a wave MEAL_SPREAD segments deep that reaches the tail in MEAL_MS,
// whatever its length, its colour flooding back with it. Eating again
// mid-swell starts a new wave from the head, from how it's drawn then. With
// reduced motion, no wave: the whole body eases back in a short plain fade.
// (Drawn from the clock alone, like the rest of its hunger: the same on
// every screen online.)
const MEAL_MS = 700, MEAL_SPREAD = 3, MEAL_FADE = 250, PALE_STEPS = 6;
function mealSwell(a, m, now) {
  if (a.slimSeg.length < m) for (const k of ['slimSeg', 'paleSeg', 'slimFrom', 'paleFrom']) { const r = new Float32Array(2 * m); r.set(a[k]); a[k] = r; }
  const t = now - a.mealAt, on = t >= 0 && t < (reduced ? MEAL_FADE : MEAL_MS);
  const { slimSeg, paleSeg, slimFrom, paleFrom } = a, last = Math.max(0, a.fromN - 1);
  const front = t / MEAL_MS * (m - 1 + MEAL_SPREAD);
  let top = 0;
  for (let i = 0; i < m; i++) {
    let s = a.slim, p = a.pale;
    if (on) {
      const j = Math.min(i, last), k = reduced ? t / MEAL_FADE : Math.min(1, Math.max(0, (front - i) / MEAL_SPREAD)), e = 1 - k * k * (3 - 2 * k); // (how much of how it was still shows; a segment grown since, as its tail was)
      s += (slimFrom[j] - s) * e; p += (paleFrom[j] - p) * e;
    }
    slimSeg[i] = s;
    paleSeg[i] = top = Math.max(top, p); // (never paler toward the head: see drawPale)
  }
  a.segN = m; a.paleTop = paleSeg[m - 1]; // (as stored, rounded alike, so an even wash is seen as one: see drawPale)
}
// Its pale wash (starving, and fading as a meal goes down), over its
// silhouette; while the colour floods back from the head, in a few steps
// along it, each over the rest of its body from where its wash reaches that
// much (no seams where its segments overlap: each step is one fill).
function drawPale(a) {
  const top = a.paleTop, p = a.paleSeg, m = a.n;
  if (top <= 0.004) return;
  if (p[0] >= top) { ctx.fillStyle = rgba(HUNGER_PALE, 0.5 * top); silhouette(a, 0); return; } // (all alike: one wash)
  let was = 0;
  for (let l = 1, i = 0; l <= PALE_STEPS; l++) {
    const lv = top * (l - 0.5) / PALE_STEPS; // (a step reaches the segments at least this pale)
    while (i < m && p[i] < lv) i++;
    if (i >= m) break;
    const want = 0.5 * top * l / PALE_STEPS, al = 1 - (1 - want) / (1 - was); // (each step on top of the ones before it comes to want)
    was = want;
    ctx.fillStyle = rgba(HUNGER_PALE, al); shape(a, 0, i, m - 1); ctx.fill();
  }
}
// (In the face's frame, after its face: a puff of breath, a little cloud
// of three rounds, out past its mouth, inked lightly so it reads on the bark.)
const COUGH_PUFF = [0, 0, 1, -0.55, 0.5, 0.62, -0.55, -0.5, 0.62]; // (each round: x, y, radius, in the puff's radius)
function drawCough(a, now) {
  const ph = coughPhase(a, now);
  if (ph < 0) return;
  const c = CELL, x = c * (0.64 + (reduced ? 0 : 0.36 * ph)), r = c * (0.14 + 0.14 * ph), was = ctx.globalAlpha;
  ctx.globalAlpha = was * (1 - ph * ph * ph);
  ctx.beginPath();
  for (let j = 0; j < COUGH_PUFF.length; j += 3) { const px = x + COUGH_PUFF[j] * r, py = COUGH_PUFF[j + 1] * r, pr = COUGH_PUFF[j + 2] * r; ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, TAU); }
  ctx.strokeStyle = 'rgba(58,38,20,0.55)';
  ctx.lineWidth = c * 0.045;
  ctx.stroke();
  ctx.fillStyle = '#fbf7ec';
  ctx.fill();
  ctx.globalAlpha = was;
}
// Hunger where your eyes are (on a wide screen the tag's bar goes unseen:
// the owner starved): every snake shows it on its body, from the clock its
// tag reads. Its body slims as its last meal runs out (by the share of it
// gone, slowly at first, up to HUNGER_SLIM thinner; its head keeps its
// size); in the warning's seconds (the toast's: 6 s left, 9 at its
// smallest) its head shakes and growl lines rumble out either side of it
// (drawGrowl), stronger toward the end (not once the round's over);
// starving (shrinking), it pales (a parchment wash: see drawPasses), and
// starved, its corpse stays thin. With reduced motion the lines stay still
// and the head doesn't shake.
const HUNGER_SLIM = 0.22, GROWL_BEAT = 520, GROWL_ARC = 0.42, HUNGER_PALE = '#f6eedb';
function hungerLook(s, a, dead, now) {
  if (dead || !game || !s.alive) { a.slim = dead && s.killer === 'hunger' ? HUNGER_SLIM : 0; a.growl = 0; a.pale = 0; a.mealAt = -1e9; a.ateSeen = -1; return; } // (starved, it stays thin)
  if (a.ateSeen >= 0 && s.lastAte > a.ateSeen) { a.mealAt = now; a.fromN = a.segN; a.slimFrom.set(a.slimSeg); a.paleFrom.set(a.paleSeg); } // (it ate: the meal goes down from how it was drawn, see mealSwell)
  a.ateSeen = s.lastAte;
  const left = s.lastAte + T.HUNGER_MS - shownTime, gone = Math.min(1, Math.max(0, 1 - left / (s.mealMs || T.HUNGER_MS)));
  const warn = T.HUNGER_WARN_MS * (s.body.length <= T.MIN_LENGTH ? 1.5 : 1);
  a.slim = HUNGER_SLIM * gone * Math.sqrt(gone);
  a.growl = left < warn && !leadRest ? Math.min(1, 1.4 - 0.9 * Math.max(0, left) / warn) : 0;
  a.pale = left < 0 ? Math.min(1, -left / T.STARVE_EVERY_MS) : 0;
}
// (In the face's frame, after its face: two short arcs either side of its
// head, a cream line under an ink one so they read on the bark and on any
// body, swelling out and fading with each rumble.)
function drawGrowl(a, now) {
  const c = CELL, ph = reduced ? 0.4 : (now % GROWL_BEAT) / GROWL_BEAT, was = ctx.globalAlpha, cap = ctx.lineCap;
  ctx.globalAlpha = was * a.growl * (reduced ? 0.85 : 1 - ph * ph);
  ctx.beginPath();
  for (const sg of SIDES2) {
    const mid = sg * Math.PI / 2;
    for (let k = 0; k < 2; k++) {
      const r = c * (0.66 + 0.18 * k + 0.16 * ph);
      ctx.moveTo(Math.cos(mid - GROWL_ARC) * r, Math.sin(mid - GROWL_ARC) * r);
      ctx.arc(0, 0, r, mid - GROWL_ARC, mid + GROWL_ARC);
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#fffbea';
  ctx.lineWidth = c * 0.12;
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = c * 0.06;
  ctx.stroke();
  ctx.globalAlpha = was;
  ctx.lineCap = cap;
}
function mouthOpen(s, a) {
  if (deadNow || coughing(s)) return 0;
  const t = (lastNow - a.ateAt) / T.CHEW_MS;
  if (t >= 0 && t < 1) return 0.55 * Math.abs(Math.sin(t * Math.PI * 2));
  if (!game) return 0;
  const h = s.body[0];
  if (s.personaKey === 'ouroboros' && s.body.length > 4) { // (its own tail right ahead: it bites it)
    const tl = s.body[s.body.length - 1];
    if ((tl.x - h.x) * s.dir.x + (tl.y - h.y) * s.dir.y === 1 && (tl.x - h.x) * s.dir.y - (tl.y - h.y) * s.dir.x === 0) return 1;
  }
  for (const f of game.food) {
    if (f.kind === 'mushroom' && s.personaKey !== 'ghost') continue;
    const ahead = (f.x - h.x) * s.dir.x + (f.y - h.y) * s.dir.y;
    const side = (f.x - h.x) * s.dir.y - (f.y - h.y) * s.dir.x;
    if (side === 0 && ahead >= 1 && ahead <= 2) return ahead === 1 ? 1 : 0.5;
  }
  return 0;
}

// Fades toward the bark as colour ramps: rampOf(c)[p] is c faded p% of the
// way to the bark. Built once per colour, so no frame builds a colour string.
const ramps = new Map(), stripes = new Map();
function rampOf(c) {
  let ramp = ramps.get(c);
  if (!ramp) {
    ramp = new Array(101);
    for (let p = 0; p <= 100; p++) ramp[p] = p ? mix(c, BARK, p / 100) : c;
    ramps.set(c, ramp);
  }
  return ramp;
}
// The rainbow (Star's trail; Wildcard's body once, then Mute's): 360 hues
// round the wheel at one lightness, as #rrggbb, so it fades toward the
// bark at the tail like any colour. rainbowOf(h)[p] is hue h faded p% of
// the way to the bark (p up to 30, the cast's fade), made the first time
// it's needed and kept (it's never more than 360 short ramps, and as many
// of Copycat's pale copy).
const HUE_RGB = new Uint8Array(3 * 360), rainbows = new Array(360);
for (let h = 0; h < 360; h++) { // (hsl(h, 85%, 62%), the old rainbow's)
  const c = (1 - Math.abs(2 * 0.62 - 1)) * 0.85, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = 0.62 - c / 2, s = Math.floor(h / 60);
  const r = s === 0 || s === 5 ? c : s === 1 || s === 4 ? x : 0, g = s === 1 || s === 2 ? c : s === 0 || s === 3 ? x : 0, b = s === 3 || s === 4 ? c : s === 2 || s === 5 ? x : 0;
  HUE_RGB[3 * h] = Math.round((r + m) * 255); HUE_RGB[3 * h + 1] = Math.round((g + m) * 255); HUE_RGB[3 * h + 2] = Math.round((b + m) * 255);
}
const RAINBOW_FADE = 30;
const rainbowOf = h => rainbows[h] || (rainbows[h] = bowRamp(h, 0));
// Copycat's copy of it (while it copies Star): each hue mixed as far
// toward white as its tint of anyone else (0.45), so it reads as a copy
// of Star's rainbow; never one pale gold all over, as the tint of Star's
// stand-in colour in text was (that read as a power, and hid its gold line).
const paleRainbows = new Array(360);
const paleRainbowOf = h => paleRainbows[h] || (paleRainbows[h] = bowRamp(h, 0.45));
function bowRamp(h, pale) {
  const ramp = new Array(RAINBOW_FADE + 1), bark = parseInt(BARK.slice(1), 16);
  for (let p = 0; p <= RAINBOW_FADE; p++) {
    const ch = (j, sh) => Math.round((HUE_RGB[3 * h + j] * (1 - pale) + 255 * pale) * (1 - p / 100) + ((bark >> sh) & 255) * p / 100);
    ramp[p] = '#' + ((1 << 24) | (ch(0, 16) << 16) | (ch(1, 8) << 8) | ch(2, 0)).toString(16).slice(1);
  }
  return ramp;
}
// The rainbow a snake wears, if any (its ramps, by hue): Star's own, or
// Copycat's pale copy while its model is Star; null for anyone else.
function bowOf(s) {
  if (coatOf(s) === 'star') return rainbowOf;
  if (s.personaKey === 'copycat' && game) {
    const m = findById(s.memory.modelId);
    if (m && m.alive && coatOf(m) === 'star') return paleRainbowOf;
  }
  return null;
}
// Where its rainbow's hue is at its head. Its colours stream back along
// its body as it goes, by how far it has gone (its moves, and the frame's
// way through the next), at BOW_FLOW times its crawl: so over the log they
// stream backward behind it, like a trail (at its crawl they'd be painted
// on the log; slower, they'd creep forward with it), and each segment goes
// round the rainbow about once a second. Stopped or stunned, they settle
// with it; a flash bursts them on (BOW_BURST segments' worth, easing out
// over BOW_BURST_MS). With reduced motion they drift slowly where they are
// (BOW_DRIFT degrees a second). Copycat's pale copy goes by its model's,
// in step. Once it's out, they stay where they stopped.
const BOW_FLOW = 1.25, BOW_BURST = 6, BOW_BURST_MS = 360, BOW_DRIFT = 10;
function bowHue(s, a, now) {
  if (!s.alive) { if (a.hueAt < 0) a.hueAt = a.hue; return a.hueAt; }
  a.hueAt = -1;
  if (reduced) return a.hue = Math.floor(now / 1000 * BOW_DRIFT) % 360;
  let src = s, sa = a;
  if (coatOf(s) !== 'star') { const m = findById(s.memory.modelId); if (m && m.alive) { src = m; sa = animOf(m, now); } } // (Copycat's copy: its model's)
  const u = (now - sa.burstAt) / BOW_BURST_MS, burst = sa.bursts * BOW_BURST - (u >= 0 && u < 1 ? BOW_BURST * (1 - u) * (1 - u) : 0);
  return a.hue = Math.floor((flowOf(src, sa) * BOW_FLOW + burst) * RAINBOW_STEP) % 360;
}
// How far a snake has gone, in cells, as it's drawn this frame: its moves
// until this tick (a flash's cells and all), and its way through this
// one's and on toward the next (see prepare: flowK). Counted once a tick.
function flowOf(s, a) {
  if (a.flowAt === lastNow && lastNow) return a.flow;
  if (game.tick !== a.flowTick) {
    if (a.flowTick >= 0 && game.tick > a.flowTick) a.flowW += a.flowMv * Math.min(4, game.tick - a.flowTick); // (the ticks between, if any were missed, as the last)
    a.flowTick = game.tick;
    const h = s.body[0], p = s.prev?.[0];
    const d = p ? Math.abs(h.x - p.x) + Math.abs(h.y - p.y) : 0;
    a.flowMv = d > GRID / 2 ? 1 : d; // (across a wrapped edge: a cell)
  }
  a.flowAt = lastNow;
  return a.flow = a.flowW + a.flowMv * Math.min(1, flowK) + (a.mv ? Math.max(0, flowK - 1) : 0);
}
let flowK = 0; // (the frame's way through the tick, as drawn: see prepare)
const lumas = new Map();
function lumaOf(c) {
  let l = lumas.get(c);
  if (l === undefined) { l = c[0] === '#' ? luma(c) : 1; lumas.set(c, l); }
  return l;
}
// A backstop, as a round starts: the colour caches keep the cast's own
// colours (and Mute's moods, and this round's people) and what's mixed from
// them; anything else (a step of Mute's between two moods, Copycat's tint
// of its model) is dropped, and made again if it's needed again.
const keptColours = new Set();
function trimColours(g) {
  keptColours.clear();
  keptColours.add(BARK);
  for (const key in PERSONAS) keptColours.add(PERSONAS[key].color);
  for (const key in MUTE_MOODS) keptColours.add(MUTE_MOODS[key]);
  for (const s of g.snakes) keptColours.add(s.color);
  for (const c of ramps.keys()) if (!keptColours.has(c)) ramps.delete(c);
  for (const c of lumas.keys()) if (!keptColours.has(c)) lumas.delete(c);
  for (const c of mixCache.keys()) if (!keptColours.has(c)) mixCache.delete(c);
}

// Wildcard's segments: a tan face, a white collar, then a blue field of
// stars (two segments) and red and white stripes from there on.
const WILD = i => i === 0 ? '#f59a52' : i === 1 ? '#f8fafc' : i < 4 ? '#3c3b6e' : i % 2 ? '#b22234' : '#f8fafc';

// Every segment's fill: the look's pattern, fading toward the bark at the tail.
function fillsOf(s, a, now) {
  const { color, n, fills } = a, look = coatOf(s);
  if (s.personaKey === 'wildcard') { // the Stars and Stripes, behind an orange tan and a white collar
    for (let i = 0; i < n; i++) fills[i] = WILD(i);
    return;
  }
  const mime = look === 'mute'; // (its mood's colour down the body, behind a white greasepaint face: below)
  if (look === 'joker') {
    for (let i = 0; i < n; i++) fills[i] = i === 0 ? '#f8fafc' : i % 2 ? '#f59e0b' : '#a21caf';
    return;
  }
  const bow = bowOf(s);
  if (bow) { // a rainbow trailing a sunflower star (its head is drawn apart: see drawStarHead), streaming back along it as it goes (see bowHue), fading toward the bark at the tail; or Copycat's pale copy of it
    const h0 = bowHue(s, a, now);
    for (let i = 0; i < n; i++) fills[i] = bow((h0 + 360 - (i * RAINBOW_STEP) % 360) % 360)[n > 1 ? Math.round(RAINBOW_FADE * i / (n - 1)) : 0];
    if (look === 'star') fills[0] = STAR_SUN;
    else if (s.personaKey === 'copycat') fills[0] = mix(rainbowOf(h0)[0], s.color, COPY_HEAD); // (its head half its own: see below)
    return;
  }
  const ramp = rampOf(color);
  let stripe = null;
  if (look === 'sniper') {
    stripe = stripes.get(color);
    if (!stripe) { stripe = rampOf(mix(color, '#fca5a5', 0.35)); stripes.set(color, stripe); }
  }
  for (let i = 0; i < n; i++) {
    const t = i / (n > 1 ? n - 1 : 1); // 0 at the head, 1 at the tail
    // (Ghost and Creeper fade the most, but never so far that you can't see a tail that kills.)
    const fade = look === 'ghost' ? Math.round(55 * t)
      : look === 'creeper' ? Math.round(15 + 30 * t)
      : look === 'drab' ? 15
      : Math.round(30 * t);
    fills[i] = (stripe && i % 3 === 2 ? stripe : ramp)[fade];
  }
  if (look === 'vulture') { fills[0] = '#f9a8d4'; if (n > 1) fills[1] = '#f5f5f4'; } // bald pink head, white neck ruff
  if (look === 'desperado') { if (n > 1) fills[1] = '#dc2626'; for (let i = 4; i < n; i += 4) fills[i] = '#ecdfc3'; } // bandana, poncho stripes (woven cream: Honey means a power)
  if (mime) fills[0] = '#f8fafc';
  // Copycat copying someone: its body wears a pale copy of their colours
  // (it can't help it), and its cat-eared head is half theirs, half the
  // flag's red; a thin red rim (see drawBody) and its yellow pin (see
  // drawFace) keep it Copycat. Copying no one, its head is all red.
  if (s.personaKey === 'copycat') fills[0] = copying(s) ? mix(colorOf(findById(s.memory.modelId)), s.color, COPY_HEAD) : s.color;
}
// How much of Copycat's head stays its own red while it copies (the rest
// is its model's own colour, full, not the body's pale copy).
const COPY_HEAD = 0.5;
// Whether Copycat is copying anyone now (a model, alive).
function copying(s) {
  if (!game) return false;
  const m = findById(s.memory.modelId);
  return !!(m && m.alive);
}

// Once a frame per snake: where each segment is (between its last two
// cells, and on toward the next: see predict), the cell each band bends
// through, radii and fills.
function prepare(s, alpha, now, dead, impact = 0) {
  const a = animOf(s, now);
  const n = s.body.length;
  a.look = lookOf(s);
  a.star = coatOf(s) === 'star'; // (a star for a head, not a circle: its shadow and outlines follow its points)
  if (s.personaKey === 'mute' && !dead) updateMute(s, now);
  a.color = colorOf(s);
  a.isPlayer = !s.persona;
  // A pale rim so dark bodies read on the bark (Joker's amber and white do already).
  const coat = coatOf(s);
  a.rim = !a.isPlayer && coat !== 'joker' && (coat === 'vulture' || s.personaKey === 'mute' || lumaOf(a.color) < 0.4); // (Mute: always, whatever its mood)
  // How far through its move it's drawn: up to 1, from its last cells to
  // these; past 1, on toward the next (see predict). Not past its cells
  // once it's dead or the round's over (the board rests), nor before the
  // round's first tick. Dashed this tick (a flash): it's there at once, its
  // streak behind it, and goes on gliding from a cell back along its own
  // body, so it never stands still (the cells it skipped are the dash; if
  // the flash was seen coming, it's drawn on from just where it was). One
  // that ran into something at once, or is out, is at its cells.
  const snap = a.dashTick === game?.tick, h0 = s.body[0], p0 = s.prev?.[0];
  const ran = snap && !dead && !!p0 && (p0.x !== h0.x || p0.y !== h0.y);
  let at = alpha + leadNow;
  if (dead || !game || leadRest) at = Math.min(1, at);
  if (snap && !ran) at = Math.max(1, at);
  flowK = at;
  if (dead || !game) { a.mv = 0; a.ml = 0; a.mf = 0; }
  const k1 = Math.min(1, at), k2 = a.mv ? at - k1 : 0;
  const m = k2 > 0 && a.mg ? n + 1 : n; // (growing: its tail stays where it is, a segment more)
  if (a.rad.length < m) {
    a.pts = new Float32Array(4 * m); a.cor = new Float32Array(4 * m);
    a.rad = new Float32Array(2 * m); a.fills = new Array(2 * m);
    a.lift = new Float32Array(2 * m); a.hang = new Float32Array(2 * m); a.sink = new Float32Array(2 * m);
    const fix = new Float32Array(4 * m); fix.set(a.fix); a.fix = fix;
  }
  a.n = m;
  const prev = s.prev, { pts, cor } = a;
  // (A snake that's had the edges wrap this round: its body may run off one
  // edge and on at the other, and a segment may move across one.)
  const wrapped = s.wrapUntil >= 0;
  let behind = s.body[n - 1]; // (dashed: where its tail was a cell back along its body, if it moved)
  if (ran) for (let j = prev.length - 2; j >= 0; j--) if (prev[j].x === behind.x && prev[j].y === behind.y) { behind = prev[j + 1]; break; }
  for (let i = 0; i < n; i++) {
    const c = s.body[i];
    const p = ran ? (i < n - 1 ? s.body[i + 1] : behind) : prev && i < prev.length ? prev[i] : c;
    const px = wrapped ? nearOf(p.x, c.x) : p.x, py = wrapped ? nearOf(p.y, c.y) : p.y;
    let x = px + (c.x - px) * k1, y = py + (c.y - py) * k1;
    // The band to the next segment runs through the cell this one left
    // (where the next one is headed), so a bend never cuts its corner.
    let qx, qy;
    if (k2 > 0 && a.mf) { // (a flash on ahead: from its cell on the flash's way, or its body, to the next)
      along(s, a, i + 1); const fx = wrapped ? nearOf(chX, c.x) : chX, fy = wrapped ? nearOf(chY, c.y) : chY;
      qx = chX; qy = chY;
      along(s, a, i);
      x = fx + ((wrapped ? nearOf(chX, fx) : chX) - fx) * k2;
      y = fy + ((wrapped ? nearOf(chY, fy) : chY) - fy) * k2;
    } else if (k2 > 0) { // (on toward the cell ahead of it: the next one's, or for the head, where it goes next)
      const nx = i ? s.body[i - 1].x : a.mx, ny = i ? s.body[i - 1].y : a.my;
      x += ((wrapped ? nearOf(nx, c.x) : nx) - c.x) * k2;
      y += ((wrapped ? nearOf(ny, c.y) : ny) - c.y) * k2;
      qx = c.x; qy = c.y;
    } else { // (the cell it left; dashed, the bends it lies on now)
      const q = ran ? p : prev && i < prev.length && !snap ? prev[i] : s.body[Math.min(i + 1, n - 1)];
      qx = q.x; qy = q.y;
    }
    pts[2 * i] = x * CELL + CELL / 2;
    pts[2 * i + 1] = y * CELL + CELL / 2;
    if (i < m - 1) {
      cor[2 * i] = qx * CELL + CELL / 2;
      cor[2 * i + 1] = qy * CELL + CELL / 2;
    }
  }
  if (m > n) { pts[2 * n] = cor[2 * n - 2]; pts[2 * n + 1] = cor[2 * n - 1]; } // (the tail end that stays)
  // Its flash, seen coming: its streak now (its flecks once it's gone: see
  // onTick). Seen going another way, or somewhere else, or not going after
  // all (a turn pressed since, say): that streak goes, and the new way gets
  // its own.
  if (a.streakTick === game?.tick && !(k2 > 0 && a.mf && a.streakX === a.mx && a.streakY === a.my)) { unstreak(s); a.streakTick = -1; }
  if (k2 > 0 && a.mf && a.streakTick !== game.tick) { a.streakTick = game.tick; a.streakX = a.mx; a.streakY = a.my; streakOf(s, h0.x, h0.y, a.mx, a.my, !(s.dashes > 0), now, game.tick); }
  if (game) refix(s, a, at, snap, ran ? behind : null);
  if (a.fixOn) for (let i = 0; i < 2 * m; i++) pts[i] += a.fix[i];
  a.bx = pts[0]; a.by = pts[1]; a.drawnAt = lastNow; // (where its head is drawn, for its speech bubble)
  a.offs = wrapped ? unwrap(a, m) : null;
  // The way it's heading as drawn: past its cell's centre, the way it goes next.
  if (k2 > 0 && a.mf) { a.tdx = a.mdx; a.tdy = a.mdy; }
  else if (k2 > 0) { let dx = a.mx - s.body[0].x, dy = a.my - s.body[0].y; if (dx > 1) dx = -1; else if (dx < -1) dx = 1; if (dy > 1) dy = -1; else if (dy < -1) dy = 1; a.tdx = dx; a.tdy = dy; }
  else { a.tdx = s.dir.x; a.tdy = s.dir.y; }
  // The way its face is turned (see steer), settled once a frame, before
  // its shadow and outlines (a star's are its points), and stunned, its
  // wobble. (Out, it stays as it was: a corpse never drawn alive takes the
  // way it went.)
  if (!dead || a.hc === undefined) steer(s, a, now);
  hungerLook(s, a, dead, now);
  const wobble = reduced || dead || !game ? 0 : s.stunUntil >= game.tick ? Math.sin(now / 45) * 0.16 : a.growl ? Math.sin(now / 62) * 0.11 * a.growl : 0;
  a.turn = Math.atan2(a.hs, a.hc) + wobble;
  if (a.star) a.face = starFace(a) + wobble; // (a star's points turn with it; its face stays upright: see starFace)
  // A held corpse presses its head a little into whatever it hit.
  if (impact) { pts[0] += s.dir.x * CELL * impact; pts[1] += s.dir.y * CELL * impact; }
  // Up in the air: a jump's arch along its body, and over a hole, how far
  // each segment hangs into the pit (see liftOf and sinkOf: they size the
  // segments below, and its shadow: see drawShadows).
  if (!dead && game) liftOf(s, a, at, k2, now);
  else if (a.lifted || a.hops.length) { a.lift.fill(0); a.lifted = false; a.hops.length = 0; a.rise = 0; }
  // Just crashed: the head lunges into what it hit, and bounces back.
  const hit = a.crashAt ? (now - a.crashAt) / 260 : 1;
  if (hit < 1 && hit >= 0 && !dead && !reduced) { const l = Math.sin(hit * Math.PI) * 0.34; pts[0] += a.crashDx * CELL * l; pts[1] += a.crashDy * CELL * l; }
  // Gulps: a bulge that travels one segment per tick after each bite, and
  // the head's squash at the bite itself.
  a.tickPos = game ? game.tick - 1 + alpha : 0;
  const bite = (lastNow - a.ateAt) / T.BITE_MS;
  a.bump = !dead && bite >= 0 && bite < 1 ? (a.gulpR > T.GULP ? 0.2 : 0.12) * Math.sin(bite * Math.PI) : 0;
  // Choked on its own bead: it coughs a while (see drawCough), its head
  // jolting at each cough. (From the choke, if this screen saw it; a
  // friend's screen may only see the cough.)
  const cough = !dead && coughing(s);
  if (cough && !a.coughing) a.coughFrom = now - a.chokeAt < 500 ? a.chokeAt : now;
  a.coughing = cough;
  if (cough && !reduced) { // (a jolt: its head swells and lurches forward with each cough)
    const ph = coughPhase(a, now);
    if (ph >= 0 && ph < COUGH_JOLT) { const j = Math.sin(ph / COUGH_JOLT * Math.PI); a.bump += COUGH_SWELL * j; pts[0] += a.hc * CELL * COUGH_LURCH * j; pts[1] += a.hs * CELL * COUGH_LURCH * j; }
  }
  for (let i = 0; i < m; i++) a.rad[i] = radius(i, m, a, a.tickPos);
  mealSwell(a, m, now);
  for (let i = 1; i < m; i++) if (a.slimSeg[i]) a.rad[i] *= 1 - a.slimSeg[i]; // (hungry: its body slims, its head as it was, and fills out again as a meal goes down: see hungerLook, mealSwell)
  // Seen from above, up is toward you: what's in the air swells (its head
  // the most at the top of a jump, its neck after it, in an arch), and
  // what hangs into a pit is smaller (see sinkOf). (A lift up the screen
  // read as a lunge or a flinch, depending on the heading.)
  a.swell = a.lifted ? a.lift[0] * a.liftSw : 0;
  if (a.lifted) for (let i = 0; i < m; i++) if (a.lift[i]) a.rad[i] *= 1 + a.lift[i] * a.liftSw;
  if (!dead && game) sinkOf(s, a);
  else if (a.bridging) { a.hang.fill(0); a.sink.fill(0); a.bridging = false; }
  if (a.bridging) for (let i = 0; i < m; i++) if (a.sink[i]) a.rad[i] *= 1 - sunk(a.sink[i]);
  // Come down from a jump: a squash (its head a touch wider, its face
  // flattened along the way it's going: see drawBody), and a ring of dust (see liftOf).
  const sq = (now - a.landAt) / LAND_MS;
  a.squash = !dead && !reduced && sq >= 0 && sq < 1 ? Math.sin(sq * Math.PI) * (1 - sq) * 1.6 : 0;
  if (a.squash) a.rad[0] *= 1 + 0.16 * a.squash;
  fillsOf(s, a, now);
  return a;
}

// ------------------------------------------- jumps, and bodies over holes

// A jump, seen from above. Up is toward you, so what's in the air swells,
// and its shadow stays on the ground, falling further off the higher it
// is (away from the light, down and to the right: see drawShadows). Its
// lift is an arch over what it hops: each segment is up by how near it is
// to that (a cell either side: so the head rises as it takes off, is at
// the top over the hurdle, and comes down on the far side, and the neck
// follows it up and over), and the neck is held up by the head (NECK).
// Once it's down, the arch stays over a body it crossed for as long as
// that body's there (CROSS_H: its body bridging the other's, which passes
// under), and over anything else settles down (over a hole, its body
// bridges it: see sinkOf). Drawn ahead, a jump that's sure to go starts up
// before its tick. Taking off puffs dust (see onTick), landing squashes its
// head and rings dust round it, and a faint trail marks its way through
// the air (see drawTrails). With reduced motion: the lift and its shadow,
// and none of the dust or the trail (being in the air is a rule, so it shows).
const NECK = [1, 0.7, 0.4, 0.15], CROSS_H = 0.45, LAND_MS = 230;
function liftOf(s, a, at, k2, now) {
  const hops = a.hops, m = a.n, lift = a.lift, pts = a.pts;
  if (a.lifted) lift.fill(0);
  a.lifted = false;
  let head = 0; // (the head's own lift, before it's eased)
  if (a.ml) { // (a jump seen coming: its head starts up toward what it hops)
    let flying = false;
    for (let j = 0; j < hops.length; j++) if (game.tick - hops[j].tick < hops[j].n) flying = true;
    if (!flying) {
      head = reduced ? +(k2 > 0) : archAt(s, pts[0], pts[1], a.mx, a.my, a.mx, a.my);
      a.liftSw = s.leaps > 0 ? T.LEAP_SWELL_GOLD : T.LEAP_SWELL;
    }
  }
  for (let j = hops.length - 1; j >= 0; j--) {
    const r = hops[j], p = game.tick - r.tick + at, flight = p < r.n; // (how far through its ticks in the air it's drawn: a tick over each cell it hops, and the landing)
    if (!flight && !r.landed) { // (down: its squash, a ring of dust where it came down)
      r.landed = true; r.landedAt = now;
      if (s.alive) { a.landAt = now; dustRing((r.x1 + r.dx + 0.5) * CELL, (r.y1 + r.dy + 0.5) * CELL); }
    }
    if (r.jTick !== game.tick) { // (where in its body the cells it hopped are now, and whether a body still lies under them: once a tick)
      r.jTick = game.tick;
      r.under = false;
      for (let x = r.x0, y = r.y0, n = 0; n < T.LEAP_REACH; n++) {
        const key = y * GRID + x;
        if (x >= 0 && y >= 0 && x < GRID && y < GRID && (cover[key] >= 2 || (cover[key] === 1 && coverBy[key] !== s.id))) r.under = true;
        if (x === r.x1 && y === r.y1) break;
        x += r.dx; y += r.dy;
      }
    }
    const to = flight ? 1 : r.under ? CROSS_H : 0;
    r.h = flight || reduced ? to : r.h + (to - r.h) * (1 - Math.exp(-frameDt / 90));
    if (game.tick > r.until || (!flight && r.h < 0.01 && !to)) { hops.splice(j, 1); continue; }
    if (r.h < 0.005) continue;
    a.liftSw = r.gold ? T.LEAP_SWELL_GOLD : T.LEAP_SWELL;
    for (let i = 0; i < m; i++) {
      const v = r.h * archAt(s, pts[2 * i], pts[2 * i + 1], r.x0, r.y0, r.x1, r.y1);
      if (v > lift[i]) lift[i] = v;
    }
    if (flight && (lift[0] > head || reduced)) head = reduced ? 1 : lift[0]; // (with reduced motion, a still pose up in the air for its ticks there)
  }
  // (the head eased a touch, so a jump seen late, or a guess put right, never pops)
  a.rise = reduced ? head : a.rise + (head - a.rise) * (1 - Math.exp(-frameDt / 25));
  if (a.rise < 0.002) a.rise = 0;
  lift[0] = a.rise;
  for (let i = 1; i < NECK.length && i < m; i++) if (a.rise * NECK[i] > lift[i]) lift[i] = a.rise * NECK[i];
  for (let i = 0; i < m && !a.lifted; i++) if (lift[i] > 0.002) a.lifted = true;
}
// How far up a jump's arch is at (x, y) (units), over the cells it hops
// from (x0, y0) to (x1, y1): at the top over them, down a cell either side.
function archAt(s, x, y, x0, y0, x1, y1) {
  let dx = x / CELL - 0.5 - x0, dy = y / CELL - 0.5 - y0, sx = x1 - x0, sy = y1 - y0;
  if (s.wrapUntil >= 0) { dx = wd(dx); dy = wd(dy); sx = wd(sx); sy = wd(sy); } // (across a wrapped edge)
  const l2 = sx * sx + sy * sy;
  if (l2) { const t = Math.max(0, Math.min(1, (dx * sx + dy * sy) / l2)); dx -= sx * t; dy -= sy * t; }
  const d = Math.hypot(dx, dy);
  return d < 1 ? Math.cos(d * Math.PI / 2) : 0;
}
// A jump's records, from its leap event: the cells it hops (x0, y0 to x1,
// y1: reach of them, from where it took off), the way it went, its tick,
// how many ticks it's up (n: one over each cell, and the landing), its
// arch's height now, until when.
function hopped(s, e, now) {
  const a = animOf(s, now), hops = a.hops, reach = e.reach || 1, d = s.flight?.dir || s.dir;
  if (hops.length >= 3) hops.shift();
  const x1 = s.wrapUntil >= 0 ? (e.x + d.x * (reach - 1) + GRID) % GRID : e.x + d.x * (reach - 1), y1 = s.wrapUntil >= 0 ? (e.y + d.y * (reach - 1) + GRID) % GRID : e.y + d.y * (reach - 1);
  hops.push({ x0: e.x, y0: e.y, x1, y1, dx: d.x, dy: d.y, tick: game.tick, n: reach + 1, gold: !!e.gold, h: 1, landed: false, landedAt: 0, until: game.tick + s.body.length + reach + 2, under: false, jTick: -1 });
}

// A body over a hole, seen from above: nothing under it, so it's shaded
// underneath (away from the light: see shadeUnder), its shadow falls deeper,
// onto the pit's floor and far wall, softer and further off, with the
// floor round it catching a little light (see drawShadows, pitLight), and
// it's a little smaller the lower it is. Each segment
// hangs over the pit by how far in from its rim it's drawn (hang, 0..1);
// between rims, a span sags a little, most in its middle; a tail end with
// nothing under it beyond the rim droops down into the pit (smaller and
// darker) until it's out of the cell. What's up in the air doesn't sag.
const HANG_RIM = 0.1, SINK_SHRINK = 0.3, SAG = 0.5; // (where the pit's rim is, in from a hole cell's edge, in cells; how much smaller a segment as low as it goes is; how low a span sags)
// How much smaller a segment hanging so low is: a span sags up to 22.5%
// smaller in its middle (at 15% it was under a pixel on a phone), a tail
// end hanging into the pit up to 30%, smoothly between (a tail end
// passes through a span's depths as it goes over the rim).
const SPAN_SHRINK = 0.45, sunk = s => SPAN_SHRINK * Math.min(s, SAG) + (SINK_SHRINK - SPAN_SHRINK * SAG) / (1 - SAG) * Math.max(0, s - SAG);
let supH = new Float32Array(64), supT = new Float32Array(64);
function sinkOf(s, a) {
  const m = a.n, hang = a.hang, sink = a.sink, pts = a.pts;
  if (a.holeTick !== game.tick || a.holeGame !== game) { a.holeTick = game.tick; a.holeGame = game; a.nearHole = nearHole(s); } // (once a tick: is any of it on or leaving a hole?)
  if (!a.nearHole) { if (a.bridging) { hang.fill(0); sink.fill(0); a.bridging = false; } return; }
  let any = false;
  for (let i = 0; i < m; i++) { hang[i] = overHole(pts[2 * i], pts[2 * i + 1]); if (hang[i]) any = true; }
  if (!any) { if (a.bridging) sink.fill(0); a.bridging = false; return; }
  a.bridging = true;
  if (supH.length < m) { supH = new Float32Array(2 * m); supT = new Float32Array(2 * m); }
  // (how many segments to the nearest on firm bark, toward its head, and toward its tail)
  for (let i = 0, last = -1; i < m; i++) { if (hang[i] < 0.02) last = i; supH[i] = last < 0 ? Infinity : i - last; }
  for (let i = m - 1, last = -1; i >= 0; i--) { if (hang[i] < 0.02) last = i; supT[i] = last < 0 ? Infinity : last - i; }
  for (let i = 0; i < m; i++) {
    const o = hang[i], h = supH[i], t = supT[i];
    const z = !o ? 0 : h < Infinity && t < Infinity ? SAG * Math.min(1, Math.min(h, t) / 1.5) // (a span between rims, sagging)
      : h < Infinity ? Math.min(1, 0.8 + 0.2 * (h - 1)) : 0; // (its tail end, hanging off the rim; its head end's in the air, or going in)
    sink[i] = o * z * Math.max(0, 1 - 3 * a.lift[i]);
  }
}
// Is any of a snake's body on a hole, or leaving one?
function nearHole(s) {
  if (!game.holes.size) return false;
  for (const c of s.body) if (c.x >= 0 && c.y >= 0 && c.x < GRID && c.y < GRID && holeMask[c.y * GRID + c.x]) return true;
  if (s.prev) for (const c of s.prev) if (c.x >= 0 && c.y >= 0 && c.x < GRID && c.y < GRID && holeMask[c.y * GRID + c.x]) return true;
  return false;
}
// How far over a pit a point (units) is: 0 on the bark or the rim, rising
// to 1 half a cell in from the rim of the hole cell it's in (a cell with
// holes all round is all pit).
function overHole(x, y) {
  const fx = x / CELL, fy = y / CELL, cx = Math.floor(fx), cy = Math.floor(fy), key = cy * GRID + cx;
  if (cx < 0 || cy < 0 || cx >= GRID || cy >= GRID || !holeMask[key]) return 0;
  const u = fx - cx, v = fy - cy;
  let d = 0.5;
  if (cx > 0 && !holeMask[key - 1]) d = Math.min(d, u);
  if (cx < GRID - 1 && !holeMask[key + 1]) d = Math.min(d, 1 - u);
  if (cy > 0 && !holeMask[key - GRID]) d = Math.min(d, v);
  if (cy < GRID - 1 && !holeMask[key + GRID]) d = Math.min(d, 1 - v);
  const k = Math.max(0, Math.min(1, (d - HANG_RIM) / (0.5 - HANG_RIM)));
  return k * k * (3 - 2 * k);
}
