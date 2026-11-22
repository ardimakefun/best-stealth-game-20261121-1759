// Sound, synthesized live with WebAudio: no audio files, nothing to load.
// Footsteps tell you where a guard is, a rising sting says you were spotted,
// a chime says you got away. Silent until the first key or click, and M mutes.

export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      try {
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctor) return null;
        context = new Ctor();
      } catch {
        return null;
      }
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function blip(freq, seconds, type, gain, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    amp.gain.setValueAtTime(gain, t);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    footstep() {
      blip(190, 0.05, 'sine', 0.05);
    },
    guardStep(distance) {
      // Quieter the further the guard is: footsteps that tell you where it is.
      const gain = Math.max(0.008, 0.06 - distance / 6000);
      blip(120, 0.06, 'triangle', gain);
    },
    loot() {
      blip(880, 0.12, 'sine', 0.08);
      blip(1320, 0.14, 'sine', 0.06, 0.07);
    },
    opal() {
      blip(660, 0.16, 'sine', 0.09);
      blip(990, 0.16, 'sine', 0.08, 0.09);
      blip(1320, 0.24, 'sine', 0.08, 0.18);
    },
    spotted() {
      blip(440, 0.12, 'sawtooth', 0.06);
      blip(587, 0.18, 'sawtooth', 0.06, 0.1);
    },
    smoke() {
      blip(220, 0.3, 'sine', 0.05);
      blip(180, 0.35, 'sine', 0.04, 0.08);
    },
    lure() {
      blip(1560, 0.08, 'sine', 0.07);
      blip(2080, 0.1, 'sine', 0.06, 0.09);
    },
    emp() {
      blip(880, 0.25, 'sawtooth', 0.05);
      blip(220, 0.3, 'sawtooth', 0.05, 0.12);
    },
    loop() {
      // A held, icy two-note freeze: the camera's sweep stops where it is.
      blip(1175, 0.4, 'triangle', 0.06);
      blip(880, 0.4, 'triangle', 0.05, 0.12);
    },
    laser() {
      blip(1200, 0.09, 'square', 0.05);
      blip(1200, 0.09, 'square', 0.05, 0.12);
    },
    caught() {
      blip(392, 0.22, 'sawtooth', 0.08);
      blip(311, 0.3, 'sawtooth', 0.08, 0.16);
      blip(233, 0.42, 'sawtooth', 0.08, 0.34);
    },
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => blip(freq, 0.28, 'sine', 0.08, i * 0.11));
    },
  };
}
