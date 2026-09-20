# NEXO – aktueller Projektstand

Stand: 20.09.2026 · Schritt 026

## Aktueller Auftrag und Ergebnis
Erster echter PC-Steuerungstest nach Schritt 025 zeigte: grundloser Rechtsklick zu Auftragsbeginn, `launch_app` öffnete falsche/nicht angeforderte Programme, dadurch Schrittlimit erreicht. Ursache: das in Schritt 024 global auf 0 gesetzte Gemini-Denkbudget (für schnelle Chat-Antworten gedacht) galt auch für die PC-Steuerung, wo Deliberation nötig ist; zusätzlich drückte `launch_app` blind ENTER ohne das Suchergebnis zu prüfen. Behoben: Denkbudget ist `-1` (dynamisch) sobald PC-Steuerung aktiv ist, `0` bleibt für reinen Chat. `launch_app` tippt nur noch, ENTER ist ein bewusster Folgeschritt nach Sichtprüfung. Systemprompt verbietet ungefragte Zusatz-Aktionen.

## Implementiert
- Startbares Windows-HUD mit dem bestehenden Kopf aus 99.220 3D-Modell-Partikeln, Farbwechsel, Großansicht, Timer und Browsernotizen.
- Cloud-Modelle mit lokaler Oberfläche und lokalem Node-Server: Fokus/Bereit → Gemini; Energie → OpenAI. Modelle/Keys stehen in Server/.env. Kein in der Cloud gehosteter NEXO-Core.
- Sprachaufträge, begrenzter Gesprächsverlauf im Kern, Sprachausgabe über Gemini-TTS (`/api/speech`, Stimme konfigurierbar über `GEMINI_TTS_VOICE`) mit Browser-TTS als Fallback, satzweises Streaming für schnelleren Sprechbeginn, und Mundanimation beim Sprechen.
- Das sichtbare Gesprächsfenster und das Texteingabefeld sind entfernt; der Auftrag läuft über das Mikrofon.
- Separate Zustände für Gesprächswunsch, tatsächliches Mikrofon, laufenden Auftrag und Wiedergabe. Das Mikrofon pausiert vor der Netzwerkanfrage. Client-Warteschlange und serverweite Auftragssperre verhindern parallele PC-Aktionen.
- KI-Werkzeugschleife für beide Anbieter mit mehreren Runden und vollständigen Werkzeugergebnissen. Gemini-Signaturen und IDs bleiben erhalten.
- Desktop-Agent: Bildschirm ansehen, Maus bewegen/klicken/doppelklicken/ziehen/scrollen, einzeiligen Text tippen, Tastenkombinationen und Warten. Jeder Schritt wird vom Modell gewählt; danach erhält es ein neues Bildschirmbild.
- Mausaktionen laufen standardmäßig als `pointer=background` (Fensternachricht ans Zielfenster unter dem Punkt, bewegt den sichtbaren Cursor nicht); `pointer=visible` bleibt als Rückfalloption für Programme, die synthetische Nachrichten ignorieren (Spiele, Canvas-Oberflächen).
- `launch_app`: öffnet die Windows-Suche und tippt den Suchbegriff in einem Schritt (WIN, Text), OHNE automatisch ENTER zu drücken. Das Modell sieht danach das Ergebnis und bestätigt den obersten Treffer bewusst oder bricht mit ESC ab. Weiterhin keine feste App-Liste, keine App-spezifischen Makros, kein taskkill-Werkzeug.
- Gemini-Denkbudget: 0 (aus) für reinen Chat, -1 (dynamisch) sobald PC-Steuerung aktiv ist – Chat bleibt schnell, PC-Aktionen werden überlegter gewählt.
- Windows-Helfer über feste lokale PowerShell/C#-Dateien, JSON über stdin statt Shell-Interpolation. Startfehler, Zeitlimits und Abbruch werden behandelt.
- Geschützte lokale API mit Host-/Origin-/Inhaltstypprüfung, Sitzungscookie, Sitzungstoken, Nachrichten-/Body-Limits und Pfadbegrenzung. Fehlerhafte URL-Codierung liefert 400.
- PC-Steuerung wird bei jeder neuen Sitzung automatisch aktiviert. Globale Stopp-Taste Strg+Alt+F12 und Verbindungsüberwachung bleiben als unsichtbare Notabschaltung erhalten.
- Konkrete Bestätigungsanfragen für als sensitive eingestufte Aktionen; Delete und Alt+F4 erzwingen die Freigabe zusätzlich im Code. Nach Freigabe ist eine neue Beobachtung erforderlich.
- Native Eingaben auf NEXOs eigenen Fenstern werden blockiert. Windows-Rechte/UAC werden nicht umgangen.
- Starter wartet auf den Server, berücksichtigt PORT und zeigt Fehler an. Ältere Server werden nur bei eindeutig zum Projekt gehörendem Prozesspfad ersetzt.

## Grenzen
- Ein erster Desktop-Agent, keine Garantie, dass jede beliebige Oberfläche korrekt erkannt/bedient wird.
- `pointer=background` (Fensternachrichten statt echter Maus) funktioniert nicht bei allen Programmen zuverlässig (z.B. Spiele, Canvas-/GPU-gerenderte Oberflächen, manche UWP-Apps, die echte Hardware-Eingaben verlangen). Das Modell soll bei ausbleibender Wirkung mit `pointer=visible` erneut versuchen; automatische Erkennung von Fehlschlägen gibt es nicht.
- `launch_app` verlässt sich darauf, dass das Modell den Suchtreffer korrekt visuell einschätzt, bevor es ENTER drückt; eine falsche Einschätzung kann weiterhin das falsche Programm öffnen.
- Die Risikoeinstufung beliebiger visueller Aktionen hängt vom Modell ab. Die Bestätigungslogik ist keine vollständige Sandbox.
- Kein echter Desktop-/Mikrofon-/Hotkey-End-to-End-Test in Schritt 021; native Kompilierung, Logik und API-Protokoll wurden geprüft.
- OpenAI meldet aktuell fehlendes API-Guthaben. Dies kann nicht durch eine Codeänderung behoben werden. Fokus/Gemini hat im echten Schnittstellentest funktioniert.
- Screenshots können alle sichtbaren Monitorinhalte enthalten. Sie bleiben bei NEXO im Arbeitsspeicher, maximal zwei im laufenden Modellkontext, und werden an den aktiven Cloud-Anbieter übertragen. Keine lokale Bildarchivierung.
- Pro Auftrag: maximal 24 Modellrunden, 40 Werkzeugaufrufe, vier Minuten. API-Aufrufzeitlimit 45 Sekunden; Freigaben verfallen nach 90 Sekunden. Ein verlorenes HUD entzieht nach spätestens 15 Sekunden ohne Statuskontakt die PC-Freigabe.
- Keine Kamera-Verfolgung, lautgenaue Lippensynchronisation, dauerhafte Erinnerung, Anmeldung über Geräte, Kalenderanbindung, Handy-App, Push oder Telefonie.
- Notizen bleiben browserlokal; kein Schreiben nach Obsidian aus der App.

## Nachweise aus Schritt 026
- 40 Regressionstests erfolgreich (1 neu: Denkbudget 0 vs. -1 je nach `controlEnabled`).
- Nativer Windows-Helfer mit `-CheckOnly` erfolgreich kompiliert (ENTER-Druck aus `LaunchApp` entfernt).
- `thinkingBudget: -1` live gegen die echte Gemini-API getestet (200 OK, korrekte Antwort).
- Kein echter Klicktest der neuen Prompt-Regeln auf echten Programmen (Projektregel: keine echten Desktop-Aktionen als beiläufige Tests); ob Rechtsklick-/Fremd-App-Problem vollständig verschwinden, prüft der Nutzer im echten Gebrauch.

## Orientierung
Pfade ab Repository-Stamm:
- Code/App/: HUD, api.js, conversation-state.js, conversation.js.
- Code/Server/server.js: HTTP/Sitzungen, Stopp und Aufträge.
- Code/Server/agent.js: Anbieter und Werkzeugschleife.
- Code/Server/desktop.js, desktop.ps1, desktop-native.cs: Windows-Steuerung.
- Code/Server/launch.ps1: Start und Versionsprüfung.
- Code/Tests/regression.test.js: Tests ohne echte Desktop-Aktionen.
- Planung/NEXO-Obsidian-Plan/Schritte/026 2026-09-20 Denkbudget fuer PC-Steuerung und sicheres launch_app.md: vollständige Übergabe.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md: langfristiges Ziel.

## Als Nächstes
NEXO neu starten (Serverversion 28), denselben PC-Auftrag wie zuvor wiederholen (z.B. "öffne Firefox und Apple Music"). Prüfen: keine ungefragten Zusatzprogramme, kein grundloser Rechtsklick, `launch_app` bricht bei falschem Treffer sichtbar ab statt etwas Falsches zu öffnen. "Energie" schlägt ohne neues OpenAI-Guthaben weiterhin fehl. Weitere Umsetzung erfolgt nur nach Auftrag.
