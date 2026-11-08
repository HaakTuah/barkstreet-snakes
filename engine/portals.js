// Round six B, part 5, gold portals for the wrap: a snake the edges wrap
// for (a golden mushroom) that goes off one opens a pair of gold portals
// there, the entry (the edge cell it left, the way it went) and the exit
// (where it came in). Anyone may follow it through the entry (see ahead)
// while its body passes and for PORTAL_MS after; coming out onto its body
// is a crash, like any body. Worked out from the bodies at the end of each
// tick: a body crossing an edge is a portal's way through. game.portals:
// [{ x, y, dx, dy (the entry, and the way through it), tx, ty (the exit),
// owner (whose it is: who opened it), shutAt (the game time it shuts; 0
// while a wrapping body is still through it), followed (the ids of those who followed), wrappers (of others who went
// through while the edges wrapped for them too) }]. Events: 'portal' (opened), 'through'
// (someone else followed, as it went), 'portalShut'.
// `moved`: the game time this tick's moves were made at, so a wrap that ran
// out with this tick still opens the portal it crossed by. A portal a snake
// in the air has planned its way through (its entry and then its exit still
// ahead, in its hop or where it lands) doesn't shut under it till it's past,
// a tick at a time, so everyone sees it still open. Nor does one shut while
// a body the edges wrapped for as it crossed spans it, its owner's or another's.
function portals(game, moved = game.time) {
  const kept = new Set(), wrapped = s => s.wrapUntil > moved;
  const flying = p => game.snakes.some(s => s.alive && s.flight && [s.body[0], ...s.flight.over, s.flight.land].some((c, i, way) => i > 0 && c.x === p.tx && c.y === p.ty && way[i - 1].x === p.x && way[i - 1].y === p.y)); // (its way on goes from the entry out at the exit)
  for (const s of game.snakes) {
    if (!s.alive) continue;
    for (let i = 0; i + 1 < s.body.length; i++) {
      const a = s.body[i + 1], b = s.body[i];
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1) continue; // (a crossing: off at a, in at b)
      const dx = a.x === b.x ? 0 : b.x > a.x ? -1 : 1, dy = a.y === b.y ? 0 : b.y > a.y ? -1 : 1;
      let p = game.portals.find(q => q.x === a.x && q.y === a.y && q.dx === dx && q.dy === dy);
      if (!p) {
        if (!wrapped(s)) continue; // (only one the edges wrap for opens one, as it goes through: its head, or a dash's or a flight's cell beyond it)
        p = { x: a.x, y: a.y, dx, dy, tx: b.x, ty: b.y, owner: s.id, shutAt: 0, followed: [], wrappers: [] };
        game.portals.push(p);
        game.events.push({ type: 'portal', snake: s, x: a.x, y: a.y, tx: b.x, ty: b.y });
      } else if (p.owner !== s.id && !p.followed?.includes(s.id) && !p.wrappers?.includes(s.id)) { // (another, as it first goes through: its head, or a dash's or a flight's cell)
        if (wrapped(s)) p.wrappers?.push(s.id); // (the edges wrap for it too: never a follower, though they stop wrapping while it's through)
        else { p.followed?.push(s.id); game.events.push({ type: 'through', snake: s, x: a.x, y: a.y, tx: b.x, ty: b.y, owner: p.owner }); }
      }
      if (!p.followed?.includes(s.id)) kept.add(p); // (any body the edges wrapped for as it crossed keeps it open: its owner's, or another's going through after it)
    }
  }
  for (const p of [...game.portals]) {
    if (kept.has(p)) { p.shutAt = 0; continue; }
    if (!p.shutAt) p.shutAt = game.time + T.PORTAL_MS;
    else if (game.time >= p.shutAt && flying(p)) p.shutAt = game.time + tickLength(game); // (a tick more, as everyone sees it)
    else if (game.time >= p.shutAt) {
      game.portals.splice(game.portals.indexOf(p), 1);
      game.events.push({ type: 'portalShut', x: p.x, y: p.y, tx: p.tx, ty: p.ty });
    }
  }
}

// 2y++ experiment: a follower coming out of a portal's exit snips its owner's body left straight in line beyond it.
function portalSnips(game, dying, drops) {
  const gone = new Set();
  for (const p of game.portals) {
    const o = game.snakes.find(q => q.id === p.owner);
    if (!o || !o.alive || dying.includes(o)) continue;
    for (const s of game.snakes) {
      if (s === o || !s.alive || dying.includes(s) || (p.snipped ||= []).includes(s.id) || s.wrapUntil > game.time || p.wrappers?.includes(s.id)) continue;
      const i = s.body.findIndex((b, k) => k + 1 < s.body.length && k < 4 && b.x === p.tx && b.y === p.ty && s.body[k + 1].x === p.x && s.body[k + 1].y === p.y);
      if (i < 0) continue;
      p.snipped.push(s.id);
      let j = -1;
      for (let m = 1, x = p.tx + p.dx, y = p.ty + p.dy; m <= T.PORTAL_SNIP; m++, x += p.dx, y += p.dy) {
        if (x < 0 || y < 0 || x >= GRID || y >= GRID) break;
        const k = o.body.findIndex(b => b.x === x && b.y === y);
        if (k < 0) { if (j >= 0 || game.holes.has(key(x, y)) || game.snakes.some(q => q.alive && q.body.some(b => b.x === x && b.y === y))) break; continue; }
        j = k;
        if (k === 0) break;
      }
      if (j < 0) continue;
      const before = o.body.length;
      cutAt(game, o, Math.max(1, j), s, gone, dying, drops);
      game.events.push({ type: 'snip', snake: s, owner: o.id, out: dying.includes(o) ? 1 : 0, lost: before - o.body.length });
    }
  }
}
