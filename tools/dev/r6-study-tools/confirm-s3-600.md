## 600 rounds, seed 3

### Variants

| variant | tuning | fingerprint |
|---|---|---|
| base | `(main)` | 324380661 |
| Ws | `{"PECK_NO_SEAL":true,"PECK_FOOD":"knock","PECK_NO_ORPHANS":2,"PECK_SMOOTH":true,"PECK_CHUNK":12,"PECK_CHUNK_MAX":20}` | 384942791 |
| Pfull | `{"PECK_NO_SEAL":true,"PECK_FOOD":"knock","PECK_NO_ORPHANS":2,"PECK_SMOOTH":true,"PECK_CHUNK":12,"PECK_CHUNK_MAX":20,"APPLES":2,"BEETLE_MAX":2,"BEETLE_CHANCE":0.012,"GOLD_BEETLE_CHANCE":0.12,"BEETLE_SD":true,"BEETLE_DIG":8,"BEETLE_DIG_FEAR":6}` | 931362698 |
| Pfull2 | `{"PECK_NO_SEAL":true,"PECK_FOOD":"knock","PECK_NO_ORPHANS":2,"PECK_SMOOTH":true,"PECK_CHUNK":12,"PECK_CHUNK_MAX":20,"APPLES":2,"BEETLE_MAX":2,"BEETLE_CHANCE":0.012,"GOLD_BEETLE_CHANCE":0.12,"BEETLE_SD":true,"BEETLE_DIG":8,"BEETLE_DIG_FEAR":6,"PECK_REST_TICKS":30,"PECK_REST_MIN":10}` | 371867 |
| PfullL | `{"PECK_NO_SEAL":true,"PECK_FOOD":"knock","PECK_NO_ORPHANS":2,"PECK_SMOOTH":true,"PECK_CHUNK":12,"PECK_CHUNK_MAX":20,"APPLES":2,"BEETLE_MAX":2,"BEETLE_CHANCE":0.012,"GOLD_BEETLE_CHANCE":0.12,"BEETLE_SD":true,"BEETLE_DIG":8,"BEETLE_DIG_FEAR":6,"AI_LIVE_FOOD":true}` | 406562284 |

### The round and the woodpecker

| variant | median (middle half) | SD starts | SD length (mid half) | reach SD % | deaths before / after | first death | alive 60/90/120/150 | len at arrival | alive at arrival | starved % | win spread |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 172 (162-180) | 120 (120-120) | 52 (42-60) | 99.3 | 0.57 / 2.43 | 123 | 3.9 / 3.75 / 3.43 / 2.69 | 37.7 | 3.45 | 2.4 | 18.8-34 |
| Ws | 172 (162-181) | 120 (120-120) | 53 (42-61) | 99.3 | 0.57 / 2.43 | 123 | 3.9 / 3.75 / 3.43 / 2.71 | 37.7 | 3.45 | 1.7 | 19.7-32 |
| Pfull | 175 (167-183) | 120 (120-120) | 55 (47-63) | 99.8 | 0.42 / 2.58 | 133 | 3.93 / 3.79 / 3.58 / 2.95 | 32.3 | 3.58 | 2.9 | 16.3-29.9 |
| Pfull2 | 172 (163-180) | 120 (120-120) | 51 (43-60) | 99.8 | 0.42 / 2.58 | 133 | 3.93 / 3.79 / 3.58 / 2.87 | 32.3 | 3.58 | 3.1 | 17-35 |
| PfullL | 172 (164-180) | 120 (120-120) | 52 (44-60) | 99.8 | 0.49 / 2.51 | 127 | 3.93 / 3.79 / 3.51 / 2.82 | 35.1 | 3.51 | 2.3 | 17-34.4 |

### Deaths by cause (all deaths; sudden death's)

| variant | body | self | hole | pecked | head-on | wall | starved | cut | SD: body | SD: self | SD: hole | SD: pecked | SD: starved | holes per SD round |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 42.6 | 23.2 | 19.9 | 3.6 | 3.3 | 4.2 | 2.4 | 0.6 | 36.3 | 25.1 | 24.6 | 4.5 | 2.5 | 0.6 |
| Ws | 47.8 | 27.3 | 11.5 | 4 | 3.3 | 3.7 | 1.7 | 0.6 | 42.6 | 30.2 | 14.2 | 4.9 | 1.6 | 0.35 |
| Pfull | 42 | 27.7 | 14.7 | 3.8 | 3.1 | 5.2 | 2.9 | 0.7 | 39 | 29.8 | 17.1 | 4.5 | 1.5 | 0.44 |
| Pfull2 | 40.1 | 27.6 | 16.6 | 4.3 | 3.2 | 4.4 | 3.1 | 0.8 | 36.8 | 29.7 | 19.3 | 5 | 1.7 | 0.5 |
| PfullL | 43.1 | 31.1 | 12.3 | 3.8 | 3.4 | 3.5 | 2.3 | 0.4 | 38 | 34.5 | 14.8 | 4.6 | 1.7 | 0.37 |

### Islands about 5 s before the end (and when two are left)

| variant | holes | islands (5+ cells) | biggest | a head's island: median (mid half) | heads sharing an island % | gap to leave a head's island, % of heads: 1/2/3/4/5+ | gaps between islands, %: 1/2/3/4/5+ | room under length % | two left: sharing % | two left: gap to leave 1/2/3/4/5+ |
|---|---|---|---|---|---|---|---|---|---|---|
| base | 218 | 2.15 | 317 | 334 (223-410) | 81.8 | 22.2/13.7/10.3/5.6/6.5 (joined 41.8) | 20.8/14.1/15.1/13.7/36.3 | 3.9 | 90.6 | 15/8.1/8/2.7/2.7 (joined 63.5) |
| Ws | 281 | 2.2 | 255 | 255 (125-366) | 73.2 | 1.6/7.4/14.3/14.2/24 (joined 38.6) | 1.4/6.9/13.2/16.2/62.2 | 5.7 | 87.6 | 1.3/6.5/9.9/9.2/12.2 (joined 60.9) |
| Pfull | 306 | 2.29 | 228 | 227 (105-331) | 69 | 0.9/8.3/16.6/14.8/28.5 (joined 30.9) | 0.6/6.9/14.7/16.2/61.5 | 6.3 | 82.8 | 1.4/6.8/12/10.9/16.1 (joined 52.8) |
| Pfull2 | 306 | 2.33 | 227 | 232 (100-328) | 67.8 | 1.8/10.4/14.3/15.4/27.3 (joined 30.8) | 1.3/8.3/12.9/16/61.5 | 5.7 | 82.7 | 1.2/8.5/12/10.4/15.1 (joined 52.9) |
| PfullL | 282 | 2.08 | 257 | 268 (141-353) | 75.5 | 1.9/8/13.4/13.5/22.6 (joined 40.5) | 1.7/7.3/13.8/17.3/59.9 | 7.7 | 85.5 | 1.4/5.5/9.6/10.3/11.5 (joined 61.7) |

### The end: boxed in, sealed, a lottery?

| variant | self-boxed alone a round (% SD deaths) | SD deaths in a pocket (room < length 1 s before) % | aims sealing someone a round | sealed, then out within 3 s a round (% SD deaths) | longest at arrival wins % (chance) | most room at arrival wins % (chance) | rounds separated % | biggest island wins % (chance) | two left: longer wins % | two left: duel length | last death: hole / self / body / other |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 0.33 (13.4) | 35.2 | 0.89 | 0.52 (21.4) | 25.9 (31.8) | 31.7 (30.3) | 27.9 | 60.5 (48.4) | 45.5 | 15 | 35.1 / 30.4 / 21.2 / 13.3 |
| Ws | 0.37 (15.1) | 40.6 | 0.09 | 0.08 (3.1) | 24.8 (31.8) | 32.1 (30.3) | 35 | 38.7 (48.5) | 44.5 | 15 | 20.3 / 38.5 / 25.7 / 15.5 |
| Pfull | 0.42 (16.4) | 41.7 | 0.1 | 0.09 (3.5) | 20.3 (30.4) | 30.9 (29) | 39.5 | 36.7 (48.1) | 40.7 | 14 | 26.3 / 38.3 / 19.6 / 15.8 |
| Pfull2 | 0.46 (17.8) | 41.5 | 0.1 | 0.09 (3.6) | 21.4 (30.3) | 29 (29) | 43.2 | 41.1 (48.3) | 39 | 14 | 27.7 / 38.6 / 17.7 / 16 |
| PfullL | 0.38 (15) | 45.2 | 0.06 | 0.06 (2.3) | 22 (30.8) | 31.2 (29.6) | 34.3 | 43.4 (48.2) | 41.6 | 14 | 20.4 / 42.8 / 21.7 / 15.1 |

### Food and hunger

| variant | meals a snake-minute: 0-45 s / 45 s-SD / SD | median gap between meals: 0-45 / mid / SD (s) | 3rd quartile gap mid (s) | hunger warning %: 0-45 / mid / SD | hunger warning before SD % | length at 60 / 120 s | starved % |
|---|---|---|---|---|---|---|---|
| base | 18.2 / 19.8 / 15 | 2 / 1.8 / 0.2 | 4.4 | 0.8 / 13.1 / 28.3 | 8.7 | 22.2 / 37.7 | 2.4 |
| Ws | 18.2 / 19.8 / 15.6 | 2 / 1.8 / 0.2 | 4.4 | 0.8 / 13.1 / 27.4 | 8.7 | 22.2 / 37.7 | 1.7 |
| Pfull | 14 / 16.6 / 15.7 | 2.5 / 2.3 / 0.2 | 5.3 | 1.7 / 16.4 / 21.8 | 11.2 | 18.8 / 32.2 | 2.9 |
| Pfull2 | 14 / 16.6 / 16.1 | 2.5 / 2.3 / 0.2 | 5.3 | 1.7 / 16.4 / 22.2 | 11.2 | 18.8 / 32.2 | 3.1 |
| PfullL | 15.4 / 17.7 / 17 | 2.2 / 2.1 / 0.2 | 5 | 1.3 / 15.3 / 20.2 | 10.4 | 20.3 / 35.1 | 2.3 |

### Beetles

| variant | out a round | caught a round | caught % | flew off / stayed home % | in SD a round | chase, near to caught (ticks, median / 3rd q) | spawn to caught (ticks) | dives a beetle | golden a round (caught) | golden leaps used a round | win spread |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 4.07 | 3.72 | 91.5 | 8.5 | 0 | 46 / 95 | 66 | 0.94 | 1.64 (1.52) | 3 | 18.8-34 |
| Ws | 4.07 | 3.71 | 91.3 | 8.7 | 0 | 46 / 94 | 66 | 0.95 | 1.64 (1.53) | 3.02 | 19.7-32 |
| Pfull | 15.49 | 13.57 | 87.6 | 12.4 | 5.34 | 38 / 85 | 59 | 1.35 | 1.81 (1.6) | 3 | 16.3-29.9 |
| Pfull2 | 14.99 | 13.1 | 87.4 | 12.6 | 4.85 | 38 / 85 | 58 | 1.34 | 1.73 (1.53) | 2.85 | 17-35 |
| PfullL | 16.25 | 14.98 | 92.1 | 7.9 | 5.45 | 22 / 60 | 44 | 1 | 2.04 (1.91) | 3.56 | 17-34.4 |

### Win rates %

| variant | per persona |
|---|---|
| base | Ghost 34, Mute 31.8, Star 30.5, Copycat 29.5, Sovereign 29.2, Ouroboros 25.9, Sniper 25.3, Metagamer 24.8, Colonist 24.3, Creeper 22.9, Joker 22.9, Mason 22.4, Desperado 21.4, Vulture 21.3, Gobbler 21.1, Capricious 20.8, Wildcard 20.2, Drab 18.8 |
| Ws | Ghost 32, Mute 31.2, Vulture 30.1, Ouroboros 28.4, Colonist 28.4, Mason 26.4, Metagamer 26.4, Drab 24.8, Joker 24.3, Capricious 24.2, Sniper 24, Wildcard 23.3, Desperado 22.2, Copycat 21.3, Sovereign 20.8, Star 20.6, Creeper 19.7, Gobbler 19.7 |
| Pfull | Drab 29.9, Sovereign 29.2, Joker 28.6, Ghost 28, Copycat 27.9, Mason 26.4, Colonist 26.4, Ouroboros 25.9, Vulture 25.7, Wildcard 25.6, Creeper 25.5, Sniper 25.3, Mute 24, Metagamer 24, Capricious 22.5, Desperado 21.4, Star 17.6, Gobbler 16.3 |
| Pfull2 | Sovereign 35, Copycat 31.1, Ghost 30, Ouroboros 29.3, Sniper 28.8, Vulture 28.7, Star 27.5, Metagamer 27.2, Capricious 25.8, Desperado 24.8, Colonist 24.3, Mason 24, Mute 22.1, Joker 20, Creeper 19.7, Wildcard 19.4, Drab 17.9, Gobbler 17 |
| PfullL | Copycat 34.4, Mason 32, Ghost 31.3, Mute 29.2, Sovereign 29.2, Capricious 26.7, Wildcard 26.4, Ouroboros 25, Sniper 24, Metagamer 24, Desperado 23.9, Creeper 23.6, Drab 23.1, Star 22.1, Vulture 22.1, Colonist 18.9, Joker 18.6, Gobbler 17 |

### Beetle escapes (each time one is above ground)

| variant | chased: escaped % | chased before 60 s | 60 s to SD | in SD | with 1 burrow open | 2 open | 3+ open | chase length near to end, ticks (caught / escaped) | not chased: flew off % |
|---|---|---|---|---|---|---|---|---|---|
| base | 49.1 (dived 47.2, flew 1.9; n 7.3) | 50.6 (dived 49.5, flew 1.1; n 2.64) | 48.2 (dived 45.8, flew 2.4; n 4.65) | null (dived null, flew null; n 0) | 48.1 (dived 46.1, flew 2; n 3.07) | 49.9 (dived 48.2, flew 1.7; n 2.5) | 49.5 (dived 47.5, flew 1.9; n 1.72) | 9 (17 / 4) | 7.3 |
| Ws | 49.2 (dived 47.2, flew 1.9; n 7.3) | 50.6 (dived 49.5, flew 1.1; n 2.64) | 48.4 (dived 45.9, flew 2.4; n 4.66) | null (dived null, flew null; n 0) | 48.2 (dived 46.2, flew 2; n 3.07) | 50.4 (dived 48.5, flew 1.9; n 2.5) | 49.1 (dived 47.2, flew 1.9; n 1.73) | 9 (17 / 4) | 7.3 |
| Pfull | 57.8 (dived 57.1, dug 15.6, flew 0.7; n 32.12) | 58.4 (dived 58.2, dug 13.5, flew 0.2; n 7.87) | 57.9 (dived 57.4, dug 16.3, flew 0.6; n 14.14) | 57.3 (dived 55.9, dug 16.4, flew 1.3; n 10.11) | 59 (dived 57.9, dug 16, flew 1.1; n 3.22) | 56.1 (dived 55.2, dug 16, flew 0.9; n 6.5) | 58.2 (dived 57.5, dug 15.5, flew 0.6; n 22.4) | 5 (6 / 5) | 14.8 |
| Pfull2 | 57.7 (dived 57.1, dug 15.6, flew 0.7; n 30.93) | 58.4 (dived 58.2, dug 13.5, flew 0.2; n 7.87) | 58 (dived 57.4, dug 16.3, flew 0.6; n 14.14) | 56.7 (dived 55.6, dug 16.4, flew 1.1; n 8.93) | 58 (dived 57.3, dug 16, flew 0.8; n 3.24) | 55.8 (dived 55.1, dug 15.6, flew 0.7; n 6.11) | 58.2 (dived 57.6, dug 15.5, flew 0.6; n 21.58) | 5 (6 / 5) | 15.4 |
| PfullL | 48 (dived 47.8, dug 12.2, flew 0.3; n 28.75) | 51.1 (dived 50.9, dug 10.2, flew 0.1; n 7.49) | 48.3 (dived 48.2, dug 12.5, flew 0.1; n 12.85) | 44.9 (dived 44.3, dug 13.6, flew 0.6; n 8.4) | 49.1 (dived 48.7, dug 11.4, flew 0.4; n 3) | 48.5 (dived 48.1, dug 11.6, flew 0.5; n 5.85) | 47.7 (dived 47.5, dug 12.5, flew 0.2; n 19.9) | 5 (6 / 3) | 6.6 |

### Beetle escapes once a head was within 2 cells (a real chase)

| variant | escaped % | before 60 s | 60 s to SD | in SD | ticks from within 2 to the end |
|---|---|---|---|---|---|
| base | 35.6 (dived 33.5, flew 2.2; n 5.77) | 36.3 (dived 35.1, flew 1.2; n 2.05) | 35.3 (dived 32.6, flew 2.7; n 3.72) | null (dived null, flew null; n 0) | 6 |
| Ws | 35.8 (dived 33.5, flew 2.3; n 5.77) | 36.3 (dived 35.1, flew 1.2; n 2.05) | 35.5 (dived 32.7, flew 2.8; n 3.72) | null (dived null, flew null; n 0) | 6 |
| Pfull | 43.6 (dived 43, dug 14.3, flew 0.6; n 23.99) | 42.7 (dived 42.5, dug 13.3, flew 0.2; n 5.71) | 44.6 (dived 44.1, dug 15, flew 0.5; n 10.72) | 42.8 (dived 41.8, dug 14.3, flew 1; n 7.56) | 2 |
| Pfull2 | 43.4 (dived 42.9, dug 14.4, flew 0.5; n 23.1) | 42.7 (dived 42.5, dug 13.3, flew 0.2; n 5.71) | 44.6 (dived 44.1, dug 15, flew 0.5; n 10.73) | 42.1 (dived 41.2, dug 14.5, flew 0.9; n 6.67) | 2 |
| PfullL | 28.4 (dived 28.3, dug 10.1, flew 0.1; n 20.85) | 29.5 (dived 29.5, dug 8.8, flew 0; n 5.2) | 29.5 (dived 29.4, dug 10.9, flew 0.1; n 9.41) | 25.8 (dived 25.6, dug 9.9, flew 0.2; n 6.24) | 2 |

### Tiny islands (1-2 cells)

| variant | 1-cell / 2-cell islands 5 s before the end | with food on them | at the end: 1 / 2-cell | cut off by strikes a SD round | of them with food on % | with a snake on % | SD length | SD meals a snake-minute | SD hunger warning % | SD starved % of SD deaths |
|---|---|---|---|---|---|---|---|---|---|---|
| base | 2.31 / 0.47 | 0.05 | 2.76 / 0.56 | 3.32 | 7 | 4.8 | 52 | 15 | 28.3 | 2.5 |
| Ws | 0 / 0 | 0 | 0 / 0 | 0 |  |  | 53 | 15.6 | 27.4 | 1.6 |
| Pfull | 0 / 0 | 0 | 0 / 0 | 0 |  |  | 55 | 15.7 | 21.8 | 1.5 |
| Pfull2 | 0 / 0 | 0 | 0 / 0 | 0 |  |  | 51 | 16.1 | 22.2 | 1.7 |
| PfullL | 0 / 0 | 0 | 0 / 0 | 0 |  |  | 52 | 17 | 20.2 | 1.7 |

### Hole shapes

| variant | strikes a SD | cells a strike | perimeter / least perimeter (1 = square-ish) | spur cells a strike | one-wide corridor cells a strike | strikes with a spur % | hollows 5 s before the end | their rim / least rim | land teeth (3+ sides hole or edge) | hole spur cells | SD length | islands (5+) | tiny islands 1 / 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| base | 17.2 | 14.3 | 1.33 | 2.01 | 0.33 | 92.5 | 3.1 | 1.61 | 13.6 | 10.9 | 52 | 2.15 | 2.31 / 0.47 |
| Ws | 17.4 | 18.2 | 1.19 | 0.72 | 0.23 | 51 | 2.4 | 1.11 | 1.6 | 0.1 | 53 | 2.2 | 0 / 0 |
| Pfull | 18.6 | 18.4 | 1.19 | 0.73 | 0.25 | 51.4 | 2.3 | 1.1 | 1.9 | 0.1 | 55 | 2.29 | 0 / 0 |
| Pfull2 | 18.8 | 18.4 | 1.19 | 0.74 | 0.23 | 51.8 | 2.3 | 1.1 | 2 | 0.1 | 51 | 2.33 | 0 / 0 |
| PfullL | 17.5 | 18.2 | 1.19 | 0.7 | 0.22 | 50.2 | 2.5 | 1.1 | 1.6 | 0.1 | 52 | 2.08 | 0 / 0 |

### Meals by kind, a snake-minute (0-45 s; 45 s to SD; SD)

| variant | 0-45 s | 45 s-SD | SD |
|---|---|---|---|
| base | apple 16.2, pellet 1, golden 0.7, beetle 0.3, leaf 0.1, goldcap 0.1 | apple 14.9, pellet 4.6, golden 0.7, beetle 0.6, leaf 0.1, goldcap 0.1, baked 0 | pellet 12.1, apple 2.6, beetle 0.1, golden 0.1, goldcap 0, leaf 0 |
| Ws | apple 16.2, pellet 1, golden 0.7, beetle 0.3, leaf 0.1, goldcap 0.1 | apple 14.9, pellet 4.6, golden 0.7, beetle 0.6, leaf 0.1, goldcap 0.1, baked 0 | pellet 12.7, apple 2.6, beetle 0.1, golden 0, goldcap 0, leaf 0 |
| Pfull | apple 11.9, pellet 0.7, beetle 0.7, golden 0.6, leaf 0.1, goldcap 0.1 | apple 11.1, pellet 4, beetle 1.5, golden 0.7, leaf 0.1, goldcap 0.1, baked 0 | pellet 11.6, apple 2.3, beetle 1.7, golden 0, goldcap 0, leaf 0 |
| Pfull2 | apple 11.9, pellet 0.7, beetle 0.7, golden 0.6, leaf 0.1, goldcap 0.1 | apple 11.1, pellet 4, beetle 1.5, golden 0.7, leaf 0.1, goldcap 0.1, baked 0 | pellet 12, apple 2.3, beetle 1.6, golden 0.1, goldcap 0, leaf 0 |
| PfullL | apple 13.1, pellet 0.8, beetle 0.7, golden 0.7, leaf 0.1, goldcap 0.1 | apple 11.9, pellet 4.1, beetle 1.6, golden 0.7, goldcap 0.1, leaf 0.1, baked 0 | pellet 12.5, apple 2.4, beetle 2, golden 0, goldcap 0, leaf 0 |
