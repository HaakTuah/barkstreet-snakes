// ---------------------------------------------------------------- round six B, part 5: gold portals for the wrap
// (DESIGN "Portals for the wrap".) Going off an edge while the edges wrap for you opens a pair of portals there;
// anyone may follow you through while your body passes and for PORTAL_MS after. People here, through the same engine
// calls a rival makes; the rivals' part is below.
const N21 = T.GRID;
// A wraps (a golden mushroom) heading right along row 10 toward the right edge; B, not wrapping, follows along the row,
// its head `gap` cells behind A's tail (held still `stun` ticks first). Steps until B is out or `ticks` are done; what happened.
const portalRun = (gap, ticks = 40, stun = 0) => {
  const g = board([[line(N21 - 2, 10, 4), 'right'], [line(N21 - 6 - gap, 10, 3), 'right']], { time: 30000 });
  const [a, b] = g.snakes;
  a.wrapUntil = g.time + 60000;
  if (stun) b.stunUntil = g.tick + stun; // (held where it is that many ticks)
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

{ // A dash across the edge while wrapping opens one too (its head lands past the crossing, a cell or two in).
  const g = board([[line(N21 - 2, 10, 4), 'right']], { time: 30000 });
  const [a] = g.snakes;
  a.wrapUntil = g.time + 60000; a.dashes = 1;
  E.flash(g, a); feed(g); quiet(g);
  const p = g.portals[0];
  check('a dash across the edge while wrapping opens a gold portal where it crossed', g.events.some(e => e.type === 'portal') && p && p.x === N21 - 1 && p.dx === 1 && p.tx === 0 && a.body[0].x > 0, JSON.stringify({ head: a.body[0], portals: g.portals }));
}

{ // A wrap that runs out on the very tick a snake goes off the edge still opens the portal it crossed by.
  const g = board([[line(N21 - 1, 10, 4), 'right']], { time: 30000 });
  g.snakes[0].wrapUntil = g.time + 1;
  feed(g); quiet(g);
  check('a wrap running out the tick it crosses still opens the portal it went through', g.snakes[0].body[0].x === 0 && g.portals.length === 1 && g.portals[0].x === N21 - 1, JSON.stringify({ head: g.snakes[0].body[0], portals: g.portals }));
}

{ // A flight planned through an open portal: the portal doesn't shut under it while its exit is still ahead in the air (a cell or two short of it here, when it was due).
  const g = board([[line(N21 - 3, 10, 6), 'right'], [line(4, 3, 4), 'right']], { time: 30000 });
  const me = g.snakes[0];
  g.portals.push({ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 1, shutAt: g.time + 1, followed: [] });
  me.leaps = 2;
  E.leap(g, me); E.leap(g, me); // (held: a golden flight, out through the portal)
  const seen = [];
  for (let t = 0; t < T.GOLD_FLY + 3 && me.alive; t++) { quiet(g); seen.push(`${me.body[0].x}${me.flight ? '^' : ''}:${g.portals.filter(p => p.shutAt > g.time).length}`); } // (open as everyone sees it: its shutAt still ahead)
  check('a flight through a portal comes out at its exit though the portal was due to shut, and it shuts once the flight is past it', me.alive && me.body[0].x < 6 && seen.includes(`${N21 - 1}^:1`) && seen.includes('0^:0') && g.portals.length === 0, JSON.stringify({ seen, alive: me.alive, cause: me.cause }));
}

{ // A second snake the edges wrap for, going through after the owner's tail has passed: the portal stays open while its body spans it (three ticks, for a body of four).
  const g = board([[line(N21 - 1, 10, 4), 'right'], [line(4, 3, 4), 'right']], { time: 30000 });
  const [a] = g.snakes;
  a.wrapUntil = g.time + 60000;
  g.portals.push({ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 1, shutAt: g.time + 1, followed: [] });
  const open = [];
  for (let t = 0; t < 3; t++) { feed(g); quiet(g); open.push(g.portals.length === 1 && g.portals[0].owner === 1 && !g.portals[0].shutAt); }
  check('a second wrapping snake going through keeps the portal open while its body spans it', open.every(Boolean), JSON.stringify({ open, portals: g.portals, ev: g.events.map(e => e.type) }));
}

{ // ...and one whose wrap runs out while its body is through it keeps it open the same, and never counts as following.
  const g = board([[line(N21 - 1, 10, 4), 'right'], [line(4, 3, 4), 'right']], { time: 30000 });
  const [a] = g.snakes;
  a.wrapUntil = g.time + 1; // (it crosses on the edges' last moment)
  g.portals.push({ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 1, shutAt: g.time + 1, followed: [], wrappers: [] });
  const open = [];
  let follows = 0;
  for (let t = 0; t < 3; t++) { feed(g); quiet(g); open.push(g.portals.length === 1 && !g.portals[0].shutAt); follows += g.events.filter(e => e.type === 'through').length; }
  check('...and so does one whose wrap runs out while it spans it, never counted a follower', open.every(Boolean) && !follows, JSON.stringify({ open, follows, portals: g.portals }));
}

{ // A flight that passes over a portal's exit but not through it doesn't keep it open past its time.
  const g = board([[[[0, 6], [0, 5], [0, 4], [0, 3]], 'down'], [line(10, 20, 4), 'right']], { time: 30000 });
  const me = g.snakes[0];
  g.portals.push({ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 1, shutAt: g.time + 1, followed: [], wrappers: [] });
  me.leaps = 2;
  E.leap(g, me); E.leap(g, me); // (held: a golden flight down the left edge, over the exit)
  quiet(g); quiet(g);
  check('...but a flight over its exit, not through it, doesn\'t keep it open', me.alive && me.flight && g.portals.length === 0, JSON.stringify({ head: me.body[0], flight: me.flight && { over: me.flight.over, land: me.flight.land }, portals: g.portals }));
}

{ // A gold portal is a way through for snakes, not for what they spit: a mushroom spat at an open one goes off the
  // board, as its dotted line shows (none, there), and doesn't land on the far side.
  const g = board([[line(N21 - 2, 10, 4), 'right'], [line(10, 20, 4), 'right']], { time: 30000 });
  g.snakes[0].cheek = { power: T.SHRINK, spitAt: g.tick, left: 120 };
  g.portals.push({ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 1, shutAt: g.time + 1500, followed: [], wrappers: [] });
  feed(g); quiet(g);
  const e = g.events.find(e => e.type === 'spat');
  check('a mushroom spat at an open gold portal goes off the board, not through it', e && e.x >= N21 && e.lx === null && !g.spits.length && !g.food.some(f => f.kind === 'mushroom' && f.y === 10 && f.x < 3), JSON.stringify({ spat: e && [e.x, e.y], food: g.food.filter(f => f.kind === 'mushroom') }));
}

{ // Following close behind (the body passing, then a moment after): through, out at the exit, nothing crashed.
  const { b, through, seen } = portalRun(3);
  check('another snake following it goes through the portal, out at the exit', b.alive && through && through.snake === 1 && through.owner === 0 && through.tx === 0 && b.body[0].y === 10 && b.body[0].x < 5 && !seen.some(e => e.includes('crash')), JSON.stringify({ head: b.body[0], through, seen }));
}

{ // Too late (the portal shut PORTAL_MS after the body passed): the edge is an edge again. (The follower held still,
  // stunned, as long as PORTAL_MS and the owner's body take to go by and a little more.)
  const late = Math.ceil(T.PORTAL_MS / 110) + 12;
  const { g, b, seen } = portalRun(3, late + 20, late);
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
  // With the portal shut, it doesn't turn into the edge. (Hungry: full, with nobody near the apple, it may as well
  // loop round and go through a few moves later, which it now sees it can.)
  const view = shutAt => () => aiView({ me: aiMe([[N21 - 1, 10], [N21 - 1, 11], [N21 - 1, 12], [N21 - 1, 13]], 'up', { hungerLeft: 8000, starveIn: 8000 }), others: [aiRival(1, line(8, 20, 4), 'right')], tickMs: 110,
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

{ // ...and where a rival's head is now: seen a cell short of an open portal's entry, as stale as anyone's view of the
  // others (two moves), it may be out at the exit already, a step from the apple just past it. (Its head reckoned on
  // through the portal, as over an edge that wraps for it.)
  const view = shutAt => () => aiView({ me: aiMe([[2, 10], [3, 10], [4, 10], [5, 10]], 'left'), others: [aiRival(1, [[N21 - 2, 10], [N21 - 3, 10], [N21 - 4, 10], [N21 - 5, 10]], 'right')], tickMs: 110,
    food: [{ x: 1, y: 10, kind: 'golden', expires: 999 }, { x: 2, y: 3, kind: 'food', expires: 999 }],
    portals: shutAt === null ? [] : [{ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 1, shutAt }] });
  const open = picks(view(30000 + 800), 'drab', 20), none = picks(view(null), 'drab', 20);
  check('an AI reckons a rival seen going for an open portal on through it since (where its head may be now)', !open.left && none.left === 20, JSON.stringify({ open, none }));
}

{ // ...and a rival's dash through one: three cells on from its exit, so an AI two cells in keeps out of that line.
  const view = shutAt => () => aiView({ me: aiMe([[2, 10], [3, 10], [4, 10], [5, 10]], 'left'), others: [{ ...aiRival(1, [[N21 - 1, 10], [N21 - 2, 10], [N21 - 3, 10], [N21 - 4, 10]], 'right'), dashes: 1 }], tickMs: 110,
    food: [{ x: 1, y: 10, kind: 'food', expires: 999 }, { x: 2, y: 3, kind: 'food', expires: 999 }],
    portals: shutAt === null ? [] : [{ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 0, shutAt }] });
  const open = picks(view(30000 + 800), 'drab', 20), none = picks(view(null), 'drab', 20);
  check('an AI keeps out of the line a rival\'s dash would take through a portal (its powers, traced through it)', !open.left && none.left === 20, JSON.stringify({ open, none }));
}

{ // ...and see the chance from a few moves off, not only beside it: heading up three cells in from the right edge,
  // level with an open portal's entry there, an apple just beyond its exit on the far side (five moves through it)
  // and another straight ahead (nine), an AI turns for the portal; with it shut, never toward the edge. (Its room's
  // fill and the territory split count a way through a portal open by the time it would get there: see room.js.)
  const view = shutAt => () => aiView({ me: aiMe([[N21 - 4, 10], [N21 - 4, 11], [N21 - 4, 12], [N21 - 4, 13]], 'up'), others: [aiRival(1, line(4, 20, 4), 'right')], tickMs: 110,
    food: [{ x: 1, y: 10, kind: 'food', expires: 999 }, { x: N21 - 4, y: 1, kind: 'food', expires: 999 }],
    portals: shutAt === null ? [] : [{ x: N21 - 1, y: 10, dx: 1, dy: 0, tx: 0, ty: 10, owner: 1, shutAt }] });
  const open = picks(view(30000 + 800), 'drab', 20), none = picks(view(null), 'drab', 20);
  check('an AI a few moves off an open gold portal heads for it when food past its exit is nearer that way', open.right === 20, JSON.stringify(open));
  check('...and not toward the edge when it is shut', !none.right, JSON.stringify(none));
}
