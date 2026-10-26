// Second set of flex rules (beetles and burrows), applied after patch-flex.js:
//
//   node patch-flex2.js <dir>
//
// New tuning keys (all optional; absent, the game plays as before):
//   AI_LIVE_FOOD true     the rivals see food as it is now, not REACTION_MS ago
//                         (food only changes on ticks, so thinking ahead still holds)
//   BURROW_FIRST n        the first beetle out cracks n burrows open at once
//   BEETLE_HOME_REACH n   a scared beetle runs for a burrow nearer than this (7)
//   BEETLE_SCARED_EVERY   may be fractional (1.5: every 1 then 2 ticks, in turn)
//   BEETLE_DIG n          a beetle with a head within BEETLE_DIG_FEAR and no
//                         burrow in reach digs in where it is: n ticks (it
//                         stays put, and can be caught), then it's underground
//                         and comes out of a burrow later, like a dive
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
function patch(file, edits) {
  const p = path.join(dir, file);
  let src = fs.readFileSync(p, 'utf8');
  for (const [from, to] of edits) {
    const n = src.split(from).length - 1;
    if (n !== 1) throw new Error(`${file}: expected 1 match, got ${n}: ${from.slice(0, 80)}`);
    src = src.replace(from, () => to);
  }
  fs.writeFileSync(p, src);
}
patch('engine.js', [
  [`      food: snap.food,`, `      food: T.AI_LIVE_FOOD ? game.food : snap.food,`],
  [`          game.events.push({ type: 'burrow', x: b.x, y: b.y });
        }
      }
      if (b) {`,
   `          game.events.push({ type: 'burrow', x: b.x, y: b.y });
        }
      }
      if (T.BURROW_FIRST) while (game.burrows.length < Math.min(T.BURROW_FIRST, T.BURROW_MAX)) {
        const at = place(null, true);
        if (!at) break;
        game.burrows.push({ x: at.x, y: at.y, at: game.tick });
        game.events.push({ type: 'burrow', x: at.x, y: at.y });
      }
      if (b) {`],
  [`      const scared = fear <= T.BEETLE_FEAR;
      if (game.tick - b.movedAt < (scared ? T.BEETLE_SCARED_EVERY : T.BEETLE_EVERY)) continue;`,
   `      const scared = fear <= T.BEETLE_FEAR;
      const reachHome = T.BEETLE_HOME_REACH ?? 7;
      if (T.BEETLE_DIG && !b.digUntil && fear <= T.BEETLE_DIG_FEAR && !game.burrows.some(h => Math.abs(h.x - b.x) + Math.abs(h.y - b.y) < reachHome)) {
        b.digUntil = game.tick + T.BEETLE_DIG;
        game.events.push({ type: 'dig', x: b.x, y: b.y });
      }
      if (b.digUntil) {
        if (game.tick < b.digUntil) continue;
        game.food.splice(game.food.indexOf(b), 1);
        game.unders.push({ until: game.tick + Math.round(between(T.BEETLE_UNDER_MIN, T.BEETLE_UNDER_MAX)), expires: b.expires, from: key(b.x, b.y), gold: !!b.gold });
        game.underground = game.unders[0];
        game.events.push({ type: 'dive', x: b.x, y: b.y, dug: 1 });
        continue;
      }
      const every = scared ? T.BEETLE_SCARED_EVERY : T.BEETLE_EVERY;
      const pace = Number.isInteger(every) ? every : b.alt ? Math.ceil(every) : Math.floor(every);
      if (game.tick - b.movedAt < pace) continue;
      if (!Number.isInteger(every)) b.alt = !b.alt;`],
  [`      let home = null, homeGap = 7;`, `      let home = null, homeGap = reachHome;`],
]);
console.log('patched (2)', dir);
