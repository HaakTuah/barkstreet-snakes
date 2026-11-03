// Round six B, part 5, gold portals for the wrap: a snake the edges wrap
// for (a golden mushroom) that goes off one opens a pair of gold portals
// there, the entry (the edge cell it left, the way it went) and the exit
// (where it came in). Anyone may follow it through the entry (see ahead)
// while its body passes and for PORTAL_MS after; coming out onto its body
// is a crash, like any body. Worked out from the bodies at the end of each
// tick: a body crossing an edge is a portal's way through. game.portals:
// [{ x, y, dx, dy (the entry, and the way through it), tx, ty (the exit),
// owner (whose it is: who opened it), shutAt (the game time it shuts; 0
// while a wrapping body is still through it), followed (the ids of those who followed) }]. Events: 'portal' (opened), 'through'
// (someone else followed, as it went), 'portalShut'.
// `moved`: the game time this tick's moves were made at, so a wrap that ran
// out with this tick still opens the portal it crossed by. A portal a snake
// in the air has planned its way through (its exit still ahead, in its
// hop or where it lands) doesn't shut under it till it's past, a tick at
// a time, so everyone sees it still open. Nor does one shut while a body
// the edges wrapped for spans it, its owner's or another's.
function portals(game, moved = game.time) {
  const kept = new Set(), wrapped = s => s.wrapUntil > moved;
  const flying = p => game.snakes.some(s => s.alive && s.flight && [...s.flight.over, s.flight.land].some(c => c.x === p.tx && c.y === p.ty));
  for (const s of game.snakes) {
    if (!s.alive) continue;
    for (let i = 0; i + 1 < s.body.length; i++) {
      const a = s.body[i + 1], b = s.body[i];
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1) continue; // (a crossing: off at a, in at b)
      const dx = a.x === b.x ? 0 : b.x > a.x ? -1 : 1, dy = a.y === b.y ? 0 : b.y > a.y ? -1 : 1;
      let p = game.portals.find(q => q.x === a.x && q.y === a.y && q.dx === dx && q.dy === dy);
      if (!p) {
        if (!wrapped(s)) continue; // (only one the edges wrap for opens one, as it goes through: its head, or a dash's or a flight's cell beyond it)
        p = { x: a.x, y: a.y, dx, dy, tx: b.x, ty: b.y, owner: s.id, shutAt: 0, followed: [] };
        game.portals.push(p);
        game.events.push({ type: 'portal', snake: s, x: a.x, y: a.y, tx: b.x, ty: b.y });
      } else if (p.owner !== s.id && !wrapped(s) && !p.followed?.includes(s.id)) { p.followed?.push(s.id); game.events.push({ type: 'through', snake: s, x: a.x, y: a.y, tx: b.x, ty: b.y, owner: p.owner }); } // (once a follower: as its head goes through, or a dash's or a flight's cell)
      if (p.owner === s.id || !p.followed?.includes(s.id)) kept.add(p); // (any body the edges wrapped for as it crossed keeps it open: its owner's, or another's going through after it)
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
