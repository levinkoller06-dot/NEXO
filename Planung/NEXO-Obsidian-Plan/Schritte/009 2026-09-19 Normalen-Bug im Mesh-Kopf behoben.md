# Schritt 009 – Normalen-Bug im Mesh-Kopf behoben

Datum: 19.09.2026 · Art: Umsetzung (Fehlerkorrektur)

## Auftrag
Nutzer meldete nach Schritt 008: "ich glaube das Gesicht ist verkehrt herum" – im HUD war statt eines erkennbaren Gesichts nur eine große, formlose Fläche unterhalb der Augen sichtbar, keine Nase, kein Kiefer erkennbar.

## Ursache
Die Achsen-Umrechnung von der Originaldatei ins App-Koordinatensystem (Schritt 008) spiegelt das Koordinatensystem (negative Determinante). Dadurch zeigten alle aus der echten Mesh-Geometrie berechneten Flächen-Normalen systematisch nach innen statt nach außen – z. B. hatte die Nasenspitze eine Normale mit nz=-0,98 (vom Betrachter weg) statt der erwarteten nz=+0,98. Der Renderer blendet Punkte mit vom Betrachter wegzeigender Normale aus, wodurch fast die gesamte reale Gesichtsoberfläche verschwand und nur die fest codierten Zusatzteile (Augen, Mund-Patch aus Schritt 008) sichtbar blieben.

## Änderungen
- `Code/App/head.js`: Die in `sampleTriangle()` berechnete Dreiecks-Normale wird jetzt negiert, um die gespiegelte Händigkeit der Koordinatenumrechnung auszugleichen.

## Was NEXO jetzt kann
Der Partikelkopf zeigt Nase, Mund, Kieferlinie und Kinn wieder korrekt zum Betrachter hin; im Front-, Dreiviertel- und Seitenprofil sind alle Gesichtszüge sichtbar und anatomisch stimmig.

## Prüfung
- Testdreieck an der Nasenspitze direkt nachgerechnet: Normale vorher nz=-0,98, nachher nz=+0,98.
- `node --check Code/App/head.js` erfolgreich.
- Per lokalem Testserver im Browser in Front-, Dreiviertel- und Seitenansicht geprüft: Nase, Mund, Kiefer und Ohr sind jetzt durchgehend sichtbar.

## Betroffene Dateien
- `Code/App/head.js`

## Nächster möglicher Schritt
Weiteres Nutzer-Feedback zur korrigierten Kopfform abwarten.
