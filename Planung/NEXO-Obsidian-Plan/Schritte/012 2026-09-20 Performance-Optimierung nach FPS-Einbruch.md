# Schritt 012 – Performance-Optimierung nach FPS-Einbruch

Datum: 20.09.2026 · Art: Umsetzung (Fehlerkorrektur)

## Auftrag
Nutzer hat Schritt 011 (146.220 Punkte) selbst getestet und meldete: nur noch rund 15 FPS, spürbares Ruckeln. Frage, ob sich das verbessern lässt.

## Ursache
Drei Faktoren verteuerten das Zeichnen jedes einzelnen Frames:
1. Jeder der 146.220 Punkte wurde als echter Kreisbogen (`ctx.arc`) gezeichnet. Kreisbögen sind für den Browser deutlich teurer zu rastern als einfache Rechtecke, weil intern eine Kurven-Näherung berechnet werden muss.
2. Die Canvas-Auflösung folgte der vollen Gerätepixeldichte bis zum Faktor 1,6 – auf hochauflösenden Bildschirmen bedeutet das deutlich mehr zu zeichnende Bildpunkte pro Partikel.
3. Eine `Math.pow`-Berechnung pro Punkt und Frame (unnötig, da der Exponent immer 3 ist).

## Änderungen
- `Code/App/app.js`:
  - Partikel werden jetzt als kleine Rechtecke statt als Kreisbögen gezeichnet (`ctx.rect` statt `ctx.moveTo`+`ctx.arc`). Bei der tatsächlichen Punktgröße (wenige Bildpunkte) optisch praktisch nicht unterscheidbar.
  - Deckel für die Canvas-Pixeldichte von 1,6 auf 1,3 gesenkt (rund ein Drittel weniger zu zeichnende Bildpunkte auf hochauflösenden Bildschirmen).
  - `Math.pow(1-nz,3)` durch eine einfache dreifache Multiplikation ersetzt.
- `Code/App/head.js`: Punktzahl von rund 146.220 auf rund 99.220 zurückgenommen (Hauptoberfläche 140.000→95.000, Augen 2.200→1.500, Mund-Patch 3.600→2.400, Zähne 420→320) – weiterhin deutlich mehr als vor Schritt 011 (ca. 65.000), aber nicht mehr das gut Doppelte.

## Was NEXO jetzt kann
Die Rechenlast pro Frame sollte spürbar sinken (weniger Punkte, günstigere Zeichenoperation, weniger Bildpunkte insgesamt), ohne die mit Schritt 011 gewonnene höhere Dichte komplett zu verlieren.

## Was noch fehlt / offene Risiken
- Die tatsächliche Bildrate wurde in dieser Sitzung nicht gemessen (weiterhin kein Browser-Test, siehe Schritt 010/011). Ob 15 FPS damit ausreichend behoben sind, kann nur der Nutzer selbst in der echten App feststellen.
- Falls die Bildrate weiterhin nicht reicht: weitere, gezielte Punktzahl-Reduktion, oder ein grundlegend anderer Rendering-Ansatz (z. B. direktes Schreiben in einen Pixel-Puffer statt vieler einzelner Canvas-Formen) als nächster Schritt.

## Prüfung
- `node --check Code/App/head.js` und `node --check Code/App/app.js` erfolgreich.
- Punktzahl in Node nachgerechnet: 99.220 Punkte gesamt.
- Kein Browser-/FPS-Test in dieser Sitzung.

## Betroffene Dateien
- `Code/App/app.js`
- `Code/App/head.js`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Nutzer testet die Bildrate erneut in der echten App. Bei weiterhin unzureichender Performance: gezielt nachjustieren statt auf den alten, formelbasierten Kopf zurückzugehen.
