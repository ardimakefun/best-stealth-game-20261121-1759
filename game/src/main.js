// Moonlight Gallery: boot and the one loop. Input is read every frame, the
// world advances in fixed 1/60 s steps (several in a slow frame, none in a
// fast one), and the renderer paints what is there. The game moves between
// four screens: title, play, paused and game over.
//
// ?seed=N fixes the random seed. ?shot=start|play|caught|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { LEVELS } from './level.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CAUGHT, EVENT_GUARD_STEP, EVENT_LOOT, EVENT_OPAL, EVENT_SPOTTED, EVENT_STEP, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_EMP, ACTION_LURE, ACTION_MUTE, ACTION_PAUSE, ACTION_SMOKE, createInput } from './input.js';
import { createRenderer, fieldTransform, SCREEN_NEXT, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const levelParam = Number.parseInt(params.get('level') ?? '', 10);
const levelIndex = Number.isInteger(levelParam) && levelParam >= 0 && levelParam < LEVELS.length ? levelParam : 0;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

// For play-testing from a console or a screenshot script: the live state.
window.__game = { world, state: world.state };

function runShot(name) {
  const scene = stageShot(name, world, levelIndex);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, sound.muted);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const toField = (cx, cy) => {
    const { scale, ox, oy } = fieldTransform(canvas);
    return { x: (cx - ox) / scale, y: (cy - oy) / scale };
  };
  const input = createInput(canvas, toField);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    sound.unlock();
    announce('Playing. Steal the Moon Opal, then reach the exit unseen.');
  }

  function endGame(won) {
    screen = SCREEN_OVER;
    if (won && world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(won ? `Clean getaway. Score ${world.state.score}.` : 'Caught. Press Space to try again.');
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_SMOKE && screen === SCREEN_PLAY) {
      if (world.useGadget('smoke')) sound.smoke();
    }
    if (actions & ACTION_LURE && screen === SCREEN_PLAY) {
      if (world.useGadget('lure')) sound.lure();
    }
    if (actions & ACTION_EMP && screen === SCREEN_PLAY) {
      if (world.useGadget('emp')) sound.emp();
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_CONFIRM && screen === SCREEN_NEXT) {
      world.loadLevel(world.state.levelIndex + 1);
      screen = SCREEN_PLAY;
      announce(`${world.state.level.name}. ${world.state.level.subtitle}.`);
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    const target = input.takeClickTarget();
    if (target && screen === SCREEN_PLAY) {
      world.state.clickTarget = target;
      sound.unlock();
    }
  }

  function handleEvents(events) {
    if (events & EVENT_STEP) sound.footstep();
    if (events & EVENT_GUARD_STEP) {
      const p = world.state.player;
      let nearest = Infinity;
      for (const g of world.state.guards) {
        nearest = Math.min(nearest, Math.hypot(g.x - p.x, g.y - p.y));
      }
      sound.guardStep(nearest);
    }
    if (events & EVENT_LOOT) sound.loot();
    if (events & EVENT_OPAL) sound.opal();
    if (events & EVENT_SPOTTED) {
      sound.spotted();
      announce('Spotted! Break line of sight!');
    }
    if (events & EVENT_CAUGHT) {
      sound.caught();
      endGame(false);
    } else if (events & EVENT_WIN) {
      sound.win();
      if (world.state.status === 'levelComplete') {
        screen = SCREEN_NEXT;
        announce(`Heist complete. ${world.state.score} points so far.`);
      } else {
        endGame(true);
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, null, false);
      return;
    }
    const events = world.step(STEP, input.move(), input.sprinting());
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, sound.muted);
  }

  // Leaving the tab pauses a running game rather than letting guards walk unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Moonlight Gallery. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
