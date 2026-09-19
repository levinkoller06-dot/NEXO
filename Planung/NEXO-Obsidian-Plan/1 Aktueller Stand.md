# Aktueller Stand – NEXO

Stand: 20.09.2026 · Schritt 019 (Analyse des Codes bis Schritt 018)

## Funktioniert
HUD mit 99.220 Punkten aus einem 3D-Kopfmodell, Mausverfolgung, Blinzeln, Mundanimation während Sprachausgabe, Farb-/Partikelübergängen, Großansicht, Pause, Browsernotiz und Fokus-Timer. Lokaler Node-Server mit Cloud-Anbietern: Fokus → Gemini, Bereit/Energie → OpenAI. Browser-Spracherkennung und Sprachausgabe, Gesprächsverlauf in der Sitzung. Erste Werkzeuge für gelistete Programme (öffnen/schließen), Websuche und Moduswechsel sind implementiert, haben aber offene Fehler.

## Offene Fehler aus der Analyse
[[019 2026-09-20 Analyse der Aenderungen]] enthält sieben Befunde mit Nachweisen. Besonders dringend: erzwungenes Schließen kann ungespeicherte Arbeit verlieren; ein fehlgeschlagener Programmstart kann den Server beenden; die lokale Aktions-API prüft die Herkunft einer Anfrage nicht. Auch Mikrofon-Neustart, parallele Anfragen, Werkzeugrunden und URL-Fehlerbehandlung müssen korrigiert werden. Bei dieser Analyse wurde kein Anwendungscode geändert.

## Fehlt
In der Cloud betriebener NEXO-Core, Anmeldung, dauerhafte Erinnerung, freie Anbieter-/Modellwahl, Kamera-Verfolgung, Kalender, Handy-App, Push und Telefonie. Die Notizfunktion schreibt noch nicht nach Obsidian; die PC-Steuerung ist auf die genannten Werkzeuge begrenzt.

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

Nach jedem abgeschlossenen Arbeits- oder Planungsschritt entsteht hier eine neue nummerierte Notiz im Ordner `Schritte`. Code und Notiz werden gemeinsam auf GitHub gesichert.

> [!important] Maßgebliche Planung
> Die ältere Fachplanung und die Mindmap enthalten Entwürfe. Für das aktuelle Ziel und die Reihenfolge gilt [[NEXO Planung und Ziel]]; dieser Status beschreibt, was davon bereits umgesetzt ist.
