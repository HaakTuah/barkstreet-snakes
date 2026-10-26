// Turns a pristine copy of the game (engine.js, ai.js) into the "flex" build
// for the round-six balance study: every new rule is a tuning key that is
// absent by default, and with every key absent the build must play exactly
// the same rounds as main (same fingerprint).
//
//   node patch-flex.js <dir>
//
// New tuning keys (all optional):
//   SD_ALIVE n      the woodpecker comes as soon as only n snakes are left...
//   SD_FULL f       ...or the board (bodies + holes) is this full (0..1)...
//   SD_MIN_MS t     ...but never before t; SUDDEN_DEATH_MS is then the latest
//   BEETLE_MAX n    up to n beetles out at once (above ground or underground)
//   BEETLE_SD true  beetles keep coming out in sudden death
//   PECK_NO_SEAL    the woodpecker never picks a patch that seals a snake in
//                   (its timed room, tails leaving, under its length), while
//                   it has another; PECK_SEAL_CAP caps the room asked for
//   AI_CROSS_MARK   the rivals may cross the woodpecker's mark when they'll be
//                   out of it before the strike (AI_CROSS_MARGIN ticks spare)
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
function patch(file, edits) {
  const p = path.join(dir, file);
  let src = fs.readFileSync(p, 'utf8');
  for (const [from, to] of edits) {
    const n = src.split(from).length - 1;
    if (n !== 1) throw new Error(`${file}: expected 1 match, got ${n}: ${from.slice(0, 80)}`);
    src = src.replace(from, () => to);
  }
  fs.writeFileSync(p, src);
}

patch('engine.js', [
  // --- sudden death tied to the board
  [`  const suddenDeath = game => game.time >= T.SUDDEN_DEATH_MS;`,
   `  const SD_FLEX = T.SD_ALIVE != null || T.SD_FULL != null;
  const suddenDeath = game => SD_FLEX ? game.sdFrom != null && game.time >= game.sdFrom : game.time >= T.SUDDEN_DEATH_MS;
  // (flex: worked out at the end of a tick, so it's fixed between ticks)
  function sdTrigger(game) {
    if (!SD_FLEX || game.sdFrom != null) return;
    if (game.time >= T.SUDDEN_DEATH_MS) { game.sdFrom = game.time; return; }
    if (game.time < (T.SD_MIN_MS ?? 0)) return;
    const alive = game.snakes.filter(s => s.alive);
    if (T.SD_ALIVE != null && alive.length <= T.SD_ALIVE) { game.sdFrom = game.time; return; }
    if (T.SD_FULL != null) {
      let n = game.holes.size;
      for (const s of alive) n += s.body.length;
      if (n / CELLS >= T.SD_FULL) game.sdFrom = game.time;
    }
  }`],
  [`    fillFood(game);
    weather(game);
    game.time += tickMs(game);
    game.tick++;
    snapshot(game);`,
   `    fillFood(game);
    weather(game);
    game.time += tickMs(game);
    game.tick++;
    sdTrigger(game);
    snapshot(game);`],
  // --- beetles: several at once, and in sudden death
  [`burrows: [], underground: null,`, `burrows: [], underground: null, unders: [],`],
  [`        if (at && !game.sdApples++) game.events.push({ type: 'lastApples', x: at.x, y: at.y });
      }
      return;`,
   `        if (at && !game.sdApples++) game.events.push({ type: 'lastApples', x: at.x, y: at.y });
      }
      if (T.BEETLE_SD) {
        let beetles = 0;
        for (const f of game.food) if (f.kind === 'beetle') beetles++;
        beetleOut(game, placer(game), beetles);
      }
      return;`],
  [`    if (!beetles && !game.underground && game.time >= T.BEETLE_FIRST_MS && Math.random() < T.BEETLE_CHANCE) {`,
   `    beetleOut(game, place, beetles);
  }
  function beetleOut(game, place, beetles) {
    if (beetles + game.unders.length < (T.BEETLE_MAX ?? 1) && game.time >= T.BEETLE_FIRST_MS && Math.random() < T.BEETLE_CHANCE) {`],
  [`    const u = game.underground;
    if (u && game.tick >= u.until) {
      if (game.tick >= u.expires || suddenDeath(game)) game.underground = null; // (it stays home)
      else {
        const b = freeBurrow(game, u.from);
        if (b) {
          game.food.push({ x: b.x, y: b.y, kind: 'beetle', expires: u.expires, dir: CRAWL[Math.floor(Math.random() * 4)], movedAt: game.tick, ...(u.gold ? { gold: 1 } : {}) });
          game.events.push({ type: 'emerge', x: b.x, y: b.y });
          game.underground = null;
        }
      }
    }
    let marked = false;
    for (const b of game.food) {`,
   `    for (const u of [...game.unders]) {
      if (game.tick < u.until) continue;
      if (game.tick >= u.expires || (suddenDeath(game) && !T.BEETLE_SD)) game.unders.splice(game.unders.indexOf(u), 1); // (it stays home)
      else {
        const b = freeBurrow(game, u.from);
        if (b) {
          game.food.push({ x: b.x, y: b.y, kind: 'beetle', expires: u.expires, dir: CRAWL[Math.floor(Math.random() * 4)], movedAt: game.tick, ...(u.gold ? { gold: 1 } : {}) });
          game.events.push({ type: 'emerge', x: b.x, y: b.y });
          game.unders.splice(game.unders.indexOf(u), 1);
        }
      }
    }
    game.underground = game.unders[0] || null;
    let marked = false;
    for (const b of [...game.food]) {`],
  [`        game.underground = { until: game.tick + Math.round(between(T.BEETLE_UNDER_MIN, T.BEETLE_UNDER_MAX)), expires: b.expires, from: key(b.x, b.y), gold: !!b.gold };
        game.events.push({ type: 'dive', x: b.x, y: b.y });
        break; // (there's only ever one beetle)`,
   `        game.unders.push({ until: game.tick + Math.round(between(T.BEETLE_UNDER_MIN, T.BEETLE_UNDER_MAX)), expires: b.expires, from: key(b.x, b.y), gold: !!b.gold });
        game.underground = game.unders[0];
        game.events.push({ type: 'dive', x: b.x, y: b.y });
        continue;`],
  // --- the woodpecker never seals anyone in
  [`  const PATCH_TRIES = [[true, T.PECK_CLEARANCE], [true, 0], [false, -1]];`,
   `  const PATCH_TRIES = T.PECK_NO_SEAL === 'clearance-first' ? [[true, T.PECK_CLEARANCE, 1], [true, T.PECK_CLEARANCE], [true, 0, 1], [true, 0], [false, -1]]
    : T.PECK_NO_SEAL ? [[true, T.PECK_CLEARANCE, 1], [true, 0, 1], [true, T.PECK_CLEARANCE], [true, 0], [false, -1]]
    : [[true, T.PECK_CLEARANCE], [true, 0], [false, -1]];
  // (flex) A snake's room, a timed flood fill from its head: a body cell
  // opens once that body's tail has passed it (as the rivals count it), holes
  // and \`extra\` (a patch) never. Counted up to \`need\`.
  const SEAL_NEVER = 1 << 30;
  const sealFree = new Int32Array(CELLS), sealSeen = new Int32Array(CELLS), sealQ = new Int32Array(CELLS);
  let sealStamp = 0, sealCache = null;
  function sealGrid(game) {
    sealFree.fill(0);
    for (const k of game.holes) sealFree[k] = SEAL_NEVER;
    for (const s of game.snakes) {
      if (!s.alive) continue;
      const L = s.body.length, extra = Math.max(0, s.stunUntil - game.tick) + Math.max(0, s.grow);
      s.body.forEach((c, j) => { const k = key(c.x, c.y); sealFree[k] = Math.max(sealFree[k], L - j + extra); });
    }
  }
  function sealRoom(game, s, extra, need) {
    const st = ++sealStamp, h0 = key(s.body[0].x, s.body[0].y);
    sealSeen[h0] = st; sealQ[0] = h0;
    let read = 0, write = 1, room = 0;
    for (let d = 1; read < write && room < need; d++) {
      const end = write;
      while (read < end) {
        const i = sealQ[read++], x = i % GRID, y = (i - x) / GRID;
        for (const dd of CRAWL) {
          const nx = x + dd.x, ny = y + dd.y;
          if (!inside(nx, ny)) continue;
          const ni = key(nx, ny);
          if (sealSeen[ni] === st || sealFree[ni] > d || (extra && extra.has(ni))) continue;
          sealSeen[ni] = st; room++; sealQ[write++] = ni;
        }
      }
    }
    return room;
  }
  const sealNeed = s => Math.min(s.body.length + Math.max(0, s.grow), T.PECK_SEAL_CAP ?? 1e9);
  function seals(game, patch) {
    if (sealCache?.tick !== game.tick || sealCache.holes !== game.holes.size) {
      sealGrid(game);
      sealCache = { tick: game.tick, holes: game.holes.size, before: new Map() };
      for (const s of game.snakes) if (s.alive) sealCache.before.set(s, sealRoom(game, s, null, sealNeed(s)));
    }
    const set = new Set(patch);
    for (const s of game.snakes) {
      if (!s.alive) continue;
      const need = sealNeed(s);
      if (sealCache.before.get(s) < need) continue; // (already shut in: not the patch's doing)
      if (sealRoom(game, s, set, need) < need) return true;
    }
    return false;
  }`],
  [`    for (const [clear, gap] of PATCH_TRIES) {`, `    for (const [clear, gap, noSeal] of PATCH_TRIES) {`],
  [`        if (patch.length >= Math.ceil(chunk / 2)) return patch;`, `        if (patch.length >= Math.ceil(chunk / 2) && !(noSeal && seals(game, patch))) return patch;`],
  // --- the rivals may cross the mark: they're told when it strikes
  [`      pecks: game.woodpecker?.target.length ? [...game.woodpecker.target] : NO_FIRES,
    });`,
   `      pecks: game.woodpecker?.target.length ? [...game.woodpecker.target] : NO_FIRES,
      peckAt: game.woodpecker?.target.length ? game.woodpecker.strikeAt : -1,
    });`],
  [`      weather: game.weather.kind, // (everyone sees the weather: in winter, apples rot twice as fast)
    };`,
   `      weather: game.weather.kind, // (everyone sees the weather: in winter, apples rot twice as fast)
      peckIn: snap.peckAt >= 0 ? snap.peckAt - game.tick : 0, // (flex: ticks until the mark it sees is struck)
      sudden: suddenDeath(game),
    };`],
]);

patch('ai.js', [
  [`  let foodValue, foodGrow, foodCells, goldCells, queue, nbr, necks, reach, myCells;`,
   `  let foodValue, foodGrow, foodCells, goldCells, queue, nbr, necks, reach, myCells, closeAt, closeUsed = false;`],
  [`    mineFree = new Int32Array(size);`, `    mineFree = new Int32Array(size);
    closeAt = new Int32Array(size).fill(HOLE);`],
  [`    for (const i of holes) otherFree[i] = HOLE;`,
   `    const crossing = !!(TUNE.AI_CROSS_MARK && view.pecks && view.pecks.size && view.peckIn > 0);
    if (closeUsed) { closeAt.fill(HOLE); closeUsed = false; }
    const fire0 = view.fire || EMPTY;
    for (const i of holes) if (!(crossing && view.pecks.has(i) && !fire0.has(i))) otherFree[i] = HOLE;`],
  [`    mineFree.set(otherFree);`,
   `    mineFree.set(otherFree);
    if (crossing) { // (I may cross the mark if I'm out by the strike; a rival, I assume, keeps out of it)
      const close = view.peckIn + 1 - (TUNE.AI_CROSS_MARGIN ?? 2);
      for (const i of view.pecks) if (!fire0.has(i)) { otherFree[i] = HOLE; closeAt[i] = close; }
      closeUsed = true;
    }`],
  [`    const lean = view.timeMs >= TUNE.SUDDEN_DEATH_MS;`, `    const lean = view.sudden ?? view.timeMs >= TUNE.SUDDEN_DEATH_MS;`],
  [`      if (!inside(x, y) || mineFree[y * N + x] > step) return false;`, `      if (!inside(x, y) || mineFree[y * N + x] > step || closeAt[y * N + x] <= step) return false;`],
  [`            if (ni < 0 || seen[ni] === stampF || mineFree[ni] > t + d || ownFree[ni] > d) continue;`,
   `            if (ni < 0 || seen[ni] === stampF || mineFree[ni] > t + d || closeAt[ni] <= t + d || ownFree[ni] > d) continue;`],
  [`            if (free[ni] > freeBy || (mine > 0 && mine > ownBy)) continue;`,
   `            if (free[ni] > freeBy || (own === 0 && closeAt[ni] <= freeBy) || (mine > 0 && mine > ownBy)) continue;`],
  [`          if (ni < 0 || mineFree[ni] > t + 1 || ownFree[ni] > 1) edge++;`, `          if (ni < 0 || mineFree[ni] > t + 1 || closeAt[ni] <= t + 1 || ownFree[ni] > 1) edge++;`],
  [`      const free = i => i >= 0 && myCells[i] !== stampM && mineFree[i] <= 1; // (free by next tick)`,
   `      const free = i => i >= 0 && myCells[i] !== stampM && mineFree[i] <= 1 && closeAt[i] > 3; // (free by next tick)`],
]);
console.log('patched', dir);
