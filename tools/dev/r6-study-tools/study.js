#!/usr/bin/env node
// Round-six balance study: plays the same AI-only rounds as tools/simulate.js
// (same seeding, same fingerprint; the measuring never touches Math.random)
// and measures what the woodpecker, food, beetle, fire and weather questions need.
//
//   node study.js <rounds> --seed N --root DIR [--ahead] [--out FILE] [--label NAME]
//
// Writes FILE (JSON: the summary and the raw per-round records) and prints
// the summary.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {} // (the owner's laptop must stay usable)

const MAX_TIME = 600000;
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rng = Math.random;
function loadGame(root) {
  const M = Object.create(Math);
  M.random = () => rng();
  const ctx = vm.createContext({ window: {}, console, Math: M });
  for (const f of ['tuning.js', 'ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  return { E: ctx.window.SnakeEngine, T: ctx.window.TUNING };
}
const causeOf = s => s.fatal === 'pecked' ? 'pecked' : s.fatal === 'boom' ? 'boom' : s.killer === 'self' ? 'self' : s.killer === 'hunger' ? 'starved' : s.killer === 'fire' ? 'fire'
  : /woodpecker hole/.test(s.cause) ? 'hole' : s.killer === 'wall' ? 'wall' : /cut in two/.test(s.cause) ? 'cut'
  : s.cause.startsWith('crashed') ? 'head-on' : 'body';

function play({ from, to, seed, ahead, root }) {
  const { E, T } = loadGame(root);
  const G = T.GRID, CELLS = G * G;
  const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const inside = (x, y) => x >= 0 && y >= 0 && x < G && y < G;
  const man = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  // Land: 4-connected components of cells that aren't holes.
  const comp = new Int32Array(CELLS), q = new Int32Array(CELLS);
  function label(g) {
    comp.fill(-1);
    const sizes = [];
    for (let k = 0; k < CELLS; k++) {
      if (comp[k] >= 0 || g.holes.has(k)) continue;
      const id = sizes.length;
      let r = 0, w = 0; q[w++] = k; comp[k] = id;
      while (r < w) {
        const i = q[r++], x = i % G, y = (i - x) / G;
        for (const [dx, dy] of D4) {
          const nx = x + dx, ny = y + dy;
          if (!inside(nx, ny)) continue;
          const ni = ny * G + nx;
          if (comp[ni] >= 0 || g.holes.has(ni)) continue;
          comp[ni] = id; q[w++] = ni;
        }
      }
      sizes.push(w);
    }
    return sizes;
  }
  // Straight-line gaps between islands: from each land cell, along each way,
  // the run of hole cells to the next land cell (another island's).
  function gaps(g, sizes) {
    const n = sizes.length, best = new Map(); // "a,b" -> narrowest gap
    for (let k = 0; k < CELLS; k++) {
      if (comp[k] < 0) continue;
      const x0 = k % G, y0 = (k - x0) / G;
      for (const [dx, dy] of D4) {
        let x = x0 + dx, y = y0 + dy, w = 0;
        while (inside(x, y) && comp[y * G + x] < 0) { w++; x += dx; y += dy; }
        if (!w || !inside(x, y)) continue;
        const a = comp[k], b = comp[y * G + x];
        if (a === b) continue;
        const key = a < b ? a + ',' + b : b + ',' + a;
        if (!best.has(key) || best.get(key) > w) best.set(key, w);
      }
    }
    // per island: the narrowest gap to another island of at least 5 cells
    const out = new Array(n).fill(null);
    for (const [key, w] of best) {
      const [a, b] = key.split(',').map(Number);
      if (sizes[b] >= 5 && (out[a] == null || w < out[a])) out[a] = w;
      if (sizes[a] >= 5 && (out[b] == null || w < out[b])) out[b] = w;
    }
    return { pair: [...best.entries()].filter(([key]) => { const [a, b] = key.split(',').map(Number); return sizes[a] >= 5 && sizes[b] >= 5; }).map(([, w]) => w), out };
  }
  const headCell = s => { const h = s.body[0]; return h.y * G + h.x; };
  function islandShot(g) {
    const sizes = label(g), gp = gaps(g, sizes);
    const alive = g.snakes.filter(s => s.alive);
    const big = sizes.filter(n => n >= 5).sort((a, b) => b - a);
    const heads = alive.map(s => { const c = comp[headCell(s)]; return { id: s.id, len: s.body.length, island: c >= 0 ? sizes[c] : 0, comp: c, gap: c >= 0 ? gp.out[c] : null, shared: alive.some(o => o !== s && comp[headCell(o)] === c) }; });
    const foodAt = new Set(g.food.map(f => f.y * G + f.x));
    let tiny1 = 0, tiny2 = 0, tinyFood = 0;
    sizes.forEach((n, id) => { if (n > 2) return; if (n === 1) tiny1++; else tiny2++; for (let k = 0; k < CELLS; k++) if (comp[k] === id && foodAt.has(k)) { tinyFood++; break; } });
    // the hollows' shape: holes as 4-connected hollows; rim against the least for that area
    const hc = new Int32Array(CELLS).fill(-1), hs = [];
    for (const k0 of g.holes) {
      if (hc[k0] >= 0) continue;
      const id = hs.length; let r = 0, w = 0; q[w++] = k0; hc[k0] = id;
      while (r < w) { const i = q[r++], x = i % G, y = (i - x) / G; for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (!inside(nx, ny)) continue; const ni = ny * G + nx; if (hc[ni] >= 0 || !g.holes.has(ni)) continue; hc[ni] = id; q[w++] = ni; } }
      hs.push({ a: w, rim: 0 });
    }
    let teeth = 0, hspurs = 0;
    for (let k = 0; k < CELLS; k++) {
      const x = k % G, y = (k - x) / G;
      let holeN = 0, offN = 0;
      for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (!inside(nx, ny)) offN++; else if (g.holes.has(ny * G + nx)) holeN++; }
      if (g.holes.has(k)) { hs[hc[k]].rim += 4 - holeN - offN; if (holeN <= 1 && hs[hc[k]].a >= 3) hspurs++; }
      else if (holeN + offN >= 3 && holeN >= 1) teeth++;
    }
    const pmin = a => 2 * Math.ceil(2 * Math.sqrt(a));
    const hb = hs.filter(h => h.a >= 4);
    const ragged = hb.length ? hb.reduce((n, h) => n + h.rim, 0) / hb.reduce((n, h) => n + pmin(h.a), 0) : null;
    return { t: g.time, holes: g.holes.size, islands: big.length, sizes: big.slice(0, 6), pairGaps: gp.pair, heads, tiny1, tiny2, tinyFood, hollows: hs.length, ragged, teeth, hspurs };
  }

  // Timed room (tails leaving, as the rivals count it), holes and `extra` as walls.
  const free = new Int32Array(CELLS), seen = new Int32Array(CELLS);
  let st = 0;
  function roomGrid(g) {
    free.fill(0);
    for (const k of g.holes) free[k] = 1 << 30;
    for (const s of g.snakes) {
      if (!s.alive) continue;
      const L = s.body.length, extra = Math.max(0, s.stunUntil - g.tick) + Math.max(0, s.grow);
      s.body.forEach((c, j) => { const k = c.y * G + c.x; free[k] = Math.max(free[k], L - j + extra); });
    }
  }
  function room(s, extra, need) {
    const s0 = ++st, h0 = headCell(s);
    seen[h0] = s0; q[0] = h0;
    let r = 0, w = 0 + 1, n = 0;
    for (let d = 1; r < w && n < need; d++) {
      const end = w;
      while (r < end) {
        const i = q[r++], x = i % G, y = (i - x) / G;
        for (const [dx, dy] of D4) {
          const nx = x + dx, ny = y + dy;
          if (!inside(nx, ny)) continue;
          const ni = ny * G + nx;
          if (seen[ni] === s0 || free[ni] > d || (extra && extra.has(ni))) continue;
          seen[ni] = s0; n++; q[w++] = ni;
        }
      }
    }
    return n;
  }
  // Voronoi share: cells nearer my head than any other (bodies and holes walls).
  function voronoi(g) {
    const alive = g.snakes.filter(s => s.alive), dist = new Int32Array(CELLS).fill(-1), own = new Int32Array(CELLS).fill(-2);
    const block = new Uint8Array(CELLS);
    for (const k of g.holes) block[k] = 1;
    for (const s of alive) for (const c of s.body.slice(1)) block[c.y * G + c.x] = 1;
    let r = 0, w = 0;
    for (const s of alive) { const k = headCell(s); dist[k] = 0; own[k] = s.id; q[w++] = k; }
    while (r < w) {
      const i = q[r++], x = i % G, y = (i - x) / G;
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy;
        if (!inside(nx, ny)) continue;
        const ni = ny * G + nx;
        if (block[ni]) continue;
        if (dist[ni] < 0) { dist[ni] = dist[i] + 1; own[ni] = own[i]; q[w++] = ni; }
        else if (dist[ni] === dist[i] + 1 && own[ni] !== own[i]) own[ni] = -1;
      }
    }
    const count = {};
    for (let k = 0; k < CELLS; k++) if (own[k] >= 0) count[own[k]] = (count[own[k]] || 0) + 1;
    return count;
  }

  const rounds = [];
  for (let r = from; r < to; r++) {
    rng = seed == null ? Math.random : seeded(seed + r * 7919);
    let trace = 0;
    const g = E.createGame({ withPlayer: false });
    const R = {
      r, names: g.snakes.map(s => s.name), deaths: [], aliveAt: {}, lenAt: {}, meals: g.snakes.map(() => []),
      hungry: { open: [0, 0], mid: [0, 0], sd: [0, 0] }, // [snake-ticks, of them in the warning]
      aliveMs: { open: 0, mid: 0, sd: 0 },
      beetles: [], seals: [], crashes: 0, alight: 0, singes: 0, cookedEaten: 0, flashes: 0, jumps: 0, goldLeaps: 0, dashes: 0, strikes: 0,
      fires: [], weather: {},
    };
    const marks = [60000, 90000, 120000, 150000];
    let sdAt = null, lastHoles = -1, sep = null, duel = null, sd30 = null;
    const beetleRec = new Map(), underQ = [], epOf = new Map();
    R.episodes = []; // (each time a beetle is above ground: [startMs, nearTick|-1, startTick, endTick, endMs, outcome, burrows open at the end, gold, sd, within2Tick|-1])
    const fireMin = new Map(); // group -> { strike, min, touched }
    const seals = [], roomHist = {}, lateShots = [];
    R.tinyMade = [0, 0, 0, 0];
    R.shape = [0, 0, 0, 0, 0, 0]; // (strikes; sum of perimeter / least perimeter; spur cells; one-wide corridor cells; strikes with a spur; cells) // (islands of 1-2 cells a strike cut off: all, with food on them, with a snake on them, neither)
    while (g.snakes.some(s => s.alive) && g.snakes.filter(s => s.alive).length > 1 && g.time < MAX_TIME) {
      if (ahead) for (const s of g.snakes) { if (!s.alive) continue; if (!E.canThinkAhead(g, s)) break; E.thinkAhead(g, s); }
      const alive0 = g.snakes.filter(s => s.alive);
      for (const m of marks) if (R.aliveAt[m] == null && g.time >= m) { R.aliveAt[m] = alive0.length; R.lenAt[m] = alive0.map(s => s.body.length); }
      const phase = sdAt != null ? 'sd' : g.time < T.HUNGER_MID_FROM_MS ? 'open' : 'mid';
      const dt = E.tickMs(g);
      const wk = sdAt != null ? 'sd' : g.weather.kind;
      const W = (R.weather[wk] ||= { snakeMs: 0, meals: 0, deaths: 0, crashes: 0, flashes: 0, jumps: 0, golden: 0, alight: 0 });
      W.snakeMs += dt * alive0.length;
      for (const s of alive0) {
        R.hungry[phase][0]++;
        if (E.hungerLeft(g, s) < T.HUNGER_WARN_MS) R.hungry[phase][1]++;
        R.aliveMs[phase] += dt;
      }
      // beetles before the tick: where they are, and whether a head is near
      const before = [];
      for (const f of g.food) if (f.kind === 'beetle') {
        before.push(f);
        const rec = beetleRec.get(f);
        const near = alive0.some(s => man(s.body[0], f) <= T.BEETLE_FEAR);
        if (rec && rec.near == null && near) rec.near = g.tick;
        const ep = epOf.get(f);
        if (ep && ep[1] < 0 && near) ep[1] = g.tick;
        if (ep && ep[9] < 0 && alive0.some(s => man(s.body[0], f) <= 2)) ep[9] = g.tick;
      }
      // fire near heads
      for (const [k, f] of g.fires) {
        if (g.tick < f.from || g.tick >= f.until) continue;
        const c = { x: k % G, y: Math.floor(k / G) };
        let m = 99;
        for (const s of alive0) m = Math.min(m, man(s.body[0], c));
        const rec = fireMin.get(f.group) || { strike: false, ember: !!f.ember, min: 99 };
        if (f.strike) rec.strike = true;
        rec.min = Math.min(rec.min, m);
        fireMin.set(f.group, rec);
      }
      const ate = g.snakes.map(s => s.lastAte);
      const dying = E.step(g);
      const tk = g.tick - 1;
      for (const e of g.events) {
        if (e.type === 'crash') { R.crashes++; W.crashes++; }
        else if (e.type === 'alight') { R.alight++; W.alight++; }
        else if (e.type === 'singe') R.singes++;
        else if (e.type === 'strike') R.strikes++;
        else if (e.type === 'dash') { if (e.plain) { R.flashes++; W.flashes++; } else { R.dashes++; W.golden++; } }
        else if (e.type === 'leap') { if (e.gold) { R.goldLeaps++; W.golden++; } else { R.jumps++; W.jumps++; } }
        else if (e.type === 'eat' && e.cooked) R.cookedEaten++;
        if (e.type === 'eat' && !e.own && e.kind !== 'mushroom') { const mk = (R.mealKinds ||= { open: {}, mid: {}, sd: {} })[phase]; const kk = e.kind === 'food' ? (e.cooked ? 'baked' : 'apple') : e.kind; mk[kk] = (mk[kk] || 0) + 1; }
      }
      g.snakes.forEach((s, i) => { if (s.lastAte > ate[i] && s.ateTick === tk) { R.meals[i].push(g.time); W.meals++; } });
      // beetles after the tick
      const nowB = new Set(g.food.filter(f => f.kind === 'beetle'));
      const evAt = type => g.events.filter(e => e.type === type);
      for (const f of before) {
        if (nowB.has(f)) continue;
        const rec = beetleRec.get(f);
        if (!rec) continue;
        const eat = g.events.find(e => e.type === 'eat' && e.kind === 'beetle' && e.x === f.x && e.y === f.y);
        const dive = evAt('dive').find(e => e.x === f.x && e.y === f.y);
        let out;
        if (eat) { rec.out = out = 'caught'; rec.at = tk; rec.by = eat.snake.name; }
        else if (dive) { rec.dives++; underQ.push(rec); out = dive.dug ? 'dug' : 'dived'; }
        else if (evAt('flown').some(e => e.x === f.x && e.y === f.y)) { rec.out = out = 'flown'; rec.at = tk; }
        else { rec.out = out = 'other'; rec.at = tk; }
        const ep = epOf.get(f);
        if (ep) { ep[3] = tk; ep[4] = g.time; ep[5] = out; ep[6] = g.burrows.length; epOf.delete(f); }
      }
      for (const f of nowB) {
        if (beetleRec.has(f)) continue;
        const ep = [g.time, -1, tk, null, null, null, null, f.gold ? 1 : 0, sdAt != null ? 1 : 0, -1];
        R.episodes.push(ep); epOf.set(f, ep);
        if (evAt('emerge').some(e => e.x === f.x && e.y === f.y) && underQ.length) { beetleRec.set(f, underQ.shift()); continue; }
        const rec = { spawn: tk, sdSpawn: sdAt != null, gold: !!f.gold, near: null, out: null, dives: 0 };
        beetleRec.set(f, rec); R.beetles.push(rec);
      }
      if (g.woodpecker && sdAt == null) {
        sdAt = g.woodpecker.at;
        const alive = g.snakes.filter(s => s.alive);
        R.arrival = { t: sdAt, n: alive.length, lens: Object.fromEntries(alive.map(s => [s.id, s.body.length])), vor: voronoi(g), full: (g.holes.size + alive.reduce((n, s) => n + s.body.length, 0)) / CELLS };
      }
      for (const e of g.events) {
        if (e.type !== 'peck') continue;
        const sizes = label(g); lastHoles = -1;
        const hit = new Set(e.cells), seenC = new Set();
        if (hit.size >= 3) {
          let P = 0, sp = 0, co = 0;
          for (const k of hit) {
            const x = k % G, y = (k - x) / G, nb = D4.map(([dx, dy]) => inside(x + dx, y + dy) && hit.has((y + dy) * G + x + dx));
            const n = nb.filter(Boolean).length;
            P += 4 - n;
            if (n === 1) sp++;
            if (n === 2 && ((nb[0] && nb[2]) || (nb[1] && nb[3]))) co++;
          }
          R.shape[0]++; R.shape[1] += P / (2 * Math.ceil(2 * Math.sqrt(hit.size))); R.shape[2] += sp; R.shape[3] += co; if (sp) R.shape[4]++; R.shape[5] += hit.size;
        }
        const foodAt = new Set(g.food.map(f => f.y * G + f.x)), bodyAt = new Set(g.snakes.filter(s => s.alive).flatMap(s => s.body.map(c => c.y * G + c.x)));
        for (const k of hit) {
          const x = k % G, y = (k - x) / G;
          for (const [dx, dy] of D4) {
            const nx = x + dx, ny = y + dy;
            if (!inside(nx, ny)) continue;
            const c = comp[ny * G + nx];
            if (c < 0 || seenC.has(c) || sizes[c] > 2) continue;
            seenC.add(c);
            const cells = []; for (let j = 0; j < CELLS; j++) if (comp[j] === c) cells.push(j);
            R.tinyMade[0]++;
            if (cells.some(j => foodAt.has(j))) R.tinyMade[1]++;
            else if (cells.some(j => bodyAt.has(j))) R.tinyMade[2]++;
            else R.tinyMade[3]++;
          }
        }
      }
      // woodpecker aims: does the mark seal anyone in?
      for (const e of g.events) {
        if (e.type !== 'aim') continue;
        roomGrid(g);
        const mark = new Set(g.woodpecker.target);
        for (const s of g.snakes) {
          if (!s.alive) continue;
          const need = s.body.length + Math.max(0, s.grow);
          const before = room(s, null, need);
          if (before < need) continue;
          const after = room(s, mark, need);
          if (after < need) seals.push({ id: s.id, tick: tk, strikeAt: g.woodpecker.strikeAt, room: after, need, died: null });
        }
      }
      const left = g.snakes.filter(s => s.alive);
      for (const s of dying) {
        W.deaths++;
        if (sdAt != null && g.holes.size !== lastHoles) { R._sizes = label(g); lastHoles = g.holes.size; }
        let alone = null, island = null;
        if (sdAt != null) {
          const h = s.body[0], k = inside(h.x, h.y) ? h.y * G + h.x : -1;
          let c = k >= 0 ? comp[k] : -1;
          if (c < 0 && s.body[1]) c = comp[s.body[1].y * G + s.body[1].x];
          if (c >= 0) { island = R._sizes[c]; alone = !left.some(o => comp[headCell(o)] === c); }
        }
        const rh = roomHist[s.id];
        R.deaths.push({ id: s.id, t: g.time, cause: causeOf(s), fatal: s.fatal || null, sd: sdAt != null, len: s.body.length, alone, island, room1s: rh && rh.length >= 3 ? rh[rh.length - 3] : null });
        for (const x of seals) if (x.id === s.id && x.died == null) x.died = tk - x.strikeAt; // (ticks after the strike; negative: before it)
      }
      if (sdAt != null && left.length >= 2 && g.tick % 5 === 0) {
        roomGrid(g);
        for (const s of left) { const h = (roomHist[s.id] ||= []); h.push(room(s, null, 400)); if (h.length > 6) h.shift(); }
      }
      if (sdAt != null && left.length >= 2 && g.tick % 10 === 0) {
        const sh = islandShot(g); roomGrid(g); for (const h of sh.heads) h.room = room(g.snakes[h.id], null, 400);
        lateShots.push(sh); if (lateShots.length > 10) lateShots.shift(); lastHoles = -1;
      }
      // separation, the duel, 30 s into sudden death
      if (sdAt != null && left.length >= 2) {
        if (!sep) {
          if (g.holes.size !== lastHoles) { R._sizes = label(g); lastHoles = g.holes.size; }
          const cs = left.map(s => comp[headCell(s)]);
          if (cs.every(c => c >= 0) && new Set(cs).size === cs.length) sep = { t: g.time, n: left.length, size: Object.fromEntries(left.map((s, i) => [s.id, R._sizes[cs[i]]])) };
        }
        if (!duel && left.length === 2) { duel = islandShot(g); roomGrid(g); for (const h of duel.heads) h.room = room(g.snakes[h.id], null, 400); lastHoles = -1; }
        if (!sd30 && g.time >= sdAt + 30000) sd30 = islandShot(g);
        if (g.holes.size !== lastHoles) { R._sizes = label(g); lastHoles = g.holes.size; }
      }
      for (const s of g.snakes) if (s.alive) trace = (trace * 31 + s.body[0].x * 24 + s.body[0].y + g.tick) % 1000000007;
    }
    const alive = g.snakes.filter(s => s.alive);
    R.trace = trace;
    R.time = g.time;
    R.stalled = g.time >= MAX_TIME;
    R.winner = alive.length === 1 && !R.stalled ? alive[0].id : null;
    R.sdAt = sdAt;
    for (const m of marks) if (R.aliveAt[m] == null) { R.aliveAt[m] = alive.length; R.lenAt[m] = []; }
    R.sep = sep; R.duel = duel; R.sd30 = sd30;
    R.end = sdAt != null ? islandShot(g) : null;
    R.late = lateShots.find(x => x.t >= g.time - 5000) || null;
    R.seals = seals;
    R.fires = [...fireMin.values()].map(f => [f.strike ? 1 : f.ember ? 2 : 0, f.min]);
    R.leapsHeld = g.snakes.map(s => s.leaps);
    delete R._sizes;
    for (const b of R.beetles) if (!b.out) b.out = 'unresolved';
    for (const ep of R.episodes) if (!ep[5]) { ep[3] = g.tick; ep[4] = g.time; ep[5] = 'round over'; ep[6] = g.burrows.length; }
    rounds.push(R);
  }
  return rounds;
}

// ------------------------------------------------------------- summary
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const q1 = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[s.length >> 2]; };
const q3 = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[(s.length * 3) >> 2]; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const r1 = v => v == null ? null : Math.round(v * 10) / 10, r2 = v => v == null ? null : Math.round(v * 100) / 100, s = v => v == null ? null : Math.round(v / 1000);
function summarize(rounds) {
  const N = rounds.length, out = {};
  out.rounds = N;
  out.fingerprint = rounds.slice().sort((a, b) => a.r - b.r).reduce((h, R) => (h * 131 + R.trace) % 1000000007, 7);
  const times = rounds.map(R => R.time);
  out.median = s(med(times)); out.q1 = s(q1(times)); out.q3 = s(q3(times));
  const sdR = rounds.filter(R => R.sdAt != null);
  out.reachedSD = r1(100 * sdR.length / N);
  out.sdAt = s(med(sdR.map(R => R.sdAt))); out.sdAtQ = [s(q1(sdR.map(R => R.sdAt))), s(q3(sdR.map(R => R.sdAt)))];
  const sdLen = sdR.map(R => R.time - R.sdAt);
  out.sdLen = s(med(sdLen)); out.sdLenQ = [s(q1(sdLen)), s(q3(sdLen))];
  out.draws = rounds.filter(R => R.winner == null).length;
  out.stalled = rounds.filter(R => R.stalled).length;
  const deaths = rounds.flatMap(R => R.deaths);
  out.deathsBefore = r2(deaths.filter(d => !d.sd).length / N); out.deathsAfter = r2(deaths.filter(d => d.sd).length / N);
  out.firstDeath = s(med(rounds.map(R => R.deaths.length ? R.deaths[0].t : R.time)));
  out.aliveAt = Object.fromEntries([60000, 90000, 120000, 150000].map(m => [m / 1000, r2(mean(rounds.map(R => R.aliveAt[m])))]));
  out.lenAt = Object.fromEntries([60000, 120000].map(m => [m / 1000, r1(mean(rounds.flatMap(R => R.lenAt[m])))]));
  out.lenArrival = r1(mean(sdR.flatMap(R => Object.values(R.arrival.lens))));
  out.aliveArrival = r2(mean(sdR.map(R => R.arrival.n)));
  out.fullArrival = r2(mean(sdR.map(R => R.arrival.full)));
  const pc = (n, d) => d ? r1(100 * n / d) : null;
  const causes = {};
  for (const d of deaths) causes[d.cause] = (causes[d.cause] || 0) + 1;
  out.causes = Object.fromEntries(Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, pc(n, deaths.length)]));
  const sdDeaths = deaths.filter(d => d.sd), sdC = {};
  for (const d of sdDeaths) sdC[d.cause] = (sdC[d.cause] || 0) + 1;
  out.causesSD = Object.fromEntries(Object.entries(sdC).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, pc(n, sdDeaths.length)]));
  out.starvedPct = pc(causes.starved || 0, deaths.length);
  out.holePerSD = r2((causes.hole || 0) / Math.max(1, sdR.length));
  // self-boxed: in sudden death, alone on its island, and it bit itself or was boxed in
  const selfBoxed = sdDeaths.filter(d => d.alone && (d.cause === 'self' || d.fatal === 'boxed' || d.fatal === 'tiny') && d.cause !== 'pecked');
  out.selfBoxedPerRound = r2(selfBoxed.length / N); out.selfBoxedPctSD = pc(selfBoxed.length, sdDeaths.length);
  out.aloneDeathPctSD = pc(sdDeaths.filter(d => d.alone).length, sdDeaths.length);
  // win rates
  const per = {};
  for (const R of rounds) R.names.forEach((n, i) => { const p = (per[n] ||= { rounds: 0, wins: 0 }); p.rounds++; if (R.winner === i) p.wins++; });
  out.win = Object.fromEntries(Object.entries(per).map(([n, p]) => [n, pc(p.wins, p.rounds)]).sort((a, b) => b[1] - a[1]));
  const wr = Object.values(out.win); out.winSpread = [Math.min(...wr), Math.max(...wr)];
  // lottery: does length at arrival, room at arrival, or the biggest island pick the winner?
  const won = sdR.filter(R => R.winner != null && R.arrival.n >= 2);
  const topBy = (R, obj) => { const e = Object.entries(obj); const m = Math.max(...e.map(([, v]) => v)); return e.filter(([, v]) => v === m).map(([k]) => +k); };
  const pick = (list, f) => { let hit = 0, chance = 0; for (const R of list) { const top = f(R); if (!top) continue; chance += top.length / R.arrival.n; if (top.includes(R.winner)) hit += 1 / top.length; } return { hit: pc(hit, list.length), chance: pc(chance / 1, list.length) }; };
  out.longestWins = pick(won, R => topBy(R, R.arrival.lens));
  out.mostRoomWins = pick(won, R => { const v = {}; for (const id of Object.keys(R.arrival.lens)) v[id] = R.arrival.vor[id] || 0; return topBy(R, v); });
  const sepR = won.filter(R => R.sep);
  out.separated = pc(sepR.length, won.length);
  out.sepAt = s(med(sepR.map(R => R.sep.t - R.sdAt))); out.sepN = r2(mean(sepR.map(R => R.sep.n)));
  let bigHit = 0, bigChance = 0;
  for (const R of sepR) { const e = Object.entries(R.sep.size), m = Math.max(...e.map(([, v]) => v)), top = e.filter(([, v]) => v === m).map(([k]) => +k); bigChance += 1 / R.sep.n; if (top.includes(R.winner)) bigHit += 1 / top.length; }
  out.biggestIslandWins = { hit: pc(bigHit, sepR.length), chance: pc(bigChance, sepR.length) };
  // the duel: who wins when the last two start it
  const du = won.filter(R => R.duel && R.duel.heads.length === 2);
  out.duelSameIsland = pc(du.filter(R => R.duel.heads[0].shared).length, du.length);
  const duelApart = du.filter(R => !R.duel.heads[0].shared);
  out.duelApartBiggerWins = pc(duelApart.filter(R => { const [a, b] = R.duel.heads; if (a.island === b.island) return false; return (a.island > b.island ? a.id : b.id) === R.winner; }).length, duelApart.filter(R => R.duel.heads[0].island !== R.duel.heads[1].island).length);
  out.duelLongerWins = pc(du.filter(R => { const [a, b] = R.duel.heads; if (a.len === b.len) return false; return (a.len > b.len ? a.id : b.id) === R.winner; }).length, du.filter(R => R.duel.heads[0].len !== R.duel.heads[1].len).length);
  // island structure
  const shot = k => {
    const L = rounds.map(R => R[k]).filter(Boolean);
    if (!L.length) return null;
    const heads = L.flatMap(x => x.heads);
    const gapB = { connected: 0, 1: 0, 2: 0, 3: 0, 4: 0, '5+': 0 };
    for (const h of heads) {
      if (h.gap == null) gapB.connected++; else gapB[h.gap >= 5 ? '5+' : h.gap]++;
    }
    const pairs = L.flatMap(x => x.pairGaps), pairB = { 1: 0, 2: 0, 3: 0, 4: 0, '5+': 0 };
    for (const w of pairs) pairB[w >= 5 ? '5+' : w]++;
    return {
      n: L.length, holes: Math.round(mean(L.map(x => x.holes))), islands: r2(mean(L.map(x => x.islands))), biggest: Math.round(mean(L.map(x => x.sizes[0] || 0))),
      headIsland: med(heads.map(h => h.island)), headIslandQ: [q1(heads.map(h => h.island)), q3(heads.map(h => h.island))], sharedPct: pc(heads.filter(h => h.shared).length, heads.length),
      gapToLeave: Object.fromEntries(Object.entries(gapB).map(([k, n]) => [k, pc(n, heads.length)])),
      pairGaps: Object.fromEntries(Object.entries(pairB).map(([k, n]) => [k, pc(n, pairs.length)])),
    };
  };
  out.islandsLate = shot('late');
  const sh = rounds.reduce((a, R) => R.shape ? a.map((v, i) => v + R.shape[i]) : a, [0, 0, 0, 0, 0, 0]);
  const lsh = rounds.map(R => R.late).filter(x => x && x.ragged != null);
  out.shape = { strikes: r1(sh[0] / Math.max(1, rounds.filter(R => R.sdAt != null).length)), cells: r1(sh[5] / Math.max(1, sh[0])), perimRatio: r2(sh[1] / Math.max(1, sh[0])), spursPerStrike: r2(sh[2] / Math.max(1, sh[0])), corridorPerStrike: r2(sh[3] / Math.max(1, sh[0])), withSpurPct: pc(sh[4], sh[0]),
    lateHollows: r1(mean(lsh.map(x => x.hollows))), lateRagged: r2(mean(lsh.map(x => x.ragged))), lateTeeth: r1(mean(lsh.map(x => x.teeth))), lateHoleSpurs: r1(mean(lsh.map(x => x.hspurs))) };
  const lateS = rounds.map(R => R.late).filter(Boolean), endS = rounds.map(R => R.end).filter(Boolean);
  out.tiny = {
    late1: r2(mean(lateS.map(x => x.tiny1 ?? 0))), late2: r2(mean(lateS.map(x => x.tiny2 ?? 0))), lateWithFood: r2(mean(lateS.map(x => x.tinyFood ?? 0))),
    end1: r2(mean(endS.map(x => x.tiny1 ?? 0))), end2: r2(mean(endS.map(x => x.tiny2 ?? 0))),
    madePerSD: r2(rounds.reduce((n, R) => n + (R.tinyMade?.[0] || 0), 0) / Math.max(1, rounds.filter(R => R.sdAt != null).length)),
    madeFoodPct: pc(rounds.reduce((n, R) => n + (R.tinyMade?.[1] || 0), 0), rounds.reduce((n, R) => n + (R.tinyMade?.[0] || 0), 0)),
    madeSnakePct: pc(rounds.reduce((n, R) => n + (R.tinyMade?.[2] || 0), 0), rounds.reduce((n, R) => n + (R.tinyMade?.[0] || 0), 0)),
  };
  const lateH = rounds.filter(R => R.late).flatMap(R => R.late.heads);
  if (out.islandsLate) { out.islandsLate.roomMedian = med(lateH.map(h => h.room)); out.islandsLate.roomUnderLen = pc(lateH.filter(h => h.room < h.len).length, lateH.length); }
  const duelH = rounds.filter(R => R.duel).flatMap(R => R.duel.heads);
  out.duelRoomUnderLen = pc(duelH.filter(h => h.room < h.len).length, duelH.length);
  out.duelLen = s(med(rounds.filter(R => R.duel && R.winner != null).map(R => R.time - R.duel.t)));
  // what decided the round: the last death's cause
  const last = won.map(R => R.deaths[R.deaths.length - 1]).filter(Boolean), lc = {};
  for (const d of last) lc[d.cause] = (lc[d.cause] || 0) + 1;
  out.lastDeath = Object.fromEntries(Object.entries(lc).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, pc(n, last.length)]));
  // sudden-death deaths in a pocket: timed room under its length about 1 s before
  const withRoom = sdDeaths.filter(d => d.room1s != null);
  out.pocketDeathPctSD = pc(withRoom.filter(d => d.room1s < d.len).length, withRoom.length);
  out.islandsDuel = shot('duel'); out.islands30 = shot('sd30'); out.islandsEnd = shot('end');
  // hunger and food
  for (const ph of ['open', 'mid', 'sd']) {
    const ms = rounds.reduce((n, R) => n + R.aliveMs[ph], 0);
    let meals = 0;
    const gapsMs = [];
    for (const R of rounds) for (const m of R.meals) {
      const lo = ph === 'open' ? 0 : ph === 'mid' ? 45000 : R.sdAt ?? Infinity, hi = ph === 'open' ? 45000 : ph === 'mid' ? R.sdAt ?? Infinity : Infinity;
      for (let i = 0; i < m.length; i++) if (m[i] >= lo && m[i] < hi) { meals++; if (i) gapsMs.push(m[i] - m[i - 1]); }
    }
    const h = rounds.reduce((a, R) => [a[0] + R.hungry[ph][0], a[1] + R.hungry[ph][1]], [0, 0]);
    out['food_' + ph] = { mealsPerMin: r1(meals / (ms / 60000)), medianGap: r1(med(gapsMs) / 1000), q3Gap: r1(q3(gapsMs) / 1000), hungryPct: pc(h[1], h[0]) };
  }
  out.mealKinds = {};
  for (const ph of ['open', 'mid', 'sd']) { const ms = rounds.reduce((n, R) => n + R.aliveMs[ph], 0) / 60000, t = {}; for (const R of rounds) for (const [k, v] of Object.entries(R.mealKinds?.[ph] || {})) t[k] = (t[k] || 0) + v; out.mealKinds[ph] = Object.fromEntries(Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r1(v / ms)])); }
  const pre = rounds.reduce((a, R) => [a[0] + R.hungry.open[0] + R.hungry.mid[0], a[1] + R.hungry.open[1] + R.hungry.mid[1]], [0, 0]);
  out.hungryBeforeSD = pc(pre[1], pre[0]);
  // beetles
  const B = rounds.flatMap(R => R.beetles);
  const caught = B.filter(b => b.out === 'caught');
  out.beetles = {
    perRound: r2(B.length / N), caughtPerRound: r2(caught.length / N), caughtPct: pc(caught.length, B.length), flownPct: pc(B.filter(b => b.out === 'flown' || b.out === 'unresolved').length, B.length),
    goldPerRound: r2(B.filter(b => b.gold).length / N), goldCaughtPerRound: r2(caught.filter(b => b.gold).length / N), inSD: r2(B.filter(b => b.sdSpawn).length / N),
    chaseTicks: med(caught.filter(b => b.near != null).map(b => b.at - b.near)), chaseQ3: q3(caught.filter(b => b.near != null).map(b => b.at - b.near)),
    spawnToCatch: med(caught.map(b => b.at - b.spawn)), dives: r2(mean(B.map(b => b.dives))),
  };
  // beetle escapes, each time one is above ground (ended by the round's end: left out)
  const EP = rounds.flatMap(R => R.episodes.map(e => [...e, R.sdAt])).filter(e => e[5] !== 'round over');
  const esc = list => { const n = list.length, c = list.filter(e => e[5] === 'caught').length, d = list.filter(e => e[5] === 'dived' || e[5] === 'dug').length, dug = list.filter(e => e[5] === 'dug').length, f = list.filter(e => e[5] === 'flown').length;
    return { n: r2(n / N), caught: pc(c, n), dived: pc(d, n), dug: pc(dug, n), flown: pc(f, n), escaped: pc(d + f, n) }; };
  const chased = EP.filter(e => e[1] >= 0);
  out.escapes = {
    all: esc(EP), chased: esc(chased),
    chasedEarly: esc(chased.filter(e => e[4] < 60000)), chasedMid: esc(chased.filter(e => e[4] >= 60000 && !e[8])), chasedSD: esc(chased.filter(e => e[8])),
    chasedBurrows1: esc(chased.filter(e => e[6] <= 1)), chasedBurrows2: esc(chased.filter(e => e[6] === 2)), chasedBurrows3: esc(chased.filter(e => e[6] >= 3)),
    chaseTicks: med(chased.map(e => e[3] - e[1])), chaseQ3: q3(chased.map(e => e[3] - e[1])),
    chaseCaughtTicks: med(chased.filter(e => e[5] === 'caught').map(e => e[3] - e[1])), chaseEscapedTicks: med(chased.filter(e => e[5] !== 'caught').map(e => e[3] - e[1])),
    close: esc(EP.filter(e => e[9] >= 0)), closeEarly: esc(EP.filter(e => e[9] >= 0 && e[4] < 60000)), closeMid: esc(EP.filter(e => e[9] >= 0 && e[4] >= 60000 && !e[8])), closeSD: esc(EP.filter(e => e[9] >= 0 && e[8])),
    closeTicks: med(EP.filter(e => e[9] >= 0).map(e => e[3] - e[9])),
    unchasedFlown: pc(EP.filter(e => e[1] < 0 && e[5] === 'flown').length, EP.filter(e => e[1] < 0).length),
  };
  const golden = rounds.reduce((n, R) => n + R.goldLeaps, 0);
  out.goldLeapsPerRound = r2(golden / N);
  // seals
  const S = rounds.flatMap(R => R.seals);
  out.seals = {
    perRound: r2(S.length / N), perSDRound: r2(S.length / Math.max(1, sdR.length)),
    diedByStrike: r2(S.filter(x => x.died != null && x.died <= 0).length / N),
    diedWithin3s: r2(S.filter(x => x.died != null && x.died <= 30).length / N),
    diedWithin10s: r2(S.filter(x => x.died != null && x.died <= 100).length / N),
    shareOfSDDeaths3s: pc(S.filter(x => x.died != null && x.died <= 30).length, sdDeaths.length),
    tight: r2(S.filter(x => x.room < 10).length / N),
  };
  // fire and weather
  const F = rounds.flatMap(R => R.fires);
  const fb = list => ({ n: r2(list.length / N), touched: pc(list.filter(f => f[1] === 0).length, list.length), within1: pc(list.filter(f => f[1] <= 1).length, list.length), within2: pc(list.filter(f => f[1] <= 2).length, list.length), within4: pc(list.filter(f => f[1] <= 4).length, list.length), medianClosest: med(list.map(f => f[1])) });
  out.fire = {
    strikes: r2(rounds.reduce((n, R) => n + R.strikes, 0) / N), alightPerRound: r2(rounds.reduce((n, R) => n + R.alight, 0) / N), singesPerRound: r2(rounds.reduce((n, R) => n + R.singes, 0) / N),
    burnDeathsPerRound: r2(deaths.filter(d => d.cause === 'fire').length / N), cookedEatenPerRound: r2(rounds.reduce((n, R) => n + R.cookedEaten, 0) / N),
    lightning: fb(F.filter(f => f[0] === 1)), spread: fb(F.filter(f => f[0] === 0)), embers: fb(F.filter(f => f[0] === 2)),
  };
  const Wt = {};
  for (const R of rounds) for (const [k, w] of Object.entries(R.weather)) { const t = (Wt[k] ||= {}); for (const [f, v] of Object.entries(w)) t[f] = (t[f] || 0) + v; }
  out.weather = Object.fromEntries(Object.entries(Wt).map(([k, w]) => { const m = w.snakeMs / 60000; return [k, { snakeMin: r1(m / N), meals: r2(w.meals / m), deaths: Math.round(1000 * w.deaths / m) / 1000, crashes: r2(w.crashes / m), flashes: r2(w.flashes / m), jumps: r2(w.jumps / m), golden: r2(w.golden / m), alight: r2(w.alight / m) }]; }));
  return out;
}

if (isMainThread && require.main === module) {
  const args = process.argv.slice(2);
  const val = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const rounds = Number(args[0]) || 200, seed = val('--seed') != null ? Number(val('--seed')) : null;
  const root = path.resolve(val('--root')), ahead = args.includes('--ahead');
  const workers = Math.max(1, Math.min(rounds, Math.floor(os.cpus().length / 2))); // (half the cores, never more)
  const jobs = Array.from({ length: workers }, (_, i) => ({ from: Math.floor(rounds * i / workers), to: Math.floor(rounds * (i + 1) / workers), seed, ahead, root }));
  const t0 = Date.now();
  Promise.all(jobs.map(job => new Promise((res, rej) => { const w = new Worker(__filename, { workerData: job }); w.once('message', res); w.once('error', rej); }))).then(parts => {
    const all = parts.flat();
    const sum = summarize(all);
    sum.label = val('--label') || path.basename(root); sum.seed = seed; sum.secs = Math.round((Date.now() - t0) / 1000);
    if (val('--out')) fs.writeFileSync(val('--out'), JSON.stringify({ summary: sum, rounds: all }));
    console.log(JSON.stringify(sum));
  }, e => { console.error(e); process.exit(1); });
} else if (!isMainThread) parentPort.postMessage(play(workerData));
module.exports = { summarize };
