// Real voice conversation with NEXO: browser speech recognition -> local
// NEXO Core server (holds the OpenAI key) -> browser speech synthesis.
// Shares `$`, `log` and `speaking` with app.js (both are plain classic
// scripts in the same page, so their top-level bindings are visible here).
let history = [];
let listening = false;
let suppressRestart = false;
const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

function setTalkStatus(text) {
  const el = document.getElementById('talk-status');
  if (el) el.textContent = text;
}

function addTurn(role, text) {
  history.push({ role, content: text });
  const list = document.getElementById('transcript-log');
  const empty = list.querySelector('.transcript-empty');
  if (empty) empty.remove();
  const li = document.createElement('li');
  li.className = role;
  li.textContent = (role === 'user' ? 'Du: ' : 'NEXO: ') + text;
  list.appendChild(li);
  list.scrollTop = list.scrollHeight;
}

function speak(text, onDone) {
  if (!('speechSynthesis' in window)) {
    $('state').textContent = 'Sprachausgabe wird von diesem Browser nicht unterstützt.';
    onDone();
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'de-DE';
  speaking = true;
  setTalkStatus('SPRICHT');
  $('state').textContent = 'NEXO spricht.';
  utter.onend = utter.onerror = () => { speaking = false; onDone(); };
  speechSynthesis.speak(utter);
}

async function sendToCore(text) {
  addTurn('user', text);
  $('state').textContent = 'Denke nach …';
  setTalkStatus('DENKT NACH');
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history.map(h => ({ role: h.role, content: h.content })) })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || ('Serverfehler ' + res.status));
    const modelStatus = document.getElementById('model-status');
    if (modelStatus) modelStatus.textContent = 'OpenAI verbunden';
    addTurn('assistant', data.reply || '…');
    const wasListening = listening;
    if (wasListening) { suppressRestart = true; recognition.stop(); }
    speak(data.reply || '…', () => {
      suppressRestart = false;
      setTalkStatus(listening ? 'HÖRT ZU' : 'AUS');
      $('state').textContent = listening ? 'Ich höre zu.' : 'Ich bin bereit.';
      if (wasListening && listening) recognition.start();
    });
  } catch (err) {
    $('state').textContent = 'Verbindung zu NEXO Core fehlgeschlagen.';
    setTalkStatus('FEHLER');
    log('Gespräch fehlgeschlagen: ' + err.message);
  }
}

let recognition = null;
if (SpeechRecognitionImpl) {
  recognition = new SpeechRecognitionImpl();
  recognition.lang = 'de-DE';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (e) => {
    let finalText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else $('state').textContent = r[0].transcript;
    }
    if (finalText.trim()) sendToCore(finalText.trim());
  };
  recognition.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      $('state').textContent = 'Mikrofon-Zugriff wurde verweigert.';
      listening = false;
      $('talk').classList.remove('active');
      $('talk').setAttribute('aria-pressed', 'false');
      document.getElementById('mic-status').textContent = 'Aus';
      setTalkStatus('AUS');
    }
    log('Spracherkennung: ' + e.error);
  };
  recognition.onend = () => { if (listening && !suppressRestart) recognition.start(); };

  $('talk').onclick = () => {
    listening = !listening;
    $('talk').classList.toggle('active', listening);
    $('talk').setAttribute('aria-pressed', String(listening));
    document.getElementById('mic-status').textContent = listening ? 'Aktiv' : 'Aus';
    if (listening) {
      recognition.start();
      setTalkStatus('HÖRT ZU');
      $('state').textContent = 'Ich höre zu.';
      log('Gespräch gestartet');
    } else {
      suppressRestart = true;
      recognition.stop();
      setTalkStatus('AUS');
      $('state').textContent = 'Ich bin bereit.';
      log('Gespräch beendet');
    }
  };
} else {
  const talkButton = $('talk');
  talkButton.disabled = true;
  talkButton.title = 'Spracherkennung wird von diesem Browser nicht unterstützt.';
  document.getElementById('talk-hint').textContent = 'SPRACHERKENNUNG NICHT UNTERSTÜTZT · EDGE ODER CHROME NUTZEN';
}
