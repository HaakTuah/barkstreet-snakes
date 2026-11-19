// The renderer (see render/core.js): the round's events and moments: what each
// tick's events set off (pops, gulps, puffs, bursts, streaks, blasts, floating
// words) and the confetti of a win.

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
  let cutBeads = GRID * GRID; const prevAt = new Map(); // (a tick's beads from cuts: no more than the board has cells, whatever a peer sends; each body's cells indexed once)
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
    } else if (e.type === 'squash') { // its own bead squashed under its head: a splat in the bead's colour that fades (see addSplat)
      eatenNow.add(e.y * GRID + e.x);
      const v = born.get(e.y * GRID + e.x)?.v, fill = v ? v.slice(0, v.indexOf('|')) : colorOf(e.snake);
      addSplat(e.x, e.y, fill[0] === '#' ? fill : '#a16207', now);
    } else if (e.type === 'spat') { // a mushroom stopped (3b+): down where it lies, off what it hit, onto a head (a green puff: poisoned), or gone
      const tx = e.x * CELL + CELL / 2, ty = e.y * CELL + CELL / 2;
      spitStopped(e, now);
      if (e.lx != null) moveFood(e.fx, e.fy, e.lx, e.ly, now, true);
      else if (e.hit >= 0) {
        spawn(tx, ty, 14, 170, 600, 2.8, '#84cc16', '#c084fc');
        const o = game.snakes[e.hit];
        if (o) animOf(o, now).queasyAt = now;
        if (o && o.id === viewerId) floater(tx, Math.max(CELL * 1.3, ty - CELL * 0.6), `-${e.power}`);
      } else if (e.x >= 0 && e.y >= 0 && e.x < GRID && e.y < GRID) spawn(tx, ty, 7, 110, 420, 2.2, '#6f1546', '#84cc16'); // (into a hole or the fire)
    } else if (e.type === 'knock') { // the woodpecker's strike knocks food out of its patch: it flies to where the rule says, in an arc as high and long as the throw (see knockFly), and with nowhere to go, or a beetle (round six B, 2m), the bird has it
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
      if (e.air) { spawn(px, py - CELL * 0.4, 12, 240, 380, 2.4, '#fffbea', '#fde68a'); spawn(h.x * CELL + CELL / 2, (h.y + 0.5) * CELL, 8, 90, 600, 3, '#c08a4a', '#8b6b4a'); } // (round six B, a bump in the air: a spark up there, and dust where it drops)
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
      const word = e.failed ? 'BONK!' : 'Bonk!'; // (a failed flash: a bigger bonk, an ember burst, and the stars stay longer, as its stun does)
      if (e.failed) spawn(px, py, 22, 300, 640, 3.2, '#f97316', '#fde047');
      const stars = starsOff(s), refused = s.id === viewerId && refusal.tick === game.tick, half = floatHalfOf(word);
      let bx = px + dx * CELL * 0.4, by = py + dy * CELL * 0.4;
      if (dy && (refused || (stars < 0) === (dy < 0))) bx += side * CELL * 1.2;
      else if (dx && (refused || bx < half || bx > SIZE - half)) by += stars < 0 ? CELL : -CELL;
      if (by < FLOAT_TOP || by > FLOAT_LOW) {
        const on = dx && hx + dx * CELL * 1.9 > half && hx + dx * CELL * 1.9 < SIZE - half; // (room on along the row)
        bx = hx + (dx ? (on ? dx : -dx) : side) * CELL * 1.9;
        by = Math.min(FLOAT_LOW, Math.max(FLOAT_TOP, hy));
      }
      floater(bx, by, word);
      if (s.id === viewerId) {
        if (e.lost >= 1 && e.lost <= T.FAIL_LOSS) {
          const under = hy - CELL * 1.9 < FLOAT_TOP;
          floater(under ? bx : hx - dx * CELL * 1.2, under ? by + CELL * 0.85 : hy - CELL * 1.9, '-' + e.lost);
        }
        if (!reduced) shake(e.failed ? 7 : 4);
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
      const a = animOf(e.snake, now), h = e.snake.body[1] || e.snake.body[0]; // (where it took off: a cell a tick, so its neck)
      hopped(e.snake, e, now);
      a.leapUntil = game.tick + e.snake.body.length + (e.reach || 1) + 1; // (until the arch has run off its tail, after a tick in the air over each cell)
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
    } else if (e.type === 'cut') { // a flash cut through it, a plain one or a golden one (a dash); its own tail dropped, by its own flash (the woodpecker's cuts, its "Ouch!", went in round four)
      floater(e.x * CELL + CELL / 2, Math.max(CELL * 1.3, e.y * CELL - CELL * 0.2), e.by != null ? 'Snip!' : 'Ouch!');
      const prev = e.snake.prev || []; // (its tail falls as beads in its markings: segment p0 + i lay at prev[p0 + i])
      let at = prevAt.get(e.snake);
      if (!at) { at = new Map(); prev.forEach((c, k) => { const key = c.y * GRID + c.x; if (!at.has(key)) at.set(key, k); }); prevAt.set(e.snake, at); }
      const p0 = at.get(e.y * GRID + e.x) ?? -1;
      if (p0 >= 0) for (let i = 1; i < e.lost && p0 + i < prev.length && cutBeads > 0; i++, cutBeads--) {
        const key = prev[p0 + i].y * GRID + prev[p0 + i].x;
        if (!born.has(key)) born.set(key, { kind: 'pellet', at: now + i * RIPPLE_MS, i, next: 0, gen: bornGen, v: beadOf(e.snake, p0 + i) });
      }
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
      if (e.fall?.length) fallAway(e.fall, now); // (2s: a piece cut loose tips and drops: see holes.js)
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
      heals.push({ x: e.x, y: e.y, at: now, key, v: BURROW_LOOKS[key % 4], cs: crackSprites.get(key) || null, grown: shutSeen.get(key) || 0 });
      crackSprites.delete(key); burrowSeen.delete(key); shutSeen.delete(key); // (a burrow opening there again cracks and pops anew)
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
  for (const s of game.snakes) flying(s, now); // (a golden flight's arch kept over its way, after this tick's take-offs are in: see flying)
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
