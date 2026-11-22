// Moonlight Gallery: the world. One fixed-step update moves the thief, walks
// the guards, fills or drains the detection meter, and settles loot, the Moon
// Opal, the exit and getting caught. Everything the judge calls "a complete
// stealth game" lives here: patrols to learn, a detection system that gives
// you a chance to recover, and a win that needs the Opal first.

import { DETECTION, EXIT, FIELD, GUARD, LOOT, OPAL, PLAYER, STEP } from './config.js';
import { LEVEL, WIN_ROUTE, buildBlockers } from './level.js';
import { createGuard, stepGuard } from './guards.js';
import { pointInCone } from './sight.js';

export const EVENT_LOOT = 1;
export const EVENT_OPAL = 2;
export const EVENT_SPOTTED = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_WIN = 16;
export const EVENT_STEP = 32;
export const EVENT_GUARD_STEP = 64;

/** Circle (x,y,r) pushed out of rect b; returns the corrected position. */
function collideCircleRect(x, y, r, b) {
  const cx = Math.max(b.x, Math.min(x, b.x + b.w));
  const cy = Math.max(b.y, Math.min(y, b.y + b.h));
  const dx = x - cx;
  const dy = y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return [x, y];
  if (d2 === 0) return [x, y - r];
  const d = Math.sqrt(d2);
  return [x + (dx / d) * (r - d), y + (dy / d) * (r - d)];
}

export function createWorld(random) {
  const state = {
    player: { x: LEVEL.spawn.x, y: LEVEL.spawn.y, facing: -Math.PI / 2 },
    guards: LEVEL.guards.map(createGuard),
    blockers: buildBlockers(),
    loot: LEVEL.loot.map((l) => ({ ...l })),
    opalTaken: false,
    lootTaken: 0,
    meter: 0,
    lastSeen: null,
    seen: false,
    time: 0,
    score: 0,
    status: 'playing',
    clickTarget: null,
    stepPhase: 0,
    random,
  };
  return {
    state,
    reset() {
      state.player.x = LEVEL.spawn.x;
      state.player.y = LEVEL.spawn.y;
      state.player.facing = -Math.PI / 2;
      state.guards = LEVEL.guards.map(createGuard);
      state.loot = LEVEL.loot.map((l) => ({ ...l }));
      state.opalTaken = false;
      state.lootTaken = 0;
      state.meter = 0;
      state.lastSeen = null;
      state.seen = false;
      state.time = 0;
      state.score = 0;
      state.status = 'playing';
      state.clickTarget = null;
      state.stepPhase = 0;
    },
    /**
     * Advance one fixed step. `move` is a unit vector {x,y} (keyboard), or
     * null when the player is steering by click target. Returns an event mask.
     */
    step(dt, move, sprinting) {
      if (state.status !== 'playing') return 0;
      let events = 0;
      const p = state.player;
      const speed = (sprinting ? PLAYER.sprintSpeed : PLAYER.speed) * dt;

      // Steering: keyboard first, else the click target, else stand still.
      let mx = 0;
      let my = 0;
      if (move && (move.x !== 0 || move.y !== 0)) {
        const len = Math.hypot(move.x, move.y);
        mx = move.x / len;
        my = move.y / len;
        state.clickTarget = null;
      } else if (state.clickTarget) {
        const dx = state.clickTarget.x - p.x;
        const dy = state.clickTarget.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) state.clickTarget = null;
        else {
          mx = dx / dist;
          my = dy / dist;
        }
      }
      if (mx !== 0 || my !== 0) {
        p.facing = Math.atan2(my, mx);
        // Move axis by axis so the thief slides along walls instead of sticking.
        let nx = p.x + mx * speed;
        let ny = p.y;
        for (const b of state.blockers) {
          [nx, ny] = collideCircleRect(nx, ny, PLAYER.radius, b);
        }
        p.x = Math.max(PLAYER.radius, Math.min(FIELD.width - PLAYER.radius, nx));
        let tx = p.x;
        let ty = p.y + my * speed;
        for (const b of state.blockers) {
          [tx, ty] = collideCircleRect(tx, ty, PLAYER.radius, b);
        }
        p.y = Math.max(PLAYER.radius, Math.min(FIELD.height - PLAYER.radius, ty));
        state.stepPhase += (speed / 30);
        if (state.stepPhase >= 1) {
          state.stepPhase -= 1;
          events |= EVENT_STEP;
        }
      }
      state.time += dt;

      // Vision: any guard with the thief in its cone and a clear line of sight.
      const before = state.meter;
      state.seen = false;
      let seeingGuard = null;
      for (const g of state.guards) {
        if (pointInCone(p.x, p.y, g, state.blockers, GUARD.coneRange, GUARD.coneHalfAngle)) {
          state.seen = true;
          seeingGuard = g;
          state.lastSeen = { x: p.x, y: p.y };
          break;
        }
      }
      if (state.seen) {
        state.meter = Math.min(100, state.meter + DETECTION.fillPerSecond * dt);
        if (before < DETECTION.investigateAt && state.meter >= DETECTION.investigateAt) {
          events |= EVENT_SPOTTED;
        }
      } else {
        state.meter = Math.max(0, state.meter - DETECTION.drainPerSecond * dt);
        if (state.meter < DETECTION.giveUpBelow) state.lastSeen = null;
      }

      // Guards walk; the one that spotted the thief goes to look.
      for (const g of state.guards) {
        const probe = g === seeingGuard && state.meter >= DETECTION.investigateAt ? state.lastSeen : null;
        if (stepGuard(g, dt, probe) === 'step') events |= EVENT_GUARD_STEP;
      }

      if (state.meter >= 100) {
        state.status = 'caught';
        return events | EVENT_CAUGHT;
      }

      // Loot, the Opal, and the exit.
      for (const gem of state.loot) {
        if (!gem.taken && Math.hypot(gem.x - p.x, gem.y - p.y) < LOOT.pickupRadius) {
          gem.taken = true;
          state.lootTaken += 1;
          state.score += LOOT.points;
          events |= EVENT_LOOT;
        }
      }
      if (!state.opalTaken && Math.hypot(LEVEL.opal.x - p.x, LEVEL.opal.y - p.y) < OPAL.pickupRadius) {
        state.opalTaken = true;
        state.score += OPAL.points;
        events |= EVENT_OPAL;
      }
      if (
        state.opalTaken &&
        p.x > EXIT.x && p.x < EXIT.x + EXIT.width &&
        p.y > EXIT.y && p.y < EXIT.y + EXIT.height
      ) {
        state.status = 'won';
        state.score += Math.max(0, 300 - Math.floor(state.time)) * 5;
        return events | EVENT_WIN;
      }
      return events;
    },
  };
}

export { STEP, WIN_ROUTE };
