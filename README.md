[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/ardimakefun/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/ardimakefun/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Moonlight Gallery — a stealth game

A top-down stealth game in a museum at night, for the make.fun bounty
[Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759).

**The job:** steal the Moon Opal from the north gallery, then reach the
green EXIT unseen. Three guards — Mara, Ivo and Sena — walk patrol loops
with wide yellow vision cones. Display cases and planters block sight as
well as movement, so the route is patience: watch a cone sweep past, slip
behind cover, and cross while the guard looks away.

**The stakes:** a detection meter fills while any guard sees you and
drains while you stay hidden. At 55% a guard breaks off to investigate
where he last saw you; at 100% you are caught and the alarm rings. Grab
the three loot gems on the way for points, sprint with Shift when a lane
is clear, and mind the clock — a clean getaway scores a time bonus.

**The game:** pure HTML5 + JavaScript, static files under `game/`, no
network, no dependencies. Open `game/index.html` in a desktop browser.

```sh
# play it locally
node serve.ts --port 8080
# then open http://127.0.0.1:8080/
```

**Controls:** WASD / arrows to move, Shift to sprint, click to walk to a
spot, Space / Enter to confirm, P / Esc to pause, M to mute. Sound is
synthesised in the browser (footsteps, guard steps, loot, alarm) and stays
silent until your first key press or click.

**The program:** `main.ts` (Node 22, standard library only) copies
`game/` and `screenshots/` to `/output` and writes `/output/dossier.json`
with the kit's `buildDossier`. The four screenshots are real renders of
the game's own code, staged with `?shot=start|play|caught|end&seed=1`:
the full level at patrol, the thief mid-gallery with the Opal secured,
the caught screen, and the clean getaway.

**Verified:** the careful autopilot (`game/src/pilot.js`) wins the level
in 41 seconds of game time (1,950 points: 1 gem, the Opal, clean getaway)
with the detection meter peaking at 30; the reckless autopilot is caught
in 3 seconds. No console errors in headless Chromium; all 12 game
modules load over plain HTTP.
