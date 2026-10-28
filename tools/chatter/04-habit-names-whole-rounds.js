// The power habit at its worst: Star flashing the tick after its rest is over
// (as its AI does) and jumping every 4 s for three minutes, with you, Wildcard
// and Mason by it (all still), and the chatter's own chances: how often it
// shows off, and is answered (and never says its flash is back: it isn't, for long).
{
  rng = seeded(7);
  const g = stage(['star', 'wildcard', 'mason'], { 0: [3, 22], 1: [12, 12], 2: [20, 4], 3: [4, 4] }), [, star] = g.snakes;
  const shows = new Set(['zoom', 'leap', 'dash', 'ready', 'flash.first', 'flash.past'].flatMap(k => k.split('.').reduce((o, p) => o[p], STAR)));
  const answers = new Set([...VOICES.wildcard.showoff, ...VOICES.mason.showoff].map(l => l.replaceAll('{who}', star.name)));
  const ready = new Set(STAR.ready);
  let showed = [], answered = 0, said = 0, readied = 0;
  for (let t = 0; t < 1800; t++) {
    g.tick++; g.time += 100;
    const events = [];
    if (g.time >= star.flashReadyAt + 100) { star.flashReadyAt = g.time + T.FLASH_COOLDOWN_MS; events.push({ type: 'dash', snake: star, x: 10, y: 12, n: 2, plain: 1 }); }
    if (t % 40 === 20) events.push({ type: 'leap', snake: star, x: 12, y: 12, gold: 0, reach: 2 });
    g.events = events; heard = [];
    C.update();
    for (const x of heard) {
      if (x.s === star) { said++; if (shows.has(x.text)) showed.push(g.time); if (ready.has(x.text)) readied++; }
      if (answers.has(x.text)) answered++;
    }
  }
  const gaps = showed.slice(1).map((t, i) => t - showed[i]);
  check(Math.min(...gaps) >= 10000, `showing off at its worst: never twice within 10 s (closest ${Math.min(...gaps) / 1000} s)`);
  check(showed.length >= 6 && showed.length <= 18, `...but often: ${showed.length} times in 3 minutes (every ${(180 / showed.length).toFixed(1)} s on average), ${said} lines in all`);
  check(answered >= 1 && answered <= 5, `...answered ${answered} times`);
  check(readied === 0, `...and its flash back, a tick before it flashes again: no ready line (${readied})`);
  console.log(`ok   Star at its most addicted (a flash every 6 s, a jump every 4): shows off ${showed.length} times in 3 minutes, never within 10 s (closest ${Math.min(...gaps) / 1000} s); ${said} lines in all; answered ${answered} times`);
}

// The names in the log: a colour too dark for the log's wood is lightened
// just enough to read (LOG_CONTRAST against LOG_WOOD, read from the chatter),
// keeping its hue and saturation, so every name keeps its snake's colour:
// Copycat's is the flag's red, not the pink that mixing it toward white made
// (as vivid as the old pink, #fca5a5, was pale: OKLCH chroma), and the
// cast's reds stay apart. One that reads already is left as it is.
{
  const [wood, need] = [JSON.parse(/\bLOG_WOOD = (\[[\d, ]+\])/.exec(src)[1]), +/\bLOG_CONTRAST = ([\d.]+)/.exec(src)[1]];
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const rgbOf = css => css.startsWith('#') ? [1, 3, 5].map(i => parseInt(css.slice(i, i + 2), 16)) : css.match(/\d+/g).map(Number);
  const hsl = c => { const [r, g, b] = c.map(v => v / 255), hi = Math.max(r, g, b), lo = Math.min(r, g, b), d = hi - lo; return [!d ? 0 : 60 * (hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4), !d ? 0 : d / (1 - Math.abs(hi + lo - 1))]; };
  const chroma = c => { const [r, g, b] = c.map(lin), l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); return Math.hypot(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s); };
  const g = stage(['copycat']);
  const named = (name, color, persona) => { C.replay({ id: 90, name, color, persona, alive: false, body: [] }, 'Hm.'); return logEl.children[0].children[0].style.color; };
  const shown = {};
  for (const p of Object.values(E.PERSONAS)) {
    const own = p.ink || p.color, out = named(p.name, p.color, p), [o, n] = [rgbOf(own), rgbOf(out)];
    shown[p.name] = n;
    check(contrast(n, wood) >= need - 0.05, `${p.name}'s name in the log reads on the wood: ${out} (${contrast(n, wood).toFixed(2)}:1, at least ${need})`);
    if (contrast(o, wood) >= need) check(out === own, `${p.name}'s ${own} reads there already: left as it is (${out})`);
    else {
      const [[h0, s0], [h1, s1]] = [hsl(o), hsl(n)];
      check(Math.abs(((h1 - h0 + 540) % 360) - 180) < 3 && Math.abs(s1 - s0) < 0.06, `${p.name}'s ${own}, lightened to ${out}, keeps its hue (${h0.toFixed(0)}° -> ${h1.toFixed(0)}°) and saturation (${s0.toFixed(2)} -> ${s1.toFixed(2)})`);
    }
  }
  check(named('Green', E.PLAYER_COLOR, null) === E.PLAYER_COLOR, `your green reads on the wood as it is (${E.PLAYER_COLOR})`);
  const friends = JSON.parse(/\bHUMAN_COLORS = (\[[^\]]+\])/.exec(fs.readFileSync(path.join(ROOT, 'online.js'), 'utf8'))[1].replaceAll("'", '"'));
  for (const c of friends) check(named('Friend', c, null) === c, `a friend's ${c} online reads on the wood as it is`);
  const cat = shown.Copycat, pink = rgbOf('#fca5a5');
  check(chroma(cat) > 1.4 * chroma(pink), `Copycat's name is the flag's red, not pink: rgb(${cat}), OKLCH chroma ${chroma(cat).toFixed(3)} (the old pink ${chroma(pink).toFixed(3)})`);
  for (const other of ['Sniper', 'Colonist', 'Wildcard']) check(Math.hypot(...cat.map((v, i) => v - shown[other][i])) > 20, `...and apart from ${other}'s rgb(${shown[other]}) in the log`);
  void g;
  console.log(`ok   names in the log read on its wood (${need}:1), keeping their colours' hue and saturation: Copycat rgb(${cat}), the flag's red; Sniper rgb(${shown.Sniper}), Colonist rgb(${shown.Colonist}), Wildcard rgb(${shown.Wildcard})`);
}

// Whole rounds of rivals with the chatter listening: nothing throws, and it talks.
// (These two, with what's staged above, run every line of chatter/ that six
// rounds did, four of them with rivals at random.)
{
  let total = 0, rounds = 0;
  const per = {};
  // (Chokes and what coughs knocked aside, beetles that dug in and got away, and food the woodpecker knocked aside, as the engine has them, and the lines for them.)
  const chokeLines = new Set(Object.values(VOICES).flatMap(v => v.choke || []));
  const esc = s => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  const thanks = Object.values(VOICES).flatMap(v => v.windfall || []).map(l => new RegExp(`^${l.split('{who}').map(esc).join('.+')}$`));
  const dugLines = new Set(Object.values(VOICES).flatMap(v => v.dug || []));
  const grumbles = Object.values(VOICES).flatMap(v => v.knocked || []).map(l => new RegExp(`^${l.split('{who}').map(esc).join('.+')}$`));
  let chokes = 0, knocked = 0, choked = 0, thanked = 0, dugOut = 0, dug = 0, knocks = 0, grumbled = 0;
  // The woodpecker's knocked food, by the rule (see "Knocked aside" above),
  // as the engine has it: a grumble is only ever the rule's, from whoever was
  // after a piece eaten this tick, at its eater; and every piece eaten where
  // it landed, with a rival after it that's free to speak (no line in its
  // gap or this tick, no grumble within the rests, a line of its own left to
  // say), draws that rival's grumble.
  const [KMS, KREST, GAP, LREST, ROAM] = ['KNOCKED_MS', 'KNOCKED_REST', 'SNAKE_GAP', 'LINE_REST', 'BEETLE_ROAM'].map(k => +new RegExp(`\\b${k} = (\\d+)`).exec(src)[1]);
  const grumbleLines = Object.values(VOICES).flatMap(v => v.knocked || []).map(l => [l, new RegExp(`^${l.split('{who}').map(esc).join('.+')}$`)]);
  const isGrumble = text => grumbleLines.find(([, re]) => re.test(text))?.[0];
  const knockWatch = { picks: 0, free: 0, said: 0, missed: [], stray: [] };
  const watchKnocks = () => {
    const open = [], spoke = {}, grumbledAt = {}, told = new Set();
    return (g, heardNow) => {
      const now = g.time;
      while (open.length && now - open[0].at > KMS) open.shift();
      for (const e of g.events) if (e.type === 'knock' && e.tx != null && e.kind !== 'mushroom') {
        const bead = e.kind === 'pellet' ? g.food.find(f => f.x === e.tx && f.y === e.ty && f.kind === 'pellet')?.owner : undefined;
        const near = g.snakes.filter(o => o.alive && o.id !== bead).map(o => [o, Math.abs(o.body[0].x - e.x) + Math.abs(o.body[0].y - e.y)]).filter(([, k]) => k <= KNOCKED_NEAR).sort((a, b) => a[1] - b[1]).map(([o]) => o);
        open.push({ x: e.tx, y: e.ty, beetle: e.kind === 'beetle', near, at: now });
      }
      const due = [];
      for (const e of g.events) if (e.type === 'eat') {
        const i = open.findIndex(r => r.beetle ? e.kind === 'beetle' && Math.abs(r.x - e.x) + Math.abs(r.y - e.y) <= ROAM : r.x === e.x && r.y === e.y);
        if (i < 0) continue;
        const pick = open.splice(i, 1)[0].near.find(o => o !== e.snake);
        if (pick?.persona && pick.alive) due.push([pick, e.snake]);
      }
      const grumbles = heardNow.filter(x => isGrumble(x.text));
      for (const x of grumbles) if (!due.some(([p, eater]) => p === x.s && x.text.includes(eater.name))) knockWatch.stray.push(`${x.s.name}: "${x.text}" at ${(now / 1000).toFixed(1)} s`);
      for (const [p, eater] of due) {
        knockWatch.picks++;
        const said = grumbles.find(x => x.s === p && x.text.includes(eater.name));
        const own = (VOICES[p.personaKey].knocked || []).filter(l => !(PUNCHLINES.includes(l) && told.has(l)));
        const free = !said ? !(now - (spoke[p.id] ?? -Infinity) < GAP) && !heardNow.some(x => x.s === p) && !(now - (grumbledAt[p.id] ?? -Infinity) < Math.max(KREST, LREST)) && own.length && !(p.personaKey === 'capricious' && p.memory.mood) : true;
        if (free) knockWatch.free++;
        if (said) { knockWatch.said++; grumbledAt[p.id] = now; spoke[p.id] = now; } else if (free) knockWatch.missed.push(`${p.name}, after a piece ${eater.name} ate at ${(now / 1000).toFixed(1)} s`);
      }
      for (const x of heardNow) { spoke[x.s.id] = now; const l = isGrumble(x.text); if (l) told.add(l); }
    };
  };
  for (let r = 0; r < 1; r++) {
    rng = seeded(31 + r * 7919);
    const g = E.createGame({ withPlayer: false, personas: ['sovereign', 'colonist', 'vulture', 'capricious'] });
    C.reset(g);
    const knocking = watchKnocks();
    while (g.snakes.filter(s => s.alive).length > 1 && g.time < 400000) {
      E.step(g);
      heard = [];
      C.update();
      knocking(g, heard);
      total += heard.length;
      for (const x of heard) per[x.s.personaKey] = (per[x.s.personaKey] || 0) + 1;
      for (const e of g.events) { if (e.type === 'choke') chokes++; if (e.type === 'choke' || e.type === 'nudge') knocked++; if (e.type === 'dive' && e.dug) dugOut++; if (e.type === 'knock') knocks++; }
      for (const x of heard) { if (chokeLines.has(x.text)) choked++; if (thanks.some(t => t.test(x.text))) thanked++; if (dugLines.has(x.text)) dug++; if (grumbles.some(t => t.test(x.text))) grumbled++; }
    }
    rounds++;
  }
  check(total > 20 * rounds, `whole rounds: the rivals talk (${total} lines in ${rounds} rounds)`);
  check(choked <= chokes && thanked <= knocked, `...a choke line only for a choke (${choked} of ${chokes}), thanks only for food knocked aside (${thanked} for ${knocked} pieces)`);
  check(dug <= dugOut && grumbled <= knocks, `...a dug line only for a beetle that dug in and got away (${dug} of ${dugOut}), a grumble only for food the woodpecker knocked aside (${grumbled} for ${knocks} pieces)`);
  console.log(`ok   ${rounds} whole AI round${rounds > 1 ? 's' : ''} of Sovereign, Colonist, Vulture and Capricious with the chatter listening: ${total} lines, nothing thrown (${chokes} chokes, ${choked} remarked on; ${knocked} pieces spat or nudged aside, ${thanked} thanks; ${dugOut} beetles dug in and away, ${dug} remarked on; ${knocks} pieces the woodpecker knocked aside, ${grumbled} grumbles)`);
  // ...and one with Star, the rivals who answer it and Copycat (who repeats it in Chinese).
  let star = 0, zh = 0;
  for (let r = 0; r < 1; r++) {
    rng = seeded(97 + r * 7919);
    const g = E.createGame({ withPlayer: false, personas: ['star', 'wildcard', 'mason', 'copycat'] });
    C.reset(g);
    const knocking = watchKnocks();
    while (g.snakes.filter(s => s.alive).length > 1 && g.time < 400000) {
      E.step(g);
      heard = [];
      C.update();
      knocking(g, heard);
      for (const x of heard) { if (x.s.personaKey === 'star') star++; if (x.s.personaKey === 'copycat' && /[一-鿿]/.test(x.text) && !x.text.includes('{')) zh++; }
    }
  }
  check(star > 5, `a whole round with Star: it talks (${star} lines)`);
  console.log(`ok   a whole AI round with Star, Wildcard, Mason and Copycat: Star ${star} lines, Copycat ${zh} in Chinese, nothing thrown`);
  // (--rounds N: N more whole rounds, of four rivals at random, to see the
  // woodpecker's knocked food and the grumbles over many: they're rare, a
  // round or two in ten.)
  const more = process.argv.includes('--rounds') ? Number(process.argv[process.argv.indexOf('--rounds') + 1]) : 0;
  let heardGrumbles = 0, minutes = 0;
  for (let r = 0; r < more; r++) {
    rng = seeded(7 * 100003 + r * 7919);
    const pool = [...keys], cast = [];
    while (cast.length < 4) cast.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    const g = E.createGame({ withPlayer: false, personas: cast });
    C.reset(g);
    const knocking = watchKnocks();
    while (g.snakes.filter(s => s.alive).length > 1 && g.time < 400000) {
      E.step(g);
      heard = [];
      C.update();
      knocking(g, heard);
      heardGrumbles += heard.filter(x => isGrumble(x.text)).length;
    }
    minutes += g.time / 60000;
  }
  if (more) console.log(`ok   ${more} more whole AI rounds of four rivals at random (${(minutes / more).toFixed(1)} min a round): ${heardGrumbles} grumbles at food the woodpecker knocked aside (${(heardGrumbles / more).toFixed(2)} a round)`);
  check(!knockWatch.stray.length, `the whole rounds: a grumble only from whoever was after a piece the woodpecker knocked aside, at its eater (stray: ${knockWatch.stray.join('; ') || 'none'})`);
  check(!knockWatch.missed.length, `...and one for every such piece eaten while that rival was free to speak (${knockWatch.free}; missed: ${knockWatch.missed.join('; ') || 'none'})`);
  console.log(`ok   the whole rounds' knocked food: ${knockWatch.picks} pieces eaten with a rival after them (the nearest to where each lay, the eater aside, within ${KNOCKED_NEAR}), ${knockWatch.free} of those rivals free to speak, ${knockWatch.said} grumbles, none stray`);
}
