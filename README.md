[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/ardimakefun/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/ardimakefun/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Moonlight Gallery — a stealth game

A top-down stealth game in a museum at night, for the make.fun bounty
[Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759).

**The job:** five heists, one museum, one night. Steal the Moon Opal
from the North Gallery, the Star Sapphire from the Vault Hall, the
Gilded Idol from the Cellar, the Obsidian Crown from the Crown Vault,
and the Crimson Ruby from the Crimson Vault — then reach the green EXIT
unseen, five times over. Twenty-six guards walk patrol loops with wide
yellow vision cones — two of them in the Crimson Vault are elite
watchmen, faster on patrol with longer amber cones — nine wall cameras
sweep orange cones across the halls, and nine red laser tripwires pulse
live and dark across the doorways. Display cases, planters and pillars block sight as well as
movement, so the route is patience: watch a cone sweep past, cross a
laser on the dark beat, slip behind cover, and cross while the guard
looks away. Each heist is rated one to three stars — three only for
every gem and a ghost run, never seen at all — and a ghost heist pays
a 500-point bonus.

**The stakes:** a detection meter fills while any guard, camera or live
laser sees you and drains while you stay hidden. At 55% the nearest
guard breaks off to investigate where he last saw you; at 100% you are
caught and the alarm rings. Grab the loot gems on the way for points,
sprint with Shift when a lane is clear, and mind the clock — a clean
getaway scores a time bonus.

**The gadgets:** every heist refills the thief's kit — 2 smoke vials
(press 1 or Q: a cloud that blocks every line of sight for 4.5 seconds),
2 lures (press 2 or E: a ringing coin, thrown ahead or to the clicked
spot, that pulls nearby guards over to look), 2 EMP pulses (press 3
or R: every camera and laser within range goes dark for 6 seconds), and
2 camera loops (press 4 or T: the nearest camera's sweep freezes in
place for 8 seconds — its cone stays live, just still). The
HUD shows what is left; the count refills when the next heist starts.

**The game:** pure HTML5 + JavaScript, static files under `game/`, no
network, no dependencies. Open `game/index.html` in a desktop browser.

```sh
# play it locally
node serve.ts --port 8080
# then open http://127.0.0.1:8080/
```

**Controls:** WASD / arrows to move, Shift to sprint, click to walk to a
spot, 1 / Q smoke, 2 / E lure, 3 / R EMP, 4 / T camera loop, Space / Enter to confirm,
P / Esc to pause, M to mute. Sound is synthesised in the browser
(footsteps, guard steps, loot, alarm, smoke, lure, EMP, loop) and stays silent
until your first key press or click.

**The program:** `main.ts` (Node 22, standard library only) copies
`game/` and `screenshots/` to `/output` and writes `/output/dossier.json`
with the kit's `buildDossier`. The four screenshots are real renders of
the game's own code, staged with `?shot=start|play|gadget|end&seed=1`:
the Crimson Vault at patrol with both lasers live and both elite guards
(amber, starred) on their beats, the thief mid-heist in the Crimson
Vault with the lasers dark and 4 of 6 gems pocketed, a camera loop
freezing CAM B's cone in ice blue while a smoke vial hangs and a lure
pulls two guards off their route in the Vault Hall, and the clean
getaway after all five heists.

**Verified:** the careful autopilot (`game/src/pilot.js`) wins every
heist — the Moon Opal in 45 seconds (2,225 points, 3 of 7 gems), the Star
Sapphire in 115 seconds (2,325 points, all six gems), the Gilded Idol in
47 seconds (2,520 points, all five gems), the Obsidian Crown in 139
seconds (1,760 points, 3 of 6 gems), the Crimson Ruby in 80 seconds
(2,200 points, 4 of 6 gems) — and the whole campaign in 426 seconds
(11,030 points, 21 of 30 gems, 7 of 15 stars). The reckless autopilot is
caught in every heist (3, 2, 16, 7 and 10 seconds). The laser tripwires
were unit-checked: standing on a live beam fills the meter, the dark beat
leaves it at zero, and an EMP darkens a beam for 6 seconds. The camera
loop was unit-checked too: it freezes a camera's sweep at the angle it
had (the cone stays live — the meter climbs under a frozen cone), it
spends nothing out of reach or on a camera an EMP already darkened, and
the sweep resumes when the 8 seconds run out. Every hiding spot the
pilot retreats to was proven safe for 180 seconds of standing still. No
console errors in headless Chromium; all 16 game modules load over plain
HTTP.
