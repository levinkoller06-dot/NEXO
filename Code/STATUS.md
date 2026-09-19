# NEXO – aktueller Projektstand

Stand: 19.09.2026 · Schritt 004

## Tatsächlich implementiert
- Startbarer HUD-Prototyp: `NEXO starten.cmd` öffnet `App/index.html` als Edge-App-Fenster. Kein eigenständiger EXE-Installer.
- Dunkles HUD mit prozeduralem Partikelkopf aus 50.252 Punkten. Die neue Gesichtsform modelliert Augenhöhlen, Stirn, Nase, Wangen, Mund, Kiefer und Ohren als Punktoberfläche; die Referenz wurde nicht als Bild eingebettet.
- Kopf folgt dem Mauszeiger, Augen blinzeln, stumme Sprechanimation per Knopf.
- Drei visuelle Modi: Bereit (Türkis), Fokus (Violett), Energie (Orange). Diese wechseln KEINE KI-Modelle.
- Große Gesichtsansicht, Escape zum Verkleinern, Bewegung pausieren, Ansicht zentrieren.
- Browserlokale Notiz, 25-Minuten-Timer solange das Fenster läuft, Uhr und Aktionsliste der aktuellen Sitzung.
- FPS-Anzeige misst Zeichenrate, keine PC-Auslastung. Betriebssystem-Einstellung für reduzierte Bewegung wird beachtet; dann startet Bewegung pausiert.

## Nicht implementiert
- Keine KI-API, Modellumschaltung, Cloud-Backend oder KI-Gedächtnis.
- Keine Mikrofonaufnahme, Spracherkennung, Sprachausgabe oder Kamera-Verfolgung.
- Keine PC-Steuerung, Kalenderanbindung, Telefonie, Push-Nachrichten oder Handy-App.
- Notizen werden NICHT in Obsidian gespeichert. Kein geräteübergreifender Sync.
- Kein Systemmonitor, keine produktive Anmeldung oder Rechteverwaltung.

## Aktuelle Entscheidungen
- KI soll in der Cloud laufen, nicht lokal über Ollama.
- NEXO soll später auf Sprachbefehl zwischen Anbietern/Modellen wechseln können, z. B. Claude, Astra oder Mistral. Gemeinsamer Kontext bleibt im NEXO-Kern; Verfügbarkeit und APIs müssen vor Integration geprüft werden.
- Noch kein Hauptmodell verbindlich ausgewählt und kein API-Key eingerichtet. Mistral war ein Vorschlag, keine fertige Integration.
- Erst HUD gestalten, danach weitere Funktionen ausdrücklich beauftragen.
- Nach jedem abgeschlossenen Änderungs- oder Planungsschritt neue Obsidian-Notiz plus GitHub-Push.

## Überprüft
- JavaScript-Syntax mit `node --check App/head.js` und `node --check App/app.js` erfolgreich.
- Browseransicht visuell geprüft; Moduswechsel, Großansicht, Escape, Animation, Notiz-Speichermeldung und laufender Timer geprüft.
- Windows-Startdatei ausgeführt. Das separate Edge-Fenster wurde nicht zusätzlich per UI inspiziert.
- Noch kein Test der Notiz nach Browserneustart und kein vollständiger 25-Minuten-Durchlauf. Smartphone-Layout noch nicht visuell geprüft.

## Orientierung
- Obsidian-Einstieg: `Planung/NEXO-Obsidian-Plan/1 Aktueller Stand.md` und `Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md`.
- Code liegt unter `Code/App`; Startdatei ist `Code/NEXO starten.cmd`.
- Ältere Fachplanungen und die Mindmap enthalten Entwürfe. Lokale Modelle, Preise und Zeitpläne darin sind keine aktuelle Implementierungszusage.
- Nächster möglicher Schritt: Schritt 005 nur nach Auftrag starten: Cloud-Core und Modelladapter planen/implementieren.
