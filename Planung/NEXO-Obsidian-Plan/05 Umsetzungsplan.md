# Umsetzungsplan

## Phase 0 – Entscheidungen und PC-Test (1 bis 2 Tage)

- [ ] Grafikkarte, VRAM, RAM, Windows-Version und Handy-System notieren
- [x] NEXO als Arbeitsnamen festlegen
- [ ] Hauptkalender auswählen: Google, Outlook oder CalDAV
- [ ] Ollama installieren und zwei passende lokale Modelle testen
- [ ] Push-to-talk gegen Aktivierungswort abwägen

**Ergebnis:** Eine kurze Hardware- und Dienstentscheidung, bevor Code gebaut wird.

## Phase 1 – Lokaler PC-Assistent (1 bis 2 Wochen)

- [ ] Lokales Gateway und Chatoberfläche
- [ ] Lokales Modell über austauschbare Modellschnittstelle
- [ ] Sprache zu Text und Text zu Sprache
- [ ] Programme aus einer festen Freigabeliste öffnen
- [ ] Obsidian-Notiz erstellen
- [ ] Aktionsprotokoll und Stoppschalter

**Abnahme:** NEXO erledigt fünf vorab festgelegte Befehle zuverlässig und zeigt jede Aktion an.

## Phase 2 – Kalender (1 Woche)

- [ ] Kalenderkonto per OAuth verbinden
- [ ] Termine lesen
- [ ] Termin-Entwurf aus Sprache erzeugen
- [ ] Bestätigungsdialog vor dem Speichern
- [ ] Erinnerungsregeln und Tests für Zeitzonen

**Abnahme:** „Morgen um 16 Uhr eine Stunde Training“ wird korrekt verstanden, angezeigt und erst nach Zustimmung gespeichert.

## Phase 3 – Handy-Zugriff (1 bis 2 Wochen)

- [ ] Sichere Anmeldung und Gerätefreigabe
- [ ] Chat und Mikrofon in der Handy-App
- [ ] Push-Nachrichten
- [ ] Gesprächs- und Aktionsverlauf synchronisieren
- [ ] Verbindung auch außerhalb des Heimnetzes testen

**Abnahme:** Vom Handy aus kann ein Termin als Entwurf erstellt und am PC-Verlauf nachvollzogen werden.

## Phase 4 – Dringende Termine (1 Woche)

- [ ] Kalender-Webhooks
- [ ] Regel „Beginn in unter 60 Minuten“
- [ ] Duplikatschutz
- [ ] Push mit Bestätigung
- [ ] Verhalten bei ausgeschaltetem PC

**Abnahme:** Ein Testtermin in 30 Minuten erzeugt genau eine dringende Benachrichtigung.

## Phase 5 – Telefonanruf (1 bis 2 Wochen)

- [ ] Telefonnummer und Telefonieanbieter anbinden
- [ ] Ausgehenden Testanruf starten
- [ ] Sprache in beide Richtungen verbinden
- [ ] NEXO-Kontext in den Anruf übernehmen
- [ ] Abbruch, Zeitlimit und Kostenlimit einbauen

**Abnahme:** Nach ausbleibender Push-Bestätigung ruft NEXO einmal an, nennt den Termin und beantwortet eine Rückfrage.

## Phase 6 – Ausbau

- [ ] Weitere Windows-Werkzeuge einzeln freigeben
- [ ] Routinen-Editor
- [ ] Datei- und Download-Aufräumer mit Vorschau
- [ ] Backup-Prüfung
- [ ] Optionaler Cloud-Fallback für schwere Aufgaben

## Empfohlene erste Arbeitswoche

1. Hardware erfassen und lokales Modell auswählen.
2. Einen Textchat mit lokalem Modell starten.
3. Drei sichere Werkzeuge anbinden.
4. Aktionsprotokoll und Bestätigungssystem fertigstellen.
5. Erst dann Mikrofon und Stimme ergänzen.
