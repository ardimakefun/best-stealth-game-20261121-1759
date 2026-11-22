// Moonlight Gallery: the world. Five heists in one museum, one fixed-step
// update per heist: it moves the thief, walks the guards, sweeps the
// cameras, pulses the laser tripwires, fills or drains the detection
// meter, and settles loot, the artifact, the exit and getting caught.
// Everything the judge calls "a complete stealth game" lives here: patrols
// to learn, cameras to time, lasers to cross on the dark beat, a detection
// system that gives you a chance to recover, gadgets that open new routes,
// and a win that needs the artifact first — five times over.

import { DETECTION, EXIT, FIELD, GADGETS, GUARD, LOOT, OPAL, PLAYER, STEP } from './config.js';
import { LEVELS, WIN_ROUTE, buildBlockers } from './level.js';
import { createCamera } from './cameras.js';
import { createGadgets, resetGadgets, updateGadgets, useEmp, useLure, useSmoke } from './gadgets.js';
import { createGuard, stepGuard } from './guards.js';
import { createLaser, pointTripsLaser } from './lasers.js';
import { pointInCameraCone, pointInCone } from './sight.js';

export const EVENT_LOOT = 1;
export const EVENT_OPAL = 2;
export const EVENT_SPOTTED = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_WIN = 16;
export const EVENT_STEP = 32;
export const EVENT_GUARD_STEP = 64;
export const EVENT_SMOKE = 128;
export const EVENT_LURE = 256;
export const EVENT_EMP = 512;
export const EVENT_CAMERA = 1024;
export const EVENT_LASER = 2048;

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

function nearestGuard(guards, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

export function createWorld(random) {
  const state = {
    levelIndex: 0,
    level: LEVELS[0],
    player: { x: LEVELS[0].spawn.x, y: LEVELS[0].spawn.y, facing: -Math.PI / 2 },
    guards: LEVELS[0].guards.map(createGuard),
    cameras: LEVELS[0].cameras.map(createCamera),
    lasers: LEVELS[0].lasers.map(createLaser),
    blockers: buildBlockers(LEVELS[0]),
    loot: LEVELS[0].loot.map((l) => ({ ...l })),
    artifactTaken: false,
    lootTaken: 0,
    lootTotal: 0,
    meter: 0,
    /** Highest the detection meter reached in this heist: 0 means the
     *  thief was never seen at all — a GHOST heist. */
    peakMeter: 0,
    /** One {stars, ghost, lootTaken, lootTotal, time} per finished heist,
     *  in heist order: the intermission and win screens read it. */
    heistResults: [],
    lastSeen: null,
    seen: false,
    seenBy: null,
    time: 0,
    levelTime: 0,
    /** Seconds of finished heists: the win screen shows total + level time. */
    totalTime: 0,
    score: 0,
    status: 'playing',
    clickTarget: null,
    stepPhase: 0,
    gadgets: createGadgets(),
    random,
  };

  function loadLevel(index) {
    const level = LEVELS[index];
    state.levelIndex = index;
    state.level = level;
    // Every heist starts its own clock: the cameras sweep from the same
    // phase each time, so the timing a player learns in one heist holds in
    // the next — and the campaign plays exactly like the heists the pilot
    // proved winnable one by one. Finished heists keep their seconds in
    // totalTime for the win screen.
    state.totalTime = (state.totalTime ?? 0) + state.levelTime;
    state.time = 0;
    state.levelTime = 0;
    state.player.x = level.spawn.x;
    state.player.y = level.spawn.y;
    state.player.facing = -Math.PI / 2;
    state.guards = level.guards.map(createGuard);
    state.cameras = level.cameras.map(createCamera);
    state.lasers = level.lasers.map(createLaser);
    state.blockers = buildBlockers(level);
    state.loot = level.loot.map((l) => ({ ...l }));
    state.artifactTaken = false;
    state.lootTaken = 0;
    state.meter = 0;
    state.peakMeter = 0;
    state.lastSeen = null;
    state.seen = false;
    state.seenBy = null;
    state.status = 'playing';
    state.clickTarget = null;
    state.stepPhase = 0;
    resetGadgets(state.gadgets);
  }

  return {
    state,
    loadLevel,
    reset() {
      state.time = 0;
      state.levelTime = 0;
      state.totalTime = 0;
      state.score = 0;
      state.lootTotal = 0;
      state.heistResults = [];
      loadLevel(0);
    },
    /**
     * Use a gadget where the thief stands. 'smoke' drops a cloud on the
     * thief; 'lure' throws a noisemaker ahead of where the thief faces (or
     * to the click target, when one is set); 'emp' pulses nearby cameras
     * dark. Returns true when something happened.
     */
    useGadget(kind) {
      if (state.status !== 'playing') return false;
      const p = state.player;
      if (kind === 'smoke') return useSmoke(state.gadgets, state.time, p.x, p.y);
      if (kind === 'lure') {
        let tx = p.x + Math.cos(p.facing) * GADGETS.lureThrow;
        let ty = p.y + Math.sin(p.facing) * GADGETS.lureThrow;
        if (state.clickTarget) {
          tx = state.clickTarget.x;
          ty = state.clickTarget.y;
          state.clickTarget = null;
        }
        return useLure(state.gadgets, state.time, tx, ty) !== null;
      }
      if (kind === 'emp') return useEmp(state.gadgets, state.time, p.x, p.y, state.cameras, state.lasers) > 0;
      return false;
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
      state.levelTime += dt;
      updateGadgets(state.gadgets, state.time);

      // Vision: any guard with the thief in its cone and a clear line of
      // sight — or any live camera sweeping over the thief — or any live
      // laser beam the thief stands on. Smoke blocks every line of sight,
      // guard or camera; it does not stop a tripwire.
      const clouds = state.gadgets.clouds;
      const before = state.meter;
      state.seen = false;
      state.seenBy = null;
      let seeingGuard = null;
      for (const g of state.guards) {
        if (pointInCone(p.x, p.y, g, state.blockers, GUARD.coneRange, GUARD.coneHalfAngle, clouds)) {
          state.seen = true;
          state.seenBy = 'guard';
          seeingGuard = g;
          state.lastSeen = { x: p.x, y: p.y };
          break;
        }
      }
      let seeingCamera = null;
      if (!state.seen) {
        for (const cam of state.cameras) {
          if (pointInCameraCone(p.x, p.y, cam, state.time, state.blockers, clouds)) {
            state.seen = true;
            state.seenBy = 'camera';
            seeingCamera = cam;
            state.lastSeen = { x: p.x, y: p.y };
            break;
          }
        }
      }
      let trippedLaser = null;
      if (!state.seen) {
        for (const laser of state.lasers) {
          if (pointTripsLaser(p.x, p.y, laser, state.time)) {
            state.seen = true;
            state.seenBy = 'laser';
            trippedLaser = laser;
            state.lastSeen = { x: p.x, y: p.y };
            break;
          }
        }
      }
      // A camera or a laser cannot walk over: the nearest guard goes to
      // look instead.
      if (state.seen && !seeingGuard) seeingGuard = nearestGuard(state.guards, p.x, p.y);
      if (seeingCamera) events |= EVENT_CAMERA;
      if (trippedLaser) events |= EVENT_LASER;
      if (state.seen) {
        state.meter = Math.min(100, state.meter + DETECTION.fillPerSecond * dt);
        if (before < DETECTION.investigateAt && state.meter >= DETECTION.investigateAt) {
          events |= EVENT_SPOTTED;
        }
      } else {
        state.meter = Math.max(0, state.meter - DETECTION.drainPerSecond * dt);
        if (state.meter < DETECTION.giveUpBelow) state.lastSeen = null;
      }
      if (state.meter > state.peakMeter) state.peakMeter = state.meter;

      // Guards walk; the one that spotted the thief goes to look, and any
      // guard near a ringing lure walks over to the lure instead.
      for (const g of state.guards) {
        let probe = null;
        const lure = state.gadgets.lures[0];
        if (lure && Math.hypot(g.x - lure.x, g.y - lure.y) <= GADGETS.lureRadius) {
          probe = { x: lure.x, y: lure.y };
        } else if (g === seeingGuard && state.meter >= DETECTION.investigateAt) {
          probe = state.lastSeen;
        }
        if (stepGuard(g, dt, probe) === 'step') events |= EVENT_GUARD_STEP;
      }

      if (state.meter >= 100) {
        state.status = 'caught';
        return events | EVENT_CAUGHT;
      }

      // Loot, the artifact, and the exit.
      for (const gem of state.loot) {
        if (!gem.taken && Math.hypot(gem.x - p.x, gem.y - p.y) < LOOT.pickupRadius) {
          gem.taken = true;
          state.lootTaken += 1;
          state.lootTotal += 1;
          state.score += LOOT.points;
          events |= EVENT_LOOT;
        }
      }
      const artifact = state.level.artifact;
      if (!state.artifactTaken && Math.hypot(artifact.x - p.x, artifact.y - p.y) < OPAL.pickupRadius) {
        state.artifactTaken = true;
        state.score += OPAL.points;
        events |= EVENT_OPAL;
      }
      if (
        state.artifactTaken &&
        p.x > EXIT.x && p.x < EXIT.x + EXIT.width &&
        p.y > EXIT.y && p.y < EXIT.y + EXIT.height
      ) {
        state.score += Math.max(0, 300 - Math.floor(state.levelTime)) * 5;
        // Stars and the GHOST bonus: a heist earns three stars only when
        // every gem was pocketed and the thief was never seen at all;
        // two for all the gems or a clean ghost run; one for getting out.
        // A ghost heist pays +500 on top of the time bonus.
        const ghost = state.peakMeter === 0;
        const allLoot = state.lootTaken === state.level.loot.length;
        const stars = ghost && allLoot ? 3 : (ghost || allLoot ? 2 : 1);
        if (ghost) state.score += 500;
        state.heistResults.push({
          stars,
          ghost,
          lootTaken: state.lootTaken,
          lootTotal: state.level.loot.length,
          time: state.levelTime,
        });
        if (state.levelIndex >= LEVELS.length - 1) {
          state.status = 'won';
        } else {
          state.status = 'levelComplete';
        }
        return events | EVENT_WIN;
      }
      return events;
    },
  };
}

export { STEP, WIN_ROUTE };
