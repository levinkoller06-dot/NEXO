# Schritt 019 – Analyse der Änderungen bis Schritt 018

Datum: 20.09.2026 · Art: Codeprüfung und Dokumentation
Geprüfter Stand: c003c20d692079b354f3cddf6d72db8b8ade6b7b
Vergleich: f75d344 bis c003c20 (Schritte 006–018).

## Auftrag und Umfang
Die zwischenzeitlichen Änderungen analysieren. Anwendungscode und Startskripte bleiben unverändert. Diese Notiz und die aktuellen Übersichten dokumentieren die Ergebnisse; die nachfolgenden Fehler sind noch nicht behoben.

## Was hinzugekommen ist
- Kopfgeometrie aus einem 3D-Modell statt aus der alten Formel, mit 99.220 Partikeln, Zähnen und Moduswechsel-Effekt.
- Lokaler Node-Server als Verbindung zu Cloud-KI; kein bereits in der Cloud betriebener NEXO-Core.
- Browser-Spracherkennung, Browser-Sprachausgabe und Gesprächsverlauf in der laufenden Sitzung.
- Fokus nutzt Gemini; Bereit/Energie nutzen OpenAI. Das sind feste Zuordnungen, kein allgemeiner Modell-Router.
- Werkzeugaufrufe zum Öffnen/Schließen gelisteter Programme, Websuche und Moduswechsel.
- Angepasste Fensteraufteilung, aufgeräumtes HUD und versteckter Serverstart.

## Befunde – noch offen
P1 = vor dem weiteren Ausbau beheben; P2 = Funktionsfehler gezielt nachziehen.

### R1 · P1 · Schließen erzwingt Prozessabbruch
Ort: Code/Server/server.js:103–107 und 119–126.

close_app verwendet taskkill mit /IM und /F. Beispielsweise wird Word dadurch zwangsweise beendet; alle passenden Prozesse sind betroffen, nicht nur ein von NEXO geöffnetes Fenster. Ungespeicherte Arbeit kann verloren gehen. Bei Edge kann auch das eigene NEXO-Fenster beendet werden.

Nachweis: Isolierter Werkzeugtest mit abgefangenem Prozessstart ergab taskkill /IM WINWORD.EXE /F. Es wurde kein echtes Programm beendet.

Empfehlung: Zunächst normales Schließen des vorgesehenen Fensters mit Speicherabfrage; einen erzwungenen Abbruch als eigene, ausdrücklich bestätigte Aktion behandeln. Zielprozess/Fenster eindeutig bestimmen.

### R2 · P1 · Fehlender Programmstart beendet den Server
Ort: Code/Server/server.js:98–100 und 112–117.

launch behandelt das asynchrone error-Ereignis von spawn nicht. Wenn eine EXE fehlt oder nicht über den Suchpfad auffindbar ist, meldet executeTool zunächst Erfolg. Anschließend beendet das unbehandelte Ereignis den Node-Prozess. Das äußere try/catch fängt dieses spätere Ereignis nicht.

Nachweis: Original-launch-Funktion in einem isolierten Node-Unterprozess mit garantiert nicht vorhandenem Testprogrammnamen: Erfolgsmeldung, danach unhandled error/ENOENT und Exitcode 1. Kein echtes Programm gestartet.

Empfehlung: Auf spawn/error warten, Fehler als Werkzeugergebnis zurückgeben und installierte Programme über gültige Pfade auflösen.

### R3 · P1 · Aktions-API prüft die Herkunft einer Anfrage nicht
Ort: Code/Server/server.js:239–265.

POST /api/chat prüft weder Origin/Host noch Sitzung oder Content-Type. Auch text/plain mit JSON-Inhalt wird angenommen. Die Bindung an 127.0.0.1 verhindert Anfragen anderer Geräte, aber unterscheidet nicht zwischen dem eigenen HUD und fremden Anfragen, die den lokalen Dienst erreichen. Bei vom Browser zugelassenem Zugriff auf localhost kann eine fremde Webseite dadurch KI-Kosten oder Werkzeugaktionen auslösen; fehlende CORS-Antwortheader verhindern allein nicht die Verarbeitung einer einfachen POST-Anfrage.

Nachweis: Im isolierten Request-Handler-Test wurde eine Anfrage mit fremder Origin und text/plain akzeptiert (HTTP 200) und ein durch eine simulierte Modellantwort ausgelöster Programmstart erreicht. Netzwerkzugriff und Prozessstart waren vollständig ersetzt. Keine reale Browser-Angriffskette getestet; Browserregeln für lokale Netzwerkzugriffe können die Zustellung zusätzlich begrenzen.

Empfehlung: Zulässige Origin/Host-Werte und JSON-Inhaltstyp prüfen sowie eine lokale Sitzung/CSRF-Abwehr vor jedem Modell- oder Werkzeugaufruf validieren.

### R4 · P2 · Mikrofon-Neustart bleibt nach erneutem Einschalten gesperrt
Ort: Code/App/conversation.js:114–128.

Ausschalten setzt suppressRestart auf true. Beim Einschalten wird es nicht zurückgesetzt. Endet die Erkennung danach von selbst, startet sie nicht erneut, obwohl listening und die Anzeige weiter aktiv sind. Eine fertig gesprochene Antwort kann das Flag später zurücksetzen, aber ohne erfolgreiche Antwort bleibt der Fehler bestehen.

Nachweis: Simulierte Folge Ein → Aus → Ein → onend: listening=true, suppressRestart=true; Anzahl Starts bleibt 2, statt erneut zu starten.

Empfehlung: Den gewollten Gesprächszustand beim Einschalten vollständig setzen und Ende/Fehler der tatsächlichen Erkennung mit der Anzeige abgleichen.

### R5 · P2 · Sprachsätze erzeugen parallele KI-Anfragen
Ort: Code/App/conversation.js:50–79 und 95–102.

Jedes finale Sprachergebnis startet sofort sendToCore. Während die KI antwortet, hört die Erkennung zunächst weiter zu; sie wird erst nach der Netzwerkantwort gestoppt. Zwei Sätze während einer langsamen Anfrage lösen zwei gleichzeitige Anfragen aus. Antworten und Werkzeugaktionen können in anderer Reihenfolge eintreffen; die erste Antwort fehlt im Kontext der zweiten Anfrage.

Nachweis: Zwei finale Ergebnisse vor einer simulierten Netzwerkantwort erzeugten zwei offene fetch-Aufrufe; recognition.stop wurde bis dahin keinmal aufgerufen.

Empfehlung: Eine Warteschlange oder genau eine laufende Anfrage pro Gespräch; Spracheingabe, Antwort und Wiedergabe als zusammenhängenden Ablauf behandeln.

### R6 · P2 · Mehrere Gemini-Werkzeuge werden unvollständig verarbeitet
Ort: Code/Server/server.js:220–235; ähnliche Begrenzung auf nur eine Werkzeugrunde im OpenAI-Pfad.

parts.find wählt nur den ersten Gemini-Funktionsaufruf. Weitere gleichzeitige Aufrufe werden verworfen. Nach der Folgeantwort endet der Ablauf außerdem auch dann, wenn das Modell noch einen Werkzeugaufruf liefert.

Nachweis: Eine simulierte Gemini-Antwort mit zwei open_app-Aufrufen führte nur den Rechner-Aufruf aus; der Editor-Aufruf fehlte.

Empfehlung: Alle Aufrufe und Original-Antwortteile erhalten, Ergebnisse korrekt zurückgeben und weitere Werkzeugrunden mit einer klaren Obergrenze verarbeiten.

### R7 · P2 · Ungültige URL-Codierung lässt den Server abstürzen
Ort: Code/Server/server.js:145–148 und 277.

decodeURIComponent läuft außerhalb eines Fehlerhandlers. Ein GET auf /%ZZ wirft URIError aus dem HTTP-Callback. Ohne übergeordneten Handler beendet ein solches unbehandeltes Ereignis den Prozess.

Nachweis: Der originale HTTP-Handler warf im isolierten Test URIError statt eine HTTP-Fehlerantwort zu liefern.

Empfehlung: URL-Verarbeitung abfangen und ungültige Anfragen mit HTTP 400 beantworten.

## Übergabe-Dokumentation
Die Obsidian-Übersicht stand trotz Schritt 018 noch auf 005 und bezeichnete KI, Sprache und PC-Aktionen als vollständig fehlend. Auch im Zielplan und Code-Status standen widersprüchliche Angaben zu Modellen, Mund-Testknopf und Aktionsliste. Diese Zusammenfassungen wurden im Rahmen dieser Prüfung abgeglichen. Die historische Schrittdokumentation bleibt erhalten.

## Prüfungen und Grenzen
- node --check auf Server/server.js sowie App/conversation.js, App/app.js, App/head.js und App/head-mesh-data.js: erfolgreich.
- Kopfgeometrie ausgeführt: 99.220 Punkte, keine ungültigen Positions-/Normalenwerte; alle 1.500 Augenpunkte innerhalb der vorgesehenen Lidmaske.
- Fehlerfälle R1–R7 mit isolierten Node-Tests und nachgebildeten API-/Sprachereignissen untersucht.
- Keine echten API-Anfragen, keine Programme geöffnet/geschlossen, keine Mikrofonaufnahme.
- Lokale .env nicht gelesen. Unter den verfolgten env-Dateien liegt nur Server/.env.example.
- Kein neuer Browser-/FPS-/Mikrofon- oder Launcher-Test. Die optische Ähnlichkeit zur Fotoreferenz und die echte Sprachqualität sind damit nicht bestätigt.
- Die Prüfung ist kein vollständiges Sicherheitsaudit.

## Was fehlt
Ein betriebener Cloud-Core mit Anmeldung, dauerhafter Erinnerung und geräteübergreifendem Zugriff; allgemeine Modellwahl; Kalender, Handy-App, Push/Telefonie und Obsidian-Schreibzugriff. Die vorhandenen Sprach- und Werkzeugfunktionen haben die oben beschriebenen offenen Fehler.

## Betroffene Dateien
- Diese neue Notiz.
- Code/STATUS.md.
- Planung/NEXO-Obsidian-Plan/1 Aktueller Stand.md.
- Planung/NEXO-Obsidian-Plan/NEXO Planung und Ziel.md.

## Nächster möglicher Schritt
Nach ausdrücklichem Auftrag zuerst R1–R3 beheben, danach Gesprächsablauf und Werkzeugrunden (R4–R6) sowie URL-Fehlerbehandlung (R7). Anschließend echte Mikrofon-, Start- und FPS-Tests.
