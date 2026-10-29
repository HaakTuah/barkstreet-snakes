// The renderer (see render/core.js): the food (tossed, knocked, the dust
// and steam about it), and the beetles' burrows.

// ------------------------------------------------------------ the food

// When each piece of food first showed, so it pops in once, and when its
// next spore or glint is due. Kept by cell rather than by object (a guest
// online gets fresh food objects every tick). At the start of a round the
// food pops in one piece after another; a dead snake's beads pop in head to
// tail. born: cell -> { kind, at, i, next, v (a bead's look) }.
const born = new Map();
const eatenNow = new Set(); // cells eaten on the last tick (so food that just vanished poofs)
let bornTick = -1, bornGen = 0, fresh = true;
const POP_MS = 420, RIPPLE_MS = 30;

function trackFood(now) {
  if (game.tick === bornTick) return;
  bornTick = game.tick;
  bornGen++;
  let n = 0;
  for (const f of game.food) {
    if (f.kind === 'beetle') continue;
    const key = f.y * GRID + f.x;
    let b = born.get(key);
    if (!b || b.kind !== f.kind) {
      b = { kind: f.kind, at: now + (fresh ? 200 + 90 * n : 0), i: 0, next: 0, gen: 0, v: (f.color || '#a16207') + '|', fell: !fresh && f.kind === 'food' };
      born.set(key, b);
    }
    b.gen = bornGen;
    n++;
  }
  for (const [key, b] of born) {
    if (b.gen === bornGen) continue;
    // Gone without being eaten (a mushroom withered, a golden apple rotted): a little poof.
    if (!eatenNow.has(key) && (b.kind === 'mushroom' || b.kind === 'golden')) {
      spawn((key % GRID) * CELL + CELL / 2, Math.floor(key / GRID) * CELL + CELL / 2, 7, 110, 420, 2.2, b.kind === 'golden' ? '#a16207' : '#dc2626', '#f6ecd2');
    }
    born.delete(key);
  }
  eatenNow.clear();
  fresh = false;
}

// Food moved aside (see onTick): a bead its own snake choked on, spat
// from (x, y) to (tx, ty) in a little arc (or, with nowhere to go, tossed
// up where it was); food a coughing head nudged, rolling there; or food
// the woodpecker's strike knocked out of its patch, flying there in an
// arc, higher and longer the further it goes. Its look goes with it (a
// bead keeps its markings), and it's drawn going there (see drawFood); a
// beetle scurries there (see drawBeetle). With reduced motion it's simply
// there.
// A bead its own snake choked on is in its mouth while its cheeks puff (so
// the face shows the gag: on a phone a bead over it was the whole head),
// and it's spat out on the "ptoo" (SPIT_WAIT), out of its cheek on the
// side it lands (its head has gone on by then, and the bead lands beside
// its neck: from the front of its mouth it flew back over its face),
// small at first, full size as it clears the head, landing on the tok
// (SPAT_MS from the choke, as the sound has it).
const SPAT_MS = 320, ROLL_MS = 280, FLY_CELL_MS = 70, FLY_MAX_MS = 620, SPIT_WAIT = 120, SPIT_SIDE = 0.7, SPIT_AHEAD = 0.25;
// How far on its way a piece moved aside is (0..1; -1 while it's still in
// the mouth that spat it), and, as it leaves, where from.
function movedU(b, now) {
  const t = now - b.movedAt - b.wait;
  if (t < 0) return -1;
  if (b.by) { // (its cheek on that side, as drawn: or, landing straight ahead or behind, the front of its mouth)
    const a = anim.get(b.by);
    if (a && a.n) {
      const hx = a.pts[0], hy = a.pts[1], c = a.hc, s = a.hs, side = Math.sign(Math.round(c * ((b.ty + 0.5) * CELL - hy) - s * ((b.tx + 0.5) * CELL - hx)));
      const ox = side ? SPIT_AHEAD * c - SPIT_SIDE * side * s : SPIT_SIDE * c, oy = side ? SPIT_AHEAD * s + SPIT_SIDE * side * c : SPIT_SIDE * s;
      b.fx = hx / CELL + ox - 0.5; b.fy = hy / CELL + oy - 0.5;
    }
    b.by = null;
  }
  return t / ((b.spat ? b.fly : ROLL_MS) - b.wait);
}
// Up in the air: over the snakes (a bead's spat over its own head; food
// flies over whatever's in the way), bigger the higher it is (its shadow's
// on the ground: see drawFood). A bead is rimmed in ink and parchment in
// the air, so one in your own colour reads against your body under it.
function drawTossed(now) {
  if (reduced) return;
  for (let j = 0; j < game.food.length; j++) {
    const f = game.food[j];
    if (f.kind === 'beetle') continue;
    const b = born.get(f.y * GRID + f.x);
    if (!b || !b.spat || !b.movedAt) continue;
    const u = movedU(b, now);
    if (u <= 0 || u >= 1) continue;
    const e = 1 - (1 - u) * (1 - u), up = Math.sin(u * Math.PI), sz = (1 + 0.3 * up) * (b.wait ? Math.min(1, 0.5 + 2 * u) : 1);
    const x = (b.fx + (f.x - b.fx) * e + 0.5) * CELL, y = (b.fy + (f.y - b.fy) * e + 0.5) * CELL - up * b.hop;
    if (f.kind === 'pellet') {
      ctx.fillStyle = 'rgba(28,16,6,0.85)'; circle(x, y, CELL * 0.43 * sz);
      ctx.fillStyle = '#fffbea'; circle(x, y, CELL * 0.37 * sz);
    }
    blitAbout(flyingSprite(f, b), x, y, 0, 0, sz, sz, 0);
  }
}
// Food as it's drawn in the air (no glow, haze or fly: they don't come along).
function flyingSprite(f, b) {
  if (f.kind === 'pellet') return beadSprite(f.cooked ? ROAST : b.v);
  if (f.kind === 'golden') return goldenSprite();
  if (f.kind === 'mushroom') return mushroomSprite();
  if (f.kind === 'leaf') return goldLeafSprite();
  if (f.kind === 'goldcap') return goldcapSprite();
  if (f.kind === 'spill') return goldenSprite(); // (a spill knocked aside: a glint of gold in the air)
  const left = f.expires != null ? f.expires - game.tick : 999;
  return appleSprite(f.cooked ? 'baked' : left > 50 ? 'fresh' : left > 22 ? 'bruised' : 'rotten');
}
// A piece the woodpecker knocks d cells is flung: the further it goes, the
// longer it's in the air and the higher it flies (ms, and cells high), so
// a long throw clears the bodies it crosses and reads all the way to its
// ring. (A spat bead's arc, 320 ms and 0.6 of a cell high whatever the
// way, made a throw over two bodies a flat zip, and one beside the patch
// a slow toss.) The game's knock sound lands with it (knockFlight).
const knockFly = d => Math.min(FLY_MAX_MS, SPAT_MS + FLY_CELL_MS * d), knockHop = d => Math.min(1.5, 0.6 + 0.22 * d);
function moveFood(x, y, tx, ty, now, spat, knocked = false, by = null) {
  const from = y * GRID + x, to = ty * GRID + tx, f = game.food.find(o => o.x === tx && o.y === ty && o.kind !== 'beetle');
  if (!f) return;
  const b = born.get(from), d = Math.hypot(tx - x, ty - y);
  if (from !== to) born.delete(from);
  born.set(to, { kind: f.kind, at: now - POP_MS, i: 0, next: 0, gen: bornGen, v: b && b.kind === f.kind ? b.v : (f.color || '#a16207') + '|', fell: false, fx: x, fy: y, movedAt: now, spat,
    fly: knocked ? knockFly(d) : SPAT_MS, hop: CELL * (knocked ? knockHop(d) : 0.6), by, wait: by ? SPIT_WAIT : 0, tx, ty }); // (by: the snake that spat it)
}

// Through the woodpecker's aim, the food in its mark trembles (see
// drawFood), and a faint ring marks where each piece will be knocked to at
// the strike: the engine's own list (knocks: every landing in the strike's
// order, no two on one cell, never a burrow; the rivals read the same),
// worked out once a tick; in the aim's last PECK_PROMISE_TICKS moves, the
// landings the engine has promised (w.landings, kept at the strike while
// their cells are free; food that comes into the mark later is promised
// where its ring is then). Nothing for a piece the bird will eat. (The
// bird drumming beside the patch never hides one: it clings clear of them
// if it can, and any it still covers are drawn over it too: see
// drumChoice, drawWoodpecker.)
const knockLand = []; // (cells, x and y, this tick's)
let knockFor = -1, knockGame = null;
function knockCells(w) {
  if (knockFor !== game.tick || knockGame !== game) {
    knockFor = game.tick; knockGame = game; knockLand.length = 0;
    const knocks = window.SnakeEngine?.knocks;
    if (knocks) for (const { to } of knocks(game, w.target, w.landings)) if (to) knockLand.push(to.x, to.y);
  }
  return knockLand;
}
function knockRings(w, prog, now, g = ctx) {
  if (!knockCells(w).length) return;
  const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now / 160);
  g.setLineDash(KNOCK_DASH);
  g.lineCap = 'butt';
  for (let pass = 0; pass < 2; pass++) {
    g.globalAlpha = (0.35 + 0.4 * prog) * (pass ? 1 : 0.7);
    g.strokeStyle = pass ? '#fef3c7' : '#140a04';
    g.lineWidth = pass ? 1.6 : 3.4;
    g.beginPath();
    for (let i = 0; i < knockLand.length; i += 2) {
      const x = (knockLand[i] + 0.5) * CELL, y = (knockLand[i + 1] + 0.5) * CELL, r = CELL * (0.36 + 0.04 * pulse);
      g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
    }
    g.stroke();
  }
  g.setLineDash(NO_DASH);
  g.globalAlpha = 1;
}
const KNOCK_DASH = [5, 4];

// A dead snake's beads: what each one looks like, and a ripple from head to
// tail. A corpse leaves a bead on every other segment (see the engine's
// leavesBead), so the markings go by the bead's place among the beads it
// left, not by its segment: Joker's beads still alternate purple and amber,
// Wildcard's still run collar, stars and stripes, Star's round the rainbow. (The ripple keeps the
// segment's time, so it still runs down the body.)
const remainsAt = new Set();
function noteRemains(s, now) {
  remainsAt.clear();
  for (const f of game.food) if (f.kind === 'pellet' && (f.owner == null || f.owner === s.id)) remainsAt.add(f.y * GRID + f.x);
  for (let i = 0, n = -1; i < s.body.length; i++) {
    const key = s.body[i].y * GRID + s.body[i].x, old = born.get(key);
    if (!remainsAt.has(key)) continue; // (no bead left there)
    n++;
    if (old && old.kind !== 'pellet') continue; // (food there stays food)
    born.set(key, { kind: 'pellet', at: now + i * RIPPLE_MS, i, next: 0, gen: bornGen, v: beadOf(s, n) });
  }
}

// A bead that went (from its rot event): its own fill, as drawn.
function beadFill(e) {
  const v = born.get(e.y * GRID + e.x)?.v, fill = v ? v.slice(0, v.indexOf('|')) : e.color;
  return fill && fill[0] === '#' ? fill : '#a16207';
}

// The bead a snake leaves at body segment i: its own colours and markings.
function beadOf(s, i) {
  const look = coatOf(s), col = colorOf(s), bow = bowOf(s);
  let fill = col[0] === '#' ? col : '#a16207', mark = '';
  if (s.personaKey === 'wildcard') fill = WILD(i);
  else if (look === 'mute') fill = i === 0 ? '#f8fafc' : fill; // (its mood's colour as it went)
  else if (look === 'joker') fill = i === 0 ? '#f8fafc' : i % 2 ? '#f59e0b' : '#a21caf';
  else if (bow) fill = bow(TWINKLE_HUES[i % TWINKLE_HUES.length])[0]; // (its rainbow, in order: red, orange, yellow, green, blue, violet, and round again; Copycat's copy of it, pale)
  else if (look === 'sniper' && i % 3 === 2) fill = mix(fill, '#fca5a5', 0.35);
  else if (look === 'vulture' && i < 2) fill = i ? '#f5f5f4' : '#f9a8d4';
  else if (look === 'desperado' && i === 1) fill = '#dc2626';
  else if (look === 'desperado' && i >= 4 && i % 4 === 0) fill = '#ecdfc3'; // (its poncho's cream stripes)
  if (!s.persona) mark = MARKS[col] || '';
  else if (look === 'mason') mark = i % 4 === 3 ? 'marble2' : 'marble';
  else if (look === 'colonist') mark = i % 2 ? 'strap' : 'strap2';
  else if (look === 'ouroboros') mark = 'diamond';
  else if (s.personaKey === 'copycat') mark = 'copy';
  else if (look === 'ghost') mark = 'ghost';
  return fill + '|' + mark;
}

// How big something popping in is, ms after it appeared: nothing yet, then
// up past full size and back (with reduced motion, simply there).
function popOf(ms) {
  if (reduced) return 1;
  const t = ms / POP_MS;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const u = t - 1;
  return 1 + 2.7 * u * u * u + 1.7 * u * u;
}

// A sprite drawn at (x, y) + offset, scaled about a pivot (px, py) relative to (x, y).
function blitAbout(sp, x, y, px, py, sx, sy, rot) {
  const half = SPRITE * CELL / 2;
  if (!rot) { // (not turned: one scaled blit, no transform to set and undo)
    ctx.drawImage(sp, x + px - sx * (half + px), y + py - sy * (half + py), SPRITE * CELL * sx, SPRITE * CELL * sy);
    return;
  }
  ctx.save();
  ctx.translate(x + px, y + py);
  if (rot) ctx.rotate(rot);
  ctx.scale(sx, sy);
  ctx.drawImage(sp, -half - px, -half - py, SPRITE * CELL, SPRITE * CELL);
  ctx.restore();
}

// An apple (or the golden one): it bobs up off its shadow and squashes a
// touch as it comes down, swaying its leaf; now and then a glint winks on it.
// t: seconds, offset per apple so they don't move together.
function drawAppleAt(sp, x, y, t, pop, alpha) {
  const lively = !reduced;
  const h = lively ? 0.5 - 0.5 * Math.cos(t * 3.9) : 0; // 0 down .. 1 up
  const sq = lively ? 0.08 * (1 - h) * (1 - h) * (1 - h) : 0;
  const lift = h * 3.2;
  ctx.globalAlpha = alpha * (1 - 0.35 * h);
  shadowAt(x + 1.3, y + CELL * 0.36, pop * (1 - 0.22 * h));
  ctx.globalAlpha = alpha;
  blitAbout(sp, x, y - lift, 0, CELL * 0.38, pop * (1 + sq), pop * (1 - sq), lively ? Math.sin(t * 1.9) * 0.06 : 0);
  const g = (t * 0.27) % 1;
  if (lively && g < 0.09 && pop >= 1) {
    const w = SPRITE * CELL * 0.75 * Math.sin(g / 0.09 * Math.PI);
    ctx.drawImage(starSprite(), x - CELL * 0.13 - w / 2, y - CELL * 0.08 - lift - w / 2, w, w);
  }
  ctx.globalAlpha = 1;
}

// A mushroom sways on its stem and breathes; near the end it wilts, leaning
// over, shrinking and fading; and it lets go of a spore now and then.
// A mushroom: poisonous-looking, a faint violet haze round it that breathes.
const hazeSprite = () => sprite('haze', '', drawHaze);
const drawHaze = g => {
  const grad = g.createRadialGradient(0, 0, CELL * 0.1, 0, 0, CELL * 0.75);
  grad.addColorStop(0, 'rgba(192,132,252,0.5)');
  grad.addColorStop(0.6, 'rgba(167,139,250,0.14)');
  grad.addColorStop(1, 'rgba(132,204,22,0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(0, 0, CELL * 0.75, 0, TAU); g.fill();
};
function drawMushroomAt(f, x, y, t, pop) {
  const lively = !reduced;
  const hz = SPRITE * CELL * pop * (1 + (lively ? 0.12 * Math.sin(t * 2.3) : 0));
  ctx.globalAlpha = lively ? 0.75 + 0.25 * Math.sin(t * 2.3) : 0.85;
  ctx.drawImage(hazeSprite(), x - hz / 2, y - hz / 2 - CELL * 0.05, hz, hz);
  ctx.globalAlpha = 1;
  const left = f.expires != null ? f.expires - game.tick : 99;
  const wilt = left < 30 ? Math.min(1, 1 - left / 30) : 0;
  const breathe = lively ? Math.sin(t * 5.1) * 0.04 : 0;
  const lean = (lively ? Math.sin(t * 2.5) * 0.12 : 0) + 0.5 * wilt * (f.x % 2 ? 1 : -1);
  ctx.globalAlpha = 1 - 0.4 * wilt;
  shadowAt(x + 1, y + CELL * 0.36, pop * (1 - 0.25 * wilt));
  blitAbout(mushroomSprite(), x, y, 0, CELL * 0.34, pop * (1 - 0.2 * wilt) * (1 - breathe * 0.5), pop * (1 - 0.3 * wilt) * (1 + breathe), lean);
  if (lively && pop >= 1) { // stink lines: two wavy violet wisps rising off it (the cartoon for "don't eat me")
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      const ph = (t * 0.55 + k * 0.5) % 1, x0 = x + (k ? 0.16 : -0.14) * CELL, y0 = y - CELL * (0.4 + 0.55 * ph);
      ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.85 * (1 - 0.4 * wilt);
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const yy = y0 - i * CELL * 0.04, xx = x0 + Math.sin(i * 0.9 + t * 4 + k * 2) * CELL * 0.06;
        if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

// Ambient motes from a small pool: poison spores drifting up off the mushrooms
// (kind 0, violet), glints twinkling round a golden apple (1), smoke (2), embers (3),
// steam off baked food (4), dust kicked up by a jump (5) and Star's twinkles (6 on).
const MAX_M = 96;
const mx = new Float32Array(MAX_M), my = new Float32Array(MAX_M), mvx = new Float32Array(MAX_M), mvy = new Float32Array(MAX_M);
const mlife = new Float32Array(MAX_M), mmax = new Float32Array(MAX_M), msize = new Float32Array(MAX_M);
const mkind = new Uint8Array(MAX_M);
let mNext = 0, mLive = 0;
function mote(x, y, vx, vy, life, size, kind) {
  if (reduced) return;
  const i = mNext;
  mNext = (mNext + 1) % MAX_M;
  mx[i] = x; my[i] = y; mvx[i] = vx; mvy[i] = vy; mmax[i] = mlife[i] = life; msize[i] = size; mkind[i] = kind;
  mLive = Math.min(MAX_M, mLive + 1);
}
// Drawn in batches: every mote of a kind at the same fade (four steps of
// it) goes in one shape, so a busy fire is a handful of fills, not hundreds.
const MOTE_LOOK = [['#d8b4fe', 0.7], null, ['#78716c', 0.32], ['#fdba74', 1], ['#f8fafc', 0.4], ['#d6b480', 0.6]]; // spores, (glints), smoke, embers, steam, dust
const DUST = 5;
// Dust kicked up off the bark: puffs kicked back (against dx, dy) where a
// jump takes off, and a ring of them where it comes down. (Motes: none
// with reduced motion.)
function dustPuffs(x, y, dx, dy) {
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1, sp = 8 + Math.random() * 12, out = 26 + Math.random() * 18; // (out to either side, a little back)
    mote(x + side * dy * CELL * 0.3, y - side * dx * CELL * 0.3, -dx * sp + dy * side * out, -dy * sp - dx * side * out, 420 + Math.random() * 200, 2.6 + Math.random() * 1.4, DUST);
  }
}
function dustRing(x, y) {
  for (let i = 0; i < 10; i++) {
    const ang = (i + Math.random() * 0.4) * TAU / 10, sp = 36 + Math.random() * 16;
    mote(x + Math.cos(ang) * CELL * 0.32, y + Math.sin(ang) * CELL * 0.32, Math.cos(ang) * sp, Math.sin(ang) * sp, 400 + Math.random() * 140, 2.4 + Math.random() * 1.2, DUST);
  }
}
const mBucket = new Uint8Array(MAX_M), mRad = new Float32Array(MAX_M);
function drawMotes(dt) {
  if (!mLive) return;
  const st = dt / 1000;
  let live = 0;
  for (let i = 0; i < MAX_M; i++) {
    mBucket[i] = 0;
    if (mlife[i] <= 0) continue;
    mlife[i] -= dt;
    if (mlife[i] <= 0) continue;
    mx[i] += mvx[i] * st;
    my[i] += mvy[i] * st;
    const t = Math.min(1, Math.max(0, mlife[i] / mmax[i])), fade = Math.sin(t * Math.PI); // in and out
    live++;
    if (mkind[i] === 1 || mkind[i] >= TWINKLE) { // a glint: the sparkle sprite, twinkling (only ever a few); or one of Star's, in a colour of its rainbow
      const w = SPRITE * CELL * msize[i] * fade;
      ctx.globalAlpha = fade;
      ctx.drawImage(mkind[i] === 1 ? starSprite() : twinkleSprite(mkind[i] - TWINKLE), mx[i] - w / 2, my[i] - w / 2, w, w);
      continue;
    }
    if (mkind[i] === 0) mx[i] += Math.sin(mlife[i] / 160) * 0.15; // spores waft
    mRad[i] = mkind[i] === 2 || mkind[i] >= 4 ? msize[i] * (1.6 - t * 0.6) : msize[i]; // (smoke, steam and dust grow as they go)
    mBucket[i] = 1 + Math.min(3, Math.floor(fade * 4)); // 1..4
  }
  for (let kind = 0; kind < MOTE_LOOK.length; kind++) {
    const look = MOTE_LOOK[kind];
    if (!look) continue;
    ctx.fillStyle = look[0];
    for (let b = 1; b <= 4; b++) {
      let any = false;
      for (let i = 0; i < MAX_M; i++) {
        if (mBucket[i] !== b || mkind[i] !== kind) continue;
        if (!any) { ctx.beginPath(); any = true; }
        ctx.moveTo(mx[i] + mRad[i], my[i]);
        ctx.arc(mx[i], my[i], mRad[i], 0, TAU);
      }
      if (!any) continue;
      ctx.globalAlpha = look[1] * (b - 0.5) / 4;
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  mLive = live;
}

// A beetle diving into its burrow: it shrinks away into the hole. One that
// dug itself in sinks the rest of the way, its collar of sawdust closing
// over it (then its bore is a burrow, freshly bored: see drawFresh).
const dives = []; // { x, y, at, ang, gold, dug (it dug in: how far it had sunk) }
function drawDive(now) {
  for (let i = dives.length - 1; i >= 0; i--) {
    const d = dives[i], age = (now - d.at) / (d.dug ? 220 : 320);
    if (age >= 1 || age < 0 || reduced) { dives.splice(i, 1); continue; }
    const c = CELL, x = d.x * c + c / 2, y = d.y * c + c / 2;
    if (d.dug) {
      const dig = d.dug + (1 - d.dug) * age;
      ctx.fillStyle = 'rgba(20,10,4,0.8)';
      ctx.beginPath(); ctx.ellipse(x, y, c * 0.38 * (1 - age), c * 0.31 * (1 - age), 0, 0, TAU); ctx.fill();
      digCollar(x, y, dig, d.x * 7 + d.y * 13);
      continue;
    }
    const s = 1.35 * (1 - age);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(d.ang + age * 2);
    ctx.scale(s, s);
    ctx.fillStyle = d.gold ? honeyShell() : '#059669';
    ctx.strokeStyle = d.gold ? '#047857' : '#fbbf24';
    ctx.lineWidth = c * 0.03;
    ctx.beginPath(); ctx.ellipse(-c * 0.02, 0, c * 0.22, c * 0.17, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

// A roast: a piece of snake that fell off in the flames, browned all over.
const ROAST = '#92400e|';
// A bead going off, laid over it as it does: a dull brown film and brown
// spots, for any bead's colours; on a dark bead (Vulture's black,
// Wildcard's navy), where brown spots don't show, a pale mould instead:
// a grey film and grey-beige spots. From BEAD_OFF ticks before it rots it
// comes over it; in its last BEAD_GOING it shrinks and dims.
const BEAD_OFF = 45, BEAD_GOING = 15, BEAD_DARK = 0.26; // (a bead this dark or darker goes off pale)
const beadRotSprite = pale => sprite('beadrot', pale ? 'pale' : '', drawBeadRot);
const drawBeadRot = (g, variant) => {
  const c = CELL, r = c * 0.26, pale = variant === 'pale';
  g.fillStyle = pale ? 'rgba(150,142,120,0.45)' : 'rgba(82,60,34,0.6)';
  g.beginPath(); g.arc(0, 0, r + c * 0.035, 0, TAU); g.fill();
  g.fillStyle = pale ? 'rgba(214,204,164,0.65)' : 'rgba(52,30,10,0.65)';
  for (const [x, y, rr] of [[0.1, 0.07, 0.065], [-0.1, 0.11, 0.045], [0.11, -0.09, 0.04], [-0.06, -0.02, 0.03]]) { g.beginPath(); g.arc(c * x, c * y, c * rr, 0, TAU); g.fill(); }
  g.strokeStyle = pale ? 'rgba(214,204,164,0.55)' : 'rgba(52,30,10,0.55)'; // (a wrinkle)
  g.lineWidth = c * 0.025;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(-r * 0.6, -r * 0.35); g.quadraticCurveTo(-r * 0.1, -r * 0.05, -r * 0.35, r * 0.45); g.stroke();
};
// Baked food steams now and then.
function steam(b, x, y, now) {
  if (reduced || !b || now < b.next) return;
  b.next = now + 450 + Math.random() * 500;
  mote(x + (Math.random() - 0.5) * CELL * 0.3, y - CELL * 0.3, (Math.random() - 0.5) * 6, -16 - Math.random() * 8, 1200, 2 + Math.random(), 4);
}

// Every piece of food on the board, under the snakes. Food in the
// woodpecker's mark trembles through the aim, by CSS px, not the board's
// units, so it shows on a phone too (in units it was under a pixel there):
// 1 px each way as the aim starts, 2.5 by the strike.
const TREMBLE_PX = 1, TREMBLE_MORE = 1.5;
function drawFood(alpha, now) {
  trackFood(now);
  trackBugs(now);
  const lively = !reduced, prog = lively ? aimed(alpha) : -1; // (through the woodpecker's aim: what's in its mark trembles)
  const perPx = boardRect.w > 0 ? SIZE / boardRect.w : 1; // (the board's units a CSS px: the tremble is as big on any screen)
  for (const f of game.food) {
    if (f.kind === 'beetle') { drawBeetle(f, alpha, now); continue; }
    const key = f.y * GRID + f.x, b = born.get(key);
    if (f.kind === 'pellet' && heldCells[key]) { if (b) b.at = now + b.i * RIPPLE_MS; continue; } // (under a held corpse: not yet)
    const pop = b ? popOf(now - b.at) : 1;
    if (pop <= 0) continue;
    let x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2;
    if (b && b.movedAt) { // (spat, knocked or nudged aside: on its way from where it was, see moveFood)
      const u = reduced ? 1 : movedU(b, now);
      if (u < 0) continue; // (still in the mouth that spat it)
      if (u >= 1) b.movedAt = 0;
      else {
        const e = 1 - (1 - u) * (1 - u);
        x = (b.fx + (f.x - b.fx) * e + 0.5) * CELL; y = (b.fy + (f.y - b.fy) * e + 0.5) * CELL;
        if (b.spat) { shadowAt(x + 1, y + CELL * 0.32, pop * 0.85 * (1 - 0.35 * Math.sin(u * Math.PI))); continue; } // (up in the air: its shadow on the ground, and it over the snakes, see drawTossed)
        y -= Math.abs(Math.sin(u * Math.PI * 2)) * (1 - u) * CELL * 0.14; // (rolling, it bounces along the bark, shadow and all)
      }
    }
    if (prog >= 0 && patch[key]) { const a = (TREMBLE_PX + TREMBLE_MORE * prog) * perPx; x += Math.sin(now / 19 + key) * a; y += Math.cos(now / 26 + key * 1.7) * a * 0.7; }
    const t = now / 1000 + ((f.x * 7 + f.y * 13) % 10) * 0.63; // each piece on its own beat
    if (f.kind === 'food') {
      const drop = b?.fell && !reduced ? Math.max(0, 1 - (now - b.at) / 380) : 0; // (a new apple drops from the tree above)
      const left = f.expires != null ? f.expires - game.tick : 999;
      const look = f.cooked ? 'baked' : left > 50 ? 'fresh' : left > 22 ? 'bruised' : 'rotten';
      const shrivel = look === 'rotten' && left < 10 ? 0.78 + 0.22 * Math.max(0, left) / 10 : 1;
      drawAppleAt(appleSprite(look), x, y - drop * drop * CELL * 3, t, (b?.fell ? 1 : pop) * shrivel, 1);
      if (look === 'rotten' && lively) { // a fly has found it
        const fa = now / 150 + f.x * 1.7, fx = x + Math.cos(fa) * CELL * 0.4, fy = y - CELL * 0.32 + Math.sin(fa * 1.6) * CELL * 0.14;
        ctx.fillStyle = 'rgba(241,245,249,0.7)';
        const flap = 0.6 + 0.6 * Math.abs(Math.sin(now / 18));
        ctx.beginPath(); ctx.ellipse(fx - 1.4, fy - 1.6, 1.6 * flap, 1, -0.5, 0, TAU); ctx.ellipse(fx + 1.4, fy - 1.6, 1.6 * flap, 1, 0.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1c1917';
        circle(fx, fy, 1.7);
      }
      if (look === 'baked') steam(b, x, y, now);
    }
    else if (f.kind === 'pellet') {
      // A bead goes off as its time runs out, as an apple does: a dull film
      // and brown spots come over it and it all but stops bobbing; then it
      // shrinks and dims, and goes in a puff of its own colours (see onTick).
      const left = f.expires != null ? f.expires - (game.tick - 1 + alpha) : 999;
      const off = left < BEAD_OFF ? Math.min(1, (BEAD_OFF - left) / (BEAD_OFF - BEAD_GOING)) : 0, going = Math.max(0, Math.min(1, left / BEAD_GOING));
      const h = lively ? (0.5 - 0.5 * Math.cos(t * 3)) * (1 - 0.7 * off) : 0;
      ctx.globalAlpha = 0.5 + 0.5 * going;
      shadowAt(x + 1, y + CELL * 0.3, pop * 0.85 * (1 - 0.2 * h) * (0.72 + 0.28 * going));
      const sz = pop * (0.72 + 0.28 * going) * (1 + (lively ? Math.sin(t * 6) * 0.03 * (1 - off) : 0));
      blitAbout(beadSprite(f.cooked ? ROAST : b ? b.v : (f.color || '#a16207') + '|'), x, y - h * 1.8, 0, 0, sz, sz, 0);
      if (off > 0) { ctx.globalAlpha = (0.5 + 0.5 * going) * off; blitAbout(beadRotSprite(!f.cooked && lumaOf(beadFill(f)) < BEAD_DARK), x, y - h * 1.8, 0, 0, sz, sz, 0); }
      ctx.globalAlpha = 1;
      if (f.cooked && !off) steam(b, x, y, now);
    } else if (f.kind === 'mushroom') {
      drawMushroomAt(f, x, y, t, pop);
      if (lively && b && pop >= 1 && now > b.next) {
        b.next = now + 250 + Math.random() * 300; // (poison spores, puffing off it)
        mote(x + (Math.random() - 0.5) * CELL * 0.5, y - CELL * 0.12, (Math.random() - 0.5) * 8, -12 - Math.random() * 8, 1700, 1.8 + Math.random() * 1.2, 0);
      }
    } else if (f.kind === 'spill') {
      // A knocked-out snake's charges (round six B): a gold coin under its
      // glow, turning slowly, ringed with the pips it held, as they were on
      // its head (sky dots for golden jumps, ember diamonds for flashes).
      const left = f.expires != null ? f.expires - game.tick : 999;
      const fade = left > 20 ? 1 : 0.4 + 0.6 * Math.max(0, left) / 20;
      const glow = pop * (1.1 + (lively ? 0.16 * Math.sin(t * 4) : 0)), w = SPRITE * CELL * glow;
      ctx.globalAlpha = fade * (lively ? 0.85 + 0.15 * Math.sin(t * 4) : 1);
      ctx.drawImage(glowSprite(), x - w / 2, y - w / 2, w, w);
      ctx.globalAlpha = fade;
      shadowAt(x + 1, y + CELL * 0.3, pop * 0.7);
      ctx.beginPath(); ctx.arc(x, y, CELL * 0.24 * pop, 0, TAU);
      ctx.fillStyle = HONEY; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.07; ctx.stroke();
      const n = (f.leaps || 0) + (f.dashes || 0), turn = lively ? t * 0.8 : 0;
      for (let i = 0; i < n; i++) {
        const a = turn + TAU * i / Math.max(1, n) - Math.PI / 2, px = x + Math.cos(a) * CELL * 0.3 * pop, py = y + Math.sin(a) * CELL * 0.3 * pop;
        drawPip(px, py, a, CELL * 0.07 * pop, i < (f.leaps || 0));
      }
      ctx.globalAlpha = 1;
    } else if (f.kind === 'leaf' || f.kind === 'goldcap') {
      // Golden powers: a glow, a gentle flutter (the leaf) or bob (the mushroom), and glints.
      const left = f.expires != null ? f.expires - game.tick : 999;
      const fade = left > 20 ? 1 : 0.4 + 0.6 * Math.max(0, left) / 20;
      const glow = pop * (1.1 + (lively ? 0.16 * Math.sin(t * 4) : 0)), w = SPRITE * CELL * glow;
      ctx.globalAlpha = fade * (lively ? 0.85 + 0.15 * Math.sin(t * 4) : 1);
      ctx.drawImage(glowSprite(), x - w / 2, y - w / 2, w, w);
      ctx.globalAlpha = 1;
      if (f.kind === 'leaf') {
        const tilt = lively ? Math.sin(t * 2.2) * 0.35 : 0, lift = lively ? Math.sin(t * 3.1) * CELL * 0.06 : 0;
        shadowAt(x + 2, y + CELL * 0.3, pop * 0.7);
        ctx.globalAlpha = fade;
        blitAbout(goldLeafSprite(), x, y - CELL * 0.05 + lift, 0, 0, pop, pop * (lively ? 0.94 + 0.06 * Math.cos(t * 2.2) : 1), tilt * 0.5);
        ctx.globalAlpha = 1;
      } else {
        const bob = lively ? Math.sin(t * 2.5) * CELL * 0.04 : 0;
        shadowAt(x + 1, y + CELL * 0.33, pop * 0.8);
        ctx.globalAlpha = fade;
        blitAbout(goldcapSprite(), x, y + bob, 0, 0, pop, pop, 0);
        ctx.globalAlpha = 1;
      }
      if (lively && b && pop >= 1 && now > b.next) {
        b.next = now + 160 + Math.random() * 220;
        mote(x + (Math.random() - 0.5) * CELL * 1.1, y + (Math.random() - 0.5) * CELL, 0, -6, 650, 0.35 + Math.random() * 0.3, 1);
      }
    } else if (f.kind === 'golden') {
      // A calm dim instead of a blink when it's about to rot.
      const left = f.expires - game.tick;
      const fade = left > T.GOLDEN_DIM_TICKS ? 1 : 0.45 + 0.55 * (left / T.GOLDEN_DIM_TICKS);
      const glow = pop * (1 + (lively ? 0.14 * Math.sin(t * 4) : 0)), w = SPRITE * CELL * glow;
      ctx.globalAlpha = fade * (lively ? 0.8 + 0.2 * Math.sin(t * 4) : 1);
      ctx.drawImage(glowSprite(), x - w / 2, y - w / 2, w, w);
      drawAppleAt(goldenSprite(), x, y, t * 1.1, pop, fade);
      ctx.save();
      ctx.translate(x + CELL * 0.2, y - CELL * 0.22);
      ctx.rotate(reduced ? 0 : now / 900);
      ctx.scale(pop, pop);
      blit(starSprite(), 0, 0, fade);
      ctx.restore();
      if (lively && b && pop >= 1 && now > b.next) {
        b.next = now + 180 + Math.random() * 260;
        mote(x + (Math.random() - 0.5) * CELL * 1.1, y + (Math.random() - 0.5) * CELL, 0, -6, 650, 0.35 + Math.random() * 0.3, 1);
      }
    }
  }
}

// ------------------------------------------------------------ burrows

// A beetle burrow: an oval opening in the bark, splintered round its rim,
// a little sawdust about it, and cracks that spread from it as the round
// goes on (the beetles are hollowing the log out). Wood splits along its
// grain, so the cracks run along the log, either way from the hole,
// tapering, now and then forking. Each burrow's cracks
// are its own (seeded by where it is) and grow to full length over about
// half a minute. It opens with a pop.
//
// One a cornered beetle's dig left (dug: 1, round six A) doesn't pop: the
// beetle's collar closes over it (see drawDive) and it's there, freshly
// bored, its rim raw pale wood with splinters sticking out of it and its
// sawdust kicked out round it; over FRESH_MS it settles into an ordinary
// burrow (see drawFresh). One growing shut (shutFrom..shutAt: at the most,
// the one unused longest, to make room) closes up over those 6 to 14 s of
// game time: sawdust creeps in from its rim as the opening shrinks, moss
// creeps over the rim and the bark's grain grows across it (see
// drawShutting). Closing over at the end (a 'heal') the plug fills it, the
// moss covers it, and it fades into the bark over HEAL_MS (see drawHeals);
// with reduced motion, filled and mossed at once, then fading. A faint
// scar stays a while (SCAR_MS) where it was.
const CRACK_GROW_TICKS = 260, FRESH_MS = 4000, FRESH_HOLD = 1200, HEAL_MS = 1100, SCAR_MS = 20000, SHUT_HOLE = 0.9; // (SHUT_HOLE: the share of its opening's area gone as it grows shut)
const heals = []; // { x, y, at, key (its cell), v (its look), cs (its cracks' sprite, as last drawn), grown (how far it had grown shut, 0..1) }
const shutSeen = new Map(); // cell -> how far a burrow there has grown shut, as last drawn (0..1)
const crackCache = new Map(); // cell -> branches of [x, y] points (cells)
const burrowSeen = new Map(); // cell -> when it first showed (for its pop)
function cracksOf(b) {
  const k = b.y * GRID + b.x;
  let br = crackCache.get(k);
  if (br) return br;
  let seed = (k * 7919 + 13) % 2147483647 || 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  br = [];
  const split = (x, y, base, len) => {
    const pts = [[x, y]];
    let a = base + (rnd() - 0.5) * 0.4;
    for (let j = 0; j < len; j++) {
      a += (rnd() - 0.5) * 0.5 + (base - a) * 0.4; // (wandering, but kept to the grain)
      const step = 0.35 + rnd() * 0.25;
      x += Math.cos(a) * step; y += Math.sin(a) * step;
      pts.push([x, y]);
    }
    return pts;
  };
  for (const base of [Math.PI / 2, -Math.PI / 2]) { // (up and down the log)
    const main = split(0, 0, base, 5 + Math.floor(rnd() * 4));
    br.push(main);
    if (rnd() < 0.6) { // a fork
      const [fx, fy] = main[2 + Math.floor(rnd() * 2)];
      br.push(split(fx, fy, base + (rnd() < 0.5 ? -0.6 : 0.6), 2 + Math.floor(rnd() * 2)));
    }
  }
  crackCache.set(k, br);
  return br;
}
function drawBurrows(now) {
  if (heals.length) drawHeals(now);
  if (!game.burrows?.length) return;
  const c = CELL;
  ctx.lineCap = ctx.lineJoin = 'round'; // (as it always left them)
  for (const b of game.burrows) {
    const key = b.y * GRID + b.x, x = b.x * c + c / 2, y = b.y * c + c / 2;
    if (!burrowSeen.has(key)) burrowSeen.set(key, now);
    const age = now - burrowSeen.get(key), pop = b.dug ? 1 : popOf(age); // (a dug one is there as the collar closes over it)
    const grow = Math.min(1, Math.max(0.15, (game.tick - b.at) / CRACK_GROW_TICKS));
    // The cracks, from their sprite, on whole device pixels.
    const cs = crackSprite(b, key, grow);
    const shut = b.shutAt > b.shutFrom ? Math.min(1, Math.max(0, (shownTime - b.shutFrom) / (b.shutAt - b.shutFrom))) : 0; // (evenly over its time)
    if (shut > 0) shutSeen.set(key, shut);
    ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
    if (shut > 0) ctx.globalAlpha = 1 - 0.5 * shut; // (its cracks fading as it grows shut)
    ctx.drawImage(cs.c, cs.X, cs.Y);
    ctx.globalAlpha = 1;
    ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
    // The opening (a cached sprite, one of four).
    const w = SPRITE * CELL * pop;
    if (shut > 0) { drawShutting(x, y, key, w, shut); continue; }
    ctx.drawImage(burrowSprite(BURROW_LOOKS[key % 4]), x - w / 2, y - w / 2, w, w);
    if (b.dug && age < FRESH_MS) drawFresh(x, y, key, age);
  }
}
// A burrow growing shut, `shut` of the way (0..1, evenly over its time):
// sawdust creeps in from its rim, the opening shrinking into it (its dark
// rim kept, its area going evenly), the bark's grain grows across, and
// cushions of the log's moss creep in over the rim one after another. In
// two parts, so a closing over (drawHeals) can pack its plug between them.
function drawShutting(x, y, key, w, shut, a = 1) {
  shutBase(x, y, key, w, shut, a);
  shutMoss(x, y, key, w, shut, a);
}
function shutBase(x, y, key, w, shut, a) {
  const c = CELL, s = w / (SPRITE * c), hr = Math.sqrt(1 - SHUT_HOLE * shut), seed = key * 7 + 3;
  const rnd = i => { const h = Math.sin((seed + i) * 12.9898) * 43758.5453; return h - Math.floor(h); };
  ctx.globalAlpha = a;
  ctx.drawImage(burrowSprite(BURROW_LOOKS[key % 4]), x - w / 2, y - w / 2, w, w); // (its pale rim and specks stay)
  ctx.save();
  ctx.translate(x, y); ctx.rotate(0.4); ctx.scale(s, s); // (the hole's tilted oval)
  ctx.fillStyle = '#c9a46a'; // the sawdust, as wide as the hole
  ctx.beginPath(); ctx.ellipse(0, 0, c * 0.25, c * 0.17, 0, 0, TAU); ctx.fill();
  const hx = c * 0.24 * hr, hy = c * 0.16 * hr; // the opening left in it, with its dark rim
  const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, hx);
  grad.addColorStop(0, '#050201'); grad.addColorStop(0.75, '#1c1007'); grad.addColorStop(1, '#3b2412');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(0, 0, hx, hy, 0, 0, TAU); ctx.fill();
  const lumps = [], big = Math.min(1, shut * 4);
  for (let i = 0; i < 16; i++) { // lumps of it: most along the opening's edge, creeping in over it, some out on the packed sawdust
    const t = i * TAU / 16 + rnd(i) * 0.3, out = i % 3 === 2 ? 0.25 + 0.6 * rnd(i + 30) : 0.1 * rnd(i + 30), f = hr + (1 - hr) * out;
    lumps.push([Math.cos(t) * c * 0.245 * f, Math.sin(t) * c * 0.165 * f, c * (0.016 + 0.03 * rnd(i + 60)) * big, rnd(i + 90) < 0.4]);
  }
  if (big > 0) for (let pass = 0; pass < 3; pass++) { // their shadow, the sawdust, the lit tops of some
    ctx.fillStyle = pass === 0 ? 'rgba(52,30,12,0.35)' : pass === 1 ? '#d6b47a' : 'rgba(242,226,187,0.8)';
    const d = pass === 0 ? 0.45 : pass === 1 ? 0 : -0.35;
    ctx.beginPath();
    for (const [lx, ly, r, lit] of lumps) { if (pass === 2 && !lit) continue; const rr = pass === 2 ? r * 0.45 : r; ctx.moveTo(lx + r * d + rr, ly + r * d); ctx.arc(lx + r * d, ly + r * d, rr, 0, TAU); }
    ctx.fill();
  }
  ctx.restore();
  const g = Math.max(0, (shut - 0.1) / 0.9); // the bark's grain, growing across it along the log, as its cracks run
  if (g > 0) {
    ctx.strokeStyle = `rgba(74,44,18,${(0.8 * Math.min(1, g * 1.5)).toFixed(3)})`; ctx.lineWidth = Math.max(1, c * 0.05); // (its alpha under globalAlpha a)
    ctx.beginPath();
    for (const [dx, len] of [[-0.11, 0.3], [0.01, 0.42], [0.12, 0.28]]) { const l = c * len * g / 2; ctx.moveTo(x + c * dx, y - l); ctx.lineTo(x + c * dx + c * 0.02, y + l); }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function shutMoss(x, y, key, w, shut, a) {
  const c = CELL, s = w / (SPRITE * c);
  for (let i = 0; i < 4; i++) { // each cushion its turn, growing in from the rim (each burrow's own)
    const m = Math.min(1, Math.max(0, (shut - 0.12 - i * 0.16) / 0.35));
    if (m <= 0) continue;
    const t = i * TAU / 4 + (key % 7) * 0.5 + (i % 2) * 0.35, ms = w * (0.24 + 0.42 * m), cs = Math.cos(t), sn = Math.sin(t);
    const ex = cs * c * 0.32 * (1 - 0.15 * m), ey = sn * c * 0.23 * (1 - 0.15 * m); // (on the rim's tilted oval, edging in)
    const px = x + s * (ex * Math.cos(0.4) - ey * Math.sin(0.4)), py = y + s * (ex * Math.sin(0.4) + ey * Math.cos(0.4));
    ctx.globalAlpha = a * Math.min(1, m * 3);
    ctx.drawImage(healMossSprite(BURROW_LOOKS[(key + i) % 4]), px - ms / 2, py - ms / 2, ms, ms);
  }
  ctx.globalAlpha = 1;
}
const BURROW_LOOKS = ['0', '1', '2', '3'];
// A dug burrow's fresh look, over the ordinary one: full for FRESH_HOLD,
// then settling away.
function drawFresh(x, y, key, age) {
  const f = age < FRESH_HOLD ? 1 : 1 - (age - FRESH_HOLD) / (FRESH_MS - FRESH_HOLD), a = f * f * (3 - 2 * f), w = SPRITE * CELL;
  if (a <= 0) return;
  ctx.globalAlpha = a;
  ctx.drawImage(freshSprite(BURROW_LOOKS[key % 4]), x - w / 2, y - w / 2, w, w);
  ctx.globalAlpha = 1;
}
// Freshly bored: sawdust kicked out round the hole (a pale bed, lumps lit
// from the upper left, specks further out), its rim raw pale wood, and
// splinters of it sticking out, inked so they read on the bark. Never over
// the hole itself: it's a burrow, open.
const freshSprite = v => sprite('burrowFresh', v, drawFreshBore);
const drawFreshBore = (g, v) => {
  const c = CELL, seed = Number(v) * 17 + 3, rot = 0.4, cs = Math.cos(rot), sn = Math.sin(rot);
  const on = (t, rx, ry) => { const ex = Math.cos(t) * rx, ey = Math.sin(t) * ry; return [ex * cs - ey * sn, ex * sn + ey * cs]; }; // (a point on the hole's tilted oval)
  const rnd = i => { const h = Math.sin((seed + i) * 12.9898) * 43758.5453; return h - Math.floor(h); };
  g.fillStyle = 'rgba(236,212,160,0.3)'; // (a bed of it round the hole, not over it)
  g.beginPath(); g.ellipse(0, 0, c * 0.5, c * 0.42, rot, 0, TAU); g.ellipse(0, 0, c * 0.25, c * 0.17, rot, 0, TAU); g.fill('evenodd');
  for (let pass = 0; pass < 3; pass++) { // the lumps: their shadow, the sawdust, its lit tops
    g.fillStyle = pass === 0 ? 'rgba(70,42,18,0.5)' : pass === 1 ? '#d9b77c' : '#f2e2bb';
    const dx = pass === 0 ? 0.9 : pass === 1 ? 0 : -0.6, dy = pass === 0 ? 1.2 : pass === 1 ? 0 : -0.8;
    g.beginPath();
    for (let i = 0; i < 14; i++) {
      if (pass === 2 && rnd(i * 5 + 4) < 0.4) continue;
      const [px, py] = on(i * TAU / 14 + rnd(i * 5) * 0.4, c * (0.34 + 0.1 * rnd(i * 5 + 1)), c * (0.27 + 0.1 * rnd(i * 5 + 1)));
      const r = c * (0.045 + 0.04 * rnd(i * 5 + 2)) * (pass === 2 ? 0.5 : 1);
      g.moveTo(px + dx + r, py + dy); g.arc(px + dx, py + dy, r, 0, TAU);
    }
    g.fill();
  }
  g.fillStyle = '#e6cc96'; // (specks thrown further)
  for (let i = 0; i < 12; i++) { const [px, py] = on(rnd(i * 3 + 80) * TAU, c * (0.5 + 0.14 * rnd(i * 3 + 81)), c * (0.44 + 0.14 * rnd(i * 3 + 81))); g.beginPath(); g.arc(px, py, c * (0.018 + 0.016 * rnd(i * 3 + 82)), 0, TAU); g.fill(); }
  g.strokeStyle = '#f3dfb0'; g.lineWidth = c * 0.06; // the raw rim
  g.beginPath(); g.ellipse(0, 0, c * 0.275, c * 0.195, rot, 0, TAU); g.stroke();
  g.lineJoin = 'round';
  for (let i = 0; i < 6; i++) { // splinters of raw wood, torn out from the rim past the sawdust, each with its grain
    const t = i * TAU / 6 + rnd(i * 7 + 40) * 0.7, len = c * (0.3 + 0.14 * rnd(i * 7 + 41)), half = c * (0.03 + 0.012 * rnd(i * 7 + 42));
    const [bx, by] = on(t, c * 0.28, c * 0.2), [tx, ty] = on(t + (rnd(i * 7 + 43) - 0.5) * 0.4, c * 0.28 + len, c * 0.2 + len * 0.85);
    const nx = -(ty - by), ny = tx - bx, n = Math.hypot(nx, ny) || 1;
    g.beginPath(); g.moveTo(bx + nx / n * half, by + ny / n * half); g.lineTo(tx, ty); g.lineTo(bx - nx / n * half, by - ny / n * half); g.closePath();
    g.fillStyle = '#f6e6c0'; g.fill();
    g.strokeStyle = 'rgba(64,38,16,0.9)'; g.lineWidth = c * 0.024; g.stroke();
    g.strokeStyle = 'rgba(176,125,72,0.8)'; g.lineWidth = c * 0.012; // (its grain)
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + (tx - bx) * 0.7, by + (ty - by) * 0.7); g.stroke();
  }
};
// A burrow closing over: its cracks and hole fading, a plug of sawdust
// filling it from the middle out, then moss creeping over it, all fading
// into the bark at the end.
function drawHeals(now) {
  const c = CELL, w = SPRITE * c;
  for (let i = heals.length - 1; i >= 0; i--) {
    const h = heals[i], p = (now - h.at) / HEAL_MS;
    const x = h.x * c + c / 2, y = h.y * c + c / 2;
    if (p >= 1 && p < 1 + SCAR_MS / HEAL_MS && !game.burrows?.some(b => b.x === h.x && b.y === h.y)) { // (its faint scar, fading)
      const f = 1 - (p - 1) * HEAL_MS / SCAR_MS;
      ctx.globalAlpha = 0.45 * f * Math.min(1, (p - 1) * 4); // (faint, but there)
      ctx.drawImage(healScarSprite(h.v), x - w / 2, y - w / 2, w, w);
      ctx.globalAlpha = 1;
      continue;
    }
    if (p >= 1 || p < 0) { heals.splice(i, 1); continue; }
    const f = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45, a = f * f * (3 - 2 * f);
    const fill = reduced ? 1 : Math.min(1, p / 0.4), moss = reduced ? 1 : Math.max(0, Math.min(1, (p - 0.2) / 0.4));
    if (h.cs?.c && h.cs.k === k) { // (its cracks, as last drawn, closing with it)
      ctx.globalAlpha = a * (1 - p) * (1 - 0.5 * (h.grown || 0)); // (from where they'd faded to as it grew shut)
      ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
      ctx.drawImage(h.cs.c, h.cs.X, h.cs.Y);
      ctx.setTransform(k, 0, 0, k, shakeX, shakeY);
    }
    ctx.globalAlpha = a;
    if (h.grown) shutBase(x, y, h.key, w, h.grown, a); // (as far as it had grown shut)
    else ctx.drawImage(burrowSprite(h.v), x - w / 2, y - w / 2, w, w);
    ctx.globalAlpha = h.grown ? a * fill : a; // (grown shut, the plug comes in over its last opening)
    const sf = h.grown ? 1 : 0.3 + 0.7 * fill * (2 - fill); // (eased out; grown shut, it's packed already)
    ctx.drawImage(healPlugSprite(), x - w * sf / 2, y - w * sf / 2, w * sf, w * sf);
    if (h.grown) { shutMoss(x, y, h.key, w, h.grown, a); ctx.globalAlpha = a; } // (its moss on top of the plug)
    if (moss > 0) { const sm = 0.35 + 0.65 * moss * (2 - moss); ctx.globalAlpha = a * Math.min(1, moss * 2); ctx.drawImage(healMossSprite(h.v), x - w * sm / 2, y - w * sm / 2, w * sm, w * sm); }
    ctx.globalAlpha = 1;
  }
}
// The plug: sawdust packed into the hole, heaped a little over its rim.
const healPlugSprite = () => sprite('healPlug', '', drawHealPlug);
const drawHealPlug = g => {
  const c = CELL;
  g.fillStyle = 'rgba(60,36,14,0.4)'; g.beginPath(); g.ellipse(c * 0.03, c * 0.05, c * 0.3, c * 0.22, 0.4, 0, TAU); g.fill();
  g.fillStyle = '#c9a46a'; g.beginPath(); g.ellipse(0, 0, c * 0.29, c * 0.21, 0.4, 0, TAU); g.fill();
  g.fillStyle = '#e4c890';
  g.beginPath();
  for (const [px, py, r] of [[-0.08, -0.05, 0.1], [0.08, -0.02, 0.09], [0, 0.07, 0.08], [-0.15, 0.06, 0.06], [0.16, 0.08, 0.05]]) { g.moveTo(c * (px + r), c * py); g.arc(c * px, c * py, c * r, 0, TAU); }
  g.fill();
};
// The scar it leaves: a pale oval of packed sawdust gone grey, the grain
// healed across it.
const healScarSprite = v => sprite('healScar', v, drawHealScar);
const drawHealScar = (g, v) => {
  const c = CELL, rot = 0.4 + Number(v) * 0.15;
  g.fillStyle = 'rgba(206,180,136,0.55)'; g.beginPath(); g.ellipse(0, 0, c * 0.27, c * 0.19, rot, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(52,30,12,0.6)'; g.lineWidth = Math.max(1, c * 0.03);
  g.beginPath(); g.ellipse(0, 0, c * 0.27, c * 0.19, rot, 0, TAU); g.stroke();
  g.beginPath();
  for (const dx of [-0.1, 0.02, 0.12]) { g.moveTo(c * dx, -c * 0.17); g.lineTo(c * (dx + 0.02), c * 0.17); }
  g.stroke();
};
// Moss over it: a little cushion of the log's own moss (dark olive, never
// the apples' lime), its tufts run together, a shadow under it, each tuft
// lit on its upper left, and fuzz.
const healMossSprite = v => sprite('healMoss', v, drawHealMoss);
const drawHealMoss = (g, v) => {
  const c = CELL, n = Number(v) + 1, rnd = i => { const h = Math.sin((n * 31 + i) * 12.9898) * 43758.5453; return h - Math.floor(h); };
  const tufts = [[0, 0, 0.11]];
  for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + rnd(i) * 0.6, d = 0.09 + 0.08 * rnd(i + 20); tufts.push([Math.cos(a) * d * 1.15, Math.sin(a) * d * 0.85, 0.06 + 0.035 * rnd(i + 40)]); }
  tufts.sort((p, q) => p[1] - q[1]); // (back to front)
  const clump = (dx, dy, grow) => { g.beginPath(); for (const [x, y, r] of tufts) { g.moveTo(c * (x + dx + r + grow), c * (y + dy)); g.arc(c * (x + dx), c * (y + dy), c * (r + grow), 0, TAU); } };
  g.fillStyle = 'rgba(14,8,2,0.32)'; clump(0.02, 0.035, 0.01); g.fill();
  g.fillStyle = '#3a5520'; clump(0, 0, 0); g.fill();
  for (const [x, y, r] of tufts) {
    const lit = g.createRadialGradient(c * (x - r * 0.35), c * (y - r * 0.4), c * r * 0.1, c * x, c * y, c * r);
    lit.addColorStop(0, 'rgba(128,156,78,0.5)'); lit.addColorStop(0.55, 'rgba(90,120,48,0.12)'); lit.addColorStop(1, 'rgba(18,30,8,0.25)');
    g.fillStyle = lit; g.beginPath(); g.arc(c * x, c * y, c * r, 0, TAU); g.fill();
  }
  for (let i = 0; i < 26; i++) { // fuzz: tiny fronds, light and dark
    const [x, y, r] = tufts[i % tufts.length], a = rnd(i + 60) * TAU, d = r * (0.2 + 0.8 * rnd(i + 90));
    g.fillStyle = i % 2 ? 'rgba(126,154,76,0.5)' : 'rgba(24,40,12,0.45)';
    g.beginPath(); g.arc(c * (x + Math.cos(a) * d), c * (y + Math.sin(a) * d), c * (0.012 + 0.012 * rnd(i + 120)), 0, TAU); g.fill();
  }
};
// A burrow's cracks in a sprite of their own, made again only when they've
// grown (they grow a little each tick for about half a minute, then never):
// dark, with a lit lip along one side, thinning out.
const crackSprites = new Map(); // cell -> { grow, k, c (its canvas), X, Y (where it lands, in device px) }
function crackSprite(b, key, grow) {
  let s = crackSprites.get(key);
  if (s && s.grow === grow && s.k === k) return s;
  if (!s) crackSprites.set(key, s = { grow: -1, k: 0, c: null, X: 0, Y: 0 });
  const branches = cracksOf(b), c = CELL, m = 4; // (m: room for the lines' width and the lip)
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for (const pts of branches) for (const [px, py] of pts) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
  const cx = (b.x + 0.5) * c * k, cy = (b.y + 0.5) * c * k;
  const X = Math.floor(cx + (x0 * c - m) * k), Y = Math.floor(cy + (y0 * c - m) * k);
  const w = Math.ceil(cx + (x1 * c + m) * k) - X, h = Math.ceil(cy + (y1 * c + m) * k) - Y;
  if (!s.c || s.c.width !== w || s.c.height !== h) s.c = makeLayer(w, h);
  const g = s.c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  g.setTransform(k, 0, 0, k, cx - X, cy - Y); // (the hole's centre at the origin)
  g.lineCap = g.lineJoin = 'round';
  for (const [col, off, lw] of CRACK_LINES) {
    g.strokeStyle = col;
    for (const pts of branches) {
      const shown = (pts.length - 1) * grow, thick = pts[0][0] || pts[0][1] ? 0.6 : 1;
      for (let j = 1; j <= Math.ceil(shown); j++) { // (tapering as it goes)
        const t = Math.min(1, shown - (j - 1)), [px, py] = pts[j - 1], [qx, qy] = pts[j];
        g.lineWidth = lw * thick * (1 - 0.75 * (j - 1) / (pts.length - 1));
        g.beginPath();
        g.moveTo(off + px * c, off + py * c);
        g.lineTo(off + (px + (qx - px) * t) * c, off + (py + (qy - py) * t) * c);
        g.stroke();
      }
    }
  }
  s.X = X; s.Y = Y; s.grow = grow; s.k = k;
  return s;
}
const CRACK_LINES = [['rgba(196,154,102,0.28)', 1.2, 1.6], ['rgba(14,7,2,0.7)', 0, 2.8]];
// A burrow's opening: splinters round the rim, the dark hole, sawdust.
const burrowSprite = v => sprite('burrow', v, drawBurrowHole);
const drawBurrowHole = (g, v) => {
  const c = CELL, seed = Number(v);
  g.fillStyle = 'rgba(214,180,128,0.55)';
  g.beginPath(); g.ellipse(0, 0, c * 0.3, c * 0.22, 0.4, 0, TAU); g.fill();
  const grad = g.createRadialGradient(0, 0, 1, 0, 0, c * 0.24);
  grad.addColorStop(0, '#050201');
  grad.addColorStop(0.75, '#1c1007');
  grad.addColorStop(1, '#3b2412');
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(0, 0, c * 0.24, c * 0.16, 0.4, 0, TAU); g.fill();
  g.fillStyle = 'rgba(232,206,160,0.75)';
  for (let i = 0; i < 6; i++) {
    const a = i * 1.9 + seed;
    g.beginPath(); g.arc(Math.cos(a) * c * (0.34 + (i % 3) * 0.05), Math.sin(a) * c * (0.3 + (i % 2) * 0.06), 1.1 + (i % 2) * 0.5, 0, TAU); g.fill();
  }
};
