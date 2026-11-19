// A suite's parts: the files of one folder (tools/rules/, tools/render/, ...), run in name order as
// if they were still one file. Each part sees what the parts before it define (helpers are defined in
// the part that first needs them: grep the folder), and the checks run in the same order, drawing
// the same seeded randomness, as when the suite was one file.
// - runParts(dir): plain parts, run as scripts in one shared scope, the way the page runs its own.
// - runParts.inside(dir, scope, pick): parts that await, run as the body of one async function, with
//   the runner's own names (scope: the browser, check(), ...) in reach; an error names its part's
//   line. pick(file), if given, keeps only some of the parts (the layout suite's CI jobs); done(file, ms),
//   if given, is told as each part ends (the layout suite prints it, so a long run shows it's moving).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const list = dir => fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => path.join(dir, f));

function runParts(dir) {
  globalThis.require = require; // (a part's require resolves from tools/, as the suite's did)
  for (const file of list(dir)) vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  return name => vm.runInThisContext(name); // (reads what the parts left, such as their count)
}

runParts.inside = async (dir, scope, pick = () => true, done = null) => {
  const files = list(dir).filter(pick), starts = [];
  let body = '', line = 2; // (the function's own line comes first)
  for (const [i, file] of files.entries()) {
    const text = fs.readFileSync(file, 'utf8').replace(/\n?$/, '\n');
    starts.push([line, file]);
    body += text; line += text.split('\n').length - 1;
    if (done) { body += `__partDone(${i});\n`; line++; } // (a line of its own, after the part's last, so no part's lines move)
  }
  const where = `parts of ${dir}`;
  let t = Date.now();
  const __partDone = i => { done(files[i], Date.now() - t); t = Date.now(); };
  const fn = vm.runInThisContext(`(async ({ ${[...Object.keys(scope), ...(done ? ['__partDone'] : [])].join(', ')} }) => {\n${body}})`, { filename: where });
  try { return await fn(done ? { ...scope, __partDone } : scope); } catch (e) {
    if (e && e.stack) e.stack = e.stack.split(where + ':').join('\u0000').replace(/\u0000(\d+)/g, (_, n) => {
      const [at, file] = starts.filter(([s]) => s <= +n).pop() || [2, where];
      return `${file}:${n - at + 1}`;
    });
    throw e;
  }
};

module.exports = runParts;
