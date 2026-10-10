/**
 * Tactile Minimalist UI Sounds & Cinematic Intro FX Engine
 * - Crisp tactile UI clicks
 * - NFS Heat / Payback style mechanical intro sequence ("ТТТТпкркрщщщщ ... БУУУМ")
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a light, crisp, organic click without heavy sub-bass.
 */
export function playPalateClick(volume = 0.22) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.014);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(620, now);
    filter.Q.setValueAtTime(1.5, now);

    gain.gain.setValueAtTime(volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);

    const snapLen = Math.floor(ctx.sampleRate * 0.003);
    const snapBuf = ctx.createBuffer(1, snapLen, ctx.sampleRate);
    const snapData = snapBuf.getChannelData(0);
    for (let i = 0; i < snapLen; i++) {
      snapData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / snapLen, 4);
    }

    const snapSource = ctx.createBufferSource();
    snapSource.buffer = snapBuf;

    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(2400, now);
    snapFilter.Q.setValueAtTime(2.0, now);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(volume * 0.35, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);

    snapSource.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(ctx.destination);

    snapSource.start(now);
    snapSource.stop(now + 0.006);
  } catch {
    // Graceful error handling
  }
}

/**
 * Need For Speed Heat / Payback cinematic audio intro:
 * 1. Rapid mechanical tech ratchet ticks ("Т-Т-Т-Т-Т")
 * 2. High-speed tape/digital scrub build-up ("пкркрщщщщ")
 * 3. Deep cinematic sub-bass explosion impact ("БУУУМ") with shimmering tail
 */
export function playNfsIntroSfx(volume = 0.55) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const start = ctx.currentTime;

    // Phase 1: Rapid mechanical ratchet stutter clicks ("Т-Т-Т-Т-Т", 0ms to 450ms)
    const tickCount = 14;
    for (let i = 0; i < tickCount; i++) {
      // Exponentially accelerating intervals
      const progress = i / (tickCount - 1);
      const tickTime = start + (Math.pow(progress, 1.35) * 0.42);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + i * 28, tickTime);
      osc.frequency.exponentialRampToValueAtTime(60, tickTime + 0.016);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 + i * 160, tickTime);
      filter.Q.setValueAtTime(3.5, tickTime);

      gain.gain.setValueAtTime((volume * 0.4) * (0.3 + progress * 0.7), tickTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, tickTime + 0.022);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(tickTime);
      osc.stop(tickTime + 0.025);
    }

    // Phase 2: Electric glitch / vinyl scratch noise sweep ("пкркрщщщщ", 300ms to 550ms)
    const noiseDuration = 0.28;
    const noiseLen = Math.floor(ctx.sampleRate * noiseDuration);
    const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);

    for (let i = 0; i < noiseLen; i++) {
      const p = i / noiseLen;
      // Stutter gate modulation
      const gate = Math.sin(p * 90) > 0 ? 1 : 0.2;
      noiseData[i] = (Math.random() * 2 - 1) * gate * Math.pow(p, 1.8);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(800, start + 0.25);
    noiseFilter.frequency.exponentialRampToValueAtTime(4500, start + 0.52);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, start + 0.25);
    noiseGain.gain.exponentialRampToValueAtTime(volume * 0.65, start + 0.50);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.54);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseSource.start(start + 0.25);
    noiseSource.stop(start + 0.55);

    // Phase 3: The Heavy "BOOM" (Impact at 520ms)
    const impactTime = start + 0.52;

    // Deep sub drop (150Hz -> 35Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(145, impactTime);
    subOsc.frequency.exponentialRampToValueAtTime(32, impactTime + 0.45);

    subGain.gain.setValueAtTime(volume * 0.95, impactTime);
    subGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.85);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(impactTime);
    subOsc.stop(impactTime + 0.9);

    // Punch transient (Hard metallic slap)
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'sawtooth';
    punchOsc.frequency.setValueAtTime(320, impactTime);
    punchOsc.frequency.exponentialRampToValueAtTime(40, impactTime + 0.08);

    punchGain.gain.setValueAtTime(volume * 0.8, impactTime);
    punchGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.12);

    punchOsc.connect(punchGain);
    punchGain.connect(ctx.destination);

    punchOsc.start(impactTime);
    punchOsc.stop(impactTime + 0.13);

    // Air tail / cinematic reverberation
    const tailDuration = 0.9;
    const tailLen = Math.floor(ctx.sampleRate * tailDuration);
    const tailBuffer = ctx.createBuffer(1, tailLen, ctx.sampleRate);
    const tailData = tailBuffer.getChannelData(0);
    for (let i = 0; i < tailLen; i++) {
      tailData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / tailLen, 2.5);
    }

    const tailSource = ctx.createBufferSource();
    tailSource.buffer = tailBuffer;

    const tailFilter = ctx.createBiquadFilter();
    tailFilter.type = 'lowpass';
    tailFilter.frequency.setValueAtTime(1800, impactTime);
    tailFilter.frequency.exponentialRampToValueAtTime(220, impactTime + tailDuration);

    const tailGain = ctx.createGain();
    tailGain.gain.setValueAtTime(volume * 0.45, impactTime);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + tailDuration);

    tailSource.connect(tailFilter);
    tailFilter.connect(tailGain);
    tailGain.connect(ctx.destination);

    tailSource.start(impactTime);
    tailSource.stop(impactTime + tailDuration + 0.05);

  } catch {
    // Graceful error handling
  }
}
