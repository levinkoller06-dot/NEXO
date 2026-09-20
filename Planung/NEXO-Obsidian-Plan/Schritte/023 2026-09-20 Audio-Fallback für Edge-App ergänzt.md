# Schritt 023 – Audio-Fallback für Edge-App ergänzt

Stand: 20.09.2026

Ausgangspunkt: [[022 2026-09-20 Mikrofonzugriff und HUD-Texte bereinigt]]

## Auftrag

Der Screenshot zeigte den roten, deaktivierten Sprachbutton. Die laufende Edge-App stellt dort keine SpeechRecognition-API bereit, daher konnte der Button keine Sprache aufnehmen.

## Änderungen

- Wenn `SpeechRecognition` fehlt, nutzt NEXO `MediaRecorder` als Sprachaufnahme-Fallback.
- Ein Klick startet die Aufnahme, der nächste beendet sie und sendet den Audioclip an `/api/voice`.
- Der Server akzeptiert begrenzte Audio-JSON-Daten und reicht sie als `inlineData` an Gemini weiter. Der Fallback nutzt Gemini unabhängig vom HUD-Modus, weil Gemini die Audiodatei verarbeitet.
- Die Erkennung startet weiterhin sofort beim Klick, ohne auf eine hängende Browserberechtigungsabfrage zu warten.
- Alte Serverprozesse werden über Serverversion 23 beim nächsten Start ersetzt.

## Prüfung und Grenzen

- 33 Regressionstests erfolgreich.
- Gemini-Audio-Fallback mit simuliertem WebM-Audiopaket getestet.
- Browseraufnahme, reale Gemini-Audioverarbeitung und Mikrofonberechtigung müssen noch praktisch auf diesem PC laufen.
- Für den Fallback ist ein Gemini-Key in `Code/Server/.env` erforderlich.

## Nächster Testauftrag

Alle alten NEXO-Fenster schließen, neu starten, auf den roten Sprachbutton klicken, zwei bis drei Sekunden sprechen und erneut klicken. Danach wartet NEXO auf die Gemini-Antwort.
