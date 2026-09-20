# Schritt 024 – Mikrofon-Fix, Gemini-Stimme und Tempo

Stand: 20.09.2026

Ausgangspunkt: [[023 2026-09-20 Audio-Fallback für Edge-App ergänzt]]

## Auftrag

Der Sprachknopf reagierte gar nicht mehr (keine Animation, kein Klick-Effekt). Danach: Sprachausgabe per ElevenLabs einrichten, dann auf eine männliche, schnellere Stimme wechseln, allgemein die Antwortzeit verbessern, den Status ("Denkt nach …", "Hört zu.") sichtbar über dem Kopf anzeigen, Mikrofon beim Start automatisch aktivieren, ChatGPT von Bereit auf Energie verschieben, und mehrere nicht mehr benötigte Bedienelemente entfernen.

## Root Cause des Mikrofon-Bugs

`conversation-state.js`: `MicController` übernahm `setTimeout`/`clearTimeout` als Default-Parameter und rief sie dann als `this.delay(...)`/`this.clear(...)` auf – von ihrem globalen Empfänger abgekoppelt. Aktuelles Chromium/Edge wirft dabei `TypeError: Illegal invocation`, noch bevor `recognition.start()` erreicht wird. Die 33 Regressionstests bemerkten das nie, weil sie dort immer eigene Fake-Timer statt echter Browser-Timer einsetzen. Fix: `delay`/`clear` als bindende Wrapper-Funktionen statt nackter Funktionsreferenzen.

## Sprachausgabe

- ElevenLabs zunächst eingebaut (`/api/speech`), scheiterte live an einer Konto-Einschränkung: Free-Tier erlaubt keinen API-Zugriff auf Library-Stimmen, auch nicht auf zu "My Voices" hinzugefügte.
- Ersetzt durch Gemini-TTS (`gemini-2.5-flash-preview-tts`, `generateContent` mit `responseModalities:["AUDIO"]`) – nutzt den bereits vorhandenen `GEMINI_API_KEY`, kein neuer Account nötig. Rohes PCM-Audio wird serverseitig in einen WAV-Header verpackt.
- Stimme auf `Charon` (männlich, informativ) gestellt, änderbar über `GEMINI_TTS_VOICE` in `Server/.env`.
- Live gegen die echte API getestet (nicht nur gemockt).

## Tempo

- Zwei reale Latenz-Bremsen gemessen: (1) Geminis internes "Thinking" verdoppelte die Chat-Antwortzeit (2,4s → 1,3s ohne); jetzt per `generationConfig.thinkingConfig.thinkingBudget: 0` deaktiviert. (2) Gemini-TTS-Latenz skaliert mit Textlänge (~40 Zeichen ≈ 3s, ~230 Zeichen ≈ 10s) und ist nicht streamingfähig über den einfachen Endpunkt.
- Sprachausgabe wird jetzt satzweise an `/api/speech` geschickt: der erste Satz spielt ab, während der Rest im Hintergrund weitersynthetisiert wird – deutlich kürzere Zeit bis zum ersten hörbaren Ton bei mehrsätzigen Antworten.
- Gemessene Gesamtzeit bis zum ersten Ton (Sitzung ausgenommen): kurze Alltagsfrage ≈ 4,3s; lange, offene Frage mit langem ersten Satz ≈ 10,7s.
- `standby` (Bereit) nutzt jetzt Gemini statt OpenAI (schneller, kein Guthaben-Problem); `energy` (Energie) bleibt OpenAI, wie gewünscht.

## UI

- Statuszeile (`Denkt nach …`, `Hört zu.`, `NEXO spricht.`, `Ich bin bereit.`) ist jetzt sichtbar direkt unter der "NEXO / BEREIT"-Überschrift über dem Kopf, vorher fälschlich mit `visually-hidden` nur für Screenreader gedacht.
- Mikrofon startet automatisch beim Laden der Seite (weiterhin manuell an/aus schaltbar).
- Entfernt: "Bewegung pausieren"-Knopf (Kopf folgt jetzt immer der Maus, respektiert weiterhin `prefers-reduced-motion`), "Ansicht zentrieren"-Knopf, "Gesichtsansicht"-Quick-Action.

## Bekannte Einschränkung

OpenAI-Konto hat aktuell kein Guthaben (`insufficient_quota`, seit Schritt 021 bekannt). Der Modus "Energie" schlägt deshalb fehl, bis Guthaben nachgelegt wird – unabhängig vom Code.

## Prüfung

- 35 Regressionstests erfolgreich (2 neue für `/api/speech`, 2 angepasst wegen Standby→Gemini-Wechsel).
- Live-Endpunkttests: `/api/speech` mit echtem Gemini-Key (WAV-Datei verifiziert), `/api/chat` in Standby mit echtem Gemini-Key, Latenzmessungen mit und ohne `thinkingConfig`.
- Mikrofon-Fix live im Browser reproduziert (vorher: `Illegal invocation` bei jedem Klick; nachher: kein Fehler, Berechtigungsanfrage wird erreicht).

## Nächster Testauftrag

Alte NEXO-Fenster schließen, `Code/NEXO starten.cmd` neu starten (Serverversion 26), Mikrofon sollte automatisch aktiv sein, Statuszeile über dem Kopf beobachten, eine kurze und eine offene Frage stellen und die neue Stimme sowie die Antwortzeit beurteilen. "Energie" wird ohne neues OpenAI-Guthaben fehlschlagen.
