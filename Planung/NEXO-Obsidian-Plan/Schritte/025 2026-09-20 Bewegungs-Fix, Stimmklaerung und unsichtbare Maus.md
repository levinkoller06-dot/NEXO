# Schritt 025 – Bewegungs-Fix, Stimmklärung und unsichtbare Maus

Stand: 20.09.2026

Ausgangspunkt: [[024 2026-09-20 Mikrofon-Fix, Gemini-Stimme und Tempo]]

## Auftrag

Nach Schritt 024 meldete der Nutzer: die Stimme klinge wieder nach Standard/weiblich, die Kopfbewegung folge der Maus nicht mehr ("jetzt ist es gar nie an"), und zwei neue Wünsche: Programme sollen direkt öffnen (nicht über einzelne WIN/Such/Enter-Schritte), und der von NEXO gesteuerte Mauszeiger soll für den Nutzer nicht sichtbar sein.

## Root Cause Bewegungs-Bug

`app.js` band die Kopfbewegung an `paused = matchMedia('(prefers-reduced-motion: reduce)').matches`. Der Pause-Knopf aus Schritt 024 wurde entfernt, aber ohne Gegenschalter blieb `paused` dauerhaft `true`, falls Windows/Edge reduzierte Bewegung anfordert – der Kopf war dann für immer eingefroren, exakt das Gegenteil vom Wunsch "immer an". Fix: die Prüfung entfernt, Bewegung ist jetzt unbedingt aktiv.

## Stimme

Direkter `/api/speech`-Aufruf gegen den echten, laufenden Server (nicht die Testumgebung) bestätigt: `GEMINI_TTS_VOICE=Charon` ist korrekt gesetzt und wird verwendet. Eine Hörprobe direkt von diesem Server wurde dem Nutzer zum Vergleich geschickt, um zu klären, ob es sich um einen echten Bug oder eine Wahrnehmungsfrage (Charon klingt evtl. weniger natürlich männlich als erhofft) handelt.

**Nebenwirkung:** Die Diagnose hat über `/api/session` eine neue Testsitzung auf dem laufenden Server erzeugt. `desktop.enable()` deaktiviert dabei automatisch eine bereits aktive PC-Steuerung einer anderen Sitzung (`desktop.disable('Neue NEXO-Sitzung verbunden.')`). Die PC-Steuerung der laufenden Nutzer-Sitzung wurde dadurch vermutlich abgeschaltet. NEXO-Fenster nach diesem Update ohnehin neu laden.

## Neue Fähigkeiten (auf Nutzerwunsch, mit Rückfrage zu den Kompromissen)

- **`launch_app`**: neues Werkzeug, öffnet ein Programm/Datei über die Windows-Suche in einem einzigen nativen Schritt (WIN-Taste, Text, ENTER) statt drei bis vier einzeln beobachteten Schritten. Danach automatisch ein neues Bildschirmbild wie bei `computer_action`. Bleibt allgemein: kein feste App-Liste, keine App-spezifischen Makros.
- **Unsichtbarer Mauszeiger (`pointer=background`, neuer Standard)**: Windows hat nur einen echten Systemzeiger; eine vollständig unabhängige zweite, unsichtbare Maus ist nicht sauber machbar. Nutzer hat sich für die realistischere Variante entschieden: Klicks/Ziehen/Scrollen werden per `PostMessage` direkt an das Fenster unter dem Zielpunkt gesendet (`WM_LBUTTONDOWN/UP`, `WM_MOUSEWHEEL`, `WM_MOUSEMOVE`), ohne den sichtbaren Cursor zu bewegen. Funktioniert bei den meisten normalen Programmen, aber nicht garantiert bei Spielen, Canvas-/GPU-Oberflächen oder Apps, die echte Hardware-Eingaben verlangen. `pointer=visible` (die bisherige, echte SetCursorPos+SendInput-Methode) bleibt als Rückfalloption; das Modell wird im Systemprompt angewiesen, das bei ausbleibender Wirkung zu versuchen.

## Geänderte Dateien

- Code/App/app.js: `prefers-reduced-motion`-Kopplung entfernt.
- Code/Server/agent.js: `launch_app`-Werkzeug, `pointer`-Parameter bei `computer_action`, Systemprompt ergänzt.
- Code/Server/desktop.js: `validateLaunch`, `pointer`-Default/Validierung, `DesktopController.launchApp`, `NativeBridge.launchApp`.
- Code/Server/desktop.ps1: `launchApp`-Operation, `pointer` durchgereicht.
- Code/Server/desktop-native.cs: `PostMessage`/`ScreenToClient`-Deklarationen, `TargetWindow`/`PostClick`-Hilfsfunktionen, `Act` verzweigt nach `pointer`, neue Methode `LaunchApp`.
- Code/Server/server.js: Health-Version 27, `launch_app` im Werkzeug-Dispatcher.
- Code/Tests/regression.test.js: 5 neue Tests, TOOL_DEFS-Liste aktualisiert.

## Prüfung und Grenzen

- 39 Regressionstests erfolgreich.
- Nativer Helfer mit `-CheckOnly` kompiliert.
- Kein echter Klick-/Such-Test auf echten Programmen (Projektregel: keine echten Desktop-Aktionen als beiläufige Tests). `pointer=background` und `launch_app` sind ungetestet gegen reale Anwendungen.
- Ob die Stimme jetzt wie erwartet klingt, ist beim Nutzer noch offen.

## Nächster Testauftrag

NEXO-Fenster schließen und neu starten (Version 27). Prüfen: Kopf folgt der Maus, Stimme klingt männlich, ein `launch_app`-Auftrag ("öffne den Taschenrechner") und ein normaler Klick-Auftrag zeigen, ob der sichtbare Mauszeiger sich dabei noch bewegt (er sollte nicht). Bei Programmen, die nicht reagieren, testweise "benutze die sichtbare Maus" sagen.
