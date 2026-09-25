'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { DesktopController, checkAbort } = require('./desktop');
const { createAgent, MODE_PROVIDER, synthesizeSpeech, answerWithSearch } = require('./agent');
const { LiveSession } = require('./live');

function loadEnv(file, env = process.env) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in env)) env[key] = value;
  }
}
const failure = (status, message) => Object.assign(new Error(message), { status });
function validateMessages(value) {
  if (!Array.isArray(value) || !value.length || value.length > 32) throw failure(400, 'Gespräch muss 1–32 Nachrichten enthalten.');
  let total = 0;
  const messages = value.map(m => {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 8000)
      throw failure(400, 'Ungültige Gesprächsnachricht.');
    total += m.content.length;
    return { role: m.role, content: m.content };
  });
  if (total > 24000 || messages.at(-1).role !== 'user') throw failure(400, 'Gespräch zu lang oder letzte Nachricht nicht vom Nutzer.');
  return messages;
}
function validateAudio(value) {
  if (!value || typeof value.audio !== 'string' || value.audio.length < 32 || value.audio.length > 12 * 1024 * 1024)
    throw failure(400, 'Audionachricht fehlt oder ist zu groß.');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value.audio)) throw failure(400, 'Audiodaten sind ungültig.');
  if (typeof value.mimeType !== 'string' || !/^audio\/(webm|ogg|wav|mpeg|mp4|aac|flac)(?:;[^ ]+)?$/i.test(value.mimeType))
    throw failure(400, 'Audioformat wird nicht unterstützt.');
  return { data: value.audio, mimeType: value.mimeType.split(';', 1)[0].toLowerCase() };
}
function readJson(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [], done = false;
    const finish = (err, value) => { if (done) return; done = true; err ? reject(err) : resolve(value); };
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) { chunks = []; finish(failure(413, 'Anfrage zu groß.')); }
      else if (!done) chunks.push(chunk);
    });
    req.on('aborted', () => finish(failure(400, 'Anfrage abgebrochen.')));
    req.on('error', () => finish(failure(400, 'Anfrage konnte nicht gelesen werden.')));
    req.on('end', () => {
      if (done) return;
      try { finish(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { finish(failure(400, 'Ungültiges JSON.')); }
    });
  });
}
function createNexoServer({ env = process.env, bridge, agent = createAgent({ env }), appDir = path.join(__dirname, '..', 'App'), fetchImpl = fetch } = {}) {
  const sessions = new Map();
  let job = null;
  const desktop = new DesktopController({ bridge, onStop: reason => stopAll(reason) });
  function stopAll(reason = 'Gestoppt.') {
    if (job) { job.reason = reason; job.controller.abort(); }
    desktop.disable(reason);
  }
  const timer = setInterval(() => {
    desktop.expire();
    for (const [id, s] of sessions) if (Date.now() - s.seen > 3600000) sessions.delete(id);
  }, 1000);
  timer.unref();
  function json(res, code, value, headers = {}) {
    if (res.destroyed || res.writableEnded) return;
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
    res.end(JSON.stringify(value));
  }
  function session(req) {
    const id = /(?:^|;\s*)nexoSession=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    const current = sessions.get(id);
    const token = req.headers['x-nexo-token'];
    if (!current || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) ||
        !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(current.token))) throw failure(401, 'Sitzung abgelaufen. NEXO neu laden.');
    current.seen = Date.now(); desktop.touch(id);
    return { id, ...current };
  }
  function checkRequest(req) {
    const port = server.address()?.port;
    const allowed = ['localhost:' + port, '127.0.0.1:' + port];
    if (!allowed.includes(req.headers.host)) throw failure(403, 'Unzulässiger Host.');
    if (req.headers['sec-fetch-site'] === 'cross-site') throw failure(403, 'Fremde Webseite gesperrt.');
    const expectedOrigin = 'http://' + req.headers.host;
    if (req.headers.origin && req.headers.origin !== expectedOrigin) throw failure(403, 'Unzulässige Herkunft.');
    if (req.method === 'POST') {
      if (req.headers.origin !== expectedOrigin) throw failure(403, 'Herkunft fehlt.');
      if ((req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/json') throw failure(415, 'JSON erforderlich.');
    }
  }
  async function staticFile(urlPath, req, res) {
    if (!['GET', 'HEAD'].includes(req.method)) throw failure(405, 'Methode nicht erlaubt.');
    const file = path.resolve(appDir, '.' + (urlPath === '/' ? '/index.html' : urlPath));
    const relative = path.relative(appDir, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || urlPath.includes('\\') || urlPath.includes('\0')) throw failure(403, 'Pfad nicht erlaubt.');
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };
    const type = types[path.extname(file)];
    if (!type) throw failure(404, 'Datei nicht gefunden.');
    let real;
    try { real = await fs.promises.realpath(file); }
    catch { throw failure(404, 'Datei nicht gefunden.'); }
    const realRelative = path.relative(await fs.promises.realpath(appDir), real);
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) throw failure(403, 'Pfad nicht erlaubt.');
    let data;
    try { data = await fs.promises.readFile(real); } catch { throw failure(404, 'Datei nicht gefunden.'); }
    res.writeHead(200, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    try {
      checkRequest(req);
      let route;
      try { route = decodeURIComponent(req.url.split('?')[0]); } catch { throw failure(400, 'Ungültige URL-Codierung.'); }
      if (req.method === 'GET' && route === '/api/health') {
        return json(res, 200, { ok: true, modeProvider: MODE_PROVIDER, models: agent.models,
          providers: { openai: !!env.OPENAI_API_KEY, gemini: !!env.GEMINI_API_KEY }, version: 32 });
      }
      if (req.method === 'GET' && route === '/api/session') {
        if (sessions.size >= 16) throw failure(429, 'Zu viele offene Sitzungen. NEXO-Fenster schließen.');
        if (job) throw failure(409, 'NEXO bearbeitet bereits einen Auftrag.');
        const id = crypto.randomBytes(32).toString('hex'), token = crypto.randomBytes(32).toString('hex');
        if (desktop.owner) desktop.disable('Neue NEXO-Sitzung verbunden.');
        sessions.set(id, { token, seen: Date.now(), log: [] });
        try { await desktop.enable(id); }
        catch (err) { sessions.delete(id); throw failure(503, 'PC-Steuerung konnte nicht gestartet werden: ' + err.message); }
        return json(res, 200, { token }, { 'Set-Cookie': 'nexoSession=' + id + '; HttpOnly; SameSite=Strict; Path=/' });
      }
      if (!route.startsWith('/api/')) return await staticFile(route, req, res);
      const current = session(req);
      if (req.method === 'GET' && route === '/api/status') {
        return json(res, 200, { ...desktop.status(current.id), busy: !!job,
          ownJob: job?.owner === current.id, jobId: job?.owner === current.id ? job.id : null,
          log: current.log.slice(-30), mode: current.mode || null });
      }
      if (req.method !== 'POST') throw failure(404, 'Schnittstelle nicht gefunden.');
      const isVoice = route === '/api/voice';
      const body = await readJson(req, isVoice ? 14 * 1024 * 1024 : 65536);
      if (!body || Array.isArray(body) || typeof body !== 'object') throw failure(400, 'JSON-Objekt erforderlich.');
      if (route === '/api/stop') {
        stopAll('Vom Nutzer gestoppt.');
        return json(res, 200, { ok: true });
      }
      if (route === '/api/speech') {
        if (!env.GEMINI_API_KEY) throw failure(503, 'Für Sprachausgabe ist ein Gemini-Key in Server/.env nötig.');
        if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000) throw failure(400, 'Ungültiger Text für Sprachausgabe.');
        let audio;
        const speechAbort = new AbortController();
        const disconnect = () => speechAbort.abort();
        res.once('close', disconnect);
        try { audio = await synthesizeSpeech({ env, fetchImpl }, body.text.trim(), speechAbort.signal); }
        catch (err) { throw failure(502, err.message); }
        finally { res.removeListener('close', disconnect); }
        if (res.destroyed || res.writableEnded) return;
        res.writeHead(200, { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' });
        return res.end(audio);
      }
      if (route !== '/api/chat' && !isVoice) throw failure(404, 'Schnittstelle nicht gefunden.');
      const messages = validateMessages(body.messages);
      if (!Object.hasOwn(MODE_PROVIDER, body.mode)) throw failure(400, 'Unbekannter Modus.');
      const audio = isVoice ? validateAudio(body) : null;
      if (isVoice && !env.GEMINI_API_KEY) throw failure(503, 'Für Sprache ist ein Gemini-Key in Server/.env nötig.');
      if (job) throw failure(409, 'NEXO bearbeitet bereits einen Auftrag.');
      const controller = new AbortController();
      const thisJob = { id: crypto.randomUUID(), owner: current.id, controller };
      job = thisJob;
      const deadline = setTimeout(() => { thisJob.reason = 'Zeitlimit erreicht.'; controller.abort(); }, 240000);
      const disconnect = () => { if (!res.writableEnded) stopAll('Auftraggeber hat die Verbindung getrennt.'); };
      res.on('close', disconnect);
      const state = sessions.get(current.id);
      try {
        const result = await agent.run({
          messages, mode: body.mode, providerOverride: isVoice ? 'gemini' : undefined, audio,
          signal: controller.signal, controlEnabled: desktop.status(current.id).enabled,
          execute: async (name, args, signal) => {
            checkAbort(signal);
            if (name === 'set_mode') {
              if (!Object.hasOwn(MODE_PROVIDER, args.mode)) throw new Error('Unbekannter Modus.');
              state.mode = { name: args.mode, id: crypto.randomUUID() };
              return { ok: true, mode: args.mode, message: 'Modus für die nächste Anfrage umgestellt.' };
            }
            if (name === 'computer_observe') return desktop.observe(current.id, signal);
            if (name === 'computer_action') return desktop.action(current.id, args, signal);
            if (name === 'launch_app') return desktop.launchApp(current.id, args, signal);
            if (name === 'search_web') return desktop.searchWeb(current.id, args, signal);
            if (name === 'focus_window') return desktop.focusWindow(current.id, args, signal);
            if (name === 'click_by_name') return desktop.clickByName(current.id, args, signal);
            if (name === 'web_answer') return answerWithSearch({ env, fetchImpl }, args.query, signal).then(answer => ({ ok: true, answer }));
            throw new Error('Unbekanntes Werkzeug.');
          },
          onTool: entry => {
            state.log.push({ ...entry, time: Date.now(), id: crypto.randomUUID() });
            if (state.log.length > 60) state.log.shift();
          }
        });
        checkAbort(controller.signal);
        json(res, 200, result);
      } catch (err) {
        json(res, controller.signal.aborted ? 409 : 502, { error: controller.signal.aborted ? (thisJob.reason || 'Auftrag gestoppt.') : err.message, stopped: controller.signal.aborted });
      } finally {
        clearTimeout(deadline); res.removeListener('close', disconnect); desktop.finishTask();
        if (job === thisJob) job = null;
      }
    } catch (err) { json(res, err.status || 400, { error: err.message || 'Anfrage fehlgeschlagen.' }); }
  });
  server.requestTimeout = 300000;
  server.headersTimeout = 10000;
  server.on('close', () => { clearInterval(timer); stopAll('Server beendet.'); });

  // Live voice relay: one persistent Gemini Live connection per browser tab,
  // proxied through here so the API key never reaches the browser. A
  // WebSocket handshake can't carry the X-Nexo-Token header the way a POST
  // does, so the session cookie plus the existing Origin/Host checks below
  // are what authenticate it instead.
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (req, socket, head) => {
    try {
      checkRequest(req);
      const route = decodeURIComponent(req.url.split('?')[0]);
      if (route !== '/ws/voice') throw failure(404, 'Unbekannter Pfad.');
      const id = /(?:^|;\s*)nexoSession=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
      const current = sessions.get(id);
      if (!current) throw failure(401, 'Sitzung abgelaufen.');
      wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, id, current));
    } catch (err) {
      try { socket.write('HTTP/1.1 ' + (err.status || 400) + ' ' + String(err.message || 'Bad Request').replace(/[\r\n]/g, '') + '\r\n\r\n'); } catch {}
      socket.destroy();
    }
  });
  wss.on('connection', (ws, id, current) => {
    current.seen = Date.now(); desktop.touch(id);
    const controller = new AbortController();
    const send = value => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(value)); };
    const live = new LiveSession({
      env,
      controlEnabled: desktop.status(id).enabled,
      execute: async (name, args) => {
        checkAbort(controller.signal);
        if (name === 'set_mode') {
          if (!Object.hasOwn(MODE_PROVIDER, args.mode)) throw new Error('Unbekannter Modus.');
          current.mode = { name: args.mode, id: crypto.randomUUID() };
          return { ok: true, mode: args.mode, message: 'Modus für die nächste Anfrage umgestellt.' };
        }
        if (name === 'computer_observe') return desktop.observe(id, controller.signal);
        if (name === 'computer_action') return desktop.action(id, args, controller.signal);
        if (name === 'launch_app') return desktop.launchApp(id, args, controller.signal);
        if (name === 'search_web') return desktop.searchWeb(id, args, controller.signal);
        if (name === 'focus_window') return desktop.focusWindow(id, args, controller.signal);
        if (name === 'click_by_name') return desktop.clickByName(id, args, controller.signal);
        if (name === 'web_answer') return answerWithSearch({ env, fetchImpl }, args.query, controller.signal).then(answer => ({ ok: true, answer }));
        throw new Error('Unbekanntes Werkzeug.');
      },
      onAudio: buffer => { if (ws.readyState === ws.OPEN) ws.send(buffer, { binary: true }); },
      onTranscript: entry => send({ type: 'transcript', ...entry }),
      onInterrupted: () => send({ type: 'interrupted' }),
      onToolLog: entry => {
        current.log.push({ ...entry, time: Date.now(), id: crypto.randomUUID() });
        if (current.log.length > 60) current.log.shift();
        if (entry.name === 'set_mode' && entry.result.ok) send({ type: 'mode', mode: entry.result.mode });
      },
      onError: err => send({ type: 'error', message: String(err.message || err).slice(0, 190) }),
      onStatus: status => send({ type: 'status', status })
    });
    ws.on('message', (data, isBinary) => { if (isBinary) live.sendAudio(data); });
    ws.on('close', () => { controller.abort(); live.close(); });
    ws.on('error', () => {});
  });

  return { server, desktop, stopAll };
}
if (require.main === module) {
  loadEnv(path.join(__dirname, '.env'));
  const { server, stopAll } = createNexoServer();
  const port = Number(process.env.PORT) || 4790;
  server.on('error', err => {
    console.error(err.code === 'EADDRINUSE' ? 'NEXO läuft bereits auf Port ' + port + '.' : 'NEXO konnte nicht starten: ' + err.code);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.log('NEXO Core: http://localhost:' + port));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopAll(); server.close(); });
}
module.exports = { createNexoServer, loadEnv, validateMessages, validateAudio };
