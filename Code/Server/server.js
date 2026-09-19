// NEXO Core: a small local server that holds the OpenAI API key and proxies
// chat requests, so the key never has to live in the browser-facing code.
// Serves the static App files too, so the whole HUD runs same-origin from here.
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
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const APP_DIR = path.join(__dirname, '..', 'App');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const SYSTEM_PROMPT = 'Du bist NEXO, ein persönlicher Assistent mit einem Partikel-Kopf-HUD auf dem Bildschirm. Antworte kurz, klar und auf Deutsch, in Sätzen, die sich gut laut vorlesen lassen.';

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

function handleChat(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    if (!process.env.OPENAI_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Kein OPENAI_API_KEY in Code/Server/.env gefunden.' }));
      return;
    }
    let messages;
    try { messages = JSON.parse(body).messages; } catch { messages = null; }
    if (!Array.isArray(messages) || !messages.length) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Keine Nachrichten übergeben.' }));
      return;
    }
    try {
      const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer ' + process.env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 400,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
        })
      });
      const data = await apiRes.json();
      if (!apiRes.ok) {
        res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: data.error?.message || 'OpenAI-API-Fehler.' }));
        return;
      }
      const reply = data.choices?.[0]?.message?.content || '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply }));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Verbindung zu OpenAI fehlgeschlagen: ' + err.message }));
    }
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') { handleChat(req, res); return; }
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, hasKey: !!process.env.OPENAI_API_KEY, model: MODEL }));
    return;
  }
  serveStatic(req, res);
// Bind to localhost only — this process holds a paid API key, and must not be
// reachable from other devices on the same network.
}).listen(PORT, '127.0.0.1', () => console.log('NEXO Core läuft auf http://localhost:' + PORT));
