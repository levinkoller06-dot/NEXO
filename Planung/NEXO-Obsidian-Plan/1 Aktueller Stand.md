# Aktueller Stand – NEXO

Stand: 20.09.2026 · Schritt 024 (Mikrofon-Fix, Gemini-Stimme und Tempo)

## Funktioniert
HUD mit 99.220 Punkten aus einem 3D-Kopfmodell, Mausverfolgung (immer aktiv), Blinzeln, Mundanimation während Sprachausgabe, Farb-/Partikelübergängen, Großansicht, Browsernotiz und Fokus-Timer. Lokaler Node-Server mit Cloud-Anbietern: Fokus/Bereit → Gemini (ohne Thinking, wegen Tempo), Energie → OpenAI. Browser-Spracherkennung (Mikrofon startet automatisch) und Gemini-Sprachausgabe (männliche Stimme "Charon", satzweise gestreamt), Gesprächsverlauf nur noch im Kern. Sichtbare Statuszeile ("Denkt nach …", "Hört zu.") über dem Kopf. NEXO aktiviert die allgemeine Desktopsteuerung automatisch für die aktive Sitzung und plant Bildschirm-, Maus- und Tastaturaktionen. Sensible Aktionen benötigen Bestätigung; Strg+Alt+F12 bleibt als unsichtbare Notabschaltung.

## Behobene Befunde aus der Analyse
[[019 2026-09-20 Analyse der Aenderungen]] enthielt sieben Befunde. [[020 2026-09-20 KI-Desktopsteuerung und Fehlerbehebung]] dokumentiert die Behebungen: kein erzwungenes Prozess-Schließen mehr, kontrollierte Helper-Fehler, geschützte lokale API, stabiler Mikrofon- und Anfrageablauf, mehrere Modell-/Werkzeugrunden sowie sichere URL-Fehlerbehandlung.

## Fehlt
In der Cloud betriebener NEXO-Core, Anmeldung, dauerhafte Erinnerung, freie Anbieter-/Modellwahl, Kamera-Verfolgung, Kalender, Handy-App, Push und Telefonie. Die Notizfunktion schreibt noch nicht automatisch nach Obsidian. Echte Desktop-, Mikrofon- und globaler-Hotkey-Tests auf dem Benutzer-PC stehen noch aus.

## Beschlossen
Cloud-KI bei lokal laufender Oberfläche und lokalem Server. OpenAI/Gemini sind angebunden; ein allgemeiner Modell-Router mit gemeinsamem dauerhaftem Kontext bleibt Ziel. Neue Umsetzung nur auf Auftrag.

## Schrittprotokoll
- [[001 2026-09-19 HUD-Prototyp]]
- [[002 2026-09-19 Dokumentation und GitHub-Workflow]]
- [[003 2026-09-19 Obsidian aufgeräumt]]
- [[004 2026-09-19 Ziel-und-Schrittplan]]
- [[005 2026-09-19 Gesichtsform angepasst]]
- [[006 2026-09-19 Gesichtsform an Referenzprofil angepasst]]
- [[007 2026-09-19 Gesicht verbreitert, Mund, Zähne, Moduswechsel-Effekt]]
- [[008 2026-09-19 Kopfform durch echtes 3D-Modell ersetzt]]
- [[009 2026-09-19 Normalen-Bug im Mesh-Kopf behoben]]
- [[010 2026-09-19 Tiefenkontrast fuer klare Vorderseite und Zaehne unsichtbar]]
- [[011 2026-09-19 Viel mehr Punkte und ovale Mundoeffnung]]
- [[012 2026-09-20 Performance-Optimierung nach FPS-Einbruch]]
- [[013 2026-09-20 Cloud-Core und erstes Sprachgespraech]]
- [[014 2026-09-20 Gemini fuer Modus Fokus ergaenzt]]
- [[015 2026-09-20 Layout passt jetzt ohne Scrollen ins Fenster]]
- [[016 2026-09-20 UI aufgeraeumt Mundknopf entfernt Mikrofon rot bei Stumm]]
- [[017 2026-09-20 Erste eng begrenzte PC-Steuerung]]
- [[018 2026-09-20 Erweiterte PC-Steuerung, Modus per Sprache, verstecktes Serverfenster]]
- [[019 2026-09-20 Analyse der Aenderungen]]
- [[020 2026-09-20 KI-Desktopsteuerung und Fehlerbehebung]]
- [[021 2026-09-20 HUD vereinfacht und Mikrofon repariert]]
- [[022 2026-09-20 Mikrofonzugriff und HUD-Texte bereinigt]]
- [[023 2026-09-20 Audio-Fallback für Edge-App ergänzt]]
- [[024 2026-09-20 Mikrofon-Fix, Gemini-Stimme und Tempo]]

Nach jedem abgeschlossenen Arbeits- oder Planungsschritt entsteht hier eine neue nummerierte Notiz im Ordner `Schritte`. Code und Notiz werden gemeinsam auf GitHub gesichert.

> [!important] Maßgebliche Planung
> Die ältere Fachplanung und die Mindmap enthalten Entwürfe. Für das aktuelle Ziel und die Reihenfolge gilt [[NEXO Planung und Ziel]]; dieser Status beschreibt, was davon bereits umgesetzt ist.
