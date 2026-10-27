// Snake chatter: the AI snakes talk. Speech bubbles follow the speaker's
// head, and the last few lines are kept in a log under the board. Purely
// cosmetic; it never affects how anyone plays.
window.SnakeChatter = (() => {
  // {who} is the other snake in the moment (victim, intruder, ...). The human
  // is "you". Lines are picked at random.
  // (Some moments, by key: under, the woodpecker pecked a hole under its body
  // (a body bridges it); cut, a golden dash cut it ({who} dashed); doused,
  // rain or snow put its fire out; ash and rot, food it was nearest burnt or
  // rotted; desperate, starving soon, it drops its errands for food; flash,
  // a plain flash that beat {who} to food (first) or shot past {who} (past);
  // last, the last apples are falling; choke, its head met its own bead (it
  // spits it aside and coughs); windfall, it ate food that a choking or
  // coughing snake knocked aside ({who} coughed); dug, a beetle it cornered
  // dug in and got away under the bark; knocked, food it was after, the
  // woodpecker knocked aside, and {who} ate it. Star's own: zoom, any
  // flash of its own; ready, its flash back from its rest; resting, small
  // talk while it rests; stash, a golden beetle it ate (a golden leaf's
  // flashes, it spends at once: a dash line). showoff: an answer to Star's
  // showing off ({who} is Star). The land's: realm.capital, the woodpecker
  // pecked Sovereign's capital and the realm moved; colony.lost, it pecked a
  // colony's flag cell and the colony's gone.)
  const VOICES = {
    sniper: {
      hungry: ["Hungry. Someone will do."],
      desperate: ['Out of rations. Going in.'],
      start: ['Taking position.', 'Scoping the lobby.', 'Run. It helps.'],
      idle: ['I see you, {who}.', 'In my sights, {who}.', 'Steady…', 'Nowhere to hide.', 'Big fan of your stream, {who}.'],
      kill: ['Headshot.', 'Next.', 'Too slow, {who}.', 'One shot.'],
      golden: ['Bonus collected.'],
      caught: ['Moving target. Still a headshot.', 'Target acquired.', 'Clean catch.'],
      ash: ['Target lost. Burnt.'],
      rot: ['Target expired.'],
      weather: { wind: ['Adjusting for wind.'], storm: ['Thunder masks the shot.'], snow: ['Cold barrel. Steady hands.'] },
      woodpecker: ['Air support. Not mine.'],
      last: ['Final supply drop.'],
      rainbow: ['Target marked: the end of the rainbow.'],
      bonk: ['Recalibrating.', 'Minor setback.', 'Bad angle.'],
      edge: ['Out of bounds.'],
      burning: ['Taking fire. Literally.'],
      doused: ['Fire’s out. Back on target.'],
      under: ['Hole under me. Holding position.'],
      cut: ['Lost my rear guard.'],
      choke: ['Friendly fire. Spat it out.', 'Own round. Ejected.'],
      windfall: ['Thanks for the assist, {who}.'],
      dug: ['Target went to ground.', 'Dug in. Lost the shot.'],
      knocked: ['That bird’s spotting for {who} now.'],
      gloat: ['Bounced off me, {who}? Cute.', 'Wrong lane, {who}.', 'Marked, {who}.'],
      dies: ['Counter-sniped by {who}?', 'Should have relocated.', 'Impossible.'],
      dash: ['Repositioning. Fast.'],
      flash: { first: ['Quick scope, {who}.'], past: ['Flanked you, {who}.'] },
      snip: ['Clean cut, {who}.'],
    },
    gobbler: {
      hungry: ["So… hungry… can’t… go on…","FOOD. NOW."],
      desperate: ['OUT OF MY WAY! I’M STARVING!', 'Any food. ALL the food.'],
      start: ['Is it lunchtime? It feels like lunchtime.', 'I could eat.'],
      idle: ['Nom.', 'Anyone gonna finish that apple?', 'I smell apples.', 'Snack time!', 'Is that… food?'],
      eat: ['Nom nom nom.', 'Delicious!', 'More!', 'Crunchy!'],
      golden: ['GOLDEN APPLE. MINE.', 'Shiny AND tasty!'],
      spawn: ['A GOLDEN APPLE! Out of my way!', 'Dibs on the golden one!', 'GOLD! FOOD! GOLD FOOD!'],
      beetle: ['A BEETLE! Crunchy legs, come to Gobbler!', 'Bug! Bug bug bug!'],
      caught: ['Crunchy! Legs and all.', 'Six legs, six times the flavour!'],
      mushroom: ['Ugh, mushrooms. Gross.', 'I feel… smaller. I hate it.', 'Who hid a mushroom in the snacks?!'],
      kill: ['Sorry, {who}. You were between me and lunch.', 'Oops. Is that meat?'],
      weather: { wind: ['It’s raining apples! Best day ever!'], rain: ['Mushroom weather. Yuck.'], sun: ['Golden hour? Golden SNACKS!'], snow: ['Winter? But what will I EAT?'] },
      woodpecker: ['Is it eating the log? Save me some!'],
      last: ['The LAST apples?! Save them for me!'],
      rainbow: ['A rainbow! Does the gold taste good?'],
      bonk: ['Ow! My snacks!', 'Oof. Dropped my lunch.', 'Ow! I need a snack.'],
      edge: ['Ow! Is the edge edible?'],
      burning: ['Am I… cooking? Smells good, actually.'],
      doused: ['Aw, put out. I was nearly crispy.'],
      under: ['A hole under me! Is there food down there?'],
      cut: ['My tail! That was full of food!'],
      choke: ['Ptooey! That one’s ME!', 'Blech! The one food I won’t eat.'],
      windfall: ['Don’t mind if I do, {who}!', 'You gonna eat that, {who}? No? Mine!'],
      dug: ['NO! My snack went DOWN!', 'It dug in?! Snacks aren’t allowed to dig!'],
      knocked: ['HEY! That bird gave {who} MY snack!', 'Pass it to ME, bird! Not {who}!'],
      baked: ['BAKED APPLES! Hot hot hot, worth it!'],
      ash: ['NOOO! My snack’s just ash now!'],
      rot: ['It went off before I got there!', 'Nooo, it rotted! Such a waste!'],
      goldbug: ['A GOLDEN beetle! Gold AND crunchy!'],
      leap: ['Wheee! Lunch from above!'],
      dies: ['Tell my apples… I loved them.'],
      dash: ['Fast food!'],
      flash: { first: ['Zoom! Mine, {who}!'] },
      snip: ['Snip! Snack-sized, {who}.'],
    },
    ghost: {
      hungry: ["…hungry…"],
      desperate: ['…must… eat…'],
      start: ['…'],
      idle: ['…', '……', '(silence)', 'boo.', '…hello?'],
      mushroom: ['…bitter.', '…fainter.'],
      ash: ['…ashes.'],
      rot: ['…withered.'],
      kill: ['…sorry.'],
      weather: { storm: ['…boom.'], rain: ['…drip.'], snow: ['…brr.'] },
      woodpecker: ['…tap… tap…'],
      last: ['…the last.'],
      rainbow: ['…pretty.'],
      bonk: ['…ow.', '…oops.'],
      burning: ['…warm.'],
      doused: ['…hiss.'],
      under: ['…hollow.'],
      cut: ['…lighter.'],
      choke: ['…ack.'],
      windfall: ['…thank you, {who}.'],
      dug: ['…gone under.'],
      knocked: ['…the bird gave it to {who}.'],
      flash: { past: ['…whoosh.'] },
      dies: ['…'],
    },
    sovereign: {
      hungry: ["We require a banquet. Immediately."],
      desperate: ['Forget the realm. Food, at once!'],
      start: ['Kneel.', 'We are pleased to receive you. Do not touch anything.'],
      idle: ['Our lands are vast.', 'We are not amused.', 'This bark is royal bark.', 'One day all this will be ours. Today, in fact.'],
      intruder: ['Trespasser! Guards! …We are the guards.', '{who}, you stand on royal bark!', 'Off our land, {who}!', 'Who let {who} in?',
        'The realm is closed to the public, {who}.', 'We do not recall inviting you, {who}.'],
      kill: ['Justice is served.', 'The Crown is merciful. Usually.'],
      weather: { sun: ['The sun shines on our realm.'], storm: ['We do not approve of this weather.'], rain: ['Fetch the royal umbrella.'], snow: ['Fetch the royal furs.'] },
      woodpecker: ['Who invited that bird?', 'We did not authorise this pecking.'],
      last: ['The last apples belong to the Crown.'],
      rainbow: ['The heavens salute us.'],
      realm: { grow: ['Our realm expands!', 'A greater sovereign needs a greater realm.', 'Behold: more kingdom.'], shrink: ['Our realm… contracts. Temporarily.', 'A strategic retreat. A royal one.'], move: ['The court relocates.', 'We have moved to better lands.'], burning: ['Our realm is ablaze! Fetch the royal bucket!', 'Who set fire to the royal grounds?'], pecked: ['That bird is pecking holes in OUR land!', 'Our realm, full of holes. Unacceptable.'], rotten: ['Something is rotten in our realm.', 'Rotting fruit on royal bark? Clear it at once!'], invaded: ['A colony? On OUR land, {who}?!', '{who} dares plant a flag in our realm!'],
        capital: ['The capital has fallen. Into a hole.', 'A hole where our throne stood? The court moves at once.'] },
      bonk: ['We meant to do that.', 'Who put that there?', 'We shall have it executed.'],
      edge: ['Move the edge. We command it.'],
      burning: ['Fetch the royal bucket!'],
      doused: ['We are put out. In every sense.'],
      ash: ['Our supper, burnt to a cinder. Fetch the royal cook.'],
      rot: ['Rotted before the Crown could dine. Disgraceful.'],
      under: ['That bird has committed treason.', 'A hole beneath the royal person? We do not stoop.'],
      cut: ['Treason, {who}! That was the royal tail.'],
      choke: ['We do not dine on Ourself.', 'Ptah! The royal tail is not on the menu.'],
      windfall: ['A tribute from {who}. How fitting.'],
      dug: ['The beetle has fled the realm. Downwards.', 'Come back at once, beetle. That is a royal command.'],
      knocked: ['That bird served {who} from the royal table. Unthinkable.'],
      gloat: ['Bow, {who}. Do not bump.', 'We felt that, {who}. We disapprove.', 'Mind the royal person, {who}.'],
      leap: ['We rise above it all.'],
      dies: ['The king is dead…', 'Long live… someone else.'],
      dash: ['Make way for the crown!'],
      flash: { first: ['The Crown dines first, {who}.'], past: ['Royal procession, {who}. Do keep up.'] },
      snip: ['Divided, {who}, and ruled.'],
      wrap: ['Our realm knows no edges now.'],
    },
    colonist: {
      hungry: ["I say, is there nothing to eat out here?"],
      desperate: ['Bother the colonies. I need lunch!'],
      start: ['Splendid day for an expedition!', 'Tally ho!'],
      idle: ['I say!', 'Jolly good.', 'Anyone for tea?', 'Rule, Britannia!'],
      flag: ['I claim this bark for the Crown!', 'Another colony! Splendid.', 'Mine now. Terribly sorry.', 'Run up the ensign!', 'Another ensign for the Empire!', 'I claim this for the Crown. Which crown? Mine.'],
      intruder: ['Ahem. That’s a colony, {who}.', 'I say, that patch is spoken for.', 'Do you have a flag, {who}? No flag, no colony.',
        'Papers, {who}? No? Off you pop.', 'British bark now, {who}. Wipe your scales.'],
      kill: ['Frightfully sorry, old chap.', 'Should have read the flag, {who}.'],
      weather: { rain: ['Ah, proper weather at last.', 'Rain? Just like home.'], storm: ['Batten down the hatches!'], sun: ['The sun never sets on us, you know.'], snow: ['Bracing! Simply bracing.'] },
      woodpecker: ['A woodpecker! Someone fetch my musket. Politely.'],
      last: ['The last apples? Ration them, chaps.'],
      rainbow: ['A rainbow! Plant a flag at the end of it!'],
      bonk: ['I say! Steady on!', 'Blast!', 'A minor diplomatic incident.'],
      burning: ['I appear to be on fire. How awkward.'],
      doused: ['Put out by the weather. How very British.'],
      under: ['Mind the gap!'],
      cut: ['Dash it, my tail!'],
      choke: ['Good heavens, that’s my own tail!', 'Ahem! Not cricket, eating oneself.'],
      windfall: ['Terribly kind of you, {who}.'],
      dug: ['Blast! It’s gone to ground.', 'I say, come back! Digging in is frightfully bad form.'],
      knocked: ['I say! That bird just served {who} my lunch.'],
      gloat: ['Mind the Empire, {who}.', 'I say, {who}! There’s a queue.', 'Do mind the paintwork, {who}.'],
      baked: ['Roast dinner! Splendid.'],
      ash: ['Burnt to a cinder. Like Sunday lunch.'],
      rot: ['Gone off. Frightfully wasteful.'],
      colony: { burning: ['I say, the colony’s on fire!', 'Fire in the colony! Form a bucket chain!'], pecked: ['That bird’s pecking up my colony!', 'Blast! Holes all over the colony.'], rotten: ['I say, something’s gone off in the colony.', 'Rotten fruit in the colony? Most unsanitary.'],
        lost: ['The flag’s gone down the hole! Abandon colony!', 'Blast! That bird’s pecked out a whole colony.'] },
      flash: { first: ['Snapped that up, {who}. Cheerio!'], past: ['Pardon me, {who}! Coming through!'] },
      dies: ['Stiff upper lip…'],
    },
    drab: {
      hungry: ["I should eat something."],
      desperate: ['I’ll eat anything now.'],
      start: ['Hello.', 'Hi. I’m Drab.'],
      idle: ['Nice weather.', 'Apples are fine.', 'I like beige.', 'This is a log.', 'Hm.'],
      eat: ['Food.', 'Eating.', 'Fine.', 'Tastes like food.'],
      ash: ['That’s ash now.'],
      rot: ['That went off.'],
      woodpecker: ['Oh. A bird.'],
      last: ['Last apples. Okay.'],
      kill: ['Oh. Sorry, {who}.'],
      weather: { rain: ['Rain. Great.'], sun: ['It’s sunny.'], wind: ['Windy.'], storm: ['Loud.'], snow: ['Cold.'] },
      rainbow: ['A rainbow. Colourful.'],
      bonk: ['Ow.', 'Oops.', 'That was a bump.'],
      edge: ['That’s the edge.'],
      burning: ['Hot.'],
      doused: ['Not on fire now. Good.'],
      under: ['There’s a hole under me.'],
      cut: ['Hm. Shorter.'],
      choke: ['That was me. Not food.'],
      windfall: ['Thanks, {who}.'],
      dug: ['It dug in. Okay.'],
      knocked: ['The bird gave my food to {who}. Hm.'],
      flash: { first: ['Got it first.'], past: ['Fast.'] },
      dies: ['Well. That happened.'],
    },
    vulture: {
      hungry: ["Someone die already. I’m starving."],
      desperate: ['No more waiting. I’ll make my own leftovers.'],
      start: ['Ahh, fresh snakes.'],
      idle: ['Not long now…', 'You look tired, {who}.', 'I’ll wait.', 'Patience…', 'Take your time, {who}. No rush.', 'Any minute now…'],
      death: ['Dinner!', 'Ooh, leftovers.', 'Rest in pieces, {who}.', 'Waste not, want not.'],
      ash: ['Overcooked. Even I won’t eat that.'],
      rot: ['Gone already? I like them ripe.'],
      kill: ['I didn’t even have to try.'],
      weather: { storm: ['Lightning. Something’s bound to cook.'], rain: ['Grim weather. Lovely.'], snow: ['Winter. The lean season. My season.'] },
      woodpecker: ['Ah. A colleague.'],
      last: ['The last apples. Then it’s just us.'],
      rainbow: ['Pretty. Someone will die chasing it.'],
      bonk: ['Not the plan.', 'I’m not on the menu.', 'Tsk.'],
      burning: ['I’m the one who eats the roast!'],
      doused: ['Put out. I’m nobody’s roast.'],
      under: ['A hole under me. Not my grave yet.'],
      cut: ['Leftovers… of me?'],
      choke: ['Ptoo. I’m not dead enough.'],
      windfall: ['Coughed it up for me, {who}? Thoughtful.'],
      dug: ['Buried itself. I can wait.', 'Gone to ground. It’ll come up again.'],
      knocked: ['Even the bird feeds {who} before me.'],
      gloat: ['Keep bumping, {who}. I’ll wait.', 'That looked expensive, {who}.', 'Smaller every time, {who}.'],
      flash: { first: ['Patience is overrated, {who}.'] },
      dies: ['Who’s… eating… whom…'],
    },
    mason: {
      start: ['Alea iacta est!', 'Aedificamus!'],
      idle: ['Vidi, vici, veni.', 'Veni, vidi, aedificavi.', 'Divide et imperium-ium.', 'Carpe applum!',
        'Murus maximus. Very bigus.', 'In barko veritas.', 'Wallus erectus.', 'Semper wallus.', 'Biggus wallus.',
        'Romanes eunt domus.', 'Amicus meus est Biggus Dickus.'],
      kill: ['Veni, vidi, vici.', 'Murum non vidisti, {who}?', 'Requiescat in barko, {who}.'],
      hungry: ['Panem! Panem et… panem!'],
      desperate: ['Muri postea! Panem nunc!'],
      woodpecker: ['Picus horribilis!'],
      last: ['Ultima poma!'],
      caught: ['Scarabaeus captus!', 'Crunchus deliciosus!'],
      ash: ['Cinis! Prandium meum!'],
      rot: ['Rottus maximus.'],
      weather: { storm: ['Iuppiter iratus est!'], rain: ['Pluvia! Aquaeductus, ubi es?'], sun: ['Sol invictus!'], wind: ['Ventus maximus!'], snow: ['Hiems venit!'] },
      rainbow: ['Arcus caelestis!'],
      bonk: ['Ouchus maximus.', 'Caput meum!', 'Bonkus interruptus.'],
      edge: ['Murus! Unde venit?'],
      burning: ['Roma ardet!'],
      doused: ['Roma salva est!'],
      under: ['Pons sum!', 'Pontem aedificavi!'],
      cut: ['Caudam meam!'],
      choke: ['Tussis maximus!', 'Non edibilis!'],
      windfall: ['Gratias, {who}!'],
      dug: ['Scarabaeus fugit!', 'Diggus escapus.'],
      knocked: ['Prandium meum, {who}?! Et tu, picus?'],
      gloat: ['Murum vidisti, {who}?', 'Murus sum, {who}.', 'Ecce murus, {who}.'],
      flash: { first: ['Veni, vidi, edi.'], past: ['Celerissimus!'] },
      dies: ['Et tu, {who}?', 'Alea iacta… estus.', 'Murus… meus… finis.'],
      wrap: ['Sine muro! Murus nullus!'],
      showoff: ['Festina lente, {who}!', 'Showoffus maximus.', 'Stella celerrima!'], // (answering Star: see showOff)
    },
    wildcard: {
      hungry: ["Very hungry. The hungriest. Nobody has ever been this hungry."],
      desperate: ['I’m taking all the food. All of it. Believe me.'],
      start: ['Hello, everybody. Tremendous crowd today.', 'I’m going to win. Bigly.'],
      idle: ['Nobody slithers better than me, believe me.', 'I have the best scales. Everybody says so.',
        'Many snakes are saying it.', 'Sad!', 'Fake apples!', '{who}? Total loser. Sad!'],
      eat: ['Tremendous snack. The best snack.', 'I only eat the best food. Everybody knows it.', 'Nobody eats like me. Nobody.'],
      golden: ['A golden apple. Very classy. Like me.'],
      mushroom: ['Fake food! Very unfair!', 'I’m bigger than ever. Ask anyone.'],
      kill: ['You’re fired, {who}!', 'Winning! So much winning.'],
      weather: { sun: ['Beautiful weather. The best weather. Everyone says so.'], storm: ['Nobody knows more about lightning than me.'], wind: ['Tremendous wind. So many apples.'], rain: ['Fake rain!'], snow: ['Global warming? Total hoax. Look at all this snow!'] },
      woodpecker: ['That bird is a disaster. Total disaster.'],
      last: ['The last apples. Beautiful apples. All mine.'],
      rainbow: ['Rainbows. Overrated. Great gold, though.'],
      bonk: ['Fake news! That never happened.', 'Very unfair. Everybody saw it.'],
      edge: ['Who moved that? Fake wall!'],
      burning: ['Hot. Very hot. The hottest. Tremendous.'],
      doused: ['Fire’s out. Nobody puts out fires like me.'],
      ash: ['Burnt to ash. Total disaster. Sad!'],
      rot: ['Rotten food. Who’s responsible? Not me.'],
      under: ['A hole under me? Fake hole. Didn’t even feel it.'],
      cut: ['{who} stole my tail! Total theft. Sad!'],
      choke: ['My own tail? Fake food! Sad!', 'Very unfair. Somebody put that there.'],
      windfall: ['Thank you, {who}. Very generous. Tremendous.'],
      dug: ['An illegal tunnel! Very unfair.', 'It dug a tunnel. Somebody build a wall!'],
      knocked: ['That bird works for {who}. Sad!'],
      gloat: ['{who}? Bounced right off me. Sad!', 'Low energy, {who}. Very low energy.', 'Nobody bumps me, {who}. Believe me.'],
      goldbug: ['A golden beetle! I love gold. Gold loves me.'],
      leap: ['Nobody jumps better than me.'],
      dies: ['Rigged! Totally rigged!'],
      dash: ['Fastest dash in history. Everyone says so.'],
      flash: { first: ['Mine, {who}. Tremendous speed.'], past: ['So fast. Faster than {who}. Everyone saw it.'] },
      snip: ['You’re cut, {who}! Tremendously cut.'],
      wrap: ['Walls? Who needs walls? Not today.'],
      showoff: ['Showing off, {who}? I show off better.', 'Fast? I invented fast, {who}.'], // (answering Star)
    },
    creeper: {
      hungry: ["so… hungry…"],
      desperate: ['no more sneaking. food.'],
      start: ['psst.'],
      idle: ['behind you.', 'don’t turn around, {who}.', 'hehehe.', 'nice tail, {who}.', 'don’t mind me.', 'we should hang out, {who}.'],
      kill: ['hehe. gotcha.'],
      ash: ['aww. crispy.'],
      rot: ['mm. mouldy.'],
      weather: { storm: ['hehe. flickery.'], rain: ['drip drip.'], snow: ['cold tail. still following.'] },
      woodpecker: ['pecky pecky. hehe.'],
      rainbow: ['shiny…'],
      bonk: ['oof.', 'shh. nobody saw that.'],
      burning: ['ow ow ow.'],
      doused: ['fizzle. hehe.'],
      under: ['shh. there’s a hole under me.'],
      cut: ['…my tail.'],
      choke: ['hck. that’s my tail.', 'blegh. tastes like me.'],
      windfall: ['hehe. dropped this, {who}.'],
      dug: ['aww. it hid.', 'i’ll find you, little bug.'],
      knocked: ['that was mine, {who}. hehe.'],
      gloat: ['hehe. bonk, {who}.', 'peekaboo, {who}.', 'i was right here, {who}.'],
      flash: { first: ['hehe. mine, {who}.'], past: ['zip. right past you, {who}.'] },
      dies: ['…aww.'],
    },
    metagamer: {
      hungry: ["Caloric deficit detected."],
      desperate: ['Hunger critical. Abandoning strategy.'],
      start: ['Analysing opponents…', 'I’ve watched the replays.'],
      idle: ['{who}: {label}. Noted.', 'Predictable.', 'Your eat rate is suboptimal, {who}.', 'Running the numbers…', 'Sample size: growing.', 'Off-meta play, {who}. Bold.'],
      kill: ['As calculated.', 'Exactly as the model predicted.'],
      ash: ['Item destroyed: fire.'],
      rot: ['Food despawned. Inefficient.'],
      weather: { storm: ['Strike probability: rising.'], rain: ['Mushroom density: up.'], sun: ['Golden apple odds: favourable.'], wind: ['Apple supply: increasing.'], snow: ['Food supply: down. Hunger rate: up.'] },
      woodpecker: ['Map shrink phase: started.'],
      last: ['Food spawns: final phase.'],
      rainbow: ['Golden apple confirmed at the rainbow’s end.'],
      bonk: ['Collision logged.', 'Variance.', 'Unforced error.'],
      edge: ['Map edge: confirmed.'],
      burning: ['Thermal damage: ongoing.'],
      doused: ['Burn status: cleared by weather.'],
      under: ['Terrain under me: compromised. Bridging.'],
      cut: ['Length reduced. Recomputing.'],
      choke: ['Own drop: no pickup. Cough debuff.', 'Self-pickup disabled. Noted.'],
      windfall: ['Free loot. Thanks, {who}.'],
      dug: ['Target burrowed. Chase: failed.', 'Dig-in escape. Noted.'],
      knocked: ['Knockback rule favoured {who}. Should have pathed it.'],
      gloat: ['Predicted that, {who}.', 'Pathing error, {who}.', 'Input lag, {who}?'],
      goldbug: ['Golden beetle: mobility upgrade.'],
      leap: ['Leap executed.'],
      dies: ['That… wasn’t in the data.'],
      dash: ['Dash: optimal.'],
      flash: { first: ['Frame-perfect, {who}.'], past: ['Speed check passed, {who}.'] },
      snip: ['Cut {who} in two. Noted.'],
    },
    capricious: {
      hungry: ["Now I’m hungry! Out of nowhere!"],
      desperate: ['New mood: STARVING.'],
      start: ['Ooh, what shall I be today?'],
      // Taking up a mood, it does an impression (and can't help asking how it went).
      mood: {
        sniper: ['Taking position. …Ooh, I like being Sniper.', 'Headshot! …Is that how Sniper says it?', 'Pew pew! …Sniper doesn’t say pew pew, does it?'],
        gobbler: ['FOOD. NOW. …Is Gobbler always this hungry?', 'Nom nom nom! I’m Gobbler now!', 'Snacks! All the snacks! …How does Gobbler stop?'],
        ghost: ['…', '…boo. …Am I doing Ghost right?', 'Shh. I’m being Ghost.'],
        mason: ['Aedificamus! …Ooh, I speak Latin now!', 'Veni, vidi, aedificavi! …Did I say that right?', 'Wallus maximus! …Is that Latin? It feels Latin.'],
      },
      kill: ['Didn’t plan that. Love it.'],
      weather: { sun: ['Sunshine! I love sunshine! Today.'], rain: ['Rain! I love rain! For now.'], storm: ['Storms are exciting! Or scary? Both!'], wind: ['Whee!'], snow: ['Snow! I love snow! For a bit.'] },
      woodpecker: ['A bird! I love birds! Not this one.'],
      rainbow: ['A rainbow! Every colour! I can’t choose!'],
      bonk: ['Ouch! Never doing that again! Probably.', 'Ow! That was fun! No it wasn’t.'],
      edge: ['Ouch! I hate edges! Today.'],
      burning: ['Fire! I love fire! Ow, no I don’t!'],
      doused: ['The fire’s out! I miss it already! No I don’t.'],
      ash: ['Ash! I love ash! No, I wanted that!'],
      rot: ['It rotted! I didn’t want it anyway! I did.'],
      under: ['A hole! I love holes! Not under me.'],
      cut: ['My tail! I liked that tail!'],
      choke: ['Ooh, my tail! Yum! No! Yuck!'],
      windfall: ['A present from {who}! I love presents! Today.'],
      dug: ['It dug in! Clever bug! Rotten bug!'],
      knocked: ['The bird gave {who} my lunch! Nice bird! Mean bird!'],
      leap: ['I can fly! For a second!'],
      dies: ['Changed my mind about living.'],
      dash: ['Zoom! I felt like it!'],
      flash: { first: ['Zip! Mine! Sorry, {who}! Not sorry!'], past: ['Whee! Hello and goodbye, {who}!'] },
      snip: ['Oops, {who}! Was that rude?'],
    },
    copycat: {
      desperate: ['饿了，同志们！什么都吃！'],
      start: ['同志们好！'],
      idle: ['为人民服务！', '团结就是力量！', '同志们，冲啊！', '五年计划，提前完成！', '自力更生！', '劳动最光荣！'],
      kill: ['向前进！'],
      ash: ['粮食烧成灰了，同志们！'],
      rot: ['浪费可耻，同志们！'],
      weather: { storm: ['雷电交加，同志们小心！'], rain: ['下雨了，同志们！'], snow: ['下雪了，同志们，节约粮食！'] },
      woodpecker: ['啄木鸟来了，同志们！'],
      last: ['最后的苹果，同志们！'],
      rainbow: ['彩虹！同志们，金苹果！'],
      bonk: ['哎哟！', '哎呀，同志们！'],
      burning: ['着火了，同志们！'],
      doused: ['火灭了，同志们！'],
      under: ['脚下有洞，同志们，不要怕！'],
      cut: ['尾巴没了，同志们！'],
      choke: ['咳咳！同志们，这是自己的尾巴！', '自己人不吃自己人！'],
      windfall: ['共同富裕，同志们！'],
      dug: ['深挖洞，广积粮！', '地道战！虫子跑了，同志们！'],
      knocked: ['粮食重新分配给{who}同志了！'],
      flash: { first: ['抢先一步，同志们！'], past: ['快马加鞭！'] },
      dies: ['同志们，再见……'],
    },
    desperado: {
      hungry: ["Running on fumes, partner."],
      desperate: ['Nothing left to lose, partner.'],
      start: ['Yeehaw!', 'Saddle up, partner.'],
      idle: ['Living on the edge, partner.', 'Too close? Never heard of it.', 'Is that the edge? Let’s go see.', 'Feel that? That’s being alive.',
        'Let’s make this interesting.', 'Who wants to play chicken?'],
      kill: ['Draw, {who}. Too slow.', 'This bark ain’t big enough for the both of us.'],
      mushroom: ['Mushroom roulette. Down the hatch!', 'Tasted like danger.', 'Bitter. Thrilling, though.', 'What doesn’t kill me… shrinks me.'],
      woodpecker: ['Now we’re talking! Holes!'],
      beetle: ['Yeehaw, a critter hunt!', 'Here, little critter…'],
      caught: ['Lassoed it.', 'Roped and branded.'],
      weather: { storm: ['Lightning? Now we’re talking!', 'Smell that? Here comes trouble.'], strike: ['Fire on the bark! Yeehaw!'], wind: ['Hold onto your hat!'], rain: ['Rain on the range.'], snow: ['Cold enough to freeze a cactus.'] },
      last: ['Last call, partner.'],
      rainbow: ['Race you to the gold, partner!'],
      bonk: ['Woo! Again!', 'Felt that one.', 'Now I’m awake!'],
      edge: ['Yep. That’s the edge, all right.'],
      burning: ['Yeehaw, I’m on fire!'],
      doused: ['Fire’s out? Shucks. Was just warming up.'],
      under: ['Hole under my boots! Yeehaw!'],
      cut: ['Shot my tail clean off!'],
      choke: ['Ptoo! Ate my own dust.', 'Hack! Bit off more than I can chew.'],
      windfall: ['Much obliged, {who}.'],
      dug: ['Varmint went to ground.', 'Dang critter dug itself a hidey-hole.'],
      knocked: ['That bird just dealt {who} my supper. Crooked dealer.'],
      gloat: ['Close one, {who}! Do it again.', 'Now that’s a rush, {who}!'],
      baked: ['Campfire grub!'],
      ash: ['Burnt the beans again.'],
      rot: ['Spoilt, partner. Left it too long.'],
      goldbug: ['Gold bug! Now that’s a prize, partner.'],
      leap: ['Yeehaw! Clean over!'],
      dies: ['What a ride…', 'Worth it.'],
      dash: ['Yeehaw, full gallop!'],
      flash: { first: ['Quick draw, {who}.'], past: ['Eat my dust, {who}!'] },
      snip: ['Cut you down to size, {who}.'],
    },
    mute: {
      desperate: ['*mimes a knife and fork, frantically*'],
      start: ['*waves silently*', '*takes a deep, silent bow*'],
      idle: ['*pulls an invisible rope*', '*trapped in an invisible box*', '*leans on nothing*', '*walks against an invisible wind*', '*tips an invisible hat at {who}*', '*draws a box in the air around {who}*',
        '*juggles invisible apples*', '*climbs an invisible ladder*'],
      kill: ['*mimes closing a lid on {who}*', '*plays a tiny invisible violin*'],
      caught: ['*mimes a very big beetle*', '*pats its tummy, silently*'],
      ash: ['*blows the ash away, sadly*'],
      rot: ['*holds its nose*'],
      weather: { rain: ['*opens an invisible umbrella*'], storm: ['*hides under an invisible table*'], wind: ['*leans into the wind*'], sun: ['*puts on invisible sunglasses*'], snow: ['*shivers, silently*'] },
      woodpecker: ['*covers its ears*'],
      last: ['*catches an invisible falling apple*'],
      rainbow: ['*hugs the rainbow*', '*paints the rainbow a little brighter*'],
      bonk: ['*rubs its head, silently*', '*mimes seeing stars*'],
      edge: ['*walks into a wall. A real one, this time*'],
      burning: ['*fans itself, frantically*'],
      doused: ['*wrings out its beret*'],
      under: ['*tightrope-walks over the hole*'],
      cut: ['*looks for its tail*'],
      choke: ['*clutches its throat, then spits*', '*coughs without a sound*'],
      windfall: ['*pats {who} on the back, mouth full*'],
      dug: ['*knocks on the bark, then shrugs*', '*digs with an invisible spade, then gives up*'],
      knocked: ['*points at the bird, then at {who}, aghast*'],
      gloat: ['*mimes {who} bouncing off*', '*holds up an invisible scorecard: 3*', '*dusts itself off, smugly*'],
      leap: ['*bows mid-air*'],
      dies: ['*mimes being squashed*', '*…*'],
      dash: ['*zooms off, holding its beret*'],
      flash: { first: ['*tips its beret at {who}, mouth full*'], past: ['*zips past {who}, waving*'] },
      snip: ['*mimes scissors at {who}*'],
      wrap: ['*walks into the edge… and out the other side*'],
      giggle: ['*shakes with silent laughter*'], // (at Mason's routine: see REPLIES)
      guffaw: ['*doubles over, silently*'],
    },
    ouroboros: {
      hungry: ['Even I must eat. Usually myself.', 'Hungry again. Of course.'],
      desperate: ['The hungry part again. I know how this ends.'],
      start: ['All things return.', 'Here we are again.'],
      idle: ['The end is the beginning.', 'Round and round.', 'I have done this before, {who}.', 'Everything comes back to me.',
        'Haven’t we met before, {who}?', 'Ah. This bit again.'],
      kill: ['Back to the start, {who}.', 'You were always going to end here.'],
      ash: ['Everything returns to ash.'],
      rot: ['Everything rots. Then grows again.'],
      woodpecker: ['Endings peck at everything.'],
      last: ['The last apples. Until the first ones, next time.'],
      rainbow: ['A circle, half drawn.'],
      bonk: ['I meant to come back here.', 'This has happened before.'],
      edge: ['Even the log has an end.'],
      burning: ['Fire, then ash, then again.'],
      doused: ['Out again. It always goes out.'],
      under: ['The ground gives way. I’ve crossed this before.'],
      cut: ['My tail! I was saving that.'],
      choke: ['The one thing I’m known for. And I choke.', 'Tail in mouth. It looked easier in the drawings.'],
      windfall: ['What you lose comes round to me, {who}.'],
      dug: ['Back into the wood. It will come round again.', 'Down it goes. Up it comes, in time.'],
      knocked: ['It came round to {who} this time. Next time, me.'],
      gloat: ['Around you go, {who}.', 'You’ll be back, {who}.', 'Again, {who}? Always again.'],
      weather: { snow: ['Winter returns. It always does.'], rain: ['The rain comes round again.'] },
      dies: ['…and begin again.', 'See you next time around.'],
      dash: ['The circle tightens. Quickly.'],
      flash: { first: ['I was always going to get there first, {who}.'] },
      snip: ['Now you know how it feels, {who}.'],
      wrap: ['No end, no beginning. As it should be.'],
    },
    joker: {
      hungry: ["Why did the snake cross the bark? It was starving.", 'Knock knock! Who’s there? Lunch, I hope.'],
      desperate: ['No more jokes. Food.'],
      start: ['Knock knock!', 'Who wants to play a game?'],
      idle: ['Catch me if you can!', 'Why so slithery, {who}?', 'Follow me, it’s a shortcut!', 'Honk honk!', 'Pull my tail!', 'Wanna hear a joke, {who}?'],
      kill: ['And for my next trick…', 'The joke’s on you, {who}!'],
      mushroom: ['Ooh, a funny mushroom!', 'Fungi! Fun guy! …No?', 'Not so funny now.', 'Mushroom? I hardly know ’em!'],
      ash: ['Ashes to ashes, snack to dust!'],
      rot: ['Rotten luck!'],
      weather: { rain: ['Singin’ in the rain!'], storm: ['Shocking!'], wind: ['Blow, wind, blow!'], sun: ['Sun’s out, puns out!'], snow: ['Snow joke!'] },
      woodpecker: ['Knock knock! Oh. It’s the woodpecker.'],
      last: ['Last apples! Get ’em while they’re falling!'],
      rainbow: ['Somewhere over the… oh, there it is.'],
      bonk: ['Ow! That one’s on me.', 'Slapstick!', 'Ba-dum-tss!'],
      burning: ['Hot stuff, coming through!'],
      doused: ['Fire’s out! What a wet blanket.'],
      under: ['Ha! The bird’s got jokes.', 'Hole-y moly!'],
      cut: ['Hey! Sawing in half is MY trick, {who}!'],
      choke: ['Hack! That joke went down the wrong way.'],
      windfall: ['Gesundheit, {who}! Thanks for lunch.'],
      dug: ['Ha! The old trapdoor trick.', 'Where’d the bug go? Hole in one!'],
      knocked: ['Knock knock! Who’s there? {who}, with my lunch.'],
      gloat: ['Knock knock, {who}! …Bonk!', 'Boing! Do it again, {who}!', 'Classic {who}. Never gets old.'],
      leap: ['Hup! Ta-daaa!'],
      dies: ['Tough crowd…'],
      dash: ['Wheeee, nyoom!'],
      flash: { first: ['Now you see it, {who}. Now you don’t!'], past: ['Beep beep, {who}!'] },
      snip: ['Ta-da! {who}, sawn in half!'],
    },
    // A jolly old-timer who can't stop showing off: its own flashes and jumps
    // (zoom, leap, dash), its flash back from its rest (ready), grumbling
    // while it rests (resting, in its small talk) and golden power food it
    // eats (stash, a golden beetle; a golden leaf's flashes, spent at once,
    // get a dash line). See showOff.
    star: {
      hungry: ['Can’t flash on an empty stomach.'],
      desperate: ['Even a star’s got to eat!'],
      start: ['Stand back, young’uns. Watch this.', 'Oh, I’ve waited all day for this!'],
      idle: ['In my day we flashed uphill both ways!', 'Did I tell you I once jumped the whole log, {who}?', 'Keep up, {who}! I’m only warming up.',
        'This mustache has seen things, {who}.', 'Sitting still is for rocks.', 'I was fast before fast was cool.'],
      resting: ['Rest, rest, rest. I’ll rest when I’m old!', 'Come on, come on… I’m not getting any younger.', 'Hmph. In my day, a flash came right back.',
        'Don’t mind me, {who}. Just catching my breath.', 'Grumble, grumble. Is it ready yet?'],
      ready: ['There’s my sparkle! Look out.', 'Rested! Well, rested enough.', 'Back in business!', 'Ah, there it is! Who’s next?'],
      zoom: ['Whee! Still got it!', 'Zip! Just like the old days!', 'Look, no legs!', 'Fast as ever. Faster, even!', 'Did you see that? Want to see it again?', 'Ho ho! Still sparkling!',
        'Blink and you missed me!', 'Ahh, wind in my mustache!', 'They don’t make flashes like that anymore.'],
      leap: ['Up and over, sonny!', 'Hup! Old star, new tricks!', 'Look at me! A shooting star!', 'Over we go! Ho ho!', 'These old springs still work!'],
      dash: ['Golden zoom! Oh, that’s the good stuff!', 'Out of my way, I’m golden!'], // (and for a golden leaf: it spends its flashes there and then)
      flash: { first: ['Early star gets the apple, {who}!', 'Beat you to it, {who}!'], past: ['Mind the mustache, {who}!', 'Feel that breeze, {who}? That was me.'] },
      stash: ['Golden! Straight in the tank.', 'More gold for the old star!', 'Ooh, the good stuff. Mine!'], // (a golden beetle)
      golden: ['Golden! Like my glory days.'],
      caught: ['Gotcha, bug! Nothing gets past me.'],
      goldbug: ['A golden bug! Come to Grandpa!', 'A golden beetle! Oh, I need that.'],
      wrap: ['No edges? Now that’s my kind of log!', 'Out one side, in the other! Marvellous!'],
      eat: ['Fuel for the flashes!', 'Mm. Rocket fuel.'],
      mushroom: ['Bleh. That’s slowing-down food.', 'Shrunk! Still quick, though.'],
      kill: ['Sorry, {who}! I don’t do brakes.', 'Whoops! That’s speed for you.'],
      weather: { wind: ['Wind at my back! Whee!'], storm: ['Lightning! Now there’s a flash I respect.'], rain: ['Rain! You know what comes after rain…'], sun: ['Sunshine! Twinkle weather.'], snow: ['Brr! Cold’s no good for old stars.'] },
      woodpecker: ['Peck away, bird. You’ll never catch me!'],
      last: ['The last apples! Race you all!'],
      rainbow: ['Family!', 'Oh, look at you! You’ve grown!', 'There’s my trail! I wondered where it went.'],
      bonk: ['Oof! Tripped on my own mustache.', 'Ow! That wasn’t there in my day.', 'Ho! Still in one piece.'],
      edge: ['Whoa! The log used to be bigger.'],
      burning: ['Hot! Hot! I’m a star, not a comet!'],
      doused: ['Phew! Back to twinkling.'],
      under: ['A hole under me? Pfft. I’ve hopped bigger.'],
      cut: ['My rainbow! Who snipped my rainbow?', 'Hey, {who}! That was my best stripe!'],
      choke: ['Hack! In my day, tails went down easy.', 'Ptoo! Got my own sparkle stuck in my throat.'],
      windfall: ['Bless you, {who}! I’ll take that.'],
      dug: ['Hmph! Beetles were slower in my day.', 'Dug in? Cheeky little bug!'],
      knocked: ['Hey! That bird passed my lunch to {who}!'],
      snip: ['Snip! Sorry, {who}, can’t stop!'],
      gloat: ['Easy, {who}! Mind my points.', 'Careful, {who}! Old, not slow.'],
      baked: ['Baked apples! Smells like the old days.'],
      ash: ['Burnt! I should’ve flashed for it.'],
      rot: ['Rotted? I must be slowing down.'],
      dies: ['Went out with a twinkle…', 'Tell ’em I was quick, {who}.'],
      giggle: ['Heh heh! Oh, my.'], // (at Mason's routine: see REPLIES)
      guffaw: ['Har har! Oh, my mustache!'],
    },
  };

  // Chinese for every line above: Copycat repeats what it hears, in Chinese.
  // The Metagamer's labels for how a snake plays, for Copycat's Chinese.
  const ZH_LABELS = { aggressive: '好斗', greedy: '贪吃', evasive: '爱躲', unclear: '看不透' };
  const ZH = {
    "*waves silently*": "*默默挥手*",
    "*takes a deep, silent bow*": "*深深地、无声地鞠躬*",
    "*pulls an invisible rope*": "*拉一根看不见的绳子*",
    "*trapped in an invisible box*": "*被困在看不见的盒子里*",
    "*leans on nothing*": "*靠在空气上*",
    "*walks against an invisible wind*": "*顶着看不见的风走*",
    "*tips an invisible hat at {who}*": "*向{who}脱下看不见的帽子*",
    "*draws a box in the air around {who}*": "*在{who}周围画一个看不见的盒子*",
    "*mimes closing a lid on {who}*": "*比划着把{who}盖起来*",
    "*plays a tiny invisible violin*": "*拉一把看不见的小提琴*",
    "*mimes a very big beetle*": "*比划一只很大的甲虫*",
    "*opens an invisible umbrella*": "*撑开一把看不见的伞*",
    "*hides under an invisible table*": "*躲到看不见的桌子下*",
    "*leans into the wind*": "*迎风倾身*",
    "*puts on invisible sunglasses*": "*戴上看不见的墨镜*",
    "*shivers, silently*": "*无声地发抖*",
    "*mimes being squashed*": "*比划被压扁*",
    "*…*": "*……*",
    "Taking position. …Ooh, I like being Sniper.": "就位。……哦，我喜欢当狙击手。",
    "Headshot! …Is that how Sniper says it?": "爆头！……狙击手是这么说的吗？",
    "FOOD. NOW. …Is Gobbler always this hungry?": "食物。现在。……贪吃蛇一直这么饿吗？",
    "Nom nom nom! I’m Gobbler now!": "吧唧吧唧！我现在是贪吃蛇！",
    "…boo. …Am I doing Ghost right?": "……嘘。……我演鬼魂演得对吗？",
    "…": "……",
    "Aedificamus! …Ooh, I speak Latin now!": "我们建造！……哦，我现在会说拉丁语了！",
    "Veni, vidi, aedificavi! …Did I say that right?": "我来，我见，我建！……我说对了吗？",
    "Cold barrel. Steady hands.": "枪管冰冷。手要稳。",
    "Winter? But what will I EAT?": "冬天？那我吃什么？",
    "…brr.": "……好冷。",
    "Fetch the royal furs.": "拿御用皮草来。",
    "Bracing! Simply bracing.": "提神！真是提神！",
    "Cold.": "冷。",
    "Winter. The lean season. My season.": "冬天。饥荒的季节。我的季节。",
    "Hiems venit!": "冬天来了！",
    "Global warming? Total hoax. Look at all this snow!": "全球变暖？纯属骗局。看看这么多雪！",
    "cold tail. still following.": "尾巴好冷。还在跟着。",
    "Food supply: down. Hunger rate: up.": "食物供应：下降。饥饿速度：上升。",
    "Snow! I love snow! For a bit.": "下雪！我爱下雪！爱一会儿。",
    "Cold enough to freeze a cactus.": "冷得能冻住仙人掌。",
    "Snow joke!": "这可不是开玩笑！",
    "Adjusting for wind.": "修正风偏。",
    "Thunder masks the shot.": "雷声掩护枪声。",
    "It’s raining apples! Best day ever!": "天上掉苹果啦！最棒的一天！",
    "Mushroom weather. Yuck.": "蘑菇天气。呕。",
    "Golden hour? Golden SNACKS!": "黄金时刻？黄金零食！",
    "…boom.": "……轰。",
    "…drip.": "……滴答。",
    "The sun shines on our realm.": "阳光照耀着我们的国土。",
    "We do not approve of this weather.": "我们不批准这种天气。",
    "Fetch the royal umbrella.": "拿御用雨伞来。",
    "Ah, proper weather at last.": "啊，终于是像样的天气了。",
    "Rain? Just like home.": "下雨？跟家里一样。",
    "Batten down the hatches!": "关好舱门！",
    "The sun never sets on us, you know.": "要知道，我们可是日不落。",
    "Rain. Great.": "下雨。真好。",
    "It’s sunny.": "出太阳了。",
    "Windy.": "有风。",
    "Loud.": "好吵。",
    "Lightning. Something’s bound to cook.": "闪电。总会烤熟点什么。",
    "Grim weather. Lovely.": "阴沉的天气。真可爱。",
    "Iuppiter iratus est!": "朱庇特发怒了！",
    "Pluvia! Aquaeductus, ubi es?": "下雨了！输水道，你在哪儿？",
    "Sol invictus!": "不败的太阳！",
    "Ventus maximus!": "超级大风！",
    "Beautiful weather. The best weather. Everyone says so.": "美丽的天气。最好的天气。大家都这么说。",
    "Nobody knows more about lightning than me.": "没人比我更懂闪电。",
    "Tremendous wind. So many apples.": "巨大的风。好多苹果。",
    "Fake rain!": "假雨！",
    "hehe. flickery.": "嘿嘿。一闪一闪的。",
    "drip drip.": "滴答滴答。",
    "Strike probability: rising.": "雷击概率：上升。",
    "Mushroom density: up.": "蘑菇密度：上升。",
    "Golden apple odds: favourable.": "金苹果概率：有利。",
    "Apple supply: increasing.": "苹果供应：增加。",
    "Sunshine! I love sunshine! Today.": "阳光！我爱阳光！今天爱。",
    "Rain! I love rain! For now.": "下雨！我爱下雨！暂时爱。",
    "Storms are exciting! Or scary? Both!": "暴风雨好刺激！还是好可怕？都是！",
    "Whee!": "呜呼！",
    "Lightning? Now we’re talking!": "闪电？这才带劲！",
    "Smell that? Here comes trouble.": "闻到了吗？麻烦要来了。",
    "Fire on the bark! Yeehaw!": "树皮着火啦！咿哈！",
    "Hold onto your hat!": "抓紧你的帽子！",
    "Rain on the range.": "牧场下雨了。",
    "Singin’ in the rain!": "雨中曲！",
    "Shocking!": "真震撼！",
    "Blow, wind, blow!": "吹吧，风儿，吹吧！",
    "Sun’s out, puns out!": "太阳出来，笑话出来！",
    "Moving target. Still a headshot.": "移动靶。照样爆头。",
    "A BEETLE! Crunchy legs, come to Gobbler!": "甲虫！脆脆的腿，快到Gobbler这儿来！",
    "Bug! Bug bug bug!": "虫子！虫子虫子虫子！",
    "Crunchy! Legs and all.": "脆的！连腿一起。",
    "Scarabaeus captus!": "甲虫，抓到了！",
    "Yeehaw, a critter hunt!": "咿哈，抓小虫子喽！",
    "Lassoed it.": "套住它了。",
    "Alea iacta est!": "骰子已经掷下！",
    "Aedificamus!": "我们来建造！",
    "Vidi, vici, veni.": "我见，我征服，我来。",
    "Divide et imperium-ium.": "分而治之之。",
    "Carpe applum!": "抓住苹果！",
    "Murus maximus. Very bigus.": "最大的墙。非常大。",
    "In barko veritas.": "树皮里有真理。",
    "Wallus erectus.": "墙，立起来了。",
    "Semper wallus.": "永远是墙。",
    "Biggus wallus.": "大大的墙。",
    "Romanes eunt domus.": "罗马人回家去。",
    "Amicus meus est Biggus Dickus.": "我的朋友叫Biggus Dickus。",
    "Et uxor: Incontinentia Buttocks.": "还有他老婆：Incontinentia Buttocks。",
    "BWAHAHA—": "哇哈哈哈——",
    "I can’t. I CAN’T.": "我不行了。真不行了。",
    "*wheeze*": "*笑到喘不过气*",
    "Pfft…": "噗……",
    "*snort*": "*噗嗤*",
    "Snrk. Sorry. Go on.": "噗。抱歉。你继续。",
    "*shakes with silent laughter*": "*无声地笑得发抖*",
    "*doubles over, silently*": "*无声地笑弯了腰*",
    "Taking position.": "就位。",
    "Scoping the lobby.": "正在观察全场。",
    "In my sights, {who}.": "{who}，你在我的瞄准镜里。",
    "Steady…": "稳住……",
    "Big fan of your stream, {who}.": "{who}，我是你直播的忠实粉丝。",
    "Headshot.": "爆头。",
    "One shot.": "一枪。",
    "Counter-sniped by {who}?": "被{who}反狙了？",
    "Should have relocated.": "早该换位置的。",
    "Murum non vidisti, {who}?": "你没看见墙吗，{who}？",
    "Requiescat in barko, {who}.": "在树皮上安息吧，{who}。",
    "Panem! Panem et… panem!": "面包！面包和……面包！",
    "Picus horribilis!": "可怕的啄木鸟！",
    "Alea iacta… estus.": "骰子……掷下了。",
    "Murus… meus… finis.": "我的……墙……完了。",
    "“Romani ite domum”, actually.": "其实应该是“Romani ite domum”。",
    "Hungry. Someone will do.": "饿了。随便谁都行。",
    "So… hungry… can’t… go on…": "好……饿……撑……不住了……",
    "FOOD. NOW.": "食物。马上。",
    "…hungry…": "……饿……",
    "We require a banquet. Immediately.": "朕要设宴。立刻。",
    "I say, is there nothing to eat out here?": "我说，这里就没有吃的吗？",
    "I should eat something.": "我该吃点东西了。",
    "Someone die already. I’m starving.": "快死一个吧。我饿坏了。",
    "Very hungry. The hungriest. Nobody has ever been this hungry.": "非常饿。最饿的。从来没有人这么饿过。",
    "so… hungry…": "好……饿……",
    "Caloric deficit detected.": "检测到热量不足。",
    "Now I’m hungry! Out of nowhere!": "我现在饿了！突然就饿了！",
    "Running on fumes, partner.": "快没油了，伙计。",
    "Why did the snake cross the bark? It was starving.": "蛇为什么要爬过树皮？因为它饿坏了。",
    "Yeehaw!": "咿哈！",
    "Saddle up, partner.": "上马吧，伙计。",
    "Living on the edge, partner.": "刀尖上过日子，伙计。",
    "Too close? Never heard of it.": "太近了？没听说过。",
    "Is that the edge? Let’s go see.": "那是边缘吗？去看看。",
    "Feel that? That’s being alive.": "感觉到了吗？这才叫活着。",
    "Draw, {who}. Too slow.": "拔枪吧，{who}。太慢了。",
    "This bark ain’t big enough for the both of us.": "这块树皮容不下我们两个。",
    "Mushroom roulette. Down the hatch!": "蘑菇轮盘赌。干了！",
    "Now we’re talking! Holes!": "这才带劲！洞！",
    "What a ride…": "真是一趟好旅程……",
    "Worth it.": "值了。",
    "Run. It helps.": "跑吧。有点用。",
    "I see you, {who}.": "我看见你了，{who}。",
    "Nowhere to hide.": "无处可藏。",
    "Next.": "下一个。",
    "Too slow, {who}.": "太慢了，{who}。",
    "Bonus collected.": "奖励到手。",
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
    "Sorry, {who}. You were between me and lunch.": "抱歉，{who}。你挡住我的午饭了。",
    "Oops. Is that meat?": "哎呀。那是肉吗？",
    "Tell my apples… I loved them.": "告诉我的苹果……我爱过它们。",
    "……": "…………",
    "(silence)": "（沉默）",
    "boo.": "吓！",
    "…bitter.": "……苦。",
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
    "Ahem. That’s a colony, {who}.": "咳咳。那是殖民地，{who}。",
    "I say, that patch is spoken for.": "我说，那块地已经有主了。",
    "Frightfully sorry, old chap.": "万分抱歉，老伙计。",
    "Should have read the flag, {who}.": "你该看看旗子的，{who}。",
    "Stiff upper lip…": "保持镇定……",
    "Hello.": "你好。",
    "Hi. I’m Drab.": "嗨。我是Drab。",
    "Nice weather.": "天气不错。",
    "Apples are fine.": "苹果还行。",
    "I like beige.": "我喜欢米色。",
    "This is a log.": "这是一根木头。",
    "Hm.": "嗯。",
    "Food.": "食物。",
    "Oh. A bird.": "哦。一只鸟。",
    "Oh. Sorry, {who}.": "哦。对不起，{who}。",
    "Well. That happened.": "好吧。就这样了。",
    "Ahh, fresh snakes.": "啊，新鲜的蛇。",
    "Not long now…": "快了……",
    "You look tired, {who}.": "你看起来很累，{who}。",
    "I’ll wait.": "我会等。",
    "Patience…": "耐心……",
    "Dinner!": "开饭了！",
    "Ooh, leftovers.": "哦，剩菜。",
    "Rest in pieces, {who}.": "碎碎平安，{who}。",
    "I didn’t even have to try.": "我都没怎么出力。",
    "Who’s… eating… whom…": "谁……吃……谁……",
    "Veni, vidi, aedificavi.": "我来，我见，我建。",
    "Veni, vidi, vici.": "我来，我见，我征服。",
    "Et tu, {who}?": "还有你吗，{who}？",
    "Hello, everybody. Tremendous crowd today.": "大家好。今天人山人海，了不起。",
    "I’m going to win. Bigly.": "我会赢的。大赢特赢。",
    "Nobody slithers better than me, believe me.": "没人比我爬得更好，相信我。",
    "I have the best scales. Everybody says so.": "我的鳞片是最好的。大家都这么说。",
    "Many snakes are saying it.": "很多蛇都这么说。",
    "Sad!": "可悲！",
    "Fake apples!": "假苹果！",
    "{who}? Total loser. Sad!": "{who}？彻底的失败者。可悲！",
    "Tremendous snack. The best snack.": "了不起的零食。最好的零食。",
    "A golden apple. Very classy. Like me.": "金苹果。很高级。像我一样。",
    "Fake food! Very unfair!": "假食物！非常不公平！",
    "You’re fired, {who}!": "你被解雇了，{who}！",
    "Winning! So much winning.": "赢！赢太多了。",
    "Rigged! Totally rigged!": "作弊！完全是作弊！",
    "psst.": "嘘。",
    "behind you.": "在你后面。",
    "don’t turn around, {who}.": "别回头，{who}。",
    "hehehe.": "嘿嘿嘿。",
    "nice tail, {who}.": "尾巴不错，{who}。",
    "hehe. gotcha.": "嘿嘿。抓到你了。",
    "…aww.": "……哎。",
    "Analysing opponents…": "正在分析对手……",
    "I’ve watched the replays.": "我看过录像了。",
    "{who}: {label}. Noted.": "{who}：{label}。已记录。",
    "Predictable.": "可预测。",
    "Your eat rate is suboptimal, {who}.": "你的进食效率不是最优的，{who}。",
    "Running the numbers…": "正在计算……",
    "As calculated.": "一切尽在计算之中。",
    "Exactly as the model predicted.": "和模型预测的一模一样。",
    "That… wasn’t in the data.": "这……不在数据里。",
    "Ooh, what shall I be today?": "哦，今天我当什么好呢？",
    "Didn’t plan that. Love it.": "没计划过。但我喜欢。",
    "Changed my mind about living.": "我改变主意了……关于活着。",
    "Knock knock!": "咚咚！",
    "Who wants to play a game?": "谁想玩个游戏？",
    "Catch me if you can!": "有本事来抓我！",
    "Why so slithery, {who}?": "为什么这么滑溜，{who}？",
    "Follow me, it’s a shortcut!": "跟我来，这是捷径！",
    "Honk honk!": "叭叭！",
    "And for my next trick…": "下一个戏法……",
    "The joke’s on you, {who}!": "你才是笑话，{who}！",
    "Ooh, a funny mushroom!": "哦，好玩的蘑菇！",
    "Tough crowd…": "观众真难搞……",
    "Air support. Not mine.": "空中支援。不是我的。",
    "Target marked: the end of the rainbow.": "目标已标记：彩虹的尽头。",
    "Is it eating the log? Save me some!": "它在吃木头吗？给我留点！",
    "A rainbow! Does the gold taste good?": "彩虹！那金子好吃吗？",
    "…tap… tap…": "……嗒……嗒……",
    "…pretty.": "……真美。",
    "Who invited that bird?": "谁请了那只鸟？",
    "We did not authorise this pecking.": "朕没有批准这种啄法。",
    "The heavens salute us.": "上天在向朕致敬。",
    "Our realm expands!": "朕的疆土扩张了！",
    "A greater sovereign needs a greater realm.": "更伟大的君主需要更辽阔的疆土。",
    "Behold: more kingdom.": "看哪：更多的王国。",
    "Our realm… contracts. Temporarily.": "朕的疆土……缩小了。暂时的。",
    "A strategic retreat. A royal one.": "战略撤退。皇家的那种。",
    "The court relocates.": "朝廷迁都。",
    "We have moved to better lands.": "朕已迁往更好的土地。",
    "A woodpecker! Someone fetch my musket. Politely.": "啄木鸟！谁去拿我的火枪。客气点。",
    "A rainbow! Plant a flag at the end of it!": "彩虹！在它的尽头插上旗子！",
    "Run up the ensign!": "升起船旗！",
    "Another ensign for the Empire!": "帝国又多了一面旗！",
    "A rainbow. Colourful.": "彩虹。挺多颜色的。",
    "Ah. A colleague.": "啊。同行。",
    "Pretty. Someone will die chasing it.": "真漂亮。总有人会追着它送命。",
    "Arcus caelestis!": "天上的拱门！",
    "That bird is a disaster. Total disaster.": "那只鸟是个灾难。彻头彻尾的灾难。",
    "Rainbows. Overrated. Great gold, though.": "彩虹。被高估了。不过金子很棒。",
    "pecky pecky. hehe.": "啄啄啄。嘿嘿。",
    "shiny…": "亮晶晶……",
    "Map shrink phase: started.": "地图缩小阶段：开始。",
    "Golden apple confirmed at the rainbow’s end.": "已确认：彩虹尽头有金苹果。",
    "A bird! I love birds! Not this one.": "一只鸟！我爱鸟！不爱这只。",
    "A rainbow! Every colour! I can’t choose!": "彩虹！每种颜色！我选不出来！",
    "Race you to the gold, partner!": "比比谁先拿到金子，伙计！",
    "*covers its ears*": "*捂住耳朵*",
    "*hugs the rainbow*": "*抱住彩虹*",
    "*paints the rainbow a little brighter*": "*把彩虹涂得更亮一点*",
    "Knock knock! Oh. It’s the woodpecker.": "咚咚！哦。是啄木鸟。",
    "Somewhere over the… oh, there it is.": "在彩虹之上的某处……哦，就在这儿。",
    "Recalibrating.": "重新校准。",
    "Minor setback.": "小挫折。",
    "Taking fire. Literally.": "遭到火力攻击。字面意义上的。",
    "Lost my rear guard.": "后卫没了。",
    "Bounced off me, {who}? Cute.": "从我身上弹开了，{who}？真可爱。",
    "Ow! My snacks!": "哎哟！我的零食！",
    "Oof. Dropped my lunch.": "哎。午饭掉了。",
    "Am I… cooking? Smells good, actually.": "我……在被烤吗？其实闻起来挺香。",
    "My tail! That was full of food!": "我的尾巴！里面全是吃的！",
    "BAKED APPLES! Hot hot hot, worth it!": "烤苹果！好烫好烫，值了！",
    "…ow.": "……疼。",
    "…warm.": "……暖和。",
    "…lighter.": "……轻了。",
    "We meant to do that.": "朕是故意的。",
    "Who put that there?": "谁把那个放在那儿的？",
    "Fetch the royal bucket!": "拿御用水桶来！",
    "That bird has committed treason.": "那只鸟犯了叛国罪。",
    "Treason, {who}! That was the royal tail.": "叛国罪，{who}！那可是皇家的尾巴。",
    "Bow, {who}. Do not bump.": "鞠躬，{who}。不要撞。",
    "I say! Steady on!": "我说！稳着点！",
    "Blast!": "该死！",
    "I appear to be on fire. How awkward.": "我好像着火了。真尴尬。",
    "Dash it, my tail!": "可恶，我的尾巴！",
    "Mind the Empire, {who}.": "小心帝国，{who}。",
    "Roast dinner! Splendid.": "烤肉晚餐！妙极了。",
    "Ow.": "疼。",
    "Hot.": "烫。",
    "Hm. Shorter.": "嗯。短了。",
    "Not the plan.": "不在计划内。",
    "I’m the one who eats the roast!": "烤肉应该是我吃的！",
    "Leftovers… of me?": "剩菜……是我？",
    "Keep bumping, {who}. I’ll wait.": "继续撞吧，{who}。我等着。",
    "Murus! Unde venit?": "墙！从哪儿来的？",
    "Ouchus maximus.": "超级疼。",
    "Roma ardet!": "罗马着火了！",
    "Caudam meam!": "我的尾巴！",
    "Murum vidisti, {who}?": "你看见墙了吗，{who}？",
    "Who moved that? Fake wall!": "谁动的？假墙！",
    "Hot. Very hot. The hottest. Tremendous.": "热。非常热。最热的。了不起。",
    "{who} stole my tail! Total theft. Sad!": "{who}偷了我的尾巴！彻头彻尾的盗窃。可悲！",
    "{who}? Bounced right off me. Sad!": "{who}？直接从我身上弹开了。可悲！",
    "oof.": "哎。",
    "ow ow ow.": "疼疼疼。",
    "…my tail.": "……我的尾巴。",
    "hehe. bonk, {who}.": "嘿嘿。咚，{who}。",
    "Collision logged.": "碰撞已记录。",
    "Variance.": "方差。",
    "Thermal damage: ongoing.": "热伤害：持续中。",
    "Length reduced. Recomputing.": "长度减少。重新计算。",
    "Predicted that, {who}.": "早就预测到了，{who}。",
    "Ouch! I hate edges! Today.": "哎哟！我讨厌边缘！今天讨厌。",
    "Fire! I love fire! Ow, no I don’t!": "火！我爱火！哎哟，不爱了！",
    "My tail! I liked that tail!": "我的尾巴！我喜欢那条尾巴！",
    "Woo! Again!": "呜呼！再来！",
    "Felt that one.": "这下有感觉。",
    "Yeehaw, I’m on fire!": "咿哈，我着火了！",
    "Shot my tail clean off!": "尾巴被打掉了！",
    "Campfire grub!": "篝火大餐！",
    "*rubs its head, silently*": "*默默揉头*",
    "*walks into a wall. A real one, this time*": "*撞上一堵墙。这次是真的*",
    "*fans itself, frantically*": "*拼命给自己扇风*",
    "*looks for its tail*": "*找自己的尾巴*",
    "*mimes {who} bouncing off*": "*比划{who}被弹开*",
    "Ow! That one’s on me.": "哎哟！这下算我的。",
    "Slapstick!": "闹剧！",
    "Hot stuff, coming through!": "烫手货，借过！",
    "Ha! The bird’s got jokes.": "哈！这鸟也会讲笑话。",
    "Hey! Sawing in half is MY trick, {who}!": "喂！锯成两半是我的戏法，{who}！",
    "Knock knock, {who}! …Bonk!": "咚咚，{who}！……咚！",
    "Even I must eat. Usually myself.": "连我也得吃东西。通常吃自己。",
    "All things return.": "万物终将回归。",
    "Here we are again.": "我们又来了。",
    "The end is the beginning.": "终点即是起点。",
    "Round and round.": "一圈又一圈。",
    "I have done this before, {who}.": "这我以前做过，{who}。",
    "Everything comes back to me.": "一切都会回到我这里。",
    "Back to the start, {who}.": "回到起点吧，{who}。",
    "You were always going to end here.": "你注定在这里结束。",
    "Endings peck at everything.": "终结啄食着一切。",
    "A circle, half drawn.": "一个圆，画了一半。",
    "I meant to come back here.": "我本来就打算回到这里。",
    "Fire, then ash, then again.": "火，然后灰，然后再来。",
    "My tail! I was saving that.": "我的尾巴！我还留着呢。",
    "Around you go, {who}.": "转圈吧，{who}。",
    "…and begin again.": "……再从头开始。",
    "See you next time around.": "下一轮见。",
    "Winter returns. It always does.": "冬天回来了。它总会回来。",
    "The rain comes round again.": "雨又转回来了。",
    "A GOLDEN beetle! Gold AND crunchy!": "金甲虫！又是金的又是脆的！",
    "Wheee! Lunch from above!": "呜——！从天而降的午饭！",
    "Gold bug! Now that’s a prize, partner.": "金虫子！这才叫奖品，伙计。",
    "Yeehaw! Clean over!": "咿哈！干净利落地跳过去了！",
    "Golden beetle: mobility upgrade.": "金甲虫：机动性升级。",
    "Leap executed.": "跳跃已执行。",
    "A golden beetle! I love gold. Gold loves me.": "金甲虫！我爱金子。金子也爱我。",
    "Nobody jumps better than me.": "没人比我跳得更好。",
    "Hup! Ta-daaa!": "嘿！哒哒——！",
    "*bows mid-air*": "*在空中鞠躬*",
    "I can fly! For a second!": "我会飞！就一秒！",
    "We rise above it all.": "朕凌驾于一切之上。",
    "Our realm is ablaze! Fetch the royal bucket!": "朕的疆土着火了！拿御用水桶来！",
    "Who set fire to the royal grounds?": "谁放火烧了皇家领地？",
    "That bird is pecking holes in OUR land!": "那只鸟在朕的土地上啄洞！",
    "Our realm, full of holes. Unacceptable.": "朕的疆土满是窟窿。不可接受。",
    "A colony? On OUR land, {who}?!": "殖民地？在朕的土地上，{who}？！",
    "{who} dares plant a flag in our realm!": "{who}竟敢在朕的疆土上插旗！",
    "I say, the colony’s on fire!": "我说，殖民地着火了！",
    "Fire in the colony! Form a bucket chain!": "殖民地起火了！排成一队传水桶！",
    "That bird’s pecking up my colony!": "那只鸟在啄我的殖民地！",
    "Blast! Holes all over the colony.": "该死！殖民地上全是洞。",
    "I claim this for the Crown. Which crown? Mine.": "我以王室之名占领这里。哪个王室？我的。",
    "Fast food!": "快餐！",
    "Snip! Snack-sized, {who}.": "咔嚓！{who}，零食大小。",
    "Make way for the crown!": "为王冠让路！",
    "Divided, {who}, and ruled.": "分而治之，{who}。",
    "Our realm knows no edges now.": "朕的疆土如今没有边界。",
    "Fastest dash in history. Everyone says so.": "史上最快的冲刺。大家都这么说。",
    "You’re cut, {who}! Tremendously cut.": "你被砍了，{who}！砍得非常彻底。",
    "Walls? Who needs walls? Not today.": "墙？谁需要墙？今天不需要。",
    "Dash: optimal.": "冲刺：最优解。",
    "Cut {who} in two. Noted.": "把{who}切成两半。已记录。",
    "Zoom! I felt like it!": "嗖！我就想这么干！",
    "Oops, {who}! Was that rude?": "哎呀，{who}！这样是不是不礼貌？",
    "Yeehaw, full gallop!": "驾——全速飞奔！",
    "Cut you down to size, {who}.": "把你削短了，{who}。",
    "*zooms off, holding its beret*": "*按着贝雷帽飞奔而去*",
    "*mimes scissors at {who}*": "*对着{who}比划剪刀*",
    "*walks into the edge… and out the other side*": "*走进边缘……从另一边走出来*",
    "Wheeee, nyoom!": "呜——嗖！",
    "Ta-da! {who}, sawn in half!": "当当！{who}，被锯成两半！",
    "Repositioning. Fast.": "快速转移阵地。",
    "Clean cut, {who}.": "干净利落，{who}。",
    "The circle tightens. Quickly.": "圆环收紧。很快。",
    "Now you know how it feels, {who}.": "现在你知道那是什么滋味了，{who}。",
    "No end, no beginning. As it should be.": "无始无终。本该如此。",
    "Sine muro! Murus nullus!": "没有墙了！一堵墙都没有！",
    "Target acquired.": "目标已锁定。",
    "Clean catch.": "干净利落地抓到了。",
    "Bad angle.": "角度不好。",
    "Out of bounds.": "出界了。",
    "Wrong lane, {who}.": "走错道了，{who}。",
    "Marked, {who}.": "{who}，已标记。",
    "Dibs on the golden one!": "金的那个归我了！",
    "GOLD! FOOD! GOLD FOOD!": "金子！食物！金子食物！",
    "Six legs, six times the flavour!": "六条腿，六倍的美味！",
    "Who hid a mushroom in the snacks?!": "谁把蘑菇藏在零食里了？！",
    "Ow! I need a snack.": "哎哟！我得吃点零食。",
    "Ow! Is the edge edible?": "哎哟！边缘能吃吗？",
    "…hello?": "……有人吗？",
    "…fainter.": "……更淡了。",
    "…oops.": "……哎呀。",
    "One day all this will be ours. Today, in fact.": "总有一天这一切都是朕的。其实就是今天。",
    "Who let {who} in?": "谁放{who}进来的？",
    "The realm is closed to the public, {who}.": "朕的疆土不对外开放，{who}。",
    "We do not recall inviting you, {who}.": "朕不记得邀请过你，{who}。",
    "We shall have it executed.": "朕要把它处死。",
    "Move the edge. We command it.": "把边缘挪开。朕命令你。",
    "We felt that, {who}. We disapprove.": "朕感觉到了，{who}。朕不赞成。",
    "Mind the royal person, {who}.": "小心龙体，{who}。",
    "Do you have a flag, {who}? No flag, no colony.": "你有旗子吗，{who}？没有旗子，就没有殖民地。",
    "Papers, {who}? No? Off you pop.": "证件呢，{who}？没有？那就请回吧。",
    "British bark now, {who}. Wipe your scales.": "现在是英国的树皮了，{who}。把鳞片擦干净。",
    "A minor diplomatic incident.": "一起小小的外交事件。",
    "I say, {who}! There’s a queue.": "我说，{who}！要排队。",
    "Do mind the paintwork, {who}.": "请当心油漆，{who}。",
    "Eating.": "在吃。",
    "Fine.": "还行。",
    "Tastes like food.": "吃起来像食物。",
    "Oops.": "哎呀。",
    "That was a bump.": "这是一次碰撞。",
    "That’s the edge.": "那是边缘。",
    "Take your time, {who}. No rush.": "慢慢来，{who}。不着急。",
    "Any minute now…": "随时都会……",
    "Waste not, want not.": "不浪费，不匮乏。",
    "I’m not on the menu.": "我可不在菜单上。",
    "Tsk.": "啧。",
    "That looked expensive, {who}.": "这下代价不小啊，{who}。",
    "Smaller every time, {who}.": "一次比一次小，{who}。",
    "Crunchus deliciosus!": "脆脆的，好吃！",
    "Caput meum!": "我的头！",
    "Bonkus interruptus.": "咚……被打断了。",
    "Murus sum, {who}.": "我就是墙，{who}。",
    "Ecce murus, {who}.": "看哪，墙，{who}。",
    "I only eat the best food. Everybody knows it.": "我只吃最好的食物。大家都知道。",
    "Nobody eats like me. Nobody.": "没人像我这么能吃。没有人。",
    "I’m bigger than ever. Ask anyone.": "我比以往任何时候都大。随便问谁。",
    "Fake news! That never happened.": "假新闻！根本没发生过。",
    "Very unfair. Everybody saw it.": "非常不公平。大家都看见了。",
    "Low energy, {who}. Very low energy.": "没精神，{who}。非常没精神。",
    "Nobody bumps me, {who}. Believe me.": "没人能撞我，{who}。相信我。",
    "don’t mind me.": "别管我。",
    "we should hang out, {who}.": "我们该一起玩玩，{who}。",
    "shh. nobody saw that.": "嘘。没人看见。",
    "peekaboo, {who}.": "躲猫猫，{who}。",
    "i was right here, {who}.": "我一直在这儿呢，{who}。",
    "Sample size: growing.": "样本量：增长中。",
    "Off-meta play, {who}. Bold.": "非主流打法，{who}。大胆。",
    "Unforced error.": "非受迫性失误。",
    "Map edge: confirmed.": "地图边缘：已确认。",
    "Pathing error, {who}.": "寻路错误，{who}。",
    "Input lag, {who}?": "输入延迟，{who}？",
    "Pew pew! …Sniper doesn’t say pew pew, does it?": "砰砰！……狙击手不说砰砰的，对吧？",
    "Snacks! All the snacks! …How does Gobbler stop?": "零食！所有的零食！……贪吃蛇是怎么停下来的？",
    "Shh. I’m being Ghost.": "嘘。我在演鬼魂。",
    "Wallus maximus! …Is that Latin? It feels Latin.": "超级大墙！……这是拉丁语吗？感觉像拉丁语。",
    "Ouch! Never doing that again! Probably.": "哎哟！再也不这样了！大概吧。",
    "Ow! That was fun! No it wasn’t.": "哎哟！真好玩！不，一点也不好玩。",
    "Let’s make this interesting.": "来点刺激的吧。",
    "Who wants to play chicken?": "谁想玩胆小鬼游戏？",
    "Tasted like danger.": "尝起来是危险的味道。",
    "Bitter. Thrilling, though.": "苦的。不过很刺激。",
    "What doesn’t kill me… shrinks me.": "杀不死我的……会让我变小。",
    "Here, little critter…": "过来，小虫子……",
    "Roped and branded.": "套住了，烙上印了。",
    "Now I’m awake!": "这下我醒了！",
    "Yep. That’s the edge, all right.": "没错。还真是边缘。",
    "Close one, {who}! Do it again.": "好险，{who}！再来一次。",
    "Now that’s a rush, {who}!": "这才叫刺激，{who}！",
    "*juggles invisible apples*": "*抛接看不见的苹果*",
    "*climbs an invisible ladder*": "*爬一架看不见的梯子*",
    "*pats its tummy, silently*": "*默默拍拍肚子*",
    "*mimes seeing stars*": "*比划眼冒金星*",
    "*holds up an invisible scorecard: 3*": "*举起一张看不见的记分牌：3分*",
    "*dusts itself off, smugly*": "*得意地掸掸身上的灰*",
    "Hungry again. Of course.": "又饿了。当然。",
    "Haven’t we met before, {who}?": "我们以前见过吧，{who}？",
    "Ah. This bit again.": "啊。又是这一段。",
    "This has happened before.": "这以前发生过。",
    "Even the log has an end.": "连木头也有尽头。",
    "You’ll be back, {who}.": "你会回来的，{who}。",
    "Again, {who}? Always again.": "又来，{who}？总是又来。",
    "Knock knock! Who’s there? Lunch, I hope.": "咚咚！谁呀？希望是午饭。",
    "Pull my tail!": "拉拉我的尾巴！",
    "Wanna hear a joke, {who}?": "想听个笑话吗，{who}？",
    "Fungi! Fun guy! …No?": "蘑菇！魔菇！……不好笑？",
    "Not so funny now.": "现在不那么好笑了。",
    "Mushroom? I hardly know ’em!": "蘑菇？我跟它们不熟！",
    "Ba-dum-tss!": "咚哒哒——嚓！",
    "Boing! Do it again, {who}!": "嘣！再来一次，{who}！",
    "Classic {who}. Never gets old.": "经典的{who}。百看不厌。",
    "Out of rations. Going in.": "口粮没了。冲进去。",
    "Target lost. Burnt.": "目标丢失。烧没了。",
    "Target expired.": "目标过期了。",
    "Final supply drop.": "最后一次空投补给。",
    "Fire’s out. Back on target.": "火灭了。重新瞄准。",
    "Hole under me. Holding position.": "身下有洞。原地坚守。",
    "Quick scope, {who}.": "快速开镜，{who}。",
    "Flanked you, {who}.": "绕到你侧面了，{who}。",
    "OUT OF MY WAY! I’M STARVING!": "让开！我要饿死了！",
    "Any food. ALL the food.": "什么吃的都行。所有吃的。",
    "The LAST apples?! Save them for me!": "最后的苹果？！给我留着！",
    "Aw, put out. I was nearly crispy.": "哎，灭了。我差点就烤脆了。",
    "A hole under me! Is there food down there?": "我身下有个洞！下面有吃的吗？",
    "NOOO! My snack’s just ash now!": "不——！我的零食成灰了！",
    "It went off before I got there!": "我还没到它就坏了！",
    "Nooo, it rotted! Such a waste!": "不——，烂掉了！太浪费了！",
    "Zoom! Mine, {who}!": "嗖！归我了，{who}！",
    "…must… eat…": "……必须……吃……",
    "…ashes.": "……灰烬。",
    "…withered.": "……枯萎了。",
    "…the last.": "……最后的。",
    "…hiss.": "……嘶。",
    "…hollow.": "……空的。",
    "…whoosh.": "……嗖。",
    "Forget the realm. Food, at once!": "别管疆土了。立刻上菜！",
    "The last apples belong to the Crown.": "最后的苹果归王室所有。",
    "Something is rotten in our realm.": "朕的疆土里有东西烂掉了。",
    "Rotting fruit on royal bark? Clear it at once!": "皇家树皮上有烂果子？立刻清走！",
    "We are put out. In every sense.": "火灭了。朕也很不高兴。",
    "Our supper, burnt to a cinder. Fetch the royal cook.": "朕的晚膳烧成了灰。传御厨来。",
    "Rotted before the Crown could dine. Disgraceful.": "王室还没用膳就烂了。成何体统。",
    "A hole beneath the royal person? We do not stoop.": "龙体之下有洞？朕不屑弯腰。",
    "The Crown dines first, {who}.": "王室先用膳，{who}。",
    "Royal procession, {who}. Do keep up.": "御驾经过，{who}。跟上。",
    "Bother the colonies. I need lunch!": "殖民地先不管了。我要吃午饭！",
    "The last apples? Ration them, chaps.": "最后的苹果？伙计们，实行配给。",
    "Put out by the weather. How very British.": "被天气浇灭了。真够英国的。",
    "Mind the gap!": "小心空隙！",
    "Burnt to a cinder. Like Sunday lunch.": "烧成灰了。就像周日午餐。",
    "Gone off. Frightfully wasteful.": "坏掉了。实在太浪费了。",
    "I say, something’s gone off in the colony.": "我说，殖民地里有东西坏了。",
    "Rotten fruit in the colony? Most unsanitary.": "殖民地里有烂果子？太不卫生了。",
    "Snapped that up, {who}. Cheerio!": "抢到手了，{who}。再见！",
    "Pardon me, {who}! Coming through!": "借过，{who}！借过！",
    "I’ll eat anything now.": "现在什么都吃。",
    "That’s ash now.": "那现在是灰了。",
    "That went off.": "那个坏了。",
    "Last apples. Okay.": "最后的苹果。好吧。",
    "Not on fire now. Good.": "现在不着火了。好。",
    "There’s a hole under me.": "我下面有个洞。",
    "Got it first.": "我先拿到了。",
    "Fast.": "快。",
    "No more waiting. I’ll make my own leftovers.": "不等了。我自己制造剩菜。",
    "Overcooked. Even I won’t eat that.": "烤过头了。连我都不吃。",
    "Gone already? I like them ripe.": "已经没了？我喜欢熟透的。",
    "The last apples. Then it’s just us.": "最后的苹果。之后就只剩我们了。",
    "Put out. I’m nobody’s roast.": "灭了。我可不是谁的烤肉。",
    "A hole under me. Not my grave yet.": "我身下有个洞。还不是我的坟。",
    "Patience is overrated, {who}.": "耐心被高估了，{who}。",
    "Muri postea! Panem nunc!": "墙以后再说！现在要面包！",
    "Ultima poma!": "最后的苹果！",
    "Cinis! Prandium meum!": "灰！我的午饭！",
    "Rottus maximus.": "烂透了。",
    "Roma salva est!": "罗马得救了！",
    "Pons sum!": "我是桥！",
    "Pontem aedificavi!": "我建了一座桥！",
    "Veni, vidi, edi.": "我来，我见，我吃。",
    "Celerissimus!": "最快的！",
    "I’m taking all the food. All of it. Believe me.": "我要拿走所有吃的。全部。相信我。",
    "The last apples. Beautiful apples. All mine.": "最后的苹果。漂亮的苹果。全是我的。",
    "Fire’s out. Nobody puts out fires like me.": "火灭了。没人比我更会灭火。",
    "Burnt to ash. Total disaster. Sad!": "烧成灰了。彻头彻尾的灾难。可悲！",
    "Rotten food. Who’s responsible? Not me.": "烂掉的食物。谁负责？不是我。",
    "A hole under me? Fake hole. Didn’t even feel it.": "我身下有洞？假洞。我根本没感觉。",
    "Mine, {who}. Tremendous speed.": "归我了，{who}。惊人的速度。",
    "So fast. Faster than {who}. Everyone saw it.": "太快了。比{who}快。大家都看见了。",
    "no more sneaking. food.": "不偷偷摸摸了。吃的。",
    "aww. crispy.": "啊。焦了。",
    "mm. mouldy.": "嗯。发霉了。",
    "fizzle. hehe.": "滋——。嘿嘿。",
    "shh. there’s a hole under me.": "嘘。我下面有个洞。",
    "hehe. mine, {who}.": "嘿嘿。我的了，{who}。",
    "zip. right past you, {who}.": "嗖。从你身边溜过去了，{who}。",
    "Hunger critical. Abandoning strategy.": "饥饿值危急。放弃策略。",
    "Item destroyed: fire.": "物品被摧毁：火。",
    "Food despawned. Inefficient.": "食物消失了。效率低下。",
    "Food spawns: final phase.": "食物刷新：最后阶段。",
    "Burn status: cleared by weather.": "燃烧状态：被天气清除。",
    "Terrain under me: compromised. Bridging.": "我身下的地形：已损坏。架桥中。",
    "Frame-perfect, {who}.": "帧级完美，{who}。",
    "Speed check passed, {who}.": "速度检定通过，{who}。",
    "New mood: STARVING.": "新心情：饿疯了。",
    "The fire’s out! I miss it already! No I don’t.": "火灭了！我已经想它了！不，我不想。",
    "Ash! I love ash! No, I wanted that!": "灰！我爱灰！不，我想要那个！",
    "It rotted! I didn’t want it anyway! I did.": "烂掉了！反正我也不想要！我想要。",
    "A hole! I love holes! Not under me.": "一个洞！我爱洞！不爱我身下的。",
    "Zip! Mine! Sorry, {who}! Not sorry!": "嗖！我的！对不起，{who}！才不对不起！",
    "Whee! Hello and goodbye, {who}!": "呜！你好，再见，{who}！",
    "Nothing left to lose, partner.": "没什么可输的了，伙计。",
    "Last call, partner.": "最后一轮了，伙计。",
    "Fire’s out? Shucks. Was just warming up.": "火灭了？可惜。我才刚热身。",
    "Hole under my boots! Yeehaw!": "靴子底下有个洞！咿哈！",
    "Burnt the beans again.": "又把豆子烧糊了。",
    "Spoilt, partner. Left it too long.": "坏了，伙计。放太久了。",
    "Quick draw, {who}.": "快枪手，{who}。",
    "Eat my dust, {who}!": "吃我的灰吧，{who}！",
    "*mimes a knife and fork, frantically*": "*拼命比划刀叉*",
    "*blows the ash away, sadly*": "*难过地吹走灰烬*",
    "*holds its nose*": "*捏住鼻子*",
    "*catches an invisible falling apple*": "*接住一个看不见的落下的苹果*",
    "*wrings out its beret*": "*拧干贝雷帽*",
    "*tightrope-walks over the hole*": "*走钢丝一样走过洞口*",
    "*tips its beret at {who}, mouth full*": "*满嘴食物，向{who}脱贝雷帽致意*",
    "*zips past {who}, waving*": "*挥着手从{who}身边掠过*",
    "The hungry part again. I know how this ends.": "又到挨饿这一段了。我知道结局。",
    "Everything returns to ash.": "万物归于灰烬。",
    "Everything rots. Then grows again.": "万物腐朽。然后再生。",
    "The last apples. Until the first ones, next time.": "最后的苹果。直到下一次的第一个。",
    "Out again. It always goes out.": "又灭了。它总会熄灭。",
    "The ground gives way. I’ve crossed this before.": "地面塌陷了。我以前走过这里。",
    "I was always going to get there first, {who}.": "我注定先到，{who}。",
    "No more jokes. Food.": "不开玩笑了。吃的。",
    "Ashes to ashes, snack to dust!": "尘归尘，零食归灰！",
    "Rotten luck!": "烂运气！",
    "Last apples! Get ’em while they’re falling!": "最后的苹果！趁它们还在掉，快抢！",
    "Fire’s out! What a wet blanket.": "火灭了！真扫兴。",
    "Hole-y moly!": "洞洞洞，我的天！",
    "Now you see it, {who}. Now you don’t!": "现在你看见了，{who}。现在看不见了！",
    "Beep beep, {who}!": "哔哔，{who}！",
    "Can’t flash on an empty stomach.": "空着肚子可闪不起来。",
    "Even a star’s got to eat!": "星星也得吃饭！",
    "Stand back, young’uns. Watch this.": "年轻人，往后站。看好了。",
    "Oh, I’ve waited all day for this!": "哦，这一刻我等了一整天！",
    "In my day we flashed uphill both ways!": "想当年，我们来回都是上坡，照样一路闪过去！",
    "Did I tell you I once jumped the whole log, {who}?": "{who}，我跟你说过我跳过整根木头吗？",
    "Keep up, {who}! I’m only warming up.": "跟上，{who}！我才刚热身。",
    "This mustache has seen things, {who}.": "{who}，这胡子可是见过世面的。",
    "Sitting still is for rocks.": "一动不动是石头干的事。",
    "I was fast before fast was cool.": "快还没流行的时候，我就已经很快了。",
    "Rest, rest, rest. I’ll rest when I’m old!": "歇着，歇着，歇着。等我老了再歇！",
    "Come on, come on… I’m not getting any younger.": "快点，快点……我可不会越活越年轻。",
    "Hmph. In my day, a flash came right back.": "哼。想当年，闪完马上就能再闪。",
    "Don’t mind me, {who}. Just catching my breath.": "别管我，{who}。我就喘口气。",
    "Grumble, grumble. Is it ready yet?": "嘟囔，嘟囔。好了没有？",
    "There’s my sparkle! Look out.": "我的光芒回来了！小心。",
    "Rested! Well, rested enough.": "歇好了！嗯，歇得差不多了。",
    "Back in business!": "重新开张！",
    "Ah, there it is! Who’s next?": "啊，回来了！下一个是谁？",
    "Whee! Still got it!": "呜呼！宝刀未老！",
    "Zip! Just like the old days!": "嗖！就像当年一样！",
    "Look, no legs!": "看，连腿都不用！",
    "Fast as ever. Faster, even!": "快如往昔。甚至更快！",
    "Did you see that? Want to see it again?": "看见了吗？想再看一次吗？",
    "Ho ho! Still sparkling!": "嚯嚯！还是那么闪亮！",
    "Blink and you missed me!": "一眨眼，我就过去了！",
    "Ahh, wind in my mustache!": "啊，风吹胡子的感觉！",
    "They don’t make flashes like that anymore.": "这样的闪现，如今可不多见了。",
    "Up and over, sonny!": "跳过去喽，小子！",
    "Hup! Old star, new tricks!": "嘿！老星星，新把戏！",
    "Look at me! A shooting star!": "看我！一颗流星！",
    "Over we go! Ho ho!": "翻过去喽！嚯嚯！",
    "These old springs still work!": "这把老弹簧还挺好使！",
    "Golden zoom! Oh, that’s the good stuff!": "金色冲刺！哦，这才是好东西！",
    "Out of my way, I’m golden!": "让开，我可是金光闪闪的！",
    "Early star gets the apple, {who}!": "早起的星星有苹果吃，{who}！",
    "Beat you to it, {who}!": "抢先一步，{who}！",
    "Mind the mustache, {who}!": "小心胡子，{who}！",
    "Feel that breeze, {who}? That was me.": "感觉到那阵风了吗，{who}？那是我。",
    "Golden! Straight in the tank.": "金的！直接加满油。",
    "More gold for the old star!": "老星星又多了些金子！",
    "Ooh, the good stuff. Mine!": "哦，好东西。我的！",
    "Golden! Like my glory days.": "金的！就像我的黄金岁月。",
    "Gotcha, bug! Nothing gets past me.": "抓到你了，虫子！什么都逃不过我。",
    "A golden bug! Come to Grandpa!": "金虫子！快到爷爷这儿来！",
    "A golden beetle! Oh, I need that.": "金甲虫！哦，我需要那个。",
    "No edges? Now that’s my kind of log!": "没有边缘？这才是我喜欢的木头！",
    "Out one side, in the other! Marvellous!": "这边出去，那边进来！妙极了！",
    "Fuel for the flashes!": "闪现的燃料！",
    "Mm. Rocket fuel.": "嗯。火箭燃料。",
    "Bleh. That’s slowing-down food.": "呸。那是让人变慢的东西。",
    "Shrunk! Still quick, though.": "缩水了！不过还是很快。",
    "Sorry, {who}! I don’t do brakes.": "抱歉，{who}！我不会刹车。",
    "Whoops! That’s speed for you.": "哎呀！速度就是这样。",
    "Wind at my back! Whee!": "顺风！呜呼！",
    "Lightning! Now there’s a flash I respect.": "闪电！这才是我佩服的闪。",
    "Rain! You know what comes after rain…": "下雨了！你知道雨后会有什么……",
    "Sunshine! Twinkle weather.": "出太阳了！闪亮的好天气。",
    "Brr! Cold’s no good for old stars.": "好冷！冷天对老星星可不好。",
    "Peck away, bird. You’ll never catch me!": "使劲啄吧，鸟儿。你永远抓不到我！",
    "The last apples! Race you all!": "最后的苹果！大家比比谁快！",
    "Family!": "一家人！",
    "Oh, look at you! You’ve grown!": "哦，看看你！长这么大了！",
    "There’s my trail! I wondered where it went.": "那是我的尾迹！我还在想它去哪儿了。",
    "Oof! Tripped on my own mustache.": "哎哟！被自己的胡子绊倒了。",
    "Ow! That wasn’t there in my day.": "哎哟！我那个年代可没这东西。",
    "Ho! Still in one piece.": "嚯！还是完整的。",
    "Whoa! The log used to be bigger.": "哇！这根木头以前可大多了。",
    "Hot! Hot! I’m a star, not a comet!": "烫！烫！我是星星，不是彗星！",
    "Phew! Back to twinkling.": "呼！又能闪亮了。",
    "A hole under me? Pfft. I’ve hopped bigger.": "我身下有洞？哼。我跳过更大的。",
    "My rainbow! Who snipped my rainbow?": "我的彩虹！谁剪了我的彩虹？",
    "Hey, {who}! That was my best stripe!": "喂，{who}！那是我最漂亮的一道！",
    "Snip! Sorry, {who}, can’t stop!": "咔嚓！抱歉，{who}，停不下来！",
    "Easy, {who}! Mind my points.": "慢点，{who}！小心我的尖角。",
    "Careful, {who}! Old, not slow.": "小心，{who}！我老，可不慢。",
    "Baked apples! Smells like the old days.": "烤苹果！闻起来像从前的日子。",
    "Burnt! I should’ve flashed for it.": "烧没了！我该闪过去拿的。",
    "Rotted? I must be slowing down.": "烂了？我一定是变慢了。",
    "Went out with a twinkle…": "闪着光走了……",
    "Tell ’em I was quick, {who}.": "告诉他们我很快，{who}。",
    "Heh heh! Oh, my.": "嘿嘿！哎呀呀。",
    "Har har! Oh, my mustache!": "哈哈哈！哎哟，我的胡子！",
    "Festina lente, {who}!": "欲速则不达，{who}！",
    "Showoffus maximus.": "超级爱炫耀。",
    "Stella celerrima!": "最快的星星！",
    "Showing off, {who}? I show off better.": "炫耀，{who}？我炫耀得更好。",
    "Fast? I invented fast, {who}.": "快？快是我发明的，{who}。",
    "Friendly fire. Spat it out.": "误伤友军。吐出来了。",
    "Own round. Ejected.": "自己的弹壳。退膛。",
    "Thanks for the assist, {who}.": "谢谢助攻，{who}。",
    "Ptooey! That one’s ME!": "呸！那是我自己！",
    "Blech! The one food I won’t eat.": "呕！唯一我不吃的东西。",
    "Don’t mind if I do, {who}!": "那我就不客气了，{who}！",
    "You gonna eat that, {who}? No? Mine!": "你还吃不吃，{who}？不吃？归我了！",
    "…ack.": "……呃。",
    "…thank you, {who}.": "……谢谢你，{who}。",
    "We do not dine on Ourself.": "朕不吃朕自己。",
    "Ptah! The royal tail is not on the menu.": "呸！御尾不在菜单上。",
    "A tribute from {who}. How fitting.": "{who}的贡品。理所应当。",
    "Good heavens, that’s my own tail!": "天哪，那是我自己的尾巴！",
    "Ahem! Not cricket, eating oneself.": "咳咳！吃自己，太不像话了。",
    "Terribly kind of you, {who}.": "你真是太客气了，{who}。",
    "That was me. Not food.": "那是我。不是食物。",
    "Thanks, {who}.": "谢谢，{who}。",
    "Ptoo. I’m not dead enough.": "呸。我还没死透呢。",
    "Coughed it up for me, {who}? Thoughtful.": "特意为我咳出来的，{who}？真体贴。",
    "Tussis maximus!": "超级咳嗽！",
    "Non edibilis!": "不可食用！",
    "Gratias, {who}!": "谢啦，{who}！",
    "My own tail? Fake food! Sad!": "我自己的尾巴？假食物！可悲！",
    "Very unfair. Somebody put that there.": "非常不公平。有人故意放在那儿的。",
    "Thank you, {who}. Very generous. Tremendous.": "谢谢你，{who}。非常慷慨。了不起。",
    "hck. that’s my tail.": "咳。那是我的尾巴。",
    "blegh. tastes like me.": "呕。一股我自己的味道。",
    "hehe. dropped this, {who}.": "嘿嘿。你掉东西了，{who}。",
    "Own drop: no pickup. Cough debuff.": "自己的掉落物：无法拾取。咳嗽减益。",
    "Self-pickup disabled. Noted.": "自我拾取：已禁用。已记录。",
    "Free loot. Thanks, {who}.": "白捡的战利品。谢了，{who}。",
    "Ooh, my tail! Yum! No! Yuck!": "哦，我的尾巴！好吃！不！好恶心！",
    "A present from {who}! I love presents! Today.": "{who}送的礼物！我爱礼物！今天爱。",
    "Ptoo! Ate my own dust.": "呸！吃了自己的灰。",
    "Hack! Bit off more than I can chew.": "咳！贪多嚼不烂。",
    "Much obliged, {who}.": "承蒙关照，{who}。",
    "*clutches its throat, then spits*": "*捂住喉咙，然后吐出来*",
    "*coughs without a sound*": "*无声地咳嗽*",
    "*pats {who} on the back, mouth full*": "*满嘴食物，拍拍{who}的背*",
    "The one thing I’m known for. And I choke.": "我就以这个出名。结果噎住了。",
    "Tail in mouth. It looked easier in the drawings.": "尾巴进嘴。画上看着容易多了。",
    "What you lose comes round to me, {who}.": "你失去的，终会转到我这里，{who}。",
    "Hack! That joke went down the wrong way.": "咳！这个笑话呛到我了。",
    "Gesundheit, {who}! Thanks for lunch.": "长命百岁，{who}！谢谢你的午饭。",
    "Hack! In my day, tails went down easy.": "咳！想当年，尾巴一口就吞下去了。",
    "Ptoo! Got my own sparkle stuck in my throat.": "呸！自己的星光卡在喉咙里了。",
    "Bless you, {who}! I’ll take that.": "保重，{who}！这个我收下了。",
    "The flag’s gone down the hole! Abandon colony!": "旗子掉进洞里了！放弃殖民地！",
    "Blast! That bird’s pecked out a whole colony.": "该死！那只鸟啄掉了一整块殖民地。",
    "The capital has fallen. Into a hole.": "都城陷落了。陷进洞里了。",
    "A hole where our throne stood? The court moves at once.": "朕的王座处成了洞？朝廷即刻迁都。",
    "Target went to ground.": "目标钻进地下了。",
    "Dug in. Lost the shot.": "钻进去了。没打着。",
    "That bird’s spotting for {who} now.": "那只鸟现在给{who}当观察手了。",
    "NO! My snack went DOWN!": "不！我的零食钻下去了！",
    "It dug in?! Snacks aren’t allowed to dig!": "它钻进去了？！零食不许打洞！",
    "HEY! That bird gave {who} MY snack!": "喂！那只鸟把我的零食给了{who}！",
    "Pass it to ME, bird! Not {who}!": "传给我，鸟！别传给{who}！",
    "…gone under.": "……钻下去了。",
    "…the bird gave it to {who}.": "……鸟把它给了{who}。",
    "The beetle has fled the realm. Downwards.": "甲虫逃离了朕的疆土。往下逃的。",
    "Come back at once, beetle. That is a royal command.": "立刻回来，甲虫。这是圣旨。",
    "That bird served {who} from the royal table. Unthinkable.": "那只鸟把御膳端给了{who}。岂有此理。",
    "Blast! It’s gone to ground.": "该死！它钻到地下去了。",
    "I say, come back! Digging in is frightfully bad form.": "我说，回来！打洞可太失礼了。",
    "I say! That bird just served {who} my lunch.": "我说！那只鸟刚把我的午饭端给了{who}。",
    "It dug in. Okay.": "它钻进去了。好吧。",
    "The bird gave my food to {who}. Hm.": "鸟把我的食物给了{who}。嗯。",
    "Buried itself. I can wait.": "它把自己埋了。我等得起。",
    "Gone to ground. It’ll come up again.": "钻地下了。它还会上来的。",
    "Even the bird feeds {who} before me.": "连那只鸟都先喂{who}。",
    "Scarabaeus fugit!": "甲虫逃走了！",
    "Diggus escapus.": "挖洞逃之夭夭。",
    "Prandium meum, {who}?! Et tu, picus?": "我的午饭，{who}？！还有你吗，啄木鸟？",
    "An illegal tunnel! Very unfair.": "非法地道！非常不公平。",
    "It dug a tunnel. Somebody build a wall!": "它挖了条地道。快来人修墙！",
    "That bird works for {who}. Sad!": "那只鸟是替{who}干活的。可悲！",
    "aww. it hid.": "哎。它躲起来了。",
    "i’ll find you, little bug.": "我会找到你的，小虫子。",
    "that was mine, {who}. hehe.": "那是我的，{who}。嘿嘿。",
    "Target burrowed. Chase: failed.": "目标钻地。追击：失败。",
    "Dig-in escape. Noted.": "钻地逃脱。已记录。",
    "Knockback rule favoured {who}. Should have pathed it.": "击飞规则对{who}有利。我该算好路线的。",
    "It dug in! Clever bug! Rotten bug!": "它钻进去了！聪明的虫子！可恶的虫子！",
    "The bird gave {who} my lunch! Nice bird! Mean bird!": "鸟把我的午饭给了{who}！好鸟！坏鸟！",
    "Varmint went to ground.": "那小东西钻地下去了。",
    "Dang critter dug itself a hidey-hole.": "该死的小东西给自己挖了个藏身洞。",
    "That bird just dealt {who} my supper. Crooked dealer.": "那只鸟把我的晚饭发给了{who}。黑心荷官。",
    "*knocks on the bark, then shrugs*": "*敲敲树皮，然后耸耸肩*",
    "*digs with an invisible spade, then gives up*": "*用看不见的铲子挖了挖，然后放弃了*",
    "*points at the bird, then at {who}, aghast*": "*指指那只鸟，又指指{who}，目瞪口呆*",
    "Back into the wood. It will come round again.": "回到木头里去了。它还会转回来的。",
    "Down it goes. Up it comes, in time.": "下去了。总有一天会上来。",
    "It came round to {who} this time. Next time, me.": "这次转到{who}那儿了。下次就轮到我。",
    "Ha! The old trapdoor trick.": "哈！老掉牙的活板门戏法。",
    "Where’d the bug go? Hole in one!": "虫子去哪儿了？一杆进洞！",
    "Knock knock! Who’s there? {who}, with my lunch.": "咚咚！谁呀？{who}，拿着我的午饭。",
    "Hmph! Beetles were slower in my day.": "哼！我那个年代的甲虫可没这么快。",
    "Dug in? Cheeky little bug!": "钻进去了？调皮的小虫子！",
    "Hey! That bird passed my lunch to {who}!": "嘿！那只鸟把我的午饭传给了{who}！"
  };

  const SNAKE_GAP = 4500;  // ms of game time between lines from the same snake
  const ANY_GAP = 1200;    // ms between any two lines
  const BUBBLE_MS = 2600;  // how long a bubble stays up (real time)
  const LAST_WORDS_MS = 2000; // (and a snake's last words, where it went out, when the log can't show them)
  const LOG_SIZE = 5;
  const COMPACT_CHARS = 32; // on small boards, longer lines go to the log only (while it's on screen)
  // Mason's Life of Brian moments get an answer: [line, who answers, what they say,
  // and the voices' own lines for it, where they have some].
  // (Mason keeps a straight face; Ghost and Creeper aren't the giggling kind,
  // and nobody laughs at their own joke. Mute laughs without a sound, and
  // Copycat in Chinese.)
  const GIGGLE_PROOF = ['mason', 'ghost', 'creeper'];
  const REPLIES = {
    'Romanes eunt domus.': { by: s => s.personaKey === 'metagamer', lines: ['“Romani ite domum”, actually.'], after: 1300 },
    'Amicus meus est Biggus Dickus.': { by: s => !GIGGLE_PROOF.includes(s.personaKey), lines: ['Pfft…', '*snort*', 'Snrk. Sorry. Go on.'], own: 'giggle', after: 900,
      then: 'Et uxor: Incontinentia Buttocks.' }, // ...and Mason, straight-faced, carries on
    'Et uxor: Incontinentia Buttocks.': { by: s => !GIGGLE_PROOF.includes(s.personaKey), lines: ['BWAHAHA—', 'I can’t. I CAN’T.', '*wheeze*'], own: 'guffaw', after: 800 },
  };

  let boardEl, logEl, bannerEl, game;
  let enabled = true, compact = false, logShown = true, listener = null;
  let lastAny = -Infinity, lastSaid = {}, seen = {}, lastLine = null, pendingReply = null, saidAt = {};
  let struck = false; // (lightning has struck in this storm: one remark is enough)
  let pendingAnswer = null, answeredAt = -Infinity; // (an answer to Star's showing off, on its way; the last one)
  const rolled = []; // food a choking or coughing snake knocked aside, oldest first: { x, y, beetle, by, at } (see windfall)
  const digs = [];   // beetles digging in: { x, y, until, hunter } (see gotAway)
  const knocked = []; // food the woodpecker knocked aside, oldest first: { x, y, beetle, near, at } (see served)
  const LINE_REST = 45000; // a snake doesn't say the same line again within this much game time
  const INTRUDER_REST = 25000; // nor call out intruders more often (heads skim in and out at a border)
  // Some moments come often in a long round, so each snake remarks on them at most this often:
  const UNDER_REST = 12000;     // the woodpecker pecking under it
  const ROT_REST = 40000;       // food rotting by its head (beads rot all through the endgame)
  const LAND_ROT_REST = 30000;  // food rotting in Sovereign's realm or Colonist's colonies
  const DESPERATE_REST = 30000; // starving soon (it can come and go as it eats a little)
  const FLASH_REST = 30000;     // its own plain flashes (everyone flashes, about four times a minute)
  const NEAR_FOOD = 5;          // food that rots or burns this near its head (cells, and nearer than anyone's) was food it was after
  const CHOKE_REST = 20000;     // choking on its own bead (it can come again as soon as the cough's over)
  // Food a choking or coughing snake knocks aside lies in the open, for
  // anyone: whoever else eats it within WINDFALL_MS thanks the cougher,
  // cheekily, now and then (WINDFALL_CHANCE), and at most every WINDFALL_REST.
  // (A beetle nudged aside scurries off, so one caught within BEETLE_ROAM
  // cells of where it went counts.)
  const WINDFALL_MS = 6000, WINDFALL_CHANCE = 0.5, WINDFALL_REST = 30000, BEETLE_ROAM = 4;
  // A cornered beetle digs in where it is, and is gone under the bark a
  // moment later unless someone catches it first. One that gets away was
  // the snake's that cornered it (the nearest head as it started, within the
  // engine's BEETLE_DIG_FEAR): it says so, at most every DUG_REST.
  const DUG_REST = 30000;
  // Food the woodpecker knocks aside as it strikes lands in the open, where
  // the engine's rule puts it. Whoever eats it there within KNOCKED_MS, the
  // snake that was after it grumbles at, at most every KNOCKED_REST: the
  // nearest head to where it lay at the strike, the eater's aside, within
  // KNOCKED_NEAR. (The bird aims more than PECK_CLEARANCE cells from every
  // head, so a head within NEAR_FOOD of food in its mark is rare, and that
  // one mostly ate it itself: whoever was after it is a little further
  // off, and the nearest that didn't get it.) A knocked beetle scurries off
  // from where it lands, as a nudged one does: caught within BEETLE_ROAM
  // cells of there counts.
  const KNOCKED_MS = 6000, KNOCKED_NEAR = 8, KNOCKED_REST = 40000;
  // Star lives for its powers (it flashes whenever it's rested and jumps every
  // hurdle), so it cheers them all: its flashes, jumps and golden dashes, and
  // its flash back from its rest. Half the time, and all of them together at
  // most this often (a golden dash or jump is rarer: always, if it can):
  const SHOW_OFF_REST = 10000, SHOW_OFF_CHANCE = 0.5;
  // Its flash back is cheered only once it's been back this long: it flashes
  // the moment it can, as a rule (a tenth of a second later, mostly), and then
  // it's the flash that's worth a word, not a flash it no longer has.
  const READY_AFTER = 1000;
  // ...and once in a while someone answers it, a moment later (Wildcard brags
  // back, Mason in Latin): a round has a few, at most.
  const ANSWER_CHANCE = 0.25, ANSWER_AFTER = 1100, ANSWER_REST = 40000;
  // Mason's Life of Brian moments are told once per visit (a joke told every round isn't one).
  const SET_PIECES = new Set(['Romanes eunt domus.', 'Amicus meus est Biggus Dickus.']);
  const toldPieces = new Set();
  // Lines with a punchline are told once a round: a round runs two minutes and
  // more, and a joke told three times in it isn't one. The rest only rest a while.
  // (Each voice's on rows of their own, in the order above.)
  const PUNCHLINES = new Set([
    'Run. It helps.', 'Big fan of your stream, {who}.', 'Moving target. Still a headshot.', 'Taking fire. Literally.', 'Bounced off me, {who}? Cute.', 'Quick scope, {who}.',
    'Am I… cooking? Smells good, actually.', 'Oops. Is that meat?', 'My tail! That was full of food!', 'Who hid a mushroom in the snacks?!', 'Six legs, six times the flavour!', 'Ow! Is the edge edible?', 'Wheee! Lunch from above!', 'A hole under me! Is there food down there?', 'Blech! The one food I won’t eat.', 'You gonna eat that, {who}? No? Mine!', 'It dug in?! Snacks aren’t allowed to dig!',
    'boo.',
    'Trespasser! Guards! …We are the guards.', 'The Crown is merciful. Usually.', 'A strategic retreat. A royal one.', 'We shall have it executed.', 'Move the edge. We command it.', 'One day all this will be ours. Today, in fact.', 'That bird has committed treason.', 'Treason, {who}! That was the royal tail.', 'We are put out. In every sense.', 'Something is rotten in our realm.', 'A hole beneath the royal person? We do not stoop.', 'We do not dine on Ourself.', 'The capital has fallen. Into a hole.', 'The beetle has fled the realm. Downwards.',
    'Mine now. Terribly sorry.', 'I claim this for the Crown. Which crown? Mine.', 'Do you have a flag, {who}? No flag, no colony.', 'Papers, {who}? No? Off you pop.', 'A minor diplomatic incident.', 'I say, {who}! There’s a queue.', 'I appear to be on fire. How awkward.', 'Rain? Just like home.', 'Put out by the weather. How very British.', 'Burnt to a cinder. Like Sunday lunch.', 'Mind the gap!', 'The last apples? Ration them, chaps.', 'Ahem! Not cricket, eating oneself.', 'I say, come back! Digging in is frightfully bad form.',
    'I like beige.', 'This is a log.', 'Tastes like food.', 'That was a bump.',
    'Rest in pieces, {who}.', 'I’m not on the menu.', 'Leftovers… of me?', 'Gone already? I like them ripe.', 'No more waiting. I’ll make my own leftovers.', 'Ptoo. I’m not dead enough.', 'Coughed it up for me, {who}? Thoughtful.',
    'Vidi, vici, veni.', 'Divide et imperium-ium.', 'Murus maximus. Very bigus.', 'Wallus erectus.', 'Bonkus interruptus.', 'Murus sum, {who}.', 'Pons sum!', 'Veni, vidi, edi.', 'Rottus maximus.', 'Festina lente, {who}!', 'Showoffus maximus.', 'Diggus escapus.', 'Prandium meum, {who}?! Et tu, picus?',
    '{who}? Total loser. Sad!', 'Global warming? Total hoax. Look at all this snow!', 'Fake news! That never happened.', 'Who moved that? Fake wall!', 'I’m bigger than ever. Ask anyone.', 'Low energy, {who}. Very low energy.', 'Nobody bumps me, {who}. Believe me.', '{who} stole my tail! Total theft. Sad!', 'A hole under me? Fake hole. Didn’t even feel it.', 'Fire’s out. Nobody puts out fires like me.', 'Rotten food. Who’s responsible? Not me.', 'So fast. Faster than {who}. Everyone saw it.', 'Showing off, {who}? I show off better.', 'Fast? I invented fast, {who}.', 'Very unfair. Somebody put that there.', 'It dug a tunnel. Somebody build a wall!', 'That bird works for {who}. Sad!',
    'nice tail, {who}.', 'we should hang out, {who}.', 'peekaboo, {who}.', 'shh. nobody saw that.', 'blegh. tastes like me.',
    'Your eat rate is suboptimal, {who}.', 'Input lag, {who}?', 'Frame-perfect, {who}.',
    'Taking position. …Ooh, I like being Sniper.', 'Headshot! …Is that how Sniper says it?', 'Pew pew! …Sniper doesn’t say pew pew, does it?', 'FOOD. NOW. …Is Gobbler always this hungry?', 'Snacks! All the snacks! …How does Gobbler stop?',
    '…boo. …Am I doing Ghost right?', 'Shh. I’m being Ghost.', 'Aedificamus! …Ooh, I speak Latin now!', 'Veni, vidi, aedificavi! …Did I say that right?', 'Wallus maximus! …Is that Latin? It feels Latin.',
    'Sunshine! I love sunshine! Today.', 'Rain! I love rain! For now.', 'Snow! I love snow! For a bit.', 'A bird! I love birds! Not this one.', 'Ouch! I hate edges! Today.', 'Fire! I love fire! Ow, no I don’t!',
    'Ouch! Never doing that again! Probably.', 'Ow! That was fun! No it wasn’t.', 'I can fly! For a second!', 'Oops, {who}! Was that rude?', 'Now I’m hungry! Out of nowhere!', 'Didn’t plan that. Love it.', 'New mood: STARVING.', 'The fire’s out! I miss it already! No I don’t.', 'Ash! I love ash! No, I wanted that!', 'It rotted! I didn’t want it anyway! I did.', 'A hole! I love holes! Not under me.', 'Zip! Mine! Sorry, {who}! Not sorry!', 'Ooh, my tail! Yum! No! Yuck!', 'A present from {who}! I love presents! Today.', 'It dug in! Clever bug! Rotten bug!', 'The bird gave {who} my lunch! Nice bird! Mean bird!',
    'Is that the edge? Let’s go see.', 'Yep. That’s the edge, all right.', 'Who wants to play chicken?', 'Cold enough to freeze a cactus.', 'What doesn’t kill me… shrinks me.', 'Fire’s out? Shucks. Was just warming up.', 'Burnt the beans again.', 'Hack! Bit off more than I can chew.', 'That bird just dealt {who} my supper. Crooked dealer.',
    '*walks into a wall. A real one, this time*', '*plays a tiny invisible violin*', '*holds up an invisible scorecard: 3*', '*tightrope-walks over the hole*', '*wrings out its beret*', '*pats {who} on the back, mouth full*', '*digs with an invisible spade, then gives up*',
    'Even I must eat. Usually myself.', 'My tail! I was saving that.', 'Haven’t we met before, {who}?', 'Ah. This bit again.', 'Even the log has an end.', 'The last apples. Until the first ones, next time.', 'The one thing I’m known for. And I choke.', 'Tail in mouth. It looked easier in the drawings.', 'It came round to {who} this time. Next time, me.',
    'Why did the snake cross the bark? It was starving.', 'Knock knock! Who’s there? Lunch, I hope.', 'Knock knock! Oh. It’s the woodpecker.', 'Somewhere over the… oh, there it is.', 'Knock knock, {who}! …Bonk!',
    'Ha! The bird’s got jokes.', 'Follow me, it’s a shortcut!', 'Fungi! Fun guy! …No?', 'Not so funny now.', 'Mushroom? I hardly know ’em!', 'Classic {who}. Never gets old.', 'Pull my tail!', 'Wanna hear a joke, {who}?', 'Ta-da! {who}, sawn in half!', 'Hey! Sawing in half is MY trick, {who}!', 'Fire’s out! What a wet blanket.', 'Ashes to ashes, snack to dust!', 'Rotten luck!', 'Hole-y moly!', 'Now you see it, {who}. Now you don’t!', 'Beep beep, {who}!', 'Hack! That joke went down the wrong way.', 'Gesundheit, {who}! Thanks for lunch.', 'Ha! The old trapdoor trick.', 'Where’d the bug go? Hole in one!', 'Knock knock! Who’s there? {who}, with my lunch.',
    'In my day we flashed uphill both ways!', 'Did I tell you I once jumped the whole log, {who}?', 'This mustache has seen things, {who}.', 'I was fast before fast was cool.',
    'Rest, rest, rest. I’ll rest when I’m old!', 'Come on, come on… I’m not getting any younger.', 'Hmph. In my day, a flash came right back.', 'Rested! Well, rested enough.',
    'Look, no legs!', 'Did you see that? Want to see it again?', 'They don’t make flashes like that anymore.', 'Hup! Old star, new tricks!', 'Early star gets the apple, {who}!', 'Feel that breeze, {who}? That was me.', 'A golden bug! Come to Grandpa!',
    'Sorry, {who}! I don’t do brakes.', 'Lightning! Now there’s a flash I respect.', 'Rain! You know what comes after rain…', 'Family!', 'Oh, look at you! You’ve grown!', 'There’s my trail! I wondered where it went.',
    'Oof! Tripped on my own mustache.', 'Ow! That wasn’t there in my day.', 'Whoa! The log used to be bigger.', 'Hot! Hot! I’m a star, not a comet!', 'Careful, {who}! Old, not slow.', 'Rotted? I must be slowing down.', 'Hack! In my day, tails went down easy.', 'Hmph! Beetles were slower in my day.',
  ]);
  const toldThisRound = new Set();
  const bubbles = new Map(); // snake id -> { el, snake, until, at, w, h, side, x, y, ... }, oldest first
  const headAt = { x: 0, y: 0 }, headMine = { x: 0, y: 0 };
  const taken = []; // (this frame: the banner's box and the bubbles placed so far)

  try { enabled = localStorage.getItem('snake-chatter') !== 'off'; } catch { /* storage unavailable */ }

  const pick = list => list[Math.floor(Math.random() * list.length)];
  const hasChinese = text => /[一-鿿]/.test(text);
  // A line's words, in a bubble or the log. A stage direction (Mute's mimes,
  // a giggle: "*waves silently*") is in italics, without its asterisks (a
  // screen reader would say "star"), and in the log it reads on from the
  // name: "Mute waves silently". Copycat's Chinese ones go in brackets, as
  // Ghost's "（沉默）" does (Chinese isn't set in italics).
  function setWords(el, text) {
    const mimed = /^\*(.+)\*$/.exec(text), zh = hasChinese(text);
    if (mimed && zh) el.textContent = `（${mimed[1]}）`;
    else if (mimed) el.append(Object.assign(document.createElement('em'), { textContent: mimed[1] }));
    else el.textContent = text;
    if (zh) el.lang = 'zh-Hans';
  }

  // The log sits on dark wood: a dark colour is lightened just enough for its
  // name to read there (LOG_CONTRAST against LOG_WOOD, the log at its
  // lightest: its rgba(63, 37, 16, 0.55) over the forest floor's lightest
  // green under a shaft of light; where it sits it's darker, about 5.5:1),
  // keeping its hue and saturation, so a name keeps its snake's colour.
  // (Mixing it halfway to white turned the reds pink: Copycat's flag red,
  // Sniper's, Colonist's and Wildcard's alike.)
  const LOG_WOOD = [56, 50, 29], LOG_CONTRAST = 4.5;
  const luminance = rgb => rgb.reduce((sum, v, i) => { v /= 255; return sum + [0.2126, 0.7152, 0.0722][i] * (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); }, 0);
  const onWood = rgb => (luminance(rgb) + 0.05) / (luminance(LOG_WOOD) + 0.05);
  function readable(hex) {
    const n = parseInt(hex.slice(1), 16);
    const rgb = [n >> 16, (n >> 8) & 255, n & 255];
    if (onWood(rgb) >= LOG_CONTRAST) return hex;
    // (Its hue and saturation, in HSL; the least lightness that reads.)
    const [r, g, b] = rgb.map(v => v / 255), hi = Math.max(r, g, b), lo = Math.min(r, g, b), d = hi - lo;
    const h = !d ? 0 : hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
    const s = !d ? 0 : d / (1 - Math.abs(hi + lo - 1));
    const at = l => { const c = (1 - Math.abs(2 * l - 1)) * s, f = k => { const t = (k + h) % 6; return l + c / 2 - c * Math.max(0, Math.min(1, Math.min(t, 4 - t))); }; return [f(5), f(3), f(1)].map(v => Math.round(v * 255)); };
    let low = (hi + lo) / 2, high = 1;
    for (let i = 0; i < 12; i++) { const mid = (low + high) / 2; if (onWood(at(mid)) >= LOG_CONTRAST) high = mid; else low = mid; }
    return `rgb(${at(high).join(',')})`;
  }

  // Everyone by name: you're your Hall of Fame name (or "Green"), friends theirs.
  const nameOf = s => s.name;

  // Land, by the one rule the AI, the HUD and the borders use: cell x, y is a
  // field's land when its centre is within the field's radius plus LAND_REACH.
  const onLand = (x, y, f) => Math.hypot(x - f.x, y - f.y) <= f.radius + window.TUNING.LAND_REACH;
  // The fields a snake holds: Sovereign's realm, or Colonist's colonies (or none).
  const landsOf = m => m.home ? [m.home] : m.colonies?.length ? m.colonies : null;
  // Is cell x, y a hole (the woodpecker's)?
  const holeAt = (x, y) => !!game.holes?.has(y * window.TUNING.GRID + x);
  // Colonist's colonies as the chatter last saw them, and now (n: which flag it is).
  const NONE = [];
  const sameColonies = (a, b) => !!b && a.length === b.length && a.every((c, i) => c.n === b[i].n && c.x === b[i].x && c.y === b[i].y);
  // Do two fields share a cell of land? (Where they do, the map hatches it.)
  function sharesLand(a, b) {
    const N = window.TUNING.GRID, r = Math.ceil(a.radius + window.TUNING.LAND_REACH);
    for (let y = Math.max(0, a.y - r); y <= Math.min(N - 1, a.y + r); y++) {
      for (let x = Math.max(0, a.x - r); x <= Math.min(N - 1, a.x + r); x++) if (onLand(x, y, a) && onLand(x, y, b)) return true;
    }
    return false;
  }

  function init(opts) {
    ({ boardEl, logEl } = opts);
    // Is the log on screen, with room for a whole line? Where the chatter
    // has room for no row, or for a strip of one (game/screen.js fitChatter), a
    // line put in the log alone would be lost or cut. (Measured as the page
    // changes size or scrolls, and as the chatter's fit changes, never per
    // frame.)
    const placeLog = () => { const r = logEl.getBoundingClientRect(); logShown = r.height > 0 && r.top >= 0 && r.top + 20 <= innerHeight && !logEl.closest('[data-fit="strip"]'); };
    addEventListener('resize', placeLog, { passive: true });
    addEventListener('scroll', placeLog, { passive: true });
    new ResizeObserver(placeLog).observe(logEl.closest('main') || document.body);
    if (logEl.parentElement) new MutationObserver(placeLog).observe(logEl.parentElement, { attributes: true, attributeFilter: ['data-fit'] });
    // The banner over the board: bubbles keep out of its way. Its box is read
    // only after it changes (a new banner, moved to the foot, gone).
    bannerEl = boardEl.querySelector('.toast');
    if (bannerEl) new MutationObserver(() => { bannerStale = true; }).observe(bannerEl, { attributes: true, attributeFilter: ['hidden', 'class', 'data-kind'], childList: true, characterData: true, subtree: true });
  }

  function reset(g) {
    game = g;
    lastAny = -Infinity; lastSaid = {}; seen = {}; lastLine = null; pendingReply = null; saidAt = {}; struck = false;
    pendingAnswer = null; answeredAt = -Infinity;
    rolled.length = 0; digs.length = 0; knocked.length = 0;
    toldThisRound.clear();
    clearBubbles();
    logEl.textContent = '';
  }

  function clearBubbles() {
    for (const b of bubbles.values()) b.el.remove();
    bubbles.clear();
  }

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem('snake-chatter', on ? 'on' : 'off'); } catch { /* storage unavailable */ }
    if (!on) clearBubbles();
  }

  const isEnabled = () => enabled;
  const setCompact = v => { compact = v; boardEl?.classList.toggle('compact-chat', v); };
  // Online, the host passes every line on (onSpeak), and friends' screens
  // replay it, so everyone sees the same chatter.
  const onSpeak = fn => { listener = fn; };
  function replay(s, text, reply = false) {
    if (!enabled || !s) return;
    lastSaid[s.id] = game.time;
    lastAny = game.time;
    bubble(s, text, reply);
    addLog(s, text);
  }

  // Have snake s say a line from one of its lists. urgent lines skip the global gap.
  // Lines naming someone ({who}) are only used when there is someone to name;
  // last words prefer them ("Et tu, Sniper?"). Returns whether it said one.
  function say(s, key, who, urgent = false) {
    if (!enabled || !s.persona) return;
    const find = v => key.includes('.') ? key.split('.').reduce((o, k) => o?.[k], v) : v?.[key];
    // (Capricious in a mood plays the part: the mood's own lines, where it has some.)
    const acting = s.personaKey === 'capricious' && s.memory.mood && !key.startsWith('mood') && find(VOICES[s.memory.mood])?.length;
    const voice = VOICES[acting ? s.memory.mood : s.personaKey];
    const lines = find(voice);
    if (!lines?.length) return;
    const naming = lines.filter(l => l.includes('{who}'));
    const plain = lines.filter(l => !l.includes('{who}'));
    const pool = !who ? plain : key === 'dies' && naming.length ? naming : lines;
    if (!pool.length) return;
    const now = game.time;
    if (now - (lastSaid[s.id] ?? -Infinity) < SNAKE_GAP) return;
    if (!urgent && now - lastAny < ANY_GAP) return;
    const said = saidAt[s.id] ||= new Map();
    const told = l => SET_PIECES.has(l) ? toldPieces.has(l) : PUNCHLINES.has(l) ? toldThisRound.has(l) : game.time - (said.get(l) ?? -Infinity) < LINE_REST;
    const fresh = pool.filter(l => !told(l));
    if (!fresh.length) return false; // (nothing new to say: quiet beats a repeat)
    const template = pick(fresh);
    said.set(template, game.time);
    if (SET_PIECES.has(template)) toldPieces.add(template);
    if (PUNCHLINES.has(template)) toldThisRound.add(template);
    const label = (who && s.memory.labels?.[who.id]) || 'unclear';
    speak(s, fill(template, who ? nameOf(who) : '', label), { template, who, label });
    return true;
  }

  // (Replacers are functions, so a name like "$'" is just a name.)
  const fill = (template, who, label) => template.replaceAll('{who}', () => who).replaceAll('{label}', () => label);

  function speak(s, text, source = null) {
    lastSaid[s.id] = game.time;
    lastAny = game.time;
    lastLine = { speaker: s, text, ...source };
    bubble(s, text, !!source?.reply);
    addLog(s, text);
    listener?.(s, text, !!source?.reply);
    const reply = source?.template && REPLIES[source.template];
    if (reply) pendingReply = { at: game.time + reply.after, reply, teller: s };
  }

  // A line's bubble. On small boards a long line goes to the log alone, if
  // the log's on screen to show it (a reply always gets its bubble: it's the
  // joke). A snake that's just gone out says its last words where it went
  // out, briefly, when the log can't show them.
  function bubble(s, text, reply) {
    if (s.alive) { if (!(compact && logShown && text.length > COMPACT_CHARS && !reply)) showBubble(s, text); }
    else if (!logShown && s.body?.length) showBubble(s, text, s.body[0]);
  }

  function showBubble(s, text, at = null) {
    bubbles.get(s.id)?.el.remove();
    bubbles.delete(s.id); // (so the newest comes last: it's the one that makes way)
    const el = document.createElement('div');
    el.className = 'bubble';
    el.setAttribute('aria-hidden', 'true'); // (screen readers get the log instead)
    const words = document.createElement('span'); // (the bubble you see: it pops in, while its box is moved about)
    setWords(words, text);
    el.append(words);
    el.style.setProperty('--edge', s.persona?.ink || s.color);
    boardEl.appendChild(el);
    bubbles.set(s.id, { el, snake: s, until: performance.now() + (at ? LAST_WORDS_MS : BUBBLE_MS), at: at && { x: at.x, y: at.y }, w: 0, h: 0, box: { x: 0, y: 0, w: 0, h: 0 }, side: null, shown: null, want: null, wantSince: 0, ox: 0, oy: 0, x: NaN, y: NaN, tail: NaN, near: false });
  }

  // Called every frame: bubbles follow the gliding heads, stay inside the
  // board, and expire on time even when the round is over or paused.
  // A bubble is never in the way of its snake's path: above the head (below
  // it near the top) for a snake going sideways, beside it (where there's
  // room) for one going up or down. And it doesn't jump about as the snake
  // turns: it moves to another side only once that side has been the right
  // one for a moment (or its own has run out of room), and then glides there.
  // Nor does it cover the banner or an older bubble: a side that would has no
  // room, and with no side clear, it's nudged out of the way (gliding too).
  // keepClear: your snake, if you're playing: a bubble near your head fades.
  const SIDE_DELAY = 450, GLIDE_MS = 110, CLEAR = 4; // (CLEAR: px between a bubble and what it keeps out of)
  let lastLayout = 0;
  function layout(alpha, boardPx, keepClear = null) {
    if (!bubbles.size || !boardPx) { lastLayout = 0; return; }
    const now = performance.now();
    const glide = lastLayout ? 1 - Math.exp(-Math.min(64, now - lastLayout) / GLIDE_MS) : 1;
    lastLayout = now;
    const cellPx = boardPx / window.TUNING.GRID, gap = cellPx * 0.75 + 6; // (6: room for the tail)
    if (bannerStale || bannerPx !== boardPx) readBanner(boardPx);
    taken.length = 0;
    if (banner) taken.push(banner);
    for (const [id, b] of bubbles) {
      if (now > b.until || (!b.snake.alive && !b.at)) { b.el.remove(); bubbles.delete(id); continue; }
      if (b.at) { headAt.x = (b.at.x + 0.5) * cellPx; headAt.y = (b.at.y + 0.5) * cellPx; } // (last words: where it went out)
      else window.SnakeRender.headPx(b.snake, alpha, boardPx, headAt);
      if (!b.w) { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; } // (measured once, as it first shows)
      const w = b.w, h = b.h;
      const inX = v => Math.min(boardPx - w - 4, Math.max(4, v)), inY = v => Math.min(boardPx - h - 4, Math.max(4, v));
      // Where it sits on a side, relative to the head (its top-left corner),
      // and where that is on the board; whether that side fits on the board,
      // whether it's clear there too, or can be nudged clear (see nudge).
      const offX = side => side === 'left' ? -gap - w : side === 'right' ? gap : -w / 2;
      const offY = side => side === 'above' ? -gap - h : side === 'below' ? gap : -h / 2;
      const spotX = side => inX(headAt.x + offX(side)), spotY = side => inY(headAt.y + offY(side));
      const fits = side => side === 'above' ? headAt.y - gap - h >= 0 : side === 'below' ? headAt.y + gap + h <= boardPx
        : side === 'left' ? headAt.x - gap - w >= 0 : headAt.x + gap + w <= boardPx;
      const clear = side => fits(side) && free(spotX(side), spotY(side), w, h);
      const movable = side => fits(side) && nudge(side, spotX(side), spotY(side), w, h, boardPx);
      const choose = room => b.snake.dir.y !== 0
        ? (b.side === 'left' || b.side === 'right') && room(b.side) ? b.side : room('right') && (headAt.x < boardPx / 2 || !room('left')) ? 'right' : 'left'
        : b.side === 'below' && headAt.y < cellPx * 4 ? 'below' : room('above') ? 'above' : 'below';
      let want = choose(clear);
      if (!clear(want)) want = choose(movable); // (no side's clear as it is: one it can be nudged clear on,
      if (!movable(want)) want = choose(fits); //  or failing that, the side it'd have alone)
      if (!b.side) b.side = want;
      else if (want !== b.side) {
        if (b.want !== want) { b.want = want; b.wantSince = now; }
        if (now - b.wantSince >= SIDE_DELAY || !fits(b.side) || (!movable(b.side) && movable(want))) { b.side = want; b.want = null; }
      } else b.want = null;
      // Where it goes, relative to the head, eased toward.
      let tx = offX(b.side), ty = offY(b.side);
      if (taken.length && nudge(b.side, spotX(b.side), spotY(b.side), w, h, boardPx) && (nudged.x || nudged.y)) {
        tx = spotX(b.side) + nudged.x - headAt.x; ty = spotY(b.side) + nudged.y - headAt.y;
      }
      if (b.side !== b.shown) {
        if (!b.shown) { b.ox = tx; b.oy = ty; }
        b.el.dataset.side = b.side;
        b.shown = b.side;
      }
      b.ox += (tx - b.ox) * glide;
      b.oy += (ty - b.oy) * glide;
      const x = Math.round(inX(headAt.x + b.ox));
      const y = Math.round(inY(headAt.y + b.oy));
      // (where it's going, not where it's got to: newer bubbles keep clear of that)
      b.box.x = inX(headAt.x + tx); b.box.y = inY(headAt.y + ty); b.box.w = w; b.box.h = h;
      taken.push(b.box);
      let near = false;
      if (keepClear?.alive) {
        const mine = window.SnakeRender.headPx(keepClear, alpha, boardPx, headMine);
        near = Math.abs(mine.x - x - w / 2) < w / 2 + cellPx * 1.5 && Math.abs(mine.y - y - h / 2) < h / 2 + cellPx * 1.5;
      }
      if (near !== b.near) { b.el.classList.toggle('near', near); b.near = near; }
      if (x === b.x && y === b.y) continue;
      // The tail points at the head, even when the bubble is pushed along at an edge.
      const across = b.side === 'above' || b.side === 'below';
      // (in steps of 5%: every change restyles the bubble)
      const tail = 5 * Math.round(Math.min(85, Math.max(15, across ? (headAt.x - x) / w * 100 : (headAt.y - y) / h * 100)) / 5);
      if (tail !== b.tail) { b.el.style.setProperty('--tail', `${tail}%`); b.tail = tail; }
      b.el.style.transform = `translate(${x}px, ${y}px)`;
      b.x = x; b.y = y;
    }
  }

  // Is this box clear of the banner and the bubbles placed so far?
  function free(x, y, w, h) {
    for (const r of taken) if (x < r.x + r.w + CLEAR && r.x < x + w + CLEAR && y < r.y + r.h + CLEAR && r.y < y + h + CLEAR) return false;
    return true;
  }

  // A bubble with no clear side moves out of the way by as little as it can:
  // along its side (its tail still on the head, headAt) or further off, never
  // back over its snake. Whether it's clear, there or so moved; nudged: the
  // shift (none, if it was clear already or nothing helps).
  const nudged = { x: 0, y: 0 };
  function nudge(side, x, y, w, h, boardPx) {
    nudged.x = nudged.y = 0;
    if (free(x, y, w, h)) return true;
    const across = side === 'above' || side === 'below';
    let best = Infinity;
    for (const r of taken) {
      if (!(x < r.x + r.w + CLEAR && r.x < x + w + CLEAR && y < r.y + r.h + CLEAR && r.y < y + h + CLEAR)) continue;
      for (let k = 0; k < 4; k++) { // (past its right, left, bottom or top)
        const dx = k === 0 ? r.x + r.w + CLEAR - x : k === 1 ? r.x - CLEAR - w - x : 0;
        const dy = k === 2 ? r.y + r.h + CLEAR - y : k === 3 ? r.y - CLEAR - h - y : 0;
        const d = Math.abs(dx) + Math.abs(dy);
        if (d >= best || x + dx < 4 || x + dx > boardPx - w - 4 || y + dy < 4 || y + dy > boardPx - h - 4) continue;
        const along = across ? dx : dy, off = across ? dy : dx;
        const toward = side === 'above' || side === 'left' ? off > 0 : off < 0;
        const head = across ? headAt.x - x - dx : headAt.y - y - dy, span = across ? w : h;
        if (toward || (along && (head < span * 0.15 || head > span * 0.85)) || !free(x + dx, y + dy, w, h)) continue;
        best = d; nudged.x = dx; nudged.y = dy;
      }
    }
    return best < Infinity;
  }

  // The banner's box on the board (it's centred by a transform, which the
  // offsets leave out). While it's faded for a head under it, the board
  // comes first and bubbles may cross it; above the board (a phone held
  // upright: game/banners.js placeToast), it's in nobody's way.
  let banner = null, bannerStale = true, bannerPx = 0;
  function readBanner(boardPx) {
    bannerStale = false;
    bannerPx = boardPx;
    if (!bannerEl || bannerEl.hidden || bannerEl.classList.contains('under') || bannerEl.classList.contains('above')) { banner = null; return; }
    const w = bannerEl.offsetWidth;
    banner = { x: bannerEl.offsetLeft - w / 2, y: bannerEl.offsetTop, w, h: bannerEl.offsetHeight };
  }

  function addLog(s, text) {
    const li = document.createElement('li');
    const who = document.createElement('strong');
    who.textContent = s.name;
    who.style.color = readable(s.persona?.ink || s.color);
    const said = document.createElement('span');
    setWords(said, text);
    li.append(who, ' ', said);
    logEl.prepend(li);
    while (logEl.children.length > LOG_SIZE) logEl.lastChild.remove();
  }

  // Everyone flashes, often (about ten a round), so a plain flash is worth a
  // word only now and then: when it grabbed food from under a rival's nose
  // (first), or shot right by a rival's head (past: beside a cell it crossed).
  // Star cheers any flash of its own (zoom), as it shows off (see showOff).
  function flashed(e) {
    const s = e.snake, was = (seen[s.id] ||= {}), star = showsOff(s);
    if (!star && game.time - (was.flashAt ?? -Infinity) < FLASH_REST) return;
    const near = (x, y, r) => game.snakes.find(o => o !== s && o.alive && Math.abs(o.body[0].x - x) <= r && Math.abs(o.body[0].y - y) <= r);
    const ate = game.events.find(f => f.type === 'eat' && f.snake === s && f.kind !== 'mushroom');
    const beaten = ate && near(ate.x, ate.y, 3);
    let passed = null;
    if (!ate) for (const c of s.body.slice(0, Math.max(1, e.n || 1))) if ((passed = near(c.x, c.y, 1))) break;
    if (star) showOff(s, beaten ? 'flash.first' : passed ? 'flash.past' : 'zoom', beaten || passed);
    else if ((beaten || passed) && Math.random() < 0.4 && say(s, beaten ? 'flash.first' : 'flash.past', beaten || passed, true)) was.flashAt = game.time;
  }

  // Star, the power addict, cheers its every flash, jump and golden dash, and
  // its flash back from its rest: those keep to a rest of their own, or it
  // would never stop. (While its flash rests, its small talk grumbles.) It
  // talks so much that its own moments (golden power food, a rainbow, a
  // kill, a cut) would mostly come while it's still in its gap after the
  // last line: those clear it (ownMoment), unless that line was this tick's
  // (one line at a time).
  const showsOff = s => s.personaKey === 'star';
  // (Clearing a snake's gap for news, unless its last line was this tick's.
  // Star's own moments do; so do a choke, and a colony or a capital the
  // woodpecker took.)
  const news = s => { if (s && lastSaid[s.id] < game.time) lastSaid[s.id] = -Infinity; };
  const ownMoment = s => { if (s && showsOff(s)) news(s); };
  // A line for showing off (key; who: a rival it beat to food or shot past),
  // half the time and at most every SHOW_OFF_REST (sure: a golden dash or
  // jump, a round has one or two of each, so whenever it can); whether it
  // said one. Now and then someone with words for it answers a moment later
  // (see update).
  function showOff(s, key, who = null, sure = false) {
    const was = (seen[s.id] ||= {});
    if (!sure && (game.time - (was.showAt ?? -Infinity) < SHOW_OFF_REST || !(Math.random() < SHOW_OFF_CHANCE))) return false;
    if (!say(s, key, who, true)) return false;
    was.showAt = game.time;
    const answers = game.snakes.some(o => o !== s && o.alive && VOICES[o.personaKey]?.showoff);
    if (answers && !pendingAnswer && game.time - answeredAt >= ANSWER_REST && Math.random() < ANSWER_CHANCE) pendingAnswer = { at: game.time + ANSWER_AFTER, teller: s };
    return true;
  }

  // A choking snake spits its bead aside, and a coughing one nudges aside
  // any food its head reaches: where each piece went (rolled), for a while.
  // A piece someone else eats there was a windfall: a rival who ate it
  // thanks the cougher now and then ({who}), cheekily (windfall: whether it
  // did). Any eating there (the cougher's own, once its cough is over, or
  // yours) settles it.
  function knockedAside(e) {
    for (let i = rolled.length - 1; i >= 0; i--) if (rolled[i].x === e.x && rolled[i].y === e.y) rolled.splice(i, 1); // (a piece knocked on again)
    rolled.push({ x: e.tx ?? e.x, y: e.ty ?? e.y, beetle: e.kind === 'beetle', by: e.snake, at: game.time });
  }
  // (Is what e ate the piece that landed at r? A beetle runs on from there.)
  const landed = (r, e) => r.beetle ? e.kind === 'beetle' && Math.abs(r.x - e.x) + Math.abs(r.y - e.y) <= BEETLE_ROAM : r.x === e.x && r.y === e.y;
  function windfall(e) {
    const i = rolled.findIndex(r => landed(r, e));
    if (i < 0) return false;
    const { by } = rolled.splice(i, 1)[0], s = e.snake;
    if (by === s || !s.persona) return false;
    const was = (seen[s.id] ||= {});
    if (game.time - (was.windfallAt ?? -Infinity) < WINDFALL_REST || !(Math.random() < WINDFALL_CHANCE)) return false;
    if (!say(s, 'windfall', by, true)) return false;
    was.windfallAt = game.time;
    return true;
  }

  // A beetle that dug in has gone under (a dive, dug): it got away from the
  // snake that cornered it (digs, from its dig), which says so if it's a
  // rival. (One caught as it dug is just a catch: no dive.)
  function gotAway(e) {
    const i = digs.findIndex(d => d.x === e.x && d.y === e.y);
    if (i < 0) return;
    const s = digs.splice(i, 1)[0].hunter, was = s && (seen[s.id] ||= {});
    if (s?.persona && s.alive && !(game.time - (was.dugAt ?? -Infinity) < DUG_REST) && say(s, 'dug', null, true)) was.dugAt = game.time;
  }

  // Food the woodpecker knocked aside (knocked), eaten where it landed: the
  // snake that was after it, the nearest head at the strike but the
  // eater's (near: within KNOCKED_NEAR, nearest first), grumbles at the
  // eater, if it's a rival (nobody speaks for you). Any eating there
  // settles it.
  function served(e) {
    const i = knocked.findIndex(r => landed(r, e));
    if (i < 0) return;
    const s = knocked.splice(i, 1)[0].near.find(o => o !== e.snake), was = s && (seen[s.id] ||= {});
    if (!s?.persona || !s.alive || game.time - (was.knockedAt ?? -Infinity) < KNOCKED_REST) return;
    if (say(s, 'knocked', e.snake, true)) was.knockedAt = game.time;
  }

  // Called once per tick, after the engine moved everyone.
  function update() {
    if (!game || !enabled) return;

    const ais = game.snakes.filter(s => s.persona);
    const alive = ais.filter(s => s.alive);
    const anyone = s => pick(game.snakes.filter(o => o !== s && o.alive)) || null;
    const byName = name => game.snakes.find(o => o.name === name);
    const byId = id => game.snakes.find(o => o.id === id);
    // Whose head was nearest food that's just gone (anyone's: you can beat a
    // rival to it), if it was near: that snake was after it.
    const after = (x, y, near = NEAR_FOOD) => {
      let best = null, d = near + 1;
      for (const o of game.snakes) {
        if (!o.alive) continue;
        const k = Math.abs(o.body[0].x - x) + Math.abs(o.body[0].y - y);
        if (k < d) { d = k; best = o; }
      }
      return best;
    };
    // ...and every head within near of it, nearest first (a tie, in the snakes' order, as above).
    const nearest = (x, y, near) => game.snakes.filter(o => o.alive).map(o => [o, Math.abs(o.body[0].x - x) + Math.abs(o.body[0].y - y)])
      .filter(([, k]) => k <= near).sort((a, b) => a[1] - b[1]).map(([o]) => o);

    // Hello, round. One or two snakes speak up in the first seconds.
    if (game.tick === 6 || game.tick === 20) {
      const s = pick(alive.filter(a => !lastSaid[a.id]));
      if (s) say(s, 'start', anyone(s));
    }

    // (Where this tick's spat and nudged food went, before anyone's eating is
    // looked at: a head can reach it in the same tick.)
    while (rolled.length && game.time - rolled[0].at > WINDFALL_MS) rolled.shift();
    for (const e of game.events || []) if (e.type === 'choke' || e.type === 'nudge') knockedAside(e);
    // (Likewise beetles digging in, whose hunter is whoever cornered it, and
    // food the woodpecker knocked aside, with the heads that were near it.)
    while (knocked.length && game.time - knocked[0].at > KNOCKED_MS) knocked.shift();
    for (let i = digs.length - 1; i >= 0; i--) if (game.tick > digs[i].until + 10) digs.splice(i, 1); // (caught as it dug: no dive)
    for (const e of game.events || []) {
      if (e.type === 'dig') digs.push({ x: e.x, y: e.y, until: e.until, hunter: after(e.x, e.y, window.TUNING.BEETLE_DIG_FEAR) });
      else if (e.type === 'knock' && e.tx != null && e.kind !== 'mushroom') { // (eaten by the bird, it's gone; nobody misses a mushroom)
        const bead = e.kind === 'pellet' ? game.food.find(f => f.x === e.tx && f.y === e.ty && f.kind === 'pellet')?.owner : undefined;
        const near = nearest(e.x, e.y, KNOCKED_NEAR).filter(o => o.id !== bead); // (its own bead was never its meal)
        if (near.length) knocked.push({ x: e.tx, y: e.ty, beetle: e.kind === 'beetle', near, at: game.time });
      }
    }

    const dashed = []; // (the rivals who made a golden dash: their lines wait for its cuts, below)
    for (const e of game.events || []) {
      if (e.type === 'eat') served(e); // (the snake it was knocked away from has its word first: the eater's own lines follow)
      if (e.type === 'death') {
        const victim = e.snake;
        const killer = byName(victim.killer);
        if (killer?.persona && killer.alive && killer !== victim) {
          ownMoment(killer);
          say(killer, 'kill', victim, true);
        }
        if (victim.persona) {
          lastSaid[victim.id] = -Infinity;
          say(victim, 'dies', killer && killer !== victim ? killer : null, true);
        }
        for (const v of alive) if (v.personaKey === 'vulture' && Math.random() < 0.6) say(v, 'death', victim);
      } else if (e.type === 'eat' && windfall(e)) {
        // (food a choking or coughing snake knocked its way: it's said its thanks)
      } else if (e.type === 'eat' && e.snake.persona && e.kind !== 'goldcap') { // (a golden mushroom has its own lines: below)
        if (e.kind === 'golden') say(e.snake, 'golden', null, true);
        else if ((e.gold || e.kind === 'leaf') && showsOff(e.snake)) {
          // Golden power food, for Star's habit. A leaf's golden flashes it
          // spends there and then (a tick later, mostly: too soon for another
          // word), so it cheers them now; a golden beetle, it crows over.
          ownMoment(e.snake);
          if (e.kind === 'leaf') showOff(e.snake, 'dash', null, true); else say(e.snake, 'stash', null, true);
        } else if (e.kind === 'beetle') say(e.snake, 'caught', null, true);
        else if (e.kind === 'mushroom') say(e.snake, 'mushroom');
        else if (Math.random() < (showsOff(e.snake) ? 0.05 : 0.15)) say(e.snake, 'eat'); // (Star only has eyes for golden things)
      } else if (e.type === 'starving' && e.snake.persona) {
        // (unless it's just said it's desperate: that said it)
        if (!(game.time - (seen[e.snake.id]?.desperateAt ?? -Infinity) < 15000)) say(e.snake, 'hungry', null, true);
      } else if (e.type === 'spawn' && (e.kind === 'golden' || e.kind === 'beetle')) { // (golden apples and beetles; leaves and golden mushrooms have the narrator)
        for (const s of alive) {
          if (e.gold && VOICES[s.personaKey]?.goldbug) { say(s, 'goldbug', null, true); continue; }
          if (s.personaKey === 'gobbler' || (e.kind === 'beetle' && s.personaKey === 'desperado')) say(s, e.kind === 'beetle' ? 'beetle' : 'spawn', null, true);
        }
      } else if (e.type === 'weather' || (e.type === 'strike' && !struck)) {
        const kind = e.type === 'strike' ? 'storm' : e.kind;
        if (e.type === 'strike') struck = true; else struck = false;
        // (A snake on fire keeps its breath for being put out.)
        const wet = kind === 'rain' || kind === 'snow';
        const s = pick(alive.filter(a => VOICES[a.personaKey]?.weather?.[kind] && !(wet && a.burnUntil > game.tick)));
        // (The first strike has lines of its own, where a voice has some: as a storm begins, nothing's burning yet.)
        if (s) say(s, e.type === 'strike' && VOICES[s.personaKey].weather.strike ? 'weather.strike' : `weather.${kind}`, null, true);
      } else if (e.type === 'crash' && e.snake.alive) {
        // Whoever crashed says ouch; now and then, whoever they bounced off gloats.
        // (Almost every bump is into a snake, so ouches fit any bump; the edge,
        // where it tried to go off the board, has lines of its own.)
        const other = e.killerId != null && e.killerId !== e.snake.id ? game.snakes[e.killerId] : null;
        const N = window.TUNING.GRID, edge = e.x < 0 || e.y < 0 || e.x >= N || e.y >= N;
        if (e.snake.persona && !(edge && say(e.snake, 'edge'))) say(e.snake, 'bonk');
        if (other?.persona && other.alive && Math.random() < 0.5) say(other, 'gloat', e.snake);
      } else if (e.type === 'leap' && e.snake.persona) {
        if (showsOff(e.snake)) showOff(e.snake, 'leap', null, !!e.gold);
        else if (e.gold || Math.random() < 0.3) say(e.snake, 'leap', null, !!e.gold); // (everyone leaps now: a golden one's worth a word)
      } else if (e.type === 'dash' && e.snake.persona) {
        if (e.plain) flashed(e);
        else dashed.push(e.snake); // (a golden dash: its line comes after the tick's cuts, below)
      } else if (e.type === 'eat' && e.kind === 'goldcap' && e.snake.persona) {
        say(e.snake, 'wrap', null, true);
      } else if (e.type === 'alight' && e.snake.persona) {
        say(e.snake, 'burning', null, true);
      } else if (e.type === 'choke' && e.snake.persona && e.snake.alive) {
        // Its head met its own bead (a crash's, or a cut's): it gags, spits
        // it aside and coughs a moment. It says so, at most every CHOKE_REST,
        // even just after another line: it's news (the crash that broke the
        // bead off has mostly had its say a second or two before, and a
        // choke left to wait out the gap would mostly go unsaid).
        const s = e.snake, was = (seen[s.id] ||= {});
        if (!(game.time - (was.chokeAt ?? -Infinity) < CHOKE_REST)) {
          news(s);
          if (say(s, 'choke', null, true)) was.chokeAt = game.time;
        }
      } else if (e.type === 'cut') {
        // A golden dash cut it (the woodpecker cuts nothing now): the dasher
        // crows, and the one cut has words for whoever it was, you included.
        const dasher = e.by != null ? byId(e.by) : null;
        ownMoment(dasher); ownMoment(e.snake);
        if (dasher?.persona) say(dasher, 'snip', e.snake, true);
        if (e.snake.persona) say(e.snake, 'cut', dasher, true);
      } else if (e.type === 'dive' && e.dug) {
        gotAway(e); // (a beetle that dug in, gone under the bark)
      } else if (e.type === 'peck' && e.under?.length) {
        // The woodpecker pecked under a body, which bridges the hole (only a
        // head falls in). Now and then it says so.
        for (const id of e.under) {
          const s = byId(id), was = s && (seen[s.id] ||= {});
          if (s?.persona && s.alive && !(game.time - (was.underAt ?? -Infinity) < UNDER_REST) && say(s, 'under', null, true)) was.underAt = game.time;
        }
      } else if (e.type === 'baked') {
        const s = pick(alive.filter(a => VOICES[a.personaKey]?.baked));
        if (s) say(s, 'baked');
      } else if (e.type === 'ash' && e.kind !== 'mushroom') {
        // Burnt to ash before whoever was nearest got to it (nobody misses a mushroom).
        const s = after(e.x, e.y);
        if (s?.persona) say(s, 'ash');
      } else if (e.type === 'rot') {
        // Rotted (an apple, or a bead) before whoever was nearest got to it.
        // (On its own land, Sovereign or Colonist minds the land instead: below.)
        const s = after(e.x, e.y), was = s && (seen[s.id] ||= {});
        const own = s && landsOf(s.memory)?.some(f => onLand(e.x, e.y, f));
        if (s?.persona && !own && Math.random() < 0.7 && !(game.time - (was.rotAt ?? -Infinity) < ROT_REST) && say(s, 'rot')) was.rotAt = game.time;
      } else if (e.type === 'lastApples') {
        const s = pick(alive.filter(a => VOICES[a.personaKey]?.last));
        if (s) say(s, 'last', null, true);
      } else if (e.type === 'rainbow') {
        // (Star's own colours, up in the sky: family, and it says so first)
        const kin = alive.find(showsOff);
        ownMoment(kin);
        if (!(kin && say(kin, 'rainbow', null, true))) {
          const s = pick(alive.filter(a => a !== kin && VOICES[a.personaKey]?.rainbow));
          if (s) say(s, 'rainbow', null, true);
        }
      } else if (e.type === 'woodpecker') {
        const s = pick(alive);
        if (s) { lastSaid[s.id] = -Infinity; say(s, VOICES[s.personaKey].woodpecker ? 'woodpecker' : 'idle', anyone(s), true); }
      }
    }
    // A golden dash's own line, once the tick's cuts and crashes have had
    // theirs: one that cut someone (a tail off, or in two) has said so with
    // its snip or kill line, which say more; failing those, it says this.
    for (const s of dashed) if (showsOff(s)) showOff(s, 'dash', null, true); else say(s, 'dash', null, true); // (Star spends them on speed too)

    for (const s of alive) {
      const m = s.memory, was = (seen[s.id] ||= {});
      // Sovereign / Colonist spotting an intruder (now and then: not every time one wanders in).
      if (m.victimId != null && m.victimId !== was.victimId && (m.home || m.colonies)
        && !(game.time - (was.calledOutAt ?? -Infinity) < INTRUDER_REST)
        && say(s, 'intruder', game.snakes.find(o => o.id === m.victimId))) was.calledOutAt = game.time;
      if ((m.planted || 0) > (was.planted || 0)) {
        say(s, 'flag');
        // (planted on Sovereign's land: Sovereign has something to say about it)
        const c = m.colonies?.[m.colonies.length - 1];
        const sov = c && alive.find(o => o !== s && o.memory.home && sharesLand(c, o.memory.home));
        if (sov) say(sov, 'realm.invaded', s, true);
      }
      // Sovereign and Colonist: their land on fire, pecked full of holes, or
      // food rotting on it. (A peck on a field's own centre, a colony's flag
      // or the capital, loses the colony or moves the realm: that news has
      // its own line, below, so the peck itself goes without one.)
      const lands = landsOf(m);
      if (lands) {
        const N = window.TUNING.GRID, tag = m.home ? 'realm' : 'colony';
        const inLand = k => lands.some(f => onLand(k % N, Math.floor(k / N), f));
        const flagAt = k => lands.some(f => k === f.y * N + f.x);
        for (const e of game.events) {
          if (e.type === 'peck' && (e.cells || []).some(inLand) && !e.cells.some(flagAt)) say(s, tag + '.pecked', null, true);
          else if (e.type === 'rot' && inLand(e.y * N + e.x) && !(game.time - (was.landRotAt ?? -Infinity) < LAND_ROT_REST) && say(s, tag + '.rotten', null, true)) was.landRotAt = game.time;
        }
        if (game.tick % 10 === 0 && game.fires?.size && game.time - (was.fireAt ?? -1e9) > 12000) {
          for (const [k, f] of game.fires) if (game.tick >= f.from && inLand(k)) { was.fireAt = game.time; say(s, tag + '.burning', null, true); break; }
        }
      }
      // Put out by rain or snow: it was burning, and went out in the wet
      // (the weather cuts a burn short).
      const burning = s.burnUntil > game.tick, wet = game.weather?.kind === 'rain' || game.weather?.kind === 'snow';
      if (was.burning && !burning && wet) say(s, 'doused', null, true);
      was.burning = burning;
      // Starving soon, it drops its errands to take its chances for food (the
      // AI's desperate mode): it says so once a spell, and not again for a
      // while if the spell comes and goes.
      if (!m.desperate) was.desperate = false;
      else if (!was.desperate && !(game.time - (was.desperateAt ?? -Infinity) < DESPERATE_REST) && say(s, 'desperate', null, true)) {
        was.desperate = true;
        was.desperateAt = game.time;
      }
      // Sovereign's realm grew, shrank or moved. A move off a capital the
      // woodpecker pecked out (the old centre's a hole) is news.
      if (m.home && was.realm) {
        const moved = m.home.x !== was.realm.x || m.home.y !== was.realm.y;
        if (moved && holeAt(was.realm.x, was.realm.y)) { news(s); say(s, 'realm.capital', null, true); }
        else if (m.home.radius !== was.realm.radius) say(s, m.home.radius > was.realm.radius ? 'realm.grow' : 'realm.shrink', null, true);
        else if (moved) say(s, 'realm.move');
      }
      was.realm = m.home && { x: m.home.x, y: m.home.y, radius: m.home.radius };
      // Colonist: a colony whose flag cell the woodpecker pecked out is lost
      // (its flag falls in, and it's gone from its memory at once): news.
      // (Planting one too many lets the oldest go: no loss.)
      if (m.colonies || was.colonies) {
        const cols = m.colonies || NONE, before = was.colonies;
        if (!sameColonies(cols, before)) {
          if (before?.some(c => holeAt(c.x, c.y) && !cols.some(k => k.n === c.n && k.x === c.x && k.y === c.y))) { news(s); say(s, 'colony.lost', null, true); }
          was.colonies = cols.map(c => ({ n: c.n, x: c.x, y: c.y }));
        }
      }
      if (m.moodChangedAt != null && m.moodChangedAt !== was.mood && m.mood) say(s, `mood.${m.mood}`, null, true);
      // Star's flash back from its rest: raring to go, once it's been back a
      // moment (if it flashes or jumps by then, it's resting again: no word).
      if (showsOff(s)) {
        const resting = game.time < s.flashReadyAt;
        if (was.resting && !resting) was.readyAt = game.time + READY_AFTER;
        if (resting) was.readyAt = null;
        else if (was.readyAt != null && game.time >= was.readyAt) { was.readyAt = null; showOff(s, 'ready'); }
        was.resting = resting;
      }
      was.victimId = m.victimId;
      was.planted = m.planted || 0;
      was.mood = m.moodChangedAt;
    }

    // Someone answers Mason (see REPLIES): anyone but whoever told it, in
    // their own voice (Copycat's giggle is the same giggle, in Chinese).
    if (pendingReply && game.time >= pendingReply.at) {
      const { reply, teller } = pendingReply;
      pendingReply = null;
      const who = pick(alive.filter(o => o !== teller && reply.by(o)));
      if (who) {
        const line = pick(VOICES[who.personaKey]?.[reply.own] || reply.lines);
        const text = who.personaKey === 'copycat' ? ZH[line] ?? line : line;
        lastSaid[who.id] = -Infinity;
        speak(who, text, { template: text, who: null, label: '', reply: true });
        // (and the teller carries on: Mason, or Capricious doing Mason)
        if (reply.then) pendingReply = { at: game.time + 1400, reply: { by: o => o === teller, lines: [reply.then] }, teller: null };
      }
    }

    // Someone answers Star's showing off, in their own voice (see showOff).
    if (pendingAnswer && game.time >= pendingAnswer.at) {
      const { teller } = pendingAnswer;
      pendingAnswer = null;
      const who = teller.alive && pick(alive.filter(o => o !== teller && VOICES[o.personaKey]?.showoff));
      if (who && say(who, 'showoff', teller, true)) answeredAt = game.time;
    }

    // Copycat repeats exactly what it just heard, in Chinese.
    const cat = alive.find(s => s.personaKey === 'copycat');
    if (cat && lastLine?.template && lastLine.speaker !== cat && game.time - lastAny > 500 && Math.random() < 0.35) {
      if (game.time - (lastSaid[cat.id] ?? -Infinity) > SNAKE_GAP) {
        const who = lastLine.who ? (lastLine.who === cat ? '我' : nameOf(lastLine.who)) : ''; // ("That's a colony, me.")
        speak(cat, fill(ZH[lastLine.template] ?? lastLine.template, who, ZH_LABELS[lastLine.label] ?? lastLine.label));
      }
      lastLine = null;
    }
    if (lastLine && game.time - lastAny > 2000) lastLine = null;

    // Small talk now and then. (Star, while its flash rests, grumbles as often as not.)
    if (game.time - lastAny > 3500 && Math.random() < 0.04) {
      const s = pick(alive);
      if (s) say(s, showsOff(s) && game.time < s.flashReadyAt && Math.random() < 0.5 ? 'resting' : 'idle', anyone(s));
    }
  }

  return { init, reset, update, layout, clearBubbles, setEnabled, isEnabled, setCompact, onSpeak, replay };
})();
