# NEXO

NEXO ist ein geplanter persönlicher KI-Assistent für Windows und Smartphones. Das System soll Sprache verstehen, freigegebene PC-Aufgaben ausführen, Obsidian und Kalender anbinden sowie bei dringenden Terminen per Push-Nachricht und optional per Telefonanruf informieren.

## Aktueller Stand

Ein startbarer HUD-Prototyp mit echtem Sprachgespräch (Mikrofon, OpenAI, Sprachausgabe) ist vorhanden. Mit `NEXO starten.cmd` startet ein kleiner lokaler Server und die Oberfläche öffnet sich im Edge-App-Fenster.

**Vor Weiterarbeit lesen:** [STATUS.md](STATUS.md) beschreibt, was funktioniert und was fehlt. [AGENTS.md](AGENTS.md) enthält die Arbeitsregeln für nachfolgende Modelle.

Die Obsidian-Dokumentation liegt unter `Planung/NEXO-Obsidian-Plan`. Für jeden abgeschlossenen Arbeits- oder Planungsschritt wird dort unter `Schritte/` eine neue Notiz erstellt und zusammen mit den Änderungen auf GitHub gepusht.

## Leitprinzipien

- Cloud-KI mit austauschbaren Modellen; aktuell fest OpenAI angebunden, Anbieterwechsel noch nicht umgesetzt
- ein gemeinsamer NEXO-Kern für Windows, Handy und Telefonie
- klar begrenzte Werkzeuge statt uneingeschränktem PC-Zugriff
- sichtbare Bestätigungen für kritische Aktionen
- austauschbare Sprachmodelle und Dienste

## Sicherheit

API-Schlüssel, Zugangsdaten, lokale Datenbanken, Gesprächsverläufe und persönliche Kalenderdaten gehören nicht in dieses Repository.
