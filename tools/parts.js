// A suite's parts: the files of one folder (tools/rules/, ...), run in name order as scripts in
// one shared scope, the way the page runs its own scripts. Each part sees what the parts before it
// define (helpers are defined in the part that first needs them: grep the folder), and all of them
// draw on the same seeded randomness in the same order as when the suite was one file.
//   require('./parts.js')(path.join(__dirname, 'rules'))
const fs = require('fs');
const path = require('path');
const vm = require('vm');

module.exports = function runParts(dir) {
  globalThis.require = require; // (a part's require resolves from tools/, as the suite's did)
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()) {
    const file = path.join(dir, f);
    vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  }
  return name => vm.runInThisContext(name); // (reads what the parts left, such as their count)
};
