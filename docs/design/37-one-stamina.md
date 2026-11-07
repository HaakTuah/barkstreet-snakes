## One stamina for jump and dash

To build (entry 2u, 2 November 2026). The owner: "Yes, I would like us to go there. Doesn't have to be now, but I want
them balanced so they both have their use. You don't have to organically use them 50-50, but a band of 33-66, i want
them to stay in, ideally. That seems better to me. separate currencies is the paradox approach to make you use every
power at your disposal. I want them to be genuinly different tools for different situations, and different playstyles,
not inherently better or worse in aggregate. and i was never able to tell there were 2 stamina bars, so i thought that
was the way it was already. and it removes the unexpected costs, like costing a tail. if it slows the game, the stamina
bar could just recover a bit quicker."

- **One stamina for both plain powers.** The jump and the dash both spend from one stamina, in place of today's two
  rests. Using one leaves less for the other, so every press is a choice between two tools, not two separate allowances
  to spend ("Conditional goods").
- **Shown on the snake, not above it** (the owner, 4 November 2026). Every snake's stamina shows in how it looks, never
  as a bar, in steps that match what it can afford rather than a smooth fade:
  - *tired* while it can afford neither power: a little grayer and shriveled, eyes heavy, never overdone;
  - *awake* once it can afford one;
  - *game on* at a full bar: bright eyes, its game face;
  - *charged* above the full bar (2u+, below): more and more alive with energy as it nears the cap, a warm
    glow and livelier movement, never sparks or lightning.

  Each step reads by brightness, eyes and movement as well as colour, for colour-blind players; none looks like a
  golden effect, the flight's ring or Star's flashing (its trademark); and all of it stays cheap to draw on a phone.
  The rivals see every snake's step as people do, since a snake on the log could see it, and never more than the step
  (`aiView()`); online, the look follows the synced stamina.
- **No hidden prices.** The jump no longer costs the tip of your tail: what a power costs is the stamina it takes, shown
  before you press. Since a look cannot show an exact amount, your own snake alone keeps a faint, thin ring round its
  head with each power's cost marked on it (the display may single you out, and each rival knows its own stamina
  exactly). A failed dash keeps its penalty (segments and a stun): that is a consequence of a bad dash, seen coming,
  not a price.
- **What each costs, and how fast it comes back,** are set by simulation, not by hand:
  - each power is the more useful one in at least about 30% of the moments where either could be used, in the best
    play the rivals can manage, and the aim is about half (the owner, 6 November 2026, #536: usefulness, not uses,
    and 30% a floor, not a target); it is measured as moves too rare to move whole rounds are, each such moment forked
    and played on once with the jump and once with the dash. 2u ships held to the earlier band (each power a third to
    two thirds of plain power uses); 2u+ retunes to this one. The dash plays well as it is, so what 2u+ tunes is its
    stamina cost and, if need be, how much a full bar holds (the rivals flash more than pays, and one stamina makes
    every wasted flash cost a jump too);
  - neither is better or worse in aggregate: snakes that lean on the jump and snakes that lean on the dash come out
    even (the seat-split A/B), while each rival keeps its own lean and its trademark;
  - the pace stays: round length, deaths by cause and power uses a minute within noise of today; if the game slows,
    stamina comes back quicker.
- **Golden ones stay apart.** Golden jumps and dashes are still free charges from golden food, spent before stamina,
  with their pips as now.
- **With it, as with any rule:** the rivals use it well and see it used (part 7's pricing then prices the one stamina);
  the looks and your ring as its cue, drawn in a file of their own (new work goes in its own file: "Split by meaning" in
  `AGENTS.md`); a one-time lesson ("One stamina: jump or dash, your choice") that shows the tired and awake looks; the
  Field guide row; online in step, with a protocol bump; tested both ways.

## Where stamina comes from (2u+)

Built in entry 2u+ (the owner, 3 and 4 November 2026, #460: "anything you eat should give a little stamina recharge";
"It will still slowly recharge"; "Maybe the cap should start at 3x baseline, and be figured out in testing"). The
measurements behind each number are in PR #560.

- **Every meal tops it up,** in proportion to what it grows you: `STAMINA_FOOD_MS` a segment (300 ms, a fortieth of a
  bar for an apple). More, and plentiful rounds turned into power spam: at a tenth of a bar an apple, rivals flashed
  half as often again.
- **Past the full bar it banks,** up to `STAMINA_BANK` bars in all (3, the owner's first guess), and a power is paid from
  the bank first. Only food banks: the bar's own refill stops at full.
- **It still comes back on its own, as built** (`STAMINA_MS` from empty to full). A slower refill starved the snakes
  that spend the most: at a quarter speed Star's flashes a minute halved (its trademark), and no food rate gave them
  back, so the economy's lever is the powers' price instead (below).
- **The powers' prices** (`JUMP_STAMINA_MS`, `DASH_STAMINA_MS`, half and four fifths of the bar): set so that power
  uses a minute stay those of 2u. Measured by forking each moment a rival used a plain power with both in the bar
  (`tools/dev/fork-moves.js --move power`), the jump and the dash each turned out the more useful about half the time,
  at 2u's prices and at these.
- **The look:** *charged* (step 3, `render/stamina.js`): bright-eyed, a warm glow over the body and a swell running
  down it, more the nearer the cap; with reduced motion, the glow alone. The rivals see the step, never the bank.
- **The rivals** weigh a meal's stamina below the full bar at the powers' price, twice that when they can afford
  neither power (`ai/food.js`); what they bank above it they take as it comes (weighed too, it tipped them into
  apples in traps). A cut through the rival a hunter is after goes at half a dash's price, as a race does: at the new
  price Sniper stopped cutting.
- **The lesson** ("Meals top up stamina. Past full, it banks: you glow.") on the first meal that banks some; the Field
  guide's Stamina row says it; online, each snake's bank (protocol 26).

