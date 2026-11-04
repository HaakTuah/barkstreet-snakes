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
  - *charged* above the full bar, once 2u+ banks stamina: more and more alive with energy as it nears the cap, a warm
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
  - across all play, each power's share of plain power uses stays between a third and two thirds;
  - neither is better or worse in aggregate: snakes that lean on the jump and snakes that lean on the dash come out
    even (the seat-split A/B), while each rival keeps its own lean and its trademark;
  - the pace stays: round length, deaths by cause and power uses a minute within noise of today; if the game slows,
    stamina comes back quicker.
- **Golden ones stay apart.** Golden jumps and dashes are still free charges from golden food, spent before stamina,
  with their pips as now.
- **With it, as with any rule:** the rivals use it well and see it used (part 7's pricing then prices the one stamina);
  the looks and your ring as its cue, drawn in a file of their own (`render/looks.js` is past the 50 KB mark: Step 0 in
  `AGENTS.md`); a one-time lesson ("One stamina: jump or dash, your choice") that shows the tired and awake looks; the
  Field guide row; online in step, with a protocol bump; tested both ways.
