// The renderer (see render/core.js): each snake's gaze, what it looks at
// and how its eyes ease there.

// ------------------------------------------------------------ the gaze

// What a snake is looking at: a cell, or null for straight ahead. Each rival
// looks at what it cares about, read from its memory (purely for show: what
// it draws never changes how anyone plays), so you can read who's hunting whom.
const spot = { x: 0, y: 0 };
function focusOf(s, look, a, now) {
  const m = s.memory;
  switch (look) {
    case 'player': case 'gobbler': return nearest(s, 'food');
    case 'drab': return nearest(s, 'food'); // a lazy look at lunch
    case 'sniper': case 'sovereign': case 'mute': return headOf(m.victimId) || nearest(s, 'head');
    case 'colonist': return headOf(m.victimId) || m.site || nearest(s, 'head');
    case 'vulture': return headOf(m.lureId) || nearest(s, 'head');
    case 'copycat': return headOf(m.modelId) || nearest(s, 'head');
    case 'creeper': return nearest(s, 'tail') || nearest(s, 'head');
    case 'mason': return nearest(s, 'head'); // keeping an eye on whoever's near the wall
    case 'ghost': case 'metagamer': case 'desperado': case 'joker': return nearest(s, 'head');
    case 'star': return nearest(s, 'gold') || nearest(s, 'head'); // (it craves golden powers above everything)
    case 'wildcard': // looks wherever, changing its mind every second or two
      if (now > a.wanderAt) {
        a.wanderAt = now + 900 + Math.random() * 1600;
        a.wx = Math.floor(Math.random() * GRID);
        a.wy = Math.floor(Math.random() * GRID);
      }
      spot.x = a.wx; spot.y = a.wy;
      return spot;
    default: return nearest(s, 'head');
  }
}

function headOf(id) {
  const o = findById(id);
  return o && o.alive ? o.body[0] : null;
}

// The nearest food (not mushrooms), golden power (a golden beetle, a
// golden leaf or a golden mushroom), rival head, or long rival's tail.
// Every snake's eyes follow something, so no face ever just stares ahead.
function nearest(s, what) {
  const h = s.body[0];
  let best = 1e9, out = null;
  if (what === 'food' || what === 'gold') {
    for (const f of game.food) {
      if (f.kind === 'mushroom' || (what === 'gold' && !(f.kind === 'leaf' || f.kind === 'goldcap' || (f.kind === 'beetle' && f.gold)))) continue;
      const d = (f.x - h.x) * (f.x - h.x) + (f.y - h.y) * (f.y - h.y);
      if (d > 0 && d < best) { best = d; out = f; }
    }
  } else {
    for (const o of game.snakes) {
      if (o === s || !o.alive) continue;
      const c = what === 'head' ? o.body[0] : o.body.length >= 8 ? o.body[o.body.length - 1] : null;
      if (!c) continue;
      const d = (c.x - h.x) * (c.x - h.x) + (c.y - h.y) * (c.y - h.y);
      if (d > 0 && d < best) { best = d; out = c; }
    }
  }
  return out;
}

// Turn the eyes toward the focus (eased on the screen, so a turn of the
// head doesn't swing them, and at the same speed at any frame rate).
// With a turn pressed that hasn't shown yet (or, stunned, a jump or a
// flash asked for), they look the way it'll go instead, quickly: it's
// your press, answered.
function updateGaze(s, look, a, now) {
  const q = game ? queuedOf(s, a) : null, f = game && !q ? focusOf(s, look, a, now) : null;
  let tx = a.tdx, ty = a.tdy; // nothing to look at: straight ahead
  if (q) { tx = q.x; ty = q.y; }
  else if (f) {
    const h = s.body[0], dx = f.x - h.x, dy = f.y - h.y;
    const len = Math.hypot(dx, dy) || 1;
    a.near = len;
    tx = dx / len; ty = dy / len;
  } else a.near = 99;
  const ease = 1 - Math.pow(1 - (q ? 0.5 : T.GLANCE_EASE), frameDt / 16.7);
  a.gx += (tx - a.gx) * ease;
  a.gy += (ty - a.gy) * ease;
}
