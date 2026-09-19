# Schritt 020 – KI-Desktopsteuerung und Fehlerbehebung

Datum: 20.09.2026 · Art: Umsetzung
Ausgangspunkt: 275fd69, Analyse in Schritt 019.

## Auftrag
Alle sieben gefundenen Probleme beheben und NEXO so erweitern, dass die KI anhand des Bildschirms selbst Maus- und Tastaturaktionen wählt. Feste Routinen zum Öffnen einzelner Apps sollten entfallen.

## Was geändert wurde
- Die feste Programmliste, open_app, close_app, web_search und taskkill wurden entfernt.
- Allgemeine Werkzeuge computer_observe und computer_action eingeführt. Die KI wählt damit Klicks, Doppelklicks, Bewegungen, Ziehen, Scrollen, Text, Tasten und Warten anhand von Bildern.
- Windows-Bridge mit System.Drawing/User32/SendInput, DPI-Berücksichtigung, Koordinatenumrechnung für mehrere Monitore, Eingabevalidierung, Fehlerbehandlung und Abbruch.
- Screenshots ausschließlich im Arbeitsspeicher; neue frameId nach jeder Aktion. Alte Bilder dürfen keine weiteren Klicks auslösen. Maximal zwei Bildbeobachtungen bleiben im Modellkontext.
- Sitzungsschalter im HUD erklärt die Übertragung sichtbarer Bildschirminhalte an OpenAI/Gemini. Der Schalter aktiviert die globale Stopp-Überwachung; allein das Einschalten erzeugt kein Bild.
- Stopp im HUD/Bestätigungsdialog sowie Strg+Alt+F12; jeder Stopp entzieht die PC-Freigabe. Verlust des HUD-Kontakts führt ebenfalls zum Abbruch.
- Sensitive Schritte werden im HUD mit konkreter Aktion, Beschreibung und Vorschau angezeigt; Freigabe ist einmalig und an Aktion/Fenstertitel gebunden. Neue Beobachtung nach Freigabe; NEXO darf keine eigenen Freigaben bedienen.
- Mehrstufige Werkzeugschleifen für Gemini/OpenAI, begrenzte Laufzeit/Aktionszahl, keine automatische Wiederholung fehlgeschlagener Netzwerkrequests.
- Textaufträge als Alternative zum Mikrofon und Anzeige der letzten KI-Schritte.
- Verlässlicherer versteckter Starter mit Bereitschaftsprüfung und sichtbaren Startfehlermeldungen.

## Behebung der Befunde aus Schritt 019
- **R1:** Kein erzwungenes Prozessbeenden mehr. Schließen erfolgt über die Oberfläche, Alt+F4 verlangt eine Bestätigung.
- **R2:** Alte direkte App-Starts entfernt; der neue native Helfer behandelt spawn/error, Prozessende, stdin-Fehler und Zeitlimit. Ein fehlendes Programm beendet den Server nicht.
- **R3:** Origin/Host, JSON-Inhaltstyp, Sitzungstoken und HttpOnly/SameSite-Cookie geprüft. Fremde Anfragen werden vor Modell-/Werkzeugaufrufen abgewiesen. API weiterhin nur an 127.0.0.1 gebunden.
- **R4:** Mikrofonsteuerung als eigener Zustandsautomat; Aus/Ein und verzögerte onend-Ereignisse korrekt behandelt.
- **R5:** Mikrofon vor der KI-Anfrage pausiert, Aufträge seriell verarbeitet, zusätzlicher serverweiter Schutz vor parallelen Aktionen.
- **R6:** Alle Gemini-/OpenAI-Aufrufe einer Antwort werden verarbeitet und beantwortet; weitere Runden möglich. Gemini-IDs, thoughtSignature und sämtliche Originalantwortteile bleiben erhalten.
- **R7:** Ungültige URL-Codierung wird abgefangen und mit HTTP 400 beantwortet. Statische Dateien zusätzlich gegen Verlassen des App-Verzeichnisses abgesichert.

## Prüfungen
- 30 automatisierte Regressionstests bestanden (Code/Tests/regression.test.js), ohne echte Maus-/Tastatureingaben oder Bildschirmaufnahmen.
- Native C#-Bridge über desktop.ps1 -CheckOnly erfolgreich kompiliert; INPUT-Größe 40 Byte bestätigt.
- launch.ps1 -CheckOnly: Node verfügbar, konfigurierter Port 4790.
- Echter Gemini-Test mit einem künstlichen 1×1-PNG statt eines Desktop-Bildes: Beobachtungswerkzeug angefordert, Bild übertragen, set_mode ausgeführt (simulierter Effekt), Abschlussantwort OK.
- Dabei eine reale Gemini-Schemaabweichung gefunden und behoben: additionalProperties wird vom eingesetzten parameters-Schema nicht akzeptiert und für diesen Anbieter entfernt. Der Server validiert Parameter weiterhin selbst.
- Echter OpenAI-Test scheiterte an fehlendem Kontoguthaben (HTTP 429). OpenAI-Werkzeug-/Bildprotokoll ist mit simulierten Antworten geprüft; kein erfolgreicher Live-Dialog über dieses Konto behauptet.
- Syntaxprüfungen und Git-Diff erfolgreich.

## Grenzen und verbleibende Aufgaben
- Die vollständige Kette mit echtem Windows-Bildschirm, sichtbaren Klicks, Mikrofon, globalem Tastendruck und App-Neustart wurde in dieser Sitzung nicht live durchgespielt. Die Native-Bridge wurde kompiliert, Aktionen aber nur mit Testgeräten geprüft.
- Der Desktop-Agent ist implementiert, seine Zuverlässigkeit bei beliebigen Programmen muss praktisch erprobt werden. Kein Versprechen, dass jede Aufgabe automatisch gelingt.
- Der Nutzer muss die PC-Freigabe im HUD einschalten. Diese Freigabe erlaubt Screenshotübertragung an den aktiven Anbieter.
- Bei visuellen Aktionen klassifiziert die KI selbst, ob eine Bestätigung erforderlich ist. Zusätzliche feste Prüfungen decken einzelne Tastenkombinationen ab; daraus folgt keine vollständige Erkennung aller riskanten UI-Aktionen.
- Betriebssystemrechte gelten weiterhin; keine UAC-Umgehung. Neue Aufgaben bleiben durch Zeit-/Schrittlimits begrenzt.
- OpenAI-Guthaben ist eine externe Kontovoraussetzung. Für den ersten Versuch Fokus/Gemini verwenden.
- Kalender, Handy-App, Push/Anrufe, dauerhaftes Gedächtnis und Obsidian-Schreibzugriff bleiben unimplementiert.

## Betroffene Dateien
- Code/Server/server.js, agent.js, desktop.js, desktop-native.cs, desktop.ps1, launch.ps1, start-hidden.vbs.
- Code/NEXO starten.cmd.
- Code/App/api.js, conversation-state.js, conversation.js, app.js, index.html, style.css, README.md.
- Code/Tests/regression.test.js.
- Code/AGENTS.md, Code/README.md, Code/STATUS.md.
- Obsidian-Übersicht, Zielplan und diese neue Schrittnotiz.

## Technische Quellen
Die Anbieteradapter orientieren sich an den offiziellen Beschreibungen für [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling), [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling) und [Gemini-Bildeingaben](https://ai.google.dev/gemini-api/docs/image-understanding). Die Windows-Eingabe verwendet [SendInput](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput); die dort beschriebenen Betriebssystemgrenzen bleiben bestehen.

## Nächster möglicher Schritt
Einen einfachen PC-Auftrag im Fokus-Modus testen, z.B. „Öffne den Editor und schreibe Hallo NEXO, ohne die Datei zu speichern“. Verhalten, Stopp und Bestätigungen prüfen; erst anschließend komplexere Aufgaben.
