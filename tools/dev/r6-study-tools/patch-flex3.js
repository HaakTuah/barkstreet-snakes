// Third set of flex rules (the woodpecker and food, tiny islands), applied
// after patch-flex.js and patch-flex2.js:
//
//   node patch-flex3.js <dir>
//
// New tuning keys (all optional; absent, the game plays as before):
//   PECK_FOOD 'eat'      patches may cover food; the bird eats what's in one
//   PECK_FOOD 'knock'    ...or knocks it out to the nearest free cell outside
//                        (by distance as the crow flies, then nearest the
//                        middle of the log, then the lower cell index: no
//                        randomness)
//   PECK_NO_ORPHANS n    a patch that would cut off an island of n cells or
//                        fewer takes those cells too, unless a snake (or food,
//                        while patches keep off food) is on them: then that
//                        patch isn't chosen (not in the last, anywhere-left tier)
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
  [`        if (foodAt.has(k)) return false;
        return headGap(game, k % GRID, Math.floor(k / GRID)) > gap;`,
   `        if (foodAt.has(k) && !T.PECK_FOOD) return false;
        return headGap(game, k % GRID, Math.floor(k / GRID)) > gap;`],
  [`        if (patch.length >= Math.ceil(chunk / 2) && !(noSeal && seals(game, patch))) return patch;`,
   `        if (patch.length >= Math.ceil(chunk / 2) && (!T.PECK_NO_ORPHANS || !clear || adopt(game, patch, T.PECK_FOOD ? null : foodAt)) && !(noSeal && seals(game, patch))) return patch;`],
  [`  const sealNeed = s =>`,
   `  // (flex) No orphans: islands of PECK_NO_ORPHANS cells or fewer that the
  // patch would cut off go into it, unless a snake (or blocked food) is on one.
  const orphanSeen = new Int32Array(CELLS), orphanQ = new Int32Array(CELLS);
  let orphanStamp = 0;
  function adopt(game, patch, foodBlock) {
    const inP = new Set(patch), max = T.PECK_NO_ORPHANS;
    const bodyAt = new Set();
    for (const s of game.snakes) if (s.alive) for (const c of s.body) bodyAt.add(key(c.x, c.y));
    const add = [];
    for (const p of patch) for (const d of CRAWL) {
      const x0 = p % GRID + d.x, y0 = Math.floor(p / GRID) + d.y;
      if (!inside(x0, y0)) continue;
      const n0 = key(x0, y0);
      if (inP.has(n0) || game.holes.has(n0)) continue;
      const st = ++orphanStamp; // (each flood its own stamp)
      orphanSeen[n0] = st; orphanQ[0] = n0;
      let r = 0, w = 1;
      while (r < w && w <= max) {
        const i = orphanQ[r++], x = i % GRID, y = Math.floor(i / GRID);
        for (const dd of CRAWL) {
          const nx = x + dd.x, ny = y + dd.y;
          if (!inside(nx, ny)) continue;
          const ni = key(nx, ny);
          if (orphanSeen[ni] === st || inP.has(ni) || game.holes.has(ni)) continue;
          orphanSeen[ni] = st; orphanQ[w++] = ni;
          if (w > max) break;
        }
      }
      if (w > max) continue; // (a real island, or the rest of the log)
      for (let j = 0; j < w; j++) {
        const c = orphanQ[j];
        if (bodyAt.has(c) || (foodBlock && foodBlock.has(c))) return false;
        add.push(c);
      }
    }
    for (const c of add) if (!inP.has(c)) { inP.add(c); patch.push(c); }
    return true;
  }
  // (flex) Knocked out: the nearest free cell outside the patch for food that was in it.
  function knockOut(game, zone) {
    const taken = new Set();
    for (const s of game.snakes) if (s.alive) for (const c of s.body) taken.add(key(c.x, c.y));
    for (const f of game.food) if (!zone.has(key(f.x, f.y))) taken.add(key(f.x, f.y));
    for (const b of game.burrows) taken.add(key(b.x, b.y));
    for (const k of game.fires.keys()) taken.add(k);
    const kept = [];
    for (const f of game.food) {
      if (!zone.has(key(f.x, f.y))) { kept.push(f); continue; }
      let best = -1, bestR = Infinity, bestMid = Infinity;
      for (let k = 0; k < CELLS; k++) {
        if (taken.has(k) || game.holes.has(k) || zone.has(k)) continue;
        const x = k % GRID, y = Math.floor(k / GRID), r = Math.abs(x - f.x) + Math.abs(y - f.y);
        if (r > bestR) continue;
        const mid = Math.abs(x - (GRID - 1) / 2) + Math.abs(y - (GRID - 1) / 2);
        if (r < bestR || mid < bestMid) { best = k; bestR = r; bestMid = mid; }
      }
      if (best < 0) continue; // (nowhere: it's gone)
      f.x = best % GRID; f.y = Math.floor(best / GRID);
      taken.add(best);
      kept.push(f);
      game.events.push({ type: 'knocked', x: f.x, y: f.y, kind: f.kind });
    }
    game.food = kept;
  }
  const sealNeed = s =>`],
  [`      game.food = game.food.filter(f => !zone.has(key(f.x, f.y)));`,
   `      if (T.PECK_FOOD === 'knock') knockOut(game, zone);
      else game.food = game.food.filter(f => !zone.has(key(f.x, f.y)));`],
]);
console.log('patched (3)', dir);
