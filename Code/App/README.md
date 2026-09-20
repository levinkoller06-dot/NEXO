# NEXO HUD

NEXO verbindet das Partikelgesicht mit Sprachgesprächen und einer KI, die den Windows-Desktop über Bilder, Maus und Tastatur bedienen kann.

## Start

1. Im Code-Ordner **NEXO starten.cmd** öffnen.
2. Der Starthelfer wartet auf den lokalen Server und öffnet dann das Edge-App-Fenster.
3. **Fokus** verwendet Gemini; **Bereit/Energie** verwenden OpenAI.
4. Das Mikrofon einschalten und einen Auftrag sprechen.
5. Die PC-Steuerung ist für die aktive Sitzung automatisch verfügbar.

Voraussetzungen: Windows, Node.js 20 oder neuer, Windows PowerShell 5.1 mit .NET/Windows Forms. Edge wird bevorzugt; sonst öffnet der Standardbrowser. Der Server läuft nur auf 127.0.0.1 (Standardport 4790).

Der Starter ersetzt eine ältere Serverversion nur, wenn deren Node-Prozess eindeutig zum absoluten NEXO-Serverpfad gehört. Andere Prozesse auf dem Port werden nicht beendet. Startfehler erscheinen als Meldung; technische Startprotokolle stehen lokal unter Code/logs und werden nicht committet.

## KI-Verbindung

Server/.env.example nach Server/.env kopieren und die eigenen Keys eintragen:
- OPENAI_API_KEY / OPENAI_MODEL: Bereit und Energie.
- GEMINI_API_KEY / GEMINI_MODEL: Fokus.
- PORT: optionaler lokaler Port.

Keys stehen ausschließlich im lokalen Server. Die API-Nutzung hängt vom jeweiligen Konto, Guthaben und Modell ab. Am 20.09.2026 war der echte Gemini-Bild-/Werkzeugtest erfolgreich; OpenAI meldete fehlendes Guthaben.

## Wie NEXO den PC bedient

Die KI sieht einen aktuellen Screenshot, wählt eine allgemeine Aktion, erhält danach ein neues Bild und prüft das Ergebnis. Verfügbar: Maus bewegen, links/rechts klicken, Doppelklick, Ziehen, vertikales Scrollen, Text tippen, Tastenkombinationen und kurzes Warten.

Es gibt keine fest hinterlegten Abläufe für bestimmte Apps. Zum Öffnen eines Programms kann das Modell beispielsweise selbst die Windows-Suche bedienen. Zum Schließen benutzt es die Oberfläche; eine Funktion zum erzwungenen Beenden aller Prozesse wurde entfernt.

Bildschirmbilder gehen bei einer durch die KI angeforderten Beobachtung an den aktiven Cloud-Anbieter. Sie können alles enthalten, was auf den Monitoren sichtbar ist. NEXO speichert sie nicht auf der Festplatte. Im laufenden Modellkontext bleiben höchstens zwei Bilder.

## Stopp und Bestätigungen

- **Strg + Alt + F12** beendet den Auftrag und entzieht die PC-Steuerung. Der sichtbare Stopp-Knopf wurde aus der Oberfläche entfernt.
- Schließen oder Verbindungsverlust des HUD beendet die Steuerung spätestens nach Ablauf des 15-Sekunden-Verbindungschecks; eine direkt erkannte Trennung stoppt sofort.
- Die PC-Steuerung startet automatisch mit jeder neuen HUD-Sitzung.
- Folgenreiche Aktionen werden von der KI als sensitive markiert und im HUD als konkreter Schritt mit Vorschau vorgelegt. Delete und Alt+F4 erzwingen zusätzlich eine Bestätigung im Code. Nach Freigabe muss NEXO den Bildschirm erneut ansehen.
- Die Einordnung beliebiger visueller Aktionen hängt weiterhin vom Modell ab. Das ist keine vollständige technische Erkennung aller riskanten Klicks.
- Der Windows-Helfer blockiert Eingaben auf NEXOs eigenen Fenstern, um Selbstbestätigungen zu verhindern. Betriebssystemrechte und Administratorabfragen werden nicht umgangen.
- Pro Auftrag höchstens 24 Modellrunden/40 Werkzeugaufrufe und vier Minuten Laufzeit. Kein unbegrenzter Hintergrundagent.

## Gespräch und HUD

Spracheingaben werden während der Antwortverarbeitung pausiert und danach bei eingeschaltetem Gespräch wieder aktiviert. Der sichtbare Gesprächsverlauf und das Texteingabefeld wurden entfernt; NEXO wird über das Mikrofon bedient. Wenn die Edge-App keine SpeechRecognition-API anbietet, nimmt MediaRecorder den kurzen Clip auf und sendet ihn an Gemini. Die Mundbewegung begleitet die Sprachausgabe; sie ist keine lautgenaue Lippensynchronisation.

Großansicht, Bewegungspause, Zentrieren, drei Farbmodi, Browsernotiz und 25-Minuten-Timer bleiben enthalten. Notizen werden nicht nach Obsidian synchronisiert. Der Timer läuft nur bei offenem Fenster. Kalender, Handy-App, Push und Telefonie sind noch nicht integriert.

## Prüfstand

Regressionstests: vom Repository-Stamm **node --test Code/Tests/regression.test.js**.
Windows-Helfer: **powershell.exe -NoProfile -File Code/Server/desktop.ps1 -CheckOnly**.

Die Tests verwenden simulierte Bildschirm-/Eingabegeräte. Der echte Gemini-Test verwendet ausschließlich ein künstliches Testbild. Echtes Klicken, Mikrofon, globaler Hotkey und der gesamte Startablauf wurden in diesem Schritt noch nicht am sichtbaren Desktop durchgespielt. Der Desktop-Agent ist ein erster lauffähig implementierter Prototyp; Zuverlässigkeit und Zielgenauigkeit sind abhängig vom Modell und der jeweiligen Oberfläche.

## Herkunft der Kopfgeometrie

- **„Male Head“** von **Alexander Antipov**, laut ursprünglicher Übernahme **CC BY 4.0**: [Original auf Sketchfab](https://sketchfab.com/3d-models/male-head-0247a25a04ba46b99629130277fe39b7).
- reference/male_head.obj ist die Originalgeometrie; sie wird zur Laufzeit nicht geladen.
- head-mesh-data.js enthält die umgerechneten Eckpunkte/Dreiecke. head.js tastet 99.220 Partikel ab.
- Hals/Schultern wurden entfernt und das Koordinatensystem angepasst. Die App nutzt keine Originaltextur.
