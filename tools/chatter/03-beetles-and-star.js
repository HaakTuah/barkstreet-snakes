// A cornered beetle digging in, and food the woodpecker knocks aside (round
// six A, wave two): the hunter whose beetle got away says so, at most every
// 30 s; the snake whose food was knocked to someone else grumbles at them,
// half the time, at most every 40 s.
{ // Dug in and gone: the snake that cornered it (the nearest head as it started, within BEETLE_DIG_FEAR) says so; nobody speaks for you.
  const g = stage(['gobbler', 'mason', 'copycat'], { 0: [3, 22], 1: [12, 12], 2: [12, 4], 3: [20, 20] }), [you, gob, mason, cat] = g.snakes;
  const dig = (x, y) => ({ type: 'dig', x, y, until: g.tick + 1 + T.BEETLE_DIG });
  const dive = (x, y, dug = 1) => ({ type: 'dive', x, y, dug });
  tick(g, [dig(14, 12)]); // (Gobbler's 2 cells off, Mason 10)
  let h = tick(g, [dive(14, 12)], 800);
  check(says(h, gob, VOICES.gobbler.dug) && h.length === 1, `a beetle Gobbler cornered digs in and gets away: "${lineOf(h, gob)}", and nobody else`);
  tick(g, [dig(12, 7)], 5000); // (Mason's 3 cells off, Gobbler 5)
  h = tick(g, [dive(12, 7)], 800);
  check(says(h, mason, VOICES.mason.dug) && h.length === 1, `...one Mason cornered, nearer Mason than Gobbler: Mason, in Latin ("${lineOf(h, mason)}")`);
  tick(g, [dig(13, 13)], 5000);
  check(tick(g, [dive(13, 13)], 800).length === 0, '...another of Gobbler\'s 6.5 s after its last: nothing (30 s between)');
  tick(g, [dig(12, 14)], 25000);
  check(says(tick(g, [dive(12, 14)], 800), gob, VOICES.gobbler.dug), '...but 33 s after its last: a dug line');
  tick(g, [dig(3, 19)], 5000); // (yours: 3 cells off)
  check(tick(g, [dive(3, 19)], 800).length === 0, 'a beetle you cornered: nobody speaks for you');
  tick(g, [dig(19, 20)], 40000);
  check(says(tick(g, [dive(19, 20)], 800), cat, VOICES.copycat.dug), 'Copycat\'s: in Chinese');
  check(tick(g, [dive(12, 13, 0)], 40000).length === 0, 'a scared beetle diving into a burrow by Gobbler (no digging): nothing');
  tick(g, [dig(12, 13)], 1000);
  h = tick(g, [{ type: 'eat', snake: gob, kind: 'beetle', x: 12, y: 13 }], 400);
  check(says(h, gob, VOICES.gobbler.caught), 'one Gobbler catches as it digs: its catch line');
  check(tick(g, [], 2000).length === 0, '...and no dug line after');
  tick(g, [dig(12, 15)], 40000);
  gob.alive = false;
  check(tick(g, [dive(12, 15)], 800).length === 0, 'its hunter out of the round meanwhile: nothing');
  void you;
}
{ // The hunter's reach is the engine's: a beetle digs in with a head within BEETLE_DIG_FEAR, and that head is its hunter, as far off as that; one further from every head is nobody's. (Each in a fresh round, so the hunter has a line to say.)
  const F = T.BEETLE_DIG_FEAR;
  const cornered = (x, y) => {
    const g = stage(['gobbler', 'mason', 'copycat'], { 0: [3, 22], 1: [6, 12], 2: [12, 2], 3: [22, 22] }), [, gob] = g.snakes;
    const off = Math.min(...g.snakes.map(s => Math.abs(s.body[0].x - x) + Math.abs(s.body[0].y - y)));
    tick(g, [{ type: 'dig', x, y, until: g.tick + 1 + T.BEETLE_DIG }]);
    return [tick(g, [{ type: 'dive', x, y, dug: 1 }], 800), gob, off];
  };
  let [h, gob, off] = cornered(6 + F, 12);
  check(off === F && says(h, gob, VOICES.gobbler.dug), `cornered from as far as BEETLE_DIG_FEAR (${F} cells; the nearest head ${off} off): its hunter's line ("${lineOf(h, gob)}")`);
  [h, gob, off] = cornered(7 + F, 12);
  check(off === F + 1 && h.length === 0, `...but one with no head within ${F} as it started (the nearest ${off} off): nobody's (said: ${h.map(x => `"${x.text}"`).join(', ') || 'nothing'})`);
}
{ // Knocked aside: the snake that was after it (the nearest head to where it lay at the strike, the eater's aside, within the chatter's KNOCKED_NEAR) grumbles at whoever eats it where it landed, within 6 s; every time, at most every 40 s. (Each case in a fresh round, but the rest's own.)
  const N = KNOCKED_NEAR;
  // Sovereign at 12, 12; Gobbler and Mason far off unless asked; you at 3, 22.
  const knockRound = (heads = {}) => { const g = stage(['sovereign', 'gobbler', 'mason'], { 0: [3, 22], 1: [12, 12], 2: [20, 4], 3: [4, 4], ...heads }); return [g, ...g.snakes]; };
  const knock = (x, y, tx, ty, kind = 'food') => ({ type: 'knock', kind, x, y, tx, ty });
  const eat = (s, x, y, kind = 'food') => ({ type: 'eat', snake: s, kind, x, y });
  const grumbles = (h, s, who) => says(h, s, VOICES[s.personaKey].knocked, who);
  const heardAll = h => h.map(x => `${x.s.name}: "${x.text}"`).join(', ') || 'nothing';

  let [g, you, sov, gob, mason] = knockRound();
  tick(g, [knock(12, 14, 12, 16)]);
  let h = tick(g, [eat(you, 12, 16)], 1500);
  check(grumbles(h, sov, you), `Sovereign's apple, knocked aside, and you eat it: "${lineOf(h, sov)}"`);
  tick(g, [knock(12, 14, 12, 16)], 5000);
  check(tick(g, [eat(you, 12, 16)], 1000).length === 0, '...and again 6 s later: nothing (40 s between)');
  tick(g, [knock(12, 14, 12, 16)], 40000);
  h = tick(g, [eat(gob, 12, 16)], 1000, 0.99);
  check(grumbles(h, sov, gob), `...40 s on, Gobbler eats it, whatever the roll: "${lineOf(h, sov)}" (every time, not now and then)`);

  [g, you, sov, gob] = knockRound();
  tick(g, [knock(12, 14, 12, 16)]);
  check(tick(g, [eat(sov, 12, 16)], 1000).length === 0 && tick(g, [eat(gob, 12, 16)], 500).length === 0, 'Sovereign gets there itself: nothing, and that settled it');
  [g, you, sov] = knockRound();
  tick(g, [knock(12, 14, 12, 16)]);
  check(tick(g, [eat(you, 12, 16)], 7000).length === 0, 'one eaten 7 s after it was knocked: just an apple');
  [g, you, sov] = knockRound();
  tick(g, [knock(12, 14, null, null)]);
  check(tick(g, [eat(you, 12, 14)], 1000).length === 0, 'one the bird ate (nowhere free to land): nothing');
  [g, you, sov] = knockRound();
  tick(g, [knock(12, 14, 12, 16, 'mushroom')]);
  check(tick(g, [eat(you, 12, 16, 'mushroom')], 1000).length === 0, 'a mushroom knocked aside: nobody misses it');

  // How far "after it" reaches: KNOCKED_NEAR cells from where it lay, and no further.
  const reach = d => {
    [g, you, sov, gob] = knockRound({ 0: [3, 2], 1: [4, 12], 2: [22, 2] });
    const x = 4 + d, off = Math.min(...g.snakes.map(s => Math.abs(s.body[0].x - x) + Math.abs(s.body[0].y - 12)));
    tick(g, [knock(x, 12, x + 1, 12)]);
    return [tick(g, [eat(gob, x + 1, 12)], 1000), off];
  };
  let [r, off] = reach(N);
  check(off === N && grumbles(r, sov, gob), `knocked from ${N} cells off Sovereign's head (KNOCKED_NEAR; the nearest head ${off} off): Sovereign's, and it grumbles ("${lineOf(r, sov)}")`);
  [r, off] = reach(N + 1);
  check(off === N + 1 && r.length === 0, `...from ${N + 1} off every head (the nearest ${off} off): nobody's (${heardAll(r)})`);

  // The nearest at the strike gets it: the next nearest, within reach, was after it too.
  [g, you, sov, gob] = knockRound({ 2: [12, 17] });
  tick(g, [knock(12, 15, 12, 16)]); // (Gobbler 2 off, Sovereign 3)
  h = tick(g, [eat(gob, 12, 16)], 400);
  check(grumbles(h, sov, gob), `Gobbler, nearest, gets it, with Sovereign a cell further: Sovereign grumbles at Gobbler ("${lineOf(h, sov)}")`);
  [g, you, sov, gob] = knockRound({ 0: [12, 17], 2: [20, 14] });
  tick(g, [knock(12, 15, 12, 16)]); // (you 2 off, Sovereign 3, Gobbler 9)
  check(tick(g, [eat(gob, 12, 16)], 1000).length === 0, 'you were nearest and Gobbler eats it: it was yours, and nobody speaks for you (not even Sovereign, a cell further)');

  // A bead was never its own snake's meal: whoever was after it is the next nearest.
  [g, you, sov, gob, mason] = knockRound({ 3: [16, 14] });
  g.food.push({ x: 12, y: 16, kind: 'pellet', color: sov.color, owner: sov.id });
  tick(g, [knock(12, 14, 12, 16, 'pellet')]); // (Sovereign 2 off, Mason 4)
  g.food.length = 0;
  h = tick(g, [eat(gob, 12, 16, 'pellet')], 1000);
  check(!h.some(x => x.s === sov) && grumbles(h, mason, gob), `Sovereign's own bead, knocked aside and eaten by Gobbler: not Sovereign's meal, but Mason's, who grumbles ("${lineOf(h, mason)}")`);
  [g, you, sov, gob] = knockRound();
  g.food.push({ x: 12, y: 16, kind: 'pellet', color: sov.color, owner: sov.id });
  tick(g, [knock(12, 14, 12, 16, 'pellet')]);
  g.food.length = 0;
  check(tick(g, [eat(gob, 12, 16, 'pellet')], 1000).length === 0, '...and with nobody else near: nothing');

  [g, you, sov, gob] = knockRound();
  tick(g, [knock(13, 12, 14, 10, 'beetle')]);
  h = tick(g, [eat(gob, 16, 9, 'beetle')], 1000);
  check(grumbles(h, sov, gob) && says(h, gob, VOICES.gobbler.caught), `a beetle knocked off Sovereign's patch scurries on, and Gobbler catches it 3 cells from where it landed: Sovereign grumbles ("${lineOf(h, sov)}"), and Gobbler has its catch line too`);
  [g, you, sov, gob] = knockRound();
  tick(g, [knock(12, 14, 12, 16)]);
  sov.alive = false;
  check(tick(g, [eat(gob, 12, 16)], 1000).length === 0, 'the snake that was after it out of the round meanwhile: nothing');
  void mason;
}
console.log(`ok   a beetle that digs in and gets away: its hunter (the nearest head as it dug, within ${T.BEETLE_DIG_FEAR}) says so, at most every 30 s, and nobody for you; food the woodpecker knocked aside, eaten soon after: the snake that was after it (the nearest head to where it lay, the eater's aside, within ${KNOCKED_NEAR}) grumbles at the eater, every time, at most every 40 s`);

// Star shows off: any flash of its own, its jumps and golden dashes, and its
// flash back from its rest, half the time and all together at most every 10 s
// (a golden dash or jump, rarer, whenever it can).
const STAR = VOICES.star;
{
  const g = stage(['star'], { 0: [3, 22], 1: [12, 12] }), [you, star] = g.snakes;
  const flash = (s = star) => [{ type: 'dash', snake: s, x: 10, y: 12, n: 2, plain: 1 }];
  const jump = (gold = 0) => [{ type: 'leap', snake: star, x: 12, y: 12, gold, reach: 2 }];
  const dash = () => [{ type: 'dash', snake: star, x: 9, y: 12, n: 3 }];
  check(tick(g, flash(), 100, 0.6).length === 0, 'Star flashes, and the roll says not this time: nothing');
  check(says(tick(g, flash(), 5000), star, STAR.zoom), 'Star flashes with nobody near: a zoom line (anyone else says nothing)');
  check(tick(g, flash(), 5000).length === 0, '...and none for its next flash, 5 s later');
  check(says(tick(g, jump(1), 3000, 0.6), star, STAR.leap), '...but a golden jump 8 s after: a leap line all the same, whatever the roll');
  check(tick(g, jump(), 2500).length === 0, '...and that starts the rest too: nothing for a plain jump 2.5 s later');
  check(says(tick(g, jump(), 8000), star, STAR.leap), '...but a plain jump 10.5 s after: a leap line');
  check(says(tick(g, dash(), 5000, 0.6), star, STAR.dash), 'a golden dash 5 s later: a dash line all the same, whatever the roll');
  check(tick(g, flash(), 5000).length === 0, '...and a flash 5 s after that: nothing');
  let h = tick(g, [...dash(), { type: 'cut', snake: you, x: 3, y: 22, lost: 2, by: star.id }], 10500);
  check(says(h, star, STAR.snip, you) && !says(h, star, STAR.dash), `a golden dash that cuts your tail off: Star's snip, not its dash line (said: ${lineOf(h, star)})`);
  star.flashReadyAt = g.time + 10600;
  check(tick(g, [], 10000).length === 0, 'resting: nothing yet');
  check(tick(g, [], 700).length === 0, '...its flash back from its rest: nothing yet (it flashes the moment it can, as a rule)');
  check(says(tick(g, [], 1000), star, STAR.ready), '...but still back a second later: a ready line');
  star.flashReadyAt = g.time + 12000;
  tick(g, [], 11900);
  check(tick(g).length === 0, 'its rest over again: nothing yet');
  star.flashReadyAt = g.time + 100 + T.FLASH_COOLDOWN_MS; // (it flashes the tick after its rest ends, as its AI does)
  h = tick(g, flash());
  check(says(h, star, STAR.zoom), `...and it flashes a tick later: the flash has the word (said: ${lineOf(h, star)})`);
  check(!says(tick(g, [], 1000), star, STAR.ready) && !says(tick(g, [], 1000), star, STAR.ready), '...and no ready line after it');
  star.flashReadyAt = g.time + 12000;
  tick(g, [], 11900);
  star.flashReadyAt = g.time + 100 + T.FLASH_COOLDOWN_MS; // (as when it flashes the moment its rest ends: resting again at once)
  check(!says(tick(g), star, STAR.ready) && !says(tick(g, [], 1000), star, STAR.ready), 'a rest that ends in another flash on the same tick: no ready line either');
  tick(g, [], 20000); tick(g, [], 1000); // (its rest is over: it may say so)
  check(tick(g, flash(you), 20000).length === 0 && tick(g, [{ type: 'leap', snake: you, x: 3, y: 22, gold: 1 }], 20000).length === 0, 'your flashes and jumps: nobody speaks for you');
  you.body = at(13, 13);
  check(says(tick(g, flash(), 20000), star, STAR.flash.past, you), 'Star flashes past your head: a flash.past line, naming you');
}
{ // While its flash rests, Star's small talk grumbles (as often as not); rested, it's small talk.
  let g = stage(['star'], { 0: [3, 22], 1: [12, 12] }), [you, star] = g.snakes;
  star.flashReadyAt = g.time + 20000;
  check(says(tick(g, [], 4000, 0.01), star, STAR.resting, you), `resting: a grumble (said: ${lineOf(heard, star)})`);
  g = stage(['star'], { 0: [3, 22], 1: [12, 12] }); [you, star] = g.snakes;
  check(says(tick(g, [], 4000, 0.01), star, STAR.idle, you), `rested: its small talk (said: ${lineOf(heard, star)})`);
}
{ // Golden power food: Star crows over a golden beetle, even just after another line; a golden leaf's flashes it spends there and then, so it cheers them as it eats it; a golden mushroom, its wrap. Anyone else's lines are as they were.
  const g = stage(['star', 'gobbler'], { 0: [3, 22], 1: [12, 12], 2: [12, 18] }), [, star, gob] = g.snakes;
  check(says(tick(g, [{ type: 'dash', snake: star, x: 10, y: 12, n: 2, plain: 1 }], 100, 0.2), star, STAR.zoom), 'Star shows off');
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'beetle', x: 12, y: 12, gold: true }], 1000), star, STAR.stash), '...and eats a golden beetle a second later: a stash line all the same');
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'leaf', x: 12, y: 12, gold: false }], 1000), star, STAR.dash), '...a golden leaf a second after that: a golden dash line (it spends them at once)');
  check(tick(g, [{ type: 'dash', snake: star, x: 9, y: 12, n: 3 }]).length === 0, '...and its golden dash a tick later: no second word');
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'goldcap', x: 12, y: 12, gold: false }], 5000), star, STAR.wrap), '...a golden mushroom: a wrap line');
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'golden', x: 12, y: 12, gold: false }], 5000), star, STAR.golden), '...a golden apple: a golden line');
  check(says(tick(g, [{ type: 'eat', snake: gob, kind: 'beetle', x: 12, y: 18, gold: true }], 5000), gob, VOICES.gobbler.caught), 'Gobbler eats a golden beetle: still a caught line');
  const h = tick(g, [{ type: 'spawn', kind: 'beetle', x: 20, y: 20, gold: 1 }], 5000);
  check(says(h, star, STAR.goldbug) && says(h, gob, VOICES.gobbler.goldbug), 'a golden beetle comes out: Star wants it too');
}
{ // A rainbow: Star's own colours, so it's first to say so, even just after another line; with Star out, someone else does.
  const g = stage(['gobbler', 'star', 'colonist'], { 0: [3, 22], 1: [12, 4], 2: [12, 12], 3: [12, 20] }), [, gob, star, col] = g.snakes;
  let h = tick(g, [{ type: 'rainbow', x: 5, y: 5 }]);
  check(says(h, star, STAR.rainbow) && h.length === 1, `a rainbow: Star says so ("${lineOf(h, star)}")`);
  check(says(tick(g, [{ type: 'eat', snake: star, kind: 'golden', x: 12, y: 12 }], 60000), star, STAR.golden), 'Star eats a golden apple');
  h = tick(g, [{ type: 'rainbow', x: 5, y: 5 }], 1000);
  check(says(h, star, STAR.rainbow) && h.length === 1, `...and a rainbow a second later: Star says so all the same ("${lineOf(h, star)}")`);
  h = tick(g, [{ type: 'leap', snake: star, x: 12, y: 12, gold: 1, reach: 2 }, { type: 'rainbow', x: 5, y: 5 }], 60000);
  check(says(h, star, STAR.leap) && h.filter(x => x.s === star).length === 1 && (says(h, gob, VOICES.gobbler.rainbow) || says(h, col, VOICES.colonist.rainbow)),
    'a rainbow in the very tick Star cheers its golden jump: one line at a time from Star (someone else greets the rainbow)');
  star.alive = false;
  h = tick(g, [{ type: 'rainbow', x: 5, y: 5 }], 60000);
  check(h.length === 1 && (says(h, gob, VOICES.gobbler.rainbow) || says(h, col, VOICES.colonist.rainbow)), 'a rainbow with Star out: someone else remarks on it');
}
{ // Star's kill and its being cut, a second after it showed off: their lines all the same.
  const g = stage(['star', 'sovereign', 'gobbler'], { 0: [3, 22], 1: [12, 12], 2: [12, 4], 3: [12, 18] }), [, star, sov, gob] = g.snakes;
  check(says(tick(g, [{ type: 'dash', snake: star, x: 10, y: 12, n: 2, plain: 1 }], 100, 0.2), star, STAR.zoom), 'Star shows off');
  gob.alive = false; gob.killer = star.name; gob.killerId = star.id;
  let h = tick(g, [{ type: 'death', snake: gob }], 1000);
  check(says(h, star, STAR.kill, gob), `...and knocks Gobbler out a second later: a kill line all the same (said: ${lineOf(h, star)})`);
  h = tick(g, [{ type: 'cut', snake: star, x: 11, y: 12, lost: 2, by: sov.id }], 1000);
  check(says(h, star, STAR.cut, sov) && says(h, sov, VOICES.sovereign.snip, star), `...and is cut by Sovereign's golden dash a second after that: a cut line all the same (said: ${lineOf(h, star)})`);
}
{ // Anyone's golden dash that cuts someone leaves the words to its snip (a tail off) or its kill line (in two): they say more than a dash line. Failing those, its dash line.
  const g = stage(['sovereign', 'gobbler'], { 0: [3, 22], 1: [12, 12], 2: [12, 18] }), [you, sov, gob] = g.snakes;
  const dash = () => ({ type: 'dash', snake: sov, x: 9, y: 12, n: 3 });
  let h = tick(g, [dash(), { type: 'cut', snake: you, x: 3, y: 22, lost: 2, by: sov.id }]);
  check(says(h, sov, VOICES.sovereign.snip, you) && !says(h, sov, VOICES.sovereign.dash), `a golden dash that cuts your tail off: the dasher's snip (said: ${lineOf(h, sov)})`);
  gob.alive = false; gob.killer = sov.name; gob.killerId = sov.id; gob.fatal = 'cut';
  h = tick(g, [dash(), { type: 'death', snake: gob }], 6000);
  check(says(h, sov, VOICES.sovereign.kill, gob) && !says(h, sov, VOICES.sovereign.dash), `...one that cuts Gobbler in two: its kill line (said: ${lineOf(h, sov)})`);
  h = tick(g, [dash(), { type: 'cut', snake: you, x: 3, y: 22, lost: 2, by: sov.id }], 6000);
  check(says(h, sov, VOICES.sovereign.dash), `...and another that cuts your tail, its one snip said only lately: its dash line after all (said: ${lineOf(h, sov)})`);
}
{ // Now and then a rival answers Star's showing off, a moment later, naming it: not every time, and not again for 40 s.
  for (const [k, list] of [['wildcard', VOICES.wildcard.showoff], ['mason', VOICES.mason.showoff]]) {
    const g = stage(['star', k], { 0: [3, 22], 1: [12, 12], 2: [20, 4] }), [, star, other] = g.snakes;
    const flash = () => [{ type: 'dash', snake: star, x: 10, y: 12, n: 2, plain: 1 }];
    check(says(tick(g, flash(), 100, 0.2), star, STAR.zoom), `with ${k}: Star shows off`);
    check(tick(g, [], 600).length === 0, '...not answered at once');
    const h = tick(g, [], 600);
    check(says(h, other, list, star), `...a moment later, ${k} answers: "${lineOf(h, other)}"`);
    check(says(tick(g, flash(), 12000, 0.2), star, STAR.zoom) && tick(g, [], 1200).length === 0, '...and not again for a while (12 s later)');
    check(says(tick(g, flash(), 30000, 0.3), star, STAR.zoom) && tick(g, [], 1200).length === 0, '...nor when the roll says no (43 s later: 0.3, against 0.25)');
    check(says(tick(g, flash(), 12000, 0.2), star, STAR.zoom) && says(tick(g, [], 1200), other, list, star), '...but 56 s later, yes');
  }
}
console.log('ok   Star shows off its flashes, jumps, golden dashes and flash back (half the time, every 10 s at most; a golden one whenever it can; its flash back only once it\'s been back a second), grumbles while it rests, crows over golden things and greets a rainbow first, even just after another line, as it does its kill or a cut; Wildcard and Mason answer it now and then; a golden dash that cuts leaves the words to the snip or the kill');
