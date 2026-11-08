// The renderer (see render/core.js): the food (tossed, knocked, the dust
// and steam about it) and its pictures, and a spat mushroom's dotted line,
// flight and cheeks. The beetles' burrows and their bore are in burrows.js.

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

// Whether a piece of food is on the board (a peer's tick could say otherwise).
const onBoard = f => Number.isInteger(f.x) && Number.isInteger(f.y) && f.x >= 0 && f.y >= 0 && f.x < GRID && f.y < GRID;
function trackFood(now) {
  if (game.tick === bornTick) return;
  bornTick = game.tick;
  bornGen++;
  let n = 0;
  for (const f of game.food) {
    if (f.kind === 'beetle' || !onBoard(f)) continue;
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

// Food moved aside (see onTick): a mushroom in the air coming down where
// it stopped, or off what it hit, in a little arc (SPAT_MS); or food the
// woodpecker's strike knocked out of its patch, flying there in an arc,
// higher and longer the further it goes. Its look goes with it (a bead
// keeps its markings), and it's drawn going there (see drawFood); a
// beetle scurries there (see drawBeetle). With reduced motion it's simply
// there.
const SPAT_MS = 320, ROLL_MS = 280, FLY_CELL_MS = 70, FLY_MAX_MS = 620;
// How far on its way a piece moved aside is (0..1).
const movedU = (b, now) => (now - b.movedAt) / (b.spat ? b.fly : ROLL_MS);
// Up in the air: over the snakes (food flies over whatever's in the way), bigger the higher it is (its shadow's
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
    const e = 1 - (1 - u) * (1 - u), up = Math.sin(u * Math.PI), sz = 1 + 0.3 * up;
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
  if (f.kind === 'mushroom') return mushroomSprite(f.power);
  if (f.kind === 'leaf') return goldLeafSprite();
  if (f.kind === 'goldcap') return goldcapSprite();
  if (f.kind === 'spill') return goldenSprite(); // (spilled charges knocked aside: a glint of gold in the air)
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
function moveFood(x, y, tx, ty, now, spat, knocked = false) {
  const from = y * GRID + x, to = ty * GRID + tx, f = game.food.find(o => o.x === tx && o.y === ty && o.kind !== 'beetle');
  if (!f) return;
  const b = born.get(from), d = Math.hypot(tx - x, ty - y);
  if (from !== to) born.delete(from);
  born.set(to, { kind: f.kind, at: now - POP_MS, i: 0, next: 0, gen: bornGen, v: b && b.kind === f.kind ? b.v : (f.color || '#a16207') + '|', fell: false, fx: x, fy: y, movedAt: now, spat,
    fly: knocked ? knockFly(d) : SPAT_MS, hop: CELL * (knocked ? knockHop(d) : 0.6) });
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
// leavesBead), so each bead stands for its stretch of the body, from its own
// segment to the next bead's: both segments' colours, half and half, and
// their markings, so Joker's beads are still purple and amber and
// Wildcard's still run collar, stars and stripes. (The ripple keeps the
// segment's time, so it still runs down the body.)
const remainsAt = new Set();
function noteRemains(s, now) {
  remainsAt.clear();
  for (const f of game.food) if (f.kind === 'pellet' && (f.owner == null || f.owner === s.id)) remainsAt.add(f.y * GRID + f.x);
  const left = i => remainsAt.has(s.body[i].y * GRID + s.body[i].x);
  for (let i = 0; i < s.body.length; i++) {
    const key = s.body[i].y * GRID + s.body[i].x, old = born.get(key);
    if (!left(i)) continue; // (no bead left there)
    if (old && old.kind !== 'pellet') continue; // (food there stays food)
    let j = i + 1;
    while (j < s.body.length && !left(j)) j++;
    born.set(key, { kind: 'pellet', at: now + i * RIPPLE_MS, i, next: 0, gen: bornGen, v: beadOf(s, i, j) });
  }
}

// A bead that went (from its rot event): its own fill, as drawn.
function beadFill(e) {
  const v = born.get(e.y * GRID + e.x)?.v, fill = v ? v.slice(0, v.indexOf('|')) : e.color;
  return fill && fill[0] === '#' ? fill : '#a16207';
}

// The bead a snake leaves for its segments i to j - 1 (one, or the stretch
// a corpse's bead stands for): their fills and markings as last drawn (see
// fillsOf and drawBody), so Star's and Copycat's beads carry the rainbow
// where it was, a crash's and a cut's in their markings too.
// 'fill|mark' or, two-tone, 'fill|mark|fill2'.
function beadOf(s, i, j = i + 1) {
  const fills = animOf(s, lastNow).fills, fill = k => { const c = fills[k]; return c && c[0] === '#' ? c : '#a16207'; };
  const look = coatOf(s), wild = s.personaKey === 'wildcard';
  let mark = '';
  for (let k = i; k < j; k++) {
    const m = look === 'ghost' ? 'ghost'
      : wild ? (k === 2 || k === 3 ? 'stars' : '')
      : !k ? ''
      : !s.persona ? MARKS[colorOf(s)] || ''
      : look === 'mason' ? (k % 4 === 3 ? 'marble2' : 'marble')
      : look === 'colonist' ? (k % 2 ? 'strap' : 'strap2')
      : look === 'ouroboros' ? 'diamond'
      : s.personaKey === 'copycat' ? 'copy' : '';
    if (!mark || m === 'marble2') mark = m || mark; // (a rose vein shows)
    else if (m && m !== mark && look === 'colonist') mark = 'cross'; // (both straps: its cross-belts)
  }
  const a = fill(i), b = fill(j - 1);
  return a + '|' + mark + (b !== a ? '|' + b : '');
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
  blitAbout(mushroomSprite(f.power), x, y, 0, CELL * 0.34, pop * (1 - 0.2 * wilt) * (1 - breathe * 0.5), pop * (1 - 0.3 * wilt) * (1 + breathe), lean);
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
  // Freshly spat (2x): wet, a green slick under it and a glint on the cap, drying
  // as the moves its spitter slides over it run out.
  const wet = f.slideUntil != null ? (f.slideUntil - game.tick) / T.OWN_SPIT_TICKS : 0;
  if (wet > 0 && pop >= 1) {
    ctx.globalAlpha = Math.min(1, wet) * (1 - 0.4 * wilt);
    ctx.fillStyle = 'rgba(132,204,22,0.6)';
    ctx.beginPath(); ctx.ellipse(x, y + CELL * 0.34, CELL * 0.4, CELL * 0.13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f7fee7';
    ctx.beginPath(); ctx.arc(x - CELL * 0.13, y - CELL * 0.12, CELL * 0.055, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + CELL * 0.08, y - CELL * 0.03, CELL * 0.032, 0, TAU); ctx.fill();
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
    if (!onBoard(f)) continue; // (food lies on the log, one piece to a cell, so a frame's beads never need more sprites than it has cells: see beadSprite)
    const key = f.y * GRID + f.x, b = born.get(key);
    if (f.kind === 'pellet' && heldCells[key]) { if (b) b.at = now + b.i * RIPPLE_MS; continue; } // (under a held corpse: not yet)
    const pop = b ? popOf(now - b.at) : 1;
    if (pop <= 0) continue;
    let x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2;
    if (b && b.movedAt) { // (spat, knocked or nudged aside: on its way from where it was, see moveFood)
      const u = reduced ? 1 : movedU(b, now);
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
    } else if (f.kind === 'leaf' || f.kind === 'goldcap' || f.kind === 'spill') {
      // Golden powers: a glow, a gentle flutter (the leaf), a bob (the mushroom) or a slow turn (a knocked-out
      // snake's spilled charges, round six B part 6: a gold coin ringed with the pips it held), and glints.
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
      } else if (f.kind === 'spill') {
        shadowAt(x + 1, y + CELL * 0.3, pop * 0.7);
        ctx.globalAlpha = fade;
        drawSpill(x, y, pop, f.leaps, f.dashes, lively ? t * 0.8 : 0);
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

function drawAppleShape(g, body, leaf = '#15803d') {
  const c = CELL;
  g.fillStyle = body;
  g.beginPath(); g.arc(0, c * 0.04, c * 0.34, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(30,20,8,0.45)';
  g.lineWidth = c * 0.05;
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.beginPath(); g.arc(-c * 0.12, -c * 0.06, c * 0.08, 0, TAU); g.fill();
  g.strokeStyle = '#78350f';
  g.lineWidth = c * 0.07;
  g.beginPath(); g.moveTo(0, -c * 0.22); g.lineTo(c * 0.04, -c * 0.42); g.stroke();
  g.fillStyle = leaf;
  g.beginPath(); g.ellipse(c * 0.17, -c * 0.36, c * 0.14, c * 0.07, -0.5, 0, TAU); g.fill();
}

// An apple as it ages (it rots away in the end): fresh; bruised, with brown
// spots; rotten, brown and wrinkled, its leaf dead. Or baked in a fire:
// deep red, glazed and split, a little caramel oozing.
const APPLE_LOOKS = { fresh: ['#84cc16', '#15803d'], bruised: ['#9fb53a', '#4d7c0f'], rotten: ['#8a6a2a', '#78716c'], baked: ['#9a3412', '#57534e'] };
const drawApple = (g, v) => {
  const [body, leaf] = APPLE_LOOKS[v] || APPLE_LOOKS.fresh, c = CELL;
  drawAppleShape(g, body, leaf);
  if (v === 'bruised' || v === 'rotten') {
    g.fillStyle = v === 'rotten' ? 'rgba(66,38,12,0.6)' : 'rgba(110,66,20,0.5)';
    for (const [x, y, rr] of [[0.1, 0.12, 0.07], [-0.1, 0.18, 0.05], [0.17, -0.02, 0.045]]) { g.beginPath(); g.arc(c * x, c * y, c * rr, 0, TAU); g.fill(); }
  }
  if (v === 'rotten') { // wrinkles
    g.strokeStyle = 'rgba(52,30,10,0.6)';
    g.lineWidth = c * 0.03;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-c * 0.2, -c * 0.02); g.quadraticCurveTo(-c * 0.12, c * 0.06, -c * 0.2, c * 0.14);
    g.moveTo(c * 0.02, c * 0.24); g.quadraticCurveTo(c * 0.1, c * 0.16, c * 0.2, c * 0.22);
    g.stroke();
  }
  if (v === 'baked') { // glazed and split, caramel in the split
    g.strokeStyle = '#fbbf24';
    g.lineWidth = c * 0.05;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(-c * 0.06, c * 0.02); g.lineTo(c * 0.02, c * 0.12); g.lineTo(-c * 0.02, c * 0.22); g.stroke();
    g.strokeStyle = 'rgba(254,215,170,0.8)';
    g.lineWidth = c * 0.04;
    g.beginPath(); g.arc(0, c * 0.04, c * 0.26, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  }
};
const drawGolden = g => drawAppleShape(g, '#fbbf24');
const appleSprite = (v = 'fresh') => sprite('apple', v, drawApple);
const goldenSprite = () => sprite('golden', '', drawGolden);
const glowSprite = () => sprite('glow', '', drawGlow);
const drawGlow = g => { // (in Honey: gold means a power)
  const grad = g.createRadialGradient(0, 0, CELL * 0.2, 0, 0, CELL * 0.8);
  grad.addColorStop(0, 'rgba(253,230,138,0.55)');
  grad.addColorStop(1, 'rgba(253,230,138,0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(0, 0, CELL * 0.8, 0, TAU); g.fill();
};
// A four-point sparkle: the golden apple's non-color cue.
const starSprite = () => sprite('star', '', drawStar);
const drawStar = g => {
  g.fillStyle = '#fffbea';
  g.beginPath();
  const r1 = CELL * 0.2, r2 = CELL * 0.05;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, r = i % 2 ? r2 : r1;
    if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(r, 0);
  }
  g.fill();
};
// A golden leaf (on the wind: dashes): a broad ginkgo fan about a cell
// across, in Honey, inked like every other pickup and lit along its top:
// nothing like the slim autumn leaves blowing past.
const goldLeafSprite = () => sprite('goldleaf', '', drawGoldLeaf);
const drawGoldLeaf = g => {
  const c = CELL;
  const fan = () => {
    g.beginPath();
    g.moveTo(0, c * 0.26); // (the base, where the stalk joins)
    g.quadraticCurveTo(-c * 0.16, c * 0.05, -c * 0.46, -c * 0.1);
    g.quadraticCurveTo(-c * 0.42, -c * 0.42, -c * 0.07, -c * 0.44);
    g.lineTo(0, -c * 0.31); // (the notch in its edge)
    g.lineTo(c * 0.07, -c * 0.44);
    g.quadraticCurveTo(c * 0.42, -c * 0.42, c * 0.46, -c * 0.1);
    g.quadraticCurveTo(c * 0.16, c * 0.05, 0, c * 0.26);
    g.closePath();
  };
  g.strokeStyle = '#3a2614'; // the stalk
  g.lineWidth = c * 0.07;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, c * 0.24); g.quadraticCurveTo(c * 0.02, c * 0.4, c * 0.08, c * 0.48); g.stroke();
  const grad = g.createLinearGradient(0, -c * 0.44, 0, c * 0.26);
  grad.addColorStop(0, '#fffbea'); grad.addColorStop(0.35, '#fde68a'); grad.addColorStop(1, '#d4a017');
  fan();
  g.fillStyle = grad; g.fill();
  g.strokeStyle = 'rgba(180,120,10,0.7)'; // veins, fanning out from the base
  g.lineWidth = c * 0.022;
  g.beginPath();
  for (const a of [-1.05, -0.6, -0.2, 0.2, 0.6, 1.05]) { g.moveTo(0, c * 0.2); g.lineTo(Math.sin(a) * c * 0.4, c * 0.2 - Math.cos(a) * c * 0.56); }
  g.stroke();
  fan();
  g.lineJoin = 'round';
  g.strokeStyle = '#3a2614'; g.lineWidth = c * 0.05; g.stroke();
  g.strokeStyle = '#fffbea'; g.lineWidth = c * 0.03; // (its top edge, catching the light)
  g.beginPath(); g.moveTo(-c * 0.36, -c * 0.24); g.quadraticCurveTo(-c * 0.3, -c * 0.38, -c * 0.1, -c * 0.4); g.stroke();
};
// A golden mushroom (in the rain: the edges wrap): the mushroom's shape,
// its cap in the golden leaf's Honey and inked like it, with white spots
// (ringed, so they show on the pale gold) and a shine.
const goldcapSprite = () => sprite('goldcap', '', drawGoldcap);
// Spilled charges at x, y, scaled by k: a gold coin ringed with a sky pip
// for each golden jump and an ember one for each dash, as they were on the
// head that held them, turned by `turn`. (The Field guide draws it too.)
function drawSpill(x, y, k, leaps, dashes, turn) {
  const r = CELL * 0.3 * k;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = '#facc15'; ctx.fill(); // (the crown's gold)
  ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.07 * k; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, TAU); ctx.strokeStyle = HONEY; ctx.lineWidth = CELL * 0.05 * k; ctx.stroke(); // (its rim)
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, TAU); ctx.fillStyle = GLINT; ctx.fill();
  const n = leaps + dashes;
  for (let i = 0; i < n; i++) {
    const a = turn + TAU * i / n - Math.PI / 2;
    drawPip(x + Math.cos(a) * CELL * 0.46 * k, y + Math.sin(a) * CELL * 0.46 * k, a, CELL * 0.09 * k, i < leaps);
  }
}
const drawGoldcap = g => {
  const c = CELL;
  g.lineJoin = 'round';
  g.strokeStyle = '#3a2614';
  g.lineWidth = c * 0.05;
  g.fillStyle = '#fef3c7';
  g.beginPath();
  if (g.roundRect) g.roundRect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36, c * 0.07); else g.rect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36);
  g.fill(); g.stroke();
  const grad = g.createLinearGradient(0, -c * 0.32, 0, 0);
  grad.addColorStop(0, '#fffbea'); grad.addColorStop(0.35, '#fde68a'); grad.addColorStop(1, '#d4a017');
  g.fillStyle = grad;
  g.beginPath(); g.ellipse(0, 0, c * 0.42, c * 0.32, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#ffffff';
  g.strokeStyle = 'rgba(180,120,10,0.7)'; // (the leaf's veins)
  g.lineWidth = c * 0.022;
  for (const [x, y, r] of GOLDCAP_SPOTS) { g.beginPath(); g.arc(c * x, c * y, c * r, 0, TAU); g.fill(); g.stroke(); }
  g.strokeStyle = 'rgba(255,251,234,0.85)'; // a shine on the cap
  g.lineWidth = c * 0.04;
  g.lineCap = 'round';
  g.beginPath(); g.arc(0, 0, c * 0.3, Math.PI * 1.2, Math.PI * 1.45); g.stroke();
};
const GOLDCAP_SPOTS = [[-0.19, -0.1, 0.06], [0.06, -0.21, 0.06], [0.23, -0.06, 0.05]];
// A mushroom, a shade darker each time it's come back up (round six B: its
// power, SHRINK fresh, up to SHRINK_MAX), so anyone can see how bad it is.
const SHROOM_CAPS = ['#dc2626', '#a51c3c', '#6f1546'], SHROOM_STEMS = ['#fef3c7', '#e3d3b0', '#c7b495'];
const mushroomSprite = (power = 0) => sprite('mushroom', String(power || ''), drawMushroom);
const drawMushroom = (g, v = '') => {
  const c = CELL, shade = Math.max(0, Math.min(2, (Number(v) || T.SHRINK) - T.SHRINK));
  g.fillStyle = SHROOM_STEMS[shade];
  g.beginPath(); // a rounded stem, like every other shape on the board
  if (g.roundRect) g.roundRect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36, c * 0.07); else g.rect(-c * 0.1, -c * 0.02, c * 0.2, c * 0.36);
  g.fill();
  g.fillStyle = SHROOM_CAPS[shade];
  g.beginPath(); g.ellipse(0, 0, c * 0.4, c * 0.3, 0, Math.PI, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(30,20,8,0.45)';
  g.lineWidth = c * 0.05;
  g.stroke();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(-c * 0.18, -c * 0.1, c * 0.06, 0, TAU); g.fill();
  g.beginPath(); g.arc(c * 0.06, -c * 0.2, c * 0.06, 0, TAU); g.fill();
  g.beginPath(); g.arc(c * 0.22, -c * 0.06, c * 0.05, 0, TAU); g.fill();
};
// What's left of a snake: it falls to pieces, glossy beads in its own
// colours and markings (Star's rainbow, Mason's marble, Colonist's
// strap, a friend's spots), so no two snakes leave the same remains. A light
// rim and a dark edge keep every bead readable on the bark.
// variant: 'fill|mark' or two-tone 'fill|mark|fill2' (see beadOf), mark one of '', marble, marble2 (a rose vein), strap, strap2, cross (both straps), stars, spots, rings, dots, copy, ghost.
// (Star's rainbow runs through every hue, so bead sprites are kept for the
// beads in use: as many as the board has cells, one bead to a cell, so every
// bead on it stays drawn from its own, whatever a peer sends; past that the
// one unused longest goes.)
const beadSprite = v => {
  const kept = sprites.get('bead'), sp = kept?.get(v);
  if (sp) { kept.delete(v); kept.set(v, sp); return sp; } // (last used last)
  if (kept && kept.size >= GRID * GRID) kept.delete(kept.keys().next().value);
  return sprite('bead', v, drawBead);
};
const drawBead = (g, v) => {
  const c = CELL, r = c * 0.26, [fill, mark, fill2] = v.split('|');
  const disc = (x, y, rr) => { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); };
  if (mark === 'ghost') g.globalAlpha = 0.72;
  g.fillStyle = 'rgba(255,244,226,0.5)';
  disc(0, 0, r + c * 0.05);
  g.fillStyle = fill;
  disc(0, 0, r);
  if (fill2) { g.fillStyle = fill2; g.beginPath(); g.arc(0, 0, r, -Math.PI / 4, Math.PI * 3 / 4); g.fill(); g.beginPath(); g.arc(0, 0, r, 0, TAU); } // (its stretch's tail end, the lower half)
  g.strokeStyle = 'rgba(30,20,8,0.5)';
  g.lineWidth = c * 0.03;
  g.stroke();
  g.fillStyle = 'rgba(30,41,59,0.6)';
  if (mark === 'marble' || mark === 'marble2') {
    g.strokeStyle = mark === 'marble2' ? 'rgba(176,92,104,0.85)' : 'rgba(100,116,139,0.6)';
    g.lineWidth = c * 0.03;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-r * 0.7, -r * 0.45); g.quadraticCurveTo(0, r * 0.1, r * 0.75, -r * 0.2);
    g.moveTo(-r * 0.15, r * 0.75); g.quadraticCurveTo(r * 0.05, r * 0.35, r * 0.6, r * 0.45);
    g.stroke();
  } else if (mark === 'strap' || mark === 'strap2' || mark === 'cross') {
    g.strokeStyle = '#fef3c7';
    g.lineWidth = c * 0.07;
    g.beginPath();
    const d = r * 0.7;
    if (mark !== 'strap2') { g.moveTo(-d, -d); g.lineTo(d, d); }
    if (mark !== 'strap') { g.moveTo(d, -d); g.lineTo(-d, d); }
    g.stroke();
  } else if (mark === 'stars') {
    g.fillStyle = '#ffffff';
    for (const [dx, dy] of STARS) star(dx * r, dy * r, r * 0.22, g);
  } else if (mark === 'spots' || mark === 'dots') {
    g.fillStyle = 'rgba(58,38,20,0.45)';
    if (mark === 'dots') disc(0, 0, r * 0.32);
    else { disc(-r * 0.38, r * 0.12, r * 0.18); disc(r * 0.38, -r * 0.12, r * 0.18); }
  } else if (mark === 'diamond') {
    g.fillStyle = 'rgba(58,36,8,0.75)';
    g.beginPath(); g.moveTo(0, -r * 0.6); g.lineTo(r * 0.6, 0); g.lineTo(0, r * 0.6); g.lineTo(-r * 0.6, 0); g.closePath(); g.fill();
  } else if (mark === 'rings' || mark === 'copy') {
    g.strokeStyle = mark === 'copy' ? 'rgba(255,255,255,0.75)' : 'rgba(58,38,20,0.5)';
    g.lineWidth = c * 0.04;
    if (mark === 'copy') g.setLineDash([c * 0.07, c * 0.07]);
    g.beginPath(); g.arc(0, 0, r * (mark === 'copy' ? 0.75 : 0.55), 0, TAU); g.stroke();
    g.setLineDash([]);
  }
  g.fillStyle = 'rgba(255,255,255,0.55)'; // the gloss
  g.beginPath(); g.ellipse(-r * 0.32, -r * 0.38, r * 0.3, r * 0.2, -0.6, 0, TAU); g.fill();
};
// Mushrooms come back up (round six B), and fly along the line (3b+).
// While one's in a snake's cheek: a dotted green line from its head, the
// way it faces, SPIT_REACH cells out (to the edge, or a hole: there it's
// gone), where it'll fly (steering aims it), the dots swelling as the
// second runs out, for everyone to see and step out of; and its cheeks
// puffed green (see drawCheeks), a shade darker the stronger it was
// swallowed (as the mushroom's own shade).
const SPIT_DOTS = '#a3e635', CHEEKS = ['#84cc16', '#65a30d', '#4d7c0f'];
function drawSpitLines(now) {
  if (!game) return;
  const t = reduced ? 0 : now / 1000;
  for (const s of game.snakes) {
    if (!s.alive || !s.cheek) continue;
    const wrap = s.wrapUntil > game.time; // (the edges wrap for it: it flies on from the far side)
    const left = Math.max(0, Math.min(1, (s.cheek.spitAt - game.tick) / T.CHEEK_TICKS));
    let { x, y } = s.body[0];
    for (let n = 1; n <= T.SPIT_REACH; n++) {
      x += s.dir.x; y += s.dir.y;
      if (wrap) { x = (x + GRID) % GRID; y = (y + GRID) % GRID; }
      if (x < 0 || y < 0 || x >= GRID || y >= GRID || game.holes.has(y * GRID + x)) break; // (over the edge or into a hole: it's gone, nothing further to step out of)
      const r = CELL * (0.07 + 0.06 * (1 - left) + 0.015 * Math.sin(t * 12 - n));
      ctx.beginPath();
      ctx.arc((x + 0.5) * CELL, (y + 0.5) * CELL, r, 0, Math.PI * 2);
      ctx.fillStyle = SPIT_DOTS; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.05; ctx.stroke();
    }
  }
}
// A mushroom in the air: on its way from where it was at the start of the
// tick to where it is (SPIT_SPEED cells a tick), over the snakes, spinning,
// its shadow on the ground; and the last of its flight, to where it stopped
// (see spitStopped).
const lastLegs = [];
function drawSpitsInAir(alpha, now) {
  if (!game || !(game.spits.length || lastLegs.length)) return;
  const u = reduced ? 1 : Math.min(1, alpha);
  for (const m of game.spits) {
    const fx = m.x - m.dir.x * T.SPIT_SPEED, fy = m.y - m.dir.y * T.SPIT_SPEED, over = fx < 0 || fy < 0 || fx >= GRID || fy >= GRID; // (over: through the wrapped edge, drawn there)
    drawSpitAt(over ? m.x : fx + (m.x - fx) * u, over ? m.y : fy + (m.y - fy) * u, m.power, now);
  }
  for (let i = lastLegs.length - 1; i >= 0; i--) {
    const l = lastLegs[i], v = reduced ? 1 : (now - l.at) / l.ms;
    if (v >= 1) { lastLegs.splice(i, 1); continue; }
    drawSpitAt(l.fx + (l.x - l.fx) * v, l.fy + (l.y - l.fy) * v, l.power, now);
  }
}
function drawSpitAt(x, y, power, now) {
  const px = (x + 0.5) * CELL, py = (y + 0.5) * CELL;
  shadowAt(px + 1, py + CELL * 0.36, 0.7);
  blitAbout(mushroomSprite(power), px, py - CELL * 0.3, 0, CELL * 0.2, 0.8, 0.8, reduced ? 0 : now / 90);
}
// Where one stopped: it flies the last of the way (from fx, fy) in the tick's time, unless it's to lie there or
// roll off what it hit, which the food's own toss draws (see moveFood).
function spitStopped(e, now) {
  if (e.lx == null && Math.abs(e.x - e.fx) + Math.abs(e.y - e.fy) > 0) lastLegs.push({ fx: e.fx, fy: e.fy, x: e.x, y: e.y, power: e.power, at: now, ms: tickMs() });
}
// The bulge counts down to the spit (the owner, 2 November 2026: "Really not
// easy to tell either when your character will spit it"): it swells from a
// mouthful to fit to burst as the second runs out, and on each of the last
// three moves it throbs, three, two, one, and the spit comes on the next.
// With reduced motion it swells, without the throbs or the wobble.
const CHEEK_R = 0.12, CHEEK_GROW = 0.1, CHEEK_THROB = 0.06, CHEEK_BEATS = 3;
function drawCheeks(alpha, now) {
  if (!game) return;
  const t = reduced ? 0 : now / 1000;
  for (const s of game.snakes) {
    if (!s.alive || !s.cheek) continue;
    const a = anim.get(s);
    if (!a || !a.n) continue;
    // (behind the eyes, bulging out past the head on either side: a mouthful, never a pair of goggles)
    const n = s.cheek.spitAt - game.tick, go = Math.max(0, Math.min(1, 1 - (n + 1 - alpha) / T.CHEEK_TICKS)); // (n: moves before the one it's spat on; go: 0 as it's swallowed, 1 as it's spat)
    const throb = !reduced && n >= 0 && n < CHEEK_BEATS ? CHEEK_THROB * (1 - alpha) * (1 - alpha) : 0;
    const hx = a.pts[0], hy = a.pts[1], px = -s.dir.y, py = s.dir.x, r = CELL * (CHEEK_R + CHEEK_GROW * go + throb + 0.015 * Math.sin(t * 10));
    ctx.fillStyle = CHEEKS[Math.max(0, Math.min(2, s.cheek.power - T.SHRINK))];
    ctx.strokeStyle = INK; ctx.lineWidth = CELL * 0.06;
    for (const side of SIDES2) {
      ctx.beginPath();
      ctx.arc(hx + px * side * CELL * 0.42 - s.dir.x * CELL * 0.22, hy + py * side * CELL * 0.42 - s.dir.y * CELL * 0.22, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
  }
}
