// ------------------------------------------------- the chomps, as the round plays them
// A real round, stopped, and staged events heard through the round's own
// sounds (SnakeDebug.hear), with SnakeAudio.play recorded: your meal plays
// its own cue, a rival's plays the same kind's cue as a rival's (softer,
// further off: Audio's CHOMPS), from where it ate, never with the streak's
// climb; and when everyone eats in the same tick, yours is asked for first,
// so theirs give way to it.
await ev(`window.__autoRaf = true; 'ok'`);
await b.go(site.url + '?debug', { settle: 0 });
await ev('__settle()');
await ev(`document.getElementById('start').click(); 'ok'`);
const chomps = await ev(`(() => {
  window.__autoRaf = false;
  for (let i = 0; i < 600 && SnakeDebug.state() !== 'running'; i++) SnakeDebug.frames(1, 1000 / 60);
  const g = SnakeDebug.game(), [me, ...rivals] = g.snakes, CUE = ['eat', 'golden', 'meat', 'mushroom', 'crunch', 'leaf'];
  const plays = [], play = SnakeAudio.play;
  SnakeAudio.play = (name, o) => { if (CUE.includes(name) || name === 'wrap') plays.push({ name, rival: !!o?.rival, streak: o?.streak, pan: o?.pan }); };
  const hear = evs => { plays.length = 0; SnakeDebug.hear(evs); return plays.slice(); };
  const eat = (s, kind, x) => ({ type: 'eat', snake: s, kind, x, y: 5, gold: kind === 'golden' });
  const kinds = { apple: 'eat', golden: 'golden', pellet: 'meat', mushroom: 'mushroom', beetle: 'crunch', leaf: 'leaf' };
  const out = { yours: {}, theirs: {} };
  for (const [kind, cue] of Object.entries(kinds)) {
    out.yours[kind] = hear([eat(me, kind, 3)]);
    out.theirs[kind] = hear([eat(rivals[0], kind, 20)]);
    g.time += 5000;
  }
  out.cap = hear([eat(rivals[1], 'goldcap', 10)]);
  g.time += 5000;
  out.all = hear([eat(rivals[0], 'apple', 2), eat(rivals[1], 'pellet', 9), eat(me, 'apple', 14), eat(rivals[2], 'beetle', 21)]);
  SnakeAudio.play = play;
  out.kinds = kinds; out.pan = { 3: (3.5 / TUNING.GRID * 2 - 1) * 0.8, 20: (20.5 / TUNING.GRID * 2 - 1) * 0.8 };
  return out;
})()`);
{
  const { yours, theirs, cap, all, kinds, pan } = chomps, near = (a, b) => Math.abs(a - b) < 1e-9;
  const one = (p, cue, rival, x) => p.length === 1 && p[0].name === cue && p[0].rival === rival && near(p[0].pan, pan[x]);
  for (const [kind, cue] of Object.entries(kinds)) {
    check(one(yours[kind], cue, false, 3), `your ${kind}: your '${cue}', from where you ate`, JSON.stringify(yours[kind]));
    check(one(theirs[kind], cue, true, 20) && theirs[kind][0].streak == null, `a rival's ${kind}: its own '${cue}', a rival's (softer, further off), from where it ate, no streak`, JSON.stringify(theirs[kind]));
  }
  check(cap.length === 1 && cap[0].name === 'wrap' && cap[0].rival, 'a rival\'s golden mushroom: its wrap, a rival\'s, as before', JSON.stringify(cap));
  check(all.length === 4 && all[0].name === 'eat' && !all[0].rival && all.slice(1).every(p => p.rival), 'everyone eating in the same tick: yours asked for first, then the rivals\' (which give way to it)', all.map(p => `${p.name}${p.rival ? '~' : ''}`).join(' '));
}
