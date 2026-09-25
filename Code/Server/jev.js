'use strict';
// Thin client for TypeSafe's "Jev" decision model via OpenRouter's Decisions
// API. Used to pick the right element when click_by_name matches more than
// one control with the same/similar name - a narrow Choice question over a
// known, closed set of candidates, exactly what Jev is built for (see
// Planung/.../031 and /035). Not a general chat/vision model: it only
// answers typed Choice/Score/Noul questions about a given state.
async function chooseCandidate({ env = process.env, fetchImpl = fetch } = {}, { state, question, options }, signal) {
  const key = env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OpenRouter-Key (Jev) fehlt in Server/.env.');
  const model = env.JEV_MODEL || 'typesafe/jev-1.13';
  const criteria = Object.fromEntries(options.map(name => [name, null]));
  const timeout = AbortSignal.timeout(10000);
  const res = await fetchImpl('https://openrouter.ai/api/alpha/decisions', {
    method: 'POST', signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, state, questions: { pick: { type: 'choice', instructions: question, criteria } } })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error('Jev (' + res.status + '): ' + (data?.error?.message || 'nicht erreichbar.'));
  const answer = data?.answers?.pick;
  if (!answer?.choice || !options.includes(answer.choice)) throw new Error('Jev hat keine gültige Auswahl geliefert.');
  return { choice: answer.choice, confidence: answer.confidence };
}
module.exports = { chooseCandidate };
