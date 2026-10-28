if (isMainThread && require.main === module) {
  const args = process.argv.slice(2);
  const flag = name => args.includes(name);
  const WITH_VALUE = ['--seed', '--root', '--workers', '--save-at', '--save', '--from', '--versus', '--seats'];
  const text = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const value = name => { const v = text(name); return v == null ? null : Number(v); };
  const fail = why => { console.error(why); process.exit(1); };
  const given = Number(args.find((a, i) => /^\d+$/.test(a) && !WITH_VALUE.includes(args[i - 1]))) || null;
  const ahead = flag('--ahead'), json = flag('--json'), saveAt = value('--save-at'), fromFile = text('--from') && path.resolve(text('--from'));
  let seed = value('--seed'), signs = flag('--signatures'), rounds = given || 200;
  if (saveAt != null && seed == null) fail('--save-at needs --seed (a round must play the same way again to be worth storing)');
  if (saveAt != null && fromFile) fail("--save-at and --from don't go together");
  const versus = text('--versus') && path.resolve(text('--versus')), seats = versus ? ['even', 'odd'].indexOf(text('--seats') || 'even') : null;
  if (versus && (saveAt != null || fromFile)) fail("--versus doesn't go with --save-at or --from");
  if (seats < 0) fail('--seats is even or odd');
  if (versus && !fs.existsSync(path.join(versus, 'ai.js'))) fail(`${versus} has no ai.js`);
  try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch {} // (the machine's own user comes first; the worker threads share this priority)
  const hash = (...parts) => crypto.createHash('sha1').update(parts.join('\u0000')).digest('hex');
  const read = f => fs.readFileSync(f, 'utf8');
  // What rounds are played with: the game's files, and this file (its parts
  // joined, as tools/simulate.js runs them: module.joined) and the state
  // store too, since what a run counts can change; and their key. The cores
  // are handed these very texts (this file's as the run began), so the
  // key is always that of the code played. They're read again once the lock
  // is taken: whatever was edited while the run waited is played, and
  // stored, as it is now.
  const SELF = { text: module.joined, file: __filename }, STATE_FILE = require.resolve('./snapshots/state.js');
  const snapshot = () => {
    const game = GAME_FILES.map(f => read(path.join(ROOT, f))), state = read(STATE_FILE), other = versus ? read(path.join(versus, 'ai.js')) : null;
    return { game, state, other, key: hash(...game, SELF.text, state, ...(versus ? [other, seats] : [])) };
  };
  let files = snapshot();
  const CACHE = path.join(os.tmpdir(), 'barkbite-sim-cache');

  // --from: the stored rounds (the first line says how they were stored).
  let stored = null, fromKey = null;
  if (fromFile) {
    const lines = readLines(fromFile);
    let how = null;
    try { how = JSON.parse(lines[0]); } catch {}
    if (!how || how.states !== 2) fail(`${fromFile} isn't a file of rounds stored by this simulate.js (see --save-at)`);
    if (seed != null && seed !== how.seed) fail(`${fromFile} holds rounds of seed ${how.seed}, not ${seed}`);
    if (signs && !how.signs) fail(`${fromFile} was stored without --signatures, so they can't be counted for the part before ${how.saveAt / 1000}s`);
    seed = how.seed;
    signs = how.signs; // (counted on whether printed or not, so its rounds' numbers stay whole)
    fromKey = how.key;
    stored = linesByRound(lines.slice(1));
    let n = 0;
    while (stored.has(n)) n++;
    if (given > n) fail(`${fromFile} holds ${n} rounds, not ${given} (store more with --save-at)`);
    rounds = given || n;
    if (!json) console.log(`(going on with ${rounds} of the rounds of seed ${seed} stored at ${how.saveAt / 1000}s)`);
  }
  const workers = Math.max(1, Math.min(rounds, value('--workers') || Number(process.env.SIM_WORKERS) || Math.floor(os.cpus().length / 2)));

  // A seeded round is the same every time with the same files and options,
  // so each is cached (in the system's temp folder) and read back; stored
  // states too, by the files and seed that played them. (look: the cache's
  // file for the files read, and what it has.)
  let statesKey, cached, have; // (have: round -> its line)
  const cachedLines = () => { const lines = readLines(cached); return saveAt != null ? lines.slice(1) : lines; };
  const fromCache = () => !cached || flag('--fresh') ? new Map() : linesByRound(cachedLines());
  const look = () => {
    statesKey = saveAt == null ? null : hash(files.key, JSON.stringify({ seed, signs, saveAt, v: 2 }));
    cached = seed == null ? null : saveAt != null ? path.join(CACHE, `states-${statesKey}.jsonl.gz`)
      : path.join(CACHE, hash(files.key, JSON.stringify({ seed, ahead, signs, from: fromKey, v: 2 })) + '.jsonl.gz');
    have = fromCache();
    if (have.size) { try { fs.utimesSync(cached, new Date(), new Date()); } catch {} }
  };
  look();
  const head = () => JSON.stringify({ states: 2, key: statesKey, seed, saveAt, signs, root: ROOT });
  const missing = () => Array.from({ length: rounds }, (_, r) => r).filter(r => !have.has(r) && !(stored && ROUND.exec(stored.get(r))[2] === 'done'));

  const finish = merged => {
    if (json) console.log(JSON.stringify(merged));
    else {
      report(merged, flag('--census'));
      if (flag('--census')) reportCensus(merged.per);
      if (flag('--signatures')) reportSignatures(merged.per);
    }
    if (flag('--check')) {
      const never = Object.entries(merged.per).filter(([, p]) => p.rounds >= 20 && !p.wins).map(([n]) => n);
      const problems = [merged.total.stalled && `${merged.total.stalled} stalled`, never.length && `never won: ${never.join(', ')}`].filter(Boolean);
      if (problems.length) { console.error('check failed: ' + problems.join('; ')); process.exit(1); }
      console.log('check ok');
    }
  };
  // (played: what this run played, and the CPU it took, for --json.)
  const done = (played = { rounds: 0, cpu: 0 }) => {
    if (saveAt != null) {
      const lines = Array.from({ length: rounds }, (_, r) => have.get(r)), going = lines.filter(l => ROUND.exec(l)[2] === 'state').length;
      const out = text('--save') && path.resolve(text('--save'));
      if (out) writeLines(out, [head()].concat(lines));
      const file = out || cached;
      if (json) console.log(JSON.stringify({ states: file, rounds, going, played }));
      else console.log(`${rounds} rounds stored at ${saveAt / 1000}s (${going} still going then, ${rounds - going} over before) in ${file}\n  go on with them: node tools/simulate.js --from ${JSON.stringify(file)} [--root DIR]`);
      return;
    }
    const results = Array.from({ length: rounds }, (_, r) => parsed(have.get(r) || stored.get(r)));
    const T = (() => { const ctx = vm.createContext({ window: {} }); vm.runInContext(files.game[GAME_FILES.indexOf('tuning.js')], ctx); return ctx.window.TUNING; })();
    const merged = merge(results, T.SUDDEN_DEATH_MS);
    if (json) { merged.played = played; if (flag('--per-round')) merged.rounds = results; }
    finish(merged);
  };
  let todo = missing();
  if (!todo.length) {
    if (!json && saveAt == null && have.size) console.log('(played before with these files and options: read from the cache; --fresh plays it again)');
    done();
    return;
  }
  // One run at a time on the machine: a lock file, taken over if its owner's
  // gone. Runs waiting for it queue, first come first served: each leaves a
  // ticket (when it came, its pid), and only the oldest live ticket may take
  // the lock. (Without the queue, a run started the moment the last one ended,
  // as abtest's are, usually got in ahead of one that had been waiting, and a
  // waiting run could wait for many minutes.)
  const lock = path.join(os.tmpdir(), 'barkbite-sim.lock'), queueDir = path.join(os.tmpdir(), 'barkbite-sim-queue');
  const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
  const take = () => { try { fs.writeFileSync(lock, String(process.pid), { flag: 'wx' }); return true; } catch { return false; } };
  if (!flag('--no-wait')) {
    const ticket = path.join(queueDir, `${String(Date.now()).padStart(15, '0')}-${process.pid}`);
    try { fs.mkdirSync(queueDir, { recursive: true }); fs.writeFileSync(ticket, ''); } catch {}
    const drop = () => { try { fs.unlinkSync(ticket); } catch {} };
    process.on('exit', drop);
    const first = () => { // (is ours the oldest ticket of a run still going? the dead ones are cleared on the way)
      let names = [];
      try { names = fs.readdirSync(queueDir).sort(); } catch { return true; }
      for (const n of names) {
        if (path.join(queueDir, n) === ticket) return true;
        if (alive(Number(n.split('-')[1]))) return false;
        try { fs.unlinkSync(path.join(queueDir, n)); } catch {}
      }
      return true; // (our ticket couldn't be written: wait as before, by the lock alone)
    };
    let told = false;
    while (!(first() && take())) {
      let owner = 0;
      try { owner = Number(fs.readFileSync(lock, 'utf8')); } catch {}
      if (owner && !alive(owner)) { try { fs.unlinkSync(lock); } catch {} continue; }
      if (!told) { console.error(`(waiting for ${owner ? `another simulation on this machine, pid ${owner}` : 'the simulations queued before this one'}; --no-wait runs at once)`); told = true; }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
    drop();
    process.on('exit', () => { try { if (fs.readFileSync(lock, 'utf8') === String(process.pid)) fs.unlinkSync(lock); } catch {} });
    for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));
    // The files as they are now, our turn come, are what's played and stored
    // under (and whoever went first may have played these very rounds).
    const now = snapshot();
    if (now.key !== files.key) {
      files = now;
      if (!json) console.error('(the files changed while this run waited: they play as they are now)');
    }
    if (told || files === now) { look(); todo = missing(); }
    if (!todo.length) { done(); return; }
  }
  // The rounds go out one at a time to whichever core is free, so a long one
  // doesn't hold the rest up. (Each round has its own seed: it comes out the
  // same whichever core plays it, after whichever round.)
  const queue = [...todo], cores = Math.min(workers, todo.length), cpu = process.cpuUsage(), t0 = Date.now();
  Promise.all(Array.from({ length: cores }, () => new Promise((resolve, reject) => {
    const w = new Worker(BOOT, { eval: true, workerData: { self: SELF.text, selfFile: SELF.file, game: files.game, other: files.other, seats, state: files.state, stateFile: STATE_FILE, root: ROOT, seed, ahead, signs, saveAt } });
    const feed = () => { const r = queue.shift(); w.postMessage(r === undefined ? null : { r, saved: stored ? stored.get(r) : null }); };
    w.on('message', ({ r, line }) => { have.set(r, line); feed(); });
    w.once('error', reject);
    w.once('exit', resolve);
    feed();
  }))).then(() => {
    const used = process.cpuUsage(cpu), seconds = (used.user + used.system) / 1e6, rest = rounds - todo.length;
    if (!json) console.error(`(played ${todo.length} round${todo.length === 1 ? '' : 's'}${saveAt != null ? ` to ${saveAt / 1000}s` : ''} on ${cores} core${cores === 1 ? '' : 's'}: ${Math.round(seconds)} s of CPU in ${Math.round((Date.now() - t0) / 1000)} s`
      + `${rest ? `; ${rest} ${stored ? 'over before the save or ' : ''}read from the cache` : ''})`);
    // (Into the cache, with whatever another run has put there meanwhile.)
    if (cached) {
      try {
        const now = linesByRound(cachedLines());
        for (const r of todo) now.set(r, have.get(r));
        const lines = [...now.keys()].sort((a, b) => a - b).map(r => now.get(r));
        writeLines(cached, saveAt != null ? [head()].concat(lines) : lines);
      } catch (e) { console.error(`(couldn't write the cache: ${e.message})`); }
      tidy(CACHE);
    }
    done({ rounds: todo.length, cpu: seconds });
  }).catch(err => { console.error(err); process.exit(1); });
} else if (!isMainThread) {
  // A core: plays the rounds it's handed (or goes on with them), one at a
  // time, with the files' texts it was handed (the ones in the key).
  const State = fromText(workerData.state, workerData.stateFile);
  const { E, T, ctx } = loadGame(workerData.game, workerData.other);
  const roots = { SnakeAI: ctx.window.SnakeAI, SnakeEngine: ctx.window.SnakeEngine, TUNING: ctx.window.TUNING };
  const known = State.known(roots), decode = State.decoder(ctx), pristine = State.fingerprint(roots);
  parentPort.on('message', job => {
    if (!job) { parentPort.close(); return; }
    const saved = job.saved && decode(parsed(job.saved), known);
    const out = playRound(E, T, job.r, workerData, saved);
    if (out.state && State.fingerprint(roots) !== pristine) throw new Error("the game changed its own objects (its personalities, DIRS or TUNING) while playing, so a stored round wouldn't go on exactly");
    parentPort.postMessage({ r: out.r, line: out.state ? lineOf(out.r, 'state', State.encode(out.state, known)) : lineOf(out.r, workerData.saveAt != null ? 'done' : 'result', out.result) });
  });
}

// (For tools/abtest.js: the trademarks, measured the same way.)
module.exports = { TRADEMARKS };
