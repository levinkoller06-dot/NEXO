// Gapless playback for the raw 16-bit/24kHz/mono PCM chunks the Gemini Live
// API streams back (Code/Server/live.js forwards them as-is over the /ws/voice
// WebSocket, no WAV container). Each chunk is scheduled to start exactly when
// the previous one ends, so back-to-back chunks sound continuous instead of
// clicking/gapping between them. Shares the same analyser-based level()
// approach as speech-player.js so head.js's mouth animation needs no change.
(function (root) {
  class NexoLivePlayer {
    constructor({ onSpeaking = () => {}, idleMs = 400, createContext = () => new (root.AudioContext || root.webkitAudioContext)({ sampleRate: 24000 }) } = {}) {
      this.onSpeaking = onSpeaking; this.createContext = createContext; this.idleMs = idleMs;
      this.context = null; this.analyser = null; this.samples = null;
      this.nextStart = 0; this.activeSources = new Set(); this.speaking = false; this.idleTimer = null;
    }
    async unlock() {
      if (!this.context) {
        this.context = this.createContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.context.destination);
        this.samples = new Float32Array(this.analyser.fftSize);
      }
      if (this.context.state === 'suspended') await this.context.resume();
    }
    level() {
      if (!this.speaking || !this.context || this.context.state !== 'running') return 0;
      this.analyser.getFloatTimeDomainData(this.samples);
      const rms = Math.sqrt(this.samples.reduce((sum, n) => sum + n * n, 0) / this.samples.length);
      return rms < 0.008 ? 0 : Math.min(1, rms * 6);
    }
    // buffer: ArrayBuffer of 16-bit little-endian PCM samples at 24000Hz mono.
    async push(buffer) {
      await this.unlock();
      const int16 = new Int16Array(buffer);
      if (!int16.length) return;
      const audioBuffer = this.context.createBuffer(1, int16.length, 24000);
      const channel = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16.length; i++) channel[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);
      const startAt = Math.max(this.context.currentTime, this.nextStart);
      source.start(startAt);
      this.nextStart = startAt + audioBuffer.duration;
      this.activeSources.add(source);
      source.onended = () => { this.activeSources.delete(source); this._scheduleIdleCheck(); };
      clearTimeout(this.idleTimer);
      if (!this.speaking) { this.speaking = true; this.onSpeaking(true); }
    }
    _scheduleIdleCheck() {
      clearTimeout(this.idleTimer);
      // A short grace period absorbs the normal gap between two consecutive
      // audio parts of the same reply; if nothing new arrives, the turn is over.
      this.idleTimer = setTimeout(() => { if (this.activeSources.size === 0) this._setIdle(); }, this.idleMs);
    }
    // Hard stop for barge-in: discard everything scheduled/playing right now.
    stop() {
      clearTimeout(this.idleTimer);
      for (const source of this.activeSources) { source.onended = null; try { source.stop(); } catch {} }
      this.activeSources.clear();
      this.nextStart = 0;
      this._setIdle();
    }
    _setIdle() {
      if (!this.speaking) return;
      this.speaking = false; this.onSpeaking(false);
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = NexoLivePlayer;
  else root.NexoLivePlayer = NexoLivePlayer;
})(typeof window !== 'undefined' ? window : globalThis);
