# NEXO HUD

Start: Im Projektordner auf **NEXO starten.cmd** doppelklicken. Das startet einen kleinen lokalen Server (`Server/server.js`) unsichtbar im Hintergrund (kein CMD-Fenster) und öffnet die Oberfläche als eigenes Edge-App-Fenster über `http://localhost:4790/`.

**Für das Sprachgespräch mit NEXO** werden eigene API-Keys benötigt – welcher Anbieter antwortet, hängt vom Betriebsmodus ab (siehe unten):
1. `Server/.env.example` nach `Server/.env` kopieren.
2. `OPENAI_API_KEY=` mit einem Key von platform.openai.com (mit hinterlegter Zahlungsmethode) füllen, für die Modi Bereit/Energie.
3. `GEMINI_API_KEY=` mit einem Key von aistudio.google.com/apikey füllen, für den Modus Fokus.
4. `Server/.env` wird nie committet (siehe `.gitignore`). Ohne gültigen Key für den jeweils aktiven Modus läuft das übrige HUD trotzdem, nur das Gespräch in diesem Modus schlägt fehl.

Der Partikelkopf folgt dem Mauszeiger. Drei Farbmodi (per Klick oder per Sprachbefehl, z. B. "wechsle den Betriebsmodus zu Energie"), eine Großansicht (Escape zum Verlassen), pausierbare Bewegung, ein echtes Sprachgespräch per Mikrofon (Mikrofon-Symbol unter dem Gesicht, rot solange stummgeschaltet) mit live mitgeschriebenem Verlauf im HUD, lokale Notizen und ein 25-Minuten-Timer sind enthalten. Es gibt keine Kalenderanbindung, Kamera-Verfolgung oder Systemüberwachung. Die Spracherkennung läuft über die eingebaute Spracherkennung des Browsers (bei Edge/Chrome technisch bedingt über Microsoft/Google). Die Antworten kommen je nach Betriebsmodus von **Google Gemini** (Modus Fokus) oder **OpenAI** (Modi Bereit/Energie) – ein erster Schritt in Richtung eines späteren, per Sprachbefehl steuerbaren Anbieterwechsels. Welcher Modus welchen Anbieter nutzt, steht in `Server/server.js` (`MODE_PROVIDER`). FPS zeigt ausschließlich die echte Zeichenrate der Oberfläche.

**PC-Steuerung, eng begrenzt:** NEXO kann auf Zuruf ein Programm aus einer festen Liste öffnen oder schließen (siehe `ALLOWED_APPS` in `Server/server.js` — aktuell u. a. Editor, Rechner, Explorer, Task-Manager, Paint, Firefox, Chrome, Edge, Word, Excel, Outlook, Spotify, Discord, VS Code, Terminal) sowie eine Websuche starten. Es gibt bewusst keinen Weg, beliebige Befehle auszuführen oder die Maus zu steuern — das wurde bewusst nicht umgesetzt, auch nicht auf ausdrücklichen Wunsch (siehe `STATUS.md`, Abschnitt "Abgelehnter Auftrag"). Zusätzliche Programme können einzeln in `ALLOWED_APPS` ergänzt werden.

Notizen bleiben im lokalen Browserprofil und werden nicht mit Obsidian synchronisiert. Der Timer läuft nur, solange das Fenster geöffnet bleibt. Bei deaktiviertem Browserspeicher zeigt die Oberfläche einen Fehler statt eines falschen Speichererfolgs.

## Herkunft der Kopfgeometrie

Die Partikelform des Kopfes wird aus einem echten 3D-Modell abgetastet statt aus einer selbst gebauten Formel:

- **"Male Head"** von **Alexander Antipov** ([Sketchfab](https://sketchfab.com/3d-models/male-head-0247a25a04ba46b99629130277fe39b7)), Lizenz **CC BY 4.0** (Creative Commons Attribution).
- Die Originaldatei liegt zur Nachvollziehbarkeit unter `reference/male_head.obj`; sie wird von der App selbst nicht geladen.
- `head-mesh-data.js` enthält die daraus einmalig offline umgerechneten Eckpunkte/Dreiecke (Hals und Schultern entfernt, Koordinatensystem an die App angepasst). `head.js` tastet daraus zur Laufzeit die Partikelpositionen ab.
- Es wird keine Textur oder Bilddatei des Originalmodells verwendet, nur die reine Geometrie.
