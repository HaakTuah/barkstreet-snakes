// Round six B, part 5: a body through a gold portal. Anyone may follow a
// snake the edges wrap for through one, so a follower's body runs off one
// edge and on at the other as a wrapping snake's does: drawn on each side,
// never as a band across the log; and one about to go through is drawn
// going on into it, as the engine takes it (not held at the edge, as for a
// crash).
await ev(`window.__autoRaf = true; 'ok'`);
await b.go(site.url + '?debug', { settle: 0 });
await ev('__settle()');
await ev(STAGE);
const follow = (body, alpha) => ev(`(() => {
  seeds(260);
  const g = stage(['gobbler', 'mason', 'ghost']), [you, gob] = g.snakes; // (gob: the edges have never wrapped for it)
  setBody(gob, ${JSON.stringify(body)}, 'right');
  gob.prev = gob.body.map(c => ({ x: c.x - 1 < 0 ? TUNING.GRID - 1 : c.x - 1, y: c.y })); // (a move ago: a cell back along the row, across the edge)
  g.portals = [{ x: TUNING.GRID - 1, y: 11, dx: 1, dy: 0, tx: 0, ty: 11, owner: you.id, shutAt: g.time + 1500 }];
  show(g); drawN(6, ${alpha});
  const a = anim.get(gob);
  return { row: [6, 9, 12, 15].map(x => rgb(x + 0.44, 11.44)), guess: { x: a.mx, y: a.my, moves: a.mv } };
})()`);
const orange = ([r, g, b]) => r > 170 && g > 90 && b < 110; // (Gobbler's colour, not the bark)
const through = await follow([[1, 11], [0, 11], [23, 11], [22, 11], [21, 11], [20, 11]], 0.5);
check(!through.row.some(orange), 'a follower’s body through a gold portal is drawn on each side, never across the log between', JSON.stringify(through.row));
const into = await follow([[23, 11], [22, 11], [21, 11], [20, 11]], 0.9);
check(into.guess.x === 0 && into.guess.y === 11 && into.guess.moves === 1, '...and one about to go through is drawn going on into it, out at the exit', JSON.stringify(into.guess));
// A flash asked for at the edge, through an open portal: drawn going on through it, the way the game takes it.
const flashed = await ev(`(() => {
  seeds(260);
  const g = stage(['gobbler', 'mason', 'ghost']), [you, gob] = g.snakes;
  setBody(gob, [[22, 11], [21, 11], [20, 11], [19, 11]], 'right');
  gob.prev = gob.body.map(c => ({ x: c.x - 1, y: c.y }));
  gob.dashes = 1; gob.flashArmed = g.tick;
  g.portals = [{ x: TUNING.GRID - 1, y: 11, dx: 1, dy: 0, tx: 0, ty: 11, owner: you.id, shutAt: g.time + 1500 }];
  show(g); drawN(2, 0.5);
  const a = anim.get(gob);
  return { x: a.mx, y: a.my, flash: a.mf };
})()`);
check(flashed.x === 1 && flashed.y === 11 && flashed.flash === 2, '...and a dash at the edge is drawn going on through the portal, out past its exit', JSON.stringify(flashed));
