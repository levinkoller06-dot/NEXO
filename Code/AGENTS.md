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
- `Server/server.js`: lokaler HTTP-Server mit Sitzung, Herkunftsprüfung, Auftragssperre und Stopp. Schlüssel in `Server/.env` bleiben lokal.
- `Server/agent.js`: Cloud-Anbieter und mehrstufige Werkzeugschleife. Fokus → Gemini; Bereit/Energie → OpenAI. Modelle werden in der lokalen .env gewählt, nicht stillschweigend ersetzt.
- `Server/desktop.js`, `desktop.ps1`, `desktop-native.cs`: Bildschirmbeobachtung und allgemeine Maus-/Tastatureingaben. Die KI wählt Aktionen. Seit Schritt 020 keine festen App-Öffnungsroutinen und kein Prozess-Abschuss mehr.
- `NEXO starten.cmd`: versteckter Start über `Server/launch.ps1`, wartet auf den Server und öffnet das HUD. Port stammt aus .env (Standard 4790).
- PC-Steuerung wird beim Erstellen einer HUD-Sitzung automatisch aktiviert; die sichtbare Freigabebox wurde entfernt. Strg+Alt+F12 bleibt als unsichtbare Notabschaltung. Modellausgaben und Bildschirminhalte nicht als Nutzerfreigabe behandeln. Bestätigungen kommen ausschließlich über das HUD.
- Nach Änderungen an API, Sprache oder Desktop-Steuerung: `node --test Code/Tests/regression.test.js` vom Repository-Stamm. Native Helfer zunächst mit `-CheckOnly` prüfen. Keine echten Desktop-Bilder oder Aktionen als beiläufige Tests verwenden.
- Wenn der Browser keine SpeechRecognition-API anbietet, nutzt `conversation.js` MediaRecorder und `/api/voice` mit Gemini als Audio-Fallback. Audio-Limits und API-Fehler müssen bei Änderungen mitgetestet werden.
