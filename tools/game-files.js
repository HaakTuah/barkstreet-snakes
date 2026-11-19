// The game's rules and rivals as the page loads them: tuning.js, then the AI's
// files and the engine's, in index.html's order. The tools that play without
// a page (the simulation, the suites, bench-ai, abtest, the dev tools) run
// exactly these, in this order, in one context, as the page does.
//
//   gameFiles(root)          their paths, relative to root (a copy of the game)
//   gameFiles(null, read)    the same, read(path) giving a copy's file (one at a git revision)
//   gameFiles.ai(f), .engine(f)   whether path f is the AI's, or the engine's
//   gameFiles.apart(texts)   the AI's texts as one script whose names stay its own,
//                            so a second AI can be loaded beside this one (--versus)
const fs = require('fs');
const path = require('path');

const ai = f => /^ai(\.js$|\/)/.test(f);
const engine = f => /^engine(\.js$|\/)/.test(f);

function gameFiles(root, read = f => fs.readFileSync(path.join(root, f), 'utf8')) {
  return [...read('index.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => f === 'tuning.js' || ai(f) || engine(f));
}
gameFiles.ai = ai;
gameFiles.engine = engine;
gameFiles.apart = texts => `(() => {\n${texts.join('\n;\n')}\n})();`;

module.exports = gameFiles;
