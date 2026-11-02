// The gold portals (round six B, part 5), as anyone sees them: a snake the
// edges wrap for opens a pair going off an edge, and anyone may follow it
// through while its body passes and PORTAL_MS after (engine/portals.js).

// seenPortals: the portals open now (view.portals); portalLeft: how many
// moves from now each is still open: till it shuts, or while its owner's
// body is through it and PORTAL_MS after.
// (readPortals() sets these for each decision:)
// portalPlan: how many of them my own plans read as a way through (my room,
// the territory, a hunt, a goal: see portalHop, portalDist), with each
// one's entry and exit on the framed board (portalIn, portalEx).
let seenPortals, portalLeft, portalPlan = 0;
const portalIn = [], portalEx = [], portalLast = [], portalXY = [];
function readPortals() {
  seenPortals = view.portals || [];
  const tick = view.tickMs || 110;
  portalLeft = seenPortals.map(p => {
    if (p.shutAt) return Math.floor((p.shutAt - view.timeMs) / tick);
    const o = p.owner === me.id ? me : others.find(q => q.id === p.owner);
    const j = o ? o.body.findIndex((c, i) => i + 1 < o.body.length && c.x === p.tx && c.y === p.ty && o.body[i + 1].x === p.x && o.body[i + 1].y === p.y) : -1;
    return (j >= 0 ? o.body.length - j - 1 : 0) + Math.floor(TUNE.PORTAL_MS / tick);
  });
  portalPlan = PLAN_PORTALS ? seenPortals.length : 0;
  for (let n = 0; n < portalPlan; n++) {
    const p = seenPortals[n];
    portalIn[n] = framed[p.y * N + p.x]; portalEx[n] = framed[p.ty * N + p.tx]; portalLast[n] = portalLeft[n];
    portalXY[2 * n] = p.x; portalXY[2 * n + 1] = p.y;
  }
}
// Whether my own plans count a portal as a way (the search's steps, my
// room, the territory, a hunt or a goal through it); seen used against me
// either way (strikes, reach).
const PLAN_PORTALS = true;

// How far it is from my head (x, y) at move t to (tx, ty): as the crow
// flies, or through an open portal, if I'd be at its entry before it
// shuts (a hunter after a snake that's gone through, a goal beyond an edge).
function portalDist(x, y, tx, ty, t) {
  let best = Math.abs(x - tx) + Math.abs(y - ty);
  for (let n = 0; n < portalPlan; n++) {
    const to = Math.abs(x - portalXY[2 * n]) + Math.abs(y - portalXY[2 * n + 1]);
    if (t + to + 1 > portalLast[n] || to + 1 >= best) continue;
    const p = seenPortals[n], via = to + 1 + Math.abs(p.tx - tx) + Math.abs(p.ty - ty);
    if (via < best) best = via;
  }
  return best;
}
// For my room's fill (fillRoom): at distance d (move t + d), the exit of
// every open portal whose entry the fill reached a move before, if it's
// free by then and the portal still open; each one onto the fill's queue
// (from `write`, marked seen with `stamp`). Returns the new `write`.
function portalHop(d, t, headP, stamp, write) {
  const S = seenF, D = distF, B = terr;
  for (let n = 0; n < portalPlan; n++) {
    const pe = portalIn[n], px = portalEx[n];
    if (S[pe] !== stamp || S[px] === stamp || (pe === headP ? d !== 1 : D[pe] !== d - 1)) continue;
    if (t + d > portalLast[n] || B[px] > t + d) continue;
    S[px] = stamp; D[px] = d; queue[write++] = px;
  }
  return write;
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

// A rival that reaches a portal's entry while it's open comes out at its
// exit a move later (read after readReach's fills).
function reachPortals() {
  for (let n = 0; n < seenPortals.length; n++) {
    const p = seenPortals[n], at = reach[framed[p.y * N + p.x]], ex = framed[p.ty * N + p.tx];
    if (at + 1 <= portalLeft[n] && at + 1 < reach[ex]) reach[ex] = at + 1;
  }
}
