# NEXO – aktueller Projektstand

Stand: 25.09.2026 · Schritt 037

## Aktueller Auftrag und Ergebnis
Schritt 037 schaltet den Browser endlich auf die schon länger server-seitig fertige Gemini-Live-Verbindung um (Phase C des Umbaus, siehe `C:\Users\levin\.claude\plans\vectorized-purring-swing.md`): Mikrofon streamt jetzt durchgehend als 16kHz-PCM über `/ws/voice`, Antwort-Audio kommt in Echtzeit-Häppchen zurück und wird lückenlos abgespielt, Unterbrechen ist ein serverseitig erkanntes `interrupted`-Ereignis von Gemini selbst statt eines client-seitigen Rateversuchs über eine zweite Spracherkennung. Grund: die alte Browser-Spracherkennung erkannte Unterbrechungen unzuverlässig, und das Modell behauptete gelegentlich einen Erfolg (z.B. "Wiedergabe läuft"), ohne das im Screenshot wirklich zu bestätigen – Letzteres ist jetzt im Systemprompt ausdrücklich verboten. Zusätzlich muss das Modell für jedes benannte Bedienelement zuerst `click_by_name` versuchen statt Koordinaten zu raten.

Sprachausgabe läuft jetzt über die Live-Verbindung (Gemini erzeugt Audio direkt im Gespräch, kein separater `/api/speech`-Aufruf mehr für den Live-Pfad; der alte HTTP-Pfad bleibt im Code, wird aber vom Browser nicht mehr angesprochen). Die Mundöffnung folgt weiterhin der Audioenergie, jetzt aus dem Live-Audio-Player statt dem alten Blob-Player.

Geprüft: 66 automatisierte Tests. **Nicht getestet: der komplette neue Browser-Audio-Pfad (Mikrofon-Streaming, Wiedergabe, Unterbrechen) auf echtem Gerät** – das kann nur der Nutzer selbst beurteilen, es gibt kein echtes Mikrofon/keine echten Lautsprecher in der Entwicklungsumgebung.

## Implementiert
- Startbares Windows-HUD mit dem bestehenden Kopf aus 99.220 3D-Modell-Partikeln, Farbwechsel, Großansicht, Timer und Browsernotizen.
- Cloud-Modelle mit lokaler Oberfläche und lokalem Node-Server: Fokus/Bereit → Gemini; Energie → OpenAI. Modelle/Keys stehen in Server/.env. Kein in der Cloud gehosteter NEXO-Core.
- Sprachaufträge, begrenzter Gesprächsverlauf im Kern, Sprachausgabe über Gemini-TTS (`/api/speech`, Stimme konfigurierbar über `GEMINI_TTS_VOICE`) ohne Ersatzstimme, mit einem Audiopaket pro Antwort und signalgesteuerter Mundanimation.
- Das sichtbare Gesprächsfenster und das Texteingabefeld sind entfernt; der Auftrag läuft über das Mikrofon.
- Separate Zustände für Gesprächswunsch, tatsächliches Mikrofon, laufenden Auftrag und Wiedergabe. Das Mikrofon pausiert vor der Netzwerkanfrage. Client-Warteschlange und serverweite Auftragssperre verhindern parallele PC-Aktionen.
- KI-Werkzeugschleife für beide Anbieter mit mehreren Runden und vollständigen Werkzeugergebnissen. Gemini-Signaturen und IDs bleiben erhalten.
- Desktop-Agent: Bildschirm ansehen, Maus bewegen/klicken/doppelklicken/ziehen/scrollen, einzeiligen Text tippen, Tastenkombinationen und Warten. Jeder Schritt wird vom Modell gewählt; danach erhält es ein neues Bildschirmbild.
- Mausaktionen (`pointer=background`, Standard) versuchen zuerst UI Automation (`InvokePattern`/`SelectionItemPattern`/`TogglePattern` direkt auf dem Element unterm Zeigepunkt aufrufen – keinerlei simuliertes Mausereignis, daher unabhängig von der Fensternachricht-Methode unsichtbar und präzise); ohne passendes UIA-Element Fallback auf Fensternachricht (WM_LBUTTONDOWN/UP etc.); `pointer=visible` bleibt als letzte Rückfalloption für Programme, die beides ignorieren (Spiele, Canvas-Oberflächen).
- `search_web`: öffnet eine Google-Suche direkt per URL im Standardbrowser (`Process.Start`), ohne Adressleiste/Suchfeld zu suchen oder anzuklicken.
- `focus_window`: holt ein bestimmtes offenes Fenster per (Teil-)Titel gezielt nach vorne (`SetForegroundWindow`), statt blind ALT+TAB zu drücken, das nur zum nächsten Fenster wechselt.
- `click_by_name`: findet ein benanntes Bedienelement (Button/Link/Menüpunkt/Tab/Checkbox/Radio/Listeneintrag) per UI-Automation-Namenssuche in einem Fenster und aktiviert es direkt, ohne Bildschirmkoordinaten zu schätzen. Seit Schritt 035: bei mehreren gleich/ähnlich benannten Treffern entscheidet Jev (TypeSafe, über OpenRouter) per Choice-Frage, welcher gemeint ist, statt stillschweigend den ersten Treffer zu nehmen; ohne Jev-Zugang oder bei Fehlern automatischer Rückfall auf den ersten Treffer (altes Verhalten).
- `Code/Server/live.js`: baut die Gemini-Live-Setup-Nachricht (Systemprompt, Werkzeuge, Stimme), hält die WebSocket-Verbindung zu Gemini, leitet Werkzeugaufrufe an dieselben Desktop-Funktionen weiter wie der bisherige HTTP-Pfad, injiziert Bildschirmfotos als eigene Inhalts-Turns (nicht als Werkzeugantwort – die sieht das Modell sonst gar nicht).
- `Code/Server/server.js`: `/ws/voice`-WebSocket-Endpunkt (Paket `ws`), authentifiziert über das Sitzungscookie (ein WebSocket-Handshake kann keinen eigenen Token-Header senden). Seit Schritt 037 vom Browser tatsächlich genutzt.
- `Code/App/audio-worklet.js` (neu, Schritt 037): `AudioWorkletProcessor`, der Mikrofon-Samples auf 16kHz/16-bit-PCM herunterrechnet und in ~20ms-Häppchen an den Hauptthread postet.
- `Code/App/live-audio-player.js` (neu, Schritt 037): spielt eingehende 24kHz-PCM-Häppchen lückenlos hintereinander ab (`AudioBufferSourceNode`-Kette mit exaktem Anschluss-Timing), `stop()` verwirft bei Unterbrechung sofort alles Geplante. Analyser-basierte `level()`-Methode wie beim alten `speech-player.js`, damit die Mundanimation unverändert bleibt.
- `Code/App/conversation.js`: nutzt jetzt `/ws/voice` durchgehend, sobald das Mikrofon an ist – kein `SpeechRecognition`/`MediaRecorder`, kein `/api/chat`/`/api/speech` mehr im aktiven Pfad. `Code/App/conversation-state.js` und `Code/App/speech-player.js` sind dadurch unbenutzt, aber (noch) nicht gelöscht (bewusst aufgeschoben, siehe Phase D im Plan).
- `launch_app`: direkter Windows-Start über apps.ps1. Kein Suchmenü, kein Enter, keine Mausklicks; Erfolg bedeutet nur übergebener Startauftrag. Unbekannte/mehrdeutige Apps liefern Fehler.
- `web_answer` (neu, Schritt 029): beantwortet Wissens-/Nachrichtenfragen über Geminis eingebautes `google_search`-Grounding mit einer kurzen Textantwort zum Vorlesen – öffnet nichts, im Unterschied zu `search_web`. Läuft als eigener, direkter Gemini-Aufruf (kann nicht mit eigenen Werkzeugdefinitionen in derselben Anfrage kombiniert werden) und ist unabhängig von aktivierter PC-Steuerung immer verfügbar. Live gegen die echte API getestet.
- Gemini-Denkbudget: 0 (aus), bis in der laufenden Anfrage tatsächlich ein Bildschirm-/Klick-Werkzeug benutzt wurde (`computer_observe`, `computer_action`, `click_by_name`, `focus_window`); erst danach schaltet die Runde auf -1 (dynamisch) um. Reiner Chat und einzelne deterministische Werkzeuge (`launch_app`, `set_mode`, `web_answer`) bleiben dadurch durchgehend schnell (Schritt 032).
- Mikrofon streamt seit Schritt 037 durchgehend, solange es an ist – keine eigene Denkphasen-Stummschaltung mehr nötig, weil Gemini Live selbst erkennt, wenn der Nutzer währenddessen redet, und ein `interrupted`-Ereignis schickt; der Browser bricht die laufende Wiedergabe darauf sofort ab. Vorher (Schritt 027) lief das über eine zweite, client-seitige Spracherkennung während der Wiedergabe – laut Nutzer unzuverlässig, jetzt ersetzt.
- Windows-Helfer über feste lokale PowerShell/C#-Dateien, JSON über stdin statt Shell-Interpolation. Startfehler, Zeitlimits und Abbruch werden behandelt.
- Geschützte lokale API mit Host-/Origin-/Inhaltstypprüfung, Sitzungscookie, Sitzungstoken, Nachrichten-/Body-Limits und Pfadbegrenzung. Fehlerhafte URL-Codierung liefert 400.
- PC-Steuerung wird bei jeder neuen Sitzung automatisch aktiviert. Globale Stopp-Taste Strg+Alt+F12 und Verbindungsüberwachung bleiben als unsichtbare Notabschaltung erhalten.
- `risk=sensitive` betrifft nur noch Käufe/Zahlungen/Bestellungen, Installationen und Systemeinstellungen (z.B. Sicherheits-/Antivirus-Software); Löschen/Schließen/Absenden/Uploads sind routine (Schritt 032). Seit Schritt 033 gibt es dafür KEIN HUD-Bestätigungsfenster mehr (das alte Freigabe-Popup samt `/api/approve` wurde entfernt, die "identische Aktion mit neuer frameId erneut anfordern"-Logik war fragil und lief bei kleinsten Abweichungen in eine Endlosschleife). Stattdessen fragt NEXO für sensible Aktionen ausdrücklich in der gesprochenen Antwort nach ("... ja oder nein?") und wartet auf die nächste Nutzeräußerung, bevor es das Werkzeug aufruft – reine Prompt-Disziplin, kein Code-Gate mehr.
- Native Eingaben auf NEXOs eigenen Fenstern werden blockiert. Windows-Rechte/UAC werden nicht umgangen.
- Starter wartet auf den Server, berücksichtigt PORT und zeigt Fehler an. Ältere Server werden nur bei eindeutig zum Projekt gehörendem Prozesspfad ersetzt.

## Grenzen
- **Der komplette Browser-Audio-Pfad aus Schritt 037 (Mikrofon-Streaming, Wiedergabe, Unterbrechen) ist ungetestet auf echtem Gerät** – es gibt kein echtes Mikrofon/keine echten Lautsprecher in der Entwicklungsumgebung. Die Bausteine sind einzeln mit Fake-Objekten getestet (66 Tests), aber ob es im echten Edge-Fenster tatsächlich funktioniert, weiß nur der Nutzer nach dem ersten echten Versuch.
- Ob Barge-in bei Lautsprecher- (statt Kopfhörer-)Nutzung zuverlässig funktioniert, hängt jetzt von Geminis eigener Echo-/VAD-Erkennung ab, nicht mehr von NEXOs eigenem Code – laut Referenzprojekt "Karen" serverseitig gelöst, aber auf dem echten Gerät zu bestätigen.
- Ein erster Desktop-Agent, keine Garantie, dass jede beliebige Oberfläche korrekt erkannt/bedient wird.
- `pointer=background` (UI Automation, sonst Fensternachrichten statt echter Maus) funktioniert nicht bei allen Programmen zuverlässig (z.B. Spiele, Canvas-/GPU-gerenderte Oberflächen, manche UWP-Apps, die echte Hardware-Eingaben verlangen). Das Modell soll bei ausbleibender Wirkung mit `pointer=visible` erneut versuchen; automatische Erkennung von Fehlschlägen gibt es nicht.
- `launch_app` verlässt sich darauf, dass das Modell den Suchtreffer korrekt visuell einschätzt, bevor es ENTER drückt; eine falsche Einschätzung kann weiterhin das falsche Programm öffnen.
- Die Risikoeinstufung beliebiger visueller Aktionen hängt vom Modell ab. Die Bestätigungslogik ist keine vollständige Sandbox. Seit Schritt 032 laufen Löschen, Schließen von Programmen (auch mit möglichem Datenverlust), Absenden von Nachrichten/Formularen und Uploads ausdrücklich OHNE Bestätigung – das ist eine bewusste Nutzerentscheidung, kein technisches Sicherheitsnetz.
- Kein echter Desktop-/Mikrofon-/Hotkey-End-to-End-Test in Schritt 021; native Kompilierung, Logik und API-Protokoll wurden geprüft.
- OpenAI meldet aktuell fehlendes API-Guthaben. Dies kann nicht durch eine Codeänderung behoben werden. Fokus/Gemini hat im echten Schnittstellentest funktioniert.
- Screenshots können alle sichtbaren Monitorinhalte enthalten. Sie bleiben bei NEXO im Arbeitsspeicher, maximal zwei im laufenden Modellkontext, und werden an den aktiven Cloud-Anbieter übertragen. Keine lokale Bildarchivierung.
- Pro Auftrag: maximal 24 Modellrunden, 40 Werkzeugaufrufe, vier Minuten. API-Aufrufzeitlimit 45 Sekunden. Ein verlorenes HUD entzieht nach spätestens 15 Sekunden ohne Statuskontakt die PC-Freigabe.
- Keine Kamera-Verfolgung, lautgenaue Lippensynchronisation, dauerhafte Erinnerung, Anmeldung über Geräte, Kalenderanbindung, Handy-App, Push oder Telefonie.
- Notizen bleiben browserlokal; kein Schreiben nach Obsidian aus der App.

## Nachweise aus Schritt 029
- 54 Regressionstests erfolgreich (3 neu: `web_answer`-Verfügbarkeit ohne PC-Steuerung, `answerWithSearch`-Anfrageform, Server-Dispatcher-Weiterleitung).
- `web_answer` live gegen die echte Gemini-API getestet: Frage "aktuellste Nachrichten von heute" lieferte eine echte, aktuelle, kurze Antwort ohne irgendein Fenster/Tab zu öffnen.

## Nachweise aus Schritt 028
- 51 Regressionstests erfolgreich (10 neu: `live.js`-Setup/Werkzeugaufruf/Bildinjektion/Barge-in-Relay mit einem Fake-WebSocket, `focus_window`, `click_by_name`, `validateWindowTarget`).
- Live-API-Protokoll live gegen die echte Gemini-API verifiziert, nicht nur dokumentiert: passendes Live-Modell gefunden (`gemini-2.5-flash-native-audio-preview-09-2025`), volle Setup-Nachricht inkl. aller 7 TOOL_DEFS akzeptiert, Werkzeugaufruf+Antwort-Zyklus funktioniert, Bildinjektion nach Werkzeugantwort funktioniert (Modell beschreibt einen echten Testschreenshot korrekt), Sitzungs-Wiederaufnahme-Feld akzeptiert.
- Kritischer Fund dabei: der volle Systemprompt (für die alte Text-Schleife geschrieben) lässt das Live-Modell nach Werkzeugaufrufen sonst komplett verstummen – isoliert nachgewiesen und mit einer live-spezifischen Zusatzanweisung behoben.
- Nativer Windows-Helfer mit `-CheckOnly` erfolgreich kompiliert (`FocusWindow`, `ClickByName`).
- Kein echter Test von `focus_window`/`click_by_name` auf echten Programmen (Projektregel); kein Test der Browser-Seite, da noch nicht angebunden.

## Orientierung
Pfade ab Repository-Stamm:
- Code/App/: HUD; `conversation.js` führt jetzt die Live-Verbindung (`/ws/voice`), `audio-worklet.js`+`live-audio-player.js` sind neu dafür. `conversation-state.js`/`speech-player.js` sind unbenutzt, aber noch nicht entfernt (Phase D).
- Code/Server/server.js: HTTP/Sitzungen, Stopp, Aufträge, `/ws/voice`-Upgrade-Handler.
- Code/Server/agent.js: Anbieter, Werkzeugschleife, TOOL_DEFS/SYSTEM_PROMPT (von live.js wiederverwendet), `synthesizeSpeech` (nur noch vom alten, jetzt unbenutzten HTTP-Pfad gebraucht).
- Code/Server/live.js: Gemini-Live-Verbindung und Werkzeugaufruf-Weiterleitung, seit Schritt 037 vom Browser genutzt.
- Code/Server/jev.js: TypeSafe/Jev über OpenRouter, aktuell nur für `click_by_name`-Mehrdeutigkeit genutzt.
- Code/Server/desktop.js, desktop.ps1, desktop-native.cs: Windows-Steuerung.
- Code/Server/launch.ps1: Start und Versionsprüfung.
- Code/Tests/regression.test.js, speech-launch.test.js: Testsuiten (66 Tests gesamt).
- Planung/NEXO-Obsidian-Plan/Schritte/037 2026-09-25 *.md: vollständige Übergabe dieses Schritts.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md: langfristiges Ziel.
- Plan-Datei: C:\Users\levin\.claude\plans\vectorized-purring-swing.md (vollständiger Phasenplan A–D für den Live-API-Umbau; A–C jetzt umgesetzt, D steht noch aus).

## Als Nächstes
NEXO neu starten und den kompletten neuen Audio-Pfad real testen: sprechen, während NEXO redet (sollte sofort abbrechen statt weiterzureden oder gar nicht zu reagieren), auf Verzögerung/Aussetzer/Robotik in der Stimme achten. Je nachdem was dabei rauskommt, sofort mit konkretem Fehlerbild zurückmelden statt "geht nicht" – z.B. "kein Ton", "Ton aber kein Abbrechen möglich", "abgehackt am Anfang jeder Antwort". Danach: Phase D (alten HTTP-Sprachpfad und unbenutzte Dateien aufräumen), bzw. Jev auf weitere Klick-Stellen (Browser-DOM) ausweiten. "Energie" schlägt ohne neues OpenAI-Guthaben weiterhin fehl (betrifft den Live-Pfad nicht, der läuft ausschließlich über Gemini).
