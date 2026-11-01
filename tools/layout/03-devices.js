for (const d of share('03', DEVICES)) {
  if (only && !d.name.includes(only)) continue;
  const tag = d.name;
  // ---------------------------------------------- the start card
  await open(d);
  const ready = await ev(LAYOUT);
  const upright = d.kind === 'upright', side = d.kind === 'side';
  board.push(`  ${d.name.padEnd(48)} ${String(d.before).padStart(4)} → ${r1(ready.board.w)}`);
  check(ready.board.w >= d.least && ready.board.w >= d.before - (d.under || 0), `${tag}: the board is at least ${d.least} px${d.under ? `, ${d.under} px under the ${d.before} before at most (the column's 244 px and the bird's gap)` : ''}`, `${r1(ready.board.w)} px, before ${d.before}`);
  if (d.main) check(ready.board.w >= d.main - 0.5, `${tag}: the board is no smaller than on main before the page was one screen tall, ${d.main} px (the owner's call: the help and the chatter give way instead)`, `${r1(ready.board.w)} px`);
  check(ready.scrollW <= ready.vw, `${tag}: nothing scrolls sideways`, `${ready.scrollW} of ${ready.vw}`);
  check(ready.scrollH <= ready.vh, `${tag}: nothing scrolls at all, the page one screen tall${side ? ', the column beside the board as tall as the screen' : ''}`, `${ready.scrollH} of ${ready.vh}`);
  if (upright && !d.short) check(ready.frame.x <= 0.5 && ready.frame.r >= ready.vw - 0.5 && ready.board.x <= 6 && ready.board.r >= ready.vw - 6, `${tag}: the board runs edge to edge, its frame a thin rim`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, board ${r1(ready.board.x)}-${r1(ready.board.r)} of ${ready.vw}`);
  // (too short for edge to edge: as big as fits over the row under it,
  // which is on the screen too, or as leaves the bird 13 px beside it.
  // Before the page was one screen tall: as big as fits the height, the
  // row and the chatter below the fold)
  const toFoot = ready.foot.y - ready.frame.b;
  if (d.short) check(Math.abs(ready.frame.x + ready.frame.r - ready.vw) < 1 && ready.foot.b <= ready.vh + 0.5 && toFoot >= 1.5 && (toFoot <= 6.5 || Math.abs(ready.frame.x - 13) < 0.6), `${tag}: too short for edge to edge, the board is as big as fits over the row under it (or leaves the woodpecker its 13 px beside the frame), centred, the row under it on the screen`, `frame ${r1(ready.frame.x)}-${r1(ready.frame.r)}, down to ${r1(ready.frame.b)}; the row under it ${r1(ready.foot.y)}-${r1(ready.foot.b)} of ${ready.vh}`);
  if (upright) check(ready.board.b <= ready.vh - (d.insets ? d.insets.bottom : 0) + 0.5, `${tag}: the whole board is on the first screen`, `down to ${r1(ready.board.b)} of ${ready.vh}`);
  if (upright) check(['header', 'tags'].every(k => Math.abs(ready[k].x - 12) < 0.5 && Math.abs(ready.vw - ready[k].r - 12) < 0.5), `${tag}: the header and the tags keep 12 px from the screen's edges`, ['header', 'tags'].map(k => `${k} ${r1(ready[k].x)}-${r1(ready[k].r)}`).join(', '));
  if (side) check((ready.frame.h >= ready.vh - (d.insets ? d.insets.top + d.insets.bottom : 0) - 0.5 || Math.abs(ready.frame.r - ready.vw + Math.max(12, d.insets ? d.insets.right : 0)) < 0.6) && ready.board.h >= ready.frame.h - 12, `${tag}: the board takes the full height less a thin rim (or, on a narrow screen, the width the column leaves it)`, `frame ${r1(ready.frame.h)} to ${r1(ready.frame.r)}, board ${r1(ready.board.h)} of ${ready.vw}×${ready.vh}`);
  if (side) {
    const cutDecor = ready.decor.filter(f => f.y < -0.5 || f.b > ready.vh + 0.5 || f.x < -0.5 || f.r > ready.vw + 0.5);
    check(!cutDecor.length, `${tag}: on its side, none of the frame's moss and leaves is cut off by the screen's edge`, cutDecor.map(f => `${f.what} ${r1(f.x)},${r1(f.y)}-${r1(f.r)},${r1(f.b)}`).join('; ') || `${ready.decor.length} shown`);
    const ring = await ev(`(() => { const m = getComputedStyle(document.querySelector('main')), p = document.getElementById('pause').getBoundingClientRect(), mb = document.querySelector('main').getBoundingClientRect(); return m.overflowX === 'visible' || p.left - 5 >= mb.left; })()`);
    check(ring, `${tag}: the nap button's focus ring isn't clipped at the column's edge`);
  }
  // (held upright, the row under the board right under it, 6 px (2 on a
  // short phone; the owner's playtest, "The phone gap": a ledge of 34 to
  // 49 px was between them, the bird's), the ledge laid out but 0 px
  // tall; elsewhere, no ledge)
  check(upright ? ready.ledge && ready.ledge.h < 0.5 && ready.foot.y - ready.frame.b <= 6.5 : !ready.ledge, `${tag}: ${upright ? 'the row under the board right under it, no ledge between them' : 'no ledge (room enough beside the board)'}`, upright ? `the row ${r1(ready.foot.y - ready.frame.b)} px under the frame, the ledge ${ready.ledge ? r1(ready.ledge.h) : 'not laid out'}` : ready.ledge ? `${r1(ready.ledge.h)} px` : 'none');
  if (d.insets) check(ready.header.y >= d.insets.top - 0.5 && ready.board.x >= d.insets.left - 0.5 && ready.board.r <= ready.vw - d.insets.right + 0.5 && (!side || ready.frame.b <= ready.vh - d.insets.bottom + 0.5), `${tag}: the page keeps inside the safe area`);

  // The header: its rows, its doors, the full-screen button, and what
  // the doors cost (headerChecks, above). With a mouse its buttons keep
  // their 10 px; at 320 px, with the title 8 px wider (as a livelier S
  // might make it), the buttons still have their row.
  await headerChecks(tag, d);
  if (d.desktop) {
    const gapNow = await ev(`getComputedStyle(document.querySelector('header')).columnGap`);
    check(gapNow === '10px', `${tag}: with a mouse, the header's buttons keep their 10 px apart`, gapNow);
  }
  if (d.w === 320) {
    await ev(`(() => { const st = document.createElement('style'); st.id = 'wider-title'; st.textContent = 'h1 { padding-right: 8px; }'; document.head.append(st); return 'ok'; })()`);
    await settle();
    const wider = await ev(HEADER);
    await ev(`document.getElementById('wider-title').remove(); 'ok'`);
    await settle();
    const buttons = wider.rows.find(r => r.includes('pause')) || '';
    check(!buttons.includes('title') && buttons.split(' ').length >= 5 && wider.rows.filter(r => r.includes('pause') || r.includes('mute')).length === 1, `${tag}: with the title 8 px wider, the buttons still have a row of their own`, wider.rows.join(' / '));
  }

  // Nothing cut off, and everything takes a tap: the header's buttons,
  // the name tags, the start card's buttons; and the chatter's switch,
  // in the row under the board, on the screen as it is (it used to be
  // scrolled to, held upright: the page ran past the screen).
  let reach = await ev(REACH('header .hud button, #scoreboard li, #overlay .buttons button'));
  check(reach.length >= 8 && reach.every(r => r.on && r.taps), `${tag}: the header's buttons, the name tags and the start card's buttons are on the screen and take a tap`, reach.filter(r => !r.on || !r.taps).map(r => r.what).join(', ') || `${reach.length} of them`);
  reach = await ev(REACH('#chatter-toggle'));
  check(reach.length === 1 && reach[0].on && reach[0].taps, `${tag}: the chatter's switch is on the screen and takes a tap, with nothing scrolled`);
  const sw = await ev(`(() => { const t = document.getElementById('chatter-toggle'); return { name: t.getAttribute('aria-labelledby') && document.getElementById(t.getAttribute('aria-labelledby')).textContent, tip: t.title, word: t.textContent.trim(), checked: t.getAttribute('aria-checked') }; })()`);
  check(sw.name === 'Bark chatter' && sw.tip === 'Bark chatter' && sw.word === 'On' && sw.checked === 'true', `${tag}: the chatter's switch, apart from the chatter's caption, is named "Bark chatter" in its tooltip and to a screen reader, and says On`, JSON.stringify(sw));
  check(ready.tags.x >= -0.5 && ready.tags.r <= ready.vw + 0.5 && (await ev(`[...document.querySelectorAll('#scoreboard li')].every(li => li.getBoundingClientRect().right <= document.getElementById('scoreboard').getBoundingClientRect().right + 0.5)`)), `${tag}: the name tags fit the width`);
  const boardHasCard = await ev(`(() => { const c = document.querySelector('#overlay .card').getBoundingClientRect(), g = document.getElementById('game').getBoundingClientRect(); return c.top >= g.top - 0.5 && c.bottom <= g.bottom + 0.5 && c.left >= g.left - 0.5 && c.right <= g.right + 0.5; })()`);
  check(boardHasCard, `${tag}: the start card fits on the board`);

  // ---------------------------------------------- a round, held still
  await toRound();
  const play = await ev(LAYOUT);
  check(await ev('SnakeDebug.state()') === 'running', `${tag}: a round gets going`);
  check(play.scrollW <= play.vw && play.scrollH <= play.vh, `${tag}: playing, nothing scrolls`, `${play.scrollW}×${play.scrollH} of ${play.vw}×${play.vh}`);
  reach = await ev(REACH('#chatter-toggle'));
  check(reach.length === 1 && reach[0].on && reach[0].taps, `${tag}: playing, the chatter's switch is on the screen and takes a tap`);
  check(!play.help || (play.help.b <= play.vh + 0.5 && play.help.r <= play.vw + 0.5 && play.help.y >= play.foot.y - 0.5 && play.help.b <= play.foot.b + 0.5), `${tag}: playing, the help line is on the screen, in the row under the board`, play.help ? `${r1(play.help.y)}-${r1(play.help.b)}, the row ${r1(play.foot.y)}-${r1(play.foot.b)} of ${play.vh}` : 'not shown');
  check(await ev(`(() => { const h = document.getElementById('help'); return h.scrollWidth <= h.clientWidth + 1; })()`), `${tag}: the help line isn't cut off at the side`);
  if (upright) {
    // (the page can't scroll while you play: a help line cut in half by the screen's edge is hidden)
    const whole = play.help.b <= play.vh + 0.5, gone = play.help.y >= play.vh - 0.5 || !play.helpShown;
    const lesson = await ev(`document.getElementById('toast').textContent`);
    check((whole || gone) && (whole || lesson === 'Tap jumps. Swipe ahead flashes.'), `${tag}: playing, the help under the board is wholly on the screen, or not shown and the first Go says how to jump and flash`,
      `${r1(play.help.y)}-${r1(play.help.b)} of ${play.vh}${play.helpShown ? '' : ', hidden'}; Go said "${lesson}"`);
  }

  // A banner while you play (DESIGN "Teaching by showing"): held upright,
  // one line over the header's title row, its words whole, never over the
  // board, your own tag or the pause button, inside the safe area;
  // elsewhere at the board's top or foot, never its middle.
  {
    const shown = [];
    for (const bn of BANNERS) shown.push({ text: bn[0], p: await ev(BANNER(bn)) });
    const wrong = shown.map(x => ({ ...x, why: bannerWrong(x.p, upright) })).filter(x => x.why.length);
    check(!wrong.length, upright ? `${tag}: playing, a banner is one line over the header's title row, its words whole, never over the board, your tag or the pause button` : `${tag}: playing, a banner is at the board's top or foot, never its middle`,
      wrong.map(x => `“${x.text}”: ${x.why.join(', ')}`).join('; ') || shown.map(x => `${x.p.above ? 'above' : x.p.mid < 0.5 ? 'top' : 'foot'} ${r1(x.p.box.y)}-${r1(x.p.box.b)}`).join(', '));
  }

  // The woodpecker perched, resting and eyeing its chunk, for spots all over the board.
  const perches = [];
  const rects = upright ? furnitureOf(play, true) : furnitureOf(play); // (held upright it stands over the row under the board and the chatter, its layer taking no taps; the moss and leaves that hung under the board are left off there)
  for (const [x, y] of SPOTS) for (const aim of [false, true]) perches.push({ x, y, aim, p: await ev(PERCH(x, y, aim, rects)) });
  const drawn = perches.filter(q => q.p);
  check(drawn.length === perches.length, `${tag}: the woodpecker is drawn for every spot`, `${drawn.length} of ${perches.length}`);
  const gutter = d.nowhere || d.short;
  const covers = drawn.filter(q => q.p.over > (gutter ? 4 : 0));
  check(!covers.length, `${tag}: perched (resting or eyeing its chunk), it never covers a cell${gutter ? ' (with room nowhere, its beak’s tip touches the edge, as before: 4 px at most)' : ''}`, covers.length ? covers.map(q => `${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${q.p.over} px`).join('; ') : `${drawn.length} perches`);
  const si = { left: 0, right: 0, top: 0, bottom: 0, ...d.insets }; // (inside the safe area, not just the screen: never under a notch)
  // (a phone on its side, Haakon for #270: the bird perches at full size,
  // partly off the screen: its beak, head and eye in the gap beside the
  // board, inside the safe area, its back and tail cut off by the screen's
  // edge on that side; there, that edge may cut it, never its eye)
  const cutPhone = side && Math.min(d.w, d.h) <= 500;
  const backOff = p => cutPhone && p.eye && (p.x >= play.board.r - 0.5 ? 'right' : p.r <= play.board.x + 0.5 ? 'left' : null);
  const eyeIn = p => p.eye.x >= si.left && p.eye.x <= play.vw - si.right && p.eye.y >= si.top && p.eye.y <= play.vh - si.bottom;
  const outside = p => { const k = backOff(p); return [...p.cut.filter(e => e !== k).map(e => `cut off at the screen's ${e}`), k && !eyeIn(p) && 'its eye off the screen', k && p.cut.includes(k) && p.inside?.includes(k) && `cut off by its layer inside the screen's ${k} (not by the screen's edge)`, p.x < si.left - 0.5 && k !== 'left' && 'left', p.r > play.vw - si.right + 0.5 && k !== 'right' && 'right', p.y < si.top - 0.5 && 'top', p.b > play.vh - si.bottom + 0.5 && 'bottom'].filter(Boolean); };
  const offWhy = q => [...outside(q.p), ...Object.keys(q.p.on).map(k => `${q.p.on[k]} px over the ${k}`)];
  const off = drawn.filter(q => offWhy(q).length);
  check(!off.length, `${tag}: perched, all of it is on the screen, inside its safe area, and off ${upright ? 'the tags and the header (it stands over the row under the board and the chatter)' : 'the tags, the chatter and the header'}`, off.map(q => `${q.x},${q.y}${q.aim ? ' eyeing' : ''}: ${offWhy(q).join(', ')} (${r1(q.p.x)},${r1(q.p.y)}-${r1(q.p.r)},${r1(q.p.b)})`).join('; '));
  const tall = drawn.map(q => q.p.h), small = Math.min(...tall);
  if (upright) {
    // (at full size, standing over the row under the board: the room
    // from the board down to the screen's foot, less its outline and
    // crouch, about 6 px; 53 px on a 390 px phone)
    const under = drawn.every(q => q.p.y >= play.board.b - 0.5), room = play.vh - si.bottom - play.board.b;
    const least = Math.min(48, room - 8), over = drawn.filter(q => q.p.b > play.foot.y + 1).length;
    check(under && small >= least, `${tag}: upright, it stands under the board, over the row under it, at least ${r1(least)} px tall (the room to the screen's foot allowing)`, `${r1(small)}-${r1(Math.max(...tall))} px tall; over the row in ${over} of ${drawn.length}`);
    const lets = await ev(`(() => { const L = document.getElementById('bird-layer'); return getComputedStyle(L).pointerEvents; })()`), reachUnder = await ev(REACH('#chatter-toggle, .chatter[aria-expanded] > .chatlog'));
    check(lets === 'none' && reachUnder.every(r => r.taps), `${tag}: upright, taps pass through the perched woodpecker to the row and the chatter`, `its layer's pointer-events ${lets}; ${reachUnder.map(r => `${r.what} ${r.taps ? 'takes a tap' : 'covered'}`).join(', ')}`);
  } else if (side) {
    const beside = drawn.every(q => q.p.r <= play.board.x + 0.5 || q.p.x >= play.board.r - 0.5);
    check(beside && small >= 30, `${tag}: on its side, it perches beside the board, at least 30 px tall`, `${r1(small)}-${r1(Math.max(...tall))} px tall`);
  }
  d.bird = `${r1(small)}-${r1(Math.max(...tall))}`;

  // Flying out to a spot at the board's edges and corners (from its own
  // perch, and from the far corner's), drumming it, lingering and flying
  // home, through its whole wingbeat: never cut off by the screen's edge
  // (nor by its own layer). To drum at the screen's edge it leans, turns
  // round or lies level, beak down (the bottom rows, with the board's
  // bottom at the screen's), and flying near the edge it keeps in from
  // it, a wing beating short of it.
  {
    const flights = [];
    for (const [x, y] of FLIGHT_SPOTS) for (const from of [[x, y], [23 - x, 23 - y]]) flights.push({ x, y, from, f: await ev(FLIGHT(x, y, from)) });
    const cuts = f => [...f.f.fly.map(e => ({ what: 'flying', e })), ...f.f.drum.map(e => ({ what: 'drumming', e }))];
    const say = (f, list) => `${f.x},${f.y} from ${f.from} ${[...new Set(list.map(c => c.what))].map(w => `${w} (${list.filter(c => c.what === w).map(c => c.e).join(', ')})`).join(', ')}`;
    const homeEdges = new Set(drawn.map(q => backOff(q.p)).filter(Boolean)); // (on a phone on its side, the edge its perch runs past: flying off it and home to it, cut there too)
    for (const f of flights) f.f.fly = f.f.fly.filter(e => !homeEdges.has(e));
    const cutOff = flights.filter(f => cuts(f).length);
    check(!cutOff.length, `${tag}: flying out to a spot at the board's edges and corners, drumming it and flying home, through the whole wingbeat, it isn't cut off by the screen's edge`, cutOff.map(f => `cut off: ${say(f, cuts(f))}`).join('; ') || `${flights.length} flights`);
  }

  await chatterFull(tag, false, d.insets, side, upright);
  await chatterScroll(tag, d.w / d.h >= 1.25 && d.h > 500 && d.h <= 1180 && d.w >= 480); // (style/screens.css: beside the board, not on a phone on its side)

  // A nap: its card fits, and its buttons take a tap.
  await ev(`window.__autoRaf = true; document.getElementById('pause').click(); 'ok'`);
  await b.sleep(150);
  reach = await ev(REACH('#overlay .buttons button'));
  check(await ev('SnakeDebug.state()') === 'paused' && reach.length >= 1 && reach.every(r => r.on && r.taps), `${tag}: the nap's card and its buttons take a tap`, reach.map(r => `${r.what}${r.on && r.taps ? '' : ' (cut off)'}`).join(', '));
  const errsPlaying = await ev(`__errs.join(' | ')`);

  // ---------------------------------------------- watching
  await open(d);
  await toRound('watch');
  const watch = await ev(LAYOUT);
  check(watch.scrollW <= watch.vw && watch.scrollH <= watch.vh, `${tag}: watching (the speed buttons showing), nothing scrolls`, `${watch.scrollW}×${watch.scrollH} of ${watch.vw}×${watch.vh}`);
  reach = await ev(REACH('#speed button'));
  check(reach.length === 3 && reach.every(r => r.on && r.taps) && watch.speed.y >= watch.foot.y - 0.5 && watch.speed.b <= watch.foot.b + 0.5, `${tag}: watching, the speed buttons are there, in the row under the board, on the screen, and take a tap`);
  const wp = [];
  for (const [x, y] of [[1, 22], [12, 22], [22, 22], [22, 1]]) wp.push(await ev(PERCH(x, y, true, furnitureOf(watch, upright))));
  check(wp.every(p => p && p.over <= (gutter ? 4 : 0) && !Object.keys(p.on).length && !outside(p).length), `${tag}: watching, the perched woodpecker covers no cell, keeps off ${upright ? 'the header and the tags (held upright it stands over the speed buttons, taps passing through)' : 'the speed buttons and the rest'}, and is all on the screen`, wp.map(p => (p ? `${p.over} px over cells${Object.keys(p.on).map(k => `, ${p.on[k]} over the ${k}`).join('')}${outside(p).length ? `, ${outside(p).join(', ')}` : ''}` : 'none')).join('; '));
  await chatterFull(tag, true, d.insets, side, upright);
  const errs = [errsPlaying, await ev(`__errs.join(' | ')`)].filter(Boolean).join(' | ');
  check(!errs, `${tag}: no error events on the page, playing or watching (a resize observer's loop, say)`, errs);
  await ev(`window.__autoRaf = true; 'ok'`);
}
