#!/usr/bin/env node
// The screenshot tour, in headless Chrome: every state of the game on a
// desktop window, a phone and a phone on its side.
//
//   node tools/shots.js [outDir]      (default: shots/)
//
// Your snake is steered by an autopilot (a rival's brain, through real key
// events) until a lively moment, then crashed on purpose.
const path = require('path');
const fs = require('fs');
const { launch, serve, HELPERS } = require('./browser');

const out = path.resolve(process.argv[2] || 'shots');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const site = await serve();
  const URL = site.url + '?debug';
  const b = await launch();
  const shot = async name => { await b.shot(path.join(out, name)); console.log('shot', name); };
  // Play until a lively moment with your snake alive (a few tries).
  const playUntil = async (ms, length, rivals) => {
    for (let attempt = 0; attempt < 6; attempt++) {
      await b.eval(`document.getElementById('start').click(); pilot.on = true; pilot.crash = false; 'ok'`);
      const ok = await b.eval(`waitFor(() => SnakeDebug.state() === 'over' || !me().alive || (SnakeDebug.game().time > ${ms} && me().body.length >= ${length} && SnakeDebug.game().snakes.filter(s => s.alive).length >= ${rivals}), 90000).then(() => me().alive && SnakeDebug.state() === 'running')`);
      if (ok) return;
    }
    throw new Error('could not stay alive long enough');
  };
  // A round with Star in it (beside Ouroboros and Desperado, the rivals
  // nearest it in colour), played until a dozen seconds in with you and Star
  // both still going (a few tries); false if Star never lasted.
  const starRound = async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      await b.eval(`SnakeDebug.setup(['star', 'ouroboros', 'desperado']); document.getElementById('start').click(); pilot.on = true; pilot.crash = false; 'ok'`);
      const ok = await b.eval(`(() => { const st = () => SnakeDebug.game().snakes.find(s => s.personaKey === 'star');
        return waitFor(() => SnakeDebug.state() === 'over' || !me().alive || !st().alive || SnakeDebug.game().time > 12000, 90000).then(() => me().alive && st().alive && SnakeDebug.state() === 'running'); })()`);
      if (ok) return true;
    }
    return false;
  };
  // Star, staged on that round as it mostly looks: part way through its
  // flash's rest, three of its points lit again (its tell counts down on
  // them; ready, it flashes at once, so a ready Star is a rare sight), its
  // rainbow trailing it; then holding golden jumps with its flash just spent
  // (its points dim and its brows knitted, the gold line round its points,
  // its pips past them).
  const starShots = async prefix => {
    if (!await starRound()) { console.log('no Star moment: it went out every time'); return; }
    await b.eval(`(() => { const g = SnakeDebug.game(), st = g.snakes.find(s => s.personaKey === 'star'); st.dashes = 0; st.flashReadyAt = g.time + 2400; return 1; })()`);
    await b.sleep(150);
    await shot(`${prefix}star.jpg`);
    await b.eval(`(() => { const g = SnakeDebug.game(), st = g.snakes.find(s => s.personaKey === 'star'); st.leaps = 2; st.dashes = 0; st.flashReadyAt = g.time + 5800; return 1; })()`);
    await b.sleep(400);
    await shot(`${prefix}star-gold.jpg`);
  };
  try {
    // ---------------------------------------------------------------- desktop
    await b.viewport(800, 800);
    await b.go(URL);
    await b.eval(HELPERS);
    await b.sleep(500);
    await shot('title.jpg');

    await playUntil(22000, 10, 3);
    await shot('gameplay.jpg');

    // Just after a bite: crumbs, the gulp, "+1" (a round where you go hungry first doesn't count: play on).
    for (let tries = 0; ; tries++) {
      const bit = await b.eval(`(() => { const n = me().eaten; return waitFor(() => me().eaten > n || !me().alive, 40000).then(() => me().alive); })()`);
      if (bit) break;
      if (tries === 3) throw new Error('could not catch a bite');
      await playUntil(22000, 10, 3);
    }
    await b.sleep(70);
    await shot('eating.jpg');

    // Powers on the board, staged on the live round: golden leaps and dashes
    // held at once (yours: sky round pips one side, ember diamonds the other,
    // ember dashes running along the gold; and a rival's golden leaps: a
    // rival given dashes uses them at once), then both your plain rests
    // cooling (the half-rings round your head), then a plain flash a moment
    // after it went (its ember streak).
    await b.eval(`(() => { const r = SnakeDebug.game().snakes.find(s => s.alive && s.persona); me().leaps = 2; me().dashes = 2; if (r) r.leaps = 3; return 1; })()`);
    await b.sleep(400);
    await shot('powers-held.jpg');
    await b.eval(`(() => { const g = SnakeDebug.game(); me().leaps = 0; me().dashes = 0; me().leapReadyAt = g.time + 2500; me().flashReadyAt = g.time + 4500; return 1; })()`);
    await b.sleep(300);
    await shot('powers-resting.jpg');
    const flashed = await b.eval(`(() => { const g = SnakeDebug.game(); me().flashReadyAt = 0; SnakeEngine.flash(g, me()); return waitFor(() => me().flashReadyAt > 0 || !me().alive, 3000).then(() => me().alive); })()`);
    if (flashed) { await b.sleep(60); await shot('powers-flash.jpg'); }

    // A nap over a live board, then back (waking takes a beat).
    await b.key('p');
    await b.sleep(450);
    await shot('pause.jpg');
    await b.key('p');
    await b.eval(`running()`);
    await b.sleep(200);

    // Crash on purpose: the freeze-frame, then the death card.
    await b.eval(`pilot.crash = true; waitFor(() => !me().alive, 20000).then(() => 1)`);
    await b.sleep(120);
    await shot('death.jpg');
    await b.eval(`waitFor(cardUp, 5000).then(() => 1)`);
    await b.sleep(450);
    await shot('death-card.jpg');

    // Watch the rest at 4x until someone wins, with a beetle and sudden death if they come.
    await b.eval(`pilot.on = false; document.getElementById('watch').click(); 'ok'`);
    await b.eval(`running()`);
    await b.key('3');
    const beetle = await b.eval(`waitFor(() => SnakeDebug.state() === 'over' || SnakeDebug.game().food.some(f => f.kind === 'beetle'), 90000).then(() => SnakeDebug.game().food.some(f => f.kind === 'beetle')).catch(() => false)`);
    if (beetle) { await b.sleep(250); await shot('beetle.jpg'); }
    const late = await b.eval(`waitFor(() => SnakeDebug.state() === 'over' || SnakeDebug.game().time > TUNING.SUDDEN_DEATH_MS + 6000, 240000).then(() => SnakeDebug.state() !== 'over')`);
    if (late) await shot('sudden-death.jpg');
    await b.eval(`waitFor(() => SnakeDebug.state() === 'over' && cardUp(), 240000).then(() => 1)`);
    await b.sleep(500);
    await shot('game-over.jpg');

    await b.eval(`document.getElementById('records-open').click(); 'ok'`);
    await b.sleep(400);
    await shot('hall-of-fame.jpg');
    await b.eval(`document.querySelector('#records .tab[data-tab="stats"]')?.click(); 'ok'`);
    await b.sleep(300);
    await shot('your-story.jpg');
    await b.eval(`document.querySelector('#records .tab[data-tab="guide"]')?.click(); 'ok'`); // (the Field guide: every picture drawn by the renderer)
    await b.sleep(300);
    await shot('field-guide.jpg');
    await b.eval(`(() => { const card = document.querySelector('#records .records-card'); if (card) card.scrollTop = card.scrollHeight; return 'ok'; })()`); // (the card scrolls, not its body)
    await b.sleep(200);
    await shot('field-guide-end.jpg');
    await b.key('Escape');
    await b.sleep(300);

    await b.eval(`document.getElementById('friends').click(); 'ok'`);
    await b.sleep(800);
    await shot('friends.jpg');

    await b.go(URL);
    await b.eval(HELPERS);
    await starShots('');

    // ----------------------------------------------------------------- a laptop
    await b.viewport(1280, 720);
    await b.go(URL);
    await b.eval(HELPERS);
    await playUntil(12000, 6, 3);
    await shot('laptop-gameplay.jpg');

    // ----------------------------------------------------------------- a phone
    await b.viewport(375, 812, { scale: 2, mobile: true });
    await b.go(URL);
    await b.eval(HELPERS);
    await b.sleep(500);
    await shot('mobile-title.jpg');
    await playUntil(18000, 8, 2);
    await shot('mobile-gameplay.jpg');
    await b.eval(`(() => { const g = SnakeDebug.game(); me().leapReadyAt = g.time + 2500; me().flashReadyAt = g.time + 4500; return 1; })()`);
    await b.sleep(300);
    await shot('mobile-powers-resting.jpg'); // (your two rests, at phone size)
    await b.eval(`pilot.crash = true; waitFor(() => !me().alive, 20000).then(() => waitFor(cardUp, 5000)).then(() => 1)`);
    await b.sleep(450);
    await shot('mobile-death.jpg');
    await b.go(URL);
    await b.eval(HELPERS);
    await starShots('mobile-');

    // ------------------------------------------------------ a phone on its side
    await b.viewport(812, 375, { scale: 2, mobile: true });
    await b.go(URL);
    await b.eval(HELPERS);
    await b.eval(`document.getElementById('start').click(); pilot.on = true; 'ok'`);
    await b.sleep(6000);
    await shot('mobile-landscape.jpg');

    if (b.errors.length) console.log('page errors:', b.errors);
  } finally {
    await b.close();
    site.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
