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

// The meal goes down: starving, Sniper eats, and from its head its body
// fills out and its colour floods back, segment by segment (a quarter of a
// second in, its neck most of the way back, its tail still thin and pale),
// all of it as fed in under a second. With reduced motion, no wave: the
// body eases back alike all along, in a short fade. (Each stretch measured
// against itself fed and starving: its coat differs along it.)
const meal = await ev(`(() => {
  seeds(1);
  SnakeDebug.pinQuality(0);
  const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
  const body = (r, g, b) => r > 60 && r > g + 30 && r > b + 25;
  const g = stage(['sniper', 'gobbler', 'mason']), [you, sn, gob, ma] = g.snakes;
  [you, gob, ma].forEach((s, i) => setBody(s, [[2, 2 + 3 * i], [1, 2 + 3 * i], [0, 2 + 3 * i]], 'right'));
  setBody(sn, Array.from({ length: 12 }, (_, i) => [15 - i, 12]), 'right');
  sn.mealMs = 12000;
  // (its neck: cells 13 and 12; its tail: cells 5 and 4)
  const look = () => ({ neck: count(12, 11.5, 2, 2, body), tail: count(4, 11.5, 2, 2, body), neckLum: lum(pixels(12, 11.5, 2, 2)), tailLum: lum(pixels(4, 11.5, 2, 2)) });
  const eat = () => { sn.lastAte = g.time; g.tick++; };
  const out = {};
  show(g);
  for (const still of [false, true]) {
    R.setReducedMotion(still);
    eat(); drawN(40, 1);
    const fed = look();
    sn.lastAte = g.time - TUNING.HUNGER_MS - 2000; g.tick++; drawN(6, 1); // (starving)
    const starving = look();
    eat(); drawN(still ? 3 : 9, 1); // (it eats: a quarter of a second on, or a tenth with reduced motion)
    const going = look();
    drawN(30, 1); // (a second on)
    out[still ? 'reduced' : 'lively'] = { fed, starving, going, after: look() };
  }
  R.setReducedMotion(false);
  SnakeDebug.pinQuality(2);
  return out;
})()`);
{
  // (How far back to fed each stretch has come: 0 starving, 1 fed.)
  const back = (o, k) => (o[k] - o.starving[k]) / (o.fed[k] - o.starving[k]);
  const at = (o, w) => ({ neck: back({ ...o, neck: w.neck }, 'neck'), tail: back({ ...o, tail: w.tail }, 'tail'), neckLum: back({ ...o, neckLum: w.neckLum }, 'neckLum'), tailLum: back({ ...o, tailLum: w.tailLum }, 'tailLum') });
  const f2 = v => v.toFixed(2), say = b => `neck ${f2(b.neck)} wide and ${f2(b.neckLum)} coloured, tail ${f2(b.tail)} and ${f2(b.tailLum)} of the way back`;
  const { lively: l, reduced: r } = meal, lg = at(l, l.going), la = at(l, l.after), rg = at(r, r.going), ra = at(r, r.after);
  check(l.fed.neck > 1.08 * l.starving.neck && l.starving.tailLum > 1.1 * l.fed.tailLum, 'staged: starving, Sniper is thinner and paler', `fed ${l.fed.neck} pixels over its neck, starving ${l.starving.neck}`);
  check(lg.neck > 0.5 && lg.neckLum > 0.5 && lg.tail < 0.15 && lg.tailLum < 0.15, 'after a meal, from its head its body fills out and its colour comes back, its tail still thin and pale', `a quarter of a second after eating: ${say(lg)}`);
  check([la.neck, la.tail, la.neckLum, la.tailLum].every(v => v > 0.9), 'a second after the meal, its whole body is plump and in its own colour again', `a second on: ${say(la)}`);
  check(Math.abs(rg.neck - rg.tail) < 0.2 && Math.abs(rg.neckLum - rg.tailLum) < 0.2 && rg.neckLum > 0.1 && rg.neckLum < 0.9 && [ra.neck, ra.tail, ra.neckLum, ra.tailLum].every(v => v > 0.9),
    'with reduced motion, a meal eases the whole body back alike, no wave', `a tenth of a second after eating: ${say(rg)}; a second on: ${say(ra)}`);
}
