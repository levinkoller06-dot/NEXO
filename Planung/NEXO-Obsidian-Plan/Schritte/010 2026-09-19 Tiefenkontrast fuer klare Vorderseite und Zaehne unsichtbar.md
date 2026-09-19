# Schritt 010 – Tiefenkontrast für klare Vorderseite, Zähne bei geschlossenem Mund unsichtbar

Datum: 19.09.2026 · Art: Umsetzung

## Auftrag
Nutzer-Feedback nach Schritt 009 (Bugfix-Anfrage, ohne Browser-Testserver, da dieser nur Tokens verbraucht):
1. Zähne blitzen bei geschlossenem Mund weiterhin sichtbar durch.
2. Aus direkter Frontalansicht ist die Nase kaum erkennbar; generell ist unklar, was vorne (Gesicht) und was hinten (Hinterkopf) ist – auch bei den Augen. Wunsch nach mehr Punkten oder klarerer Gestaltung.
3. Ausdrücklicher Wunsch, den Kopf mit diesem Auftrag abzuschließen; genug Zeit nehmen.

## Ursache
- Zähne: Der Renderer gruppiert Punkte nach Alpha-Wert in 8 "Buckets" und zeichnet jeden Bucket mit einer festen Deckkraft. Bucket 0 (für Alpha nahe 0) wurde trotzdem mit 12,5 % Deckkraft gezeichnet statt komplett übersprungen zu werden – dadurch blieben die Zähne bei geschlossenem Mund schwach sichtbar.
- Vorderseite unklar: Die bisherige Beleuchtung war reine Lambert-Schattierung (abhängig von der Oberflächen-Ausrichtung zum Licht). Aus direkter Frontalansicht haben Nase, Wangen und Stirn eine sehr ähnliche Ausrichtung zur Kamera, wodurch reine Schattierung sie kaum unterscheidbar macht – ein grundsätzliches Problem, keine Frage der Punktzahl allein.

## Änderungen
- `Code/App/app.js`:
  - Zahn-Punkte werden bei nahezu geschlossenem Mund komplett übersprungen (`continue`) statt mit Rest-Deckkraft gezeichnet.
  - Tiefenbasierter Helligkeits-Boost ergänzt: Punkte, deren Position (nicht nur deren Oberflächen-Ausrichtung) näher zur Kamera liegt als ein Schwellenwert, leuchten zusätzlich auf; der Schwellenwert wurde anhand der tatsächlichen Tiefenverteilung der Kopfpunkte bestimmt (oberste rund 20–25 % = Nase, Kinn, Lippen, Augäpfel). Dieselben Punkte bekommen zusätzlich einen leicht größeren Radius, damit der Effekt auch bei wenigen Punkten (z. B. an einer spitzen Nasenkuppe) sichtbar bleibt.
  - Augen nutzen denselben Tiefen-Boost statt einer festen Deckkraft, damit sie als nach vorne gewölbt erkennbar sind statt als flacher, richtungsloser Fleck.
- `Code/App/head.js`:
  - Der Mund-Patch aus Schritt 008 hatte eine feste, immer gleich ausgerichtete Normale und wirkte dadurch als unnatürlich flaches, gleichmäßig helles Rechteck. Er berechnet seine Normale jetzt wie der frühere Formel-Kopf über eine kleine numerische Ableitung seiner eigenen Höhenformel, wodurch er sich in die Schattierung der echten Mesh-Oberfläche einfügt.
  - Punktzahl der Hauptoberfläche von 48.500 auf 62.000 erhöht (Gesamtzahl jetzt rund 64.760) für mehr Dichte, wie vom Nutzer gewünscht.

## Was NEXO jetzt kann
Aus direkter Frontalansicht ist die Nase als klar hellerer Bereich erkennbar, ebenso Kinn, Lippen und die vorgewölbten Augäpfel gegenüber den zurückliegenden Augenhöhlen. Zähne sind bei geschlossenem Mund vollständig unsichtbar und erscheinen nur während der Sprechanimation.

## Prüfung
- `node --check Code/App/head.js` und `node --check Code/App/app.js` erfolgreich.
- **Auf ausdrücklichen Wunsch des Nutzers diesmal ohne lokalen Testserver/Browser-Vorschau geprüft.** Stattdessen: ein eigenes Node-Skript bildet die exakte Beleuchtungs-, Tiefen-Boost- und Bucket-Zeichenformel aus `app.js` nach und rendert das Ergebnis als PNG (`zlib`-basierter Eigenbau-PNG-Encoder, keine neue Abhängigkeit). Mehrere Boost-Formeln (linear, Potenzkurve, mit/ohne Radius-Skalierung) anhand der tatsächlichen Tiefenverteilung der Punktwolke (Perzentile berechnet) verglichen, bis Nase/Kinn/Lippen aus der Frontalansicht eindeutig aufleuchteten, ohne das restliche Gesicht zu überbelichten.
- Kein Test im echten Browser-Canvas in dieser Sitzung – der Nutzer prüft direkt in der laufenden App.

## Betroffene Dateien
- `Code/App/app.js`
- `Code/App/head.js`
- `Code/STATUS.md`

## Nächster möglicher Schritt
Rückmeldung des Nutzers zum Ergebnis in der echten App abwarten. Der Nutzer möchte das Thema Kopfform/-darstellung mit diesem Schritt abschließen; bei Bedarf gezielte Nachjustierung der Boost-Stärke.
