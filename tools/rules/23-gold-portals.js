// ---------------------------------------------------------------- round six B, part 5: gold portals for the wrap
// (DESIGN "Gold portals for the wrap".) Going off an edge while the edges wrap for you opens a pair of gold portals there;
// anyone may follow you through while your body passes and for PORTAL_MS after. People here, through the same engine
// calls a rival makes; the rivals' part is below.
const N21 = T.GRID;
// A wraps (a golden mushroom) heading right along row 10 toward the right edge; B, not wrapping, follows along the row,
// its head `gap` cells behind A's tail. Steps until B is out or `ticks` are done; what happened.
const portalRun = (gap, ticks = 40) => {
  const g = board([[line(N21 - 2, 10, 4), 'right'], [line(N21 - 6 - gap, 10, 3), 'right']], { time: 30000 });
  const [a, b] = g.snakes;
  a.wrapUntil = g.time + 60000;
  const seen = [];
  let through = null, opened = null;
  for (let t = 0; t < ticks && b.alive && !(through && b.body[0].x < 5); t++) {
    feed(g); quiet(g);
    for (const e of g.events) {
      if (e.type === 'portal') opened ||= { at: g.tick - 1, p: { ...g.portals[0] } };
      if (e.type === 'through') through ||= { at: g.tick - 1, snake: e.snake.id, x: e.x, y: e.y, tx: e.tx, ty: e.ty, owner: e.owner };
      if (['portal', 'through', 'portalShut', 'crash', 'death'].includes(e.type)) seen.push(`${g.tick - 1}:${e.type}${e.snake ? e.snake.id : ''}`);
    }
  }
  return { g, a, b, opened, through, seen };
};

{ // Going off an edge while wrapping opens a portal there, the way it went, and its exit where it came in.
  const { opened } = portalRun(3, 3);
  check('a snake the edges wrap for opens a gold portal going off one: entry, the way through, exit', opened && opened.p.x === N21 - 1 && opened.p.y === 10 && opened.p.dx === 1 && opened.p.dy === 0 && opened.p.tx === 0 && opened.p.ty === 10 && opened.p.owner === 0, JSON.stringify(opened));
}

{ // Following close behind (the body passing, then a moment after): through, out at the exit, nothing crashed.
  const { b, through, seen } = portalRun(3);
  check('another snake following it goes through the portal, out at the exit', b.alive && through && through.snake === 1 && through.owner === 0 && through.tx === 0 && b.body[0].y === 10 && b.body[0].x < 5 && !seen.some(e => e.includes('crash')), JSON.stringify({ head: b.body[0], through, seen }));
}

{ // Too late (the portal shut PORTAL_MS after the body passed): the edge is an edge again.
  const { g, b, seen } = portalRun(14);
  check('...but not once it has shut, PORTAL_MS after the body passed: the edge is the edge', seen.some(e => e.endsWith('portalShut')) && seen.some(e => /(crash|death)1$/.test(e)) && !seen.some(e => e.includes('through')) && b.body[0].x === N21 - 1, JSON.stringify({ seen, head: b.body[0], alive: b.alive, cause: b.cause, tick: g.tick }));
}

{ // It stays open while the owner's body is through it, and shuts PORTAL_MS after the tail has passed.
  const g = board([[line(N21 - 2, 10, 6), 'right'], [line(3, 20, 3), 'right']], { time: 30000 });
  const [a] = g.snakes;
  a.wrapUntil = g.time + 60000;
  const open = [];
  for (let t = 0; t < 30 && !g.events.some(e => e.type === 'portalShut'); t++) { feed(g); quiet(g); if (g.portals.length) open.push([g.tick - 1, g.portals[0].shutAt ? g.portals[0].shutAt - g.time : 0]); }
  const spanning = open.filter(([, s]) => !s).length, ms = open.length * E.tickMs(g);
  check('it stays open while the owner\'s body is through it, then shuts PORTAL_MS after', spanning === 5 && g.portals.length === 0 && open.some(([, s]) => s > 0 && s <= T.PORTAL_MS), JSON.stringify(open));
}

{ // The rivals use them: heading up the right edge beside an open portal there, a golden apple just beyond its exit on
  // the far side, an AI turns into it and goes through (two moves to the apple, where without it there's the edge).
  // With the portal shut, it doesn't turn into the edge.
  const view = shutAt => () => aiView({ me: aiMe([[N21 - 1, 10], [N21 - 1, 11], [N21 - 1, 12], [N21 - 1, 13]], 'up'), others: [aiRival(1, line(8, 20, 4), 'right')], tickMs: 110,
    food: [{ x: 1, y: 10, kind: 'golden', expires: 999 }, { x: 12, y: 3, kind: 'food', expires: 999 }],
    portals: shutAt === null ? [] : [{ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 1, shutAt }] });
  const open = picks(view(30000 + 800), 'drab', 20), none = picks(view(null), 'drab', 20);
  check('an AI goes through an open gold portal when it pays (food just beyond its exit)', open.right === 20, JSON.stringify(open));
  check('...and never into the edge where there\'s none', !none.right, JSON.stringify(none));
}

{ // ...and see them used against them: a rival's head one move from an open portal's entry can come out at its exit
  // next, so an AI by the exit doesn't step there (it would meet that head), where with the portal shut it might.
  const view = shutAt => () => aiView({ me: aiMe([[1, 10], [2, 10], [3, 10], [4, 10]], 'left'), others: [aiRival(1, [[N21 - 2, 10], [N21 - 3, 10], [N21 - 4, 10], [N21 - 5, 10]], 'right')], tickMs: 110,
    food: [{ x: 0, y: 10, kind: 'golden', expires: 999 }, { x: 1, y: 3, kind: 'food', expires: 999 }],
    portals: shutAt === null ? [] : [{ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 0, shutAt }] });
  const open = picks(view(30000 + 800), 'drab', 20), none = picks(view(null), 'drab', 20);
  check('an AI keeps its head off a portal\'s exit a rival could come out of next (it sees portals used against it)', !open.left && none.left === 20, JSON.stringify({ open, none }));
}
