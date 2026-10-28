#!/usr/bin/env node
// Checks the chatter's lines: every line in English has its Chinese (Copycat
// repeats what it hears, in Chinese), every {who} line names someone the
// same way in both, no voice has an empty list, no Chinese is left over from
// a line that's gone, and every punchline is a line someone says.
// Then it plays the chatter itself (chatter/ with the game's own engine, on
// a stand-in page) through staged moments: every voice speaks up when it's
// pecked under, put out by the rain, sees food burn or rot, starves, is cut
// by a dash, chokes on its own bead, eats what your cough nudged aside, loses
// a beetle it cornered that digs in and gets away, sees you eat what the
// woodpecker knocked away from it, and (where it has lines for them) flashes
// or hears the last apples fall; Sovereign and Colonist mind rot on their
// land, by the one land rule, and a capital or a colony the woodpecker takes;
// and the rarer lines keep to their rests (a choke's 20 s, a windfall's
// thanks now and then, only for what a choke or a cough knocked aside, soon
// after; a dug-in beetle's 30 s, only for its hunter, the nearest head as it
// dug; a grumble at whoever ate what the woodpecker knocked aside, from the
// nearest head to where it lay but the eater's, every 40 s at most), and no
// rival announces the woodpecker's fair play (the lesson does). Star, the
// power addict,
// has a line for every moment anyone has, shows off its flashes and jumps at
// most every 10 s (even flashing the moment its rest is over, when it doesn't
// say its flash is back), grumbles while it rests, crows over golden things,
// greets a rainbow as family (its own moments aren't crowded out by its
// showing off), and now and then Wildcard or Mason answers it; a golden dash
// that cuts someone leaves the words to the snip or the kill. The names in
// the log read on its dark wood in their snakes' own colours (Copycat's the
// flag's red, not pink). Then two
// whole AI rounds with the chatter listening, to see nothing throws: one with
// the rivals who have the most to say about the board (Sovereign's realm and
// Colonist's colonies, intruders and fire on them, Vulture at every death,
// Capricious in its moods), one with Star and the rivals who answer it. Last, the sound (audio.js on a stand-in AudioContext): a rival's
// flash, jump, choke or the like never silences yours, your own golden ones
// in a row are each heard, your choke and its cough (a beat later) each time
// you can choke, a beetle digging in and the woodpecker knocking food aside
// once a moment and each time they can come again, and nothing while muted;
// and what carries over the music: a rival's dig keeps its legs' scratches,
// and a burrow closing over its flecks of sawdust.
//
//   node tools/chatter-test.js [--rounds N]
//   (--rounds N: N more whole AI rounds of four rivals at random, with the
//   woodpecker's knocked food and its grumbles checked and counted.)
// The checks are in tools/chatter/, one file per area, run in name order in one scope
// (tools/parts.js): 00 every line and its Chinese, 01 the chatter playing (a stand-in page) and every
// voice, 02 the woodpecker and choking, 03 beetles and Star, 04 the power habit, the names in the log
// and whole rounds, 05 the sound. A new check goes in its area's file, or a new one.
const path = require('path');
const read = require('./parts.js')(path.join(__dirname, 'chatter'));
const fails = read('fails'), oks = read('oks');
if (fails) { console.error(`${fails} failed of ${oks} checks`); process.exit(1); }
console.log(`ok   ${read('checks')} checks of the chatter and the sound playing`);
console.log(`all good (${oks} checks)`);
