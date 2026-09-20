# Schritt 021 – HUD vereinfacht und Mikrofon repariert

Stand: 20.09.2026
Ausgangspunkt: [[020 2026-09-20 KI-Desktopsteuerung und Fehlerbehebung]]

## Auftrag

Das Mikrofon muss wieder zuverlässig ein- und ausgeschaltet werden. Das sichtbare Gesprächsfenster und die PC-Steuerungsbox sollen entfallen. Die PC-Steuerung soll automatisch für die aktive NEXO-Sitzung verfügbar sein. Der sichtbare Stopp-Knopf oben rechts wird entfernt.

## Änderungen

- Gesprächsverlauf und Texteingabe aus dem HUD entfernt; der Sprachbutton und sein Status bleiben erhalten.
- PC-Steuerungsbox, Freigabe-Schalter und sichtbare Aktionsliste entfernt.
- `/api/session` aktiviert die Desktopsteuerung automatisch. Eine neue HUD-Sitzung übernimmt den Desktop, wenn kein Auftrag läuft.
- `/api/control` entfernt, weil es keinen manuellen Freigabeschritt mehr gibt.
- Sichtbare Stopp-Knöpfe entfernt. Strg+Alt+F12 bleibt als unsichtbare Notabschaltung bestehen.
- `MicController` behandelt Abbruchfehler, verzögerte `onend`-Ereignisse und schnelle Ent-/Stummschaltungen robuster. Ein vorübergehender Browserzustand setzt den Nutzerwunsch nicht mehr unnötig zurück.
- Fehlermeldung der Desktop-Bridge an die automatische Sitzungsfreigabe angepasst.
- README, STATUS und die beiden Obsidian-Übersichten auf Schritt 021 aktualisiert.

## Funktioniert jetzt

- Beim Laden einer HUD-Sitzung wird die PC-Bridge automatisch aktiviert.
- Der Benutzer kann das Mikrofon wieder ausschalten und danach erneut einschalten.
- Es gibt kein sichtbares Chat-/Gesprächsfenster und keinen sichtbaren Stopp-Knopf mehr.
- Sensible KI-Aktionen fragen weiterhin im Bestätigungsdialog nach.

## Prüfung und Grenzen

- 31 Regressionstests inklusive automatischer Sitzungsfreigabe und Mikrofonzustandsmaschine erfolgreich.
- JavaScript-Syntax, HTML-Verweise, Windows-Helper-Check und Starthelfer-Check erfolgreich.
- Das echte Mikrofon, der globale Hotkey und echte Mausaktionen müssen noch auf dem Benutzer-PC geprüft werden.
- Die PC-Steuerung bleibt an die laufende HUD-Sitzung und deren 15-Sekunden-Heartbeat gebunden.

## Betroffene Dateien

- `Code/App/index.html`, `Code/App/style.css`, `Code/App/conversation.js`, `Code/App/conversation-state.js`
- `Code/Server/server.js`, `Code/Server/desktop.js`, `Code/Server/agent.js`
- `Code/Tests/regression.test.js`, `Code/STATUS.md`, `Code/App/README.md`
- `Planung/NEXO-Obsidian-Plan/1 Aktueller Stand.md`
- `Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md`

## Nächster Testauftrag

NEXO starten, Fokus wählen, auf das Mikrofon klicken, einen kurzen Auftrag sprechen, das Mikrofon ausschalten und erneut einschalten. Danach eine harmlose Desktopaufgabe ohne Speichern testen.
