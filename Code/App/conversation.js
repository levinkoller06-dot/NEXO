// Phase C: talks to Gemini over the persistent /ws/voice connection (see
// Server/live.js) instead of one HTTP request per turn. The microphone
// streams continuously whenever it's on - there is no separate "thinking"
// phase to mute through, because interruption is now something the Live API
// itself detects server-side and reports back as an "interrupted" message,
// not something guessed client-side from a second speech recognizer running
// over the loudspeaker output.
let ws = null, micStream = null, micContext = null, micNode = null, micWanted = false, leaving = false, reconnectTimer = null, lastModeEvent = null;
function showError(err) {
  $('state').textContent = String(err.message || err).slice(0, 190);
}
function addTurn(role, text) {
  const list = document.getElementById('transcript-log');
  if (!list || !text) return;
  list.querySelector('.transcript-empty')?.remove();
  const li = document.createElement('li'); li.className = role;
  li.textContent = (role === 'user' ? 'Du: ' : 'NEXO: ') + text; list.appendChild(li);
  while (list.children.length > 60) list.firstElementChild.remove();
  list.scrollTop = list.scrollHeight;
}
const livePlayer = new NexoLivePlayer({
  onSpeaking(value) { speaking = value; }
});
window.nexoSpeechLevel = () => livePlayer.level();
document.addEventListener('pointerdown', () => { void livePlayer.unlock().catch(showError); });
function setTalkVisual(active) {
  $('talk').classList.toggle('active', active); $('talk').classList.toggle('muted', !active);
  $('talk').setAttribute('aria-pressed', String(active));
  $('talk').setAttribute('aria-label', active ? 'Stummschaltung einschalten' : 'Stummschaltung aufheben');
}
async function startMic() {
  if (micStream || !micWanted) return;
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } }); }
  catch (error) {
    showError(new Error(error.name === 'NotAllowedError' ? 'Mikrofon-Zugriff wurde verweigert.' : 'Mikrofon ist nicht verfügbar.'));
    micWanted = false; setTalkVisual(false); return;
  }
  if (!micWanted) { stream.getTracks().forEach(track => track.stop()); return; }
  micStream = stream;
  try {
    micContext = new (window.AudioContext || window.webkitAudioContext)();
    await micContext.audioWorklet.addModule('audio-worklet.js');
    const source = micContext.createMediaStreamSource(micStream);
    micNode = new AudioWorkletNode(micContext, 'nexo-mic-downsampler');
    micNode.port.onmessage = event => { if (ws?.readyState === WebSocket.OPEN) ws.send(event.data); };
    source.connect(micNode);
  } catch (error) {
    showError(new Error('Mikrofon-Verarbeitung nicht verfügbar: ' + (error.message || error)));
    stopMic(); return;
  }
  setTalkVisual(true);
  $('state').textContent = 'Ich höre zu.';
}
function stopMic() {
  if (micNode) { micNode.port.onmessage = null; micNode.disconnect(); micNode = null; }
  micStream?.getTracks().forEach(track => track.stop()); micStream = null;
  micContext?.close().catch(() => {}); micContext = null;
  setTalkVisual(false);
}
$('talk').onclick = () => {
  micWanted = !micWanted;
  if (micWanted) void startMic();
  else { stopMic(); if (speaking) livePlayer.stop(); }
};
function connectLive() {
  if (leaving) return;
  clearTimeout(reconnectTimer);
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(proto + '//' + location.host + '/ws/voice');
  ws.binaryType = 'arraybuffer';
  ws.onclose = () => {
    if (leaving) return;
    $('state').textContent = 'Verbindung verloren, versuche erneut …';
    reconnectTimer = setTimeout(connectLive, 2000);
  };
  ws.onerror = () => {};
  ws.onmessage = event => {
    if (event.data instanceof ArrayBuffer) { void livePlayer.push(event.data); return; }
    let msg; try { msg = JSON.parse(event.data); } catch { return; }
    if (msg.type === 'status') {
      if (msg.status === 'ready') $('state').textContent = micWanted ? 'Ich höre zu.' : 'Bereit.';
      else if (msg.status === 'connecting') $('state').textContent = 'Verbinde mit Gemini …';
      else if (msg.status === 'reconnecting') $('state').textContent = 'Verbindung zu Gemini unterbrochen, versuche erneut …';
    } else if (msg.type === 'interrupted') {
      livePlayer.stop();
    } else if (msg.type === 'transcript') {
      if (msg.text?.trim()) $('state').textContent = msg.text;
      addTurn(msg.who === 'user' ? 'user' : 'assistant', msg.text);
    } else if (msg.type === 'mode') {
      window.nexoSetMode(msg.mode);
    } else if (msg.type === 'error') {
      showError(new Error(msg.message));
    }
  };
}
function stopLocally() {
  micWanted = false; stopMic(); livePlayer.stop();
  $('state').textContent = 'Gestoppt.';
}
window.nexoStop = async () => {
  stopLocally();
  try { await NexoApi.post('/api/stop', {}); } catch (err) { showError(err); }
};
document.addEventListener('keydown', e => { if (e.ctrlKey && e.altKey && e.key === 'F12') { e.preventDefault(); void window.nexoStop(); } });
// Renders Jev's real click_by_name decisions straight from the tool log the
// server already keeps (see onTool in server.js) - every field here comes
// from the actual Jev API response (or the documented no-Jev fallback), never
// from the conversation model, so nothing here can be a hallucinated summary.
function renderJevLog(log) {
  const list = $('jev-list'), empty = $('jev-empty'), count = $('jev-count');
  if (!list) return;
  const entries = (log || []).filter(e => e.name === 'click_by_name' && e.result?.jevDecision);
  count.textContent = String(entries.length);
  empty.style.display = entries.length ? 'none' : 'block';
  list.replaceChildren(...entries.slice(-8).reverse().map(e => {
    const d = e.result.jevDecision;
    const li = document.createElement('li');
    const line = document.createElement('div');
    line.textContent = d.chosen;
    const badge = document.createElement('b');
    badge.textContent = d.confidence != null ? Math.round(d.confidence * 100) + '%' : 'Fallback';
    line.appendChild(badge);
    const small = document.createElement('small');
    small.textContent = e.reason;
    const candidates = document.createElement('small');
    candidates.className = 'jev-candidates';
    candidates.textContent = 'Kandidaten: ' + d.candidates.join(', ');
    li.append(small, line, candidates);
    return li;
  }));
}
async function poll() {
  if (leaving) return;
  try {
    const data = await NexoApi.get('/api/status');
    if (data.mode && data.mode.id !== lastModeEvent) { lastModeEvent = data.mode.id; window.nexoSetMode(data.mode.name); }
    renderJevLog(data.log);
  } catch (err) { if (err.status === 401) { stopLocally(); showError(err); return; } }
  setTimeout(poll, 1000);
}
NexoApi.ready().then(() => { poll(); connectLive(); micWanted = true; void startMic(); }).catch(showError);
window.addEventListener('pagehide', () => {
  leaving = true; stopLocally(); clearTimeout(reconnectTimer);
  try { ws?.close(); } catch {}
  void NexoApi.post('/api/stop', {}, { keepalive: true }).catch(() => {});
});
