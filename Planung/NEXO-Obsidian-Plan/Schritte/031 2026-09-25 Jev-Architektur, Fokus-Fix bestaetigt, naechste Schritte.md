# Schritt 031 – Jev-Architektur, Fokus-Fix bestätigt, nächste Schritte

Stand: 25.09.2026

Ausgangspunkt: [[030 2026-09-20 Direkter Appstart und Gemini Audio]]

## Auftrag

Reines Planungsgespräch (kein Umsetzungsauftrag, siehe `AGENTS.md`): Nutzer wollte prüfen, ob TypeSafe AI ("Jev", in der Sprachaufnahme als "Jeff" transkribiert) Gemini für die Klick-/App-Steuerung ersetzen kann, ob der früher gemeldete Fokus-Bug bereits behoben ist, und welche nächsten Schritte ohne Jev möglich sind.

## Recherche: TypeSafe AI / Jev

Jev (typesafe.ai) ist kein Chat-/Vision-/Tool-Calling-Modell wie Gemini, sondern ein reines Text-Entscheidungs-API ("System One Model"): Ein Request schickt einen `state` (Text/JSON) plus Fragen vom Typ `Choice`/`Score`/`Noul`; Jev wählt aus einer **bereits vorgegebenen, endlichen Optionsliste** und liefert typisierte Werte + Konfidenz zurück. Laut Doku ausdrücklich: "Jev accepts text only. Images, audio, and video are not supported (yet)." Es gibt keine Funktion, die freien Text erzeugt oder extrahiert – jede Choice/Score-Antwort muss vorher bekannte Kandidaten haben.

**Signups sind aktuell pausiert** (typesafe.ai zeigt nur ein E-Mail-Wartelisten-Formular) – kein API-Key aktuell erhältlich, Umsetzung ist damit ohnehin blockiert.

## Architektur-Entscheidung für später (sobald API-Zugang existiert)

Bestätigt durch ein reales Referenzbeispiel (Gregor Zunic, Autor von "Browser Use", [X-Post](https://x.com/gregpr07/status/2100411066966749359)): Browser Use kombiniert bei jedem Schritt einen aus dem DOM/Accessibility-Baum gewonnenen Text-Kandidatenraum mit Jev für die Klick-/Navigationsentscheidung, und nutzt für alles Freie (Tippen von Werten wie Datum/Ort) ausdrücklich einen **"small LLM fallback to type"**.

Für NEXO übertragen:
- **Jev übernimmt:** die Auswahl unter bereits bekannten, benannten Kandidaten – z.B. bei `click_by_name`, wenn mehrere UI-Automation-Treffer für einen Namen existieren, oder künftig ein aus dem Browser-Accessibility-Baum gewonnener Kandidatenraum für Web-Klicks (YouTube, generische Webseiten).
- **Gemini bleibt zuständig für:** Sprachein-/ausgabe, freie Texteingabe/-generierung (Tippen, Suchbegriffe), und alles, was einen konkreten, nicht endlich aufzählbaren Wert braucht – insbesondere **Kalendereinträge** (Titel/Datum/Uhrzeit aus einer gesprochenen Anweisung erzeugen ist Textgenerierung, keine Auswahl aus Optionen).
- **Kein Ersatz für Vision:** Elemente ohne zugänglichen Namen (Icon-Buttons ohne Label, Video-Scrubber, Canvas-Oberflächen) bleiben auf Screenshot+Gemini/OpenAI angewiesen, da Jev nichts sieht, was nicht schon als Text vorliegt.
- App-Start (`launch_app`) betrifft das nicht – läuft laut Schritt 030 bereits ohne jeden Modellaufruf für bekannte Aufträge.

Das ist eine reine Architekturentscheidung, noch nicht umgesetzt. Kein Code geändert.

## Bestätigung: Fokus-Bug bereits behoben

Nutzer fragte, ob das früher gemeldete Verhalten "wenn NEXO etwas macht, geht [das Programm] immer in den Hintergrund" bereits gefixt ist. Bestätigt: Ja, in Schritt 028. Ursache war blindes ALT+TAB (wechselt nur zum jeweils nächsten Fenster, holt leicht das falsche nach vorne). Fix: neues Werkzeug `focus_window` (`SetForegroundWindow`+`ShowWindow` per Fenstertitel), und der Systemprompt in `agent.js` verlangt seither ausdrücklich `focus_window` statt ALT+TAB (siehe `agent.js` Zeile 15). Laut Schritt 028 serverseitig getestet, aber noch kein echter Test von `focus_window` auf echten Programmen (Projektregel: keine beiläufigen echten Desktop-Aktionen als Test) – das kann nur der Nutzer im echten Gebrauch endgültig bestätigen.

## Was jetzt ohne Jev ansteht (Entscheidung auf Nutzerwunsch von mir getroffen)

Zwei offene Vorhaben standen im Raum: Installer + netzwerkbasiertes Auto-Update, und eine Testumgebung für echte Desktop-/Mikrofon-Tests.

**Empfehlung: Testumgebung zuerst.** Mehrere Kernfunktionen (hörbare Wiedergabe, sichtbare Lippensynchronität, `focus_window`/`click_by_name` auf echten Programmen, Phase C der Live-API) sind laut STATUS.md noch nie im echten Benutzer-HUD abgenommen worden. Einen Installer für eine App zu bauen, die noch nicht Ende-zu-Ende bestätigt funktioniert, hieße etwas zu verpacken, dessen Inhalt noch nicht feststeht – jede Testumgebungs-Erkenntnis könnte den Installer-Bau ohnehin wieder anfassen (neue Abhängigkeiten, neue Startparameter). Installer/Auto-Update ist trotzdem sinnvoll, aber als zweiter Schritt danach.

## Fehlt noch

- TypeSafe-API-Zugang (Warteliste, kein Termin bekannt).
- Testumgebung für echte Desktop-/Mikrofon-/Hotkey-Tests.
- Installer mit netzwerkbasiertem Auto-Update und Windows-App-Icon (fester Programmstart statt Datei im Explorer suchen).
- Phase C des Live-API-Umbaus (Browser-Mikrofon-Dauerstream) bleibt laut Schritt 029/030 weiterhin der größte offene Hebel, unabhängig von Jev.

## Betroffene Dateien

Nur diese Planungsnotiz. Kein Code geändert.

## Nächster möglicher Schritt

Testumgebung aufsetzen (echte Desktop-/Mikrofon-Abnahme), danach Installer/Auto-Update-Konzept. Jev-Architektur bleibt vorgemerkt, bis TypeSafe wieder Signups öffnet.
