---
projekt: NEXO
status: HUD-Prototyp
phase: 1
ziel: Persönlicher Cloud-KI-Assistent für PC und Handy
---

# NEXO Dashboard

> [!important] Aktueller Einstieg
> Lies zuerst [[13 Aktueller Stand]] und die neuen Notizen im Ordner `Schritte`. Die bisherigen Fachseiten sind ältere Planungsentwürfe; insbesondere die lokale KI-Architektur ist überholt.

> [!summary] Ziel
> NEXO nimmt wiederkehrende digitale Aufgaben ab, versteht Sprache, bedient freigegebene PC-Funktionen, verwaltet Termine und ist später auf PC und Handy als eine zusammenhängende Assistenz verfügbar.

## Leitentscheidungen

- **Cloud-KI:** Modelle sollen über APIs angebunden und auf Befehl gewechselt werden. Noch keine KI implementiert.
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

> [!todo] Phase 1 – HUD-Prototyp
> Die Oberfläche mit Partikelkopf, Farbmodi, Großansicht, Browsernotiz und Timer ist gebaut. KI, Stimme und echte PC-/Kalenderaktionen fehlen noch.

## Definition von „fertig“ für Version 1

- [ ] Aktivierungswort funktioniert zuverlässig im Zimmer.
- [ ] Spracheingabe ist angebunden; Anbieter noch offen.
- [ ] NEXO kann Programme öffnen und Dateien suchen.
- [ ] NEXO kann einen Termin verstehen und vor dem Speichern bestätigen lassen.
- [ ] Jede ausgeführte Aktion erscheint im Verlauf.
- [ ] Stoppschalter beendet Mikrofon, Automationen und Fernzugriff sofort.
