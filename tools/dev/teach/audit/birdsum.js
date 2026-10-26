// The woodpecker's sizes (out/bird-main.json, out/bird-p2.json), screen by
// screen: at rest, eyeing, flying and drumming, its ink's height in CSS px
// (smallest-largest over the spots), in cells, against the board, and on the
// branch that has it its eye. node birdsum.js
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out');
const lines = [];
for (const label of ['main', 'p2']) {
  const f = path.join(OUT, `bird-${label}.json`);
  if (!fs.existsSync(f)) continue;
  const rows = JSON.parse(fs.readFileSync(f, 'utf8'));
  const screens = [...new Set(rows.map(r => r.screen))];
  for (const sc of screens) {
    const at = rows.filter(r => r.screen === sc && r.box);
    const b = at[0];
    const parts = ['rest', 'eye', 'fly', 'drum'].map(st => {
      const s = at.filter(r => r.state === st);
      const h = s.map(r => r.box.h), w = s.map(r => r.box.w);
      const lo = Math.min(...h), hi = Math.max(...h);
      const eye = s.filter(r => r.pose).map(r => r.pose.eyeCssPx);
      const sc2 = s.filter(r => r.pose).map(r => r.pose.s);
      return `${st} ${lo === hi ? lo : `${lo}-${hi}`} px tall (${(lo / b.cellCss).toFixed(1)}${lo === hi ? '' : `-${(hi / b.cellCss).toFixed(1)}`} cells, ${(100 * lo / b.board.w).toFixed(0)}${lo === hi ? '' : `-${(100 * hi / b.board.w).toFixed(0)}`}% of the board), ${Math.min(...w)}-${Math.max(...w)} wide${eye.length ? `, eye ${Math.min(...eye)}-${Math.max(...eye)} px, s ${Math.min(...sc2)}-${Math.max(...sc2)}` : ''}`;
    });
    lines.push(`${label} ${sc} (board ${b.board.w} px, cell ${b.cellCss} px, dpr ${b.dpr}): ${parts.join('; ')}`);
  }
}
console.log(lines.join('\n'));
