// Hunger where your eyes are (on a wide screen the tag's bar went
// unseen, and the owner starved): Sniper lying straight, just fed, then
// with 2 s of its meal left, then starving. Hungry, its body is
// slimmer, in its own colour still, and growl lines rumble out above
// and below its head (read over a few frames: they swell and fade);
// starving, it's paler too.
const hunger = await ev(`(() => {
  seeds(1);
  SnakeDebug.pinQuality(0);
  const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
  const body = (r, g, b) => r > 60 && r > g + 30 && r > b + 25;
  const g = stage(['sniper', 'gobbler', 'mason']), [you, sn, gob, ma] = g.snakes;
  [you, gob, ma].forEach((s, i) => setBody(s, [[2, 2 + 3 * i], [1, 2 + 3 * i], [0, 2 + 3 * i]], 'right'));
  setBody(sn, Array.from({ length: 8 }, (_, i) => [13 - i, 12]), 'right');
  sn.mealMs = 12000;
  const growl = () => { let most = 0; for (let f = 0; f < 16; f++) { drawN(1, 1); most = Math.max(most, Math.abs(lum(pixels(13.1, 11.35, 0.8, 0.35)) - calm) + Math.abs(lum(pixels(13.1, 13.3, 0.8, 0.35)) - calmBelow)); } return most; };
  const look = left => { sn.lastAte = g.time - TUNING.HUNGER_MS + left; g.tick++; drawN(6, 1); return { width: count(9, 11.5, 2, 2, body), lum: lum(pixels(9.3, 12.3, 0.4, 0.4)) }; };
  show(g);
  const fed = look(TUNING.HUNGER_MS);
  const calm = lum(pixels(13.1, 11.35, 0.8, 0.35)), calmBelow = lum(pixels(13.1, 13.3, 0.8, 0.35));
  const fedGrowl = growl();
  const hungry = look(2000); hungry.growl = growl();
  const starving = look(-2000);
  SnakeDebug.pinQuality(2);
  return { fed, fedGrowl, hungry, starving };
})()`);
{
  const { fed, fedGrowl, hungry, starving } = hunger, f2 = v => v.toFixed(2);
  check(hungry.width < 0.9 * fed.width && starving.width <= hungry.width && Math.abs(hungry.lum / fed.lum - 1) < 0.1, 'a hungry body is slimmer, in its own colour still',
    `its body ${hungry.width} pixels over two cells with 2 s of its meal left, ${starving.width} starving, ${fed.width} just fed; its brightness at ${f2(hungry.lum / fed.lum)} of fed`);
  check(hungry.growl > 8 && fedGrowl < 2, 'in the hunger warning, growl lines rumble out either side of its head', `beside its head ${f2(hungry.growl)} from the bark, fed ${f2(fedGrowl)}`);
  check(starving.lum > 1.2 * fed.lum, 'starving, it pales', `its body's brightness at ${f2(starving.lum / fed.lum)} of fed`);
}
