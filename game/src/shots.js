// The screenshot scenes behind ?shot=start|play|gadget|caught|end (with
// &seed=N and &level=N). Each one plays the real rules forward from a fresh
// world for a fixed time, steered by an autopilot, so the frame is what a
// short game really looks like and the same seed always gives the same frame.
//
// - start: the guards patrol for five seconds, the thief waits at the door.
// - play: the careful pilot plays the level for 26 seconds.
// - gadget: the pilot plays 12 seconds, then drops smoke and throws a lure.
// - caught: the reckless pilot walks into a cone.
// - end: the careful pilot plays the whole campaign, heist by heist, until
//   the clean getaway — the win screen shows all four artifacts.

import { LEVELS } from './level.js';
import { STEP } from './config.js';
import { EVENT_CAUGHT, EVENT_WIN } from './world.js';
import { createPilot, createRecklessPilot } from './pilot.js';
import { SCREEN_OVER, SCREEN_PLAY } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const GADGET_SECONDS = 12;
const LIMIT_SECONDS = 600;

/**
 * Set `world` to the named scene of heist `levelIndex` and return the screen
 * to draw over it and the best score to show. Unknown names stage the start
 * scene. The world is reset to the heist first, so a shot never inherits
 * another scene's loot, meter or gadgets.
 */
export function stageShot(name, world, levelIndex = 0) {
  const level = LEVELS[levelIndex] ?? LEVELS[0];
  world.reset();
  world.loadLevel(LEVELS.indexOf(level));
  const state = world.state;
  if (name !== 'play' && name !== 'gadget' && name !== 'caught' && name !== 'end') {
    // Start: the guards patrol for five seconds, the thief waits at the door.
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, null, false);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'gadget') {
    // Twelve seconds of careful play, then smoke on the thief, a breath
    // for the cloud to hang, and a lure thrown ahead — one more second for
    // the coin to ring and the guards to turn toward it. Both gadgets are
    // still live when the frame is taken (smoke 4.5 s, lure 2.5 s).
    const pilot = createPilot(level);
    for (let i = 0; i < GADGET_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, pilot.move(state), false);
      if (events & (EVENT_CAUGHT | EVENT_WIN)) break;
    }
    if (state.status === 'playing') {
      world.useGadget('smoke');
      for (let i = 0; i < 1.5 / STEP; i += 1) world.step(STEP, null, false);
      world.useGadget('lure');
      for (let i = 0; i < 1 / STEP; i += 1) world.step(STEP, null, false);
    }
    return { screen: state.status === 'playing' ? SCREEN_PLAY : SCREEN_OVER, best: state.score };
  }
  if (name === 'end') {
    // The whole campaign: win heist 1, then 2, then 3, then 4, each with its own
    // careful pilot, until the clean getaway or the 600 s cap.
    for (let li = 0; li < LEVELS.length; li += 1) {
      world.loadLevel(li);
      const pilot = createPilot(LEVELS[li]);
      let events = 0;
      for (let i = 0; i < LIMIT_SECONDS / STEP; i += 1) {
        events = world.step(STEP, pilot.move(world.state), false);
        if (events & (EVENT_CAUGHT | EVENT_WIN)) break;
      }
      if (world.state.status !== 'levelComplete' && world.state.status !== 'won') break;
      if (world.state.status === 'won') break;
    }
    return { screen: SCREEN_OVER, best: state.score };
  }
  const reckless = name === 'caught';
  const pilot = reckless ? createRecklessPilot() : createPilot(level);
  // Play stops mid-run at 26s (the thief deep in the gallery); end plays
  // until the careful pilot wins or the 600s cap.
  const limit = reckless ? 180 : PLAY_SECONDS;
  let events = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    events = world.step(STEP, pilot.move(state), false);
    if (events & (EVENT_CAUGHT | EVENT_WIN)) break;
  }
  const over = state.status !== 'playing';
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: state.score };
}
