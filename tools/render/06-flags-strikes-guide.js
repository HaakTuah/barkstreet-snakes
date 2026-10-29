// A pecked flag is a lost colony (round six A). The woodpecker pecks out
// the cell under Colonist's second colony's flag, and under Sovereign's
// capital; a tick later Colonist forgets the colony and Sovereign's realm
// moves, as the rules have it. The flag doesn't vanish: it's still there
// just after the peck, tips over (its ensign's navy lower) and is gone
// into the pit a moment later, the other colony's flag standing; the
// lost land shrinks away into the pit (its far edge before its near
// one); and the banner is carried from the old capital (between the two,
// part way) to the new one, not jumping there.
const lost = await ev(`(() => {
  seeds(44);
  SnakeDebug.pinQuality(0);
  const centre = (x, y, w, h, is) => { const p = pixels(x, y, w, h); let n = 0, sx = 0, sy = 0; for (let i = 0; i < p.data.length; i += 4) if (is(p.data[i], p.data[i + 1], p.data[i + 2])) { n++; sx += (i / 4) % p.width; sy += Math.floor(i / 4 / p.width); } return n ? [n, +(x + sx / n / p.width * w).toFixed(2), +(y + sy / n / p.height * h).toFixed(2)] : [0]; };
  const navy = (r, g, b) => b > 80 && r < 40 && g < 60, cream = (r, g, b) => r > 225 && g > 215 && b > 180;
  const g = stage(['colonist', 'sovereign', 'mason']), [you, col, sov, ma] = g.snakes;
  setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
  setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
  setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 21]), 'right');
  setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right');
  col.memory.colonies = [{ x: 5, y: 8, radius: 3, n: 1 }, { x: 12, y: 7, radius: 3, n: 2 }];
  sov.memory.home = { x: 17, y: 15, radius: 4 };
  show(g); drawN(30, 0.5, 60);
  const flag = () => centre(11.5, 5.4, 2.6, 2.8, navy), banner = (x0, x1) => centre(x0, 13, x1 - x0, 3, cream);
  const out = { before: { flag: flag(), other: centre(4.5, 5.4, 2.6, 2.8, navy) } };
  for (const k of [7 * 24 + 12, 7 * 24 + 13, 8 * 24 + 12, 15 * 24 + 17, 15 * 24 + 16, 16 * 24 + 17]) g.holes.add(k);
  g.tick++; R.onTick([{ type: 'peck', x: 12, y: 7, cells: [7 * 24 + 12] }]);
  drawN(1, 0.5, 60);
  out.pecked = { flag: flag() };
  drawN(1, 0.5, 60); // (a tick later: forgotten, and moved)
  col.memory.colonies = [col.memory.colonies[0]]; sov.memory.home = { x: 12, y: 14, radius: 4 }; g.tick++;
  drawN(2, 0.5, 60);
  out.tipping = { flag: flag() };
  drawN(1, 0.5, 60);
  out.shrinking = { far: R.landShown(col, 9, 7), near: R.landShown(col, 11, 7) }; // (three cells from the pit, and one)
  drawN(3, 0.5, 60);
  out.carried = banner(12.6, 18.4); // (about half way)
  drawN(20, 0.5, 60);
  out.after = { flag: flag(), other: centre(4.5, 5.4, 2.6, 2.8, navy), land: R.landShown(col, 11, 7), banner: banner(11, 14.4) };
  SnakeDebug.pinQuality(2);
  return out;
})()`);
const lf = lost;
check(lf.before.flag[0] > 20 && lf.pecked.flag[0] > 20 && lf.tipping.flag[0] > 5 && lf.tipping.flag[2] > lf.pecked.flag[2] + 0.1 && lf.after.flag[0] === 0 && lf.after.other[0] > 10,
  'a colony’s flag pecked out tips over and falls into the pit; the other colony’s stands', `its ensign’s navy (pixels, y): ${lf.before.flag.join(' at ')} before, ${lf.pecked.flag.join(' at ')} just after the peck, ${lf.tipping.flag.join(' at ')} tipping, ${lf.after.flag[0]} after; the other ${lf.after.other[0]}`);
check(!lf.shrinking.far && lf.shrinking.near && !lf.after.land, 'its land shrinks away into the pit', `three cells from the pit ${lf.shrinking.far ? 'still there' : 'gone'} while the cell beside it is ${lf.shrinking.near ? 'still there' : 'gone'}; ${lf.after.land ? 'some left' : 'all gone'} after`);
check(lf.carried[0] > 10 && lf.carried[1] > 13.5 && lf.carried[1] < 16.8 && lf.after.banner[0] > 10 && Math.abs(lf.after.banner[1] - 12.9) < 0.6,
  'Sovereign’s banner is carried to its new capital', `its parchment part way at x ${lf.carried[1]} (${lf.carried[0]} pixels; from 17 to 12), then at ${lf.after.banner[1]}`);

// A strike that doesn't stutter (round six A): the land a strike will
// leave is made ahead while the woodpecker aims, and swapped in at the
// strike. Sovereign's realm and Colonist's colony meet (dashed sides
// between them), and the patch cuts both. Made ahead, the board just
// after the strike is the very one made at the strike (the old way, with
// making ahead switched off), pixel for pixel; and with the land changing
// otherwise as it strikes (Sovereign's realm growing a ring), it's made
// the old way then, and still the same. (The land's part of the board,
// clear of the snakes, whose blinks come when they will; with reduced
// motion, so nothing else moves between the two; each after one of its
// own first, so the flags are the same.)
const ahead = await ev(`(() => {
  seeds(45);
  SnakeDebug.pinQuality(2);
  R.setReducedMotion(true);
  const g = stage(['colonist', 'sovereign', 'mason']), [you, col, sov, ma] = g.snakes;
  setBody(you, [[2, 22], [1, 22], [0, 22]], 'right');
  setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
  setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 21]), 'right');
  setBody(ma, [[2, 18], [1, 18], [0, 18]], 'right');
  col.memory.colonies = [{ x: 8, y: 10, radius: 3, n: 1 }];
  sov.memory.home = { x: 14, y: 11, radius: 4 };
  for (const k of [3 * 24 + 20, 4 * 24 + 20, 4 * 24 + 21]) g.holes.add(k);
  show(g); drawN(10, 0.5, 60);
  const P = [];
  for (let y = 9; y <= 12; y++) for (let x = 10; x <= 12; x++) P.push(y * 24 + x); // (across the line where they meet)
  const board = () => pixels(4, 5, 17, 13).data;
  const strike = (on, grow) => {
    R.prebuild(on);
    g.woodpecker = { x: 11, y: 10, at: g.time, target: P.slice(), strikeAt: g.tick + 17, last: [], struckAt: -1, restUntil: 1e9, pecks: 1 };
    drawN(30, 0.5, 60);
    const ready = R.prebuilt;
    for (const k of P) g.holes.add(k);
    g.woodpecker = null;
    if (grow) sov.memory.home = { x: 14, y: 11, radius: 5 };
    g.tick++; drawN(1, 0.5, 60);
    const out = { ready, px: board(), cut: R.landShown(sov, 12, 11) || R.landShown(col, 10, 10) };
    for (const k of P) g.holes.delete(k);
    sov.memory.home = { x: 14, y: 11, radius: 4 };
    g.tick++; drawN(10, 0.5, 60);
    return out;
  };
  const differ = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
  strike(true, false);
  const made = strike(true, false), old = strike(false, false);
  strike(true, true);
  const madeGrow = strike(true, true), oldGrow = strike(false, true);
  R.prebuild(true); R.setReducedMotion(false);
  return { ready: made.ready, cut: made.cut, n: differ(made.px, old.px), growReady: madeGrow.ready, nGrow: differ(madeGrow.px, oldGrow.px), changed: differ(made.px, madeGrow.px), pixels: made.px.length / 4 };
})()`);
check(ahead.ready && !ahead.cut && ahead.n === 0, 'the land a strike leaves, made ahead while the woodpecker aims, is the very land made at the strike', `${ahead.ready ? 'made ahead' : 'not made ahead'}; ${ahead.cut ? 'the patch still shows as land' : 'the patch is no land'} after it; ${ahead.n} of ${ahead.pixels * 4} values differ from it made at the strike`);
check(ahead.growReady && ahead.changed > 0 && ahead.nGrow === 0, 'with the land changing otherwise as it strikes, it’s made the old way, and is the same', `${ahead.nGrow} values differ from it made at the strike (the realm grown: ${ahead.changed} from the board without)`);

// The Field guide's pictures.
const guide = await ev(`(() => {
  seeds(46);
  const out = {};
  for (const k of ['apple', 'golden', 'mushroom', 'goldcap', 'leaf', 'beetle', 'goldbeetle', 'pellet', 'roast', 'baked', 'jump', 'flash', 'wrap', 'held', 'rests', 'hole', 'fire', 'land', 'squash', 'cut', 'failflash', 'lostflag', 'dig', 'knock', 'basic-win', 'basic-steer', 'basic-crash', 'basic-hunger']) {
    const c = R.guideSprite(k, 72), d = c.getContext('2d').getImageData(0, 0, 72, 72).data;
    let ink = 0, sky = 0, ember = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 200) ink++;
      if (d[i + 3] > 200 && Math.abs(d[i] - 168) < 30 && Math.abs(d[i + 1] - 220) < 30 && Math.abs(d[i + 2] - 245) < 30) sky++;
      if (d[i + 3] > 200 && Math.abs(d[i] - 247) < 30 && Math.abs(d[i + 1] - 168) < 30 && Math.abs(d[i + 2] - 102) < 30) ember++;
    }
    out[k] = { ink, sky, ember, edge: d[(36 * 72 + 2) * 4 + 3] };
  }
  return out;
})()`);
check(Object.values(guide).every(g => g.ink > 200), 'every Field guide picture draws', Object.entries(guide).filter(([, g]) => g.ink <= 200).map(([k]) => k).join(', ') || 'all');
check(guide.mushroom.edge > 200, 'the guide’s mushroom is on bark');
check(guide.held.sky > 0 && guide.held.ember > 0 && guide.rests.sky > 0 && guide.rests.ember > 0, 'the guide shows golden pips and your rests', `held ${guide.held.sky}/${guide.held.ember}, rests ${guide.rests.sky}/${guide.rests.ember} sky/ember pixels`);

// The next round's stretch of log, made ahead: once nothing has been
// drawn for a moment, the renderer asks to build its bark and leaf
// shadows in idle time, and a round starting takes them. Made then (its
// seed the first number drawn from S) and taken by a round starting (whose
// own seed, had it built its log itself, would have come from elsewhere),
// the board is the very one a round builds itself from S, bark and leaf
// shadows (lively, at full quality), and not another seed's. Each round
// is started and drawn the same way, after another: the same board
// afresh, as stage() makes one (new snakes, so their blinks and eyes start
// again), its first frame a second after the last.
const START = `const S = ${SEED} * 1000 + 901, start = seed => {
  __reseed(S + 5);
  const g = E.createGame({ withPlayer: true, personas: ['gobbler', 'ghost', 'mason'] }); g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.snakes.forEach((s, i) => setBody(s, [[2 + 4 * i, 23], [1 + 4 * i, 23], [4 * i, 23]], 'right'));
  const c = document.getElementById('game'); __t = 9e6 - 1000; R.frame(0.5, __t); R.setViewer(0); __reseed(seed); R.setGame(g); __reseed(S + 2); __t = 9e6; drawN(5);
  return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };`;
await ev(`(() => { seeds(46); SnakeDebug.pinQuality(2); show(stage(['gobbler', 'ghost', 'mason'])); ${START} start(S + 4); window.__nextLog = null; return 'ok'; })()`);
const asked = await ev(`new Promise(r => { const t0 = performance.now(); (function f() { if (window.__nextLog || performance.now() - t0 > 8000) r(!!window.__nextLog); else setTimeout(f, 50); })(); })`);
const log = !asked ? null : await ev(`(() => {
  ${START}
  __reseed(S); __nextLog(); // (made now, as in idle time)
  const idle = start(S + 3), direct = start(S), other = start(S + 1), W = document.getElementById('game').width;
  const differ = (a, b) => { let n = 0, x0 = W, y0 = W, x1 = -1, y1 = -1; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 6) { n++; const x = (i / 4) % W, y = Math.floor(i / 4 / W); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const cell = v => (v / W * TUNING.GRID).toFixed(1); return { n, where: n ? cell(x0) + '-' + cell(x1) + ' across, ' + cell(y0) + '-' + cell(y1) + ' down' : '' }; };
  return { pixels: idle.length / 4, idle: differ(idle, direct), other: differ(other, direct).n };
})()`);
check(!!log && log.idle.n === 0 && log.other > log.pixels / 4, 'the next round’s log, made ahead in idle time, is the very bark and leaf shadows a round builds itself from the same seed',
  !log ? 'the renderer never asked for it in idle time' : `${log.idle.n} of ${log.pixels} pixels differ from it built directly${log.idle.n ? ` (cells ${log.idle.where})` : ''}; another seed’s, ${log.other}`);
