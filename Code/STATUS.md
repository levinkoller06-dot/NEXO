# NEXO – aktueller Projektstand

Stand: 20.09.2026 · Schritt 030

## Aktueller Auftrag und Ergebnis
Schritt 030 vergleicht Karens direkten App-Start mit NEXO und ersetzt den Windows-Suchweg durch installierte EXE-Dateien, exakte Startmenü-Verknüpfungen oder App-IDs. Reine bekannte Startaufträge wie „Öffne Spotify“ laufen ohne Modellaufruf, Screenshot, Maus oder Tastatur. Für kombinierte Aufträge bleibt die KI-Werkzeugschleife zuständig; der Prompt verlangt den direkten Startweg. Das ist keine technische Garantie gegen jeden möglichen Fehlplan eines Modells bei komplexen Aufträgen.

Sprachausgabe bleibt ausschließlich Gemini mit der konfigurierten Stimme (lokal Charon); Browserstimmen-Fallback entfernt. Ein Audiopaket pro Antwort vermeidet zusätzliche Satz-Anfragen. Bei Ausfall erscheint ein Fehler statt einer anderen Stimme. Die Mundöffnung folgt der Audioenergie aus demselben Web-Audio-Signal wie die Lautsprecherausgabe und schließt bei Ende/Abbruch. Das ist Lautstärke-Synchronisierung, keine Phonem-/Lippenform-Erkennung.

Geprüft: 61 automatisierte Tests, native Kompilierung, Spotify-Pfadauflösung auf diesem PC ohne Start. Echte Spracherkennung, hörbare Wiedergabe und sichtbare Lippensynchronität sind noch nicht im Benutzer-HUD abgenommen. Server/Starter Version 32; nach Neustart wirksam.

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
- `click_by_name`: findet ein benanntes Bedienelement (Button/Link/Menüpunkt/Tab/Checkbox/Radio/Listeneintrag) per UI-Automation-Namenssuche in einem Fenster und aktiviert es direkt, ohne Bildschirmkoordinaten zu schätzen.
- `Code/Server/live.js` (neu): baut die Gemini-Live-Setup-Nachricht (Systemprompt, Werkzeuge, Stimme), hält die WebSocket-Verbindung zu Gemini, leitet Werkzeugaufrufe an dieselben Desktop-Funktionen weiter wie der bisherige HTTP-Pfad, injiziert Bildschirmfotos als eigene Inhalts-Turns (nicht als Werkzeugantwort – die sieht das Modell sonst gar nicht). Noch nicht an den Browser angebunden.
- `Code/Server/server.js`: neuer `/ws/voice`-WebSocket-Endpunkt (Paket `ws`, erste Abhängigkeit des Projekts), authentifiziert über das Sitzungscookie (ein WebSocket-Handshake kann keinen eigenen Token-Header senden).
- `launch_app`: direkter Windows-Start über apps.ps1. Kein Suchmenü, kein Enter, keine Mausklicks; Erfolg bedeutet nur übergebener Startauftrag. Unbekannte/mehrdeutige Apps liefern Fehler.
- `web_answer` (neu, Schritt 029): beantwortet Wissens-/Nachrichtenfragen über Geminis eingebautes `google_search`-Grounding mit einer kurzen Textantwort zum Vorlesen – öffnet nichts, im Unterschied zu `search_web`. Läuft als eigener, direkter Gemini-Aufruf (kann nicht mit eigenen Werkzeugdefinitionen in derselben Anfrage kombiniert werden) und ist unabhängig von aktivierter PC-Steuerung immer verfügbar. Live gegen die echte API getestet.
- Gemini-Denkbudget: 0 (aus), bis in der laufenden Anfrage tatsächlich ein Bildschirm-/Klick-Werkzeug benutzt wurde (`computer_observe`, `computer_action`, `click_by_name`, `focus_window`); erst danach schaltet die Runde auf -1 (dynamisch) um. Reiner Chat und einzelne deterministische Werkzeuge (`launch_app`, `set_mode`, `web_answer`) bleiben dadurch durchgehend schnell (Schritt 032).
- Mikrofon bleibt während der Sprachausgabe aktiv (nur während der Denkphase stumm); erkennt die Spracherkennung währenddessen einen Satz, bricht die aktuelle Antwort sofort ab (Barge-in) statt sich hinten anzustellen.
- Windows-Helfer über feste lokale PowerShell/C#-Dateien, JSON über stdin statt Shell-Interpolation. Startfehler, Zeitlimits und Abbruch werden behandelt.
- Geschützte lokale API mit Host-/Origin-/Inhaltstypprüfung, Sitzungscookie, Sitzungstoken, Nachrichten-/Body-Limits und Pfadbegrenzung. Fehlerhafte URL-Codierung liefert 400.
- PC-Steuerung wird bei jeder neuen Sitzung automatisch aktiviert. Globale Stopp-Taste Strg+Alt+F12 und Verbindungsüberwachung bleiben als unsichtbare Notabschaltung erhalten.
- Konkrete Bestätigungsanfragen für als sensitive eingestufte Aktionen. Auf Nutzerwunsch (Schritt 032) betrifft `risk=sensitive` jetzt NUR NOCH Käufe/Zahlungen/Bestellungen, Installationen und Systemeinstellungen (z.B. Sicherheits-/Antivirus-Software); Delete und Alt+F4 erzwingen die Freigabe nicht mehr automatisch im Code, das Modell klassifiziert Löschen/Schließen/Absenden/Uploads jetzt selbst als routine. Nach Freigabe ist eine neue Beobachtung erforderlich.
- Native Eingaben auf NEXOs eigenen Fenstern werden blockiert. Windows-Rechte/UAC werden nicht umgangen.
- Starter wartet auf den Server, berücksichtigt PORT und zeigt Fehler an. Ältere Server werden nur bei eindeutig zum Projekt gehörendem Prozesspfad ersetzt.

## Grenzen
- Die Gemini-Live-Verbindung (`live.js`) ist server-seitig fertig und getestet, aber der Browser spricht noch nicht damit – kein hörbarer/spürbarer Unterschied im HUD durch diesen Schritt allein. Das folgt mit der Browser-Seite (Mikrofon-Dauerstream, Wiedergabe).
- Ein erster Desktop-Agent, keine Garantie, dass jede beliebige Oberfläche korrekt erkannt/bedient wird.
- `pointer=background` (UI Automation, sonst Fensternachrichten statt echter Maus) funktioniert nicht bei allen Programmen zuverlässig (z.B. Spiele, Canvas-/GPU-gerenderte Oberflächen, manche UWP-Apps, die echte Hardware-Eingaben verlangen). Das Modell soll bei ausbleibender Wirkung mit `pointer=visible` erneut versuchen; automatische Erkennung von Fehlschlägen gibt es nicht.
- Barge-in nutzt dieselbe Spracherkennung wie sonst auch, ohne eigene Echo-Unterdrückung; ob NEXOs eigene Stimme aus dem Lautsprecher (statt Kopfhörer) sich gelegentlich selbst triggert, hängt von Chromiums eingebauter Echo-Unterdrückung ab und ist ungetestet.
- `launch_app` verlässt sich darauf, dass das Modell den Suchtreffer korrekt visuell einschätzt, bevor es ENTER drückt; eine falsche Einschätzung kann weiterhin das falsche Programm öffnen.
- Die Risikoeinstufung beliebiger visueller Aktionen hängt vom Modell ab. Die Bestätigungslogik ist keine vollständige Sandbox. Seit Schritt 032 laufen Löschen, Schließen von Programmen (auch mit möglichem Datenverlust), Absenden von Nachrichten/Formularen und Uploads ausdrücklich OHNE Bestätigung – das ist eine bewusste Nutzerentscheidung, kein technisches Sicherheitsnetz.
- Kein echter Desktop-/Mikrofon-/Hotkey-End-to-End-Test in Schritt 021; native Kompilierung, Logik und API-Protokoll wurden geprüft.
- OpenAI meldet aktuell fehlendes API-Guthaben. Dies kann nicht durch eine Codeänderung behoben werden. Fokus/Gemini hat im echten Schnittstellentest funktioniert.
- Screenshots können alle sichtbaren Monitorinhalte enthalten. Sie bleiben bei NEXO im Arbeitsspeicher, maximal zwei im laufenden Modellkontext, und werden an den aktiven Cloud-Anbieter übertragen. Keine lokale Bildarchivierung.
- Pro Auftrag: maximal 24 Modellrunden, 40 Werkzeugaufrufe, vier Minuten. API-Aufrufzeitlimit 45 Sekunden; Freigaben verfallen nach 90 Sekunden. Ein verlorenes HUD entzieht nach spätestens 15 Sekunden ohne Statuskontakt die PC-Freigabe.
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
- Code/App/: HUD, api.js, conversation-state.js, conversation.js.
- Code/Server/server.js: HTTP/Sitzungen, Stopp, Aufträge, neuer `/ws/voice`-Upgrade-Handler.
- Code/Server/agent.js: Anbieter, Werkzeugschleife, TOOL_DEFS/SYSTEM_PROMPT (von live.js wiederverwendet).
- Code/Server/live.js: Gemini-Live-Verbindung und Werkzeugaufruf-Weiterleitung (neu, noch nicht an den Browser angebunden).
- Code/Server/desktop.js, desktop.ps1, desktop-native.cs: Windows-Steuerung.
- Code/Server/launch.ps1: Start und Versionsprüfung.
- Code/Server/package.json: erste Abhängigkeit (`ws`) – `npm install` im Server-Ordner nötig.
- Code/Tests/regression.test.js: Tests ohne echte Desktop-Aktionen.
- Planung/NEXO-Obsidian-Plan/Schritte/029 2026-09-20 web_answer und Prompt-Verschaerfung.md: vollständige Übergabe.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md: langfristiges Ziel.
- Plan-Datei: C:\Users\levin\.claude\plans\vectorized-purring-swing.md (vollständiger Phasenplan A–D für den Live-API-Umbau).

## Als Nächstes
Phase C des Live-API-Umbaus (Browser-Mikrofon-Dauerstream, Wiedergabe) ist der eigentliche Geschwindigkeits-Hebel und steht noch aus – nur mit dem Nutzer am echten Gerät testbar. Bis dahin: NEXO neu starten (Serverversion 31), "sag mir die News" / ähnliche Wissensfragen testen (sollte jetzt antworten statt einen Tab zu öffnen), sowie beobachten, ob Programme jetzt zuverlässiger über launch_app statt Mausklick öffnen und ob weiterhin ungefragte Zusatzprogramme aufgehen. "Energie" schlägt ohne neues OpenAI-Guthaben weiterhin fehl.
