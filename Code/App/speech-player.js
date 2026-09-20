/* Mouth energy comes from the same audio graph that feeds the speakers. */
(function (root) {
  class NexoSpeechPlayer {
    constructor({ onSpeaking = () => {}, createContext = () => new (root.AudioContext || root.webkitAudioContext)() } = {}) {
      this.onSpeaking = onSpeaking; this.createContext = createContext;
      this.context = null; this.active = null; this.energy = 0;
    }
    async unlock() {
      if (!this.context) this.context = this.createContext();
      if (this.context.state === 'suspended') await this.context.resume();
    }
    stop() { this.active?.finish(); this.energy = 0; }
    level() {
      if (!this.active || this.context.state !== 'running') return 0;
      this.active.analyser.getFloatTimeDomainData(this.active.samples);
      const rms = Math.sqrt(this.active.samples.reduce((sum, n) => sum + n * n, 0) / this.active.samples.length);
      // Noise gate keeps the mouth shut through pauses; short smoothing avoids jitter.
      const target = rms < 0.008 ? 0 : Math.min(1, rms * 6);
      this.energy += (target - this.energy) * 0.65;
      return this.energy;
    }
    async play(blob, signal) {
      this.stop();
      if (signal.aborted) return;
      await this.unlock();
      const buffer = await this.context.decodeAudioData(await blob.arrayBuffer());
      if (signal.aborted) return;
      return new Promise((resolve, reject) => {
        const source = this.context.createBufferSource(), analyser = this.context.createAnalyser();
        analyser.fftSize = 256; source.buffer = buffer;
        source.connect(analyser); analyser.connect(this.context.destination);
        let finished = false, timer;
        const finish = (error) => {
          if (finished) return; finished = true;
          clearTimeout(timer); signal.removeEventListener('abort', abort);
          source.onended = null;
          try { source.stop(); } catch {}
          source.disconnect(); analyser.disconnect(); this.active = null; this.energy = 0;
          this.onSpeaking(false); error ? reject(error) : resolve();
        };
        const abort = () => finish();
        this.active = { analyser, samples: new Float32Array(analyser.fftSize), finish };
        signal.addEventListener('abort', abort, { once: true });
        source.onended = () => finish();
        timer = setTimeout(() => finish(new Error('Audio-Wiedergabe hat nicht abgeschlossen.')), (buffer.duration + 10) * 1000);
        try { source.start(); this.onSpeaking(true); } catch (error) { finish(error); }
      });
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = NexoSpeechPlayer;
  else root.NexoSpeechPlayer = NexoSpeechPlayer;
})(typeof window !== 'undefined' ? window : globalThis);
