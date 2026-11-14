// Applies the study's measuring additions to study.js, in the order they were
// first made (kept as one script after the scratch folder was wiped).
const fs=require('fs');let s=fs.readFileSync(__dirname+'/study.js','utf8');
const rep=(a,b)=>{if(s.split(a).length!==2)throw new Error('miss '+a.slice(0,70));s=s.replace(a,()=>b);};
// (a) fixes
rep(`        if (sdAt != null && g.holes.size !== lastHoles) { label(g); lastHoles = g.holes.size; }`,`        if (sdAt != null && g.holes.size !== lastHoles) { R._sizes = label(g); lastHoles = g.holes.size; }`);
rep(`          if (c >= 0) { island = label.sizesCache ? null : null; alone = !left.some(o => comp[headCell(o)] === c); }`,`          if (c >= 0) { island = R._sizes[c]; alone = !left.some(o => comp[headCell(o)] === c); }`);
rep(`len: s.body.length, alone });`,`len: s.body.length, alone, island });`);
rep(`deaths: r2(1000 * w.deaths / m / 10) / 100,`,`deaths: Math.round(1000 * w.deaths / m) / 1000,`);
rep(`if (isMainThread) {\n  const args`,`if (isMainThread && require.main === module) {\n  const args`);
rep(`} else parentPort.postMessage(play(workerData));`,`} else if (!isMainThread) parentPort.postMessage(play(workerData));`);
// (b) room history and late shots
rep(`    const seals = [];`,`    const seals = [], roomHist = {}, lateShots = [];`);
rep(`      // separation, the duel, 30 s into sudden death`,`      if (sdAt != null && left.length >= 2 && g.tick % 5 === 0) {
        roomGrid(g);
        for (const s of left) { const h = (roomHist[s.id] ||= []); h.push(room(s, null, 400)); if (h.length > 6) h.shift(); }
      }
      if (sdAt != null && left.length >= 2 && g.tick % 10 === 0) {
        const sh = islandShot(g); roomGrid(g); for (const h of sh.heads) h.room = room(g.snakes[h.id], null, 400);
        lateShots.push(sh); if (lateShots.length > 10) lateShots.shift(); lastHoles = -1;
      }
      // separation, the duel, 30 s into sudden death`);
rep(`        R.deaths.push({ id: s.id, t: g.time, cause: causeOf(s), fatal: s.fatal || null, sd: sdAt != null, len: s.body.length, alone, island });`,
`        const rh = roomHist[s.id];
        R.deaths.push({ id: s.id, t: g.time, cause: causeOf(s), fatal: s.fatal || null, sd: sdAt != null, len: s.body.length, alone, island, room1s: rh && rh.length >= 3 ? rh[rh.length - 3] : null });`);
rep(`        if (!duel && left.length === 2) duel = islandShot(g);`,`        if (!duel && left.length === 2) { duel = islandShot(g); roomGrid(g); for (const h of duel.heads) h.room = room(g.snakes[h.id], null, 400); lastHoles = -1; }`);
rep(`    R.end = sdAt != null ? islandShot(g) : null;`,`    R.end = sdAt != null ? islandShot(g) : null;
    R.late = lateShots.find(x => x.t >= g.time - 5000) || null;`);
rep(`  out.islandsDuel = shot('duel');`,`  out.islandsLate = shot('late');
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
  out.islandsDuel = shot('duel');`);
// (c) beetle episodes
rep(`    const beetleRec = new Map(), underQ = [];`,`    const beetleRec = new Map(), underQ = [], epOf = new Map();
    R.episodes = []; // (each time a beetle is above ground: [startMs, nearTick|-1, startTick, endTick, endMs, outcome, burrows open at the end, gold, sd, within2Tick|-1])`);
rep(`        if (rec && rec.near == null && alive0.some(s => man(s.body[0], f) <= T.BEETLE_FEAR)) rec.near = g.tick;`,
`        const near = alive0.some(s => man(s.body[0], f) <= T.BEETLE_FEAR);
        if (rec && rec.near == null && near) rec.near = g.tick;
        const ep = epOf.get(f);
        if (ep && ep[1] < 0 && near) ep[1] = g.tick;`);
rep(`        if (eat) { rec.out = 'caught'; rec.at = tk; rec.by = eat.snake.name; }
        else if (evAt('dive').some(e => e.x === f.x && e.y === f.y)) { rec.dives++; underQ.push(rec); }
        else if (evAt('flown').some(e => e.x === f.x && e.y === f.y)) { rec.out = 'flown'; rec.at = tk; }
        else { rec.out = 'other'; rec.at = tk; }`,
`        const dive = evAt('dive').find(e => e.x === f.x && e.y === f.y);
        let out;
        if (eat) { rec.out = out = 'caught'; rec.at = tk; rec.by = eat.snake.name; }
        else if (dive) { rec.dives++; underQ.push(rec); out = dive.dug ? 'dug' : 'dived'; }
        else if (evAt('flown').some(e => e.x === f.x && e.y === f.y)) { rec.out = out = 'flown'; rec.at = tk; }
        else { rec.out = out = 'other'; rec.at = tk; }
        const ep = epOf.get(f);
        if (ep) { ep[3] = tk; ep[4] = g.time; ep[5] = out; ep[6] = g.burrows.length; epOf.delete(f); }`);
rep(`        if (beetleRec.has(f)) continue;
        if (evAt('emerge').some(e => e.x === f.x && e.y === f.y) && underQ.length) { beetleRec.set(f, underQ.shift()); continue; }`,
`        if (beetleRec.has(f)) continue;
        const ep = [g.time, -1, tk, null, null, null, null, f.gold ? 1 : 0, sdAt != null ? 1 : 0, -1];
        R.episodes.push(ep); epOf.set(f, ep);
        if (evAt('emerge').some(e => e.x === f.x && e.y === f.y) && underQ.length) { beetleRec.set(f, underQ.shift()); continue; }`);
rep(`    for (const b of R.beetles) if (!b.out) b.out = 'unresolved';`,`    for (const b of R.beetles) if (!b.out) b.out = 'unresolved';
    for (const ep of R.episodes) if (!ep[5]) { ep[3] = g.tick; ep[4] = g.time; ep[5] = 'round over'; ep[6] = g.burrows.length; }`);
// (d) a real chase: a head within 2 cells
rep(`        if (ep && ep[1] < 0 && near) ep[1] = g.tick;`,`        if (ep && ep[1] < 0 && near) ep[1] = g.tick;
        if (ep && ep[9] < 0 && alive0.some(s => man(s.body[0], f) <= 2)) ep[9] = g.tick;`);
rep(`  const golden = rounds.reduce((n, R) => n + R.goldLeaps, 0);`,`  // beetle escapes, each time one is above ground (ended by the round's end: left out)
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
  const golden = rounds.reduce((n, R) => n + R.goldLeaps, 0);`);
// (e) tiny islands
rep(`    return { t: g.time, holes: g.holes.size, islands: big.length, sizes: big.slice(0, 6), pairGaps: gp.pair, heads };`,
`    const foodAt = new Set(g.food.map(f => f.y * G + f.x));
    let tiny1 = 0, tiny2 = 0, tinyFood = 0;
    sizes.forEach((n, id) => { if (n > 2) return; if (n === 1) tiny1++; else tiny2++; for (let k = 0; k < CELLS; k++) if (comp[k] === id && foodAt.has(k)) { tinyFood++; break; } });
    return { t: g.time, holes: g.holes.size, islands: big.length, sizes: big.slice(0, 6), pairGaps: gp.pair, heads, tiny1, tiny2, tinyFood };`);
rep(`    const seals = [], roomHist = {}, lateShots = [];`,`    const seals = [], roomHist = {}, lateShots = [];
    R.tinyMade = [0, 0, 0, 0]; // (islands of 1-2 cells a strike cut off: all, with food on them, with a snake on them, neither)`);
rep(`      // woodpecker aims: does the mark seal anyone in?`,`      for (const e of g.events) {
        if (e.type !== 'peck') continue;
        const sizes = label(g); lastHoles = -1;
        const hit = new Set(e.cells), seenC = new Set();
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
      // woodpecker aims: does the mark seal anyone in?`);
rep(`  out.islandsLate = shot('late');`,`  out.islandsLate = shot('late');
  const lateS = rounds.map(R => R.late).filter(Boolean), endS = rounds.map(R => R.end).filter(Boolean);
  out.tiny = {
    late1: r2(mean(lateS.map(x => x.tiny1 ?? 0))), late2: r2(mean(lateS.map(x => x.tiny2 ?? 0))), lateWithFood: r2(mean(lateS.map(x => x.tinyFood ?? 0))),
    end1: r2(mean(endS.map(x => x.tiny1 ?? 0))), end2: r2(mean(endS.map(x => x.tiny2 ?? 0))),
    madePerSD: r2(rounds.reduce((n, R) => n + (R.tinyMade?.[0] || 0), 0) / Math.max(1, rounds.filter(R => R.sdAt != null).length)),
    madeFoodPct: pc(rounds.reduce((n, R) => n + (R.tinyMade?.[1] || 0), 0), rounds.reduce((n, R) => n + (R.tinyMade?.[0] || 0), 0)),
    madeSnakePct: pc(rounds.reduce((n, R) => n + (R.tinyMade?.[2] || 0), 0), rounds.reduce((n, R) => n + (R.tinyMade?.[0] || 0), 0)),
  };`);
// (f) hole shapes
rep(`    return { t: g.time, holes: g.holes.size, islands: big.length, sizes: big.slice(0, 6), pairGaps: gp.pair, heads, tiny1, tiny2, tinyFood };`,
`    // the hollows' shape: holes as 4-connected hollows; rim against the least for that area
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
    return { t: g.time, holes: g.holes.size, islands: big.length, sizes: big.slice(0, 6), pairGaps: gp.pair, heads, tiny1, tiny2, tinyFood, hollows: hs.length, ragged, teeth, hspurs };`);
rep(`    R.tinyMade = [0, 0, 0, 0];`,`    R.tinyMade = [0, 0, 0, 0];
    R.shape = [0, 0, 0, 0, 0, 0]; // (strikes; sum of perimeter / least perimeter; spur cells; one-wide corridor cells; strikes with a spur; cells)`);
rep(`        const hit = new Set(e.cells), seenC = new Set();`,`        const hit = new Set(e.cells), seenC = new Set();
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
        }`);
rep(`  out.islandsLate = shot('late');`,`  out.islandsLate = shot('late');
  const sh = rounds.reduce((a, R) => R.shape ? a.map((v, i) => v + R.shape[i]) : a, [0, 0, 0, 0, 0, 0]);
  const lsh = rounds.map(R => R.late).filter(x => x && x.ragged != null);
  out.shape = { strikes: r1(sh[0] / Math.max(1, rounds.filter(R => R.sdAt != null).length)), cells: r1(sh[5] / Math.max(1, sh[0])), perimRatio: r2(sh[1] / Math.max(1, sh[0])), spursPerStrike: r2(sh[2] / Math.max(1, sh[0])), corridorPerStrike: r2(sh[3] / Math.max(1, sh[0])), withSpurPct: pc(sh[4], sh[0]),
    lateHollows: r1(mean(lsh.map(x => x.hollows))), lateRagged: r2(mean(lsh.map(x => x.ragged))), lateTeeth: r1(mean(lsh.map(x => x.teeth))), lateHoleSpurs: r1(mean(lsh.map(x => x.hspurs))) };`);
// (g) meals by kind
rep(`        else if (e.type === 'eat' && e.cooked) R.cookedEaten++;`,`        else if (e.type === 'eat' && e.cooked) R.cookedEaten++;
        if (e.type === 'eat' && !e.own && e.kind !== 'mushroom') { const mk = (R.mealKinds ||= { open: {}, mid: {}, sd: {} })[phase]; const kk = e.kind === 'food' ? (e.cooked ? 'baked' : 'apple') : e.kind; mk[kk] = (mk[kk] || 0) + 1; }`);
rep(`  const pre = rounds.reduce(`,`  out.mealKinds = {};
  for (const ph of ['open', 'mid', 'sd']) { const ms = rounds.reduce((n, R) => n + R.aliveMs[ph], 0) / 60000, t = {}; for (const R of rounds) for (const [k, v] of Object.entries(R.mealKinds?.[ph] || {})) t[k] = (t[k] || 0) + v; out.mealKinds[ph] = Object.fromEntries(Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r1(v / ms)])); }
  const pre = rounds.reduce(`);
fs.writeFileSync(__dirname+'/study.js',s);
console.log('study.js rebuilt');
