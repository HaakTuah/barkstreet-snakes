// ---------------------------------------------------------------- the rivals never know who is a person
// ("The computer players never know who is a person", core/modules/game-design.md: nothing in a rival's logic nor in what
// it is shown says whether another player is a person, and its timing gives none away.)
// (1) By reading: no code in ai/ reads a person flag, aiView() reads none, and the engine hands a rival nothing but its
// view, its own brain and its memory. (2) By playing: the same board twice, a seat first a rival's, then a person's, with
// the same randomness and the same moves; every rival is shown the same view, picks the same move and decides on the same
// ticks. The seat in question has its powers kept empty, so that its moves alone can be played back into the person.
{
  const gameFiles = require('./game-files.js'), isAI = gameFiles.ai;
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); // (code only: the comments speak of people freely)
  const code = f => strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const PERSON = /\b(isPlayer|autopilot|withPlayer|humans?|isHuman|isPerson|personaKey|people)\b/;

  // ---- by reading
  const aiFiles = GAME.filter(isAI), engineFiles = GAME.filter(gameFiles.engine);
  const reads = aiFiles.filter(f => PERSON.test(code(f)) || /\b(?!(?:f|p)\.)\w+\.owner\b/.test(code(f))); // (a pellet's or a portal's owner, f.owner and p.owner, is a snake's id: never a person's)
  check('31: no code in ai/ reads a person flag', aiFiles.length > 20 && reads.length === 0, reads.join(', '));
  // (view.js is all about what a snake sees; only who thinks ahead, and with whose brain, is about the snake itself, and
  // foodSeen is what takes a dropped tail's colour out)
  const seen = code('engine/view.js').split('\n').filter(l => !/^const (canThinkAhead|brainOf|foodSeen) = /.test(l)).join('\n');
  check('31: aiView() and what it works out read no person flag, name, colour, seat, queue or owner',
    /function aiView\(/.test(seen) && !PERSON.test(seen) && !/\b(owner|name|color|seat|queue)\b/.test(seen), (seen.match(/.*\b(isPlayer|autopilot|owner|name|color|seat|queue)\b.*/) || [''])[0].trim());
  const handed = /\baiDecide\(aiView\(game, s\), brainOf\(s\), s\.memory\)/g, anyCall = /\baiDecide\(/g;
  const handedN = engineFiles.reduce((n, f) => n + (code(f).match(handed) || []).length, 0), callsN = engineFiles.reduce((n, f) => n + (code(f).match(anyCall) || []).length, 0);
  check('31: the engine hands every decision nothing but aiView(), the snake\'s own brain and its memory', handedN >= 3 && handedN === callsN, `${handedN} of ${callsN} calls`);

  // ---- by playing
  const decisionRng = (tick, id) => seeded((Math.imul(tick + 1, 0x9e3779b1) ^ Math.imul(id + 1, 0x85ebca6b)) >>> 0); // (each decision draws from a stream of its own, so who else decides shifts no one's)
  const { isSet, isMap } = require('util').types; // (the game's collections are another context's: `instanceof Set` is false for them)
  const replacer = (k, v) => isSet(v) || isMap(v) ? [...v] : v;
  const diffAt = (a, b, at = '') => {
    if (a === b) return '';
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return at || '(whole)';
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = diffAt(a[k], b[k], `${at}.${k}`); if (d) return d; }
    return '';
  };
  // One round in a context of its own: `persons` people first (ids 0 up, as in a game), then the rival keys. The first `seats`
  // seats are quiet (no powers); `feed`, by tick, gives the person seats the moves a rival of the same seat made (names).
  function play({ persons, seats, keys, feed = {}, time, snow, ticks }) {
    const M = Object.create(Math), c = vm.createContext({ window: {}, console, Math: M }), log = [];
    const run = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), c, { filename: f });
    M.random = seeded(7);
    GAME.filter(f => f === 'tuning.js' || isAI(f)).forEach(run);
    const decide = c.window.SnakeAI.decide;
    c.window.SnakeAI.decide = (view, persona, memory) => { // (read by the engine as it loads: every decision, logged as it was shown and chose)
      const world = M.random, shown = JSON.stringify(view, replacer);
      M.random = decisionRng(view.tick, view.me.id);
      try {
        const d = decide(view, persona, memory);
        log.push({ tick: view.tick, id: view.me.id, view: shown, dir: Object.keys(c.window.SnakeAI.DIRS).find(k => c.window.SnakeAI.DIRS[k] === d), memory: JSON.stringify(memory, replacer) });
        return d;
      } finally { M.random = world; }
    };
    GAME.filter(f => !(f === 'tuning.js' || isAI(f))).forEach(run);
    const { SnakeEngine: En, TUNING: Tu } = c.window;
    const g = En.createGame({ humans: persons ? Array.from({ length: persons }, (_, i) => ({ name: `Pat${i}` })) : null, withPlayer: persons > 0, personas: keys, season: 'normal', acts: ACTS });
    g.time = time;
    g.weather = { kind: snow ? 'snow' : 'clear', since: 0, until: 1e9, nextGust: 0, nextStrike: 0 };
    for (const s of g.snakes) { s.lastAte = g.time; s.nextStarve = g.time + Tu.HUNGER_MS; }
    g.snakes.slice(0, persons).forEach((s, i) => { s.owner = `peer-${i}`; }); // (a friend online: the id of the one who sits there)
    const where = [];
    for (let t = 0; t < ticks && g.snakes.filter(s => s.alive).length > 1; t++) {
      for (const s of g.snakes.slice(0, seats)) { s.leaps = s.dashes = s.bank = 0; s.restedAt = 1e12; if (s.isPlayer && feed[t]?.[s.id]) s.queue.push(En.DIRS[feed[t][s.id]]); }
      En.step(g);
      where.push(JSON.stringify(g.snakes.slice(0, seats).map(s => [s.alive, s.body])));
    }
    return { log, where };
  }
  // The same board both ways: the `lead` seats a rival's each, then a person's; `rivals` beside them in both.
  function swapped({ lead, rivals, time, snow }) {
    const seats = lead.length, ticks = 90;
    const asRivals = play({ persons: 0, seats, keys: [...lead, ...rivals], time, snow, ticks });
    const feed = {};
    for (const e of asRivals.log) if (e.id < seats) (feed[e.tick] ||= [])[e.id] = e.dir;
    const asPersons = play({ persons: seats, seats, keys: rivals, feed, time, snow, ticks });
    const a = asRivals.log.filter(e => e.id >= seats), b = asPersons.log.filter(e => e.id >= seats);
    let bad = a.length === b.length ? '' : `${a.length} decisions beside rivals, ${b.length} beside people`;
    for (let i = 0; !bad && i < a.length; i++) {
      for (const k of ['tick', 'id', 'dir', 'view', 'memory']) {
        if (a[i][k] === b[i][k]) continue;
        bad = `tick ${a[i].tick}, snake ${a[i].id}'s ${k}: ${k === 'view' || k === 'memory' ? `differs at ${diffAt(JSON.parse(a[i][k]), JSON.parse(b[i][k]))}` : `${a[i][k]} against ${b[i][k]}`}`;
        break;
      }
    }
    if (!bad && JSON.stringify(asRivals.where) !== JSON.stringify(asPersons.where)) bad = 'the seats did not play the rivals\' moves';
    if (!bad && a.length < ticks) bad = `only ${a.length} decisions`;
    return { bad, shown: a.map(e => JSON.parse(e.view)), who: a.map(e => e.id - seats) };
  }

  const keys = Object.keys(AI.PERSONAS), observed = new Set(), hungerRates = new Set(), fields = new Set();
  let decisions = 0, tails = 0, coloured = 0, sets = 0;
  const note = (r, rivals, seats) => r.shown.forEach((v, i) => {
    observed.add(rivals[r.who[i]]); hungerRates.add(v.hungerRate); Object.keys(v).concat(Object.keys(v.me)).forEach(k => fields.add(k)); decisions++;
    if (v.holes.length || v.fire.length || v.pecks.length || v.zone.length) sets++;
    for (const f of v.food) { if (f.kind === 'pellet' && f.owner < seats) tails++; if ('color' in f) coloured++; } // (a tail the seat dropped, as a rival sees it)
  });
  for (let n = 0; n * 3 < keys.length; n++) { // (every rival of the cast looks on, three at a time, beside a seat that is a rival's, then a person's)
    const rivals = keys.slice(n * 3, n * 3 + 3), lead = [keys[(n * 3 + 3) % keys.length]], snow = n % 2 === 1;
    const r = swapped({ lead, rivals, time: [0, 0, 99000, 0, 0, 68000][n] ?? 0, snow });
    note(r, rivals, 1);
    check(`31: ${lead[0]}'s seat a rival's, then a person's: ${rivals.join(', ')} are shown the same, choose the same, decide on the same ticks${snow ? ' (in snow)' : ''}`, !r.bad, r.bad);
  }
  { // ...with two seats of people, as friends online sit (ids 0 and 1)
    const rivals = ['sniper', 'ghost'], r = swapped({ lead: ['drab', 'star'], rivals, time: 0, snow: true });
    note(r, rivals, 2);
    check('31: two seats a rival\'s, then people\'s: the other two are shown the same, choose the same, decide on the same ticks', !r.bad, r.bad);
  }
  check('31: ...the sets of cells a rival is shown (holes, fire, pecks, zone) were among what was compared, not left out as empty', sets > 0, `${sets} views with a hole, a mark or fire`);
  check('31: ...a tail dropped by the seat was among what was shown, as the pellet it is, with no colour of its own (a person chooses theirs)', tails > 0 && coloured === 0, `${tails} tails seen, ${coloured} with a colour`);
  check('31: ...all of the cast looked on, and the fields added lately (hunger rate, stamina, shield) were among what was compared',
    keys.every(k => observed.has(k)) && hungerRates.has(1) && hungerRates.has(T.SNOW_HUNGER) && ['hungerRate', 'hungerLeft', 'starveIn', 'stamina', 'shield'].every(k => fields.has(k)),
    `${observed.size} of ${keys.length} rivals, ${decisions} decisions, hunger rates ${[...hungerRates]}`);
}
