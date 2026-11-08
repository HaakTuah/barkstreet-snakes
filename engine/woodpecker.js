// Round six B (2m): how many cells each cell of the woodpecker's mark
// (target: its cells) is from the nearest cell off it, across and down,
// on the board and not a hole (isHole(k)): how far a beetle there must
// crawl to be clear of the beak. A Map, cell -> cells (none for a cell
// that's a hole), worked out once a mark (the AIs ask too: see E.beakDepth).
let depthFor = null, depthHoles = -1, depthOf = null;
// How far (x, y) is off the mark (target), across and down; on it, minus
// how far from the bark beyond (depth: beakDepth's).
function beakGap(target, depth, x, y) {
  const d = depth.get(key(x, y));
  if (d !== undefined) return -d;
  let gap = 99;
  for (const k of target) { const kx = k % GRID, g = Math.abs(kx - x) + Math.abs((k - kx) / GRID - y); if (g < gap) gap = g; }
  return gap;
}
function beakDepth(target, isHole) {
  let holes = 0;
  for (const k of target) if (isHole(k)) holes++;
  if (depthFor === target && depthHoles === holes) return depthOf;
  const mark = new Set(target), out = new Map();
  for (const k of mark) {
    if (isHole(k)) continue;
    const x = k % GRID, y = (k - x) / GRID;
    let found = GRID * 2;
    for (let r = 1; r < found; r++) {
      for (let dx = -r; dx <= r && found > r; dx++) for (const dy of dx === -r || dx === r ? [0] : [r - Math.abs(dx), Math.abs(dx) - r]) {
        const nx = x + dx, ny = y + dy, nk = key(nx, ny);
        if (inside(nx, ny) && !mark.has(nk) && !isHole(nk)) { found = r; break; }
      }
    }
    out.set(k, found);
  }
  depthFor = target; depthHoles = holes; depthOf = out;
  return out;
}
// The woodpecker, in three acts (entry 6; see actOf). Act 1, the watcher:
// it lands outside the board and scouts it, no pecks: a look at a spot on
// the log (w.gaze), then 2 to 4 more from new vantage points (WATCH_LOOKS),
// the last the longest (WATCH_LAST); act 2's first patch grows from where it
// looked last (GAZE_NEAR, see planCut), so its gaze is a tell. Act 2, the
// first pecks: now and then (FIRST_REST_TICKS) a few cells of its outline (CUT_STEP_2, engine/outline.js).
// Act 3, the frenzy, sudden death: it cuts faster, hungrier with each
// piece that falls (a shorter rest, more cells a peck), down to the floor,
// where it fights (engine/fight.js). Each peck: the cells of its outline
// (PECK_CLEARANCE cells from every head, shutting nobody in, while there's
// such a spot: see nextPeck), eyed for PECK_AIM_TICKS (everyone sees
// where, and the AIs keep out of it, like a hole), hammered out at
// once, and a rest. Food in the patch when it strikes is
// knocked aside (see knockTo), or eaten if there's nowhere to knock it (a
// beetle still there is eaten: it had the rings' warning to run, see crawl); fire and a burrow there go. A head on the ground
// there, and that snake's out; a body lying across it bridges the new hole
// (it isn't cut, and drops nothing), and the cell is a hole like any other
// once its tail has passed. Where knocked food lands is a promise: the
// rings through the aim's last PECK_PROMISE_TICKS moves (see
// promiseLandings) are kept while their cells are still free.
// game.woodpecker: { at (time it came), came (the tick it came), target: [cells it's aiming at],
//   strikeAt (tick), last: [cells it took out last], struckAt (tick), restUntil (tick), x, y (where it's busy),
//   pecks (strikes so far), fury (pieces fallen in the frenzy), landings (from PECK_PROMISE_TICKS moves before a strike: [[from, to], ...] cells, to -1 for none),
//   fall (2s: the cells of target on pieces it cuts loose, which fall with the strike, food and all),
//   plan (part 2: its outline, see engine/outline.js), zone (a fight's plus, see engine/fight.js),
//   gaze (act 1: the cell it watches; where it looked last, after), lookAt (the tick that look began), looks (looks left after it), lookUntil (ms: when it moves on), unit (ms: a look's length) }
function peck(game, dying, drops) {
  const act = actOf(game);
  if (!act) return;
  let w = game.woodpecker;
  if (!w) {
    const changes = Math.floor(between(T.WATCH_LOOKS[0], T.WATCH_LOOKS[1] + 1)), unit = Math.max(0, game.acts.pecks - game.time) / (changes + T.WATCH_LAST);
    w = game.woodpecker = { x: GRID / 2, y: 0, at: game.time, came: game.tick, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: -1, gaze: -1, lookAt: game.tick, looks: changes, unit, lookUntil: game.time + unit };
    if (act === 1) watchSpot(game, w);
    game.events.push({ type: 'woodpecker' });
    return;
  }
  if (act === 1) {
    if (game.time >= w.lookUntil && w.looks > 0) {
      w.looks--;
      w.lookAt = game.tick; w.lookUntil = game.time + w.unit * (w.looks ? 1 : T.WATCH_LAST);
      watchSpot(game, w);
    }
    return;
  }
  if (w.target.length && game.tick >= w.strikeAt) {
    // (A fight's strike, part 2: heads in its plus take a crash, see
    // fightHit; it takes its centre only if no head is on it.)
    const struck = w.zone ? new Set(fightHit(game, new Set(w.zone), dying, drops)) : null;
    const zone = new Set(w.target.filter(k => !game.holes.has(k) && !(struck && struck.has(k))));
    // Where its food goes: the landings its rings promised, each while its
    // cell's still free, else the rule as the board stands; worked out
    // before anyone's head in it is out, so a body it pecks under still
    // lies where it lay (its beads go there, never under the food).
    const flying = knocks(game, zone, w.landings, 0);
    const under = []; // (whose bodies lay across it: they're fine)
    for (const s of game.snakes) {
      if (!s.alive) continue;
      if (!struck && !s.flight && zone.has(key(s.body[0].x, s.body[0].y))) { // (a head in the air isn't in it)
        if (w.fall?.includes(key(s.body[0].x, s.body[0].y))) { s.cause = 'fell into a woodpecker hole'; s.killer = 'wall'; s.killerId = null; s.fatal = 'hole'; s.fell = true; } // (2s: down the hole with the piece it was on)
        else { s.cause = 'got pecked by the woodpecker'; s.killer = 'wall'; s.killerId = null; s.fatal = 'pecked'; }
        s.alive = false;
        dying.push(s);
        continue;
      }
      if (s.body.some((c, i) => i && zone.has(key(c.x, c.y)))) under.push(s.id);
    }
    for (const k of zone) { game.holes.add(k); if (game.fires.has(k)) putOut(game, k); } // (a burning cell pecked out: the fire there's gone too)
    for (const { food: f, to, fell } of flying) {
      if (fell) { // (2s: gone with its piece, the peck's fall shows it; a beetle, as one the bird eats)
        if (f.kind === 'beetle') game.events.push({ type: 'knock', kind: f.kind, x: f.x, y: f.y, tx: null, ty: null, ...(f.gold ? { gold: 1 } : {}) });
        game.food.splice(game.food.indexOf(f), 1);
        continue;
      }
      game.events.push({ type: 'knock', kind: f.kind, x: f.x, y: f.y, tx: to ? to.x : null, ty: to ? to.y : null, ...(f.gold ? { gold: 1 } : {}), ...(f.color ? { color: f.color } : {}) });
      if (!to) { game.food.splice(game.food.indexOf(f), 1); continue; } // (nowhere to go, or a beetle: the bird eats it)
      f.x = to.x; f.y = to.y;
    }
    game.burrows = game.burrows.filter(b => !zone.has(key(b.x, b.y))); // (a burrow pecked open is a hole now)
    const hit = [...zone];
    game.events.push({ type: 'peck', x: w.x, y: w.y, cells: hit, under, ...(w.fall ? { fall: w.fall } : {}), ...(w.zone ? { zone: w.zone } : {}) }); // (fall: the cells of the pieces cut loose, 2s; zone: a fight's, part 2)
    w.pecks = (w.pecks || 0) + 1;
    if (act === 3 && w.fall) w.fury = (w.fury || 0) + 1; // (in the frenzy it gets hungrier with each piece that falls: shorter rests, more cells a peck)
    const fought = !!w.zone;
    if (w.plan && w.plan.cut.every(k => game.holes.has(k))) delete w.plan; // (its outline's all cut: the piece is gone)
    delete w.landings;
    delete w.fall;
    delete w.zone;
    w.last = hit; w.struckAt = game.tick; w.target = [];
    w.restUntil = game.tick + (fought ? T.FIGHT_REST_TICKS : act === 3 ? Math.max(T.PECK_REST_MIN, Math.round(T.PECK_REST_TICKS * Math.pow(T.PECK_HUNGRIER, w.fury || 0))) : T.FIRST_REST_TICKS);
    return;
  }
  if (!w.target.length && game.tick >= w.restUntil) {
    // (part 2: the next peck of its outline, planning one if it has none;
    // waiting while no cell of it may go, and giving it up after
    // CUT_GIVEUP_TICKS; at the floor, in the frenzy, a fight.)
    let pick = null;
    if (w.plan && !canCut(game)) delete w.plan;
    if (!w.plan && canCut(game)) { const p = planCut(game, w); if (p) w.plan = p; }
    if (w.plan) {
      pick = nextPeck(game, w);
      if (pick) w.plan.waitFrom = -1;
      else if (w.plan.waitFrom < 0) w.plan.waitFrom = game.tick;
      else if (game.tick - w.plan.waitFrom > T.CUT_GIVEUP_TICKS) delete w.plan;
    }
    if (!pick && act === 3 && !canCut(game)) { const f = fightAim(game); if (f) pick = { patch: f.target, fall: [], zone: f.zone }; }
    if (!pick) return;
    const { patch, fall } = pick;
    w.target = patch;
    if (pick.zone) w.zone = pick.zone;
    if (fall.length) w.fall = fall; else delete w.fall; // (2s: the pieces it cuts loose, in the mark too: they fall with the strike)
    w.strikeAt = game.tick + T.PECK_AIM_TICKS;
    let sx = 0, sy = 0;
    for (const k of patch) { sx += k % GRID; sy += Math.floor(k / GRID); }
    w.x = sx / patch.length; w.y = sy / patch.length;
    game.events.push({ type: 'aim', x: Math.round(w.x), y: Math.round(w.y) });
  }
}
// Act 1: where the woodpecker looks next (w.gaze), and from where (x, y:
// the spot it's busy with, which the bird's perch follows): a spot it
// could start cutting from as things stand (see cutSeeds: the edge of the
// most log per snake), any of them; anywhere on the log if none.
function watchSpot(game, w) {
  const { owner, sizes } = regions(game), r = richest(game, sizes)[0];
  const seeds = r === undefined ? [] : cutSeeds(game, owner, r);
  for (let t = 0; t < 50; t++) {
    const k = seeds.length ? seeds[Math.floor(Math.random() * seeds.length)] : Math.floor(Math.random() * CELLS);
    if (game.holes.has(k)) continue;
    w.gaze = k; w.x = k % GRID; w.y = (k - w.x) / GRID;
    return;
  }
}
// The log stays one piece (2s, the owner, 31 October 2026: "we want to avoid
// the islands stuff"): the log is the biggest piece of bark left once the
// patch (inP) is out (of two as big, the one with more heads on it); every
// other piece, cut loose, falls with the strike, so it goes into the mark
// from the start (shaded as it will fall: w.fall) and anyone sees it
// coming. Returns its cells ([] if none). No size is banned from falling;
// who may be on it is the peck's to judge (see nextPeck).
const pieceOf = new Int32Array(CELLS), pieceQ = new Int32Array(CELLS);
function cutLoose(game, inP) {
  pieceOf.fill(-1);
  const sizes = [];
  for (let k0 = 0; k0 < CELLS; k0++) {
    if (pieceOf[k0] >= 0 || inP.has(k0) || game.holes.has(k0)) continue;
    const id = sizes.length;
    pieceOf[k0] = id; pieceQ[0] = k0;
    let r = 0, w = 1;
    while (r < w) {
      const i = pieceQ[r++], x = i % GRID, y = (i - x) / GRID;
      for (const d of CRAWL) {
        const nx = x + d.x, ny = y + d.y;
        if (!inside(nx, ny)) continue;
        const ni = key(nx, ny);
        if (pieceOf[ni] >= 0 || inP.has(ni) || game.holes.has(ni)) continue;
        pieceOf[ni] = id; pieceQ[w++] = ni;
      }
    }
    sizes.push(w);
  }
  if (sizes.length < 2) return [];
  const heads = sizes.map(() => 0); // (two pieces as big: the log is the one with more heads on it)
  for (const s of game.snakes) if (s.alive) { const k = key(s.body[0].x, s.body[0].y); if (pieceOf[k] >= 0) heads[pieceOf[k]]++; }
  let log = 0;
  for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[log] || (sizes[i] === sizes[log] && heads[i] > heads[log])) log = i;
  const fall = [];
  for (let k = 0; k < CELLS; k++) if (pieceOf[k] >= 0 && pieceOf[k] !== log) fall.push(k);
  return fall;
}
