# Schritt 037 – Phase C: Live-API im Browser, Erfolgs-Ehrlichkeit, click_by_name-Pflicht

Stand: 25.09.2026

Ausgangspunkt: [[036 2026-09-25 Jev-Entscheidungs-Anzeige im HUD]]

## Auftrag

Nutzer meldete nach echtem Gebrauch drei konkrete Probleme, deutlich und zurecht verärgert:
1. NEXO behauptete, eine Spotify-Wiedergabe laufe, obwohl keine Musik zu hören war – eine falsche Erfolgsbehauptung.
2. Unterbrechen während der Sprachausgabe per Mikrofon funktioniert nicht; die Sprachausgabe klingt "abgehackt".
3. Beim Klicken in Apps wie Spotify soll nicht mehr die allgemeine bildschirmbasierte Klick-Schleife bemüht werden, wenn ein benanntes Element existiert.

Zusätzlich der Verweis auf das Referenzprojekt "Karen" (`C:\Users\levin\Desktop\RL Projekte\Spider man\karen2.0`), das genau dieses Unterbrechen-Problem bereits gelöst hat.

## Root Causes

- **Falsche Erfolgsbehauptung:** Der Systemprompt verlangte zwar sinngemäß, den Erfolg zu prüfen, aber nicht ausdrücklich genug – nichts verbot dem Modell, aus einem ausgeführten Klick pauschal auf die gewünschte Wirkung zu schließen, ohne das im zurückgegebenen Bild tatsächlich zu verifizieren.
- **Unterbrechen unzuverlässig:** NEXO nutzte bisher eine zweite, client-seitige Browser-Spracherkennung, die während der eigenen Sprachausgabe mithört und bei einem erkannten Satz abbricht (Schritt 027). Das ist prinzipbedingt unzuverlässig (Lautsprecher-Echo, keine eigene Unterdrückung) – schon in Schritt 028 als offenes Risiko dokumentiert. Karens Code (`main.py`, `sc.interrupted`) zeigt die robuste Lösung: die Gemini-**Live-API** selbst erkennt serverseitig per VAD, dass der Nutzer redet, und schickt ein `interrupted`-Ereignis. NEXOs server-seitige Live-Anbindung (`live.js`, seit Schritt 028 fertig) wurde dafür nie an den Browser angebunden – das war die schon lange als "Phase C" dokumentierte, noch offene Lücke.
- **Klick-Schleife statt click_by_name:** Der Prompt erlaubte `click_by_name` nur als Option "wenn per Koordinaten schwer zu treffen", nicht als verpflichtenden ersten Versuch.

## Änderungen

### 1. Phase C: Live-API im Browser (das größte Stück)

- **`App/audio-worklet.js`** (neu): `AudioWorkletProcessor`, rechnet Mikrofon-Samples auf 16kHz/16-bit-PCM herunter, postet ~20ms-Häppchen an den Hauptthread.
- **`App/live-audio-player.js`** (neu): lückenlose Wiedergabe eingehender 24kHz-PCM-Häppchen (jedes startet exakt dort, wo das vorherige endet), Analyser für die Mundanimation (wie `speech-player.js`), `stop()` verwirft bei Unterbrechung sofort alles Geplante und setzt den Zeitplan zurück, damit die nächste Antwort nicht hinter der verworfenen wartet.
- **`App/conversation.js`**: komplett auf `/ws/voice` umgestellt. Mikrofon streamt jetzt durchgehend, sobald es an ist – keine eigene Denkphasen-Stummschaltung, keine zweite Spracherkennung. Eingehende Binärframes gehen an den neuen Player, `interrupted`-Nachrichten stoppen ihn sofort, `transcript`-Nachrichten aktualisieren die Statuszeile live (Untertitel), `mode`/`error`/`status`-Nachrichten wie gehabt. Der alte `SpeechRecognition`/`MediaRecorder`/`SerialQueue`-Pfad und `/api/chat`/`/api/speech` werden vom Browser nicht mehr angesprochen.
- **`App/index.html`**: `conversation-state.js`/`speech-player.js` aus den Skript-Tags entfernt (unbenutzt), `live-audio-player.js` ergänzt.
- `App/conversation-state.js`/`App/speech-player.js` bleiben als Dateien samt Tests bestehen (bewusst nicht gelöscht – das ist Phase D im Plan, ein eigener Schritt).

### 2. Erfolgs-Ehrlichkeit (Systemprompt, `agent.js`)

Neue, harte Regel: NEXO darf nie behaupten, dass etwas läuft/spielt/fertig ist, ohne das im zurückgegebenen Bild tatsächlich zu sehen (z.B. Pause- statt Play-Symbol, Fortschrittsbalken, Bestätigungstext). Ein ausgeführter Klick ist ausdrücklich KEIN Beleg für seine Wirkung. Unklar erkennbar → ehrlich sagen, nicht raten.

### 3. click_by_name-Pflicht (Systemprompt, `agent.js`)

Für jedes Bedienelement mit erkennbarem Namen/Text MUSS zuerst `click_by_name` versucht werden – Koordinaten-Raten per `computer_action` nur noch für Elemente ohne erkennbaren Namen oder nach einem nachgewiesenen Fehlschlag von `click_by_name`.

## Ehrliche Einordnung

- **Der komplette neue Audio-Pfad ist ungetestet auf echtem Gerät.** Es gibt kein echtes Mikrofon/keine echten Lautsprecher in dieser Entwicklungsumgebung – das kann grundsätzlich nur der Nutzer selbst beurteilen. Die einzelnen Bausteine (Downsampling-Logik, Scheduling, Interrupt-Verhalten) sind mit Fake-Objekten unit-getestet, das Zusammenspiel im echten Browser mit echter Hardware nicht.
- Ob Gemini Lives eigene Echo-/VAD-Erkennung bei Lautsprecher- (statt Kopfhörer-)Nutzung zuverlässig funktioniert, ist laut Karens eigener Doku serverseitig gelöst, aber für NEXO nicht selbst verifizierbar – nur am echten Gerät.
- Die Erfolgs-Ehrlichkeits-Regel ist Prompt-Disziplin, keine Code-Garantie – ein Modell kann sie weiterhin ignorieren. Das senkt das Risiko, garantiert es aber nicht.
- Sollte der neue Audio-Pfad beim Nutzer gar nicht funktionieren: Der Server-Code (`server.js`, `live.js`, alte HTTP-Routen) wurde nicht verändert, nur `App/conversation.js` und zwei neue Dateien – ein Rollback dieser Browser-Dateien allein stellt den alten, bekannt funktionierenden Zustand wieder her.

## Prüfung

- `node --test Code/Tests/*.test.js`: 66 Tests erfolgreich (3 neu für `NexoLivePlayer`: lückenloses Scheduling, Sofort-Stopp bei Unterbrechung mit sofortigem Neustart-Zeitpunkt für die nächste Antwort, automatisches Idle-Erkennen; HUD-Referenztest und Skript-Reihenfolge-Test an die neue Skriptliste angepasst).
- `desktop.ps1 -CheckOnly`: nicht erneut nötig, `desktop-native.cs` in diesem Schritt nicht verändert.
- Kein Live-Test gegen die echte Gemini-Live-API in diesem Schritt (Protokoll war bereits in Schritt 028 live verifiziert); kein echter Browser-/Mikrofon-Test (s.o.).

## Betroffene Dateien

Neu: `Code/App/audio-worklet.js`, `Code/App/live-audio-player.js`. Geändert: `Code/App/conversation.js`, `Code/App/index.html`, `Code/Server/agent.js`, `Code/Tests/regression.test.js`, `Code/Tests/speech-launch.test.js`, `Code/STATUS.md`, `Code/AGENTS.md`.

## Nächster Schritt

Echter Test durch den Nutzer: sprechen während NEXO redet, auf sofortigen Abbruch statt Weiterreden achten; auf hörbare Aussetzer/Robotik achten. Konkretes Fehlerbild zurückmelden, falls etwas nicht funktioniert, statt nur "geht nicht". Danach Phase D (Aufräumen der jetzt unbenutzten Dateien) oder Ausweitung von Jev auf Browser-Klicks.
