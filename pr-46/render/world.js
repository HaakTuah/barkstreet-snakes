// The renderer (see render/core.js): the frame, the round's events and
// moments (pops, blasts, streaks, the held corpses), and the API: the last
// file, it makes window.SnakeRender.

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
  drawPatch(alpha, now); // (the woodpecker's next patch, on the bark under the snakes)
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
  drawSnakes(alpha, now); // (and the fields' light round any rival in them, under its body)
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

// ------------------------------------------------------------ the world

// The first seconds of a round: which snake is yours. A bouncing arrow and
// YOU over your head (under it, heading down or near the top edge), a ring
// pulsing round it, chevrons marching the way you're heading; friends
// online get their names. Each screen marks its own snake. It fades once
// you steer (or a few seconds in): the game says when (showYou).
let youOn = false, youA = 0;
function showYou(on) { youOn = !!on; }
function drawYou(now) {
  youA += ((youOn ? 1 : 0) - youA) * Math.min(1, frameDt / 180);
  if (youA < 0.02 || !game) return;
  const c = CELL, t = reduced ? 0 : now / 1000;
  for (const s of game.snakes) {
    if (!s.alive || s.persona) continue; // (people only)
    const a = anim.get(s);
    if (!a || !a.n) continue;
    const hx = a.pts[0], hy = a.pts[1], mine = s.id === viewerId, col = colorOf(s);
    ctx.globalAlpha = youA;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const sgn = youSide(s, a, hy);
    if (!mine) { // a friend: the same arrow (a touch smaller), with the name they picked
      marker(hx, hy, sgn, col, s.name, 0.82, t);
      continue;
    }
    // A ring pulsing round your head...
    const pulse = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.strokeStyle = '#fffbea';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy, c * (0.75 + 0.15 * pulse), 0, TAU); ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // ...chevrons marching the way you're heading...
    ctx.strokeStyle = col;
    ctx.lineWidth = c * 0.09;
    ctx.lineCap = 'round';
    const dx = s.dir.x, dy = s.dir.y;
    for (let i = 1; i <= 3; i++) {
      const along = i + ((t * 2) % 1) - 0.3, f = 1 - (along - 0.7) / 3;
      if (f <= 0) continue;
      const cx = hx + dx * c * along, cy = hy + dy * c * along, w = c * 0.22;
      if (cx < 0 || cy < 0 || cx > SIZE || cy > SIZE) continue;
      ctx.globalAlpha = youA * Math.min(1, f);
      ctx.beginPath();
      ctx.moveTo(cx - dx * w + dy * w, cy - dy * w + dx * w);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - dx * w - dy * w, cy - dy * w - dx * w);
      ctx.stroke();
    }
    // ...and a bouncing arrow with YOU on it.
    ctx.globalAlpha = youA;
    marker(hx, hy, sgn, col, 'YOU', 1, t);
  }
  ctx.globalAlpha = 1;
}
// Which side of its head a snake's arrow goes (-1 over it, 1 under it):
// over it, unless its own body's there (heading down, as seat 2 starts
// online: the arrow and YOU covered the very snake they pointed at), and
// under it then; by an edge, the side with room, body or not. It stays on
// its side until that side goes wrong, so it doesn't jump about as the
// snake turns, or as it fades out.
function youSide(s, a, hy) {
  let sgn = a.youSgn || -1;
  if (s.dir.y === -sgn) sgn = -sgn; // (its neck's on that side)
  if (sgn < 0 ? hy < CELL * 2.6 : hy > SIZE - CELL * 2.6) sgn = -sgn; // (no room for it there)
  return (a.youSgn = sgn);
}
// A bouncing arrow over a head (under it, sgn 1: see youSide) with a
// label in the snake's colour; scale 1 for yours.
function marker(hx, hy, sgn, col, label, scale, t) {
  const c = CELL * scale;
  const bob = Math.sin(t * 5) * c * 0.18, tip = hy + sgn * (CELL * 0.9 + Math.abs(bob)), aw = c * 0.55, ah = c * 0.6;
  ctx.fillStyle = '#fffbea';
  ctx.strokeStyle = INK;
  ctx.lineWidth = c * 0.07;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(hx, tip);
  ctx.lineTo(hx - aw, tip + sgn * ah);
  ctx.lineTo(hx - aw * 0.42, tip + sgn * ah);
  ctx.lineTo(hx - aw * 0.42, tip + sgn * ah * 1.7);
  ctx.lineTo(hx + aw * 0.42, tip + sgn * ah * 1.7);
  ctx.lineTo(hx + aw * 0.42, tip + sgn * ah);
  ctx.lineTo(hx + aw, tip + sgn * ah);
  ctx.closePath();
  ctx.stroke(); ctx.fill();
  ctx.font = markerFont(Math.round(c * (label === 'YOU' ? 0.85 : 0.62)));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ly = tip + sgn * (ah * 1.7 + c * 0.6), half = Math.min(SIZE / 2, ctx.measureText(label).width / 2 + 4), lx = Math.min(SIZE - half, Math.max(half, hx));
  ctx.lineWidth = c * 0.16; ctx.strokeStyle = 'rgba(58,38,20,0.9)'; ctx.strokeText(label, lx, ly);
  ctx.fillStyle = col; ctx.fillText(label, lx, ly);
}
const markerFonts = new Map(); // size -> font (a size or two: no string built per frame)
function markerFont(px) {
  let f = markerFonts.get(px);
  if (!f) markerFonts.set(px, f = `700 ${px}px Fredoka, system-ui, sans-serif`);
  return f;
}

// A jump or a flash that can't go: a quick inked × on what it couldn't hop
// (or where it would have gone), in the press's own accent (sky for a
// jump, ember for a flash), so the press shows as heard, and refused (yours
// only: it answers your press, as the thunk does). It pops in; with
// reduced motion it's simply there. Both fade.
const REFUSE_MS = 320, REFUSE_REACH = CELL * 0.24 + 3.75; // (how far its arms and their ink reach from its middle, once it's popped in)
const refusal = { x: 0, y: 0, at: -1e9, tick: -1, flash: false };
function drawRefusal(now) {
  const t = (now - refusal.at) / REFUSE_MS;
  if (t < 0 || t >= 1) return;
  const x = refusal.x, y = refusal.y, d = CELL * 0.24 * (reduced ? 1 : 1 + 0.4 * Math.max(0, 1 - t * 5));
  ctx.globalAlpha = t < 0.6 ? 1 : (1 - t) / 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
  ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d);
  ctx.strokeStyle = INK; ctx.lineWidth = 7.5; ctx.stroke();
  ctx.strokeStyle = refusal.flash ? EMBER : SKY; ctx.lineWidth = 3.6; ctx.stroke();
  ctx.globalAlpha = 1;
}

// Call after every tick, with that tick's events: sets off pops, gulps and puffs.
function onTick(events) {
  if (!game) return;
  const now = lastNow || performance.now(); // the frame clock, like everything else drawn
  if (game.time !== timeAt) { // (the drawn clock eases from the last tick's time to this one's: from a tick ago, not across a jump)
    timeFrom = game.time > timeAt && game.time - timeAt < 1000 ? timeAt : game.time;
    timeAt = game.time;
  }
  if (tickNow) tickEvery += (Math.max(0, Math.min(1000, now - tickNow)) - tickEvery) * 0.3; // (see prebuild)
  tickNow = now;
  for (let i = scurries.length - 1; i >= 0; i--) if (scurries[i].tick < game.tick) scurries.splice(i, 1); // (a tick's own: see drawBeetle)
  for (let i = bugPops.length - 1; i >= 0; i--) if (bugPops[i].tick < game.tick) bugPops.splice(i, 1);
  for (const e of events) {
    if (e.type === 'eat') {
      let x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
      const a = animOf(e.snake, now);
      if (e.kind !== 'mushroom') {
        a.gulps[a.gulpAt] = game.tick - 1; a.gulpAt = (a.gulpAt + 1) % 4;
        // Gobbler (and Capricious in a Gobbler mood) wolfs it down: a big gulp, cheeks puffed.
        const big = lookOf(e.snake) === 'gobbler';
        a.gulpR = big ? T.GOBBLE : T.GULP;
        a.gulpW = big ? T.GOBBLE_LENGTH : T.GULP_LENGTH;
      }
      a.ateAt = now; // every bite: the head squashes and the mouth chews
      x += e.snake.dir.x * CELL * 0.5; // the crumbs fly from the mouth, not over the face
      y += e.snake.dir.y * CELL * 0.5;
      if (e.kind === 'golden') spawn(x, y, T.PARTICLES_EAT + 6, 220, T.PARTICLE_LIFE, 3.2, '#fde68a', '#fbbf24');
      else if (e.kind === 'beetle') spawn(x, y, T.PARTICLES_EAT + (e.gold ? 10 : 4), e.gold ? 240 : 200, T.PARTICLE_LIFE, 3, e.gold ? '#fde68a' : '#059669', e.gold ? '#d4a017' : '#fbbf24'); // emerald and gold, a crunchy catch (a golden one: a burst of Honey, a power's gold)
      else if (e.kind === 'pellet') spawn(x, y, T.PARTICLES_EAT - 4, 150, T.PARTICLE_LIFE * 0.8, 2.6, beadFill(e), '#f6ecd2'); // (the bead's own colour, as it was drawn)
      else if (e.kind === 'mushroom') { // poison: a puff of spores, and it goes queasy green for a moment
        spawn(x, y, T.PARTICLES_EAT - 2, 160, T.PARTICLE_LIFE, 2.6, '#c084fc', '#84cc16');
        a.queasyAt = now;
      }
      else spawn(x, y, T.PARTICLES_EAT, 180, T.PARTICLE_LIFE, 2.8, '#a3e635', '#f6ecd2'); // sprout and parchment: visible on bark and on green snakes alike (gold means a power)
      eatenNow.add(e.y * GRID + e.x);
      if (e.snake.id === viewerId && e.kind !== 'mushroom') floater(e.x * CELL + CELL / 2, Math.max(CELL * 1.3, e.y * CELL - CELL * 0.6), GROWN[e.kind === 'golden' ? T.GOLDEN_GROWTH : e.kind === 'beetle' ? T.BEETLE_GROWTH : e.cooked ? T.COOKED_GROWTH : 1] || '+1');
    } else if (e.type === 'choke') { // gagged on its own bead: a quick puff of its cheeks, and the bead spat aside (then it coughs: see drawCough)
      animOf(e.snake, now).chokeAt = now;
      moveFood(e.x, e.y, e.tx ?? e.x, e.ty ?? e.y, now, true, false, e.snake);
    } else if (e.type === 'nudge') { // food its coughing head reached, nudged aside: it rolls there, or a beetle scurries
      if (e.kind === 'beetle') scurries.push({ x: e.x, y: e.y, tx: e.tx ?? e.x, ty: e.ty ?? e.y, tick: game.tick });
      else moveFood(e.x, e.y, e.tx ?? e.x, e.ty ?? e.y, now, false);
    } else if (e.type === 'knock') { // the woodpecker's strike knocks food out of its patch: it flies to where the rule says, in an arc as high and long as the throw (see knockFly), and a beetle scurries there; with nowhere to go, the bird has it
      const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
      if (e.tx == null || e.ty == null) { eatenNow.add(e.y * GRID + e.x); spawn(x, y, 8, 160, 420, 2.2, e.kind === 'beetle' ? '#059669' : '#c08a4a', '#f6ecd2'); }
      else if (e.kind === 'beetle') scurries.push({ x: e.x, y: e.y, tx: e.tx, ty: e.ty, tick: game.tick });
      else moveFood(e.x, e.y, e.tx, e.ty, now, true, true);
    } else if (e.type === 'death') {
      deaths.push(e.snake); // bursts on the next frame, unless the moment is held
      noteRemains(e.snake, now);
      // A comic-book word where it went down, one that means out (Bonk! is
      // for knocks it survives): KO! if a snake did it, Fwoosh! in the fire,
      // Boom! for a dash with nowhere to go, Crunch! for the rest.
      const k = e.snake.killer, h = e.snake.body[0];
      if (!reduced && e.snake.killerId === viewerId && e.snake.id !== viewerId && e.snake.killer !== 'self') shake(3); // (your kill: you feel it)
      const word = k === 'fire' ? 'Fwoosh!' : e.snake.fatal === 'boom' ? 'Boom!' : k === 'wall' || k === 'self' || e.snake.killerId == null ? 'Crunch!' : 'KO!';
      if (k !== 'hunger') floater(h.x * CELL + CELL / 2, Math.max(CELL * 1.3, h.y * CELL - CELL * 0.2), word);
    } else if (e.type === 'crash') { // a bonk where it hit, the head's lunge, and its tail breaking off as beads
      const s = e.snake, a = animOf(s, now), h = s.body[0];
      a.crashAt = now; a.crashDx = s.dir.x; a.crashDy = s.dir.y;
      if (s.id === viewerId && pressSeen.stun < 0) pressSeen.dir = null; // (what you'd pressed was for a board that's gone, as the game says)
      // (its tail breaks off as beads in its own markings, last segment last)
      const prev = s.prev || [];
      for (let i = s.body.length; i < s.body.length + e.lost && i < prev.length; i++) {
        const key = prev[i].y * GRID + prev[i].x;
        if (!born.has(key)) born.set(key, { kind: 'pellet', at: now + (i - s.body.length) * RIPPLE_MS, i, next: 0, gen: bornGen, v: beadOf(s, i) });
      }
      const px = (h.x + 0.5 + s.dir.x * 0.5) * CELL, py = (h.y + 0.5 + s.dir.y * 0.5) * CELL;
      const other = e.killerId != null ? game.snakes[e.killerId] : null, col = other ? colorOf(other) : '', bow = other && bowOf(other);
      if (bow) spawnBow(px, py, 12, 220, 480, 2.6, bow); // (a rainbow's in its colours: see burst)
      else if (other && col[0] === '#') spawn(px, py, 12, 220, 480, 2.6, col, '#fffbea');
      else spawn(px, py, 12, 220, 480, 2.6, '#c08a4a', '#3b2412'); // (chips of bark)
      // Bonk! at the point of impact, and your -N over your head, behind
      // it, each kept clear of the stars, a refused leap's × and the edges:
      // - with the stars or the × on the point of impact, or no room there
      //   for the word, Bonk! steps aside (heading up or down, to the
      //   roomier side; heading across, away from the stars);
      // - with no room there to rise and stay on the board, it goes beside
      //   the head instead, a little further out (along the row, heading across);
      // - and a -N the top edge would push down (onto Bonk!, the neck and
      //   the stars, where they read as one word) goes under Bonk!.
      const hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2, dx = s.dir.x, dy = s.dir.y, side = hx < SIZE / 2 ? 1 : -1;
      const stars = starsOff(s), refused = s.id === viewerId && refusal.tick === game.tick, half = floatHalfOf('Bonk!');
      let bx = px + dx * CELL * 0.4, by = py + dy * CELL * 0.4;
      if (dy && (refused || (stars < 0) === (dy < 0))) bx += side * CELL * 1.2;
      else if (dx && (refused || bx < half || bx > SIZE - half)) by += stars < 0 ? CELL : -CELL;
      if (by < FLOAT_TOP || by > FLOAT_LOW) {
        const on = dx && hx + dx * CELL * 1.9 > half && hx + dx * CELL * 1.9 < SIZE - half; // (room on along the row)
        bx = hx + (dx ? (on ? dx : -dx) : side) * CELL * 1.9;
        by = Math.min(FLOAT_LOW, Math.max(FLOAT_TOP, hy));
      }
      floater(bx, by, 'Bonk!');
      if (s.id === viewerId) {
        if (e.lost >= 1 && e.lost <= 3) {
          const under = hy - CELL * 1.9 < FLOAT_TOP;
          floater(under ? bx : hx - dx * CELL * 1.2, under ? by + CELL * 0.85 : hy - CELL * 1.9, '-' + e.lost);
        }
        if (!reduced) shake(4);
      }
    } else if (e.type === 'fizzle') { // asked to jump or flash, and it couldn't: refused, on what it couldn't hop (and then ran into), or where it would have gone
      const s = e.snake;
      if (s.id === viewerId) {
        refusal.flash = !!e.flash;
        // The cell it faced, as the engine saw it (a stunned snake's
        // auto-turn has turned it since). Off the board, at the edge it
        // faced: on the edge, its whole ink just inside (never wrapped
        // round to the far side for a snake that doesn't wrap: the
        // engine wraps it for one that does).
        const h = s.prev?.[0] || s.body[0], cx = e.x ?? h.x + s.dir.x, cy = e.y ?? h.y + s.dir.y, m = REFUSE_REACH;
        refusal.x = Math.min(SIZE - m, Math.max(m, cx * CELL + CELL / 2));
        refusal.y = Math.min(SIZE - m, Math.max(m, cy * CELL + CELL / 2));
        refusal.at = now; refusal.tick = game.tick;
      }
    } else if (e.type === 'leap') { // up and over (see liftOf): puffs of dust kicked back where it took off (and gold, for a golden leap)
      const a = animOf(e.snake, now), h = e.snake.body[e.reach || 1] || e.snake.body[0];
      hopped(e.snake, e, now);
      a.leapUntil = game.tick + e.snake.body.length + 1; // (until the arch has run off its tail)
      spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 8, 140, 420, 2.2, '#d6b480', '#c08a4a'); // (bark dust: the plain leap's no power)
      dustPuffs(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, e.snake.dir.x, e.snake.dir.y);
      if (e.gold) spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 10, 120, 600, 1.8, '#d4a017', '#fffbea'); // (in Honey, a power's gold)
    } else if (e.type === 'dash') { // a streak along the way it went: a golden dash's in gold and ember, with flecks of both; a plain flash's in ember, lighter
      const da = animOf(e.snake, now);
      da.dashTick = game.tick;
      da.bursts++; da.burstAt = now; // (a rainbow's colours burst on: see bowHue)
      if (e.plain && lookOf(e.snake) === 'star') animOf(e.snake, now).flareAt = now; // (Star's flash spent: its twinkles burst off its points as they go dim, see drawStarHead)
      const h = e.snake.body[0], seen = streaks.findIndex(k => k.s === e.snake && k.pre === game.tick - 1); // (seen coming: see prepare)
      if (seen >= 0 && streaks[seen].fx === e.x && streaks[seen].fy === e.y && streaks[seen].tx === h.x && streaks[seen].ty === h.y) { streaks[seen].pre = -1; sparksOf(streaks[seen]); } // (as it was seen: it stays, and now its flecks fly)
      else { if (seen >= 0) streaks.splice(seen, 1); streakOf(e.snake, e.x, e.y, h.x, h.y, !!e.plain, now, -1); }
    } else if (e.type === 'douse') { // a fire put out: a hiss of steam
      const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
      spawn(x, y, 10, 80, 600, 2.4, '#e2e8f0', '#94a3b8');
      if (!reduced) for (let k = 0; k < 4; k++) mote(x + (Math.random() - 0.5) * CELL * 0.6, y, (Math.random() - 0.5) * 12, -20 - Math.random() * 14, 1200, 4 + Math.random() * 3, 2);
    } else if (e.type === 'cut') { // a golden flash (a dash) cut through it (the woodpecker's cuts, its "Ouch!", went in round four)
      floater(e.x * CELL + CELL / 2, Math.max(CELL * 1.3, e.y * CELL - CELL * 0.2), e.by != null ? 'Snip!' : 'Ouch!');
      if (e.by != null) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 12, 220, 500, 2.4, '#d4a017', e.snake.color || '#fffbea');
    } else if (e.type === 'alight') { // crawled into the fire: a burst of flame
      const h = e.snake.body[0];
      spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 14, 200, 520, 2.6, '#f97316', '#fde047');
    } else if (e.type === 'singe') { // a piece falls off in the flames
      const tl = e.snake.body[e.snake.body.length - 1];
      spawn(tl.x * CELL + CELL / 2, tl.y * CELL + CELL / 2, 6, 120, 420, 2.2, '#f97316', '#78716c');
      if (e.snake.id === viewerId) floater(e.snake.body[0].x * CELL + CELL / 2, Math.max(CELL * 1.3, e.snake.body[0].y * CELL - CELL * 1.1), '-1');
    } else if (e.type === 'baked') { // done: a puff of steam and a glint
      const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
      for (let i = 0; i < 4; i++) mote(x + (Math.random() - 0.5) * CELL * 0.4, y - CELL * 0.2, (Math.random() - 0.5) * 10, -20 - Math.random() * 10, 1200, 2.5, 4);
      spawn(x, y, 6, 120, 420, 2, '#fdba74', '#fffbea');
    } else if (e.type === 'ash') { // burnt to nothing: grey ash and smoke
      const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2;
      eatenNow.add(e.y * GRID + e.x);
      spawn(x, y, 10, 140, 600, 2.4, '#a8a29e', '#57534e');
      for (let i = 0; i < 3; i++) mote(x, y - CELL * 0.2, (Math.random() - 0.5) * 8, -16, 1400, 3, 2);
    } else if (e.type === 'rot') { // rotted away: a brown puff (a bead, in its own colour)
      spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 8, 110, 460, 2.2, e.kind === 'pellet' ? beadFill(e) : '#8a6a2a', '#57534e');
    } else if (e.type === 'peck') { // a chunk comes out: chips flying from every cell, and a thump
      for (const k of e.cells || []) spawn((k % GRID) * CELL + CELL / 2, Math.floor(k / GRID) * CELL + CELL / 2, 4, 240, 520, 2.8, '#c08a4a', '#3b2412');
      if (e.cells?.length && !reduced) shake(5);
    } else if ((e.type === 'spawn' && e.kind === 'beetle') || e.type === 'emerge') {
      bugPops.push({ x: e.x, y: e.y, tick: game.tick, at: now }); // (it pops out of its burrow, kicking up a little sawdust)
      if (e.x >= 0) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 6, 110, 420, 2, '#d6b480', '#a16207');
    } else if (e.type === 'dig') { // a cornered beetle digs in: sawdust bursts off it (and sprays while it digs: see drawDig)
      if (!reduced) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 8, 140, 420, 2, '#e6cc96', '#b07d48');
    } else if (e.type === 'dive') { // down its burrow, or the bore it dug
      let b = null;
      for (const o of bugs) if (Math.abs(o.x - e.x) + Math.abs(o.y - e.y) <= (b ? 0 : 1)) b = o; // (where it went in, or beside it)
      dives.push({ x: e.x, y: e.y, at: now, ang: b?.ang ?? 0, gold: b ? b.gold : !!e.gold, dug: e.dug ? Math.max(0.3, b?.dig || DIG_STILL) : 0 });
      spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 6, 110, 420, 2, '#d6b480', '#a16207');
    } else if (e.type === 'burrow') { // cracked open (bark chips), or left by a dig (pale sawdust: it's freshly bored, see drawFresh)
      if (e.dug) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 10, 150, 520, 2.2, '#f2e2bb', '#d9b77c');
      else spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 12, 170, 520, 2.4, '#d6b480', '#3b2412');
    } else if (e.type === 'heal') { // one closing over: sawdust and moss fill it, and it fades into the bark (see drawHeals)
      const key = e.y * GRID + e.x;
      heals.push({ x: e.x, y: e.y, at: now, v: BURROW_LOOKS[key % 4], cs: crackSprites.get(key) || null });
      crackSprites.delete(key); burrowSeen.delete(key); // (a burrow opening there again cracks and pops anew)
      if (!reduced) spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 6, 80, 420, 1.8, '#e6cc96', '#3a5520');
    } else if (e.type === 'gust' && e.x >= 0) { // an apple knocked loose: it drops in
      born.set(e.y * GRID + e.x, { kind: 'food', at: now, i: 0, next: 0, gen: bornGen, v: '', fell: true });
    } else if (e.type === 'strike') {
      const x = e.x * CELL + CELL / 2, y = e.y * CELL + CELL / 2, pts = [[x + (Math.random() - 0.5) * CELL * 6, -CELL]];
      for (let i = 1; i < 9; i++) { const f = i / 9; pts.push([pts[0][0] + (x - pts[0][0]) * f + (Math.random() - 0.5) * CELL * 1.6 * (1 - f), -CELL + (y + CELL) * f]); }
      pts.push([x, y]);
      bolt = { pts, at: now };
      flashAt = now;
      if (!reduced) { shake(3); spawn(x, y, 14, 260, 520, 2.6, '#fde047', '#f5f3ff'); }
    } else if (e.type === 'ember') {
      embers.push({ fx: e.fx, fy: e.fy, x: e.x, y: e.y, at: now });
    } else if (e.type === 'rainbow') {
      rainbow = { x: e.x, y: e.y, at: now };
    } else if (e.type === 'flown') { // a beetle nobody caught takes off
      spawn(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 8, 260, T.PARTICLE_LIFE * 1.2, 2.2, '#d1fae5', '#059669');
    }
  }
}

// A dead snake bursts into meat, or with reduced motion fades over its meat.
// When the game holds the moment (your death), the snakes that died on that
// tick keep their pose, eyes screwed shut and covering their meat, until the
// hold ends. corpses: { s, until (burst/fade time), fade (true once fading) }.
const deaths = [], corpses = [];
const FADE_MS = T.CORPSE_FADE_MS;
const heldCells = new Uint8Array(GRID * GRID);

function holdFor(until) {
  for (const s of deaths) corpses.push({ s, until, fade: false });
  deaths.length = 0;
}

// Out: it goes off with a pop. A comic starburst and a shockwave ring in
// its colour at its head (both inked, like everything else on the board), a
// burst of pieces from the head and along the body, and smoke. A rainbow
// (Star's, or Copycat's copy of it) goes off in its colours: the ring in
// six arcs round the rainbow, the pieces in pairs of them (in Star's
// stand-in colour in text, the ring and the pieces were gold and cream, a
// golden pickup's).
const blasts = []; // { x, y, at, color, bow (a rainbow's ramps, by hue, or null) }
function burst(s) {
  const col = colorOf(s), hex = col[0] === '#' ? col : '#f6ecd2', h = s.body[0], bow = bowOf(s);
  const hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2;
  blasts.push({ x: hx, y: hy, at: lastNow, color: hex, bow });
  if (bow) spawnBow(hx, hy, 26, 380, T.PARTICLE_LIFE * 1.3, 3.4, bow);
  else spawn(hx, hy, 26, 380, T.PARTICLE_LIFE * 1.3, 3.4, hex, '#fffbea');
  for (let i = 1; i < s.body.length; i += 2) {
    const c = s.body[i];
    spawn(c.x * CELL + CELL / 2, c.y * CELL + CELL / 2, Math.max(2, Math.round(T.PARTICLES_DEATH / Math.ceil(s.body.length / 2))), 240, T.PARTICLE_LIFE * 1.2, 3, bow ? bow(TWINKLE_HUES[(i >> 1) % TWINKLE_HUES.length])[0] : hex, '#a16207'); // (a rainbow's in its colours, as its beads)
  }
  for (let i = 0; i < 6; i++) mote(hx + (Math.random() - 0.5) * CELL, hy + (Math.random() - 0.5) * CELL, (Math.random() - 0.5) * 30, -18 - Math.random() * 18, 1400, 4 + Math.random() * 3, 2);
}
// n pieces in a rainbow's six colours, a pair at a time.
function spawnBow(x, y, n, speed, life, size, bow) {
  for (let j = 0; j < TWINKLE_HUES.length; j += 2) spawn(x, y, Math.ceil(n / 3), speed, life, size, bow(TWINKLE_HUES[j])[0], bow(TWINKLE_HUES[j + 1])[0]);
}
const BLAST_SPAN = 5; // (cells across the starburst's sprite)
const blastSprite = () => {
  let byVariant = sprites.get('blast');
  if (!byVariant) sprites.set('blast', byVariant = new Map());
  let sp = byVariant.get('');
  if (sp) return sp;
  const size = Math.max(2, Math.round(BLAST_SPAN * CELL * k));
  sp = makeLayer(size, size);
  const g = sp.getContext('2d'), scale = size / (BLAST_SPAN * CELL);
  g.setTransform(scale, 0, 0, scale, size / 2, size / 2);
  const burstPath = (r0, r1, n, twist) => { // (a star of n uneven points)
    g.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * TAU + twist, r = i % 2 ? r0 : r1 * (0.8 + 0.2 * ((i * 7) % 5) / 4);
      if (i) g.lineTo(Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
  };
  g.lineJoin = 'round';
  burstPath(CELL * 1.25, CELL * 2.2, 11, 0.2);
  g.fillStyle = '#fb923c'; g.fill();
  g.lineWidth = CELL * 0.1; g.strokeStyle = '#3a2614'; g.stroke();
  burstPath(CELL * 0.8, CELL * 1.45, 9, 0.5);
  g.fillStyle = '#fed7aa'; g.fill(); // (pale orange: gold means a power)
  burstPath(CELL * 0.35, CELL * 0.75, 7, 0.9);
  g.fillStyle = '#fffbea'; g.fill();
  byVariant.set('', sp);
  return sp;
};
function drawBlasts(now) {
  for (let i = blasts.length - 1; i >= 0; i--) {
    const b = blasts[i], t = (now - b.at) / 480;
    if (t >= 1 || t < 0) { blasts.splice(i, 1); continue; }
    const grow = reduced ? 0.5 : t, pop = reduced ? 1 : 1 - (1 - Math.min(1, t * 2.5)) ** 3; // (it bursts out fast, then holds; with reduced motion, it's simply there, fading)
    const w = BLAST_SPAN * CELL * (0.5 + 0.55 * pop);
    ctx.globalAlpha = t < 0.55 ? 1 : (1 - t) / 0.45;
    ctx.drawImage(blastSprite(), b.x - w / 2, b.y - w / 2, w, w);
    ctx.globalAlpha = 1 - t; // the shockwave: an ink ring under one in its colour (a rainbow's: six arcs round it)
    const rr = CELL * (0.6 + 3.3 * grow);
    ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, TAU);
    ctx.strokeStyle = '#3a2614';
    ctx.lineWidth = 8 * (1 - t) + 3;
    ctx.stroke();
    ctx.lineWidth = 8 * (1 - t);
    if (b.bow) {
      ctx.lineCap = 'butt';
      for (let j = 0; j < TWINKLE_HUES.length; j++) {
        const a0 = (j / TWINKLE_HUES.length - 0.25) * TAU;
        ctx.beginPath(); ctx.arc(b.x, b.y, rr, a0, a0 + TAU / TWINKLE_HUES.length);
        ctx.strokeStyle = b.bow(TWINKLE_HUES[j])[0];
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = b.color;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

// While the edges wrap round for someone: a warm gold seam inside the
// frame, with two glints running round it, and bright by a wrapping head
// (fading calmly over the last WRAP_WARN_MS).
const edgeAt = [0, 0]; // (scratch: a point round the seam)
function alongEdge(d, inset) { // d px round the seam, clockwise from the top-left corner
  const L = SIZE - 2 * inset, p = ((d % (4 * L)) + 4 * L) % (4 * L);
  if (p < L) { edgeAt[0] = inset + p; edgeAt[1] = inset; }
  else if (p < 2 * L) { edgeAt[0] = SIZE - inset; edgeAt[1] = inset + p - L; }
  else if (p < 3 * L) { edgeAt[0] = SIZE - inset - (p - 2 * L); edgeAt[1] = SIZE - inset; }
  else { edgeAt[0] = inset; edgeAt[1] = SIZE - inset - (p - 3 * L); }
  return edgeAt;
}
function drawWrapEdges(now) {
  let any = 0;
  for (const s of game.snakes) if (s.alive && s.wrapUntil > shownTime) any = Math.max(any, Math.min(1, (s.wrapUntil - shownTime) / T.WRAP_WARN_MS));
  if (!any) return;
  const inset = 3, run = 4 * (SIZE - 2 * inset);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = rgba('#d4a017', 0.5 * any);
  ctx.strokeRect(inset, inset, SIZE - 2 * inset, SIZE - 2 * inset);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = rgba('#fde68a', 0.75 * any);
  ctx.strokeRect(inset, inset, SIZE - 2 * inset, SIZE - 2 * inset);
  // Two glints, opposite each other, running round with a fading tail.
  const head = reduced ? run * 0.1 : (now / 1000) * CELL * 6, tail = CELL * 2.4, STEPS = 8;
  ctx.lineWidth = 2.5;
  for (let g = 0; g < 2; g++) {
    for (let i = 0; i < STEPS; i++) {
      const d0 = head + g * run / 2 - tail * (1 - i / STEPS), d1 = d0 + tail / STEPS;
      ctx.globalAlpha = any * (i + 1) / STEPS;
      ctx.strokeStyle = '#fffbea';
      ctx.beginPath();
      const p0 = alongEdge(d0, inset); ctx.moveTo(p0[0], p0[1]);
      const p1 = alongEdge(d1, inset); ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (const s of game.snakes) { // (by a wrapping head: a glow on the edge it's near)
    if (!s.alive || !(s.wrapUntil > shownTime)) continue;
    const h = s.body[0], hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2;
    edgeGlow(0, hy, h.x, any); edgeGlow(SIZE, hy, GRID - 1 - h.x, any);
    edgeGlow(hx, 0, h.y, any); edgeGlow(hx, SIZE, GRID - 1 - h.y, any);
    ctx.globalAlpha = 1;
  }
}
// The glow at (ex, ey) on the edge, for a wrapping head d cells from it.
function edgeGlow(ex, ey, d, any) {
  if (d > 3) return;
  const w = SPRITE * CELL * (1.6 - d * 0.3);
  ctx.globalAlpha = 0.7 * any * (1 - d / 4);
  ctx.drawImage(glowSprite(), ex - w / 2, ey - w / 2, w, w);
}

const len3 = (x, y) => Math.hypot(x, y) || 1;
// A dash's streak, under the snakes (over the dasher it ran a line through
// its face): a speed line down each side, from where it started to the
// back of its head, inked so it reads on the bark, tapering back to the
// start; gone in a moment. The lines run just clear of everything drawn
// round the dasher's body (its outline, a gold line), which used to cover
// them. (A wedge of honey light between them is gone: where it showed past
// the body, it was a translucent khaki block, cut square by the head.) A
// golden dash's lines are gold with an ember core; a plain flash's are
// ember, thinner, inked more faintly and shorter (from a third of the
// way), so the golden one is the bigger deal.
const streaks = []; // { x0, y0, x1, y1, at, s, plain, fx, fy, tx, ty (its cells), pre (seen coming on that tick, until it goes) }
const STREAK_GAP = 2; // (between the dasher's drawn edge and a line's inked edge, in units)
// A dash's streak from cell (fx, fy) to (tx, ty): at its tick, with its
// flecks and the scuff where it set off; or (pre: that tick) as soon as
// it's drawn there, seen coming, its flecks and scuff once it's gone (a
// guess put right, or that didn't go, leaves none: see unstreak).
function streakOf(s, fx, fy, tx, ty, plain, now, pre) {
  const x0 = fx * CELL + CELL / 2, y0 = fy * CELL + CELL / 2, x1 = tx * CELL + CELL / 2, y1 = ty * CELL + CELL / 2;
  if (Math.abs(x1 - x0) + Math.abs(y1 - y0) > CELL * (T.DASH_LENGTH + 0.5)) return; // (not across a wrapped edge)
  const k = { x0, y0, x1, y1, at: now, s, plain, fx, fy, tx, ty, pre };
  streaks.push(k);
  if (pre < 0) sparksOf(k);
}
function sparksOf({ x0, y0, x1, y1, plain }) {
  for (let k = 0; k <= 3; k++) spawn(x0 + (x1 - x0) * k / 3, y0 + (y1 - y0) * k / 3, plain ? 2 : 4, 90, 500, 1.8, plain ? EMBER : HONEY, plain ? GLINT : EMBER);
  if (!reduced) for (let k = 0; k < 4; k++) mote(x0 + (Math.random() - 0.5) * CELL * 0.6, y0 + (Math.random() - 0.5) * CELL * 0.6, -(x1 - x0) / len3(x1 - x0, y1 - y0) * 20 + (Math.random() - 0.5) * 10, -(y1 - y0) / len3(x1 - x0, y1 - y0) * 20 - 6, 700, 3 + Math.random() * 2, 2); // (a scuff of dust where it set off)
}
// A streak seen coming this tick that won't go as seen: gone.
function unstreak(s) {
  for (let i = streaks.length - 1; i >= 0; i--) if (streaks[i].s === s && streaks[i].pre === game.tick) streaks.splice(i, 1);
}
function drawStreaks(now) {
  for (let i = streaks.length - 1; i >= 0; i--) {
    const k = streaks[i], t = (now - k.at) / T.STREAK_MS;
    if (t >= 1 || t < 0 || (k.pre >= 0 && k.pre < game.tick)) { streaks.splice(i, 1); continue; } // (or seen coming, and it didn't go)
    const dx = k.x1 - k.x0, dy = k.y1 - k.y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const ex = k.x1 - ux * CELL * 0.35, ey = k.y1 - uy * CELL * 0.35; // (the back of its head)
    const sx = k.plain ? k.x0 + (ex - k.x0) * 0.35 : k.x0, sy = k.plain ? k.y0 + (ey - k.y0) * 0.35 : k.y0; // (where its lines start)
    const speedLine = (off, w, over) => { // (pointed at both ends, widest near the head; `over` runs it a touch past them, for its ink)
      const mx = sx + (ex - sx) * 0.8, my = sy + (ey - sy) * 0.8;
      ctx.moveTo(sx - ux * over + nx * off, sy - uy * over + ny * off);
      ctx.lineTo(mx + nx * (off + w), my + ny * (off + w));
      ctx.lineTo(ex + ux * over + nx * off, ey + uy * over + ny * off);
      ctx.lineTo(mx + nx * (off - w), my + ny * (off - w));
      ctx.closePath();
    };
    const a = anim.get(k.s), w = CELL * (k.plain ? 0.085 : 0.1) * (1 - 0.5 * t), ink = 1.4;
    const side = CELL * 0.44 + (a ? edgeOf(k.s, a) : 0) + STREAK_GAP + ink + w; // (the body's half-width by the neck, and what's drawn round it)
    ctx.fillStyle = rgba('#3a2614', (k.plain ? 0.7 : 0.8) * (1 - t));
    ctx.beginPath(); speedLine(-side, w + ink, ink * 2); speedLine(side, w + ink, ink * 2); ctx.fill();
    ctx.fillStyle = rgba(k.plain ? EMBER : HONEY, 0.95 * (1 - t));
    ctx.beginPath(); speedLine(-side, w, 0); speedLine(side, w, 0); ctx.fill();
    if (k.plain) continue;
    ctx.fillStyle = rgba(EMBER_LINE, 0.9 * (1 - t)); // (the ember core)
    ctx.beginPath(); speedLine(-side, w * 0.4, -len * 0.25); speedLine(side, w * 0.4, -len * 0.25); ctx.fill();
  }
}

// Before drawing: unheld deaths burst; held ones whose time is up burst or
// start fading. (With reduced motion a dead snake fades over its beads
// under a still starburst: no pieces fly, and nothing grows.)
function updateCorpses(now) {
  for (const s of deaths) {
    burst(s);
    if (reduced) corpses.push({ s, until: now, fade: true });
  }
  deaths.length = 0;
  heldCells.fill(0);
  for (let i = corpses.length - 1; i >= 0; i--) {
    const c = corpses[i];
    if (!c.fade && now >= c.until) {
      burst(c.s);
      if (reduced) c.fade = true;
      else { corpses.splice(i, 1); continue; }
    }
    if (c.fade && now >= c.until + FADE_MS) { corpses.splice(i, 1); continue; }
    if (!c.fade) for (const b of c.s.body) heldCells[b.y * GRID + b.x] = 1;
  }
}

// Held corpses are drawn at the frame's own point in the tick (a snake that
// starved moved before it died), the head pressed into what it hit, with a spark.
function drawCorpses(alpha, now) {
  for (const c of corpses) {
    const opacity = c.fade ? Math.max(0, 1 - (now - c.until) / FADE_MS) : 1;
    const hit = !c.fade && c.s.killer !== 'hunger';
    ctx.globalAlpha = opacity;
    const a = prepare(c.s, c.s.prev ? alpha : 1, now, true, hit ? 0.2 : 0);
    for (const [ox, oy] of a.offs || OFFS) { // (across a wrapped edge: each place it shows)
      if (ox || oy) ctx.translate(ox, oy);
      drawShadow(a);
      drawOutline(c.s, a);
      drawBody(c.s, a, now, true);
      if (ox || oy) ctx.translate(-ox, -oy);
    }
    ctx.globalAlpha = 1;
    if (hit) { // at the point of contact, kept on the board
      const sx = Math.min(SIZE, Math.max(0, a.pts[0] + c.s.dir.x * CELL * 0.55));
      const sy = Math.min(SIZE, Math.max(0, a.pts[1] + c.s.dir.y * CELL * 0.55));
      blitCrisp(starSprite(), sx, sy);
    }
  }
  ctx.globalAlpha = 1;
}

// Confetti: for a win, a new best (all over the board), or the winner of a
// round you're watching (from its head).
const CONFETTI = ['#f6ecd2', '#a3e635', '#f472b6', '#7dd3fc', '#fb923c', '#c4b5fd', '#84cc16']; // (the board's own colours: parchment, leaf, petal, sky, orange, lilac; no gold: gold means a power)
function celebrate(s = null) {
  if (reduced) return;
  if (s && s.body.length) {
    const h = s.body[0];
    for (let i = 0; i < 4; i++) spawn(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, 9, 320, T.PARTICLE_LIFE * 3, 4.4, CONFETTI[i], CONFETTI[i + 3], 1);
    return;
  }
  for (let i = 0; i < 12; i++) spawn((i + 0.5) / 12 * SIZE, SIZE * (0.25 + (i % 3) * 0.12), 9, 400, T.PARTICLE_LIFE * 4, 5.6, CONFETTI[i % CONFETTI.length], CONFETTI[(i + 3) % CONFETTI.length], 1);
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

// Size the backing store to the board's real size × devicePixelRatio.
// cssPx comes from a ResizeObserver, so no layout is read here.
// The backing store matches the device pixels the canvas covers exactly, so
// the browser never resamples it (devicePx comes from the ResizeObserver
// where supported). It's capped at MAX_BACKING pixels across (a large board
// on a dense screen), not at a density, so small dense phones stay crisp.
const MAX_BACKING = 2048;
// Quality: 2 everything; 1 no canopy shadows or second rain sheet, and at
// most 1.5 device pixels per CSS pixel; 0 also no falling leaves, at 1.
// (The game lowers it, for good, if this device keeps dropping frames.)
let quality = 2, lastCss = 0, lastDevice = 0;
function setQuality(q) {
  if (q === quality) return;
  quality = q;
  if (lastCss) resize(lastCss, lastDevice, true);
}
function resize(cssPx, devicePx, force = false) {
  lastCss = cssPx; lastDevice = devicePx;
  const dpr = Math.min(window.devicePixelRatio || 1, quality === 2 ? 99 : quality === 1 ? 1.5 : 1);
  const estimate = Math.round(cssPx * dpr);
  const exact = devicePx && quality === 2 && Math.abs(devicePx - estimate) <= 2 ? devicePx : estimate;
  const target = Math.max(GRID, Math.min(MAX_BACKING, exact));
  if (target === canvas.width && sized && !force) return false;
  sized = true;
  devPerCss = target / cssPx;
  canvas.width = canvas.height = target;
  k = target / SIZE;
  barkLayer = null;
  rainTile = null;
  snowTile = null;
  drifts = null; // (made again at this size: stretched, they'd blur)
  sprites.clear();
  warmUp(); // (the words and the starburst, at this size)
  veinSprites.clear();
  resetStatic();
  syncHoles();
  if (next && next.k !== k) { next = null; wantNext(); } // (the next round's log, at this size)
  return true;
}

function init(opts) {
  canvas = opts.canvas;
  birdLayer = opts.birdLayer || null;
  birdG = birdLayer ? birdLayer.getContext('2d') : null;
  ctx = canvas.getContext('2d', { alpha: false });
  PERSONAS = opts.personas;
  k = canvas.width / SIZE;
  // Text sprites drawn before the font arrived get redrawn with it.
  document.fonts?.ready.then(() => { sprites.delete('float'); floatHalf.clear(); warmUp(); });
}

// The words that pop up, and a death's starburst: drawn now, not on the
// first bite or the first death (the busiest frame of a round).
const FLOAT_WORDS = ['+1', '+2', '+3', 'KO!', 'Crunch!', 'Fwoosh!', 'Boom!', 'Bonk!', 'Ouch!', 'Snip!', '-1', '-2', '-3'];
function warmUp() {
  if (!sized) return;
  for (const w of FLOAT_WORDS) floatSprite(w);
  blastSprite();
}
function setGame(g) {
  game = g;
  warmUp();
  deaths.length = 0;
  corpses.length = 0;
  pLive = 0;
  plife.fill(0);
  flife.fill(0);
  mLive = 0;
  mlife.fill(0);
  born.clear();
  eatenNow.clear();
  bornTick = -1;
  fresh = true;
  bugs.length = bugPops.length = scurries.length = dives.length = heals.length = 0;
  bugFor.clear();
  knockFor = -1; tickNow = 0;
  fallenFlags.length = 0;
  fallen.length = 0;
  nextLeaf = 0;
  crackCache.clear();
  crackSprites.clear();
  burrowSeen.clear();
  fireSeen.clear();
  scorched.length = 0;
  scorchDrawn = 0;
  scorchMask.fill(0);
  fireTick = -1;
  bolt = null; rainbow = null; flashAt = -1e9;
  blasts.length = 0;
  streaks.length = 0;
  refusal.at = -1e9; refusal.tick = -1;
  pressSeen.dir = null; pressSeen.stun = -1; pressSeen.tick = -1;
  timeFrom = timeAt = shownTime = g.time;
  resetBird(); plan.strikeAt = home.struckAt = -1; // (the woodpecker starts afresh: it comes in as it arrives, from its state)
  for (const k in sky) sky[k] = 0;
  snowCover = 0;
  embers.length = 0;
  ripples.length = 0;
  realms.clear();
  pre.ready = false; pre.key = NaN; pre.specs.length = pre.post.length = pre.todo.length = 0;
  inField.clear();
  fieldSpecs.length = 0;
  rgbaCache.clear(); // (bounded anyway: a backstop)
  trimColours(g); // (and so are these)
  drifts = null;
  // A different stretch of log each round: made ahead, if it's ready.
  if (next && next.k === k && sized) { barkSeed = next.seed; barkLayer = next.bark; shadeLayer = next.shade; }
  else { barkSeed = 1 + Math.floor(Math.random() * 2147483645); barkLayer = null; shadeLayer = null; }
  next = null;
  resetStatic();
  wantNext();
}

window.SnakeRender = {
  showYou,
  // (your jump's back, or with 'flash' your flash: its half-ring's flick; the renderer sees both itself, so this only makes sure)
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
  // (s's land's layers and the dashes as drawn, as a hash of their pixels, where they land and how big: for the tests)
  landPixels(s) {
    const r = realms.get(s), out = {};
    const hash = c => { if (!c || !c.width) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 2166136261; for (let i = 0; i < d.length; i++) h = Math.imul(h ^ d[i], 16777619); return `${c.width}x${c.height}:${h >>> 0}`; };
    if (r) { out.any = r.any; out.at = [r.X, r.Y]; out.layer = r.any ? hash(r.layer) : null; out.glow = r.any ? hash(r.glow) : null; out.shared = r.shared.length; }
    out.dash = dash.any ? [dash.X, dash.Y, hash(dash.layer)] : null;
    return out;
  },
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
