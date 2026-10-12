// Snake chatter: the AI snakes talk. Speech bubbles follow the speaker's
// head, and the last few lines are kept in a log under the board. Purely
// cosmetic; it never affects how anyone plays.
window.SnakeChatter = (() => {
  // {who} is the other snake in the moment (victim, intruder, ...). The human
  // is "you". Lines are picked at random.
  const VOICES = {
    hunter: {
      hungry: ["Hungry. Someone will do."],
      start: ['Let the hunt begin.', 'I can smell fear.', 'Run. It helps.'],
      idle: ['I see you, {who}.', 'Nowhere to hide.', 'Closer…', 'Tick tock, {who}.'],
      kill: ['Next.', 'Too slow, {who}.', 'That one was easy.'],
      golden: ['Gold makes you slow.'],
      dies: ['Hunted… by the hunted?', 'Impossible.'],
    },
    gobbler: {
      hungry: ["So… hungry… can't… go on…","FOOD. NOW."],
      start: ['Is it lunchtime? It feels like lunchtime.', 'I could eat.'],
      idle: ['Nom.', 'Anyone gonna finish that apple?', 'I smell apples.', 'Snack time!', 'Is that… food?'],
      eat: ['Nom nom nom.', 'Delicious!', 'More!', 'Crunchy!'],
      golden: ['GOLDEN APPLE. MINE.', 'Shiny AND tasty!'],
      spawn: ['A GOLDEN APPLE! Out of my way!'],
      mushroom: ['Ugh, mushrooms. Gross.', 'I feel… smaller. I hate it.'],
      kill: ['Sorry {who}, you were between me and lunch.', 'Oops. Is that meat?'],
      dies: ['Tell my apples… I loved them.'],
    },
    ghost: {
      hungry: ["…hungry…"],
      start: ['…'],
      idle: ['…', '……', '(silence)', 'boo.'],
      mushroom: ['smaller… better…'],
      kill: ['…sorry.'],
      dies: ['…'],
    },
    sovereign: {
      hungry: ["We require a banquet. Immediately."],
      start: ['Kneel.', 'We are pleased to receive you. Do not touch anything.'],
      idle: ['Our lands are vast.', 'We are not amused.', 'This bark is royal bark.'],
      intruder: ['Trespasser! Guards! …We are the guards.', '{who}, you stand on royal bark!', 'Off our land, {who}!'],
      kill: ['Justice is served.', 'The Crown is merciful. Usually.'],
      dies: ['The king is dead…', 'Long live… someone else.'],
    },
    colonist: {
      hungry: ["I say, is there nothing to eat out here?"],
      start: ['Splendid day for an expedition!', 'Tally ho!'],
      idle: ['I say!', 'Jolly good.', 'Anyone for tea?', 'Rule, Britannia!'],
      flag: ['I claim this bark for the Crown!', 'Another colony! Splendid.', 'Mine now. Terribly sorry.'],
      intruder: ['Oi! That\'s a colony, {who}!', 'I say, that patch is spoken for.'],
      kill: ['Frightfully sorry, old chap.', 'Should have read the flag, {who}.'],
      dies: ['Stiff upper lip…'],
    },
    drab: {
      hungry: ["I should eat something."],
      start: ['Hello.', 'Hi. I\'m Drab.'],
      idle: ['Nice weather.', 'Apples are fine.', 'I like beige.', 'This is a tree.', 'Hm.'],
      eat: ['Apple.'],
      woodpecker: ['Oh. A bird.'],
      kill: ['Oh. Sorry, {who}.'],
      dies: ['Well. That happened.'],
    },
    vulture: {
      hungry: ["Someone die already. I'm starving."],
      start: ['Ahh, fresh snakes.'],
      idle: ['Not long now…', 'You look tired, {who}.', 'I\'ll wait.', 'Patience…'],
      death: ['Dinner!', 'Ooh, leftovers.', 'Rest in pieces, {who}.'],
      kill: ['I didn\'t even have to try.'],
      dies: ['Who\'s… eating… whom…'],
    },
    mason: {
      hungry: ["Panem et circenses. Mostly panem."],
      start: ['Alea iacta est.', 'Let us build.'],
      idle: ['Divide et impera.', 'Veni, vidi, aedificavi.', 'A wall a day…', 'Building a wall. Wildcard isn\'t paying.',
        'Veni, vidi… veni again.', 'Carpe diem. Carpe apple.', 'In vino veritas. In bark… splinters.', 'Alea iacta est. Oops, that was my lunch.'],
      kill: ['Veni, vidi, vici.', 'Should have gone around, {who}.'],
      dies: ['Et tu, {who}?'],
    },
    wildcard: {
      hungry: ["Very hungry. The hungriest. Nobody has ever been this hungry."],
      start: ['Hello, everybody. Tremendous crowd today.', 'I\'m going to win. Bigly.'],
      idle: ['Nobody slithers better than me, believe me.', 'I have the best scales. Everybody says so.',
        'Many snakes are saying it.', 'Sad!', 'Fake apples!', '{who}? Total loser. Sad!'],
      eat: ['Tremendous apple. The best apple.'],
      golden: ['A golden apple. Very classy. Like me.'],
      mushroom: ['Fake food! Very unfair!'],
      kill: ['You\'re fired, {who}!', 'Winning! So much winning.'],
      dies: ['Rigged! Totally rigged!'],
    },
    creeper: {
      hungry: ["so… hungry…"],
      start: ['psst.'],
      idle: ['behind you.', 'don\'t turn around, {who}.', 'hehehe.', 'nice tail, {who}.'],
      kill: ['hehe. gotcha.'],
      dies: ['…aww.'],
    },
    metagamer: {
      hungry: ["Caloric deficit detected."],
      start: ['Analysing opponents…', 'I\'ve watched the replays.'],
      idle: ['{who}: {label}. Noted.', 'Predictable.', 'Your eat rate is suboptimal, {who}.', 'Running the numbers…'],
      kill: ['As calculated.', 'Exactly as the model predicted.'],
      dies: ['That… wasn\'t in the data.'],
    },
    capricious: {
      hungry: ["Now I'm hungry! Out of nowhere!"],
      start: ['Ooh, what shall I be today?'],
      mood: {
        hunter: ['I\'m a hunter now! Grr!'],
        gobbler: ['Ooh! I\'m hungry now!'],
        ghost: ['Leave me alone. I mean it.'],
        mason: ['Let\'s build something!'],
      },
      kill: ['Didn\'t plan that. Love it.'],
      dies: ['Changed my mind about living.'],
    },
    copycat: {
      start: ['同志们好！'],
      idle: ['为人民服务！', '团结就是力量！', '同志们，冲啊！', '五年计划，提前完成！'],
      kill: ['向前进！'],
      dies: ['同志们，再见……'],
    },
    desperado: {
      hungry: ["Running on empty. Love it."],
      start: ['Yeehaw!', 'Saddle up, partner.'],
      idle: ['Living on the edge, partner.', 'Too close? Never heard of it.', 'Is that a wall? Let\'s go see.', 'Feel that? That\'s being alive.'],
      kill: ['Draw, {who}. Too slow.', 'This bark ain\'t big enough for the both of us.'],
      mushroom: ['Never tried one of those. Down the hatch!'],
      woodpecker: ['Now we\'re talking! Holes!'],
      dies: ['What a ride…', 'Worth it.'],
    },
    joker: {
      hungry: ["Why did the snake cross the bark? It was starving."],
      start: ['Knock knock!', 'Who wants to play a game?'],
      idle: ['Catch me if you can!', 'Why so slithery, {who}?', 'Follow me, it\'s a shortcut!', 'Honk honk!'],
      kill: ['Gotcha! Ha!', 'The joke\'s on you, {who}!'],
      mushroom: ['Ooh, a funny mushroom!'],
      dies: ['Tough crowd…'],
    },
  };

  // Chinese for every line above: Copycat repeats what it hears, in Chinese.
  const ZH = {
    "Hungry. Someone will do.": "饿了。随便谁都行。",
    "So… hungry… can't… go on…": "好……饿……撑……不住了……",
    "FOOD. NOW.": "食物。马上。",
    "…hungry…": "……饿……",
    "We require a banquet. Immediately.": "朕要设宴。立刻。",
    "I say, is there nothing to eat out here?": "我说，这里就没有吃的吗？",
    "I should eat something.": "我该吃点东西了。",
    "Someone die already. I'm starving.": "快死一个吧。我饿坏了。",
    "Panem et circenses. Mostly panem.": "面包和马戏。主要是面包。",
    "Very hungry. The hungriest. Nobody has ever been this hungry.": "非常饿。最饿的。从来没有人这么饿过。",
    "so… hungry…": "好……饿……",
    "Caloric deficit detected.": "检测到热量不足。",
    "Now I'm hungry! Out of nowhere!": "我现在饿了！突然就饿了！",
    "Running on empty. Love it.": "油箱空了。我喜欢。",
    "Why did the snake cross the bark? It was starving.": "蛇为什么要爬过树皮？因为它饿坏了。",
    "Veni, vidi… veni again.": "我来，我见……我又来了。",
    "Carpe diem. Carpe apple.": "及时行乐。及时吃苹果。",
    "In vino veritas. In bark… splinters.": "酒后吐真言。树皮里……全是刺。",
    "Alea iacta est. Oops, that was my lunch.": "骰子已经掷下。哎呀，那是我的午饭。",
    "Yeehaw!": "咿哈！",
    "Saddle up, partner.": "上马吧，伙计。",
    "Living on the edge, partner.": "刀尖上过日子，伙计。",
    "Too close? Never heard of it.": "太近了？没听说过。",
    "Is that a wall? Let's go see.": "那是墙吗？去看看。",
    "Feel that? That's being alive.": "感觉到了吗？这才叫活着。",
    "Draw, {who}. Too slow.": "拔枪吧，{who}。太慢了。",
    "This bark ain't big enough for the both of us.": "这块树皮容不下我们两个。",
    "Never tried one of those. Down the hatch!": "从没吃过这个。干了！",
    "Now we're talking! Holes!": "这才带劲！洞！",
    "What a ride…": "真是一趟好旅程……",
    "Worth it.": "值了。",
    "Let the hunt begin.": "狩猎开始。",
    "I can smell fear.": "我闻到了恐惧。",
    "Run. It helps.": "跑吧。有点用。",
    "I see you, {who}.": "我看见你了，{who}。",
    "Nowhere to hide.": "无处可藏。",
    "Closer…": "再近一点……",
    "Tick tock, {who}.": "滴答滴答，{who}。",
    "Next.": "下一个。",
    "Too slow, {who}.": "太慢了，{who}。",
    "That one was easy.": "这个太简单了。",
    "Gold makes you slow.": "金子会让你变慢。",
    "Hunted… by the hunted?": "猎人……被猎物猎杀？",
    "Impossible.": "不可能。",
    "Is it lunchtime? It feels like lunchtime.": "午饭时间到了吗？感觉像午饭时间。",
    "I could eat.": "我还能吃。",
    "Nom.": "吧唧。",
    "Anyone gonna finish that apple?": "那个苹果有人要吃吗？",
    "I smell apples.": "我闻到苹果了。",
    "Snack time!": "零食时间！",
    "Is that… food?": "那是……吃的吗？",
    "Nom nom nom.": "吧唧吧唧吧唧。",
    "Delicious!": "好吃！",
    "More!": "还要！",
    "Crunchy!": "脆脆的！",
    "GOLDEN APPLE. MINE.": "金苹果。是我的。",
    "Shiny AND tasty!": "又亮又好吃！",
    "A GOLDEN APPLE! Out of my way!": "金苹果！让开！",
    "Ugh, mushrooms. Gross.": "呃，蘑菇。恶心。",
    "I feel… smaller. I hate it.": "我觉得……变小了。我讨厌这样。",
    "Sorry {who}, you were between me and lunch.": "抱歉，{who}，你挡住我的午饭了。",
    "Oops. Is that meat?": "哎呀。那是肉吗？",
    "Tell my apples… I loved them.": "告诉我的苹果……我爱过它们。",
    "…": "……",
    "……": "…………",
    "(silence)": "（沉默）",
    "boo.": "吓！",
    "smaller… better…": "更小……更好……",
    "…sorry.": "……对不起。",
    "Kneel.": "跪下。",
    "We are pleased to receive you. Do not touch anything.": "朕很高兴接见你。什么都别碰。",
    "Our lands are vast.": "朕的疆土辽阔。",
    "We are not amused.": "朕不觉得好笑。",
    "This bark is royal bark.": "这是皇家树皮。",
    "Trespasser! Guards! …We are the guards.": "擅闯者！来人！……朕就是来人。",
    "{who}, you stand on royal bark!": "{who}，你站在皇家树皮上！",
    "Off our land, {who}!": "滚出朕的领地，{who}！",
    "Justice is served.": "正义已得伸张。",
    "The Crown is merciful. Usually.": "王室是仁慈的。通常是。",
    "The king is dead…": "国王死了……",
    "Long live… someone else.": "……其他人万岁。",
    "Splendid day for an expedition!": "探险的好日子！",
    "Tally ho!": "冲啊！",
    "I say!": "我说！",
    "Jolly good.": "好极了。",
    "Anyone for tea?": "有人要喝茶吗？",
    "Rule, Britannia!": "统治吧，不列颠尼亚！",
    "I claim this bark for the Crown!": "我以王室之名占领这块树皮！",
    "Another colony! Splendid.": "又一块殖民地！妙极了。",
    "Mine now. Terribly sorry.": "现在归我了。非常抱歉。",
    "Oi! That's a colony, {who}!": "喂！那是殖民地，{who}！",
    "I say, that patch is spoken for.": "我说，那块地已经有主了。",
    "Frightfully sorry, old chap.": "万分抱歉，老伙计。",
    "Should have read the flag, {who}.": "你该看看旗子的，{who}。",
    "Stiff upper lip…": "保持镇定……",
    "Hello.": "你好。",
    "Hi. I'm Drab.": "嗨。我是Drab。",
    "Nice weather.": "天气不错。",
    "Apples are fine.": "苹果还行。",
    "I like beige.": "我喜欢米色。",
    "This is a tree.": "这是一棵树。",
    "Hm.": "嗯。",
    "Apple.": "苹果。",
    "Oh. A bird.": "哦。一只鸟。",
    "Oh. Sorry, {who}.": "哦。对不起，{who}。",
    "Well. That happened.": "好吧。就这样了。",
    "Ahh, fresh snakes.": "啊，新鲜的蛇。",
    "Not long now…": "快了……",
    "You look tired, {who}.": "你看起来很累，{who}。",
    "I'll wait.": "我会等。",
    "Patience…": "耐心……",
    "Dinner!": "开饭了！",
    "Ooh, leftovers.": "哦，剩菜。",
    "Rest in pieces, {who}.": "碎碎平安，{who}。",
    "I didn't even have to try.": "我都没怎么出力。",
    "Who's… eating… whom…": "谁……吃……谁……",
    "Alea iacta est.": "骰子已经掷下。",
    "Let us build.": "我们来建造吧。",
    "Divide et impera.": "分而治之。",
    "Veni, vidi, aedificavi.": "我来，我见，我建。",
    "A wall a day…": "一天一堵墙……",
    "Building a wall. Wildcard isn't paying.": "在建墙。Wildcard不付钱。",
    "Veni, vidi, vici.": "我来，我见，我征服。",
    "Should have gone around, {who}.": "你该绕过去的，{who}。",
    "Et tu, {who}?": "还有你吗，{who}？",
    "Hello, everybody. Tremendous crowd today.": "大家好。今天人山人海，了不起。",
    "I'm going to win. Bigly.": "我会赢的。大赢特赢。",
    "Nobody slithers better than me, believe me.": "没人比我爬得更好，相信我。",
    "I have the best scales. Everybody says so.": "我的鳞片是最好的。大家都这么说。",
    "Many snakes are saying it.": "很多蛇都这么说。",
    "Sad!": "可悲！",
    "Fake apples!": "假苹果！",
    "{who}? Total loser. Sad!": "{who}？彻底的失败者。可悲！",
    "Tremendous apple. The best apple.": "了不起的苹果。最好的苹果。",
    "A golden apple. Very classy. Like me.": "金苹果。很高级。像我一样。",
    "Fake food! Very unfair!": "假食物！非常不公平！",
    "You're fired, {who}!": "你被解雇了，{who}！",
    "Winning! So much winning.": "赢！赢太多了。",
    "Rigged! Totally rigged!": "作弊！完全是作弊！",
    "psst.": "嘘。",
    "behind you.": "在你后面。",
    "don't turn around, {who}.": "别回头，{who}。",
    "hehehe.": "嘿嘿嘿。",
    "nice tail, {who}.": "尾巴不错，{who}。",
    "hehe. gotcha.": "嘿嘿。抓到你了。",
    "…aww.": "……哎。",
    "Analysing opponents…": "正在分析对手……",
    "I've watched the replays.": "我看过录像了。",
    "{who}: {label}. Noted.": "{who}：{label}。已记录。",
    "Predictable.": "可预测。",
    "Your eat rate is suboptimal, {who}.": "你的进食效率不是最优的，{who}。",
    "Running the numbers…": "正在计算……",
    "As calculated.": "一切尽在计算之中。",
    "Exactly as the model predicted.": "和模型预测的一模一样。",
    "That… wasn't in the data.": "这……不在数据里。",
    "Ooh, what shall I be today?": "哦，今天我当什么好呢？",
    "I'm a hunter now! Grr!": "我现在是猎人了！嗷！",
    "Ooh! I'm hungry now!": "哦！我现在饿了！",
    "Leave me alone. I mean it.": "别管我。我是认真的。",
    "Let's build something!": "我们来盖点东西吧！",
    "Didn't plan that. Love it.": "没计划过。但我喜欢。",
    "Changed my mind about living.": "我改变主意了……关于活着。",
    "Knock knock!": "咚咚！",
    "Who wants to play a game?": "谁想玩个游戏？",
    "Catch me if you can!": "有本事来抓我！",
    "Why so slithery, {who}?": "为什么这么滑溜，{who}？",
    "Follow me, it's a shortcut!": "跟我来，这是捷径！",
    "Honk honk!": "叭叭！",
    "Gotcha! Ha!": "抓到你了！哈！",
    "The joke's on you, {who}!": "你才是笑话，{who}！",
    "Ooh, a funny mushroom!": "哦，好玩的蘑菇！",
    "Tough crowd…": "观众真难搞……"
  };

  const SNAKE_GAP = 4500;  // ms of game time between lines from the same snake
  const ANY_GAP = 1200;    // ms between any two lines
  const BUBBLE_MS = 2600;  // how long a bubble stays up
  const LOG_SIZE = 5;

  let boardEl, logEl, grid, game;
  let enabled = true;
  let lastAny = -Infinity, lastSaid = {}, seen = {}, lastLine = null;
  const bubbles = new Map(); // snake id -> { el, snake, until }

  try { enabled = localStorage.getItem('snake-chatter') !== 'off'; } catch { /* storage unavailable */ }

  const pick = list => list[Math.floor(Math.random() * list.length)];

  // The log sits on dark wood: lighten dark colors so names stay readable.
  function readable(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
    if (0.299 * r + 0.587 * g + 0.114 * b > 140) return hex;
    const up = v => Math.round(v + (255 - v) * 0.5);
    return `rgb(${up(r)},${up(g)},${up(b)})`;
  }
  const nameOf = s => s.isPlayer ? 'you' : s.name;

  function init(opts) {
    ({ boardEl, logEl, grid } = opts);
  }

  function reset(g) {
    game = g;
    lastAny = -Infinity; lastSaid = {}; seen = {}; lastLine = null;
    for (const b of bubbles.values()) b.el.remove();
    bubbles.clear();
    logEl.innerHTML = '';
  }

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem('snake-chatter', on ? 'on' : 'off'); } catch { /* storage unavailable */ }
    if (!on) { for (const b of bubbles.values()) b.el.remove(); bubbles.clear(); }
    logEl.hidden = !on;
  }

  const isEnabled = () => enabled;

  // Have snake s say a line from one of its lists. urgent lines skip the global gap.
  function say(s, key, who, urgent = false) {
    if (!enabled || !s.persona) return;
    const voice = VOICES[s.personaKey];
    const lines = key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], voice) : voice?.[key];
    if (!lines?.length) return;
    const now = game.time;
    if (now - (lastSaid[s.id] ?? -Infinity) < SNAKE_GAP) return;
    if (!urgent && now - lastAny < ANY_GAP) return;
    const template = pick(lines);
    const label = (who && s.memory.labels?.[who.id]) || 'unclear';
    let text = fill(template, who ? nameOf(who) : 'you', label);
    if (text.startsWith('you')) text = 'Y' + text.slice(1);
    speak(s, text, { template, who, label });
  }

  const fill = (template, who, label) => template.replaceAll('{who}', who).replaceAll('{label}', label);

  function speak(s, text, source = null) {
    lastSaid[s.id] = game.time;
    lastAny = game.time;
    lastLine = { speaker: s, text, ...source };
    if (s.alive) showBubble(s, text);
    addLog(s, text);
  }

  function showBubble(s, text) {
    bubbles.get(s.id)?.el.remove();
    const el = document.createElement('div');
    el.className = 'bubble';
    el.textContent = text;
    el.style.setProperty('--edge', s.persona.ink || s.color);
    boardEl.appendChild(el);
    bubbles.set(s.id, { el, snake: s, until: performance.now() + BUBBLE_MS });
    place(bubbles.get(s.id));
  }

  // Bubbles sit above the speaker's head, flipped below near the top edge.
  function place(b) {
    const h = b.snake.body[0];
    b.el.style.left = `${Math.min(76, Math.max(24, (h.x + 0.5) / grid * 100))}%`;
    b.el.style.top = `${h.y / grid * 100}%`;
    b.el.classList.toggle('below', h.y < 3);
    if (b.el.classList.contains('below')) b.el.style.top = `${(h.y + 1) / grid * 100}%`;
  }

  function addLog(s, text) {
    const li = document.createElement('li');
    const who = document.createElement('strong');
    who.textContent = s.name;
    who.style.color = readable(s.persona.ink || s.color);
    li.append(who, ' ', text);
    logEl.prepend(li);
    while (logEl.children.length > LOG_SIZE) logEl.lastChild.remove();
  }

  // Called once per tick, after the engine moved everyone.
  function update() {
    if (!game) return;
    const now = performance.now();
    for (const [id, b] of bubbles) {
      if (now > b.until) { b.el.remove(); bubbles.delete(id); } else if (b.snake.alive) place(b);
    }
    if (!enabled) return;

    const ais = game.snakes.filter(s => s.persona);
    const alive = ais.filter(s => s.alive);
    const anyone = s => pick(game.snakes.filter(o => o !== s && o.alive)) || null;
    const byName = name => game.snakes.find(o => o.name === name);

    // Hello, round. One or two snakes speak up in the first seconds.
    if (game.tick === 6 || game.tick === 20) {
      const s = pick(alive.filter(a => !lastSaid[a.id]));
      if (s) say(s, 'start', anyone(s));
    }

    for (const e of game.events || []) {
      if (e.type === 'death') {
        const victim = e.snake;
        const killer = byName(victim.killer);
        if (killer?.persona && killer.alive && killer !== victim) say(killer, 'kill', victim, true);
        if (victim.persona) {
          lastSaid[victim.id] = -Infinity;
          say(victim, 'dies', killer && killer !== victim ? killer : null, true);
        }
        for (const v of alive) if (v.personaKey === 'vulture' && Math.random() < 0.6) say(v, 'death', victim);
      } else if (e.type === 'eat' && e.snake.persona) {
        if (e.kind === 'golden') say(e.snake, 'golden', null, true);
        else if (e.kind === 'mushroom') say(e.snake, 'mushroom');
        else if (Math.random() < 0.15) say(e.snake, 'eat');
      } else if (e.type === 'starving' && e.snake.persona) {
        say(e.snake, 'hungry', null, true);
      } else if (e.type === 'spawn') {
        for (const s of alive) if (s.personaKey === 'gobbler') say(s, 'spawn', null, true);
      } else if (e.type === 'woodpecker') {
        const s = pick(alive);
        if (s) { lastSaid[s.id] = -Infinity; say(s, VOICES[s.personaKey].woodpecker ? 'woodpecker' : 'idle', anyone(s), true); }
      }
    }

    for (const s of alive) {
      const m = s.memory, was = (seen[s.id] ||= {});
      // Sovereign / Colonist spotting an intruder.
      if (m.victimId != null && m.victimId !== was.victimId && (m.home || m.colonies)) {
        say(s, 'intruder', game.snakes.find(o => o.id === m.victimId));
      }
      if ((m.planted || 0) > (was.planted || 0)) say(s, 'flag');
      if (m.moodChangedAt != null && m.moodChangedAt !== was.mood) say(s, `mood.${m.mood}`, null, true);
      was.victimId = m.victimId;
      was.planted = m.planted || 0;
      was.mood = m.moodChangedAt;
    }

    // Copycat repeats exactly what it just heard, in Chinese.
    const cat = alive.find(s => s.personaKey === 'copycat');
    if (cat && lastLine?.template && lastLine.speaker !== cat && game.time - lastAny > 500 && Math.random() < 0.35) {
      if (game.time - (lastSaid[cat.id] ?? -Infinity) > SNAKE_GAP) {
        const who = lastLine.who ? (lastLine.who.isPlayer ? '你' : lastLine.who.name) : '你';
        speak(cat, fill(ZH[lastLine.template] ?? lastLine.template, who, lastLine.label));
      }
      lastLine = null;
    }
    if (lastLine && game.time - lastAny > 2000) lastLine = null;

    // Small talk now and then.
    if (game.time - lastAny > 3500 && Math.random() < 0.04) {
      const s = pick(alive);
      if (s) say(s, 'idle', anyone(s));
    }
  }

  return { init, reset, update, setEnabled, isEnabled };
})();
