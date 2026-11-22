// Cameras: wall-mounted watchers with sweeping vision cones. A camera never
// walks; it sits on a wall and sweeps its cone back and forth on a fixed
// rhythm, so a patient thief can time the sweep like a patrol. An EMP
// switches it off for a few seconds. Facing is a pure function of absolute
// world time, so a simulation can replay a camera exactly.

import { CAMERA } from './config.js';

export function createCamera(def) {
  return {
    name: def.name,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweepAmp: def.sweepAmp ?? CAMERA.sweepAmp,
    sweepSpeed: def.sweepSpeed ?? CAMERA.sweepSpeed,
    phase: def.phase ?? 0,
    range: def.range ?? CAMERA.range,
    halfAngle: def.halfAngle ?? CAMERA.halfAngle,
    /** World time until which the camera stays dark (0 = live). */
    disabledUntil: 0,
  };
}

/** The direction a camera looks at absolute world time `t`. */
export function cameraFacing(cam, t) {
  return cam.baseAngle + Math.sin(t * cam.sweepSpeed + cam.phase) * cam.sweepAmp;
}

/** True while an EMP keeps the camera dark. */
export function cameraDisabled(cam, t) {
  return t < cam.disabledUntil;
}
