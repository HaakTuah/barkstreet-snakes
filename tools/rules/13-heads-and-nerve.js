// ---------------------------------------------------------------- the owner's playtest: rivals too shy of heads
{ // Every rival 8 long heading right along a row, an apple 3 cells on in its lane; a rival 6 long heading up at
  // the lane, 4 cells below it as last seen (a moment ago: age 2), so 2 below it by now, and the cell in front of
  // me is 2 straight ahead of it. It could get there only by a flash, and a plain flash costs its rest: a snake
  // spends one racing for food on its line, not to cross a cell it can't crawl to. So every rival but the
  // flinchiest crosses in front of it to the apple (none did: the flash cell was feared as if it would). But the
  // same rival holding a golden dash, or with an apple on its line (it may well flash for it), still turns
  // nearly every rival away.
  const run = (more, food) => {
    const rival = { ...aiRival(1, Array.from({ length: 6 }, (_, i) => [11, 14 + i]), 'up'), ...more };
    const view = aiView({ me: aiMe(line(10, 10, 8), 'right'), others: [rival, aiRival(2, [[25, 25], [25, 24], [25, 23], [25, 22], [25, 21]], 'down')], food: food.map(f => ({ kind: 'food', expires: 999, ...f })) });
    return Object.keys(AI.PERSONAS).filter(key => {
      let on = 0;
      for (let i = 0; i < 4; i++) { const d = AI.decide(view, AI.PERSONAS[key], {}); if (d.x === 1 && d.y === 0) on++; }
      return on >= 3;
    });
  };
  seededWhile(81, () => {
    const plain = run({}, [{ x: 13, y: 10 }]);
    check('a rival 2 cells off, which only a flash would bring into my way: at least 15 of 18 cross in front of it', plain.length >= 15, `${plain.length}: ${plain.join(' ')}`);
    const dash = run({ dashes: 1 }, [{ x: 13, y: 10 }]), meal = run({}, [{ x: 13, y: 10 }, { x: 11, y: 9 }]);
    check('...but holding a golden dash, or with an apple on its line, it still turns nearly every rival away (3 at most cross)', dash.length <= 3 && meal.length <= 3, `dash: ${dash.join(' ')}; apple on its line: ${meal.join(' ')}`);
  });
}
// ---------------------------------------------------------------- the owner's playtest: nerve at a contested apple
{ // Heading right, an apple straight in front of me; a rival heading left at it, seen 3 cells off a moment ago
  // (age 1), so 2 off by now: the apple is a step for each of us, a head-on if we both go. Every persona backs
  // off, as it should, but Desperado takes the gamble always, and Gobbler the hungrier it is (a persona's nerve,
  // read where the risk is weighed for the apple's cell: the risk maps stay as they are).
  const takers = hungerLeft => Object.keys(AI.PERSONAS).filter(key => {
    const view = aiView({
      age: 1, food: [{ x: 11, y: 10, kind: 'food', expires: 999 }],
      me: aiMe(line(10, 10, 6), 'right', { hungerLeft, starveIn: hungerLeft + 5000 }),
      others: [aiRival(1, line(13, 10, 5, 1), 'left'), aiRival(2, [[20, 20], [20, 19], [20, 18], [20, 17]], 'down')],
    });
    let on = 0;
    for (let i = 0; i < 4; i++) { const d = AI.decide(view, AI.PERSONAS[key], {}); if (d.x === 1 && d.y === 0) on++; }
    return on >= 3;
  });
  const fed = takers(99999), half = takers(8000), hungry = takers(4000);
  check('at a contested apple, fed, only Desperado takes the gamble', fed.join() === 'desperado', fed.join(' '));
  check('...Gobbler too once it is hungry (4 s left), not half-way (8 s); nobody else', half.join() === 'desperado' && hungry.sort().join() === 'desperado,gobbler', `8 s: ${half.join(' ')}; 4 s: ${hungry.join(' ')}`);
}
