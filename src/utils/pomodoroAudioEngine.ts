// Web Audio API Synthesizer & Lo-Fi Audio Engine for Savantix Pomodoro

export type SoundPresetId = 
  | 'gamma_40hz' 
  | 'alpha_10hz' 
  | 'brown_noise' 
  | 'pink_noise' 
  | 'white_noise' 
  | 'rain_ambient' 
  | 'cafe_ambient' 
  | 'lofi_beats';

export interface SoundPreset {
  id: SoundPresetId;
  name: string;
  category: 'binaural' | 'noise' | 'ambient' | 'stream';
  tagline: string;
  description: string;
  icon: string;
  freqLabel?: string;
  isStream?: boolean;
}

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'gamma_40hz',
    name: '40Hz Gamma Focus',
    category: 'binaural',
    tagline: 'Deep Cognitive Entrainment',
    description: '200Hz carrier with 40Hz binaural shift. Proven to enhance problem solving, working memory, and intense focus.',
    icon: '🧠',
    freqLabel: '40 Hz Binaural'
  },
  {
    id: 'alpha_10hz',
    name: '10Hz Alpha Waves',
    category: 'binaural',
    tagline: 'Flow State & Relaxed Alertness',
    description: '196Hz carrier with 10Hz binaural beat. Fosters effortless flow state, sustained calm, and creative thinking.',
    icon: '🌊',
    freqLabel: '10 Hz Binaural'
  },
  {
    id: 'brown_noise',
    name: 'Deep Brown Noise',
    category: 'noise',
    tagline: 'Soothing Cosmic Rumble',
    description: 'Low-frequency 1/f² Brownian noise filtered at 400Hz. Perfect for blocking chatter, traffic, and ADHD restlessness.',
    icon: '🪐',
    freqLabel: '1/f² Brownian'
  },
  {
    id: 'pink_noise',
    name: 'Balanced Pink Noise',
    category: 'noise',
    tagline: 'Gentle Waterfall Masking',
    description: 'Equal energy per octave (1/f). Mimics steady rainfall and leaves rustling for acoustic comfort.',
    icon: '🍃',
    freqLabel: '1/f Pink'
  },
  {
    id: 'white_noise',
    name: 'Crisp White Noise',
    category: 'noise',
    tagline: 'Full Acoustic Isolation',
    description: 'Uniform spectral density across frequencies to completely mask sharp background spikes.',
    icon: '❄️',
    freqLabel: 'Full Spectrum'
  },
  {
    id: 'rain_ambient',
    name: 'Gentle Rainstorm',
    category: 'ambient',
    tagline: 'Subtle Rain & Distant Thunder',
    description: 'Synthesized organic rain textures with soft low-pass air dynamics for peaceful studying.',
    icon: '🌧️',
    freqLabel: 'Bio-Acoustic'
  },
  {
    id: 'cafe_ambient',
    name: 'Cozy Study Café',
    category: 'ambient',
    tagline: 'Warm Harmonic Ambience',
    description: 'Subtle warm analog pad undertones combined with deep acoustic room warmth.',
    icon: '☕',
    freqLabel: 'Atmospheric'
  },
  {
    id: 'lofi_beats',
    name: 'Lo-Fi Chill Stream',
    category: 'stream',
    tagline: 'Mellow Downtempo Lo-Fi',
    description: 'Continuous high-fidelity chill beats stream with auto-fallback to brown noise if offline.',
    icon: '🎧',
    freqLabel: 'Online Stream',
    isStream: true
  }
];

class PomodoroAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // Active sound state
  private currentPreset: SoundPresetId = 'gamma_40hz';
  private isPlaying: boolean = false;
  private volume: number = 0.5; // 0.0 to 1.0
  private isMuted: boolean = false;

  // Active synth nodes
  private activeOscillators: OscillatorNode[] = [];
  private activeBufferSources: AudioBufferSourceNode[] = [];
  private activeGainNodes: GainNode[] = [];
  private activeIntervals: number[] = [];

  // Stream elements
  private audioElement: HTMLAudioElement | null = null;
  private audioMediaSource: MediaElementAudioSourceNode | null = null;
  private streamFallbackActive: boolean = false;

  // Status callbacks
  private onStateChangeCallbacks: Array<(state: { isPlaying: boolean; preset: SoundPresetId; isFallback: boolean }) => void> = [];

  constructor() {
    // Lazy audio context init on user gesture
  }

  public subscribe(cb: (state: { isPlaying: boolean; preset: SoundPresetId; isFallback: boolean }) => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(c => c !== cb);
    };
  }

  private notify() {
    const state = {
      isPlaying: this.isPlaying,
      preset: this.currentPreset,
      isFallback: this.streamFallbackActive
    };
    this.onStateChangeCallbacks.forEach(cb => cb(state));
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.ctx) {
      try {
        this.initContext();
      } catch {}
    }
    return this.analyser;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    if (this.audioElement && !this.audioMediaSource) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentPreset(): SoundPresetId {
    return this.currentPreset;
  }

  public isFallbackActive(): boolean {
    return this.streamFallbackActive;
  }

  public async play(presetId?: SoundPresetId) {
    if (presetId) {
      this.currentPreset = presetId;
    }
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.stopActiveAudio(false);
    this.streamFallbackActive = false;
    this.isPlaying = true;

    try {
      switch (this.currentPreset) {
        case 'gamma_40hz':
          this.startBinaural(200, 40, 0.25);
          break;
        case 'alpha_10hz':
          this.startBinaural(196, 10, 0.28);
          break;
        case 'brown_noise':
          this.startBrownNoise();
          break;
        case 'pink_noise':
          this.startPinkNoise();
          break;
        case 'white_noise':
          this.startWhiteNoise();
          break;
        case 'rain_ambient':
          this.startRainSynth();
          break;
        case 'cafe_ambient':
          this.startCafeSynth();
          break;
        case 'lofi_beats':
          this.startStreamWithFallback([
            'https://streams.ilovemusic.de/iloveradio17.mp3',
            'https://stream.zeno.fm/f3wvbbqmdg8uv',
            'https://stream.zeno.fm/0r0xa792kwzuv'
          ]);
          break;
        default:
          this.startBrownNoise();
          break;
      }
    } catch (e) {
      console.warn("Synthesizer error, falling back to brown noise:", e);
      this.streamFallbackActive = true;
      this.startBrownNoise();
    }

    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    this.stopActiveAudio(true);
    this.notify();
  }

  public togglePlay(presetId?: SoundPresetId) {
    if (this.isPlaying && (!presetId || presetId === this.currentPreset)) {
      this.pause();
    } else {
      this.play(presetId || this.currentPreset);
    }
  }

  private stopActiveAudio(fade: boolean = true) {
    // Clear recurring intervals
    this.activeIntervals.forEach(id => clearInterval(id));
    this.activeIntervals = [];

    // Stop and disconnect oscillators
    this.activeOscillators.forEach(osc => {
      try {
        if (fade && this.ctx) {
          osc.stop(this.ctx.currentTime + 0.05);
        } else {
          osc.stop();
        }
      } catch {}
      setTimeout(() => {
        try { osc.disconnect(); } catch {}
      }, 60);
    });
    this.activeOscillators = [];

    // Stop and disconnect buffer sources
    this.activeBufferSources.forEach(src => {
      try {
        if (fade && this.ctx) {
          src.stop(this.ctx.currentTime + 0.05);
        } else {
          src.stop();
        }
      } catch {}
      setTimeout(() => {
        try { src.disconnect(); } catch {}
      }, 60);
    });
    this.activeBufferSources = [];

    // Stop audio element stream
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.removeAttribute('src');
        this.audioElement.load();
      } catch {}
      this.audioElement = null;
    }
  }

  // --- 1. BINAURAL BEATS SYNTHESIZER ---
  private startBinaural(carrierFreq: number, beatFreq: number, baseGain: number = 0.25) {
    const ctx = this.initContext();
    if (!this.masterGain) return;

    // Stereo Panner or Channel Merger
    // Left Ear: carrierFreq
    // Right Ear: carrierFreq + beatFreq
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const subOsc = ctx.createOscillator(); // warm sub-layer

    leftOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(carrierFreq, ctx.currentTime);

    rightOsc.type = 'sine';
    rightOsc.frequency.setValueAtTime(carrierFreq + beatFreq, ctx.currentTime);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(carrierFreq / 2, ctx.currentTime);

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const subGain = ctx.createGain();

    leftGain.gain.setValueAtTime(baseGain, ctx.currentTime);
    rightGain.gain.setValueAtTime(baseGain, ctx.currentTime);
    subGain.gain.setValueAtTime(baseGain * 0.35, ctx.currentTime);

    // Stereo panning
    if (typeof ctx.createStereoPanner === 'function') {
      const leftPanner = ctx.createStereoPanner();
      leftPanner.pan.setValueAtTime(-0.95, ctx.currentTime);
      leftOsc.connect(leftGain);
      leftGain.connect(leftPanner);
      leftPanner.connect(this.masterGain);

      const rightPanner = ctx.createStereoPanner();
      rightPanner.pan.setValueAtTime(0.95, ctx.currentTime);
      rightOsc.connect(rightGain);
      rightGain.connect(rightPanner);
      rightPanner.connect(this.masterGain);
    } else {
      // Fallback for older Safari
      const merger = ctx.createChannelMerger(2);
      leftOsc.connect(leftGain);
      leftGain.connect(merger, 0, 0);
      rightOsc.connect(rightGain);
      rightGain.connect(merger, 0, 1);
      merger.connect(this.masterGain);
    }

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    leftOsc.start();
    rightOsc.start();
    subOsc.start();

    this.activeOscillators.push(leftOsc, rightOsc, subOsc);
  }

  // --- 2. BROWN NOISE GENERATOR ---
  private startBrownNoise() {
    const ctx = this.initContext();
    if (!this.masterGain) return;

    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 5; // 5s looped buffer
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let lastOutL = 0.0;
    let lastOutR = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      lastOutL = (lastOutL + (0.025 * whiteL)) / 1.025;
      lastOutR = (lastOutR + (0.025 * whiteR)) / 1.025;

      left[i] = lastOutL * 2.8;
      right[i] = lastOutR * 2.8;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter to give that warm, oceanic cosmic rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(0.7, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();
    this.activeBufferSources.push(noiseSource);
  }

  // --- 3. PINK NOISE GENERATOR ---
  private startPinkNoise() {
    const ctx = this.initContext();
    if (!this.masterGain) return;

    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 5;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0, b6L = 0;
    let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0, b6R = 0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      b0L = 0.99886 * b0L + whiteL * 0.0555179;
      b1L = 0.99332 * b1L + whiteL * 0.0750759;
      b2L = 0.96900 * b2L + whiteL * 0.1538520;
      b3L = 0.86650 * b3L + whiteL * 0.3104856;
      b4L = 0.55000 * b4L + whiteL * 0.5329522;
      b5L = -0.7616 * b5L - whiteL * 0.0168980;
      left[i] = (b0L + b1L + b2L + b3L + b4L + b5L + b6L + whiteL * 0.5362) * 0.12;
      b6L = whiteL * 0.115926;

      b0R = 0.99886 * b0R + whiteR * 0.0555179;
      b1R = 0.99332 * b1R + whiteR * 0.0750759;
      b2R = 0.96900 * b2R + whiteR * 0.1538520;
      b3R = 0.86650 * b3R + whiteR * 0.3104856;
      b4R = 0.55000 * b4R + whiteR * 0.5329522;
      b5R = -0.7616 * b5R - whiteR * 0.0168980;
      right[i] = (b0R + b1R + b2R + b3R + b4R + b5R + b6R + whiteR * 0.5362) * 0.12;
      b6R = whiteR * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();
    this.activeBufferSources.push(noiseSource);
  }

  // --- 4. WHITE NOISE GENERATOR ---
  private startWhiteNoise() {
    const ctx = this.initContext();
    if (!this.masterGain) return;

    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < bufferSize; i++) {
      left[i] = (Math.random() * 2 - 1) * 0.15;
      right[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(120, ctx.currentTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(6000, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, ctx.currentTime);

    noiseSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();
    this.activeBufferSources.push(noiseSource);
  }

  // --- 5. SYNTHESIZED RAINSTORM ---
  private startRainSynth() {
    const ctx = this.initContext();
    if (!this.masterGain) return;

    // Pink noise base bed
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < bufferSize; i++) {
      left[i] = (Math.random() * 2 - 1) * 0.18;
      right[i] = (Math.random() * 2 - 1) * 0.18;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Bandpass to emulate water hitting surfaces
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1100, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.6, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.35, ctx.currentTime);

    noiseSource.connect(bandpass);
    bandpass.connect(rainGain);
    rainGain.connect(this.masterGain);

    noiseSource.start();
    this.activeBufferSources.push(noiseSource);

    // Random gentle droplet generator
    const dropInterval = window.setInterval(() => {
      if (!this.isPlaying || this.currentPreset !== 'rain_ambient') return;
      try {
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        dropOsc.type = 'sine';
        const freq = 1200 + Math.random() * 1800;
        dropOsc.frequency.setValueAtTime(freq, ctx.currentTime);
        dropOsc.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + 0.08);

        dropGain.gain.setValueAtTime(0.04 * Math.random(), ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

        dropOsc.connect(dropGain);
        if (this.masterGain) dropGain.connect(this.masterGain);

        dropOsc.start();
        dropOsc.stop(ctx.currentTime + 0.09);
      } catch {}
    }, 180);

    this.activeIntervals.push(dropInterval);
  }

  // --- 6. SYNTHESIZED CAFE AMBIENCE ---
  private startCafeSynth() {
    const ctx = this.initContext();
    if (!this.masterGain) return;

    // Warm background chord drone (Cmaj9 / Fmaj9 soft warm synth pad)
    const freqs = [130.81, 164.81, 196.00, 246.94, 329.63]; // C3, E3, G3, B3, E4
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f + (Math.random() * 0.4 - 0.2), ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      oscGain.gain.setValueAtTime(0.06, ctx.currentTime);

      osc.connect(filter);
      filter.connect(oscGain);
      if (this.masterGain) oscGain.connect(this.masterGain);

      osc.start();
      this.activeOscillators.push(osc);
    });

    // Add subtle warm brown noise floor for room acoustics
    this.startBrownNoise();
  }

  // --- 7. STREAM WITH ROBUST AUTO-FALLBACK ---
  private startStreamWithFallback(urls: string[]) {
    let currentIdx = 0;
    const ctx = this.initContext();

    const tryStream = (index: number) => {
      if (index >= urls.length) {
        console.warn("All stream URLs failed or blocked. Automatically switching to Pure Brown Noise synthesizer.");
        this.streamFallbackActive = true;
        this.notify();
        this.startBrownNoise();
        return;
      }

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = urls[index];
      audio.volume = this.isMuted ? 0 : this.volume;
      this.audioElement = audio;

      // Connect to Web Audio Analyser if possible
      try {
        if (!this.audioMediaSource) {
          this.audioMediaSource = ctx.createMediaElementSource(audio);
          if (this.masterGain) {
            this.audioMediaSource.connect(this.masterGain);
          }
        }
      } catch {
        // Direct playback fallback if MediaElementSource is restricted by CORS
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(`Stream #${index} playback issue:`, err);
          tryStream(index + 1);
        });
      }

      audio.onerror = () => {
        console.warn(`Stream #${index} error. Trying fallback stream...`);
        tryStream(index + 1);
      };
    };

    tryStream(currentIdx);
  }

  // --- 8. HARMONIC ZEN CHIME SYNTHESIZER ---
  public playCompletionChime() {
    try {
      const ctx = this.initContext();
      if (ctx.state === 'suspended') ctx.resume();

      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0.4, ctx.currentTime);
      chimeGain.connect(ctx.destination);

      // Tibetan singing bowl & Japanese Zen chime frequencies (528Hz Solfeggio Love/Focus tone + harmonics)
      const harmonics = [
        { freq: 528, gain: 0.35, decay: 2.8 },
        { freq: 1056, gain: 0.20, decay: 2.0 },
        { freq: 1584, gain: 0.12, decay: 1.4 },
        { freq: 2112, gain: 0.08, decay: 0.9 },
        { freq: 792, gain: 0.22, decay: 2.4 } // Harmonious 5th
      ];

      harmonics.forEach(({ freq, gain, decay }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);

        osc.connect(g);
        g.connect(chimeGain);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + decay + 0.1);
      });

      // Second harmonic accent after 240ms
      setTimeout(() => {
        try {
          const accentOsc = ctx.createOscillator();
          const accentGain = ctx.createGain();
          accentOsc.type = 'sine';
          accentOsc.frequency.setValueAtTime(880, ctx.currentTime);

          accentGain.gain.setValueAtTime(0.001, ctx.currentTime);
          accentGain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
          accentGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);

          accentOsc.connect(accentGain);
          accentGain.connect(chimeGain);

          accentOsc.start(ctx.currentTime);
          accentOsc.stop(ctx.currentTime + 2.1);
        } catch {}
      }, 240);

    } catch (e) {
      console.warn("Chime playback error:", e);
    }
  }
}

// Global Singleton Instance
export const pomodoroAudio = new PomodoroAudioEngine();
