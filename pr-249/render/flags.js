// The renderer (see render/core.js): the land a woodpecker's strike will
// leave, made ahead; the dashed borders; banners and flags; and a land's
// colour round a rival on it.

// The land a strike will leave, made ahead. Made at the strike, the land's
// layers took that frame tens of milliseconds (painting them, mostly the
// GPU's), a hitch everyone saw. So while the woodpecker aims (17 ticks),
// the layers of every realm its patch will cut, or run beside (its
// contested sides change too), are made in spare canvases as they'll be
// once the patch is holes, and the dashes with them: a step a frame (the
// land planned, then each stroke of it: see paintLandStep), each sent to
// the GPU in its own frame (kick), so no frame takes much. At the strike,
// if that's the land then (every realm's land, the holes, the
// resolution, all as foreseen: see preStill), they're swapped in;
// otherwise (anything else changed meanwhile) it's made the old way.
const pre = {
  ready: false, key: NaN, step: 0, steps: 0, k: 0, // (made, for the aim keyed so, in steps)
  specs: [], post: [], colors: [], todo: [], // (the realms as they were then; each one's land after the strike; the realms to make again)
  holes: new Uint8Array(N2), plan: null, dash: { layer: null, X: 0, Y: 0, any: false, for: 0 },
};
let tickEvery = 100, tickNow = 0; // (how long a tick is on the board's clock as it's played, eased: a few frames' worth, or none when it's watched fast; and the last's)
let landVer = 0, prebuilding = true; // (landVer: the land's changes, counted; prebuilding: off only for the tests, to compare)
const preLost = { has: i => pre.holes[i] === 1 };
const postOf = o => pre.post[pre.specs.indexOf(o)];
const spareSides = r => pre.todo.includes(r) ? r.spare : r;
let kickG = null;
// (Drawn from, a canvas's waiting work goes to the GPU now: unsent, it all
// went at the strike, and that frame cost more than making it then. The
// little canvas is cleared at once, so it holds on to nothing.)
function kick(c) { (kickG ||= makeLayer(1, 1).getContext('2d')).drawImage(c, 0, 0, 1, 1, 0, 0, 1, 1); kickG.clearRect(0, 0, 1, 1); }
function prebuild() {
  const w = game.woodpecker;
  if (!w || !w.target.length) { pre.key = NaN; return; }
  let key = (w.target.length * 977 + game.holes.size * 31 + landVer * 7919 + Math.round(k * 1000)) | 0;
  for (const c of w.target) key = (key * 31 + c) | 0;
  for (const r of fieldSpecs) {
    if (r.step >= 0 || r.dirty || r.gone || r.builtK !== k) { pre.key = NaN; return; } // (wait for the land to settle)
    key = (key * 31 + r.idx) | 0;
  }
  let same = key === pre.key && pre.specs.length === fieldSpecs.length;
  for (let j = 0; same && j < fieldSpecs.length; j++) same = fieldSpecs[j] === pre.specs[j];
  if (!same) { pre.key = key; pre.step = 0; pre.ready = false; }
  // A step a frame, or more when the strike's too near for that (watched
  // fast, or the land only just settled): the frames left before it, from
  // the ticks left and how long a tick is as it's played (see onTick).
  const framesLeft = Math.max(1, (w.strikeAt - game.tick + 0.5) * tickEvery / Math.max(8, frameDt) - 1);
  for (let n = pre.step ? Math.min(4, Math.ceil((pre.steps + 1 - pre.step) / framesLeft)) : 1; n > 0 && !pre.ready && pre.step <= pre.steps; n--) prebuildStep(w);
}
function prebuildStep(w) {
  const st = pre.step++;
  if (st === 0) { prePlan(w.target); return; }
  const per = 1 + LAND_STEPS, n = st - 1, ri = Math.floor(n / per), sub = n % per;
  if (ri < pre.todo.length) {
    const r = pre.todo[ri], sp = r.spare;
    if (!sub) { const m = postOf(r); pre.plan = prepRealm(sp, r, m, boxOf(m), postOf, preLost); return; }
    if (!pre.plan) return;
    paintLandStep(pre.plan, sub - 1, sp.layer.getContext('2d'), sp.glow.getContext('2d'), r.color);
    kick(sub === LAND_STEPS ? sp.glow : sp.layer);
    return;
  }
  buildDashes(pre.dash, spareSides);
  if (pre.dash.any) kick(pre.dash.layer);
  pre.ready = true;
}
// The first step: each realm's land after the strike (its land less the
// patch), and which realms will be made again then: those it cuts, and
// those beside a cell they lose (as markDirty will find them).
function prePlan(target) {
  pre.k = k; pre.plan = null;
  pre.specs.length = pre.post.length = pre.colors.length = pre.todo.length = 0;
  pre.holes.fill(0);
  for (const h of game.holes) pre.holes[h] = 1;
  for (const c of target) pre.holes[c] = 1;
  for (const r of fieldSpecs) {
    r.spare ||= { layer: null, glow: null, X: 0, Y: 0, any: false, shared: [], sharedAt: [], sharedTo: [], post: new Uint8Array(N2) };
    const m = r.spare.post;
    m.set(r.shown);
    for (const c of target) m[c] = 0;
    pre.specs.push(r); pre.post.push(m); pre.colors.push(r.color);
  }
  for (const r of fieldSpecs) {
    let cut = false;
    for (const c of target) if (r.shown[c]) { cut = true; break; }
    if (cut) pre.todo.push(r);
  }
  const cuts = pre.todo.length;
  for (const o of fieldSpecs) {
    if (pre.todo.includes(o)) continue;
    let beside = false;
    for (let j = 0; j < cuts && !beside; j++) {
      const r = pre.todo[j];
      for (const c of target) {
        if (!r.shown[c]) continue;
        const m = o.shown, x = c % GRID;
        if (m[c] || (x > 0 && m[c - 1]) || (x < GRID - 1 && m[c + 1]) || (c >= GRID && m[c - GRID]) || (c < N2 - GRID && m[c + GRID])) { beside = true; break; }
      }
    }
    if (beside) pre.todo.push(o);
  }
  pre.steps = pre.todo.length ? 1 + pre.todo.length * (1 + LAND_STEPS) : 0; // (none cut: nothing to make)
  if (!pre.steps) pre.step = 1; // (and nothing to swap: it stays not ready)
}
const preBox = { bx0: 0, by0: 0, bx1: -1, by1: -1 };
function boxOf(m) {
  preBox.bx0 = preBox.by0 = GRID; preBox.bx1 = preBox.by1 = -1;
  for (let i = 0; i < N2; i++) {
    if (!m[i]) continue;
    const x = i % GRID, y = (i - x) / GRID;
    if (x < preBox.bx0) preBox.bx0 = x;
    if (x > preBox.bx1) preBox.bx1 = x;
    if (y < preBox.by0) preBox.by0 = y;
    if (y > preBox.by1) preBox.by1 = y;
  }
  return preBox;
}
// Is the land now what was made ahead: the same realms, each one's land
// as foreseen, the same holes, at the same resolution?
function preStill() {
  if (pre.k !== k || pre.specs.length !== fieldSpecs.length) return false;
  for (let j = 0; j < fieldSpecs.length; j++) {
    const r = fieldSpecs[j], m = pre.post[j];
    if (r !== pre.specs[j] || r.color !== pre.colors[j]) return false;
    for (let i = 0; i < N2; i++) if (r.shown[i] !== m[i]) return false;
  }
  let n = 0;
  for (let i = 0; i < N2; i++) n += pre.holes[i];
  if (n !== game.holes.size) return false;
  for (const h of game.holes) if (!pre.holes[h]) return false;
  return true;
}
// A realm's layers, made ahead, swapped in (the old ones are its spares now).
function swapIn(r) {
  const sp = r.spare;
  let t = r.layer; r.layer = sp.layer; sp.layer = t;
  t = r.glow; r.glow = sp.glow; sp.glow = t;
  t = r.shared; r.shared = sp.shared; sp.shared = t;
  t = r.sharedAt; r.sharedAt = sp.sharedAt; sp.sharedAt = t;
  t = r.sharedTo; r.sharedTo = sp.sharedTo; sp.sharedTo = t;
  r.X = sp.X; r.Y = sp.Y; r.any = sp.any;
  r.dirty = false; r.builtK = k; landVer++; landSwaps++;
}
let landSwaps = 0, landBuilds = 0, landStale = 0, landUnready = 0; // (realms' layers swapped in at a strike, and made; strikes it was made the old way at, the land made ahead not as it is then, or not made yet: for the tests)
function swapDashes() {
  const d = pre.dash;
  const t = dash.layer; dash.layer = d.layer; d.layer = t;
  dash.X = d.X; dash.Y = d.Y; dash.any = d.any; dash.for = d.for;
}

// Where two owners' land meets: every contested side dashed half in one
// owner's colour, half in the other's, over an ink line, in one cached
// layer for every realm, made again whenever any land is (stroked every
// frame, the dashes' many short pieces cost as much as the rest of the
// land; marching, they cost that and more).
const dash = { layer: null, X: 0, Y: 0, any: false, for: 0 }; // (for: how many realms it was made for)
const ownSides = r => r;
// Into `into` (the dashes' layer, or its spare), from each realm's
// contested sides as sidesOf has them (its own, or as a strike will leave them).
function buildDashes(into = dash, sidesOf = ownSides) {
  into.for = fieldSpecs.length;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of fieldSpecs) {
    const sh = sidesOf(r).shared;
    for (let i = 0; i < sh.length; i += 3) {
      x0 = Math.min(x0, sh[i]); x1 = Math.max(x1, sh[i]);
      y0 = Math.min(y0, sh[i + 1]); y1 = Math.max(y1, sh[i + 1]);
    }
  }
  into.any = x1 >= x0;
  if (!into.any) return;
  into.X = Math.floor((x0 - 4) * k); into.Y = Math.floor((y0 - 4) * k);
  const w = Math.ceil((x1 + 4) * k) - into.X + 1, h = Math.ceil((y1 + 4) * k) - into.Y + 1;
  if (!into.layer) into.layer = makeLayer(w, h);
  else if (into.layer.width !== w || into.layer.height !== h) { into.layer.width = w; into.layer.height = h; }
  const g = into.layer.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  g.setTransform(k, 0, 0, k, -into.X, -into.Y);
  g.lineCap = 'butt';
  g.lineJoin = 'round';
  for (const r of fieldSpecs) {
    const h = sidesOf(r);
    if (!h.shared.length) continue;
    const s0 = r.idx % 2 ? 0.5 : 0;
    dashes(g, h, r.color, s0, null);
    for (const o of fieldSpecs) if (o !== r && h.sharedTo.includes(o)) dashes(g, h, r.color, 0.5 - s0, o); // (the other half, where only this realm has the side)
  }
}
// Half of each of a realm's contested sides (h: its shared, sharedAt and
// sharedTo), from s0 along it (to s0 + 0.5), on g in its colour (col)
// over an ink line; or with o, the halves of the sides only it has
// against o's land, in o's colour.
function dashes(g, h, col, s0, o) {
  const sh = h.shared, at = h.sharedAt;
  g.beginPath();
  for (let n = 0; n < h.sharedTo.length; n++) {
    if (o && h.sharedTo[n] !== o) continue;
    const L = sh[at[n + 1] - 1];
    dashAlong(g, sh, at[n], at[n + 1], s0 * L, (s0 + 0.5) * L);
  }
  if (o) col = o.color;
  g.strokeStyle = LAND_INK;
  g.lineWidth = 5;
  g.stroke();
  g.strokeStyle = col;
  g.lineWidth = 2.6;
  g.stroke();
}
// The stretch u0..u1 along a side's line of points (sh[i0..i1]: see sideLine), added to g's path.
function dashAlong(g, sh, i0, i1, u0, u1) {
  let started = false;
  for (let i = i0; i + 3 < i1; i += 3) {
    const la = sh[i + 2], lb = sh[i + 5];
    if (lb < u0 || la > u1) continue;
    const span = lb - la || 1, f0 = Math.max(0, (u0 - la) / span), f1 = Math.min(1, (u1 - la) / span);
    const ax = sh[i], ay = sh[i + 1], bx = sh[i + 3], by = sh[i + 4];
    if (!started) { g.moveTo(ax + (bx - ax) * f0, ay + (by - ay) * f0); started = true; }
    g.lineTo(ax + (bx - ax) * f1, ay + (by - ay) * f1);
  }
}

// Sovereign's capital: a swallow-tailed banner on a pole, as a map marks a
// capital: parchment and ink (no gold: gold means a power), an inked crown
// on it and a trim in the realm's colour, fluttering like the colonies' flags.
const BANNER_W = 0.95, BANNER_H = 0.62;
const bannerSprite = col => sprite('banner', col, drawBannerCloth);
const drawBannerCloth = (g, col) => {
  const c = CELL, w = c * BANNER_W, h = c * BANNER_H, y0 = -h / 2, notch = w * 0.28;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(0, y0); g.lineTo(w, y0); g.lineTo(w - notch, 0); g.lineTo(w, y0 + h); g.lineTo(0, y0 + h); g.closePath();
  g.fillStyle = '#f6ecd2'; g.fill();
  g.strokeStyle = '#3a2614'; g.lineWidth = 1.6; g.stroke();
  g.strokeStyle = col; g.lineWidth = 1.4; // (a trim inside its edge, in the realm's colour)
  g.beginPath(); g.moveTo(2, y0 + 2.2); g.lineTo(w - 3.4, y0 + 2.2); g.moveTo(2, y0 + h - 2.2); g.lineTo(w - 3.4, y0 + h - 2.2); g.stroke();
  const cx = w * 0.36, cy = 0.5, cw = h * 0.62, ch = h * 0.42; // (the crown, in ink)
  g.beginPath();
  g.moveTo(cx - cw / 2, cy + ch / 2); g.lineTo(cx - cw / 2, cy - ch / 2); g.lineTo(cx - cw / 4, cy - ch * 0.05); g.lineTo(cx, cy - ch / 2 - 1);
  g.lineTo(cx + cw / 4, cy - ch * 0.05); g.lineTo(cx + cw / 2, cy - ch / 2); g.lineTo(cx + cw / 2, cy + ch / 2); g.closePath();
  g.fillStyle = '#3a2614'; g.fill();
};
// (At cx, cy in cells; tilted about its pole's foot and scaled, as it's
// carried; fluttering on its own beat; once it's at rest on a cell, bent by
// a snake on it: see bendOn.)
function drawBanner(cx, cy, col, now, tilt = 0, sc = 1, beat = cx) {
  const x = cx * CELL + CELL / 2, y = cy * CELL + CELL / 2, turned = tilt || sc !== 1;
  const bent = Number.isInteger(cx) && Number.isInteger(cy) && bendOn(cx, cy, now), top = y - CELL * 0.95 - 1;
  if (!overSnakes) { // (under the snakes: only one hit head-on, lying flat; the rest wait, see drawBentFlags)
    if (bent && lying()) {
      bentPole(x, y, true);
      if (!wrapping(now)) { clothFrame(x, y, x + 1.5, top); bannerCloth(x + 1.5, top, col, now, beat); ctx.restore(); }
      else flagsLater.push({ x: cx, y: cy, col, beat, wrap: bendNowB, banner: true });
      return;
    }
    flagsLater.push({ x: cx, y: cy, col, beat, tilt, sc, banner: true });
    return;
  }
  if (turned) { ctx.save(); ctx.translate(x, y + CELL * 0.6); ctx.rotate(tilt); ctx.scale(sc, sc); ctx.translate(-x, -y - CELL * 0.6); }
  bentPole(x, y, bent);
  if (bent) clothFrame(x, y, x + 1.5, top);
  bannerCloth(x + 1.5, top, col, now, beat);
  if (bent) ctx.restore();
  if (turned) ctx.restore();
}
function bannerCloth(x, top, col, now, beat) {
  const sp = bannerSprite(col), half = SPRITE * CELL / 2, dev = sp.width / (SPRITE * CELL);
  const w = CELL * BANNER_W, h = CELL * BANNER_H + 2, sw = w / FLAG_STRIPS;
  for (let i = 0; i < FLAG_STRIPS; i++) {
    const out = (i + 0.5) / FLAG_STRIPS;
    const dy = reduced ? 0 : Math.sin(now / 200 - i * 0.9 + beat) * CELL * 0.05 * out;
    ctx.drawImage(sp, (half + i * sw) * dev, (half - h / 2) * dev, (sw + 0.6) * dev, h * dev, x + i * sw, top + dy, sw + 0.6, h);
  }
}
// Sovereign's banner over its capital, as drawn. When the capital moves,
// it goes too: a quick glide as the realm drifts a cell; pecked out from
// under it, it teeters over the pit until the realm moves (at once, as
// the rules have it), and is carried there, lifted (bigger) and leaning
// the way it's going. While the land under it is there, as before, or
// while it's on its way. With reduced motion it's simply at the new
// capital, and doesn't teeter.
const BANNER_GLIDE_MS = 240, BANNER_CARRY_MS = 700;
function drawRealmBanner(r, home, now) {
  let b = r.banner;
  if (!b) b = r.banner = { fx: home.x, fy: home.y, tx: home.x, ty: home.y, at: -1e9, carry: false };
  const dur = b.carry ? BANNER_CARRY_MS : BANNER_GLIDE_MS;
  let u = reduced ? 1 : Math.max(0, Math.min(1, (now - b.at) / dur)), e = u * u * (3 - 2 * u);
  if (home.x !== b.tx || home.y !== b.ty) { // (moved: from where it's drawn now)
    const fx = b.fx + (b.tx - b.fx) * e, fy = b.fy + (b.ty - b.fy) * e;
    b.carry = !!holeMask[b.ty * GRID + b.tx];
    b.fx = fx; b.fy = fy; b.tx = home.x; b.ty = home.y; b.at = now;
    u = reduced ? 1 : 0; e = u;
  }
  const x = u >= 1 ? b.tx : b.fx + (b.tx - b.fx) * e, y = u >= 1 ? b.ty : b.fy + (b.ty - b.fy) * e, key = home.y * GRID + home.x;
  const pecked = u >= 1 && !!holeMask[key] && !r.gone;
  if (u >= 1 && !pecked && !r.shown[key]) return;
  let tilt = 0, sc = 1;
  if (u < 1 && b.carry) { const l = Math.sin(u * Math.PI); sc = 1 + 0.2 * l; tilt = 0.3 * l * (b.tx >= b.fx ? 1 : -1); }
  else if (pecked && !reduced) tilt = Math.sin(now / 85) * 0.2;
  drawBanner(x, y, r.color, now, tilt, sc, home.x);
}
// A flag a snake lies on bends over (Haakon, 29 October 2026): any part
// of any snake on its tile pushes the pole over from its foot the way
// that snake came onto the tile (from the cell before it in the body), and
// its cloth trails low behind; it stays so while the body's there, and
// bends the new way if another snake comes over it from another side.
// Once the tile's free it swings upright, a short wobble dying away. With
// reduced motion it simply leans while covered and stands up again. Seen,
// not played: each screen draws it from the snakes it has. While it
// leans it's drawn over the snakes, so it shows (as every flag is: see
// drawBentFlags). The lean is
// eased from wherever it was to wherever it's going, so a change never
// jumps: east and west tip the pole over sideways; north (away) leaves it
// tall but hangs its cloth down; south (towards you) foreshortens it.
// Hit head-on (2p: a head coming straight at it from north or south, with
// no side to push it to), it's knocked flat ahead of the head, the pole
// laid along the way it's going, its cloth wrapped round the head for
// WRAP_MS (over the snakes), then trailing under the body (under them);
// it springs back up as any does. (With reduced motion: no wrap, flat at
// once.)
const BEND = 0.6, BEND_SIDE = 0.45, BEND_IN_MS = 110, SPRING_MS = 900, SPRING_PERIOD = 330, WRAP_MS = 260;
const flagBends = new Map(); // tile -> { who, at, on, seen, head, from: [the look it eased from], to: [the push's] }
const flagsLater = []; // (this frame's, to draw over the snakes: see drawBentFlags)
let overSnakes = false, bendNowB = null; // (bendNowB: the bend bendOn last looked at)
// (What's eased is the look itself, [tilt, lean, turn, push]: the pole's
// tilt about its foot; how far it leans north (-1) or south (1); the
// cloth's turn (1 as it flies, -1 turned round to trail west); and how
// hard it's pushed, for the cloth's droop; and how flat it's laid, a head-on
// hit's. So no change of snake jumps.)
const look = [0, 0, 1, 0, 0];
let leanX = 0, leanY = 0; // (a step onto a cell: see stepOnto)
function flagLean(b, now) {
  const t = now - b.at, f0 = b.from, f1 = b.to;
  if (b.on) {
    const u = reduced ? 1 : Math.min(1, t / BEND_IN_MS), e = u * u * (3 - 2 * u);
    for (let i = 0; i < 5; i++) look[i] = f0[i] + (f1[i] - f0[i]) * e;
  } else if (reduced || t >= SPRING_MS) { look[0] = look[1] = look[3] = look[4] = 0; look[2] = 1; }
  else { // (springing back: the wobble swings the pole, not the cloth round)
    const f = Math.exp(-t / 200) * Math.cos(t / SPRING_PERIOD * TAU);
    look[0] = f0[0] * f; look[1] = f0[1] * f; look[3] = f0[3] * f; look[2] = 1 + (f0[2] - 1) * Math.max(0, f); look[4] = f0[1] > 0 ? f0[4] : 0; // (flat only towards you: one laid north swings up through upright)
  }
}
// (Where on s's body the cell x, y is, or -1.)
function cellOn(s, x, y) {
  const B = s.body;
  for (let i = 0; i < B.length; i++) if (B[i].x === x && B[i].y === y) return i;
  return -1;
}
// (The step s took onto the i-th cell of its body, a unit each way: from
// the cell before it, or, at its tail, the step it took off it; over a
// wrapped edge, the short way.)
const stepUnit = d => d > 1 ? -1 : d < -1 ? 1 : d;
function stepOnto(s, i) {
  const B = s.body, a = B[i];
  for (let j = i + 1; j < B.length; j++) if (B[j].x !== a.x || B[j].y !== a.y) { leanX = stepUnit(a.x - B[j].x); leanY = stepUnit(a.y - B[j].y); return; }
  for (let j = i - 1; j >= 0; j--) if (B[j].x !== a.x || B[j].y !== a.y) { leanX = stepUnit(B[j].x - a.x); leanY = stepUnit(B[j].y - a.y); return; }
  leanX = s.dir.x; leanY = s.dir.y;
}
// The look of the flag on tile x, y now, in look; true if it leans. (The
// snake already on it keeps it, while it's there; else the first.) North
// or south, along the body, it would lie hidden on it: so it falls out
// to the side its cloth flies as well, bending away from the body.
function bendOn(x, y, now) {
  const key = y * GRID + x;
  let b = flagBends.get(key), who = null, at = -1;
  if (b && b.who && b.who.alive && (at = cellOn(b.who, x, y)) >= 0) who = b.who;
  else for (const s of game.snakes) if (s.alive && (at = cellOn(s, x, y)) >= 0) { who = s; break; }
  if (!b) {
    if (!who) return false;
    flagBends.set(key, b = { who: null, at: now, on: false, seen: now, head: false, from: [0, 0, 1, 0, 0], to: [0, 0, 1, 0, 0] });
  }
  b.seen = now; bendNowB = b;
  if (who !== b.who) { // (a snake came on, another took over, or it's free: from how it looks now)
    flagLean(b, now);
    for (let i = 0; i < 5; i++) b.from[i] = look[i];
    b.at = now; b.who = who; b.on = !!who; b.head = false;
    if (who) {
      stepOnto(who, at);
      const l = Math.hypot(leanX, leanY) || 1, dx = leanX / l, dy = leanY / l;
      b.head = !dx && at === 0; // (head-on: knocked flat, see WRAP_MS)
      b.to[0] = b.head ? 0 : BEND * dx + BEND_SIDE * Math.abs(dy); b.to[1] = dy; b.to[2] = dx > 0 ? 1 - 2 * dx : 1; b.to[3] = 1; b.to[4] = b.head ? 1 : 0;
    }
  }
  flagLean(b, now);
  if (!b.on && now - b.at >= SPRING_MS) { flagBends.delete(key); return false; }
  return look[3] !== 0;
}
// (Flags not drawn this frame, as one fallen in, hidden, or a banner
// moved off: forgotten, so none springs back later from a push long gone.)
function forgetBends(now) {
  for (const [key, b] of flagBends) if (b.seen !== now) flagBends.delete(key);
}
// (South foreshortens the pole, and laid flat turns it right round, lying
// towards you; north stretches it a touch, as a pole leaning away does.)
const poleScale = () => look[1] > 0 ? 1 - (0.25 + 1.65 * look[4]) * look[1] : 1 - 0.08 * look[1];
// (The flag bendOn last looked at: laid flat by a head under it, and still
// wrapped round that head.)
const laidFlat = () => bendNowB.on && bendNowB.head;
const lying = () => laidFlat() || (look[4] > 0 && look[1] > 0.3); // (or still lying towards you as it springs back: under what's just gone over it)
const wrapping = now => !reduced && laidFlat() && now - bendNowB.at < WRAP_MS;
// A pole as bent, and the frame its cloth hangs in at ax, ay (on the pole
// as it stands): moved with the pole's top, not turned with it, it trails
// behind the push (pushed east, it's turned round, edge on halfway) and
// droops. Leaves the frame saved: the caller restores it.
function bentPole(x, y, bent) {
  if (!bent) { flagPole(x, y); return; }
  const foot = y + CELL * 0.6;
  ctx.save(); ctx.translate(x, foot); ctx.rotate(look[0]); ctx.scale(1, poleScale()); ctx.translate(-x, -foot);
  flagPole(x, y);
  ctx.restore();
}
function clothFrame(x, y, ax, ay) {
  const foot = y + CELL * 0.6, th = look[0], c = Math.cos(th), s = Math.sin(th), ox = ax - x, oy = (ay - foot) * poleScale();
  const droop = Math.min(1, Math.abs(look[3])) * (0.3 + 0.8 * Math.max(0, -look[1]));
  ctx.save();
  ctx.translate(x + ox * c - oy * s, foot + ox * s + oy * c);
  ctx.scale(Math.max(-1, Math.min(1, look[2])), 1); ctx.rotate(droop);
  ctx.translate(-ax, -ay);
}
// A flagpole: inked, with a parchment core and a parchment knob on top.
function flagPole(x, y) {
  ctx.strokeStyle = '#3a2614';
  ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(x, y + CELL * 0.6); ctx.lineTo(x, y - CELL * 0.98); ctx.stroke();
  ctx.strokeStyle = '#e7d7b1';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.fillStyle = '#f6ecd2';
  circle(x, y - CELL, 2.8);
  ctx.strokeStyle = '#3a2614';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// The Union Flag, as flown over the Empire's colonies (a redcoat's flag: St
// George's cross for England, St Andrew's saltire for Scotland, St Patrick's,
// counterchanged, for Ireland), 5:3, its hoist at the sprite's centre.
// The second colony and later fly colonial ensigns, as the Empire's
// colonies did: the Union Flag in the corner, a Blue Ensign with the
// Southern Cross, or a Red Ensign with a colony's badge (here, the log's own
// oak on a white roundel). 'union' | 'blue' | 'red'.
const UNION_W = 0.95, UNION_H = 0.57;
const flagSprite = v => sprite('flag', v, drawColonyFlag);
const drawColonyFlag = (g, v) => {
  const c = CELL, w = c * UNION_W, h = c * UNION_H, y0 = -h / 2;
  if (v === 'union') unionAt(g, 0, y0, w, h);
  else {
    g.fillStyle = v === 'blue' ? '#012169' : '#c8102e';
    g.fillRect(0, y0, w, h);
    unionAt(g, 0, y0, w / 2, h / 2);
    g.fillStyle = '#ffffff';
    if (v === 'blue') { // the Southern Cross
      for (const [sx, sy, sr] of [[0.75, -0.3, 0.08], [0.62, 0.02, 0.07], [0.88, -0.06, 0.07], [0.75, 0.32, 0.08], [0.8, 0.12, 0.04]]) starOn(g, w * sx, h * sy, h * sr);
    } else { // a badge: the oak on a white roundel
      const bx = w * 0.74, by = h * 0.04, br = h * 0.24;
      g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
      g.fillStyle = '#7c2d12';
      g.fillRect(bx - br * 0.12, by, br * 0.24, br * 0.6);
      g.fillStyle = '#15803d';
      g.beginPath(); g.arc(bx, by - br * 0.1, br * 0.5, 0, TAU); g.fill();
    }
  }
  g.strokeStyle = 'rgba(15,23,42,0.4)';
  g.lineWidth = 1;
  g.strokeRect(0, y0, w, h);
};
function starOn(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 7, rr = i % 2 ? r * 0.45 : r;
    if (i) g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.fill();
}
// The Union Flag in a rectangle (whole, or in an ensign's corner).
function unionAt(g, x0, y0, w, h) {
  const u = h / 30;
  g.save();
  g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.fillStyle = '#012169';
  g.fillRect(x0, y0, w, h);
  const cx = x0 + w / 2, cy = y0 + h / 2;
  g.lineCap = 'butt';
  g.strokeStyle = '#ffffff';
  g.lineWidth = 6 * u;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w, y0 + h); g.moveTo(x0 + w, y0); g.lineTo(x0, y0 + h); g.stroke();
  // St Patrick's: each arm offset to one side of the white (anticlockwise), so it turns like a pinwheel.
  g.strokeStyle = '#c8102e';
  g.lineWidth = 2 * u;
  g.beginPath();
  for (const [ex, ey] of [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]]) {
    const len = Math.hypot(ex - cx, ey - cy), dx = (ex - cx) / len, dy = (ey - cy) / len, nx = dy * u, ny = -dx * u;
    g.moveTo(cx + nx, cy + ny); g.lineTo(ex + nx, ey + ny);
  }
  g.stroke();
  g.fillStyle = '#ffffff';
  g.fillRect(x0, cy - 5 * u, w, 10 * u);
  g.fillRect(cx - 5 * u, y0, 10 * u, h);
  g.fillStyle = '#c8102e';
  g.fillRect(x0, cy - 3 * u, w, 6 * u);
  g.fillRect(cx - 3 * u, y0, 6 * u, h);
  g.restore();
}
// Drawn in vertical strips that ripple from the pole outward, so it flies.
const FLAG_STRIPS = 8;
function drawFlag(x, top, now, phase, kind = 'union') {
  const sp = flagSprite(kind), half = SPRITE * CELL / 2, dev = sp.width / (SPRITE * CELL);
  const w = CELL * UNION_W, h = CELL * UNION_H, sw = w / FLAG_STRIPS;
  for (let i = 0; i < FLAG_STRIPS; i++) {
    const out = (i + 0.5) / FLAG_STRIPS;
    const dy = reduced ? 0 : Math.sin(now / 180 - i * 0.9 + phase) * CELL * 0.05 * out;
    // (each strip a hair wider than its slot, so no seams show between them)
    ctx.drawImage(sp, (half + i * sw) * dev, (half - h / 2) * dev, (sw + 0.6) * dev, h * dev, x + i * sw, top + dy, sw + 0.6, h);
  }
}

// Colonist's colonies: a flag flying over each (the Union Flag over the
// first, an ensign over later ones), on its pole with a parchment knob.
// A colony whose flag cell the woodpecker pecks out is lost (Colonist
// forgets it at once): its flag tips over and drops into the pit,
// shrinking and going dark as it goes, and its land shrinks away into
// the pit after it (see pitRing). With reduced motion the flag fades
// where it stood. (Each kept while the colony's still remembered, so it
// falls once.)
function drawColonyFlags(r, now) {
  for (let i = r.fallen.length - 1; i >= 0; i--) if (now - r.fallen[i].at > 5000) r.fallen.splice(i, 1);
  for (const c of r.owner.memory.colonies) {
    const key = c.y * GRID + c.x, n = c.n || 1, kind = n === 1 ? 'union' : n % 2 ? 'red' : 'blue';
    if (holeMask[key]) { fellIn(r, c, kind, now); continue; }
    if (!r.shown[key]) continue;
    const x = c.x * CELL + CELL / 2, y = c.y * CELL + CELL / 2, top = y - CELL * 0.92, beat = c.x * 0.7 + c.y * 1.3;
    if (bendOn(c.x, c.y, now) && lying()) { // (knocked flat by a head: under the snakes, but its wrap over them)
      bentPole(x, y, true);
      if (!wrapping(now)) { clothFrame(x, y, x + 1.5, top); drawFlag(x + 1.5, top, now, beat, kind); ctx.restore(); }
      else flagsLater.push({ x: c.x, y: c.y, kind, beat, wrap: bendNowB, banner: false });
      continue;
    }
    flagsLater.push({ x: c.x, y: c.y, kind, beat, banner: false });
  }
}
// The flags, drawn over the snakes (2p): a pole and cloth stand up off
// their tile, so whatever is on the tiles behind it (above it on screen)
// is behind it; but not over what stands in front of it, the row below,
// whose cells (a head's a little higher, for its face) are cut out of
// where it's drawn. Upper flags first, so a lower one is in front. A flag
// wrapped round a head is its cloth only, round that head (see
// wrapCloth). Then forgotten.
function drawBentFlags(now) {
  overSnakes = true;
  flagsLater.sort((a, b) => a.y - b.y);
  for (const f of flagsLater) {
    if (f.wrap) { wrapCloth(f, now); continue; }
    ctx.save();
    clipFront(f.x, f.y);
    if (f.banner) drawBanner(f.x, f.y, f.col, now, f.tilt, f.sc, f.beat); // (its shake, if pecked, kept)
    else {
      const x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2, bent = bendOn(f.x, f.y, now);
      bentPole(x, y, bent);
      if (bent) clothFrame(x, y, x + 1.5, y - CELL * 0.92);
      drawFlag(x + 1.5, y - CELL * 0.92, now, f.beat, f.kind);
      if (bent) ctx.restore();
    }
    ctx.restore();
  }
  overSnakes = false;
  flagsLater.length = 0;
}
// (The clip for a flag at x, y: the board, less every snake's cells on the
// row in front of it, near it.)
function clipFront(fx, fy) {
  const row = Math.round(fy) + 1, cx = Math.round(fx);
  frontLift.fill(0);
  for (const s of game.snakes) {
    if (!s.alive) continue;
    for (let i = -1; i < s.body.length; i++) { // (-1: where its head was, as it's drawn sliding from there)
      const c = i < 0 ? s.prev && s.prev[0] : s.body[i], j = c ? c.x - cx + 1 : -1;
      if (c && c.y === row && j >= 0 && j < 4) frontLift[j] = Math.max(frontLift[j], i <= 0 ? 0.35 : 0.2); // (its outline, and a head its face)
    }
  }
  if (!frontLift[0] && !frontLift[1] && !frontLift[2] && !frontLift[3]) return; // (nothing in front: no clip)
  ctx.beginPath();
  ctx.rect(-CELL, -CELL * 2, SIZE + CELL * 2, SIZE + CELL * 4);
  for (let j = 0; j < 4; j++) if (frontLift[j]) ctx.rect((cx - 1 + j) * CELL, (row - frontLift[j]) * CELL, CELL, CELL * (1 + frontLift[j])); // (one each: even-odd, two would cancel)
  ctx.clip('evenodd');
}
const frontLift = new Float32Array(4); // (the columns from one left of the flag to two right of it)
// A flag knocked flat by a head, its cloth wrapped round that head for a
// moment: across the front of the head as it's drawn, its ends folded back
// along its sides, and slipping off under it at the end.
function wrapCloth(f, now) {
  const b = f.wrap, s = b.who, a = s && anim.get(s);
  if (!a) return;
  const u = Math.min(1, (now - b.at) / WRAP_MS), d = s.dir.y >= 0 ? 1 : -1;
  const sp = f.banner ? bannerSprite(f.col) : flagSprite(f.kind), half = SPRITE * CELL / 2, dev = sp.width / (SPRITE * CELL);
  const sw0 = CELL * (f.banner ? BANNER_W : UNION_W), h0 = CELL * (f.banner ? BANNER_H : UNION_H);
  const w = CELL * 0.95, h = h0 * 0.62, sw = w / FLAG_STRIPS, front = a.by + d * CELL * (0.28 - 0.3 * u * u);
  ctx.save();
  ctx.globalAlpha = Math.min(1, (1 - u) * 3.5);
  for (let i = 0; i < FLAG_STRIPS; i++) {
    const q = (i + 0.5) / FLAG_STRIPS * 2 - 1, fold = q * q * CELL * 0.32; // (its ends folded back along the head's sides)
    const flap = Math.sin(now / 90 + i) * CELL * 0.02;
    ctx.drawImage(sp, (half + i * sw0 / FLAG_STRIPS) * dev, (half - h0 / 2) * dev, (sw0 / FLAG_STRIPS + 0.6) * dev, h0 * dev, a.bx - w / 2 + i * sw, front - d * fold - h / 2 + flap, sw + 0.6, h);
  }
  ctx.restore();
}
const FALL_MS = 760, FALL_STILL_MS = 400;
const fallenFlags = []; // { owner, x, y, kind, beat, at }
function fellIn(r, c, kind, now) {
  for (const f of fallenFlags) if (f.owner === r.owner && f.x === c.x && f.y === c.y) return;
  fallenFlags.push({ owner: r.owner, x: c.x, y: c.y, kind, beat: c.x * 0.7 + c.y * 1.3, at: now });
  r.fallen.push({ x: c.x, y: c.y, radius: c.radius, at: now });
}
function drawFallenFlags(now) {
  for (let i = fallenFlags.length - 1; i >= 0; i--) {
    const f = fallenFlags[i], u = (now - f.at) / (reduced ? FALL_STILL_MS : FALL_MS);
    if (u >= 1) { // (gone: forgotten once Colonist has forgotten the colony)
      let kept = false;
      for (const c of f.owner.memory.colonies || NO_SITES) if (c.x === f.x && c.y === f.y) kept = true;
      if (!kept) fallenFlags.splice(i, 1);
      continue;
    }
    const x = f.x * CELL + CELL / 2, y = f.y * CELL + CELL / 2, foot = y + CELL * 0.6;
    ctx.save();
    if (reduced) ctx.globalAlpha = 1 - u;
    else { // (tipping over the way it flies, then dropping in: smaller and fading into the dark)
      const tip = Math.min(1, u / 0.45), drop = Math.max(0, (u - 0.35) / 0.65), s = 1 - 0.65 * drop;
      ctx.globalAlpha = 1 - drop * drop;
      ctx.translate(x, foot + drop * CELL * 0.3);
      ctx.rotate(tip * tip * 1.3);
      ctx.scale(s, s);
      ctx.translate(-x, -foot);
    }
    flagPole(x, y);
    drawFlag(x + 1.5, y - CELL * 0.92, now, f.beat, f.kind);
    ctx.restore();
  }
}
const NO_SITES = [];

// Under the snakes, once their shadows are down (see drawSnakes): whatever
// of a rival lies on someone's land has that land's colour clinging round
// it, as if it were wading through it: a line of the colour hugging it,
// just outside everything drawn round it (an outline, a gold line), and a
// soft glow of it beyond. Only the pieces on the land's own cells (no
// clip: the cut is cell-exact). The glow (the shape grown FIELD_GLOW_GROW,
// smoothed: see bodyFillsOn) goes into the veil, a snake at a time and
// only round what of it is on land, and is laid on at FIELD_GLOW; the
// line (FIELD_LINE wide, opaque) goes straight on the board. The snake
// drawn over them covers their inside, so its body keeps its own colours
// (on land two owners claim, the later colour wins). Outside the line,
// the border's own parchment keyline, so it shows round a body of the
// land's own hue (rose round Sniper's red) and to colour-blind eyes (the
// bark beyond it is its ink: an ink ring as well cost a third pass).
// Each pass is separate fills, not one path: one path of the pieces (or
// of only the circles), or the line stroked round its fill, cost more.
// Where a head just crossed in: a ripple at it (over the snakes: see
// drawRipples), and the border lights up from there.
const FIELD_GLOW = 0.16, FIELD_GLOW_GROW = 8, FIELD_LINE = 2.6, huedOn = [];
let huesOn = true; // (off only for tools/bench.js, timing them: see hues below)
function drawFieldHues(now) {
  for (const s of game.snakes) {
    if (!s.alive) continue;
    const a = anim.get(s);
    if (!a || !a.n) continue;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    huedOn.length = 0;
    for (const r of fieldSpecs) {
      if (!r.any || r.gone || s === r.owner) continue;
      const h = s.body[0], inside = r.shown[h.y * GRID + h.x] === 1;
      let was = inField.get(s);
      if (!was) inField.set(s, was = new Set());
      if (inside && !was.has(r.owner) && !reduced) { // (just crossed in)
        ripples.push({ x: a.pts[0], y: a.pts[1], color: r.color, at: now });
        r.pulses.push({ x: a.pts[0], y: a.pts[1], at: now });
      }
      if (inside) was.add(r.owner); else was.delete(r.owner);
      let touches = false;
      for (let i = 0; i < a.n; i++) {
        const px = a.pts[2 * i], py = a.pts[2 * i + 1];
        if (!onShown(r, px, py)) continue;
        touches = true;
        if (px < x0) x0 = px;
        if (px > x1) x1 = px;
        if (py < y0) y0 = py;
        if (py > y1) y1 = py;
      }
      if (touches) huedOn.push(r);
    }
    if (!huedOn.length) continue;
    const edge = edgeOf(s, a), m = CELL + 12; // (round the pieces: a band and a glow's width more)
    veilOn(0, 0, x0 - m, y0 - m, x1 + m, y1 + m);
    for (const r of huedOn) { ctx.fillStyle = r.color; bodyFillsOn(a, edge + FIELD_GLOW_GROW, r, true); }
    veilOff(FIELD_GLOW);
    ctx.fillStyle = KEYLINE_SOLID; // (opaque: the pieces overlap)
    for (const r of huedOn) bodyFillsOn(a, edge + FIELD_LINE + BORDER_KEY, r);
    for (const r of huedOn) { ctx.fillStyle = r.color; bodyFillsOn(a, edge + FIELD_LINE, r); }
  }
}
// Is the drawn point (px, py) on a cell of r's land?
function onShown(r, px, py) {
  const x = Math.floor(px / CELL), y = Math.floor(py / CELL);
  return x >= 0 && y >= 0 && x < GRID && y < GRID && r.shown[y * GRID + x] === 1;
}
// bodyFills (see the snakes' drawing), only the pieces on r's land: a
// band where either of its ends is, a segment where it is. Soft (the
// glow): a smooth sausage instead of the caterpillar's bumps and waists,
// its bands as wide as its segments, so a segment's round is needed only
// at the ends and where the body turns. (A circle is the dear part of a
// pass: *measured*, one 40 units across costs about five times a square
// 40 units a side, and the glow's, grown furthest, are the biggest. Soft,
// the land's colour round a rival costs 0.1 to 0.3 ms a frame less, most
// of what its keyline costs: see tools/bench.js --land.)
function bodyFillsOn(a, grow, r, soft) {
  const p = a.pts, c = a.cor, rad = a.rad, n = a.n;
  for (let i = n - 2; i >= 0; i--) {
    if (!onShown(r, p[2 * i], p[2 * i + 1]) && !onShown(r, p[2 * i + 2], p[2 * i + 3])) continue;
    const h = (soft ? rad[i + 1] : bandR(a, i)) + grow, x1 = p[2 * i], y1 = p[2 * i + 1], qx = c[2 * i], qy = c[2 * i + 1], x2 = p[2 * i + 2], y2 = p[2 * i + 3];
    if ((near(x1, qx) && near(qx, x2)) || (near(y1, qy) && near(qy, y2))) rectPiece(x1, y1, x2, y2, h);
    else { rectPiece(x1, y1, qx, qy, h); rectPiece(qx, qy, x2, y2, h); }
  }
  for (let i = n - 1; i >= 0; i--) {
    if (!onShown(r, p[2 * i], p[2 * i + 1])) continue;
    if (i < n - 1 && bends(a, i)) circle(c[2 * i], c[2 * i + 1], (soft ? rad[i + 1] : bandR(a, i)) + grow);
    if (i === 0 && a.star) { ctx.beginPath(); starPath(a, grow); ctx.fill(); }
    else if (!soft || !straightAt(a, i)) circle(p[2 * i], p[2 * i + 1], rad[i] + grow);
  }
}
// Does the body run straight through segment i's centre, along the grid
// (not at either end)? In from the corner behind it (or the segment before,
// if that corner's where it is), out to the corner ahead (or the next).
function straightAt(a, i) {
  if (i === 0 || i >= a.n - 1) return false;
  const p = a.pts, c = a.cor, x = p[2 * i], y = p[2 * i + 1];
  let ax = c[2 * i - 2], ay = c[2 * i - 1], bx = c[2 * i], by = c[2 * i + 1];
  if (near(ax, x) && near(ay, y)) { ax = p[2 * i - 2]; ay = p[2 * i - 1]; }
  if (near(bx, x) && near(by, y)) { bx = p[2 * i + 2]; by = p[2 * i + 3]; }
  return (near(ax, x) && near(x, bx)) || (near(ay, y) && near(y, by));
}
// Over the snakes: a ripple where a head just crossed onto someone's land.
function drawRipples(now) {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i], t = (now - rp.at) / 520;
    if (t >= 1 || t < 0) { ripples.splice(i, 1); continue; }
    ctx.lineWidth = 3 * (1 - t);
    ctx.strokeStyle = rgba(rp.color, 0.8 * (1 - t));
    ctx.beginPath(); ctx.arc(rp.x, rp.y, CELL * (0.4 + 1.3 * t), 0, TAU); ctx.stroke();
  }
}
