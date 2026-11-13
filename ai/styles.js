// Every rival's power style (part 7b of round six B; design 39, "Every
// rival has a power style"): what each spends a plain power on readily,
// in its own way. A persona's `style` names the purposes it flashes for,
// each with the share of the plain flash's price it pays for one (the
// spend and the wait below the reserve); whoever it is, the same tests
// find the purpose, and a flash for one is weighed that way too, not only
// the way I'd crawl. The search still has to see it beat crawling.
//   race    wins a race for food (Gobbler)
//   cut     cuts my target (Sniper cuts it off)
//   chase   closes on my target, near (Mute seals its box; Sovereign and
//             Colonist go after an intruder)
//   bead    eats a bead on the way (Vulture)
//   tail    ends right behind a rival's tail (Creeper flashes in behind)
//   skim    ends beside a body, a head or the edge (Desperado, for the thrill)
//   swerve  turns off my line with a rival's head near (Joker springs a lure)
//   wall    straight on, up to a wall: the edge, a hole or a body (Mason
//             finishes a wall)
// And two that aren't a share of the flash:
//   keep    my wait below the reserve, this many times what it costs anyone
//             (Ghost keeps a flash ready to escape)
//   coil    a plain jump over my own body for its own sake, where no rival
//             could get to the landing first, at the full price (Ouroboros
//             jumps its coils)
const CHASE_NEAR = 6; // (a target this near or nearer, a flash that closes on it is a chase)
const SWERVE_NEAR = 4; // (a rival's head this near: a flash off my line springs the lure)
// (the cell a plain flash along d ends on, and whether its cells hold a
// bead; -1: off the board)
let styleBead = false;
function styleReach(d) {
  let x = myHead.x, y = myHead.y, c = -1;
  styleBead = false;
  for (let i = 0; i < TUNE.FLASH_LENGTH; i++) {
    c = cellAt(x + d.x, y + d.y);
    if (c < 0) return -1;
    x = c % N; y = (c - x) / N;
    if (foodValue[c] > 0) for (const f of food) if (f.kind === 'pellet' && f.owner !== me.id && f.y * N + f.x === c) styleBead = true;
  }
  return c;
}
// The share of a plain flash's spend my style asks along d (1: none of it
// mine). won: the food it wins a race for, if any; cut: whether it cuts my
// target (both found by the flash's own weighing: race, flashOpt).
function styleShare(d, won, cut) {
  const s = w.style;
  if (!s) return 1;
  const end = styleReach(d);
  if (end < 0) return 1;
  const ex = end % N, ey = (end - ex) / N;
  let share = 1;
  const take = (k, yes) => { if (s[k] !== undefined && s[k] < share && yes()) share = s[k]; };
  take('race', () => !!won);
  take('cut', () => cut);
  take('bead', () => styleBead);
  take('chase', () => {
    const t = intent.target;
    if (!t) return false;
    const now = manhattan(myHead, t);
    return now <= CHASE_NEAR && Math.abs(ex - t.x) + Math.abs(ey - t.y) < now - 1;
  });
  take('tail', () => others.some(o => { const q = o.body[o.body.length - 1]; return Math.abs(q.x - ex) + Math.abs(q.y - ey) === 1; }));
  take('skim', () => DIR_LIST.some(e => {
    const c = cellAt(ex + e.x, ey + e.y);
    return c < 0 || (myCells[c] !== stampM && mineFree[c] > 1 && !holes.has(c)); // (the cell I came through is free: I'm not on it yet)
  }));
  take('swerve', () => !sameDir(d, me.dir) && heads.some(h => manhattan(h, myHead) <= SWERVE_NEAR && manhattan(h, { x: ex, y: ey }) > manhattan(h, myHead)));
  take('wall', () => {
    if (!sameDir(d, me.dir)) return false;
    const c = cellAt(ex + d.x, ey + d.y);
    return c < 0 || mineFree[c] > 1 || myCells[c] === stampM;
  });
  return share;
}
// Is a flash along d one my style names (so it's weighed that way too)?
// (A cut is found where a body is near, as for the hunters: bodyNear.)
function styleWay(d) {
  return !!w.style && styleShare(d, w.style.race !== undefined ? race(d) : null, false) < 1;
}
// Does a jump down on path[span] go over my own body? (coilJump: the last
// plain jump weighed goes only for that, my style's: see landOpt)
let coilJump = false;
function hopsMine(span) {
  for (let i = 0; i < span; i++) if (myCells[path[i]] === stampM) return true;
  return false;
}
