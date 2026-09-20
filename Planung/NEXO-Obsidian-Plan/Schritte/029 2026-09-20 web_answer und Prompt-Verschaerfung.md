# Schritt 029 – web_answer und Prompt-Verschärfung

Stand: 20.09.2026

Ausgangspunkt: [[028 2026-09-20 Live-API Phase A und B]]

## Auftrag

Nutzer meldete nach Schritt 028 deutlich und zurecht: Phase A/B (Server-Vorarbeit für die Live-API) hatte keinen spürbaren Effekt, Programme öffnen sich weiterhin per sichtbarem Mausklick statt `launch_app`, es öffnen sich weiterhin ungefragte Zusatzprogramme (Outlook, Windows-Sicherheit), und die Frage "sag mir die neuesten News" öffnete einen Browser-Tab statt einfach zu antworten. Fokus dieses Schritts: sofort spürbare Verbesserungen statt weiterer unsichtbarer Architekturarbeit.

## Root Cause "News öffnet einen Tab"

Es gab schlicht kein Werkzeug, das eine Info-/Wissensfrage per Websuche beantwortet und die Antwort nur ausspricht – `search_web` (Schritt 027) öffnet immer sichtbar einen Browser-Tab, das ist alles was es kann. Für "was ist X", "wie ist das Wetter", "was gibt es Neues" fehlte ein Äquivalent zu Karens `_gemini_search()` (siehe Schritt 027-Analyse): ein eigener, nicht-interaktiver Gemini-Aufruf mit Googles eingebautem `google_search`-Grounding, dessen Textantwort dann als Werkzeugergebnis zurück in die Hauptunterhaltung fließt.

## Änderungen

- **`web_answer`** (neu, `agent.js`): eigenständiger `generateContent`-Aufruf mit `tools: [{google_search: {}}]` (kann nicht mit eigenen Werkzeugdefinitionen in derselben Anfrage gemischt werden, daher ein separater Aufruf, nicht Teil der normalen Werkzeugschleife). Liefert eine kurze, aktuelle Textantwort zurück, öffnet nichts. Live gegen die echte API getestet: liefert echte, aktuelle Nachrichten.
- `web_answer` ist – anders als die Desktop-Werkzeuge – immer verfügbar, auch ohne aktivierte PC-Steuerung (wie `set_mode`), da es den PC gar nicht anfasst. In `agent.js` UND `live.js` (für die künftige Phase C) an derselben Stelle ergänzt.
- Systemprompt verschärft (`agent.js`):
  - App-Öffnen ist jetzt ausdrücklich NUR über `launch_app` erlaubt, ein Klick auf Taskleisten-/Desktop-Symbol oder Startmenü-Kachel ist ausdrücklich verboten.
  - "Kein zusätzliches Programm ohne ausdrücklichen Auftrag" ist schärfer formuliert ("jedes zusätzlich geöffnete Programm ist ein Fehler").
  - `web_answer` vs. `search_web` klar getrennt beschrieben, mit der Regel "im Zweifel web_answer".
- In beiden Server-Dispatchern (HTTP `/api/chat` und dem noch nicht angebundenen `/ws/voice`) verdrahtet.

## Ehrliche Einordnung

Die Prompt-Verschärfungen senken das Risiko von Mausklick-statt-launch_app und ungefragten Zusatzprogrammen, garantieren es aber nicht vollständig – das bleibt eine Modell-Entscheidung pro Anfrage, keine harte Code-Regel (eine harte technische Sperre für "keine Klicks beim App-Öffnen" ist mit dem aktuellen generischen, KI-gesteuerten Ansatz nicht sauber möglich, ohne wieder feste App-Listen einzuführen, die der Nutzer in Schritt 020 bewusst abgelehnt hat). Das eigentliche Geschwindigkeitsproblem bleibt ungelöst, bis Phase C (Live-API im Browser) steht.

## Prüfung

- 54 Regressionstests erfolgreich (3 neu: `web_answer` bleibt ohne PC-Steuerung verfügbar, `answerWithSearch`-Anfrageform, Server-Dispatcher-Weiterleitung ohne Desktop-Aufrufe).
- `web_answer` live gegen die echte Gemini-API getestet (echte, aktuelle Antwort, kein geöffnetes Fenster).
- Kein echter Test der Prompt-Verschärfungen (Mausklick-Vermeidung, keine Zusatzprogramme) auf dem echten PC – das kann nur der Nutzer im echten Gebrauch beurteilen.

## Nächster Schritt

Phase C des Live-API-Umbaus (Plan: `C:\Users\levin\.claude\plans\vectorized-purring-swing.md`) – Browser-Mikrofon-Dauerstream und Wiedergabe, der eigentliche Geschwindigkeits- und Zuverlässigkeitshebel.
