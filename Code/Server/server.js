// NEXO Core: a small local server that holds the AI API keys and proxies
// chat requests, so no key has to live in the browser-facing code.
// Serves the static App files too, so the whole HUD runs same-origin from here.
//
// Which provider answers depends on the HUD's current color mode (see
// MODE_PROVIDER below) — this is the first step toward the "switch models by
// voice/mode" idea from the project notes, done the simple way for now.
//
// Both providers can call a small, fixed set of local tools (open an
// allow-listed app, open a web search) — see ALLOWED_APPS/executeTool. This
// is deliberately narrow: no arbitrary command execution, no confirmation
// step (the user asked for these specific, reversible actions to run
// immediately), nothing beyond opening things.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
const SYSTEM_PROMPT = 'Du bist NEXO, ein persönlicher Assistent mit einem Partikel-Kopf-HUD auf dem Bildschirm. Antworte kurz, klar und auf Deutsch, in Sätzen, die sich gut laut vorlesen lassen. Du kannst ein Programm öffnen oder schließen, eine Websuche starten, oder den Betriebsmodus des HUD wechseln, wenn danach gefragt wird — nutze dafür die bereitgestellten Werkzeuge statt nur davon zu reden.';

// Which provider handles a request, based on the HUD's active color mode.
const MODE_PROVIDER = { standby: 'openai', focus: 'gemini', energy: 'openai' };

// Fixed allow-list: the model can only ever launch/close one of these, never
// an arbitrary path or command. `process` is the name Windows actually runs
// it under (sometimes different from the launch exe, e.g. calc.exe starts
// CalculatorApp.exe) — used for closing. `closable:false` keeps
// explorer.exe off the close list: killing it takes down the taskbar/desktop
// shell too, which isn't the kind of small, reversible action this is for.
const ALLOWED_APPS = {
  editor: { exe: 'notepad.exe', process: 'notepad.exe' },
  rechner: { exe: 'calc.exe', process: 'CalculatorApp.exe' },
  explorer: { exe: 'explorer.exe', process: 'explorer.exe', closable: false },
  taskmanager: { exe: 'taskmgr.exe', process: 'Taskmgr.exe' },
  paint: { exe: 'mspaint.exe', process: 'mspaint.exe' },
  firefox: { exe: 'firefox.exe', process: 'firefox.exe' },
  chrome: { exe: 'chrome.exe', process: 'chrome.exe' },
  edge: { exe: 'msedge.exe', process: 'msedge.exe' },
  word: { exe: 'winword.exe', process: 'WINWORD.EXE' },
  excel: { exe: 'excel.exe', process: 'EXCEL.EXE' },
  outlook: { exe: 'outlook.exe', process: 'OUTLOOK.EXE' },
  spotify: { exe: 'spotify.exe', process: 'Spotify.exe' },
  discord: { exe: 'discord.exe', process: 'Discord.exe' },
  vscode: { exe: 'code.exe', process: 'Code.exe' },
  terminal: { exe: 'wt.exe', process: 'WindowsTerminal.exe' }
};
const CLOSABLE_APPS = Object.keys(ALLOWED_APPS).filter(k => ALLOWED_APPS[k].closable !== false);
const MODES = ['standby', 'focus', 'energy'];

const TOOL_DEFS = [
  {
    name: 'open_app',
    description: 'Öffnet ein Programm aus einer festen, erlaubten Liste. Gültige Werte für "name": ' +
      Object.keys(ALLOWED_APPS).map(k => `"${k}"`).join(', ') + '.',
    params: { name: { type: 'string', enum: Object.keys(ALLOWED_APPS) } },
    required: ['name']
  },
  {
    name: 'close_app',
    description: 'Schließt ein laufendes Programm aus derselben festen Liste (außer "explorer", das bleibt geschützt). Gültige Werte für "name": ' +
      CLOSABLE_APPS.map(k => `"${k}"`).join(', ') + '.',
    params: { name: { type: 'string', enum: CLOSABLE_APPS } },
    required: ['name']
  },
  {
    name: 'web_search',
    description: 'Öffnet eine Websuche zu einer Anfrage im Standardbrowser.',
    params: { query: { type: 'string' } },
    required: ['query']
  },
  {
    name: 'set_mode',
    description: 'Wechselt den Betriebsmodus des HUD. Gültige Werte: "standby" (Bereit), "focus" (Fokus), "energy" (Energie).',
    params: { mode: { type: 'string', enum: MODES } },
    required: ['mode']
  }
];

function launch(cmd, args) {
  const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
  child.unref();
}

function killByName(processName) {
  return new Promise(resolve => {
    const child = spawn('taskkill', ['/IM', processName, '/F'], { stdio: 'ignore' });
    child.on('close', code => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function executeTool(name, args) {
  if (name === 'open_app') {
    const key = String(args?.name || '').toLowerCase();
    const app = ALLOWED_APPS[key];
    if (!app) return { ok: false, message: `Unbekanntes Programm "${args?.name}".` };
    try { launch(app.exe, []); return { ok: true, message: `${key} wurde geöffnet.`, app: key }; }
    catch (err) { return { ok: false, message: 'Konnte Programm nicht öffnen: ' + err.message }; }
  }
  if (name === 'close_app') {
    const key = String(args?.name || '').toLowerCase();
    const app = ALLOWED_APPS[key];
    if (!app || app.closable === false) return { ok: false, message: `"${args?.name}" kann nicht geschlossen werden.` };
    const closed = await killByName(app.process);
    return closed
      ? { ok: true, message: `${key} wurde geschlossen.`, app: key }
      : { ok: false, message: `${key} war vermutlich nicht geöffnet.`, app: key };
  }
  if (name === 'web_search') {
    const query = String(args?.query || '').trim();
    if (!query) return { ok: false, message: 'Keine Suchanfrage angegeben.' };
    const url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    try { launch('explorer.exe', [url]); return { ok: true, message: `Suche nach "${query}" geöffnet.`, query }; }
    catch (err) { return { ok: false, message: 'Konnte Browser nicht öffnen: ' + err.message }; }
  }
  if (name === 'set_mode') {
    const mode = String(args?.mode || '').toLowerCase();
    if (!MODES.includes(mode)) return { ok: false, message: `Unbekannter Modus "${args?.mode}".` };
    // The mode itself is a HUD/frontend concept, not something this process
    // can change — it just confirms a valid mode; conversation.js applies it.
    return { ok: true, message: `Modus ${mode} wird aktiviert.`, mode };
  }
  return { ok: false, message: 'Unbekanntes Werkzeug: ' + name };
}

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
  const tools = TOOL_DEFS.map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: { type: 'object', properties: t.params, required: t.required } }
  }));
  const baseMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
  async function request(msgs) {
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify({ model: OPENAI_MODEL, max_tokens: 400, messages: msgs, tools })
    });
    const data = await apiRes.json();
    if (!apiRes.ok) throw new Error(data.error?.message || 'OpenAI-API-Fehler.');
    return data;
  }
  let data = await request(baseMessages);
  let msg = data.choices?.[0]?.message;
  const toolLog = [];
  if (msg?.tool_calls?.length) {
    const toolReplies = [];
    for (const call of msg.tool_calls) {
      let args = {};
      try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* keep {} */ }
      const result = await executeTool(call.function.name, args);
      toolLog.push({ name: call.function.name, args, result });
      toolReplies.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
    data = await request([...baseMessages, msg, ...toolReplies]);
    msg = data.choices?.[0]?.message;
  }
  return { reply: msg?.content || '', toolLog };
}

async function callGemini(messages) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Kein GEMINI_API_KEY in Code/Server/.env gefunden.');
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const functionDeclarations = TOOL_DEFS.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'OBJECT',
      properties: Object.fromEntries(Object.entries(t.params).map(([k, v]) => [k, { type: v.type.toUpperCase(), ...(v.enum ? { enum: v.enum } : {}) }])),
      required: t.required
    }
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  async function request(currentContents) {
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: currentContents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        tools: [{ functionDeclarations }],
        generationConfig: { maxOutputTokens: 400 }
      })
    });
    const data = await apiRes.json();
    if (!apiRes.ok) throw new Error(data.error?.message || 'Gemini-API-Fehler.');
    return data;
  }
  let data = await request(contents);
  let parts = data.candidates?.[0]?.content?.parts || [];
  const toolLog = [];
  const fnCall = parts.find(p => p.functionCall);
  if (fnCall) {
    const { name, args } = fnCall.functionCall;
    const result = await executeTool(name, args || {});
    toolLog.push({ name, args: args || {}, result });
    // Push the original part back verbatim (not just {functionCall}) — newer
    // Gemini models attach a thoughtSignature alongside functionCall that
    // must round-trip unchanged or the API rejects the follow-up request.
    contents.push({ role: 'model', parts: [fnCall] });
    contents.push({ role: 'user', parts: [{ functionResponse: { name, response: result } }] });
    data = await request(contents);
    parts = data.candidates?.[0]?.content?.parts || [];
  }
  return { reply: parts.map(p => p.text || '').join(''), toolLog };
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
      const { reply, toolLog } = provider === 'gemini' ? await callGemini(messages) : await callOpenAI(messages);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply, provider, toolLog }));
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
      gemini: { hasKey: !!process.env.GEMINI_API_KEY, model: GEMINI_MODEL },
      allowedApps: Object.keys(ALLOWED_APPS)
    }));
    return;
  }
  serveStatic(req, res);
// Bind to localhost only — this process holds paid API keys, and must not be
// reachable from other devices on the same network.
}).listen(PORT, '127.0.0.1', () => console.log('NEXO Core läuft auf http://localhost:' + PORT));
