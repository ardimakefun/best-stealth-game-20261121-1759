// Moonlight Gallery: every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 11,
  speed: 168,
  /** Pixels a guard must be within to hear a sprint; walking is silent. */
  sprintSpeed: 236,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 72,
  investigateSpeed: 96,
  /** Seconds a guard waits at each waypoint before walking on. */
  waitAtWaypoint: 0.9,
  /** Seconds a guard studies the last-seen spot before giving up. */
  investigateTime: 2.2,
  coneRange: 232,
  /** Half-angle of the vision cone, in radians. */
  coneHalfAngle: 0.56,
};

/** Detection meter: 0 hidden, 100 caught. */
export const DETECTION = {
  fillPerSecond: 58,
  drainPerSecond: 34,
  /** Above this the guard leaves patrol to investigate the last-seen spot. */
  investigateAt: 55,
  /** Below this the guard gives up and the meter keeps draining. */
  giveUpBelow: 8,
};

export const LOOT = { radius: 10, pickupRadius: 30, points: 150 };
export const OPAL = { radius: 12, pickupRadius: 34, points: 500 };
export const EXIT = { x: 20, y: 618, width: 100, height: 82 };

export const PALETTE = {
  backdrop: '#0b0e16',
  floor: '#171b28',
  floorAlt: '#1a1f30',
  carpet: '#3d1f2b',
  carpetEdge: '#6b3244',
  wall: '#2c3247',
  wallTop: '#4a5470',
  caseGlass: '#223349',
  caseTrim: '#c9a24b',
  planter: '#1d3a24',
  planterLeaf: '#2f6b3a',
  opal: '#7fe7ff',
  loot: '#ffd34d',
  exit: '#39d98a',
  exitDark: '#1d7a4c',
  guard: '#c94f4f',
  guardCap: '#e8dcc8',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneEdge: 'rgba(255, 214, 90, 0.45)',
  coneAlert: 'rgba(255, 92, 60, 0.28)',
  coneAlertEdge: 'rgba(255, 92, 60, 0.6)',
  player: '#3fd2c0',
  playerHood: '#0f3d38',
  text: '#eef1f5',
  muted: '#9aa3b5',
  danger: '#ff5c3c',
  gold: '#c9a24b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best clear time is kept between visits (this browser only). */
export const BEST_KEY = 'moonlight-gallery.best';
