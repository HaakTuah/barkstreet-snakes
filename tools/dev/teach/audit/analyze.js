// The play runs (out/<branch>-<screen>.json), banner by banner, gathered by
// lesson: how often it came, how long it was up (and at full strength), where
// (its place, against the board's middle), how close to your head, and whether
// a head or the thing it's about was under it; with its words and the time
// reading them takes at 200-250 words a minute. node analyze.js
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out');
const LESSONS = [
  ['powersFirst', /^Tap jumps\. Swipe ahead flashes/], ['lastApples', /^The last apples are falling/], ['youWoodpecker', /knocks food aside/],
  ['youCrashToThree', /^Crashes cost tail\. You’re at/], ['youCrash', /^Crashes cost tail\. At|^That crash cost tail/], ['wrapEnding', /edges are back in|^Edges back in/],
  ['youHungry', /tummy is rumbling|Getting peckish/], ['youStarvingSmall', /^Starving at/], ['youAtThree', /^Down to.3|^At.3 now/],
  ['digBurrow', /leaves a burrow behind/], ['youPeckedUnder', /^Pecking under you/], ['youDig', /cornered beetle digs in/], ['youChoke', /choke on your own tail/],
  ['youCoughing', /No eating while you cough/], ['youOwnBead', /own tail won’t feed you/], ['youGoldBeetle', /^Golden: \d+ long jump/], ['youLeaf', /^\d+ golden flash/],
  ['youGoldcap', /^A golden mushroom: \d+ seconds/], ['youLeapFirst', /^Hup!/], ['youDashFirst', /^Golden flashes cut thin snakes/],
  ['fizzle', /needs a moment|Too small to jump|Nowhere to land|Nowhere to flash/], ['youSnipped', /flashed right through you/], ['youAlight', /^On fire:|^Burning, and losing/],
  ['flashKey', /^Your flash is ready/], ['leapNothing', /^Jumps hop over/], ['leapEarly', /^A bit early/],
];
const NEWS = [
  ['go', /^Slither!|^Off you go|^Mind the edges/], ['woodpeckerCame', /^The woodpecker is here|^Rat-a-tat\. The woodpecker/], ['weather', /Golden hour|sun’s out|wind’s up|blustery|^Rain\.|Here comes the rain|storm’s brewing|Thunder on the bark|^Winter\.|Snow on the bark/],
  ['strike', /^Lightning!|^Crack!/], ['spawn', /golden apple|beetle is out|beetle is crawling|golden beetle|golden leaf|golden mushroom came up|^A golden mushroom: eat/], ['rainbow', /rainbow/i], ['baked', /^Bak/],
  ['field', /realm now|colonies\. It noticed/], ['mushroom', /feel smaller|less of you/], ['snip', /^Snip! You cut/], ['firstOut', /^First (out|blood)/], ['lastTwo', /^It’s down to/], ['newBest', /^New best/],
];
const classify = t => { for (const [k, re] of LESSONS) if (re.test(t)) return ['lesson', k]; for (const [k, re] of NEWS) if (re.test(t)) return ['news', k]; return ['other', t.slice(0, 30)]; };
const words = t => t.replace(/ /g, ' ').split(/\s+/).filter(w => /[\w\d]/.test(w)).length;
const files = fs.readdirSync(OUT).filter(f => /^(main|p2)-(p390|p360|d1920)\.json$/.test(f));
const rows = [], byKey = {}, fileStats = {};
const med = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
  const [branch, screen] = f.replace('.json', '').split('-');
  const roundsT = r.rounds.map(x => x.time);
  console.log(`\n== ${f}: ${r.rounds.length} rounds (${roundsT.map(t => Math.round(t / 1000) + ' s').join(', ')}), ${r.eps.length} banners, steer hint ${r.hint.map(h => h.ms + ' ms').join(', ')}`);
  let lessonsN = 0;
  for (const e of r.eps) {
    const [cat, key] = classify(e.text);
    if (cat === 'lesson') lessonsN++;
    const row = { file: f, branch, screen, cat, key, text: e.text, round: e.round, t: e.gtime, ms: e.ms, full: Math.round(e.full), faded: Math.round(e.faded), slot: e.slotFirst, moves: e.moves, slots: e.slot,
      midOff: e.midOff, maxMidOff: e.maxMidOff, meGap: e.minMeGap, meNear: Math.round(e.meNear), meUnder: Math.round(e.meUnder), meUnderFull: Math.round(e.meUnderFull), headUnder: Math.round(e.headUnder), headUnderFull: Math.round(e.headUnderFull), actUnder: Math.round(e.actUnder),
      words: words(e.text), lines: Math.round((e.rect.h - 14) / e.lineH), w: Math.round(e.rect.w), h: Math.round(e.rect.h), boardW: Math.round(e.board.w), shot: e.shot, events: e.events };
    rows.push(row);
    if (cat === 'lesson') (byKey[key] ||= []).push(row);
    console.log(`${(e.gtime / 1000).toFixed(1).padStart(6)} r${e.round} ${cat.padEnd(6)} ${String(row.ms).padStart(5)} ms (full ${String(row.full).padStart(4)}, faded ${String(row.faded).padStart(4)}) ${row.slot}${row.moves ? '+' + row.moves : ''} mid${row.midOff >= 0 ? '+' : ''}${row.midOff.toFixed(2)} me ${row.meGap.toFixed(1)}c${row.meUnderFull ? ' ME-UNDER ' + row.meUnderFull : ''}${row.headUnderFull ? ' head-under ' + row.headUnderFull : ''}${row.actUnder ? ' act-under ' + row.actUnder : ''} ${row.lines}L ${row.words}w | ${e.text}`);
  }
  const playMs = roundsT.reduce((a, b) => a + b, 0);
  const upMs = r.eps.reduce((a, e) => a + (e.end - e.start), 0), lessonUp = r.eps.filter(e => classify(e.text)[0] === 'lesson').reduce((a, e) => a + (e.end - e.start), 0);
  let chains = 0, chainLessons = 0;
  for (let i = 1; i < r.eps.length; i++) if (r.eps[i].round === r.eps[i - 1].round && r.eps[i].start - r.eps[i - 1].end < 350) { chains++; if (classify(r.eps[i].text)[0] === 'lesson') chainLessons++; }
  const early = r.eps.filter(e => e.gtime < 12000 && classify(e.text)[0] !== 'news').length;
  console.log(`  a banner up ${(100 * upMs / playMs).toFixed(0)}% of the time (a lesson ${(100 * lessonUp / playMs).toFixed(0)}%); ${chains} banners came straight after another (${chainLessons} of them lessons); ${early} non-news banners in rounds' first 12 s`);
  (fileStats[f] = { playMs, banners: r.eps.length, lessons: lessonsN, upShare: upMs / playMs, lessonShare: lessonUp / playMs, chains, chainLessons, hint: r.hint.map(h => h.ms) });
  console.log(`  ${lessonsN} lessons and ${r.eps.length - lessonsN} other banners in ${Math.round(playMs / 1000)} s of play: a banner every ${(playMs / 1000 / r.eps.length).toFixed(1)} s`);
}
console.log('\n== by lesson');
const summary = {};
for (const [k] of LESSONS) {
  const a = byKey[k] || [];
  const s = { n: a.length, where: [...new Set(a.map(x => `${x.branch}-${x.screen}`))], ms: med(a.map(x => x.ms)), full: med(a.map(x => x.full)), words: a.length ? Math.max(...a.map(x => x.words)) : null,
    slots: a.reduce((o, x) => (o[x.slot] = (o[x.slot] || 0) + 1, o), {}), mid: a.filter(x => x.slot === 'mid' || x.slots.mid > 300).length, meUnder: a.filter(x => x.meUnderFull > 0).length, headUnder: a.filter(x => x.headUnderFull > 0).length,
    actUnder: a.filter(x => x.actUnder > 0).length, near: a.filter(x => x.meGap <= 2).length, faded: a.filter(x => x.faded > 0).length, firstT: a.length ? Math.round(Math.min(...a.map(x => x.t)) / 1000) : null, shots: a.map(x => x.shot).filter(Boolean).slice(0, 4) };
  summary[k] = s;
  console.log(`${k.padEnd(16)} n ${String(s.n).padStart(2)}  up ${s.ms ?? '-'} ms (full ${s.full ?? '-'})  ${s.words ?? '-'} words  slots ${JSON.stringify(s.slots)}  mid ${s.mid} me-under ${s.meUnder} head-under ${s.headUnder} act-under ${s.actUnder} me<=2c ${s.near} faded ${s.faded}  first ${s.firstT ?? '-'} s  ${s.where.join(' ')}`);
}
fs.writeFileSync(path.join(OUT, 'analysis.json'), JSON.stringify({ rows, summary, fileStats }, null, 1));
