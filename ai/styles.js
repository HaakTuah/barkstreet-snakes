// Every rival's power style (part 7b of round six B; design 39, "Every
// rival has a power style"): what each spends a plain power on readily,
// in its own way. A persona's `style` (one shape for all: STYLE in
// ai/rivals.js) names the purposes it flashes for, each with the share
// of the plain flash's price it pays for one (the spend and the wait
// below the reserve; never below what it was before part 7a, SURE_FLOOR
// of it, and never stacked with a sure gain's discount: see consider);
// whoever it is, the same tests find the purpose, and a flash for one is
// weighed that way too, not only the way I'd crawl. The search still has
// to see it beat crawling.
//   race    wins a race for food (Gobbler)
//   cut     cuts my target (Sniper cuts it off)
//   chase   closes on my target, near (Sovereign and Colonist go after an
//             intruder)
//   seal    ends beside my own body, my target near: a gap in the box shut
//             (Mute seals its box)
//   bead    eats a bead on the way (Vulture)
//   tail    ends on a rival's tail tip as it moves off, or right behind it
//             (Creeper flashes in behind)
//   skim    ends beside a body, a head or the edge (Desperado, for the thrill)
//   swerve  turns off my line with a rival's head near, and ends farther
//             from it (Joker springs a lure)
//   wall    straight on, up to a wall: the edge, a hole or a body (Mason
//             finishes a wall)
// And two that aren't a share of the flash:
//   keep    my wait below the reserve, this many times what it costs anyone
//             (Ghost keeps a flash ready to escape)
//   coil    a plain jump over my own body for its own sake, where no rival
//             could get to the landing first, at the full price (Ouroboros
//             jumps its coils)
const CHASE_NEAR = 6; // (a target this near or nearer, a flash that closes on it is a chase, or one beside my body a seal)
const SWERVE_NEAR = 4; // (a rival's head this near: a flash off my line springs the lure)
let styleBead = false, styleX = 0, styleY = 0; // (where the flash weighed ends, and whether its cells hold a bead)
// The cell a plain flash along d ends on (-1: off the board).
function styleReach(d) {
  let x = myHead.x, y = myHead.y, c = -1;
  styleBead = false;
  for (let i = 0; i < TUNE.FLASH_LENGTH; i++) {
    c = cellAt(x + d.x, y + d.y);
    if (c < 0) return -1;
    x = c % N; y = (c - x) / N;
    if (foodValue[c] > 0) for (const f of food) if (f.kind === 'pellet' && f.owner !== me.id && f.y * N + f.x === c) styleBead = true;
  }
  styleX = x; styleY = y;
  return c;
}
const nearTarget = () => intent.target && manhattan(myHead, intent.target) <= CHASE_NEAR;
const STYLE_TESTS = {
  race: (d, won) => !!won,
  cut: (d, won, cut) => cut,
  chase: () => nearTarget() && Math.abs(styleX - intent.target.x) + Math.abs(styleY - intent.target.y) < manhattan(myHead, intent.target) - 1,
  seal: d => nearTarget() && DIR_LIST.some(e => { // (my own body beside where I end, not the cell I've just come through)
    if (e.x === -d.x && e.y === -d.y) return false;
    const c = cellAt(styleX + e.x, styleY + e.y);
    return c >= 0 && myCells[c] === stampM;
  }),
  bead: () => styleBead,
  tail: () => others.some(o => {
    const n = o.body.length, q = o.body[n - 1], p = o.body[n - 2] || q;
    return (q.x === styleX && q.y === styleY) || (2 * q.x - p.x === styleX && 2 * q.y - p.y === styleY);
  }),
  skim: () => DIR_LIST.some(e => {
    const c = cellAt(styleX + e.x, styleY + e.y);
    return c < 0 || (myCells[c] !== stampM && mineFree[c] > 1 && !holes.has(c)); // (the cell I came through is free: I'm not on it yet)
  }),
  swerve: d => !sameDir(d, me.dir) && heads.some(h => manhattan(h, myHead) <= SWERVE_NEAR && Math.abs(h.x - styleX) + Math.abs(h.y - styleY) > manhattan(h, myHead)),
  wall: d => {
    if (!sameDir(d, me.dir)) return false;
    const c = cellAt(styleX + d.x, styleY + d.y);
    return c < 0 || mineFree[c] > 1 || myCells[c] === stampM;
  },
};
const STYLE_KINDS = Object.keys(STYLE_TESTS);
// The share of a plain flash's price my style asks along d (1: none of it
// mine). won: the food it wins a race for, if any; cut: whether it cuts my
// target (both found by the flash's own weighing: race, flashOpt).
function styleShare(d, won, cut) {
  const s = w.style;
  if (!s || styleReach(d) < 0) return 1;
  let share = 1;
  for (const k of STYLE_KINDS) if (s[k] < share && STYLE_TESTS[k](d, won, cut)) share = s[k];
  return share;
}
// Is a flash along d one my style names (so it's weighed that way too)?
// (A cut is found where a body is near, as for the hunters: bodyNear.)
function styleWay(d) {
  return !!w.style && styleShare(d, w.style.race < 1 ? race(d) : null, false) < 1;
}
// Does a jump down on path[span] go over my own body? (coilJump: the
// plain jump weighed goes only for that, my style's: see landOpt; a plain
// jump has one landing a way, so it's the one consider is given)
let coilJump = false;
function hopsMine(span) {
  for (let i = 0; i < span; i++) if (myCells[path[i]] === stampM) return true;
  return false;
}
