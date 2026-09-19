# Schritt 008 – Kopfform durch echtes 3D-Modell ersetzt

Datum: 19.09.2026 · Art: Umsetzung

## Auftrag
Der Nutzer war mit der Gesichtsform aus Schritt 007 weiterhin nicht zufrieden ("gefällt das Gesicht halt noch nicht") und fragte nach Canva zur Design-Verbesserung. Nach Abwägung (Canva erzeugt keine 3D-Partikelgeometrie, nur flache Grafiken) wurden zwei Alternativen vorgeschlagen: (A) die bestehende Formel nach klassischen Gesichtsproportionen sauberer nachbauen, oder (B) ein echtes, frei lizenziertes 3D-Kopfmodell verwenden und dessen tatsächliche Oberfläche abtasten. Der Nutzer wählte **B**.

## Änderungen
- Nutzer hat "Male Head" von Alexander Antipov (Sketchfab, Lizenz CC BY 4.0) selbst heruntergeladen (Login bei Sketchfab war nötig, das darf die KI nicht selbst übernehmen) und als `male_head.obj` bereitgestellt.
- Ein OBJ-Parser und ein Koordinaten-Umrechnungsschritt wurden offline in Node geschrieben (nicht Teil der App):
  - Achsen des Quellmodells bestimmt (X=links/rechts, Z=oben/unten, Y=Tiefe mit Nase Richtung negativ) durch Rendern eigener Debug-Bilder, da reine Zahlenanalyse zu widersprüchlichen Ergebnissen führte.
  - Hals und Schultern anhand der Kiefer-Breitenkurve abgeschnitten (Schnitt bei der schmalsten Stelle des Kiefers).
  - Koordinaten in das App-eigene System umgerechnet und einheitlich skaliert (keine verzerrende Achsen-Streckung), Augen-Gruppen (`rightEye`/`leftEye`) aus dem Modell übernommen.
  - Ergebnis als kompakte Rohdaten (Eckpunkte + Dreiecke, ohne Normalen) in `Code/App/head-mesh-data.js` gespeichert (~1,1 MB).
- `Code/App/head.js` komplett neu geschrieben: statt der bisherigen Gaussian-Formel-Geometrie werden jetzt zur Laufzeit ca. 48.500 Punkte flächengewichtet von der echten Kopfoberfläche abgetastet (Dreiecksnormalen werden dabei direkt berechnet, keine gespeicherten Vertex-Normalen nötig).
  - Augen: nur ein mandelförmiger Ausschnitt der echten Augapfel-Geometrie wird verwendet (das Modell hat keine Lider, die die volle Kugel abdecken würden); ohne diese Maskierung wirkten die Augen wie große runde Kugeln.
  - Mund: an einer Stelle zeigten die echten Flächen-Normalen des Quellmodells vom Betrachter weg (vermutlich eine Mundhöhlen-Öffnung im Sculpt), wodurch dort eine sichtbare Lücke im Renderer entstand. Ein zusätzlicher, immer nach vorne zeigender "Mund-Patch" schließt diese Lücke im Ruhezustand.
  - Zähne, Lippen-Öffnungslogik (aus Schritt 007) und die Explosionsvektoren für den Moduswechsel-Effekt wurden auf die neuen Punkte übertragen.
  - Eigene Ohren-Geometrie aus Schritt 007 entfernt, da das echte Modell bereits Ohren enthält.
- `Code/App/app.js`: Augen-Blinzel-Zentrum und Mund-Trennlinie an die tatsächliche Position im neuen Modell angepasst (vorher an die alte Formel-Geometrie angelehnte Schätzwerte).
- `Code/App/index.html`: lädt `head-mesh-data.js` vor `head.js`.
- Attribution ergänzt in `Code/App/README.md` (Modellname, Autor, Lizenz, Link). Originaldatei liegt zur Nachvollziehbarkeit unter `Code/App/reference/male_head.obj`, wird von der App nicht geladen.

## Was NEXO jetzt kann
Der HUD zeigt einen Partikelkopf, dessen Form von einer echten, gescannten/gesculpteten menschlichen Kopfgeometrie stammt statt von einer Formel-Annäherung. Stirn, Augenpartie, Nase, Ohren, Kieferlinie und Kinn wirken im Front- und Seitenprofil deutlich anatomisch stimmiger. Sprechanimation mit Zähnen, Blinzeln und der Explosions-/Moduswechsel-Effekt funktionieren unverändert auf der neuen Geometrie.

## Was noch fehlt
Weiterhin keine KI, Sprache, Cloud-Verbindung, PC-Steuerung, Kalenderanbindung, Handy-App, Push-Nachrichten oder Telefonie. Das neue Kopfmodell ist nicht identisch mit einer bestimmten realen Person, sondern ein generischer männlicher Basemesh-Kopf. Die App weicht damit erstmals von der bisherigen Regel "keine externen Referenzen einbetten" ab – bewusst, mit Namensnennung gemäß CC-BY-Lizenz.

## Prüfung
- `node --check Code/App/head.js`, `node --check Code/App/app.js`, `node --check Code/App/head-mesh-data.js` erfolgreich.
- Punktzahl in Node nachgerechnet: ca. 51.260 Punkte gesamt.
- Achsen-Zuordnung des Quellmodells durch selbst gerenderte Debug-Bilder visuell verifiziert (nicht nur aus Zahlen abgeleitet, da erste Annahmen falsch lagen).
- Per lokalem Testserver im Browser geprüft: Front-, Dreiviertel- und Seitenansicht, Sprechanimation mit sichtbaren Zähnen, Moduswechsel-Explosionseffekt. Zwei dabei gefundene mesh-spezifische Probleme (volle Kugelaugen, Lücke am Mund) wurden identifiziert und behoben.
- Kein Vergleich mit einem zweiten, unabhängigen 3D-Modell; keine automatisierte Prüfung der Dreieckssamplung auf Gleichverteilung über sehr viele Wiederholungen.

## Betroffene Dateien
- `Code/App/head.js` (komplett neu)
- `Code/App/head-mesh-data.js` (neu)
- `Code/App/app.js`
- `Code/App/index.html`
- `Code/App/README.md`
- `Code/App/reference/male_head.obj` (neu, nur Referenz)
- `Code/STATUS.md`

## Nächster möglicher Schritt
Weiteres Nutzer-Feedback zur neuen, mesh-basierten Kopfform abwarten (Nutzer sagte, danach folgen neue Pläne).
