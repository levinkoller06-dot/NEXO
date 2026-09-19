# Entscheidungen

Hier werden Architekturentscheidungen festgehalten, damit das Projekt nicht ständig seine Richtung ändert.

## ADR-001 – Lokal zuerst

**Status:** beschlossen  
**Entscheidung:** Normale Sprach- und Textanfragen laufen auf dem Gaming-PC.  
**Grund:** geringe laufende Kosten, schnelle Reaktion und bessere Privatsphäre.  
**Folge:** Qualität und Geschwindigkeit hängen von der vorhandenen Hardware ab.

## ADR-002 – Ein Kern, mehrere Apps

**Status:** beschlossen  
**Entscheidung:** Desktop, Handy und Telefonie verwenden denselben Agenten und dieselben Berechtigungen.  
**Grund:** Kein getrenntes Gedächtnis und keine dreifache Logik.  
**Folge:** Der Kern braucht eine saubere, abgesicherte Schnittstelle.

## ADR-003 – Push vor Telefonanruf

**Status:** beschlossen  
**Entscheidung:** Dringende Termine erzeugen zuerst eine Push-Nachricht; ein Anruf folgt nur ohne Bestätigung.  
**Grund:** geringere Kosten und weniger Störungen.  
**Folge:** Die Handy-App benötigt eine zuverlässige Bestätigungsfunktion.

## ADR-004 – Werkzeuge statt freier PC-Zugriff

**Status:** beschlossen  
**Entscheidung:** NEXO bedient geprüfte Werkzeuge mit festen Parametern. Bildschirmsteuerung ist nur eine spätere Ausweichlösung.  
**Grund:** höhere Zuverlässigkeit und nachvollziehbare Berechtigungen.  
**Folge:** Jede neue Fähigkeit wird bewusst ergänzt und getestet.

## Offene Entscheidungen

- [x] Arbeitsname NEXO
- [ ] Android, iPhone oder beide
- [ ] Google Calendar, Outlook oder CalDAV
- [ ] Grafikkarte und verfügbarer VRAM
- [ ] Soll der PC rund um die Uhr laufen?
- [ ] Welche drei PC-Aktionen haben zuerst den größten Nutzen?
- [ ] Zielregion der Telefonnummer
