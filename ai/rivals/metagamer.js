// Metagamer: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.metagamer = {
  name: 'Metagamer', color: '#22d3ee', look: 'metagamer', driver: 'metagamer',
  blurb: 'Studies how each rival plays, then counters it.',
  kill: ['Metagamer had you figured out.', 'Your playstyle: noted. Your round: over.', 'You were a data point.'],
  win: ['The spreadsheet called it.', 'Win probability: 100%.', 'GG.'],
  w: { ...DRAB, hunt: HUNT, lure: { weight: 5, dist: 6 } },
};

// Its power style (7c) is its counters, read from what it has seen of
// the rivals here (a share of the plain flash's price, as anyone's style:
// ai/styles.js): against a greedy one it races for food, against an
// evasive one it cuts the one it hunts, and with an aggressive one about
// it keeps a flash ready to escape. (Each mix of them over the weights
// it wears is one set, made once: Capricious and Copycat, wearing it,
// keep their own over them.)
const COUNTERS = { aggressive: { keep: 2 }, greedy: { race: 0.5 }, evasive: { cut: 0.5 } };
const COUNTER_FORMS = new WeakMap();

// Watch every rival's behaviour and counter it: keep away from the
// aggressive ones, shadow the greedy ones for their pellets, and once
// I'm grown, hunt the evasive ones.
DRIVERS.metagamer = function () {
  memory.obs ||= {};
  const allHeads = [myHead, ...heads];
  const labels = {};
  others.forEach((o, k) => {
    const ob = (memory.obs[o.id] ||= { len0: o.body.length, samples: 0, near: 0 });
    ob.samples++;
    if (allHeads.some(h => h !== heads[k] && manhattan(h, heads[k]) <= 4)) ob.near++;
    const eatRate = (o.body.length - ob.len0) / (ob.samples + 30);
    labels[o.id] = ob.near / ob.samples > 0.25 ? 'aggressive' : eatRate > 0.04 ? 'greedy' : 'evasive';
  });
  memory.labels = labels;
  const seen = Object.keys(COUNTERS).filter(l => others.some(o => labels[o.id] === l)), mix = seen.join();
  let forms = COUNTER_FORMS.get(intent.w);
  if (!forms) COUNTER_FORMS.set(intent.w, forms = {});
  intent.w = forms[mix] ||= { ...intent.w, style: powerStyle(Object.assign({}, ...seen.map(l => COUNTERS[l]))) };
  intent.avoid = others.map(o => labels[o.id] === 'aggressive' ? 20 : 0);
  const greedy = all.filter(k => labels[others[k].id] === 'greedy');
  if (greedy.length) intent.lure = greedy.reduce((a, b) => manhattan(myHead, heads[a]) <= manhattan(myHead, heads[b]) ? a : b);
  const grown = me.body.length + me.grow >= 14;
  if (grown) pickVictim(all.filter(k => labels[others[k].id] === 'evasive'), intent.w.hunt);
};
