# Schritt 028 – Gemini-Live-API: Phase A und B

Stand: 20.09.2026

Ausgangspunkt: [[027 2026-09-20 Karen-Techniken - UIA-Klicks, Websuche, Barge-in]]

## Auftrag

Barge-in aus Schritt 027 funktionierte beim Nutzer überhaupt nicht ("gar keine Reaktion"). Statt weiterer Einzel-Patches wollte der Nutzer ausdrücklich, dass NEXO im Hintergrund komplett wie Karen funktioniert. Eine Tiefenanalyse von Karens `main.py` zeigte: der Geschwindigkeits-/Zuverlässigkeitsunterschied kommt von Googles **Gemini Live API** – einer einzigen Dauerverbindung (Mikrofon rein, Audio raus, Werkzeugaufrufe, Unterbrechen alles über denselben Kanal) statt Karens Pendant zu NEXOs bisherigem Text-Chat-plus-separater-Sprachausgabe. Das ist ein großer, mehrteiliger Umbau; dafür wurde zuerst ein Plan erstellt (`EnterPlanMode`) und vom Nutzer freigegeben, inklusive zweier Vorentscheidungen: alle drei Modi laufen künftig über Gemini Live (kein OpenAI mehr für Gespräche), und das Node-Paket `ws` wird als erste Abhängigkeit des Projekts ergänzt.

## Umgesetzt: Phase A (Server-Grundgerüst) und Phase B (Werkzeugaufrufe + zwei Klick-Verbesserungen)

- `Code/Server/live.js` (neu): baut die Live-Setup-Nachricht (Modell, Systemprompt, Werkzeuge, Stimme aus `.env`), hält die WebSocket-Verbindung zu Gemini offen, verwaltet Reconnect mit Backoff und Sitzungs-Wiederaufnahme-Handle, leitet Werkzeugaufrufe an dieselben Desktop-Funktionen weiter, die der bisherige HTTP-Pfad schon nutzt.
- `Code/Server/server.js`: neuer `/ws/voice`-WebSocket-Endpunkt (`server.on('upgrade', ...)`), authentifiziert über das Sitzungscookie – ein WebSocket-Handshake kann anders als ein POST keinen eigenen `X-Nexo-Token`-Header senden, daher tragen hier Cookie plus die bestehenden Origin-/Host-Prüfungen die Absicherung.
- Zwei neue, von Karen inspirierte Desktop-Werkzeuge (in `desktop-native.cs`/`desktop.js`/`desktop.ps1`/`agent.js`, sofort auch im bisherigen HTTP-Pfad nutzbar):
  - **`focus_window`**: holt ein Fenster per Titel gezielt nach vorne (`SetForegroundWindow`+`ShowWindow`), statt blind ALT+TAB zu drücken (das nur zum jeweils nächsten Fenster wechselt und dabei leicht das falsche nach vorne holt – vermutlich die Ursache für das gemeldete "Programm verschwindet immer in den Hintergrund").
  - **`click_by_name`**: sucht per UI Automation ein benanntes Bedienelement (Button/Link/Menüpunkt/Tab/Checkbox/Radio/Listeneintrag, z.B. "Lyrics") in einem Fenster und aktiviert es direkt – ohne Bildschirmkoordinaten zu schätzen.

## Kritischer Fund während der Live-Validierung

Der volle, für die alte Text-Werkzeugschleife geschriebene `SYSTEM_PROMPT` lässt das Live-Modell nach einem Werkzeugaufruf (z.B. `set_mode`) **komplett verstummen** – bestätigt und isoliert: mit demselben Prompt+Werkzeugen funktioniert es mit einem kurzen, einfachen Test-Prompt tadellos, mit dem echten NEXO-Prompt bleibt es stumm, bis eine explizite Zusatzanweisung ergänzt wird ("Du sprichst gerade live per Stimme, wenn du nichts sagst hört der Nutzer nichts, sprich immer..."). Ohne diesen Fund hätte die neue Architektur den Nutzer beim ersten Test wieder mit einem scheinbar "toten" NEXO zurückgelassen. `live.js` hängt diese Anweisung automatisch an den bestehenden `SYSTEM_PROMPT` an, ohne die Datei `agent.js` selbst zu verändern (der alte Text-Pfad braucht das nicht, da er strukturell nie eine leere Antwort zulässt).

Ebenfalls gefunden und behoben: eine Bildschirmbeobachtung (`computer_observe`-Ergebnis mit Bild) darf erst **nach** der Werkzeugantwort als eigener Inhalts-Turn (`clientContent`) geschickt werden, nicht davor – sonst bricht das Modell die gesamte Antwort kommentarlos ab. Ein im `functionResponse` eingebettetes Bild wird vom Live-Modell nie tatsächlich angesehen (wie bei Karen, das Bildinhalte deshalb konsequent außerhalb von Werkzeugantworten schickt).

## Bewusst noch nicht angebunden

Der Browser/das HUD spricht noch nicht mit `/ws/voice`. Das bisherige Gespräch (`/api/chat` + `/api/speech`, Browser-Spracherkennung) läuft unverändert weiter. Das ist Phase C: Mikrofon-Dauerstream per `AudioWorkletNode`, Wiedergabe über die Web Audio API, Ablösung von `SpeechRecognition`/`MicController` – der Teil, den nur der Nutzer selbst am echten Gerät (Mikrofon, Lautsprecher, gefühlte Verzögerung) fertig testen kann.

## Prüfung

- 51 Regressionstests erfolgreich (10 neu, u.a. mit einem Fake-WebSocket für `LiveSession`: Setup-Versand, Werkzeugaufruf→Antwort→Bildinjektion in korrekter Reihenfolge, Audio-/Transkript-/Unterbrechungs-Weiterleitung, Verwerfen abgebrochener Werkzeugaufrufe).
- Live-Protokoll mehrfach gegen die echte Gemini-API verifiziert: passendes Modell gefunden (`gemini-2.5-flash-native-audio-preview-09-2025`), volle Setup-Nachricht mit allen 7 Werkzeugen akzeptiert, Werkzeugaufruf-Zyklus, Bildinjektion (Modell beschreibt einen echten Testscreenshot korrekt), Sitzungs-Wiederaufnahme-Feld akzeptiert.
- Nativer Helfer mit `-CheckOnly` kompiliert (`FocusWindow`, `ClickByName`, UI-Automation-Referenzen).
- Kein echter Klicktest von `focus_window`/`click_by_name` auf echten Programmen (Projektregel). Kein Test der Browser-Seite, da noch nicht angebunden.

## Nächster Schritt

Phase C wie im freigegebenen Plan (`C:\Users\levin\.claude\plans\vectorized-purring-swing.md`): Browser-seitiges Mikrofon-Streaming und Wiedergabe bauen, dann gemeinsam mit dem Nutzer am echten Gerät testen (Latenzgefühl, Barge-in mit echtem Mikrofon/Lautsprecher, Rückkopplungsrisiko). Danach Phase D (Aufräumen der alten HTTP-Sprachpfade).
