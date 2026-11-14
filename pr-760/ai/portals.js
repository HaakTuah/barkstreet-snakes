// The portals (round six B, part 5), as anyone sees them: a snake the
// edges wrap for opens a pair going off an edge, and anyone may follow it
// through while its body passes and PORTAL_MS after (engine/portals.js).

// seenPortals: the portals open now (view.portals); portalLeft: how many
// moves from now each is still open: till it shuts, or while its owner's
// body is through it and PORTAL_MS after.
// (readPortals() sets these for each decision:)
// portalIn, portalEx: each one's entry and exit on the framed board, for
// the room's fill (a way through to its exit while it's open).
let seenPortals, portalLeft, portalIn, portalEx;
function readPortals() {
  seenPortals = view.portals || [];
  portalIn = seenPortals.map(p => framed[p.y * N + p.x]);
  portalEx = seenPortals.map(p => framed[p.ty * N + p.tx]);
  const tick = view.tickMs || 110;
  portalLeft = seenPortals.map(p => {
    if (p.shutAt) return Math.floor((p.shutAt - view.timeMs) / tick);
    const o = p.owner === me.id ? me : others.find(q => q.id === p.owner);
    const j = o ? o.body.findIndex((c, i) => i + 1 < o.body.length && c.x === p.tx && c.y === p.ty && o.body[i + 1].x === p.x && o.body[i + 1].y === p.y) : -1;
    return (j >= 0 ? o.body.length - j - 1 : 0) + Math.floor(TUNE.PORTAL_MS / tick);
  });
}

// Off an edge at (x, y) going `d`, where a portal opens that way: through to
// its exit, if it's still open at move `step`.
function portalOut(x, y, d, step) {
  for (let n = 0; n < seenPortals.length; n++) {
    const p = seenPortals[n];
    if (p.x === x && p.y === y && p.dx === d.x && p.dy === d.y && portalLeft[n] >= step) return true;
  }
  return false;
}

// Off the grid at (x, y), a step from inside it: through a portal
// open there that way now, to its exit (for a power's path, as the
// engine's ahead() takes it); -1 if none.
function portalCell(x, y) {
  const sx = x < 0 ? 0 : x >= N ? N - 1 : x, sy = y < 0 ? 0 : y >= N ? N - 1 : y, d = { x: x - sx, y: y - sy };
  if (Math.abs(d.x) + Math.abs(d.y) !== 1 || !inGrid(sx, sy) || !portalOut(sx, sy, d, 1)) return -1;
  return ((y + N) % N) * N + (x + N) % N;
}

// A rival that reaches a portal's entry while it's open comes out at its
// exit a move later (read after readReach's fills).
function reachPortals() {
  for (let n = 0; n < seenPortals.length; n++) {
    const p = seenPortals[n], at = reach[framed[p.y * N + p.x]], ex = framed[p.ty * N + p.tx];
    if (at + 1 <= portalLeft[n] && at + 1 < reach[ex]) reach[ex] = at + 1;
  }
}
