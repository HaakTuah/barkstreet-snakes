// AI brain for the rival snakes.
//
// Fairness: an AI sees the *other* snakes as they were `age` ticks ago (its
// reaction time), so it can't respond to a sudden turn any faster than a
// human could. It treats the cells an opponent might have reached since then
// as risky. It always knows its own body exactly.
//
// Cleverness: for every move sequence up to `depth` steps it scores the result
// with a timed flood fill (do I still have room?), a Voronoi split of the board
// (whose territory is this?) and the food it can reach before anyone else.
window.SnakeAI = (() => {
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const DIR_LIST = Object.values(DIRS);

  const PERSONAS = {
    viper: {
      name: 'Viper', color: '#c084fc', reactionMs: 220, depth: 3,
      w: { space: 1, territory: 1.2, aggression: 0.5, playerAggression: 0.6, food: 5, eat: 80, pellet: 1.2, margin: 1, headRisk: 500, zoneRisk: 120 },
    },
    gobbler: {
      name: 'Gobbler', color: '#fb923c', reactionMs: 250, depth: 3,
      w: { space: 1, territory: 0.4, aggression: 0.1, playerAggression: 0, food: 9, eat: 180, pellet: 1.8, margin: 3, headRisk: 600, zoneRisk: 200 },
    },
    warden: {
      name: 'Warden', color: '#60a5fa', reactionMs: 240, depth: 3,
      w: { space: 1.5, territory: 1.6, aggression: 0.3, playerAggression: 0, food: 3, eat: 45, pellet: 1, margin: 8, headRisk: 900, zoneRisk: 300 },
    },
  };

  const TRAPPED = 5000;
  const FOOD_RANGE = 60; // food further than this many steps doesn't attract
  const DEAD = -1e6;

  // Scratch buffers, reused between calls (grid size is fixed per page).
  let bufN = 0, mineFree, otherFree, ownFree, risk, seen, owner, claimT, ownerStamp;
  let stamp = 0;
  function ensureBuffers(N) {
    if (bufN === N) return;
    bufN = N;
    const size = N * N;
    mineFree = new Int32Array(size);
    otherFree = new Int32Array(size);
    ownFree = new Int32Array(size);
    risk = new Float32Array(size);
    seen = new Int32Array(size);
    owner = new Int8Array(size);
    claimT = new Int32Array(size);
    ownerStamp = new Int32Array(size);
  }

  // view = { grid, me: { body, dir, grow }, others: [{ body, dir, isPlayer }], food: [{ x, y, kind }], age }
  function decide(view, persona) {
    const N = view.grid;
    const { me, others, food, age } = view;
    const w = persona.w;
    ensureBuffers(N);
    mineFree.fill(0); otherFree.fill(0); risk.fill(0);

    const inside = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

    // Opponent bodies as last seen. A segment j from the head leaves its cell
    // after (len - j) ticks; we ignore the time that has passed since the
    // snapshot, which is conservative in case they ate something.
    for (const o of others) {
      const L = o.body.length;
      o.body.forEach((c, j) => {
        const i = c.y * N + c.x;
        otherFree[i] = Math.max(otherFree[i], L - j);
      });
    }
    mineFree.set(otherFree);

    // Where is each opponent now? Assume it kept going straight for `age` ticks
    // and treat that path as occupied (for me only). Around it, mark cells it
    // could step into next tick as a head-on risk, and its wider reach as a
    // soft risk zone.
    for (const o of others) {
      const L = o.body.length;
      let hx = o.body[0].x, hy = o.body[0].y;
      for (let s = 1; s <= age; s++) {
        const nx = hx + o.dir.x, ny = hy + o.dir.y;
        if (!inside(nx, ny) || otherFree[ny * N + nx] > s) break;
        hx = nx; hy = ny;
        mineFree[hy * N + hx] = Math.max(mineFree[hy * N + hx], L);
      }
      for (const d of DIR_LIST) {
        const nx = hx + d.x, ny = hy + d.y;
        if (inside(nx, ny)) risk[ny * N + nx] += w.headRisk;
      }
      // Soft zone: everywhere it could be within age + 1 steps of its last seen head.
      const stampZ = ++stamp;
      let frontier = [o.body[0].y * N + o.body[0].x];
      seen[frontier[0]] = stampZ;
      for (let s = 1; s <= age + 1; s++) {
        const next = [];
        for (const i of frontier) {
          const x = i % N, y = (i - x) / N;
          for (const d of DIR_LIST) {
            const nx = x + d.x, ny = y + d.y;
            if (!inside(nx, ny)) continue;
            const ni = ny * N + nx;
            if (seen[ni] === stampZ || otherFree[ni] > s) continue;
            seen[ni] = stampZ;
            risk[ni] += w.zoneRisk;
            next.push(ni);
          }
        }
        frontier = next;
      }
    }

    const foodValue = new Map();
    for (const f of food) {
      const v = f.kind === 'pellet' ? w.pellet : 1;
      const i = f.y * N + f.x;
      foodValue.set(i, (foodValue.get(i) || 0) + v);
    }

    // Can my head step into cell (x, y) as move number `step` from now?
    function canEnter(body, grow, x, y, step) {
      if (!inside(x, y) || mineFree[y * N + x] > step) return false;
      const keep = grow > 0 ? body.length : body.length - 1;
      for (let j = 0; j < keep; j++) if (body[j].x === x && body[j].y === y) return false;
      return true;
    }

    function evaluate(body, grow, t) {
      const L = body.length + grow;
      const head = body[0];
      const headI = head.y * N + head.x;
      body.forEach((c, j) => { ownFree[c.y * N + c.x] = body.length - j + grow; });
      // Absolute time T (ticks from now) at which a cell can be entered.
      const passMine = (i, T) => mineFree[i] <= T && ownFree[i] <= T - t;
      const passOther = (i, T) => otherFree[i] <= T && ownFree[i] <= T - t;

      // 1. Room: timed flood fill from my head (tail cells open up as I move).
      const cap = L * 2 + 20;
      const stampF = ++stamp;
      seen[headI] = stampF;
      let frontier = [headI], space = 0, nearestFood = Infinity;
      for (let d = 1; frontier.length && space < cap; d++) {
        const next = [];
        for (const i of frontier) {
          const x = i % N, y = (i - x) / N;
          for (const dd of DIR_LIST) {
            const nx = x + dd.x, ny = y + dd.y;
            if (!inside(nx, ny)) continue;
            const ni = ny * N + nx;
            if (seen[ni] === stampF || !passMine(ni, t + d)) continue;
            seen[ni] = stampF;
            space++;
            if (nearestFood === Infinity && foodValue.has(ni)) nearestFood = d;
            next.push(ni);
          }
        }
        frontier = next;
      }

      // 2. Territory: multi-source BFS, opponents start at their last seen
      //    head `age` ticks in the past, I start at my head at time t.
      const stampV = ++stamp;
      const counts = new Array(others.length + 1).fill(0);
      const sources = [{ i: headI, T: t, own: 0 }];
      others.forEach((o, k) => sources.push({ i: o.body[0].y * N + o.body[0].x, T: -age, own: k + 1 }));
      sources.sort((a, b) => a.T - b.T);
      let si = 0;
      let T = sources[0].T;
      let level = [];
      const claim = (i, own, at) => {
        ownerStamp[i] = stampV; owner[i] = own; claimT[i] = at; counts[own]++;
      };
      while (level.length || si < sources.length) {
        while (si < sources.length && sources[si].T === T) {
          const s = sources[si++];
          if (ownerStamp[s.i] !== stampV) { claim(s.i, s.own, T); level.push(s.i); }
        }
        const next = [];
        for (const i of level) {
          const own = owner[i];
          if (own < 0) continue; // became contested
          const x = i % N, y = (i - x) / N;
          const pass = own === 0 ? passMine : passOther;
          for (const dd of DIR_LIST) {
            const nx = x + dd.x, ny = y + dd.y;
            if (!inside(nx, ny)) continue;
            const ni = ny * N + nx;
            if (ownerStamp[ni] === stampV) {
              if (claimT[ni] === T + 1 && owner[ni] >= 0 && owner[ni] !== own) {
                counts[owner[ni]]--;
                owner[ni] = -1;
              }
              continue;
            }
            if (!pass(ni, T + 1)) continue;
            claim(ni, own, T + 1);
            next.push(ni);
          }
        }
        level = next;
        T = level.length || si >= sources.length ? T + 1 : sources[si].T;
      }

      // 3. Food I'll reach first: a steady pull of w.food per step closer.
      let foodScore = 0;
      for (const [i, v] of foodValue) {
        if (ownerStamp[i] === stampV && owner[i] === 0) {
          foodScore = Math.max(foodScore, v * Math.max(0, FOOD_RANGE - (claimT[i] - t)));
        }
      }
      // Nothing uncontested: drift toward the nearest food anyway, more weakly.
      if (foodScore === 0 && nearestFood !== Infinity) foodScore = 0.3 * Math.max(0, FOOD_RANGE - nearestFood);

      let othersTerritory = 0, playerTerritory = 0;
      others.forEach((o, k) => {
        othersTerritory += counts[k + 1];
        if (o.isPlayer) playerTerritory += counts[k + 1];
      });

      body.forEach(c => { ownFree[c.y * N + c.x] = 0; });

      let score = w.space * space
        + w.territory * counts[0]
        - w.aggression * othersTerritory
        - w.playerAggression * playerTerritory
        + w.food * foodScore;
      const need = L + w.margin;
      if (space < need) score -= TRAPPED + 100 * (need - space);
      return score;
    }

    // Score of moving `d` as step t + 1, then playing on for `depth - 1` more steps.
    function move(body, grow, d, depth, t, bonus) {
      const nx = body[0].x + d.x, ny = body[0].y + d.y;
      if (!canEnter(body, grow, nx, ny, t + 1)) return null;
      const i = ny * N + nx;
      const nb = [{ x: nx, y: ny }, ...body];
      let g = grow;
      if (g > 0) g--; else nb.pop();
      // Eating must beat the pull that food had on us, plus a bonus for eating sooner.
      const v = foodValue.get(i) || 0;
      if (v) { g++; foodValue.delete(i); }
      const gain = v * (w.food * FOOD_RANGE + w.eat * Math.pow(0.85, t)) - risk[i] * Math.pow(0.6, t);
      const score = depth <= 1
        ? evaluate(nb, g, t + 1) + bonus + gain
        : search(nb, g, depth - 1, t + 1, bonus + gain);
      if (v) foodValue.set(i, v);
      return score;
    }

    function search(body, grow, depth, t, bonus) {
      const back = { x: body[1].x - body[0].x, y: body[1].y - body[0].y };
      let best = -Infinity;
      for (const d of DIR_LIST) {
        if (d.x === back.x && d.y === back.y) continue;
        const s = move(body, grow, d, depth, t, bonus);
        if (s !== null) best = Math.max(best, s);
      }
      // Dead end: dying later beats dying sooner.
      return best === -Infinity ? DEAD + t * 1000 : best;
    }

    let bestDir = me.dir, bestScore = -Infinity;
    for (const d of DIR_LIST) {
      if (d.x === -me.dir.x && d.y === -me.dir.y) continue;
      const s = move(me.body, me.grow, d, persona.depth, 0, 0);
      const score = (s === null ? 2 * DEAD : s) + Math.random() * 1e-3; // tie-break
      if (score > bestScore) { bestScore = score; bestDir = d; }
    }
    return bestDir;
  }

  return { DIRS, PERSONAS, decide };
})();
