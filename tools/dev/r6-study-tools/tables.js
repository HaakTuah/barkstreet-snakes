// node tables.js <rounds> <seed> [variants...] > file.md : markdown tables from runs/<v>-s<seed>-<rounds>.summary.json
const fs = require('fs'), path = require('path');
const [n, seed, ...names] = process.argv.slice(2);
const dir = path.join(__dirname, 'runs');
const list = (names.length ? names : fs.readdirSync(dir).filter(f => f.endsWith(`-s${seed}-${n}.summary.json`)).map(f => f.replace(`-s${seed}-${n}.summary.json`, '')))
  .map(v => { try { return JSON.parse(fs.readFileSync(path.join(dir, `${v}-s${seed}-${n}.summary.json`), 'utf8')); } catch { return null; } }).filter(Boolean);
const over = v => { try { return fs.readFileSync(path.join(__dirname, 'variants', v, 'VARIANT.json'), 'utf8'); } catch { return '(main)'; } };
const tbl = (head, rows) => ['| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|', ...rows.map(r => '| ' + r.join(' | ') + ' |')].join('\n');
const c = (o, k) => o?.[k] ?? 0;
const out = [];
out.push(`## ${n} rounds, seed ${seed}\n`);
out.push('### Variants\n\n' + tbl(['variant', 'tuning', 'fingerprint'], list.map(s => [s.label, '`' + over(s.label) + '`', s.fingerprint])));
out.push('\n### The round and the woodpecker\n\n' + tbl(
  ['variant', 'median (middle half)', 'SD starts', 'SD length (mid half)', 'reach SD %', 'deaths before / after', 'first death', 'alive 60/90/120/150', 'len at arrival', 'alive at arrival', 'starved %', 'win spread'],
  list.map(s => [s.label, `${s.median} (${s.q1}-${s.q3})`, `${s.sdAt} (${s.sdAtQ.join('-')})`, `${s.sdLen} (${s.sdLenQ.join('-')})`, s.reachedSD, `${s.deathsBefore} / ${s.deathsAfter}`, s.firstDeath, Object.values(s.aliveAt).join(' / '), s.lenArrival, s.aliveArrival, s.starvedPct, `${s.winSpread[0]}-${s.winSpread[1]}`])));
out.push('\n### Deaths by cause (all deaths; sudden death\'s)\n\n' + tbl(
  ['variant', 'body', 'self', 'hole', 'pecked', 'head-on', 'wall', 'starved', 'cut', 'SD: body', 'SD: self', 'SD: hole', 'SD: pecked', 'SD: starved', 'holes per SD round'],
  list.map(s => [s.label, ...['body', 'self', 'hole', 'pecked', 'head-on', 'wall', 'starved', 'cut'].map(k => c(s.causes, k)), ...['body', 'self', 'hole', 'pecked', 'starved'].map(k => c(s.causesSD, k)), s.holePerSD])));
const gl = g => g ? `${c(g.gapToLeave, 1)}/${c(g.gapToLeave, 2)}/${c(g.gapToLeave, 3)}/${c(g.gapToLeave, 4)}/${c(g.gapToLeave, '5+')} (joined ${c(g.gapToLeave, 'connected')})` : '';
const pg = g => g ? `${c(g.pairGaps, 1)}/${c(g.pairGaps, 2)}/${c(g.pairGaps, 3)}/${c(g.pairGaps, 4)}/${c(g.pairGaps, '5+')}` : '';
out.push('\n### Islands about 5 s before the end (and when two are left)\n\n' + tbl(
  ['variant', 'holes', 'islands (5+ cells)', 'biggest', 'a head\'s island: median (mid half)', 'heads sharing an island %', 'gap to leave a head\'s island, % of heads: 1/2/3/4/5+', 'gaps between islands, %: 1/2/3/4/5+', 'room under length %', 'two left: sharing %', 'two left: gap to leave 1/2/3/4/5+'],
  list.map(s => { const L = s.islandsLate, D = s.islandsDuel; return [s.label, L?.holes, L?.islands, L?.biggest, L ? `${L.headIsland} (${L.headIslandQ.join('-')})` : '', L?.sharedPct, gl(L), pg(L), L?.roomUnderLen, D?.sharedPct, gl(D)]; })));
out.push('\n### The end: boxed in, sealed, a lottery?\n\n' + tbl(
  ['variant', 'self-boxed alone a round (% SD deaths)', 'SD deaths in a pocket (room < length 1 s before) %', 'aims sealing someone a round', 'sealed, then out within 3 s a round (% SD deaths)', 'longest at arrival wins % (chance)', 'most room at arrival wins % (chance)', 'rounds separated %', 'biggest island wins % (chance)', 'two left: longer wins %', 'two left: duel length', 'last death: hole / self / body / other'],
  list.map(s => [s.label, `${s.selfBoxedPerRound} (${s.selfBoxedPctSD})`, s.pocketDeathPctSD, s.seals.perRound, `${s.seals.diedWithin3s} (${s.seals.shareOfSDDeaths3s})`, `${s.longestWins.hit} (${s.longestWins.chance})`, `${s.mostRoomWins.hit} (${s.mostRoomWins.chance})`, s.separated, `${s.biggestIslandWins.hit} (${s.biggestIslandWins.chance})`, s.duelLongerWins, s.duelLen,
    `${c(s.lastDeath, 'hole')} / ${c(s.lastDeath, 'self')} / ${c(s.lastDeath, 'body')} / ${Math.round(10 * (100 - c(s.lastDeath, 'hole') - c(s.lastDeath, 'self') - c(s.lastDeath, 'body'))) / 10}`])));
out.push('\n### Food and hunger\n\n' + tbl(
  ['variant', 'meals a snake-minute: 0-45 s / 45 s-SD / SD', 'median gap between meals: 0-45 / mid / SD (s)', '3rd quartile gap mid (s)', 'hunger warning %: 0-45 / mid / SD', 'hunger warning before SD %', 'length at 60 / 120 s', 'starved %'],
  list.map(s => [s.label, `${s.food_open.mealsPerMin} / ${s.food_mid.mealsPerMin} / ${s.food_sd.mealsPerMin}`, `${s.food_open.medianGap} / ${s.food_mid.medianGap} / ${s.food_sd.medianGap}`, s.food_mid.q3Gap, `${s.food_open.hungryPct} / ${s.food_mid.hungryPct} / ${s.food_sd.hungryPct}`, s.hungryBeforeSD, `${s.lenAt[60]} / ${s.lenAt[120]}`, s.starvedPct])));
out.push('\n### Beetles\n\n' + tbl(
  ['variant', 'out a round', 'caught a round', 'caught %', 'flew off / stayed home %', 'in SD a round', 'chase, near to caught (ticks, median / 3rd q)', 'spawn to caught (ticks)', 'dives a beetle', 'golden a round (caught)', 'golden leaps used a round', 'win spread'],
  list.map(s => { const b = s.beetles; return [s.label, b.perRound, b.caughtPerRound, b.caughtPct, b.flownPct, b.inSD, `${b.chaseTicks} / ${b.chaseQ3}`, b.spawnToCatch, b.dives, `${b.goldPerRound} (${b.goldCaughtPerRound})`, s.goldLeapsPerRound, `${s.winSpread[0]}-${s.winSpread[1]}`]; })));
out.push('\n### Win rates %\n\n' + tbl(['variant', 'per persona'], list.map(s => [s.label, Object.entries(s.win).map(([k, v]) => `${k} ${v}`).join(', ')])));
console.log(out.join('\n'));
const esc = e => e ? `${e.escaped} (dived ${e.dived}${e.dug ? `, dug ${e.dug}` : ''}, flew ${e.flown}; n ${e.n})` : '';
console.log('\n### Beetle escapes (each time one is above ground)\n\n' + tbl(
  ['variant', 'chased: escaped %', 'chased before 60 s', '60 s to SD', 'in SD', 'with 1 burrow open', '2 open', '3+ open', 'chase length near to end, ticks (caught / escaped)', 'not chased: flew off %'],
  list.filter(s => s.escapes).map(s => { const e = s.escapes; return [s.label, esc(e.chased), esc(e.chasedEarly), esc(e.chasedMid), esc(e.chasedSD), esc(e.chasedBurrows1), esc(e.chasedBurrows2), esc(e.chasedBurrows3), `${e.chaseTicks} (${e.chaseCaughtTicks} / ${e.chaseEscapedTicks})`, e.unchasedFlown]; })));
console.log('\n### Beetle escapes once a head was within 2 cells (a real chase)\n\n' + tbl(
  ['variant', 'escaped %', 'before 60 s', '60 s to SD', 'in SD', 'ticks from within 2 to the end'],
  list.filter(s => s.escapes?.close).map(s => { const e = s.escapes; return [s.label, esc(e.close), esc(e.closeEarly), esc(e.closeMid), esc(e.closeSD), e.closeTicks]; })));
console.log('\n### Tiny islands (1-2 cells)\n\n' + tbl(
  ['variant', '1-cell / 2-cell islands 5 s before the end', 'with food on them', 'at the end: 1 / 2-cell', 'cut off by strikes a SD round', 'of them with food on %', 'with a snake on %', 'SD length', 'SD meals a snake-minute', 'SD hunger warning %', 'SD starved % of SD deaths'],
  list.filter(s => s.tiny).map(s => [s.label, `${s.tiny.late1} / ${s.tiny.late2}`, s.tiny.lateWithFood, `${s.tiny.end1} / ${s.tiny.end2}`, s.tiny.madePerSD, s.tiny.madeFoodPct, s.tiny.madeSnakePct, s.sdLen, s.food_sd.mealsPerMin, s.food_sd.hungryPct, c(s.causesSD, 'starved')])));
console.log('\n### Hole shapes\n\n' + tbl(
  ['variant', 'strikes a SD', 'cells a strike', 'perimeter / least perimeter (1 = square-ish)', 'spur cells a strike', 'one-wide corridor cells a strike', 'strikes with a spur %', 'hollows 5 s before the end', 'their rim / least rim', 'land teeth (3+ sides hole or edge)', 'hole spur cells', 'SD length', 'islands (5+)', 'tiny islands 1 / 2'],
  list.filter(s => s.shape).map(s => [s.label, s.shape.strikes, s.shape.cells, s.shape.perimRatio, s.shape.spursPerStrike, s.shape.corridorPerStrike, s.shape.withSpurPct, s.shape.lateHollows, s.shape.lateRagged, s.shape.lateTeeth, s.shape.lateHoleSpurs, s.sdLen, s.islandsLate?.islands, s.tiny ? `${s.tiny.late1} / ${s.tiny.late2}` : ''])));
console.log('\n### Meals by kind, a snake-minute (0-45 s; 45 s to SD; SD)\n\n' + tbl(['variant', '0-45 s', '45 s-SD', 'SD'],
  list.filter(s => s.mealKinds).map(s => [s.label, ...['open', 'mid', 'sd'].map(p => Object.entries(s.mealKinds[p]).map(([k, v]) => `${k} ${v}`).join(', '))])));
