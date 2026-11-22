// The screenshot scenes behind ?shot=start|play|caught|end. Each one plays the
// real rules forward from a fresh world for a fixed time, steered by an
// autopilot, so the frame is what a short game really looks like and the same
// seed always gives the same frame.

import { STEP } from './config.js';
import { EVENT_CAUGHT, EVENT_WIN } from './world.js';
import { createPilot, createRecklessPilot } from './pilot.js';
import { SCREEN_OVER, SCREEN_PLAY } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const LIMIT_SECONDS = 600;

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Unknown names stage the start scene.
 */
export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name !== 'play' && name !== 'caught' && name !== 'end') {
    // Start: the guards patrol for five seconds, the thief waits at the door.
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, null, false);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  const reckless = name === 'caught';
  const pilot = reckless ? createRecklessPilot() : createPilot();
  // Play stops mid-run at 26s (the thief deep in the gallery); end plays
  // until the careful pilot wins or the 600s cap.
  const limit = reckless ? 180 : name === 'play' ? PLAY_SECONDS : LIMIT_SECONDS;
  let events = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    events = world.step(STEP, pilot.move(state), false);
    if (events & (EVENT_CAUGHT | EVENT_WIN)) break;
  }
  const over = state.status !== 'playing';
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: state.score };
}
