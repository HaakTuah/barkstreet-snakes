// The renderer (see render/core.js): each snake's animation state, its
// looks (which face, tongue and marks, and a costume change), its mouth,
// and the colours its body is filled with.

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
      offs: null, offList: [], offPool: [], seenPortal: false, // (where it's drawn across a wrapped edge, if it is: see unwrap; seenPortal: see acrossEdges)
      look: '', color: '', isPlayer: false, costume: null, costumeAt: -1e9, oldLook: '', oldColor: '', oldHead: null, wornLook: '', wornColor: '', wornHead: null, // (costume: see costumeChange)
      rim: false, bump: 0, tickPos: 0, lean: 0,
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

// A costume change (2t): Capricious taking up a mood (or putting one
// down), or Copycat a new model (or none). One animation for all of them,
// in the face's frame, over COSTUME_MS: a quick puff round the head, in
// Capricious's pink or Copycat's red; the old costume popping off (bigger,
// fading, its head's old colour with it) and the new one popping on. With
// reduced motion, a plain crossfade. (Seen, not played: each screen sees
// the mood and the model it has.)
const COSTUME_MS = 500;
function costumeChange(s, a, now) {
  const cap = s.personaKey === 'capricious';
  if (!cap && s.personaKey !== 'copycat') return -1;
  const key = cap ? a.look : copying(s) ? String(s.memory.modelId) : '';
  if (a.costume !== key) {
    if (a.costume !== null) { a.costumeAt = now; a.oldLook = a.wornLook; a.oldColor = a.wornColor; a.oldHead = a.wornHead; }
    a.costume = key;
  }
  a.wornLook = a.look; a.wornColor = a.color; a.wornHead = a.fills[0]; // (as worn this frame: the old costume, next change)
  const u = (now - a.costumeAt) / COSTUME_MS;
  return u >= 0 && u < 1 ? u : -1;
}
function drawChange(s, a, look, color, blinking, u) {
  const r = a.rad[0] / 1.1, g = ctx.globalAlpha;
  if (reduced) {
    ctx.globalAlpha = g * (1 - u); oldCostume(s, a, blinking, r);
    ctx.globalAlpha = g * u; drawFace(s, look, color, blinking, a);
    ctx.globalAlpha = g;
    return;
  }
  const on = popOf((u - 0.3) / 0.7 * POP_MS); // (on from 30% of the way, past full size and back)
  if (on > 0) { ctx.save(); ctx.scale(on, on); drawFace(s, look, color, blinking, a); ctx.restore(); }
  if (u < 0.5) { // (off: bigger, and gone)
    const v = u / 0.5, k = 1 + 0.5 * v;
    ctx.save(); ctx.globalAlpha = g * (1 - v) * (1 - v); ctx.scale(k, k);
    oldCostume(s, a, blinking, r);
    ctx.restore();
  }
  const col = s.personaKey === 'copycat' ? s.color : '#ec4899', pale = s.personaKey === 'copycat' ? '#fecaca' : '#fbcfe8';
  const p = Math.sin(Math.min(1, u / 0.85) * Math.PI); // (the puff: swells round the head, then clears)
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const ang = i * TAU / 9 + u * 0.9, d = r * (0.95 + 0.6 * u), pr = r * (0.26 + 0.1 * (i % 2)) * p;
    if (pr <= 0) continue;
    ctx.moveTo(Math.cos(ang) * d + pr, Math.sin(ang) * d); ctx.arc(Math.cos(ang) * d, Math.sin(ang) * d, pr, 0, TAU);
  }
  ctx.globalAlpha = g * Math.min(1, 1.6 * (1 - u));
  ctx.fillStyle = pale; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = CELL * 0.05; ctx.stroke();
  ctx.globalAlpha = g;
}
// The costume it wore before the change: its head's colour and its face.
function oldCostume(s, a, blinking, r) {
  if (a.oldHead == null) return;
  ctx.fillStyle = a.oldHead;
  circle(0, 0, r);
  const head = a.fills[0];
  a.fills[0] = a.oldHead; // (its face's own colours from it: Copycat's ears)
  drawFace(s, a.oldLook, a.oldColor, blinking, a);
  a.fills[0] = head;
}
// The mouth: open when food is right in front, then a couple of chews after a bite.
let deadNow = false; // the snake being drawn has just died: mouth shut
let frameDt = 16;     // this frame's length, for easing
function mouthOpen(s, a) {
  if (deadNow) return 0;
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
  // (A snake that's had the edges wrap this round, or may have followed
  // through a gold portal: its body may run off one edge and on at the
  // other, and a segment may move across one.)
  const wrapped = acrossEdges(s, a);
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
