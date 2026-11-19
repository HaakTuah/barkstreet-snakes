// The check of the node-only suites (records, sw, scope): prints "ok   what", or on a failure
// "FAIL: what" (with its detail, if given) and stops the run at once.
module.exports = (cond, what, detail = '') => {
  if (!cond) { console.error('FAIL:', what, ...(detail ? [detail] : [])); process.exit(1); }
  console.log('ok  ', what);
};
