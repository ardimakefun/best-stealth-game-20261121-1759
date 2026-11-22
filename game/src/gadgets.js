// Gadgets: the thief's tools. Three of them, each limited per heist, each
// with an effect you can see on the screen:
// - smoke: a cloud that blocks every line of sight while it hangs;
// - lure: a thrown noisemaker guards walk over to investigate;
// - EMP: a pulse that switches off nearby cameras and laser tripwires for
//   a few seconds. It does not stop a guard's eyes.
// Counts refill when a new heist starts. Nothing here moves the thief or
// the guards directly; the world applies each effect where it belongs.

import { GADGETS, LASER } from './config.js';

export function createGadgets() {
  return {
    smoke: GADGETS.smoke,
    lure: GADGETS.lure,
    emp: GADGETS.emp,
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
  g.clouds = [];
  g.lures = [];
}
