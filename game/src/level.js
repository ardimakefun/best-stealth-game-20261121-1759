// Moonlight Gallery: the level itself. One room split by a wall with a single
// door, display cases and planters as cover, the Moon Opal on its pedestal in
// the north gallery, the exit in the south-west corner, and three guards on
// patrol loops a player can learn.
//
// Every blocker is an axis-aligned rectangle: walls, cases and planters all
// block movement and a guard's line of sight, so hiding behind one is real.

export const WALL = 20;

/** Rects that block movement and sight: {x, y, w, h, kind}. */
export function buildBlockers() {
  const walls = [
    // Outer frame.
    { x: 0, y: 0, w: 1280, h: WALL, kind: 'wall' },
    { x: 0, y: 700, w: 1280, h: WALL, kind: 'wall' },
    { x: 0, y: 0, w: WALL, h: 720, kind: 'wall' },
    { x: 1260, y: 0, w: WALL, h: 720, kind: 'wall' },
    // Middle wall, with one door gap (x 880..1000) between the galleries.
    { x: 20, y: 350, w: 860, h: WALL, kind: 'wall' },
    { x: 1000, y: 350, w: 260, h: WALL, kind: 'wall' },
  ];
  const cases = [
    // North gallery display cases.
    { x: 280, y: 140, w: 90, h: 50, kind: 'case' },
    { x: 910, y: 140, w: 90, h: 50, kind: 'case' },
    { x: 560, y: 240, w: 160, h: 50, kind: 'case' },
    // South hall display cases.
    { x: 200, y: 470, w: 90, h: 50, kind: 'case' },
    { x: 990, y: 470, w: 90, h: 50, kind: 'case' },
    { x: 560, y: 560, w: 160, h: 50, kind: 'case' },
  ];
  const planters = [
    { x: 150, y: 270, w: 60, h: 60, kind: 'planter' },
    { x: 1070, y: 270, w: 60, h: 60, kind: 'planter' },
    { x: 150, y: 610, w: 60, h: 60, kind: 'planter' },
    { x: 1070, y: 610, w: 60, h: 60, kind: 'planter' },
  ];
  return [...walls, ...cases, ...planters];
}

/** Hiding spots the simulation proved no guard's cone ever reaches: behind
 * cover, or out of every patrol lane's range and angle. */
export const HIDE_SPOTS = [
  { x: 1150, y: 640 },
  { x: 120, y: 640 },
  { x: 120, y: 500 },
  { x: 1160, y: 520 },
  { x: 400, y: 160 },
];

/** The thief's route to a clean getaway: loot, the Opal, then the exit. */
export const WIN_ROUTE = [
  { x: 640, y: 650 },
  { x: 940, y: 420 },
  { x: 940, y: 330 },
  { x: 640, y: 120 },
  { x: 940, y: 400 },
  { x: 70, y: 660 },
];

export const LEVEL = {
  spawn: { x: 1150, y: 640 },
  opal: { x: 640, y: 108 },
  loot: [
    { x: 120, y: 90, taken: false },
    { x: 1160, y: 90, taken: false },
    { x: 640, y: 650, taken: false },
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
};
