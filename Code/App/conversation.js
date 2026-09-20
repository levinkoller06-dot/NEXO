// Microphone intent, actual recognition, network work and speech are separate states.
const conversationHistory = [];
const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
let mic = null, recorder = null, recorderStream = null, recorderChunks = [], busy = false, cancelSpeech = () => {}, lastModeEvent = null;
function showError(err) {
  $('state').textContent = String(err.message || err).slice(0, 190);
}
function addTurn(role, text) {
  conversationHistory.push({ role, content: text });
  while (conversationHistory.length > 24 || conversationHistory.reduce((n, h) => n + h.content.length, 0) > 16000) conversationHistory.shift();
  const list = document.getElementById('transcript-log');
  if (!list) return;
  list.querySelector('.transcript-empty')?.remove();
  const li = document.createElement('li'); li.className = role;
  li.textContent = (role === 'user' ? 'Du: ' : 'NEXO: ') + text; list.appendChild(li);
  while (list.children.length > 60) list.firstElementChild.remove();
  list.scrollTop = list.scrollHeight;
}
// The mic stays live through the whole "thinking" phase being the only time
// it's muted; once NEXO starts speaking it listens again so the user can
// just talk over it instead of waiting it out. See updateMicBusy().
function updateMicBusy() { mic?.setBusy(busy && !speaking); }
function sayWithBrowserVoice(text, signal) {
  if (!window.speechSynthesis || signal.aborted) return Promise.resolve();
  cancelSpeech();
  return new Promise(resolve => {
    const utter = new SpeechSynthesisUtterance(text); utter.lang = 'de-DE';
    let finished = false;
    const done = () => {
      if (finished) return; finished = true;
      clearTimeout(timer); signal.removeEventListener('abort', cancel);
      speaking = false; updateMicBusy(); cancelSpeech = () => {}; resolve();
    };
    const cancel = () => { speechSynthesis.cancel(); done(); };
    const timer = setTimeout(cancel, 90000);
    cancelSpeech = cancel; signal.addEventListener('abort', cancel, { once: true });
    utter.onend = utter.onerror = done; utter.onstart = () => { if (!finished) { speaking = true; updateMicBusy(); } };
    $('state').textContent = 'NEXO spricht.';
    speechSynthesis.speak(utter);
  });
}
// Split into sentence-sized chunks so the first chunk's (much shorter, much
// faster) audio can start playing while later chunks are still being
// synthesized, instead of waiting for the whole reply's audio at once.
function splitIntoSpeechChunks(text) {
  return (text.match(/[^.!?\n]+[.!?\n]*/g) || [text]).map(s => s.trim()).filter(Boolean);
}
async function fetchSpeechBlob(text, signal) {
  try { return await NexoApi.postBlob('/api/speech', { text }, { signal }); }
  catch (error) {
    if (signal.aborted) return null;
    showError(new Error('Gemini-Sprachausgabe nicht erreichbar (' + (error.message || error) + '), nutze Browser-Stimme.'));
    return null;
  }
}
function playSpeechBlob(blob, signal) {
  return new Promise(resolve => {
    const audio = new Audio(URL.createObjectURL(blob));
    let finished = false;
    const done = () => {
      if (finished) return; finished = true;
      signal.removeEventListener('abort', cancel);
      URL.revokeObjectURL(audio.src); resolve();
    };
    const cancel = () => { audio.pause(); done(); };
    cancelSpeech = cancel; signal.addEventListener('abort', cancel, { once: true });
    audio.onended = audio.onerror = done; audio.onplay = () => { if (!finished) { speaking = true; updateMicBusy(); } };
    audio.play().catch(done);
  });
}
async function say(text, signal) {
  if (signal.aborted) return;
  cancelSpeech();
  const chunks = splitIntoSpeechChunks(text);
  if (!chunks.length) return;
  $('state').textContent = 'NEXO spricht.';
  let pending = fetchSpeechBlob(chunks[0], signal);
  for (let i = 0; i < chunks.length && !signal.aborted; i++) {
    const blob = await pending;
    if (signal.aborted) break;
    pending = i + 1 < chunks.length ? fetchSpeechBlob(chunks[i + 1], signal) : null;
    if (!blob) { await sayWithBrowserVoice(chunks.slice(i).join(' '), signal); break; }
    await playSpeechBlob(blob, signal);
  }
  speaking = false; updateMicBusy(); cancelSpeech = () => {};
}
const queue = new NexoConversationState.SerialQueue({
  onBusy(value) {
    busy = value; updateMicBusy();
    const send = document.getElementById('send'), command = document.getElementById('command');
    if (send) send.disabled = value;
    if (command) command.setAttribute('aria-busy', String(value));
  },
  onError: showError,
  async run(text, signal) {
    const audio = text && typeof text === 'object' && text.kind === 'audio' ? text : null;
    addTurn('user', audio ? 'Sprachnachricht' : text);
    $('state').textContent = 'Denkt nach …';
    const payload = { mode, messages: conversationHistory.map(h => ({ ...h })) };
    if (audio) Object.assign(payload, { audio: audio.data, mimeType: audio.mimeType });
    const data = await NexoApi.post(audio ? '/api/voice' : '/api/chat', payload, { signal });
    if (signal.aborted) return;
    const modelStatus = document.getElementById('model-status');
    if (modelStatus) modelStatus.textContent = (data.provider === 'gemini' ? 'Gemini' : 'OpenAI') + ' · ' + data.model;
    for (const item of data.toolLog || []) if (item.name === 'set_mode' && item.result.ok) window.nexoSetMode(item.result.mode);
    addTurn('assistant', data.reply);
    await say(data.reply, signal);
    if (!signal.aborted) $('state').textContent = mic?.wanted ? 'Ich höre zu.' : 'Ich bin bereit.';
  }
});
let microphoneRequest = null;
function requestMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) return Promise.resolve(null);
  if (!microphoneRequest) microphoneRequest = navigator.mediaDevices.getUserMedia({ audio: true }).finally(() => { microphoneRequest = null; });
  return microphoneRequest;
}
async function ensureMicrophonePermission() {
  try {
    const stream = await requestMicrophone();
    stream?.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    showError(new Error(error.name === 'NotAllowedError' ? 'Mikrofon-Zugriff wurde verweigert.' : 'Mikrofon ist nicht verfügbar.'));
    return false;
  }
}
if (SpeechRecognitionImpl) {
  const recognition = new SpeechRecognitionImpl();
  recognition.lang = 'de-DE'; recognition.continuous = true; recognition.interimResults = true;
  mic = new NexoConversationState.MicController({
    recognition,
    onChange({ wanted, busy: working, actual }) {
      const active = wanted && !working && actual === 'listening';
      $('talk').classList.toggle('active', active); $('talk').classList.toggle('muted', !active);
      $('talk').setAttribute('aria-pressed', String(wanted));
      $('talk').setAttribute('aria-label', wanted ? 'Stummschaltung einschalten' : 'Stummschaltung aufheben');
    },
    onError(error) { showError(new Error(error === 'not-allowed' ? 'Mikrofon-Zugriff wurde verweigert.' : 'Spracherkennung: ' + error)); }
  });
  mic.notify();
  recognition.onresult = event => {
    if (!mic.wanted || (busy && !speaking)) return;
    const interrupting = speaking;
    let text = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) text += r[0].transcript + ' ';
      else $('state').textContent = r[0].transcript;
    }
    if (text.trim()) {
      // Barge-in: talking over NEXO cuts off the current reply instead of
      // queuing behind it, so the user never has to wait it out to redirect.
      if (interrupting) { cancelSpeech(); queue.stop(); }
      queue.push(text.trim().slice(0, 8000));
    }
  };
  // Start recognition directly, without waiting on the permission promise.
  // Some Edge app windows keep getUserMedia pending while the permission
  // bubble is hidden; waiting for that promise made the button appear dead.
  // The permission check runs in parallel and stops recognition only when
  // access is definitely denied. Used both to switch the mic on by default
  // at startup and for the manual toggle.
  async function startListening() {
    mic.setWanted(true);
    const allowed = await ensureMicrophonePermission();
    if (!allowed && mic.wanted) mic.setWanted(false);
  }
  $('talk').onclick = () => { if (mic.wanted) { mic.setWanted(false); if (speaking) cancelSpeech(); return; } void startListening(); };
  void startListening();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && mic.wanted && !busy) mic.schedule();
  });
} else {
  const supportedTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg'];
  const recorderType = supportedTypes.find(type => window.MediaRecorder?.isTypeSupported?.(type)) || '';
  async function startRecording() {
    if (busy || recorder) return;
    let stream;
    try { stream = await requestMicrophone(); } catch (error) {
      showError(new Error(error.name === 'NotAllowedError' ? 'Mikrofon-Zugriff wurde verweigert.' : 'Mikrofon ist nicht verfügbar.')); return;
    }
    if (!stream || !window.MediaRecorder) { showError(new Error('Spracherkennung ist in diesem Browser nicht verfügbar.')); return; }
    try { recorder = recorderType ? new MediaRecorder(stream, { mimeType: recorderType }) : new MediaRecorder(stream); }
    catch { stream.getTracks().forEach(track => track.stop()); showError(new Error('Audioaufnahme konnte nicht gestartet werden.')); return; }
    recorderStream = stream; recorderChunks = [];
    recorder.ondataavailable = event => { if (event.data.size) recorderChunks.push(event.data); };
    recorder.onerror = () => { stopRecording(true); showError(new Error('Audioaufnahme wurde beendet.')); };
    recorder.onstop = async () => {
      const current = recorder, chunks = recorderChunks.slice(), mimeType = current?.mimeType || recorderType || 'audio/webm';
      recorder = null; recorderChunks = []; recorderStream?.getTracks().forEach(track => track.stop()); recorderStream = null;
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: mimeType });
      const bytes = new Uint8Array(await blob.arrayBuffer()); let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      queue.push({ kind: 'audio', mimeType: mimeType.split(';', 1)[0], data: btoa(binary) });
    };
    recorder.start(); $('talk').classList.add('active'); $('talk').classList.remove('muted'); $('talk').setAttribute('aria-pressed', 'true');
  }
  function stopRecording(discard = false) {
    if (!recorder) return;
    if (discard) { recorder.onstop = null; recorder.ondataavailable = null; }
    try { recorder.stop(); } catch { recorder = null; recorderStream?.getTracks().forEach(track => track.stop()); recorderStream = null; }
    $('talk').classList.remove('active'); $('talk').classList.add('muted'); $('talk').setAttribute('aria-pressed', 'false');
  }
  if (window.MediaRecorder && navigator.mediaDevices?.getUserMedia) $('talk').onclick = () => recorder ? stopRecording() : void startRecording();
  else { $('talk').disabled = true; $('talk').classList.add('muted'); }
}
function stopLocally() { mic?.setWanted(false); if (recorder) { recorder.onstop = null; recorder.ondataavailable = null; try { recorder.stop(); } catch {} recorder = null; } recorderStream?.getTracks().forEach(track => track.stop()); recorderStream = null; queue.stop(); cancelSpeech(); $('state').textContent = 'Gestoppt.'; }
window.nexoStop = async () => {
  stopLocally();
  try { await NexoApi.post('/api/stop', {}); } catch (err) { showError(err); }
};
document.addEventListener('keydown', e => { if (e.ctrlKey && e.altKey && e.key === 'F12') { e.preventDefault(); void window.nexoStop(); } });
let approvalId = null, leaving = false;
async function answerApproval(approved) {
  if (!approvalId) return;
  const id = approvalId; approvalId = null; $('approval').close(); $('approval-image').removeAttribute('src');
  try { await NexoApi.post('/api/approve', { id, approved }); } catch (err) { showError(err); }
}
$('approve').onclick = () => void answerApproval(true);
$('deny').onclick = () => void answerApproval(false);
$('approval').addEventListener('cancel', e => { e.preventDefault(); void answerApproval(false); });
async function poll() {
  if (leaving) return;
  try {
    const data = await NexoApi.get('/api/status');
    if (data.mode && data.mode.id !== lastModeEvent) { lastModeEvent = data.mode.id; window.nexoSetMode(data.mode.name); }
    if (data.approval && approvalId !== data.approval.id) {
      approvalId = data.approval.id;
      $('approval-reason').textContent = data.approval.reason;
      const a = data.approval.action;
      $('approval-action').textContent = a.action + (a.key ? ': ' + a.key : a.text ? ': ' + a.text : a.x !== undefined ? ' bei ' + a.x + ', ' + a.y : '');
      $('approval-image').src = 'data:image/jpeg;base64,' + data.approval.image;
      if (!$('approval').open) $('approval').showModal();
      if (queue.controller) void say('Bitte bestätige den nächsten Schritt im NEXO-Fenster.', queue.controller.signal);
    } else if (!data.approval && approvalId) {
      approvalId = null; $('approval').close(); $('approval-image').removeAttribute('src');
    }
  } catch (err) { if (err.status === 401) { stopLocally(); showError(err); return; } }
  setTimeout(poll, 1000);
}
NexoApi.ready().then(poll).catch(showError);
window.addEventListener('pagehide', () => { leaving = true; stopLocally(); void NexoApi.post('/api/stop', {}, { keepalive: true }).catch(() => {}); });
