// Moving and searching ahead: my body on the board, a move scored and
// played on, and what a move that looks fatal is worth.

// A body is its first `len` cells (search bodies live in longer buffers).
function body0ToOwnFree(body, len, grow) {
  for (let j = 0; j < len; j++) ownFree[body[j].y * N + body[j].x] = len - j + grow;
}
function clearOwnFree(body, len) {
  for (let j = 0; j < len; j++) ownFree[body[j].y * N + body[j].x] = 0;
}

// While the edges wrap for me (a golden mushroom): how many steps ahead
// that still holds (ticks are about 110 ms), and a step across an edge
// (a neck on the far side) read as the one step it is.
// (setUpSearch() sets these for each decision:)
let wrapSteps, unit;
function setUpSearch() {
  wrapSteps = Math.floor((me.wrap || 0) / 130);
  unit = v => v > 1 ? -1 : v < -1 ? 1 : v;
}

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
  if (!muted) for (let b = 0; b < bugCount; b++) if (bugCell[b * BUG_SLOTS + t] === i) { caught = b; break; }
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
  for (let b = 0; b < bugCount; b++) {
    if (b === caught) { const n = b * BUG_SLOTS + t + 1; bugCell[n] = -1; bugDug[n] = -1; } else bugStep(b, t, t + 1, t, nx, ny, otherBug(b, t));
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
  if (t + 1 === mySpitAt && aim.length) {
    const ax = nx + d.x * TUNE.SPIT_REACH, ay = ny + d.y * TUNE.SPIT_REACH;
    if (inGrid(ax, ay)) { const a = ay * N + ax; for (let n = 0; n < aim.length; n += 2) if (aim[n] === a) gain += aim[n + 1]; }
  }
  for (let n = 0; n < dodge.length; n += 3) if (dodge[n] === t + 1 && dodge[n + 1] === i) gain -= dodge[n + 2];
  if (rings.length) gain -= ringRisk(i, t + 1);
  if (closeOn.length && t + 1 === steps) { // (on my way to where I'd spit from: there by the time it comes up)
    const dist = Math.abs(nx - closeOn[0]) + Math.abs(ny - closeOn[1]), late = Math.max(0, dist - (mySpitAt - t - 1));
    gain += closeOn[2] * (Math.max(0, 1 - late / 4) - 0.02 * dist);
  }
  // (A flier's ring: my head on it in time, or, farther off than the
  // search sees, on my way there by the time it counts, at the last step.)
  const coveredWas = covered;
  if (ringCover.length) {
    gain += coverAt(i, t + 1);
    covered |= coverHit;
    if (t + 1 === steps) for (let n = 0; n < ringCover.length; n += 5) {
      if (ringCover[n + 2] <= steps || covered & (1 << (n / 5))) continue;
      const lx = ringCover[n] % N, dist = Math.abs(nx - lx) + Math.abs(ny - (ringCover[n] - lx) / N), late = Math.max(0, dist - (ringCover[n + 2] - steps));
      gain += ringCover[n + 3] * Math.max(0, 1 - late / 2 - 0.02 * dist);
    }
  }
  const score = depth <= 1
    ? evaluate(nb, nlen, g, t + 1) + bonus + gain
    : search(nb, nlen, g, depth - 1, t + 1, bonus + gain);
  foodValue[i] = was;
  mute = muteWas;
  ateAt = ateBefore;
  covered = coveredWas;
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
  if (!inGrid(x, y) || !fire.has(y * N + x)) return false;
  const keep = me.grow > 0 ? me.body.length : me.body.length - 1;
  for (let j = 0; j < keep; j++) if (me.body[j].x === x && me.body[j].y === y) return false;
  for (const o of others) for (const c of o.body) if (c.x === x && c.y === y) return false;
  return true;
}
function maybeFree(x, y) {
  if (!inGrid(x, y) || holes.has(y * N + x)) return 0;
  const keep = me.grow > 0 ? me.body.length : me.body.length - 1;
  for (let j = 0; j < keep; j++) if (me.body[j].x === x && me.body[j].y === y) return 0;
  return 1000 - Math.min(999, mineFree[y * N + x]);
}
