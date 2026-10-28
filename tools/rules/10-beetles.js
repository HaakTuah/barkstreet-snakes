// ---------------------------------------------------------------- round six A: beetles
{ // A cornered beetle digs in: a head within BEETLE_DIG_FEAR and no burrow within reach. It stays put while it digs, and
  // can be caught. (Another beetle underground for good on each board, so no more come out meanwhile.)
  const bug = () => ({ x: 10, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 });
  const away = () => [{ until: 1e9, expires: 1e9, from: -1, gold: false }];
  const g = board([[line(5, 10, 4), 'right'], [line(20, 22, 4), 'right']], { time: 30000 });
  const [b] = lay(g, bug());
  g.unders = away();
  feed(g); kept(g);
  const dig = g.events.find(e => e.type === 'dig');
  check('a cornered beetle digs in', dig && dig.x === 10 && dig.y === 10 && dig.until === g.tick - 1 + T.BEETLE_DIG && b.digUntil === dig.until, JSON.stringify(dig));
  let caught = null;
  for (let t = 0; t < T.BEETLE_DIG && !caught; t++) { feed(g); kept(g); if (!(b.x === 10 && b.y === 10)) break; caught = g.events.find(e => e.type === 'eat' && e.kind === 'beetle'); }
  check('...stays put while it digs, and can still be caught', caught && caught.x === 10 && caught.y === 10, JSON.stringify(b));
  // A race you can win: coming straight at it from outside BEETLE_DIG_FEAR, the dig starts as your head comes within it,
  // and you get there on the dig's last tick. (Dug in for 5 ticks from a head within 7, nobody coming at one ever
  // caught it: 0 of 65 digs started 7 cells off, in AI rounds, though the lesson said "Grab it before it's gone!")
  const race = board([[line(5, 12, 4), 'right'], [line(20, 22, 4), 'right']], { time: 30000 });
  race.burrows = [];
  race.unders = away();
  const [rb] = lay(race, { x: 5 + T.BEETLE_DIG_FEAR + 1, y: 12, kind: 'beetle', expires: 9999, dir: D.up, movedAt: race.tick }); // (it's just crawled: it rests a moment)
  let raceDig = null, raceAte = null;
  for (let t = 0; t < 20 && !raceAte && race.food.includes(rb); t++) {
    feed(race); kept(race);
    raceDig ||= race.events.find(e => e.type === 'dig') && { at: race.tick - 1, gap: Math.abs(race.snakes[0].body[0].x - rb.x) + Math.abs(race.snakes[0].body[0].y - rb.y), until: rb.digUntil };
    raceAte = race.events.find(e => e.type === 'eat' && e.kind === 'beetle');
  }
  check(`...a race you can win: coming straight at it from outside BEETLE_DIG_FEAR, you get there ${T.BEETLE_DIG === T.BEETLE_DIG_FEAR ? 'on its last tick' : 'in time'}`, raceDig && raceDig.gap === T.BEETLE_DIG_FEAR && raceAte && raceAte.x === 5 + T.BEETLE_DIG_FEAR + 1 && race.tick - 1 === raceDig.at + T.BEETLE_DIG_FEAR && race.tick - 1 <= raceDig.until,
    JSON.stringify({ dig: raceDig, ate: raceAte && [raceAte.x, raceAte.y, race.tick - 1], DIG: T.BEETLE_DIG, FEAR: T.BEETLE_DIG_FEAR }));
  // Nobody comes for it: when it's done it's underground, a burrow opens where it dug (BURROW_FROM_DIG), and it comes out
  // of a burrow later (another, if there is one).
  const h = board([[line(5, 10, 4), 'right'], [line(20, 22, 4), 'right']], { time: 30000 });
  h.burrows = [{ x: 20, y: 4, at: 0 }];
  h.unders = away();
  lay(h, bug());
  for (const o of h.snakes) o.stunUntil = 1e9;
  const seen = [];
  for (let t = 0; t < T.BEETLE_DIG + T.BEETLE_UNDER_MAX + 4 && !seen.some(e => e.type === 'emerge'); t++) { feed(h); kept(h); for (const e of h.events) if (['dig', 'dive', 'emerge'].includes(e.type)) seen.push({ ...e, at: h.tick - 1, unders: h.unders.length }); } // (up to its coming out: the step after takes it off the board, which lets another come out, and open a burrow, now and then)
  const [d0, d1, d2] = seen;
  const dugBurrow = h.burrows.some(b => b.x === 10 && b.y === 10 && b.dug === 1);
  check(`...done digging, it goes underground (${T.BURROW_FROM_DIG ? 'leaving a burrow where it dug' : 'and makes no burrow'})`, d0?.type === 'dig' && d1?.type === 'dive' && d1.dug === 1 && d1.at === d0.until && d1.unders === 2
    && h.burrows.length === (T.BURROW_FROM_DIG ? 2 : 1) && dugBurrow === !!T.BURROW_FROM_DIG, JSON.stringify({ seen, burrows: h.burrows }));
  check('...and comes out of a burrow a while later', d2?.type === 'emerge' && d2.x === 20 && d2.y === 4 && d2.at - d1.at >= T.BEETLE_UNDER_MIN && d2.unders === 1, JSON.stringify(seen));
  // Not cornered: with a burrow in reach it runs for it and dives in, as before.
  const r = board([[line(7, 10, 4), 'right'], [line(20, 22, 4), 'right']], { time: 30000 });
  r.burrows = [{ x: 12, y: 10, at: 0 }];
  r.unders = away();
  lay(r, { ...bug(), dir: D.right });
  r.snakes[1].stunUntil = 1e9;
  const ran = [];
  for (let t = 0; t < 4; t++) { feed(r); kept(r); for (const e of r.events) if (['dig', 'dive'].includes(e.type)) ran.push(e); }
  check('...but one with a burrow in reach runs for it instead, and dives in', ran.length === 1 && ran[0].type === 'dive' && !ran[0].dug && ran[0].x === 12 && ran[0].y === 10, JSON.stringify(ran));
}

{ // Up to BEETLE_MAX beetles out at once (above ground or under), and they still come out once the woodpecker's here.
  const most = seededWhile(631, () => {
    const g = board([[line(3, 2, 4), 'right'], [line(3, 21, 4), 'right']], { time: 30000 });
    for (const o of g.snakes) o.stunUntil = 1e9;
    let most = 0, two = 0;
    for (let t = 0; t < 3000; t++) {
      feed(g); E.step(g);
      const n = g.food.filter(f => f.kind === 'beetle').length;
      most = Math.max(most, n + g.unders.length);
      if (n === 2) two++;
    }
    return { most, two };
  });
  check(`up to ${T.BEETLE_MAX} beetles out at once, never more`, most.most === T.BEETLE_MAX && most.two > 50, JSON.stringify(most));
  const sd = seededWhile(632, () => {
    const g = board([[line(3, 2, 4), 'right'], [line(3, 21, 4), 'right']], { time: T.SUDDEN_DEATH_MS });
    for (const o of g.snakes) o.stunUntil = 1e9;
    g.burrows = [{ x: 12, y: 12, at: 0 }];
    g.unders = [{ until: 1, expires: 9999, from: -1, gold: false }];
    const seen = { emerge: 0, spawn: 0 };
    for (let t = 0; t < 400; t++) { feed(g); E.step(g); for (const e of g.events) { if (e.type === 'emerge') seen.emerge++; if (e.type === 'spawn' && e.kind === 'beetle') seen.spawn++; } }
    return seen;
  });
  check('...and they still come out once the woodpecker\'s here', sd.emerge >= 1 && sd.spawn >= 1, JSON.stringify(sd));
}

{ // Round six A's experiment, the owner's idea: a dig that leaves a burrow (kept: BURROW_FROM_DIG), and burrows that close
  // over unused (off: BURROW_HEAL_MS 0). Played in a copy of the game with both on.
  let text = fs.readFileSync(path.join(ROOT, 'tuning.js'), 'utf8');
  text = text.replace(/BURROW_FROM_DIG: *\w+,/, 'BURROW_FROM_DIG: true,').replace(/BURROW_HEAL_MS: *\d+,/, 'BURROW_HEAL_MS: 30000,');
  const on = vm.createContext({ window: {}, console, Math });
  vm.runInContext(text, on, { filename: 'tuning.js' });
  for (const f of ['ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), on, { filename: f });
  const E2 = on.window.SnakeEngine, T2 = on.window.TUNING;
  const staged = () => {
    const g = E2.createGame({ humans: [{ name: 'P0' }, { name: 'P1' }], personas: [] });
    g.snakes[0].body = cellsOf(line(5, 10, 4)); g.snakes[1].body = cellsOf(line(20, 22, 4));
    g.time = 30000;
    for (const o of g.snakes) { o.stunUntil = 1e9; o.lastAte = g.time; o.nextStarve = g.time + T2.HUNGER_MS; }
    g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }]; // (no more come out meanwhile)
    return g;
  };
  const g = staged();
  g.burrows = [{ x: 20, y: 2, at: 0, used: 25000 }, { x: 22, y: 4, at: 0, used: 20000 }, { x: 18, y: 2, at: 0, used: 29000 }];
  g.food = [{ x: 10, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 }];
  const seen = [];
  for (let t = 0; t <= T2.BEETLE_DIG; t++) { E2.step(g); g.food = g.food.filter(f => f.kind === 'beetle'); for (const e of g.events) if (['burrow', 'shut', 'heal'].includes(e.type)) seen.push({ ...e, at: e.at && 1 }); }
  check('a dig leaves a burrow, and at the most the one unused longest starts growing shut', JSON.stringify(seen) === JSON.stringify([{ type: 'shut', x: 22, y: 4, at: 1 }, { type: 'burrow', x: 10, y: 10, dug: 1 }])
    && g.burrows.length === T2.BURROW_MAX + 1 && g.burrows.filter(b => !b.shutAt).length === T2.BURROW_MAX && g.burrows.some(b => b.x === 10 && b.y === 10 && b.dug === 1), JSON.stringify(seen));
  const h = staged();
  h.burrows = [{ x: 20, y: 2, at: 0, used: 0 }, { x: 22, y: 4, at: 0, used: 0 }, { x: 18, y: 2, at: 0, used: 25000 }];
  h.food = [{ x: 22, y: 4, kind: 'beetle', expires: 9999, dir: D.up, movedAt: 1e9 }];
  E2.step(h);
  check('(off in the game) a burrow unused for BURROW_HEAL_MS grows shut, but not with a beetle on it', JSON.stringify(h.events.filter(e => e.type === 'shut').map(e => [e.x, e.y])) === JSON.stringify([[20, 2]]) && h.burrows.filter(b => b.shutAt).length === 1, JSON.stringify(h.burrows));
}

{ // Burrows keep apart (the owner: "2 or all 3 of the burrows end up clustered really close"): a dig nearer than
  // BURROW_SPACING to a burrow takes its place, and a beetle coming out cracks a new one open that far from the others.
  const M = Object.create(Math); let a = 7;
  M.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const text = fs.readFileSync(path.join(ROOT, 'tuning.js'), 'utf8');
  const play = changes => {
    const c = vm.createContext({ window: {}, console, Math: M });
    vm.runInContext(Object.entries(changes).reduce((s, [k, v]) => s.replace(new RegExp(`${k}: *[\\w.]+,`), `${k}: ${v},`), text), c, { filename: 'tuning.js' });
    for (const f of ['ai.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), c, { filename: f });
    return [c.window.SnakeEngine, c.window.TUNING];
  };
  const [E3, T3] = play({});
  const staged = () => {
    const g = E3.createGame({ humans: [{ name: 'P0' }, { name: 'P1' }], personas: [] });
    g.snakes[0].body = cellsOf(line(5, 10, 4)); g.snakes[1].body = cellsOf(line(20, 22, 4));
    g.time = 30000;
    for (const o of g.snakes) { o.stunUntil = 1e9; o.lastAte = g.time; o.nextStarve = g.time + T3.HUNGER_MS; }
    g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }];
    return g;
  };
  const g = staged();
  g.burrows = [{ x: 17, y: 12, at: 0, used: 29000 }, { x: 22, y: 4, at: 0, used: 20000 }, { x: 2, y: 2, at: 0, used: 29500 }]; // (9 from the beetle: past the 7 it runs for a burrow, so it digs in; inside BURROW_SPACING)
  g.food = [{ x: 10, y: 10, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 }];
  const seen = [];
  for (let t = 0; t <= T3.BEETLE_DIG; t++) { E3.step(g); g.food = g.food.filter(f => f.kind === 'beetle'); for (const e of g.events) if (['burrow', 'shut', 'heal'].includes(e.type)) seen.push({ ...e, at: e.at && 1 }); }
  check('a dig nearer than BURROW_SPACING to a burrow takes its place (that one grows shut, not the one unused longest)', T3.BURROW_SPACING > T3.BEETLE_HOME_REACH
    && JSON.stringify(seen) === JSON.stringify([{ type: 'shut', x: 17, y: 12, at: 1 }, { type: 'burrow', x: 10, y: 10, dug: 1 }])
    && g.burrows.filter(b => !b.shutAt).length === 3 && g.burrows.some(b => b.x === 22 && b.y === 4 && !b.shutAt), JSON.stringify(seen));
  // A beetle coming out, again and again (a new burrow each time, at the most three): each new one opens BURROW_SPACING
  // or more from every other, on a log with room for that.
  const [E4, T4] = play({ BEETLE_CHANCE: 1, BURROW_NEW_CHANCE: 1, BEETLE_FIRST_MS: 0 });
  let near = 99, opened = 0;
  for (let round = 0; round < 12; round++) {
    const h = E4.createGame({ humans: [{ name: 'P0' }, { name: 'P1' }], personas: [] });
    h.snakes[0].body = cellsOf(line(5, 20, 4)); h.snakes[1].body = cellsOf(line(20, 3, 4));
    h.time = 30000;
    for (const o of h.snakes) { o.stunUntil = 1e9; o.lastAte = h.time; o.nextStarve = h.time + T4.HUNGER_MS; }
    for (let t = 0; t < 40; t++) {
      h.food = []; h.unders = []; // (room for the next beetle to come out, every tick)
      E4.step(h);
      for (const e of h.events) if (e.type === 'burrow') { opened++; for (const b of h.burrows) if (b.x !== e.x || b.y !== e.y) near = Math.min(near, Math.abs(b.x - e.x) + Math.abs(b.y - e.y)); }
    }
  }
  check('a new burrow cracks open at least BURROW_SPACING from the others, where there is room', opened >= 24 && near >= T4.BURROW_SPACING, `${opened} opened, the nearest ${near}`);
}

{ // Burrows grow shut, not instantly (the owner's playtest): at BURROW_MAX open, a new one starts the stalest growing shut
  // over BURROW_SHUT_MIN_MS to BURROW_SHUT_MAX_MS; meanwhile a scared beetle still dives into it, but none comes out of it,
  // and once its time is up it closes over. The rivals read it by the same rule: a beetle bound for one growing shut
  // still goes in.
  const staged = () => {
    const g = board([[line(5, 20, 4), 'right'], [line(20, 22, 4), 'right']]);
    for (const o of g.snakes) { o.stunUntil = 1e9; o.lastAte = g.time; o.nextStarve = g.time + 1e9; }
    g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }];
    return g;
  };
  const times = [];
  for (let i = 0; i < 40; i++) {
    const g = staged(); g.time = 30000;
    g.burrows = [{ x: 3, y: 3, at: 0, used: 20000 }, { x: 15, y: 3, at: 0, used: 25000 }, { x: 3, y: 15, at: 0, used: 26000 }];
    g.food = [{ x: 15, y: 15, kind: 'beetle', expires: 9999, dir: D.up, movedAt: -10 }];
    g.snakes[0].body = [{ x: 15, y: 20 }, { x: 15, y: 21 }, { x: 15, y: 22 }, { x: 15, y: 23 }]; g.snakes[0].dir = D.up; // (5 below it, held still: it digs in, no burrow in its reach)
    for (let t = 0; t <= T.BEETLE_DIG && !g.burrows.some(b => b.shutAt); t++) E.step(g);
    const shut = g.burrows.find(b => b.shutAt);
    if (shut) times.push([shut.x, shut.y, shut.shutAt - shut.shutFrom, g.burrows.length]);
  }
  check('at BURROW_MAX open, a new burrow starts the stalest growing shut, over 6 to 14 s, and it stays there meanwhile',
    times.length === 40 && times.every(([x, y, ms, n]) => x === 3 && y === 3 && ms >= T.BURROW_SHUT_MIN_MS && ms <= T.BURROW_SHUT_MAX_MS && n === T.BURROW_MAX + 1)
    && Math.max(...times.map(t => t[2])) - Math.min(...times.map(t => t[2])) > 2000, JSON.stringify(times.slice(0, 5)));
  // None comes out of one growing shut: with it the only burrow, a beetle due up stays under; with an open one too, it comes out there.
  const g = staged(); g.time = 30000;
  g.burrows = [{ x: 3, y: 3, at: 0, used: 0, shutFrom: 29000, shutAt: 39000 }];
  g.unders = [{ until: 0, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }]; // (and one that stays under: no more come out meanwhile)
  for (let t = 0; t < 5; t++) E.step(g);
  const stayed = g.unders.length === 2 && !g.food.some(f => f.kind === 'beetle');
  g.burrows.push({ x: 14, y: 3, at: 0, used: 0 });
  E.step(g);
  const out = g.food.find(f => f.kind === 'beetle');
  check('none comes out of a burrow growing shut: a beetle due up stays under, and comes out of an open one', stayed && out && out.x === 14 && out.y === 3 && g.unders.length === 1, JSON.stringify({ stayed, out }));
  // A scared beetle still dives into one growing shut.
  const d = staged(); d.time = 30000;
  d.burrows = [{ x: 12, y: 10, at: 0, used: 0, shutFrom: 29000, shutAt: 39000 }];
  d.snakes[0].body = cellsOf(line(6, 10, 4)); d.snakes[0].dir = D.right;
  d.food = [{ x: 10, y: 10, kind: 'beetle', expires: 9999, dir: D.right, movedAt: -10 }];
  let dove = null;
  for (let t = 0; t < 12 && !dove; t++) { E.step(d); dove = d.events.find(e => e.type === 'dive') || null; }
  check('a scared beetle still dives into a burrow growing shut', dove && dove.x === 12 && dove.y === 10 && !dove.dug && d.unders.length === 3, JSON.stringify({ dove, food: d.food }));
  // Its time up, it closes over.
  const c = staged(); c.time = 38950;
  c.burrows = [{ x: 3, y: 3, at: 0, used: 0, shutFrom: 29000, shutAt: 39000 }, { x: 14, y: 3, at: 0, used: 0 }];
  const healed = [];
  for (let t = 0; t < 3; t++) { E.step(c); healed.push(...c.events.filter(e => e.type === 'heal')); }
  check('...and once its time is up, it closes over', JSON.stringify(healed) === JSON.stringify([{ type: 'heal', x: 3, y: 3 }]) && c.burrows.length === 1, JSON.stringify(c.burrows));
  // The rivals: a beetle bound for a burrow growing shut still goes in (not worth the chase), all but shut too.
  const view = burrows => () => aiView({ me: aiMe(line(10, 12, 5), 'right'), others: [aiRival(1, line(20, 2, 5), 'right')], tick: 10, timeMs: 30000, burrows,
    food: [{ x: 13, y: 12, kind: 'beetle', expires: 999, dir: D.right, movedAt: 0, px: 12, py: 12, scared: true }, { x: 10, y: 8, kind: 'food', expires: 999 }] });
  const shutting = picks(view([{ x: 15, y: 12, at: 0, shutFrom: 25000, shutAt: 36000 }]), 'drab', 20), allBut = picks(view([{ x: 15, y: 12, at: 0, shutFrom: 25000, shutAt: 30500 }]), 'drab', 20);
  check("an AI reads a beetle bound for a burrow growing shut as going in, as it does, all but shut too (it can dive in till it closes)", shutting.up === 20 && allBut.up === 20, JSON.stringify({ shutting, allBut }));
}

{ // Everyone sees every burrow on the board, as it is.
  const g = board([[line(5, 10, 4), 'right'], [line(20, 22, 4), 'right']]);
  g.burrows = [{ x: 3, y: 3, at: 0 }];
  E.step(g);
  check('an AI sees the burrows as they are', E.aiView(g, g.snakes[1]).burrows === g.burrows && E.createGame().unders.length === 0);
}

{ // Nothing grows on a burrow, beads included: a snake out across one leaves no bead on it, and neither does a tail a crash
  // knocks off (the beads elsewhere fall as ever).
  const g = board([[line(23, 5, 3), 'right'], [line(23, 15, 8), 'right'], [line(5, 20, 4), 'right']]);
  g.burrows = [{ x: 21, y: 5, at: 0, used: 0 }, { x: 16, y: 15, at: 0, used: 0 }];
  g.unders = [{ until: 1e9, expires: 1e9, from: -1, gold: false }, { until: 1e9, expires: 1e9, from: -1, gold: false }];
  feed(g);
  const dying = E.step(g), beads = g.food.filter(f => f.kind === 'pellet').map(f => [f.x, f.y]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const on = (x, y) => beads.some(([bx, by]) => bx === x && by === y);
  check('beads never fall on a burrow: a snake out across one, a tail a crash knocks off across another',
    dying.length === 1 && dying[0] === g.snakes[0] && !on(21, 5) && on(23, 5) && on(22, 5) && !on(16, 15) && on(17, 15) && on(18, 15) && g.snakes[1].alive,
    JSON.stringify({ beads, out: dying.map(s => s.id) }));
}
