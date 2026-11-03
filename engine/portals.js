// Round six B, part 5, gold portals for the wrap: a snake the edges wrap
// for (a golden mushroom) that goes off one opens a pair of gold portals
// there, the entry (the edge cell it left, the way it went) and the exit
// (where it came in). Anyone may follow it through the entry (see ahead)
// while its body passes and for PORTAL_MS after; coming out onto its body
// is a crash, like any body. Worked out from the bodies at the end of each
// tick: a body crossing an edge is a portal's way through. game.portals:
// [{ x, y, dx, dy (the entry, and the way through it), tx, ty (the exit),
// owner (whose it is), shutAt (the game time it shuts; 0 while its owner's
// body is still through it), followed (the ids of those who followed) }]. Events: 'portal' (opened), 'through'
// (someone else followed, as it went), 'portalShut'.
function portals(game) {
  const kept = new Set();
  for (const s of game.snakes) {
    if (!s.alive) continue;
    for (let i = 0; i + 1 < s.body.length; i++) {
      const a = s.body[i + 1], b = s.body[i];
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1) continue; // (a crossing: off at a, in at b)
      const dx = a.x === b.x ? 0 : b.x > a.x ? -1 : 1, dy = a.y === b.y ? 0 : b.y > a.y ? -1 : 1;
      let p = game.portals.find(q => q.x === a.x && q.y === a.y && q.dx === dx && q.dy === dy);
      if (!p) {
        if (!wraps(game, s)) continue; // (only one the edges wrap for opens one, as it goes through: its head, or a dash's or a flight's cell beyond it)
        p = { x: a.x, y: a.y, dx, dy, tx: b.x, ty: b.y, owner: s.id, shutAt: 0, followed: [] };
        game.portals.push(p);
        game.events.push({ type: 'portal', snake: s, x: a.x, y: a.y, tx: b.x, ty: b.y });
      } else if (p.owner !== s.id && !wraps(game, s) && !p.followed?.includes(s.id)) { p.followed?.push(s.id); game.events.push({ type: 'through', snake: s, x: a.x, y: a.y, tx: b.x, ty: b.y, owner: p.owner }); } // (once a follower: as its head goes through, or a dash's or a flight's cell)
      if (p.owner === s.id) kept.add(p);
    }
  }
  for (const p of [...game.portals]) {
    if (kept.has(p)) { p.shutAt = 0; continue; }
    if (!p.shutAt) p.shutAt = game.time + T.PORTAL_MS;
    else if (game.time >= p.shutAt) {
      game.portals.splice(game.portals.indexOf(p), 1);
      game.events.push({ type: 'portalShut', x: p.x, y: p.y, tx: p.tx, ty: p.ty });
    }
  }
}
