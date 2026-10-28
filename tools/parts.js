// A suite's parts: the files of one folder (tools/rules/, tools/render/, ...), run in name order as
// if they were still one file. Each part sees what the parts before it define (helpers are defined in
// the part that first needs them: grep the folder), and the checks run in the same order, drawing
// the same seeded randomness, as when the suite was one file.
// - runParts(dir): plain parts, run as scripts in one shared scope, the way the page runs its own.
// - runParts.inside(dir, scope): parts that await, run as the body of one async function, with the
//   runner's own names (scope: the browser, check(), ...) in reach; an error names its part's line.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const list = dir => fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => path.join(dir, f));

function runParts(dir) {
  globalThis.require = require; // (a part's require resolves from tools/, as the suite's did)
  for (const file of list(dir)) vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  return name => vm.runInThisContext(name); // (reads what the parts left, such as their count)
}

runParts.inside = async (dir, scope) => {
  const files = list(dir), starts = [];
  let body = '', line = 2; // (the function's own line comes first)
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8').replace(/\n?$/, '\n');
    starts.push([line, file]);
    body += text; line += text.split('\n').length - 1;
  }
  const where = `parts of ${dir}`;
  const fn = vm.runInThisContext(`(async ({ ${Object.keys(scope).join(', ')} }) => {\n${body}})`, { filename: where });
  try { return await fn(scope); } catch (e) {
    if (e && e.stack) e.stack = e.stack.split(where + ':').join('\u0000').replace(/\u0000(\d+)/g, (_, n) => {
      const [at, file] = starts.filter(([s]) => s <= +n).pop() || [2, where];
      return `${file}:${n - at + 1}`;
    });
    throw e;
  }
};

module.exports = runParts;
