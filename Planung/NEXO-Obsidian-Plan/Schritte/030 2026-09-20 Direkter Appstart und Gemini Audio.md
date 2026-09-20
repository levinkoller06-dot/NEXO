# Schritt 030 – Direkter Appstart und Gemini-Audio

## Auftrag
App-Start wie Karen ohne Mausumwege; Maus/Tastatur erst für Bedienung. Gemini-Stimme beibehalten und Mundbewegung synchronisieren. Aktuellen Plan wahrheitsgemäß fortschreiben.

## Umsetzung
- Karen-Referenz gelesen: Spider man/karen2.0/actions/open_app.py und core/app_paths.py. Deren Prinzip übernommen, nicht die ganze APK kopiert.
- apps.ps1 löst installierte Programme über App Paths, bekannte Installationsorte, PATH, exakte Startmenü-Verknüpfungen und Windows-App-IDs auf. Keine freien Shell-Befehle, keine Windows-Suche und kein automatischer UI-Fallback.
- launch_app liefert Startstatus statt Screenshot; alte native Such-Eingaben entfernt. Reiner Auftrag „Öffne Spotify“ erreicht den Start direkt. Kombinierte/andere Aufträge bleiben beim KI-Planer, dessen Werkzeugbeschreibung korrigiert wurde.
- Nur Gemini-TTS, konfigurierte Stimme Charon bleibt lokal erhalten. Keine Browser-Ersatzstimme. Ein Audiopaket pro Antwort reduziert Satz-Anfragen; die Wartezeit vor Sprechbeginn kann dadurch länger sein. Fehler bleiben sichtbar. Abgebrochene HTTP-Synthese wird serverseitig abgebrochen.
- speech-player.js spielt über Web Audio; Mundenergie wird am gleichen Audiosignal gemessen. Sprechpausen, Ende, Abbruch und Dekodierfehler berücksichtigt.
- Server und Starter Version 32.

## Prüfungen und Grenzen
61 Tests bestanden (54 bestehende, 7 neue): direkter Start ohne Modell/UI, zusammengesetzte Aufträge, Fehlstart, konfigurierte Stimme und API-Fehler, Audioenergie, Stille, Ende, Abbruch während Dekodierung. JavaScript-Syntax geprüft. Desktop-Helfer mit -CheckOnly erfolgreich kompiliert. Spotify lokal unter AppData/Roaming/Spotify/Spotify.exe gefunden, dabei nicht gestartet.
Kein echtes Mikrofon-/Lautsprecher-End-to-End-Ergebnis behauptet. Keine echten Desktop-Eingaben als beiläufiger Test. Mundöffnung ist amplitudenbasiert, keine exakten Sprachlaute. Komplexe Modellaufträge können weiter Fehlentscheidungen treffen. Gemini-Ausfälle bleiben möglich; keine andere Stimme als Ersatz.

## Betroffene Dateien
Code/App: app.js, conversation.js, speech-player.js, index.html.
Code/Server: agent.js, apps.ps1, desktop.js, desktop.ps1, desktop-native.cs, server.js, launch.ps1.
Code/Tests: regression.test.js, speech-launch.test.js. STATUS.md, AGENTS.md und Obsidian-Status/Zielseite aktualisiert.

## Noch offen / nächste Schritte
1. NEXO neu starten, Stimme/Mikrofon und sichtbare Mundbewegung im echten HUD abnehmen.
2. Gemini-Live-Browseranbindung für geringere Gesprächslatenz; Servervorarbeit vorhanden, Browser noch nicht angebunden.
3. Danach dauerhafter Kontext/Modell-Router und Kalender nach Zielplan.
4. Handy-App, Benachrichtigungen und Telefonie sind weiterhin Ziele. Karen-Mobile-Quellen sind vorhanden, noch nicht übernommen oder mit NEXO verbunden. Eine APK allein ersetzt die Integration nicht.

Der Gesamtplan ist damit nicht vollständig implementiert. Dieser Schritt korrigiert die drei aktuellen Probleme und den dokumentierten Stand.
