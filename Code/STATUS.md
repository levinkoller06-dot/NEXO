# NEXO – aktueller Projektstand

Stand: 20.09.2026 · Schritt 027

## Aktueller Auftrag und Ergebnis
Nutzer verwies auf sein separates Projekt "Karen" (`C:\Users\levin\Desktop\RL Projekte\Spider man\karen2.0`) als Vorbild für schnelleres/präziseres Klicken, App-Öffnen und Unterbrechen-können; ausdrücklich nur einzelne Techniken übernehmen, nicht den Code oder die HUD/Stimme. Übernommen: (1) UI Automation (`AutomationElement`/`InvokePattern`) als erste, komplett unsichtbare Klick-Strategie vor der Fensternachricht-Methode aus Schritt 025; (2) `search_web`-Werkzeug öffnet eine Google-Suche direkt per URL ohne Bildschirmanalyse; (3) Mikrofon bleibt jetzt während NEXOs Sprachausgabe aktiv – dazwischenreden bricht die aktuelle Antwort sofort ab, statt dahinter zu warten.

## Implementiert
- Startbares Windows-HUD mit dem bestehenden Kopf aus 99.220 3D-Modell-Partikeln, Farbwechsel, Großansicht, Timer und Browsernotizen.
- Cloud-Modelle mit lokaler Oberfläche und lokalem Node-Server: Fokus/Bereit → Gemini; Energie → OpenAI. Modelle/Keys stehen in Server/.env. Kein in der Cloud gehosteter NEXO-Core.
- Sprachaufträge, begrenzter Gesprächsverlauf im Kern, Sprachausgabe über Gemini-TTS (`/api/speech`, Stimme konfigurierbar über `GEMINI_TTS_VOICE`) mit Browser-TTS als Fallback, satzweises Streaming für schnelleren Sprechbeginn, und Mundanimation beim Sprechen.
- Das sichtbare Gesprächsfenster und das Texteingabefeld sind entfernt; der Auftrag läuft über das Mikrofon.
- Separate Zustände für Gesprächswunsch, tatsächliches Mikrofon, laufenden Auftrag und Wiedergabe. Das Mikrofon pausiert vor der Netzwerkanfrage. Client-Warteschlange und serverweite Auftragssperre verhindern parallele PC-Aktionen.
- KI-Werkzeugschleife für beide Anbieter mit mehreren Runden und vollständigen Werkzeugergebnissen. Gemini-Signaturen und IDs bleiben erhalten.
- Desktop-Agent: Bildschirm ansehen, Maus bewegen/klicken/doppelklicken/ziehen/scrollen, einzeiligen Text tippen, Tastenkombinationen und Warten. Jeder Schritt wird vom Modell gewählt; danach erhält es ein neues Bildschirmbild.
- Mausaktionen (`pointer=background`, Standard) versuchen zuerst UI Automation (`InvokePattern`/`SelectionItemPattern`/`TogglePattern` direkt auf dem Element unterm Zeigepunkt aufrufen – keinerlei simuliertes Mausereignis, daher unabhängig von der Fensternachricht-Methode unsichtbar und präzise); ohne passendes UIA-Element Fallback auf Fensternachricht (WM_LBUTTONDOWN/UP etc.); `pointer=visible` bleibt als letzte Rückfalloption für Programme, die beides ignorieren (Spiele, Canvas-Oberflächen).
- `search_web`: öffnet eine Google-Suche direkt per URL im Standardbrowser (`Process.Start`), ohne Adressleiste/Suchfeld zu suchen oder anzuklicken.
- `launch_app`: öffnet die Windows-Suche und tippt den Suchbegriff in einem Schritt (WIN, Text), OHNE automatisch ENTER zu drücken. Das Modell sieht danach das Ergebnis und bestätigt den obersten Treffer bewusst oder bricht mit ESC ab. Weiterhin keine feste App-Liste, keine App-spezifischen Makros, kein taskkill-Werkzeug.
- Gemini-Denkbudget: 0 (aus) für reinen Chat, -1 (dynamisch) sobald PC-Steuerung aktiv ist – Chat bleibt schnell, PC-Aktionen werden überlegter gewählt.
- Mikrofon bleibt während der Sprachausgabe aktiv (nur während der Denkphase stumm); erkennt die Spracherkennung währenddessen einen Satz, bricht die aktuelle Antwort sofort ab (Barge-in) statt sich hinten anzustellen.
- Windows-Helfer über feste lokale PowerShell/C#-Dateien, JSON über stdin statt Shell-Interpolation. Startfehler, Zeitlimits und Abbruch werden behandelt.
- Geschützte lokale API mit Host-/Origin-/Inhaltstypprüfung, Sitzungscookie, Sitzungstoken, Nachrichten-/Body-Limits und Pfadbegrenzung. Fehlerhafte URL-Codierung liefert 400.
- PC-Steuerung wird bei jeder neuen Sitzung automatisch aktiviert. Globale Stopp-Taste Strg+Alt+F12 und Verbindungsüberwachung bleiben als unsichtbare Notabschaltung erhalten.
- Konkrete Bestätigungsanfragen für als sensitive eingestufte Aktionen; Delete und Alt+F4 erzwingen die Freigabe zusätzlich im Code. Nach Freigabe ist eine neue Beobachtung erforderlich.
- Native Eingaben auf NEXOs eigenen Fenstern werden blockiert. Windows-Rechte/UAC werden nicht umgangen.
- Starter wartet auf den Server, berücksichtigt PORT und zeigt Fehler an. Ältere Server werden nur bei eindeutig zum Projekt gehörendem Prozesspfad ersetzt.

## Grenzen
- Ein erster Desktop-Agent, keine Garantie, dass jede beliebige Oberfläche korrekt erkannt/bedient wird.
- `pointer=background` (UI Automation, sonst Fensternachrichten statt echter Maus) funktioniert nicht bei allen Programmen zuverlässig (z.B. Spiele, Canvas-/GPU-gerenderte Oberflächen, manche UWP-Apps, die echte Hardware-Eingaben verlangen). Das Modell soll bei ausbleibender Wirkung mit `pointer=visible` erneut versuchen; automatische Erkennung von Fehlschlägen gibt es nicht.
- Barge-in nutzt dieselbe Spracherkennung wie sonst auch, ohne eigene Echo-Unterdrückung; ob NEXOs eigene Stimme aus dem Lautsprecher (statt Kopfhörer) sich gelegentlich selbst triggert, hängt von Chromiums eingebauter Echo-Unterdrückung ab und ist ungetestet.
- `launch_app` verlässt sich darauf, dass das Modell den Suchtreffer korrekt visuell einschätzt, bevor es ENTER drückt; eine falsche Einschätzung kann weiterhin das falsche Programm öffnen.
- Die Risikoeinstufung beliebiger visueller Aktionen hängt vom Modell ab. Die Bestätigungslogik ist keine vollständige Sandbox.
- Kein echter Desktop-/Mikrofon-/Hotkey-End-to-End-Test in Schritt 021; native Kompilierung, Logik und API-Protokoll wurden geprüft.
- OpenAI meldet aktuell fehlendes API-Guthaben. Dies kann nicht durch eine Codeänderung behoben werden. Fokus/Gemini hat im echten Schnittstellentest funktioniert.
- Screenshots können alle sichtbaren Monitorinhalte enthalten. Sie bleiben bei NEXO im Arbeitsspeicher, maximal zwei im laufenden Modellkontext, und werden an den aktiven Cloud-Anbieter übertragen. Keine lokale Bildarchivierung.
- Pro Auftrag: maximal 24 Modellrunden, 40 Werkzeugaufrufe, vier Minuten. API-Aufrufzeitlimit 45 Sekunden; Freigaben verfallen nach 90 Sekunden. Ein verlorenes HUD entzieht nach spätestens 15 Sekunden ohne Statuskontakt die PC-Freigabe.
- Keine Kamera-Verfolgung, lautgenaue Lippensynchronisation, dauerhafte Erinnerung, Anmeldung über Geräte, Kalenderanbindung, Handy-App, Push oder Telefonie.
- Notizen bleiben browserlokal; kein Schreiben nach Obsidian aus der App.

## Nachweise aus Schritt 027
- 41 Regressionstests erfolgreich (2 neu: `search_web` über DesktopController und Server-Dispatcher).
- Nativer Windows-Helfer mit `-CheckOnly` erfolgreich kompiliert (UI-Automation-Referenzen, `SearchWeb`).
- `AutomationElement.FromPoint` live in PowerShell getestet, Assemblies laden korrekt.
- Barge-in-Zustandslogik live im Browser verifiziert (nicht nur Unit-Test): Mikrofon bleibt beim Sprechen aktiv, bei Erkennung während der Sprachausgabe werden `cancelSpeech()` und `queue.stop()` aufgerufen und der neue Text sofort verarbeitet; während der reinen Denkphase weiterhin ignoriert.
- Kein echter Klicktest von UI Automation oder `search_web` auf echten Programmen (Projektregel: keine echten Desktop-Aktionen als beiläufige Tests).

## Orientierung
Pfade ab Repository-Stamm:
- Code/App/: HUD, api.js, conversation-state.js, conversation.js.
- Code/Server/server.js: HTTP/Sitzungen, Stopp und Aufträge.
- Code/Server/agent.js: Anbieter und Werkzeugschleife.
- Code/Server/desktop.js, desktop.ps1, desktop-native.cs: Windows-Steuerung.
- Code/Server/launch.ps1: Start und Versionsprüfung.
- Code/Tests/regression.test.js: Tests ohne echte Desktop-Aktionen.
- Planung/NEXO-Obsidian-Plan/Schritte/027 2026-09-20 Karen-Techniken - UIA-Klicks, Websuche, Barge-in.md: vollständige Übergabe.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md: langfristiges Ziel.

## Als Nächstes
NEXO neu starten (Serverversion 29). Prüfen: Klicks bewegen den sichtbaren Mauszeiger seltener/nie (UI Automation), "such X bei Google" öffnet sofort eine Google-Suche, man kann NEXO mitten im Sprechen unterbrechen. "Energie" schlägt ohne neues OpenAI-Guthaben weiterhin fehl. Weitere Umsetzung erfolgt nur nach Auftrag.
