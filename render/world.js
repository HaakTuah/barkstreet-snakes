// The renderer (see render/core.js): the frame, and the API: the last file, it
// makes window.SnakeRender.

// ------------------------------------------------------------ the frame

let shakeUntil = 0, shakePx = 0, lastNow = 0;
// The game's clock as drawn. game.time only moves on a tick, so it's eased
// from the last tick's time to this one's, as the bodies are: whatever
// fills or fades with it (your leap's arc, a wrap's gold) moves every
// frame, not ten steps a second.
let timeFrom = 0, timeAt = 0, shownTime = 0;

// alpha: how far the current tick has played out (0..1).
function frame(alpha, now) {
  if (!game || !sized) return;
  lastDrawAt = performance.now(); // (the next round's log waits until nothing's drawn)
  if (!staticLayer) resetStatic();
  const dt = lastNow ? Math.min(64, Math.max(0, now - lastNow)) : 16; // (never backwards: a clock a hair behind another)
  lastNow = now;
  frameDt = Math.max(1, dt);
  shownTime = game.time === timeAt ? timeFrom + (timeAt - timeFrom) * Math.min(1, alpha) : game.time;
  leadNow = game.tick === 0 && alpha >= 1 ? 0 : leadTicks; // (drawn ahead from the round's Go: see prepare)
  let alive = 0;
  for (const s of game.snakes) if (s.alive) alive++;
  leadRest = alive < 2;
  syncHoles();
  trackFire(now);
  syncScorch();
  easeSky(dt);
  if (deaths.length || corpses.length) updateCorpses(now);

  let sx = 0, sy = 0;
  if (!reduced && now < shakeUntil) {
    const t = (shakeUntil - now) / T.SHAKE_MS;
    sx = Math.round((Math.random() * 2 - 1) * shakePx * t * k);
    sy = Math.round((Math.random() * 2 - 1) * shakePx * t * k);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BARK; // the bark shifts, so fill the sliver it uncovers
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  shakeX = sx; shakeY = sy;
  ctx.setTransform(1, 0, 0, 1, sx, sy);
  ctx.drawImage(staticLayer, 0, 0);
  ctx.setTransform(k, 0, 0, k, sx, sy);
  drawCanopy(now);
  drawSnowCover(); // (drifts lie on the bark, under everything on it)

  drawFields(now); // (Sovereign's and Colonist's land, its borders and flags)

  drawBurrows(now);
  drawWatch(now); // (entry 6: the spot the woodpecker watches, its first cut to come)
  drawCut(alpha); // (part 2: the outline it's cutting, and a fight's ring)
  drawPatch(alpha, now); // (the woodpecker's next patch, on the bark under the snakes)
  drawFalls(now); // (2s: pieces cut loose, falling away)
  if (fallenFlags.length) drawFallenFlags(now); // (flags falling into the pit, some on those pieces)
  if (splats.length) drawSplats(now);
  drawLeaves(now, dt);
  drawFood(alpha, now);
  drawDive(now);
  drawFire(alpha, now);
  drawSkyTint();
  drawStrikes(alpha, now); // (lightning on its way: over the gloom)
  drawRainbow(now);

  if (corpses.length) drawCorpses(alpha, now);
  drawWrapEdges(now);
  if (streaks.length) drawStreaks(now); // (under the snakes: beside the dasher, never through it)
  drawLandings(now); // (under the snakes: where a jump comes down)
  drawSpitLines(now); // (and where a mushroom in a cheek will fly)
  drawSnakes(alpha, now); // (and the fields' light round any rival in them, under its body)
  drawCheeks(alpha, now); // (a mushroom in a cheek: puffed green, counting down to the spit)
  drawSpitsInAir(alpha, now); // (over the snakes: a mushroom flying along its line)
  drawPortals(now); // (over the snakes: a body goes into one, and comes out of the other)
  if (flagsLater.length) drawBentFlags(now); // (the flags, over the snakes, but not over what stands in front of them)
  if (flagBends.size) forgetBends(now);
  drawTossed(now); // (a bead spat over a head)
  drawRipples(now);
  drawRefusal(now);
  drawRain(now);
  drawSnow(now);
  drawEmbers(now);
  if (sky.snow > 0.5) breathe(now);
  drawBolt(now);
  drawMotes(dt);
  drawBlasts(now);
  drawParticles(dt);
  drawYou(now);
  drawFloaters(dt);
  drawPress(); // (over the Bonk! a crash puts where you'll press)
  drawFlash(now);
  drawWoodpecker(alpha, now, dt);
}

function shake(px) {
  shakePx = px;
  shakeUntil = (lastNow || performance.now()) + T.SHAKE_MS; // (the board's clock, which runs faster when watching faster)
}

// Where a snake's head is drawn right now, in CSS pixels from the board's
// top-left (for speech bubbles). boardPx is the board's CSS width.
function headPx(s, alpha, boardPx, out) {
  const a = anim.get(s);
  if (a && a.drawnAt === lastNow && lastNow) { out.x = a.bx * boardPx / SIZE; out.y = a.by * boardPx / SIZE; return out; } // (as drawn this frame: ahead, and easing out of any wrong guess)
  const c = s.body[0], p = s.prev && s.prev[0] ? s.prev[0] : c;
  const scale = boardPx / GRID, px = nearOf(p.x, c.x), py = nearOf(p.y, c.y); // (across a wrapped edge: from just off it)
  out.x = (px + (c.x - px) * alpha + 0.5) * scale;
  out.y = (py + (c.y - py) * alpha + 0.5) * scale;
  return out;
}

window.SnakeRender = {
  showYou,
  // (your jump's back, or with 'flash' your flash: the ring's flick in its colour; the renderer sees both itself, so this only makes sure)
  ready: (s, kind) => { const a = animOf(s, lastNow || performance.now()), now = lastNow || performance.now(); if (kind === 'flash') { if (!(now - a.flashFx < 600)) a.flashFx = now; } else if (!(now - a.readyAt < 600)) a.readyAt = now; },
  init, setGame, resize, frame, onTick, shake, hold: holdFor, headPx, colorOf, markOf, celebrate, setQuality, setBoardRect, pressed,
  get quality() { return quality; },
  holding: () => deaths.length > 0 || corpses.length > 0,
  setViewer(id) { viewerId = id; },
  setReducedMotion(v) { reduced = v; },
  setLead(ticks) { leadTicks = ticks; },
  guideSprite, // (the Field guide's pictures)
  get particles() { return pLive; },
  get motes() { let n = 0; for (let i = 0; i < MAX_M; i++) if (mlife[i] > 0) n++; return n; }, // (dust, smoke and the like in the air: for the tests)
  streaked: () => streaks.map(k => ({ from: [k.fx, k.fy], to: [k.tx, k.ty], seen: k.pre >= 0 })), // (the dash streaks drawn: for the tests)
  hues(on) { huesOn = !!on; }, // (a land's colour round a rival on it, drawn or not: for the benchmark, which times it)
  landShown: (s, x, y) => !!realms.get(s)?.shown[y * GRID + x], // (whether a cell of s's land is drawn: for the tests)
  prebuild(on) { prebuilding = !!on; if (!on) { pre.ready = false; pre.key = NaN; } }, // (the land a strike leaves made ahead, or not: for the tests, comparing the two)
  get prebuilt() { return pre.ready; }, // (made ahead, and waiting for the strike: for the tests)
  get landMade() { return { swapped: landSwaps, built: landBuilds, stale: landStale, unready: landUnready }; }, // (how often a realm's layers were swapped in, made ahead, and made; strikes made the old way, and why: for the tests)
  flick(s, p) { const a = animOf(s, lastNow), [, len] = FLICKS[lookOf(s)] || FLICKS.player; a.tongueMs = T.TONGUE_MS * len; a.tongueUntil = lastNow + (1 - p) * a.tongueMs; a.nextTongue = lastNow + 1e9; }, // (its tongue or gag p of the way through, and then no more: for the tests)
  birdHome, // (when the woodpecker lands back on its perch after a strike, ms after it: the game's "kik!")
  knockFlight: (x, y, tx, ty) => knockFly(Math.hypot(tx - x, ty - y)), // (how long a piece the strike knocks from (x, y) to (tx, ty) is in the air, ms: the knock sound's landing)
  // (the woodpecker as last drawn: its pose, what it's doing, where its eye is and where it looks, its layer; and its plan's timings, ms: for the tests)
  birdPose() {
    birdMats(pose);
    const k = lay.sc, u = Math.hypot(HM[0], HM[1]);
    return { phase: pose.phase, tp: pose.tp, x: pose.x, y: pose.y, s: pose.s, flip: pose.flip, rot: pose.rot, turn: pose.turn, thrust: pose.thrust, wing: pose.wing, stroke: pose.stroke, crouch: pose.crouch, blur: pose.blur, blows: pose.blows, blink: pose.blink,
      gaze: [bird.gx, bird.gy], looks: [pose.fx, pose.fy], eye: [lay.ox + k * atX(HM, 0.75, -1.9), lay.oy + k * atY(HM, 0.75, -1.9), k * u * 0.21], eyeAt: [atX(HM, 0.75, -1.9), atY(HM, 0.75, -1.9)], beak: [atX(HM, BILL[0], BILL[1]), atY(HM, BILL[0], BILL[1])],
      layer: { x: lay.x, y: lay.y, w: lay.w, h: lay.h, W: lay.W, H: lay.H } };
  },
  birdPlan: () => ({ strikeAt: plan.strikeAt, spot: [plan.tx, plan.ty], aim: plan.aimMs, depart: plan.depart, settle: B_SETTLE, drum: plan.D, times: plan.times.slice(), flight: plan.F, hop: plan.hop ? plan.H : 0, home: home.total, back: home.F, linger: B_LINGER }),
  birdLook(turn) { bird.force = turn ?? null; }, // (its head held turned so, or null: for the tests)
  birdOver(on) { overOn = !!on; }, // (the rings and pieces in the air it covers drawn over it, or not: for the tests)
  birdFrame(alpha, now) { if (game && sized) drawWoodpecker(alpha, now, 16); }, // (the woodpecker alone drawn, the board left as it is: for the tests, frame by frame through its flights)
};
