// Round six B, bridges: a snake's body lying over a pit is a bridge for
// anyone else's head, there (never its head, nor anywhere on bark, where
// a body is a wall): it may crawl onto it and along its back, for as long
// as that body is still there once everyone has moved this tick (see
// bodyStamp: a tail leaving now isn't). Once the tail has passed, the
// cell's open pit again, and a head over it falls in (see fallIn). A
// blown-up flash (boom) bridges nothing.
// (Never its head's cell: a head-on, or right behind a head. Never a
// body whose own head is over a pit, riding or held there: two snakes
// can't keep each other up. Never where s's own body still lies: that's
// biting itself. A body that crashes this tick bridges only what it keeps.)
function bridgeAt(game, s, x, y) {
  const k = key(x, y);
  if (s.boom || bodyStamp[k] !== stamp || !game.holes.has(k)) return false;
  const keep = s.tailMoves ? s.body.length - 1 : s.body.length;
  for (let j = 0; j < keep; j++) if (s.body[j].x === x && s.body[j].y === y) return false;
  if (game.snakes.some(o => o !== s && o.alive && o.body[0].x === x && o.body[0].y === y)) return false; // (another's head there now: a head-on, or running into it, as on bark)
  return game.snakes.some(o => {
    if (o === s || !o.alive || o.flight || game.holes.has(key(o.body[0].x, o.body[0].y))) return false;
    const j = o.body.findIndex(c => c.x === x && c.y === y), L = o.body.length;
    const stays = crashes0.has(o) ? L - Math.min(T.CRASH_LOSS, L - T.MIN_LENGTH) : o.tailMoves ? L - 1 : L;
    return j > 0 && j < stays && !o.boom;
  });
}
// Another's body over a pit at (x, y) that's a bridge for s, still there
// after `moves` moves (this one the first), as the rule above has it.
function bridgeOver(game, s, x, y, moves) {
  if (!game.holes.has(key(x, y)) || s.body.some(c => c.x === x && c.y === y)) return false;
  return game.snakes.some(o => {
    if (o === s || !o.alive || o.flight || game.holes.has(key(o.body[0].x, o.body[0].y))) return false;
    const j = o.body.findIndex(c => c.x === x && c.y === y);
    return j > 0 && o.body.length - j + o.grow + Math.max(0, o.stunUntil - game.tick) > moves;
  });
}
// A bridge a jump could come down on `moves` moves from now (this one the
// first): another's body over a pit, behind its head, still there then.
const lasting = (game, s, c, moves) => bridgeOver(game, s, c.x, c.y, moves);
// A head on the ground over a hole, with nothing across it any more,
// falls in. (A jump whose landing was taken comes down on what it hopped:
// a body lying across a hole holds it up, until that body moves on.)
function fallIn(game, dying) {
  if (!game.holes.size) return;
  for (const s of game.snakes) {
    const h = s.body[0];
    if (!s.alive || s.flight || !game.holes.has(key(h.x, h.y))) continue;
    if (game.snakes.some(o => o !== s && o.alive && o.body.some(b => b.x === h.x && b.y === h.y))) continue;
    s.cause = 'fell into a woodpecker hole'; s.killer = 'wall'; s.killerId = null; s.fatal = 'hole';
    s.alive = false;
    dying.push(s);
  }
}
