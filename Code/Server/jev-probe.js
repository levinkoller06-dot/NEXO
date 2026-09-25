'use strict';
// Standalone script to try out TypeSafe AI's "Jev" model via Vercel AI
// Gateway, completely separate from the main NEXO server. Run with:
//   node Server/jev-probe.js
// Reads AI_GATEWAY_API_KEY (and optionally JEV_MODEL) from Server/.env.
const fs = require('fs');
const path = require('path');

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
loadEnv(path.join(__dirname, '.env'));

const key = process.env.AI_GATEWAY_API_KEY;
const model = process.env.JEV_MODEL || 'typesafe-ai/jev';
if (!key) { console.error('AI_GATEWAY_API_KEY fehlt in Server/.env.'); process.exit(1); }

async function call(label, body) {
  console.log('\n=== ' + label + ' ===');
  const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, ...body })
  });
  const text = await res.text();
  console.log('HTTP ' + res.status);
  console.log(text);
}

async function main() {
  // 1) Plain chat message - Jev is not a chat model, so this shows what the
  // gateway does with a generic prompt (likely a fallback/empty/odd reply).
  await call('Plain chat prompt', { messages: [{ role: 'user', content: 'Hallo, wer bist du?' }] });

  // 2) Jev's real shape (state + typed questions) sent as extra top-level
  // fields alongside the required OpenAI "messages" field, in case the
  // gateway passes provider-specific fields through to TypeSafe untouched.
  await call('TypeSafe-shaped request (state + questions)', {
    messages: [{ role: 'user', content: 'ignored - see state/questions' }],
    state: 'Ich möchte Firefox öffnen und dann nach Katzenvideos suchen.',
    questions: {
      intent: {
        type: 'choice',
        instructions: 'Welche Absicht hat der Nutzer?',
        criteria: { open_app: 'Ein Programm öffnen', search: 'Etwas im Web suchen', other: 'Etwas anderes' }
      }
    }
  });
}

main().catch(err => { console.error(err); process.exit(1); });
