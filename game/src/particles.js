// Particles: dust motes drifting in the moonlight. Purely visual — they
// never change what a guard sees, how fast anything moves, or any score.
// They are seeded with the game's own random source so a staged screenshot
// renders the same motes every time.

export function createParticles(random, count, width, height) {
  const motes = [];
  for (let i = 0; i < count; i += 1) {
    motes.push({
      x: random() * width,
      y: random() * height,
      r: 1 + random() * 1.8,
      phase: random() * Math.PI * 2,
      drift: 4 + random() * 8,
      fall: 2 + random() * 5,
    });
  }
  return motes;
}

/** Drift the motes down and sideways; a mote that leaves the floor wraps. */
export function stepParticles(motes, dt, width, height) {
  for (const m of motes) {
    m.x += Math.sin(m.phase) * m.drift * dt;
    m.y += m.fall * dt;
    m.phase += dt * 0.4;
    if (m.y > height + 4) m.y = -4;
    if (m.x < -4) m.x = width + 4;
    if (m.x > width + 4) m.x = -4;
  }
}

/** Paint the motes as faint warm sparks, twinkling slowly. */
export function drawDust(ctx, motes, time) {
  ctx.save();
  for (const m of motes) {
    const tw = 0.22 + 0.18 * Math.sin(time * 1.3 + m.phase);
    ctx.globalAlpha = Math.max(0.05, tw);
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
