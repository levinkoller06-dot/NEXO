// Runs on the audio render thread, not the main thread. Downsamples the
// microphone's native sample rate (typically 48000Hz) to the 16000Hz mono
// 16-bit PCM the Gemini Live API expects, in small chunks, and posts each
// chunk to the main thread as a transferable ArrayBuffer.
class NexoMicDownsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.ratio = sampleRate / this.targetRate;
    this.acc = 0;
    this.pending = [];
    // ~20ms per chunk at 16kHz - small enough to keep latency low, large
    // enough to not flood the WebSocket with tiny messages.
    this.chunkSize = 320;
  }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.acc += 1;
        if (this.acc < this.ratio) continue;
        this.acc -= this.ratio;
        const sample = Math.max(-1, Math.min(1, channel[i]));
        this.pending.push(sample < 0 ? sample * 0x8000 : sample * 0x7fff);
        if (this.pending.length >= this.chunkSize) this._flush();
      }
    }
    return true;
  }
  _flush() {
    const int16 = new Int16Array(this.pending);
    this.pending = [];
    this.port.postMessage(int16.buffer, [int16.buffer]);
  }
}
registerProcessor('nexo-mic-downsampler', NexoMicDownsampler);
