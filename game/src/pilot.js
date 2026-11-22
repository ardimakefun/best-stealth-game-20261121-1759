// The autopilots behind the screenshot scenes and the proof that every
// heist can be won. Both play the real rules forward from a fresh world,
// steering the thief along a route with A* over a coarse grid, so the route
// goes around cases and planters instead of pushing into them.
//
// The careful pilot is a patient thief: before it takes a step it simulates
// the guards — and the cameras — forward and only moves when the step stays
// out of every cone for the whole crossing; when the meter climbs it
// retreats to a hiding spot no cone ever reaches and waits there until the
// meter drains. The reckless pilot walks straight into the nearest guard's
// cone and is caught.

import { LASER, PLAYER } from './config.js';
import { pointInCameraCone, pointInCone } from './sight.js';
import { closestPointOnLaser, distanceToLaser, laserActive, pointTripsLaser, segmentLaserCrossing } from './lasers.js';
import { stepGuard } from './guards.js';

const CELL = 40;
const COLS = 32;
const ROWS = 18;

function cellBlocked(cx, cy, blockers) {
  const x = cx * CELL + CELL / 2;
  const y = cy * CELL + CELL / 2;
  for (const b of blockers) {
    if (x > b.x - 12 && x < b.x + b.w + 12 && y > b.y - 12 && y < b.y + b.h + 12) return true;
  }
  return false;
}

/**
 * A* from (sx,sy) to (tx,ty) over grid cells. Returns node centres, the
 * player's own position first and the target last, or null when unreachable.
 * The start and goal cells are allowed even when the grid calls them
 * blocked (the thief can stand beside a planter); only the cells between
 * them must be free.
 */
function findPath(sx, sy, tx, ty, blockers) {
  const start = { cx: Math.floor(sx / CELL), cy: Math.floor(sy / CELL) };
  const goal = { cx: Math.floor(tx / CELL), cy: Math.floor(ty / CELL) };
  const key = (cx, cy) => cy * COLS + cx;
  const h = (cx, cy) => Math.hypot(cx - goal.cx, cy - goal.cy);
  const open = [{ ...start, g: 0, f: h(start.cx, start.cy), parent: null }];
  const gScore = new Map([[key(start.cx, start.cy), 0]]);
  const closed = new Set();
  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (open[i].f < open[bi].f) bi = i;
    }
    const cur = open.splice(bi, 1)[0];
    const ck = key(cur.cx, cur.cy);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.cx === goal.cx && cur.cy === goal.cy) {
      const nodes = [];
      let n = cur;
      while (n) {
        nodes.unshift({ x: n.cx * CELL + CELL / 2, y: n.cy * CELL + CELL / 2 });
        n = n.parent;
      }
      nodes[0] = { x: sx, y: sy };
      nodes[nodes.length - 1] = { x: tx, y: ty };
      return nodes;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = cur.cx + dx;
      const ny = cur.cy + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const isGoal = nx === goal.cx && ny === goal.cy;
      if (!isGoal && cellBlocked(nx, ny, blockers)) continue;
      if (dx !== 0 && dy !== 0) {
        if (cellBlocked(cur.cx + dx, cur.cy, blockers) || cellBlocked(cur.cx, cur.cy + dy, blockers)) continue;
      }
      const nk = key(nx, ny);
      if (closed.has(nk)) continue;
      const ng = cur.g + (dx !== 0 && dy !== 0 ? 1.414 : 1);
      if (ng < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, ng);
        open.push({ cx: nx, cy: ny, g: ng, f: ng + h(nx, ny), parent: cur });
      }
    }
  }
  return null;
}

function cloneGuard(g) {
  return { ...g, waypoints: g.waypoints };
}

/**
 * True when point (x,y) falls inside any guard's cone — or any live
 * camera's sweeping cone, or on any live laser beam — at any moment in
 * the next `seconds`, the guards simulated forward and the cameras and
 * lasers swept forward from the state's time. This is how the pilot times
 * a crossing instead of walking into a sweep or a live beam.
 */
function willBeSeenSoon(x, y, state, seconds) {
  const clones = state.guards.map(cloneGuard);
  const steps = Math.max(1, Math.ceil(seconds / 0.15));
  for (let i = 0; i < steps; i += 1) {
    const t = state.time + i * 0.15;
    for (const g of clones) stepGuard(g, 0.15, null);
    for (const g of clones) {
      // Each guard is probed with its own cone: an elite's longer cone
      // reaches farther than a regular guard's.
      if (pointInCone(x, y, g, state.blockers, g.coneRange, g.coneHalfAngle)) return true;
    }
    for (const cam of state.cameras) {
      if (pointInCameraCone(x, y, cam, t, state.blockers)) return true;
    }
    for (const laser of state.lasers) {
      if (laserActive(laser, t) && distanceToLaser(x, y, laser) <= LASER.tripRadius) return true;
    }
  }
  return false;
}

function directionTo(p, tx, ty) {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** A careful pilot for one level: its route and hiding spots come from the level. */
export function createPilot(level) {
  const route = level.winRoute;
  const hideSpots = level.hideSpots;
  let index = 0;
  let path = null;
  let pathIndex = 0;
  let lastX = 0;
  let lastY = 0;
  let stuckTime = 0;
  let retreating = false;
  let hideSpot = null;
  /** True when followPath's last call waited because the next node is swept. */
  let blockedByCone = false;

  function nearestSafeHideSpot(x, y, state) {
    // The hiding spot the thief can actually reach: for each spot, walk
    // its path until the first node that stays out of every cone, and score
    // the spot by how far along the path that node is. A spot whose first
    // step is swept still counts if the path clears a node or two in — the
    // thief is already being seen, so standing still is not an option.
    // Falls back to the nearest spot when no path clears at all.
    let best = null;
    let bestDist = Infinity;
    let fallback = null;
    let fallbackDist = Infinity;
    for (const s of hideSpots) {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < fallbackDist) {
        fallbackDist = d;
        fallback = s;
      }
      const p = findPath(x, y, s.x, s.y, state.blockers);
      if (!p || p.length < 2) continue;
      let walked = 0;
      let clearAt = Infinity;
      for (let i = 1; i < Math.min(p.length, 8); i += 1) {
        walked += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
        if (!willBeSeenSoon(p[i].x, p[i].y, state, walked / PLAYER.speed + 1.0)) {
          clearAt = walked;
          break;
        }
      }
      if (clearAt < bestDist) {
        bestDist = clearAt;
        best = s;
      }
    }
    return best ?? fallback;
  }

  /**
   * True when stepping from `p` to `node` would cross a laser beam that is
   * live when the thief reaches it or while clearing it.
   */
  function laserBlocksStep(p, node, state) {
    for (const laser of state.lasers) {
      const cross = segmentLaserCrossing(p.x, p.y, node.x, node.y, laser);
      if (!cross) continue;
      const reachSeconds = Math.hypot(cross.x - p.x, cross.y - p.y) / PLAYER.speed;
      const reachAt = state.time + reachSeconds;
      if (laserActive(laser, reachAt) || laserActive(laser, reachAt + 0.5)) return true;
    }
    return false;
  }

  function followPath(state, dest) {
    const p = state.player;
    // Escape first: standing on a live beam fills the meter, and the
    // pilot can stop within the trip radius while waiting for the dark
    // beat — the beam goes live under its feet, as the Crown Vault
    // proved. Step straight away from the beam's nearest point until
    // clear of it, then go back to pathing.
    for (const laser of state.lasers) {
      if (pointTripsLaser(p.x, p.y, laser, state.time)) {
        const c = closestPointOnLaser(p.x, p.y, laser);
        const away = directionTo(c, p.x, p.y);
        if (away.x !== 0 || away.y !== 0) return away;
      }
    }
    if (!path) {
      path = findPath(p.x, p.y, dest.x, dest.y, state.blockers);
      pathIndex = 0;
      lastX = p.x;
      lastY = p.y;
      stuckTime = 0;
      if (!path) return null;
    }
    const node = path[pathIndex];
    if (!node) {
      path = null;
      return null;
    }
    const dx = node.x - p.x;
    const dy = node.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      pathIndex += 1;
      return null;
    }
    // Stuck against something the grid did not foresee: replan.
    if (Math.hypot(p.x - lastX, p.y - lastY) < 2) {
      stuckTime += 1 / 60;
      if (stuckTime > 1) {
        path = null;
        return null;
      }
    } else {
      lastX = p.x;
      lastY = p.y;
      stuckTime = 0;
    }
    // The next node, and how long reaching it takes: only step out when the
    // node stays out of every cone for the whole crossing. A retreat that
    // walks into a cone is worse than waiting — unless this spot is about
    // to be swept too, in which case moving is the only chance.
    blockedByCone = false;
    const crossSeconds = dist / PLAYER.speed + 1.0;
    if (willBeSeenSoon(node.x, node.y, state, crossSeconds)) {
      blockedByCone = true;
      if (willBeSeenSoon(p.x, p.y, state, 3.0)) return directionTo(p, node.x, node.y);
      return null;
    }
    // A laser beam across this leg: only step out when the beam is dark
    // when the thief reaches it and while clearing it. Waiting is bounded
    // — the beam goes dark every cycle — and standing still here is safe,
    // so this is a wait, not a retreat: blockedByCone stays false.
    if (laserBlocksStep(p, node, state)) return null;
    return directionTo(p, node.x, node.y);
  }

  return {
    reset() {
      index = 0;
      path = null;
      pathIndex = 0;
      stuckTime = 0;
      retreating = false;
      hideSpot = null;
      blockedByCone = false;
    },
    /** Diagnostics for the verification scripts: route progress, the
     *  current path, and whether the pilot is retreating or cone-blocked. */
    debug() {
      return {
        index,
        pathLength: path ? path.length : 0,
        pathIndex,
        retreating,
        hideSpot,
        blockedByCone,
      };
    },
    /** The move vector for this step, or null to stand still. */
    move(state) {
      if (state.status !== 'playing' || index >= route.length) return null;
      const p = state.player;

      // Retreat: the meter climbed. Run to the nearest hiding spot and wait
      // there until the meter has drained. The retreat path is cone-checked
      // like any other: walking into a cone while fleeing gets the thief
      // caught, as the cellar proved.
      if (state.meter > 25 && !retreating) {
        retreating = true;
        hideSpot = nearestSafeHideSpot(p.x, p.y, state);
        path = null;
      }
      if (retreating) {
        if (state.meter < 5) {
          retreating = false;
          hideSpot = null;
          path = null;
        } else if (hideSpot && Math.hypot(hideSpot.x - p.x, hideSpot.y - p.y) < 14) {
          return null;
        } else if (hideSpot) {
          return followPath(state, hideSpot);
        }
      }

      const target = route[index];
      if (Math.hypot(target.x - p.x, target.y - p.y) < 14) {
        index += 1;
        path = null;
        return null;
      }
      const mv = followPath(state, target);
      // The way ahead is swept — and this spot will be swept within four
      // seconds too. Do not wait here to be seen: retreat now, while the
      // meter is still low, and come back when the patrol has passed.
      if (blockedByCone && willBeSeenSoon(p.x, p.y, state, 4.0)) {
        retreating = true;
        hideSpot = nearestSafeHideSpot(p.x, p.y, state);
        path = null;
        return null;
      }
      return mv;
    },
    get done() {
      return index >= route.length;
    },
  };
}

/** The reckless pilot: straight into the nearest guard's cone, and it stays there. */
export function createRecklessPilot() {
  return {
    reset() {},
    move(state) {
      if (state.status !== 'playing') return null;
      const p = state.player;
      let nearest = null;
      let nearestDist = Infinity;
      for (const g of state.guards) {
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = g;
        }
      }
      if (!nearest) return null;
      // A point in front of the guard, inside its cone: walk into the light.
      const tx = nearest.x + Math.cos(nearest.facing) * 90;
      const ty = nearest.y + Math.sin(nearest.facing) * 90;
      return directionTo(p, tx, ty);
    },
  };
}
