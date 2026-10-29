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
