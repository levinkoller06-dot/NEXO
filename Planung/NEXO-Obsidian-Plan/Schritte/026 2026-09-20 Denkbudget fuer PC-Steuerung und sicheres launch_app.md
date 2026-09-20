# Schritt 026 – Denkbudget für PC-Steuerung und sicheres launch_app

Stand: 20.09.2026

Ausgangspunkt: [[025 2026-09-20 Bewegungs-Fix, Stimmklaerung und unsichtbare Maus]]

## Auftrag

Erster echter PC-Steuerungstest nach Schritt 025 zeigte drei Probleme: Der sichtbare Mauszeiger bewegt sich manchmal noch (erwartete Grenze von `pointer=background`, siehe unten), NEXO klickt zu Beginn eines Auftrags oft grundlos rechts, und `launch_app` öffnete mehrfach falsche, nicht angeforderte Programme (Outlook, Crosshair X statt Apple Music) statt des Gewünschten. Dazu kam ein Schrittlimit pro Auftrag, weil zu viele (falsche) Aktionen nötig waren.

## Root Cause

Schritt 024 hatte `thinkingConfig.thinkingBudget: 0` global für alle Gemini-Aufrufe gesetzt, um die Chat-Antwortzeit zu senken. Das gilt aber auch für die PC-Steuerungsschleife (`computer_action`/`launch_app`-Auswahl) – ohne jede Deliberation trifft das Modell dort schlechtere Entscheidungen (falsche Maustaste, unnötige Programme). Zusätzlich drückte `launch_app` blind ENTER, ohne das Suchergebnis vorher zu sehen: Windows-Suche matcht bei nicht installierten Apps (z.B. "Apple Music" existiert nicht nativ) fuzzy auf irgendetwas, und das wurde dann ungeprüft geöffnet.

## Änderungen

- `agent.js`: `thinkingConfig.thinkingBudget` ist jetzt `0` nur für reinen Chat (`controlEnabled=false`), aber `-1` (dynamisch, Modell entscheidet selbst wie viel Deliberation nötig ist) sobald PC-Steuerung aktiv ist. Chat bleibt schnell, PC-Aktionen werden überlegter.
- `launch_app` (nativ) drückt nicht mehr automatisch ENTER. Es öffnet die Windows-Suche und tippt den Suchbegriff, liefert dann wie gewohnt ein neues Bildschirmbild. Das Modell muss den obersten Treffer selbst visuell bestätigen (`computer_action key=ENTER`) oder bei falschem/unsicherem Treffer mit ESC abbrechen.
- Systemprompt ergänzt: nur tatsächlich verlangte Programme öffnen (kein "vorsichtshalber"), `button` standardmäßig `left`, `right` nur mit echtem Grund, `launch_app` pro Programm nur einmal versuchen statt mit wechselnden Suchbegriffen zu raten, Ziel in möglichst wenigen Schritten erreichen.

## Bekannte, nicht behebbare Grenze

`pointer=background` (Klicks per Fensternachricht) bewegt den sichtbaren Mauszeiger nicht – aber nicht jedes Programm reagiert darauf (siehe Schritt 025). Wenn eine Beobachtung keine Wirkung zeigt, wechselt das Modell bewusst zu `pointer=visible`, was den echten Cursor kurz sichtbar bewegt. Das ist eine Windows-Grenze, kein Bug; komplett unsichtbar für jedes Programm ist ohne Kernel-/Treiberebene nicht erreichbar.

## Prüfung und Grenzen

- 40 Regressionstests erfolgreich (1 neu: Denkbudget 0 vs. -1 je nach `controlEnabled`).
- Nativer Helfer mit `-CheckOnly` erfolgreich kompiliert.
- `thinkingBudget: -1` live gegen die echte Gemini-API getestet (200 OK, korrekte Antwort auf eine Testfrage).
- Kein echter Klicktest mit den neuen Prompt-Regeln auf echten Programmen (Projektregel: keine echten Desktop-Aktionen als beiläufige Tests). Ob Rechtsklick- und Fremd-App-Problem damit vollständig verschwinden, muss der Nutzer im echten Gebrauch prüfen.

## Nächster Testauftrag

NEXO neu starten, denselben Auftrag wie zuvor wiederholen (z.B. "öffne Firefox und Apple Music"), darauf achten: keine ungefragten Zusatzprogramme, kein grundloser Rechtsklick, `launch_app` bricht bei falschem Treffer sichtbar ab statt etwas Falsches zu öffnen.
