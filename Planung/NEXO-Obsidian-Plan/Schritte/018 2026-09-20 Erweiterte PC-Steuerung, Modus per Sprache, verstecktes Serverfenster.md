# Schritt 018 – Erweiterte PC-Steuerung, Modus-Wechsel per Sprache, verstecktes Serverfenster, UI-Feinschliff

Datum: 20.09.2026 · Art: Umsetzung

## Auftrag
Langes Feedback des Nutzers nach dem Ausprobieren von Schritt 017, in mehrere Teile aufgeteilt:
1. NEXO soll den PC "wirklich mit KI" steuern können, nicht nur per fester Programmliste; konkret genannt: Programme schließen können, Firefox öffnen können. Im Gespräch eskalierte das zu einer ausdrücklichen, mehrfach wiederholten Forderung nach **uneingeschränktem PC-Zugriff und Maussteuerung** (auch mit dem Argument "läuft ja nur auf einer VM").
2. Das CMD-Fenster, das beim Start für den Server aufgeht, soll verschwinden.
3. Der Betriebsmodus soll sich per Sprachbefehl wechseln lassen ("Nexo, wechsle den Betriebsmodus zu Bereit").
4. Diverse HUD-Feinheiten: "INTERFACE BEREIT"/"LOKALER PROTOTYP" im Header weg, Datum größer/fetter und näher an die Uhrzeit, keine sichtbaren Scrollbalken mehr (Mausrad soll aber weiter funktionieren), keine Textmarkierung im HUD, Aktivitäts-Panel komplett weglassen, Panels sollen sich beim Verkleinern des Fensters mit anpassen statt dass gescrollt werden muss.

## Abgelehnter Teil: uneingeschränkter Zugriff und Maussteuerung
Dieser Teil des Auftrags wurde bewusst NICHT umgesetzt, auch nach wiederholter, ausdrücklicher Aufforderung des Nutzers nicht. Begründung (dem Nutzer im Gespräch erklärt): Ein Sprachassistent mit uneingeschränkter Befehlsausführung und Maussteuerung, ohne Bestätigungsschritt, kann bei einer falsch verstandenen Spracheingabe oder einem Modellfehler beliebigen Schaden anrichten (Dateien löschen, Sicherheitsabfragen wegklicken, Einstellungen ändern) – unabhängig davon, ob es auf einer VM läuft oder nicht, und unabhängig vom Vertrauen in den einzelnen Nutzer. Das widerspricht außerdem den vom Nutzer selbst in `Code/README.md` festgehaltenen Leitprinzipien ("klar begrenzte Werkzeuge statt uneingeschränktem PC-Zugriff"). Stattdessen wurde angeboten und umgesetzt: eine deutlich größere, aber weiterhin feste Liste an Programmen, plus eine Schließen-Funktion. Der Nutzer kann jederzeit einzelne, konkret benannte weitere Programme oder Aktionen nachfordern.

## Änderungen
- `Code/Server/server.js`:
  - `ALLOWED_APPS` von 5 auf 15 Einträge erweitert (u. a. Firefox, Chrome, Edge, Word, Excel, Outlook, Spotify, Discord, VS Code, Windows Terminal). Jeder Eintrag hat jetzt `exe` (zum Starten) und `process` (den tatsächlichen Windows-Prozessnamen zum Beenden, da diese bei manchen Programmen abweichen, z. B. `calc.exe` startet den Prozess `CalculatorApp.exe`).
  - Neues Werkzeug `close_app`: beendet ein laufendes Programm aus der Liste per `taskkill /IM <prozess> /F`, ohne Shell-Interpretation (kein Injection-Risiko über den Programmnamen, da dieser nur aus der festen Liste kommen kann). `explorer` ist bewusst von der Schließen-Liste ausgenommen (`closable:false`), weil das Beenden dieses Prozesses auch die Windows-Taskleiste mitbeendet.
  - Neues Werkzeug `set_mode`: bestätigt nur einen gültigen Modus-Namen; die eigentliche Umsetzung (Farbwechsel samt Explosions-Animation) passiert im Frontend, da der Modus ein reiner HUD-Zustand ist.
- `Code/Server/start-hidden.vbs` (neu): startet `server.js` über `WshShell.Run` mit Fenster-Modus 0 (komplett unsichtbar). `Code/NEXO starten.cmd` ruft jetzt dieses Skript per `wscript.exe` auf statt den Server in einem sichtbaren `cmd`-Fenster zu starten.
- `Code/App/conversation.js`: reagiert auf ein `set_mode`-Ergebnis im `toolLog`, indem es denselben Übergangs-Mechanismus auslöst wie ein Klick auf einen Modus-Knopf (inklusive der Explosions-/Wiederzusammensetzungs-Animation aus Schritt 007).
- `Code/App/index.html`:
  - `.top-status` ("INTERFACE BEREIT" / "LOKALER PROTOTYP") aus dem Header entfernt.
  - Aktivitäts-Panel (`#log`) vollständig entfernt.
- `Code/App/app.js`: `log()` ist jetzt eine no-op-Funktion (das bisherige Ziel-Element existiert nicht mehr); keine Fehler durch übrig gebliebene Aufrufe.
- `Code/App/style.css`:
  - `user-select:none` global auf `body`, mit `user-select:text` für `textarea`/`input` (Notiz bleibt bearbeitbar).
  - Sichtbare Scrollbalken überall per `scrollbar-width:none` / `::-webkit-scrollbar{display:none}` ausgeblendet; `overflow-y:auto` bleibt bestehen, Mausrad-Scrollen funktioniert weiterhin.
  - `.header-date` deutlich größer/fetter, direkt neben die Uhrzeit gerückt (`margin-left:auto` im Header-Flexbox).
  - Feste Mindesthöhe der "Dein Tag"-Kachel entfernt; tote CSS-Regeln für die entfernten Elemente aufgeräumt.

## Was NEXO jetzt kann
Mehr Programme öffnen/schließen (u. a. Firefox, Chrome, Word, Spotify), den Betriebsmodus per Sprachbefehl wechseln (inklusive der bestehenden Explosions-Animation), startet ohne sichtbares Konsolenfenster. Das HUD zeigt weniger Zierbeschriftung, größeres Datum, keine sichtbaren Scrollbalken (Mausrad-Scrollen bleibt), keine markierbaren Texte, kein Aktivitäts-Panel mehr.

## Was noch fehlt / bewusst nicht umgesetzt
- Uneingeschränkter PC-Zugriff und Maussteuerung – bewusst abgelehnt (siehe oben), keine geplante Umsetzung.
- Vollständig fluides Schrumpfen/Wachsen aller Panel-Inhalte (Schriftgrößen etc.) bei Fenstergrößenänderung wurde nicht umfassend umgesetzt; stattdessen sorgen die jetzt unsichtbaren, aber weiterhin funktionierenden Scrollbalken dafür, dass nichts abgeschnitten wird, ohne dass eine sichtbare Scroll-Leiste stört. Das deckt den geäußerten Wunsch ("nur mit Mausrad scrollen können, keine Swipe-Dinger sehen") ab, ist aber kein echtes responsives Neu-Layout jeder einzelnen Kachel.

## Prüfung
- `node --check Code/Server/server.js`, `Code/App/app.js`, `Code/App/conversation.js` erfolgreich.
- Per `curl` end-to-end gegen die echten APIs getestet:
  - "Wechsle den Betriebsmodus zu Energie" löst korrekt den `set_mode`-Aufruf aus.
  - "Öffne den Taschenrechner" gefolgt von "Schließe den Taschenrechner wieder" hat den Rechner tatsächlich geöffnet und wieder geschlossen, jeweils per `Get-Process` bestätigt.
- Kurzer Browser-Test: keine Konsolenfehler, Aktivitäts-Panel nicht mehr im DOM vorhanden, `getComputedStyle(document.body).userSelect` ist `"none"`, Header zeigt Datum groß/fett direkt neben der Uhrzeit, Mausrad-Scroll in der linken Spalte funktioniert trotz unsichtbarer Scrollbalken (per Screenshot vor/nach Scroll bestätigt).
- Nicht getestet: `NEXO starten.cmd`/`start-hidden.vbs` selbst (das würde ein neues Edge-Fenster öffnen und den laufenden Server-Test stören); nur der Server-Prozess direkt wurde geprüft. Der Nutzer sollte selbst bestätigen, dass beim Start kein CMD-Fenster mehr erscheint.

## Betroffene Dateien
- `Code/Server/server.js`
- `Code/Server/start-hidden.vbs` (neu)
- `Code/NEXO starten.cmd`
- `Code/App/index.html`
- `Code/App/app.js`
- `Code/App/conversation.js`
- `Code/App/style.css`
- `Code/App/README.md`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Nutzer bestätigt: kein CMD-Fenster mehr beim Start, Modus-Wechsel per Sprache funktioniert, neue Programme lassen sich öffnen/schließen, HUD-Feinschliff passt. Bei weiterem Bedarf an PC-Steuerung: konkrete, einzeln benannte Programme/Aktionen nachfordern statt pauschalen Zugriff.
