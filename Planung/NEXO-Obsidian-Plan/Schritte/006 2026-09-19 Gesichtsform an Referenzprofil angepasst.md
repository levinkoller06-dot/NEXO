# Schritt 006 – Gesichtsform an Referenzprofil angepasst

Datum: 19.09.2026 · Art: Umsetzung

## Auftrag
Der Nutzer fand die bestehende Kopfform trotz Schritt 005 weiterhin unnatürlich und wollte sie so gut wie möglich an zwei mitgeschickte Referenzfotos annähern (Seitenprofil und Dreiviertelansicht einer Person mit kurzem Fade-Haarschnitt, kantigem Kiefer und gerader Nase).

## Änderungen
- Punktgeometrie in `Code/App/head.js` erneut überarbeitet:
  - Die feste Tiefen-Grundform (vorher ein für jede Kopfhöhe gleich starker Rundungswert) ist durch ein höhenabhängiges Tiefenprofil ersetzt. Stirn und Wangen sind dadurch flacher/aufrechter, Nase und Kinn stehen als eigene, klar erkennbare Punkte hervor statt in einer durchgehenden Schräge ("Osterinsel-Kopf") zu verschwimmen.
  - Die Konturbreite (Kieferlinie von vorne) bleibt länger voll und verjüngt sich erst spät zu einem breiteren, flacheren Kinn statt zu einer spitzen Träne.
  - Augenbrauenkante, Kieferwinkel und Kinnvolumen leicht verstärkt für einen kantigeren, männlicheren Ausdruck; Nasenspitze etwas zurückgenommen, damit sie nicht überzeichnet wirkt.
  - Keine Referenzbilder in Repository oder App eingebettet; nur Proportionswerte im Code angepasst.
- Temporär ein lokaler statischer Testserver (`.claude/launch.json` + `.claude/static-server.js`) angelegt, um die Änderung im echten Browser-Rendering zu prüfen, und nach der Prüfung wieder entfernt.

## Was NEXO jetzt kann
Der HUD zeigt weiterhin denselben prozedural erzeugten, dem Mauszeiger folgenden Partikelkopf mit Blinzeln, stummer Sprechanimation und drei Farbmodi. Die Kopfform wirkt im Seitenprofil deutlich aufrechter und im Vorderansicht kantiger/männlicher als zuvor.

## Was noch fehlt
Die App hat weiterhin keine KI, Sprache, Cloud-Verbindung, PC-Steuerung, Kalenderanbindung, Handy-App, Push-Nachrichten oder Telefonie. Die Kopfform ist eine grobe prozedurale Annäherung, kein fotogenaues Abbild der Referenzperson.

## Prüfung
- `node --check Code/App/head.js` und `node --check Code/App/app.js` erfolgreich.
- Punktzahl erneut in Node nachgerechnet: 51.428 Punkte (vorher 51.441).
- Rendering per lokalem Testserver im Browser aus Front-, Dreiviertel- und erzwungener Seitenansicht (starke Kopfdrehung über Konsolenwerte) geprüft und iterativ verglichen, bis Stirn, Nase, Kiefer und Kinn stimmig wirkten.
- Kein Vergleich mit einem echten 3D-Scan; die Anpassung beruht auf visueller Einschätzung, nicht auf exakter Vermessung der Referenzfotos.

## Betroffene Dateien
- `Code/App/head.js`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Weitere Feinjustierung nur nach konkretem Nutzer-Feedback zum neuen Aussehen, oder nach Auftrag Beginn des Cloud-Cores.
