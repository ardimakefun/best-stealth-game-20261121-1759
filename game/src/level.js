// Moonlight Gallery: five heists in one museum, each a level of its own.
// Every heist is a room (or two) the thief crosses top-down: blockers that
// stop movement and sight, guards on patrol loops a player can learn,
// cameras sweeping their cones, laser tripwires that pulse live and dark,
// loot to grab, one great artifact to steal, and the green exit in the
// south-west corner, reached unseen.
//
// Heist 1, The Moon Opal, is the gallery the first build proved winnable;
// heist 2 adds two cameras and three more guards to a vault hall; heist 3,
// the cellar, is tighter still, with five guards, two cameras and a guard
// who patrols straight through the door between the halls; heist 4, the
// Crown Vault, is the hardest hall: six guards, two cameras, two lasers;
// heist 5, the Crimson Vault, mirrors the Crown Vault's geometry east for
// west — same two-door wall, same cover — but the patrols run the other
// way, the door guard walks the east gap, and the second camera watches
// from the west wall, so the timing a player learned in heist 4 does not
// carry over untouched.
//
// Every blocker is an axis-aligned rectangle: walls, cases, planters and
// pillars all block movement and a guard's line of sight, so hiding behind
// one is real. Guard waypoint legs never cross a blocker: a guard that
// walked through a wall would look broken and its cone would lie. Laser
// beams span door gaps and lanes the thief must cross on the dark beat —
// never the only way through, and always with an off window.

export const WALL = 20;

function frame() {
  return [
    { x: 0, y: 0, w: 1280, h: WALL, kind: 'wall' },
    { x: 0, y: 700, w: 1280, h: WALL, kind: 'wall' },
    { x: 0, y: 0, w: WALL, h: 720, kind: 'wall' },
    { x: 1260, y: 0, w: WALL, h: 720, kind: 'wall' },
  ];
}

/** Rects that block movement and sight: {x, y, w, h, kind}. */
export function buildBlockers(level) {
  return [...frame(), ...level.walls, ...level.cases, ...level.planters, ...(level.pillars ?? [])];
}

export const LEVELS = [
  {
    name: 'The Moon Opal',
    subtitle: 'North Gallery — three guards, one camera, one laser',
    artifact: { name: 'MOON OPAL', x: 640, y: 108 },
    spawn: { x: 1150, y: 640 },
    loot: [
      { x: 120, y: 90, taken: false },
      { x: 1160, y: 90, taken: false },
      { x: 640, y: 650, taken: false },
      // Two more gems for the second pass: the south-west corner Ivo
      // rarely looks at, and the north-east corner under Mara's line.
      { x: 320, y: 650, taken: false },
      { x: 980, y: 90, taken: false },
    ],
    guards: [
      {
        name: 'Mara',
        waypoints: [
          { x: 200, y: 100 },
          { x: 1080, y: 100 },
          { x: 1080, y: 300 },
          { x: 200, y: 300 },
        ],
      },
      {
        name: 'Ivo',
        waypoints: [
          { x: 940, y: 420 },
          { x: 940, y: 660 },
          { x: 400, y: 660 },
          { x: 400, y: 420 },
        ],
      },
      {
        name: 'Sena',
        waypoints: [
          { x: 300, y: 460 },
          { x: 980, y: 460 },
        ],
      },
    ],
    cameras: [
      { name: 'CAM A', x: 640, y: 24, baseAngle: Math.PI / 2, sweepAmp: 0.7, sweepSpeed: 0.45, phase: 0.4 },
    ],
    // One tripwire across the single door gap: the thief crosses it on the
    // dark beat, or spends an EMP on it.
    lasers: [
      { name: 'LASER 1', x1: 880, y1: 360, x2: 1000, y2: 360, phase: 0 },
    ],
    // Middle wall, with one door gap (x 880..1000) between the galleries.
    walls: [
      { x: 20, y: 350, w: 860, h: WALL, kind: 'wall' },
      { x: 1000, y: 350, w: 260, h: WALL, kind: 'wall' },
    ],
    cases: [
      { x: 280, y: 140, w: 90, h: 50, kind: 'case' },
      { x: 910, y: 140, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 240, w: 160, h: 50, kind: 'case' },
      { x: 200, y: 470, w: 90, h: 50, kind: 'case' },
      { x: 990, y: 470, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 560, w: 160, h: 50, kind: 'case' },
    ],
    planters: [
      { x: 150, y: 270, w: 60, h: 60, kind: 'planter' },
      { x: 1070, y: 270, w: 60, h: 60, kind: 'planter' },
      { x: 150, y: 610, w: 60, h: 60, kind: 'planter' },
      { x: 1070, y: 610, w: 60, h: 60, kind: 'planter' },
    ],
    pillars: [],
    /** Hiding spots the simulation proved no guard's cone, camera or
     *  laser ever reaches. The (1160,520) spot the first build used is
     *  gone: Runa's east lane sees it from her west end. */
    hideSpots: [
      { x: 1150, y: 640 },
      { x: 120, y: 640 },
      { x: 120, y: 500 },
      { x: 1240, y: 440 },
      { x: 400, y: 160 },
    ],
    /** The thief's route to a clean getaway: loot, the Opal, then the exit. */
    winRoute: [
      { x: 640, y: 650 },
      { x: 940, y: 420 },
      { x: 940, y: 330 },
      { x: 640, y: 120 },
      { x: 940, y: 400 },
      { x: 70, y: 660 },
    ],
  },
  {
    name: 'The Star Sapphire',
    subtitle: 'Vault Hall — six guards, two cameras',
    artifact: { name: 'STAR SAPPHIRE', x: 640, y: 80 },
    spawn: { x: 1200, y: 640 },
    loot: [
      { x: 120, y: 90, taken: false },
      { x: 1160, y: 90, taken: false },
      { x: 320, y: 650, taken: false },
      { x: 960, y: 650, taken: false },
      // North of the (560,580) case — the gem used to sit inside that
      // case, 31 px from the nearest standable point, 1 px past the
      // 30 px pickup radius: unreachable, and the pilot stalled on it.
      { x: 640, y: 560, taken: false },
    ],
    guards: [
      {
        name: 'Dara',
        waypoints: [
          { x: 200, y: 170 },
          { x: 1080, y: 170 },
          { x: 1080, y: 300 },
          { x: 200, y: 300 },
        ],
      },
      {
        name: 'Raka',
        waypoints: [
          { x: 300, y: 660 },
          { x: 900, y: 660 },
          { x: 900, y: 460 },
          { x: 300, y: 460 },
        ],
      },
      {
        name: 'Nia',
        waypoints: [
          { x: 1100, y: 150 },
          { x: 1100, y: 320 },
        ],
      },
      {
        name: 'Sari',
        waypoints: [
          { x: 1100, y: 400 },
          { x: 1100, y: 600 },
        ],
      },
      {
        name: 'Bima',
        waypoints: [
          { x: 210, y: 150 },
          { x: 210, y: 320 },
        ],
      },
      {
        name: 'Agus',
        waypoints: [
          { x: 210, y: 400 },
          { x: 210, y: 600 },
        ],
      },
    ],
    cameras: [
      { name: 'CAM A', x: 640, y: 24, baseAngle: Math.PI / 2, sweepAmp: 0.7, sweepSpeed: 0.45, phase: 0 },
      { name: 'CAM B', x: 1256, y: 360, baseAngle: Math.PI, sweepAmp: 0.7, sweepSpeed: 0.5, phase: 1.3 },
    ],
    // A tripwire across each door gap, staggered: the west one guards the
    // route the pilot takes, the east one the way back.
    lasers: [
      { name: 'LASER 1', x1: 420, y1: 360, x2: 520, y2: 360, phase: 0 },
      { name: 'LASER 2', x1: 880, y1: 360, x2: 1000, y2: 360, phase: 2.0 },
    ],
    // Middle wall, with two door gaps (x 420..520 and x 880..1000).
    walls: [
      { x: 20, y: 350, w: 400, h: WALL, kind: 'wall' },
      { x: 520, y: 350, w: 360, h: WALL, kind: 'wall' },
      { x: 1000, y: 350, w: 260, h: WALL, kind: 'wall' },
    ],
    cases: [
      { x: 340, y: 120, w: 90, h: 50, kind: 'case' },
      { x: 820, y: 120, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 250, w: 160, h: 50, kind: 'case' },
      { x: 240, y: 500, w: 90, h: 50, kind: 'case' },
      { x: 940, y: 500, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 580, w: 160, h: 50, kind: 'case' },
    ],
    planters: [
      { x: 120, y: 300, w: 60, h: 60, kind: 'planter' },
      { x: 1120, y: 300, w: 60, h: 60, kind: 'planter' },
      { x: 120, y: 580, w: 60, h: 60, kind: 'planter' },
      { x: 1120, y: 580, w: 60, h: 60, kind: 'planter' },
    ],
    pillars: [],
    /** Hiding spots the simulation proved no guard's cone or camera ever
     *  reaches (180 s standing still, meter 0): the pilot retreats here. */
    hideSpots: [
      { x: 1200, y: 640 },
      { x: 40, y: 400 },
      { x: 480, y: 80 },
      { x: 960, y: 120 },
      { x: 760, y: 560 },
      { x: 40, y: 560 },
      { x: 1000, y: 440 },
    ],
    /** The thief's route to a clean getaway: loot, the Sapphire, then the
     *  exit. The (640,560) gem is approached from the north, through the
     *  west door gap — walking in along Raka's south leg gets the thief
     *  seen, as the pilot proved. */
    winRoute: [
      { x: 960, y: 650 },
      { x: 470, y: 380 },
      { x: 640, y: 560 },
      { x: 640, y: 80 },
      { x: 120, y: 90 },
      { x: 1160, y: 90 },
      { x: 940, y: 400 },
      { x: 70, y: 660 },
    ],
  },
  {
    name: 'The Gilded Idol',
    subtitle: 'Cellar — five guards, two cameras, one door guard',
    artifact: { name: 'GILDED IDOL', x: 640, y: 100 },
    spawn: { x: 1160, y: 680 },
    loot: [
      { x: 120, y: 90, taken: false },
      { x: 1160, y: 90, taken: false },
      { x: 300, y: 650, taken: false },
      { x: 980, y: 650, taken: false },
    ],
    guards: [
      {
        name: 'Vera',
        waypoints: [
          { x: 150, y: 120 },
          { x: 1130, y: 120 },
          { x: 1130, y: 300 },
          { x: 150, y: 300 },
        ],
      },
      {
        name: 'Tomas',
        waypoints: [
          { x: 150, y: 620 },
          { x: 1130, y: 620 },
          { x: 1130, y: 450 },
          { x: 150, y: 450 },
        ],
      },
      {
        name: 'Lena',
        waypoints: [
          { x: 1150, y: 150 },
          { x: 1150, y: 320 },
        ],
      },
      {
        name: 'Oskar',
        waypoints: [
          { x: 130, y: 150 },
          { x: 130, y: 320 },
        ],
      },
      {
        // Mira patrols straight through the one door between the halls.
        name: 'Mira',
        waypoints: [
          { x: 620, y: 200 },
          { x: 680, y: 200 },
          { x: 680, y: 520 },
          { x: 620, y: 520 },
        ],
      },
    ],
    cameras: [
      { name: 'CAM A', x: 24, y: 360, baseAngle: 0, sweepAmp: 0.7, sweepSpeed: 0.5, phase: 0.6 },
      { name: 'CAM B', x: 1256, y: 360, baseAngle: Math.PI, sweepAmp: 0.7, sweepSpeed: 0.45, phase: 2.1 },
    ],
    // One tripwire across the single door gap, and one across the south
    // hall the pilot must cross to reach the door.
    lasers: [
      { name: 'LASER 1', x1: 600, y1: 360, x2: 700, y2: 360, phase: 1.0 },
      { name: 'LASER 2', x1: 380, y1: 520, x2: 700, y2: 520, phase: 2.5 },
    ],
    // Middle wall, with one door gap (x 600..700).
    walls: [
      { x: 20, y: 350, w: 580, h: WALL, kind: 'wall' },
      { x: 700, y: 350, w: 560, h: WALL, kind: 'wall' },
    ],
    cases: [
      { x: 280, y: 140, w: 90, h: 50, kind: 'case' },
      { x: 900, y: 140, w: 90, h: 50, kind: 'case' },
      { x: 340, y: 250, w: 90, h: 50, kind: 'case' },
      { x: 850, y: 250, w: 90, h: 50, kind: 'case' },
      { x: 200, y: 470, w: 90, h: 50, kind: 'case' },
      { x: 990, y: 470, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 560, w: 160, h: 50, kind: 'case' },
    ],
    planters: [
      { x: 60, y: 270, w: 60, h: 60, kind: 'planter' },
      { x: 1050, y: 270, w: 60, h: 60, kind: 'planter' },
      // North of the exit, not above it: the planter used to sit at
      // (60,610), directly over the exit, and its expanded footprint
      // blocked all eight grid cells around the (70,660) exit point —
      // the pilot's A* could never step into the exit at all.
      { x: 60, y: 540, w: 60, h: 60, kind: 'planter' },
      { x: 1050, y: 610, w: 60, h: 60, kind: 'planter' },
    ],
    pillars: [
      { x: 300, y: 200, w: 60, h: 60, kind: 'pillar' },
      { x: 920, y: 200, w: 60, h: 60, kind: 'pillar' },
      { x: 300, y: 480, w: 60, h: 60, kind: 'pillar' },
      { x: 920, y: 480, w: 60, h: 60, kind: 'pillar' },
    ],
    /** Hiding spots the simulation proved no guard's cone or camera ever
     *  reaches (180 s standing still, meter 0): the pilot retreats here.
     *  The cellar is tight — only a handful of such spots exist. */
    hideSpots: [
      { x: 1160, y: 680 },
      { x: 40, y: 280 },
      { x: 40, y: 320 },
      { x: 400, y: 160 },
      { x: 1040, y: 200 },
      { x: 240, y: 560 },
    ],
    winRoute: [
      { x: 980, y: 650 },
      { x: 300, y: 650 },
      { x: 650, y: 380 },
      { x: 640, y: 100 },
      { x: 120, y: 90 },
      { x: 1160, y: 90 },
      { x: 650, y: 400 },
      { x: 70, y: 660 },
    ],
  },
  {
    name: 'The Obsidian Crown',
    subtitle: 'Crown Vault — six guards, two cameras, two lasers',
    artifact: { name: 'OBSIDIAN CROWN', x: 640, y: 90 },
    spawn: { x: 1200, y: 650 },
    loot: [
      { x: 120, y: 90, taken: false },
      { x: 1160, y: 90, taken: false },
      { x: 300, y: 650, taken: false },
      { x: 980, y: 650, taken: false },
      // North of the (560,600) case: 20 px clear of it, inside the
      // 30 px pickup radius from the north side.
      { x: 640, y: 580, taken: false },
    ],
    guards: [
      {
        name: 'Kara',
        waypoints: [
          { x: 200, y: 120 },
          { x: 1080, y: 120 },
          { x: 1080, y: 300 },
          { x: 200, y: 300 },
        ],
      },
      {
        name: 'Dimo',
        waypoints: [
          { x: 940, y: 440 },
          { x: 940, y: 660 },
          { x: 400, y: 660 },
          { x: 400, y: 440 },
        ],
      },
      {
        name: 'Yara',
        waypoints: [
          { x: 1150, y: 160 },
          { x: 1150, y: 330 },
        ],
      },
      {
        name: 'Elif',
        waypoints: [
          { x: 130, y: 160 },
          { x: 130, y: 330 },
        ],
      },
      {
        name: 'Noor',
        waypoints: [
          { x: 300, y: 480 },
          { x: 980, y: 480 },
        ],
      },
      {
        // Petr patrols straight through the west door gap, like Mira in
        // the cellar: his vertical legs sit at x 450 and 490, inside the
        // 420..520 gap, never through the wall.
        name: 'Petr',
        waypoints: [
          { x: 450, y: 220 },
          { x: 490, y: 220 },
          { x: 490, y: 540 },
          { x: 450, y: 540 },
        ],
      },
    ],
    cameras: [
      { name: 'CAM A', x: 640, y: 24, baseAngle: Math.PI / 2, sweepAmp: 0.7, sweepSpeed: 0.4, phase: 0.9 },
      { name: 'CAM B', x: 1256, y: 360, baseAngle: Math.PI, sweepAmp: 0.7, sweepSpeed: 0.55, phase: 2.4 },
    ],
    // A tripwire across each door gap, phased so both are live at the
    // five-second mark of the start shot.
    lasers: [
      { name: 'LASER 1', x1: 420, y1: 360, x2: 520, y2: 360, phase: 0.5 },
      { name: 'LASER 2', x1: 880, y1: 360, x2: 1000, y2: 360, phase: 1.0 },
    ],
    // Middle wall, with two door gaps (x 420..520 and x 880..1000).
    walls: [
      { x: 20, y: 350, w: 400, h: WALL, kind: 'wall' },
      { x: 520, y: 350, w: 360, h: WALL, kind: 'wall' },
      { x: 1000, y: 350, w: 260, h: WALL, kind: 'wall' },
    ],
    cases: [
      { x: 340, y: 140, w: 90, h: 50, kind: 'case' },
      { x: 820, y: 140, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 230, w: 160, h: 50, kind: 'case' },
      { x: 240, y: 520, w: 90, h: 50, kind: 'case' },
      { x: 1000, y: 520, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 600, w: 160, h: 50, kind: 'case' },
    ],
    planters: [
      { x: 60, y: 300, w: 60, h: 60, kind: 'planter' },
      { x: 1160, y: 300, w: 60, h: 60, kind: 'planter' },
      { x: 120, y: 580, w: 60, h: 60, kind: 'planter' },
      { x: 1120, y: 580, w: 60, h: 60, kind: 'planter' },
    ],
    pillars: [
      { x: 300, y: 200, w: 60, h: 60, kind: 'pillar' },
      { x: 920, y: 200, w: 60, h: 60, kind: 'pillar' },
      { x: 300, y: 560, w: 60, h: 60, kind: 'pillar' },
    ],
    /** Hiding spots, every one a grid point the safe-spot scan proved no
     *  guard's cone, camera or laser ever reaches (180 s standing still,
     *  meter 0): the west wall, the east wall, the north-east corner, and
     *  the spawn. The first draft's (760,560), (1000,440) and (960,120)
     *  all failed the scan and are gone. */
    hideSpots: [
      { x: 1200, y: 650 },
      { x: 40, y: 400 },
      { x: 40, y: 560 },
      { x: 1240, y: 400 },
      { x: 1000, y: 200 },
      { x: 200, y: 560 },
    ],
    /** The thief's route to a clean getaway: the south gems, the west
     *  door, the Crown's gem, the Crown, back through the west door,
     *  then the exit. Both door crossings use the west door the pilot
     *  already proved: the east door's waiting spot sits in Kara's cone
     *  arc and the pilot died there at 84 s. The north gems at (120,90)
     *  and (1160,90) are left for the player: the heist is winnable,
     *  the gems are a dare, not the route. */
    winRoute: [
      { x: 980, y: 650 },
      { x: 470, y: 380 },
      { x: 640, y: 580 },
      { x: 640, y: 90 },
      { x: 470, y: 380 },
      { x: 70, y: 660 },
    ],
  },
  {
    name: 'The Crimson Vault',
    subtitle: 'Crimson Vault — six guards, two cameras, two lasers',
    artifact: { name: 'CRIMSON RUBY', x: 640, y: 90 },
    spawn: { x: 1200, y: 650 },
    loot: [
      { x: 1160, y: 90, taken: false },
      { x: 120, y: 90, taken: false },
      { x: 980, y: 650, taken: false },
      { x: 300, y: 650, taken: false },
      // North of the (560,600) case: 20 px clear of it, inside the
      // 30 px pickup radius from the north side.
      { x: 640, y: 580, taken: false },
    ],
    guards: [
      {
        name: 'Sable',
        // East-first around the north loop, like Kara in the Crown
        // Vault: the pilot proved that timing, and the reversed loop
        // killed it in the north hall (the pilot died at (534,185)
        // retreating west while Sable came south on the west side).
        waypoints: [
          { x: 200, y: 120 },
          { x: 1080, y: 120 },
          { x: 1080, y: 300 },
          { x: 200, y: 300 },
        ],
      },
      {
        name: 'Rufus',
        waypoints: [
          { x: 340, y: 440 },
          { x: 340, y: 660 },
          { x: 880, y: 660 },
          { x: 880, y: 440 },
        ],
      },
      {
        name: 'Ilsa',
        waypoints: [
          { x: 130, y: 160 },
          { x: 130, y: 330 },
        ],
      },
      {
        name: 'Otto',
        waypoints: [
          { x: 1150, y: 160 },
          { x: 1150, y: 330 },
        ],
      },
      {
        name: 'Cleo',
        waypoints: [
          { x: 980, y: 480 },
          { x: 300, y: 480 },
        ],
      },
      {
        // Boris patrols straight through the east door gap, like Petr in
        // the Crown Vault walks the west one: his vertical legs sit at
        // x 790 and 830, inside the 760..860 gap, never through the wall.
        name: 'Boris',
        waypoints: [
          { x: 830, y: 220 },
          { x: 790, y: 220 },
          { x: 790, y: 540 },
          { x: 830, y: 540 },
        ],
      },
    ],
    cameras: [
      { name: 'CAM A', x: 640, y: 24, baseAngle: Math.PI / 2, sweepAmp: 0.7, sweepSpeed: 0.4, phase: 0.9 },
      { name: 'CAM B', x: 24, y: 360, baseAngle: 0, sweepAmp: 0.7, sweepSpeed: 0.55, phase: 2.4 },
    ],
    // A tripwire across each door gap: the east one guards the route the
    // pilot takes, the west one the way back.
    lasers: [
      { name: 'LASER 1', x1: 760, y1: 360, x2: 860, y2: 360, phase: 0.5 },
      { name: 'LASER 2', x1: 280, y1: 360, x2: 400, y2: 360, phase: 1.0 },
    ],
    // Middle wall, with two door gaps (x 280..400 and x 760..860).
    walls: [
      { x: 860, y: 350, w: 400, h: WALL, kind: 'wall' },
      { x: 400, y: 350, w: 360, h: WALL, kind: 'wall' },
      { x: 20, y: 350, w: 260, h: WALL, kind: 'wall' },
    ],
    cases: [
      { x: 850, y: 140, w: 90, h: 50, kind: 'case' },
      { x: 370, y: 140, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 230, w: 160, h: 50, kind: 'case' },
      { x: 950, y: 520, w: 90, h: 50, kind: 'case' },
      { x: 190, y: 520, w: 90, h: 50, kind: 'case' },
      { x: 560, y: 600, w: 160, h: 50, kind: 'case' },
    ],
    planters: [
      { x: 1160, y: 300, w: 60, h: 60, kind: 'planter' },
      { x: 60, y: 300, w: 60, h: 60, kind: 'planter' },
      { x: 1100, y: 580, w: 60, h: 60, kind: 'planter' },
      { x: 100, y: 580, w: 60, h: 60, kind: 'planter' },
    ],
    pillars: [
      { x: 920, y: 200, w: 60, h: 60, kind: 'pillar' },
      { x: 300, y: 200, w: 60, h: 60, kind: 'pillar' },
      { x: 920, y: 560, w: 60, h: 60, kind: 'pillar' },
    ],
    /** Hiding spots: the Crown Vault's spots mirrored east for west, plus
     *  the spawn. The safe-spot scan decides which of these the pilot
     *  may actually wait on — a mirrored spot is not safe until the scan
     *  proves it against this heist's patrols. The (280,200) draft spot
     *  failed the scan (Sable's north loop sees it, meter 13.5) and was
     *  replaced by (40,320) on the west wall, which the grid scan proved
     *  safe. */
    hideSpots: [
      { x: 80, y: 650 },
      { x: 1240, y: 400 },
      { x: 1240, y: 560 },
      { x: 40, y: 400 },
      { x: 40, y: 320 },
      { x: 1080, y: 560 },
      { x: 1200, y: 650 },
    ],
    /** The thief's route to a clean getaway: the south gem, the west
     *  door, the Ruby's gem, the west door again, the Ruby, back to the
     *  west door, then the exit. Every wall crossing uses the WEST door
     *  (340,380): the east door is Boris's beat, and the Crown Vault
     *  proved the east door's waiting spot sits in the north guard's
     *  cone arc — the first draft of this route died there at 52.7 s.
     *  The north gems at (120,90) and (1160,90) are left for the player:
     *  the heist is winnable, the gems are a dare, not the route. */
    winRoute: [
      { x: 980, y: 650 },
      { x: 340, y: 380 },
      { x: 640, y: 580 },
      { x: 340, y: 380 },
      { x: 640, y: 90 },
      { x: 340, y: 380 },
      { x: 70, y: 660 },
    ],
  },
];

/** The first heist, for code that only ever looks at one level. */
export const LEVEL = LEVELS[0];
export const HIDE_SPOTS = LEVELS[0].hideSpots;
export const WIN_ROUTE = LEVELS[0].winRoute;
