// The chatter (see chatter/voices.js): what each moment of a round makes the
// snakes say, and the API: the last file, it makes window.SnakeChatter.

function addLog(s, text) {
  const li = document.createElement('li');
  const who = document.createElement('strong');
  who.textContent = s.name;
  who.style.color = readable(s.persona?.ink || s.color);
  const said = document.createElement('span');
  setWords(said, text);
  li.append(who, ' ', said);
  logEl.prepend(li);
  while (logEl.children.length > LOG_SIZE) logEl.lastChild.remove();
}

// Everyone flashes, often (about ten a round), so a plain flash is worth a
// word only now and then: when it grabbed food from under a rival's nose
// (first), or shot right by a rival's head (past: beside a cell it crossed).
// Star cheers any flash of its own (zoom), as it shows off (see showOff).
function flashed(e) {
  const s = e.snake, was = (seen[s.id] ||= {}), star = showsOff(s);
  if (!star && chatGame.time - (was.flashAt ?? -Infinity) < FLASH_REST) return;
  const near = (x, y, r) => chatGame.snakes.find(o => o !== s && o.alive && Math.abs(o.body[0].x - x) <= r && Math.abs(o.body[0].y - y) <= r);
  const ate = chatGame.events.find(f => f.type === 'eat' && f.snake === s && f.kind !== 'mushroom');
  const beaten = ate && near(ate.x, ate.y, 3);
  let passed = null;
  if (!ate) for (const c of s.body.slice(0, Math.max(1, e.n || 1))) if ((passed = near(c.x, c.y, 1))) break;
  if (star) showOff(s, beaten ? 'flash.first' : passed ? 'flash.past' : 'zoom', beaten || passed);
  else if ((beaten || passed) && Math.random() < 0.4 && chatSay(s, beaten ? 'flash.first' : 'flash.past', beaten || passed, true)) was.flashAt = chatGame.time;
}

// Star, the power addict, cheers its every flash, jump and golden dash, and
// its flash back from its rest: those keep to a rest of their own, or it
// would never stop. (While its flash rests, its small talk grumbles.) It
// talks so much that its own moments (golden power food, a rainbow, a
// kill, a cut) would mostly come while it's still in its gap after the
// last line: those clear it (ownMoment), unless that line was this tick's
// (one line at a time).
const showsOff = s => s.personaKey === 'star';
// (Clearing a snake's gap for news, unless its last line was this tick's.
// Star's own moments do; so do a choke, and a colony or a capital the
// woodpecker took.)
const chatNews = s => { if (s && lastSaid[s.id] < chatGame.time) lastSaid[s.id] = -Infinity; };
const ownMoment = s => { if (s && showsOff(s)) chatNews(s); };
// A line for showing off (key; who: a rival it beat to food or shot past),
// half the time and at most every SHOW_OFF_REST (sure: a golden dash or
// jump, a round has one or two of each, so whenever it can); whether it
// said one. Now and then someone with words for it answers a moment later
// (see update).
function showOff(s, key, who = null, sure = false) {
  const was = (seen[s.id] ||= {});
  if (!sure && (chatGame.time - (was.showAt ?? -Infinity) < SHOW_OFF_REST || !(Math.random() < SHOW_OFF_CHANCE))) return false;
  if (!chatSay(s, key, who, true)) return false;
  was.showAt = chatGame.time;
  const answers = chatGame.snakes.some(o => o !== s && o.alive && VOICES[o.personaKey]?.showoff);
  if (answers && !pendingAnswer && chatGame.time - answeredAt >= ANSWER_REST && Math.random() < ANSWER_CHANCE) pendingAnswer = { at: chatGame.time + ANSWER_AFTER, teller: s };
  return true;
}

// A choking snake spits its bead aside, and a coughing one nudges aside
// any food its head reaches: where each piece went (rolled), for a while.
// A piece someone else eats there was a windfall: a rival who ate it
// thanks the cougher now and then ({who}), cheekily (windfall: whether it
// did). Any eating there (the cougher's own, once its cough is over, or
// yours) settles it.
function knockedAside(e) {
  for (let i = rolled.length - 1; i >= 0; i--) if (rolled[i].x === e.x && rolled[i].y === e.y) rolled.splice(i, 1); // (a piece knocked on again)
  rolled.push({ x: e.tx ?? e.x, y: e.ty ?? e.y, beetle: e.kind === 'beetle', by: e.snake, at: chatGame.time });
}
// (Is what e ate the piece that landed at r? A beetle runs on from there.)
const landed = (r, e) => r.beetle ? e.kind === 'beetle' && Math.abs(r.x - e.x) + Math.abs(r.y - e.y) <= BEETLE_ROAM : r.x === e.x && r.y === e.y;
function windfall(e) {
  const i = rolled.findIndex(r => landed(r, e));
  if (i < 0) return false;
  const { by } = rolled.splice(i, 1)[0], s = e.snake;
  if (by === s || !s.persona) return false;
  const was = (seen[s.id] ||= {});
  if (chatGame.time - (was.windfallAt ?? -Infinity) < WINDFALL_REST || !(Math.random() < WINDFALL_CHANCE)) return false;
  if (!chatSay(s, 'windfall', by, true)) return false;
  was.windfallAt = chatGame.time;
  return true;
}

// A beetle that dug in has gone under (a dive, dug): it got away from the
// snake that cornered it (digs, from its dig), which says so if it's a
// rival. (One caught as it dug is just a catch: no dive.)
function gotAway(e) {
  const i = digs.findIndex(d => d.x === e.x && d.y === e.y);
  if (i < 0) return;
  const s = digs.splice(i, 1)[0].hunter, was = s && (seen[s.id] ||= {});
  if (s?.persona && s.alive && !(chatGame.time - (was.dugAt ?? -Infinity) < DUG_REST) && chatSay(s, 'dug', null, true)) was.dugAt = chatGame.time;
}

// Food the woodpecker knocked aside (knocked), eaten where it landed: the
// snake that was after it, the nearest head at the strike but the
// eater's (near: within KNOCKED_NEAR, nearest first), grumbles at the
// eater, if it's a rival (nobody speaks for you). Any eating there
// settles it.
function served(e) {
  const i = knocked.findIndex(r => landed(r, e));
  if (i < 0) return;
  const s = knocked.splice(i, 1)[0].near.find(o => o !== e.snake), was = s && (seen[s.id] ||= {});
  if (!s?.persona || !s.alive || chatGame.time - (was.knockedAt ?? -Infinity) < KNOCKED_REST) return;
  if (chatSay(s, 'knocked', e.snake, true)) was.knockedAt = chatGame.time;
}

// Called once per tick, after the engine moved everyone.
function update() {
  if (!chatGame || !enabled) return;

  const ais = chatGame.snakes.filter(s => s.persona);
  const alive = ais.filter(s => s.alive);
  const anyone = s => chatPick(chatGame.snakes.filter(o => o !== s && o.alive)) || null;
  const byName = name => chatGame.snakes.find(o => o.name === name);
  const byId = id => chatGame.snakes.find(o => o.id === id);
  // Whose head was nearest food that's just gone (anyone's: you can beat a
  // rival to it), if it was near: that snake was after it.
  const after = (x, y, near = NEAR_FOOD) => {
    let best = null, d = near + 1;
    for (const o of chatGame.snakes) {
      if (!o.alive) continue;
      const k = Math.abs(o.body[0].x - x) + Math.abs(o.body[0].y - y);
      if (k < d) { d = k; best = o; }
    }
    return best;
  };
  // ...and every head within near of it, nearest first (a tie, in the snakes' order, as above).
  const nearest = (x, y, near) => chatGame.snakes.filter(o => o.alive).map(o => [o, Math.abs(o.body[0].x - x) + Math.abs(o.body[0].y - y)])
    .filter(([, k]) => k <= near).sort((a, b) => a[1] - b[1]).map(([o]) => o);

  // Hello, round. One or two snakes speak up in the first seconds.
  if (chatGame.tick === 6 || chatGame.tick === 20) {
    const s = chatPick(alive.filter(a => !lastSaid[a.id]));
    if (s) chatSay(s, 'start', anyone(s));
  }

  // (Where this tick's spat and nudged food went, before anyone's eating is
  // looked at: a head can reach it in the same tick.)
  while (rolled.length && chatGame.time - rolled[0].at > WINDFALL_MS) rolled.shift();
  for (const e of chatGame.events || []) if (e.type === 'choke' || e.type === 'nudge') knockedAside(e);
  // (Likewise beetles digging in, whose hunter is whoever cornered it, and
  // food the woodpecker knocked aside, with the heads that were near it.)
  while (knocked.length && chatGame.time - knocked[0].at > KNOCKED_MS) knocked.shift();
  for (let i = digs.length - 1; i >= 0; i--) if (chatGame.tick > digs[i].until + 10) digs.splice(i, 1); // (caught as it dug: no dive)
  for (const e of chatGame.events || []) {
    if (e.type === 'dig') digs.push({ x: e.x, y: e.y, until: e.until, hunter: after(e.x, e.y, window.TUNING.BEETLE_DIG_FEAR) });
    else if (e.type === 'knock' && e.tx != null && e.kind !== 'mushroom') { // (eaten by the bird, it's gone; nobody misses a mushroom)
      const bead = e.kind === 'pellet' ? chatGame.food.find(f => f.x === e.tx && f.y === e.ty && f.kind === 'pellet')?.owner : undefined;
      const near = nearest(e.x, e.y, KNOCKED_NEAR).filter(o => o.id !== bead); // (its own bead was never its meal)
      if (near.length) knocked.push({ x: e.tx, y: e.ty, beetle: e.kind === 'beetle', near, at: chatGame.time });
    }
  }

  const dashed = []; // (the rivals who made a golden dash: their lines wait for its cuts, below)
  for (const e of chatGame.events || []) {
    if (e.type === 'eat') served(e); // (the snake it was knocked away from has its word first: the eater's own lines follow)
    if (e.type === 'death') {
      const victim = e.snake;
      const killer = byName(victim.killer);
      if (killer?.persona && killer.alive && killer !== victim) {
        ownMoment(killer);
        chatSay(killer, 'kill', victim, true);
      }
      if (victim.persona) {
        lastSaid[victim.id] = -Infinity;
        chatSay(victim, 'dies', killer && killer !== victim ? killer : null, true);
      }
      for (const v of alive) if (v.personaKey === 'vulture' && Math.random() < 0.6) chatSay(v, 'death', victim);
    } else if (e.type === 'eat' && windfall(e)) {
      // (food a choking or coughing snake knocked its way: it's said its thanks)
    } else if (e.type === 'eat' && e.snake.persona && e.kind !== 'goldcap') { // (a golden mushroom has its own lines: below)
      if (e.kind === 'golden') chatSay(e.snake, 'golden', null, true);
      else if ((e.gold || e.kind === 'leaf') && showsOff(e.snake)) {
        // Golden power food, for Star's habit. A leaf's golden flashes it
        // spends there and then (a tick later, mostly: too soon for another
        // word), so it cheers them now; a golden beetle, it crows over.
        ownMoment(e.snake);
        if (e.kind === 'leaf') showOff(e.snake, 'dash', null, true); else chatSay(e.snake, 'stash', null, true);
      } else if (e.kind === 'beetle') chatSay(e.snake, 'caught', null, true);
      else if (e.kind === 'mushroom') chatSay(e.snake, 'mushroom');
      else if (Math.random() < (showsOff(e.snake) ? 0.05 : 0.15)) chatSay(e.snake, 'eat'); // (Star only has eyes for golden things)
    } else if (e.type === 'starving' && e.snake.persona) {
      // (unless it's just said it's desperate: that said it)
      if (!(chatGame.time - (seen[e.snake.id]?.desperateAt ?? -Infinity) < 15000)) chatSay(e.snake, 'hungry', null, true);
    } else if (e.type === 'spawn' && (e.kind === 'golden' || e.kind === 'beetle')) { // (golden apples and beetles; leaves and golden mushrooms have the narrator)
      for (const s of alive) {
        if (e.gold && VOICES[s.personaKey]?.goldbug) { chatSay(s, 'goldbug', null, true); continue; }
        if (s.personaKey === 'gobbler' || (e.kind === 'beetle' && s.personaKey === 'desperado')) chatSay(s, e.kind === 'beetle' ? 'beetle' : 'spawn', null, true);
      }
    } else if (e.type === 'weather' || (e.type === 'strike' && !struck)) {
      const kind = e.type === 'strike' ? 'storm' : e.kind;
      if (e.type === 'strike') struck = true; else struck = false;
      // (A snake on fire keeps its breath for being put out.)
      const wet = kind === 'rain' || kind === 'snow';
      const s = chatPick(alive.filter(a => VOICES[a.personaKey]?.weather?.[kind] && !(wet && a.burnUntil > chatGame.tick)));
      // (The first strike has lines of its own, where a voice has some: as a storm begins, nothing's burning yet.)
      if (s) chatSay(s, e.type === 'strike' && VOICES[s.personaKey].weather.strike ? 'weather.strike' : `weather.${kind}`, null, true);
    } else if (e.type === 'crash' && e.snake.alive) {
      // Whoever crashed says ouch; now and then, whoever they bounced off gloats.
      // (Almost every bump is into a snake, so ouches fit any bump; the edge,
      // where it tried to go off the board, has lines of its own.)
      const other = e.killerId != null && e.killerId !== e.snake.id ? chatGame.snakes[e.killerId] : null;
      const N = window.TUNING.GRID, edge = e.x < 0 || e.y < 0 || e.x >= N || e.y >= N;
      if (e.snake.persona && !(edge && chatSay(e.snake, 'edge'))) chatSay(e.snake, 'bonk');
      if (other?.persona && other.alive && Math.random() < 0.5) chatSay(other, 'gloat', e.snake);
    } else if (e.type === 'leap' && e.snake.persona) {
      if (showsOff(e.snake)) showOff(e.snake, 'leap', null, !!e.gold);
      else if (e.gold || Math.random() < 0.3) chatSay(e.snake, 'leap', null, !!e.gold); // (everyone leaps now: a golden one's worth a word)
    } else if (e.type === 'dash' && e.snake.persona) {
      if (e.plain) flashed(e);
      else dashed.push(e.snake); // (a golden dash: its line comes after the tick's cuts, below)
    } else if (e.type === 'eat' && e.kind === 'goldcap' && e.snake.persona) {
      chatSay(e.snake, 'wrap', null, true);
    } else if (e.type === 'alight' && e.snake.persona) {
      chatSay(e.snake, 'burning', null, true);
    } else if (e.type === 'choke' && e.snake.persona && e.snake.alive) {
      // Its head met its own bead (a crash's, or a cut's): it gags, spits
      // it aside and coughs a moment. It says so, at most every CHOKE_REST,
      // even just after another line: it's news (the crash that broke the
      // bead off has mostly had its say a second or two before, and a
      // choke left to wait out the gap would mostly go unsaid).
      const s = e.snake, was = (seen[s.id] ||= {});
      if (!(chatGame.time - (was.chokeAt ?? -Infinity) < CHOKE_REST)) {
        chatNews(s);
        if (chatSay(s, 'choke', null, true)) was.chokeAt = chatGame.time;
      }
    } else if (e.type === 'cut') {
      // A golden dash cut it (the woodpecker cuts nothing now): the dasher
      // crows, and the one cut has words for whoever it was, you included.
      const dasher = e.by != null ? byId(e.by) : null;
      ownMoment(dasher); ownMoment(e.snake);
      if (dasher?.persona) chatSay(dasher, 'snip', e.snake, true);
      if (e.snake.persona) chatSay(e.snake, 'cut', dasher, true);
    } else if (e.type === 'dive' && e.dug) {
      gotAway(e); // (a beetle that dug in, gone under the bark)
    } else if (e.type === 'peck' && e.under?.length) {
      // The woodpecker pecked under a body, which bridges the hole (only a
      // head falls in). Now and then it says so.
      for (const id of e.under) {
        const s = byId(id), was = s && (seen[s.id] ||= {});
        if (s?.persona && s.alive && !(chatGame.time - (was.underAt ?? -Infinity) < UNDER_REST) && chatSay(s, 'under', null, true)) was.underAt = chatGame.time;
      }
    } else if (e.type === 'baked') {
      const s = chatPick(alive.filter(a => VOICES[a.personaKey]?.baked));
      if (s) chatSay(s, 'baked');
    } else if (e.type === 'ash' && e.kind !== 'mushroom') {
      // Burnt to ash before whoever was nearest got to it (nobody misses a mushroom).
      const s = after(e.x, e.y);
      if (s?.persona) chatSay(s, 'ash');
    } else if (e.type === 'rot') {
      // Rotted (an apple, or a bead) before whoever was nearest got to it.
      // (On its own land, Sovereign or Colonist minds the land instead: below.)
      const s = after(e.x, e.y), was = s && (seen[s.id] ||= {});
      const own = s && landsOf(s.memory)?.some(f => chatOnLand(e.x, e.y, f));
      if (s?.persona && !own && Math.random() < 0.7 && !(chatGame.time - (was.rotAt ?? -Infinity) < ROT_REST) && chatSay(s, 'rot')) was.rotAt = chatGame.time;
    } else if (e.type === 'lastApples') {
      const s = chatPick(alive.filter(a => VOICES[a.personaKey]?.last));
      if (s) chatSay(s, 'last', null, true);
    } else if (e.type === 'rainbow') {
      // (Star's own colours, up in the sky: family, and it says so first)
      const kin = alive.find(showsOff);
      ownMoment(kin);
      if (!(kin && chatSay(kin, 'rainbow', null, true))) {
        const s = chatPick(alive.filter(a => a !== kin && VOICES[a.personaKey]?.rainbow));
        if (s) chatSay(s, 'rainbow', null, true);
      }
    } else if (e.type === 'woodpecker') {
      const s = chatPick(alive);
      if (s) { lastSaid[s.id] = -Infinity; chatSay(s, VOICES[s.personaKey].woodpecker ? 'woodpecker' : 'idle', anyone(s), true); }
    }
  }
  // A golden dash's own line, once the tick's cuts and crashes have had
  // theirs: one that cut someone (a tail off, or in two) has said so with
  // its snip or kill line, which say more; failing those, it says this.
  for (const s of dashed) if (showsOff(s)) showOff(s, 'dash', null, true); else chatSay(s, 'dash', null, true); // (Star spends them on speed too)

  for (const s of alive) {
    const m = s.memory, was = (seen[s.id] ||= {});
    // Sovereign / Colonist spotting an intruder (now and then: not every time one wanders in).
    if (m.victimId != null && m.victimId !== was.victimId && (m.home || m.colonies)
      && !(chatGame.time - (was.calledOutAt ?? -Infinity) < INTRUDER_REST)
      && chatSay(s, 'intruder', chatGame.snakes.find(o => o.id === m.victimId))) was.calledOutAt = chatGame.time;
    if ((m.planted || 0) > (was.planted || 0)) {
      chatSay(s, 'flag');
      // (planted on Sovereign's land: Sovereign has something to say about it)
      const c = m.colonies?.[m.colonies.length - 1];
      const sov = c && alive.find(o => o !== s && o.memory.home && sharesLand(c, o.memory.home));
      if (sov) chatSay(sov, 'realm.invaded', s, true);
    }
    // Sovereign and Colonist: their land on fire, pecked full of holes, or
    // food rotting on it. (A peck on a field's own centre, a colony's flag
    // or the capital, loses the colony or moves the realm: that news has
    // its own line, below, so the peck itself goes without one.)
    const lands = landsOf(m);
    if (lands) {
      const N = window.TUNING.GRID, tag = m.home ? 'realm' : 'colony';
      const inLand = k => lands.some(f => chatOnLand(k % N, Math.floor(k / N), f));
      const flagAt = k => lands.some(f => k === f.y * N + f.x);
      for (const e of chatGame.events) {
        if (e.type === 'peck' && (e.cells || []).some(inLand) && !e.cells.some(flagAt)) chatSay(s, tag + '.pecked', null, true);
        else if (e.type === 'rot' && inLand(e.y * N + e.x) && !(chatGame.time - (was.landRotAt ?? -Infinity) < LAND_ROT_REST) && chatSay(s, tag + '.rotten', null, true)) was.landRotAt = chatGame.time;
      }
      if (chatGame.tick % 10 === 0 && chatGame.fires?.size && chatGame.time - (was.fireAt ?? -1e9) > 12000) {
        for (const [k, f] of chatGame.fires) if (chatGame.tick >= f.from && inLand(k)) { was.fireAt = chatGame.time; chatSay(s, tag + '.burning', null, true); break; }
      }
    }
    // Put out by rain or snow: it was burning, and went out in the wet
    // (the weather cuts a burn short).
    const burning = s.burnUntil > chatGame.tick, wet = chatGame.weather?.kind === 'rain' || chatGame.weather?.kind === 'snow';
    if (was.burning && !burning && wet) chatSay(s, 'doused', null, true);
    was.burning = burning;
    // Starving soon, it drops its errands to take its chances for food (the
    // AI's desperate mode): it says so once a spell, and not again for a
    // while if the spell comes and goes.
    if (!m.desperate) was.desperate = false;
    else if (!was.desperate && !(chatGame.time - (was.desperateAt ?? -Infinity) < DESPERATE_REST) && chatSay(s, 'desperate', null, true)) {
      was.desperate = true;
      was.desperateAt = chatGame.time;
    }
    // Sovereign's realm grew, shrank or moved. A move off a capital the
    // woodpecker pecked out (the old centre's a hole) is news.
    if (m.home && was.realm) {
      const moved = m.home.x !== was.realm.x || m.home.y !== was.realm.y;
      if (moved && holeAt(was.realm.x, was.realm.y)) { chatNews(s); chatSay(s, 'realm.capital', null, true); }
      else if (m.home.radius !== was.realm.radius) chatSay(s, m.home.radius > was.realm.radius ? 'realm.grow' : 'realm.shrink', null, true);
      else if (moved) chatSay(s, 'realm.move');
    }
    was.realm = m.home && { x: m.home.x, y: m.home.y, radius: m.home.radius };
    // Colonist: a colony whose flag cell the woodpecker pecked out is lost
    // (its flag falls in, and it's gone from its memory at once): news.
    // (Planting one too many lets the oldest go: no loss.)
    if (m.colonies || was.colonies) {
      const cols = m.colonies || NONE, before = was.colonies;
      if (!sameColonies(cols, before)) {
        if (before?.some(c => holeAt(c.x, c.y) && !cols.some(k => k.n === c.n && k.x === c.x && k.y === c.y))) { chatNews(s); chatSay(s, 'colony.lost', null, true); }
        was.colonies = cols.map(c => ({ n: c.n, x: c.x, y: c.y }));
      }
    }
    if (m.moodChangedAt != null && m.moodChangedAt !== was.mood && m.mood) chatSay(s, `mood.${m.mood}`, null, true);
    // Star's flash back from its rest: raring to go, once it's been back a
    // moment (if it flashes or jumps by then, it's resting again: no word).
    if (showsOff(s)) {
      const resting = chatGame.time < s.flashReadyAt;
      if (was.resting && !resting) was.readyAt = chatGame.time + READY_AFTER;
      if (resting) was.readyAt = null;
      else if (was.readyAt != null && chatGame.time >= was.readyAt) { was.readyAt = null; showOff(s, 'ready'); }
      was.resting = resting;
    }
    was.victimId = m.victimId;
    was.planted = m.planted || 0;
    was.mood = m.moodChangedAt;
  }

  // Someone answers Mason (see REPLIES): anyone but whoever told it, in
  // their own voice (Copycat's giggle is the same giggle, in Chinese).
  if (pendingReply && chatGame.time >= pendingReply.at) {
    const { reply, teller } = pendingReply;
    pendingReply = null;
    const who = chatPick(alive.filter(o => o !== teller && reply.by(o)));
    if (who) {
      const line = chatPick(VOICES[who.personaKey]?.[reply.own] || reply.lines);
      const text = who.personaKey === 'copycat' ? ZH[line] ?? line : line;
      lastSaid[who.id] = -Infinity;
      speak(who, text, { template: text, who: null, label: '', reply: true });
      // (and the teller carries on: Mason, or Capricious doing Mason)
      if (reply.then) pendingReply = { at: chatGame.time + 1400, reply: { by: o => o === teller, lines: [reply.then] }, teller: null };
    }
  }

  // Someone answers Star's showing off, in their own voice (see showOff).
  if (pendingAnswer && chatGame.time >= pendingAnswer.at) {
    const { teller } = pendingAnswer;
    pendingAnswer = null;
    const who = teller.alive && chatPick(alive.filter(o => o !== teller && VOICES[o.personaKey]?.showoff));
    if (who && chatSay(who, 'showoff', teller, true)) answeredAt = chatGame.time;
  }

  // Copycat repeats exactly what it just heard, in Chinese.
  const cat = alive.find(s => s.personaKey === 'copycat');
  if (cat && lastLine?.template && lastLine.speaker !== cat && chatGame.time - lastAny > 500 && Math.random() < 0.35) {
    if (chatGame.time - (lastSaid[cat.id] ?? -Infinity) > SNAKE_GAP) {
      const who = lastLine.who ? (lastLine.who === cat ? '我' : nameOf(lastLine.who)) : ''; // ("That's a colony, me.")
      speak(cat, fill(ZH[lastLine.template] ?? lastLine.template, who, ZH_LABELS[lastLine.label] ?? lastLine.label));
    }
    lastLine = null;
  }
  if (lastLine && chatGame.time - lastAny > 2000) lastLine = null;

  // Small talk now and then. (Star, while its flash rests, grumbles as often as not.)
  if (chatGame.time - lastAny > 3500 && Math.random() < 0.04) {
    const s = chatPick(alive);
    if (s) chatSay(s, showsOff(s) && chatGame.time < s.flashReadyAt && Math.random() < 0.5 ? 'resting' : 'idle', anyone(s));
  }
}

window.SnakeChatter = { init: chatInit, reset, update, layout, clearBubbles, setEnabled, isEnabled, setCompact, onSpeak, replay };
