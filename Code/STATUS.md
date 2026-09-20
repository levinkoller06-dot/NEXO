# NEXO – aktueller Projektstand

Stand: 20.09.2026 · Schritt 025

## Aktueller Auftrag und Ergebnis
Nach Schritt 024 blieben zwei Regressionen: die Kopfbewegung folgte der Maus nicht mehr (durch Entfernen des Pause-Knopfs blieb `prefers-reduced-motion` ohne Gegenschalter hängen, falls Windows das anfordert) und die Stimme wirkte beim Nutzer wieder wie Standard (Ursache: Diagnose lief gegen den echten, laufenden Server – dort war Charon korrekt konfiguriert; Klärung läuft). Zusätzlich zwei neue Fähigkeiten auf Nutzerwunsch: `launch_app` öffnet Programme in einem Schritt (WIN, Text, Enter) statt über mehrere Beobachtungsrunden, und Mausaktionen bewegen den sichtbaren Zeiger jetzt standardmäßig NICHT mehr (Klicks per Fensternachricht ans Zielfenster), mit Rückfalloption `pointer=visible`.

## Bekannte Nebenwirkung dieser Sitzung
Eine Diagnose-Sitzung gegen den laufenden Server hat `desktop.disable()` auf der aktiven Nutzer-Sitzung ausgelöst (jede neue `/api/session` deaktiviert eine bestehende PC-Steuerung). NEXO-Fenster nach diesem Update einmal neu laden/starten.

## Implementiert
- Startbares Windows-HUD mit dem bestehenden Kopf aus 99.220 3D-Modell-Partikeln, Farbwechsel, Großansicht, Timer und Browsernotizen.
- Cloud-Modelle mit lokaler Oberfläche und lokalem Node-Server: Fokus/Bereit → Gemini; Energie → OpenAI. Modelle/Keys stehen in Server/.env. Kein in der Cloud gehosteter NEXO-Core.
- Sprachaufträge, begrenzter Gesprächsverlauf im Kern, Sprachausgabe über Gemini-TTS (`/api/speech`, Stimme konfigurierbar über `GEMINI_TTS_VOICE`) mit Browser-TTS als Fallback, satzweises Streaming für schnelleren Sprechbeginn, und Mundanimation beim Sprechen.
- Das sichtbare Gesprächsfenster und das Texteingabefeld sind entfernt; der Auftrag läuft über das Mikrofon.
- Separate Zustände für Gesprächswunsch, tatsächliches Mikrofon, laufenden Auftrag und Wiedergabe. Das Mikrofon pausiert vor der Netzwerkanfrage. Client-Warteschlange und serverweite Auftragssperre verhindern parallele PC-Aktionen.
- KI-Werkzeugschleife für beide Anbieter mit mehreren Runden und vollständigen Werkzeugergebnissen. Gemini-Signaturen und IDs bleiben erhalten.
- Desktop-Agent: Bildschirm ansehen, Maus bewegen/klicken/doppelklicken/ziehen/scrollen, einzeiligen Text tippen, Tastenkombinationen und Warten. Jeder Schritt wird vom Modell gewählt; danach erhält es ein neues Bildschirmbild.
- Mausaktionen laufen standardmäßig als `pointer=background` (Fensternachricht ans Zielfenster unter dem Punkt, bewegt den sichtbaren Cursor nicht); `pointer=visible` bleibt als Rückfalloption für Programme, die synthetische Nachrichten ignorieren (Spiele, Canvas-Oberflächen).
- `launch_app`: öffnet ein Programm/Datei über die Windows-Suche in einem Schritt (WIN, Text, Enter) statt mehrerer Beobachtungsrunden. Weiterhin keine feste App-Liste, keine App-spezifischen Makros, kein taskkill-Werkzeug.
- Windows-Helfer über feste lokale PowerShell/C#-Dateien, JSON über stdin statt Shell-Interpolation. Startfehler, Zeitlimits und Abbruch werden behandelt.
- Geschützte lokale API mit Host-/Origin-/Inhaltstypprüfung, Sitzungscookie, Sitzungstoken, Nachrichten-/Body-Limits und Pfadbegrenzung. Fehlerhafte URL-Codierung liefert 400.
- PC-Steuerung wird bei jeder neuen Sitzung automatisch aktiviert. Globale Stopp-Taste Strg+Alt+F12 und Verbindungsüberwachung bleiben als unsichtbare Notabschaltung erhalten.
- Konkrete Bestätigungsanfragen für als sensitive eingestufte Aktionen; Delete und Alt+F4 erzwingen die Freigabe zusätzlich im Code. Nach Freigabe ist eine neue Beobachtung erforderlich.
- Native Eingaben auf NEXOs eigenen Fenstern werden blockiert. Windows-Rechte/UAC werden nicht umgangen.
- Starter wartet auf den Server, berücksichtigt PORT und zeigt Fehler an. Ältere Server werden nur bei eindeutig zum Projekt gehörendem Prozesspfad ersetzt.

## Grenzen
- Ein erster Desktop-Agent, keine Garantie, dass jede beliebige Oberfläche korrekt erkannt/bedient wird.
- `pointer=background` (Fensternachrichten statt echter Maus) funktioniert nicht bei allen Programmen zuverlässig (z.B. Spiele, Canvas-/GPU-gerenderte Oberflächen, manche UWP-Apps, die echte Hardware-Eingaben verlangen). Das Modell soll bei ausbleibender Wirkung mit `pointer=visible` erneut versuchen; automatische Erkennung von Fehlschlägen gibt es nicht.
- `launch_app` prüft nicht, ob die Windows-Suche tatsächlich erschienen ist (keine Zwischenbeobachtung); ein anschließendes `computer_observe` zeigt das Ergebnis.
- Die Risikoeinstufung beliebiger visueller Aktionen hängt vom Modell ab. Die Bestätigungslogik ist keine vollständige Sandbox.
- Kein echter Desktop-/Mikrofon-/Hotkey-End-to-End-Test in Schritt 021; native Kompilierung, Logik und API-Protokoll wurden geprüft.
- OpenAI meldet aktuell fehlendes API-Guthaben. Dies kann nicht durch eine Codeänderung behoben werden. Fokus/Gemini hat im echten Schnittstellentest funktioniert.
- Screenshots können alle sichtbaren Monitorinhalte enthalten. Sie bleiben bei NEXO im Arbeitsspeicher, maximal zwei im laufenden Modellkontext, und werden an den aktiven Cloud-Anbieter übertragen. Keine lokale Bildarchivierung.
- Pro Auftrag: maximal 24 Modellrunden, 40 Werkzeugaufrufe, vier Minuten. API-Aufrufzeitlimit 45 Sekunden; Freigaben verfallen nach 90 Sekunden. Ein verlorenes HUD entzieht nach spätestens 15 Sekunden ohne Statuskontakt die PC-Freigabe.
- Keine Kamera-Verfolgung, lautgenaue Lippensynchronisation, dauerhafte Erinnerung, Anmeldung über Geräte, Kalenderanbindung, Handy-App, Push oder Telefonie.
- Notizen bleiben browserlokal; kein Schreiben nach Obsidian aus der App.

## Nachweise aus Schritt 025
- 39 Regressionstests erfolgreich (5 neu: Pointer-Default, `validateLaunch`, `launch_app`-Fluss über DesktopController und über den Server-Dispatcher).
- Nativer Windows-Helfer mit `-CheckOnly` erfolgreich kompiliert (neue PostMessage-Aufrufe, `LaunchApp`).
- Motion-Bug identifiziert: `app.js` band Bewegung an `prefers-reduced-motion`, ohne Gegenschalter nach Entfernen des Pause-Knopfs; behoben, Kopf folgt jetzt immer der Maus.
- Direkter `/api/speech`-Aufruf gegen den echten, laufenden Server bestätigt Charon-Stimme im Code korrekt konfiguriert; Diskrepanz zur Nutzerwahrnehmung wird mit Hörprobe geklärt.
- Kein echter Klick-/Tastentest von `pointer=background` oder `launch_app` auf echten Programmen (Projektregel: keine echten Desktop-Aktionen als beiläufige Tests).

## Orientierung
Pfade ab Repository-Stamm:
- Code/App/: HUD, api.js, conversation-state.js, conversation.js.
- Code/Server/server.js: HTTP/Sitzungen, Stopp und Aufträge.
- Code/Server/agent.js: Anbieter und Werkzeugschleife.
- Code/Server/desktop.js, desktop.ps1, desktop-native.cs: Windows-Steuerung.
- Code/Server/launch.ps1: Start und Versionsprüfung.
- Code/Tests/regression.test.js: Tests ohne echte Desktop-Aktionen.
- Planung/NEXO-Obsidian-Plan/Schritte/025 2026-09-20 Bewegungs-Fix, Stimmklaerung und unsichtbare Maus.md: vollständige Übergabe.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md: langfristiges Ziel.

## Als Nächstes
NEXO-Fenster schließen und über NEXO starten.cmd neu starten (Serverversion 27). Prüfen: Kopf folgt wieder der Maus, Stimme klingt männlich (Charon), ein PC-Auftrag mit `launch_app` (z.B. "öffne den Taschenrechner") und ein normaler Klick-Auftrag zeigen, ob sich der sichtbare Mauszeiger dabei noch bewegt. "Energie" schlägt ohne neues OpenAI-Guthaben weiterhin fehl. Weitere Umsetzung erfolgt nur nach Auftrag.
