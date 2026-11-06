// The threats on the board: where a rival could strike next tick (and
// a rival's ring as it comes down from a flight), how soon it could reach
// each cell, and a flier's ring I could take.

// Risk: cells each rival could step into next tick (head-on: `strikes`,
// read with when I'd get there, see evaluate), and its wider reach since
// I last saw it (soft zone, `risk`).
// (A rival still stunned next tick can't strike; one I just met head-on,
// I give twice the berth for a while, so we don't go for the same cell again.)
// Only cells it can step into: not back into its neck, a hole or a body
// still there. (One I saw in the air comes down on its ring on the move
// its ring says: a head-on then; a move either side at half (a flight
// steered at the edge comes down sooner; its neck lies there the move
// after). ringRisk; rings: [move, cell, what it'd cost me].)
// (readRisk() sets these for each decision:)
let rings, ringRisk;
function readRisk() {
  rings = [];
  ringRisk = (i, t) => { let v = 0; for (let n = 0; n < rings.length; n += 3) if (rings[n + 1] === i && Math.abs(rings[n] - t) <= 1) v += rings[n] === t ? rings[n + 2] : rings[n + 2] / 2; return v; };
  others.forEach((o, k) => {
    const strike = stunLeft(o) > 1 ? 0 : w.headRisk * (o.id === me.bumped ? 2 : 1);
    const wrapO = o.wrap > 0, at = v => wrapO ? (v + N) % N : v; // (the edges wrap for it a while)
    for (const d of DIR_LIST) {
      if (d.x === -o.dir.x && d.y === -o.dir.y) continue; // (its neck)
      let nx = at(heads[k].x + d.x), ny = at(heads[k].y + d.y);
      if (!inGrid(nx, ny) && portalOut(heads[k].x, heads[k].y, d, 1)) { nx = (nx + N) % N; ny = (ny + N) % N; } // (through a gold portal, out at its exit)
      if (inGrid(nx, ny) && otherFree[ny * N + nx] - age <= 1) strikes[ny * N + nx] += strike; // (a body as seen, `age` ago)
    }
    // (Its powers reach further straight on: a dash three cells; anyone's
    // flash two, and anyone's leap LEAP_REACH + 1 if there's something in
    // front to hop (a golden one, whatever's in front). Tired (2u: it
    // looks it), it can't afford either: none of that.
    // But a plain flash costs stamina, so a snake spends one racing for
    // food straight ahead of it, not to cross a cell it can't crawl to:
    // its flash I fear only with food on that line within its reach.)
    // (Straight on, cell by cell, as the engine goes: over the edge where
    // they wrap for it, or through a gold portal open that way.)
    const line = [];
    for (let n = 1, x = heads[k].x, y = heads[k].y; n <= TUNE.DASH_LENGTH + TUNE.LEAP_REACH + 2; n++) {
      let nx = at(x + o.dir.x), ny = at(y + o.dir.y);
      if (!inGrid(nx, ny) && portalOut(x, y, o.dir, 1)) { nx = (nx + N) % N; ny = (ny + N) % N; }
      line[n] = { x: nx, y: ny }; x = nx; y = ny;
    }
    const fx = line[1].x, fy = line[1].y;
    const gold = o.dashes > 0 || o.leaps > 0, hop = inGrid(fx, fy) && otherFree[fy * N + fx] > 1;
    const far = Math.max(gold ? TUNE.DASH_LENGTH : TUNE.FLASH_LENGTH, gold || hop ? TUNE.LEAP_REACH + 1 : 1);
    if (o.air - age >= 1 && o.land >= 0) rings.push(o.air - age, o.land, strike);
    else if (o.air > 0 && o.land >= 0) strikes[o.land] += strike; // (down on its ring since I saw it: its head is there now)
    const on = f => { for (let n = 1; n <= far + 1; n++) if (line[n].x === f.x && line[n].y === f.y) return true; return false; };
    if ((o.step !== 0 || gold) && (gold || hop || food.some(f => f.kind !== 'mushroom' && on(f)))) for (let i = 2; i <= far; i++) {
      const { x: nx, y: ny } = line[i];
      if (inGrid(nx, ny)) strikes[ny * N + nx] += strike * 0.5;
    }
    const stampZ = ++markStamp;
    queue[0] = o.body[0].y * N + o.body[0].x;
    visited[queue[0]] = stampZ;
    let read = 0, write = 1;
    for (let s = 1; s <= age + 1; s++) {
      const levelEnd = write;
      while (read < levelEnd) {
        const i = queue[read++];
        for (let n = 4 * i; n < 4 * i + 4; n++) {
          const ni = nbr[n];
          if (ni < 0 || visited[ni] === stampZ || otherFree[ni] > s) continue;
          visited[ni] = stampZ;
          risk[ni] += w.zoneRisk;
          queue[write++] = ni;
        }
      }
    }
  });
}

// Reach: the soonest (in ticks from now) any rival could be in each cell,
// spreading a cell a tick from where I last saw its head (once its stun
// is over), round bodies and my own body as they are now. A gap I need
// that a rival can reach first is a gap it could shut. (On the framed
// board: a cell is free for a rival at s once reachBlock <= s, the time
// it frees up of itself less `age`, since a rival's search starts then,
// or that of my body, which is all there until now.)
// (readReach() sets these for each decision:)
let rides;
function readReach() {
  for (let i = 0; i < N * N; i++) reachBlock[framed[i]] = otherFree[i] - age;
  me.body.forEach((c, j) => { const i = c.y * N + c.x; reachBlock[framed[i]] = Math.max(otherFree[i] - age, me.body.length - j + me.grow); });
  // (A pit with a body across it is no barrier to a rival while it lasts:
  // it can ride across, on mine or any other's (never its own). Read as
  // open from now, for each rival in turn.)
  rides = [];
  others.forEach((o, k) => { if (!o.air && !pitHole(o.body[0].y * N + o.body[0].x)) for (let j = 1; j < o.body.length; j++) { const i = o.body[j].y * N + o.body[j].x; if (pitHole(i)) rides.push(framed[i], k); } });
  me.body.forEach((c, j) => { const i = c.y * N + c.x; if (j > 0 && pitHole(i)) rides.push(framed[i], -1); });
  reach.fill(HOLE);
  others.forEach((o, k) => { // (from when it moved, or moves, again)
    for (let n = 0; n < rides.length; n += 2) if (rides[n + 1] !== k) { ridesWas[n >> 1] = reachBlock[rides[n]]; reachBlock[rides[n]] = Math.min(reachBlock[rides[n]], 0); }
    reachFrom(framed[o.body[0].y * N + o.body[0].x], (o.stun || 0) - age);
    for (let n = rides.length - 2; n >= 0; n -= 2) if (rides[n + 1] !== k) reachBlock[rides[n]] = ridesWas[n >> 1];
  });
  reachPortals(); // (a gold portal: out at its exit a move after its entry)
}

// 2y, a landing taken: a flier comes down on its ring when its ring says,
// and a body of mine still lying there then puts it out (my head there
// then is a head-on; my tail has moved off). So my head on the ring
// from L - 2 moves before it's down to the move before. cover: [cell,
// from, to, worth, sure] for each I can get to in time, in what the
// search counts (U, an apple, as in powerPick): a rival out, KILL apples
// as a cut (as much more as I'm aggressive, my target twice), times my
// style's (w.landing), times the share of its moves it won't steer the
// ring away on (STAY each, the ones since I saw it too), half if another
// rival on the ground is nearer (we'd meet there). (In time: crawling,
// or a flash or dash on the way.) coverAt: what my
// body on cell i from my move t is worth, and which (coverHit, a bit
// each); covered: those this line has taken already; sureCover: those
// near sure (a power spent on: see flashOpt).
// (readLandings() sets these for each decision:)
let ringCover, coverHit, covered, sureCover, coverAt;
function readLandings() {
  ringCover = [];
  coverHit = 0, covered = 0, sureCover = 0;
  others.forEach((o, k) => {
    const n = (o.air || 0) - age, L = me.body.length;
    if (n <= 1 || o.land < 0 || holes.has(o.land)) return; // (down already, or this move: it's danger only, see ringRisk)
    const lx = o.land % N, ly = (o.land - lx) / N, dist = Math.abs(lx - myHead.x) + Math.abs(ly - myHead.y);
    if (dist > n - 1 + (me.dashes > 0 ? TUNE.DASH_LENGTH - 1 : me.flashIn === 0 ? TUNE.FLASH_LENGTH - 1 : 0)) return; // (a flash, or a dash, gets me there sooner: see flashOpt)
    const agg = (w.aggression || 0) + (w.hunt ? 0.5 : 0), U = Math.max(40, foodW * w.foodRange + eatW);
    const first = others.some((q, j) => j !== k && !q.air && Math.abs(heads[j].x - lx) + Math.abs(heads[j].y - ly) < dist) ? 0.5 : 1;
    const sure = Math.pow(STAY, o.air - 1) * first;
    if (sure >= 0.5) sureCover |= 1 << (ringCover.length / 5);
    ringCover.push(o.land, n - (L - 2), n - 1, KILL * (0.5 + agg) * (o.id === memory.victimId ? 2 : 1) * (w.landing ?? LANDING) * sure * U, sure);
  });
  coverAt = (i, t) => {
    let v = 0;
    coverHit = 0;
    for (let n = 0; n < ringCover.length; n += 5) if (ringCover[n] === i && t >= ringCover[n + 1] && t <= ringCover[n + 2]) { v += ringCover[n + 3]; coverHit |= 1 << (n / 5); }
    return v;
  };
}
