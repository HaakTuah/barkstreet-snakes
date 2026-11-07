// ---------------------------------------------------------------- where stamina comes from (2u+)
// (37-one-stamina, "Where stamina comes from"; the golden apple: 04-food-and-the-world, "The golden apple's worth".)
// Every snake here is a person's, through the engine's own calls, so the rivals' snakes play by the same.

// One snake going right, an apple (or `kind`) right ahead or none; its bar `spent` ms short of full and `bank`
// banked. Its stamina and bank after the tick it eats.
function meal(spent, bank = 0, kind = 'food') {
  const g = board([[line(10, 10, 4), 'right']], { time: 60000, food: kind ? [[11, 10, kind]] : [] }), s = g.snakes[0];
  s.restedAt = spent ? g.time + spent : 0; s.bank = bank;
  E.step(g);
  return { stamina: E.stamina(g, s), bank: s.bank, step: E.staminaStep(g, s), shield: s.shieldUntil - g.time, growth: s.grow };
}
{
  const ate = meal(6000), none = meal(6000, 0, null);
  check('2u+: a meal puts STAMINA_FOOD_MS back in the bar for each segment it grows you',
    Math.abs(ate.stamina - none.stamina - T.STAMINA_FOOD_MS) < 1, `${ate.stamina - none.stamina} ms more than without it`);
  const full = meal(0), near = meal(0, (T.STAMINA_BANK - 1) * T.STAMINA_MS - 100);
  check('2u+: eaten at a full bar, it banks, and the snake looks charged (step 3)', full.bank === T.STAMINA_FOOD_MS && full.step === 3, JSON.stringify(full));
  check('2u+: ...never past STAMINA_BANK bars in all', near.bank === (T.STAMINA_BANK - 1) * T.STAMINA_MS, `bank ${near.bank}`);
  const gold = meal(9000, 0, 'golden');
  check('2u+: a golden apple fills the bar, and its growth\'s share banks',
    gold.stamina === T.STAMINA_MS + T.GOLDEN_GROWTH * T.STAMINA_FOOD_MS && gold.bank === T.GOLDEN_GROWTH * T.STAMINA_FOOD_MS, JSON.stringify(gold));
  check('2u+: ...and gives a shield for GOLDEN_SHIELD_MS', gold.shield > T.GOLDEN_SHIELD_MS - 500 && gold.shield <= T.GOLDEN_SHIELD_MS, `${gold.shield} ms left a tick on`);
}
{ // A power is paid from the bank first: a dash with some banked.
  const g = board([[line(10, 10, 4), 'right']], { time: 60000 }), s = g.snakes[0];
  s.bank = 3000;
  E.flash(g, s); E.step(g);
  const paid = T.STAMINA_MS + 3000 - E.stamina(g, s);
  check('2u+: a power is paid from the bank first, then the bar', g.events.some(e => e.type === 'dash' && e.plain) && s.bank === 0 && Math.abs(paid - T.DASH_STAMINA_MS) < 200, `bank ${s.bank}, paid ${paid}`);
}
// A snake going right into a wall of body across its way (room to bounce), shielded or not: what the crash cost it.
function bump(shielded) {
  const wall = Array.from({ length: 14 }, (_, i) => [12, 3 + i]);
  const g = board([[line(11, 9, 6), 'right'], [wall, 'up']]), s = g.snakes[0]; // (at the start: no hunger yet)
  if (shielded) s.shieldUntil = g.time + 5000;
  E.step(g);
  const crash = g.events.find(e => e.type === 'crash' && e.snake === s);
  return { alive: s.alive, len: s.body.length, stun: s.stunUntil - g.tick, shield: s.shieldUntil, said: !!crash?.shield };
}
{
  const bare = bump(false), held = bump(true);
  check('2u+: a shield takes the next crash: no tail lost, no stun, and it\'s gone (the crash says so)',
    held.alive && held.len === 6 && held.stun <= 1 && held.shield === -1 && held.said && bare.len === 6 - T.CRASH_LOSS && bare.stun > 1, JSON.stringify({ bare, held }));
  // Boxed in, it does no good: a shielded snake nose to nose with a wall, walls all round.
  const g = board([[line(5, 5, 3), 'right'], [[[6, 4], [6, 5], [6, 6], [5, 6], [4, 6], [3, 6], [3, 5], [3, 4], [4, 4], [5, 4]], 'up']], { time: 60000 }), s = g.snakes[0];
  s.shieldUntil = g.time + 5000;
  E.step(g);
  check('2u+: ...but boxed in, a shielded snake is out all the same', !s.alive, `alive ${s.alive}`);
  // Its only way out is through the tail a crash sheds, which a shield would keep: the shield isn't spent, and it pays
  // the crash as anyone would (its tail off, stunned) and lives, never left boxed by its shield.
  const p = board([[[[5, 5], [4, 5], [4, 4], [5, 4], [6, 4], [7, 4]], 'right']]), q = p.snakes[0];
  p.holes = new Set([K(6, 5), K(5, 6)]); q.shieldUntil = p.time + 5000;
  E.step(p);
  check('2u+: ...and a shield that would keep it boxed is not spent: it pays the crash and lives, the shield kept',
    q.alive && q.body.length === 6 - T.CRASH_LOSS && q.stunUntil > p.tick + 1 && q.shieldUntil > p.time, JSON.stringify({ alive: q.alive, len: q.body.length, shield: q.shieldUntil - p.time }));
}
{ // What a rival sees of a charged snake: its step, never the bank.
  const g = board([[line(5, 5, 4), 'right'], [line(5, 15, 4), 'right']], { time: 60000 }), o = g.snakes[1];
  g.food = []; o.bank = 5000; o.shieldUntil = g.time + 8000; g.snakes[0].shieldUntil = g.time + 8000;
  for (let t = 0; t < 6; t++) E.step(g);
  const view = E.aiView(g, g.snakes[0]), seen = view.others.find(q => q.id === o.id);
  check('2u+: the rivals see a charged snake\'s step (3), and not what it has banked', seen.step === 3 && !Object.keys(seen).some(k => /bank/i.test(k)), JSON.stringify({ step: seen.step }));
  check('2u+: ...and see a shield, as its ring shows, and know how long their own holds', seen.shield === 1 && view.me.shield > 0 && view.me.shield <= 8000, JSON.stringify({ seen: seen.shield, mine: view.me.shield }));
}
