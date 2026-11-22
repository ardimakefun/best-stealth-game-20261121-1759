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

/** Cameras: wall watchers with a sweeping cone. */
export const CAMERA = {
  range: 260,
  /** Half-angle of the camera cone, in radians. */
  halfAngle: 0.5,
  /** How far the cone swings from its base angle, in radians. */
  sweepAmp: 0.7,
  /** Radians a second the sweep advances. */
  sweepSpeed: 0.5,
  /** Seconds an EMP keeps a camera dark. */
  disabledSeconds: 6,
};

/** Gadgets: what the thief carries into every heist (refilled per heist). */
export const GADGETS = {
  smoke: 2,
  lure: 2,
  emp: 2,
  smokeRadius: 75,
  smokeSeconds: 4.5,
  /** Seconds a thrown lure keeps ringing. */
  lureSeconds: 2.5,
  /** Guards this far from a lure walk over to look at it. */
  lureRadius: 340,
  /** How far ahead of the thief a lure lands. */
  lureThrow: 170,
  /** Cameras this far from the thief go dark on an EMP. */
  empRadius: 300,
  empSeconds: 6,
};

/** Lasers: tripwire beams across a doorway or a lane. A beam is live for
 *  part of every cycle and dark for the rest, so a patient thief crosses
 *  on the dark beat; an EMP switches it off for a few seconds. */
export const LASER = {
  /** Distance (px) from the beam at which the thief trips it. */
  tripRadius: 14,
  /** Seconds the beam is live in each cycle. */
  onSeconds: 2.2,
  /** Seconds the beam is dark in each cycle. */
  offSeconds: 1.8,
  /** Seconds an EMP keeps a laser dark. */
  disabledSeconds: 6,
};

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
  camera: '#ff9f43',
  cameraLens: '#ffd166',
  cameraCone: 'rgba(255, 159, 67, 0.16)',
  cameraConeEdge: 'rgba(255, 159, 67, 0.5)',
  cameraOff: '#5a6274',
  laser: '#ff2e4d',
  laserEdge: 'rgba(255, 46, 77, 0.85)',
  laserOff: 'rgba(255, 46, 77, 0.18)',
  laserPost: '#ff5c3c',
  smoke: 'rgba(205, 210, 220, 0.30)',
  smokeEdge: 'rgba(205, 210, 220, 0.5)',
  pillar: '#262c3d',
  pillarTop: '#3d4560',
  pillarTrim: '#c9a24b',
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
