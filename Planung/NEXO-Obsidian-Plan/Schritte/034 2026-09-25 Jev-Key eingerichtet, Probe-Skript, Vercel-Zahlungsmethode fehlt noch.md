# Schritt 034 – Jev-Key eingerichtet, Probe-Skript, Vercel-Zahlungsmethode fehlt noch

Stand: 25.09.2026

Ausgangspunkt: [[033 2026-09-25 Sensible Aktionen per Sprache statt HUD-Freigabe bestaetigen]]

## Auftrag

Nutzer hat einen TypeSafe-Zugang bekommen und einen Key geliefert, mit der Anweisung, ihn per `AI_GATEWAY_API_KEY` zu laden. Auftrag: Key einbauen, Jev als Modell auswählen, und eine kleine Probe-App zum Ausprobieren bereitstellen.

## Wichtiger Fund: Der Key ist kein direkter TypeSafe-Key

Der gelieferte Key (Präfix `vck_...`) und der genannte Umgebungsvariablenname `AI_GATEWAY_API_KEY` gehören zu **Vercel AI Gateway**, nicht zur in Schritt 031 recherchierten direkten TypeSafe-API (`api.typesafe.ai`, `TYPESAFE_API_KEY`). TypeSafe scheint Jev inzwischen zusätzlich über Vercel AI Gateway anzubieten: im Modellverzeichnis (vercel.com/ai-gateway/models, Suche "jev") gelistet als **`typesafe-ai/jev`**, aktuell als "Free" markiert. Der Zugriff läuft über Vercels OpenAI-kompatible Chat-Completions-Schnittstelle: `POST https://ai-gateway.vercel.sh/v1/chat/completions`, `Authorization: Bearer $AI_GATEWAY_API_KEY`, `model: "typesafe-ai/jev"`.

## Änderungen

- **`Server/.env`** (nicht committet): `AI_GATEWAY_API_KEY` und `JEV_MODEL=typesafe-ai/jev` ergänzt.
- **`Server/.env.example`**: neue Variablen dokumentiert (ohne Wert).
- **`Server/jev-probe.js`** (neu): eigenständiges Skript, unabhängig vom Hauptserver, zum Ausprobieren. Zwei Testaufrufe: (1) einfacher Chat-Prompt, um die Basis-Antwort zu sehen (Jev ist kein Chat-Modell, interessant ist, was der Gateway daraus macht); (2) ein Aufruf mit `state`/`questions` als zusätzliche Felder neben `messages`, um zu prüfen, ob Jevs echtes API-Format (Choice/Score/Noul aus Schritt 031) durch den OpenAI-kompatiblen Gateway-Layer hindurch erhalten bleibt oder verloren geht. Aufruf: `node Server/jev-probe.js`.

## Ergebnis des Probe-Laufs

Beide Testaufrufe scheiterten mit **HTTP 403 `customer_verification_required`**: "AI Gateway requires a valid credit card on file to service requests." Der Key selbst ist gültig (kein 401), aber Vercel verlangt eine hinterlegte Zahlungsmethode im Account, bevor überhaupt Anfragen – auch zu als "Free" markierten Modellen wie Jev – durchgelassen werden. Das kann nur der Nutzer selbst im Vercel-Dashboard erledigen (Kreditkarte hinterlegen); das gehört zu den Aktionen, die ich nicht für ihn ausführen darf.

## Fehlt noch

- Nutzer muss im Vercel-Dashboard eine Zahlungsmethode hinterlegen (Link kam direkt aus der Fehlerantwort der echten API, kein geratener Link).
- Danach `node Server/jev-probe.js` erneut laufen lassen, um zu sehen, ob (a) der einfache Chat-Prompt überhaupt eine sinnvolle Antwort liefert und (b) ob das `state`/`questions`-Format durchgereicht wird oder der Gateway es verwirft/ignoriert. Erst danach lässt sich die in Schritt 031 geplante Architektur (Jev für Klick-/Navigationsentscheidungen) seriös in `desktop.js`/`agent.js` einbauen – ohne zu wissen, welches Antwortformat tatsächlich zurückkommt, wäre das Rätselraten.

## Betroffene Dateien

`Code/Server/.env` (lokal, nicht committet), `Code/Server/.env.example`, `Code/Server/jev-probe.js` (neu).

## Nächster Schritt

Sobald die Vercel-Zahlungsmethode hinterlegt ist: Probe erneut laufen lassen, Antwortformat auswerten, dann erst die eigentliche Jev-Integration (UI-Automation-/DOM-Kandidatensammler + Klick-Entscheidung) bauen.
