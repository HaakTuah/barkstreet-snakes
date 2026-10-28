// ------------------------------------------ one screen, in every state
// On every screen above, and on desktops as browsers have them, the
// page never scrolls, in any of ten states (oneScreen); and on the
// desktops, the board is as big as said (880 px beside the column on a
// 1080p screen's Chrome, 665 before, with or without its bookmarks bar,
// and on a 1200p screen's; side by side up to 1180 px tall, so a 1440p
// screen's Chrome, 1305 px, has it over the board, as does a half
// screen's window, narrower than 5:4).
for (const d of [...DEVICES, ...DESKTOPS, ...STACKED]) {
  if (only && !d.name.includes(only)) continue;
  const w = await oneScreen(d.name, d);
  if (DESKTOPS.includes(d)) {
    oneBoards.push(`  ${d.name.padEnd(64)} ${r1(w)}`);
    check(w >= d.least - 0.5, `${d.name}: the board is at least ${d.least} px`, `${r1(w)} px`);
  }
  if (STACKED.includes(d)) {
    oneBoards.push(`  ${d.name.padEnd(64)} ${r1(w)} (main ${d.main})`);
    check(w >= d.main - 0.5, `${d.name}: over the board, the board is no smaller than on main before the page was one screen tall, ${d.main} px`, `${r1(w)} px`);
  }
}
const side1080 = DESKTOPS.filter(d => !/^2560|^960/.test(d.name) && (!only || d.name.includes(only)));
for (const d of side1080) {
  await open(d);
  const l = await ev(LAYOUT);
  check(l.frame.x >= l.header.r && l.frame.x >= l.chatter.r && Math.abs(l.chatter.b - l.frame.b) < 1, `${d.name}: the header, the tags, the row under the board and the chatter in a column beside the board, as tall as it`, `the column ${r1(l.header.x)}-${r1(l.header.r)} down to ${r1(l.chatter.b)}, the frame ${r1(l.frame.x)}-${r1(l.frame.r)} down to ${r1(l.frame.b)}`);
}
for (const d of DESKTOPS.filter(x => /^2560|^960/.test(x.name) && (!only || x.name.includes(only)))) {
  await open(d);
  const l = await ev(LAYOUT);
  check(l.frame.y >= l.tags.b && l.foot.y >= l.frame.b && l.chatter.y >= l.foot.b - 0.5, `${d.name}: over the board, the header and tags above it, the row under the board and the chatter under it`, `the frame ${r1(l.frame.y)}-${r1(l.frame.b)}, the row ${r1(l.foot.y)}-${r1(l.foot.b)}, the chatter from ${r1(l.chatter.y)}`);
}
