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
//
// Personality: on top of that shared sense, each persona chases its own goal.
// Viper hunts a victim, Gobbler eats almost regardless of risk, and Ghost keeps
// its distance and stays small.
window.SnakeAI = (() => {
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const DIR_LIST = Object.values(DIRS);

  // Weights (w):
  //   space, territory, aggression  room / board share / shrinking everyone else
  //   food, eat, pellet, foodRange  pull per step toward food, bonus for eating, pellet worth
  //   contested                     chase food even when a rival gets there first
  //   hungryBelow, fedFactor        at this length or more, food matters only fedFactor as much
  //   margin                        spare room wanted beyond its own length
  //   headRisk, zoneRisk            fear of a rival's next move / of where it might be
  //   distance                      reward per step of distance from the nearest rival head
  //   hunt                          { squeeze, chase, lead, playerBias }: shrink the victim's
  //                                 room and get to the cell `lead` steps in front of its head
  const PERSONAS = {
    viper: {
      name: 'Viper', color: '#c084fc', reactionMs: 220, depth: 3,
      w: {
        space: 1, territory: 0.8, aggression: 0.3,
        food: 4, eat: 60, pellet: 1, foodRange: 40, hungryBelow: 12, fedFactor: 0.2,
        margin: 10, headRisk: 600, zoneRisk: 40,
        hunt: { squeeze: 2.5, chase: 6, lead: 4, playerBias: 0.6 },
      },
    },
    gobbler: {
      name: 'Gobbler', color: '#fb923c', reactionMs: 250, depth: 3,
      w: {
        space: 1, territory: 0.2,
        food: 12, eat: 300, pellet: 2, foodRange: 60, contested: true,
        margin: 2, headRisk: 500, zoneRisk: 30,
      },
    },
    ghost: {
      name: 'Ghost', color: '#e2e8f0', reactionMs: 240, depth: 3,
      w: {
        space: 2, territory: 0.6,
        food: 3, eat: 30, pellet: 1, foodRange: 15, hungryBelow: 8, fedFactor: 0,
        margin: 10, headRisk: 1200, zoneRisk: 400, distance: 25,
      },
    },
    // Not in the game: the old all-rounder, used by the simulator as a neutral fourth snake.
    baseline: {
      name: 'Baseline', color: '#94a3b8', reactionMs: 240, depth: 3,
      w: {
        space: 1, territory: 1.2, aggression: 0.3,
        food: 5, eat: 80, pellet: 1.2, foodRange: 60,
        margin: 3, headRisk: 600, zoneRisk: 150,
      },
    },
  };

  const TRAPPED = 5000;
  const DEAD = -1e6;
  const SQUEEZE_CAP = 120; // stop counting a victim's room past this
  const DISTANCE_CAP = 14; // Ghost is happy once this far from everyone

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
    const heads = []; // predicted current head of each opponent
    for (const o of others) {
      const L = o.body.length;
      let hx = o.body[0].x, hy = o.body[0].y;
      for (let s = 1; s <= age; s++) {
        const nx = hx + o.dir.x, ny = hy + o.dir.y;
        if (!inside(nx, ny) || otherFree[ny * N + nx] > s) break;
        hx = nx; hy = ny;
        mineFree[hy * N + hx] = Math.max(mineFree[hy * N + hx], L);
      }
      heads.push({ x: hx, y: hy });
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

    // How much food matters right now, given how long I already am.
    const myLen = me.body.length + me.grow;
    const foodW = myLen >= (w.hungryBelow ?? Infinity) ? w.food * w.fedFactor : w.food;
    const eatW = myLen >= (w.hungryBelow ?? Infinity) ? w.eat * w.fedFactor : w.eat;

    // Viper's victim: the nearest rival head, with the player counting as closer.
    let victim = -1;
    if (w.hunt && others.length) {
      let bestD = Infinity;
      others.forEach((o, k) => {
        const d = (Math.abs(heads[k].x - me.body[0].x) + Math.abs(heads[k].y - me.body[0].y))
          * (o.isPlayer ? w.hunt.playerBias : 1);
        if (d < bestD) { bestD = d; victim = k; }
      });
    }
    let target = null; // the cell just in front of the victim's head
    if (victim >= 0) {
      const d = others[victim].dir, h = heads[victim];
      target = {
        x: Math.min(N - 1, Math.max(0, h.x + d.x * w.hunt.lead)),
        y: Math.min(N - 1, Math.max(0, h.y + d.y * w.hunt.lead)),
      };
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
      //    It also finds the best food by distance alone, ignoring rivals.
      const cap = L * 2 + 20;
      const stampF = ++stamp;
      seen[headI] = stampF;
      let frontier = [headI], space = 0, anyFood = 0;
      // A contested-food eater keeps searching past the room cap until it sees food.
      for (let d = 1; frontier.length && (space < cap || (w.contested && !anyFood && d <= w.foodRange)); d++) {
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
            const v = foodValue.get(ni);
            if (v) anyFood = Math.max(anyFood, v * Math.max(0, w.foodRange - d));
            next.push(ni);
          }
        }
        frontier = next;
      }
      space = Math.min(space, cap);

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

      // 3. Food: a steady pull of foodW per step closer. Normally only food I
      //    reach before any rival counts; a contested eater counts all of it.
      let foodScore = 0;
      for (const [i, v] of foodValue) {
        if (ownerStamp[i] === stampV && owner[i] === 0) {
          foodScore = Math.max(foodScore, v * Math.max(0, w.foodRange - (claimT[i] - t)));
        }
      }
      if (w.contested) foodScore = Math.max(foodScore, anyFood);
      // Nothing uncontested: drift toward the nearest food anyway, more weakly.
      else if (foodScore === 0) foodScore = 0.3 * anyFood;

      let othersTerritory = 0;
      others.forEach((o, k) => { othersTerritory += counts[k + 1]; });

      let score = w.space * space
        + w.territory * counts[0]
        - (w.aggression || 0) * othersTerritory
        + foodW * foodScore;

      // 4. Viper: shrink the victim's room and get in front of it.
      if (victim >= 0) {
        score -= w.hunt.squeeze * victimRoom(t);
        score -= w.hunt.chase * (Math.abs(head.x - target.x) + Math.abs(head.y - target.y));
      }

      // 5. Ghost: stay away from every rival head.
      if (w.distance) {
        let nearest = DISTANCE_CAP;
        for (const h of heads) nearest = Math.min(nearest, Math.abs(head.x - h.x) + Math.abs(head.y - h.y));
        score += w.distance * nearest;
      }

      body.forEach(c => { ownFree[c.y * N + c.x] = 0; });

      const need = L + w.margin;
      if (space < need) score -= TRAPPED + 100 * (need - space);
      return score;
    }

    // How much room the victim has from its predicted head, with my body
    // (as placed in the current evaluation, via ownFree) in the way.
    function victimRoom(t) {
      const h = heads[victim];
      const start = h.y * N + h.x;
      const stampS = ++stamp;
      seen[start] = stampS;
      let frontier = [start], room = 0;
      for (let d = 1; frontier.length && room < SQUEEZE_CAP; d++) {
        const next = [];
        for (const i of frontier) {
          const x = i % N, y = (i - x) / N;
          for (const dd of DIR_LIST) {
            const nx = x + dd.x, ny = y + dd.y;
            if (!inside(nx, ny)) continue;
            const ni = ny * N + nx;
            if (seen[ni] === stampS || otherFree[ni] > d || ownFree[ni] > d - t) continue;
            seen[ni] = stampS;
            room++;
            next.push(ni);
          }
        }
        frontier = next;
      }
      return Math.min(room, SQUEEZE_CAP);
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
      const gain = v * (foodW * w.foodRange + eatW * Math.pow(0.85, t)) - risk[i] * Math.pow(0.6, t);
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
