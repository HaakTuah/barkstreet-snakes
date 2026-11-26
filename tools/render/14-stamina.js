// Stamina on the snake (2u, 37-one-stamina): Desperado lying straight,
// tired (it can afford neither power), awake (one), game on (a full
// bar), charged (a full bank: 2u+) and shielded (a golden apple's shield). Tired, its body is a little slimmer and grayer and its lids come
// down over its eyes (less of their white shows); game on, its
// catchlights are bigger than awake (Desperado's eyes have none awake). Each look measured after its
// fade, as the most white over a few frames (a blink doesn't count).
const stamina = await ev(`(() => {
  seeds(1);
  SnakeDebug.pinQuality(0);
  const g = stage(['desperado', 'gobbler', 'mason']), [you, de, gob, ma] = g.snakes;
  [you, gob, ma].forEach((s, i) => setBody(s, [[2, 2 + 3 * i], [1, 2 + 3 * i], [0, 2 + 3 * i]], 'right'));
  setBody(de, Array.from({ length: 8 }, (_, i) => [13 - i, 12]), 'right');
  const count = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) n++; return n; };
  const body = (r, g, b) => r > 60 && r > g + 30 && r > b + 25;
  const white = (r, g, b) => r > 238 && g > 238 && b > 238; // (a catchlight: brighter than the eyes' cream, #fffbea)
  const eye = (r, g, b) => r > 235 && g > 228 && b > 200; // (the eyes' whites, cream, catchlights and all)
  const sat = d => { let s = 0; for (let i = 0; i < d.data.length; i += 4) s += Math.max(d.data[i], d.data[i + 1], d.data[i + 2]) - Math.min(d.data[i], d.data[i + 1], d.data[i + 2]); return s / (d.data.length / 4); };
  const warm = d => { let w = 0; for (let i = 0; i < d.data.length; i += 4) w += d.data[i] - d.data[i + 2]; return w / (d.data.length / 4); };
  const lum = d => { let l = 0; for (let i = 0; i < d.data.length; i += 4) l += d.data[i] + d.data[i + 1] + d.data[i + 2]; return l / 3 / (d.data.length / 4); };
  const look = (ahead, bank = 0, shield = false) => {
    de.restedAt = ahead ? g.time + ahead : 0; de.bank = bank; de.shieldUntil = shield ? g.time + 5000 : -1; g.tick++;
    drawN(12, 1);
    let light = 0, whites = 0;
    for (let f = 0; f < 6; f++) { drawN(1, 1); light = Math.max(light, count(13, 11.4, 1.2, 1.2, white)); whites = Math.max(whites, count(13, 11.4, 1.2, 1.2, eye)); }
    return { step: E.staminaStep(g, de), width: count(9, 11.5, 2, 2, body), sat: sat(pixels(9.3, 12.3, 0.4, 0.4)), warm: warm(pixels(9.3, 12.3, 0.4, 0.4)), ring: lum(pixels(13.3, 11.45, 0.4, 0.25)), light, whites };
  };
  show(g);
  const out = { full: look(0), awake: look(TUNING.STAMINA_MS - TUNING.DASH_STAMINA_MS), tired: look(TUNING.STAMINA_MS - TUNING.JUMP_STAMINA_MS / 2),
    charged: look(0, (TUNING.STAMINA_BANK - 1) * TUNING.STAMINA_MS), shielded: look(0, 0, true) };
  SnakeDebug.pinQuality(2);
  return out;
})()`);
{
  const { full, awake, tired, charged, shielded } = stamina, f2 = v => v.toFixed(2);
  check(full.step === 2 && awake.step === 1 && tired.step === 0, 'the staged stamina is at each step: game on, awake, tired', `${full.step}, ${awake.step}, ${tired.step}`);
  check(tired.width < 0.97 * awake.width && tired.sat < 0.9 * awake.sat, 'tired, a body is a little slimmer and grayer',
    `its body ${tired.width} pixels over two cells tired, ${awake.width} awake; its colour at ${f2(tired.sat / awake.sat)} of awake`);
  check(tired.whites < 0.6 * awake.whites && full.light > awake.light, 'tired, its lids hide its eyes; game on, its eyes are brighter',
    `its eyes' whites: ${tired.whites} pixels tired, ${awake.whites} awake; their catchlights: ${awake.light} awake, ${full.light} game on`);
  check(charged.step === 3 && charged.warm > full.warm + 8, '2u+: charged (some banked), its body glows warm',
    `step ${charged.step}; red over blue ${f2(charged.warm)} charged, ${f2(full.warm)} game on`);
  check(shielded.ring > full.ring + 8, '2u+: a golden apple\'s shield shows as a cream ring round its head', `brightness just above its head: ${f2(shielded.ring)} shielded, ${f2(full.ring)} not`);
}
