// What the pointer and reading-size checks share: git, and the rule files, read by the core's
// core/scripts/rule-files.mjs from SECURITY.md, rule 3, so the list stands in one place. Node's own modules only.
const { execFileSync } = require('child_process');
const { ruleFiles } = require('../core/scripts/rule-files.mjs');
const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
module.exports = { git, ruleFiles };
