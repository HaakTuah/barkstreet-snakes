// ---------------------------------------------------------------- what anyone sees of a snake's stamina (2u)
// (37-one-stamina, "Shown on the snake": each snake's step, tired, awake or game on, and never more.)

// Two snakes on a bare log; the second's stamina left at `left` ms of the bar. What the first's
// aiView shows of it a few ticks on (a rival sees the snakes as they were a reaction time ago).
function seenStamina(left, gold = 0) {
  const g = board([[line(5, 5, 4), 'right'], [line(5, 15, 4), 'right']], { time: 60000 });
  const o = g.snakes[1];
  g.food = []; g.given = new Set(); o.leaps = gold;
  E.step(g);
  o.restedAt = left >= T.STAMINA_MS ? 0 : g.time + T.STAMINA_MS - left;
  for (let t = 0; t < 6; t++) E.step(g);
  return E.aiView(g, g.snakes[0]).others.find(q => q.id === o.id);
}
{
  // (each with a margin: it comes back over the ticks played)
  const full = seenStamina(T.STAMINA_MS), awake = seenStamina(T.JUMP_STAMINA_MS + 500), tired = seenStamina(T.JUMP_STAMINA_MS - 3000);
  const golden = seenStamina(0, 1);
  check('2u: the rivals see each snake\'s stamina step as its look shows it: game on, awake, tired (golden powers held: awake)',
    full.step === 2 && awake.step === 1 && tired.step === 0 && golden.step === 1, [full, awake, tired, golden].map(r => r.step).join(', '));
  check('2u: and nothing finer: no stamina, rest or refill time of another snake in what a rival sees',
    !Object.keys(full).some(k => /stamina|rest|ready/i.test(k)), Object.keys(full).join(', '));
}
