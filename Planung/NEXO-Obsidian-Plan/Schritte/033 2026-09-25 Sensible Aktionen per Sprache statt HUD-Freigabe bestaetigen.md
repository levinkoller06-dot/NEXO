# Schritt 033 – Sensible Aktionen per Sprache statt HUD-Freigabe bestätigen

Stand: 25.09.2026

Ausgangspunkt: [[032 2026-09-25 Denkbudget nur bei Klickbedarf, engere Bestaetigungspflicht, TTS-Retry]]

## Auftrag

Nutzer meldete nach Schritt 032: Bei den verbliebenen sensiblen Aktionen (Installation, Systemeinstellungen/Antivirus) funktioniert Ablehnen im HUD-Bestätigungsfenster, aber Annehmen führt in eine Endlosschleife – NEXO fragt immer wieder dieselbe Bestätigung an. Nutzerwunsch: die Bestätigung nicht mehr über ein HUD-Popup lösen, sondern NEXO soll direkt in der gesprochenen Antwort nachfragen ("Soll ich X tun? Ja oder nein?") und die Antwort per normaler Spracheingabe entgegennehmen – ausdrücklich ohne Anspruch auf dieselbe technische Absicherung wie vorher ("mir scheißegal, wie sicher das ist").

## Root Cause der Endlosschleife

Die alte Freigabe-Logik in `desktop.js` (`action()`) blockierte eine sensitive Aktion, zeigte sie im HUD an, und erwartete nach Zustimmung, dass das Modell **erneut beobachtet und dieselbe Aktion mit identischen Parametern (nur neue frameId)** anfordert – ein SHA-256-„Signatur“-Vergleich über `{title, ...intent}` entschied, ob der zweite Aufruf durchgelassen wird. Sobald sich zwischen den beiden Aufrufen irgendetwas unterschied – eine vom Modell (jetzt mit vollem Denkbudget, siehe Schritt 032) leicht abweichend gewählte Koordinate, ein anderer Fenstertitel nach dem Refresh, ein anders formulierter `reason` wäre unschädlich, aber x/y/key/text nicht – griff die Signatur nicht mehr, und die Aktion landete erneut in der Freigabe-Warteschlange. Das konnte sich beliebig oft wiederholen. Das war ein latenter Konstruktionsfehler, kein Einzelfall.

## Änderungen

- **`desktop.js`:** Die gesamte code-seitige Freigabe-Logik in `action()` entfernt (Signatur-Vergleich, `pending`-Objekt, `permit`, 90-Sekunden-Timeout, `answerApproval()`). Eine Aktion mit `risk=sensitive` läuft jetzt technisch genauso wie `risk=routine` – sofort. `status()` liefert kein `approval`-Feld mehr.
- **`agent.js` – Systemprompt:** Neue Anweisung: Für `risk=sensitive` fragt das Modell VOR dem Werkzeugaufruf ausdrücklich in seiner (gesprochenen) Antwort nach Zustimmung und ruft dafür noch kein Werkzeug auf. Erst wenn die nächste Nutzernachricht eine klare Zustimmung ist, folgt der eigentliche Aufruf. Das ist reine Prompt-Disziplin – kein Code erzwingt das mehr.
- **`server.js`:** Route `/api/approve` entfernt (totes Ziel ohne `desktop.answerApproval`).
- **Frontend (`App/index.html`, `App/style.css`, `App/conversation.js`):** Das gesamte Freigabe-Dialogfenster (Bild-Vorschau, Annehmen/Ablehnen-Knöpfe) inkl. Polling-Logik und CSS entfernt – es gibt keine sichtbare HUD-Bestätigung mehr.

## Ehrliche Einordnung

- Das ist eine bewusste Sicherheits-Abschwächung, kein Versehen: Ob die sensible Aktion wirklich erst nach Zustimmung ausgeführt wird, hängt jetzt vollständig davon ab, ob das Modell der Prompt-Anweisung folgt – es gibt keine technische Sperre mehr im Code, die ein Überspringen der Nachfrage verhindert. Der Nutzer hat das ausdrücklich so gewollt.
- Reduziert auf drei Kategorien (Käufe, Installationen, Systemeinstellungen) ist das Risiko einer übersprungenen Nachfrage überschaubarer als früher, aber nicht null.
- Kein echter Test der neuen Sprach-Nachfrage gegen die echte Gemini-API in diesem Schritt (reine Prompt-/Code-Änderung); ob das Modell die Nachfrage im echten Gespräch zuverlässig stellt und die Zustimmung korrekt erkennt, kann nur der Nutzer im echten Gebrauch beurteilen.

## Prüfung

- `node --test Code/Tests/*.test.js`: 61 Tests erfolgreich (die beiden alten Freigabe-Flow-Tests durch einen einzigen Test ersetzt, der bestätigt, dass `risk=sensitive` und `risk=routine` jetzt gleich behandelt werden und `status().approval` nicht mehr existiert).

## Betroffene Dateien

`Code/Server/desktop.js`, `Code/Server/agent.js`, `Code/Server/server.js`, `Code/App/index.html`, `Code/App/style.css`, `Code/App/conversation.js`, `Code/App/README.md`, `Code/Tests/regression.test.js`, `Code/STATUS.md`, `Code/AGENTS.md`.

## Nächster Schritt

Im echten Gebrauch eine sensible Aktion auslösen (z.B. "installier mir VLC") und prüfen: fragt NEXO verständlich per Sprache nach, wird "ja" korrekt als Zustimmung erkannt, bricht "nein" sauber ab? Danach: Testumgebung (Schritt 031) bzw. Phase C des Live-API-Umbaus.
