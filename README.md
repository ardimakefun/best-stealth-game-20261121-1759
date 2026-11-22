[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/ardimakefun/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/ardimakefun/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Moonlight Gallery — a stealth game

A top-down stealth game in a museum at night, for the make.fun bounty
[Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759).

**The job:** three heists, one museum, one night. Steal the Moon Opal
from the North Gallery, the Star Sapphire from the Vault Hall, and the
Gilded Idol from the Cellar — then reach the green EXIT unseen, three
times over. Fourteen guards walk patrol loops with wide yellow vision
cones, and four wall cameras sweep orange cones across the halls. Display
cases, planters and pillars block sight as well as movement, so the route
is patience: watch a cone sweep past, slip behind cover, and cross while
the guard looks away.

**The stakes:** a detection meter fills while any guard or camera sees
you and drains while you stay hidden. At 55% the nearest guard breaks
off to investigate where he last saw you; at 100% you are caught and the
alarm rings. Grab the loot gems on the way for points, sprint with Shift
when a lane is clear, and mind the clock — a clean getaway scores a time
bonus.

**The gadgets:** every heist refills the thief's kit — 2 smoke vials
(press 1 or Q: a cloud that blocks every line of sight for 4.5 seconds),
2 lures (press 2 or E: a ringing coin, thrown ahead or to the clicked
spot, that pulls nearby guards over to look), and 2 EMP pulses (press 3
or R: every camera within range goes dark for 6 seconds). The HUD shows
what is left; the count refills when the next heist starts.

**The game:** pure HTML5 + JavaScript, static files under `game/`, no
network, no dependencies. Open `game/index.html` in a desktop browser.

```sh
# play it locally
node serve.ts --port 8080
# then open http://127.0.0.1:8080/
```

**Controls:** WASD / arrows to move, Shift to sprint, click to walk to a
spot, 1 / Q smoke, 2 / E lure, 3 / R EMP, Space / Enter to confirm,
P / Esc to pause, M to mute. Sound is synthesised in the browser
(footsteps, guard steps, loot, alarm, smoke, lure, EMP) and stays silent
until your first key press or click.

**The program:** `main.ts` (Node 22, standard library only) copies
`game/` and `screenshots/` to `/output` and writes `/output/dossier.json`
with the kit's `buildDossier`. The four screenshots are real renders of
the game's own code, staged with `?shot=start|play|gadget|end&seed=1`:
the Cellar at patrol, the thief mid-heist in the Vault Hall with the
Sapphire secured, a smoke vial and a lure pulling a guard off his route,
and the clean getaway after all three heists.

**Verified:** the careful autopilot (`game/src/pilot.js`) wins every
heist — the Moon Opal in 34 seconds (1,980 points), the Star Sapphire in
63 seconds (2,435 points, all five gems), the Gilded Idol in 44 seconds
(2,380 points, all four gems) — and the whole campaign in 141 seconds
(6,795 points, 10 of 12 gems). The reckless autopilot is caught in every
heist (3, 2 and 16 seconds). Every hiding spot the pilot retreats to was
proven safe for 600 seconds of standing still. No console errors in
headless Chromium; all 15 game modules load over plain HTTP.
