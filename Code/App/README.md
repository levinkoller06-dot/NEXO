# NEXO HUD

Start: Im Projektordner auf **NEXO starten.cmd** doppelklicken. Die Oberfläche öffnet sich als eigenes Edge-App-Fenster. Alternativ `index.html` in einem modernen Browser öffnen. Keine Installation, kein API-Key und kein Server erforderlich.

Der Partikelkopf folgt dem Mauszeiger. Drei Farbmodi, eine Großansicht (Escape zum Verlassen), pausierbare Bewegung, eine stumme Sprechanimation, lokale Notizen und ein 25-Minuten-Timer sind enthalten. Es gibt keine KI, Kamera-, Mikrofon-, Kalender- oder Systemüberwachungsverbindung. FPS zeigt ausschließlich die echte Zeichenrate der Oberfläche.

Notizen bleiben im lokalen Browserprofil und werden nicht mit Obsidian synchronisiert. Der Timer läuft nur, solange das Fenster geöffnet bleibt. Bei deaktiviertem Browserspeicher zeigt die Oberfläche einen Fehler statt eines falschen Speichererfolgs.

## Herkunft der Kopfgeometrie

Die Partikelform des Kopfes wird aus einem echten 3D-Modell abgetastet statt aus einer selbst gebauten Formel:

- **"Male Head"** von **Alexander Antipov** ([Sketchfab](https://sketchfab.com/3d-models/male-head-0247a25a04ba46b99629130277fe39b7)), Lizenz **CC BY 4.0** (Creative Commons Attribution).
- Die Originaldatei liegt zur Nachvollziehbarkeit unter `reference/male_head.obj`; sie wird von der App selbst nicht geladen.
- `head-mesh-data.js` enthält die daraus einmalig offline umgerechneten Eckpunkte/Dreiecke (Hals und Schultern entfernt, Koordinatensystem an die App angepasst). `head.js` tastet daraus zur Laufzeit die Partikelpositionen ab.
- Es wird keine Textur oder Bilddatei des Originalmodells verwendet, nur die reine Geometrie.
