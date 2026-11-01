// ------------------------------------ on its side, the help giving way
// Watching, the chatter full, on more short screens on their side: where
// a row of words fits beside the help, it stays (780×340, a notched
// 844×340: it gave way on every screen up to 340 px tall); where none
// does (a notched 780×330), it gives the chatter its room.
for (const [w, h, dpr, insets] of [[780, 340, 3], [844, 340, 3, notchSide], [780, 330, 3, notchSide]]) {
  const name = `${w}×${h} on its side${insets ? ' with a notch' : ''}`;
  if (only && !name.includes(only)) continue;
  await open({ w, h, dpr, insets, nofs: !!insets });
  await toRound('watch');
  await chatterFull(name, true, insets, true);
  await ev(`window.__autoRaf = true; 'ok'`);
}

// ------------------------------- on its side, a board narrower than tall
// On a screen under about 600 px wide on its side the board is as wide as
// the column leaves it, shorter than the screen, so there's room under
// it. Perched (resting and eyeing its chunk) for spots all over the board,
// the woodpecker never covers a cell and is all on the screen (on a phone,
// where its bigger size since #270 no longer fits under the board, beside
// it with its back off the screen's edge, never its eye): below the
// board it stands as on the ledge, its crown just under the board,
// looking up only a little. (With a little less room than all of it
// needed, pushed back onto the screen, it hung over the bottom row; and
// eyeing a chunk from under the board its head turned up over it.)
for (const [w, h, dpr] of [[480, 320, 2], [540, 320, 2], [600, 360, 2]]) {
  const name = `${w}×${h} on its side`;
  if (only && !name.includes(only)) continue;
  await open({ w, h, dpr, nofs: true });
  await toRound();
  const l = await ev(LAYOUT), ps = [];
  for (const [x, y] of SPOTS) for (const aim of [false, true]) ps.push({ x, y, aim, p: await ev(PERCH(x, y, aim, furnitureOf(l))) });
  // (a phone, its bird a size bigger since #270: where it no longer stands under the board it perches beside it, partly off the screen, Haakon's answer: its back cut off by the screen's edge on that side, never its eye)
  const back = p => Math.min(w, h) <= 500 && p.eye && (p.x >= l.board.r - 0.5 ? 'right' : p.r <= l.board.x + 0.5 ? 'left' : null);
  const eyeOn = p => p.eye.x >= 0 && p.eye.x <= l.vw && p.eye.y >= 0 && p.eye.y <= l.vh;
  const bad = ps.filter(q => { if (!q.p) return true; const k = back(q.p); return q.p.over || q.p.cut.some(e => e !== k) || (k && !eyeOn(q.p)) || Object.keys(q.p.on).length || (q.p.x < -0.5 && k !== 'left') || (q.p.r > l.vw + 0.5 && k !== 'right') || q.p.y < -0.5 || q.p.b > l.vh + 0.5; });
  const under = ps.filter(q => q.p && q.p.y >= l.board.b - 0.5).length;
  check(!bad.length, `${name}: perched, resting or eyeing its chunk, the woodpecker never covers a cell, and is all on the screen and off the column`,
    bad.map(q => `${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${q.p ? `${q.p.over} px over the cells${q.p.cut.length ? ', cut off' : ''}${Object.keys(q.p.on).map(k => `, over the ${k}`).join('')}` : 'not drawn'}`).join('; ') || `${ps.length} perches, ${under} of them under the board`);
  await ev(`window.__autoRaf = true; 'ok'`);
}

// ------------------------------------------- a browser without svh or dvh
// (Safari before 15.4, Chrome before 108): the board, its frame and the
// ledge are as they are with them (here svh, dvh and vh are the same).
for (const d of [CALLS, sized(375, 548), CALLS_SIDE, DEVICES.find(x => x.kind === 'side' && x.insets && x.w === 844)]) {
  if (only && !d.name.includes(only)) continue;
  await open(d);
  const was = await ev(LAYOUT), units = await ev(NO_SVH), now = await ev(LAYOUT);
  const same = ['board', 'frame', 'ledge'].every(k => (!was[k] && !now[k]) || (was[k] && now[k] && ['x', 'y', 'w', 'h'].every(m => Math.abs(was[k][m] - now[k][m]) < 0.6)));
  const say = q => (q ? `${r1(q.w)}×${r1(q.h)} at ${r1(q.x)},${r1(q.y)}` : 'none');
  check(units > 0 && same, `${d.name}: in a browser without svh or dvh, the board, its frame and the ledge are as they are with them`, ['board', 'ledge'].map(k => `${k} ${say(now[k])} (with them: ${say(was[k])})`).join('; '));
}
