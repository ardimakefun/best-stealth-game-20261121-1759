// Vision: what a guard can see. A point is seen when it is inside the guard's
// cone (distance and angle) and the straight line to it is not cut by a wall,
// a display case or a planter.

/** True when segment (x1,y1)-(x2,y2) touches rectangle r. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [p, q] of [
    [-dx, x1 - r.x],
    [dx, r.x + r.w - x1],
    [-dy, y1 - r.y],
    [dy, r.y + r.h - y1],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > tmax) return false;
        if (t > tmin) tmin = t;
      } else {
        if (t < tmin) return false;
        if (t < tmax) tmax = t;
      }
    }
  }
  return true;
}

/** True when nothing blocks the line from (x1,y1) to (x2,y2). */
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (let i = 0; i < blockers.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, blockers[i])) return false;
  }
  return true;
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * True when point (px,py) is inside the guard's vision cone and visible:
 * within range, within the half-angle of where the guard faces, and with a
 * clear line of sight. `range` and `halfAngle` let the pilot probe a
 * slightly smaller cone than the real one, for a safety margin.
 */
export function pointInCone(px, py, guard, blockers, range, halfAngle) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < guard.radius + 4) return true;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angle, guard.facing)) > halfAngle) return false;
  return hasLineOfSight(guard.x, guard.y, px, py, blockers);
}

/** True when any guard can currently see point (px,py). */
export function pointSeenByAny(px, py, guards, blockers, range, halfAngle) {
  for (let i = 0; i < guards.length; i += 1) {
    if (pointInCone(px, py, guards[i], blockers, range, halfAngle)) return true;
  }
  return false;
}
