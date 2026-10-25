// Web Audio API Synthesizer & Speech Synthesizer for Valorant Challenges

let audioCtx = null;
let masterGain = null;
let currentVolume = 0.8;

try {
  const saved = localStorage.getItem('valorant_gun_roulette_volume');
  if (saved !== null) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
      currentVolume = parsed;
    }
  }
} catch {
  // ignore
}

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMasterOutput(ctx) {
  if (!masterGain && ctx) {
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }
  return masterGain || ctx.destination;
}

// Play Valorant-style synthesized sound effects
export const soundFX = {
  getVolume: () => currentVolume,
  setVolume: (val) => {
    const numeric = Math.max(0, Math.min(1, Number(val)));
    currentVolume = numeric;
    try {
      localStorage.setItem('valorant_gun_roulette_volume', numeric.toString());
    } catch {
      // ignore
    }
    if (audioCtx) {
      const out = getMasterOutput(audioCtx);
      if (out && out.gain) {
        out.gain.setValueAtTime(numeric, audioCtx.currentTime);
      }
    }
  },

  // Kill chime that scales pitch based on current kill count
  playKill: (killCount = 1) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const master = getMasterOutput(ctx);

      // Base pitch increases with kills (1st = C5, 2nd = E5, 3rd = G5, 4th = B5, 5th+ = C6 ACE)
      const baseFreqs = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
      const freq = baseFreqs[Math.min(killCount - 1, baseFreqs.length - 1)] || 523.25;

      // Primary tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.4);

      // Subtle metallic overtone (Valorant hit chime feeling)
      const overtone = ctx.createOscillator();
      const overGain = ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.75, now);
      overGain.gain.setValueAtTime(0.15, now);
      overGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      overtone.connect(overGain);
      overGain.connect(master);

      overtone.start(now);
      overtone.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio playKill error:', e);
    }
  },

  // Ready to switch (Tier objective achieved!)
  playObjectiveComplete: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const master = getMasterOutput(ctx);

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(master);

        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch (e) {
      console.warn('Audio playObjectiveComplete error:', e);
    }
  },

  // Player died
  playDeath: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const master = getMasterOutput(ctx);

      // Low thump
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio playDeath error:', e);
    }
  },

  // Demoted back a tier
  playDemote: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const master = getMasterOutput(ctx);

      const notes = [440, 370, 311, 220]; // descending gloom
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.12;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

        osc.connect(gain);
        gain.connect(master);

        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    } catch (e) {
      console.warn('Audio playDemote error:', e);
    }
  },

  // Full Run Victory!
  playVictory: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const master = getMasterOutput(ctx);

      // Fanfare chords
      const chords = [
        [523.25, 659.25, 783.99],       // C Major
        [587.33, 739.99, 880.00],       // D Major
        [659.25, 830.61, 987.77],       // E Major
        [783.99, 987.77, 1174.66, 1567.98] // G Major High
      ];

      chords.forEach((chord, stepIdx) => {
        const stepTime = now + stepIdx * 0.18;
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, stepTime);

          const duration = stepIdx === chords.length - 1 ? 0.9 : 0.22;
          gain.gain.setValueAtTime(0.2, stepTime);
          gain.gain.exponentialRampToValueAtTime(0.001, stepTime + duration);

          osc.connect(gain);
          gain.connect(master);

          osc.start(stepTime);
          osc.stop(stepTime + duration);
        });
      });
    } catch (e) {
      console.warn('Audio playVictory error:', e);
    }
  }
};

// Tactical Voice Announcer using browser SpeechSynthesis
export const voiceAnnouncer = {
  speak: (text, enabled = true) => {
    if (!enabled || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = currentVolume;

      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  }
};
