// Capricious: its look, its words and its weights, and its driver (the template every rival shares: ai/rivals.js).

PERSONAS.capricious = {
  name: 'Capricious', color: '#ec4899', look: 'capricious', driver: 'capricious',
  blurb: 'Does impressions of all the others, by turns, in costume.',
  kill: ['Capricious felt like it. Just then.', 'A moment later, it wouldn’t have bothered.', 'Wrong place, wrong mood.'],
  win: ['And already wants something else.', 'It loves winning! For now.'],
  w: DRAB, // replaced by the current mood's weights
};

// Mood swings. It starts each round undecided (its own self, playing it
// safe) for a few seconds, then every 8-15 s does an impression of
// another rival, dealt from a shuffled deck of all of them (each once
// before any comes back, never the same twice running), dithering for
// a moment in between.
DRIVERS.capricious = function () {
  memory.moodUntil ??= view.timeMs + rand(3500, 5500);
  if (view.timeMs >= memory.moodUntil) {
    for (const k of MOOD_MEMORY) memory[k] = null; // (whatever the last mood kept is gone: its realm, its flag, who it hunted)
    if (memory.mood) { // over it: a moment of not knowing what next
      memory.lastMood = memory.mood;
      memory.mood = null;
      memory.moodUntil = view.timeMs + rand(1200, 2000);
    } else {
      if (!memory.deck?.length) {
        const deck = memory.deck = [...MOODS];
        for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
        if (deck[deck.length - 1] === memory.lastMood) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]]; // (dealt from the end)
      }
      memory.mood = memory.deck.pop();
      memory.moodUntil = view.timeMs + rand(8000, 15000);
    }
    memory.moodChangedAt = view.timeMs;
  }
  if (!memory.mood) return; // (undecided: its own, safe weights)
  const mood = PERSONAS[memory.mood];
  intent.w = MOOD_FORMS[memory.mood] || mood.w;
  if (mood.driver) DRIVERS[mood.driver]();
};
