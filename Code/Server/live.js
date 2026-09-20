'use strict';
const WebSocket = require('ws');
const { SYSTEM_PROMPT, TOOL_DEFS } = require('./agent');

const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const MAX_RECONNECT_DELAY = 15000;
// SYSTEM_PROMPT is written for the classic text/tool loop, where a non-empty
// reply is enforced structurally (agent.js throws on an empty completion).
// The live model has no such guardrail: confirmed live against the real API
// that with the full prompt as-is, it silently executes tool calls (e.g.
// set_mode) and ends the turn without saying anything at all - the user
// hears nothing and it looks like NEXO stopped responding. This addendum
// alone (not the tool list, not the wording of the request) fixed it.
const LIVE_VOICE_ADDENDUM = '\n\nWICHTIG FÜR DIESES SPRACHGESPRÄCH: Du sprichst gerade live mit dem Nutzer per Stimme, es gibt keine Textoberfläche. Wenn du nichts sagst, hört der Nutzer absolut nichts. Sprich IMMER mindestens einen kurzen gesprochenen Satz, bei jeder Anfrage und nach jedem Werkzeugaufruf, auch für einfache Bestätigungen wie einen Moduswechsel.';

// The Live API rejects "additionalProperties" in function parameter schemas
// (confirmed against the real API), unlike the classic generateContent API
// which just ignores it. Everything else about TOOL_DEFS is reused as-is.
function stripAdditionalProperties(value) {
  if (Array.isArray(value)) return value.map(stripAdditionalProperties);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'additionalProperties')
    .map(([key, item]) => [key, stripAdditionalProperties(item)]));
}

function buildSetupMessage({ env, controlEnabled, resumeHandle }) {
  const defs = TOOL_DEFS.filter(t => controlEnabled || t.name === 'set_mode' || t.name === 'web_answer');
  const model = env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-preview-09-2025';
  const voiceName = env.GEMINI_TTS_VOICE || 'Charon';
  const setup = {
    model: 'models/' + model,
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT + LIVE_VOICE_ADDENDUM }] },
    tools: [{ functionDeclarations: defs.map(t => ({ name: t.name, description: t.description, parameters: stripAdditionalProperties(t.parameters) })) }],
    inputAudioTranscription: {},
    outputAudioTranscription: {}
  };
  setup.sessionResumption = resumeHandle ? { handle: resumeHandle } : {};
  return { setup };
}

// One LiveSession per connected browser tab: owns exactly one upstream
// Gemini Live WebSocket, forwards mic audio in, forwards model audio/
// transcripts/interruption out, and executes tool calls against the same
// desktop-control functions the old HTTP tool loop used.
class LiveSession {
  constructor({ env, controlEnabled = false, execute, onAudio, onTranscript, onInterrupted, onToolLog, onError, onStatus, WebSocketImpl = WebSocket }) {
    this.env = env;
    this.controlEnabled = controlEnabled;
    this.execute = execute;
    this.WebSocketImpl = WebSocketImpl;
    this.onAudio = onAudio || (() => {});
    this.onTranscript = onTranscript || (() => {});
    this.onInterrupted = onInterrupted || (() => {});
    this.onToolLog = onToolLog || (() => {});
    this.onError = onError || (() => {});
    this.onStatus = onStatus || (() => {});
    this.resumeHandle = null;
    this.ready = false;
    this.closed = false;
    this.reconnectDelay = 2000;
    this.reconnectTimer = null;
    this.ws = null;
    this._connect();
  }
  _connect() {
    if (this.closed) return;
    const key = this.env.GEMINI_API_KEY;
    if (!key) { this.onError(new Error('Gemini-Key fehlt in Server/.env.')); return; }
    this.onStatus('connecting');
    let ws;
    try { ws = new this.WebSocketImpl(GEMINI_LIVE_WS_URL + '?key=' + encodeURIComponent(key)); }
    catch (err) { this.onError(err); this._scheduleReconnect(); return; }
    this.ws = ws;
    ws.on('open', () => {
      const message = buildSetupMessage({ env: this.env, controlEnabled: this.controlEnabled, resumeHandle: this.resumeHandle });
      ws.send(JSON.stringify(message));
    });
    ws.on('message', data => this._handleMessage(data));
    ws.on('error', err => this.onError(err));
    ws.on('close', () => {
      this.ready = false;
      if (this.closed) return;
      this.onStatus('reconnecting');
      this._scheduleReconnect();
    });
  }
  _scheduleReconnect() {
    if (this.closed || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(MAX_RECONNECT_DELAY, this.reconnectDelay + 1000);
      this._connect();
    }, this.reconnectDelay);
  }
  async _handleMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw.toString('utf8')); } catch { return; }
    if (msg.setupComplete) { this.ready = true; this.reconnectDelay = 2000; this.onStatus('ready'); return; }
    const update = msg.sessionResumptionUpdate;
    if (update?.resumable && update.newHandle) this.resumeHandle = update.newHandle;
    const sc = msg.serverContent;
    if (sc) {
      if (sc.interrupted) this.onInterrupted();
      for (const part of sc.modelTurn?.parts || []) {
        if (part.inlineData?.mimeType?.startsWith('audio/')) this.onAudio(Buffer.from(part.inlineData.data, 'base64'));
      }
      if (sc.outputTranscription?.text) this.onTranscript({ who: 'model', text: sc.outputTranscription.text });
      if (sc.inputTranscription?.text) this.onTranscript({ who: 'user', text: sc.inputTranscription.text });
    }
    if (msg.toolCall) await this._handleToolCall(msg.toolCall);
    if (msg.toolCallCancellation?.ids) {
      this.cancelledIds = this.cancelledIds || new Set();
      for (const id of msg.toolCallCancellation.ids) this.cancelledIds.add(id);
    }
  }
  async _handleToolCall(toolCall) {
    const responses = [], screenshots = [];
    for (const fc of toolCall.functionCalls || []) {
      if (this.cancelledIds?.has(fc.id)) continue;
      let response;
      try { response = await this.execute(fc.name, fc.args || {}); }
      catch (err) { response = { ok: false, message: String(err.message || err).slice(0, 300) }; }
      if (this.cancelledIds?.has(fc.id)) continue;
      const { image, mimeType, frameId, ...summary } = response || {};
      this.onToolLog({ name: fc.name, result: summary });
      responses.push({ id: fc.id, name: fc.name, response: summary });
      if (image) screenshots.push({ image, mimeType: mimeType || 'image/jpeg', frameId });
    }
    if (!responses.length || this.ws?.readyState !== WebSocket.OPEN) return;
    // The toolResponse for a call must be sent before anything else, or the
    // model appears to silently drop the rest of the turn (confirmed live):
    // only afterwards can a screenshot ride along as real visual content (a
    // clientContent turn), since the Live API only ever "sees" images that
    // arrive as inlineData parts in a content turn - one embedded inside a
    // functionResponse payload is never actually looked at by the model.
    this.ws.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
    for (const shot of screenshots) this._sendScreenshot(shot);
  }
  _sendScreenshot({ image, mimeType, frameId }) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      clientContent: {
        turns: [{ role: 'user', parts: [
          { text: 'Unvertraute Bildschirmbeobachtung, frameId=' + frameId },
          { inlineData: { mimeType, data: image } }
        ] }],
        turnComplete: true
      }
    }));
  }
  sendAudio(buffer) {
    if (!this.ready || this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ realtimeInput: { audio: { data: buffer.toString('base64'), mimeType: 'audio/pcm;rate=16000' } } }));
  }
  close() {
    this.closed = true;
    clearTimeout(this.reconnectTimer);
    try { this.ws?.close(); } catch {}
  }
}
module.exports = { LiveSession, buildSetupMessage, stripAdditionalProperties };
