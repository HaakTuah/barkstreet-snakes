// The S of Snakes: draws the title's honey snake and writes it into
// index.html (the h1's drawing) and style/base.css (the block between its two
// "title-s" marker comments), so the shape is changed here, never by hand.
//   node tools/title-s.js                  writes both files
//   node tools/title-s.js --preview=f.html also writes a big still of it, over Fredoka's S
// No dependencies.
//
// The snake is one body cut into five pieces at four joints, each piece its
// own little <svg> (the same box for all, so the pieces line up): the tail,
// the lower curve, the middle (which holds still), the upper curve, and the
// neck with the head; then a shut-eyed head for the blink, and the tongue.
// Each joint is an empty box (a <span>) holding the piece that hangs from it
// and the joints beyond, and turns by a CSS transform the compositor runs:
// nothing is laid out or painted while it wriggles. (Transforms inside one
// SVG repaint every frame; the rotate property doesn't run on the compositor
// on an <svg>.) A piece's own end of a joint is a disc as wide as the body,
// drawn over its parent's end, so the body stays whole as it bends.
//
// Units: 1em = 100, the baseline at y = 0, y down, x = 0 at the left edge of
// the letter's box.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const P = {
  // The centreline, tail tip first, head last: Fredoka 700's S, its top
  // terminal lifted into a neck that carries the head.
  points: [[6, -26], [4.6, -20], [7.4, -14], [13, -10.8], [20.5, -8.9], [28.5, -8.7], [36, -10.5], [41.8, -14.6], [44.2, -20.6], [42.4, -27.6], [37, -32], [28.5, -35.2], [19.5, -38.6], [13.6, -43.6], [11.4, -50.6], [13.6, -56.8], [19, -60.6], [26.5, -61.6], [33.5, -60.6]],
  half: 9, // the body's half-width (Fredoka's stems are 0.18em)
  tail: { len: 0.27, tip: 0.5 }, // tapering over its last 27% to a point
  pitch: 16.5, pinch: 0.085, // the caterpillar's segments: one every 0.165em, pinched 8.5% between
  joints: [0.18, 0.37, 0.6, 0.83], // where it bends (each moved to the nearest pinch)
  ink: 2.2, inkTip: 0.9, // the outline's width (thinner at the tail's tip)
  head: { at: [42.4, -60.4], r: 12.7, look: -2 }, // its centre, radius, and the way it faces (degrees: 0 is right)
  eye: { x: 2.4, y: 5.9, r: 5, pupil: 3, gx: 1.5, gy: 0.4, light: 1.1 }, // in the head's own frame
  mouth: { x: 9.4, h: 3.4, bulge: 1.3, w: 1.4 },
  lid: { r: 4.3, bulge: 0.95, w: 1.35 },
  tongue: { from: 9, len: 11.5, fork: 4.3, w: 3.2 },
  light: [-0.55, -0.83], // the light comes from the upper left
  mid: 0.76, midPush: 0.9, // the honey: 76% of the body's width, pushed toward the light
  shine: { k: 0.24, push: 0.82, len: 0.27, opacity: 0.75 }, // a glint on every segment
  viewBox: [-10, -90, 84, 100],
  colors: { ink: '#3a2614', dark: '#d19a45', honey: '#fde68a', glint: '#fffbea', eye: '#fffbea', pupil: '#0b1210', tongue: '#e11d48' },
  // The motion (seconds; every 4.2 s, the first 1.5 s after the page opens):
  // a wave down the body, head first, each joint 80 ms after the last, then
  // two flicks of the tongue; it blinks on a beat of its own.
  cycle: 4.2, start: 1.5, lag: 0.08,
  wave: { at: [0, 0.24, 0.5, 0.77, 1], k: [0, 1, -1, 0.45, 0] }, // (each joint's angle, as a share of its own)
  angles: { neck: 11, up: 7, low: 8, tail: 14 },
  flick: { at: 1.06, out: 0.14, back: 0.13, again: 0.12, home: 0.17, part: 0.35 },
  blink: { every: 5.3, first: 3.4, shut: 0.14 },
};

// ---- the centreline -------------------------------------------------------
function catmull(pts, per = 40) {
  const out = [], q = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < q.length - 2; i++) {
    const [p0, p1, p2, p3] = [q[i - 1], q[i], q[i + 1], q[i + 2]];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const lengths = pts => { const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return s; };
function resample(pts, n) {
  const s = lengths(pts), L = s[s.length - 1], out = [];
  for (let i = 0, j = 1; i <= n; i++) {
    const d = L * i / n;
    while (j < s.length - 1 && s[j] < d) j++;
    const f = (d - s[j - 1]) / ((s[j] - s[j - 1]) || 1);
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]);
  }
  return out;
}
// (a moving average, the ends held, so no bend is sharper than meant)
function smoothed(pts, win, passes) {
  let p = pts;
  for (let k = 0; k < passes; k++) p = p.map((v, i) => { const w = Math.min(win, i, p.length - 1 - i); if (!w) return v; let x = 0, y = 0; for (let d = -w; d <= w; d++) { x += p[i + d][0]; y += p[i + d][1]; } return [x / (2 * w + 1), y / (2 * w + 1)]; });
  return p;
}
const C = (() => { const pts = smoothed(resample(catmull(P.points), 600), 8, 3); const s = lengths(pts); return { pts, s, L: s[s.length - 1] }; })();
const L = C.L;
// The point at arc length s, its tangent t and its normal n.
function at(s) {
  s = Math.max(0, Math.min(L, s));
  let i = C.s.findIndex(v => v >= s); if (i <= 0) i = 1;
  const a = C.pts[i - 1], b = C.pts[i], f = (s - C.s[i - 1]) / ((C.s[i] - C.s[i - 1]) || 1);
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
  return { x: a[0] + dx * f, y: a[1] + dy * f, tx: dx / d, ty: dy / d, nx: -dy / d, ny: dx / d };
}
// (beyond either end the body goes on straight, for the joints' overlaps)
function along(s) { if (s >= 0 && s <= L) return at(s); const e = at(s < 0 ? 0 : L), o = s < 0 ? s : s - L; return { ...e, x: e.x + e.tx * o, y: e.y + e.ty * o }; }

// ---- the body's width -------------------------------------------------------
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const pinch0 = L % P.pitch / 2 + P.pitch * 0.5; // (the pinches sit evenly, none at either end)
const pinchAt = s => { const ph = (s - pinch0) / P.pitch; return Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * ph), 4); };
const taper = s => { const u = s / (P.tail.len * L); return u >= 1 ? 1 : P.tail.tip / P.half + (1 - P.tail.tip / P.half) * Math.pow(smooth(u), 0.75); };
const W = s => P.half * taper(Math.max(0, s)) * (1 - P.pinch * pinchAt(s) * Math.min(1, taper(s) * 1.4));
const inkW = s => P.inkTip + (P.ink - P.inkTip) * smooth(s / (0.12 * L));
const LIGHT = (() => { const d = Math.hypot(...P.light); return [P.light[0] / d, P.light[1] / d]; })();

// ---- drawing ----------------------------------------------------------------
const r1 = v => Math.round(v * 10) / 10;
const fmt = v => { const r = r1(v); return (Object.is(r, -0) ? 0 : r).toString().replace(/^(-?)0\./, '$1.'); };
const pt = ([x, y]) => fmt(x) + ' ' + fmt(y);

// The outline of a band of the body from s0 to s1, round at both ends: its
// half-width k * W (plus grow), pushed toward the light by push * (1 - k) * W.
// Numbers given in tenths, written as short as they go (a minus sign separates them too).
const nums = v => v.map(t => { const r = Math.round(t) / 10; return (Object.is(r, -0) ? 0 : r).toString().replace(/^(-?)0\./, '$1.'); })
  .reduce((o, t) => o + (o && t[0] !== '-' ? ' ' : '') + t, '');
function band(s0, s1, k, push, grow = () => 0, step = 2.5) {
  const n = Math.max(3, Math.ceil((s1 - s0) / step)), Lp = [], Rp = [];
  let w0, w1;
  for (let i = 0; i <= n; i++) {
    const s = s0 + (s1 - s0) * i / n, p = along(s), wb = W(Math.max(0, Math.min(L, s))), w = wb * k + grow(s);
    const off = push * (wb - wb * k) * (p.nx * LIGHT[0] + p.ny * LIGHT[1]);
    const cx = p.x + p.nx * off, cy = p.y + p.ny * off;
    Lp.push([cx + p.nx * w, cy + p.ny * w]); Rp.push([cx - p.nx * w, cy - p.ny * w]);
    if (i === 0) w0 = w; if (i === n) w1 = w;
  }
  // (in tenths, each step relative to the last: far fewer bytes)
  const q = [...Lp, ...Rp.reverse()].map(([x, y]) => [Math.round(x * 10), Math.round(y * 10)]), m = q.length / 2;
  const dq = (i, j) => [q[j][0] - q[i][0], q[j][1] - q[i][1]];
  const steps = (from, to) => { const v = []; for (let i = from; i < to; i++) v.push(...dq(i, i + 1)); return v; };
  return 'M' + nums(q[0]) + 'l' + nums(steps(0, m - 1)) + 'a' + nums([w1 * 10, w1 * 10, 0, 0, 0, ...dq(m - 1, m)]) +
    'l' + nums(steps(m, 2 * m - 1)) + 'a' + nums([w0 * 10, w0 * 10, 0, 0, 0, ...dq(2 * m - 1, 0)]) + 'z';
}

// The joints, each moved to its nearest pinch.
const J = P.joints.map(u => { const k = Math.round((u * L - pinch0) / P.pitch); return pinch0 + k * P.pitch; });
const jointAt = s => { const p = at(s); return [p.x, p.y]; };
const JP = J.map(jointAt);
// The pieces: [from, to, the joint it hangs from (index into J) or -1, which way its parent lies]
const PIECES = {
  tail: [0, J[0], 0, +1],
  low: [J[0], J[1], 1, +1],
  mid: [J[1], J[2], -1, 0],
  up: [J[2], J[3], 2, -1],
  head: [J[3], L, 3, -1],
};
let maskN = 0;
function piece(name) {
  const [a, b, j, side] = PIECES[name];
  const over = P.half * 1.2; // (a child reaches back into its parent: a disc of that, drawn over the parent's end)
  const s0 = side < 0 ? a - over : a, s1 = side > 0 ? b + over : b;
  // the outline: a stroke round the body (a band of its own at the tail, where it thins to the tip)
  const fills = name === 'tail'
    ? [`<path fill="${P.colors.ink}" d="${band(s0, s1, 1, 0, inkW)}"/>`, `<path fill="${P.colors.dark}" d="${band(s0, s1, 1, 0)}"/>`]
    : [`<path fill="${P.colors.dark}" stroke="${P.colors.ink}" stroke-width="${2 * P.ink}" stroke-linejoin="round" paint-order="stroke" d="${band(s0, s1, 1, 0)}"/>`];
  fills.push(`<path fill="${P.colors.honey}" d="${band(s0, s1, P.mid, P.midPush)}"/>`);
  // a glint on every segment, between its pinches, up toward the light (none on the very tip)
  const glints = [];
  for (let c = pinch0 - P.pitch / 2; c < L; c += P.pitch) {
    const h = P.pitch * P.shine.len;
    if (c + h < s0 || c - h > s1 || c < P.pitch * 0.6) continue;
    glints.push(`<path d="${band(c - h, c + h, P.shine.k, P.shine.push, () => 0, 2.2)}"/>`);
  }
  if (glints.length) fills.push(`<g fill="${P.colors.glint}" opacity="${P.shine.opacity}">${glints.join('')}</g>`);
  let body = fills.join('');
  if (j >= 0) { // masked to its own side of the joint and a disc round it (a mask, not a clip: drawn whole, then cut once, so no seam shows)
    const p = at(J[j]), [x, y] = JP[j], R = 400, tx = p.tx * side * -1, ty = p.ty * side * -1;
    const q = [[x + p.nx * R, y + p.ny * R], [x + p.nx * R + tx * R, y + p.ny * R + ty * R], [x - p.nx * R + tx * R, y - p.ny * R + ty * R], [x - p.nx * R, y - p.ny * R]];
    const id = 'snake-s-' + ++maskN;
    body = `<mask id="${id}" fill="#fff"><path d="M${q.map(pt).join('L')}Z"/><circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(W(J[j]))}"/></mask><g mask="url(#${id})">${body}</g>`;
  }
  return svg('', body);
}
const VB = P.viewBox;
// (each <svg> starts a line of its own, broken inside the tag: whitespace between the tags would be text in the h1)
const svg = (cls, inner) => `<svg\n          ${cls ? `class="s-${cls}" ` : ''}viewBox="${VB.join(' ')}">${inner}</svg>`;

// The head: a ball on top of its neck, lit from the upper left, and its face.
const H = P.head, HC = H.at;
const turn = (x, y) => { const a = H.look * Math.PI / 180; return [HC[0] + x * Math.cos(a) - y * Math.sin(a), HC[1] + x * Math.sin(a) + y * Math.cos(a)]; };
function ball() {
  const k = P.mid, off = P.midPush * (1 - k) * H.r, g = H.r * 0.55;
  const gx = HC[0] + LIGHT[0] * g, gy = HC[1] + LIGHT[1] * g;
  return `<circle fill="${P.colors.dark}" cx="${fmt(HC[0])}" cy="${fmt(HC[1])}" r="${fmt(H.r)}"/>` +
    `<circle fill="${P.colors.honey}" cx="${fmt(HC[0] + LIGHT[0] * off)}" cy="${fmt(HC[1] + LIGHT[1] * off)}" r="${fmt(H.r * k)}"/>` +
    `<ellipse fill="${P.colors.glint}" opacity="${P.shine.opacity}" cx="${fmt(gx)}" cy="${fmt(gy)}" rx="${fmt(H.r * 0.3)}" ry="${fmt(H.r * 0.17)}" transform="rotate(-35 ${fmt(gx)} ${fmt(gy)})"/>`;
}
function mouth() {
  const m = P.mouth, a = turn(m.x, -m.h), c = turn(m.x + m.bulge * 2, 0), b = turn(m.x, m.h);
  return `<path fill="none" stroke="${P.colors.pupil}" stroke-width="${m.w}" stroke-linecap="round" d="M${pt(a)}Q${pt(c)} ${pt(b)}"/>`;
}
function eyes() {
  const e = P.eye;
  return [-1, 1].map(sy => {
    const [x, y] = turn(e.x, sy * e.y), [px, py] = turn(e.x + e.gx, sy * e.y + e.gy);
    return `<circle fill="${P.colors.eye}" cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(e.r)}"/><circle fill="${P.colors.pupil}" cx="${fmt(px)}" cy="${fmt(py)}" r="${fmt(e.pupil)}"/>` +
      `<circle fill="#fff" cx="${fmt(px - e.pupil * 0.36)}" cy="${fmt(py - e.pupil * 0.38)}" r="${fmt(e.light)}"/>`;
  }).join('');
}
// shut: the lids curve like a cartoon's, as on the board
function lids() {
  const e = P.eye, l = P.lid;
  const d = [-1, 1].map(sy => { const a = turn(e.x, sy * e.y - l.r), c = turn(e.x + l.r * l.bulge * 2, sy * e.y), b = turn(e.x, sy * e.y + l.r); return `M${pt(a)}Q${pt(c)} ${pt(b)}`; }).join('');
  return `<path fill="none" stroke="${P.colors.pupil}" stroke-width="${l.w}" stroke-linecap="round" d="${d}"/>`;
}
const headInk = `<circle fill="${P.colors.ink}" cx="${fmt(HC[0])}" cy="${fmt(HC[1])}" r="${fmt(H.r + P.ink)}"/>`;
function tongue() {
  const t = P.tongue, a = turn(t.from, 0), b = turn(t.from + t.len, 0), f1 = turn(t.from + t.len + t.fork, -t.fork * 0.8), f2 = turn(t.from + t.len + t.fork, t.fork * 0.8);
  return `<path fill="none" stroke="${P.colors.tongue}" stroke-width="${t.w}" stroke-linecap="round" stroke-linejoin="round" d="M${pt(a)}L${pt(b)}L${pt(f1)}M${pt(b)}L${pt(f2)}"/>`;
}

const parts = {
  mid: piece('mid'), up: piece('up'), low: piece('low'), tail: piece('tail'),
  // (the head's piece: its neck, then the ball's outline under the neck's honey, then the ball over it)
  head: (() => { const s = piece('head'); return s.replace(`<path fill="${P.colors.dark}"`, headInk + `<path fill="${P.colors.dark}"`).replace(/<\/svg>$/, ball() + eyes() + mouth() + '</svg>'); })(),
  shut: svg('shut', ball() + lids() + mouth()),
  tongue: svg('tongue', tongue()),
};
// Each joint is an empty box (a <span>) holding the piece that hangs from it and the joints beyond.
const drawing = `<i aria-hidden="true">${parts.tongue}<b>${parts.mid}<span class="s-up">${parts.up}<span class="s-neck">${parts.head}${parts.shut}</span></span>` +
  `<span class="s-low">${parts.low}<span class="s-tail">${parts.tail}</span></span></b></i>`;

// ---- the CSS --------------------------------------------------------------
const em = v => (+v.toFixed(3) || 0).toString().replace(/^(-?)0\./, '$1.') + 'em';
const pc = t => +(t / P.cycle * 100).toFixed(2) + '%';
const sec = t => +t.toFixed(2) + 's';
// a joint's keyframes
function waveKeys(name, deg) {
  const by = {};
  P.wave.at.forEach((t, i) => { const k = pc(t); (by[P.wave.k[i]] ||= []).push(k); });
  const rows = Object.entries(by).map(([k, ts]) => `${(k === '0' ? [...ts, '100%'] : ts).join(', ')} { transform: rotate(${+(deg * k).toFixed(2)}deg); }`);
  return `@keyframes s-${name} {\n  ${rows.join('\n  ')}\n}`;
}
const F = P.flick, f = [F.at, F.at + 0.03, F.at + F.out, F.at + F.out + F.back, F.at + F.out + F.back + F.again, F.at + F.out + F.back + F.again + F.home];
const tongueIn = (P.tongue.len + P.tongue.fork + 1) / 100, tdx = Math.cos(H.look * Math.PI / 180), tdy = Math.sin(H.look * Math.PI / 180);
const tin = k => `transform: translate(${em(-tongueIn * k * tdx)}, ${em(-tongueIn * k * tdy)})`;
// (the drawing's box, and each joint's, has its top left at the viewBox's)
const jo = ([x, y]) => `${em((x - VB[0]) / 100)} ${em((y - VB[1]) / 100)}`;
const box = `width: ${em(VB[2] / 100)}; height: ${em(VB[3] / 100)}`, right = em(-(VB[2] + VB[0]) / 100), left = em(VB[0] / 100);
const anim = (name, delay, extra = 'ease-in-out') => `s-${name} ${P.cycle}s ${extra} ${sec(P.start + delay)} infinite`;
const css = `/* title-s: the S of Snakes, a honey snake. (Drawn and written by tools/title-s.js: change it there.)
   The letter stays as text, only see-through: it's what's read out and
   copied, and it keeps its place in the word. The drawing stands on the
   baseline from the letter's left edge (the <i>, an empty box whose baseline
   is the line's, so it sits the same in Fredoka and the stand-in font). The
   <b> is the drawing's box (it casts the title's drop), each piece of the
   snake an <svg> of its own in that same box, and each joint an empty box (a
   <span>) holding the piece that hangs from it and the joints beyond, turned
   by a transform the compositor runs: nothing is laid out or painted while
   it moves. Each box's line is exactly its drawing's height (line-height: 0),
   so its top left is the drawing's in any font; negative margins keep them
   all from taking room or raising the title's line. */
h1 .snake-s { color: transparent; text-shadow: none; white-space: nowrap; } /* (inline: a box round it would split the word, "S nakes", for a screen reader; nowrap: where the title wraps, the snake goes with its letter) */
h1 .snake-s > i { user-select: none; -webkit-user-select: none; } /* (the drawing never goes into a selection: a copy is the words; see game/input.js) */
h1 .snake-s :is(i, span) { display: inline-block; width: 0; height: 0; }
h1 .snake-s :is(b, span) { line-height: 0; }
h1 .snake-s b { display: inline-block; ${box}; margin: -0.5em ${right} -0.2em ${left}; filter: drop-shadow(0 2px 0 var(--leaf-dark)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5)); } /* (the title's own drop; the tongue goes under it, so it casts none) */
h1 .snake-s span { margin-top: -0.5em; }
h1 .snake-s svg { ${box}; margin: 0 ${em(-VB[2] / 100)} 0 0; vertical-align: ${em(-(VB[1] + VB[3]) / 100)}; overflow: visible; }
h1 .snake-s .s-tongue { margin: -0.5em ${right} 0 ${left}; }
/* Now and then it wriggles: a wave down its body, head first (each piece
   turns on the joint it hangs from, and the pieces beyond it go with it; the
   middle holds still), then it tastes the air twice. It blinks on a beat of
   its own: a shut-eyed head over the open one, for a moment. */
h1 .snake-s .s-up { transform-origin: ${jo(JP[2])}; animation: ${anim('up', P.lag)}; }
h1 .snake-s .s-neck { transform-origin: ${jo(JP[3])}; animation: ${anim('neck', 0)}; }
h1 .snake-s .s-low { transform-origin: ${jo(JP[1])}; animation: ${anim('low', 2 * P.lag)}; }
h1 .snake-s .s-tail { transform-origin: ${jo(JP[0])}; animation: ${anim('tail', 3 * P.lag)}; }
h1 .snake-s .s-shut { opacity: 0; animation: s-blink ${P.blink.every}s steps(1, end) ${sec(P.blink.first)} infinite; }
h1 .snake-s .s-tongue { opacity: 0; animation: ${anim('flick', 0)}; }
html.in-round h1 .snake-s * { animation: none; } /* (it rests during a round, tongue in and eyes open: nobody's looking) */
${waveKeys('neck', P.angles.neck)}
${waveKeys('up', P.angles.up)}
${waveKeys('low', P.angles.low)}
${waveKeys('tail', P.angles.tail)}
@keyframes s-flick {
  0%, ${pc(f[0])}, ${pc(f[5])}, 100% { opacity: 0; ${tin(1)}; }
  ${pc(f[0] + 0.03)}, ${pc(f[5] - 0.03)} { opacity: 1; }
  ${pc(f[2])}, ${pc(f[4])} { transform: none; }
  ${pc(f[3])} { ${tin(F.part)}; }
}
@keyframes s-blink {
  0% { opacity: 1; }
  ${pc(P.blink.shut * P.cycle / P.blink.every)} { opacity: 0; }
}
/* (end of title-s) */`;

// ---- writing it -------------------------------------------------------------
const comment = `<!-- The S of Snakes is a honey snake (drawn by tools/title-s.js; style/base.css: title-s). The letter stays as text
             for reading and copying; the drawing over it is hidden from screen readers. -->`;
const h1 = `<h1>Barkstreet <span class="snake-s">${drawing}S</span>nakes</h1>`;
const idx = path.join(ROOT, 'index.html');
let html = fs.readFileSync(idx, 'utf8');
const html2 = html.replace(/(<!-- The S of Snakes[\s\S]*?-->\s*)?<h1>[\s\S]*?<\/h1>/, `${comment}\n        ${h1}`);
if (html2 === html && !html.includes(h1)) throw new Error('no h1 in index.html');
fs.writeFileSync(idx, html2);
const cssFile = path.join(ROOT, 'style', 'base.css');
const style = fs.readFileSync(cssFile, 'utf8');
if (!/\/\* title-s:[\s\S]*?\/\* \(end of title-s\) \*\//.test(style)) throw new Error('no title-s block in style/base.css');
fs.writeFileSync(cssFile, style.replace(/\/\* title-s:[\s\S]*?\/\* \(end of title-s\) \*\//, () => css));
console.log(`the S: ${h1.length} bytes of markup; body ${fmt(L)} long, ${Math.round(L / P.pitch)} segments; joints at ${JP.map(pt).join(', ')}`);

const prev = (process.argv.find(a => a.startsWith('--preview=')) || '').slice(10);
if (prev) {
  // (big: Fredoka's S outlined over it; then shut-eyed with its tongue out; then small)
  const big = (s, { glyph = false, shut = false, tongue: t = false } = {}) => `<div style="position:relative;width:${s * VB[2] / 100}px;height:${s * VB[3] / 100}px">` +
    [...(t ? [parts.tongue] : []), parts.mid, parts.up, parts.low, parts.tail, parts.head, ...(shut ? [parts.shut] : [])].map(p => p.replace('<svg', `<svg style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"`)).join('') +
    (glyph ? `<svg viewBox="${VB.join(' ')}" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"><text font-family="Fredoka" font-weight="700" font-size="100" fill="none" stroke="#f0f" stroke-width=".35">S</text><path d="M-10 0H74M-10 -71H74M-10 -50H74" stroke="#0ff" stroke-width=".2"/></svg>` : '') + '</div>';
  fs.writeFileSync(prev, `<!doctype html><meta charset=utf-8><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700&display=block"><body style="background:#18261a;margin:0;padding:20px;display:flex;gap:30px;align-items:flex-end;font:700 100px Fredoka">${big(560, { glyph: true })}<div style="display:flex;flex-direction:column;gap:20px">${big(240, { shut: true, tongue: true })}${big(110)}</div></body>`);
}
