// The cues of Barkstreet Snakes' sound: what each one is, as built from the
// synthesiser's building blocks (mallet, knock, a pinch of noise...), with the
// woodpecker's drum and every rival's babbling voice.
//
// Once audio.js, the sound is split into the files of audio/, loaded in order by
// index.html (sw.js lists them too):
//
//   cues.js    every cue, the drum's table and the babblers' voices (this file)
//   sound.js   the synthesiser: setup, building blocks, playing, the music, the
//              weather and mute; it makes window.SnakeAudio (its API is listed there)
//
// Unlike render/'s files they don't share the page's scope: this one leaves a
// maker, which sound.js calls once with a kit of its building blocks (and live
// views of the context, the cue being built and where it goes), and takes it
// away again. So nothing here is a name at the page's top.
window.SnakeAudioCues = k => {
  const { BABBLE_MAX, mtof, tone, noise, whoosh, mallet, knock, edge, tom, body, vibrato, sparkle } = k;

  // The notes a pluck may land on: C major pentatonic from E5 up, so whatever the
  // music is playing (C, Am, F, G, or the minor key), an apple is never a wrong note.
  const PENTA = [76, 79, 81, 84, 86, 88, 91, 93, 96, 98];
  const streakOf = (o, top = 7) => Math.max(0, Math.min(top, Math.round(o.streak) || 0));
  const MEAT_STEPS = [0, 2, 5, 7, 9]; // (semitones: the same scale, from the nom's G)

  const WIN_RUN = [[67, 0], [72, 0.1], [76, 0.2], [74, 0.3], [76, 0.4], [79, 0.5]]; // G4 C5 E5 D5 E5 G5
  const WIN_CHORD = [72, 76, 79, 84];                                               // C major, landing

  // The woodpecker gets used to: its first few strikes are the full drum, then
  // they're shorter and softer, and its aim stops knocking (the patch shows it).
  let strikes = 0, aims = 0;
  const strikeLevel = (n = strikes) => (n < 3 ? 1 : Math.max(0.5, 1 - 0.1 * (n - 2)));
  // Its drum, as a table: when each knock comes, in ms from the first, for the
  // round's nth strike (from 0). A burst, fast then slowing as the real bird's
  // (DRUM_GAP between the first two, each gap DRUM_SLOW longer than the last:
  // 28 to 52 ms, about half a second for the whole drum), fewer knocks after
  // its first three strikes. One table for the drum you hear and the blows you
  // see: the renderer draws a blow on each knock, the last on the strike, and
  // the game starts the drum on the first blow as it's drawn.
  const DRUM_GAP = 28, DRUM_SLOW = 2, drums = [];
  function drumBlows(strike = 0) {
    const s = Math.max(0, Math.min(12, Math.floor(strike) || 0));
    if (!drums[s]) {
      const n = s < 3 ? 14 : Math.max(6, 14 - 2 * (s - 2)), out = [];
      for (let i = 0, at = 0; i < n; at += DRUM_GAP + i * DRUM_SLOW, i++) out.push(at);
      drums[s] = Object.freeze(out);
    }
    return drums[s];
  }

  const CUES = {
    // Green apple: one bright marimba pluck, in tune with the music (E5, climbing the
    // pentatonic scale through a streak). It's never quite the same twice: struck a
    // little harder or softer, brighter or rounder, with a crisp little bite of noise on top.
    eat(t, o) {
      const vel = 0.85 + Math.random() * 0.15;
      mallet(t, mtof(PENTA[streakOf(o)]), 0.12, 0.24 * vel, 0.6 + Math.random() * 0.8);
      noise(t, 0.018, 0.07 * vel, 'highpass', 3000 + Math.random() * 1200, 0.7);
    },

    // Golden apple: a quick rising sparkle up the same scale, and gold's own bells over it.
    golden(t, o) {
      const i = streakOf(o, 3);
      mallet(t, mtof(PENTA[i + 1]), 0.14, 0.26);
      mallet(t + 0.055, mtof(PENTA[i + 3]), 0.14, 0.26);
      mallet(t + 0.11, mtof(PENTA[i + 5]), 0.26, 0.28);
      sparkle(t + 0.12, 1);
    },

    // A golden leaf: a papery flutter, a breath of wind, and gold's bells.
    leaf(t, o) {
      for (let i = 0; i < 4; i++) noise(t + i * 0.03, 0.03, 0.09 - i * 0.012, 'bandpass', 2400 + i * 500, 1.6);
      noise(t, 0.3, 0.04, 'bandpass', 900, 0.8);
      mallet(t + 0.06, mtof(PENTA[streakOf(o, 3) + 2]), 0.18, 0.2);
      sparkle(t + 0.08, 1);
    },

    // Meat: a low, round "nom": a lowpassed triangle that sags in pitch over a soft sub,
    // with a muffled fleshy thump of noise, and the nom's mouth-shaped middle for small speakers.
    meat(t, o) {
      const p = Math.pow(2, MEAT_STEPS[streakOf(o, 4)] / 12);
      tone(t, 'triangle', 196 * p, 0.16, 0.42, 0.006, 130 * p, 900);
      body(t, 196 * p, 0.14, 0.34, 0.006, 130 * p, 650, 1);
      tone(t, 'sine', 98 * p, 0.14, 0.22, 0.006, 70 * p);
      noise(t, 0.05, 0.1, 'lowpass', 900, 0.7);
    },

    // A beetle caught: a dry double crunch, a shell giving way, then a happy pluck.
    crunch(t) {
      noise(t, 0.035, 0.32, 'bandpass', 2600, 1.4);
      noise(t + 0.055, 0.04, 0.26, 'bandpass', 1900, 1.4);
      knock(t + 0.01, 1350, 0.12);
      mallet(t + 0.1, mtof(81), 0.14, 0.16);
    },

    // A beetle comes out: a tiny skittering of feet across the bark.
    beetle(t) {
      for (let i = 0; i < 5; i++) noise(t + i * 0.035, 0.012, 0.07 - i * 0.008, 'highpass', 5200, 0.8);
    },

    // Mushroom (shrink): a soft "boing" that wobbles downward like a spring settling.
    mushroom(t) {
      const osc = tone(t, 'sine', 620, 0.34, 0.3, 0.01, 210);
      vibrato(osc, t, 0.34, 13, 25);
      tone(t, 'triangle', 310, 0.3, 0.07, 0.01, 105, 700);
    },

    // A rival dies somewhere on the log: a muffled, far-off thud. Quiet on purpose.
    rivalDeath(t) {
      tone(t, 'triangle', 140, 0.2, 0.16, 0.008, 70, 400);
      body(t, 140, 0.14, 0.09, 0.004, 80, 480, 1);
      noise(t, 0.08, 0.05, 'lowpass', 350, 0.7);
    },

    // Your snake dies: a soft wooden impact, then two falling notes, a sigh from G3 down
    // to D3, over a sub and a low puff of noise. It thuds and lands; it never cracks.
    // The thud and the sigh both carry a midrange body, so a phone still hears your
    // death over an apple. About 400 ms.
    death(t) {
      noise(t, 0.09, 0.2, 'lowpass', 900, 0.8); // the impact first...
      tone(t, 'triangle', 560, 0.12, 0.5, 0.001, 260, 1600);
      noise(t, 0.08, 0.26, 'bandpass', 700, 1.2);
      tone(t, 'sine', 90, 0.3, 0.32, 0.003, 38);
      tone(t, 'triangle', mtof(55), 0.2, 0.4, 0.006, mtof(53), 1100);
      body(t, mtof(55), 0.2, 0.32, 0.006, mtof(53), 700, 0.9);
      tone(t + 0.15, 'triangle', mtof(50), 0.27, 0.44, 0.008, mtof(46), 800);
      body(t + 0.15, mtof(50), 0.27, 0.36, 0.008, mtof(46), 600, 0.9);
      tone(t + 0.15, 'sine', mtof(38), 0.26, 0.28, 0.01, mtof(34));
      noise(t + 0.13, 0.22, 0.09, 'lowpass', 700, 0.6);
    },

    // New personal best: a warm marimba fanfare climbing C-E-G to a held C6, the last note
    // doubled an octave below for warmth. About 600 ms.
    best(t) {
      mallet(t, mtof(72), 0.16, 0.34);
      mallet(t + 0.09, mtof(76), 0.16, 0.34);
      mallet(t + 0.18, mtof(79), 0.18, 0.36);
      mallet(t + 0.3, mtof(84), 0.32, 0.4);
      mallet(t + 0.3, mtof(72), 0.32, 0.18);
    },

    // Round won: a bouncier phrase that climbs, steps back, then lands on a soft rolled chord.
    win(t) {
      for (let i = 0; i < WIN_RUN.length; i++) mallet(t + WIN_RUN[i][1], mtof(WIN_RUN[i][0]), 0.16, 0.32);
      for (let i = 0; i < WIN_CHORD.length; i++) mallet(t + 0.64 + i * 0.018, mtof(WIN_CHORD[i]), 0.5, 0.2);
    },

    // Won, and a new best too: one phrase, not two fanfares. The win's run lands on the
    // best's held C6 (doubled below), rolls up into a bright chord, and gold shimmers over it.
    winBest(t) {
      for (let i = 0; i < WIN_RUN.length; i++) mallet(t + WIN_RUN[i][1], mtof(WIN_RUN[i][0]), 0.16, 0.32);
      mallet(t + 0.64, mtof(84), 0.5, 0.4);
      mallet(t + 0.64, mtof(72), 0.5, 0.18);
      for (let i = 0; i < WIN_CHORD.length; i++) mallet(t + 0.7 + i * 0.03, mtof(WIN_CHORD[i] + 12), 0.6, 0.12);
      sparkle(t + 0.8, 0.8);
    },

    // Countdown tick: a plain wood block "tok".
    beat(t) {
      knock(t, 780, 0.32);
    },

    // The last countdown beat: a higher block with a small pluck on top, so it says "go".
    go(t) {
      knock(t, 1170, 0.36);
      mallet(t, mtof(79), 0.14, 0.16);
    },

    // The woodpecker lands: knock-knock-knock, quick and a little uneven like a real beak.
    woodpecker(t) {
      knock(t, 1400, 0.28);
      knock(t + 0.07, 1450, 0.24);
      knock(t + 0.135, 1380, 0.22);
    },

    // One pecked hole: a tiny tick that's more felt than heard (and rate-limited above).
    peck(t) {
      knock(t, 1500 + Math.random() * 200, 0.08);
    },

    // Starving: a soft, low tummy gurgle, two slow wobbles under a lowpass with a little
    // air, the growl's throaty middle, and bubbles rising (what a phone hears).
    hungry(t) {
      const a = tone(t, 'triangle', 95, 0.32, 0.22, 0.06, 68, 380);
      vibrato(a, t, 0.32, 7, 10);
      body(t, 95, 0.3, 0.16, 0.06, 68, 520, 1.4);
      const b = tone(t + 0.26, 'triangle', 115, 0.36, 0.18, 0.06, 74, 380);
      vibrato(b, t + 0.26, 0.36, 9, 12);
      body(t + 0.26, 115, 0.34, 0.14, 0.06, 74, 560, 1.4);
      for (let i = 0; i < 3; i++) {
        const f = 300 + Math.random() * 160;
        tone(t + 0.08 + i * 0.13 + Math.random() * 0.03, 'sine', f, 0.06, 0.12, 0.004, f * 1.8);
      }
      noise(t, 0.45, 0.04, 'lowpass', 260, 0.8);
    },

    // Getting hungry (the warning, before you starve): one soft, low growl and a bubble.
    hungerWarn(t) {
      const a = tone(t, 'triangle', 88, 0.42, 0.14, 0.08, 66, 360);
      vibrato(a, t, 0.42, 6, 8);
      body(t, 88, 0.4, 0.1, 0.08, 66, 500, 1.4);
      tone(t + 0.24, 'sine', 340, 0.06, 0.08, 0.004, 600);
    },

    // A spit: a gag (a strangled gulp that rattles in the throat), then
    // "ptoo" (the lips popping, a hollow "oo"), and what's spat landing on
    // the bark with a little tok. About 400 ms. (Choking on your own bead
    // went in round six B; kept for the mushroom that comes back up.)
    choke(t) {
      const gag = tone(t, 'triangle', 170, 0.11, 0.26, 0.004, 250, 900);
      vibrato(gag, t, 0.11, 38, 30);
      body(t, 170, 0.1, 0.34, 0.004, 250, 720, 1.6);
      noise(t, 0.09, 0.16, 'bandpass', 1100, 2.4);
      tone(t + 0.14, 'sine', 190, 0.03, 0.22, 0.002, 90);
      noise(t + 0.14, 0.014, 0.26, 'bandpass', 3600, 1.2);
      body(t + 0.15, 300, 0.13, 0.36, 0.006, 210, 620, 1.2);
      noise(t + 0.15, 0.1, 0.1, 'bandpass', 1500, 1);
      knock(t + 0.32, 1250, 0.1);
    },

    // Your own bead squashed under your head (round six B): a soft wet
    // splat, low, with a little squelch after it.
    squash(t) {
      noise(t, 0.07, 0.2, 'lowpass', 600, 0.9);
      body(t, 120, 0.08, 0.24, 0.003, 80, 420, 1.2);
      noise(t + 0.04, 0.09, 0.07, 'bandpass', 1300, 3);
      tone(t + 0.05, 'sine', 260, 0.06, 0.05, 0.004, 150);
    },

    // Lightning on its way: a dry, irregular crackle, high and quiet.
    crackle(t) {
      for (let i = 0; i < 9; i++) noise(t + i * 0.035 + Math.random() * 0.02, 0.012, 0.09, 'bandpass', 3200 + Math.random() * 2400, 2);
    },

    // The strike: a bright crack, then thunder rolling away (overlapping low puffs of noise,
    // each quieter, with a gritty middle a phone can play, over a falling sub). Soft-edged, never a bang.
    thunder(t) {
      noise(t, 0.05, 0.22, 'highpass', 1800, 0.7);
      noise(t, 0.12, 0.2, 'bandpass', 900, 0.8);
      const rolls = [[0.04, 0.34, 320], [0.22, 0.28, 240], [0.48, 0.22, 200], [0.78, 0.16, 160], [1.1, 0.1, 130]];
      for (const [at, peak, f] of rolls) {
        noise(t + at, 0.42, peak, 'lowpass', f, 0.7);
        noise(t + at, 0.38, peak * 0.75, 'bandpass', f * 2.4, 0.8);
      }
      tone(t + 0.03, 'sine', 62, 1.3, 0.2, 0.04, 38);
    },

    // A gust of wind: three puffs of air, the middle one highest.
    gust(t) {
      noise(t, 0.4, 0.06, 'bandpass', 520, 0.9);
      noise(t + 0.18, 0.42, 0.08, 'bandpass', 820, 0.9);
      noise(t + 0.4, 0.4, 0.05, 'bandpass', 600, 0.9);
    },

    // A burrow cracks open: bark giving way with a low creak, and a crumble.
    burrow(t) {
      knock(t, 420, 0.22);
      noise(t + 0.02, 0.09, 0.14, 'bandpass', 1300, 1.2);
      const creak = tone(t + 0.05, 'triangle', 190, 0.28, 0.08, 0.02, 130, 700);
      vibrato(creak, t + 0.05, 0.28, 23, 9);
      for (let i = 0; i < 3; i++) noise(t + 0.16 + i * 0.05, 0.02, 0.05, 'lowpass', 1100, 0.8);
    },

    // A piece of log cut loose falls (2s): bark tearing off with a long creak,
    // sliding down as it tips, and a far-off thud as it lands, well below
    // (dull and low, a beat later). About 900 ms.
    fall(t) {
      knock(t, 360, 0.2);
      noise(t + 0.01, 0.12, 0.12, 'bandpass', 1100, 1.1);
      const creak = tone(t + 0.04, 'triangle', 170, 0.5, 0.09, 0.03, 90, 650);
      vibrato(creak, t + 0.04, 0.5, 19, 11);
      noise(t + 0.2, 0.35, 0.05, 'bandpass', 700, 0.8);
      tone(t + 0.7, 'sine', 72, 0.24, 0.28, 0.004, 40);
      noise(t + 0.7, 0.16, 0.14, 'lowpass', 300, 0.7);
    },

    // A burrow closing over: a muffled crumble. Sawdust trickles into the hole
    // (five grains, each lower and fainter, a fleck of it ticking in over each),
    // then a hushed pat as the moss settles over it. About 350 ms. (It was as
    // soft as a beetle's scrabble, which the music buries; the flecks sit high,
    // where the music leaves room, as the skitter of a beetle coming out does.)
    heal(t) {
      for (let i = 0; i < 5; i++) {
        const at = t + i * 0.05 + (i % 2) * 0.012;
        noise(at, 0.03, 0.22 - i * 0.03, 'lowpass', 900 - i * 90, 0.8);
        noise(at + 0.004, 0.008, 0.06 - i * 0.008, 'highpass', 3600, 0.8);
      }
      noise(t + 0.25, 0.1, 0.19, 'lowpass', 380, 0.7);
    },

    // A beetle scrabbling into (or out of) its burrow.
    scrabble(t) {
      for (let i = 0; i < 4; i++) noise(t + i * 0.045, 0.025, 0.08 - i * 0.012, 'lowpass', 1000, 0.8);
    },

    // A cornered beetle digs in: a quick scrabbling bore into the bark. Its
    // legs scratch at the wood while its jaws rasp in, the rasp sinking as it
    // goes down (over the wood's own low grind, which a phone hears), and a
    // soft puff as its sawdust packs the hole shut behind it. About 450 ms.
    // (The legs' scratches are its edge: a rival's keeps them, softly, over the music.)
    dig(t) {
      edge(() => { for (let i = 0; i < 6; i++) noise(t + i * 0.03 + Math.random() * 0.012, 0.014, 0.15 - i * 0.012, 'bandpass', 2800 + Math.random() * 1600, 1.6); });
      for (let i = 0; i < 9; i++) {
        const k = i / 8;
        noise(t + 0.05 + i * 0.032, 0.026, 0.19 * Math.sin(Math.PI * (0.2 + 0.7 * k)), 'bandpass', 1700 * Math.pow(0.5, k), 2.4);
      }
      body(t + 0.05, 160, 0.3, 0.12, 0.04, 100, 520, 1.4);
      noise(t + 0.36, 0.09, 0.07, 'lowpass', 800, 0.7);
    },

    // The woodpecker knocks food aside as it strikes: a hollow tok as its beak
    // flicks the piece out (a deep block with a hollow ring, under the drum's
    // high knocks), a whoosh rising as it flies off and falling as it comes
    // down, and a soft bump where it lands. About 400 ms; the further the
    // piece is flung, the longer it's in the air (o.land, seconds, as drawn:
    // 0.32 to 0.62), and the whoosh stretches with it to land its bump.
    knock(t, o) {
      const land = Number.isFinite(o.land) ? Math.max(0.32, Math.min(0.62, o.land)) : 0.32, k = land / 0.32;
      tone(t, 'sine', 620, 0.14, 0.42, 0.001, 520);
      tone(t, 'triangle', 620 * 2.76, 0.04, 0.12, 0.001, null, 4000);
      noise(t, 0.012, 0.24, 'bandpass', 1500, 2.5);
      whoosh(t + 0.03, 0.22 * k, 0.15, 500, 2600);
      whoosh(t + 0.1 * k, 0.26 * k, 0.11, 2600, 700);
      noise(t + land + 0.02, 0.035, 0.06, 'lowpass', 500, 0.7);
    },

    // A rainbow: a soft shimmer climbing up a major arpeggio.
    rainbow(t) {
      [72, 76, 79, 83, 86, 91].forEach((m, i) => mallet(t + i * 0.06, mtof(m), 0.22, 0.14));
      tone(t + 0.3, 'sine', mtof(103), 0.5, 0.03, 0.08);
    },

    // The rain starts: a patter of drops.
    rain(t) {
      for (let i = 0; i < 14; i++) noise(t + Math.random() * 0.42, 0.01, 0.03 + Math.random() * 0.03, 'highpass', 3000 + Math.random() * 3000, 0.7);
    },

    // You took a rival out: a low punch, a crack, and two bright notes, up.
    ko(t) {
      tone(t, 'sine', 140, 0.22, 0.45, 0.003, 46);
      noise(t, 0.05, 0.22, 'bandpass', 1800, 1.1);
      mallet(t + 0.06, mtof(79), 0.14, 0.26);
      mallet(t + 0.14, mtof(84), 0.26, 0.3);
    },

    // Your crash: a hollow wooden bonk (a low drop, and the hollow knock a phone hears),
    // a spring's boing as you bounce back, and a little stars-round-your-head twinkle.
    bonk(t) {
      tone(t, 'sine', 210, 0.16, 0.5, 0.002, 90);
      tone(t, 'triangle', 640, 0.12, 0.38, 0.001, 300, 1600);
      noise(t, 0.05, 0.2, 'lowpass', 900, 0.8);
      noise(t, 0.05, 0.16, 'bandpass', 760, 1.2);
      tone(t + 0.04, 'triangle', 330, 0.3, 0.14, 0.01, 520);
      mallet(t + 0.16, mtof(88), 0.12, 0.08);
      mallet(t + 0.24, mtof(91), 0.12, 0.07);
      mallet(t + 0.32, mtof(88), 0.14, 0.06);
    },
    // Your failed flash (round six B): a bigger bonk, a heavy thud under it,
    // and the stars' mallets slower and lower, going round longer.
    bigBonk(t) {
      tone(t, 'sine', 150, 0.3, 0.6, 0.002, 50);
      tone(t, 'triangle', 520, 0.16, 0.42, 0.001, 220, 1400);
      noise(t, 0.09, 0.3, 'lowpass', 700, 0.8);
      noise(t, 0.07, 0.2, 'bandpass', 600, 1.2);
      tone(t + 0.05, 'triangle', 260, 0.4, 0.16, 0.01, 420);
      mallet(t + 0.22, mtof(84), 0.14, 0.08);
      mallet(t + 0.34, mtof(87), 0.14, 0.07);
      mallet(t + 0.46, mtof(84), 0.16, 0.06);
      mallet(t + 0.58, mtof(87), 0.18, 0.05);
    },
    // A leap: a springy boing up and a whoosh of air.
    leap(t) {
      tone(t, 'triangle', 300, 0.22, 0.14, 0.005, 760);
      noise(t + 0.02, 0.18, 0.06, 'bandpass', 1800, 1.2);
      mallet(t + 0.18, mtof(84), 0.12, 0.07);
    },
    // A dash (a golden flash): a zip, rising fast, and a rush of air.
    dash(t) {
      tone(t, 'sawtooth', 260, 0.16, 0.08, 0.004, 1400, 2400);
      noise(t, 0.2, 0.12, 'bandpass', 2600, 0.9);
      mallet(t + 0.12, mtof(91), 0.1, 0.06);
    },
    // A plain flash: lighter than a dash, all air. A short whoosh sweeping up past
    // you, and a flick of ember at its end.
    flash(t) {
      whoosh(t, 0.17, 0.11, 500, 3200);
      noise(t + 0.13, 0.01, 0.05, 'bandpass', 4200, 3);
    },
    // Your flash is rested: a small ember spark, a crackle and a glint sliding up
    // (where the jump's ready is a wooden tick).
    flashReady(t) {
      noise(t, 0.012, 0.065, 'bandpass', 4200, 3);
      noise(t + 0.035, 0.01, 0.05, 'bandpass', 5600, 3);
      tone(t + 0.015, 'triangle', mtof(91), 0.1, 0.05, 0.003, mtof(96), 6000);
    },
    // A fire put out: a hiss of steam.
    douse(t) {
      noise(t, 0.4, 0.1, 'highpass', 3600, 0.7);
      noise(t + 0.03, 0.25, 0.05, 'bandpass', 1200, 1.4);
    },
    // A golden mushroom: the edges open and you go round. Bells run up and back down to
    // where they began, swinging from one side to the other and back, under gold's shimmer.
    wrap(t) {
      const chain = k.out;
      let sweep = null;
      try {
        sweep = k.ctx.createStereoPanner();
        sweep.pan.value = 0;
        sweep.pan.setValueAtTime(-0.6, t);
        sweep.pan.linearRampToValueAtTime(0.6, t + 0.3);
        sweep.pan.linearRampToValueAtTime(-0.6, t + 0.62);
        sweep.pan.linearRampToValueAtTime(0, t + 0.8);
        sweep.connect(chain);
        k.building.nodes.push(sweep);
        k.out = sweep;
      } catch { sweep = null; }
      [72, 76, 79, 84, 88, 84, 79, 76, 72].forEach((n, i) => mallet(t + i * 0.07, mtof(n), 0.26, i === 4 ? 0.09 : 0.07));
      tone(t, 'sine', 440, 0.6, 0.035, 0.05, 880);
      tone(t + 0.3, 'sine', 880, 0.32, 0.03, 0.04, 440);
      k.out = chain;
      sparkle(t + 0.04, 0.6);
    },
    // Blown up (a dash into the edge or a hole): a bang and a rumble, with a body in the middle.
    boom(t) {
      noise(t, 0.6, 0.35, 'lowpass', 500, 0.7);
      noise(t, 0.45, 0.32, 'bandpass', 680, 0.8);
      tone(t, 'sine', 120, 0.5, 0.4, 0.002, 38);
      tone(t, 'triangle', 300, 0.3, 0.34, 0.002, 110, 1200);
      noise(t + 0.02, 0.18, 0.15, 'bandpass', 1600, 0.8);
    },
    // Your leap's ready again: a soft tick.
    ready(t) {
      mallet(t, mtof(86), 0.12, 0.05);
    },
    // A leap that can't go (it needs a moment, or there's nowhere to land): a dull thunk, flat, no bounce.
    thunk(t) {
      tone(t, 'triangle', 260, 0.08, 0.26, 0.002, 150, 900);
      body(t, 180, 0.07, 0.26, 0.002, 120, 520, 1.2);
      noise(t, 0.04, 0.08, 'lowpass', 800, 0.8);
    },
    // Someone else's crash: a dull thud off to the side (and its knock, small).
    bonked(t) {
      tone(t, 'sine', 170, 0.12, 0.22, 0.002, 80);
      tone(t, 'triangle', 420, 0.08, 0.16, 0.001, 220, 1000);
      noise(t, 0.04, 0.08, 'lowpass', 700, 0.8);
    },
    // You catch fire: a whoosh of flame and a crackle.
    alight(t) {
      noise(t, 0.45, 0.2, 'bandpass', 700, 0.7);
      noise(t + 0.05, 0.3, 0.08, 'highpass', 3000, 0.7);
      tone(t, 'sawtooth', 90, 0.35, 0.05, 0.05, 140, 500);
    },
    // A piece of you falls off in the flames: a hiss and a pop.
    singe(t) {
      noise(t, 0.14, 0.09, 'highpass', 2500, 0.8);
      tone(t + 0.02, 'sine', 600, 0.05, 0.08, 0.002, 300);
    },
    // Something's done in the fire: a sizzle and a pop.
    bake(t) {
      noise(t, 0.3, 0.06, 'bandpass', 4200, 1.2);
      tone(t + 0.12, 'sine', 900, 0.06, 0.08, 0.002, 500);
    },
    // Gone to ash: a soft puff.
    ash(t) {
      noise(t, 0.25, 0.07, 'lowpass', 600, 0.7);
    },
    // A tail cut off (a golden dash through a snake): a sharp snap.
    snip(t) {
      noise(t, 0.04, 0.25, 'bandpass', 2400, 2);
      tone(t, 'square', 1200, 0.04, 0.05, 0.001, 600, 3000);
    },

    // Over a border into a rival's land (Sovereign's realm, a colony): a muffled
    // drum knocks twice, as at a border post, and a fife answers with a short call
    // (a quick note up to a held one, breathy, with a player's wobble).
    field(t) {
      tom(t, 118, 0.052);
      tom(t + 0.13, 98, 0.066);
      tone(t + 0.13, 'triangle', mtof(79), 0.07, 0.035, 0.008, null, 3000);
      const f = tone(t + 0.19, 'triangle', mtof(84), 0.3, 0.05, 0.015, null, 3200);
      vibrato(f, t + 0.25, 0.24, 6, 9);
      noise(t + 0.19, 0.22, 0.012, 'bandpass', mtof(84) * 2, 2);
    },

    // A near miss (your head right by a rival's): air tearing past, and a gasp of a tick.
    close(t) {
      noise(t, 0.16, 0.13, 'bandpass', 2600, 1.6);
      noise(t + 0.07, 0.2, 0.1, 'bandpass', 1100, 1.4);
      tone(t, 'triangle', 1900, 0.05, 0.05, 0.001, 1500);
    },

    // The woodpecker drumming a patch out: a burst of knocks, fast then slowing, like the
    // real thing, each one a blow of its beak (drumBlows), the last on the strike. The
    // first few strikes get the whole drum; later ones are shorter and softer. Started
    // late (o.from, ms into it), the knocks already past are left out; watched faster
    // (o.rate), it's quicker, as the blows are.
    drum(t, o) {
      const strike = Number.isFinite(o.strike) ? Math.max(0, Math.floor(o.strike)) : strikes;
      const level = strikeLevel(strike), blows = drumBlows(strike);
      const rate = o.rate > 0 ? o.rate : 1, from = Number.isFinite(o.from) ? Math.max(0, o.from) : 0;
      strikes = strike + 1;
      for (let i = 0; i < blows.length; i++) {
        if (blows[i] < from - 4) continue;
        knock(t + Math.max(0, blows[i] - from) / 1000 / rate, 1250 + (i % 3) * 60, (0.2 - i * 0.008) * level);
      }
    },

    // The patch giving way: a woody crunch over a low thud (as soft as the drum before it).
    crash(t) {
      const level = strikes ? Math.max(0.6, strikeLevel()) : 1;
      noise(t, 0.16, 0.26 * level, 'bandpass', 850, 0.9);
      noise(t + 0.01, 0.12, 0.2 * level, 'bandpass', 1300, 1);
      noise(t + 0.03, 0.22, 0.14 * level, 'lowpass', 400, 0.7);
      tone(t, 'triangle', 110, 0.3, 0.3 * level, 0.004, 55, 500);
    },

    // It takes aim: two rising ticks over a low pulse (and the music tightens). After a few
    // strikes only a softer pulse is left: the glowing patch says it all.
    aim(t) {
      const fresh = aims++ < 3;
      if (fresh) {
        knock(t, 900, 0.14);
        knock(t + 0.12, 1180, 0.16);
      }
      tone(t, 'sine', 70, 0.35, fresh ? 0.16 : 0.1, 0.02, 62);
    },

    // It arrives: a woodpecker's sharp "kik! kik! kik!" and a beat of wings. Settling
    // back on its perch after a strike (o.settle): one "kik!", a touch softer.
    call(t, o) {
      if (o.settle) {
        tone(t, 'triangle', 2350, 0.07, 0.13, 0.002, 1900, 5000);
        tone(t, 'sine', 4700, 0.04, 0.03, 0.002);
        return;
      }
      for (let i = 0; i < 3; i++) {
        tone(t + i * 0.13, 'triangle', 2350, 0.07, 0.16, 0.002, 1900, 5000);
        tone(t + i * 0.13, 'sine', 4700, 0.04, 0.04, 0.002);
      }
      for (let i = 0; i < 3; i++) noise(t + 0.45 + i * 0.09, 0.07, 0.07, 'lowpass', 700, 0.8);
    },

    // The last apples start falling, one at a time: soft notes falling down the
    // minor key, each landing with a little bump on the bark, over a low note
    // that sags as it fades. A warning, not a fright.
    lastApples(t) {
      [[76, 0], [72, 0.22], [69, 0.44], [64, 0.7]].forEach(([m, at], i) => {
        mallet(t + at, mtof(m), 0.36, 0.105 - i * 0.012, 0.7);
        noise(t + at + 0.06, 0.035, 0.05, 'lowpass', 500, 0.7);
      });
      tone(t + 0.44, 'sine', mtof(45), 0.9, 0.06, 0.12, mtof(43));
      body(t + 0.44, mtof(45), 0.8, 0.04, 0.12, mtof(43), 450, 1);
      noise(t + 0.3, 0.6, 0.02, 'bandpass', 900, 0.8);
    },

    // Winter arrives: glassy bells, high and slow, over a breath of cold air.
    snow(t) {
      [88, 91, 93, 96, 98].forEach((m, i) => mallet(t + i * 0.11 + (i % 2) * 0.03, mtof(m), 0.6, 0.06));
      noise(t, 0.45, 0.03, 'highpass', 5000, 0.7);
    },

    // A burning leaf blown off: a whoosh and a crackle.
    ember(t) {
      noise(t, 0.18, 0.06, 'bandpass', 900, 1);
      for (let i = 0; i < 4; i++) noise(t + 0.05 + i * 0.03, 0.01, 0.05, 'bandpass', 3600, 2);
    },

    // Tension building: rising air and a rising tone (the countdown's last beat, the last
    // two snakes, the woodpecker). It tops out after o.crest seconds (0.6 unless told):
    // the countdown's tops out on Go, and Go cuts it off.
    riser(t, o) {
      const up = Number.isFinite(o.crest) ? Math.max(0.15, Math.min(1.2, o.crest)) : 0.6, dur = up + 0.3;
      tone(t, 'sine', 220, dur, 0.08, up, 660);
      tone(t, 'triangle', 330, dur, 0.04, up, 990, 2000);
      noise(t, up * 0.75, 0.04, 'bandpass', 1500, 0.8);
      noise(t + up * 0.67, 0.45, 0.06, 'bandpass', 3200, 0.8);
    },

    // First blood: a dark stab (a low minor chord struck together, its upper octave for small
    // speakers) with a hit of noise.
    stinger(t) {
      for (const m of [45, 48, 52, 57]) mallet(t, mtof(m), 0.6, 0.12);
      for (const m of [57, 60, 64]) mallet(t, mtof(m), 0.45, 0.12, 1.4);
      tone(t, 'sine', 55, 0.5, 0.25, 0.005, 40);
      noise(t, 0.08, 0.14, 'lowpass', 1200, 0.8);
      noise(t, 0.08, 0.16, 'bandpass', 850, 0.9);
    },

    // Buttons and toggles: a barely-there wood tap.
    ui(t) {
      knock(t, 1250, 0.06);
    },

    // A rival's bubble: babble, not speech. A few syllables in its own voice (BABBLERS), each a buzz
    // through a vowel-shaped band, stepping about in pitch and falling at the end, as a sentence does;
    // more for a longer line, all inside BABBLE_MAX. A snake with no voice (Mute) stays silent.
    babble(t, o) {
      const v = BABBLERS[o.voice];
      if (!v) return;
      const chars = Number.isFinite(o.chars) ? o.chars : 20;
      const n = Math.max(2, Math.min(v.n, Math.round(chars / 7)));
      const syl = Math.min(v.syl, (BABBLE_MAX - 0.03) / n), len = syl * (v.gate || 0.85);
      for (let i = 0; i < n; i++) {
        const at = t + i * syl, last = i === n - 1;
        const from = v.f * Math.pow(2, (Math.random() * 2 - 1) * v.jump / 12);
        const to = from * Math.pow(2, (last ? -(v.fall ?? 2) : v.glide || 0) / 12);
        const peak = 0.1 * v.level * (last ? 0.8 : 1);
        const osc = tone(at, v.wave, from, len, peak, Math.min(0.02, len * 0.3), to, { type: 'bandpass', freq: v.formant * (0.9 + Math.random() * 0.2), q: v.q });
        if (v.wob) vibrato(osc, at, len, v.wob, from * 0.08);
        if (v.breath) noise(at, len, peak * v.breath, 'bandpass', v.formant * 1.6, 1.2);
      }
    },
  };

  // Each rival's babble: f its pitch (Hz), syl a syllable (s) and n the most it says, gate how much of
  // each sounds (clipped below 0.85), wave and formant (Hz, with q) its timbre, jump how far each
  // syllable steps (semitones, either way), glide its slide within it and fall the last one's drop,
  // wob a gobble (Hz), breath a whisper over it, level its loudness. Mute has none: it stays silent.
  const BABBLERS = {
    mason: { f: 105, syl: 0.09, n: 4, gate: 0.55, wave: 'sawtooth', formant: 600, q: 2, jump: 1, glide: 0, fall: 2, level: 1 }, // clipped and deep
    gobbler: { f: 175, syl: 0.07, n: 6, wave: 'sawtooth', formant: 700, q: 3, jump: 3, glide: -2, wob: 18, level: 1 }, // gobbly
    ghost: { f: 330, syl: 0.14, n: 3, wave: 'sine', formant: 420, q: 0.5, jump: 2, glide: 1, breath: 0.8, level: 0.45 }, // faint, airy
    sniper: { f: 200, syl: 0.06, n: 4, gate: 0.5, wave: 'square', formant: 1200, q: 3, jump: 0.5, glide: 0, fall: 1, level: 0.8 }, // terse, precise
    sovereign: { f: 140, syl: 0.12, n: 4, wave: 'sawtooth', formant: 650, q: 2, jump: 2, glide: 1, fall: 4, level: 1 }, // stately
    colonist: { f: 170, syl: 0.08, n: 5, wave: 'sawtooth', formant: 800, q: 2.5, jump: 3, glide: 2, level: 1 }, // brisk, eager
    drab: { f: 150, syl: 0.1, n: 4, wave: 'triangle', formant: 500, q: 1.5, jump: 0.3, glide: 0, fall: 0.5, level: 0.8 }, // flat
    vulture: { f: 125, syl: 0.1, n: 4, wave: 'sawtooth', formant: 500, q: 4, jump: 2, glide: -3, breath: 0.5, level: 0.9 }, // raspy
    wildcard: { f: 190, syl: 0.08, n: 6, wave: 'square', formant: 900, q: 2, jump: 7, glide: 3, level: 0.9 }, // all over the place
    creeper: { f: 240, syl: 0.11, n: 4, wave: 'triangle', formant: 1400, q: 1.5, jump: 1, glide: -1, breath: 0.9, level: 0.6 }, // a sly whisper
    metagamer: { f: 230, syl: 0.055, n: 6, wave: 'square', formant: 1300, q: 2.5, jump: 2, glide: 1, level: 0.8 }, // quick, knowing
    capricious: { f: 210, syl: 0.09, n: 5, wave: 'sawtooth', formant: 900, q: 2, jump: 5, glide: 4, level: 0.9 }, // up and down
    copycat: { f: 260, syl: 0.08, n: 5, wave: 'triangle', formant: 1100, q: 2, jump: 4, glide: 5, level: 0.9 }, // sing-song glides
    desperado: { f: 115, syl: 0.13, n: 3, wave: 'sawtooth', formant: 550, q: 2, jump: 1, glide: -4, fall: 5, level: 0.9 }, // a drawl
    ouroboros: { f: 160, syl: 0.12, n: 4, wave: 'triangle', formant: 700, q: 1.5, jump: 1.5, glide: 2, breath: 0.6, level: 0.8 }, // a hiss round it
    joker: { f: 280, syl: 0.065, n: 6, wave: 'square', formant: 1200, q: 2.5, jump: 6, glide: 4, level: 0.8 }, // giggly
    star: { f: 320, syl: 0.075, n: 5, wave: 'triangle', formant: 1500, q: 2, jump: 3, glide: 3, fall: 1, level: 0.9 }, // bright
  };

  // Back on the title loop: the woodpecker starts afresh next round.
  const newRound = () => { strikes = 0; aims = 0; };
  return { CUES, BABBLERS, drumBlows, newRound };
};
