// Lasers: tripwire beams a thief must time. A beam is a straight segment
// between two wall posts, live for part of every cycle and dark for the
// rest — crossing while it is live trips the alarm, crossing on the dark
// beat is free. An EMP switches a nearby beam off for a few seconds. A
// beam is a pure function of world time plus its EMP state, so a
// simulation can replay it exactly, and the pilot can time a crossing
// the same way it times a camera sweep.

import { LASER } from './config.js';

export function createLaser(def) {
  return {
    name: def.name,
    x1: def.x1,
    y1: def.y1,
    x2: def.x2,
    y2: def.y2,
    onSeconds: def.onSeconds ?? LASER.onSeconds,
    offSeconds: def.offSeconds ?? LASER.offSeconds,
    /** Seconds into the cycle the beam starts live; staggers the beams. */
    phase: def.phase ?? 0,
    /** World time until which an EMP keeps the beam dark (0 = live). */
    disabledUntil: 0,
  };
}

/** Seconds one full on/off cycle of this beam takes. */
export function laserCycle(laser) {
  return laser.onSeconds + laser.offSeconds;
}

/** True while the beam is live at world time `t`. */
export function laserActive(laser, t) {
  if (t < laser.disabledUntil) return false;
  return ((t + laser.phase) % laserCycle(laser)) < laser.onSeconds;
}

/** True while an EMP keeps the beam dark. */
export function laserDisabled(laser, t) {
  return t < laser.disabledUntil;
}

/** Shortest distance from point (px,py) to the beam segment. */
export function distanceToLaser(px, py, laser) {
  const c = closestPointOnLaser(px, py, laser);
  return Math.hypot(px - c.x, py - c.y);
}

/** The point on the beam segment nearest to (px,py). */
export function closestPointOnLaser(px, py, laser) {
  const dx = laser.x2 - laser.x1;
  const dy = laser.y2 - laser.y1;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) t = Math.max(0, Math.min(1, ((px - laser.x1) * dx + (py - laser.y1) * dy) / len2));
  return { x: laser.x1 + dx * t, y: laser.y1 + dy * t };
}

/** True when the thief at (px,py) trips the live beam at time `t`. */
export function pointTripsLaser(px, py, laser, t) {
  return laserActive(laser, t) && distanceToLaser(px, py, laser) <= LASER.tripRadius;
}

function orientation(ax, ay, bx, by, cx, cy) {
  const v = (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
  if (v === 0) return 0;
  return v > 0 ? 1 : 2;
}

function onSegment(ax, ay, bx, by, cx, cy) {
  return bx <= Math.max(ax, cx) && bx >= Math.min(ax, cx) && by <= Math.max(ay, cy) && by >= Math.min(ay, cy);
}

/**
 * The point where segment (ax,ay)-(bx,by) crosses the beam, or null when
 * the two do not meet. The pilot uses it to work out when the thief
 * reaches the beam and whether it will be live then.
 */
export function segmentLaserCrossing(ax, ay, bx, by, laser) {
  const { x1, y1, x2, y2 } = laser;
  const o1 = orientation(ax, ay, bx, by, x1, y1);
  const o2 = orientation(ax, ay, bx, by, x2, y2);
  const o3 = orientation(x1, y1, x2, y2, ax, ay);
  const o4 = orientation(x1, y1, x2, y2, bx, by);
  if (o1 !== o2 && o3 !== o4) {
    const dx = bx - ax;
    const dy = by - ay;
    const den = (x2 - x1) * dy - (y2 - y1) * dx;
    if (den === 0) return null;
    const t = ((x2 - x1) * (ay - y1) - (y2 - y1) * (ax - x1)) / den;
    return { x: ax + dx * t, y: ay + dy * t };
  }
  // Collinear touches count as a crossing: the thief walks along the beam.
  if (o1 === 0 && onSegment(ax, ay, x1, y1, bx, by)) return { x: x1, y: y1 };
  if (o2 === 0 && onSegment(ax, ay, x2, y2, bx, by)) return { x: x2, y: y2 };
  if (o3 === 0 && onSegment(x1, y1, ax, ay, x2, y2)) return { x: ax, y: ay };
  if (o4 === 0 && onSegment(x1, y1, bx, by, x2, y2)) return { x: bx, y: by };
  return null;
}
