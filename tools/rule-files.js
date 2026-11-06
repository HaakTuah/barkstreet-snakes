// What the copies, pointer and reading-size checks share: git, and the rule files, read from SECURITY.md, rule 3 (its
// "the rule files:" line), so the list stands in one place. Node's own modules only.
const fs = require('fs');
const { execFileSync } = require('child_process');
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
function ruleFiles() {
  const rule = /\*\*the rule files:\*\*([^;]*);/.exec(fs.readFileSync('SECURITY.md', 'utf8'));
  const list = rule ? [...rule[1].matchAll(/`([^`]+)`/g)].map(m => m[1]) : [];
  if (!list.length) throw new Error('SECURITY.md, rule 3, names no rule files ("the rule files:" line): the checks read their list there');
  return list.concat(rule[1].includes('this file') ? ['SECURITY.md'] : []);
}
module.exports = { git, ruleFiles };
