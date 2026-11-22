// Guards: night guards on patrol loops they never leave, until one of
// them spots the thief. A suspicious guard walks to the last place the thief
// was seen, looks around, and goes back to patrol if nothing is there.
//
// States: 'patrol' -> 'investigate' -> 'patrol'. The world owns detection;
// this file owns where the guard walks and which way it faces.

import { GUARD } from './config.js';

function turnToward(guard, targetAngle, dt) {
  let diff = targetAngle - guard.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxTurn = 4.5 * dt;
  guard.facing += Math.max(-maxTurn, Math.min(maxTurn, diff));
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  turnToward(guard, Math.atan2(dy, dx), dt);
  return dist - step < 2;
}

export function createGuard(def) {
  const first = def.waypoints[0];
  return {
    name: def.name,
    x: first.x,
    y: first.y,
    facing: 0,
    waypoints: def.waypoints,
    waypointIndex: 1,
    state: 'patrol',
    wait: 0,
    investigate: null,
    lookTime: 0,
    stepPhase: 0,
  };
}

/** A footstep tick each time the guard's stride passes a half step. */
function guardStepped(guard, dt, speed) {
  guard.stepPhase += (speed * dt) / 34;
  if (guard.stepPhase >= 1) {
    guard.stepPhase -= 1;
    return true;
  }
  return false;
}

/**
 * Advance one guard one step. Returns 'step' when the guard took a footstep
 * (for the sound), else null. `investigateAt` is a point {x,y} to walk to,
 * or null when no guard is suspicious.
 */
export function stepGuard(guard, dt, investigateAt) {
  if (investigateAt && guard.state === 'patrol') {
    guard.state = 'investigate';
    guard.investigate = { x: investigateAt.x, y: investigateAt.y };
    guard.lookTime = 0;
  }
  if (guard.state === 'investigate') {
    const target = guard.investigate;
    if (target && moveToward(guard, target.x, target.y, GUARD.investigateSpeed, dt)) {
      guard.lookTime += dt;
      turnToward(guard, guard.facing + 2.4 * dt, dt);
      if (guard.lookTime >= GUARD.investigateTime) {
        guard.state = 'patrol';
        guard.investigate = null;
        // Resume from the nearest waypoint, so the loop is never broken.
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < guard.waypoints.length; i += 1) {
          const d = Math.hypot(guard.waypoints[i].x - guard.x, guard.waypoints[i].y - guard.y);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        }
        guard.waypointIndex = best;
        guard.wait = 0.4;
      }
    }
    return guardStepped(guard, dt, GUARD.investigateSpeed) ? 'step' : null;
  }
  // Patrol: walk the loop, pausing at each waypoint.
  if (guard.wait > 0) {
    guard.wait -= dt;
    return null;
  }
  const target = guard.waypoints[guard.waypointIndex];
  if (moveToward(guard, target.x, target.y, GUARD.patrolSpeed, dt)) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.wait = GUARD.waitAtWaypoint;
  }
  return guardStepped(guard, dt, GUARD.patrolSpeed) ? 'step' : null;
}
