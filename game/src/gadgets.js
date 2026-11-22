// Gadgets: the thief's tools. Four of them, each limited per heist, each
// with an effect you can see on the screen:
// - smoke: a cloud that blocks every line of sight while it hangs;
// - lure: a thrown noisemaker guards walk over to investigate;
// - EMP: a pulse that switches off nearby cameras and laser tripwires for
//   a few seconds. It does not stop a guard's eyes.
// - loop: a camera loop that freezes the nearest camera's sweep in place
//   for a few seconds. The cone stays live, just still.
// Counts refill when a new heist starts. Nothing here moves the thief or
// the guards directly; the world applies each effect where it belongs.

import { GADGETS, LASER } from './config.js';
import { cameraFacing } from './cameras.js';

export function createGadgets() {
  return {
    smoke: GADGETS.smoke,
    lure: GADGETS.lure,
    emp: GADGETS.emp,
    loop: GADGETS.loop,
    /** {x, y, r, until} — sight cannot cross a cloud. */
    clouds: [],
    /** {x, y, until} — a ringing coin guards walk toward. */
    lures: [],
  };
}

/** Drop a smoke cloud at (x, y). Returns false when none are left. */
export function useSmoke(g, time, x, y) {
  if (g.smoke <= 0) return false;
  g.smoke -= 1;
  g.clouds.push({ x, y, r: GADGETS.smokeRadius, until: time + GADGETS.smokeSeconds });
  return true;
}

/** Throw a lure to (x, y). Returns the landing point, or null when none left. */
export function useLure(g, time, x, y) {
  if (g.lure <= 0) return null;
  g.lure -= 1;
  const lure = { x, y, until: time + GADGETS.lureSeconds };
  g.lures.push(lure);
  return lure;
}

/**
 * Fire the EMP at (x, y): every camera within range goes dark, and every
 * laser beam whose line passes within range goes dark too. Returns how
 * many devices it switched off (0 spends nothing).
 */
export function useEmp(g, time, x, y, cameras, lasers = []) {
  let hit = 0;
  for (const cam of cameras) {
    if (Math.hypot(cam.x - x, cam.y - y) <= GADGETS.empRadius) hit += 1;
  }
  for (const laser of lasers) {
    // The beam's nearer end, or its middle, inside the pulse radius.
    const mx = (laser.x1 + laser.x2) / 2;
    const my = (laser.y1 + laser.y2) / 2;
    const d = Math.min(
      Math.hypot(laser.x1 - x, laser.y1 - y),
      Math.hypot(laser.x2 - x, laser.y2 - y),
      Math.hypot(mx - x, my - y),
    );
    if (d <= GADGETS.empRadius) hit += 1;
  }
  if (hit === 0) return 0;
  g.emp -= 1;
  for (const cam of cameras) {
    if (Math.hypot(cam.x - x, cam.y - y) <= GADGETS.empRadius) {
      cam.disabledUntil = time + GADGETS.empSeconds;
    }
  }
  for (const laser of lasers) {
    const mx = (laser.x1 + laser.x2) / 2;
    const my = (laser.y1 + laser.y2) / 2;
    const d = Math.min(
      Math.hypot(laser.x1 - x, laser.y1 - y),
      Math.hypot(laser.x2 - x, laser.y2 - y),
      Math.hypot(mx - x, my - y),
    );
    if (d <= GADGETS.empRadius) {
      laser.disabledUntil = time + LASER.disabledSeconds;
    }
  }
  return hit;
}

/**
 * Loop the nearest live camera within reach of (x, y): its cone stops
 * sweeping and holds the angle it had when the loop landed, for
 * loopSeconds. Unlike an EMP it does not darken the camera — the cone
 * stays live, just still — so the thief must read where the frozen cone
 * points before walking past. Returns the looped camera, or null when no
 * camera is in reach (or none is left), spending nothing then.
 */
export function useLoop(g, time, x, y, cameras) {
  if (g.loop <= 0) return null;
  let best = null;
  let bestD2 = GADGETS.loopRadius * GADGETS.loopRadius;
  for (const cam of cameras) {
    if (time < cam.disabledUntil) continue;
    if (time < cam.loopedUntil) continue;
    const dx = cam.x - x;
    const dy = cam.y - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      best = cam;
      bestD2 = d2;
    }
  }
  if (!best) return null;
  // Read the sweep angle BEFORE marking the camera looped: cameraFacing
  // returns the frozen angle once loopedUntil is set, so reading it after
  // would freeze the cone at its (still zero) loopedAngle instead of
  // where the sweep actually was.
  const angle = cameraFacing(best, time);
  g.loop -= 1;
  best.loopedUntil = time + GADGETS.loopSeconds;
  best.loopedAngle = angle;
  return best;
}

/** Drop clouds and lures whose time has run out. */
export function updateGadgets(g, time) {
  g.clouds = g.clouds.filter((c) => time < c.until);
  g.lures = g.lures.filter((l) => time < l.until);
}

/** Fresh counts for a new heist. */
export function resetGadgets(g) {
  g.smoke = GADGETS.smoke;
  g.lure = GADGETS.lure;
  g.emp = GADGETS.emp;
  g.loop = GADGETS.loop;
  g.clouds = [];
  g.lures = [];
}
