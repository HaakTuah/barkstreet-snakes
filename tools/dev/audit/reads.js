// Preloaded into a suite's node processes (node --require tools/dev/audit/reads.js, or NODE_OPTIONS): appends the path of each game file
// the process reads to the file AUDIT_READS names, one per line, so tools/dev/audit/suites.js can say which parts a suite needs.
// A browser suite's server reads a file when the page asks for it, so those are caught too.
const fs = require('fs');
const path = require('path');
const out = process.env.AUDIT_READS, root = process.env.AUDIT_ROOT;
if (out && root) {
  const note = f => {
    try {
      if (typeof f !== 'string' && !(f instanceof URL)) return;
      const rel = path.relative(root, path.resolve(String(f instanceof URL ? f.pathname : f)));
      if (!rel.startsWith('..') && !rel.startsWith('tools') && !rel.startsWith('core') && !rel.startsWith('node_modules') && !rel.startsWith('docs') && !rel.startsWith('.git')) fs.appendFileSync(out, rel + '\n');
    } catch { /* never in the suite's way */ }
  };
  const sync = fs.readFileSync, async_ = fs.readFile;
  fs.readFileSync = function (f, ...a) { note(f); return sync.call(this, f, ...a); };
  fs.readFile = function (f, ...a) { note(f); return async_.call(this, f, ...a); };
}
