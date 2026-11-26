// Fourth set of flex rules (the shape of the woodpecker's patches), applied
// after patch-flex.js, -2 and -3:
//
//   node patch-flex4.js <dir>
//
// New tuning keys (all optional; absent, the game plays as before):
//   PECK_COMPACT_W, PECK_COMPACT_E  the growth weights: each way weighs
//                        (1 + W per neighbour in the patch + 2 per old hole)^E
//                        (today W 3, E 2)
//   PECK_SHAPE 'disc'    the patch grows from its centre outward, always the
//                        free cell nearest the centre next (plus a little
//                        jitter, PECK_DISC_JITTER, in squared cells): a round
//                        blob, trimmed only by what it must keep clear of
//   PECK_SMOOTH true     after growing: fill any cell beside the patch with 3+
//                        neighbours in it (or old holes, or the board's edge),
//                        twice, then drop one-cell spurs (a patch cell with
//                        one neighbour in it or a hole), twice
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
  [`        while (patch.length < chunk && edge.length) {
          const from = edge[Math.floor(Math.random() * edge.length)], x = from % GRID, y = Math.floor(from / GRID);`,
   `        if (T.PECK_SHAPE === 'disc') { // (flex: nearest the centre first)
          const cx = seed % GRID, cy = Math.floor(seed / GRID), jit = new Map(), front = [];
          const push = k => { const x = k % GRID, y = Math.floor(k / GRID); for (const d of CRAWL) { const nx = x + d.x, ny = y + d.y; if (!inside(nx, ny)) continue; const nk = key(nx, ny); if (inPatch.has(nk) || front.includes(nk) || !ok(nk)) continue; front.push(nk); jit.set(nk, Math.random() * (T.PECK_DISC_JITTER ?? 1)); } };
          push(seed);
          while (patch.length < chunk && front.length) {
            let bi = 0, bd = Infinity;
            front.forEach((k, i) => { const dx = k % GRID - cx, dy = Math.floor(k / GRID) - cy, d = dx * dx + dy * dy + jit.get(k); if (d < bd) { bd = d; bi = i; } });
            const [nk] = front.splice(bi, 1);
            patch.push(nk); inPatch.add(nk); push(nk);
          }
        }
        while (T.PECK_SHAPE !== 'disc' && patch.length < chunk && edge.length) {
          const from = edge[Math.floor(Math.random() * edge.length)], x = from % GRID, y = Math.floor(from / GRID);`],
  [`              if (inPatch.has(key(ax, ay))) n += 3; else if (game.holes.has(key(ax, ay))) n += 2;
            }
            total += n * n;
            return n * n;`,
   `              if (inPatch.has(key(ax, ay))) n += T.PECK_COMPACT_W ?? 3; else if (game.holes.has(key(ax, ay))) n += 2;
            }
            const v = T.PECK_COMPACT_E == null ? n * n : Math.pow(n, T.PECK_COMPACT_E);
            total += v;
            return v;`],
  [`        if (patch.length >= Math.ceil(chunk / 2) && (!T.PECK_NO_ORPHANS`,
   `        if (T.PECK_SMOOTH && patch.length >= Math.ceil(chunk / 2)) smoothPatch(game, patch, inPatch, ok);
        if (patch.length >= Math.ceil(chunk / 2) && (!T.PECK_NO_ORPHANS`],
  [`  // (flex) No orphans:`,
   `  // (flex) Smoothing: fill the nooks, drop the spurs.
  function smoothPatch(game, patch, inPatch, ok) {
    const solid = (x, y, edge) => !inside(x, y) ? edge : inPatch.has(key(x, y)) || game.holes.has(key(x, y));
    const around = (k, edge) => { const x = k % GRID, y = Math.floor(k / GRID); let n = 0; for (const d of CRAWL) if (solid(x + d.x, y + d.y, edge)) n++; return n; };
    for (let pass = 0; pass < 2; pass++) {
      const add = [];
      for (const p of patch) for (const d of CRAWL) {
        const x = p % GRID + d.x, y = Math.floor(p / GRID) + d.y;
        if (!inside(x, y)) continue;
        const k = key(x, y);
        if (inPatch.has(k) || add.includes(k) || !ok(k)) continue;
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
  // (flex) No orphans:`],
]);
console.log('patched (4)', dir);
