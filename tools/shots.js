#!/usr/bin/env node
// The screenshot tour, in headless Chrome: every state of the game on a
// desktop window, a phone and a phone on its side.
//
//   node tools/shots.js [outDir]      (default: shots/)
//   node tools/shots.js [outDir] --staged [jump,dig,...]
//      (only the staged shots, at the sizes the looks are checked at: a
//      desktop window at 2x, a phone both ways at 3x, and the desktop with
//      reduced motion; all of them, or the ones named)
//
// Your snake is steered by an autopilot (a rival's brain, through real key
// events) until a lively moment, then crashed on purpose. Moments too rare
// to wait for (round six A's jumps, bridges, Star's gag, a choke, a pecked
// flag, a beetle digging in, the woodpecker's knock) are staged on a still
// board, on the desktop and the phone.
const path = require('path');
const fs = require('fs');
const { launch, serve, HELPERS } = require('./browser');

const argv = process.argv.slice(2), st = argv.indexOf('--staged'), STAGED_ONLY = st >= 0;
const ONLY = STAGED_ONLY && argv[st + 1] && !argv[st + 1].startsWith('--') ? argv.splice(st, 2)[1].split(',') : (STAGED_ONLY && argv.splice(st, 1), null);
const out = path.resolve(argv[0] || 'shots');
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
  // Round six A's looks, staged on a still board (the page's own loop
  // stopped, frames drawn by hand on a clock of their own, as render-test
  // does): a jump at its top over a body (jump), bodies over holes and a
  // tail hanging into one (bridge), Star half way through its mustache gag
  // beside Copycat's stick-on one (star-gag), a choke and a cough (choke), a
  // pecked colony's flag falling into its pit and Sovereign's banner carried
  // to its new capital (flag). (The board only: the tags round it are the
  // page's own round's.)
  const stagedShots = async prefix => {
    await b.go(URL);
    await b.eval(`(() => {
      window.__autoRaf = false;
      window.E = SnakeEngine; window.R = SnakeRender;
      window.__t = performance.now() + 1e6;
      window.drawN = (n, alpha = 0.5, step = 33) => { for (let i = 0; i < n; i++) { __t += step; R.frame(alpha, __t); } return n; };
      window.setBody = (s, cells, dir) => { s.body = cells.map(([x, y]) => ({ x, y })); s.prev = s.body.map(c => ({ ...c })); s.dir = E.DIRS[dir]; s.queue = []; s.planned = null; };
      window.stage = personas => { const g = E.createGame({ withPlayer: true, personas }); g.food = []; g.time = 60000; g.tick = 500; g.weather.until = 1e12; g.snakes.forEach((s, i) => { setBody(s, [[2 + 4 * i, 23], [1 + 4 * i, 23], [4 * i, 23]], 'right'); s.nextStarve = 1e15; }); return g; };
      window.show = g => { document.getElementById('overlay').classList.add('hidden'); R.setViewer(0); R.setGame(g); return g; };
      window.doStep = g => { for (const s of g.snakes) s.prev = s.body.map(c => ({ ...c })); E.step(g); g.food.length = 0; R.onTick(g.events); };
      // (where the woodpecker's strike knocks food: the engine's own rule, or, where the engine here has none, a stand-in by it)
      E.knockTo ||= (g, x, y, cells) => {
        const N = TUNING.GRID, mark = new Set(cells), busy = new Set();
        for (const s of g.snakes) if (s.alive) for (const c of s.body) busy.add(c.y * N + c.x);
        for (const f of g.food) busy.add(f.y * N + f.x);
        let best = null, bd = Infinity, bm = Infinity;
        for (let k = 0; k < N * N; k++) {
          const f = g.fires.get(k);
          if (mark.has(k) || busy.has(k) || g.holes.has(k) || (f && g.tick >= f.from && g.tick < f.until)) continue;
          const cx = k % N, cy = (k - cx) / N, d = Math.hypot(cx - x, cy - y), m = Math.abs(cx - (N - 1) / 2) + Math.abs(cy - (N - 1) / 2);
          if (d < bd - 1e-9 || (Math.abs(d - bd) < 1e-9 && m < bm)) { best = { x: cx, y: cy }; bd = d; bm = m; }
        }
        return best;
      };
      // The woodpecker aiming at a patch with food in it (an apple, a golden apple, a beetle), in sudden death.
      window.knockBoard = () => {
        const g = stage(['gobbler', 'sniper', 'copycat']), [you, gob, sn, cc] = g.snakes;
        setBody(you, Array.from({ length: 9 }, (_, i) => [5, 4 + i]), 'up');
        setBody(gob, Array.from({ length: 9 }, (_, i) => [18, 18 - i]), 'down');
        setBody(sn, Array.from({ length: 8 }, (_, i) => [15 - i, 20]), 'right');
        setBody(cc, Array.from({ length: 8 }, (_, i) => [9 + i, 4]), 'left'); cc.memory.modelId = sn.id;
        for (const [x, y] of [[3, 17], [4, 17], [3, 18], [20, 6], [21, 6], [21, 7]]) g.holes.add(y * 24 + x);
        const P = [];
        for (let y = 10; y <= 13; y++) for (let x = 10; x <= 13; x++) if (!(x === 13 && y === 13)) P.push(y * 24 + x);
        g.food.push({ x: 11, y: 11, kind: 'food', expires: g.tick + 900 }, { x: 12, y: 13, kind: 'golden', expires: g.tick + 900 }, { x: 16, y: 9, kind: 'food', expires: g.tick + 900 });
        g.food.push({ x: 13, y: 11, kind: 'beetle', dir: E.DIRS.up, movedAt: g.tick - 40, expires: g.tick + 900, scared: true });
        g.time = 140000;
        g.woodpecker = { x: 11.5, y: 11.5, at: g.time - 6000, target: P, strikeAt: g.tick + 5, last: [], struckAt: -1, restUntil: 1e9, pecks: 3 };
        return g;
      };
      return 'ok';
    })()`);
    const STAGED = {
      jump: `(() => {
        const g = stage(['gobbler', 'sniper', 'mason']), [you, gob, sn, ma] = g.snakes;
        setBody(you, Array.from({ length: 9 }, (_, i) => [9 - i, 12]), 'right'); you.leapReadyAt = 0;
        setBody(gob, Array.from({ length: 12 }, (_, i) => [10, 17 - i]), 'up');
        setBody(sn, Array.from({ length: 10 }, (_, i) => [20, 3 + i]), 'up');
        setBody(ma, Array.from({ length: 8 }, (_, i) => [15 - i, 20]), 'right');
        show(g); drawN(10, 1);
        E.leap(g, you);
        for (const al of [0.25, 0.5, 0.75]) drawN(1, al, 30);
        doStep(g);
        for (const al of [0, 0.25, 0.5]) drawN(1, al, 30);
      })()`,
      bridge: `(() => {
        const g = stage(['sniper', 'ghost', 'mason']), [you, sn, gh, ma] = g.snakes;
        for (const y of [9, 10, 11, 12, 13]) for (const x of [11, 12]) g.holes.add(y * 24 + x);
        g.holes.add(17 * 24 + 6); g.holes.add(17 * 24 + 7);
        setBody(you, Array.from({ length: 10 }, (_, i) => [16 - i, 11]), 'right');
        setBody(sn, Array.from({ length: 9 }, (_, i) => [8 + i, 13]), 'left');
        setBody(gh, [[4, 17], [5, 17], [6, 17]], 'left');
        setBody(ma, Array.from({ length: 8 }, (_, i) => [20, 4 + i]), 'up');
        show(g); drawN(12, 0.5);
      })()`,
      'star-gag': `(() => {
        const g = stage(['star', 'copycat', 'mason']), [you, st, cc, ma] = g.snakes;
        setBody(st, Array.from({ length: 9 }, (_, i) => [9, 11 - i]), 'down'); st.flashReadyAt = g.time + 3000;
        setBody(cc, Array.from({ length: 9 }, (_, i) => [14 - i, 15]), 'right'); cc.memory.modelId = st.id;
        setBody(you, Array.from({ length: 6 }, (_, i) => [17, 6 + i]), 'up');
        show(g); drawN(20);
        R.flick(st, 0.5); R.flick(cc, 0.5); drawN(1, 0.5, 0.01);
      })()`,
      choke: `(() => {
        const g = stage(['gobbler', 'mason', 'ghost']), [you, gob, ma, gh] = g.snakes;
        setBody(you, Array.from({ length: 8 }, (_, i) => [11 - i, 9]), 'right');
        setBody(gob, Array.from({ length: 8 }, (_, i) => [11 - i, 14]), 'right');
        setBody(ma, Array.from({ length: 6 }, (_, i) => [18, 4 + i]), 'up');
        g.food.push({ x: 11, y: 11, kind: 'pellet', color: you.color, owner: you.id, expires: g.tick + 900 });
        g.food.push({ x: 13, y: 14, kind: 'food', expires: g.tick + 900 });
        gob.coughUntil = g.tick + 30; // (Gobbler's been coughing a while, its mouth shut by an apple right ahead: a puff on its way out)
        show(g); drawN(16, 0.5);
        g.tick++; you.coughUntil = g.tick + 9;
        R.onTick([{ type: 'choke', snake: you, x: 12, y: 9, tx: 11, ty: 11 }]); // (you gag and spit your bead aside)
        drawN(2, 0.5, 40);
      })()`,
      dig: `(() => {
        const g = stage(['gobbler', 'sniper', 'mason']), [you, gob, sn, ma] = g.snakes;
        setBody(you, Array.from({ length: 8 }, (_, i) => [9 - i, 12]), 'right');
        setBody(gob, Array.from({ length: 8 }, (_, i) => [15, 21 - i]), 'up');
        setBody(sn, Array.from({ length: 8 }, (_, i) => [20, 3 + i]), 'up');
        setBody(ma, Array.from({ length: 6 }, (_, i) => [3 + i, 4]), 'left');
        g.food.push({ x: 12, y: 12, kind: 'beetle', dir: E.DIRS.left, movedAt: g.tick - 6, expires: g.tick + 200, scared: true, digUntil: g.tick + 5 }); // (cornered right in front of you, half way in)
        g.food.push({ x: 15, y: 9, kind: 'beetle', gold: 1, dir: E.DIRS.up, movedAt: g.tick - 3, expires: g.tick + 200, scared: true }); // (and a second, golden, running from Gobbler)
        show(g); drawN(16, 0.5);
        R.onTick([{ type: 'dive', x: 6, y: 18, dug: 1 }]); // (where another dug itself in a moment ago: its plug of sawdust)
        drawN(12, 0.5, 40);
      })()`,
      knock: `(() => { show(knockBoard()); drawN(24, 0.6); })()`, // (through the aim: the food in the mark trembling, rings where it'll land)
      'knock-flight': `(() => {
        const g = knockBoard(), P = g.woodpecker.target;
        show(g); drawN(24, 0.6);
        const ev = [];
        for (const f of g.food.slice()) {
          if (!P.includes(f.y * 24 + f.x)) continue;
          const to = E.knockTo(g, f.x, f.y, P);
          ev.push({ type: 'knock', kind: f.kind, x: f.x, y: f.y, tx: to.x, ty: to.y });
          if (f.kind === 'beetle') { f.px = f.x; f.py = f.y; f.movedAt = g.tick; }
          f.x = to.x; f.y = to.y;
        }
        for (const k of P) g.holes.add(k);
        g.woodpecker.target = []; g.woodpecker.struckAt = g.tick; g.woodpecker.last = P;
        g.tick++;
        R.onTick(ev);
        drawN(1, 0.3, 1); drawN(1, 0.45, 200); // (part way through their flights)
      })()`,
      flag: `(() => {
        const g = stage(['colonist', 'sovereign', 'mason']), [you, col, sov, ma] = g.snakes;
        setBody(col, Array.from({ length: 6 }, (_, i) => [2 + i, 2]), 'left');
        setBody(sov, Array.from({ length: 6 }, (_, i) => [22 - i, 22]), 'right');
        col.memory.colonies = [{ x: 5, y: 8, radius: 3, n: 1 }, { x: 12, y: 7, radius: 3, n: 2 }];
        sov.memory.home = { x: 17, y: 15, radius: 4 };
        show(g); drawN(30, 0.5, 60);
        for (const k of [7 * 24 + 12, 7 * 24 + 13, 8 * 24 + 12, 15 * 24 + 17, 15 * 24 + 16, 16 * 24 + 17]) g.holes.add(k);
        g.tick++; R.onTick([{ type: 'peck', x: 12, y: 7, cells: [7 * 24 + 12] }]);
        drawN(2, 0.5, 60);
        col.memory.colonies = [col.memory.colonies[0]]; sov.memory.home = { x: 12, y: 14, radius: 4 }; g.tick++;
        drawN(5, 0.5, 60);
      })()`,
    };
    for (const [name, code] of Object.entries(STAGED)) { if (ONLY && !ONLY.includes(name)) continue; await b.eval(code); await shot(`${prefix}${name}.jpg`); }
    await b.eval(`window.__autoRaf = true; 'ok'`);
  };
  try {
    // A switch for the page's animation loop, for the staged shots (on, but for them).
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const raw = window.requestAnimationFrame.bind(window); window.__autoRaf = true; window.requestAnimationFrame = cb => raw(ts => { if (window.__autoRaf) cb(ts); }); })();` });
    if (STAGED_ONLY) {
      for (const [prefix, w, h, scale, mobile, still] of [['desktop-', 800, 800, 2, false, false], ['phone-', 390, 844, 3, true, false], ['landscape-', 844, 390, 3, true, false], ['still-', 800, 800, 2, false, true]]) {
        await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: still ? 'reduce' : 'no-preference' }] });
        await b.viewport(w, h, { scale, mobile });
        await stagedShots(prefix);
      }
      return;
    }
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
    await stagedShots('');

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
    await stagedShots('mobile-');

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
