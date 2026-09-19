# Schritt 011 – Viel mehr Punkte und ovale Mundöffnung

Datum: 19.09.2026 · Art: Umsetzung

## Auftrag
Nutzer-Feedback nach Schritt 010: Der Effekt "als wäre es auf der anderen Seite" (Front/Rückseite unklar) besteht weiterhin; Wunsch nach deutlich mehr Punkten, um es klarer zu machen. Zusätzlich: Die Mundöffnung beim Sprechen wirkt wie ein aufklappendes Quadrat, nicht wie ein Mund. Nutzer war ausdrücklich bereit, den Schritt bei Misserfolg zurückzubauen, und wollte, dass sich genug Zeit genommen wird.

## Änderungen
- `Code/App/head.js`:
  - Punktzahl der Hauptoberfläche von 62.000 auf 140.000 erhöht, Augenpunkte von 900 auf 2.200, Mund-Patch von 1.600 auf 3.600, Zahnpunkte von 260 auf 420. Gesamtzahl jetzt ca. 146.220 (vorher ca. 64.760).
  - Die bisherige rechteckige Auswahlfläche für "Lippen"-Punkte (harte Kanten bei festen x/y-Grenzen) durch eine ovale, weich auslaufende Gewichtsfunktion ersetzt (`mouthWeight`): Punkte in der Mitte des Mundes bewegen sich beim Sprechen am stärksten, zum Rand der Ellipse hin immer weniger, statt dass eine rechteckige Fläche als Ganzes aufklappt.
  - Die beiden Zahnreihen waren bisher perfekt gerade horizontale Linien, was zusammen mit der rechteckigen Öffnung den "Quadrat"-Eindruck verstärkte. Sie folgen jetzt einer leichten Bogenform (angelehnt an einen echten Zahnbogen), inklusive leichtem Zurückweichen an den Mundwinkeln.
- `Code/App/app.js`: Die Mund-Verschiebung nutzt jetzt den neuen, kontinuierlichen Gewichtswert statt eines reinen Ein/Aus-Flags, dadurch der weiche Rand.

## Was NEXO jetzt kann
Der Partikelkopf ist deutlich dichter (rund 146.000 statt rund 65.000 Punkte). Die Sprechanimation öffnet eine ovale, an den Rändern weich auslaufende Mundform mit einem gebogenen Zahnbogen statt eines rechteckigen Lochs.

## Was noch fehlt / offene Risiken
- Die reale Bildrate mit 146.220 Punkten wurde in dieser Sitzung nicht gemessen (kein Browser-Test, siehe unten). Falls die Animation im echten Browser spürbar ruckelt, hat der Nutzer selbst vorgeschlagen, die Punktzahl zurückzubauen.
- Ob die zusätzlichen Punkte den ursprünglich gemeldeten "Vorderseite unklar"-Eindruck tatsächlich beheben, ist nicht durch eigene Beobachtung bestätigt, da diesmal ausdrücklich ohne Browser-Vorschau gearbeitet wurde.

## Prüfung
- `node --check Code/App/head.js` und `node --check Code/App/app.js` erfolgreich.
- Punktzahl in Node nachgerechnet: 146.220 Punkte gesamt.
- Auf Wunsch des Nutzers weiterhin ohne lokalen Testserver/Browser-Vorschau geprüft. Stattdessen erneut mit dem Node-Skript aus Schritt 010 (bildet die App-Formel nach) verifiziert, dass die Mundöffnung jetzt oval statt rechteckig aussieht und der Zahnbogen gekrümmt ist. Rendering von 146.220 Punkten in Node dauerte ca. 50 ms pro Ansicht (reine Rechenzeit ohne Canvas-Overhead) – kein verlässlicher Hinweis auf die echte Browser-Bildrate, nur ein grober Anhaltspunkt, dass die Grundrechnung nicht exzessiv teuer ist.
- Kein Test im echten Browser-Canvas; keine FPS-Messung.

## Betroffene Dateien
- `Code/App/head.js`
- `Code/App/app.js`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Nutzer testet in der echten App: Bildrate mit den vielen zusätzlichen Punkten, ob die Frontalansicht jetzt eindeutiger wirkt, ob die Mundöffnung jetzt wie ein Mund aussieht. Bei Performance-Problemen: Punktzahl gezielt zurückfahren statt komplett zurückzusetzen.
