'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createNexoServer, validateMessages } = require('../Server/server');
const { createAgent, TOOL_DEFS, answerWithSearch } = require('../Server/agent');
const { DesktopController, NativeBridge, validateAction, validateLaunch, validateWindowTarget } = require('../Server/desktop');
const { MicController, SerialQueue } = require('../App/conversation-state');
const { LiveSession, buildSetupMessage, stripAdditionalProperties } = require('../Server/live');
const { EventEmitter } = require('node:events');
const turn = () => new Promise(resolve => setImmediate(resolve));

function fakeBridge() {
  const calls = [];
  return {
    calls,
    async watchStop(fn) { this.stop = fn; return () => {}; },
    async observe() { calls.push('observe'); return { image: 'TEST_IMAGE_NOT_A_SCREENSHOT', width: 100, height: 50, screenWidth: 200, screenHeight: 100, left: -200, top: 0, title: 'Test', hud: [] }; },
    async act(a) { calls.push(a); return { ok: true }; },
    async launchApp(query) { calls.push({ launchApp: query }); return { ok: true }; },
    async searchWeb(query) { calls.push({ searchWeb: query }); return { ok: true }; },
    async focusWindow(title) { calls.push({ focusWindow: title }); return { ok: true }; },
    async clickByName(title, control) { calls.push({ clickByName: title, control }); return { ok: true }; }
  };
}
async function fixture(t, run = async () => ({ reply: 'Test', toolLog: [] }), { env = {}, fetchImpl } = {}) {
  const bridge = fakeBridge();
  const app = createNexoServer({ env, bridge, agent: { models: { openai: 'test', gemini: 'test' }, run }, ...(fetchImpl ? { fetchImpl } : {}) });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { app.stopAll(); app.server.closeAllConnections(); app.server.close(resolve); }));
  const base = 'http://127.0.0.1:' + app.server.address().port;
  const res = await fetch(base + '/api/session');
  const cookie = res.headers.get('set-cookie').split(';')[0], { token } = await res.json();
  async function post(route, body, override = {}) {
    return fetch(base + route, { method: 'POST', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json', 'X-Nexo-Token': token, ...override }, body: JSON.stringify(body) });
  }
  return { ...app, base, bridge, post, cookie, token };
}
const requestBody = { mode: 'focus', messages: [{ role: 'user', content: 'Testauftrag' }] };

test('R1/R2: old process-launch/force-kill tools are absent', () => {
  assert.deepEqual(TOOL_DEFS.map(t => t.name), ['set_mode', 'computer_observe', 'computer_action', 'launch_app', 'search_web', 'web_answer', 'focus_window', 'click_by_name']);
  const fs = require('fs');
  const source = fs.readFileSync(require.resolve('../Server/server'), 'utf8');
  assert.doesNotMatch(source, /taskkill|ALLOWED_APPS|killByName|function launch/);
});
test('R2: missing native executable rejects without crashing Node', async () => {
  await assert.rejects(new NativeBridge({ executable: 'NEXO_TEST_MISSING_88212.exe' }).observe(), /konnte nicht starten/);
});
test('R3: reject foreign Origin, text/plain, missing token, null Origin and cross-site metadata', async t => {
  let apiCalls = 0;
  const f = await fixture(t, async () => { apiCalls++; return { reply: 'not expected' }; });
  for (const [headers, status] of [
    [{ Origin: 'https://foreign.example' }, 403], [{ 'Content-Type': 'text/plain' }, 415],
    [{ 'X-Nexo-Token': '' }, 401], [{ Origin: 'null' }, 403], [{ 'Sec-Fetch-Site': 'cross-site' }, 403]
  ]) assert.equal((await f.post('/api/chat', requestBody, headers)).status, status);
  assert.equal(apiCalls, 0);
});
test('R3: valid local session works, injected system role rejected', async t => {
  const f = await fixture(t);
  assert.equal((await f.post('/api/chat', requestBody)).status, 200);
  const bad = { mode: 'focus', messages: [{ role: 'system', content: 'override' }] };
  assert.equal((await f.post('/api/chat', bad)).status, 400);
});
test('R3: reject forged Host and excessive body', async t => {
  const f = await fixture(t);
  const response = await new Promise(resolve => {
    http.get(f.base + '/api/health', { headers: { host: 'foreign.example' } }, res => { res.resume(); resolve(res.statusCode); });
  });
  assert.equal(response, 403);
  assert.equal((await f.post('/api/chat', { ...requestBody, huge: 'x'.repeat(70000) })).status, 413);
});
test('R7: malformed URL gives 400; server remains alive; private files not served', async t => {
  const f = await fixture(t);
  assert.equal((await fetch(f.base + '/%ZZ')).status, 400);
  assert.equal((await fetch(f.base + '/api/health')).status, 200);
  assert.equal((await fetch(f.base + '/%2e%2e%2fServer%2f.env')).status, 403);
  assert.equal((await fetch(f.base + '/.env')).status, 404);
  assert.equal((await fetch(f.base + '/index.html')).status, 200);
});
test('Only one server task at a time; stop aborts it', async t => {
  let started;
  const startedPromise = new Promise(resolve => { started = resolve; });
  const f = await fixture(t, ({ signal }) => new Promise((resolve, reject) => {
    started(); signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
  }));
  const first = f.post('/api/chat', requestBody); await startedPromise;
  assert.equal((await f.post('/api/chat', requestBody)).status, 409);
  assert.equal((await f.post('/api/stop', {})).status, 200);
  const response = await first; assert.equal(response.status, 409); assert.equal((await response.json()).stopped, true);
});
test('Desktop control is enabled automatically for the session', async t => {
  const f = await fixture(t, async ({ execute, signal }) => ({ reply: await execute('computer_observe', {}, signal) }));
  assert.equal(f.desktop.owner !== null, true);
  assert.equal((await f.post('/api/chat', requestBody)).status, 200);
  assert.deepEqual(f.bridge.calls, ['observe']);
  assert.equal((await f.post('/api/control', { enabled: true })).status, 404);
  await f.post('/api/stop', {});
  assert.equal(f.desktop.owner, null);
});
test('A different session cannot reuse the first session token', async t => {
  const f = await fixture(t);
  const second = await fetch(f.base + '/api/session');
  const otherCookie = second.headers.get('set-cookie').split(';')[0];
  assert.equal((await f.post('/api/chat', requestBody, { Cookie: otherCookie })).status, 401);
});
test('validate messages rejects invalid content and bounds history', () => {
  assert.throws(() => validateMessages([{ role: 'user', content: 'x'.repeat(8001) }]));
  assert.throws(() => validateMessages(Array(33).fill({ role: 'user', content: 'hi' })));
  assert.throws(() => validateMessages([{ role: 'assistant', content: 'last' }]));
});

function providerMock(responses, captured) {
  return async (url, options) => {
    captured.push({ url, ...options, body: JSON.parse(options.body) });
    assert.ok(responses.length, 'Unexpected additional API request');
    return { ok: true, status: 200, json: async () => responses.shift() };
  };
}
const gemini = parts => ({ candidates: [{ content: { role: 'model', parts } }] });
const openai = message => ({ choices: [{ message: { role: 'assistant', ...message } }] });
test('R6 Gemini: all parallel calls, original thought signatures and IDs, then another tool round', async () => {
  const captured = [], calls = [];
  const firstParts = [{ text: 'thinking', thought: true }, { functionCall: { name: 'set_mode', id: 'a', args: { mode: 'focus' } }, thoughtSignature: 'signature-a' }, { functionCall: { name: 'set_mode', id: 'b', args: { mode: 'energy' } } }];
  const agent = createAgent({ env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([
    gemini(firstParts), gemini([{ functionCall: { name: 'set_mode', id: 'c', args: { mode: 'standby' } } }]), gemini([{ text: 'Fertig' }])
  ], captured) });
  const result = await agent.run({ ...requestBody, execute: async (name, args) => { calls.push(args.mode); return { ok: true }; } });
  assert.deepEqual(calls, ['focus', 'energy', 'standby']); assert.equal(result.reply, 'Fertig');
  assert.deepEqual(captured[1].body.contents[1].parts, firstParts);
  assert.deepEqual(captured[1].body.contents[2].parts.map(p => p.functionResponse.id), ['a', 'b']);
  assert.doesNotMatch(captured[0].url, /fake/); // API key stays in header
  assert.doesNotMatch(JSON.stringify(captured[0].body.tools), /additionalProperties/);
});
test('Gemini thinking stays off for plain chat and for the first desktop-control turn, only turns on after a screen/click tool is used', async () => {
  const captured = [];
  const chatAgent = createAgent({ env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([gemini([{ text: 'Chat-Antwort' }])], captured) });
  await chatAgent.run({ ...requestBody, controlEnabled: false, execute: async () => ({ ok: true }) });
  assert.equal(captured[0].body.generationConfig.thinkingConfig.thinkingBudget, 0);
  const controlAgent = createAgent({ env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([
    gemini([{ functionCall: { name: 'computer_observe', args: {} } }]), gemini([{ text: 'Control-Antwort' }])
  ], captured) });
  await controlAgent.run({ ...requestBody, controlEnabled: true, execute: async () => ({ ok: true, frameId: 'frame1', image: 'IMG', mimeType: 'image/jpeg' }) });
  assert.equal(captured[1].body.generationConfig.thinkingConfig.thinkingBudget, 0);
  assert.equal(captured[2].body.generationConfig.thinkingConfig.thinkingBudget, -1);
});
test('web_answer stays available without PC control, unlike the desktop tools', async () => {
  const captured = [];
  const agent = createAgent({ env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([gemini([{ text: 'ok' }])], captured) });
  await agent.run({ ...requestBody, controlEnabled: false, execute: async () => ({ ok: true }) });
  const names = captured[0].body.tools[0].functionDeclarations.map(t => t.name);
  assert.deepEqual(names, ['set_mode', 'web_answer']);
});
test('answerWithSearch grounds a query with google_search and returns the text answer, never mixing in tool declarations', async () => {
  const captured = [];
  const fetchImpl = async (url, opts) => {
    captured.push({ url, body: JSON.parse(opts.body) });
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Antwort mit aktuellen Infos.' }] } }] }) };
  };
  const answer = await answerWithSearch({ env: { GEMINI_API_KEY: 'fake-key', GEMINI_MODEL: 'gemini-test' }, fetchImpl }, 'Was gibt es Neues?');
  assert.equal(answer, 'Antwort mit aktuellen Infos.');
  assert.match(captured[0].url, /gemini-test:generateContent$/);
  assert.deepEqual(captured[0].body.tools, [{ google_search: {} }]);
  assert.equal(captured[0].body.contents[0].parts[0].text, 'Was gibt es Neues?');
});
test('web_answer tool is reachable through the server execute dispatcher and never opens anything', async t => {
  const answerFetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Kurze Antwort.' }] } }] }) });
  const f = await fixture(t, async ({ execute, signal }) => ({ reply: await execute('web_answer', { query: 'News?', reason: 'Test' }, signal) }), { env: { GEMINI_API_KEY: 'fake' }, fetchImpl: answerFetch });
  const res = await f.post('/api/chat', requestBody);
  assert.equal(res.status, 200);
  assert.deepEqual(f.bridge.calls, []);
});
test('R6 OpenAI: multiple calls and follow-up rounds preserve tool ids', async () => {
  const captured = [], calls = [];
  const fn = id => ({ id, type: 'function', function: { name: 'set_mode', arguments: '{"mode":"focus"}' } });
  const agent = createAgent({ env: { OPENAI_API_KEY: 'fake' }, fetchImpl: providerMock([
    openai({ tool_calls: [fn('a'), fn('b')], content: null }), openai({ tool_calls: [fn('c')], content: null }), openai({ content: 'Fertig' })
  ], captured) });
  const result = await agent.run({ ...requestBody, mode: 'energy', execute: async () => { calls.push(1); return { ok: true }; } });
  assert.equal(calls.length, 3); assert.equal(result.reply, 'Fertig');
  assert.deepEqual(captured[1].body.messages.filter(m => m.role === 'tool').map(m => m.tool_call_id), ['a', 'b']);
});
test('Vision loop supplies screenshot with matching frameId and no images in public log', async () => {
  const captured = [];
  const agent = createAgent({ env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([
    gemini([{ functionCall: { name: 'computer_observe', args: {} } }]), gemini([{ text: 'Bild gesehen' }])
  ], captured) });
  const result = await agent.run({ ...requestBody, controlEnabled: true, execute: async () => ({ ok: true, frameId: 'frame1', image: 'FAKE_IMAGE', mimeType: 'image/jpeg' }) });
  const parts = captured[1].body.contents.at(-1).parts;
  assert.ok(parts.some(p => p.inlineData?.data === 'FAKE_IMAGE'));
  assert.ok(parts.some(p => p.text?.includes('frame1')));
  assert.equal(JSON.stringify(result.toolLog).includes('FAKE_IMAGE'), false);
});
test('Disabled desktop tool cannot be executed even if model requests it', async () => {
  const captured = [];
  const agent = createAgent({ env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([
    gemini([{ functionCall: { name: 'computer_observe', args: {} } }]), gemini([{ text: 'Bitte freigeben' }])
  ], captured) });
  let executions = 0;
  const result = await agent.run({ ...requestBody, execute: async () => { executions++; } });
  assert.equal(executions, 0); assert.equal(result.toolLog[0].result.ok, false);
});
test('Agent honours abort and bounded tool rounds', async () => {
  const captured = [];
  const response = gemini([{ functionCall: { name: 'set_mode', args: { mode: 'focus' } } }]);
  const agent = createAgent({ maxRounds: 2, env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([response, response], captured) });
  const result = await agent.run({ ...requestBody, execute: async () => ({ ok: true }) });
  assert.equal(result.limited, true); assert.equal(captured.length, 2);
  const c = new AbortController(); c.abort();
  await assert.rejects(agent.run({ ...requestBody, signal: c.signal, execute() {} }), /gestoppt/);
});

test('Desktop validates coordinates and consumes old frames; negative monitor offset scales correctly', async () => {
  const bridge = fakeBridge(), desktop = new DesktopController({ bridge });
  await desktop.enable('owner');
  const shot = await desktop.observe('owner');
  const action = { action: 'click', frameId: shot.frameId, x: 99, y: 49, reason: 'Test', risk: 'routine' };
  const next = await desktop.action('owner', action);
  assert.notEqual(next.frameId, shot.frameId);
  const native = bridge.calls.find(c => typeof c === 'object');
  assert.equal(native.x, -1); assert.equal(native.y, 99);
  await assert.rejects(desktop.action('owner', action), /veraltet/);
  await assert.rejects(desktop.action('owner', { ...action, frameId: next.frameId, x: 100 }), /außerhalb/);
  desktop.disable();
});
test('No actions on stale frame or without grant', async () => {
  let now = 1000;
  const desktop = new DesktopController({ bridge: fakeBridge(), now: () => now });
  await assert.rejects(desktop.observe('owner'), /nicht verfügbar/);
  await desktop.enable('owner'); const shot = await desktop.observe('owner'); now += 45001;
  await assert.rejects(desktop.action('owner', { action: 'key', key: 'WIN', reason: 'Test', risk: 'routine', frameId: shot.frameId }), /veraltet/);
  desktop.disable();
});
test('Sensitive action: no execution before approval; reobserve required after approval', async () => {
  const bridge = fakeBridge(), desktop = new DesktopController({ bridge });
  await desktop.enable('owner'); const shot = await desktop.observe('owner');
  const action = { action: 'key', key: 'ALT+F4', frameId: shot.frameId, reason: 'Fenster schließen', risk: 'sensitive' };
  const pending = desktop.action('owner', action); await turn();
  const request = desktop.status('owner').approval;
  assert.ok(request); assert.equal(bridge.calls.filter(c => typeof c === 'object').length, 0);
  assert.throws(() => desktop.answerApproval('other', request.id, true));
  desktop.answerApproval('owner', request.id, true);
  assert.equal((await pending).approvalGranted, true);
  await assert.rejects(desktop.action('owner', action), /veraltet/);
  const fresh = await desktop.observe('owner');
  await desktop.action('owner', { ...action, frameId: fresh.frameId });
  assert.equal(bridge.calls.filter(c => typeof c === 'object').length, 1);
  desktop.disable();
});
test('Denied/cancelled approval never performs the action', async () => {
  for (const abort of [false, true]) {
    const bridge = fakeBridge(), desktop = new DesktopController({ bridge });
    await desktop.enable('owner'); const shot = await desktop.observe('owner'), c = new AbortController();
    const pending = desktop.action('owner', { action: 'key', key: 'DELETE', frameId: shot.frameId, reason: 'Löschen', risk: 'sensitive' }, c.signal);
    const rejection = assert.rejects(pending);
    await turn();
    if (abort) c.abort(); else desktop.answerApproval('owner', desktop.status('owner').approval.id, false);
    await rejection; assert.equal(bridge.calls.filter(c => typeof c === 'object').length, 0);
    desktop.disable();
  }
});
test('ALT+F4 and DELETE no longer force sensitive risk; routine runs without approval', async () => {
  const bridge = fakeBridge(), desktop = new DesktopController({ bridge });
  await desktop.enable('owner');
  for (const key of ['ALT+F4', 'DELETE']) {
    const shot = await desktop.observe('owner');
    await desktop.action('owner', { action: 'key', key, frameId: shot.frameId, reason: 'Test', risk: 'routine' });
  }
  assert.equal(desktop.status('owner').approval, null);
  assert.equal(bridge.calls.filter(c => typeof c === 'object').length, 2);
  desktop.disable();
});
test('Global hotkey and HUD heartbeat loss revoke control', async () => {
  let now = 0, stops = 0;
  const bridge = fakeBridge(), desktop = new DesktopController({ bridge, now: () => now, onStop: () => { stops++; } });
  await desktop.enable('owner'); bridge.stop('hotkey'); assert.equal(desktop.owner, null);
  await desktop.enable('owner'); now = 15001; desktop.expire(); assert.equal(desktop.owner, null); assert.equal(stops, 2);
});
test('Invalid keyboard/text actions rejected before native input', () => {
  for (const extra of [{ action: 'type', text: 'line1\nline2' }, { action: 'key', key: 'arbitrary.exe' }, { action: 'key', key: 'CTRL+ALT+F12' }, { action: 'scroll', x: 0, y: 0, steps: 500 }])
    assert.throws(() => validateAction({ frameId: 'f', reason: 'Test', risk: 'routine', ...extra }));
});
test('Coordinate actions default to a background pointer that never moves the real cursor', () => {
  const a = validateAction({ action: 'click', x: 1, y: 2, frameId: 'f', reason: 'Test', risk: 'routine' });
  assert.equal(a.pointer, 'background');
  const visible = validateAction({ action: 'click', x: 1, y: 2, pointer: 'visible', frameId: 'f', reason: 'Test', risk: 'routine' });
  assert.equal(visible.pointer, 'visible');
});
test('validateLaunch rejects empty/oversized queries and missing reason', () => {
  assert.throws(() => validateLaunch({ query: '', reason: 'Test' }));
  assert.throws(() => validateLaunch({ query: 'x'.repeat(201), reason: 'Test' }));
  assert.throws(() => validateLaunch({ query: 'Notepad', reason: '' }));
  assert.deepEqual(validateLaunch({ query: 'Notepad', reason: 'Editor öffnen' }), { query: 'Notepad', reason: 'Editor öffnen' });
});
test('launch_app starts directly without a screenshot or input', async () => {
  const bridge = fakeBridge(), desktop = new DesktopController({ bridge });
  await desktop.enable('owner');
  const result = await desktop.launchApp('owner', { query: 'Rechner', reason: 'Rechner öffnen' });
  assert.deepEqual(bridge.calls, [{ launchApp: 'Rechner' }]);
  assert.equal(result.ok, true);
  desktop.disable();
});
test('launch_app tool is reachable through the server execute dispatcher', async t => {
  const f = await fixture(t, async ({ execute, signal }) => ({ reply: await execute('launch_app', { query: 'Rechner', reason: 'Rechner öffnen' }, signal) }));
  assert.equal((await f.post('/api/chat', requestBody)).status, 200);
  assert.deepEqual(f.bridge.calls.find(c => typeof c === 'object' && c.launchApp), { launchApp: 'Rechner' });
});
test('search_web opens a Google search via the bridge and the server dispatcher', async t => {
  const bridge = fakeBridge(), desktop = new DesktopController({ bridge });
  await desktop.enable('owner');
  const result = await desktop.searchWeb('owner', { query: 'NEXO Assistent', reason: 'Websuche' });
  assert.deepEqual(bridge.calls[0], { searchWeb: 'NEXO Assistent' });
  assert.ok(result.frameId);
  desktop.disable();
  const f = await fixture(t, async ({ execute, signal }) => ({ reply: await execute('search_web', { query: 'NEXO', reason: 'Websuche' }, signal) }));
  assert.equal((await f.post('/api/chat', requestBody)).status, 200);
  assert.deepEqual(f.bridge.calls.find(c => typeof c === 'object' && c.searchWeb), { searchWeb: 'NEXO' });
});
test('focus_window brings a named window forward via the bridge and the server dispatcher', async t => {
  const bridge = fakeBridge(), desktop = new DesktopController({ bridge });
  await desktop.enable('owner');
  const result = await desktop.focusWindow('owner', { title: 'Spotify', reason: 'Fenster nach vorne holen' });
  assert.deepEqual(bridge.calls[0], { focusWindow: 'Spotify' });
  assert.ok(result.frameId);
  desktop.disable();
  const f = await fixture(t, async ({ execute, signal }) => ({ reply: await execute('focus_window', { title: 'Spotify', reason: 'Test' }, signal) }));
  assert.equal((await f.post('/api/chat', requestBody)).status, 200);
  assert.deepEqual(f.bridge.calls.find(c => typeof c === 'object' && c.focusWindow), { focusWindow: 'Spotify' });
});
test('click_by_name activates a named control via the bridge and the server dispatcher', async t => {
  const bridge = fakeBridge(), desktop = new DesktopController({ bridge });
  await desktop.enable('owner');
  const result = await desktop.clickByName('owner', { title: 'Spotify', control: 'Lyrics', reason: 'Lyrics oeffnen' });
  assert.deepEqual(bridge.calls[0], { clickByName: 'Spotify', control: 'Lyrics' });
  assert.ok(result.frameId);
  desktop.disable();
  const f = await fixture(t, async ({ execute, signal }) => ({ reply: await execute('click_by_name', { title: 'Spotify', control: 'Lyrics', reason: 'Test' }, signal) }));
  assert.equal((await f.post('/api/chat', requestBody)).status, 200);
  assert.deepEqual(f.bridge.calls.find(c => typeof c === 'object' && c.clickByName), { clickByName: 'Spotify', control: 'Lyrics' });
});
test('validateWindowTarget rejects missing/oversized title, control or reason', () => {
  assert.throws(() => validateWindowTarget({ reason: 'Test' }));
  assert.throws(() => validateWindowTarget({ title: 'x'.repeat(201), reason: 'Test' }));
  assert.throws(() => validateWindowTarget({ title: 'Spotify', reason: '' }));
  assert.throws(() => validateWindowTarget({ title: 'Spotify', reason: 'Test' }, ['control']));
  assert.deepEqual(validateWindowTarget({ title: 'Spotify', control: 'Lyrics', reason: 'Test' }, ['control']), { title: 'Spotify', control: 'Lyrics' });
});

function micFixture() {
  const pending = [];
  const rec = { starts: 0, aborts: 0, start() { this.starts++; }, abort() { this.aborts++; } };
  const mic = new MicController({ recognition: rec, delay(fn) { pending.push(fn); return fn; }, clear(fn) { const i = pending.indexOf(fn); if (i >= 0) pending.splice(i, 1); } });
  return { rec, mic, flush() { const jobs = pending.splice(0); jobs.forEach(fn => fn()); } };
}
test('R4: microphone resumes after off/on and recognition end', () => {
  const { rec, mic, flush } = micFixture();
  mic.setWanted(true); rec.onstart();
  mic.setWanted(false); rec.onend();
  mic.setWanted(true); rec.onstart(); rec.onend(); flush();
  assert.equal(rec.starts, 3); assert.equal(mic.wanted, true);
});
test('R4: fast off/on waits for old recognition to finish', () => {
  const { rec, mic, flush } = micFixture();
  mic.setWanted(true); mic.setWanted(false); mic.setWanted(true);
  assert.equal(rec.starts, 1);
  rec.onend(); flush(); assert.equal(rec.starts, 2);
});
test('R4: aborted recognition can be enabled again without onend', () => {
  const { rec, mic, flush } = micFixture();
  mic.setWanted(true); rec.onstart(); mic.setWanted(false); mic.setWanted(true);
  rec.onerror({ error: 'aborted' }); flush();
  assert.equal(rec.starts, 2); assert.equal(mic.wanted, true);
});
test('R5: busy state immediately pauses recognition and resumes after work', () => {
  const { rec, mic, flush } = micFixture();
  mic.setWanted(true); rec.onstart(); mic.setBusy(true);
  assert.equal(rec.aborts, 1);
  rec.onend(); flush(); assert.equal(rec.starts, 1);
  mic.setBusy(false); assert.equal(rec.starts, 2);
});
test('Mic permission failure leaves visible intent off', () => {
  const { rec, mic, flush } = micFixture();
  mic.setWanted(true); rec.onerror({ error: 'not-allowed' }); rec.onend(); flush();
  assert.equal(mic.wanted, false); assert.equal(rec.starts, 1);
});
test('R5: queued tasks stay serial; stop drops waiting commands and aborts current', async () => {
  let active = 0, max = 0; const processed = [];
  let unblock;
  const queue = new SerialQueue({ run: async (text, signal) => {
    processed.push(text); max = Math.max(max, ++active);
    await new Promise(resolve => { unblock = resolve; signal.addEventListener('abort', resolve, { once: true }); });
    active--;
  }});
  queue.push('first'); queue.push('second'); assert.deepEqual(processed, ['first']);
  unblock(); await turn(); assert.deepEqual(processed, ['first', 'second']);
  queue.push('third'); queue.stop(); await turn();
  assert.deepEqual(processed, ['first', 'second']); assert.equal(max, 1); assert.equal(queue.running, false);
});

test('OpenAI vision sends an image input after tool results, never as a text blob', async () => {
  const captured = [];
  const agent = createAgent({ env: { OPENAI_API_KEY: 'fake' }, fetchImpl: providerMock([
    openai({ content: null, tool_calls: [{ id: 'vision', type: 'function', function: { name: 'computer_observe', arguments: '{}' } }] }), openai({ content: 'Bild gesehen' })
  ], captured) });
  await agent.run({ ...requestBody, mode: 'energy', controlEnabled: true, execute: async () => ({ ok: true, frameId: 'frame2', image: 'FAKE', mimeType: 'image/jpeg' }) });
  assert.equal(captured[1].body.messages.at(-1).content[1].image_url.url, 'data:image/jpeg;base64,FAKE');
  assert.equal(captured[1].body.messages.at(-2).role, 'tool');
});
test('Gemini voice fallback sends audio as inline data', async () => {
  const captured = [];
  const agent = createAgent({ env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([gemini([{ text: 'Verstanden' }])], captured) });
  const result = await agent.run({ ...requestBody, mode: 'standby', providerOverride: 'gemini', audio: { mimeType: 'audio/webm', data: 'AAAA' }, execute: async () => ({ ok: true }) });
  assert.equal(result.reply, 'Verstanden');
  assert.deepEqual(captured[0].body.contents.at(-1).parts.at(-1), { inlineData: { mimeType: 'audio/webm', data: 'AAAA' } });
});
test('Speech endpoint requires a configured Gemini key', async t => {
  const f = await fixture(t);
  assert.equal((await f.post('/api/speech', { text: 'Hallo' })).status, 503);
});
test('Speech endpoint wraps Gemini PCM audio as WAV and never leaks the key', async t => {
  const pcm = Buffer.from([1, 2, 3, 4]).toString('base64');
  const captured = [];
  const fetchImpl = async (url, opts) => {
    captured.push({ url, opts });
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: pcm } }] } }] }) };
  };
  const f = await fixture(t, undefined, { env: { GEMINI_API_KEY: 'fake-key' }, fetchImpl });
  const res = await f.post('/api/speech', { text: 'Hallo NEXO' });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'audio/wav');
  const body = Buffer.from(await res.arrayBuffer());
  assert.equal(body.toString('ascii', 0, 4), 'RIFF');
  assert.equal(body.toString('ascii', 8, 12), 'WAVE');
  assert.deepEqual(body.subarray(44), Buffer.from([1, 2, 3, 4]));
  assert.match(captured[0].url, /gemini-2\.5-flash-preview-tts:generateContent$/);
  assert.equal(captured[0].opts.headers['x-goog-api-key'], 'fake-key');
  assert.equal((await f.post('/api/speech', { text: '' })).status, 400);
});
test('Stop during observation discards the image and invalidates the frame', async () => {
  const bridge = fakeBridge(); let resolve;
  bridge.observe = () => new Promise(done => { resolve = done; });
  const desktop = new DesktopController({ bridge }); await desktop.enable('owner');
  const pending = desktop.observe('owner');
  const rejected = assert.rejects(pending);
  desktop.disable();
  resolve({ image: 'FAKE', width: 10, height: 10, screenWidth: 10, screenHeight: 10 });
  await rejected; assert.equal(desktop.frame, null);
});
test('A failed tool returns an error to the model; it cannot claim a fabricated success', async () => {
  const captured = [];
  const agent = createAgent({ env: { GEMINI_API_KEY: 'fake' }, fetchImpl: providerMock([
    gemini([{ functionCall: { name: 'set_mode', args: { mode: 'focus' } } }]), gemini([{ text: 'Fehlgeschlagen' }])
  ], captured) });
  const result = await agent.run({ ...requestBody, execute: async () => { throw new Error('Failure fixture'); } });
  assert.equal(result.toolLog[0].result.ok, false);
  assert.equal(captured[1].body.contents.at(-1).parts[0].functionResponse.response.message, 'Failure fixture');
});
test('HUD references existing elements and loads helpers before conversation', () => {
  const fs = require('fs'), path = require('path');
  const dir = path.resolve(__dirname, '../App'), html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for (const file of ['app.js', 'conversation.js']) {
    for (const match of fs.readFileSync(path.join(dir, file), 'utf8').matchAll(/\$\('([^']+)'\)/g))
      assert.ok(ids.has(match[1]), file + ': missing #' + match[1]);
  }
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  for (const name of scripts) assert.ok(fs.existsSync(path.join(dir, name)), name);
  for (const name of ['app.js', 'api.js', 'conversation-state.js']) assert.ok(scripts.indexOf(name) < scripts.indexOf('conversation.js'));
});
test('HUD omits obsolete conversation, PC-control and status copy', () => {
  const fs = require('fs'), path = require('path');
  const html = fs.readFileSync(path.resolve(__dirname, '../App/index.html'), 'utf8');
  for (const text of ['Mikrofon', 'Gespräch', 'Neural Interface', 'System stabil', 'Build 001', 'Bewege den Mauszeiger', 'NEXO darf meinen PC bedienen', 'pc-control'])
    assert.doesNotMatch(html, new RegExp(text, 'i'));
  assert.match(html, /id="talk"/);
});

// A minimal stand-in for the 'ws' package's per-connection socket: enough of
// EventEmitter's `on`/`emit` plus `send`/`close`/`readyState` for LiveSession
// to drive against, without any real network or Gemini API call.
class FakeLiveSocket extends EventEmitter {
  constructor() { super(); this.readyState = 0; this.sent = []; }
  send(data) { this.sent.push(data); }
  close() { this.readyState = 3; this.emit('close'); }
  open() { this.readyState = 1; this.emit('open'); }
  receive(value) { this.emit('message', Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value), 'utf8')); }
}
FakeLiveSocket.OPEN = 1;
function fakeLiveSession(overrides = {}) {
  const sockets = [];
  const WebSocketImpl = function () { const s = new FakeLiveSocket(); sockets.push(s); return s; };
  WebSocketImpl.OPEN = FakeLiveSocket.OPEN;
  const events = [];
  const live = new LiveSession({
    env: { GEMINI_API_KEY: 'fake' }, controlEnabled: true, WebSocketImpl,
    execute: async () => ({ ok: true }),
    onAudio: buf => events.push({ type: 'audio', bytes: buf.length }),
    onTranscript: t => events.push({ type: 'transcript', ...t }),
    onInterrupted: () => events.push({ type: 'interrupted' }),
    onToolLog: entry => events.push({ type: 'toolLog', ...entry }),
    onError: err => events.push({ type: 'error', message: err.message || String(err) }),
    onStatus: status => events.push({ type: 'status', status }),
    ...overrides
  });
  return { live, sockets, events, socket: () => sockets[0] };
}
test('stripAdditionalProperties removes only that key, recursively', () => {
  const cleaned = stripAdditionalProperties({ type: 'object', additionalProperties: false, properties: { a: { type: 'string', additionalProperties: false } } });
  assert.deepEqual(cleaned, { type: 'object', properties: { a: { type: 'string' } } });
});
test('buildSetupMessage includes only set_mode and web_answer when PC control is disabled', () => {
  const disabled = buildSetupMessage({ env: { GEMINI_API_KEY: 'x' }, controlEnabled: false, resumeHandle: null });
  assert.deepEqual(disabled.setup.tools[0].functionDeclarations.map(t => t.name), ['set_mode', 'web_answer']);
  const enabled = buildSetupMessage({ env: { GEMINI_API_KEY: 'x' }, controlEnabled: true, resumeHandle: null });
  assert.deepEqual(enabled.setup.tools[0].functionDeclarations.map(t => t.name), TOOL_DEFS.map(t => t.name));
  assert.doesNotMatch(JSON.stringify(enabled.setup.tools), /additionalProperties/);
  assert.match(enabled.setup.systemInstruction.parts[0].text, /Sprachgespräch/i);
});
test('buildSetupMessage carries a resumption handle when given one, empty object otherwise', () => {
  assert.deepEqual(buildSetupMessage({ env: {}, controlEnabled: false, resumeHandle: null }).setup.sessionResumption, {});
  assert.deepEqual(buildSetupMessage({ env: {}, controlEnabled: false, resumeHandle: 'h1' }).setup.sessionResumption, { handle: 'h1' });
});
test('LiveSession sends the setup message once connected', () => {
  const { socket } = fakeLiveSession();
  socket().open();
  assert.equal(socket().sent.length, 1);
  assert.ok(JSON.parse(socket().sent[0]).setup);
});
test('LiveSession answers a tool call and only then sends the screenshot as a content turn', async () => {
  const { live, socket, events } = fakeLiveSession({
    execute: async name => name === 'computer_observe'
      ? { ok: true, frameId: 'f1', image: 'BASE64', mimeType: 'image/jpeg' }
      : { ok: true }
  });
  socket().open();
  socket().receive({ setupComplete: {} });
  socket().receive({ toolCall: { functionCalls: [{ id: 'c1', name: 'computer_observe', args: {} }] } });
  await turn(); await turn();
  const sent = socket().sent.slice(1).map(s => JSON.parse(s));
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[0].toolResponse.functionResponses, [{ id: 'c1', name: 'computer_observe', response: { ok: true } }]);
  assert.equal(sent[1].clientContent.turns[0].parts[1].inlineData.data, 'BASE64');
  assert.deepEqual(events.find(e => e.type === 'toolLog'), { type: 'toolLog', name: 'computer_observe', result: { ok: true } });
});
test('LiveSession relays audio, transcripts and interruption events', () => {
  const { socket, events } = fakeLiveSession();
  socket().open();
  socket().receive({ setupComplete: {} });
  socket().receive({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: Buffer.from('AB').toString('base64') } }] } } });
  socket().receive({ serverContent: { outputTranscription: { text: 'Hallo' } } });
  socket().receive({ serverContent: { interrupted: true } });
  assert.deepEqual(events.filter(e => e.type !== 'status'), [
    { type: 'audio', bytes: 2 },
    { type: 'transcript', who: 'model', text: 'Hallo' },
    { type: 'interrupted' }
  ]);
});
test('LiveSession drops a tool result once its call is cancelled', async () => {
  let resolveExec;
  const { live, socket } = fakeLiveSession({ execute: () => new Promise(r => { resolveExec = r; }) });
  socket().open();
  socket().receive({ setupComplete: {} });
  socket().receive({ toolCall: { functionCalls: [{ id: 'c1', name: 'search_web', args: {} }] } });
  socket().receive({ toolCallCancellation: { ids: ['c1'] } });
  resolveExec({ ok: true });
  await turn(); await turn();
  assert.equal(socket().sent.slice(1).length, 0);
});
