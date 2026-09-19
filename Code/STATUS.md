# NEXO – aktueller Projektstand

Stand: 20.09.2026 · Schritt 013

## Tatsächlich implementiert
- Startbarer HUD-Prototyp: `NEXO starten.cmd` startet `Server/server.js` (lokaler Node-Prozess) und öffnet `http://localhost:4790/` als Edge-App-Fenster. Kein eigenständiger EXE-Installer.
- **Echtes Sprachgespräch mit NEXO**: Mikrofon-Knopf unter dem Gesicht startet die Spracherkennung des Browsers (Web Speech API); der erkannte Text geht an den lokalen Server, der ihn an OpenAI (Modell `gpt-4o-mini`, konfigurierbar über `Server/.env`) weiterleitet; die Antwort wird per Browser-Sprachausgabe vorgelesen und synchron dazu läuft die Mund-Animation. Der Gesprächsverlauf wird live in einem neuen HUD-Panel mitgeschrieben (nur im Arbeitsspeicher der laufenden Sitzung, kein Speichern über Neustart hinaus). Der OpenAI-API-Key liegt ausschließlich in der lokalen, nicht committeten `Server/.env`; der Server bindet nur an `127.0.0.1`, ist also nicht aus dem Netzwerk erreichbar.
- Dunkles HUD mit einem Partikelkopf aus rund 99.220 Punkten, der von einem echten 3D-Kopfmodell abgetastet wird ("Male Head" von Alexander Antipov, CC BY, siehe `App/README.md`) statt aus einer selbst gebauten Formel. Dadurch wirken Stirn, Augenpartie, Nase, Ohren, Kieferlinie und Kinn deutlich anatomisch stimmiger als in den vorherigen, rein prozeduralen Versionen. Ein tiefenbasierter Helligkeits-Boost lässt vorstehende Bereiche (Nase, Kinn, Lippen, Augäpfel) sichtbar heller aufleuchten als zurückliegende (Wangen, Augenhöhlen), damit auch aus der direkten Frontalansicht erkennbar ist, was vorne ist. Die Originaldatei liegt unter `App/reference/male_head.obj`, wird von der App selbst nicht geladen; `App/head-mesh-data.js` enthält die einmalig umgerechneten Daten.
- Kopf folgt dem Mauszeiger, Augen blinzeln, stumme Sprechanimation per Knopf mit einer ovalen, weich auslaufenden Mundöffnung (kein Rechteck mehr) statt des ganzen Kiefers; beim Öffnen werden zwei dem Zahnbogen folgende, gebogene Zahnreihen sichtbar, bei geschlossenem Mund sind sie vollständig unsichtbar (nicht nur transparent).
- Drei visuelle Modi: Bereit (Türkis), Fokus (Violett), Energie (Orange). Der Wechsel lässt die Partikelwolke auseinanderstieben, bis kein Gesicht mehr erkennbar ist, und wieder zu einem Gesicht in der neuen Farbe zusammenfinden. Diese wechseln KEINE KI-Modelle.
- Große Gesichtsansicht, Escape zum Verkleinern, Bewegung pausieren, Ansicht zentrieren.
- Browserlokale Notiz, 25-Minuten-Timer solange das Fenster läuft, Uhr und Aktionsliste der aktuellen Sitzung.
- FPS-Anzeige misst Zeichenrate, keine PC-Auslastung. Betriebssystem-Einstellung für reduzierte Bewegung wird beachtet; dann startet Bewegung pausiert.

## Nicht implementiert
- Kein Wechsel zwischen KI-Anbietern/Modellen (nur fest OpenAI), kein Gedächtnis über die laufende Sitzung hinaus.
- Keine Kamera-Verfolgung.
- Keine PC-Steuerung, Kalenderanbindung, Telefonie, Push-Nachrichten oder Handy-App.
- Notizen werden NICHT in Obsidian gespeichert. Kein geräteübergreifender Sync.
- Kein Systemmonitor, keine produktive Anmeldung oder Rechteverwaltung.

## Aktuelle Entscheidungen
- KI soll in der Cloud laufen, nicht lokal über Ollama.
- NEXO soll später auf Sprachbefehl zwischen Anbietern/Modellen wechseln können, z. B. Claude, Astra oder Mistral. Gemeinsamer Kontext bleibt im NEXO-Kern; Verfügbarkeit und APIs müssen vor Integration geprüft werden.
- Erster angebundener Anbieter ist OpenAI (nicht Claude/Anthropic wie ursprünglich in der Planung besprochen) – der Nutzer hatte bereits einen OpenAI-Key zur Hand, Anthropic wäre zusätzlicher Aufwand gewesen. Modellwechsel zwischen Anbietern bleibt ein späteres Ziel.
- Sicherheitshinweis: Der erste OpenAI-Key wurde vom Nutzer im Chat eingefügt (also potenziell kompromittiert). Empfehlung war, ihn bei platform.openai.com zu widerrufen und einen neuen zu erstellen; der Nutzer hat sich bewusst entschieden, den bestehenden Key trotzdem zu verwenden. Der Key liegt nur lokal in `Server/.env`, nie im Repository.
- Erst HUD gestalten, danach weitere Funktionen ausdrücklich beauftragen.
- Nach jedem abgeschlossenen Änderungs- oder Planungsschritt neue Obsidian-Notiz plus GitHub-Push.
- Abweichend von der bisherigen Regel "keine externen Referenzen einbetten": Der Nutzer hat sich bewusst für ein echtes, CC-BY-lizenziertes 3D-Kopfmodell statt einer selbst gebauten Formel entschieden (Alternative B in Schritt 008), weil die Gesichtsform trotz mehrfacher Nachbesserung nicht überzeugte. Die Lizenz erfordert Namensnennung, siehe `Code/App/README.md`.

## Überprüft
- JavaScript-Syntax mit `node --check App/head.js`, `node --check App/app.js` und `node --check App/head-mesh-data.js` erfolgreich. Die Punktdarstellung nutzt runde Partikel statt quadratischer Blöcke.
- Browseransicht visuell geprüft; Moduswechsel, Großansicht, Escape, Animation, Notiz-Speichermeldung und laufender Timer geprüft.
- Die neue mesh-basierte Kopfform, Sprechanimation mit Zähnen und der Explosions-/Wiederzusammensetzungs-Effekt beim Moduswechsel wurden per lokalem Testserver im Browser geprüft (Front-, Dreiviertel- und erzwungene Seitenansicht sowie ein erzwungener Zwischenstand der Moduswechsel-Animation). Dabei drei mesh-bedingte Probleme gefunden und behoben: volle Kugelaugen ohne Lid-Maskierung, eine Lücke am Mund durch vom Betrachter wegzeigende Normalen im Quellmesh, und (Schritt 009, nach Nutzer-Meldung "Gesicht verkehrt herum") eine gespiegelte Händigkeit der Koordinatenumrechnung, die fast alle echten Oberflächen-Normalen invertiert hatte.
- Schritt 010 (Zähne blitzten bei geschlossenem Mund durch, Nase/Augen aus der Frontalansicht kaum als vorne liegend erkennbar): auf Wunsch des Nutzers diesmal ohne Browser-Testserver geprüft, stattdessen mit einem eigenen kleinen Node-Skript, das die exakte Beleuchtungs-/Alpha-Formel aus `app.js` nachbildet und als PNG rendert (spart Tokens gegenüber Browser-Screenshots). Mehrere Helligkeits-/Radius-Formeln iterativ verglichen, bis Nase, Kinn und Lippen aus der Frontalansicht klar erkennbar aufleuchten.
- Windows-Startdatei ausgeführt. Das separate Edge-Fenster wurde nicht zusätzlich per UI inspiziert.
- Noch kein Test der Notiz nach Browserneustart und kein vollständiger 25-Minuten-Durchlauf. Smartphone-Layout noch nicht visuell geprüft.
- Schritt 010 und 011 wurden NICHT im echten Browser/Canvas geprüft (nur per Node-Nachbildung der Formel) – der Nutzer testet direkt selbst in der laufenden App.
- Schritt 011 (Nutzer: Frontalansicht immer noch nicht eindeutig, Mundöffnung wirkte wie ein Rechteck statt eines Mundes): Punktzahl der Hauptoberfläche von 62.000 auf 140.000 mehr als verdoppelt; die rechteckige Lippen-Auswahlfläche durch eine ovale mit weichem Rand ersetzt; die beiden bisher geraden Zahnreihen folgen jetzt einer leichten Bogenform statt einer geraden Linie.
- Schritt 012 (Nutzer meldete nach eigenem Test: nur noch ca. 15 FPS, spürbares Ruckeln mit 146.220 Punkten): Punktzahl auf rund 99.220 zurückgenommen (weiterhin ca. 1,5× mehr als vor Schritt 011) und drei Rendering-Optimierungen ergänzt: Partikel werden als Rechtecke statt als Kreisbögen gezeichnet (bei dieser Punktgröße optisch praktisch identisch, aber für den Browser deutlich günstiger zu berechnen), die Canvas-Auflösung nutzt einen niedrigeren Pixel-Dichte-Deckel (1,3 statt 1,6× devicePixelRatio, rund ein Drittel weniger Bildpunkte), und eine `Math.pow`-Berechnung pro Partikel wurde durch einfache Multiplikation ersetzt. Auch das ist mangels Browser-Test in dieser Sitzung nicht selbst nachgemessen.
- Schritt 013 (Cloud-Core, erstes Sprachgespräch): `node --check` auf `Server/server.js`, `App/conversation.js`, `App/app.js`, `App/head.js` erfolgreich. Server lokal gestartet und mit `curl` geprüft: `/api/health` meldet erkannten Key und Modell, statische Auslieferung von `index.html` funktioniert, `/api/chat` erreicht OpenAI erfolgreich und gibt eine korrekt weitergereichte Fehlermeldung zurück ("no credits remaining" – das verwendete Konto hat noch kein Guthaben, das ist eine Aufgabe für den Nutzer bei platform.openai.com, kein Code-Fehler). Kein Test der echten Mikrofon-Aufnahme, Spracherkennung oder Sprachausgabe im Browser – das kann nur der Nutzer selbst mit echtem Mikrofon und Browser-Berechtigung prüfen, sobald Guthaben hinterlegt ist.

## Orientierung
- Obsidian-Einstieg: `Planung/NEXO-Obsidian-Plan/1 Aktueller Stand.md` und `Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md`.
- Code liegt unter `Code/App`; Startdatei ist `Code/NEXO starten.cmd`.
- Ältere Fachplanungen und die Mindmap enthalten Entwürfe. Lokale Modelle, Preise und Zeitpläne darin sind keine aktuelle Implementierungszusage.
- Nächster möglicher Schritt: Nutzer muss bei platform.openai.com Guthaben/Zahlungsmethode hinterlegen, dann das Gespräch im echten Browser mit echtem Mikrofon testen (Berechtigungsdialog, Spracherkennung, Sprachausgabe, Mitschrift-Panel, Mund-Synchronität). Außerdem weiterhin offen: FPS-Test von Schritt 012 in der echten App.
