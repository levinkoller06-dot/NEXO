// NEXO Core: a small local server that holds the AI API keys and proxies
// chat requests, so no key has to live in the browser-facing code.
// Serves the static App files too, so the whole HUD runs same-origin from here.
//
// Which provider answers depends on the HUD's current color mode (see
// MODE_PROVIDER below) — this is the first step toward the "switch models by
// voice/mode" idea from the project notes, done the simple way for now.
const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 4790;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const APP_DIR = path.join(__dirname, '..', 'App');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const SYSTEM_PROMPT = 'Du bist NEXO, ein persönlicher Assistent mit einem Partikel-Kopf-HUD auf dem Bildschirm. Antworte kurz, klar und auf Deutsch, in Sätzen, die sich gut laut vorlesen lassen.';

// Which provider handles a request, based on the HUD's active color mode.
const MODE_PROVIDER = { standby: 'openai', focus: 'gemini', energy: 'openai' };

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(APP_DIR, decodeURIComponent(urlPath.split('?')[0]));
  if (!filePath.startsWith(APP_DIR)) { res.writeHead(403); res.end(); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

async function callOpenAI(messages) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Kein OPENAI_API_KEY in Code/Server/.env gefunden.');
  const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer ' + process.env.OPENAI_API_KEY
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 400,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
    })
  });
  const data = await apiRes.json();
  if (!apiRes.ok) throw new Error(data.error?.message || 'OpenAI-API-Fehler.');
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(messages) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Kein GEMINI_API_KEY in Code/Server/.env gefunden.');
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const apiRes = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { maxOutputTokens: 400 }
    })
  });
  const data = await apiRes.json();
  if (!apiRes.ok) throw new Error(data.error?.message || 'Gemini-API-Fehler.');
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || '').join('');
}

function handleChat(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = null; }
    const messages = parsed?.messages;
    if (!Array.isArray(messages) || !messages.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Keine Nachrichten übergeben.' }));
      return;
    }
    const mode = MODE_PROVIDER[parsed?.mode] ? parsed.mode : 'standby';
    const provider = MODE_PROVIDER[mode];
    try {
      const reply = provider === 'gemini' ? await callGemini(messages) : await callOpenAI(messages);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply, provider }));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message, provider }));
    }
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') { handleChat(req, res); return; }
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      modeProvider: MODE_PROVIDER,
      openai: { hasKey: !!process.env.OPENAI_API_KEY, model: OPENAI_MODEL },
      gemini: { hasKey: !!process.env.GEMINI_API_KEY, model: GEMINI_MODEL }
    }));
    return;
  }
  serveStatic(req, res);
// Bind to localhost only — this process holds paid API keys, and must not be
// reachable from other devices on the same network.
}).listen(PORT, '127.0.0.1', () => console.log('NEXO Core läuft auf http://localhost:' + PORT));
