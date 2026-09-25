# Schritt 032 – Denkbudget nur bei Klickbedarf, engere Bestätigungspflicht, TTS-Retry

Stand: 25.09.2026

Ausgangspunkt: [[031 2026-09-25 Jev-Architektur, Fokus-Fix bestaetigt, naechste Schritte]]

## Auftrag

Erster echter Testdurchlauf des Nutzers (Checkliste aus Schritt 031) ergab: Sprachausgabe funktioniert, ist aber "sehr slow und manchmal kommt ein Fehler"; außerdem kommt beim Schließen von Programmen eine Bestätigungsabfrage, die der Nutzer dort nicht will. Ziel: beides beheben, ohne die bestehende Architektur (ein Audiopaket pro Antwort, KI-gesteuerte Risikoeinstufung statt fester App-Listen) über den Haufen zu werfen.

## Root Causes

- **Langsamkeit:** `controlEnabled` (für die aktive Sitzung praktisch immer wahr, PC-Steuerung ist automatisch an) schaltete in `agent.js` das Gemini-Denkbudget für die GESAMTE Anfrage auf `-1` (dynamisches, unbegrenztes Denken) – auch für reinen Small-Talk ohne jede Bildschirmaktion. Das kostete spürbar Zeit bei jeder einzelnen Antwort, nicht nur bei echten Klick-Entscheidungen.
- **Gelegentlicher Fehler bei Sprachausgabe:** `synthesizeSpeech` hatte keinerlei Retry. Ein einzelner transienter Fehler bei Google (429/5xx) führte sofort zu einem sichtbaren Fehler statt eines zweiten Versuchs.
- **Ungewollte Bestätigung beim Schließen:** `desktop.js` erzwang für die Tasten `DELETE` und `ALT+F4` hart im Code `risk=sensitive`, unabhängig von der Einschätzung des Modells. Zusätzlich verlangte der Systemprompt Bestätigung auch bei Löschen/Überschreiben, Absenden von Nachrichten/Formularen, Uploads und Kontoänderungen.

## Änderungen

- **`agent.js`:** Neues `DELIBERATE_TOOLS`-Set (`computer_observe`, `computer_action`, `click_by_name`, `focus_window`). Jeder `run()`-Durchlauf startet mit `thinkingBudget: 0`; erst sobald in einer Runde tatsächlich eines dieser Werkzeuge aufgerufen wurde, schaltet die nächste Runde auf `-1` um (`deliberate`-Flag pro Lauf, nicht mehr direkt an `controlEnabled` gekoppelt). Reine Unterhaltung und deterministische Werkzeuge (`launch_app`, `set_mode`, `web_answer`) bleiben dadurch durchgehend schnell.
- **`agent.js` – `synthesizeSpeech`:** Bis zu zwei automatische Wiederholungen (300ms/800ms Backoff, konfigurierbar über `retryDelays`) bei transienten HTTP-Status (429/500/502/503/504), bevor ein Fehler nach oben gereicht wird. Dauerhafte Fehler (z.B. 400) werden weiterhin sofort gemeldet.
- **`agent.js` – Systemprompt:** `risk=sensitive` jetzt ausdrücklich NUR NOCH für Käufe/Zahlungen/Bestellungen, Installationen und Systemeinstellungen (inkl. Sicherheits-/Antivirus-Software). Alles andere – Löschen, Schließen von Programmen, Absenden von Nachrichten/Formularen, Uploads – ist jetzt `risk=routine`. Das ist eine bewusste Nutzerentscheidung (mehrfach im Gespräch bestätigt), kein technischer Zufall.
- **`desktop.js`:** Die harte Code-Erzwingung von `risk=sensitive` bei `DELETE`/`ALT+F4` in `validateAction` entfernt. Diese Tasten laufen jetzt wie jede andere Taste – Risikoeinstufung kommt vom Modell entsprechand des neuen Prompts.

## Ehrliche Einordnung

- Die Bestätigungsabfrage ist jetzt ausdrücklich kein technisches Sicherheitsnetz mehr für Löschen/Schließen/Absenden – das ist Absicht, keine Lücke, die versehentlich entstanden ist. Eine falsche Risikoeinstufung durch das Modell in den verbleibenden drei Kategorien (Käufe, Installationen, Systemeinstellungen) bleibt weiterhin möglich; das war auch vorher schon nur eine Modell-Entscheidung, keine harte Garantie.
- Der Denkbudget-Fix hilft nur, wenn eine Anfrage NICHT sofort ein Bildschirm-/Klick-Werkzeug braucht. Eine Anfrage, die von Anfang an weiß, dass sie klicken muss, bekommt weiterhin volles Denken – nur eben erst ab der Runde, die tatsächlich einen Screenshot/eine Klick-Entscheidung verarbeitet, nicht schon bei der ersten (meist `computer_observe`-)Runde.
- Der TTS-Retry behebt nur transiente Fehler. Ein dauerhaft falsch konfigurierter Key oder ein echtes Kontingentproblem bleibt ein sichtbarer Fehler, wie es sein soll.

## Prüfung

- `node --test Code/Tests/*.test.js`: 63 Tests erfolgreich (2 angepasst: die beiden Sensitive-Approval-Tests nutzen jetzt `risk: 'sensitive'` explizit statt sich auf die entfernte Alt+F4/Delete-Automatik zu verlassen; der Denkbudget-Test prüft jetzt Runde-für-Runde-Eskalation statt eines pauschalen controlEnabled-Schalters; 2 neu: `ALT+F4 und DELETE no longer force sensitive risk`, `synthesizeSpeech retries a transient failure once and still returns audio`).
- Kein echter Test gegen die echte Gemini-API in diesem Schritt (reine Logikänderung, kein neues API-Verhalten).
- Ob sich die Antwortgeschwindigkeit im echten Gebrauch spürbar verbessert, kann nur der Nutzer im echten HUD beurteilen.

## Betroffene Dateien

`Code/Server/agent.js`, `Code/Server/desktop.js`, `Code/Tests/regression.test.js`, `Code/Tests/speech-launch.test.js`, `Code/STATUS.md`, `Code/AGENTS.md`.

## Nächster Schritt

Im echten Gebrauch prüfen: spürbar schnellere Antworten bei einfachen Anfragen, keine Bestätigung mehr beim Schließen/Löschen, Sprachausgabe-Fehler seltener. Danach weiter mit der Testumgebung (Schritt 031) bzw. Phase C des Live-API-Umbaus.
