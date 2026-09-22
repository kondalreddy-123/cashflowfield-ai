/**
 * CashFlowShield AI - Web Audio API Sci-Fi Sound Synthesizer
 * Generates procedural futuristic audio effects for the 3D Shield Matrix.
 * 100% native Web Audio API - zero external audio asset dependencies.
 */

export class SoundFxManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Sound when shield repels or deflects a cash leak particle wave.
   */
  playDeflectionPulse() {
    if (this.isMuted) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);

      // Subtle metallic shimmer overtone
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(1200, now);
      chime.frequency.linearRampToValueAtTime(800, now + 0.2);
      chimeGain.gain.setValueAtTime(0.08, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      chime.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chime.start(now);
      chime.stop(now + 0.21);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Sound when clicking or focusing on a 3D satellite node.
   */
  playNodeFocus() {
    if (this.isMuted) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  /**
   * Sound when changing scenarios or modes.
   */
  playModeSwitch() {
    if (this.isMuted) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }
}
