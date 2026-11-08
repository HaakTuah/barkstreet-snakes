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
// looked last (GAZE_NEAR, see pickPatch), so its gaze is a tell. Act 2, the
// first pecks: now and then (FIRST_REST_TICKS) a small patch (FIRST_CHUNK).
// Act 3, the frenzy, sudden death: it takes the log away a patch at a time,
// hungrier each time (a shorter rest, a patch a cell bigger). Each patch:
// picked somewhere on the log
// (PECK_CLEARANCE cells from every head, shutting nobody in, while there's
// such a spot: see pickPatch), eyed for PECK_AIM_TICKS (everyone sees
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
//   pecks (strikes so far), fury (strikes in the frenzy), landings (from PECK_PROMISE_TICKS moves before a strike: [[from, to], ...] cells, to -1 for none),
//   fall (2s: the cells of target on pieces it cuts loose, which fall with the strike, food and all),
//   gaze (act 1: the cell it watches, -1 once it aims), lookAt (the tick that look began), looks (looks left after it), lookUntil (ms: when it moves on), unit (ms: a look's length) }
function peck(game, dying) {
  const act = actOf(game);
  if (!act) return;
  let w = game.woodpecker;
  if (!w) {
    const changes = Math.floor(between(T.WATCH_LOOKS[0], T.WATCH_LOOKS[1] + 1)), unit = Math.max(0, game.acts.pecks - game.time) / (changes + T.WATCH_LAST);
    w = game.woodpecker = { x: GRID / 2, y: 0, at: game.time, came: game.tick, target: [], strikeAt: -1, last: [], struckAt: -1, restUntil: -1, gaze: -1, lookAt: game.tick, looks: changes, unit, lookUntil: game.time + unit };
    if (act === 1) look(game, w);
    game.events.push({ type: 'woodpecker' });
    return;
  }
  if (act === 1) {
    if (game.time >= w.lookUntil && w.looks > 0) {
      w.looks--;
      w.lookAt = game.tick; w.lookUntil = game.time + w.unit * (w.looks ? 1 : T.WATCH_LAST);
      look(game, w);
    }
    return;
  }
  if (w.target.length && game.tick >= w.strikeAt) {
    const zone = new Set(w.target.filter(k => !game.holes.has(k)));
    // Where its food goes: the landings its rings promised, each while its
    // cell's still free, else the rule as the board stands; worked out
    // before anyone's head in it is out, so a body it pecks under still
    // lies where it lay (its beads go there, never under the food).
    const flying = knocks(game, zone, w.landings, 0);
    const under = []; // (whose bodies lay across it: they're fine)
    for (const s of game.snakes) {
      if (!s.alive) continue;
      if (!s.flight && zone.has(key(s.body[0].x, s.body[0].y))) { // (a head in the air isn't in it)
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
    game.events.push({ type: 'peck', x: w.x, y: w.y, cells: hit, under, ...(w.fall ? { fall: w.fall } : {}) }); // (fall: the cells of the pieces cut loose, 2s)
    w.pecks = (w.pecks || 0) + 1;
    if (act === 3) w.fury = (w.fury || 0) + 1; // (in the frenzy it gets hungrier: shorter rests, bigger patches)
    delete w.landings;
    delete w.fall;
    w.last = hit; w.struckAt = game.tick; w.target = [];
    w.restUntil = game.tick + (act === 3 ? Math.max(T.PECK_REST_MIN, Math.round(T.PECK_REST_TICKS * Math.pow(T.PECK_HUNGRIER, w.fury))) : T.FIRST_REST_TICKS);
    return;
  }
  if (!w.target.length && (game.tick >= w.restUntil || (act === 3 && !w.fury && game.tick >= w.struckAt + T.PECK_REST_TICKS))) { // (the frenzy's first rest is its own, not act 2's long one)
    const { patch, fall } = pickPatch(game, w.gaze);
    w.gaze = -1;
    if (!patch.length) return;
    w.target = patch;
    if (fall.length) w.fall = fall; else delete w.fall; // (2s: the pieces it cuts loose, in the mark too: they fall with the strike)
    w.strikeAt = game.tick + T.PECK_AIM_TICKS;
    let sx = 0, sy = 0;
    for (const k of patch) { sx += k % GRID; sy += Math.floor(k / GRID); }
    w.x = sx / patch.length; w.y = sy / patch.length;
    game.events.push({ type: 'aim', x: Math.round(w.x), y: Math.round(w.y) });
  }
}
// A patch for the woodpecker, grown cell by cell from a start: under a body
// PECK_UNDER_BODY of the time (any snake's, never a head), beside an old
// hollow PECK_WIDEN of the time (fewer, bigger hollows), else anywhere. It
// grows compact (a cell with more of the patch, or old holes, beside it is
// likelier), is rounded off (see smoothPatch), and takes any piece of log
// it would cut loose (see cutLoose: 2s, the log stays one piece). It may cover food: that's knocked aside at
// the strike (see knockTo). It keeps PECK_CLEARANCE cells from every head
// and shuts nobody in (see shutsIn) while it can; failing that, it keeps
// clear of heads themselves, shutting nobody in; failing that, those two
// again, shutting someone in; failing that, anywhere left. (Each try:
// [keep clear, of heads by more than this, shut nobody in].)
// (2s: and first, aiming small, cutting loose no piece bigger than
// PECK_FALL_SOFT; then any: [keep clear, of heads by more than this, shut
// nobody in, aim small].)
const PATCH_TRIES = [[true, T.PECK_CLEARANCE, true, true], [true, 0, true, true], [true, T.PECK_CLEARANCE, true, false], [true, 0, true, false],
  [true, T.PECK_CLEARANCE, false, false], [true, 0, false, false], [false, -1, false, false]];
function pickPatch(game, gaze = -1) {
  const roll = Math.random(), w = game.woodpecker;
  const chunk = actOf(game) === 3 ? Math.min(T.PECK_CHUNK_MAX, T.PECK_CHUNK + (w?.fury || 0)) : T.FIRST_CHUNK; // (in the frenzy a cell bigger each time)
  const nearHole = k => CRAWL.some(d => { const x = k % GRID + d.x, y = Math.floor(k / GRID) + d.y; return inside(x, y) && game.holes.has(key(x, y)); });
  const room = { now: null }; // (each snake's room as things stand: worked out once, if a try asks)
  for (const [clear, gap, fair, small] of PATCH_TRIES) {
    const ok = k => {
      if (game.holes.has(k)) return false;
      if (!clear) return true;
      return headGap(game, k % GRID, Math.floor(k / GRID)) > gap;
    };
    // Where it'd like to start this time (tried first, then anywhere).
    const pool = [];
    if (gaze >= 0) { // (act 2's first: where it looked last, entry 6)
      const gx = gaze % GRID, gy = (gaze - gx) / GRID;
      for (let y = gy - T.GAZE_NEAR; y <= gy + T.GAZE_NEAR; y++) for (let x = gx - T.GAZE_NEAR; x <= gx + T.GAZE_NEAR; x++) if (inside(x, y) && Math.abs(x - gx) + Math.abs(y - gy) <= T.GAZE_NEAR && ok(key(x, y))) pool.push(key(x, y));
    } else if (roll < T.PECK_UNDER_BODY) {
      for (const s of game.snakes) if (s.alive) for (let j = 1; j < s.body.length; j++) { const k = key(s.body[j].x, s.body[j].y); if (ok(k)) pool.push(k); }
    } else if (roll < T.PECK_UNDER_BODY + T.PECK_WIDEN && game.holes.size) {
      for (let k = 0; k < CELLS; k++) if (ok(k) && nearHole(k)) pool.push(k);
    }
    for (let t = pool.length ? -15 : 0; t < 30; t++) {
      const seed = t < 0 ? pool[Math.floor(Math.random() * pool.length)] : Math.floor(Math.random() * CELLS);
      if (!ok(seed)) continue;
      const patch = [seed], edge = [seed], inPatch = new Set(patch);
      while (patch.length < chunk && edge.length) {
        const from = edge[Math.floor(Math.random() * edge.length)], x = from % GRID, y = Math.floor(from / GRID);
        const opts = CRAWL.map(d => [x + d.x, y + d.y]).filter(([nx, ny]) => inside(nx, ny) && !inPatch.has(key(nx, ny)) && ok(key(nx, ny)));
        if (!opts.length) { edge.splice(edge.indexOf(from), 1); continue; }
        // (each way weighs (1 + 3 for each neighbour in the patch + 2 for each old hole beside it), squared)
        let total = 0;
        const weights = opts.map(([ox, oy]) => {
          let n = 1;
          for (const d of CRAWL) {
            const ax = ox + d.x, ay = oy + d.y;
            if (!inside(ax, ay)) continue;
            if (inPatch.has(key(ax, ay))) n += 3; else if (game.holes.has(key(ax, ay))) n += 2;
          }
          total += n * n;
          return n * n;
        });
        let r = Math.random() * total, i = 0;
        while (i < opts.length - 1 && (r -= weights[i]) >= 0) i++;
        const nk = key(opts[i][0], opts[i][1]);
        patch.push(nk); edge.push(nk); inPatch.add(nk);
      }
      if (patch.length < Math.ceil(chunk / 2)) continue;
      smoothPatch(game, patch, inPatch, ok);
      if (patch.length < Math.ceil(chunk / 2)) continue;
      const fall = cutLoose(game, inPatch, ok, clear, small);
      if (!fall) continue;
      for (const k of fall) inPatch.add(k);
      if (fair && shutsIn(game, inPatch, room)) continue;
      return { patch: [...patch, ...fall], fall };
    }
  }
  return { patch: [], fall: [] };
}
// Act 1: where the woodpecker looks next (w.gaze), and from where (x, y:
// the spot it's busy with, which the bird's perch follows). Somewhere on
// the log, anywhere: its first patch will grow there, and nobody can tell
// where before it looks.
function look(game, w) {
  for (let t = 0; t < 50; t++) {
    const k = Math.floor(Math.random() * CELLS);
    if (game.holes.has(k)) continue;
    w.gaze = k; w.x = k % GRID; w.y = (k - w.x) / GRID;
    return;
  }
}
// Rounder hollows: after it grows, a patch takes any cell beside it with
// three or more of its four neighbours in the patch, an old hole or off the
// board (twice over, so a notch two deep fills), never a head; then drops
// its one-cell spurs, cells with only one neighbour in the patch or a hole
// (twice over), while three cells or more are left.
function smoothPatch(game, patch, inPatch, ok) {
  const heads = new Set();
  for (const s of game.snakes) if (s.alive) heads.add(key(s.body[0].x, s.body[0].y));
  const solid = (x, y, edge) => !inside(x, y) ? edge : inPatch.has(key(x, y)) || game.holes.has(key(x, y));
  const around = (k, edge) => { const x = k % GRID, y = Math.floor(k / GRID); let n = 0; for (const d of CRAWL) if (solid(x + d.x, y + d.y, edge)) n++; return n; };
  for (let pass = 0; pass < 2; pass++) {
    const add = [];
    for (const p of patch) for (const d of CRAWL) {
      const x = p % GRID + d.x, y = Math.floor(p / GRID) + d.y;
      if (!inside(x, y)) continue;
      const k = key(x, y);
      if (inPatch.has(k) || add.includes(k) || heads.has(k) || !ok(k)) continue;
      if (around(k, true) >= 3) add.push(k);
    }
    if (!add.length) break;
    for (const k of add) { patch.push(k); inPatch.add(k); }
  }
  for (let pass = 0; pass < 2; pass++) {
    const drop = patch.filter(k => around(k, false) <= 1);
    if (!drop.length || patch.length - drop.length < 3) break;
    for (const k of drop) { patch.splice(patch.indexOf(k), 1); inPatch.delete(k); }
  }
}
// The log stays one piece (2s, the owner, 31 October 2026: "we want to avoid
// the islands stuff"): the log is the biggest piece of bark left once the
// patch is out; every other piece, cut loose, falls with the strike, so it
// goes into the mark from the start (shaded as it will fall: w.fall) and
// anyone sees it coming. Returns its cells ([] if none), or null if this
// patch won't do: keeping clear (keep), a piece as near a head as the
// patch may be (ok), so nobody is on it before they can see it, and it
// never drops a snake that couldn't get off in the warning's time (a
// crumb of PECK_NO_ORPHANS cells or fewer only never under a head: the
// rest of its neighbourhood is the patch's); aiming small (small), one bigger than PECK_FALL_SOFT.
// (No size is banned from falling: the last tries take any.)
const pieceOf = new Int32Array(CELLS), pieceQ = new Int32Array(CELLS);
function cutLoose(game, inP, ok, keep, small) {
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
  for (let k = 0; k < CELLS; k++) {
    if (pieceOf[k] < 0 || pieceOf[k] === log) continue;
    if (keep && !(sizes[pieceOf[k]] <= T.PECK_NO_ORPHANS ? headGap(game, k % GRID, (k - k % GRID) / GRID) > 0 : ok(k))) return null;
    fall.push(k);
  }
  if (small && fall.length > T.PECK_FALL_SOFT) return null;
  return fall;
}
