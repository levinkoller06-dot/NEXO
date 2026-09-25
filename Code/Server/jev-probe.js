'use strict';
// Standalone script to try out TypeSafe AI's "Jev" model via OpenRouter's
// Decisions API, completely separate from the main NEXO server. Run with:
//   node Server/jev-probe.js
// Reads OPENROUTER_API_KEY (and optionally JEV_MODEL) from Server/.env.
// Jev is not a chat model - it answers typed Noul/Choice/Score questions
// about a "state", so this uses OpenRouter's dedicated /api/alpha/decisions
// endpoint, not the OpenAI-compatible chat completions endpoint.
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

const key = process.env.OPENROUTER_API_KEY;
const model = process.env.JEV_MODEL || 'typesafe/jev-1.13';
if (!key) { console.error('OPENROUTER_API_KEY fehlt in Server/.env.'); process.exit(1); }

async function decide(label, state, questions) {
  console.log('\n=== ' + label + ' ===');
  const res = await fetch('https://openrouter.ai/api/alpha/decisions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, state, questions })
  });
  const text = await res.text();
  console.log('HTTP ' + res.status);
  console.log(text);
}

async function main() {
  // A NEXO-flavoured example: given a spoken command, let Jev classify the
  // intent (choice) and flag whether it needs confirmation (noul) - the kind
  // of narrow, fast decision it's meant for (see Schritt 031/035).
  await decide('Intent-Klassifizierung eines NEXO-Sprachauftrags',
    'Öffne Firefox und suche nach Katzenvideos.',
    {
      intent: {
        type: 'choice',
        instructions: 'Welche Absicht hat der Nutzer?',
        criteria: { open_app: 'Ein Programm öffnen', search: 'Etwas im Web suchen', other: 'Etwas anderes' }
      },
      needs_confirmation: {
        type: 'noul',
        instructions: 'Ist das eine folgenreiche Aktion (Kauf, Installation, Systemeinstellung)?',
        criteria: { true: 'Kauf, Installation oder Systemeinstellung', false: 'Alles andere' }
      }
    });
}

main().catch(err => { console.error(err); process.exit(1); });
