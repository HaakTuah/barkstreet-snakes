// Capricious without its ring, and a costume change for every change (2t).
// In a mood, Capricious has no ring round its head (none of its pink just
// past the front of its head). Taking up a mood, a puff of pale pink
// clouds swells round its head and clears within half a second, and then
// it wears the mood's face, with no ring flashing out. Copycat taking on a
// model puffs the same way, in its red. With reduced motion, no puff.
const costume = await ev(`(() => {
  seeds(210);
  SnakeDebug.pinQuality(0);
  const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
  const hot = (r, g, b) => r > 200 && g < 120 && b > 120, pale = (r, g, b) => r > 235 && g > 175 && g < 230 && b > 205, red = (r, g, b) => r > 170 && g < 80 && b < 70;
  const g = stage(['capricious', 'copycat', 'metagamer']), [you, cap, cc, mg] = g.snakes;
  setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
  setBody(cap, Array.from({ length: 6 }, (_, i) => [10 - i, 6]), 'right'); cap.memory.mood = null;
  setBody(cc, Array.from({ length: 6 }, (_, i) => [10 - i, 14]), 'right'); cc.memory.modelId = null;
  setBody(mg, Array.from({ length: 6 }, (_, i) => [18 - i, 20]), 'right');
  show(g); drawN(30, 0.5, 33);
  const at = s => { const o = R.headPx(s, 0.5, TUNING.GRID * ${CELL}, {}); return [o.x / ${CELL}, o.y / ${CELL}]; };
  const ahead = (s, is) => { const [hx, hy] = at(s); return count(hx + 0.47, hy - 0.2, 0.16, 0.4, is); }, round = (y, is) => count(9.6, y - 0.4, 2.2, 1.8, is);
  const out = { still: round(6, pale) };
  cap.memory.mood = 'sniper'; cap.memory.moodChangedAt = g.time;
  drawN(6, 0.5, 33);
  out.puff = round(6, pale);
  drawN(20, 0.5, 33);
  out.after = round(6, pale); out.ringAfter = ahead(cap, hot);
  out.ccStill = round(14, red);
  cc.memory.modelId = mg.id;
  drawN(6, 0.5, 33);
  out.ccPuff = round(14, (r, gg, b) => r > 235 && gg > 180 && gg < 225 && b > 180 && b < 225);
  drawN(20, 0.5, 33);
  out.ccAfter = round(14, (r, gg, b) => r > 235 && gg > 180 && gg < 225 && b > 180 && b < 225);
  R.setReducedMotion(true);
  cap.memory.mood = 'gobbler'; cap.memory.moodChangedAt = g.time;
  drawN(6, 0.5, 33);
  out.stillPuff = round(6, pale);
  R.setReducedMotion(false);
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const cs = costume;
check(cs.ringAfter <= 3, 'Capricious in a mood has no ring round its head', `its hot pink just past the front of its head: ${cs.ringAfter} (with the ring, about 30)`);
check(cs.puff > 20 && cs.puff > cs.still * 3 && cs.after <= cs.still + 3, 'changing mood, a pale pink puff swells round Capricious’s head and clears within half a second',
  `pale pink round its head: ${cs.still} before, ${cs.puff} at 200 ms, ${cs.after} at 860 ms`);
check(cs.ccPuff > 20 && cs.ccAfter < cs.ccPuff / 3, 'taking on a model, Copycat puffs the same way', `its puff’s pale red round its head: ${cs.ccPuff} at 200 ms, ${cs.ccAfter} at 860 ms`);
check(cs.stillPuff <= cs.still + 3, 'with reduced motion, no puff (a crossfade)', `pale pink round its head ${cs.stillPuff}, ${cs.still} before`);
