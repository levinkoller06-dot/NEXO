# NEXO Planung und Ziel

Stand: 20.09.2026 · Schritt 028 (Gemini-Live-API: Phase A und B)
Zielbild: Cloud-basierte persönliche Assistenz für PC, Handy und Telefon

Die Nummern 000–015 unten sind Planungsphasen; die fortlaufenden Arbeitsnotizen unter `Schritte/` haben eine eigene Nummerierung. Zum aktuellen Code und seinen Grenzen siehe [[1 Aktueller Stand]], [[019 2026-09-20 Analyse der Aenderungen]], [[020 2026-09-20 KI-Desktopsteuerung und Fehlerbehebung]], [[021 2026-09-20 HUD vereinfacht und Mikrofon repariert]], [[022 2026-09-20 Mikrofonzugriff und HUD-Texte bereinigt]], [[023 2026-09-20 Audio-Fallback für Edge-App ergänzt]], [[024 2026-09-20 Mikrofon-Fix, Gemini-Stimme und Tempo]], [[025 2026-09-20 Bewegungs-Fix, Stimmklaerung und unsichtbare Maus]], [[026 2026-09-20 Denkbudget fuer PC-Steuerung und sicheres launch_app]], [[027 2026-09-20 Karen-Techniken - UIA-Klicks, Websuche, Barge-in]] und [[028 2026-09-20 Live-API Phase A und B]].

## Das Ziel

NEXO ist ein persönlicher Assistent mit einem eigenen Kern. Der Kern speichert den gemeinsamen Kontext, kennt die erlaubten Werkzeuge und entscheidet, welches KI-Modell eine Aufgabe bearbeitet. Claude, Astra, Mistral und weitere Anbieter sind austauschbare Denkmodule. NEXO bleibt dabei dieselbe Assistenz.

Du kannst später sagen:

- „Nexo, wechsle für diese Aufgabe zu Claude.“
- „Nexo, nimm Astra für die Planung und danach wieder das günstige Modell.“
- „Nexo, welchen Modus und welches Modell verwendest du gerade?“
- „Nexo, arbeite im Sparmodus und frage vor jedem Anruf nach.“

Das Ziel ist eine Cloud-KI, die:

- auf dem PC als HUD/Desktop-App läuft
- auf dem Handy als App verfügbar ist
- Sprache versteht und antwortet
- Termine liest, erstellt und überwacht
- einen Termin unter einer Stunde rechtzeitig meldet
- zuerst eine Push-Nachricht und bei fehlender Bestätigung einen Telefonanruf auslöst
- freigegebene PC-Aufgaben ausführt
- vor kritischen Aktionen nachfragt
- jeden Schritt nachvollziehbar protokolliert

## Was heute implementiert ist

- HUD unter Code/App und lokaler Node-Server unter Code/Server.
- Partikelkopf aus einem 3D-Modell mit 99.220 Punkten, Mausverfolgung, Blinzeln und Mundanimation während Sprachausgabe.
- Browser-Spracherkennung, Browser-Sprachausgabe und Gesprächsverlauf in der Sitzung.
- Feste Anbieterzuordnung: Fokus → Gemini; Bereit/Energie → OpenAI.
- KI-gestützte Desktopsteuerung über Bildschirmbeobachtung sowie Maus-, Tastatur-, Text-, Scroll- und Warteaktionen.
- Automatische PC-Steuerung für die aktive Sitzung, sensible-Aktion-Bestätigung, Ablaufzeit, unsichtbare Notabschaltung und Schutz vor NEXO-eigenen Fenstern.
- Gesprächsfenster und Texteingabe aus dem HUD entfernt; Mikrofonstatus und Ent-/Stummschaltung stabilisiert.
- Großansicht, Pause, Zentrieren, Browsernotiz und Fokus-Timer.

Diese Funktionen sind Prototypen. Die sieben Befunde aus Schritt 019 sind im Code behoben und in Schritt 020 getestet. Die Änderungen aus Schritt 021 sind per Regressionstest geprüft; echte Interaktion mit dem Benutzer-PC, Mikrofon und globalem Stop-Hotkey muss noch praktisch geprüft werden.

## Was heute noch nicht funktioniert

- kein in der Cloud betriebener NEXO-Core mit Anmeldung und dauerhaftem Gedächtnis
- kein allgemeiner Wechsel zwischen beliebigen Anbietern/Modellen; Claude, Astra und Mistral sind nicht integriert
- keine Verbindung zu Obsidian, Kalender oder GitHub aus der App
- kein vollständig autonomer Desktopbetrieb ohne ausdrückliche Freigabe; die erste Version arbeitet bewusst mit Bildschirmbild, Einzelaktion, erneuter Beobachtung und Bestätigungen
- keine Handy-App, Push-Nachrichten oder Telefonie
- Browsernotizen werden nicht als Obsidian-Dateien gespeichert

## Technisches Zielbild

Die PC-HUD-App und die Handy-App sprechen mit einem NEXO-Core in der Cloud. Der Core verwaltet Sitzungen, gemeinsamen Kontext, Kosten und Rechte. Ein Modell-Router reicht jede Aufgabe an einen passenden Anbieter-Adapter weiter. Die Werkzeugebene prüft jede Aktion, bevor sie an den lokalen PC-Helfer, den Kalender oder Obsidian weitergegeben wird. Push und Telefonie hängen an der Terminlogik.

## Schritt-für-Schritt-Plan

### Schritt 000 – Projektordnung und Übergabe

Ziel: Jede spätere Person oder KI findet Code, Planung und tatsächlichen Funktionsstand.

Ergebnis: GitHub-Repository, Code/AGENTS.md, Code/STATUS.md, nummerierte Obsidian-Schrittnotizen und ein sauberer Startpunkt.

Fertig, wenn: Ein neues Modell den Status liest und HUD-Funktionen nicht mit geplanten KI-Funktionen verwechselt.

### Schritt 001 – HUD-Grundlage

Ziel: Eine sichtbare Identität für NEXO.

Ergebnis: App-Fenster, Layout, Farben, Partikelkopf, Modi, Großansicht und Testaktionen.

Status: Erledigt.

Fertig, wenn: Die App ohne Internet und ohne KI sichtbar startet.

### Schritt 002 – Gesicht und visuelle Zustände

Ziel: Der Kopf soll wie ein eigener Charakter wirken.

Ergebnis: Punktbasierte Gesichtsform, Lichtmodell, Mausblick, Blinzeln, Mundbewegung und modeabhängige Farben.

Status: Erledigt im Prototyp; Feinschliff bleibt möglich.

Fertig, wenn: Die Gesichtsform in Normal- und Großansicht stabil lesbar ist und keine Referenzgrafik benötigt.

### Schritt 003 – HUD stabilisieren

Ziel: Die Oberfläche für echte Funktionen vorbereiten.

Aufgaben: Komponenten trennen, Statusmeldungen vereinheitlichen, App-Start dokumentieren, Notizen und Timer als Prototyp markieren, Fehlerzustände anzeigen und mobiles Layout prüfen.

Fertig, wenn: Ein Neustart keine falschen „verbunden“-Zustände zeigt und jede Schaltfläche eine klare Rückmeldung gibt.

### Schritt 004 – NEXO-Core als Cloud-Backend

Ziel: Eine zentrale Stelle für Sitzungen, Nutzer, Kontext und Werkzeuge.

Aufgaben: HTTPS-API, Anmeldung, Sitzungs-ID, Kostenlimit, Ereignisprotokoll und gesundes Herunterfahren planen.

Fertig, wenn: Die App eine Testnachricht an den Core senden und eine protokollierte Antwort erhalten kann. Noch kein echtes Modell nötig.

### Schritt 005 – Modell-Router und Adapter

Ziel: NEXO kann das Denkmodell wechseln, ohne dass die App neu gebaut wird.

Aufgaben: Gemeinsames Nachrichtenformat, Adapter für mindestens einen Anbieter, Modellregister, aktives Modell pro Sitzung, dauerhafter Standardmodus, Kostenanzeige und Fallback bei Fehlern.

Befehle: „wechsle zu Claude“, „nutze Astra für diese Aufgabe“, „zurück zum Sparmodus“.

Fertig, wenn: Ein Testdialog nach einem Wechsel denselben NEXO-Kontext behält und die App das aktive Modell sichtbar anzeigt. Ein Anbieter gilt erst nach echtem API-Test als unterstützt.

### Schritt 006 – Sprache

Ziel: NEXO hört zu und spricht.

Aufgaben: Push-to-talk zuerst, danach Aktivierungswort, Cloud-STT, TTS, Abbruch, Mikrofonstatus, Gesprächsgrenzen und Audio-Löschung.

Fertig, wenn: Ein Nutzer den Modus oder das Modell sprechen und eine kurze Antwort hören kann. Keine dauerhafte Raumaufzeichnung.

### Schritt 007 – Lokaler PC-Helfer

Ziel: Die Cloud kann freigegebene Aktionen auf dem Windows-PC ausführen.

Aufgaben: Kleine lokale Bridge, verschlüsselte Geräte-Paarung, Werkzeugkatalog, Aktions-ID, Ergebnis zurückmelden und Stoppschalter.

Erste Werkzeuge: Programm öffnen, Datei suchen und Lautstärke ändern.

Fertig, wenn: NEXO Desktopaktionen über eine lokale Bridge ausführt, jede Aktion nachvollziehbar ist und die Notabschaltung funktioniert. Die automatische Umsetzung aus Schritt 021 ist ein Prototyp; Paarung und Geräteverwaltung folgen später.

### Schritt 008 – Berechtigungen und Bestätigungen

Ziel: NEXO darf helfen, ohne unkontrolliert zu handeln.

Aufgaben: Lesen, direkt ausführbar, Bestätigung nötig und gesperrt; Freigabelisten; Doppelbestätigung für Löschen, Käufe und Nachrichten; Geheimnisse außerhalb von GitHub.

Fertig, wenn: Ein kritischer Testbefehl sicher stoppt, eine harmlose Aktion direkt funktioniert und beides protokolliert wird.

### Schritt 009 – Obsidian und Gedächtnis

Ziel: NEXO kann Wissen und Aufgaben nachvollziehbar verwalten.

Aufgaben: Gemeinsamer Kontext im Backend, lokale Obsidian-Bridge, Notizvorschau, Schreibbestätigung, Quellenangabe und Löschfunktion.

Fertig, wenn: NEXO eine Notiz als Vorschau zeigt, erst nach Bestätigung schreibt und den Pfad nennt.

### Schritt 010 – Kalender

Ziel: Termine lesen und sicher bearbeiten.

Aufgaben: Google- oder Outlook-OAuth, Zeitzonen, Entwurf vor dem Speichern, Änderung, Absage und Duplikatschutz.

Fertig, wenn: „Morgen um 15 Uhr eine Stunde Training“ korrekt als Entwurf erscheint und erst nach Zustimmung gespeichert wird.

### Schritt 011 – Dringende Termine und Push

Ziel: Neue Termine in unter 60 Minuten werden zuverlässig bemerkt.

Aufgaben: Kalender-Webhooks, aktuelle Termindaten nachladen, Ereignis-ID speichern, 10–60-Minuten-Regel, Push, Bestätigung und Wiederholschutz.

Fertig, wenn: Ein Testtermin in 30 Minuten genau eine Push-Nachricht erzeugt.

### Schritt 012 – Handy-App

Ziel: NEXO ist unterwegs erreichbar.

Aufgaben: Anmeldung, Geräte-Paarung, Chat, Sprachbutton, Push-Token, Status und Verlauf.

Fertig, wenn: Eine Push-Nachricht am Handy bestätigt werden kann und diese Bestätigung im Core protokolliert wird.

### Schritt 013 – Telefon-Eskalation

Ziel: Ein dringender Termin kann nach ausbleibender Bestätigung anrufen.

Aufgaben: Telefonieanbieter, Zielnummer, Einwilligung, Zeitlimit, Kostenlimit, maximal ein Anruf pro Termin, Sprachkontext und Abbruch.

Fertig, wenn: NEXO nach Push-Ausbleiben einmal anruft, den Termin nennt und keine Änderung ohne Bestätigung ausführt.

### Schritt 014 – Routinen und Alltag

Ziel: Mehrere sichere Werkzeuge zu einer Routine verbinden.

Beispiele: Gaming-Modus, Tagesübersicht, Downloads sortieren und Backup prüfen.

Fertig, wenn: Jede Routine eine Vorschau, ein Protokoll und einen Abbruch besitzt.

### Schritt 015 – Produktreife

Ziel: NEXO zuverlässig und wartbar betreiben.

Aufgaben: Tests, Monitoring, Datenlöschung, Kostenberichte, Backups, Updateweg, Installer, App-Signierung, Wiederherstellung und Sicherheitsprüfung.

Fertig, wenn: Ein Fehler keine stillen PC-Aktionen verursacht und der komplette Dienst aus dokumentierten Schritten wiederhergestellt werden kann.

## Arbeitsregel für jeden nächsten Schritt

1. Auftrag und Ziel festlegen.
2. Neue Datei in Schritte/ anlegen.
3. Nur den beauftragten Umfang umsetzen.
4. Tests und Grenzen in derselben Schrittnotiz festhalten.
5. Code/STATUS.md aktualisieren.
6. Code und Planung gemeinsam committen.
7. Auf GitHub pushen und den Remote-Stand prüfen.

## Aktueller nächster Schritt

NEXO wird auf die Gemini-Live-API umgebaut (Dauerverbindung wie im Referenzprojekt "Karen", Plan in `C:\Users\levin\.claude\plans\vectorized-purring-swing.md`). Phase A+B (Server-Verbindung, Werkzeugaufrufe, `focus_window`/`click_by_name`) sind fertig und live getestet. Als Nächstes Phase C: die Browser-Seite (Mikrofon-Dauerstream, Wiedergabe) – nur gemeinsam mit dem Nutzer am echten Gerät fertig zu testen. Bis dahin: NEXO neu starten (Serverversion 30, `npm install` im Server-Ordner) und `focus_window`/`click_by_name` im bestehenden Gespräch ausprobieren. [[028 2026-09-20 Live-API Phase A und B]] enthält Details.
