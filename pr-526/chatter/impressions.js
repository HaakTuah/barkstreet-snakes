// Capricious opens each mood with an impression: one of that rival's own
// opening lines, marked as one ("*does its best Sovereign*: “Kneel.”"; a
// mime's is all stage direction: "*does its best Mute: waves silently*"), and
// Copycat echoes it as the rival's line in its Chinese. (Loaded after every
// voice in chatter/voices/, since it reads their opening lines.)
for (const key in VOICES) {
  if (key === 'capricious' || key === 'drab') continue;
  const name = window.SnakeAI.PERSONAS[key].name;
  VOICES.capricious.mood[key] = VOICES[key].start.filter(l => !l.includes('{who}')).map(l => {
    const mime = /^\*(.+)\*$/.exec(l), text = mime ? `*does its best ${name}: ${mime[1]}*` : `*does its best ${name}*: “${l}”`;
    const zh = ZH[l] ?? l, zhMime = /^\*(.+)\*$/.exec(zh);
    ZH[text] = zhMime ? `*模仿${name}：${zhMime[1]}*` : `*模仿${name}*: “${zh}”`;
    return text;
  });
}
