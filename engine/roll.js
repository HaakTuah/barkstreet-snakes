// What food can roll past (see rollSide): on the board, not a hole, not
// burning, and no body that'll still be there next tick. (Food or a
// burrow lying there it rolls over; it just can't stop there.)
function foodPast(game, x, y) {
  if (!inside(x, y)) return false;
  const k = key(x, y);
  if (game.holes.has(k) || burning(game, k)) return false;
  for (const o of game.snakes) {
    if (!o.alive) continue;
    const keep = o.grow === 0 && o.stunUntil <= game.tick + 1 ? o.body.length - 1 : o.body.length;
    for (let j = 0; j < keep; j++) if (o.body[j].x === x && o.body[j].y === y) return false;
  }
  return true;
}
// Which way a step from cell a to the next, b, went (a step through the
// wrapped edge too).
function stepWay(a, b) {
  let dx = b.x - a.x, dy = b.y - a.y;
  if (dx > 1) dx = -1; else if (dx < -1) dx = 1;
  if (dy > 1) dy = -1; else if (dy < -1) dy = 1;
  return CRAWL.find(d => d.x === dx && d.y === dy) || null;
}
// Where food a head knocks at (x, y) rolls: { x, y }, or null if it can't
// go anywhere (it stays where it is). A rule, never chance, so anyone can
// see where it'll go. With d the move that brought the head there and p
// the move before it:
//   1. a turn (d isn't p): to the inside of the turn, a cell back against
//      p, beside the neck (on the outside, a cell on in p, it lay just
//      where a head going on round, up, right, up, right, came next, and
//      it was nudged along under the head all through a cough); if that's
//      taken, the outside;
//   2. straight on: to the side with more open log (free cells in a row
//      going out that way, up to 4); a tie goes to the side nearer the
//      middle of the board, then to the snake's right; if that side's
//      taken, the other;
//   3. both taken: it rolls on the way it would have gone first, over
//      whatever lies on the log there (food, a burrow), to the first free
//      cell within ROLL_ON; failing that, the other way. Only with both
//      ways shut (the edge, a hole, fire or a body in the way) does it stay
//      under the head. (Without this, a bead met crossing a line of beads
//      stayed under the head, and then the body, hidden from everyone:
//      about 4 chokes in 10. Rolling straight ahead as well was tried: it
//      lay where the head went next, and the cougher pushed it along.)
// s: the snake, or anything with its body (the head at (x, y), or (x, y)
// the cell the head's about to move into) and dir. isFree(x, y): may food
// stop there? canPass(x, y): may it roll past there (where it can't stop:
// food or a burrow there)? (The engine's are foodRoom and foodPast; an AI
// passes its own. Without canPass, nothing rolls on past the next cell.)
// The wrapped edge is an edge here: nothing rolls through it. (game:
// unused for now.)
const ROLL_ON = 4;
function rollSide(game, s, x, y, isFree, canPass = null) {
  const b = s.body, here = !!b[0] && b[0].x === x && b[0].y === y;
  const prev = here ? b[1] : b[0], before = here ? b[2] : b[1];
  const d = (prev && stepWay(prev, { x, y })) || s.dir;
  const p = (prev && before && stepWay(before, prev)) || d;
  const ok = (dx, dy) => inside(x + dx, y + dy) && isFree(x + dx, y + dy);
  let ways;
  if (d.x !== p.x || d.y !== p.y) ways = [{ x: -p.x, y: -p.y }, p];
  else {
    const right = { x: -d.y, y: d.x }, left = { x: d.y, y: -d.x }, mid = (GRID - 1) / 2;
    const open = w => { let n = 0; while (n < 4 && ok(w.x * (n + 1), w.y * (n + 1))) n++; return n; };
    const toMid = w => Math.abs(x + w.x - mid) + Math.abs(y + w.y - mid);
    const r = open(right), l = open(left);
    ways = (r !== l ? r > l : toMid(left) >= toMid(right)) ? [right, left] : [left, right];
  }
  for (const w of ways) if (ok(w.x, w.y)) return { x: x + w.x, y: y + w.y };
  const on = w => { // (rolling on, over what lies there)
    if (canPass) for (let n = 1; n < ROLL_ON; n++) {
      if (!inside(x + w.x * n, y + w.y * n) || !canPass(x + w.x * n, y + w.y * n)) break;
      if (ok(w.x * (n + 1), w.y * (n + 1))) return { x: x + w.x * (n + 1), y: y + w.y * (n + 1) };
    }
    return null;
  };
  return on(ways[0]) || on(ways[1]);
}
