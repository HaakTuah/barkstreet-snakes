// Sovereign: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.sovereign = {
  name: 'Sovereign', color: '#2563eb', look: 'sovereign', driver: 'sovereign',
  blurb: 'Rules its own patch of bark and attacks anyone who trespasses.',
  kill: ['The Sovereign does not share.', 'Removed by royal decree.', 'Every inch is royal. You were on one.'],
  win: ['Long live the Sovereign.', 'The realm is the whole log now.', 'We are, at last, amused.'],
  w: {
    style: { chase: 0.7 }, // (7b: it chases intruders off its land)
    space: 1.5, territory: 1, aggression: 0.2,
    food: 5, eat: 70, pellet: 1.2, foodRange: 30,
    margin: 3, headRisk: 500, zoneRisk: 80,
    home: { radius: 4, leave: 30, grow: 8, max: 7, drift: 15 }, hunt: { squeeze: 2.5, chase: 6, lead: 3 },
  },
};

// Its realm: a circle round where it started, that grows as it does
// (and shrinks again if it wastes away), and drifts a cell at a time
// off land that's been lost (holes, fire). Anyone in it gets hunted.
// A capital the woodpecker pecks out moves the realm at once, banner
// and all, to the nearest good land.
DRIVERS.sovereign = function () {
  const H = intent.w.home, len = me.body.length;
  memory.home ||= { x: myHead.x, y: myHead.y, radius: H.radius };
  const home = intent.home = memory.home;
  const needs = R => 3 + H.grow * (R - H.radius); // (the length it takes to hold a realm of radius R)
  if (home.radius < H.max && len >= needs(home.radius + 1)) home.radius++;
  else if (home.radius > H.radius && len < needs(home.radius) - 2) home.radius--;
  const fit = v => Math.min(N - home.radius - 2, Math.max(home.radius + 1, v));
  home.x = fit(home.x);
  home.y = fit(home.y);
  const land = (cx, cy) => {
    let n = 0;
    for (let y = cy - home.radius; y <= cy + home.radius; y++) {
      for (let x = cx - home.radius; x <= cx + home.radius; x++) {
        if (inGrid(x, y) && Math.hypot(x - cx, y - cy) <= home.radius + TUNE.LAND_REACH && !holes.has(y * N + x)) n++;
      }
    }
    return n;
  };
  if (pit(home.x, home.y)) { // (the nearest capital that isn't a pit, the most land of those as near)
    let best = null, most = -1;
    for (let r = 1; r < N && !best; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (const dy of dx === -r || dx === r ? [0] : [r - Math.abs(dx), Math.abs(dx) - r]) {
          const x = fit(home.x + dx), y = fit(home.y + dy);
          if (Math.abs(x - home.x) + Math.abs(y - home.y) !== r || pit(x, y)) continue; // (that far, once fitted on the board)
          const n = land(x, y);
          if (n > most) { most = n; best = { x, y }; }
        }
      }
    }
    if (best) { home.x = best.x; home.y = best.y; memory.driftAt = view.tick + H.drift; }
  }
  if (view.tick >= (memory.driftAt ?? 0)) {
    memory.driftAt = view.tick + H.drift;
    let best = null, most = land(home.x, home.y) + 2; // (only for clearly better land)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = fit(home.x + dx), y = fit(home.y + dy);
      if ((x === home.x && y === home.y) || pit(x, y)) continue;
      const n = land(x, y);
      if (n > most) { most = n; best = { x, y }; }
    }
    if (best) { home.x = best.x; home.y = best.y; }
  }
  const intruders = all.filter(k => onOwnLand(heads[k], intent.home));
  if (intruders.length) pickVictim(intruders, intent.w.hunt);
  else memory.victimId = null;
};
