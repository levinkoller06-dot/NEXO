# NEXO – aktueller Projektstand

Stand: 20.09.2026 · Schritt 028

## Aktueller Auftrag und Ergebnis
Barge-in aus Schritt 027 funktionierte beim Nutzer gar nicht; er wollte daraufhin ausdrücklich die komplette Karen-Architektur (Google Gemini **Live API**: eine Dauerverbindung statt Text-Chat+separater Sprachausgabe) übernehmen, nicht nur Einzeltechniken. Das ist ein großer Umbau – dafür wurde zuerst ein Plan erstellt und vom Nutzer freigegeben (`EnterPlanMode`/`ExitPlanMode`), dann Phase A+B umgesetzt: **Server-seitige** Live-Verbindung (`Code/Server/live.js`) inkl. Werkzeugaufruf-Weiterleitung, live gegen die echte Gemini-API validiert (inkl. eines kritischen Fixes: der volle Systemprompt ließ das Live-Modell nach Werkzeugaufrufen sonst komplett verstummen). Zusätzlich zwei neue, von Karen inspirierte Werkzeuge: `focus_window` (Fenster gezielt per Titel nach vorne statt blindem ALT+TAB) und `click_by_name` (Bedienelemente wie "Lyrics" per sichtbarem Namen statt Bildschirmkoordinaten treffen).

**Wichtig:** Die Live-Verbindung existiert jetzt nur serverseitig und ist getestet, wird aber vom Browser/HUD noch nicht genutzt – das bisherige, textbasierte Gespräch über `/api/chat`+`/api/speech` läuft unverändert weiter. `focus_window`/`click_by_name`/`search_web` sind aber schon jetzt im bestehenden Werkzeugkatalog nutzbar, auch ohne die neue Architektur.

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
- `focus_window`: holt ein bestimmtes offenes Fenster per (Teil-)Titel gezielt nach vorne (`SetForegroundWindow`), statt blind ALT+TAB zu drücken, das nur zum nächsten Fenster wechselt.
- `click_by_name`: findet ein benanntes Bedienelement (Button/Link/Menüpunkt/Tab/Checkbox/Radio/Listeneintrag) per UI-Automation-Namenssuche in einem Fenster und aktiviert es direkt, ohne Bildschirmkoordinaten zu schätzen.
- `Code/Server/live.js` (neu): baut die Gemini-Live-Setup-Nachricht (Systemprompt, Werkzeuge, Stimme), hält die WebSocket-Verbindung zu Gemini, leitet Werkzeugaufrufe an dieselben Desktop-Funktionen weiter wie der bisherige HTTP-Pfad, injiziert Bildschirmfotos als eigene Inhalts-Turns (nicht als Werkzeugantwort – die sieht das Modell sonst gar nicht). Noch nicht an den Browser angebunden.
- `Code/Server/server.js`: neuer `/ws/voice`-WebSocket-Endpunkt (Paket `ws`, erste Abhängigkeit des Projekts), authentifiziert über das Sitzungscookie (ein WebSocket-Handshake kann keinen eigenen Token-Header senden).
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
- Die Gemini-Live-Verbindung (`live.js`) ist server-seitig fertig und getestet, aber der Browser spricht noch nicht damit – kein hörbarer/spürbarer Unterschied im HUD durch diesen Schritt allein. Das folgt mit der Browser-Seite (Mikrofon-Dauerstream, Wiedergabe).
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

## Nachweise aus Schritt 028
- 51 Regressionstests erfolgreich (10 neu: `live.js`-Setup/Werkzeugaufruf/Bildinjektion/Barge-in-Relay mit einem Fake-WebSocket, `focus_window`, `click_by_name`, `validateWindowTarget`).
- Live-API-Protokoll live gegen die echte Gemini-API verifiziert, nicht nur dokumentiert: passendes Live-Modell gefunden (`gemini-2.5-flash-native-audio-preview-09-2025`), volle Setup-Nachricht inkl. aller 7 TOOL_DEFS akzeptiert, Werkzeugaufruf+Antwort-Zyklus funktioniert, Bildinjektion nach Werkzeugantwort funktioniert (Modell beschreibt einen echten Testschreenshot korrekt), Sitzungs-Wiederaufnahme-Feld akzeptiert.
- Kritischer Fund dabei: der volle Systemprompt (für die alte Text-Schleife geschrieben) lässt das Live-Modell nach Werkzeugaufrufen sonst komplett verstummen – isoliert nachgewiesen und mit einer live-spezifischen Zusatzanweisung behoben.
- Nativer Windows-Helfer mit `-CheckOnly` erfolgreich kompiliert (`FocusWindow`, `ClickByName`).
- Kein echter Test von `focus_window`/`click_by_name` auf echten Programmen (Projektregel); kein Test der Browser-Seite, da noch nicht angebunden.

## Orientierung
Pfade ab Repository-Stamm:
- Code/App/: HUD, api.js, conversation-state.js, conversation.js.
- Code/Server/server.js: HTTP/Sitzungen, Stopp, Aufträge, neuer `/ws/voice`-Upgrade-Handler.
- Code/Server/agent.js: Anbieter, Werkzeugschleife, TOOL_DEFS/SYSTEM_PROMPT (von live.js wiederverwendet).
- Code/Server/live.js: Gemini-Live-Verbindung und Werkzeugaufruf-Weiterleitung (neu, noch nicht an den Browser angebunden).
- Code/Server/desktop.js, desktop.ps1, desktop-native.cs: Windows-Steuerung.
- Code/Server/launch.ps1: Start und Versionsprüfung.
- Code/Server/package.json: erste Abhängigkeit (`ws`) – `npm install` im Server-Ordner nötig.
- Code/Tests/regression.test.js: Tests ohne echte Desktop-Aktionen.
- Planung/NEXO-Obsidian-Plan/Schritte/028 2026-09-20 Live-API Phase A und B.md: vollständige Übergabe.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md: langfristiges Ziel.
- Plan-Datei: C:\Users\levin\.claude\plans\vectorized-purring-swing.md (vollständiger Phasenplan A–D).

## Als Nächstes
Phase C: Browser-Seite (Mikrofon-Dauerstream über AudioWorklet, Wiedergabe, `/ws/voice` anbinden) – das ist der Teil, der sich für den Nutzer tatsächlich ändert und nur mit ihm zusammen am echten Gerät fertig getestet werden kann. Bis dahin: NEXO neu starten (Serverversion 30, `npm install` im Server-Ordner nicht vergessen) und `focus_window`/`click_by_name` im bestehenden Gespräch ausprobieren (z.B. "hol Spotify nach vorne" oder "klicke auf Lyrics in Spotify"). "Energie" schlägt ohne neues OpenAI-Guthaben weiterhin fehl.
