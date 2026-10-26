## 600 rounds, seed 11

### Variants

| variant | tuning | fingerprint |
|---|---|---|
| base | `(main)` | 626189426 |
| Pfull2 | `{"PECK_NO_SEAL":true,"PECK_FOOD":"knock","PECK_NO_ORPHANS":2,"PECK_SMOOTH":true,"PECK_CHUNK":12,"PECK_CHUNK_MAX":20,"APPLES":2,"BEETLE_MAX":2,"BEETLE_CHANCE":0.012,"GOLD_BEETLE_CHANCE":0.12,"BEETLE_SD":true,"BEETLE_DIG":8,"BEETLE_DIG_FEAR":6,"PECK_REST_TICKS":30,"PECK_REST_MIN":10}` | 483811135 |

### The round and the woodpecker

| variant | median (middle half) | SD starts | SD length (mid half) | reach SD % | deaths before / after | first death | alive 60/90/120/150 | len at arrival | alive at arrival | starved % | win spread |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 172 (160-181) | 120 (120-120) | 52 (40-61) | 100 | 0.48 / 2.52 | 127 | 3.93 / 3.78 / 3.52 / 2.76 | 37.9 | 3.52 | 2.9 | 16.5-32.6 |
| Pfull2 | 170 (163-178) | 120 (120-120) | 50 (42-58) | 99.8 | 0.42 / 2.58 | 133 | 3.9 / 3.78 / 3.58 / 2.89 | 32.2 | 3.59 | 3.3 | 14.3-33.3 |

### Deaths by cause (all deaths; sudden death's)

| variant | body | self | hole | pecked | head-on | wall | starved | cut | SD: body | SD: self | SD: hole | SD: pecked | SD: starved | holes per SD round |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 41 | 24 | 19.5 | 4.1 | 3.5 | 4.3 | 2.9 | 0.7 | 35.7 | 25.3 | 23.3 | 4.9 | 2.8 | 0.59 |
| Pfull2 | 42.2 | 27.1 | 14.3 | 4.6 | 4.6 | 3.7 | 3.3 | 0.2 | 39.3 | 29.7 | 16.6 | 5.3 | 1.5 | 0.43 |

### Islands about 5 s before the end (and when two are left)

| variant | holes | islands (5+ cells) | biggest | a head's island: median (mid half) | heads sharing an island % | gap to leave a head's island, % of heads: 1/2/3/4/5+ | gaps between islands, %: 1/2/3/4/5+ | room under length % | two left: sharing % | two left: gap to leave 1/2/3/4/5+ |
|---|---|---|---|---|---|---|---|---|---|---|
| base | 216 | 2.21 | 315 | 329 (205-425) | 81.2 | 25.2/10.7/11.3/5.2/5.1 (joined 42.4) | 21.8/13.9/15/11.3/38 | 5.4 | 91.3 | 16.5/6.9/5.4/3.4/2.3 (joined 65.4) |
| Pfull2 | 296 | 2.29 | 237 | 244 (118-333) | 72.5 | 2.3/10.3/15.9/14.6/25.7 (joined 31.2) | 1.7/7.8/14.4/14.8/61.3 | 6.6 | 83.4 | 1.8/9.4/11.5/10.5/16.1 (joined 50.8) |

### The end: boxed in, sealed, a lottery?

| variant | self-boxed alone a round (% SD deaths) | SD deaths in a pocket (room < length 1 s before) % | aims sealing someone a round | sealed, then out within 3 s a round (% SD deaths) | longest at arrival wins % (chance) | most room at arrival wins % (chance) | rounds separated % | biggest island wins % (chance) | two left: longer wins % | two left: duel length | last death: hole / self / body / other |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 0.34 (13.6) | 36.6 | 0.97 | 0.54 (21.6) | 24.3 (30.6) | 31.4 (29.7) | 31.1 | 64 (48.8) | 40.6 | 13 | 31.4 / 32.9 / 21.2 / 14.5 |
| Pfull2 | 0.42 (16.3) | 40.3 | 0.08 | 0.07 (2.8) | 21.2 (29.9) | 28.6 (29) | 38.4 | 41.5 (48.2) | 42.3 | 11 | 23.9 / 39.6 / 21.5 / 15 |

### Food and hunger

| variant | meals a snake-minute: 0-45 s / 45 s-SD / SD | median gap between meals: 0-45 / mid / SD (s) | 3rd quartile gap mid (s) | hunger warning %: 0-45 / mid / SD | hunger warning before SD % | length at 60 / 120 s | starved % |
|---|---|---|---|---|---|---|---|
| base | 18.1 / 19.9 / 15.6 | 2 / 1.8 / 0.2 | 4.3 | 0.9 / 12.8 / 28.5 | 8.6 | 22.1 / 37.9 | 2.9 |
| Pfull2 | 14 / 16.5 / 16.5 | 2.5 / 2.4 / 0.2 | 5.4 | 1.7 / 16.5 / 21.3 | 11.3 | 19 / 32.2 | 3.3 |

### Beetles

| variant | out a round | caught a round | caught % | flew off / stayed home % | in SD a round | chase, near to caught (ticks, median / 3rd q) | spawn to caught (ticks) | dives a beetle | golden a round (caught) | golden leaps used a round | win spread |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 4.05 | 3.72 | 91.8 | 8.2 | 0 | 47 / 95 | 66 | 1.01 | 1.63 (1.5) | 2.95 | 16.5-32.6 |
| Pfull2 | 15.21 | 13.37 | 87.9 | 12.1 | 4.89 | 38 / 84 | 58 | 1.33 | 1.82 (1.62) | 3.03 | 14.3-33.3 |

### Win rates %

| variant | per persona |
|---|---|
| base | Star 32.6, Drab 32.1, Copycat 31.4, Metagamer 30.4, Mute 28.3, Mason 27.4, Creeper 26.8, Sovereign 26.1, Colonist 26, Capricious 25.2, Desperado 24.8, Gobbler 24.4, Wildcard 21.9, Ghost 21.3, Vulture 18.4, Joker 18.3, Ouroboros 17.1, Sniper 16.5 |
| Pfull2 | Vulture 33.3, Ghost 28.4, Capricious 27.6, Metagamer 27.5, Copycat 27, Mason 26.7, Star 26.5, Sovereign 26.1, Desperado 25.6, Creeper 25.4, Drab 25.2, Sniper 24.8, Ouroboros 24.7, Mute 24.6, Colonist 23.6, Wildcard 21.3, Joker 18.3, Gobbler 14.3 |

### Beetle escapes (each time one is above ground)

| variant | chased: escaped % | chased before 60 s | 60 s to SD | in SD | with 1 burrow open | 2 open | 3+ open | chase length near to end, ticks (caught / escaped) | not chased: flew off % |
|---|---|---|---|---|---|---|---|---|---|
| base | 50.3 (dived 48.4, flew 2; n 7.48) | 52.2 (dived 51.5, flew 0.7; n 2.81) | 49.3 (dived 46.5, flew 2.7; n 4.67) | null (dived null, flew null; n 0) | 50.7 (dived 49, flew 1.7; n 3.12) | 48.2 (dived 46.2, flew 2; n 2.44) | 52.6 (dived 50.1, flew 2.4; n 1.92) | 7 (16 / 4) | 4.5 |
| Pfull2 | 57.3 (dived 56.7, dug 15.3, flew 0.6; n 31.28) | 58 (dived 57.9, dug 13.8, flew 0.2; n 8.17) | 57.5 (dived 56.8, dug 15.8, flew 0.7; n 14.22) | 56.3 (dived 55.4, dug 16, flew 0.9; n 8.9) | 56.3 (dived 56, dug 15.2, flew 0.4; n 3.3) | 56.7 (dived 55.9, dug 16, flew 0.8; n 6.47) | 57.6 (dived 57, dug 15.1, flew 0.6; n 21.51) | 5 (6 / 5) | 14.1 |

### Beetle escapes once a head was within 2 cells (a real chase)

| variant | escaped % | before 60 s | 60 s to SD | in SD | ticks from within 2 to the end |
|---|---|---|---|---|---|
| base | 35.9 (dived 33.6, flew 2.3; n 5.79) | 34.6 (dived 33.9, flew 0.7; n 2.05) | 36.6 (dived 33.4, flew 3.2; n 3.74) | null (dived null, flew null; n 0) | 6 |
| Pfull2 | 43.5 (dived 42.9, dug 14, flew 0.6; n 23.62) | 43.5 (dived 43.3, dug 12.7, flew 0.2; n 6.06) | 44.4 (dived 43.7, dug 15, flew 0.7; n 10.85) | 42.1 (dived 41.4, dug 13.7, flew 0.7; n 6.72) | 2 |

### Tiny islands (1-2 cells)

| variant | 1-cell / 2-cell islands 5 s before the end | with food on them | at the end: 1 / 2-cell | cut off by strikes a SD round | of them with food on % | with a snake on % | SD length | SD meals a snake-minute | SD hunger warning % | SD starved % of SD deaths |
|---|---|---|---|---|---|---|---|---|---|---|
| base | 2.22 / 0.46 | 0.05 | 2.66 / 0.57 | 3.23 | 7.6 | 5.5 | 52 | 15.6 | 28.5 | 2.8 |
| Pfull2 | 0 / 0 | 0 | 0 / 0 | 0 |  |  | 50 | 16.5 | 21.3 | 1.5 |

### Hole shapes

| variant | strikes a SD | cells a strike | perimeter / least perimeter (1 = square-ish) | spur cells a strike | one-wide corridor cells a strike | strikes with a spur % | hollows 5 s before the end | their rim / least rim | land teeth (3+ sides hole or edge) | hole spur cells | SD length | islands (5+) | tiny islands 1 / 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 17 | 14.3 | 1.32 | 1.98 | 0.32 | 91.9 | 3.1 | 1.6 | 13.5 | 10.6 | 52 | 2.21 | 2.22 / 0.46 |
| Pfull2 | 18.2 | 18.3 | 1.19 | 0.72 | 0.23 | 51.2 | 2.3 | 1.13 | 1.9 | 0.1 | 50 | 2.29 | 0 / 0 |

### Meals by kind, a snake-minute (0-45 s; 45 s to SD; SD)

| variant | 0-45 s | 45 s-SD | SD |
|---|---|---|---|
| base | apple 16.3, pellet 0.8, golden 0.7, beetle 0.3, leaf 0.1, goldcap 0.1 | apple 15, pellet 4.6, golden 0.7, beetle 0.6, goldcap 0.1, leaf 0.1, baked 0 | pellet 12.8, apple 2.6, beetle 0.1, golden 0, leaf 0, goldcap 0 |
| Pfull2 | apple 11.7, pellet 0.8, beetle 0.7, golden 0.7, leaf 0.1, goldcap 0.1 | apple 11.2, pellet 3.8, beetle 1.5, golden 0.7, goldcap 0.1, leaf 0.1, baked 0 | pellet 12.4, apple 2.3, beetle 1.7, golden 0.1, leaf 0, goldcap 0 |
