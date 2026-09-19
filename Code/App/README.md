# NEXO HUD

Start: Im Projektordner auf **NEXO starten.cmd** doppelklicken. Das startet einen kleinen lokalen Server (`Server/server.js`) und öffnet die Oberfläche als eigenes Edge-App-Fenster über `http://localhost:4790/`.

**Für das Sprachgespräch mit NEXO** wird ein eigener OpenAI-API-Key benötigt (auf platform.openai.com erstellt, mit hinterlegter Zahlungsmethode):
1. `Server/.env.example` nach `Server/.env` kopieren.
2. In `Server/.env` den eigenen Key bei `OPENAI_API_KEY=` eintragen.
3. `Server/.env` wird nie committet (siehe `.gitignore`). Ohne gültigen Key läuft das übrige HUD trotzdem, nur das Gespräch schlägt fehl.

Der Partikelkopf folgt dem Mauszeiger. Drei Farbmodi, eine Großansicht (Escape zum Verlassen), pausierbare Bewegung, ein echtes Sprachgespräch per Mikrofon (Mikrofon-Symbol unter dem Gesicht) mit live mitgeschriebenem Verlauf im HUD, eine zusätzliche stumme Sprechanimation zum Testen ohne Audio, lokale Notizen und ein 25-Minuten-Timer sind enthalten. Es gibt keine Kalenderanbindung, Kamera-Verfolgung oder Systemüberwachung. Die Spracherkennung läuft über die eingebaute Spracherkennung des Browsers (bei Edge/Chrome technisch bedingt über Microsoft/Google), die Antworten über die OpenAI-API. FPS zeigt ausschließlich die echte Zeichenrate der Oberfläche.

Notizen bleiben im lokalen Browserprofil und werden nicht mit Obsidian synchronisiert. Der Timer läuft nur, solange das Fenster geöffnet bleibt. Bei deaktiviertem Browserspeicher zeigt die Oberfläche einen Fehler statt eines falschen Speichererfolgs.

## Herkunft der Kopfgeometrie

Die Partikelform des Kopfes wird aus einem echten 3D-Modell abgetastet statt aus einer selbst gebauten Formel:

- **"Male Head"** von **Alexander Antipov** ([Sketchfab](https://sketchfab.com/3d-models/male-head-0247a25a04ba46b99629130277fe39b7)), Lizenz **CC BY 4.0** (Creative Commons Attribution).
- Die Originaldatei liegt zur Nachvollziehbarkeit unter `reference/male_head.obj`; sie wird von der App selbst nicht geladen.
- `head-mesh-data.js` enthält die daraus einmalig offline umgerechneten Eckpunkte/Dreiecke (Hals und Schultern entfernt, Koordinatensystem an die App angepasst). `head.js` tastet daraus zur Laufzeit die Partikelpositionen ab.
- Es wird keine Textur oder Bilddatei des Originalmodells verwendet, nur die reine Geometrie.
