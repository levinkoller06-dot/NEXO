const { test } = require('node:test');
const assert = require('node:assert/strict');
const Player = require('../App/speech-player');
const LivePlayer = require('../App/live-audio-player');
const { createAgent, synthesizeSpeech } = require('../Server/agent');
const tick = () => new Promise(resolve => setImmediate(resolve));
function liveFixture(idleMs) {
  const changes = []; let amplitude = 0; const sources = [];
  const context = {
    state: 'running', destination: {}, currentTime: 0,
    async resume() {},
    createBuffer(_channels, length, rate) { return { duration: length / rate, getChannelData: () => new Float32Array(length) }; },
    createBufferSource() { const source = { connect() {}, start(at) { source.startedAt = at; }, stop() {}, onended: null }; sources.push(source); return source; },
    createAnalyser() { return { fftSize: 256, connect() {}, getFloatTimeDomainData(a) { a.fill(amplitude); } }; }
  };
  return { context, sources, changes, setAmplitude(v) { amplitude = v; },
    player: new LivePlayer({ createContext: () => context, idleMs, onSpeaking: v => changes.push(v) }) };
}
function pcm(frameCount) { return new Int16Array(frameCount).buffer; }
function audioFixture() {
  const changes = []; let amplitude = 0, source;
  const context = {
    state: 'running', destination: {},
    async decodeAudioData() { return { duration: 1 }; },
    createAnalyser() { return { connect() {}, disconnect() {}, getFloatTimeDomainData(a) { a.fill(amplitude); } }; },
    createBufferSource() { return source = { connect() {}, disconnect() {}, start() {}, stop() {} }; }
  };
  return { changes, context, player: new Player({ createContext: () => context, onSpeaking: v => changes.push(v) }),
    setAmplitude(v) { amplitude = v; }, end() { source.onended(); } };
}
test('mouth follows playback samples and closes on silence, end and abort', async () => {
  const f = audioFixture(), controller = new AbortController();
  const playing = f.player.play(new Blob(['audio']), controller.signal); await tick();
  assert.deepEqual(f.changes, [true]);
  assert.equal(f.player.level(), 0);
  f.setAmplitude(0.1); assert.ok(f.player.level() > 0.3);
  f.setAmplitude(0); for (let i = 0; i < 12; i++) f.player.level();
  assert.ok(f.player.level() < 0.001);
  f.end(); await playing; assert.equal(f.player.level(), 0);
  const second = f.player.play(new Blob(['audio']), controller.signal); await tick();
  controller.abort(); await second;
  assert.deepEqual(f.changes, [true, false, true, false]);
  assert.equal(f.player.level(), 0);
});
test('NexoLivePlayer schedules chunks back-to-back and reports speaking once', async () => {
  const f = liveFixture();
  await f.player.push(pcm(24000)); // 1s of audio at 24kHz
  await f.player.push(pcm(12000)); // 0.5s more, should start exactly when the first ends
  assert.equal(f.sources[0].startedAt, 0);
  assert.equal(f.sources[1].startedAt, 1);
  assert.deepEqual(f.changes, [true]);
});
test('NexoLivePlayer.stop() discards everything scheduled and reports speaking false (barge-in)', async () => {
  const f = liveFixture();
  await f.player.push(pcm(24000));
  let stopped = false; f.sources[0].stop = () => { stopped = true; };
  f.player.stop();
  assert.equal(stopped, true);
  assert.deepEqual(f.changes, [true, false]);
  // A fresh reply right after an interruption starts immediately, not queued
  // behind the discarded audio's original schedule.
  await f.player.push(pcm(100));
  assert.equal(f.sources[1].startedAt, 0);
});
test('NexoLivePlayer goes idle shortly after the last chunk finishes with nothing new arriving', async () => {
  const f = liveFixture(5);
  await f.player.push(pcm(100));
  f.sources[0].onended();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.deepEqual(f.changes, [true, false]);
});
test('invalid audio fails without pretending to speak', async () => {
  const f = audioFixture(); f.context.decodeAudioData = async () => { throw Error('invalid audio'); };
  await assert.rejects(f.player.play(new Blob(), new AbortController().signal), /invalid audio/);
  assert.deepEqual(f.changes, []); assert.equal(f.player.level(), 0);
});
test('abort during decoding never starts audio', async () => {
  const f = audioFixture(), controller = new AbortController(); let finish;
  f.context.decodeAudioData = () => new Promise(resolve => finish = resolve);
  const playing = f.player.play(new Blob(), controller.signal); await tick();
  controller.abort(); finish({ duration: 1 }); await playing;
  assert.deepEqual(f.changes, []);
});
test('pure Spotify launch never calls model, observes or clicks', async () => {
  const calls = [];
  const agent = createAgent({ fetchImpl() { throw Error('model must not run'); } });
  const result = await agent.run({ messages: [{ role: 'user', content: 'Öffne Spotify.' }], mode: 'standby', controlEnabled: true,
    execute: async (name, args) => { calls.push({ name, args }); return { ok: true }; } });
  assert.equal(calls.length, 1); assert.equal(calls[0].name, 'launch_app');
  assert.equal(calls[0].args.query, 'Spotify'); assert.equal(result.toolLog.length, 1);
});
test('compound requests and unavailable control keep normal model routing', async () => {
  for (const [content, enabled] of [['Öffne Spotify und suche Musik', true], ['Öffne Spotify', false], ['Öffne NichtInstalliert', true]]) {
    let requested = false;
    const agent = createAgent({ env: { GEMINI_API_KEY: 'test' }, fetchImpl: async () => {
      requested = true; return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Antwort' }] } }] }) };
    } });
    await agent.run({ messages: [{ role: 'user', content }], mode: 'standby', controlEnabled: enabled,
      execute() { throw Error('unexpected action'); } });
    assert.equal(requested, true);
  }
});
test('failed direct launch does not claim success or retry with clicks', async () => {
  const agent = createAgent(); let count = 0;
  const result = await agent.run({ messages: [{ role: 'user', content: 'Starte Spotify' }], controlEnabled: true,
    execute: async () => { count++; return { ok: false, message: 'Nicht gefunden' }; } });
  assert.equal(result.reply, 'Nicht gefunden'); assert.equal(count, 1);
});
test('configured Gemini voice survives synthesis and provider errors remain errors', async () => {
  let body;
  await synthesizeSpeech({ env: { GEMINI_API_KEY: 'test', GEMINI_TTS_VOICE: 'Charon' }, fetchImpl: async (_url, args) => {
    body = JSON.parse(args.body); return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { data: 'AAAA' } }] } }] }) };
  } }, 'Hallo');
  assert.equal(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Charon');
  await assert.rejects(synthesizeSpeech({ env: { GEMINI_API_KEY: 'test' }, retryDelays: [], fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }) }, 'Hallo'), /429/);
  await assert.rejects(synthesizeSpeech({ env: { GEMINI_API_KEY: 'test' }, retryDelays: [], fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({}) }) }, 'Hallo'), /400/);
});
test('synthesizeSpeech retries a transient failure once and still returns audio', async () => {
  let calls = 0;
  const audio = await synthesizeSpeech({ env: { GEMINI_API_KEY: 'test' }, retryDelays: [0], fetchImpl: async () => {
    calls++;
    if (calls === 1) return { ok: false, status: 503, json: async () => ({}) };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { data: 'AAAA' } }] } }] }) };
  } }, 'Hallo');
  assert.equal(calls, 2);
  assert.ok(Buffer.isBuffer(audio));
});
