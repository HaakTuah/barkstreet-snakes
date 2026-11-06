// Stamina in how a snake looks (37-one-stamina): three Gobblers lying
// straight along rows 8, 12 and 16, tired (an empty bar), awake (a jump's
// worth) and on its game (a full bar). Tired, its body is greyer and its
// eyes heavy-lidded (darker over the eyes); on its game, its sheen and eyes
// are brighter than awake; holding golden leaps on an empty bar, it's awake,
// never tired. And the Field guide's picture: you tired above, greyer than
// you on your game below.
const stamina = await ev(`(() => {
  seeds(280);
  SnakeDebug.pinQuality(0);
  const g = stage(['gobbler', 'gobbler', 'gobbler']), [you, tired, awake, on] = g.snakes;
  setBody(you, [[2, 2], [1, 2], [0, 2]], 'right');
  [tired, awake, on].forEach((s, i) => setBody(s, Array.from({ length: 6 }, (_, j) => [12 - j, 8 + 4 * i]), 'right'));
  tired.restedAt = g.time + TUNING.STAMINA_MS;
  awake.restedAt = g.time + TUNING.STAMINA_MS - TUNING.JUMP_STAMINA_MS;
  on.restedAt = 0;
  const sat = ([r, gg, b]) => Math.max(r, gg, b) - Math.min(r, gg, b);
  const look = (s, y) => ({ seg: rgb(9.47, y + 0.55), sheen: lum(pixels(8.25, y + 0.2, 0.35, 0.3)), eyes: lum(pixels(12.45, y + 0.1, 0.35, 0.8)), width: anim.get(s).rad[3] / ${CELL} });
  show(g); drawN(20);
  const out = { tired: look(tired, 8), awake: look(awake, 12), on: look(on, 16) };
  out.steps = [tired, awake, on].map(s => E.staminaStep(g, s));
  tired.leaps = 2; drawN(20);
  out.golden = look(tired, 8);
  out.goldenStep = E.staminaStep(g, tired);
  const c = R.guideSprite('rests', 72), d = c.getContext('2d').getImageData(0, 0, 72, 72).data;
  const half = top => { let s = 0, n = 0; for (let y = top ? 8 : 44; y < (top ? 28 : 64); y++) for (let x = 20; x < 60; x++) { const i = (y * 72 + x) * 4; if (d[i + 1] > d[i] + 20) { s += sat([d[i], d[i + 1], d[i + 2]]); n++; } } return n ? s / n : 0; };
  out.guide = { tired: half(true), on: half(false) };
  out.sat = { tired: sat(out.tired.seg), awake: sat(out.awake.seg), on: sat(out.on.seg), golden: sat(out.golden.seg) };
  SnakeDebug.pinQuality(2);
  return out;
})()`);
{
  const { tired, awake, on, golden, guide, sat, steps, goldenStep } = stamina, f = v => v.toFixed(1);
  check(steps.join() === '0,1,2' && sat.tired < sat.awake - 25 && tired.width < awake.width && tired.eyes < awake.eyes - 8, 'a tired snake is greyer, a little thinner and heavy-eyed',
    `steps ${steps}; its body's colour ${sat.tired} from grey, ${sat.awake} awake; a segment ${f(100 * tired.width)}% of a cell, ${f(100 * awake.width)}% awake; over its eyes ${f(tired.eyes)}, ${f(awake.eyes)} awake`);
  check(on.sheen > awake.sheen + 3 && on.eyes > awake.eyes + 1 && Math.abs(sat.awake - sat.on) < 12, '...and on its game, its sheen and eyes brighter than awake, its colour its own',
    `sheen ${f(on.sheen)} on its game, ${f(awake.sheen)} awake; eyes ${f(on.eyes)}, ${f(awake.eyes)}`);
  check(goldenStep === 1 && Math.abs(sat.golden - sat.awake) < 8, '...and holding golden leaps on an empty bar, it’s awake, never tired', `step ${goldenStep}; its colour ${sat.golden} from grey, ${sat.awake} awake`);
  check(guide.tired < guide.on - 15, 'the Field guide shows you tired, greyer, above you on your game', `${f(guide.tired)} from grey above, ${f(guide.on)} below`);
}
