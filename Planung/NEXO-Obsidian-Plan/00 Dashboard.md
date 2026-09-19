---
projekt: NEXO
status: Planung
phase: 0
ziel: Persönlicher lokaler KI-Assistent für PC und Handy
---

# NEXO Dashboard

> [!summary] Ziel
> NEXO nimmt wiederkehrende digitale Aufgaben ab, versteht Sprache, bedient freigegebene PC-Funktionen, verwaltet Termine und ist später auf PC und Handy als eine zusammenhängende Assistenz verfügbar.

## Leitentscheidungen

- **Lokal zuerst:** Sprache, Gedächtnis und möglichst viele Befehle laufen auf dem Gaming-PC.
- **Ein Kern, mehrere Oberflächen:** Desktop-App, Handy-App und Telefonie greifen auf denselben Assistenten zu.
- **Ereignisse statt Dauerüberwachung:** NEXO reagiert auf Kalenderänderungen, das Aktivierungswort und freigegebene Systemereignisse.
- **Kontrolle bleibt beim Nutzer:** Kritische Aktionen benötigen immer eine Bestätigung.
- **Klein anfangen:** Zuerst ein zuverlässiger PC-Assistent, dann Kalender, Handy-App und zuletzt echte Telefonanrufe.

## Navigation

- [[01 NEXO Mindmap]] – zentrale Übersicht aller Verbindungen
- [[01 Vision und Grenzen]]
- [[02 Funktionen und Prioritäten]]
- [[03 Systemarchitektur]]
- [[04 Termin-und-Anruf-Ablauf]]
- [[05 Umsetzungsplan]]
- [[06 Kostenplan]]
- [[07 Sicherheit und Berechtigungen]]
- [[08 Namensideen]]
- [[09 Entscheidungen]]
- [[10 Backlog]]
- [[11 Technikauswahl]]
- [[12 Quellen]]

## Aktueller Meilenstein

> [!todo] Phase 1 – PC-Grundversion
> NEXO hört erst nach Aktivierung zu, beantwortet Fragen lokal und darf drei klar begrenzte Aktionen ausführen: Programme öffnen, Notizen anlegen und Termine als Entwurf vorbereiten.

## Definition von „fertig“ für Version 1

- [ ] Aktivierungswort funktioniert zuverlässig im Zimmer.
- [ ] Sprache wird lokal in Text umgewandelt.
- [ ] NEXO kann Programme öffnen und Dateien suchen.
- [ ] NEXO kann einen Termin verstehen und vor dem Speichern bestätigen lassen.
- [ ] Jede ausgeführte Aktion erscheint im Verlauf.
- [ ] Stoppschalter beendet Mikrofon, Automationen und Fernzugriff sofort.
