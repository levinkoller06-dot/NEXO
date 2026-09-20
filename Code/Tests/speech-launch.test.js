const { test } = require('node:test');
const assert = require('node:assert/strict');
const Player = require('../App/speech-player');
const { createAgent, synthesizeSpeech } = require('../Server/agent');
const tick = () => new Promise(resolve => setImmediate(resolve));
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
  await assert.rejects(synthesizeSpeech({ env: { GEMINI_API_KEY: 'test' }, fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }) }, 'Hallo'), /429/);
});
