// Moonlight Gallery: the renderer. One canvas, one 1280x720 field scaled to
// fit the window: the floor, the cover you can read at a glance, the guards
// with their vision cones, the exit, the HUD and the screens. The cones are
// drawn under the guards but over the floor, so the danger is always visible.

import { DETECTION, EXIT, FIELD, FONT, GUARD, PALETTE } from './config.js';
import { LEVEL } from './level.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
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
    ctx.fillStyle = 'rgba(8, 10, 18, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, 46);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `700 17px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('MOONLIGHT GALLERY', 16, 29);
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'center';
    const objective = state.opalTaken ? 'Opal secured — reach the green EXIT, unseen' : 'Steal the Moon Opal from the north gallery';
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
    ctx.fillText(state.seen ? 'SEEN!' : 'UNSEEN', FIELD.width / 2 + mw / 2 + 34, 36);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `600 14px ${FONT}`;
    ctx.fillText(`◆ ${state.lootTaken}/3    ${state.opalTaken ? '⬢ OPAL' : '○ OPAL'}    ${formatTime(state.time)}    ${state.score} pts`, FIELD.width - 16, 29);
    ctx.textAlign = 'left';
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`WASD / arrows to move · click to walk · Shift to sprint · P pause · M ${muted ? 'unmute' : 'mute'}`, 16, FIELD.height - 12);
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

    // The Moon Opal on its pedestal, north gallery.
    if (!state.opalTaken) {
      drawGem(LEVEL.opal.x, LEVEL.opal.y, 12, PALETTE.opal, time, 0);
      ctx.font = `600 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.opal;
      ctx.fillText('MOON OPAL', LEVEL.opal.x, LEVEL.opal.y - 24);
    }
    for (const gem of state.loot) {
      if (!gem.taken) drawGem(gem.x, gem.y, 9, PALETTE.loot, time, gem.x);
    }

    // Vision cones, then the guards standing in them.
    for (const g of state.guards) drawCone(g, state);
    for (const g of state.guards) drawGuard(g, state, time);
    drawPlayer(state.player, state, time);

    // Vignette: the gallery is dark at its edges.
    const vig = ctx.createRadialGradient(640, 360, 300, 640, 360, 760);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    drawHud(state, best, muted);

    if (screen === SCREEN_TITLE) {
      drawOverlay('MOONLIGHT GALLERY', [
        'A thief. A museum. One Moon Opal, three night guards.',
        'Steal the Opal, then reach the green EXIT — unseen.',
        'Hide behind cases and planters: a guard only sees',
        'what its yellow cone touches with a clear line of sight.',
        '',
        'Press SPACE or click to start',
      ], PALETTE.gold);
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay('PAUSED', ['Press P or SPACE to keep sneaking.'], PALETTE.muted);
    } else if (screen === SCREEN_OVER && state.status === 'won') {
      drawOverlay('CLEAN GETAWAY', [
        `Out in ${formatTime(state.time)} with ${state.lootTaken}/3 gems — ${state.score} points.`,
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
