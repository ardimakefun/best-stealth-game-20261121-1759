// Moonlight Gallery: the renderer. One canvas, one 1280x720 field scaled to
// fit the window: the floor, the cover you can read at a glance, the guards
// with their vision cones, the exit, the HUD and the screens. The cones are
// drawn under the guards but over the floor, so the danger is always visible.

import { CAMERA, DETECTION, EXIT, FIELD, FONT, GUARD, PALETTE } from './config.js';
import { LEVELS } from './level.js';
import { cameraFacing } from './cameras.js';
import { laserActive } from './lasers.js';
import { createParticles, drawDust, stepParticles } from './particles.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_NEXT = 'next';
export const SCREEN_OVER = 'over';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** The transform that fits the field into the canvas, letterboxed. */
export function fieldTransform(canvas) {
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  return {
    scale,
    ox: (canvas.width - FIELD.width * scale) / 2,
    oy: (canvas.height - FIELD.height * scale) / 2,
  };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const particles = createParticles(createRandom(20261122), 42, FIELD.width, FIELD.height);
  let lastTime = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  function drawCone(guard, state) {
    const alert = state.meter >= DETECTION.investigateAt;
    const suspicious = state.meter > 0;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, GUARD.coneRange, guard.facing - GUARD.coneHalfAngle, guard.facing + GUARD.coneHalfAngle);
    ctx.closePath();
    ctx.fillStyle = alert ? PALETTE.coneAlert : PALETTE.cone;
    ctx.fill();
    ctx.strokeStyle = alert ? PALETTE.coneAlertEdge : PALETTE.coneEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (suspicious) {
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.arc(guard.x, guard.y, GUARD.coneRange * (state.meter / 100), guard.facing - GUARD.coneHalfAngle, guard.facing + GUARD.coneHalfAngle);
      ctx.closePath();
      ctx.fillStyle = alert ? 'rgba(255, 92, 60, 0.16)' : 'rgba(255, 214, 90, 0.10)';
      ctx.fill();
    }
  }

  function drawCamera(cam, state) {
    const off = state.time < cam.disabledUntil;
    const facing = cameraFacing(cam, state.time);
    if (!off) {
      ctx.beginPath();
      ctx.moveTo(cam.x, cam.y);
      ctx.arc(cam.x, cam.y, cam.range, facing - cam.halfAngle, facing + cam.halfAngle);
      ctx.closePath();
      ctx.fillStyle = PALETTE.cameraCone;
      ctx.fill();
      ctx.strokeStyle = PALETTE.cameraConeEdge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Wall mount, lens, and the name a player learns to watch for.
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = off ? PALETTE.cameraOff : PALETTE.camera;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(facing) * 4, cam.y + Math.sin(facing) * 4, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = off ? PALETTE.cameraOff : PALETTE.cameraLens;
    ctx.fill();
    ctx.font = `600 10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = off ? PALETTE.danger : PALETTE.muted;
    ctx.fillText(off ? `${cam.name} OFF` : cam.name, cam.x, cam.y - 16);
  }

  function drawLaser(laser, state) {
    const on = laserActive(laser, state.time);
    const pulse = 0.55 + Math.sin(state.time * 6) * 0.25;
    // The beam itself: a bright red line when live, a faint dashed one
    // when dark, so the thief always sees where the tripwire is.
    ctx.save();
    if (on) {
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = PALETTE.laser;
      ctx.lineWidth = 4;
      ctx.shadowColor = PALETTE.laser;
      ctx.shadowBlur = 14;
    } else {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = PALETTE.laserOff;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
    }
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y1);
    ctx.lineTo(laser.x2, laser.y2);
    ctx.stroke();
    ctx.restore();
    // Emitter posts at both ends, with the beam's name.
    for (const [ex, ey] of [[laser.x1, laser.y1], [laser.x2, laser.y2]]) {
      ctx.beginPath();
      ctx.arc(ex, ey, 7, 0, Math.PI * 2);
      ctx.fillStyle = on ? PALETTE.laserPost : PALETTE.cameraOff;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#ffd166' : PALETTE.muted;
      ctx.fill();
    }
    ctx.font = `600 10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = on ? PALETTE.danger : PALETTE.muted;
    const mx = (laser.x1 + laser.x2) / 2;
    const my = (laser.y1 + laser.y2) / 2;
    ctx.fillText(on ? `${laser.name} LIVE` : `${laser.name} OFF`, mx, my - 12);
  }

  function drawSmoke(state, time) {
    for (const c of state.gadgets.clouds) {
      const remain = Math.max(0, c.until - time);
      const alpha = Math.min(1, remain / 1.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      for (const [ox, oy, r] of [[-22, 6, 30], [18, -8, 34], [0, 10, 26], [-4, -18, 24]]) {
        ctx.beginPath();
        ctx.arc(c.x + ox, c.y + oy, r, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.smoke;
        ctx.fill();
      }
      ctx.restore();
    }
    for (const l of state.gadgets.lures) {
      const pulse = 1 + Math.sin(time * 8) * 0.15;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 26 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 211, 77, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(l.x, l.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.loot;
      ctx.fill();
    }
  }

  function drawGuard(guard, state, time) {
    // A guard standing in another guard's cone is still drawn over its own cone.
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.guard;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
    // Cap and the direction the guard faces.
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius - 4, guard.facing - 1.1, guard.facing + 1.1);
    ctx.strokeStyle = PALETTE.guardCap;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD.radius + 8), guard.y + Math.sin(guard.facing) * (GUARD.radius + 8));
    ctx.strokeStyle = PALETTE.guardCap;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `600 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - GUARD.radius - 8);
    if (guard.state === 'investigate') {
      ctx.font = `700 20px ${FONT}`;
      ctx.fillStyle = PALETTE.danger;
      ctx.fillText('?', guard.x, guard.y - GUARD.radius - 22 + Math.sin(time * 6) * 2);
    }
  }

  function drawPlayer(p, state, time) {
    const bob = Math.sin(time * 3) * 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 11, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.player;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();
    // Hood and the direction the thief faces.
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 6, p.facing - 1.2, p.facing + 1.2);
    ctx.strokeStyle = PALETTE.playerHood;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + bob);
    ctx.lineTo(p.x + Math.cos(p.facing) * 17, p.y + bob + Math.sin(p.facing) * 17);
    ctx.strokeStyle = 'rgba(238,241,245,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (state.seen) {
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob, 17 + Math.sin(time * 10) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = PALETTE.danger;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.font = `700 18px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.danger;
      ctx.fillText('!', p.x, p.y - 20 + bob);
    }
  }

  function drawGem(x, y, radius, color, time, phase) {
    const glow = 0.5 + Math.sin(time * 3 + phase) * 0.2;
    const grad = ctx.createRadialGradient(x, y, 1, x, y, radius * 3);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = glow * 0.55;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius * 0.7, y);
    ctx.lineTo(x, y + radius);
    ctx.lineTo(x - radius * 0.7, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawHud(state, best, muted) {
    const artifact = state.level.artifact;
    ctx.fillStyle = 'rgba(8, 10, 18, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, 46);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `700 17px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('MOONLIGHT GALLERY', 16, 29);
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'center';
    const objective = state.artifactTaken
      ? `${artifact.name} secured — reach the green EXIT, unseen`
      : `Steal the ${artifact.name} — heist ${state.levelIndex + 1} of ${LEVELS.length}`;
    ctx.fillText(objective, FIELD.width / 2, 20);
    // Detection meter under the objective.
    const mw = 240;
    const mx = FIELD.width / 2 - mw / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(mx, 28, mw, 8);
    const frac = state.meter / 100;
    ctx.fillStyle = frac < 0.55 ? '#ffd65a' : '#ff5c3c';
    if (frac > 0) ctx.fillRect(mx, 28, mw * frac, 8);
    ctx.font = `600 11px ${FONT}`;
    ctx.fillStyle = state.seen ? PALETTE.danger : PALETTE.muted;
    ctx.fillText(state.seen ? (state.seenBy === 'camera' ? 'CAMERA!' : state.seenBy === 'laser' ? 'LASER!' : 'SEEN!') : 'UNSEEN', FIELD.width / 2 + mw / 2 + 34, 36);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `600 14px ${FONT}`;
    ctx.fillText(`◆ ${state.lootTaken}/${state.level.loot.length}    ${state.artifactTaken ? '⬢ ' + artifact.name : '○ ' + artifact.name}    ${formatTime(state.time)}    ${state.score} pts`, FIELD.width - 16, 29);
    ctx.textAlign = 'left';
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`WASD / arrows to move · click to walk · Shift to sprint · P pause · M ${muted ? 'unmute' : 'mute'}`, 16, FIELD.height - 12);
    // Gadget counts, bottom right: what the thief still carries.
    const g = state.gadgets;
    ctx.textAlign = 'right';
    ctx.font = `600 12px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`1 smoke ×${g.smoke}   2 lure ×${g.lure}   3 EMP ×${g.emp}`, FIELD.width - 16, FIELD.height - 12);
    ctx.textAlign = 'left';
  }

  function drawOverlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(5, 7, 13, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const w = 620;
    const h = 330;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.fillStyle = '#12151f';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText(title, FIELD.width / 2, y + 62);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `500 16px ${FONT}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, FIELD.width / 2, y + 108 + i * 30);
    });
  }

  function draw(state, screen, best, muted) {
    const { scale, ox, oy } = fieldTransform(canvas);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    const time = state.time;

    // Floor: two-tone tiles, then the north gallery's carpet runner.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.floorAlt;
    for (let y = 0; y < 720; y += 80) {
      for (let x = (y / 80) % 2 === 0 ? 0 : 40; x < 1280; x += 80) {
        ctx.fillRect(x, y, 40, 40);
      }
    }
    ctx.fillStyle = PALETTE.carpet;
    ctx.fillRect(40, 40, 1200, 300);
    ctx.strokeStyle = PALETTE.carpetEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, 1200, 300);
    // Moonlight shafts falling through the high windows.
    ctx.save();
    ctx.fillStyle = 'rgba(190, 210, 255, 0.045)';
    for (const [bx, bw] of [[180, 120], [560, 150], [980, 110]]) {
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + bw, 0);
      ctx.lineTo(bx + bw + 90, FIELD.height);
      ctx.lineTo(bx + 90, FIELD.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Warm lamp pools on the floor.
    for (const [lx, ly] of [[320, 200], [960, 200], [640, 520], [200, 620], [1080, 620]]) {
      const grad = ctx.createRadialGradient(lx, ly, 10, lx, ly, 150);
      grad.addColorStop(0, 'rgba(255, 214, 140, 0.10)');
      grad.addColorStop(1, 'rgba(255, 214, 140, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, 150, 0, Math.PI * 2);
      ctx.fill();
    }

    // Exit door, south-west: a green doorway in the floor.
    const exitGlow = 0.5 + Math.sin(time * 2) * 0.15;
    ctx.globalAlpha = exitGlow;
    ctx.fillStyle = PALETTE.exit;
    ctx.fillRect(EXIT.x, EXIT.y, EXIT.width, EXIT.height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.exitDark;
    ctx.fillRect(EXIT.x + 8, EXIT.y + 8, EXIT.width - 16, EXIT.height - 16);
    ctx.fillStyle = PALETTE.exit;
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', EXIT.x + EXIT.width / 2, EXIT.y + EXIT.height / 2 + 7);

    // Blockers: walls, cases, planters.
    for (const b of state.blockers) {
      if (b.kind === 'wall') {
        ctx.fillStyle = PALETTE.wall;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = PALETTE.wallTop;
        ctx.fillRect(b.x, b.y, b.w, 3);
      } else if (b.kind === 'case') {
        ctx.fillStyle = PALETTE.caseGlass;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = PALETTE.caseTrim;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x + 8, b.y + b.h - 10);
        ctx.lineTo(b.x + b.w - 14, b.y + 10);
        ctx.stroke();
      } else if (b.kind === 'pillar') {
        ctx.fillStyle = PALETTE.pillar;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = PALETTE.pillarTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
        ctx.fillStyle = PALETTE.pillarTop;
        ctx.fillRect(b.x, b.y, b.w, 4);
      } else {
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.planter;
        ctx.fill();
        ctx.fillStyle = PALETTE.planterLeaf;
        for (let i = 0; i < 5; i += 1) {
          const a = (i / 5) * Math.PI * 2 + 0.4;
          ctx.beginPath();
          ctx.arc(b.x + b.w / 2 + Math.cos(a) * 14, b.y + b.h / 2 + Math.sin(a) * 14, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // The artifact on its pedestal, in this heist's hall.
    const artifact = state.level.artifact;
    if (!state.artifactTaken) {
      drawGem(artifact.x, artifact.y, 12, PALETTE.opal, time, 0);
      ctx.font = `600 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.opal;
      ctx.fillText(artifact.name, artifact.x, artifact.y - 24);
    }
    for (const gem of state.loot) {
      if (!gem.taken) drawGem(gem.x, gem.y, 9, PALETTE.loot, time, gem.x);
    }

    // Vision cones, lasers, then the guards standing in them.
    for (const g of state.guards) drawCone(g, state);
    for (const cam of state.cameras) drawCamera(cam, state);
    for (const laser of state.lasers) drawLaser(laser, state);
    drawSmoke(state, time);
    for (const g of state.guards) drawGuard(g, state, time);
    drawPlayer(state.player, state, time);

    // Dust motes drifting in the moonlight.
    stepParticles(particles, Math.max(0, Math.min(0.1, time - lastTime)), FIELD.width, FIELD.height);
    lastTime = time;
    drawDust(ctx, particles, time);

    // Vignette: the gallery is dark at its edges.
    const vig = ctx.createRadialGradient(640, 360, 300, 640, 360, 760);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    drawHud(state, best, muted);

    if (screen === SCREEN_TITLE) {
      drawOverlay('MOONLIGHT GALLERY', [
        'A thief. A museum. Four heists, twenty guards, seven cameras, seven lasers.',
        'Steal each artifact, then reach the green EXIT — unseen.',
        'Hide behind cases and planters: a guard only sees',
        'what its yellow cone touches with a clear line of sight.',
        'Cameras sweep orange cones — EMP them, smoke them, or time them.',
        'Red lasers pulse across the doors — cross on the dark beat, or EMP them.',
        '1 smoke · 2 lure · 3 EMP — gadgets refill every heist.',
        '',
        'Press SPACE or click to start',
      ], PALETTE.gold);
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay('PAUSED', ['Press P or SPACE to keep sneaking.'], PALETTE.muted);
    } else if (screen === SCREEN_NEXT) {
      drawOverlay('HEIST COMPLETE', [
        `${state.level.artifact.name} secured — ${state.score} points so far.`,
        `Next: ${LEVELS[state.levelIndex + 1].name} — ${LEVELS[state.levelIndex + 1].subtitle}.`,
        '',
        'Press SPACE or click for the next heist',
      ], PALETTE.exit);
    } else if (screen === SCREEN_OVER && state.status === 'won') {
      const totalLoot = LEVELS.reduce((n, l) => n + l.loot.length, 0);
      drawOverlay('CLEAN GETAWAY', [
        `All four artifacts out in ${formatTime((state.totalTime ?? 0) + state.time)} — ${state.score} points.`,
        `${state.lootTotal}/${totalLoot} gems pocketed along the way.`,
        state.score > best ? 'A new best getaway!' : `Best getaway: ${best} points.`,
        '',
        'Press SPACE or click to play again',
      ], PALETTE.exit);
    } else if (screen === SCREEN_OVER) {
      drawOverlay('CAUGHT!', [
        'A guard saw you. The alarm is ringing.',
        'Watch the patrols, wait for the cone to pass,',
        'and slip behind cover before the meter fills.',
        '',
        'Press SPACE or click to try again',
      ], PALETTE.danger);
    }
  }

  return { draw, resize };
}
