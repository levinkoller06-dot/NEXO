# Schritt 016 – UI aufgeräumt, Mund-Testknopf entfernt, Mikrofon rot bei Stummschaltung

Datum: 20.09.2026 · Art: Umsetzung

## Auftrag
Nutzer meldete nach dem ersten erfolgreichen Sprachgespräch mehrere kleine UI-Wünsche:
1. Keinen separaten Knopf mehr für die Mundbewegung – der Mund soll sich nur bewegen, wenn NEXO tatsächlich etwas sagt.
2. Der Mikrofon-Knopf soll rot werden, wenn das Mikrofon stummgeschaltet ist.
3. Mehrere kleine Zierbeschriftungen im HUD entfernen: Untertitel unter dem NEXO-Logo, "NEURAL VISUALIZATION" über dem Gesicht, "NX-001 / VISUAL CORE / Punktzahl", "AVATAR ONLINE", "POINTER TRACKING", "NO CAMERA".
4. Die große Kachel "Dein Interface. Dein Universum. [Datum]" entfernen, aber das Datum behalten und stattdessen neben die Uhrzeit im Header setzen.
5. (Zusätzlich, nicht in diesem Schritt umgesetzt) Die KI soll Aktionen auf dem Computer ausführen können, z. B. Apps öffnen oder im Browser suchen – siehe eigener Abschnitt in `STATUS.md`, dafür wurden Rückfragen gestellt statt sofort umzusetzen, da das sicherheitsrelevant ist und laut den Projekt-Leitprinzipien klar abgegrenzte Werkzeuge statt uneingeschränktem PC-Zugriff braucht.

## Änderungen
- `Code/App/index.html`:
  - `<span>PERSONAL INTELLIGENCE SYSTEM</span>` unter dem Logo entfernt.
  - Die ganze `.welcome`-Kachel entfernt; `#date` existiert weiterhin, jetzt aber als eigenes Element im Header, links von `<time id="clock">`.
  - `<span class="eyebrow">NEURAL VISUALIZATION</span>` über dem Gesicht entfernt.
  - `.left-coord` (NX-001/VISUAL CORE/Punktzahl) und `.right-coord` (AVATAR ONLINE/POINTER TRACKING/NO CAMERA) vollständig entfernt.
  - Den `#speak`-Knopf (Mundanimation ohne Audio testen) entfernt.
- `Code/App/app.js`: den Klick-Handler für `#speak` entfernt; die Zeile, die die Punktzahl in `#point-count` schreibt, entfernt (Element existiert nicht mehr). Die Variable `speaking` bleibt bestehen und wird jetzt ausschließlich von `conversation.js` während echter Sprachausgabe gesetzt.
- `Code/App/conversation.js`: neue Hilfsfunktion `updateMicVisual()` setzt am Mikrofon-Knopf konsistent die Klassen `active`/`muted` und das passende `aria-label`; wird beim Laden, bei jedem Klick und beim Fehlerfall (Zugriff verweigert) aufgerufen.
- `Code/App/style.css`:
  - Neue Klasse `.voice.muted` (rot: Rahmen, Icon-Farbe, Hintergrund, Leuchten) für den stummgeschalteten Zustand.
  - CSS für die entfernten Elemente aufgeräumt (`.coordinate`, `.left-coord`, `.right-coord`, `.brand span`, doppelte `#talk.active`-Regel).
  - Neue `.header-date`-Klasse für die Datumsanzeige im Header.

## Was NEXO jetzt kann
Das HUD zeigt weniger technische Zierbeschriftungen, das Datum steht im Header neben der Uhr. Der Mikrofon-Knopf ist rot, solange nicht zugehört wird, und wechselt beim Aktivieren in die aktuelle Modusfarbe. Der Mund bewegt sich nur noch während echter Sprachausgabe, es gibt keinen Testknopf dafür mehr.

## Was noch fehlt
Die von Nutzer gewünschte PC-Steuerung (Apps öffnen, Browser-Suche) ist nicht umgesetzt. Dazu wurden Rückfragen gestellt (welche Aktionen genau erlaubt sein sollen, wie Bestätigungen für kritische Aktionen aussehen sollen), Antwort des Nutzers stand bei Sitzungsende noch aus.

## Prüfung
- `node --check Code/App/app.js` und `Code/App/conversation.js` erfolgreich; CSS-Klammern ausgeglichen (103 öffnende, 103 schließende).
- Kurzer, gezielter Browser-Test (Server gestartet, per curl erreichbar gemacht): keine Konsolenfehler. Per JavaScript direkt geprüft: `#speak` existiert nicht mehr, `.coordinate`-Elemente existieren nicht mehr, der Mikrofon-Knopf startet mit der Klasse `voice muted` und passendem `aria-label`, das Datum erscheint korrekt im Header ("Sonntag, 20. September"), das Logo zeigt nur noch "NEXO".
- Screenshot-Kontrolle in der Großansicht bestätigt: roter Mikrofon-Knopf gut sichtbar zwischen den beiden anderen Knöpfen, keine der entfernten Beschriftungen mehr sichtbar.
- Klick auf den Mikrofon-Knopf in der Test-Sandbox (kein echtes Mikrofon vorhanden) hat den erwarteten "Zugriff verweigert"-Fehlerpfad ausgelöst; der Knopf kehrte sauber in den roten Zustand zurück statt hängen zu bleiben. Kein Test mit echtem Mikrofon-Zugriff/echter Aktivierung des grünen bzw. modusfarbenen Zustands.

## Betroffene Dateien
- `Code/App/index.html`
- `Code/App/app.js`
- `Code/App/conversation.js`
- `Code/App/style.css`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Nutzer bestätigt die Änderungen im echten Browser. Danach: gemeinsam abgrenzen, welche PC-Steuerungs-Fähigkeiten NEXO bekommen soll (Werkzeug-Liste, Bestätigungspflicht für kritische Aktionen), bevor das umgesetzt wird.
