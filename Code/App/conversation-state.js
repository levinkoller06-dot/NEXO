/* Small state machines, usable in the browser and in regression tests. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexoConversationState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  class MicController {
    constructor({ recognition, onChange = () => {}, onError = () => {}, delay = setTimeout, clear = clearTimeout }) {
      this.recognition = recognition; this.onChange = onChange; this.onError = onError;
      this.delay = delay; this.clear = clear; this.wanted = false; this.busy = false; this.actual = 'idle'; this.timer = null;
      recognition.onstart = () => { this.actual = 'listening'; this.sync(); };
      recognition.onend = () => { this.actual = 'idle'; this.notify(); this.schedule(); };
      recognition.onerror = e => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          this.wanted = false; this.actual = 'idle'; this.notify(); this.onError(e.error); return;
        }
        // Browsers report an abort before onend. Reset here as well so a quick
        // off/on click cannot leave the controller permanently in "stopping".
        this.actual = 'idle'; this.notify();
        if (e.error !== 'aborted' && e.error !== 'no-speech') this.onError(e.error);
        this.schedule();
      };
    }
    notify() { this.onChange({ wanted: this.wanted, busy: this.busy, actual: this.actual }); }
    setWanted(value) { this.wanted = !!value; this.sync(); }
    setBusy(value) { this.busy = !!value; this.sync(); }
    schedule() {
      this.clear(this.timer);
      if (this.wanted && !this.busy) this.timer = this.delay(() => {
        this.timer = null;
        if (this.actual === 'idle') this.sync();
        else if (this.actual === 'stopping') this.schedule();
      }, 250);
    }
    sync() {
      this.clear(this.timer); this.timer = null;
      if (this.wanted && !this.busy && this.actual === 'idle') {
        this.actual = 'starting';
        try { this.recognition.start(); }
        catch (err) {
          this.actual = 'idle';
          if (/notallowed|service-not-allowed/i.test(err.name || err.message || '')) {
            this.wanted = false; this.onError('not-allowed');
          } else this.schedule();
        }
      } else if ((!this.wanted || this.busy) && ['starting', 'listening'].includes(this.actual)) {
        this.actual = 'stopping';
        try { this.recognition.abort(); } catch { this.actual = 'idle'; }
      }
      this.notify();
    }
  }

  class SerialQueue {
    constructor({ run, onBusy = () => {}, onError = () => {} }) {
      this.run = run; this.onBusy = onBusy; this.onError = onError; this.items = []; this.running = false; this.controller = null;
    }
    push(text) {
      if (this.items.length >= 5) throw new Error('Warteschlange voll. Bitte auf die Antwort warten.');
      this.items.push(text); this.onBusy(true); void this.drain();
    }
    stop() { this.items = []; this.controller?.abort(); }
    async drain() {
      if (this.running) return;
      this.running = true;
      try {
        while (this.items.length) {
          const item = this.items.shift(); this.controller = new AbortController();
          try { await this.run(item, this.controller.signal); }
          catch (err) { if (!this.controller.signal.aborted) this.onError(err); }
        }
      } finally { this.running = false; this.controller = null; this.onBusy(false); }
    }
  }
  return { MicController, SerialQueue };
});
