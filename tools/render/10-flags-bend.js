// A flag a snake lies on bends over (2l): a body on a colony's flag tile
// pushes it the way the snake came onto it (its pole's top and its cloth
// lower; east of where it stood when pushed east, west when pushed west),
// it stays so while the body's there, and once the tile's free it swings
// back (a wobble: one frame past upright the other way), then stands as
// before. Sovereign's banner bends the same way. With reduced motion it
// leans while covered and is upright at once when free.
await ev(`window.__autoRaf = true; 'ok'`);
await b.go(site.url + '?debug', { settle: 0 });
await ev('__settle()');
await ev(STAGE);
const bend = await ev(`(() => {
  seeds(200);
  SnakeDebug.pinQuality(0);
  const centre = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0, sx = 0, sy = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) { n++; sx += (i / 4) % p.width; sy += Math.floor(i / 4 / p.width); } return n ? [n, +(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : [0]; };
  const navy = (r, g, b) => b > 80 && r < 40 && g < 60, cream = (r, g, b) => r > 225 && g > 215 && b > 180;
  const flag = () => centre(10, 5, 5, 3, navy), banner = () => centre(15, 12.5, 5, 3, cream);
  const g = stage(['colonist', 'sovereign', 'mason']), [you, col, sov, ma] = g.snakes;
  setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
  setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 21]), 'right');
  setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right');
  setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
  col.memory.colonies = [{ x: 12, y: 7, radius: 3, n: 2 }];
  sov.memory.home = { x: 17, y: 15, radius: 4 };
  show(g); drawN(30, 0.5, 60);
  const out = { upright: flag(), bannerUp: banner() };
  setBody(you, [[13, 7], [12, 7], [11, 7], [10, 7]], 'right'); // (came on going east)
  drawN(10, 0.5, 60);
  out.east = flag();
  setBody(you, [[11, 7], [12, 7], [13, 7], [14, 7]], 'left'); // (cleared, then on from the east)
  drawN(1, 0.5, 60);
  setBody(ma, [[11, 7], [12, 7], [13, 7], [14, 7]], 'left'); setBody(you, [[2, 22], [1, 22], [0, 22]], 'right'); // (another snake, the other way)
  drawN(10, 0.5, 60);
  out.west = flag();
  setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right'); // (free again)
  drawN(4, 0.5, 60);
  out.swing = flag();
  drawN(20, 0.5, 60);
  out.after = flag();
  setBody(ma, Array.from({ length: 7 }, (_, i) => [22 - i, 15]), 'right'); // (Sovereign's banner, under Mason going east, its head well past)
  drawN(10, 0.5, 60);
  out.bannerEast = banner();
  setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right'); drawN(30, 0.5, 60);
  R.setReducedMotion(true);
  setBody(you, [[13, 7], [12, 7], [11, 7], [10, 7]], 'right');
  drawN(1, 0.5, 60);
  out.still = flag();
  setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
  drawN(1, 0.5, 60);
  out.stillAfter = flag();
  R.setReducedMotion(false);
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const fb = bend, xy = c => `${c[1]}, ${c[2]} (${c[0]} pixels)`;
check(fb.upright[0] > 20 && fb.east[0] > 5 && fb.west[0] > 5 && fb.east[2] > fb.upright[2] + 0.1 && fb.west[2] > fb.upright[2] + 0.1 && fb.west[1] < fb.east[1] - 0.4,
  'a colony’s flag bends over the way a snake came onto it, and the new way for another', `its ensign’s navy at ${xy(fb.upright)} upright, ${xy(fb.east)} pushed east, ${xy(fb.west)} pushed west`);
check(Math.abs(fb.swing[1] - fb.upright[1]) > 0.08 && Math.abs(fb.after[1] - fb.upright[1]) < 0.03 && Math.abs(fb.after[2] - fb.upright[2]) < 0.03,
  'freed, it springs back with a wobble, then stands as before', `at ${xy(fb.swing)} swinging, ${xy(fb.after)} after`);
check(fb.bannerUp[0] > 20 && fb.bannerEast[0] > 20 && fb.bannerEast[2] > fb.bannerUp[2] + 0.1,
  'Sovereign’s banner bends too', `its parchment at ${xy(fb.bannerUp)} upright, ${xy(fb.bannerEast)} pushed east`);
check(Math.abs(fb.still[2] - fb.upright[2]) > 0.1 && Math.abs(fb.stillAfter[1] - fb.upright[1]) < 0.03 && Math.abs(fb.stillAfter[2] - fb.upright[2]) < 0.03,
  'with reduced motion it leans at once and stands up again at once', `at ${xy(fb.still)} covered, ${xy(fb.stillAfter)} a frame after`);

// Flags in depth, hit head-on, and bent by their owners (2p). A flag
// stands up off its tile: a snake passing the row behind it goes under its
// cloth (the cloth as much in sight as with nobody there), and one passing
// the row in front of it hides the pole's foot. A head coming straight at
// the pole from the north or the south knocks it flat: for a moment its
// cloth is wrapped round the head (over it, at the head, not out to the
// pole's side), then it lies under the body (mostly hidden). Colonist
// bends its own colony's flag, and Sovereign its own banner, as anyone does.
const deep = await ev(`(() => {
  seeds(201);
  SnakeDebug.pinQuality(0);
  const centre = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0, sx = 0, sy = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) { n++; sx += (i / 4) % p.width; sy += Math.floor(i / 4 / p.width); } return n ? [n, +(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : [0]; };
  const navy = (r, g, b) => b > 80 && r < 40 && g < 60, cream = (r, g, b) => r > 225 && g > 215 && b > 180, pole = (r, g, b) => r > 205 && g > 190 && b > 150 && b < 205 && r - b > 25;
  const flag = () => centre(10, 5, 5, 4, navy), foot = () => centre(12.42, 7.8, 0.16, 0.07, pole), banner = () => centre(15, 12.5, 5, 3, cream);
  const g = stage(['colonist', 'sovereign', 'mason']), [you, col, sov, ma] = g.snakes, away = () => setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
  setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
  setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 21]), 'right');
  setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right');
  away();
  col.memory.colonies = [{ x: 12, y: 7, radius: 3, n: 2 }];
  sov.memory.home = { x: 17, y: 15, radius: 4 };
  show(g); drawN(30, 0.5, 60);
  const out = { alone: flag(), footAlone: foot(), bannerUp: banner() };
  setBody(you, Array.from({ length: 6 }, (_, i) => [15 - i, 6]), 'right'); drawN(4, 0.5, 60); // (the row behind it)
  out.behind = flag();
  setBody(you, Array.from({ length: 6 }, (_, i) => [15 - i, 8]), 'right'); drawN(4, 0.5, 60); // (the row in front)
  out.footFront = foot(); out.front = flag();
  away(); drawN(30, 0.5, 60);
  for (const [k, dy] of [['south', 1], ['north', -1]]) { // (straight at the pole: from the north going south, and from the south going north)
    const at = n => Array.from({ length: 5 }, (_, i) => [12, 7 - dy * (n + i)]);
    setBody(you, at(1), dy > 0 ? 'down' : 'up'); drawN(10, 0.5, 60);
    setBody(you, at(0), dy > 0 ? 'down' : 'up'); drawN(2, 0.5, 40);
    out[k] = flag();
    setBody(you, at(-2), dy > 0 ? 'down' : 'up'); drawN(10, 0.5, 60);
    out[k + 'Under'] = flag();
    away(); drawN(30, 0.5, 60);
  }
  setBody(col, Array.from({ length: 6 }, (_, i) => [13 - i, 7]), 'right'); drawN(10, 0.5, 60); // (Colonist over its own flag, going east)
  out.own = flag();
  setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
  setBody(sov, Array.from({ length: 7 }, (_, i) => [22 - i, 15]), 'right'); drawN(10, 0.5, 60); // (Sovereign over its own banner)
  out.ownBanner = banner();
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const d = deep;
check(d.alone[0] > 20 && d.behind[0] >= d.alone[0] * 0.9 && d.footAlone[0] > 0 && d.footFront[0] === 0 && d.front[0] >= d.alone[0] * 0.9,
  'a flag stands in depth: a snake on the row behind goes under its cloth, one on the row in front hides its foot',
  `its ensign’s navy ${d.alone[0]} alone, ${d.behind[0]} with a snake behind, ${d.front[0]} with one in front; its pole’s foot ${d.footAlone[0]} alone, ${d.footFront[0]} with one in front`);
check(['south', 'north'].every(k => d[k][0] > 5 && d[k][1] < d.alone[1] - 0.25 && Math.abs(d[k][1] - 12.5) < 0.4 && d[k + 'Under'][0] < d.alone[0] * 0.5),
  'hit head-on (from the north or the south), its cloth wraps round the head, then lies under the body',
  `its navy at ${xy(d.alone)} standing; wrapped ${xy(d.south)} (going south), ${xy(d.north)} (going north); then ${d.southUnder[0]} and ${d.northUnder[0]} pixels showing`);
check(d.own[0] > 5 && d.own[2] > d.alone[2] + 0.1 && d.ownBanner[0] > 20 && d.ownBanner[2] > d.bannerUp[2] + 0.1,
  'Colonist bends its own colony’s flag, and Sovereign its own banner',
  `the flag’s navy at ${xy(d.alone)} standing, ${xy(d.own)} under Colonist; the banner at ${xy(d.bannerUp)}, ${xy(d.ownBanner)} under Sovereign`);

// A flag planted under a snake (a new colony goes down under Colonist's
// head) is bent from the first frame it's drawn: it was never seen
// standing, so it doesn't stand for a frame and then snap over.
const planted = await ev(`(() => {
  seeds(202);
  SnakeDebug.pinQuality(0);
  const centre = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0, sx = 0, sy = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) { n++; sx += (i / 4) % p.width; sy += Math.floor(i / 4 / p.width); } return n ? [n, +(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : [0]; };
  const navy = (r, g, b) => b > 80 && r < 40 && g < 60;
  const g = stage(['colonist', 'sovereign', 'mason']), [you, col, sov, ma] = g.snakes;
  setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
  setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 21]), 'right');
  setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right');
  setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
  col.memory.colonies = [{ x: 12, y: 7, radius: 3, n: 2 }];
  show(g); drawN(30, 0.5, 60);
  const out = { upright: centre(10, 5, 5, 3, navy), first: null, frames: 0 };
  setBody(you, [[16, 14], [15, 14], [14, 14], [13, 14]], 'right'); // (going east, its head where the colony goes down)
  col.memory.colonies.push({ x: 16, y: 14, radius: 3, n: 4 });
  for (let i = 0; i < 120 && !out.first; i++) { drawN(1, 0.5, 33); out.frames++; const f = centre(14, 12, 5, 3, navy); if (f[0] > 5) out.first = f; }
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const pl = planted;
check(pl.first && pl.upright[0] > 20 && pl.first[2] - 14 > pl.upright[2] - 7 + 0.1,
  'a flag planted under a snake is bent from the first frame it shows, not standing for a frame first',
  `the standing flag’s navy at ${xy(pl.upright)}; the planted one, ${pl.frames} frames on, at ${pl.first ? xy(pl.first) : 'nothing'}`);
