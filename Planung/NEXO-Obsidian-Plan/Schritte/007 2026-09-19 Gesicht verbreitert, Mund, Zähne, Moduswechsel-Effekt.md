# Schritt 007 – Gesicht verbreitert, Mund/Zähne, Ohren und Moduswechsel-Effekt

Datum: 19.09.2026 · Art: Umsetzung

## Auftrag
Der Nutzer fand Schritt 006 noch nicht ausreichend und gab konkretes Feedback:
1. Die Gesichtsform ist zu schmal und sieht insgesamt noch nicht gut aus.
2. Die Sprechanimation öffnet den ganzen Kiefer statt einer kleinen, mundförmigen Öffnung; dabei sollen auch Zähne sichtbar werden.
3. Beim Wechsel des Betriebsmodus (Bereit/Fokus/Energie) sollen die Partikel auseinanderstieben, bis kein Gesicht mehr erkennbar ist, und dann in der neuen Modusfarbe wieder zu einem Gesicht zusammenfinden.
4. Die Ohren sind zu einfach/rund und sollen besser aussehen.

## Änderungen
- `Code/App/head.js`:
  - Kontur (Gesichtsbreite von vorne) um rund 15 % verbreitert, Tiefenprofil leicht mit erhöht, damit die Proportionen zur breiteren Silhouette passen.
  - Augen-, Braue-, Wangenknochen- und Kieferwinkel-Positionen proportional nach außen verschoben.
  - Die „Lippen"-Markierung (Punkte, die sich beim Sprechen bewegen) ist jetzt auf einen schmalen Bereich um die Mundmitte begrenzt (`Math.abs(x) < .30`) statt den gesamten Kieferbereich in dieser Höhe einzuschließen.
  - Neue Punktgruppe für Zähne: zwei schmale, helle Punktreihen entlang der Mundlinie, die im Ruhezustand unauffällig sind und erst beim Öffnen des Mundes (Sprechanimation) sichtbar werden.
  - Ohren komplett neu aufgebaut: C-förmige äußere Helix mit Öffnung zum Gesicht hin, innere Antihelix-Falte, flache Concha-Mulde und ein rundliches Ohrläppchen, statt eines einfachen flachen ovalen Rings.
  - Jeder Punkt erhält einen zufälligen Explosionsvektor (`ex, ey, ez`), der nur für die neue Moduswechsel-Animation genutzt wird und die Ruheform nicht beeinflusst.
- `Code/App/app.js`:
  - Klick auf einen Betriebsmodus-Knopf löst jetzt eine Explosions-/Wiederzusammensetzungs-Animation aus (rund 900 ms): Die Partikel bewegen sich nach außen, bis das Gesicht nicht mehr erkennbar ist, der Modus (Farbe, Label, Aktivitätslog, ausgewählter Knopf) wechselt exakt im Umkehrpunkt, danach setzen sich die Partikel in der neuen Farbe wieder zum Gesicht zusammen. Ein neuer Klick wird ignoriert, solange eine Animation läuft.
  - Zähne-Punkte werden mit eigener, an die Mundöffnung gekoppelter Sichtbarkeit gerendert (unsichtbar bei geschlossenem Mund, sichtbar mit zunehmender Mundöffnung).
  - Sicherheitsbegrenzung der Tiefenkoordinate ergänzt, damit die Explosionsanimation nicht in die Perspektivrechnung hinein singulär werden kann.

## Was NEXO jetzt kann
Der HUD zeigt einen breiteren, prozedural erzeugten Kopf mit deutlicheren Ohren. Die stumme Sprechanimation öffnet nur einen mundgroßen Bereich und zeigt dabei zwei angedeutete Zahnreihen. Der Wechsel zwischen Bereit/Fokus/Energie läuft als Auflösen-und-Neuformieren-Effekt statt als sofortiger Farbwechsel.

## Was noch fehlt
Weiterhin keine KI, Sprache, Cloud-Verbindung, PC-Steuerung, Kalenderanbindung, Handy-App, Push-Nachrichten oder Telefonie. Die Gesichtsform ist weiterhin eine grobe prozedurale Annäherung und laut Nutzer noch nicht endgültig; weiteres Feedback wird erwartet.

## Prüfung
- `node --check Code/App/head.js` und `node --check Code/App/app.js` erfolgreich.
- Punktzahl in Node nachgerechnet: 51.965 Punkte (davon 260 Zahn-Punkte, 2.177 als „Lippen" markiert).
- Per lokalem Testserver im Browser geprüft: breitere Front- und Dreiviertelansicht, Ohrenform, Mundöffnung mit sichtbaren Zähnen während der Sprechanimation, sowie ein über die Konsole erzwungener Zwischenstand der Moduswechsel-Animation (Partikel vollständig aufgelöst, Farbe bereits gewechselt) und der anschließende Wiederzusammenschluss.
- Kein automatisierter Test der Animationstiming-Werte (900 ms) unter realer Mausbedienung ohne Konsoleneingriffe.

## Betroffene Dateien
- `Code/App/head.js`
- `Code/App/app.js`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Weiteres Nutzer-Feedback zur Gesichtsform und den neuen Animationen abwarten und gezielt nachjustieren.
