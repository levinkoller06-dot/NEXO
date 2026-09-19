# NEXO – Regeln für alle Projektarbeiten

## Zuerst lesen
- `STATUS.md`: tatsächlicher Funktionsstand, Grenzen und aktuelle Entscheidungen.
- `Planung/NEXO-Obsidian-Plan/Schritte/`: neueste nummerierte Schrittnotizen.
- Ältere Planungsseiten beschreiben Ziele, keine implementierten Funktionen. Bei Widersprüchen gilt der aktuelle Status.

## Arbeitsweise des Nutzers
- Neue Umsetzung erst beginnen, wenn der Nutzer sie beauftragt. Fragen oder Planungsgespräche sind kein Bauauftrag.
- Nach jedem abgeschlossenen, sinnvollen Arbeits- oder Planungsschritt eine NEUE kurze Markdown-Datei unter `Planung/NEXO-Obsidian-Plan/Schritte/` erstellen.
- Format: `NNN YYYY-MM-DD Kurzbeschreibung.md`; höchste vorhandene Nummer um eins erhöhen. Alte Schrittnotizen nicht als Ersatz für eine neue überschreiben.
- Inhalt: Auftrag, Änderungen/Entscheidungen, funktioniert jetzt, fehlt noch, Prüfungen und deren Grenzen, betroffene Dateien, nächster möglicher Schritt. Planung klar von Umsetzung trennen.
- `STATUS.md` und den Obsidian-Status bei Änderungen aktuell halten.
- Den passenden Code UND die Schrittnotiz gemeinsam committen und auf den bestehenden GitHub-Remote pushen. Der Nutzer hat diese Pushes dauerhaft angefordert; keine wiederholte Freigabe nötig.
- Nach dem Push Remote-Stand prüfen. Bei Fehlern offen melden, dass nur lokal gespeichert wurde. Keine Force-Pushes oder fremden Änderungen überschreiben.
- Ein Schritt ist eine nachvollziehbare Änderung, nicht jeder einzelne Lese- oder Tool-Aufruf.
- Keine Schlüssel, privaten Laufzeitdaten oder persönlichen Obsidian-Fensterzustände committen.
- Alle Projektdateien bleiben in diesem NEXO-Projektordner.

## Technischer Ausgangspunkt
- `App/`: HTML/CSS/Canvas-Oberfläche (HUD, Partikelkopf) plus `App/conversation.js` für echte Sprachgespräche.
- `Server/server.js`: kleiner lokaler Node-Prozess, hält den KI-API-Key aus `Server/.env` (nie committen, siehe `.gitignore`) und leitet Anfragen an den KI-Anbieter weiter. Liefert auch die `App/`-Dateien aus.
- `NEXO starten.cmd`: startet `Server/server.js` und öffnet die Oberfläche im Edge-App-Fenster über `http://localhost:4790/` (nicht mehr über `file://`).
- Aktuell angebunden: OpenAI (Modell konfigurierbar über `Server/.env`, Standard `gpt-4o-mini`). Wechsel zwischen Anbietern/Modellen ist noch nicht umgesetzt, nur der erste feste Anbieter.
