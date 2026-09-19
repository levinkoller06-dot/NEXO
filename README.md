# NEXO

NEXO ist ein geplanter persönlicher KI-Assistent für Windows und Smartphones. Das System soll Sprache verstehen, freigegebene PC-Aufgaben ausführen, Obsidian und Kalender anbinden sowie bei dringenden Terminen per Push-Nachricht und optional per Telefonanruf informieren.

## Aktueller Stand

Ein startbarer HUD-Prototyp ohne KI ist vorhanden. Mit `NEXO starten.cmd` öffnet sich die Oberfläche im Edge-App-Fenster.

**Vor Weiterarbeit lesen:** [STATUS.md](STATUS.md) beschreibt, was funktioniert und was fehlt. [AGENTS.md](AGENTS.md) enthält die Arbeitsregeln für nachfolgende Modelle.

Die Obsidian-Dokumentation liegt unter `Planung/NEXO-Obsidian-Plan`. Für jeden abgeschlossenen Arbeits- oder Planungsschritt wird dort unter `Schritte/` eine neue Notiz erstellt und zusammen mit den Änderungen auf GitHub gepusht.

## Leitprinzipien

- Cloud-KI mit austauschbaren Modellen; noch keine API angebunden
- ein gemeinsamer NEXO-Kern für Windows, Handy und Telefonie
- klar begrenzte Werkzeuge statt uneingeschränktem PC-Zugriff
- sichtbare Bestätigungen für kritische Aktionen
- austauschbare Sprachmodelle und Dienste

## Sicherheit

API-Schlüssel, Zugangsdaten, lokale Datenbanken, Gesprächsverläufe und persönliche Kalenderdaten gehören nicht in dieses Repository.
